// Progressive views, cache, grid, weather, labels, drawing, zoom
// ================= Progressive views, a cache, and the grid of all views =================
// A view appears at once from its grid thumbnail or a quarter-resolution pass, then sharpens: a full-resolution pass, then up to four
// jittered passes averaged for anti-aliasing. Every pass is cut into horizontal strips sized from a measured cost, so each frame asks the
// GPU for about STRIP_MS of work: the page stays responsive while a slow phone draws, and no single draw call runs long enough for the
// browser to reset the GPU (iOS does this to calls lasting a few seconds, which left the view stuck on "Drawing…").
const viewCache = new Map(), gridThumbs = new Map();
const STRIP_MS = 40, VIEW_CACHE_MAX = matchMedia("(pointer: coarse)").matches ? 8 : 40;   // finished views kept for going back: few on phones, each is megabytes
const viewKey = (o = {}) => { const z = o.zoom ?? zoom; return [cur.id, si, o.vp ?? vp, z, o.yaw ?? yaw, dial, earthEye ? 1 : 0, life, tod ?? "-", W].join("|"); };
function show(scale) { const w = glc.width * scale, h = glc.height * scale; ctx2.imageSmoothingEnabled = true; ctx2.imageSmoothingQuality = "high"; ctx2.drawImage(glc, 0, glc.height - h, w, h, 0, 0, W, H);
  if (scene && scene.fauna && !thumbing) { const a = ctx2.globalAlpha; ctx2.globalAlpha = 1; drawFauna(ctx2, scene); ctx2.globalAlpha = a; } }   // animals are drawn over each pass, crisp
