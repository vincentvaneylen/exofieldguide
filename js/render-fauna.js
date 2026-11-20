// The Animals stop as a spectacle, the way a wildlife film or a painted savanna would show it: low golden light, the land crowded with
// herds from the foreground to the far ridges, the sky full of flocks and giant gliders, the sea alive with pods and feeding frenzies.
// The body plans come from the planet's rules (scene-animals.js); where they stand comes from a probe pass in the shader that marches a ray
// from your eye to each candidate spot, so every animal stands on ground you can actually see. Everything is drawn in 2D over the rendered
// landscape (the fliers into the sky layer, behind terrain): no extra shader, little extra time. Placement is seeded per spot.
const FAUNA_CACHE = new Map();
let aimFauna = false;   // set when the dial reaches Animals: the view then turns to where the life is

// how much life this spot shows: 0 calm, 1 rich, 2 teeming. Life is the point of this stop: most spots teem, a few are merely rich, almost
// none calm; the odds lean further toward teeming where usable light and the biome's productivity are high
function faunaMode(s) { const R = rng(strHash(s.faunaKey + "|mode")), x = R(), p = s.rc.anim.prod ?? 0.5; return x < 0.05 ? 0 : x < 0.42 - 0.22 * p ? 1 : 2; }
const locked = s => !!(s.sc.climate && s.sc.climate.locked) || !!(s.w.locked && s.sc.term);
// ---- placement: all the way around you, fixed in the world, so every direction you turn has its share and turning never reshuffles it
function placeFauna(s, probe) {
  const an = s.rc.anim, wantA = s.faunaWant && an && an.ok, R = rng(strHash(s.faunaKey + "|fauna")), mode = wantA ? faunaMode(s) : 1, out = { items: [], plan: an, mode };
  const P0 = probe([{ x: 0, z: 0 }])[0], eyeY = s.camH + (s.sc.land === 1 || s.sc.oceanDeg ? Math.max(0, P0.h - 0.9) : 0);   // inland, the camera stands on the ground
  out.eyeY = eyeY;
  const at = (az, d) => ({ az, d, x: Math.sin(az * D2R) * d, z: Math.cos(az * D2R) * d });
  const look = (pts, topM) => { const r = probe(pts, topM); return pts.map((p, i) => ({ ...p, ...r[i] })); };
  const DS = [22, 29, 38, 49, 63, 82, 106, 138, 180, 235, 305, 400, 520, 680], grid = [];
  for (let a = 0; a < 360; a += 3) DS.forEach((d, j) => grid.push({ ...at(a + (R() - 0.5) * 1.5, d * (0.94 + 0.12 * R())), a, area: 3 * D2R * d * d * 0.27 }));
  const G = look(grid, 0.8), L = G.filter(r => r.seen && r.h > -0.3 && r.slope < 0.6 && r.eco < 0.6), Wt = G.filter(r => r.seen && r.h < -1.5), Sh = G.filter(r => r.seen && r.h > -0.6 && r.h < 0.15);
  const pickW = (arr, wf) => { const ws = arr.map(wf), tot = ws.reduce((a, b) => a + b, 0); let x = R() * tot; for (let i = 0; i < arr.length; i++) if ((x -= ws[i]) <= 0) return arr[i]; return arr[arr.length - 1]; };
  // lone plants: as many as the biome's cover and spacing give for the ground each spot stands for
  if (s.plantSil) { const [ta, tb, mix, dens] = s.lone.t1, spc = Math.max(4, s.lone.t2[2] || 16); let nT = 0;
    for (const p of L) { if (p.eco > 0.3 || p.h < 0.3 || p.slope > 0.45) continue; const e = dens * p.area / (spc * spc); let n = Math.min(6, Math.floor(e) + (R() < e % 1 ? 1 : 0));
      for (let i = 0; i < n && nT < 1600; i++, nT++) { const b = at(p.az + (R() - 0.5) * 3, p.d * (0.87 + 0.26 * R())), ty = R() < mix ? tb : ta; out.items.push({ k: "tree", ty, x: b.x, z: b.z, h: p.h, hm: (ty === tb && mix ? s.lone.t2[1] : s.lone.t2[0]) * (0.65 + 0.7 * R()) * (ty === 10 ? 0.6 : 1), ph: R(), face: R() < 0.5 ? -1 : 1 }); } } }
  if (!wantA) return out;
  const ice = s.sc.ground === "ice", T = Math.round([160, 480, 1000][mode] * Math.max(0.5, Math.min(1.4, an.herdN / 20)) * (ice ? 0.6 : 1));
  // land: herds where a clumpy density field is high; far spots stand for more ground, so they hold more (and smaller-looking) animals
  if (!an.sea && L.length) {
    const cen = Array.from({ length: [6, 18, 32][mode] }, () => ({ c: L[Math.floor(R() * L.length)], r: 0.3 + 0.5 * R(), w: 5 + 7 * R(), sp: R() < 0.7 ? 0 : 1, face: locked(s) ? (R() < 0.8 ? 1 : -1) : R() < 0.5 ? -1 : 1, graze: 0.3 + 0.4 * R() }));
    const da = (a, b) => ((a - b + 540) % 360) - 180;
    const near = p => { let bi = 0, bv = 0; cen.forEach((q, i) => { const x = da(p.a, q.c.a) / q.w, y = Math.log(p.d / q.c.d) / q.r, v = Math.exp(-(x * x + y * y)); if (v > bv) { bv = v; bi = i; } }); return [cen[bi], bv]; };
    const wts = L.map(q => (Math.pow(near(q)[1], 0.6) + 0.06) * (0.35 + q.d / 160) * Math.min(1, Math.pow(q.d / 90, 1.5)));   // fewer close by, where each animal is large: a herd should read as many animals, not a wall
    const pick = () => { const tot = wts.reduce((a, b) => a + b, 0); let x = R() * tot; for (let i = 0; i < L.length; i++) if ((x -= wts[i]) <= 0) return L[i]; return L[L.length - 1]; };
    for (let i = 0; i < T; i++) { const p = pick(), [q] = near(p), b = at(p.az + (R() - 0.5) * 2.5, p.d * (0.9 + 0.2 * R()));
      out.items.push({ k: "land", sp: q.sp, x: b.x, z: b.z, h: Math.max(p.h, -0.25), face: R() < 0.88 ? q.face : -q.face, pose: R() < q.graze ? "graze" : R() < 0.85 ? "walk" : "alert", sz: R() < 0.15 ? 0.55 : 0.85 + 0.3 * R(), ph: R() }); }
    // low flocks of small birds over the herds
    for (let f = 0; f < [2, 6, 12][mode]; f++) { const c = pick(); for (let i = 0; i < 10 + Math.floor(R() * 25); i++) { const b = at(c.az + (R() - 0.5) * 4, c.d * (0.9 + 0.2 * R())); out.items.push({ k: "bird", x: b.x, z: b.z, h: 2 + 14 * R(), sz: 0.4 + 0.3 * R(), ph: R() }); } }
  }
  // water: pods of swimmers with spouts, breaching giants, and feeding frenzies where birds dive on schools
  if (Wt.length) {
    const sw = an.sea ? an.size : Math.max(6, an.size * 3), k0 = an.sea ? 2.2 : 1;
    for (let p = 0; p < Math.round([3, 8, 16][mode] * k0); p++) { const c = pickW(Wt, q => 0.3 + q.d / 200), n = 3 + Math.floor(R() * (an.sea ? 12 : 7));
      for (let i = 0; i < n; i++) { const b = at(c.az + (R() - 0.5) * 3.5, c.d * (0.9 + 0.25 * R())); out.items.push({ k: "swim", x: b.x, z: b.z, h: 0, face: R() < 0.5 ? -1 : 1, spout: R() < 0.35, sz: sw * (0.6 + 0.6 * R()), ph: R() }); } }
    for (let i = 0; i < Math.round([1, 2, 4][mode] * k0); i++) { const c = Wt.filter(q => q.d > 40 && q.d < 260); if (!c.length) break; const q = c[Math.floor(R() * c.length)]; out.items.push({ k: "breach", x: q.x, z: q.z, h: 0, face: R() < 0.5 ? -1 : 1, sz: sw * 1.3, ph: R() }); }
    for (let f = 0; f < Math.round([1, 3, 6][mode] * k0); f++) { const c = pickW(Wt, q => (q.d > 35 && q.d < 450 ? 1 : 0.05)); out.items.push({ k: "frenzy", x: c.x, z: c.z, h: 0, sz: 10 + 14 * R(), ph: R() });
      for (let i = 0; i < 30 + Math.floor(R() * 60); i++) { const b = at(c.az + (R() - 0.5) * 14, c.d * (0.8 + 0.4 * R())); out.items.push({ k: "bird", x: b.x, z: b.z, h: 1 + 16 * R() ** 1.7, sz: 0.8 + 0.6 * R(), ph: R(), dive: R() < 0.25 }); } }
  }
  // waders in flocks on the flats and shallows
  if (Sh.length && s.sc.atm && s.sc.atm.P >= 0.5) for (let f = 0; f < [2, 5, 10][mode]; f++) { const c = pickW(Sh, q => q.d < 180 ? 1 : 0.1), fc = R() < 0.5 ? -1 : 1;
    for (let i = 0; i < 8 + Math.floor(R() * 26); i++) { const b = at(c.az + (R() - 0.5) * 5, c.d * (0.88 + 0.24 * R())); out.items.push({ k: "wader", x: b.x, z: b.z, h: Math.max(c.h, -0.2), face: R() < 0.85 ? fc : -fc, sz: 0.5 + 0.4 * R(), ph: R() }); } }
  return out;
}
// ---- painted plants, in metres: x across, ground at y = 0, up is negative. Ten forms, matching the shader's: 1 broadleaf, 2 conifer, 3 umbrella,
// 4 palm, 5 column succulent, 6 mangrove, 7 cushion bush, 8 low-gravity spire, 9 high-gravity cushion-tree, 10 star-facing dish
function treePaths(ty, H, ph) {
  const trunk = new Path2D(), crown = new Path2D(), inner = new Path2D(), RR = rng(Math.floor(ph * 1e6) + 7), tw = H * (ty === 9 ? 0.12 : ty === 8 ? 0.03 : 0.05);
  const stem = (top, lean = 0) => { trunk.moveTo(-tw, 0); trunk.quadraticCurveTo(-tw * 0.7 + lean * 0.5, -top * 0.5, -tw * 0.45 + lean, -top); trunk.lineTo(tw * 0.45 + lean, -top); trunk.quadraticCurveTo(tw * 0.7 + lean * 0.5, -top * 0.5, tw, 0); trunk.closePath(); };
  const blobs = (cx, cy, rx, ry, n) => { for (let i = 0; i < n; i++) { const u = RR() * 6.283, q = Math.sqrt(RR()); crown.moveTo(cx + Math.cos(u) * q * rx + ry * 0.55, cy + Math.sin(u) * q * ry); crown.arc(cx + Math.cos(u) * q * rx, cy + Math.sin(u) * q * ry, ry * (0.45 + 0.25 * RR()), 0, 6.283); } };
  if (ty === 2) { stem(H * 0.25); for (let i = 0; i < 6; i++) { const y = -H * (0.15 + i * 0.14), w = H * 0.24 * (1 - i / 6.5); crown.moveTo(-w, y); crown.lineTo(0, y - H * 0.24); crown.lineTo(w, y); crown.closePath(); } }
  else if (ty === 3) { stem(H * 0.72, H * 0.06); blobs(H * 0.06, -H * 0.8, H * 0.55, H * 0.1, 9); }
  else if (ty === 4) { const lean = (RR() - 0.5) * H * 0.3; stem(H, lean); for (let i = 0; i < 8; i++) { const a = -2.6 + i * 0.75 + RR() * 0.2, L = H * 0.38; crown.moveTo(lean, -H); crown.quadraticCurveTo(lean + Math.cos(a) * L * 0.6, -H + Math.sin(a) * L * 0.6 - L * 0.3, lean + Math.cos(a) * L, -H + Math.sin(a) * L + L * 0.25); crown.quadraticCurveTo(lean + Math.cos(a) * L * 0.6, -H + Math.sin(a) * L * 0.6 - L * 0.18, lean, -H + 0.02 * H); crown.closePath(); } }
  else if (ty === 5) { const w = H * 0.08; crown.moveTo(-w, 0); crown.lineTo(-w, -H + w); crown.arc(0, -H + w, w, Math.PI, 0); crown.lineTo(w, 0); crown.closePath();
    [-1, 1].forEach(sd => { const y = -H * (0.35 + 0.2 * RR()), ex = sd * H * 0.24, w2 = w * 0.75; crown.moveTo(sd * w * 0.5, y); crown.lineTo(ex, y); crown.lineTo(ex, y - H * 0.25); crown.arc(ex - sd * w2 * 0 , y - H * 0.25, w2, Math.PI, 0); crown.lineTo(ex + sd * w2 * 0, y + w2); crown.lineTo(sd * w * 0.5, y + w2 * 1.6); crown.closePath(); }); }
  else if (ty === 6) { for (let i = -3; i <= 3; i++) { trunk.moveTo(i * H * 0.08, 0); trunk.quadraticCurveTo(i * H * 0.06, -H * 0.25, 0, -H * 0.3); trunk.lineTo(H * 0.015, -H * 0.3); trunk.quadraticCurveTo(i * H * 0.06 + H * 0.02, -H * 0.24, i * H * 0.08 + H * 0.02, 0); trunk.closePath(); } stem(H * 0.6); blobs(0, -H * 0.72, H * 0.4, H * 0.16, 9); }
  else if (ty === 7) blobs(0, -H * 0.45, H * 0.8, H * 0.45, 7);
  else if (ty === 8) {   // low gravity: a slender stem far taller than any Earth tree, with whorls of drooping fronds and a feathery plume
    stem(H, (RR() - 0.5) * H * 0.06);
    for (let i = 0; i < 6; i++) { const y = -H * (0.34 + i * 0.11), L = H * (0.28 - i * 0.03);
      for (const sd of [-1, 1]) for (let j = 0; j < 2; j++) { const lx = sd * L * (0.85 + 0.3 * j), droop = L * (0.5 + 0.2 * j); crown.moveTo(0, y); crown.quadraticCurveTo(lx * 0.5, y - L * 0.25, lx, y + droop); crown.quadraticCurveTo(lx * 0.55, y - L * 0.08, 0, y + H * 0.008); crown.closePath(); } }
    for (let i = 0; i < 11; i++) { const a = -Math.PI / 2 + (i - 5) * 0.24, L = H * 0.2; crown.moveTo(0, -H); crown.quadraticCurveTo(Math.cos(a) * L * 0.5, -H + Math.sin(a) * L * 0.7, Math.cos(a) * L, -H + Math.sin(a) * L * 0.8 + L * 0.3); crown.lineTo(Math.cos(a) * L * 0.4, -H + H * 0.01); crown.closePath(); } }
  else if (ty === 9) {   // high gravity: a short trunk flaring at its foot, a fan of thick branches, and a low, lobed umbrella crown (like a dragon's-blood tree)
    const top = H * 0.38; trunk.moveTo(-H * 0.2, 0); trunk.quadraticCurveTo(-H * 0.08, -H * 0.06, -H * 0.08, -top * 0.6); trunk.lineTo(H * 0.08, -top * 0.6); trunk.quadraticCurveTo(H * 0.08, -H * 0.06, H * 0.2, 0); trunk.closePath();
    for (let i = 0; i < 7; i++) { const ex = (i - 3) / 3 * H * 0.62, ey = -H * (0.62 - Math.abs(i - 3) * 0.03); trunk.moveTo(-H * 0.05, -top * 0.55); trunk.quadraticCurveTo(ex * 0.35, -top * 0.95, ex, ey); trunk.lineTo(ex + H * 0.02, ey + H * 0.01); trunk.quadraticCurveTo(ex * 0.35 + H * 0.04, -top * 0.9, H * 0.05, -top * 0.5); trunk.closePath(); }
    crown.moveTo(-H * 0.72, -H * 0.6); crown.bezierCurveTo(-H * 0.6, -H * 0.95, H * 0.6, -H * 0.95, H * 0.72, -H * 0.6);
    for (let i = 7; i >= 0; i--) { const x = -H * 0.72 + i * H * 0.18; crown.quadraticCurveTo(x + H * 0.09, -H * (0.5 + 0.04 * RR()), x, -H * 0.6); }
    crown.closePath(); inner.ellipse(0, -H * 0.82, H * 0.45, H * 0.07, 0, Math.PI, 2 * Math.PI); }
  else if (ty === 10) {   // a locked world's low, fixed star: cupped leaves on long stalks, every one turned toward it, lit inside
    stem(H * 0.45, H * 0.03); const n = 2 + Math.floor(RR() * 3);
    for (let i = 0; i < n; i++) { const cx = (i - (n - 1) / 2) * H * 0.26 + H * 0.03, cy = -H * (0.6 + 0.25 * RR()), r = H * (0.15 + 0.07 * RR()), t = -0.45 + 0.2 * RR(), co = Math.cos(t), si = Math.sin(t);
      trunk.moveTo(H * 0.02, -H * 0.42); trunk.quadraticCurveTo(cx * 0.4, cy + r * 1.4, cx - r * 0.1, cy + r * 0.25); trunk.lineTo(cx - r * 0.1 + H * 0.014, cy + r * 0.25); trunk.quadraticCurveTo(cx * 0.4 + H * 0.012, cy + r * 1.4, H * 0.034, -H * 0.4); trunk.closePath();
      crown.ellipse(cx, cy, r, r * 0.55, t, 0, Math.PI); crown.ellipse(cx, cy, r, r * 0.12, t, Math.PI, 2 * Math.PI);   // the cup's outside, then its rim
      inner.ellipse(cx, cy - r * 0.02, r * 0.88, r * 0.32, t, Math.PI * 1.02, Math.PI * 1.98);   // the inside of the cup, catching the light
      for (let k = -2; k <= 2; k++) { const ex = cx + co * r * 0.8 * k / 2.4, ey = cy + si * r * 0.8 * k / 2.4; inner.moveTo(cx + si * r * 0.05, cy - co * r * 0.05); inner.lineTo(ex, ey - r * 0.02); inner.lineTo(ex + 0.004 * H, ey); inner.closePath(); } } }
  else { stem(H * 0.5); blobs(0, -H * 0.68, H * 0.32, H * 0.2, 9); }
  return { trunk, crown, inner };
}
// ---- silhouettes, in body lengths: x forward, ground at y = 0, up is negative (canvas). Bodies are filled shapes; limbs and tail are
// round-capped strokes that taper segment by segment, so joints read as joints (elbow, knee, stifle, hock) rather than blocks
function beastPaths(p, pose, ph) {
  const [legL, neck, pairs, g0] = p.body, [crest, nAng, tail, head] = p.body2, g = g0 * 1.15, yT = -(legL + g * 0.75);
  const fills = [], strokes = [], farFills = [], farStrokes = [], np = (arr = fills) => { const P = new Path2D(); arr.push(P); return P; };
  const T = np();   // torso: rump, back, withers, chest, belly
  T.moveTo(-0.48, yT + g * 0.1); T.bezierCurveTo(-0.54, yT - g * 0.75, -0.3, yT - g * 1.1, -0.05, yT - g * 0.98);
  T.bezierCurveTo(0.18, yT - g * 0.9, 0.3, yT - g * 1.22, 0.44, yT - g * 0.85); T.bezierCurveTo(0.58, yT - g * 0.35, 0.56, yT + g * 0.6, 0.36, yT + g * 0.88);
  T.bezierCurveTo(0.12, yT + g * 1.12, -0.22, yT + g * 1.0, -0.4, yT + g * 0.72); T.quadraticCurveTo(-0.5, yT + g * 0.5, -0.48, yT + g * 0.1); T.closePath();
  const a = pose === "graze" ? -0.95 : pose === "alert" ? nAng + 0.35 : nAng, dx = Math.cos(a), dy = -Math.sin(a), nx = -dy, ny = dx;   // neck direction and its normal
  const nb = [0.38, yT - g * 0.3], ht = [nb[0] + neck * dx, nb[1] + neck * dy], w0 = g * 0.85, w1 = Math.max(head * 0.85, g * 0.34), N = np();
  N.moveTo(nb[0] - nx * w0, nb[1] - ny * w0); N.quadraticCurveTo(nb[0] + neck * 0.55 * dx - nx * w0 * 0.75, nb[1] + neck * 0.55 * dy - ny * w0 * 0.75, ht[0] - nx * w1, ht[1] - ny * w1);
  N.lineTo(ht[0] + nx * w1, ht[1] + ny * w1); N.quadraticCurveTo(nb[0] + neck * 0.5 * dx + nx * w0 * 0.9, nb[1] + neck * 0.5 * dy + ny * w0 * 0.9, nb[0] + nx * w0 * 1.1, nb[1] + ny * w0 * 1.1); N.closePath();
  // head: a skull tapering to a muzzle, with a jaw line, in its own frame (u along the face, v across it)
  const hb = pose === "graze" ? -1.5 : a - 1.15, ux = Math.cos(hb), uy = -Math.sin(hb), vx = -uy, vy = ux, h = head, Hp = (u, v) => [ht[0] + ux * u * h + vx * v * h, ht[1] + uy * u * h + vy * v * h];
  const Hd = np(), m = (q, f = "lineTo") => Hd[f](...q);
  m(Hp(-0.3, -0.85), "moveTo"); Hd.bezierCurveTo(...Hp(0.4, -1.15), ...Hp(1.2, -0.95), ...Hp(1.7, -0.6)); Hd.bezierCurveTo(...Hp(2.3, -0.45), ...Hp(2.9, -0.35), ...Hp(3.05, 0));
  Hd.bezierCurveTo(...Hp(3.0, 0.3), ...Hp(2.6, 0.45), ...Hp(2.2, 0.42)); Hd.bezierCurveTo(...Hp(1.6, 0.75), ...Hp(0.6, 0.95), ...Hp(-0.1, 0.8)); Hd.quadraticCurveTo(...Hp(-0.6, 0), ...Hp(-0.3, -0.85)); Hd.closePath();
  const gear = p.gear || 0, ear = (len, wd) => { const E = np(); E.moveTo(...Hp(0.1, -0.7)); E.quadraticCurveTo(...Hp(-0.4 - len * 0.2, -1.3 - len * 0.5), ...Hp(-0.6 - len * 0.35, -1.0 - len)); E.quadraticCurveTo(...Hp(-0.1, -1.1 - len * 0.3), ...Hp(0.4 * wd, -0.8)); E.closePath(); };
  if (gear === 3) ear(1.6, 1.2); else ear(0.6, 1);
  if (gear === 1) { const Hn = np(); Hn.moveTo(...Hp(0.5, -0.9)); Hn.bezierCurveTo(...Hp(0.3, -2.2), ...Hp(-1.0, -2.8), ...Hp(-1.9, -2.4)); Hn.bezierCurveTo(...Hp(-1.0, -2.3), ...Hp(-0.1, -1.9), ...Hp(0.9, -0.8)); Hn.closePath(); }   // horns swept back
  if (gear === 2) { const Fr = np(); Fr.moveTo(...Hp(0.6, -0.8)); Fr.bezierCurveTo(...Hp(0.2, -2.3), ...Hp(-1.6, -2.1), ...Hp(-1.5, -0.6)); Fr.quadraticCurveTo(...Hp(-0.8, -0.2), ...Hp(-0.2, 0.4)); Fr.closePath(); }   // a bony frill
  // tail: a tapering stroke ending in a tuft
  const tb = [-0.47, yT - g * 0.35], te = [-0.5 - tail * 0.45, yT + g * 0.9 + tail * 0.5], Tl = np(strokes); Tl.moveTo(...tb); Tl.quadraticCurveTo(tb[0] - 0.1, tb[1] + 0.12, te[0], te[1]);
  strokes[strokes.length - 1] = [Tl, g * 0.16]; { const Tf = np(); Tf.ellipse(te[0], te[1] + g * 0.15, g * 0.14, g * 0.35, 0.3, 0, 6.283); }
  if (crest > 0) { const Sl = np(); Sl.moveTo(-0.3, yT - g * 0.85); Sl.bezierCurveTo(-0.22, yT - g - crest * 1.8, 0.18, yT - g - crest * 1.9, 0.32, yT - g * 0.9); Sl.closePath(); }   // cooling sail
  // legs: near pair in the body colour, far pair behind and darker. Front: shoulder, elbow, knee, hoof; hind: hip, stifle, hock, hoof
  const heavy = pairs > 2.5 ? 1.45 : 1, thin = legL > 0.8 ? 0.8 : 1, xs = pairs > 2.5 ? [0.32, -0.02, -0.36] : [0.33, -0.36];
  xs.forEach((x, i) => [1, 0].forEach(side => {
    const back = i === xs.length - 1, swing = (pose === "walk" ? 0.14 : pose === "graze" ? 0.04 : 0.02) * Math.sin(ph * 6.283 + i * 2.2 + side * 3.14), xo = x + (side ? 0.035 : 0);
    const pts = back ? [[xo - 0.02, yT + g * 0.1], [xo + 0.07, yT + g * 1.05], [xo - 0.05 + swing * 0.5, -legL * 0.36], [xo + swing * 0.85, 0]]
                     : [[xo, yT + g * 0.25], [xo - 0.01, yT + g * 1.0], [xo + swing * 0.45 + 0.01, -legL * 0.4], [xo + swing, 0]];
    const ws = [g * (back ? 1.05 : 0.85) * heavy, g * 0.42 * heavy * thin, g * 0.3 * heavy * thin], arr = side ? farStrokes : strokes;
    for (let k = 0; k < 3; k++) { const L = new Path2D(); L.moveTo(...pts[k]); L.lineTo(...pts[k + 1]); arr.push([L, ws[k]]); }
    const Hf = np(side ? farFills : fills); Hf.ellipse(pts[3][0] + 0.012, -ws[2] * 0.35, ws[2] * 0.62, ws[2] * 0.38, 0, 0, 6.283); }));
  return { fills, strokes, farFills, farStrokes, yT, g };
}
// fill and stroke one set of shapes in one colour (limbs are round-capped strokes)
function paintSet(c, fills, strokes, col) { c.fillStyle = col; fills.forEach(q => c.fill(q)); c.strokeStyle = col; c.lineCap = "round"; c.lineJoin = "round"; strokes.forEach(([q, w]) => { c.lineWidth = w; c.stroke(q); }); }
function swimmerPath(p, it) {   // what shows above the water: a back, and the planet's own kind of fin, neck or plates
  const g = p.body[3] * 1.2, P = new Path2D(), fin = p.swim ? p.swim.fin : 1, ty = p.swim ? p.swim.type : 0;
  P.ellipse(0, 0, 0.5, g * 1.1, 0, Math.PI, 2 * Math.PI); P.closePath();
  if (ty === 1) { const t = 0.3 + 0.2 * fin; P.moveTo(0.28, -g * 0.7); P.bezierCurveTo(0.38, -t * 0.7, 0.36, -t, 0.5, -t * 1.05); P.quadraticCurveTo(0.6, -t * 1.08, 0.66, -t * 1.0); P.quadraticCurveTo(0.56, -t * 0.98, 0.52, -t * 0.96); P.bezierCurveTo(0.42, -t * 0.9, 0.42, -t * 0.6, 0.36, -g * 0.4); P.closePath(); }   // a long neck curving up out of the water, small head   // a long neck raised out of the water
  else if (ty === 2) for (let x = -0.32; x < 0.3; x += 0.1) { P.moveTo(x - 0.04, -g * 0.95); P.lineTo(x, -g - 0.09 * fin); P.lineTo(x + 0.04, -g * 0.95); P.closePath(); }   // a row of plates
  else if (ty === 3) { P.moveTo(-0.3, -g * 0.9); P.bezierCurveTo(-0.2, -g - 0.3 * fin, 0.1, -g - 0.32 * fin, 0.2, -g * 0.9); P.closePath(); }   // a tall sail
  else { P.moveTo(-0.14, -g * 0.95); P.quadraticCurveTo(-0.02, -g - 0.2 * fin, 0.06 * fin, -g - 0.24 * fin); P.quadraticCurveTo(0.03, -g * 0.9, 0.1, -g * 0.8); P.closePath(); }   // a dorsal fin
  if (it.ph > 0.7) { P.moveTo(-0.62, 0); P.lineTo(-0.7, -0.22); P.quadraticCurveTo(-0.62, -0.12, -0.52, -0.2); P.lineTo(-0.56, 0); P.closePath(); }   // flukes of one starting a dive
  return P;
}
function waderPath(pose, wd = { leg: 1, neck: 1, beak: 0 }) {
  const P = new Path2D(), L = wd.leg, N = wd.neck, by = -0.12 - 0.5 * L;
  P.ellipse(0, by, 0.26, 0.13, -0.15, 0, 6.283);
  const hx = pose ? 0.42 : 0.3 * N, hy = pose ? by + 0.22 : by - 0.4 * N;
  P.moveTo(0.18, by - 0.06); P.quadraticCurveTo(0.3, (by + hy) / 2 - 0.05, hx, hy); P.lineTo(hx + 0.02, hy + 0.06); P.quadraticCurveTo(0.24, (by + hy) / 2, 0.12, by + 0.02); P.closePath();
  P.ellipse(hx, hy, 0.06, 0.045, 0, 0, 6.283); P.moveTo(hx + 0.04, hy - 0.01); P.quadraticCurveTo(hx + 0.15, hy + wd.beak, hx + 0.26, hy + (pose ? 0.12 : 0.04) + wd.beak * 2); P.lineTo(hx + 0.04, hy + 0.025); P.closePath();
  P.moveTo(-0.24, by); P.lineTo(-0.42, by + 0.12); P.lineTo(-0.2, by + 0.06); P.closePath();
  [[-0.03, 0.02], [0.05, -0.04]].forEach(([x, sw]) => { P.rect(x, by + 0.12, 0.018, -by - 0.12); P.rect(x + sw, -0.02, 0.06, 0.02); });
  return P;
}

