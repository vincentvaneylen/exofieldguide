// Level 2: globe
// ================= Level 2: globe =================
let globeHere = null, globeGeo = null, miniKey = "";
let GLOBE_K = 1, GLOBE_Y = 0.514;   // the whole-planet globe's size and centre height (v2 shrinks and lifts it to clear the header and the panel); small renders keep 1 and 0.514
function globeMaterial(w, sc, rc, n, detailOn) {
  const mu0 = n[0], th = Math.acos(Math.max(-1, Math.min(1, mu0))) / D2R;
  const nz = detailOn ? fbm(n[0] * 4 + 7 + rc.seed[0] * 1e-3, n[1] * 4, n[2] * 4) : 0.5;
  if (dial < sc.base && w.id !== "hd189") return { r: MAT.grey, mod: 1, cloud: false, glowT: 0 };
  let r = MAT.grey, cloud = false, glowT = 0, mod = 1;
  switch (sc.ground) {
    case "rock": r = rc.rockA; mod = detailOn ? 0.7 + 0.6 * nz : 1; break;
    case "regolith": r = rc.rockA; mod = detailOn ? 0.8 + 0.4 * nz : 1; break;
    case "ice": r = MAT.ice; mod = detailOn ? 0.9 + 0.15 * nz : 1; break;
    case "ocean": {
      if (sc.land === 1) { r = nz > 0.52 ? (rc.plantMat && detailOn && nz < 0.6 ? mixS(rc.rockA, rc.plantMat, 0.5) : rc.rockA) : MAT.ocean; if (Math.abs(n[2]) > Math.sin((sc.iceLat || 58) * D2R)) r = MAT.ice; }
      else if (sc.land === -1) r = MAT.ocean;
      else { const edge = sc.oceanDeg + (detailOn ? 14 * (nz - 0.5) : 0); r = th < edge ? MAT.ocean : MAT.ice; }
      if (detailOn) cloud = sc.land ? fbm(n[0] * 5 + 3, n[1] * 5 + 1, n[2] * 5) < (sc.clouds || 0) * 0.8 : (th < 70 ? fbm(n[0] * 5 + 3, n[1] * 5 + 1, n[2] * 5) < (sc.clouds || 0) * 0.75 * Math.pow(Math.max(0, mu0), 0.4) + 0.04 : fbm(n[0] * 5, n[1] * 5 + 9, n[2] * 5) > 0.72);
      break; }
    case "lava": { const Tsub = w.star.Teff / Math.sqrt(w.aR), T = mu0 > 0 ? Tsub * Math.pow(mu0, 0.25) : 50; r = rc.rockA; if (T > 1600) glowT = T * (detailOn && nz > 0.6 ? 0.9 : 1); mod = detailOn ? 0.8 + 0.4 * nz : 1; break; }
    case "clouds": { const band = 0.5 + 0.5 * Math.sin(Math.asin(n[2]) * 10 + 1.5 * fbm(n[0] * 3, n[1] * 3, n[2] * 3)); r = mixS(MAT[sc.deck], MAT[sc.deckB || sc.deck], detailOn ? band : 0.3); break; }
  }
  return { r, mod, cloud, glowT };
}
// gas and haze worlds (not Venus-like rocky planets) are drawn by the giant-planet model
const isGiantScene = sc => sc.ground === "clouds" && sc.deck !== "h2so4";
function giantOf(w, sc) {   // the giant model for this planet; a possible world can ask for a variant ("bright" or "dark" clouds)
  if (sc === undefined) sc = typeof si !== "undefined" && cur === w ? w.scenarios[si] : w.scenarios && w.scenarios[0];
  const v = (sc && sc.giantVar) || ""; w._gpv = w._gpv || {};
  if (!w._gpv[v]) { const p = { locked: w.locked, age: w.age, group: w.solar ? "solar" : undefined, name: w.name, Teff: w.star.Teff, Rs: w.star.Rs, Ms: w.star.M || 1, a: w.a, P: w.P, Rp: w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, Mp: w.Mu === "MJ" ? w.Mp * 317.8 : w.Mp, rings: w.rings, variant: v }; p.m = GIANT.model(p); w._gpv[v] = p; }
  return (w._gp = w._gpv[v]);
}
const giantGlobes = new Map();   // the CPU-rendered giant globe, kept per planet and setting (rendering one takes about 0.3 s)
function renderGiantGlobe(w, sc, small = false) {
  const c = ctx2, gp = giantOf(w), m = gp.m, key = [w.id || w.name, si, dial, earthEye, small].join("|");
  GIANT.set({ showIm: dial >= 3, earthEye });
  const D = Math.round(H * 0.92); let off = giantGlobes.get(key);
  if (!off) { off = document.createElement("canvas"); off.width = off.height = D; GIANT.render(gp, off, small ? 170 : 340); giantGlobes.set(key, off); if (giantGlobes.size > 24) giantGlobes.delete(giantGlobes.keys().next().value); }   // small: for the corner globe and the system-view tint
  const Dd = small ? Math.min(D, W * 0.98) : D * GLOBE_K, Cy = small ? H / 2 : H * GLOBE_Y; c.fillStyle = "#000"; c.fillRect(0, 0, W, H); c.drawImage(off, W / 2 - Dd / 2, Cy - Dd / 2, Dd, Dd);
  {   // same view geometry as GIANT.render: star along +x, seen at a phase angle, screen up along the orbit normal
    const ph = (m.locked ? 62 : 38) * D2R, lift = 10 * D2R, f = [Math.cos(ph) * Math.cos(lift), Math.sin(ph) * Math.cos(lift), Math.sin(lift)];
    let u = [-f[0] * f[2], -f[1] * f[2], 1 - f[2] * f[2]]; const ul = Math.hypot(...u); u = u.map(v => v / ul);
    const rr = [u[1] * f[2] - u[2] * f[1], u[2] * f[0] - u[0] * f[2], u[0] * f[1] - u[1] * f[0]];
    globeGeo = { cx: W / 2, cy: Cy, R: Dd / 2 * (m.rings ? 0.42 : 0.86), rr, u, f };
  }
  const px = off.getContext("2d").getImageData(D * 0.42, D * 0.5, 1, 1).data; tintCache = [px[0], px[1], px[2]];
  globeHere = null;
  const tag = n => n.lvl === 0 ? 0 : n.lvl === 1 ? 1 : n.lvl === 2 ? 2 : 3;
  m.notes.filter(n => ["Clouds", "Methane", "Spin", "Day / night", "Glow", "Measured", "Rings", "Shape"].includes(n.k)).slice(0, 5)
    .forEach((n, i) => callouts.push({ legend: true, t: `${n.k}: ${n.t.replace(/<[^>]+>/g, "")}`, lvl: tag(n), quiet: i > 1 }));
}
// lamDeg: the longitude (from the point under the star) the globe is seen from; 95° shows the day–night line
function renderGlobe(lamDeg = 95, small = false) {
  const w = cur, here = curSc(), sc0 = w.scenarios[si];
  // the whole planet keeps its scenario
  const sc = { ...sc0, theta: here.theta, lat: here.lat };
  if (isGiantScene(sc)) { renderGiantGlobe(w, sc, small); return; }
  const rc = recipe(w, sc), c = ctx2;
  c.fillStyle = "#000"; c.fillRect(0, 0, W, H);
  const N = 300, img = c.createImageData(N, N), data = img.data;
  const M = earthEye ? XYZ2RGB : w.adapt, S = w.spec, dil = w.dil, k = 1 / (toXYZ(S)[1] * dil);
  const atm = sc.atm && dial >= sc.base ? 0.097 * sc.atm.P * gasFac(sc.atm.gas) * (9.81 / w.g) : 0;
  const lam = lamDeg * D2R, bet = 14 * D2R;
  const f = [Math.cos(bet) * Math.cos(lam), Math.cos(bet) * Math.sin(lam), Math.sin(bet)];
  let rr = [-f[1], f[0], 0]; const rl = Math.hypot(...rr); rr = rr.map(v => v / rl);
  const u = [f[1] * rr[2] - f[2] * rr[1], f[2] * rr[0] - f[0] * rr[2], f[0] * rr[1] - f[1] * rr[0]];
  const detailOn = dial >= 3, cosT = -f[0], ph = 0.75 * (1 + cosT * cosT) / 4;
  let sumC = [0, 0, 0], nC = 0;
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = (2 * i + 1) / N - 1, y = 1 - (2 * j + 1) / N, q = x * x + y * y, o = 4 * (j * N + i);
    if (q > 1) { data[o + 3] = 0; continue; }
    const z = Math.sqrt(1 - q), n = [x * rr[0] + y * u[0] + z * f[0], x * rr[1] + y * u[1] + z * f[1], x * rr[2] + y * u[2] + z * f[2]];
    const mu0 = n[0], muv = Math.max(0.03, z);
    const g = globeMaterial(w, sc, rc, n, detailOn);
    let X = 0, Y = 0, Z = 0;
    if (mu0 > 0 && dial >= (w.id === "hd189" ? 0 : 1)) {
      const rm = g.cloud ? MAT.cloud : g.r, tauL = g.cloud ? atm * 0.3 : atm, m = 1 / mu0 + 1 / muv;
      for (let b = 0; b < NB; b++) {
        const t = tauL * RAYL[b], att = Math.exp(-t * m);
        const rad = S[b] * dil * (rm[b] * g.mod * mu0 * att + ph * mu0 / (mu0 + muv) * (1 - att));
        X += rad * CX[b]; Y += rad * CY[b]; Z += rad * CZ[b];
      }
    } else if (mu0 > 0) { const v = toXYZ(S)[1] * dil * 0.3 * mu0; X = v * 0.95; Y = v; Z = v * 1.09; }
    if (g.glowT) { const th = toXYZ(spec(l => planck(l, g.glowT))); X += th[0]; Y += th[1]; Z += th[2]; }
    const col = clip(mv(M, [X * k, Y * k, Z * k]).map(v => Math.max(0, v)));
    if (mu0 > 0.3) { sumC = sumC.map((v, ii) => v + col[ii]); nC++; }
    data[o] = 255 * gam(col[0]); data[o + 1] = 255 * gam(col[1]); data[o + 2] = 255 * gam(col[2]); data[o + 3] = 255 * Math.min(1, (1 - Math.sqrt(q)) * N * 0.5);
  }
  if (nC) tintCache = sumC.map(v => 255 * gam(v / nC));
  const off = document.createElement("canvas"); off.width = off.height = N; off.getContext("2d").putImageData(img, 0, 0);
  const D = (small ? Math.min(W, H) : H) * 0.84 * (small ? 1 : GLOBE_K), gx = W / 2 - D / 2, gy = (small ? 0.514 : GLOBE_Y) * H - D / 2;
  c.imageSmoothingQuality = "high"; c.drawImage(off, gx, gy, D, D);
  globeGeo = { cx: W / 2, cy: gy + D / 2, R: D / 2, rr, u, f };
  if (cutaway && sc.layers) {
    const cx = W / 2, cy = gy + D / 2, R = D / 2;
    sc.layers.forEach(([fr, col]) => { c.fillStyle = col; c.beginPath(); c.moveTo(cx, cy - R * fr); c.arc(cx, cy, R * fr, -Math.PI / 2, Math.PI / 2); c.closePath(); c.fill(); });
    c.strokeStyle = "rgba(231,228,220,0.5)"; c.beginPath(); c.moveTo(cx, cy - R - 6); c.lineTo(cx, cy + R + 6); c.stroke();
    sc.layers.forEach(([fr, col, nm], i) => { const nx = sc.layers[i + 1] ? sc.layers[i + 1][0] : 0, rm = R * (fr + nx) / 2; callouts.push({ x: cx + rm * 0.7, y: cy - rm * 0.7 + i * 8, t: nm, lvl: w.gasGiant || sc.ground === "lava" ? 1 : 2 }); });
    callouts.push({ x: cx - R * 0.6, y: gy + D + 2, t: "interior layers: model, not to scale", lvl: 1, quiet: true });
  }
  const sx = rr[0], sy = u[0], a = Math.atan2(-sy, sx);
  c.fillStyle = css(disp(w.white, M, 0.9 / w.white[1])); c.beginPath(); c.arc(W / 2 + Math.cos(a) * (D / 2 + 34), gy + D / 2 + Math.sin(a) * (D / 2 + 34), 9, 0, 7); c.fill();
  callouts.push({ x: W / 2 + Math.cos(a) * (D / 2 + 34), y: gy + D / 2 + Math.sin(a) * (D / 2 + 34), t: `toward ${w.star.name}`, lvl: 0, quiet: true });
  const tt = sc.theta * D2R, bb = sc.lat * D2R, pn = [Math.cos(tt) * Math.cos(bb), Math.sin(tt) * Math.cos(bb), Math.sin(bb)];
  const vx = pn[0] * rr[0] + pn[1] * rr[1] + pn[2] * rr[2], vy = pn[0] * u[0] + pn[1] * u[1] + pn[2] * u[2], vz = pn[0] * f[0] + pn[1] * f[1] + pn[2] * f[2];
  if (!cutaway) {
    const unk = dial < sc.base && w.id !== "hd189";
    const label = unk ? "surface unknown at this setting" : { ocean: sc.land === 1 ? "oceans and continents (scenario)" : sc.land === -1 ? "a global ocean (scenario)" : "ocean facing the star, ice beyond (scenario)", ice: "global ice (scenario)", rock: sc.base === 1 ? "bare dark rock (favoured)" : "bare rock (scenario)", regolith: "oxidised dust (scenario)", lava: "molten dayside, glowing (model)", clouds: sc.deck === "hd189" ? "measured colour: deep blue" : "cloud deck (model)" }[sc.ground];
    callouts.push({ x: W / 2 - D * 0.15, y: gy + D * 0.45, t: label, lvl: unk ? 0 : sc.ground === "clouds" && sc.deck === "hd189" ? 0 : sc.base });
    if (cur.locked) callouts.push({ x: W / 2 + D * 0.38, y: gy + D * 0.75, t: "night side: the star never rises here", lvl: 1, quiet: true });
  }
}