let viewJob = 0, viewDone = true;
const AA = [[0.5, 0.25], [-0.25, 0.5], [-0.5, -0.25], [0.25, -0.5]];
const px1 = new Uint8Array(4);
function renderView() {
  const id = ++viewJob, s = scene, key = viewKey(), T = performance.now();
  viewDone = false;
  const hit = viewCache.get(key);
  if (hit) { ctx2.drawImage(hit, 0, 0, W, H); viewDone = true; if ($("busyNote")) $("busyNote").hidden = true; renderGrid(); return; }
  const note = $("busyNote"); if (note) { note.textContent = "Drawing…"; note.hidden = false; }   // until the picture is sharp, say it is still being drawn
  const th = gridThumbs.get(key);
  if (th) { ctx2.imageSmoothingQuality = "high"; ctx2.drawImage(th, 0, 0, W, H); }
  const steps = [];
  // the quarter-resolution image shows what a full frame will cost (reading one pixel waits for the GPU, so the time is real): heavy scenes
  // then render at 70–80% and get fewer smoothing passes. Where the quarter image cannot tell (a thumbnail was shown instead, or the
  // program's first draw also paid for set-up), a half-resolution image measures it instead
  let est = 0, rs = 1;
  // phones and slow GPUs: never render more pixels than the screen shows (a 390-pixel-wide phone at 3× shows about 1,170), and step the
  // resolution down further on slow devices so a view still sharpens in well under a second
  const setRs = () => { const shown = c2.getBoundingClientRect().width * (window.devicePixelRatio || 1), cap = shown > 0 && shown < W * 0.6 ? Math.max(0.5, Math.min(1, shown * 1.3 / W)) : 1;   // only small phone screens; elsewhere rendering below the canvas size blurs it
    rs = Math.min(cap, est > 2500 ? 0.4 : est > 1500 ? 0.5 : est > 800 ? 0.7 : est > 400 ? 0.8 : est > 200 ? 0.9 : 1); };
  // the cost probe is a quarter-resolution image (a sixteenth of the pixels). A program's first draw also pays for driver set-up, so that
  // draw is not timed: the probe simply runs again
  const probe = () => { probeMs = 0; const t0 = performance.now(), ok = drawGL(T, [0, 0], 0.25, null, s); if (!ok) return false;
    if (!progWarm) return "again"; gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px1); est = (performance.now() - t0 - probeMs) * 10; setRs(); if (!th) show(0.25); return true; };
  steps.push(probe);
  // one pass (plain or jittered) as a run of strips; returns "again" until its last strip is drawn, then copies the result
  const pass = (jit, onDone) => { let k = 0, n = 0; return () => {
    if (!n) n = Math.max(1, Math.min(32, Math.ceil(est * rs * rs / STRIP_MS)));
    if (!drawGL(T, jit, rs, n > 1 ? [k, n] : null, s)) return false;
    gl.flush(); if (++k < n) return "again"; onDone(); return true; }; };
  steps.push(pass([0, 0], () => show(rs)));
  // smoothing passes are averaged on the 2D canvas, not by GL blending: switching blending on makes some GPU drivers (ANGLE on Metal) build a
  // second pipeline for the program, which for the larger shaders stalled the first smoothing pass for 20 s or more
  AA.forEach((j, k) => { const p = pass(j, () => { ctx2.globalAlpha = 1 / (k + 2); show(rs); ctx2.globalAlpha = 1; });
    steps.push(() => k >= (est * rs * rs > 110 ? 1 : est * rs * rs > 55 ? 2 : 4) ? true : p()); });
  let i = 0, waited = false;
  const run = () => {
    if (id !== viewJob || !glOK) return;
    const r = steps[i]();
    if (r === true) i++;
    else if (r === false && !waited && !th) { waited = true; ctx2.fillStyle = "#000"; ctx2.fillRect(0, 0, W, H); ctx2.fillStyle = "#8a8a94"; ctx2.font = "22px IBM Plex Sans, sans-serif"; ctx2.fillText("Preparing this kind of world: the first time takes a few seconds…", 40, H - 40); }
    if (i < steps.length) { requestAnimationFrame(run); return; }
    const c = document.createElement("canvas"), cw = Math.round(glc.width * rs), ch = Math.round(glc.height * rs); c.width = cw; c.height = ch; const cx = c.getContext("2d"); cx.imageSmoothingQuality = "high"; cx.drawImage(c2, 0, 0, W, H, 0, 0, cw, ch);   // the averaged image lives on the 2D canvas
    viewCache.set(key, c); if (viewCache.size > VIEW_CACHE_MAX) viewCache.delete(viewCache.keys().next().value);
    viewDone = true; if (note) note.hidden = true; renderGrid();
    if (s.faunaPending && !s.fauna) placeFaunaSoon(s, id, key);
    if (s.bioFailed && note) { note.textContent = "This device could not draw the imagined life, so the world is shown without it."; note.hidden = false;
      setTimeout(() => { if (viewDone) note.hidden = true; note.textContent = "Drawing…"; }, 6000); }
  };
  requestAnimationFrame(run);
}
// Animals and painted plants: placeFauna asks the shader's probe about ~1,700 spots around you. Its random numbers do not depend on the
// answers until it has asked all of them, so a dry run first records exactly which spots it will ask about; those are answered a few GPU
// batches per frame, so the page stays responsive; then placeFauna runs again on the recorded answers, giving the same placement as before.
// The finished view is shown without them meanwhile, and they are painted on (and the cached view updated) when ready.
function placeFaunaSoon(s, id, key) {
  const calls = []; try { placeFauna(s, (pts, top = 1) => { calls.push({ pts, top }); return pts.map(() => ({ h: 0, slope: 0, seen: false, eco: 0 })); }); } catch (e) { return; }
  const ans = calls.map(() => []), CH = AN_MAX * 4, note = $("busyNote"); let ci = 0, pi = 0;
  if (note) { note.textContent = "Adding life…"; note.hidden = false; }
  const step = () => {
    if (id !== viewJob || scene !== s || !glOK) { if (note && id !== viewJob) note.textContent = "Drawing…"; return; }
    const ok = drawGL(4000, [0, 0], 1, null, s, pg => { const c = calls[ci]; ans[ci].push(...pg(c.pts.slice(pi, pi + CH), c.top)); pi += CH; if (pi >= c.pts.length) { ci++; pi = 0; } });
    if (ok && ci < calls.length) { requestAnimationFrame(step); return; }
    if (!ok) { requestAnimationFrame(step); return; }
    let k = 0; s.fauna = placeFauna(s, () => ans[k++]); FAUNA_CACHE.set(s.faunaKey, s.fauna); s.faunaPending = false;
    ctx2.globalAlpha = 1; drawFauna(ctx2, s);
    const c = viewCache.get(key); if (c) { const cx = c.getContext("2d"); cx.imageSmoothingQuality = "high"; cx.drawImage(c2, 0, 0, W, H, 0, 0, c.width, c.height); }
    if (note) { note.hidden = true; note.textContent = "Drawing…"; }
  };
  requestAnimationFrame(step);
}
function renderGrid() {}   // v1 drew a grid of every view here; in v2 the globe is how you change place
function sceneLabels() {
  const s = scene, sc = s.sc, w = s.w, Lt = s.Lt, cam = s.cam, rc = s.rc;
  if (!s.close) {
    const onScr = p => p && p[0] > 0 && p[0] < W && p[1] > 0 && p[1] < H, st = cam.project(0, Lt.es);
    if (onScr(st)) callouts.push({ x: st[0] + 10, y: st[1] - 10, t: `${w.star.name} · ${w.angDeg.toFixed(w.angDeg < 1 ? 2 : 1)}° across (${(w.angDeg / 0.533).toFixed(1)}× our Sun)`, lvl: 0 });
    if (s.s2) { const p = cam.project(s.s2.az, s.s2.el); if (onScr(p)) callouts.push({ x: p[0], y: p[1], t: `${w.star2.name} · ${w.ang2.toFixed(2)}°`, lvl: 0 }); }
    if (!s.ground) callouts.push({ x: W / 2, y: H * 0.8, t: "the ground: not observed, so left grey", lvl: 0, center: true });
    else {
      const gl_ = { ocean: sc.land === 1 ? "coast and continents (scenario)" : sc.land === -1 ? "open ocean, no land anywhere (scenario)" : "open ocean around a rocky islet (scenario)", ice: "ice plains (scenario)", rock: sc.base === 1 ? "bare dark rock (favoured by JWST)" : "bare rock (scenario)", regolith: "oxidised dust and rock (scenario)", lava: `molten rock at ~${Math.round(s.Tloc)} K: its glow is faint next to the star`, clouds: sc.deck === "hd189" ? "cloud deck in its measured colour" : "cloud deck (modelled)" }[sc.ground];
      callouts.push({ x: W * 0.3, y: H * 0.8, t: gl_, lvl: sc.ground === "clouds" && sc.deck === "hd189" ? 0 : sc.base });
      if (!sc.atm) callouts.push({ x: W * 0.78, y: H * 0.2, t: "no air: black sky, black shadows", lvl: sc.base });
      if (dial >= 3) callouts.push({ x: W * 0.84, y: H * 0.6, t: sc.ground === "clouds" ? "cloud shapes (imagined)" : `terrain shapes (imagined, height scaled to ${(w.g / 9.81).toFixed(2)} g)`, lvl: 3, quiet: true });
      if (dial >= 3 && rc.volc[2]) { const p = cam.project(Math.atan2(rc.volc[0], rc.volc[1]) / D2R, 1.5); if (onScr(p)) callouts.push({ x: p[0], y: p[1], t: "volcano (imagined)", lvl: 3, quiet: true }); }
      if (dial >= 2 && rc.frost) callouts.push({ x: W * 0.62, y: H * 0.72, t: "frost in the shadows", lvl: 2, quiet: true });
      if (dial >= 3 && sc.plants && sc.land === 1) callouts.push({ x: W * 0.2, y: H * 0.66, t: `${w.star.Teff < 4200 ? "near-black" : "green-brown"} vegetation? (speculative)`, lvl: 3 });
    }
    if (sc.atm && dial < sc.base) callouts.push({ x: W * 0.78, y: H * 0.25, t: "the air: not observed, so left out", lvl: 0 });
  } else {
    const what = !s.ground ? ["surface unknown at this setting", 0] : {
      ocean: [dial >= 2 && sc.weather === "rain" ? "raindrops ringing the water (scenario)" : "seawater reflecting the sky", 2],
      ice: ["ice crystals glinting in the starlight", sc.base], rock: ["dark rock; shadows nearly black with no air", sc.base],
      regolith: ["rusty grains and pebbles, Mars-like (scenario)", 2], lava: ["cooling crust over glowing melt", 1], clouds: ["inside the haze", sc.base] }[sc.ground];
    callouts.push({ x: W * 0.5, y: H * 0.80, t: what[0], lvl: what[1], center: true });
    callouts.push({ x: W * 0.5, y: H * 0.87, t: `light colour: ${w.star.Teff} K starlight${Lt.atmOn ? " filtered by the air" : ""} (derived)`, lvl: 1, center: true });
    if (dial >= 3) callouts.push({ x: W * 0.5, y: H * 0.94, t: "grain and pebble sizes (imagined)", lvl: 3, center: true });
  }
}
function plants(c, R, col) {
  c.strokeStyle = col; c.lineCap = "round";
  for (let n = 0; n < 40; n++) {
    const x = R() * W * 0.4, y = H - 10 - R() * 60, h = 30 + 80 * R(); c.lineWidth = 2 + 3 * R();
    for (let b = 0; b < 4; b++) { const a = -Math.PI / 2 + (R() - 0.5) * 1.1; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + Math.cos(a) * h * 0.5, y + Math.sin(a) * h * 0.6, x + Math.cos(a) * h, y + Math.sin(a) * h); c.stroke(); }
  }
}

