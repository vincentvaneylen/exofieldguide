document.documentElement.lang = "en";   // the page is in English (for screen readers and hyphenation)
// State and canvases
// ================= State and canvases =================
const $ = id => document.getElementById(id);
const c2 = $("c2"), ctx2 = c2.getContext("2d"), fx = $("fx"), fctx = fx.getContext("2d"), lab = $("lab"), lctx = lab.getContext("2d");
let glc = $("gl");   // the canvas the WebGL globals below currently draw to (swapped while rendering contact-sheet thumbnails)
let life = 0;   // biology (always imagined): 0 none, 1 microbial life (mats, stromatolites, plankton blooms, snow algae), 2 + plants (land plants, seaweed and kelp), 3 + speculative forms the planet's properties favour, 4 + animals (only where oxygen-rich air is assumed). The dial's Plants stop is 3: plants and the forms this planet favours are one layer; 2 is kept for old links
let cur = WORLDS[0], si = 0, dial = 3, yaw = 0, labels = true, earthEye = false, zoom = 2, cutaway = false;
let callouts = [];
let W = 1280, H = 720;   // the picture's canvases; W follows the shape of the screen (setViewShape), H stays 720
// fit the picture to its frame: a phone in portrait gets a tall picture, a wide monitor a wide one, so nothing is cropped away
function setViewShape(aspect) {
  const w = Math.round(Math.max(560, Math.min(1720, H * aspect)) / 8) * 8;
  if (w === W) return false;
  W = w; for (const cv of [c2, fx, lab]) { cv.width = W; cv.height = H; }
  glc.height = 576; glc.width = Math.round(576 * W / H);   // the GL work surface keeps the picture's shape at 80% of its size
  if (typeof skyLayer !== "undefined") { skyLayer.width = skyLayerT.width = W; skyLayer.height = skyLayerT.height = H; }
  return true;
}

function localFrame(theta, lat) {
  const t = theta * D2R, b = lat * D2R;
  const up = [Math.cos(t) * Math.cos(b), Math.sin(t) * Math.cos(b), Math.sin(b)];
  let fwd = [1 - up[0] * up[0], -up[0] * up[1], -up[0] * up[2]]; const fl = Math.hypot(...fwd) || 1; fwd = fwd.map(v => v / fl);
  const right = [fwd[1] * up[2] - fwd[2] * up[1], fwd[2] * up[0] - fwd[0] * up[2], fwd[0] * up[1] - fwd[1] * up[0]];
  return { up, fwd, right };
}
const toLocal = (F, v) => { const n = Math.hypot(...v); v = v.map(x => x / n); const x = v[0] * F.right[0] + v[1] * F.right[1] + v[2] * F.right[2], y = v[0] * F.up[0] + v[1] * F.up[1] + v[2] * F.up[2], z = v[0] * F.fwd[0] + v[1] * F.fwd[1] + v[2] * F.fwd[2]; return { az: Math.atan2(x, z) / D2R, el: Math.asin(Math.max(-1, Math.min(1, y))) / D2R }; };
const dirOf = (az, el) => [Math.sin(az * D2R) * Math.cos(el * D2R), Math.sin(el * D2R), Math.cos(az * D2R) * Math.cos(el * D2R)];
function camera(Wc, Hc, yawDeg, pitchDeg, fov) {
  const f = (Hc / 2) / Math.tan(Math.atan(Math.tan(fov / 2 * D2R) * 9 / 16)),   // fov is the width of a 16:9 view; the height sets the scale, so wider frames see more to the sides and taller ones more sky and ground
    cp = Math.cos(pitchDeg * D2R), sp = Math.sin(pitchDeg * D2R), cy = Math.cos(yawDeg * D2R), sy = Math.sin(yawDeg * D2R);
  return {
    f, project(az, el) {
      const [x, y, z] = dirOf(az, el);
      const x1 = x * cy - z * sy, z1 = x * sy + z * cy, y2 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
      if (z2 <= 0.02) return null;
      return [Wc / 2 + f * x1 / z2, Hc / 2 - f * y2 / z2];
    }
  };
}
function lighting(w, sc) {
  const F = localFrame(sc.theta, sc.lat), starL = toLocal(F, [1, 0, 0]), es = starL.el, mu0 = Math.sin(es * D2R);
  const M = earthEye ? XYZ2RGB : w.adapt;
  const atmOn = !!sc.atm && dial >= sc.base;
  const tau = atmOn ? 0.097 * sc.atm.P * gasFac(sc.atm.gas) * (9.81 / w.g) : 0;
  const dust = atmOn && sc.atm.dust ? sc.atm.dust : 0;
  const airm = e => 1 / (Math.sin(Math.max(0.3, e) * D2R) + 0.50572 * Math.pow(Math.max(0, e) + 6.07995, -1.6364));
  const m0 = airm(es);
  const trans = spec((l, i) => Math.exp(-(tau * RAYL[i] + dust) * m0));
  const S = w.spec, dil = w.dil, mu = Math.max(0.15, mu0);
  const direct = S.map((v, i) => v * dil * trans[i]);
  const twi = Math.max(0, Math.min(1, (mu0 + 0.1) / 0.25));   // sky light fades through twilight: none once the star is well below the horizon
  const diffuse = S.map((v, i) => v * dil * (1 - trans[i]) * 0.5 * mu * twi);
  const k = 1 / toXYZ(S.map((v, i) => direct[i] * mu + v * dil * (1 - trans[i]) * 0.5 * mu))[1];
  const rgb = s => lin(toXYZ(s), M, k);
  // material colour under the star's own light (atmospheric reddening is applied separately to the light itself); stable at night
  const albedo = mat => { const a = lin(toXYZ(S.map((v, i) => v * mat[i])), M, 1), b = lin(toXYZ(S), M, 1); return a.map((v, i) => v / Math.max(1e-9 * Math.max(...b), b[i])); };
  return { F, starL, es, mu0, M, atmOn, tau, dust, airm, trans, direct, diffuse, k, rgb, albedo, S, dil };
}

