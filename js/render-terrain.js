// Levels 3 and 4: WebGL terrain
// ================= Levels 3 and 4: WebGL terrain =================
let gl = null, prog = null, U = {}, skyTexGL = null, layerTexGL = null, glOK = false;
const skyLayer = document.createElement("canvas"), skyLayerT = document.createElement("canvas"); skyLayer.width = skyLayerT.width = W; skyLayer.height = skyLayerT.height = H;
let thumbing = false;   // true while a thumbnail is drawn, so it uses its own sky layer
const UNIFORMS = ["uRes", "uTime", "uMode", "uF", "uYaw", "uPitch", "uCamH", "uS1Dir", "uS1Col", "uS1Rad", "uS2Dir", "uS2Col", "uS2Rad", "uS2On", "uSky", "uLayer",
  "uAmb", "uBounce", "uRockA", "uRockB", "uDustCol", "uFrostCol", "uIceCol", "uIceBlue", "uWaterCol", "uPlantCol", "uGlow", "uCloudCol", "uDeckA", "uDeckB",
  "uHaze", "uGround", "uRelief", "uReliefM", "uRockDen", "uDust", "uFrost", "uLand", "uPlants", "uClouds", "uClouds2", "uAir", "uRain", "uUnknown", "uFloes", "uLayerOn", "uStrata",
  "uSpec", "uStyle", "uVolc", "uSeed", "uWind", "uLandDir", "uScaleH", "uStreak", "uExpo", "uWet", "uSnow", "uLandform", "uJit", "uCrust", "uG", "uAccent", "uSlab", "uRockC", "uPatch", "uDeckC", "uTide", "uMats", "uShrub", "uAur", "uMatCol", "uAurCol", "uGlowAll", "uBloom", "uClear", "uForest", "uSav", "uCover", "uShrubDen", "uDry", "uTall", "uCoast", "uCoastOff", "uTree1", "uTree2", "uTree3", "uBio1", "uBio2", "uGrassCol", "uFlowerCol", "uBarkCol", "uPlant2", "uLichenCol", "uPlant3", "uCan1", "uCan2", "uBio3", "uAn", "uAnB0", "uAnB1", "uAnCol", "uAnCol2", "uAnN", "uAnS", "uProbe", "uProbeTop"];