// ================= Weather particles =================
let particles = [], pType = "none", pColor = [255, 255, 255], pScale = 1, lastT = 0;
function initParticles() {
  const s = scene; particles = [];
  pType = s && zoom >= 2 && dial >= 2 && s.ground ? s.sc.weather : "none";
  if (!s) return;
  pColor = disp(toXYZ(s.Lt.direct.map(v => v * 0.8)), s.Lt.M, s.Lt.k);
  pScale = s.close ? 2.2 : 1;
  const n = { rain: 150, snow: 260, glass: 320, dust: 260, sparks: 70 }[pType] || 0, R = rng(3);
  for (let i = 0; i < n; i++) particles.push({ x: R() * W, y: R() * H, z: 0.3 + R() * 0.7, s: R() });
}
function drawFx(t) {
  const dt = Math.min(50, t - lastT) / 16.7; lastT = t;
  fctx.clearRect(0, 0, W, H);
  if (pType === "none") return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, step = reduce ? 0 : dt, k = pScale;
  for (const p of particles) {
    if (pType === "rain") { p.y += 22 * p.z * step * k; p.x += 4 * p.z * step; if (p.y > H) { p.y = -20; p.x = Math.random() * W; } fctx.strokeStyle = css(pColor, 0.18 + 0.25 * p.z); fctx.lineWidth = p.z * 1.6 * k; fctx.beginPath(); fctx.moveTo(p.x, p.y); fctx.lineTo(p.x - 4 * p.z, p.y - 26 * p.z * k); fctx.stroke(); }
    else if (pType === "snow") { p.y += 1.2 * p.z * step * k; p.x += Math.sin(t / 900 + p.s * 9) * 0.5 * step; if (p.y > H) { p.y = -5; p.x = Math.random() * W; } const tw = 0.4 + 0.6 * Math.abs(Math.sin(t / 300 + p.s * 30)); fctx.fillStyle = css(pColor, 0.35 * tw + 0.2 * p.z); const z = (1 + p.z * 2.2) * k; fctx.fillRect(p.x, p.y, z, z); }
    else if (pType === "glass") { p.x += 40 * p.z * step * k; p.y += 1.5 * p.z * step; if (p.x > W + 60) { p.x = -60; p.y = Math.random() * H; } fctx.strokeStyle = css(pColor, 0.12 + 0.3 * p.z * Math.abs(Math.sin(t / 120 + p.s * 40))); fctx.lineWidth = p.z * 1.4 * k; fctx.beginPath(); fctx.moveTo(p.x, p.y); fctx.lineTo(p.x - 50 * p.z * k, p.y - 1.5); fctx.stroke(); }
    else if (pType === "dust") { p.x += 6 * p.z * step * k; p.y += Math.sin(t / 700 + p.s * 7) * 0.4 * step; if (p.x > W) { p.x = 0; p.y = H * 0.45 + Math.random() * H * 0.5; } fctx.fillStyle = css([190, 120, 80], 0.12 + 0.2 * p.z); fctx.fillRect(p.x, p.y, (2 + 3 * p.z) * k, (1 + p.z) * k); }
    else if (pType === "sparks") { p.y -= 0.8 * p.z * step * k; if (p.y < H * 0.35 || p.y > H) { p.y = H - Math.random() * H * 0.45; p.x = Math.random() * W; } fctx.fillStyle = `rgba(255,${160 + 60 * p.s | 0},80,${0.3 + 0.4 * p.z})`; const z = (1.5 + p.z * 2) * k; fctx.fillRect(p.x, p.y, z, z); }
  }
}