// the species of an item (older placements without one use the main species), and its colour in this light
const spOf = (an, it) => (an.sp && an.sp[it.sp || 0]) || an;
function spCol(s, sp, litK) { const a = s.Lt.albedo(sp.hide || s.rc.anim.hide); return [0, 1, 2].map(i => lin2s(a[i] * (s.sun1[i] * litK + s.ambient[i] * 0.45))); }
const lin2s = v => Math.round(255 * Math.pow(Math.max(0, Math.min(1, v)), 1 / 2.2));
// ---- drawing over the rendered landscape (called after every progressive pass)
function drawFauna(c, s) {
  const F = s.fauna; if (!F || !F.items.length || s.close) return;
  const cam = s.cam, an = F.plan || {}, es = s.Lt.es, sun = s.sun1, amb = s.ambient, items = [];
  for (const it of F.items) { const d = Math.hypot(it.x, it.z), az = Math.atan2(it.x, it.z) / D2R, p = cam.project(az, Math.atan2(it.h - F.eyeY, d) / D2R);
    if (!p || p[0] < -120 || p[0] > W + 120 || p[1] < -20 || p[1] > H + 60 || (s.tele && d < 70)) continue; items.push({ it, d, az, p }); }   // through binoculars, what is close is out of the frame's reach
  if (!items.length) return;
  items.sort((a, b) => b.d - a.d); F.hits = [];   // screen boxes of what was drawn, nearest last, for click-to-ask
  let y0 = H, y1 = 0; items.forEach(o => { y0 = Math.min(y0, o.p[1] - 80); y1 = Math.max(y1, o.p[1] + 6); }); y0 = Math.max(0, Math.floor(y0)); y1 = Math.min(H, Math.ceil(y1));
  const bg = c.getImageData(0, y0, W, Math.max(1, y1 - y0)).data, bgAt = (x, y) => { const i = ((Math.max(y0, Math.min(y1 - 1, Math.round(y))) - y0) * W + Math.max(0, Math.min(W - 1, Math.round(x)))) * 4; return [bg[i], bg[i + 1], bg[i + 2]]; };
  const sinE = Math.max(0.05, Math.sin(Math.max(es, 0) * D2R)), low = Math.max(0, Math.min(1, (30 - es) / 25)), sunS = sun.map(v => lin2s(v * 1.5)), rgba = (cc, a) => `rgba(${cc.join(",")},${a})`;
  const tanE = Math.tan(Math.max(3, es) * D2R);
  c.save();
  // dust raised by the herds: lit from behind it glows in the star's colour
  if (an && s.faunaWant && /savanna|steppe|desert|tundra|maquis/.test(an.bk || "")) { const herd = items.filter(o => o.it.k === "land" && o.d > 50);
    for (let i = 0; i < herd.length; i += 6) { const o = herd[i], px = cam.f * an.size / o.d, g = bgAt(o.p[0], o.p[1] + 2), dc = g.map((v, k) => Math.round(v * (1 - 0.45 * low) + sunS[k] * 0.45 * low)), rx = px * 4, ry = px * 1.6;
      const gr = c.createRadialGradient(o.p[0], o.p[1] - ry * 0.4, 0, o.p[0], o.p[1] - ry * 0.4, rx); gr.addColorStop(0, rgba(dc, 0.22 + 0.15 * low)); gr.addColorStop(1, rgba(dc, 0)); c.fillStyle = gr; c.beginPath(); c.arc(o.p[0], o.p[1] - ry * 0.4, rx, 0, 6.283); c.fill(); } }
  for (const { it, d, az, p } of items) {
    const back = Math.max(0, Math.cos(az * D2R)) * low, front = Math.max(0, -Math.cos(az * D2R)), fog = 1 - Math.exp(-(s.hazeU || 0) * d * 0.00035);
    const litK = (0.18 + 0.82 * front) * sinE * (1 - 0.85 * back), b0 = bgAt(p[0], p[1] - 8);
    const body = [0, 1, 2].map(i => s.alb.hide[i] * (sun[i] * litK + amb[i] * 0.45)), col = body.map((v, i) => Math.round(lin2s(v) * (1 - fog) + b0[i] * fog)), dark = col.map(v => Math.round(v * 0.72));
    const rimA = back * (1 - fog);
    if (it.k === "frenzy") { const r = cam.f * it.sz / d, RR = rng(Math.floor(it.ph * 1e6));   // a school churning the surface: darker water, white splashes
      c.fillStyle = rgba(b0.map(v => Math.round(v * 0.55)), 0.45); c.beginPath(); c.ellipse(p[0], p[1], r, Math.max(1, r * 0.08), 0, 0, 6.283); c.fill();
      c.fillStyle = `rgba(255,255,255,${0.6 * (1 - fog)})`; for (let i = 0; i < 18; i++) { const u = RR() * 2 - 1; c.beginPath(); c.arc(p[0] + u * r, p[1] - RR() * r * 0.08, Math.max(0.6, r * 0.018), 0, 6.283); c.fill(); } continue; }
    const shadowL = (k, Hm) => { if (es >= 35 || k < 1.2) return; const Ls = Math.min(Hm * 6, Hm / tanE), tz = it.z - Ls, tp = tz > 3 ? cam.project(Math.atan2(it.x, tz) / D2R, Math.atan2(it.h - F.eyeY, Math.hypot(it.x, tz)) / D2R) : null;   // a long shadow, away from the star
      if (tp) { c.fillStyle = `rgba(0,0,0,${0.22 * (1 - fog)})`; c.beginPath(); c.moveTo(p[0] - k * 0.32, p[1]); c.lineTo(p[0] + k * 0.32, p[1]); c.lineTo(tp[0] + k * 0.08, tp[1]); c.lineTo(tp[0] - k * 0.08, tp[1]); c.fill(); } };
    if (it.k === "tree") { const kk = cam.f / d, Hp = it.hm * kk; if (Hp < 1.2) continue;
      const lit = v => [0, 1, 2].map(i => Math.round(lin2s(v[i] * (sun[i] * (litK + 0.35 * back) + amb[i] * 0.6)) * (1 - fog) + b0[i] * fog));   // backlit leaves glow: light shines through them
      const cc = lit(s.lone.sp ? s.alb.plantS : (it.ty === s.lone.t1[1] && s.lone.t1[2] ? s.alb.plant2 : s.alb.plant)), tc = [0, 1, 2].map(i => Math.round(lin2s(s.alb.bark[i] * (sun[i] * litK + amb[i] * 0.5)) * 0.8 * (1 - fog) + b0[i] * fog));
      shadowL(Math.max(1.5, it.hm * 0.5 * kk), it.hm * 0.8);
      if (Hp < 5) { c.fillStyle = rgba(cc, 1); c.beginPath(); c.ellipse(p[0], p[1] - Hp * 0.55, Hp * (it.ty === 2 || it.ty === 8 ? 0.15 : 0.3), Hp * 0.42, 0, 0, 6.283); c.fill(); continue; }   // far away: a dab of colour
      F.hits.push({ k: "tree", x0: p[0] - Hp * 0.45, x1: p[0] + Hp * 0.45, y0: p[1] - Hp, y1: p[1] + 2, d });
      c.save(); c.translate(p[0], p[1]); c.scale(it.face * kk, kk); const TP = treePaths(it.ty, it.hm, it.ph);
      c.fillStyle = `rgba(0,0,0,${0.25 * (1 - fog)})`; c.beginPath(); c.ellipse(0, 0, it.hm * 0.35, it.hm * 0.04, 0, 0, 6.283); c.fill();
      c.fillStyle = rgba(tc, 1); c.fill(TP.trunk);
      if (rimA > 0.04) { c.save(); c.translate(0, -Math.min(2, 0.012 * Hp + 0.6) / kk); c.fillStyle = rgba(sunS, Math.min(1, rimA)); c.fill(TP.crown); c.restore(); }
      c.fillStyle = rgba(cc, 1); c.fill(TP.crown); c.fillStyle = rgba(cc.map(v => Math.min(255, Math.round(v * 1.5 + 25))), 0.85); c.fill(TP.inner);   // the lit inside of cups and crowns
      c.save(); c.clip(TP.crown); const gsh = c.createLinearGradient(0, -it.hm, 0, 0); gsh.addColorStop(0, "rgba(255,255,255,0.10)"); gsh.addColorStop(1, "rgba(0,0,0,0.38)"); c.fillStyle = gsh; c.fillRect(-it.hm, -it.hm * 1.1, it.hm * 2, it.hm * 1.1); c.restore();   // foliage darker underneath
      c.restore(); continue; }
    const sp = it.k === "land" ? spOf(an, it) : null, k = cam.f * (sp ? sp.size * it.sz : it.sz) / d;   // pixels per body length (or wingspan)
    if (k < (it.k === "bird" ? 1.6 : 0.7)) continue;
    F.hits.push({ k: it.k === "tree" ? "tree" : it.k === "bird" || it.k === "wader" ? "bird" : it.k === "land" ? "animal" : "sea", x0: p[0] - k * 0.6, x1: p[0] + k * 0.6, y0: p[1] - k * (it.k === "land" ? 1.4 : 0.8), y1: p[1] + 2, d });
    if (it.k === "land") {
      const tone = 0.82 + 0.36 * it.ph, sc = spCol(s, sp, litK).map((v, i) => Math.round(Math.min(255, v * tone) * (1 - fog) + b0[i] * fog)), sdark = sc.map(v => Math.round(v * 0.72)), Hm = sp.size * it.sz * (sp.body[0] + sp.body[3] * 1.8);   // each animal a slightly different shade
      shadowL(k, Hm);
      if (k < 3.2) {   // far away: a simple mark is all the eye resolves
        const h = (sp.body[0] + sp.body[3] * 1.4) * k; c.fillStyle = rgba(sc, 1); c.fillRect(p[0] - k * 0.45, p[1] - h, k * 0.9, Math.max(1, sp.body[3] * 1.6 * k)); c.fillRect(p[0] - k * 0.38, p[1] - h, Math.max(0.6, k * 0.1), h); c.fillRect(p[0] + k * 0.3, p[1] - h, Math.max(0.6, k * 0.1), h);
        if (rimA > 0.2) { c.fillStyle = rgba(sunS, rimA * 0.7); c.fillRect(p[0] - k * 0.45, p[1] - h - 0.6, k * 0.9, 0.7); } continue; }
      c.save(); c.translate(p[0], p[1]); c.scale(it.face * k, k);
      const P = beastPaths(sp, it.pose, it.ph);
      c.fillStyle = `rgba(0,0,0,${0.28 * (1 - fog)})`; c.beginPath(); c.ellipse(0.02, 0, 0.55, 0.05, 0, 0, 6.283); c.fill();   // contact shadow
      paintSet(c, P.farFills, P.farStrokes, rgba(sdark, 1));
      if (rimA > 0.04) { c.save(); c.translate(0, -Math.min(2, 0.015 * k + 0.6) / k); paintSet(c, P.fills, P.strokes, rgba(sunS, Math.min(1, rimA * 1.1))); c.restore(); }   // backlit: the star outlines the top
      paintSet(c, P.fills, P.strokes, rgba(sc, 1));
      if (sp.pattern && k > 6) { c.save(); c.clip(P.fills[0]); c.fillStyle = rgba(sdark.map(v => Math.round(v * 0.7)), 0.6 * (1 - fog)); const RR = rng(sp.pattern * 977 + 13);   // coat: stripes, spots or a dark saddle
        if (sp.pattern === 1) for (let x = -0.5; x < 0.6; x += 0.085) c.fillRect(x, P.yT - P.g * 1.4, 0.032, P.g * 2.4);
        else if (sp.pattern === 2) for (let i = 0; i < 26; i++) { c.beginPath(); c.ellipse(-0.45 + 0.9 * RR(), P.yT + (RR() - 0.6) * P.g * 1.8, 0.028, 0.022, 0, 0, 6.283); c.fill(); }
        else { c.beginPath(); c.ellipse(-0.02, P.yT - P.g * 0.9, 0.38, P.g * 0.75, 0, 0, 6.283); c.fill(); }
        c.restore(); }
      c.restore(); continue; }
    c.save(); c.translate(p[0], p[1]); c.scale((it.face || 1) * k, k);
    const scol = (it.k === "swim" || it.k === "breach") && an.sp ? spCol(s, an.sp[0], litK).map((v, i) => Math.round(v * (1 - fog) + b0[i] * fog)) : col;
    if (it.k === "swim") {
      c.fillStyle = rgba(scol, 1); c.fill(swimmerPath({ ...an, swim: an.swim }, it));
      if (it.spout) spray(c, it, sun, amb, sinE, fog, 0.3, -0.15, 0.75);
      c.fillStyle = `rgba(255,255,255,${0.4 * (1 - fog)})`; c.fillRect(-0.55, -0.005, 1.1, 0.014);
    } else if (it.k === "breach") {   // a giant clearing the water, arched, with white water falling off it
      c.rotate(-0.55); c.fillStyle = rgba(scol, 1); c.beginPath(); c.ellipse(0, -0.2, 0.55, 0.12, 0, 0, 6.283); c.fill(); c.beginPath(); c.moveTo(-0.5, -0.2); c.lineTo(-0.68, -0.32); c.lineTo(-0.62, -0.2); c.lineTo(-0.7, -0.08); c.fill(); c.rotate(0.55);
      spray(c, it, sun, amb, sinE, fog, 0, 0, 0.45, 60);
    } else if (it.k === "bird") { c.strokeStyle = rgba(dark, 1 - fog); c.lineWidth = Math.max(0.1, 1.2 / k); c.beginPath();
      if (it.dive) { c.moveTo(0, -0.4); c.lineTo(0, 0.3); } else { const fl = 0.3 + 0.7 * it.ph; c.moveTo(-0.5, -0.25 * fl); c.quadraticCurveTo(-0.15, 0, 0, 0); c.quadraticCurveTo(0.15, 0, 0.5, -0.25 * fl); } c.stroke();
    } else if (it.k === "wader") { const wd = an.wader, wc = wd && wd.pale ? col.map(v => Math.min(255, Math.round(v * 1.6 + 30))) : col; if (rimA > 0.04) { c.save(); c.translate(0, -0.03); c.fillStyle = rgba(sunS, rimA); c.fill(waderPath(it.ph > 0.5, wd)); c.restore(); } c.fillStyle = rgba(wc, 1); c.fill(waderPath(it.ph > 0.5, wd)); }
    c.restore();
  }
  c.restore();
}
function spray(c, it, sun, amb, sinE, fog, x0, y0, hgt, n = 26) { const RR = rng(Math.floor(it.ph * 1e6) + 3), white = [0, 1, 2].map(i => lin2s((sun[i] * sinE + amb[i]) * 1.1));
  for (let i = 0; i < n; i++) { const t = RR(), y = y0 - t * hgt, x = x0 + (RR() - 0.5) * (0.1 + t * 0.4); c.fillStyle = `rgba(${white.join(",")},${0.6 * (1 - t * 0.6) * (1 - fog)})`; c.beginPath(); c.arc(x, y, 0.025 + t * 0.07, 0, 6.283); c.fill(); } }

