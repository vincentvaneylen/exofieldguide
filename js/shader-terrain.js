// Terrain, water, lava and cloud-top fragment shader (GLSL ES 1.0). Specialised at compile time by #defines for ground, mode and biology.
const TERRAIN_FS = String.raw`precision highp float;
uniform vec2 uRes; uniform float uTime, uF, uYaw, uPitch, uCamH;
uniform vec3 uS1Dir, uS1Col; uniform float uS1Rad;
uniform vec3 uS2Dir, uS2Col; uniform float uS2Rad, uS2On;
uniform sampler2D uSky, uLayer;
uniform vec3 uMatCol, uAurCol, uDeckC, uRockC, uAmb, uBounce, uRockA, uRockB, uDustCol, uFrostCol, uIceCol, uIceBlue, uWaterCol, uPlantCol, uGlow, uCloudCol, uDeckA, uDeckB;
uniform float uCoastOff, uCoast, uForest, uSav, uCover, uShrubDen, uDry, uTall, uClear, uBloom, uGlowAll, uTide, uMats, uShrub, uAur, uPatch, uAccent, uSlab, uCrust, uG, uHaze, uRelief, uReliefM, uRockDen, uDust, uFrost, uLand, uPlants, uClouds, uClouds2, uAir, uRain, uUnknown, uFloes, uLayerOn, uStrata, uScaleH, uStreak, uExpo, uWet, uSnow, uLandform;
uniform vec4 uTree1, uTree2, uTree3, uBio1, uBio2;   // plants (imagined): see the defines below
uniform vec3 uGrassCol, uFlowerCol, uBarkCol, uPlant2, uLichenCol, uPlant3;
uniform vec4 uAn[AN_MAX]; uniform float uProbe, uProbeTop;   // probe pass for placing animals: two ground spots (x, z, x, z) per entry, and how high above the ground to aim
uniform vec4 uCan1, uCan2, uBio3, uSpec;   // uSpec (Speculative stop): forest tree type, flare glow, silver sheen, -; canopy: cover, crown spacing, height, shape | emergents, patch size, treeline, waterside cover | tall grass, dunes, accent, -
#define uTA uTree1.x
#define uTB uTree1.y
#define uTMix uTree1.z
#define uTDen uTree1.w
#define uTHA uTree2.x
#define uTHB uTree2.y
#define uTS uTree2.z
#define uTPatch uTree2.w
#define uTClump uTree3.x
#define uTRange uTree3.y
#define uTTop uTree3.z
#define uFarCan uTree3.w
uniform vec4 uStyle;   // x craters, y mesas, z ridged mountains, w dunes
uniform vec3 uVolc;    // x, z position (m) and strength
uniform vec2 uSeed, uWind, uLandDir, uJit;

// hash: wrap first, since large coordinates would lose float precision and repeat
float h21(vec2 p) { vec2 m = mod(p, 4096.); vec3 p3 = fract(vec3(m.x, m.y, m.x) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }   // after D. Hoskins
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 6; i++) { s += a * vn(p); p = mat2(1.62, -1.18, 1.18, 1.62) * p + vec2(17.1, 9.2); a *= .5; } return s; }   // each octave rotated, so no grid shows
float fbm3(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 3; i++) { s += a * vn(p); p = mat2(1.62, -1.18, 1.18, 1.62) * p + vec2(17.1, 9.2); a *= .5; } return s; }
float ridged(vec2 p) { float s = 0., a = .5; for (int i = 0; i < 5; i++) { float n = 1. - abs(vn(p) * 2. - 1.); s += a * n * n; p = p * 2.1 + vec2(3.1, 7.7); a *= .5; } return s; }
float gD = 0., gRock = 0., gEdge = 1.;
float gEco = 0., gY = -1e9, gNoCan = 0., gCanId = 0., gCanRel = 1., gCanX = 0.;   // gY: height of the marching ray (skips the canopy far above it); gNoCan: ground only
vec2 gTC = vec2(1e5); float gTB = 0., gTPart = 1., gTId = 0., gTTy = 0., gTH = 1.; vec3 gTq = vec3(0.);   // the plant last evaluated: its cell, ground height, part, id, type, height and local position   // gD: extra detail when computing normals; gRock: id of the stone last hit, for its colour
vec3 noised(vec2 x) { vec2 i = floor(x), f = fract(x); vec2 u = f * f * f * (f * (f * 6. - 15.) + 10.), du = 30. * f * f * (f * (f - 2.) + 1.);
  float a = h21(i), b = h21(i + vec2(1, 0)), c = h21(i + vec2(0, 1)), d = h21(i + vec2(1, 1));
  return vec3(a + (b - a) * u.x + (c - a) * u.y + (a - b - c + d) * u.x * u.y, du * (vec2(b - a, c - a) + (a - b - c + d) * u.yx)); }
// eroded fbm: slopes from the coarser octaves damp the finer ones, so valleys stay smooth and crests stay sharp (after I. Quilez)
float efbm(vec2 p, float oct) { float s = 0., a = 0.5; vec2 d = vec2(0.);
  for (int i = 0; i < 10; i++) { if (float(i) >= oct) break; vec3 n = noised(p); n = vec3(2. * n.x - 1., 2. * n.yz); d += n.yz; s += a * n.x / (1. + dot(d, d)); a *= 0.5; p = mat2(1.6, -1.2, 1.2, 1.6) * p + vec2(3.7, 1.3); }
  return s; }
// octaves worth computing for features of size S seen at distance t: finer ones would be smaller than a pixel
float lod(float S, float t) { return clamp(log2(S * uF / (5. * max(t, 0.3))) + 2.5 * gD, 1., 10.); }   // gD: 1 for normals, 0 for the march, -1 for shadow rays
// billow noise: rounded heaps with creases between them, like the tops of convective clouds
float bil(vec2 p, float oct) { float s = 0., a = 0.5; for (int i = 0; i < 6; i++) { if (float(i) >= oct) break; float v = 2. * vn(p) - 1.; s += a * sqrt(v * v + 0.03); p = mat2(1.62, -1.18, 1.18, 1.62) * p + vec2(5.3, 1.7); a *= 0.5; } return s; }
float terrace(float x, float k) { float f = fract(x * k); return (floor(x * k) + smoothstep(0.3, 0.7, f)) / k; }
vec3 cell(vec2 p) { vec2 i = floor(p), f = fract(p); float d1 = 8., d2 = 8., hh = 0.;
  for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) {
    vec2 g = vec2(float(x), float(y)); vec2 o = vec2(h21(i + g), h21(i + g + 19.7)); vec2 r = g + o - f; float d = dot(r, r);
    if (d < d1) { d2 = d1; d1 = d; hh = h21(i + g + 7.3); } else if (d < d2) d2 = d; }
  return vec3(sqrt(d1), sqrt(d2) - sqrt(d1), hh); }
float craters(vec2 p, float size) { vec3 c = cell(p / size); float r = 0.25 + 0.2 * c.z; float d = c.x / r;
  return step(0.4, c.z) * size * (d < 1. ? 0.2 * d * d - 0.14 : 0.06 * exp(-(d - 1.) * 4.) * (1. - smoothstep(1.25, 1.7, d))); }   // bowl, raised rim, fading ejecta
// stones as a heightfield: each cell may hold one stone with its own size, orientation, elongation, ragged outline and burial
float boulders(vec2 p, float size, float dens) {
  vec2 x = p / size, i = floor(x), f = fract(x);
  float best = 0., bid = 0.; vec2 bl = vec2(0.);
  for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
    vec2 g = vec2(float(xx), float(yy)), id = i + g; float hz = h21(id + 7.3);
    if (fract(hz * 7.13) < 1. - dens) continue;
    float r = 0.14 + 0.36 * h21(id + 3.3) * h21(id + 4.4);           // many small stones, a few big ones
    vec2 l = f - g - 0.1 - 0.8 * vec2(h21(id), h21(id + 19.7));
    if (dot(l, l) > r * r) continue;                                   // outside even the stone's long axis
    vec2 u = normalize(vec2(fract(hz * 23.1), fract(hz * 61.7)) - 0.5);  // random orientation, elongated
    l = vec2(u.x * l.x - u.y * l.y, u.y * l.x + u.x * l.y); l.x *= 1. + 0.9 * fract(hz * 5.9);
    float q = length(l) / r * (1. + 0.13 * sin(l.x / r * 7. + hz * 40.) * sin(l.y / r * 6. + hz * 13.));   // ragged outline
    if (q >= 1.) continue;
    float hgt = r * pow(1. - q * q, mix(0.3, 0.55, uAir));
    // airless: blocks broken along flat faces; with air, weathering rounds them
    vec2 n1 = normalize(vec2(fract(hz * 31.3), fract(hz * 17.9)) - 0.5), n2 = normalize(vec2(fract(hz * 53.1), fract(hz * 7.7)) - 0.5);
    float cut = min(min(r * 0.75 - 0.9 * dot(l, n1), r * 0.7 - 0.8 * dot(l, n2)), r * mix(0.38 + 0.4 * fract(hz * 3.7), 0.12 + 0.14 * fract(hz * 3.7), uSlab));   // layered rock breaks into flat slabs
    hgt = mix(min(hgt, cut), hgt, uAir * 0.7) - r * 0.14 * fract(hz * 11.3);   // partly buried
    if (hgt > best) { best = hgt; bid = hz; bl = l / r; }
  }
  if (best <= 0.) return 0.;
  float crag = 1. - abs(vn(bl * 2.5 + bid * 9.) * 2. - 1.);
  if (gD > 0.5) crag = crag * 0.65 + 0.35 * (1. - abs(vn(bl * 8. + bid * 5.) * 2. - 1.));
  gRock = bid;
  return size * best * 0.62 * (mix(0.62, 0.8, uAir) + mix(0.42, 0.22, uAir) * crag); }

// Terrain height in metres around a camera at the origin. mat: 0 ground, 1 rock or land, 2 glowing melt
float H(vec2 q, out float mat) {
  mat = 0.; gRock = 0.;
  float dist = length(q); vec2 p = q + uSeed;
  float far = smoothstep(120., 2200., dist), pad = smoothstep(2.5, 20., dist), near = 1. - smoothstep(60., 240., dist);
  float im = mix(0.25, 1., uRelief);           // imagined shapes shrink when the dial is down
  float R = uReliefM * im;
  if (uGround > 4.5) {                          // giant planet: cloud tops
    // billow size follows the atmospheric scale height; hot tidally locked giants are drawn out into jets
    vec2 pc = p / clamp(pow(uScaleH, 0.5), 0.6, 1.5);   // bigger billows for a larger scale height (range compressed so they stay visible)
    pc.x *= mix(1., 0.28, uStreak);   // drawn out along the jet
    // heaped convective billows at three sizes, lower near the camera so it stays above them
    float nf = mix(0.45, 1., smoothstep(200., 2500., dist));
    float gap = uPatch > 0. ? smoothstep(1. - uPatch, 1.25 - uPatch, fbm(pc / 2600. + 9.)) : 0.;   // clear patches: the deck drops away
    float tower = 700. * smoothstep(0.6, 0.85, fbm(pc / 3800. + 17.)) * (0.5 + 0.5 * bil(pc / 900., lod(900., dist) - 2.));   // scattered convective towers rising out of the deck, so it never reads as a flat sea
    return (430. * uStyle.z * bil(pc / 1700., lod(1700., dist) - 2.) + 110. * bil(pc / 320., lod(320., dist) - 2.) + 12. * bil(pc / 70., lod(70., dist) - 2.) + tower) * nf * (1. - 0.5 * gap) - 160. * gap + (fbm(pc / 5000.) - 0.4) * 260. * far;
  }
  if (uGround > 3.5 && uGround < 4.5) {         // magma sea: slow viscous swells, with rafts of chilled crust where it is cool enough
    float sc = uMode > 0.5 ? 0.7 : 5.;
    float sw = uMode > 0.5 ? fbm3(p * 0.8 + uTime * 0.02) * 0.04 : (fbm(p / 70. + uTime * 0.003) - 0.5) * 1.4 * smoothstep(3., 30., dist) + fbm3(p / 9. + uTime * 0.01) * 0.1;
    vec2 w = p / sc + 0.9 * vec2(fbm3(p / sc * 0.5), fbm3(p / sc * 0.5 + 5.));
    vec3 c = cell(w); gRock = c.z; gEdge = c.y;
    float raft = step(fract(c.z * 7.7), uCrust) * smoothstep(0.02, 0.22, c.y - 0.08 * fbm3(w * 4.));   // a plate is crust or open melt; its edges sag into the melt
    mat = raft > 0.5 ? 1. : 2.;
    float ves = 0.; if (gD > 0.5 && uMode > 0.5 && raft > 0.) { vec3 v = cell(p * 45.); ves = fbm3(p * 70.) * 0.003 - 0.003 * smoothstep(0.2, 0.03, v.x) * step(0.72, v.z); }   // gas bubbles frozen into the crust
    float folds = (uMode > 0.5 ? 0.012 : 0.0025) * pow(0.5 + 0.5 * sin((w.x + 0.5 * sin(w.y * 1.7 + c.z * 9.)) * 34. + fbm3(w * 2.) * 6.), 1.5);   // ropy pahoehoe skin
    return sw + raft * (ves + (0.006 + 0.006 * c.z + fbm3(w * 2.) * 0.012 + folds) * sc) + (uStyle.z * ridged(p / 1600.) + uStyle.y * terrace(fbm(p / 900.), 3.) * 0.6) * R * far * 0.5;
  }
  if (uGround > 2.5 && uGround < 3.5) {         // water: islet, coast, or open sea
    float h = -6.;
    if (uLand > -0.5 && uLand < 0.5) {
      if (uMode > 0.5) h = max(boulders(p + vec2(0.9, -0.4), 0.9, 0.35) * 14. - 3., -1.1 + efbm(p / 0.8, 6.) * 0.25 + max(boulders(p, 0.3, 0.5), boulders(p + 5., 0.1, 0.6)) * 1.5);   // shallow water over a stony bottom, the odd rock breaking the surface
      else { mat = 1.; h = 0.45 - 0.085 * dist + (fbm(p / 7.) - 0.5) * 1.3 + boulders(p, 2.5, 0.5) * smoothstep(2., 5., dist); }
    } else if (uMode > 0.5 && uLand > 1.5) {   // close-up on land where plants grow: soil, a few stones, tufts of low growth
      h = 2. + efbm(p / 0.6, lod(0.6, dist)) * 0.04;
      float b = boulders(p + 3., 0.11, 0.2 * uRockDen + 0.06); if (b > 0.002) mat = 1.;
      h += b;
#if BIO
      vec3 tc = cell(p * 4. + uSeed); float tuft = smoothstep(0.5, 0.1, tc.x) * (0.5 + 0.7 * fract(tc.z * 7.));   // low cushions of moss and herbs, each its own size
      h += uBio2.z * smoothstep(0.3, 0.6, fbm3(p * 0.9) + 0.15) * (0.022 * tuft + 0.006 * fbm3(p * 45.) + 0.003 * fbm3(p * 140.)) * (1. - step(0.002, b));
#endif
      return h;
    } else if (uLand > 0.5) {
      float x = dot(q, uLandDir) + uCoastOff;     // positive = inland
      float coast = x + (fbm(p / 260.) - 0.5) * 260. * smoothstep(10., 200., dist);
      float cliff = smoothstep(0.42, 0.6, uStyle.y);   // layered rock meets the sea as cliffs; otherwise a beach
      float cslope = uCoast > 1.5 && uCoast < 2.5 ? 0.16 : uCoast > 2.5 && uCoast < 3.5 ? 0.012 : 0.045;   // mountain shores rise fast, coastal plains barely
      h = 0.9 + coast * cslope / max(uTide, 0.7) + (uStyle.z * ridged(p / 1500.) + uStyle.y * terrace(fbm(p / 800.) * 1.3, 4.) * 0.8) * R * smoothstep(0., 600., coast) * far
        + fbm3(p / 40.) * 3. * pad * smoothstep(-20., 40., coast)
        + efbm(p / 120., lod(120., dist)) * R * 0.05 * smoothstep(0., 80., coast) * pad
        + cliff * (14. + 12. * fbm3(p / 90.)) * smoothstep(2., 9., coast + 4. * fbm3(p / 12.)) * smoothstep(15., 60., dist) * (uTide > 1.5 ? 0.3 : 1.);
      if (uCoast > 3.5 && uCoast < 4.5 && coast < -150.) { vec3 ic = cell((p + uSeed) / 900.); float isl = pow(1. - smoothstep(0.0, 0.45, ic.x + 0.12 * fbm3(p / 120.)), 1.6) * step(0.35, ic.z) * smoothstep(-150., -450., coast);   // islands offshore, rising gently
        h = max(h, isl * (20. + 60. * fract(ic.z * 7.)) * (0.7 + 0.5 * fbm(p / 160.)) - 3.); }
      if (uCoast > 4.5 && coast < 0. && coast > -600.) h = max(h, -0.45 + 0.35 * fbm(p / 25.) - 0.6 * smoothstep(-450., -600., coast));   // a wide shallow shelf: a lagoon half a metre deep
      if (uBio3.y > 0.) h += uBio3.y * 14. * pow(0.5 + 0.5 * sin(dot(p, uWind) / 70. + fbm3(p / 260.) * 5.), 2.) * smoothstep(20., 160., coast) * (0.6 + 0.4 * fbm3(p / 500.));   // dune ridges across the wind
      if (uTide > 1.2 && coast > -5.) h -= 1.5 * (1. - smoothstep(0.012, 0.05, abs(fbm(p / 90.) - 0.5))) * (1. - smoothstep(10. * uTide, 30. * uTide, coast)) * smoothstep(4., 12., dist);   // tidal channels across the flats
      if (uMode < 0.5 && dist < 200.) {
        h += boulders(p, 2.2, uRockDen * 0.5) * smoothstep(3., 8., dist) * (1. - smoothstep(-5., 15., -coast));
        if (dist < 60. && dist > 1.5) h += boulders(p + 31., 0.5, 0.6) * (1. - smoothstep(4., 14., abs(coast - 3.)));   // pebbles and cobbles thrown up at the waterline
      }
#if BIO
      if (uMode < 0.5 && uMats > 0. && dist > 3. && dist < 260. && coast > (uCoast > 4.5 ? -500. : -40.) && coast < 6.) {   // stromatolites: mounds that microbial mats build layer by layer in the shallows, as at Shark Bay (imagined)
        float sd = boulders(p + 13., uCoast > 4.5 ? 2. : 1.4, 0.75) * (uCoast > 4.5 ? 1.3 : smoothstep(-40., -15., coast)) * (1. - smoothstep(0., 6., coast));
        if (sd > 0.03) { float top = min(max(h, -0.7) + sd * 0.8, 0.25); if (top > h) { mat = 5.; return top; } } }
      // forest canopy (imagined): crowns at irregular spacing; where they grow follows a simple ecology
      gEco = 0.;
      if (uMode < 0.5 && uCan1.x > 0. && h > 0.9 && (gNoCan > 0.5 || (dist > 260. && gY - h < 3.2 * uCan1.z))) {
        float eco = uCan1.x * (1. - smoothstep(uCan2.z * 0.55, uCan2.z, h + 40. * fbm3(p / 300.))) * (1. - cliff * 0.85);   // thinning to a treeline
        eco = mix(eco, max(eco, uCan2.w), 1. - smoothstep(30., 260., coast + 60. * fbm3(p / 150.)));   // a wetter belt along the shore
        eco *= smoothstep(5., 25., coast + 15. * fbm3(p / 40.));
        float pat = fbm((p + 31.) / uCan2.y) + 0.22 * (fbm3(p / (uCan2.y * 0.18)) - 0.5), th = 0.78 - 0.56 * eco;   // groves and clearings with ragged edges
        eco *= smoothstep(th - 0.12, th + 0.05, pat);
        gEco = eco;
        if (gNoCan < 0.5) eco *= smoothstep(260., 370., dist);   // near trees are drawn one by one; the canopy surface takes over beyond
        if (eco > 0.03 && gNoCan < 0.5) {
          float cs = uCan1.y, hc0 = uCan1.z, can = 0.;
          if (dist < 2800.) {   // everything here varies smoothly: a ray-marched surface must not jump
            vec3 c = cell(p / cs); float x = c.x / 0.62;
            float prof = uCan1.w < 0.5 ? sqrt(max(0., 1. - x * x)) : uCan1.w < 1.5 ? pow(max(0., 1. - x), 1.25) : smoothstep(1., 0.65, x);
            float pres = smoothstep(0.3, 0.62, eco + 0.55 * (vn(p / (cs * 0.85) + 2.7) - 0.5));   // where crowns stand: dense inside, scattered at the edges
            float base = mix(0.1, 0.62, smoothstep(0.5, 0.92, eco)) * (uCan1.w > 0.5 && uCan1.w < 1.5 ? 0.3 : 1.);
            float hc = hc0 * (0.72 + 0.56 * vn(p / (cs * 1.7) + 9.1));   // crown heights vary smoothly from tree to tree
            can = hc * pres * (base + (1. - base) * prof * (0.75 + 0.25 * pres)); gCanId = c.z; gCanX = x;
            if (uCan2.x > 0.) { vec3 e = cell(p / (cs * 2.6) + 4.1); float xe = e.x / 0.7, em = smoothstep(1. - uCan2.x * 2.2, 1.06 - uCan2.x * 2.2, vn(p / (cs * 2.6) + 1.3));   // emergent giants above the canopy
              float he = hc0 * 1.5 * em * sqrt(max(0., 1. - xe * xe)) * pres; if (he > can) { can = he; gCanId = e.z + 0.5; gCanX = xe; } }
            if (dist < 500. && can > 0.) can += (fbm3(p / (0.16 * cs)) - 0.5) * 0.1 * hc0 * pres;   // leafy clumps
          } else can = hc0 * 0.75 * smoothstep(0.03, 0.4, eco) * (0.85 + 0.3 * fbm(p / 40.));
          if (can > 0.05) { gCanRel = can / (hc0 * 1.3); mat = 6.; return h + can * smoothstep(0.9, 3., h); }
        }
      }
#endif
      if (uMode > 0.5) h = -0.4 + boulders(p + vec2(0.9, -0.4), 0.8, 0.6) * 1.2 + fbm3(p * 6.) * 0.02 + max(boulders(p, 0.1, 0.6), boulders(p + 3., 0.04, 0.7));
      mat = 1.;
    }
    if (uFloes > 0.5 && h < -0.15) {   // sea ice: flat slabs standing a third of a metre out of the water, snow on top
      float fs = uMode > 0.5 ? 2.5 : 9.; vec2 qf = p / fs; vec3 c = cell(qf + 0.22 * vec2(fbm3(qf * 2.), fbm3(qf * 2. + 4.)));
      float rad = 0.22 + 0.25 * fract(c.z * 13.);
      if (c.z > 0.6 && c.x < rad) {
        float fh = (uMode > 0.5 ? 0.12 : 0.3) * (0.8 + 0.25 * fract(c.z * 7.)) * smoothstep(rad, rad - 0.035, c.x) + fbm3(p * (uMode > 0.5 ? 3. : 0.8)) * 0.04 + (gD > 0.5 ? fbm3(p * 14.) * 0.008 : 0.);
        if (fh > h) { h = fh; mat = 3.; gEdge = rad - c.x; } }
    }
    return h;
  }
  // rock, regolith, ice
  if (uMode > 0.5) {   // close-up: only the metre around you matters
    if (uGround > 1.5) return fbm3(p * 1.2) * 0.12 + 0.018 * pow(1. - abs(sin(dot(p, uWind) * 12. + fbm3(p * 1.5) * 6.)), 2.) * (0.4 + 0.6 * fbm3(p * 0.7)) * uAir + fbm3(p * 7.) * 0.02 + fbm3(p * 40.) * 0.003 + (gD > 0.5 ? fbm3(p * 160.) * 0.0007 : 0.);   // snow: drifts, wind-carved sastrugi, fine crust
    float h;
    h = efbm(p / 0.6, lod(0.6, dist)) * 0.03;                                                    // gentle swell of the soil
    if (uAir > 0.5 && uStyle.w > 0.01) h += 0.007 * pow(0.5 + 0.5 * sin(dot(p, uWind) * 55. + fbm3(p * 3.) * 4.), 2.);   // wind ripples in the sand
    if (uAir < 0.5) h += craters(p, 0.45) * 0.35 * uStyle.x * smoothstep(0.35, 0.6, fbm3(p * 0.8));   // the odd soft, degraded impact pit
    float b = max(max(boulders(p, 0.32, 0.22 * uRockDen + 0.05), boulders(p + 3., 0.11, 0.4 * uRockDen + 0.12)), boulders(p + 7., 0.04, 0.35 * uRockDen + 0.1) * 1.2);
    if (b > 0.002) mat = 1.;
    h += b + (gD > 0.5 ? fbm3(p * 110.) * 0.0018 : 0.);   // clumpy grains, seen only by the lighting
    return h;
  }
  float h = 0.;
  if (far > 0.) {
    float oc = lod(1800., dist), mt = 0.5 + 0.75 * efbm(p / 1800., oc);   // eroded mountains: sharp crests, smooth valleys; airless worlds keep some raw ridges
    float big = uStyle.z * mix(mt * mt * 1.4, ridged(p / 1500.), 0.25 * (1. - uAir)) + uStyle.y * terrace(fbm(p / 800.) * 1.3 + 0.06 * efbm(p / 200., oc - 3.), 4.) * 0.8;
    h = big * R * far;
  }
  h += efbm(p / 90., lod(90., dist)) * R * 0.035 * pad;
  if (dist < 150.) h += efbm(p / 6., lod(6., dist)) * 0.3 * smoothstep(0.6, 5., dist) * mix(0.4, 1., uRelief);   // roughness underfoot
  if (uLandform > 0.5 && uLandform < 1.5) {   // canyons cut into layered plateaus (thin air, ancient flowing water or tectonics)
    if (dist > 120.) { float cn = abs(fbm(p / 2200.) - 0.5);
    h += R * 0.45 * terrace(fbm(p / 900.), 5.) * far - R * 0.8 * (1. - smoothstep(0.015, 0.07, cn)) * smoothstep(250., 1200., dist); }
  } else if (uLandform > 1.5 && uLandform < 2.5) {   // volcanic plains: smooth flood basalt with shield cones on the horizon
    h *= 0.35; if (dist > 500.) { vec3 cc = cell(p / 2600.); float cone = step(0.55, cc.z) * max(0., 1. - cc.x / 0.38);
    h += R * 1.1 * pow(cone, 1.7) * (1. - 0.5 * smoothstep(0.86, 1., cone)) * smoothstep(500., 1500., dist); }
  } else if (uLandform > 2.5 && uLandform < 3.5) {   // salt flats: dry lake beds, flattened
    float basin = smoothstep(0.46, 0.34, fbm(p / 2500.)); h = mix(h, min(h, 0.2), basin * pad);
  } else if (uLandform > 4.5 && uLandform < 5.5) {   // yardangs: streamlined ridges carved by wind-blown dust, long axis along the wind
    vec2 wp = vec2(dot(p, uWind), dot(p, vec2(-uWind.y, uWind.x)));
    float yr = pow(1. - abs(sin(wp.y / 40. + fbm3(wp / vec2(900., 140.)) * 3.)), 3.) * smoothstep(0.3, 0.6, fbm3(wp / vec2(700., 220.)));
    h += R * 0.09 * yr * smoothstep(12., 70., dist);
  }
  if (uStyle.w > 0.) h += uStyle.w * pow(0.5 + 0.5 * sin(dot(p, uWind) / 22. + fbm3(p / 90.) * 5.), 2.) * 7. * pad * im;
  // craters fade in with distance by size, so the camera never stands at the bottom of a large one
  if (uStyle.x > 0.01) { float cr = 0.;
    if (dist > 20.) cr += craters(p, 90.) * smoothstep(20., 140., dist);
    if (dist > 80.) cr += craters(p + 37., 420.) * smoothstep(80., 600., dist);
    if (dist < 240.) cr += craters(p + 71., 22.) * near * pad;
    h += uStyle.x * cr * im; }
  float rv = length(q - uVolc.xy); h += uVolc.z * R * 2.4 * (exp(-rv / 700.) - 0.55 * exp(-rv / 120.)) * im * smoothstep(400., 1500., dist);
  if (uGround > 1.5) { h = h * 0.6 + 0.16 * sin(p.x * 0.6 + fbm3(p / 8.) * 4.) * pad;
    if (uLandform > 5.5) { float e = cell(p / 700. + 0.3 * vec2(fbm3(p / 900.), fbm3(p / 900. + 4.))).y * 350.;   // metres from a fracture
      h += (6. * exp(-pow((e - 9.) / 5., 2.)) - 1.5 * exp(-e * e / 6.)) * smoothstep(8., 40., dist) * mix(0.3, 1., uRelief); }   // tidal flexing cracks the shell; each crack builds a double ridge
    else if (uLandform > 3.5) h += 38. * smoothstep(-25., 25., -dot(q, uLandDir) + (fbm(p / 300.) - 0.5) * 220. - 260.) * mix(0.3, 1., uRelief); }   // the edge of an ice sheet: a wall of blue ice
  if (dist < 260.) {   // stones, each size only where it is bigger than a pixel; they come in patches (boulder fields, bare ground)
    float b = 0., pf = 0.3 + 1.2 * smoothstep(0.3, 0.7, fbm3(p / 350.));
    if (dist > 3.) b += boulders(p, 6., uRockDen * 0.35 * pf) * near * smoothstep(3., 8., dist) * uRelief;
    if (dist > 3. && dist < 70.) b += boulders(p + 13., 1.6, min(1., uRockDen * 0.7 * pf)) * (1. - smoothstep(20., 70., dist)) * smoothstep(3., 8., dist) * uRelief;
    if (dist > 1.5 && dist < 25. && uGround < 1.5) b += boulders(p + 51., 0.45, uRockDen * 0.8) * (1. - smoothstep(8., 25., dist)) * smoothstep(1.5, 3., dist) * uRelief;   // rubble and pebbles near your feet
    if (b > 0.03) mat = 1.;
    h += b;
  }
  return h;
}
#if BIO
float sdE(vec3 p, vec3 r) { float k0 = length(p / r), k1 = length(p / (r * r)); return k0 * (k0 - 1.) / max(k1, 1e-4); }
float sdCap(vec3 p, vec3 a, vec3 b, float r) { vec3 pa = p - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0., 1.); return length(pa - ba * h) - r; }
float smin(float a, float b, float k) { float h = clamp(0.5 + 0.5 * (b - a) / k, 0., 1.); return mix(b, a, h) - k * h * (1. - h); }
// one plant shape (imagined, after Earth's growth forms): 1 broadleaf, 2 conifer, 3 umbrella (acacia), 4 palm, 5 columnar succulent, 6 mangrove, 7 cushion bush;
// speculative forms: 8 low-gravity spire, 9 high-gravity cushion-tree, 10 dish that faces the star
float lumps(vec3 q, float f) {   // leafy clumps: ripples along rotated axes, so they do not line up into blocks
  q *= f; vec3 a = vec3(0.8 * q.x + 0.6 * q.z, 0.9 * q.y + 0.3 * q.x, -0.6 * q.x + 0.8 * q.z - 0.3 * q.y), b = vec3(0.5 * a.x - 0.7 * a.y + 0.5 * a.z, 0.7 * a.x + 0.6 * a.z, 0.5 * a.y - 0.6 * a.x + 0.6 * a.z) * 2.3;
  return sin(a.x) * sin(a.y + 1.7) * sin(a.z + 0.6) * 0.8 + 0.45 * sin(b.x + 0.3) * sin(b.y + 2.1) * sin(b.z + 1.2); }
float plant(vec3 q, float ty, float Ht, float id, out float part) {
  float tr = 1e5, cr = 1e5;
  if (ty < 1.5) {
    tr = sdCap(q, vec3(0.), vec3(0., 0.5 * Ht, 0.), 0.016 * Ht + 0.08);
    vec3 c = vec3(0., 0.64 * Ht, 0.);
    cr = sdE(q - c, vec3(0.17, 0.15, 0.17) * Ht);
    for (int i = 0; i < 6; i++) { float a = id * 40. + float(i) * 1.047; vec3 o = vec3(cos(a) * (0.13 + 0.04 * fract(id * float(i + 5))), 0.12 * sin(a * 1.7 + id * 9.) - 0.03, sin(a) * (0.13 + 0.04 * fract(id * float(i + 9)))) * Ht;
      cr = smin(cr, length(q - c - o) - (0.08 + 0.04 * fract(id * float(i + 3) * 7.)) * Ht, 0.03 * Ht); }   // a broad crown of separate leafy clumps, low on a short trunk   // a crown of separate leafy clumps
  } else if (ty < 2.5) {
    tr = sdCap(q, vec3(0.), vec3(0., 0.3 * Ht, 0.), 0.025 * Ht + 0.06);
    float u = clamp((q.y - 0.1 * Ht) / (0.9 * Ht), 0., 1.), a = atan(q.z, q.x), r = length(q.xz);
    float tier = fract(u * 9. + id + 0.08 * r / Ht * 9.);   // whorls of branches that droop toward their tips
    float R = 0.2 * Ht * (1. - u) * (0.62 + 0.38 * tier) * (0.85 + 0.15 * sin(a * 7. + u * 20. + id * 9.));
    cr = max(max(r - R, q.y - Ht), 0.1 * Ht - q.y) * 0.6;
  } else if (ty < 3.5) {
    vec3 c = vec3(0., 0.8 * Ht, 0.);
    tr = min(sdCap(q, vec3(0.), vec3(0., 0.45 * Ht, 0.), 0.035 * Ht + 0.06), min(sdCap(q, vec3(0., 0.42 * Ht, 0.), vec3(0.16, 0.79, 0.05) * Ht, 0.022 * Ht), sdCap(q, vec3(0., 0.42 * Ht, 0.), vec3(-0.14, 0.77, -0.08) * Ht, 0.022 * Ht)));
    cr = smin(sdE(q - c, vec3(0.42, 0.075, 0.37) * Ht), sdE(q - c - vec3(0.12, 0.04, 0.08) * Ht, vec3(0.24, 0.07, 0.22) * Ht), 0.05 * Ht);
  } else if (ty < 4.5) {
    vec2 ld = vec2(cos(id * 30.), sin(id * 30.)); float y = clamp(q.y / Ht, 0., 1.);
    vec3 qb = q; qb.xz -= ld * 0.2 * Ht * y * y;   // a leaning, curving trunk
    tr = sdCap(qb, vec3(0.), vec3(0., Ht, 0.), 0.022 * Ht + 0.05);
    vec3 qt = q - vec3(ld.x * 0.2 * Ht, Ht, ld.y * 0.2 * Ht); float r = length(qt.xz), a = atan(qt.z, qt.x);
    float R = 0.38 * Ht, fr = abs(fract(a * 1.432 + id * 3.) - 0.5) * 2.;   // nine fronds that arch up and droop
    float dr = qt.y - 0.12 * Ht * sin(3.14 * min(r / R, 1.)) + 0.25 * Ht * pow(r / R, 2.);
    cr = max(max(r - R, abs(dr) - 0.025 * Ht), (fr - 0.3 - 0.2 * r / R) * max(r, 0.3)) * 0.55;
  } else if (ty < 5.5) {
    cr = sdCap(q, vec3(0.), vec3(0., Ht, 0.), 0.09 * Ht);
    float a1 = id * 50.; vec3 d1 = vec3(cos(a1), 0., sin(a1));
    if (fract(id * 13.) > 0.25) cr = min(cr, min(sdCap(q, vec3(0., 0.42 * Ht, 0.), vec3(0., 0.47 * Ht, 0.) + d1 * 0.22 * Ht, 0.065 * Ht), sdCap(q, vec3(0., 0.47 * Ht, 0.) + d1 * 0.22 * Ht, vec3(0., 0.76 * Ht, 0.) + d1 * 0.22 * Ht, 0.065 * Ht)));
    if (fract(id * 29.) > 0.5) cr = min(cr, min(sdCap(q, vec3(0., 0.3 * Ht, 0.), vec3(0., 0.35 * Ht, 0.) - d1 * 0.18 * Ht, 0.06 * Ht), sdCap(q, vec3(0., 0.35 * Ht, 0.) - d1 * 0.18 * Ht, vec3(0., 0.6 * Ht, 0.) - d1 * 0.18 * Ht, 0.06 * Ht)));
  } else if (ty < 6.5) {
    cr = smin(sdE(q - vec3(0., 0.55 * Ht, 0.), vec3(0.4, 0.24, 0.4) * Ht), sdE(q - vec3(0.12, 0.62, -0.08) * Ht, vec3(0.26, 0.2, 0.26) * Ht), 0.08 * Ht);   // a low, spreading crown close to the water
    for (int i = 0; i < 6; i++) { float a = id * 20. + float(i) * 1.047; vec3 f = vec3(cos(a), 0., sin(a)) * (0.2 + 0.1 * fract(id * float(i + 2) * 9.)) * Ht;
      tr = min(tr, sdCap(q, vec3(0., 0.34 * Ht, 0.) + f * 0.25, f + vec3(0., -0.5, 0.), 0.01 * Ht + 0.03)); }   // short arching prop roots
  } else if (ty < 7.5) {
    cr = smin(sdE(q - vec3(0., 0.2 * Ht, 0.), vec3(0.4, 0.28, 0.4) * Ht), sdE(q - vec3(0.15, 0.25, -0.1) * Ht, vec3(0.28, 0.25, 0.28) * Ht), 0.1 * Ht);
  } else if (ty < 8.5) {
    tr = sdCap(q, vec3(0.), vec3(0., 0.5 * Ht, 0.), 0.018 * Ht + 0.05);
    cr = sdE(q - vec3(0., 0.62 * Ht, 0.), vec3(0.075, 0.4, 0.075) * Ht);   // a tall, narrow spire of foliage
  } else if (ty < 9.5) {
    tr = sdCap(q, vec3(0.), vec3(0., 0.4 * Ht, 0.), 0.1 * Ht + 0.05);
    cr = smin(sdE(q - vec3(0., 0.5 * Ht, 0.), vec3(0.6, 0.22, 0.6) * Ht), sdE(q - vec3(0.1, 0.62, -0.05) * Ht, vec3(0.35, 0.16, 0.35) * Ht), 0.08 * Ht);   // a wide, flat cushion on a thick trunk
  } else {
    vec3 c = vec3(0., 0.62 * Ht, 0.), nn = normalize(uS1Dir + vec3(0., 0.15, 0.)), d = q - c; float hh = dot(d, nn), rr = length(d - nn * hh);
    tr = sdCap(q, vec3(0.), c - nn * 0.04 * Ht, 0.016 * Ht + 0.04);
    float rim = 0.42 * Ht * (0.88 + 0.08 * sin(atan(d.z, d.x) * 7. + id * 20.) + 0.05 * sin(atan(d.z, d.x) * 13. - id * 9.));   // a ragged, leafy rim
    cr = max(rr - rim, abs(hh - 0.25 * Ht * (rr / (0.42 * Ht)) * (rr / (0.42 * Ht))) - 0.03 * Ht) * 0.7;   // a shallow dish turned to the star
  }
  if (ty < 4.5 || (ty > 5.5 && ty < 9.5)) cr += (0.035 * lumps(q, 14. / Ht) + 0.018 * lumps(q, 40. / Ht)) * Ht * (ty > 1.5 && ty < 2.5 ? 0.6 : 1.);   // foliage is clumped, not smooth
  part = tr < cr ? 0. : 1.;
  return min(tr, cr) * 0.85;
}
// plants in grids of cells, at most one per cell, so only the cell a point is in needs testing; each cell's set-up is cached.
// Grid 0 holds lone plants (acacias, succulents, palms, mangroves, bushes); grids 1 and 2, offset by half a cell, hold the nearby trees of a forest,
// placed wherever the ecology says trees grow, so their spacing has no pattern
float gTBest = 1e5;
#define PLANTS (uTDen > 0. || uCan1.x > 0.)
#define PTOP max(uTTop, uCan1.x > 0. ? uCan1.z * 1.6 + 1. : 0.)
#define PRANGE max(uTRange, uCan1.x > 0. ? 400. : 0.)
vec4 gC0 = vec4(1e5), gC1 = vec4(1e5), gC2 = vec4(1e5), gP0 = vec4(0.), gP1 = vec4(0.), gP2 = vec4(0.); vec3 gI = vec3(0.);
float gTReal = 0., gTExit = 1e5; vec3 gRd = vec3(0., 1., 0.);   // gRd: the ray being marched, so a step can jump straight to the next cell
float plantCell(vec3 p, int k, float S, vec2 off, inout vec4 C, inout vec4 P, inout float idc) {
  vec2 g = (p.xz + off) / S, cid = floor(g), fr = g - cid;
  gTExit = min(gTExit, min(abs(gRd.x) < 1e-4 ? 1e5 : (gRd.x > 0. ? 1. - fr.x : fr.x) / abs(gRd.x), abs(gRd.z) < 1e-4 ? 1e5 : (gRd.z > 0. ? 1. - fr.y : fr.y) / abs(gRd.z)) * S + 0.02);   // along the ray to the next cell (a ray parallel to a cell edge never crosses it: without this, the column straight ahead stalled on the edge)
  if (cid != C.xy) {
    C = vec4(cid, 0., 0.); float id = h21(cid + 5.5 + float(k) * 17.); idc = id;
    vec2 c = (cid + 0.5 + (vec2(h21(cid + 3.1 + float(k)), h21(cid + 7.7 + float(k))) - 0.5) * (k == 0 ? 0.5 : 0.4)) * S - off;
    float L2 = dot(c, c);
    bool cand = L2 > 40. && (k == 0 ? h21(cid + 1.3) < uTDen && L2 < uTRange * uTRange && fbm((c + uSeed) / uTPatch + 3.) > 0.72 - 0.44 * uTClump : L2 < 380. * 380.);
    if (cand) {
      float m, sr = gRock, se = gEdge, sd = gD; gD = 0.; gNoCan = 1.; float b = H(c, m), eco = gEco; gNoCan = 0.; gRock = sr; gEdge = se; gD = sd;   // ground under the stem
      float ty, Ht, rf; bool ok;
      if (k == 0) { bool isB = id < uTMix; ty = isB ? uTB : uTA; Ht = isB ? uTHB : uTHA;
        ok = ty > 5.5 && ty < 6.5 ? b > -0.9 && b < 0.7 && fract(id * 7.) < 0.55 : b > 1.1 && !(ty > 3.5 && ty < 4.5 && isB && b > 9.); }   // mangroves between the tides; palms by the shore
      else { ty = uSpec.x > 0. ? uSpec.x : uCan1.w > 0.5 && uCan1.w < 1.5 ? 2. : 1.; Ht = uCan1.z * (fract(id * 23.) < uCan2.x ? 1.45 : 1.); ok = fract(id * 3.7) < eco * 1.05 && b > 1.1; }   // forest trees where the ecology puts them
      rf = ty < 1.5 ? 0.3 : ty < 2.5 ? 0.22 : ty < 3.5 ? 0.46 : ty < 4.5 ? 0.6 : ty < 5.5 ? 0.33 : ty < 6.5 ? 0.4 : ty < 7.5 ? 0.45 : ty < 8.5 ? 0.09 : ty < 9.5 ? 0.62 : 0.44;   // crown reach as a fraction of height
      if (ok) { C.z = 1.; C.w = b; P = vec4(c, ty, min(Ht * (0.7 + 0.6 * fract(id * 17.)), (k == 0 ? 0.25 : 0.3) * S / rf)); }   // never wider than its cell allows
    }
  }
  if (C.z < 0.5) return 1e5;
  vec3 q = vec3(p.x - P.x, p.y - C.w, p.z - P.y); float part;
  float d = plant(q, P.z, P.w, idc, part);
  if (d < gTBest) { gTBest = d; gTPart = part; gTTy = P.z; gTH = P.w; gTq = q; gTId = idc; }
  return d;
}
float trees(vec3 p) {
  gTExit = 1e5; gTBest = 1e5; float d = 1e5;
  if (uTDen > 0.) d = plantCell(p, 0, uTS, vec2(0.), gC0, gP0, gI.x);
  if (uCan1.x > 0. && dot(p.xz, p.xz) < 400. * 400.) { float S = uCan1.y * 1.25;
    d = min(d, plantCell(p, 1, S, vec2(0.), gC1, gP1, gI.y)); d = min(d, plantCell(p, 2, S, vec2(0.5 * S, 0.31 * S), gC2, gP2, gI.z)); }
  gTReal = d < 1e4 ? 1. : 0.;
  return d;
}
#endif
float march(vec3 ro, vec3 rd, out float mat) {
  float t = 0.05; mat = 0.;
  for (int i = 0; i < 220; i++) {
    if (uMode > 0.5 && i > 150) break;
    vec3 p = ro + rd * t; float m; gY = p.y; float h = H(p.xz, m); gY = -1e9;
    float d = p.y - h, sf = uMode > 0.5 ? 0.3 : 0.45, lim = 1e5;
#if BIO
    if (uMode < 0.5 && PLANTS && d < PTOP && t < PRANGE) { gRd = rd; float dt = trees(p); lim = gTExit; if (dt < d) { d = dt; m = 7. + gTPart; sf = 0.8; } }   // plants are tested only within reach of the ground, one cell at a time
#endif
    if (m > 5.5 && m < 6.5) sf = 0.25;   // the canopy's steep edges: short steps, or the rays overshoot into stripes
    if (d < 0.0015 * t) { mat = m; return t; }
    t += uMode > 0.5 ? max(0.001, d * sf) : min(max(0.008, d * sf), lim);
    if (t > 16000.) break;
  }
  return -1.;
}
vec3 nrm(vec2 p, float t) { float e = max(0.004, t * 0.0015); float m;
  return normalize(vec3(H(p - vec2(e, 0), m) - H(p + vec2(e, 0), m), 2. * e, H(p - vec2(0, e), m) - H(p + vec2(0, e), m))); }
// soft shadows whose penumbra matches the star's angular size: crisp under a small star, blurred under a huge one
float shadow(vec3 p, vec3 L, float rad) {
  if (L.y < -0.05) return 0.;
  float k = clamp(1. / tan(max(rad, 0.004)), 2., 60.), s0 = uMode > 0.5 ? 0.33 : 1.;   // close-up: skip millimetre bumps (the normals shade those)
  float res = 1., t = 0.03 * s0; gD = -1.;
  for (int i = 0; i < 64; i++) { vec3 q = p + L * t; float m; gY = q.y; float d = q.y - H(q.xz, m), ds = d; gY = -1e9;   // ds: step limit (a cell edge counts); d: only real plants cast shade
#if BIO
    if (uMode < 0.5 && PLANTS && d < PTOP && t < 70. && dot(q.xz, q.xz) < PRANGE * PRANGE) { gRd = L; float dt = trees(q); d = min(d, dt); ds = min(d, gTExit); }   // only nearby plants shade a spot
#endif
    res = min(res, 0.5 + 0.5 * k * d / t); if (res < 0.01) break; t += max(0.03 * s0, ds * (uMode > 0.5 ? 0.4 : 0.6)); if (t > (uMode > 0.5 ? 40. : 1500.)) break; }
  gD = 0.;
  return smoothstep(0., 1., clamp(res, 0., 1.));
}
vec3 skyTex(vec3 d) { float az = atan(d.x, d.z); float el = asin(clamp(d.y, -1., 1.));
  vec2 uv = vec2(az / 6.2831853 + 0.5, clamp((degrees(el) + 8.) / 98., 0.002, 0.998)); return pow(texture2D(uSky, uv).rgb, vec3(2.2)); }
vec3 sunAdd(vec3 d) {
  vec3 c = vec3(0.);
  float a1 = acos(clamp(dot(d, uS1Dir), -1., 1.));
  if (a1 < uS1Rad) { float mu = sqrt(max(0., 1. - (a1 / uS1Rad) * (a1 / uS1Rad)));   // limb darkening: the edge is dimmer and redder
    c += uS1Col * 2.6 * (0.35 + 0.65 * mu) * vec3(1., 0.82 + 0.18 * mu, 0.62 + 0.38 * mu) / max(0.2, max(uS1Col.r, max(uS1Col.g, uS1Col.b))); }
  c += uS1Col * (0.06 + 0.45 * uAir) * exp(-(a1 - uS1Rad) / (uS1Rad * 1.2 + 0.025));
  if (uS2On > 0.5) { float a2 = acos(clamp(dot(d, uS2Dir), -1., 1.));
    if (a2 < uS2Rad) c += uS2Col * 30. / max(0.02, max(uS2Col.r, max(uS2Col.g, uS2Col.b)));
    c += uS2Col * (0.06 + 0.45 * uAir) * exp(-(a2 - uS2Rad) / (uS2Rad * 1.2 + 0.02)); }
  return c;
}
// wind waves: seven components spread around the wind; deep-water dispersion ω² = g k, so on a low-gravity world they move more slowly.
// Components shorter than a few pixels are dropped, which leaves the far sea smooth and mirror-like, as it looks. Returns slopes and crest height (0..1).
vec3 waves(vec2 q, float t) {
  vec2 sl = vec2(0.); float hc = 0., sa = 0.;
  float k = uMode > 0.5 ? 2.2 : 0.16, a = 1., g = 9.81 * max(uG, 0.1), fp = t / uF;
  for (int i = 0; i < 7; i++) {
    float an = (h21(vec2(float(i), 3.7)) - 0.5) * 1.8;
    vec2 d = vec2(uWind.x * cos(an) - uWind.y * sin(an), uWind.x * sin(an) + uWind.y * cos(an));
    float fade = 1. - smoothstep(0.3, 1.2, fp * k);
    float ph = k * dot(d, q) - sqrt(g * k) * uTime + float(i) * 1.7, sn = sin(ph);
    sl += d * 0.2 * a * cos(ph) * (1. + 0.7 * sn) * fade;   // sharpened crests
    hc += a * (0.5 + 0.5 * sn) * fade; sa += a * fade;
    k *= 1.6; a *= 0.78;
  }
  return vec3(sl, hc / max(sa, 1e-3));
}
// shadows of the low cloud deck on the ground or sea below
float cloudShade(vec3 p) {
  if (uClouds <= 0.) return 1.;
  vec2 cp = p.xz * (1. - uMode) + uS1Dir.xz * (1500. - p.y) / max(uS1Dir.y, 0.08) + uSeed * 3.;
  return 1. - 0.8 * smoothstep(1. - uClouds, 1. - uClouds + 0.18, fbm(cp / 2200.));
}
// a cloud deck at altitude alt (m): coverage from noise, lit side brightened by sampling density toward the star
vec4 cloudDeck(vec3 d, float alt, float scale, float cover, float soft, float streak) {
  if (cover <= 0. || d.y < 0.01) return vec4(0.);
  float t = alt / d.y; vec2 p = d.xz * t + uSeed * 3.;
  p.x *= mix(1., 0.25, streak);
  float c = fbm(p / scale);
  float cov = smoothstep(1. - cover, 1. - cover + soft, c) * smoothstep(0.01, 0.1, d.y);
  vec2 toS = uS1Dir.xz / max(uS1Dir.y, 0.15);
  float c2 = fbm((p + toS * scale * 0.12) / scale);
  float lit = clamp(1. - (c2 - c) * 5., 0.3, 1.25);
  float a1 = acos(clamp(dot(d, uS1Dir), -1., 1.)); cov *= smoothstep(uS1Rad * 2. + 0.03, uS1Rad * 4. + 0.16, a1);
  vec3 col = uCloudCol * (uS1Col * max(0.12, uS1Dir.y) * lit + uAmb * 1.3);
  return vec4(col, cov * 0.95 * exp(-t / 70000.));
}
vec4 anGet(float k) { vec4 a = vec4(0.); for (int i = 0; i < AN_MAX; i++) if (float(i) == k) a = uAn[i]; return a; }
void main() {
  vec2 fc = gl_FragCoord.xy + uJit; float px = fc.x, py = uRes.y - fc.y;
  float x = (px - uRes.x * .5) / uF, y = -(py - uRes.y * .5) / uF, z = 1.;
  float cp = cos(uPitch), sp = sin(uPitch), cy = cos(uYaw), sy = sin(uYaw);
  float y1 = y * cp + z * sp, z1 = -y * sp + z * cp; float x2 = x * cy + z1 * sy, z2 = -x * sy + z1 * cy;
  vec3 rd = normalize(vec3(x2, y1, z2)); vec3 ro = vec3(0., uCamH, 0.);
  if (uGround > 2.5 && uGround < 3.5 && uLand > 0.5 && uMode < 0.5) { float m0; gNoCan = 1.; ro.y += max(0., H(vec2(0.), m0) - 0.9); gNoCan = 0.; }   // inland: stand on the ground
  if (uProbe > 0.5) {   // probe pass: ground height, slope and forest cover under each candidate animal, and whether a ray from your eye to a point
    // uProbeTop above that ground reaches it past hills, rocks and plants (the same march that draws them, so the answer is exact); read back by the page
    float k = floor(gl_FragCoord.x); vec4 a = anGet(floor(k * 0.5)); vec2 c = mod(k, 2.) < 0.5 ? a.xy : a.zw; float m;
    gNoCan = 1.; gEco = 0.; float h = H(c, m), eco = gEco, hx = H(c + vec2(1.5, 0.), m), hz = H(c + vec2(0., 1.5), m); gNoCan = 0.;
    vec3 tg = vec3(c.x, max(h, 0.) + uProbeTop, c.y), dv = tg - ro; float dist = length(dv), tm = march(ro, dv / dist, m), vis = tm < 0. || tm > dist - 0.6 ? 1. : 0.;
    float v = floor(clamp((h + 1000.) / 4000., 0., 1.) * 65535.), sl = floor(clamp(length(vec2(hx - h, hz - h)) / 1.5, 0., 1.) * 127.);
    gl_FragColor = vec4(floor(v / 256.) / 255., mod(v, 256.) / 255., (sl + 128. * vis) / 255., clamp(eco, 0., 1.)); return; }
  vec3 col = vec3(0.); float mat = 0.; float t = -1.;
  if (uUnknown > 0.5) {
    if (rd.y < 0.) { t = ro.y / -rd.y; vec3 p = ro + rd * t; float hatch = step(0.5, fract((p.x + p.z) * 0.25)); col = mix(vec3(0.010), vec3(0.024), hatch); col = mix(col, vec3(0.018), 1. - exp(-t * 0.004)); }
  } else {
    t = march(ro, rd, mat);
    float tw = -1.; if (uGround > 2.5 && uGround < 3.5 && rd.y < 0.) tw = ro.y / -rd.y;
    if (tw > 0. && (t < 0. || tw < t)) {
      // water: waves, rain rings, Fresnel sky reflection, shallows, surf and floes
      vec3 p = ro + rd * tw; vec2 q = p.xz;
      vec3 wv = waves(q, tw), rp = noised(q * (uMode > 0.5 ? 9. : 1.3) + uTime * 0.4) * (1. - smoothstep(10., 60., tw));   // plus small wind ripples nearby
      vec3 n = normalize(vec3(-wv.x - 0.03 * rp.y, 1., -wv.y - 0.03 * rp.z));
      if (uMode > 0.5 && uRain > 0.5) {
        vec2 rip = vec2(0.); vec2 g = floor(q * 4.);
        for (int yy = -1; yy <= 1; yy++) for (int xx = -1; xx <= 1; xx++) {
          vec2 o = g + vec2(float(xx), float(yy)); vec2 c = (o + vec2(h21(o), h21(o + 3.1))) / 4.;
          float ph = fract(uTime * 0.7 + h21(o + 9.)); vec2 dv = q - c; float r = length(dv), R = ph * 0.32;
          float wv = sin((r - R) * 120.) * exp(-abs(r - R) * 45.) * (1. - ph) * (1. - ph);
          rip += dv / (r + 1e-3) * wv; }
        n = normalize(n + vec3(rip.x * 1.3, 0., rip.y * 1.3));
      }
      float m2; float depth = -H(q, m2);
      vec3 rr = refract(rd, n, 0.75); float path = max(0., depth) / max(0.2, -rr.y);   // metres of water on the way to the bottom
      vec2 qb = q + rr.xz * path; float mb; float db = max(0., -H(qb, mb));
      float sh = shadow(p + vec3(0, 0.05, 0), uS1Dir, uS1Rad) * cloudShade(p);
      float fres = 0.02 + 0.98 * pow(1. - max(0., dot(-rd, n)), 5.);
      vec3 rf = reflect(rd, n);
      vec3 refl = skyTex(vec3(rf.x, max(rf.y, 0.01), rf.z)) + sunAdd(rf) * 0.6 * sh;
      vec3 light = uS1Col * max(0., uS1Dir.y) * sh + uAmb;
      vec3 bedA0 = mb > 4.5 ? uMatCol * (0.8 + 0.3 * vn(qb * 5.)) : mb > 0.5 ? mix(uRockB, uRockA, fract(gRock * 17.3)) * (0.7 + 0.5 * fract(gRock * 41.7)) : uDustCol * (0.75 + 0.35 * vn(qb * 8.));
      vec3 bedA = uMats > 0. ? mix(bedA0, uMatCol, uMats * 0.9 * smoothstep(0.38, 0.55, fbm((qb + uSeed) / (uMode > 0.5 ? 0.6 : 6.)))) : bedA0;   // mats on the shallow bottom (imagined)
      float caus = 0.6 * (exp(-cell(qb * 2.3 + 0.4 * vec2(fbm3(qb), fbm3(qb + 3.)) + vec2(uTime * 0.13, uTime * 0.09)).y * 11.) + exp(-cell(qb * 3.1 - vec2(uTime * 0.11, -uTime * 0.07)).y * 11.));
      if (uPlants > 0.5) { vec3 kc = cell((qb + uSeed) * (uMode > 0.5 ? 2.2 : 0.35)); float fr = step(0.55, kc.z) * (1. - smoothstep(0.08, 0.38, kc.x)) * (0.6 + 0.4 * sin(atan(qb.y - kc.z, qb.x) * 9. + uTime));
        bedA = mix(bedA, uPlantCol * (0.6 + 0.6 * kc.z), fr * smoothstep(3.5, 0.5, db)); }   // seaweed in shallow water (imagined)
      vec3 att = exp(-vec3(0.45, 0.07, 0.03) * (path + db));   // pure water absorbs red first
      vec3 body = bedA * (uS1Col * max(0., uS1Dir.y) * sh * (0.55 + 0.9 * caus * exp(-db * 0.4)) + uAmb) * att + uWaterCol * light * (1. - att);
      float bl = 0.;
      if (uBloom > 0.) { vec2 bq = (q + uSeed) / (uMode > 0.5 ? 6. : 700.); bl = smoothstep(0.48, 0.72, fbm(bq + 0.7 * vec2(fbm(bq * 0.4), fbm(bq * 0.4 + 3.))));
        body = mix(body, uPlantCol * 1.6 * light, bl * uBloom * 0.85);   // plankton blooms colour the water in swirls (imagined)
        if (uMode > 0.5) body += uPlantCol * light * step(0.9965, h21(floor((q + uSeed) * 260.))) * 0.5 * uBloom; }   // drifting specks
      col = mix(body, refl, fres);
      if (uPlants > 0.5 && uLand < -0.5) {   // floating meadows on an ocean with no land: long rafts drawn out by wind and currents (imagined)
        vec2 rq = (q + uSeed) / (uMode > 0.5 ? 2.5 : 60.); rq.x *= 0.45;
        float raft = smoothstep(0.46, 0.52, fbm(rq + 0.8 * vec2(fbm(rq * 1.7), fbm(rq * 1.7 + 4.)))) * (1. - smoothstep(1500., 6000., tw));
        float clump = smoothstep(0.25, 0.7, vn(q * (uMode > 0.5 ? 9. : 1.1)) + 0.4 * vn(q * (uMode > 0.5 ? 31. : 4.)));   // leafy clumps with water between
        col = mix(col, mix(uPlantCol, uMatCol, 0.25) * (uS1Col * max(0.25, uS1Dir.y) + uAmb) * (0.55 + 0.8 * clump), raft * (0.6 + 0.35 * clump)); }
      col = mix(col, uPlantCol * light * 1.3, bl * uBloom * 0.3);   // in a dense bloom some cells float as a surface scum, seen even where the water mirrors the sky
      col += uWaterCol * uS1Col * max(0., uS1Dir.y) * sh * smoothstep(0.55, 0.9, wv.z) * 0.6;   // light through the thin crests
      if (uPlants > 0.5 && uMode < 0.5 && depth > 0.8 && depth < 14.) {   // kelp canopy: fronds float in mats at the surface over shallow rock (imagined)
        vec2 kq = (q + uSeed) / 22.; float kp = smoothstep(0.55, 0.66, fbm(kq + 0.5 * vec2(fbm(kq * 2.), fbm(kq * 2. + 5.)))) * smoothstep(0.8, 2., depth) * (1. - smoothstep(9., 14., depth));
        col = mix(col, mix(uPlantCol, uMatCol, 0.5) * light * (0.8 + 0.5 * vn(q * 3.)), kp * 0.85); }
      col = mix(col, uIceCol * light * 0.85, smoothstep(0.86, 0.97, wv.z + 0.08 * fbm3(q * 0.7)) * 0.7 * uAir * (1. - uMode) * (1. - smoothstep(200., 900., tw)));   // whitecaps on the steepest crests
      if (uLand > -0.5) { float foam = (uCoast > 4.5 && depth < 0.9 ? 0.12 : 1.) * (1. - smoothstep(0., uMode > 0.5 ? 0.1 : 0.7, depth)) * (0.55 + 0.45 * sin(uTime * 1.4 + depth * 9. + fbm3(q * 0.6) * 7.)); col = mix(col, uIceCol * light * 0.9, clamp(foam, 0., 1.) * 0.8); }
      t = tw;
    } else if (t > 0.) {
      vec3 p = ro + rd * t; float rid = gRock; gD = 1.; vec3 n = nrm(p.xz, t); gD = 0.;
#if BIO
      if (mat > 6.5) { float e = 0.015 + t * 0.0006; vec3 nn = vec3(0.);   // a plant: normal from its own shape, sampled at four corners of a tetrahedron;
        // one call site in a loop (the last pass, at p itself, leaves the plant's details set for shading): every call is a full inlined copy of the
        // plant code, and the old six-sample normal doubled the time GPU drivers need to compile this shader on first use (20 s to 10 s with ANGLE on Metal)
        for (int i = 0; i < 5; i++) { vec3 o = i == 0 ? vec3(1., -1., -1.) : i == 1 ? vec3(-1., -1., 1.) : i == 2 ? vec3(-1., 1., -1.) : i == 3 ? vec3(1.) : vec3(0.); nn += o * trees(p + o * e); }
        n = normalize(nn); }
#endif
      float slope = 1. - n.y;
      float sh = shadow(p + n * (mat > 3.5 && mat < 4.5 || mat > 5.5 ? 0.8 : 0.02 * (uMode > 0.5 ? 0.1 : 1.)), uS1Dir, uS1Rad) * cloudShade(p);   // foliage: start the shadow ray clear of its own leaves (no banding)
      float mu0 = max(0., dot(n, uS1Dir)), muv = max(0.05, dot(n, -rd));
      vec3 L = uS1Col * (uGround < 1.5 ? mix(2. * mu0 / (mu0 + muv), mu0, uAir) : mu0) * sh;   // airless dust scatters like the Moon's (Lommel–Seeliger): no darkening toward grazing view
      if (uS2On > 0.5) L += uS2Col * max(0., dot(n, uS2Dir)) * shadow(p + n * 0.02, uS2Dir, uS2Rad);
      vec3 amb = uAmb * (0.5 + 0.5 * n.y) + uBounce * (0.5 - 0.5 * n.y);
      // ambient occlusion from two samples along the normal: crevices and the bases of rocks get less sky and bounce light
      if (uGround < 4.5) { float m3, as = uMode > 0.5 ? 0.06 : 1.; float o1 = clamp((p.y + n.y * 0.5 * as - H(p.xz + n.xz * 0.5 * as, m3)) / (0.5 * as), 0., 1.), o2 = clamp((p.y + n.y * 4. * as - H(p.xz + n.xz * 4. * as, m3)) / (4. * as), 0., 1.);
        float ao = clamp(0.35 + 0.35 * o1 + 0.3 * o2, 0.25, 1.); amb *= ao; L *= mix(1., ao, 0.25); }
      vec3 alb;
      float var = uMode > 0.5 ? 0.5 + 0.6 * (fbm3(mat2(0.8, -0.6, 0.6, 0.8) * (p.xz + uSeed) * 9.) - 0.5) : 0.6 * fbm3((p.xz + uSeed) / 4.) + 0.4 * fbm3((p.xz + uSeed) / 40.);
      if (uGround > 4.5) {
        float band = 0.5 + 0.5 * sin((p.z + uSeed.y) / 900. + fbm3(p.xz / 1500.) * 4.);
        alb = mix(uDeckA, uDeckB, band * uStyle.w + (1. - uStyle.w) * 0.5);
        if (uPatch > 0.) { vec2 pc = (p.xz + uSeed) / clamp(pow(uScaleH, 0.5), 0.6, 1.5); pc.x *= mix(1., 0.28, uStreak); alb = mix(alb, uDeckC, smoothstep(1. - uPatch, 1.25 - uPatch, fbm(pc / 2600. + 9.))); }   // deeper air in the gaps
        float dep = smoothstep(-60., 420., p.y);   // deep in the creases less light gets through
        L = uS1Col * clamp((dot(n, uS1Dir) + 0.35) / 1.35, 0., 1.) * (0.62 + 0.38 * sh) * (0.55 + 0.45 * dep); amb = uAmb * 1.6 * (0.5 + 0.5 * dep);   // clouds scatter light into their own shadows
        L += uS1Col * pow(1. - max(0., dot(n, -rd)), 3.) * pow(max(0., dot(rd, uS1Dir)), 3.) * 0.6;   // silver lining: thin edges lit from behind
      } else if (uGround > 1.5 && uGround < 2.5) {
        alb = mix(uIceCol, uIceBlue, smoothstep(0.25, 0.55, slope));
        if (mat > 0.5) alb = mix(uIceCol, uIceBlue, 0.45 + 0.35 * fract(rid * 17.3));   // blocks of ice, not rock
        alb *= 1. + 0.12 * (var - 0.5);
        if (uLandform > 5.5 && uMode < 0.5) { vec2 pp = p.xz + uSeed; float e = cell(pp / 700. + 0.3 * vec2(fbm3(pp / 900.), fbm3(pp / 900. + 4.))).y * 350.; alb = mix(alb, uRockC, uAccent * exp(-e / 25.)); }   // salts stain the ridges
        if (uMode > 0.5) { alb *= 0.92 + 0.08 * h21(floor((p.xz + uSeed) * 500.)); alb = mix(alb, mix(uIceCol, uIceBlue, 0.5), 0.35 * smoothstep(0.55, 0.72, fbm3((p.xz + uSeed) * 2.))); }   // grains, and patches of wind-glazed crust
      } else if (uGround > 2.5 && uGround < 3.5) {
        float hgt = p.y;
        alb = mix(uDustCol, uRockA, smoothstep(0.3, 1.0, hgt));             // narrow beach, then land
        alb = mix(alb, uRockB, smoothstep(0.3, 0.6, slope));                  // cliffs
        if (hgt < 0.3 * uTide) alb *= 0.65;                                   // wet sand: wider where the tides are large
        if (uMats > 0. && mat < 2.5 && hgt > 0.03 && hgt < 1.6 * uTide && slope < 0.3) alb = mix(alb, uMatCol * (0.7 + 0.6 * fbm3((p.xz + uSeed) * 2.)), uMats * smoothstep(0.36, 0.52, fbm((p.xz + uSeed) / (uMode > 0.5 ? 0.5 : 7.))));   // microbial mats on wet ground (imagined)
        if (uDry > 0. && hgt > 1.) alb = mix(alb, vec3(0.42, 0.28, 0.17), uDry * 0.5 * smoothstep(1., 4., hgt));   // dry, oxidised soil
        if (uAccent > 0. && hgt > 2.) alb = mix(alb, uRockC, uAccent * smoothstep(0.45, 0.6, fbm((p.xz + uSeed) / 180.)));   // clay soils inland
#if BIO
        vec2 pg = p.xz + uSeed;
        if (uBio2.x > 0. && hgt > 1.) alb *= 1. - uBio2.x * 0.5 * smoothstep(0.45, 0.62, vn(pg * (uMode > 0.5 ? 9. : 1.3)));   // biological soil crust: dark, crumbly patches on dry ground
        if (uBio2.z > 0. && hgt > 0.5 && slope < 0.6) { float gc = fbm3(pg / 25.), gf = vn(pg * (uMode > 0.5 ? 40. : 3.));   // grass and low growth above the spray, in patches and tufts
          vec3 gcol = uGrassCol * (0.75 + 0.5 * gc) * (0.85 + 0.3 * gf);
          if (uBio3.x > 0.) { vec2 wd = vec2(dot(pg, uWind), dot(pg, vec2(-uWind.y, uWind.x)));   // tall grass combed by the wind: long light and dark swathes
            gcol *= mix(1., 0.72 + 0.5 * vn(vec2(wd.x * 0.02, wd.y * 0.2)) + 0.15 * vn(vec2(wd.x * 0.3, wd.y * 3.)) * step(t, 150.), uBio3.x); }
          gcol = mix(gcol, uPlant2 * 1.2, 0.35 * smoothstep(0.5, 0.7, fbm(pg / 90.)));   // meadows of a second kind of plant
          alb = mix(alb, gcol, uBio2.z * (0.75 + 0.3 * smoothstep(0.35, 0.55, gc)) * smoothstep(0.5, 1.3, hgt) * (1. - smoothstep(0.42, 0.62, slope)));
          if (uBio1.x > 0.) { float fl = smoothstep(0.55, 0.75, fbm(pg / 30.)) * uBio1.x;   // flowering patches: blooms up close, a soft tint far off
            float bl = smoothstep(0.7, 0.78, vn(pg * (uMode > 0.5 ? 25. : 3.5))) * (1. - smoothstep(25., 70., t));
            alb = mix(alb, uFlowerCol, fl * (0.25 + 0.65 * bl)); } }
        if (uBio1.w > 0. && hgt > 0.05 && hgt < 1.4 * uTide + 0.6) { float rd2 = 0.6 + 0.5 * vn(vec2(p.x * 2.5, p.z * 0.4) + uSeed) * vn(vec2(p.x * 0.4, p.z * 2.5));   // salt marsh: reeds and rushes between the tides
          alb = mix(alb, mix(uGrassCol, vec3(0.45, 0.4, 0.22), 0.4) * rd2, uBio1.w * smoothstep(0.35, 0.5, fbm(pg / 40.) + 0.1)); }
        if (rid > 0. && hgt > 0.4) { float top = smoothstep(0.45, 0.85, n.y);   // lichen and moss on the stones
          alb = mix(alb, uLichenCol * (0.8 + 0.4 * fract(rid * 31.)), uBio1.y * smoothstep(0.5, 0.7, vn(p.xz * 6. + rid * 40.)) * top);
          alb = mix(alb, uPlant2 * 1.1, uBio1.z * smoothstep(0.4, 0.6, vn(p.xz * 3. + rid * 20.)) * (0.4 + 0.6 * top)); }
#endif
        if (uFrost > 0.01 && hgt > 60.) alb = mix(alb, uFrostCol, smoothstep(60., 200., hgt) * uFrost);
        alb *= 1. + 0.4 * (var - 0.5);
#if BIO
        if (mat > 7.5) {   // foliage (or a succulent's green stem): each plant its own shade, darker inside and below
          float tone = fract(gTId * 13.), lf = 0.55 + 0.35 * vn(p.xz * 2.2 + gTq.y * vec2(1.7, -0.9)) + 0.35 * vn(p.zx * 9.1 - gTq.y * vec2(0.6, 2.3)) * step(t, 250.);
          float inner = 0.5 + 0.5 * lumps(gTq, 9. / gTH);   // hollows between clumps are darker
          alb = mix(uPlantCol, uPlant2, tone * 0.8) * lf * (0.4 + 0.6 * smoothstep(0.35, 0.95, gTq.y / gTH)) * (0.6 + 0.5 * inner);
          if (gTTy > 4.5 && gTTy < 5.5) alb = mix(uPlantCol, uPlant2, 0.5) * 1.3 * (0.8 + 0.2 * sin(atan(gTq.z, gTq.x) * 18.));   // ribbed succulent stems
        } else if (mat > 6.5) alb = uBarkCol * (0.75 + 0.5 * vn(vec2(gTq.y * 3., atan(gTq.z, gTq.x) * 2.) + gTId * 9.)) * (gTTy > 3.5 && gTTy < 4.5 ? 1.5 : 1.);   // trunks: palm stems paler
        else
#endif
        if (mat > 5.5) {   // forest canopy: each crown its own shade, sunlit tops, dark gaps; an accent colour on a few crowns
          vec3 base = mix(uPlantCol, uPlant2, fract(gCanId * 13.) * 0.85);
          base = mix(base, uPlant3, uBio3.z * step(0.88, fract(gCanId * 29.)));
          float lf = 0.72 + 0.28 * vn(p.xz * 1.3) + 0.3 * (vn(p.xz * 4.7 + 7.) - 0.5) * step(t, 350.);
          alb = base * lf * (0.3 + 0.7 * smoothstep(0.15, 0.95, gCanRel)) * (0.75 + 0.15 * (1. - gCanX)) * (0.85 + 0.3 * fbm(p.xz / 80.)); }
        else if (mat > 4.5) alb = uMatCol * (0.75 + 0.25 * sin(p.y * 70. + vn(p.xz * 4.) * 3.)) * (0.8 + 0.4 * vn(p.xz * 5. + rid));   // stromatolite: layered microbial mat over trapped sediment
        else if (mat > 3.5) alb = uPlantCol * (0.55 + 0.7 * fract(rid * 17.3)) * (0.55 + 0.5 * vn(p.xz * 6. + rid * 9.) + 0.4 * vn(p.xz * 15. + rid));   // shrubs, each its own shade, with clumped foliage
        else if (mat > 2.5) alb = mix(uIceCol * (0.84 + 0.16 * fbm3(p.xz * 3.)), uIceBlue * 0.8, clamp(smoothstep(0.04, 0., gEdge) + 0.35 * smoothstep(0.55, 0.75, fbm3(p.xz * 0.8)), 0., 1.));   // floe: snow on top, bare blue ice at the rim
        if (mat > 2.5 && mat < 3.5 && uMats > 0.) alb = mix(alb, mix(uMatCol, vec3(0.7, 0.28, 0.3), 0.75) * 1.3, uMats * 0.85 * smoothstep(0.38, 0.56, fbm((p.xz + uSeed) / (uMode > 0.5 ? 0.4 : 9.))) * (1. - smoothstep(0.02, 0.06, gEdge) * 0.7));   // snow and ice algae stain the floes, reddest where meltwater collects (imagined)
      } else {
        alb = mix(uRockA, uRockB, smoothstep(0.22, 0.5, slope));
        if (uMode > 0.5) alb *= 0.8 + 0.4 * h21(floor((p.xz + uSeed) * 700.));   // sand and dust grains
        if (mat > 0.5 && uGround < 3.5) { float r1 = fract(rid * 17.3), r2 = fract(rid * 41.7);   // every stone its own shade
          alb = mix(uRockB, uRockA, r1) * (0.72 + 0.5 * r2);
          if (r2 > 0.86) alb = mix(alb, uDustCol, 0.55);
          alb *= 0.82 + 0.36 * vn(p.xz * (uMode > 0.5 ? 70. : 7.) + rid * 50.);
          alb = mix(alb, uDustCol, smoothstep(0.85, 0.97, n.y) * uDust * 0.6); }   // dust settled on the tops
        if (uStrata > 0.01) alb *= 1. + uStrata * 0.3 * sin(p.y * 0.35 + fbm3(p.xz / 50.) * 3.) * smoothstep(0.2, 0.45, slope);
        alb = mix(alb, uDustCol, uDust * (1. - smoothstep(0.05, 0.25, slope)) * smoothstep(0.35, 0.65, var + 0.15));
        if (uLandform > 2.5 && uLandform < 3.5) { float sm = smoothstep(0.44, 0.36, fbm((p.xz + uSeed) / 2500.)) * (1. - smoothstep(0.05, 0.2, slope)); vec3 cc = cell((p.xz + uSeed) / (uMode > 0.5 ? 0.4 : 3.));
          alb = mix(alb, uFrostCol * 0.85 * (0.85 + 0.15 * smoothstep(0., 0.05, cc.y)), sm); }   // white salt crust with polygon ridges
        if (uAccent > 0. && mat < 0.5) alb = mix(alb, uRockC * (0.85 + 0.3 * var), uAccent * smoothstep(0.58, 0.66, fbm((p.xz + uSeed) / (uMode > 0.5 ? 0.9 : 260.))) * (1. - smoothstep(0.1, 0.4, slope)));   // accent mineral in patches
        if (uFrost > 0.01) alb = mix(alb, uFrostCol, uFrost * (1. - smoothstep(0.1, 0.35, slope)) * (0.35 + 0.65 * (1. - sh)) * smoothstep(0.4, 0.6, var));
        alb *= 1. + 0.5 * (var - 0.5) * (0.4 + 0.6 * uRelief);
      }
      col = alb * (L + amb);
#if BIO
      if (mat > 7.5 || (mat > 5.5 && mat < 6.5)) col += alb * uS1Col * sh * 0.5 * pow(max(0., dot(rd, uS1Dir)), 3.);   // leaves glow when the star shines through them
      if (mat > 5.5 && mat < 6.5 || mat > 7.5) {
        if (uSpec.z > 0.) { vec3 hv = normalize(uS1Dir - rd); col += uS1Col * sh * uSpec.z * (0.08 + 0.5 * pow(max(0., dot(n, hv)), 12.)); }   // silvery, reflective leaves
        if (uSpec.y > 0.) col += vec3(0.12, 0.85, 0.6) * uSpec.y * (0.04 + 0.16 * (1. - smoothstep(0.02, 0.3, uS1Dir.y))) * (length(uS1Col) * 0.25 + length(uAmb) * 2.)
          * smoothstep(0.45, 0.65, vn(p.xz * (uMode > 0.5 ? 3. : 0.4) + gTId * 7.));   // biofluorescence: flare UV turned into a green-cyan glow (speculative)
      }
#endif
      if (uGround > 4.5) col += uGlow * (pow(1. - smoothstep(-60., 420., p.y), 2.) * 0.8 + uGlowAll * (0.6 + 0.4 * (1. - smoothstep(-60., 420., p.y))));   // deeper, hotter layers show through the creases; an ultra-hot or young deck glows all over
      // weather leaves marks: fresh snow on upward faces; rain darkens, adds a sheen and fills hollows with puddles
      if (uGround < 3.5 && (uGround < 2.5 || (mat > 0.5 && mat < 3.5))) {   // (not on shrubs or stromatolites)
        if (uSnow > 0.01) { float sn = uSnow * smoothstep(0.72, 0.93, n.y) * smoothstep(0.3, 0.55, var + 0.2); col = mix(col, uFrostCol * (L + amb) * 0.95, sn); }
        if (uWet > 0.01) {
          col *= mix(1., 0.62, uWet * smoothstep(0.6, 0.9, n.y + 0.3));
          vec3 hv = normalize(uS1Dir - rd); col += uS1Col * pow(max(0., dot(n, hv)), 50.) * 0.35 * uWet * sh;
          float pud = uWet * smoothstep(0.58, 0.64, vn((p.xz + uSeed) * (uMode > 0.5 ? 1.6 : 0.25))) * smoothstep(0.9, 0.98, n.y) * (1. - smoothstep(30., 120., t));
          if (pud > 0.01) { vec3 rf = reflect(rd, vec3(0., 1., 0.)); col = mix(col, skyTex(vec3(rf.x, max(rf.y, 0.01), rf.z)) * 0.8 + sunAdd(rf) * 0.4 * sh, pud * 0.85); }
        }
      }   // ultra-hot decks: deeper layers glow at their Planck colour
      if (uGround > 3.5 && uGround < 4.5) {
        // open melt: dark, glossy liquid that glows at its own Planck colour and mirrors the sky and star (silicate melt, n ≈ 1.6)
        vec2 lq = (p.xz + uSeed) / (uMode > 0.5 ? 1.5 : 40.);
        float cv = 0.35 + 1.3 * pow(fbm(lq + uTime * 0.01), 2.);   // hotter upwellings, cooler sinking melt
        float skin = smoothstep(0.5, 0.72, fbm(lq * 3. + 7. - uTime * 0.006)) * (0.3 + 0.7 * uCrust);   // thin chilled skin that wrinkles and drifts
        vec3 r1 = noised((p.xz + uSeed) * (uMode > 0.5 ? 3. : 0.35) + uTime * 0.05), r2 = noised((p.xz + uSeed) * (uMode > 0.5 ? 14. : 1.6) - uTime * 0.04);
        n = normalize(n + vec3(r1.y + 0.5 * r2.y, 0., r1.z + 0.5 * r2.z) * ((uMode > 0.5 ? 0.16 : 0.06) + 0.12 * skin));   // slow ripples on the viscous surface
        float fr = 0.05 + 0.95 * pow(1. - max(0., dot(-rd, n)), 5.);
        vec3 rf = reflect(rd, n), refl = skyTex(vec3(rf.x, max(rf.y, 0.01), rf.z)) + sunAdd(rf) * sh;
        vec3 liquid = mix(uGlow * cv, col * 0.6 + uGlow * 0.12, skin) * (1. - fr) + refl * fr * (1. - 0.5 * skin);
        // crust: dark basalt, glassy, still glowing along its cracked edges
        vec3 hv = normalize(uS1Dir - rd);
        float sub = cell((p.xz + uSeed) / (uMode > 0.5 ? 0.18 : 1.3)).y;   // the raft itself is cracked into smaller plates
        vec3 crust = col * 0.8 + uS1Col * pow(max(0., dot(n, hv)), 14.) * 0.07 * sh + uGlow * (0.6 * exp(-gEdge / 0.06) + 0.35 * exp(-sub / 0.03));
        if (uMode > 0.5) crust += uGlow * 0.5 * exp(-cell((p.xz + uSeed) * 6.).y / 0.012) * smoothstep(0.4, 0.8, uCrust);   // fine cracks in thick crust
        col = mat > 1.5 ? liquid : crust;
      }
      if (uGround > 1.5 && uGround < 2.5) {
        vec3 hv = normalize(uS1Dir - rd); col += uS1Col * pow(max(0., dot(n, hv)), 80.) * 0.3 * sh;
        if (uMode > 0.5) col += uS1Col * step(0.9965, h21(floor((p.xz + uSeed) * 380.))) * 5. * sh * max(0., dot(n, uS1Dir));   // single crystals catching the star
      }
    }
    if (t > 0.) { // aerial perspective, with forward-scattered starlight in the haze
      float f = 1. - exp(-uHaze * t * 0.00035);
      vec3 hz = skyTex(normalize(vec3(rd.x, 0.03, rd.z))) + uS1Col * pow(max(0., dot(rd, uS1Dir)), 6.) * 0.35 * uAir;
      col = mix(col, hz, f);
    }
  }
  if (t < 0. && rd.y < 0. && uUnknown < 0.5) {   // a ray that slips past the far terrain still ends in the horizon haze, not in the sky
    col = skyTex(normalize(vec3(rd.x, 0.03, rd.z))) + (uGround > 3.5 && uGround < 4.5 ? uGlow * 0.7 : vec3(0.)); t = 1.;   // a distant magma sea still glows
  } else if (t < 0.) {
    col = skyTex(rd);
    vec4 Ly = texture2D(uLayer, vec2(px / uRes.x, py / uRes.y));
    col = mix(col, pow(Ly.rgb, vec3(2.2)), Ly.a * uLayerOn);
    col += sunAdd(rd);
    if (uAur > 0. && uS1Dir.y < 0.06) {   // aurora curtains, drawn as an eye adapted to the dark would see them
      float az = atan(rd.x, rd.z), el = asin(clamp(rd.y, -1., 1.));
      float e0 = 0.1 + 0.12 * fbm(vec2(az * 1.3, 5.) + uSeed * 0.001) + 0.03 * sin(az * 7. + fbm(vec2(az * 3., 2.)) * 4.);   // the arc's lower edge wanders and folds
      float above = el - e0, curt = smoothstep(-0.006, 0.004, above) * exp(-max(above, 0.) / (0.05 + 0.06 * fbm(vec2(az * 4., 8.))));
      float rays = 0.45 + 0.55 * pow(vn(vec2(az * 90., uTime * 0.3)), 2.), part = smoothstep(0.38, 0.6, fbm(vec2(az * 0.9, 1.) + uSeed * 0.002));
      vec3 ac = mix(uAurCol, uAurCol.gbr * 0.6 + uAurCol * 0.4, smoothstep(0.02, 0.15, above));   // colour shifts toward the top
      col += ac * curt * rays * part * uAur * (1. - smoothstep(-0.06, 0.06, uS1Dir.y)) * 0.22;
    }
    vec4 hi = cloudDeck(rd, 8000., 7000., uClouds2, 0.45, 0.8); col = mix(col, hi.rgb, hi.a * 0.6);
    vec4 lo = cloudDeck(rd, 1500., 2200., uClouds, 0.18, 0.); col = mix(col, lo.rgb, lo.a);
  }
  if (uGround > 4.5 && uClear > 0. && rd.y >= 0.) col += uGlow * uClear * 0.7 * exp(-rd.y / 0.05);   // looking sideways through the hot gas: a long, glowing path
  if (uGround > 4.5 && uClear > 0. && rd.y < 0.) {
    // too hot for any cloud: no deck, just clear glowing gas that gets brighter as the view reaches deeper, hotter layers,
    // with faint warmer and cooler streaks drawn out along the jet
    vec2 sp = ro.xz + rd.xz * (ro.y + 3000.) / -rd.y + uSeed;
    float st = fbm(vec2(sp.x * 0.00012, sp.y * 0.0011));
    vec3 cg = uGlow * (0.7 + 0.3 * smoothstep(0., 0.7, -rd.y)) * (1. + 0.3 * (st - 0.5) * smoothstep(0., 0.05, -rd.y));   // a few per cent in temperature is ~15% in visible brightness
    col = mix(col, cg + skyTex(normalize(vec3(rd.x, 0.03, rd.z))) * (1. - smoothstep(0., 0.15, -rd.y)), uClear);
  }
  vec2 vq = fc / uRes - 0.5; col *= 1. - 0.32 * dot(vq, vq);   // slight lens vignette
  col *= uExpo;   // eyes stop down a little in bright surroundings (snow fields, bright cloud decks)
  float m = max(col.r, max(col.g, col.b));
  if (m > 1.) { float w = min(1., (m - 1.) / (m + 2.)); col = col / m; col = col + w * (1. - col); }
  gl_FragColor = vec4(pow(clamp(col, 0., 1.), vec3(1. / 2.2)) + (h21(fc + uTime) - 0.5) / 255., 1.);   // dither against banding
}`;