// ================= Labels =================
function drawCallouts() {
  const narrow = $("stage").getBoundingClientRect().width < 600;   // on a phone the caption under the picture says what the labels would
  const vis = callouts.filter(c => c.lvl <= dial);
  if (!(labels || zoom === 0) || narrow) return;   // labels show in "What's real?" and on the system map
  const c = lctx; c.textBaseline = "middle"; c.textAlign = "left";   // reset: other layers leave the alignment set to right or centre
  // legend notes (the giant globe): a column in the left margin, wrapped to two lines, clear of the globe
  c.font = "500 16px IBM Plex Sans, sans-serif"; let ty = 58;
  for (const co of vis.filter(co => co.legend)) {
    const lines = [""], maxW = W * 0.23;
    for (const wd of co.t.split(" ")) { const t = lines[lines.length - 1] ? lines[lines.length - 1] + " " + wd : wd; if (c.measureText(t).width <= maxW || !lines[lines.length - 1]) lines[lines.length - 1] = t; else if (lines.length < 2) lines.push(wd); else { lines[1] = lines[1].replace(/[\s,;:.]*$/, "") + "…"; break; } }
    const h = 14 + lines.length * 20;
    c.fillStyle = "rgba(8,9,12,0.72)"; c.beginPath(); c.roundRect(14, ty, maxW + 36, h, 6); c.fill();
    c.fillStyle = TAGC[co.lvl]; c.beginPath(); c.arc(27, ty + 17, 5, 0, 7); c.fill();
    c.fillStyle = co.quiet ? "#b9b9c3" : "#e7e4dc"; lines.forEach((l, i) => c.fillText(l, 39, ty + 17 + i * 20));
    ty += h + 8;
  }
  c.font = "500 19px IBM Plex Sans, sans-serif";
  // labels stay in the part of the picture nothing covers: below the title and buttons, above the caption panel
  const band = (() => { try { const b = coverBox(), hd = document.querySelector("#planet header.top"), dk = $("dock");
    const top = hd ? (hd.getBoundingClientRect().bottom - b.r.top - b.oy) / b.s + 22 : 52, bot = dk ? (dk.getBoundingClientRect().top - b.r.top - b.oy) / b.s - 22 : H - 20;
    return bot > top + 60 ? [Math.max(52, top), Math.min(H - 20, bot)] : [52, H - 20]; } catch (e) { return [52, H - 20]; } })();
  const placed = [];
  for (const co of vis.filter(co => !co.legend)) {
    const tw = c.measureText(co.t).width + 34;
    let lx = co.center ? co.x - tw / 2 : co.x + 18, ly = co.center ? co.y : co.y - 28;
    if (lx + tw > W - 10) lx = co.x - tw - 18;
    lx = Math.max(10, lx); ly = Math.max(band[0], Math.min(band[1], ly));
    for (let tries = 0; tries < 14 && placed.some(p => Math.abs(p[1] - ly) < 32 && lx < p[0] + p[2] && lx + tw > p[0]); tries++) ly += 34;
    if (ly > band[1]) { ly = band[1]; for (let tries = 0; tries < 14 && placed.some(p => Math.abs(p[1] - ly) < 32 && lx < p[0] + p[2] && lx + tw > p[0]); tries++) ly -= 34; }   // pushed past the caption: stack upwards instead
    placed.push([lx, ly, tw]);
    if (!co.center) { c.strokeStyle = "rgba(231,228,220,0.55)"; c.lineWidth = 1.2; c.beginPath(); c.moveTo(co.x, co.y); c.lineTo(lx + (lx > co.x ? 0 : tw), ly); c.stroke(); }
    c.fillStyle = co.quiet ? "rgba(8,9,12,0.5)" : "rgba(8,9,12,0.72)"; c.beginPath(); c.roundRect(lx, ly - 15, tw, 30, 6); c.fill();
    c.fillStyle = TAGC[co.lvl]; c.beginPath(); c.arc(lx + 13, ly, 5, 0, 7); c.fill();
    c.fillStyle = co.quiet ? "#b9b9c3" : "#e7e4dc"; c.fillText(co.t, lx + 25, ly + 1);
  }
}