// ---- the sky: murmurations of thousands, V-formations of large birds, and pterosaur-scale gliders wherever lift is at least Earth-like
// (pterosaurs flew on Earth at 1 g and 1 bar; lift grows with air density, weight with gravity)
function drawFliers(c, s, cam) {
  const an = s.rc.anim; if (!an || !an.ok || !an.fly) return;
  const R = rng(strHash(s.faunaKey + "|fly")), mode = faunaMode(s), ink = [0, 1, 2].map(i => lin2s(s.alb.hide[i] * s.ambient[i] * 0.7)), inkS = `rgba(${ink.join(",")},0.9)`;
  const P = s.sc.atm.P, lift = P / (s.w.g / 9.81), yaw = 0, proj = (az, d, alt) => cam.project(az, Math.atan2(alt - 3, d) / D2R);
  c.save();
  // murmurations: a flowing ribbon of thousands of small birds, thick in places and thin in others
  for (let m = 0; m < [2, 4, 6][mode]; m++) { const az0 = R() * 360, d = 300 + 400 * R(), alt = 60 + 120 * R(), n = [500, 1600, 3200][mode], span = 120 + 160 * R(), tw = R() * 6.28;
    c.fillStyle = inkS;
    for (let i = 0; i < n; i++) { const t = R(), u = (t - 0.5) * span, wv = Math.sin(t * 6.28 * 1.3 + tw), th = 6 + 22 * Math.pow(Math.sin(t * 3.14), 1.5) * (0.6 + 0.4 * Math.sin(t * 9 + tw)), g = (R() + R() + R() - 1.5) / 1.5;
      const pp = proj(az0 + u / d / D2R, d + wv * 40, alt + wv * 25 + g * th); if (!pp) continue; const r = Math.max(0.7, cam.f * 0.35 / d); c.fillRect(pp[0], pp[1], r, r * 0.6); } }
  // V-formations of large birds
  for (let v = 0; v < [4, 9, 16][mode]; v++) { const az0 = R() * 360, d = 120 + 300 * R(), alt = 40 + 100 * R(), n = 9 + Math.floor(R() * 16), dir = R() < 0.5 ? -1 : 1, span = 1.6 + 1.4 * R();
    for (let i = 0; i < n; i++) { const row = Math.ceil(i / 2), side = i % 2 ? 1 : -1, pp = proj(az0 - dir * row * 2.2 / d / D2R, d + side * row * 3, alt - row * 0.4 + side * row * 0.3); if (!pp) continue;   // two arms trailing back from the leader
      const r = Math.max(1.5, cam.f * span / d * 0.5), fl = 0.3 + 0.7 * R(); skyHit(s, pp[0], pp[1], r + 6, "life"); c.strokeStyle = inkS; c.lineWidth = Math.max(0.8, r * 0.18); c.beginPath(); c.moveTo(pp[0] - r, pp[1] - r * 0.35 * fl); c.quadraticCurveTo(pp[0] - r * 0.3, pp[1], pp[0], pp[1]); c.quadraticCurveTo(pp[0] + r * 0.3, pp[1], pp[0] + r, pp[1] - r * 0.35 * fl); c.stroke(); } }
  // giant gliders: broad membrane wings, long crested head; a few close enough to fill part of the frame
  if (lift >= 0.7) for (let i = 0; i < [6, 14, 24][mode]; i++) { const close = i < [1, 3, 6][mode], az = R() * 360, d = close ? 45 + 50 * R() : 120 + 400 * R(), alt = close ? 18 + 25 * R() : 30 + 120 * R(), pp = proj(az, d, alt); if (!pp) continue;
    const span = Math.min(18, (7 + 5 * R()) * Math.sqrt(Math.min(4, lift))), k = cam.f * span / d, bank = (R() - 0.5) * 0.6, fl = R(); if (k < 3) continue; skyHit(s, pp[0], pp[1], k * 0.55 + 6, "life");
    c.save(); c.translate(pp[0], pp[1]); c.rotate(bank); c.scale(k * (R() < 0.5 ? 1 : -1), k); c.fillStyle = inkS; c.beginPath();
    c.moveTo(0.04, -0.01); c.bezierCurveTo(0.14, -0.08 - 0.08 * fl, 0.3, -0.14 - 0.1 * fl, 0.5, -0.08 - 0.12 * fl); c.lineTo(0.44, -0.04 - 0.1 * fl); c.bezierCurveTo(0.34, -0.02, 0.22, 0.04, 0.06, 0.05);   // right wing, the finger bones' leading edge
    c.lineTo(-0.06, 0.05); c.bezierCurveTo(-0.22, 0.04, -0.34, -0.02, -0.44, -0.04 - 0.1 * fl); c.lineTo(-0.5, -0.08 - 0.12 * fl); c.bezierCurveTo(-0.3, -0.14 - 0.1 * fl, -0.14, -0.08 - 0.08 * fl, -0.04, -0.01); c.closePath(); c.fill();
    c.beginPath(); c.ellipse(0, 0.02, 0.03, 0.07, 0, 0, 6.283); c.fill();   // body
    c.beginPath(); c.moveTo(0.02, -0.04); c.lineTo(0.13, -0.09); c.lineTo(0.03, -0.06); c.lineTo(-0.06, -0.12); c.lineTo(-0.01, -0.04); c.fill();   // long beak and a swept crest
    c.restore(); }
  c.restore();
  const lk = locked(s);
  callouts.push({ x: W * 0.5, y: H * 0.93, t: `imagined life, oxygen-rich air assumed · ${an.sea ? `swimmers about ${Math.round(an.size)} m long` : `grazers about ${an.size.toFixed(1)} m, built for ${(s.w.g / 9.81).toFixed(1)} g`}${lift >= 0.7 ? " · gliders up to " + Math.round(Math.min(18, 12 * Math.sqrt(Math.min(4, lift)))) + " m across" : ""} `, lvl: 3 });
}
