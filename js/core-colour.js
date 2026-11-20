// Colour science: spectra, CIE colour matching, white balance
// ================= Colour science =================
const AU = 1.495978707e11, RSUN = 6.957e8, RE = 6.371e6, RJ = 7.1492e7, ME = 5.972e24, MJ = 1.898e27, G = 6.674e-11, D2R = Math.PI / 180;
// what kind of host: white dwarfs are Earth-sized but at least a fifth of the Sun's mass; brown dwarfs are below 0.075 M☉ (and about Jupiter-sized)
const isWD = (Rs, Ms) => !!Rs && Rs < 0.05 && (Ms == null || Ms >= 0.15), isBD = Ms => Ms != null && Ms > 0 && Ms < 0.075;
const isWhiteDwarf = st => isWD(st.Rs, st.M), isBrownDwarf = st => !isWhiteDwarf(st) && isBD(st.M);
const LAM = []; for (let l = 380; l <= 780; l += 20) LAM.push(l);
const NB = LAM.length;
function cmf(l) {
  const g = (x, m, a, b) => { const t = (x - m) * (x < m ? a : b); return Math.exp(-0.5 * t * t); };
  return [0.362 * g(l, 442.0, 0.0624, 0.0374) + 1.056 * g(l, 599.8, 0.0264, 0.0323) - 0.065 * g(l, 501.1, 0.0490, 0.0382),
          0.821 * g(l, 568.8, 0.0213, 0.0247) + 0.286 * g(l, 530.9, 0.0613, 0.0322),
          1.217 * g(l, 437.0, 0.0845, 0.0278) + 0.681 * g(l, 459.0, 0.0385, 0.0725)];
}
const CX = [], CY = [], CZ = []; LAM.forEach((l, i) => { const c = cmf(l); CX[i] = c[0]; CY[i] = c[1]; CZ[i] = c[2]; });
const planck = (lnm, T) => { if (T < 1) return 0; const l = lnm * 1e-9; return 2 * 6.62607e-34 * 8.98755e16 / l ** 5 / Math.expm1(1.438777e-2 / (l * T)); };
const spec = f => LAM.map(f);
// stellar spectra: PHOENIX-ACES model atmospheres (Husser et al. 2013; solar metallicity, log g 5.0 below 4,000 K, 4.5 to 7,000 K, 4.0 above),
// averaged over 20 nm bins at LAM and stored as a factor on the blackbody. Red dwarfs lose much of their visible light to TiO and other molecules
const PHX_T = [2400,2600,2800,3000,3200,3400,3600,3800,4200,4700,5200,5800,6400,7000,8000,10000];
const PHX = [
  [0.087,0.713,0.462,0.449,0.296,0.192,0.251,0.244,0.292,0.193,0.185,0.163,0.168,0.219,0.284,0.136,0.378,0.235,0.882,0.638,0.430],
  [0.180,0.718,0.425,0.379,0.215,0.144,0.178,0.208,0.246,0.139,0.153,0.127,0.123,0.155,0.195,0.095,0.290,0.160,0.776,0.634,0.322],
  [0.292,0.728,0.468,0.515,0.344,0.241,0.263,0.302,0.368,0.238,0.254,0.208,0.194,0.248,0.306,0.153,0.386,0.253,0.897,0.769,0.476],
  [0.389,0.735,0.549,0.645,0.498,0.370,0.369,0.412,0.514,0.388,0.403,0.348,0.320,0.386,0.465,0.261,0.506,0.396,0.967,0.882,0.643],
  [0.445,0.724,0.593,0.730,0.629,0.489,0.462,0.502,0.632,0.527,0.546,0.493,0.451,0.513,0.608,0.375,0.606,0.529,0.986,0.939,0.764],
  [0.457,0.690,0.606,0.773,0.727,0.583,0.531,0.563,0.713,0.640,0.663,0.620,0.564,0.616,0.717,0.475,0.682,0.635,0.987,0.963,0.839],
  [0.434,0.638,0.595,0.782,0.801,0.662,0.581,0.604,0.768,0.738,0.764,0.739,0.672,0.712,0.808,0.578,0.748,0.728,0.977,0.969,0.890],
  [0.398,0.590,0.575,0.776,0.858,0.732,0.621,0.633,0.810,0.822,0.844,0.844,0.775,0.799,0.881,0.691,0.810,0.812,0.960,0.961,0.919],
  [0.315,0.559,0.556,0.786,0.982,0.852,0.677,0.658,0.857,0.917,0.927,0.946,0.880,0.889,0.926,0.839,0.873,0.876,0.912,0.919,0.909],
  [0.386,0.705,0.744,0.896,1.116,1.051,0.892,0.813,0.970,1.019,1.019,1.027,0.974,0.974,0.981,0.967,0.956,0.943,0.940,0.945,0.945],
  [0.508,0.812,0.896,0.953,1.140,1.106,1.029,0.948,1.016,1.040,1.042,1.041,0.999,0.998,0.994,0.990,0.979,0.963,0.959,0.963,0.962],
  [0.735,0.928,1.030,1.018,1.147,1.109,1.074,1.017,1.040,1.046,1.049,1.042,1.009,1.007,0.992,0.998,0.990,0.977,0.973,0.973,0.970],
  [0.905,1.032,1.129,1.092,1.165,1.110,1.096,1.050,1.055,1.053,1.052,1.041,1.015,1.009,0.980,0.999,0.992,0.980,0.975,0.974,0.970],
  [0.940,1.121,1.205,1.148,1.200,1.116,1.122,1.082,1.077,1.068,1.063,1.049,1.024,1.014,0.967,1.002,0.994,0.982,0.976,0.972,0.967],
  [0.975,1.341,1.415,1.290,1.363,1.194,1.231,1.183,1.153,1.128,1.105,1.079,1.050,1.029,0.949,1.002,0.988,0.972,0.962,0.953,0.943],
  [0.965,1.338,1.346,1.224,1.266,1.118,1.149,1.104,1.069,1.040,1.011,0.986,0.963,0.941,0.869,0.911,0.897,0.884,0.873,0.863,0.853]];