// ================= Drawing a level =================
// the picture's canvases fill the stage with object-fit: cover; this maps a point on screen to the 1280×720 canvas and back
const VIEWPOS = { x: 0.5, y: 0.45 };   // the object-position of the canvases (a phone pans x by dragging)
function coverBox() { const r = $("stage").getBoundingClientRect(), s = Math.max(r.width / W, r.height / H); return { r, s, ox: (r.width - W * s) * VIEWPOS.x, oy: (r.height - H * s) * VIEWPOS.y }; }
function toCanvas(e) { const b = coverBox(); return [(e.clientX - b.r.left - b.ox) / b.s, (e.clientY - b.r.top - b.oy) / b.s, e.clientX - b.r.left, e.clientY - b.r.top]; }
function draw() {
  const w = cur;
  callouts = [];
  lctx.clearRect(0, 0, W, H);
  glc.style.visibility = "hidden"; c2.style.visibility = "visible";   // the WebGL canvas is a work surface; finished frames are copied to the visible canvas
  if (zoom !== 1 && !tintCache) { renderGlobe(95, true); callouts = []; ctx2.clearRect(0, 0, W, H); }
  if (zoom !== 2) { viewJob++; viewDone = true; if ($("busyNote")) $("busyNote").hidden = true; }   // a landscape still sharpening must not paint over the globe or the system
  if (zoom === 2) drawPlaceGlobe();   // the small globe in the panel borrows the visible canvas before the landscape is drawn
  if (zoom === 1) { renderGlobe(GLOBE_LAM); drawPlaceMarks(); }
  else if (zoom >= 2 && glOK) { buildScene(); sceneLabels(); renderView(); }
  else if (zoom >= 2) { ctx2.fillStyle = "#000"; ctx2.fillRect(0, 0, W, H); ctx2.fillStyle = "#e7e4dc"; ctx2.font = "24px IBM Plex Sans, sans-serif"; ctx2.fillText("This browser can't draw the landscape (WebGL is unavailable).", 60, H / 2); }
  initParticles();
  if (zoom === 2) drawCallouts();   // the globe view carries the place labels instead (ui-v2.js)
  onDrawn();
}
function loop(t) {
  if (zoom === 0 && !$("planet").hidden) { callouts = []; lctx.clearRect(0, 0, W, H); renderSystem(t); drawCallouts(); }
  drawFx(t);
  if (!matchMedia("(prefers-reduced-motion: reduce)").matches || zoom === 0) requestAnimationFrame(loop);
}