// one small shader per ground type and view, compiled the first time it is needed: the compiler drops every branch that cannot run,
// which keeps compile times short (a single shader holding every ground type took seconds to compile)
let vsGL = null, buf = null, progs = {}, progWarm = false;
let AN_MAX = 16, PLATE = {}, probeMs = 0;   // probeMs: time spent placing life, kept out of the render-cost estimate   // PLATE.fov: a narrower lens for a pre-rendered plate   // animals drawn at most (a pre-rendered plate can raise it before any shader is compiled)
function initGL() {
  try {
    gl = glc.getContext("webgl", { antialias: false, preserveDrawingBuffer: true });
    if (!gl) return false;
    progs = {}; U = {}; prog = null;
    vsGL = gl.createShader(gl.VERTEX_SHADER); gl.shaderSource(vsGL, "attribute vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }"); gl.compileShader(vsGL);
    buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const mk = () => { const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t; };
    skyTexGL = mk(); layerTexGL = mk(); pcx = gl.getExtension("KHR_parallel_shader_compile");
    return true;   // shaders compile when a view first needs them, so the page itself appears at once
  } catch (e) { console.error(e); return false; }
}
let pcx = null;   // KHR_parallel_shader_compile: lets the browser compile without blocking the page
function startProg(ground, mode, bio = 0) {
  const key = ground * 2 + mode + bio * 64;
  if (progs[key] || !gl) return;
  const fs = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fs, TERRAIN_FS.replace("precision highp float;", `precision highp float;\n#define uGround ${ground}.0\n#define uMode ${mode}.0\n#define BIO ${bio ? 1 : 0}\n#define AN_MAX ${AN_MAX}`)); gl.compileShader(fs);
  const pr = gl.createProgram(); gl.attachShader(pr, vsGL); gl.attachShader(pr, fs); gl.linkProgram(pr);
  progs[key] = { pr, fs, ready: false };
}
// start compiling every shader a planet's scenarios need, before they are asked for
// Without KHR_parallel_shader_compile (Safari) every compile blocks the page until it finishes, so nothing is compiled ahead: each world's
// program is built when it is first drawn, behind the "Drawing…" note, instead of all of a planet's worlds freezing the page at once.
function warm(w) { if (glOK && !pcx) return; if (glOK) w.scenarios.forEach(sc => [0, 1].forEach(m => { startProg(GROUND_ID[sc.ground], m); if (sc.ground === "ocean" && sc.atm) startProg(3, m, 1); })); setTimeout(prewarm, 60); }
function prewarm() {   // the GPU finishes a program the first time it draws: do that with one pixel, while nothing else is happening
  if (!glOK) return; let left = 0;
  for (const P of Object.values(progs)) { if (P.warmed || P.failed) continue;
    if (pcx && !gl.getProgramParameter(P.pr, pcx.COMPLETION_STATUS_KHR)) { left++; continue; }
    gl.useProgram(P.pr); const loc = gl.getAttribLocation(P.pr, "p"); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    gl.viewport(0, 0, 1, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); P.warmed = true; prog = null; break; }
  if (left || Object.values(progs).some(P => !P.warmed && !P.failed)) setTimeout(prewarm, 80);
}
function useProg(ground, mode, bio = 0) {
  const key = ground * 2 + mode + bio * 64;
  startProg(ground, mode, bio);
  const P = progs[key];
  if (P.failed) return false;
  if (!P.ready) {
    if (pcx && !gl.getProgramParameter(P.pr, pcx.COMPLETION_STATUS_KHR)) return false;   // still compiling: try again next frame
    if (!gl.getProgramParameter(P.pr, gl.LINK_STATUS)) { console.error(gl.getShaderInfoLog(P.fs) || gl.getProgramInfoLog(P.pr)); P.failed = true; return false; }
    P.u = {}; UNIFORMS.forEach(n => P.u[n] = gl.getUniformLocation(P.pr, n)); P.loc = gl.getAttribLocation(P.pr, "p"); P.ready = true;
  }
  prog = P.pr; U = P.u; progWarm = (P.uses = (P.uses || 0) + 1) > 1;   // a program's first draw also pays for driver set-up
  gl.useProgram(prog); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.enableVertexAttribArray(P.loc); gl.vertexAttribPointer(P.loc, 2, gl.FLOAT, false, 0, 0);
  return true;
}
// thumbnails use the same WebGL context at a smaller size; the drawing code reads globals, so swap them in and out
const glState = () => ({ scene, cur, si, zoom, yaw, dial, callouts, vp });
const setGLState = s => ({ scene, cur, si, zoom, yaw, dial, callouts, vp } = s);
// returns true when drawn, null while its shader is still compiling
function renderThumb(w, sIdx, out, o = {}) {
  const main = glState();
  try {
    thumbing = true;
    setGLState({ ...main, cur: w, si: sIdx, zoom: o.zoom ?? 2, yaw: o.yaw ?? 0, dial: o.dial ?? 3, callouts: [], scene: null, vp: o.vp ?? 0 });
    buildScene();
    const k = out.width / glc.width, h = glc.height * k;
    if (!drawGL(4000, [0, 0], k)) return null;
    out.getContext("2d").drawImage(glc, 0, glc.height - h, glc.width * k, h, 0, 0, out.width, out.height);
    return true;
  } finally { thumbing = false; setGLState(main); }
}
const GROUND_ID = { rock: 0, regolith: 1, ice: 2, ocean: 3, lava: 4, clouds: 5 };
let scene = null;
// The sky's colour toward (az, el), in linear display RGB: single Rayleigh scattering by the gas plus scattering by haze or dust, with a
// simple multiple-scattering boost (1 + 0.8 τ). Used to paint the sky and to name its colour in the explanations.
function skySampler(w, sc, Lt) {
  const sdir = dirOf(0, Lt.es), S = Lt.S, dil = Lt.dil, tau = Lt.tau, dust = Lt.dust, mu0 = Lt.mu0;
  // aerosol colour: Mars dust, or the planet's own haze (for gas worlds, the giant model's cloud colour)
  const dustSpec = isGiantScene(sc) ? giantOf(w).m.zone : sc.atm && sc.atm.dustMat ? MAT[sc.atm.dustMat] : MAT.regolith;
  return (az, el) => {
    const e = Math.max(0.3, el), mu = 1 / Lt.airm(e), v = dirOf(az, e), cg = v[0] * sdir[0] + v[1] * sdir[1] + v[2] * sdir[2];
    let X = 0, Y = 0, Z = 0;
    if ((tau > 0 || dust > 0) && mu0 > -0.05) {
      const ph = 0.75 * (1 + cg * cg) / 4, mup = Math.max(0.03, mu0), phd = 0.25 * (1 + 4 * Math.pow(Math.max(0, cg), 6)) / 1.3;
      for (let b = 0; b < NB; b++) {
        const t = tau * RAYL[b] + dust;
        const ss = Math.abs(mup - mu) < 1e-3 ? (t / mup) * Math.exp(-t / mup) : mup / (mup - mu) * (Math.exp(-t / mup) - Math.exp(-t / mu));
        const wr = t > 0 ? (tau * RAYL[b] * ph + dust * phd * dustSpec[b] * 2.2) / t : 0;
        const rad = S[b] * dil * wr * ss * (1 + 0.8 * t);
        X += rad * CX[b]; Y += rad * CY[b]; Z += rad * CZ[b];
      }
    }
    return clip(lin([X, Y, Z], Lt.M, Lt.k));
  };
}
function buildScene() {
  const w = cur, sc = curSc(), Lt = lighting(w, sc), rc = recipe(w, sc);
  const close = false, tele = zoom === 3, gas = sc.ground === "clouds";   // level 4 is now binoculars: the same spot through a narrow lens (the ground close-up is retired)
  const faunaWant = dial >= 3 && life >= 4 && !!rc.anim && rc.anim.ok, fov = PLATE.fov || (tele ? 28 : 100);
  // lone plants (trees, palms, succulents, the speculative forms) are drawn as painted silhouettes placed by the probe; the shader keeps the forest canopy
  const lone = lonePlants(rc, sc), plantSil = !gas && lone.pl && lone.t1[3] > 0;
  // a close-up on a world with land plants stands among them on land, not in the shallows
  const landClose = close && sc.ground === "ocean" && (sc.land === 1 || !!sc.oceanDeg) && dial >= 3 && life >= 2 && !!sc.plants && !!rc.bio && rc.bio.bio2[2] > 0.3;
  const camH = close ? (gas ? 330 : landClose ? 3.1 : sc.ground === "ocean" ? 0.9 : 0.55) : (gas ? 380 : sc.ground === "ocean" ? (sc.land === 1 ? 2.6 : sc.land === -1 ? 3 : 2.3) : 1.7);
  const toward = Math.cos(yaw * D2R) > 0.6;   // within about 50° of the star: tilt up to keep it in frame
  const pitch = close ? (gas ? -8 : -52) : gas ? (toward ? Math.max(2, Math.min(16, Lt.es - 24)) : 3) : (toward ? Math.max(4, Math.min(16, Lt.es - 20)) : 6);   // a high star may sit above the frame: the ground matters more
  const yawDeg = yaw;
  const pitchP = PLATE.pitch ?? (tele ? (gas ? 2 : 1.5) : pitch), cam = camera(W, H, yawDeg, pitchP, fov), camG = camera(glc.width, glc.height, yawDeg, pitchP, fov);
  const TW = 128, TH = 64, tex = new Uint8Array(TW * TH * 4);
  const S = Lt.S, dil = Lt.dil, tau = Lt.tau, dust = Lt.dust, mu0 = Lt.mu0;
  const skyAt = skySampler(w, sc, Lt);   // the sky's colour in any direction: the same function names the colour in the explanations (ui-trace.js)
  for (let j = 0; j < TH; j++) for (let i = 0; i < TW; i++) {
    const az = (i + 0.5) / TW * 360 - 180, el = -8 + (j + 0.5) / TH * 98;
    const c = skyAt(az, el), o = 4 * (j * TW + i);
    tex[o] = 255 * Math.pow(c[0], 1 / 2.2); tex[o + 1] = 255 * Math.pow(c[1], 1 / 2.2); tex[o + 2] = 255 * Math.pow(c[2], 1 / 2.2); tex[o + 3] = 255;
  }
  const skyY = (az, el) => { const i = Math.max(0, Math.min(TW - 1, Math.floor((az + 180) / 360 * TW))), j = Math.max(0, Math.min(TH - 1, Math.floor((el + 8) / 98 * TH))); const o = 4 * (j * TW + i); return Math.pow((tex[o] + tex[o + 1] + tex[o + 2]) / 765, 2.2); };
  const ground = dial >= Math.max(2, sc.base);   // no telescope resolves an exoplanet's surface: even on an observed world the ground's look is assumed, so “What's real?” leaves it grey
  const sun1 = Lt.rgb(Lt.direct);
  const groundAlb = sc.ground === "ice" ? 0.8 : sc.ground === "ocean" ? 0.1 : sc.ground === "clouds" ? 0.5 : 0.12;
  const ambient = Lt.atmOn ? Lt.rgb(Lt.diffuse).map(v => v * 2) : [0, 0, 0];
  const bounce = sun1.map(v => v * Math.max(0, mu0) * groundAlb * 0.5);   // light reflected up from the ground: the only fill light on an airless world
  let glow = [0, 0, 0], Tloc = 0;
  if (sc.ground === "lava") { const ds = daysideRock(w, sc), fT = ds.T / (w.star.Teff / Math.sqrt(w.aR) * Math.pow(2 / 3, 0.25));   // measured or cloud-cooled day sides glow less than bare rock would
    Tloc = w.star.Teff / Math.sqrt(w.aR) * Math.pow(Math.max(0.01, mu0), 0.25) * fT; glow = lin(toXYZ(spec(l => planck(l, Tloc))), Lt.M, Lt.k); }
  if (sc.ground === "clouds" && (sc.T || w.Teq) > 1300) { const Td = (sc.T || w.Teq) * 1.15; glow = lin(toXYZ(spec(l => planck(l, Td))), Lt.M, Lt.k); }
  const scaleH = isGiantScene(sc) ? giantOf(w).m.Hkm / 100 : 3.6 * (sc.T || w.Teq) / w.g / 100;   // H₂/He scale height relative to 100 km
  let s2 = null;
  if (w.star2) { const az2 = -w.star2.sepDeg * 0.85, el2 = Lt.es + w.star2.sepDeg * 0.55; const tr2 = w.spec2.map((v, i) => v * w.dil2 * Math.exp(-(tau * RAYL[i] + dust) * Lt.airm(el2))); s2 = { dir: dirOf(az2, el2), col: Lt.rgb(tr2), rad: w.ang2 / 2 * D2R, az: az2, el: el2 }; }
  const coat = sc.atm && sc.atm.dustMat === "tholin";   // organic haze settles out and coats the ground dark orange-brown, as on Titan
  // aurora colour from the air's main emitters: nitrogen violet-blue, oxygen (from CO₂) green, hydrogen pink
  const gasA = sc.atm ? sc.atm.gas : "", aurCol = /^H/.test(gasA) ? [0.9, 0.28, 0.5] : /CO₂/.test(gasA) && !/^N/.test(gasA) ? [0.25, 0.95, 0.4] : [0.45, 0.3, 1];
  scene = { faunaWant, plantSil, lone, tele, lifeWant: faunaWant || plantSil, faunaKey: [w.id, si, vp, dial, life].join("|"), landClose, aur: rc.aurora || 0, aurCol, w, sc, rc, Lt, close, fov, camH, pitch: pitchP, yawDeg, cam, camG, tex, TW, TH, skyY, ground, sun1, ambient, bounce, glow, s2, Tloc, scaleH,
    alb: { mat: Lt.albedo(rc.matMat || rc.plantMat), rockA: Lt.albedo(rc.rockA), rockB: Lt.albedo(rc.rockB), rockC: Lt.albedo(rc.rockC), dust: Lt.albedo(sc.ground === "regolith" ? MAT.regolith : sc.ground === "ocean" ? MAT.sand : mixS(rc.rockA, MAT.highland, 0.4)),
      frost: Lt.albedo(coat ? mixS(MAT.frost, MAT.tholin, 0.75) : MAT.frost), ice: Lt.albedo(coat ? mixS(MAT.ice, MAT.tholin, 0.8).map(v => v * 0.45) : MAT.ice), blueice: Lt.albedo(coat ? mixS(MAT.blueice, MAT.tholin, 0.8).map(v => v * 0.45) : MAT.blueice), water: Lt.albedo(MAT.ocean), plant: Lt.albedo(rc.bio ? rc.bio.plant1 : rc.plantMat), plantS: Lt.albedo(rc.spec ? rc.spec.p1 : rc.plantMat), plant2S: Lt.albedo(rc.spec ? rc.spec.p2 : rc.plantMat), plant2: Lt.albedo(rc.bio ? rc.bio.plant2 : rc.plantMat), grass: Lt.albedo(rc.bio ? rc.bio.grass : rc.plantMat), flower: Lt.albedo(rc.bio ? rc.bio.flower : MAT.flowerWhite), accent: Lt.albedo(rc.bio ? rc.bio.accent : MAT.flowerYellow), bark: Lt.albedo(MAT.bark), lichen: Lt.albedo(MAT.lichenOrange), cloud: Lt.albedo(MAT.cloud), hide: Lt.albedo(rc.anim && rc.anim.ok ? rc.anim.hide : MAT.bark), belly: Lt.albedo(rc.anim && rc.anim.ok ? rc.anim.belly : MAT.bark),
      deckA: Lt.albedo(MAT[sc.deck] || MAT.grey), deckB: Lt.albedo(MAT[sc.deckB || sc.deck] || MAT.grey) } };
  // giant and haze worlds: cloud-top colours come from the giant-planet model (zone and belt spectra with methane absorption)
  if (isGiantScene(sc)) {
    const gm = giantOf(w).m, ch = s => s.map((v, i) => v * Math.exp(-gm.ch4 * GIANT.CH4[i]));
    scene.alb.deckA = Lt.albedo(ch(gm.zone)); scene.alb.deckB = Lt.albedo(ch(mixS(gm.zone, gm.belt, Math.min(1, gm.contrast * 1.4)))); scene.alb.deckC = Lt.albedo(ch(gm.deep)); scene.patch = gm.patch;
    const Tmx = gm.Tday / Math.pow(2 / 3, 0.25), Tv = gm.locked ? Math.pow(gm.Tnight ** 4 + Math.max(0, Tmx ** 4 - gm.Tnight ** 4) * Math.max(0, Lt.mu0), 0.25) : Lt.mu0 < 0 ? gm.Tnight : gm.Tday;   // local temperature where we float
    const Tg = Math.max(Tv, gm.Tint || 0); scene.clear = Math.max(0, Math.min(1, (Tg - 2200) / 400)); scene.Tloc = Tg;   // above ~2,400 K even corundum and perovskite stay vapour: no clouds
    scene.glowAll = Math.max(0, Math.min(1, (Tg - 1700) / 1500)); scene.glow = Tg > 1300 ? lin(toXYZ(spec(l => planck(l, Tg))), Lt.M, Lt.k) : [0, 0, 0];
  }
  scene.layer = thumbing ? skyLayerT : skyLayer;
  drawSkyLayer();
}
const skyHit = (s, x, y, r, k) => (s.skyHits || (s.skyHits = [])).push({ x0: x - r, x1: x + r, y0: y - r, y1: y + r, k });
function drawSkyLayer() {
  const s = scene, w = s.w, sc = s.sc, Lt = s.Lt, c = s.layer.getContext("2d");
  c.clearRect(0, 0, W, H); s.skyHits = [];   // what can be clicked in the sky: things alive, moons, other planets (ui-why.js)
  if (s.close) return;
  const cam = s.cam, M = Lt.M;
  const R = rng(7);
  for (let n = 0; n < 1400; n++) {
    const az = R() * 360 - 180, el = R() * 90, m = R();
    const p = cam.project(az, el); if (!p || p[0] < 0 || p[0] > W || p[1] < 0 || p[1] > H) continue;
    const L = s.skyY(az, el); if (L > 0.02) continue;
    c.fillStyle = `rgba(255,255,255,${((1 - L / 0.02) * (0.3 + 0.7 * m * m)).toFixed(3)})`; const z = m > 0.97 ? 2.4 : 1.4; c.fillRect(p[0], p[1], z, z);
  }
  for (const p of (w.points || [])) {
    const sp = cam.project(p.az, p.el); if (!sp || p.el < 0) continue;
    const L = s.skyY(p.az, p.el), bright = Math.pow(10, -0.4 * (p.mag + 5)), vis = Math.min(1, bright / (bright + L * 2));
    if (vis < 0.05) continue;
    const xyz = toXYZ(starSpec(p.Teff)), col = disp(xyz, M, 0.9 / xyz[1]), r = Math.max(1.5, 3 + (-p.mag) * 0.9);
    const g = c.createRadialGradient(sp[0], sp[1], 0, sp[0], sp[1], r * 4); g.addColorStop(0, css(col, vis)); g.addColorStop(0.25, css(col, vis * 0.5)); g.addColorStop(1, css(col, 0));
    c.fillStyle = g; c.beginPath(); c.arc(sp[0], sp[1], r * 4, 0, 7); c.fill();
    if (!p.nolabel) callouts.push({ x: sp[0], y: sp[1], t: `${p.name} · mag ${p.mag}`, lvl: p.lvl });
  }
  if (dial >= 1) {
    const sibs = siblingSnapshot(w, Lt.F, cam); s.sibs = sibs;   // kept so the explanation can say where each neighbour is
    const stS = cam.project(0, Lt.es);
    for (const b of sibs) {
      const rpx = Math.max(1.2, cam.f * Math.tan(b.ang / 2 * D2R));
      const sbr = 0.3 * (w.a / b.a) ** 2;
      const vis = Math.min(1, sbr / (sbr + s.skyY(b.L.az, b.L.el)));
      const ang = stS ? Math.atan2(stS[1] - b.sc[1], stS[0] - b.sc[0]) : Math.PI / 2;
      const lit = disp(toXYZ(Lt.S.map(v => v * 0.3)), M, 1 / toXYZ(Lt.S)[1] * Math.min(3, Math.max(0.6, sbr * 4)));
      drawPhase(c, b.sc[0], b.sc[1], rpx, b.phase, ang, css(lit, vis)); skyHit(s, b.sc[0], b.sc[1], rpx + 10, "other");
      b.rpx = rpx;
    }
    // label the biggest sibling; with three or more, fold the rest into the arc note so the labels don't pile up over the sky
    const big = sibs.filter(b => b.ang >= 0.1).sort((p, q) => q.ang - p.ang), one = big.length > 2 ? big.slice(0, 1) : big, rest = big.slice(one.length);
    for (const b of one) callouts.push({ x: b.sc[0], y: b.sc[1] - b.rpx, t: `${b.name} · ${b.ang.toFixed(2)}°${b.ang > 0.4 ? ` (${(b.ang / 0.52).toFixed(1)}× the Moon)` : ""}`, lvl: 1 });
    const arc = "the planets line up along one arc: their orbits share a plane", ids = rest.map(b => b.name.replace(/^.*?\s?([a-z])$/, "$1")).join(", ");
    if (sibs.length > 1) callouts.push({ x: sibs[sibs.length - 1].sc[0], y: sibs[sibs.length - 1].sc[1], t: rest.length ? `also ${ids} (${Math.min(...rest.map(b => b.ang)).toFixed(2)}–${Math.max(...rest.map(b => b.ang)).toFixed(2)}°): ${arc}` : arc, lvl: 1 });
  }
  // floaters (Speculative stop, air above 3 bar): gas-bags drifting in the sky, nearest the biggest, lit from the star's side
  const sp = s.rc.spec;
  if (sp && sp.floaters && dial >= 3 && life >= 3 && sc.plants) {
    const RF = rng(31), body = disp(toXYZ(Lt.S.map((v, i) => v * sp.p2[i])), M, 1.4 / toXYZ(Lt.S)[1]), rim = disp(toXYZ(Lt.S.map((v, i) => v * MAT.frost[i])), M, 1 / toXYZ(Lt.S)[1]);
    const n = Math.round(10 + 30 * sp.floaters), stS = cam.project(0, Lt.es);
    for (let i = 0; i < n; i++) {
      const az = RF() * 360 - 180, el = 2 + 26 * RF() ** 1.6, d = 0.25 + RF() ** 2 * 2.5, p = cam.project(az, el); if (!p || p[0] < -50 || p[0] > W + 50 || p[1] < -50 || p[1] > H) continue;
      const r = Math.max(3, cam.f * 0.035 / d), fog = Math.min(0.85, s.skyY(az, el) * 0.5 * d), ang = stS ? Math.atan2(stS[1] - p[1], stS[0] - p[0]) : -Math.PI / 2;
      skyHit(s, p[0], p[1], r * 1.3 + 6, "life");
      c.save(); c.translate(p[0], p[1]); c.globalAlpha = 1 - fog;
      c.strokeStyle = css(body, 0.55); c.lineWidth = Math.max(0.6, r * 0.06);
      for (let k = -2; k <= 2; k++) { c.beginPath(); c.moveTo(k * r * 0.22, r * 0.45); c.quadraticCurveTo(k * r * 0.3 + r * 0.15, r * 1.3, k * r * 0.18, r * (1.8 + 0.4 * Math.abs(k % 2))); c.stroke(); }   // trailing tendrils
      const g = c.createRadialGradient(Math.cos(ang) * r * 0.4, Math.sin(ang) * r * 0.4, r * 0.1, 0, 0, r * 1.05);
      g.addColorStop(0, css(rim, 0.95)); g.addColorStop(0.45, css(body, 0.9)); g.addColorStop(1, css(body.map(v => v * 0.35), 0.85));
      c.fillStyle = g; c.beginPath(); c.ellipse(0, 0, r, r * 0.62, 0, 0, 7); c.fill(); c.restore();
    }
    callouts.push({ x: W * 0.5, y: H * 0.18, t: `speculative floaters in ${sc.atm.P}-bar air (after Sagan & Salpeter 1976)`, lvl: 3 });
  }
  // rings, as seen from the cloud tops: the same rings the globe shows (Saturn's proportions, 1.24 to 2.27 planet radii, in the equatorial
  // plane), drawn from where you float, so they arch across the sky; the planet's shadow falls across the far side
  if (dial >= 3 && isGiantScene(sc)) { const m = giantOf(w, sc).m;
    if (m.rings) { const F = Lt.F, o = F.up, ice = disp(toXYZ(Lt.S.map((v, i) => v * MAT.frost[i])), M, 1.05 / toXYZ(Lt.S)[1]); let lab = null;
      const open = Math.min(1, 0.04 + 4 * Math.abs(o[2]));   // from the equator the rings are seen edge-on: a faint line, not a bright beam
      // a continuous band: filled segments between neighbouring radii, each shaded by its ring's density and the planet's shadow
      const NR = 40, NP = 240, pt = (r, ph) => { const P = [r * Math.cos(ph), r * Math.sin(ph), 0], L = toLocal(F, [P[0] - o[0], P[1] - o[1], P[2] - o[2]]); const sp = L.el > -0.5 ? cam.project(L.az, L.el) : null; return sp && Math.abs(sp[0]) < W * 4 && Math.abs(sp[1]) < H * 4 ? { sp, L, P } : null; };
      const rad = Array.from({ length: NR + 1 }, (_, k) => 1.24 + (2.27 - 1.24) * k / NR), grid = rad.map(r => Array.from({ length: NP + 1 }, (_, j) => pt(r, j / NP * 2 * Math.PI)));
      for (let k = 0; k < NR; k++) { const r = (rad[k] + rad[k + 1]) / 2, dens = (r < 1.53 ? 0.35 : 1) * (r > 1.95 && r < 2.03 ? 0.12 : 1) * (0.85 + 0.15 * Math.sin(r * 37));   // a faint inner ring, a Cassini-like gap, fine ringlets
        for (let j = 0; j < NP; j++) { const q = [grid[k][j], grid[k][j + 1], grid[k + 1][j + 1], grid[k + 1][j]]; if (q.some(x => !x)) continue;
          const P = q[0].P, shade = P[0] < 0 && Math.abs(P[1]) < 1 ? 0.12 : 1, L = q[0].L, vis = 0.85 * dens * shade * open * (1 - 0.35 * Math.min(1, s.skyY(L.az, Math.max(0, L.el))));
          c.fillStyle = css(ice, vis); c.beginPath(); c.moveTo(q[0].sp[0], q[0].sp[1]); for (const x of q.slice(1)) c.lineTo(x.sp[0], x.sp[1]); c.closePath(); c.fill();
          if (!lab && k === 30 && L.el > 8 && q[0].sp[0] > W * 0.2 && q[0].sp[0] < W * 0.8 && q[0].sp[1] > 60) lab = q[0].sp; } }
      if (lab) callouts.push({ x: lab[0], y: lab[1], t: m.rings === "saturn" ? "Saturn's rings" : m.rings === "candidate" ? "candidate rings (unconfirmed)" : "rings (imagined: none is confirmed on an exoplanet)", lvl: m.rings === "saturn" ? 0 : 3 }); } }
  if (dial >= 3) { const mf = moonFate(w);   // an imagined moon, where one could survive: at its true size for a Moon-like (or Ganymede-like) orbit
    if (mf.ok) { const R = rng(strHash(w.name + "|moon")), az = 150 + 60 * R(), el = 14 + 22 * R(), sp = cam.project(az, el);
      if (sp) { const giant = w.Rp > 6 || w.Ru === "RJ", ang = giant ? 0.5 : 1.2,   // an imagined moon on a fairly close orbit (25 planet radii; an Io-like one for giants)
        rpx = Math.max(2, cam.f * Math.tan(ang / 2 * D2R)), lit = disp(toXYZ(Lt.S.map((v, i) => v * MAT.highland[i])), M, 1 / toXYZ(Lt.S)[1]);
        const stS = cam.project(0, Lt.es), pa = stS ? Math.atan2(stS[1] - sp[1], stS[0] - sp[0]) : Math.PI * 0.9, sep = Math.acos(Math.max(-1, Math.min(1, Math.cos(az * D2R) * Math.cos(el * D2R) * Math.cos(Lt.es * D2R) + Math.sin(el * D2R) * Math.sin(Lt.es * D2R))));
        drawPhase(c, sp[0], sp[1], rpx, (1 - Math.cos(sep)) / 2, pa, css(lit), true); skyHit(s, sp[0], sp[1], rpx + 10, "moon");
        callouts.push({ x: sp[0], y: sp[1] - rpx, t: "a moon in the sky (imagined: none is known, but one could survive here)", lvl: 3 }); } } }
  if (s.faunaWant) drawFliers(c, s, cam);   // the Animals stop's fliers live in the sky layer (terrain hides them), drawn after any moon so they fly in front of it
}
function siblingSnapshot(w, F, cam) {
  if (!w.siblings.length) return [];
  const at = t => w.siblings.map((s, i) => {
    const Pi = w.P * Math.pow(s.a / w.a, 1.5), ph = 2 * Math.PI * t * (1 / Pi - 1 / w.P) + i * 2.1;
    const pos = [w.a - s.a * Math.cos(ph), s.a * Math.sin(ph), 0], d = Math.hypot(...pos);
    const L = toLocal(F, pos), sc = L.el > 4 ? cam.project(L.az, L.el) : null;
    const elong = Math.acos(Math.max(-1, Math.min(1, pos[0] / d))) / D2R;
    const inView = !!sc && sc[0] > 40 && sc[0] < W - 40 && sc[1] > 30 && elong > w.angDeg * 0.8 + 6;
    const toStar = [w.a - pos[0], -pos[1]], cosA = (toStar[0] * -pos[0] + toStar[1] * -pos[1]) / (Math.hypot(...toStar) * d);
    return { ...s, pos, d, L, sc, inView, ang: 2 * Math.asin(Math.min(1, s.R * RE / (d * AU))) / D2R, phase: (1 + cosA) / 2 };
  });
  let best = null, bs = -1;
  for (let t = 0; t < 80; t += 0.01) { const snap = at(t), s = snap.reduce((a, b) => a + (b.inView ? Math.min(b.ang, 1.2) + 0.05 : 0), 0); if (s > bs) { bs = s; best = snap; } }
  return best.filter(b => b.inView);
}
function drawPhase(c, x, y, r, k, ang, fill, dark = true) {
  c.save(); c.translate(x, y); c.rotate(ang);
  if (dark) { c.fillStyle = "rgba(14,16,22,0.85)"; c.beginPath(); c.arc(0, 0, r, 0, 7); c.fill(); }
  c.fillStyle = fill; c.beginPath(); c.arc(0, 0, r, -Math.PI / 2, Math.PI / 2, false);
  const e = r * (2 * k - 1); c.ellipse(0, 0, Math.abs(e), r, 0, Math.PI / 2, -Math.PI / 2, e <= 0); c.fill(); c.restore();
}
let texScene = null;
// draw a scene into the lower-left part of the WebGL canvas at the given scale; strip = [i, n] draws only the i-th of n horizontal bands
function drawGL(time, jit = [0, 0], scale = 1, strip = null, s = scene, probe = false) {
  if (!glOK || !s) return false;
  const sc = s.sc, Lt = s.Lt, rc = s.rc, A = s.alb;
  // animals are placed once per spot, by a small ground-only pass that asks the shader for heights (render-fauna.js), then drawn in 2D
  // where animals and painted plants stand is worked out after the landscape is drawn, a slice per frame (placeFaunaSoon, render-views.js):
  // done here in one go it asked the GPU ~50 questions in a row, each waited for, which froze a phone for about 3 s
  if (!probe && s.lifeWant && !s.fauna) { const c = FAUNA_CACHE.get(s.faunaKey); if (c) s.fauna = c; else s.faunaPending = true; }
  let bio = sc.ground === "ocean" && !!sc.atm && dial >= 3 && life >= 1 ? 1 : 0;   // biology has its own, heavier program (it also hosts the animals' probe); everything else stays lean
  if (bio) { const P = progs[GROUND_ID[sc.ground] * 2 + (s.close ? 1 : 0) + 64]; if (P && P.failed) { bio = 0; s.bioFailed = true; } }   // a device that cannot build it: the world without its imagined life
  if (!useProg(GROUND_ID[sc.ground], s.close ? 1 : 0, bio)) return false;
  if (texScene !== s) { uploadTextures(s); texScene = s; }
  const vw = Math.round(glc.width * scale), vh = Math.round(glc.height * scale);
  gl.viewport(0, 0, vw, vh);
  if (strip) { const y0 = Math.floor(vh * strip[0] / strip[1]); gl.enable(gl.SCISSOR_TEST); gl.scissor(0, y0, vw, Math.floor(vh * (strip[0] + 1) / strip[1]) - y0); }
  const f1 = (n, v) => gl.uniform1f(U[n], v), f3 = (n, v) => gl.uniform3fv(U[n], v);
  gl.uniform2f(U.uRes, vw, vh); f1("uTime", time / 1000);
  f1("uMode", s.close ? 1 : 0); f1("uF", s.camG.f * scale); f1("uYaw", s.yawDeg * D2R); f1("uPitch", s.pitch * D2R); f1("uCamH", s.camH);
  f3("uS1Dir", dirOf(0, Lt.es)); f3("uS1Col", s.sun1); f1("uS1Rad", s.w.angDeg / 2 * D2R);
  f1("uS2On", s.s2 ? 1 : 0); if (s.s2) { f3("uS2Dir", s.s2.dir); f3("uS2Col", s.s2.col); f1("uS2Rad", s.s2.rad); }
  f3("uAmb", s.ambient); f3("uBounce", s.bounce);
  f3("uRockA", A.rockA); f3("uRockB", A.rockB); f3("uDustCol", A.dust); f3("uFrostCol", A.frost); f3("uIceCol", A.ice); f3("uIceBlue", A.blueice); f3("uWaterCol", A.water); f3("uPlantCol", A.plant); f3("uCloudCol", A.cloud); f3("uDeckA", A.deckA); f3("uDeckB", A.deckB); f3("uGlow", s.glow);
  s.hazeU = Math.max(sc.ground === "clouds" ? 0.4 : 0, (Lt.tau * 1.5 + Lt.dust * 2) * (sc.ground === "clouds" ? 1.4 : 1)) * (dial >= 3 && life >= 2 ? rc.hazeMul || 1 : 1); f1("uHaze", s.hazeU);   // cloud decks always fade into haze toward the horizon: there is no hard edge to a sea of cloud
  f1("uGround", GROUND_ID[sc.ground]); f1("uRelief", dial >= 3 ? 1 : 0); f1("uReliefM", rc.reliefM);
  f1("uRockDen", rc.rockDen); f1("uDust", rc.dust); f1("uFrost", dial >= 2 ? rc.frost : 0); f1("uStrata", dial >= 3 ? rc.strata : 0);
  f1("uLand", sc.ground === "ocean" ? (s.landClose ? 2 : sc.land === 1 || sc.oceanDeg ? 1 : sc.land === -1 ? -1 : 0) : 0); f1("uPlants", dial >= 3 && life >= 2 && (sc.plants || rc.raft) ? 1 : 0); f1("uBloom", dial >= 3 && life >= 1 ? rc.mats || 0 : 0);
  f1("uClouds", dial >= 3 && Lt.atmOn ? rc.clouds : 0); f1("uClouds2", dial >= 3 && Lt.atmOn ? rc.clouds2 : 0); f1("uAir", Lt.atmOn ? 1 : 0);
  f1("uRain", dial >= 2 && sc.weather === "rain" && !rc.dryW ? 1 : 0); f1("uUnknown", s.ground ? 0 : 1); f1("uFloes", dial >= 3 && sc.floes ? 1 : 0); f1("uLayerOn", s.close ? 0 : 1);
  f1("uScaleH", s.scaleH); f1("uStreak", sc.streak || 0); f1("uLandform", dial >= 3 ? rc.landform : 0);
  const gY = 0.2126 * s.glow[0] + 0.7152 * s.glow[1] + 0.0722 * s.glow[2];   // a self-luminous deck (young giants): the eye adapts to its glow
  f1("uExpo", (s.ground && (sc.ground === "clouds" || sc.ground === "ice") ? 0.72 : 1) * (sc.ground === "clouds" && gY > 0.35 ? 0.35 / gY : 1));
  f1("uWet", dial >= 2 && s.ground && sc.weather === "rain" && !rc.dryW ? 1 : 0); f1("uSnow", dial >= 2 && s.ground && (sc.weather === "snow" || (sc.Tstand && sc.Tstand < 268)) ? 0.75 : 0);
  gl.uniform2fv(U.uJit, jit); f1("uGlowAll", s.glowAll || 0); f1("uClear", s.clear || 0); const pOn = dial >= 3 && life >= 2 && sc.plants; f1("uForest", pOn ? rc.forest || 0 : 0); f1("uSav", pOn ? rc.sav || 0 : 0); f1("uCover", pOn ? rc.cover ?? 0.8 : 0); f1("uShrubDen", pOn ? rc.shrubDen ?? 0.8 : 0); f1("uDry", rc.dry || 0); f1("uCoast", dial >= 3 ? rc.coast || 0 : 0);
  { const b = rc.bio, pl = dial >= 3 && life >= 2 && b, z4 = [0, 0, 0, 0], noTree = s.landClose || s.plantSil, { sp, t1, t2, t3 } = s.lone;   // sp: the Speculative stop's forms
    gl.uniform4fv(U.uTree1, pl && !noTree ? t1 : z4); gl.uniform4fv(U.uTree2, b ? t2 : [1, 1, 10, 300]); gl.uniform4fv(U.uTree3, pl && !s.plantSil ? t3 : z4);
    gl.uniform4fv(U.uSpec, sp ? [sp.forest, sp.glow, sp.silver, 0] : z4); if (sp) { f3("uPlantCol", A.plantS); } gl.uniform4fv(U.uBio1, pl ? b.bio1 : z4); gl.uniform4fv(U.uBio2, b && dial >= 3 && life >= 1 ? (pl ? b.bio2 : [b.bio2[0], 0, 0, 0]) : z4);
    f3("uGrassCol", A.grass || A.plant); f3("uFlowerCol", A.flower || A.plant); f3("uBarkCol", A.bark || A.rockB); f3("uPlant2", sp ? A.plant2S : A.plant2 || A.plant); f3("uLichenCol", A.lichen || A.rockA); f3("uPlant3", A.accent || A.plant);
    gl.uniform4fv(U.uCan1, pl && !noTree ? (sp ? [b.can1[0], b.can1[1], b.can1[2] * sp.hMul, sp.can] : b.can1) : [0, 4, 10, 0]); gl.uniform4fv(U.uCan2, b ? b.can2 : [0, 300, 500, 0]); gl.uniform4fv(U.uBio3, b && dial >= 3 ? [pl ? b.bio3[0] : 0, b.bio3[1], b.bio3[2], 0] : z4); } f1("uCoastOff", dial >= 3 ? rc.coastOff || 0 : 0); f1("uTall", rc.tall || 1); f1("uTide", rc.tide || 1); f1("uMats", dial >= 3 && life >= 1 ? rc.mats || 0 : 0); f1("uShrub", rc.shrub || 1); f1("uAur", dial >= 2 ? s.aur || 0 : 0); f3("uMatCol", A.mat || A.plant); f3("uAurCol", s.aurCol || [0, 0, 0]); f1("uPatch", dial >= 3 ? s.patch || 0 : 0); f3("uDeckC", A.deckC || A.deckA); f1("uG", s.w.g / 9.81); f1("uAccent", dial >= 2 ? rc.accent : 0); f1("uSlab", dial >= 3 ? rc.slab : 0); f3("uRockC", A.rockC); f1("uCrust", Math.max(0.08, Math.min(0.92, (2300 - (s.Tloc || 2000)) / 700)));   // the cooler the melt, the more of it is chilled crust
  gl.uniform4fv(U.uStyle, rc.style); f3("uVolc", dial >= 3 ? rc.volc : [0, 0, 0]); gl.uniform2fv(U.uSeed, rc.seed); gl.uniform2fv(U.uWind, rc.wind); gl.uniform2fv(U.uLandDir, rc.landDir);
  gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, skyTexGL); gl.uniform1i(U.uSky, 0);
  gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, layerTexGL); gl.uniform1i(U.uLayer, 1);
  f1("uProbe", probe ? 1 : 0);
  if (typeof probe === "function") { probe(probeGround); f1("uProbe", 0); gl.viewport(0, 0, vw, vh); return true; }   // any other question about the ground (e.g. what a click hit)
  if (probe) { const tp = performance.now(); s.fauna = placeFauna(s, probeGround); probeMs += performance.now() - tp; FAUNA_CACHE.set(s.faunaKey, s.fauna); f1("uProbe", 0); gl.viewport(0, 0, vw, vh); return true; }
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  gl.disable(gl.SCISSOR_TEST);
  return true;
}
// ground height, slope and forest cover at any list of spots ({x, z} in metres from where you stand), from the probe program:
// two spots per animal slot in each 1-pixel-high pass
// the lone plants a scene has: types, cover, heights and spacing (shared by the shader and the painted silhouettes)
function lonePlants(rc, sc) {
  const b = rc.bio, pl = !!(dial >= 3 && life >= 2 && b), sp = pl && life >= 3 && sc.plants ? rc.spec : null;
  let t1 = b ? b.tree1 : [0, 0, 0, 0], t2 = b ? b.tree2 : [1, 1, 10, 300], t3 = b ? b.tree3 : [0, 0, 0, 0];
  if (sp && sp.lone) { const has = b.tree1[3] > 0, k = sp.hMul * (sp.lone === 10 ? 1.4 : 1), h0 = has ? Math.max(b.tree2[0], b.tree2[1]) : 7;   // lone plants take the speculative form; where the biome had none, a sparse scatter
    t1 = [sp.lone, sp.alt || sp.lone, sp.alt && sp.alt !== sp.lone ? 0.5 : 0, has ? b.tree1[3] : 0.25]; t2 = [h0 * k, h0 * k, has ? b.tree2[2] : 16, b.tree2[3]]; t3 = [has ? b.tree3[0] : 0.6, Math.min(1400, h0 * k * 70), h0 * k * 1.6 + 1.5, b.tree3[3]]; }
  return { pl: pl && !!sc.plants, sp, t1, t2, t3 };
}
function probeGround(pts, top = 1) {
  gl.uniform1f(U.uProbeTop, top);
  const scis = gl.isEnabled(gl.SCISSOR_TEST); gl.disable(gl.SCISSOR_TEST);
  const P2 = AN_MAX * 2, res = [];
  for (let k = 0; k < pts.length; k += P2) { const part = pts.slice(k, k + P2), d = new Float32Array(AN_MAX * 4), px = new Uint8Array(P2 * 4); part.forEach((p, i) => { d[i * 2] = p.x; d[i * 2 + 1] = p.z; });
    gl.uniform4fv(U.uAn, d); gl.viewport(0, 0, P2, 1); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); gl.readPixels(0, 0, P2, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    part.forEach((p, i) => res.push({ h: (px[i * 4] * 256 + px[i * 4 + 1]) / 65535 * 4000 - 1000, slope: (px[i * 4 + 2] & 127) / 127, seen: px[i * 4 + 2] >= 128, eco: px[i * 4 + 3] / 255 })); }
  if (scis) gl.enable(gl.SCISSOR_TEST);
  return res;
}
function uploadTextures(s) {
  gl.bindTexture(gl.TEXTURE_2D, skyTexGL); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, s.TW, s.TH, 0, gl.RGBA, gl.UNSIGNED_BYTE, s.tex);
  gl.bindTexture(gl.TEXTURE_2D, layerTexGL); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s.layer);
}