const phxRatio = (i, T) => {
  if (T <= PHX_T[0]) return PHX[0][i];
  if (T >= PHX_T[PHX_T.length - 1]) { const f = Math.min(1, (T - PHX_T[PHX_T.length - 1]) / 5000); return PHX[PHX.length - 1][i] * (1 - f) + f; }   // hotter stars: towards a blackbody
  let k = 0; while (PHX_T[k + 1] < T) k++;
  const u = (T - PHX_T[k]) / (PHX_T[k + 1] - PHX_T[k]); return Math.exp(Math.log(PHX[k][i]) * (1 - u) + Math.log(PHX[k + 1][i]) * u);
};
const starSpec = T => LAM.map((l, i) => planck(l, T) * phxRatio(i, T));   // a star's surface spectrum (per steradian), from the model atmospheres
const toXYZ = s => { let X = 0, Y = 0, Z = 0; for (let i = 0; i < NB; i++) { X += s[i] * CX[i]; Y += s[i] * CY[i]; Z += s[i] * CZ[i]; } return [X, Y, Z]; };
const gam = c => c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
const XYZ2RGB = [[3.2406, -1.5372, -0.4986], [-0.9689, 1.8758, 0.0415], [0.0557, -0.2040, 1.0570]];
const BF = [[0.8951, 0.2664, -0.1614], [-0.7502, 1.7135, 0.0367], [0.0389, -0.0685, 1.0296]];
const BFi = [[0.9869929, -0.1470543, 0.1599627], [0.4323053, 0.5183603, 0.0492912], [-0.0085287, 0.0400428, 0.9684867]];
const mv = (M, v) => [0, 1, 2].map(i => M[i][0] * v[0] + M[i][1] * v[1] + M[i][2] * v[2]);
const mm = (A, B) => A.map(r => [0, 1, 2].map(j => r[0] * B[0][j] + r[1] * B[1][j] + r[2] * B[2][j]));
// The eye adapts to the colour of the light, but not completely: under warm, low-temperature light (candles, a red dwarf) whites stay
// warm, and under very blue light they stay slightly blue (incomplete chromatic adaptation; Zhai & Luo 2018). eyeWhite gives the white the
// eye ends up adapted to: a mix of the star's white and daylight (D65), with the degree of adaptation D falling from 1 at 5,000 K to 0.6 at 2,500 K.
function eyeWhite(w, T) {
  const D = T < 5000 ? 1 - 0.4 * Math.min(1, (5000 - T) / 2500) : 1 - 0.15 * Math.min(1, Math.max(0, T - 7000) / 5000), d65 = [0.95047, 1, 1.08883];
  return w.map((v, i) => D * v / w[1] + (1 - D) * d65[i]);
}
function adaptMatrix(w) { const s = mv(BF, w.map(v => v / w[1])), d = mv(BF, [0.95047, 1, 1.08883]); return mm(XYZ2RGB, mm(BFi, mm([[d[0] / s[0], 0, 0], [0, d[1] / s[1], 0], [0, 0, d[2] / s[2]]], BF))); }
const lin = (xyz, M, k) => mv(M, xyz.map(v => v * k)).map(v => Math.max(0, v));
function clip(c) { let [r, g, b] = c; const m = Math.max(r, g, b); if (m > 1) { const w = Math.min(1, (m - 1) / (m + 2)); r = r / m + w * (1 - r / m); g = g / m + w * (1 - g / m); b = b / m + w * (1 - b / m); } return [r, g, b].map(v => Math.min(1, v)); }
const disp = (xyz, M, k) => clip(lin(xyz, M, k)).map(v => 255 * gam(v));
const css = (c, a = 1) => `rgba(${c.map(Math.round).join(",")},${a})`;
const sig = x => 1 / (1 + Math.exp(-x));
// reflectance spectra: smooth fits to laboratory and Solar System analogues
const MAT = {
  basalt: spec(l => 0.07 + 0.025 * (l - 380) / 400),
  highland: spec(l => 0.16 + 0.08 * (l - 380) / 400),                  // lunar-highland-like anorthosite
  ultramafic: spec(l => 0.045 + 0.022 * Math.exp(-(((l - 560) / 70) ** 2)) + 0.01 * (l - 380) / 400),   // olivine-rich rock: very dark, faintly green (a finding, e.g. TRAPPIST-1 b)
  weatheredBasalt: spec(l => 0.055 + 0.045 * (l - 380) / 400),          // space-weathered mare basalt: dark grey, reddening slightly (lunar maria)
  regolith: spec(l => 0.045 + 0.28 * sig((l - 575) / 30)),             // Mars-like oxidised dust
  sand: spec(l => 0.22 + 0.2 * sig((l - 520) / 50)),
  ocean: spec(l => Math.max(0.02, 0.075 - 0.05 * (l - 380) / 400)),
  ice: spec(l => 0.88 - 0.12 * (l - 380) / 400),
  blueice: spec(l => 0.25 + 0.45 * sig((480 - l) / 45)),               // glacier ice absorbs red
  frost: spec(() => 0.8),
  cloud: spec(() => 0.8),
  h2so4: spec(l => 0.5 + 0.38 * sig((l - 480) / 35)),
  hd189: spec(l => 0.04 + 0.05 * sig((570 - l) / 12) + 0.51 * sig((450 - l) / 12)),
  saturn: spec(l => 0.32 + 0.33 * sig((l - 500) / 40)),
  saturnB: spec(l => 0.22 + 0.25 * sig((l - 520) / 40)),
  waterCloud: spec(() => 0.78),
  clearBlue: spec(l => 0.03 + 0.3 * sig((460 - l) / 30)),             // Sudarsky class III
  alkaliDark: spec(l => 0.05 + 0.04 * sig((470 - l) / 20)),           // class IV
  silicate: spec(l => 0.12 + 0.05 * (l - 380) / 400),                  // class V
  brightHaze: spec(l => 0.42 + 0.16 * sig((l - 480) / 40)),            // GJ 1214b, Bond albedo ~0.5
  tholin: spec(l => 0.06 + 0.4 * sig((l - 580) / 45)),
  plantDark: spec(l => 0.03 + 0.012 * (l - 380) / 400),                // near-black absorber (speculative)
  plantPurple: spec(l => 0.035 + 0.05 * Math.exp(-(((l - 430) / 40) ** 2)) + 0.07 * sig((l - 640) / 18)),   // dark purple: absorbs most visible light, reflects a little violet and deep red (speculative)
  plantYellowGreen: spec(l => 0.045 + 0.13 * Math.exp(-(((l - 560) / 40) ** 2)) + 0.28 * sig((l - 700) / 12)),   // fresh, yellowish foliage and grass
  plantBlueGreen: spec(l => 0.03 + 0.06 * Math.exp(-(((l - 525) / 35) ** 2)) + 0.18 * sig((l - 700) / 12)),     // dark blue-green needles
  plantMaroon: spec(l => 0.035 + 0.03 * Math.exp(-(((l - 440) / 40) ** 2)) + 0.1 * sig((l - 620) / 20)),        // dark red-purple (speculative, red-dwarf worlds)
  straw: spec(l => 0.1 + 0.27 * sig((l - 545) / 28)),                                                             // dry grass
  bark: spec(l => 0.05 + 0.07 * (l - 380) / 400),
  lichenOrange: spec(l => 0.07 + 0.45 * sig((l - 560) / 20)),                                                    // carotenoid lichens, as on Arctic rocks
  flowerYellow: spec(l => 0.07 + 0.62 * sig((l - 510) / 15)), flowerWhite: spec(() => 0.62),
  flowerMagenta: spec(l => 0.1 + 0.45 * Math.exp(-(((l - 430) / 40) ** 2)) + 0.55 * sig((l - 620) / 20)),
  matPurple: spec(l => 0.05 + 0.12 * Math.exp(-(((l - 440) / 45) ** 2)) + 0.22 * sig((l - 630) / 18)),     // purple bacteria: bacteriochlorophyll and carotenoids absorb green and yellow, use the near-infrared
  plantGreen: spec(l => 0.04 + 0.08 * Math.exp(-(((l - 550) / 30) ** 2)) + 0.25 * sig((l - 700) / 12)),
  grey: spec(() => 0.3),
  sulfate: spec(l => 0.36 + 0.14 * sig((l - 470) / 40)),               // light-toned sulfate deposits, as on Mars
  clay: spec(l => 0.1 + 0.16 * sig((l - 560) / 60)),                   // weathered, clay-rich soil
  glass: spec(l => 0.035 + 0.01 * (l - 380) / 400),                    // sintered, partly melted dark rock
  saltStain: spec(l => 0.14 + 0.3 * sig((l - 590) / 50)),              // reddish-brown salts along ice fractures, as on Europa
};
const RAYL = spec(l => (550 / l) ** 4);
function rng(seed) { let s = seed >>> 0; return () => { s = Math.imul(s ^ (s >>> 15), 2246822507) ^ Math.imul(s ^ (s >>> 13), 3266489909); s ^= s >>> 16; return (s >>> 0) / 4294967296; }; }
function strHash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; }
function hash3(x, y, z) { let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y, z) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = x - xi, yf = y - yi, zf = z - zi;
  const s = t => t * t * (3 - 2 * t), u = s(xf), v = s(yf), w = s(zf), L = (a, b, t) => a + t * (b - a);
  return L(L(L(hash3(xi, yi, zi), hash3(xi + 1, yi, zi), u), L(hash3(xi, yi + 1, zi), hash3(xi + 1, yi + 1, zi), u), v),
           L(L(hash3(xi, yi, zi + 1), hash3(xi + 1, yi, zi + 1), u), L(hash3(xi, yi + 1, zi + 1), hash3(xi + 1, yi + 1, zi + 1), u), v), w);
}
const fbm = (x, y, z) => 0.5 * vnoise(x, y, z) + 0.25 * vnoise(2 * x, 2 * y, 2 * z) + 0.125 * vnoise(4 * x, 4 * y, 4 * z) + 0.0625 * vnoise(8 * x, 8 * y, 8 * z);
const mixS = (a, b, t) => a.map((v, i) => v * (1 - t) + b[i] * t);