// ================= Zoom transitions =================
let busy = false;
function zoomTo(z, origin) {
  z = Math.max(0, Math.min(2, z));   // three levels: the system, the planet, standing there
  if (z === zoom || busy) return;
  const views = $("views"), dir = z > zoom ? 1 : -1;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const o = origin || (dir > 0 ? (zoom === 0 && sysPos ? sysPos : [W / 2, H * 0.6]) : [W / 2, H / 2]);
  views.style.transformOrigin = `${o[0] / W * 100}% ${o[1] / H * 100}%`;
  if (reduce || !views.animate) { zoom = z; draw(); return; }
  busy = true;
  const a = views.animate([{ transform: "scale(1)", opacity: 1, filter: "blur(0)" }, { transform: `scale(${dir > 0 ? 3.2 : 0.35})`, opacity: 0, filter: "blur(6px)" }], { duration: 340, easing: "cubic-bezier(.5,0,.75,0)", fill: "forwards" });
  a.onfinish = () => {   // the globe takes a moment to draw: say so, and let the note paint before the work starts
    zoom = z; const note = $("busyNote"); if (note) note.hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => { draw(); if (note) note.hidden = true; after(); }));
  };
  const after = () => {
    views.style.transformOrigin = "50% 50%";
    const b = views.animate([{ transform: `scale(${dir > 0 ? 0.45 : 2.4})`, opacity: 0, filter: "blur(6px)" }, { transform: "scale(1)", opacity: 1, filter: "blur(0)" }], { duration: 380, easing: "cubic-bezier(.25,1,.5,1)" });
    b.onfinish = () => { busy = false; a.cancel(); b.cancel(); };
  };
}
