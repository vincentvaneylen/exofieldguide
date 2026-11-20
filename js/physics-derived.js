// Derived physics and the simple climate model
// ================= Derived physics for every world =================
function deriveWorld(w) {
  const s = w.star;
  w.aR = w.a * AU / (s.Rs * RSUN);
  w.angDeg = 2 * Math.asin(1 / w.aR) / D2R;
  w.L = s.Rs ** 2 * (s.Teff / 5772) ** 4 + (w.star2 ? w.star2.Rs ** 2 * (w.star2.Teff / 5772) ** 4 : 0);
  w.S = w.L / w.a ** 2;
  w.Teq = s.Teff * Math.sqrt(1 / (2 * w.aR)) * (w.L / (s.Rs ** 2 * (s.Teff / 5772) ** 4)) ** 0.25;   // both stars' light, for circumbinary planets
  const Rm = w.Rp * (w.Ru === "RJ" ? RJ : RE), Mkg = w.Mp * (w.Mu === "MJ" ? MJ : ME);
  w.g = G * Mkg / Rm ** 2;
  w.spec = starSpec(s.Teff);
  w.dil = 1 / w.aR ** 2;
  if (w.star2) { const s2 = w.star2; w.spec2 = starSpec(s2.Teff); w.dil2 = (s2.Rs * RSUN / (w.a * AU)) ** 2; w.ang2 = 2 * Math.asin(s2.Rs * RSUN / (w.a * AU)) / D2R; }
  const sun = toXYZ(starSpec(5772));
  w.vis = (toXYZ(w.spec)[1] * w.dil + (w.spec2 ? toXYZ(w.spec2)[1] * w.dil2 : 0)) / (sun[1] / (AU / RSUN) ** 2);
  w.white = toXYZ(w.spec);
  w.adapt = adaptMatrix(eyeWhite(w.white, s.Teff));   // partly adapted: a red dwarf's light still looks amber
  w.hz = hzOf(s.Teff, w.L);
}
[...ALL, ...SHEET].forEach(deriveWorld);

// ================= Simple climate: where water is liquid =================
// Local energy balance with Bond albedo 0.3 (down to 0.22 under red dwarfs), a grey greenhouse (T⁴ × (1 + 0.75 τ), τ ≈ 0.8 per bar of N₂, 1.2 per bar when CO₂-rich,
// tuned so Earth's 1 bar gives 288 K) and heat transport ε = P/(P + 1) that evens out day and night. Tidally locked: temperature by
// angle from the substellar point sets the eyeball ocean's edge. Spinning: daily-mean sunlight by latitude sets the ice-cap latitude.
function climate(w, sc) {
  if (sc.ground !== "ocean" || !sc.atm || sc.land === -1) return null;
  const sigma = 5.670e-8, S0 = w.S * 1361, A = 0.3 - 0.08 * Math.max(0, Math.min(1, (5300 - w.star.Teff) / 2300)),   /* redder light: ice and air reflect less of it (Shields et al. 2013) */ P = sc.atm.P, tau = (/CO₂/.test(sc.atm.gas) ? 1.2 : 0.8) * P;
  const gh = 1 + 0.75 * tau, eps = Math.min(0.9, P / (P + 1)), Tavg4 = (1 - A) * S0 / (4 * sigma);
  const T = x => Math.pow(gh * ((1 - eps) * (1 - A) * S0 * Math.max(0, x) / sigma + eps * Tavg4), 0.25);   // x = cos(angle) or cos(lat)/π
  const Tf = 273, locked = w.locked && sc.land !== 1;
  const xe = Math.max(0, (Tf ** 4 / gh - eps * Tavg4) / ((1 - eps) * (1 - A) * S0 / sigma));
  if (locked) {
    const T0 = T(1), Tn = T(0), deg = xe >= 1 ? 0 : Math.acos(Math.min(1, xe)) / D2R;
    return { locked, T0, Tn, deg: Tn > Tf ? 180 : deg, T };
  }
  const T0 = T(1 / Math.PI), Tp = T(0), lat = xe * Math.PI >= 1 ? 0 : Math.acos(Math.min(1, xe * Math.PI)) / D2R;
  return { locked, T0, Tn: Tp, lat: Tp > Tf ? 90 : lat, T };
}
// moon survival for a built planet (hand-drawn ones give radius and mass in Jupiter units)
function moonFate(w) { if (w._moon) return w._moon; const R = w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, M = w.Mu === "MJ" ? w.Mp * 317.8 : w.Mp; return (w._moon = M && R && w.star.M ? moonSurvival(R, M, w.star.M, w.a, w.age) : { ok: false, t: 0 }); }
function applyClimate(w) { for (const sc of w.scenarios) {
  // catalogue-generated temperate scenarios: find the least greenhouse that keeps the equator or substellar point above ~283 K
  // capped at 8 bar: beyond about that much CO₂, more scatters light away and condenses (the maximum-greenhouse limit; Kopparapu et al. 2013)
  if (sc.autoP) for (const P of [1, 2, 3, 5, 8]) { sc.atm = { P, gas: P > 1 ? "N₂ + CO₂" : "N₂" }; const t = climate(w, sc); if (t && t.T0 >= 283) break; }
  if (sc.autoP && w.hz && w.a > w.hz[1] && !/^(Measured|Favoured|Tentative)/.test(sc.verdict || "")) sc.verdict = "Speculative: beyond the reach of a CO₂ greenhouse (Kopparapu et al. 2013), so oceans need hydrogen in the air or thick clouds, as early Mars may have had";
  if (sc.autoP && sc.atm.P > 1) sc.wx = `Keeping oceans liquid with this little sunlight needs about ${sc.atm.P} bar of CO₂-rich air in the simple climate model.`;
  if (sc.term) {   // a dry locked world: stand where the terminator ring is just warm enough, as close to the night side as possible
    const c = climate(w, { ...sc, land: 0 }); if (!c) continue; sc.climate = c;
    let th = 89; while (th > 50 && c.T(Math.cos(th * D2R)) < 288) th--;
    sc.theta = th; sc.Tstand = c.T(Math.cos(th * D2R)); if (sc.Tstand < 275) { sc.plants = false; sc.noPlants = true; } continue; }
  const c = climate(w, sc); if (!c) continue;
  sc.climate = c;
  if (c.locked) { sc.oceanDeg = Math.max(10, Math.min(175, c.deg)); sc.theta = Math.max(12, Math.min(68, Math.round(sc.oceanDeg * 0.75))); sc.Tstand = c.T(Math.cos(sc.theta * D2R));
    while (sc.Tstand < 278 && sc.theta > 6) { sc.theta -= 2; sc.Tstand = c.T(Math.cos(sc.theta * D2R)); }   // stand where the water is liquid, nearer the star if need be
    if (sc.floes && sc.Tstand > 281) sc.floes = false; }   // an island coast well inside the open water
  else { sc.iceLat = Math.max(15, c.lat); sc.Tstand = c.T0; }
  // vegetation (always speculative) only where water can be liquid where you stand
  if (sc.plants && sc.Tstand < 275) { sc.plants = false; sc.noPlants = true; }
} }
[...ALL, ...SHEET].forEach(applyClimate);
const gasFac = g => g.startsWith("H") ? 2.8 : g.includes("CO₂") && !g.startsWith("N") ? 1.6 : g.includes("CO₂") ? 1.3 : 1;
const TAGC = ["#6fcf97", "#8fb3d9", "#e2b84f", "#c58ad9"], TAGN = ["measured", "calculated", "assumed", "imagined"];


// Day side of a bare, molten rock: the hottest it can be is T★ √(R★/a) (2/3)^¼ (no heat carried away, nothing reflected; Cowan & Agol 2011).
// Measured lava worlds are cooler than that: 55 Cnc e, K2-141 b, TOI-561 b and HD 3167 b, and TESS finds lava worlds as a group bright,
// most likely from reflective silicate clouds or rock vapour carrying heat away (Zieba et al. 2022; Coy et al. 2026). For the hottest lava
// worlds (above ~2,400 K at that limit) the guide takes the day side at 85% of it, the middle of the measured ones; a measured value wins.
function daysideRock(w, sc) {
  const Tmax = w.star.Teff / Math.sqrt(w.aR) * Math.pow(2 / 3, 0.25), F = typeof findingsOf === "function" ? findingsOf(w) : null;
  if (F && F.Tday) return { T: F.Tday, why: "measured" };
  if (sc && sc.ground === "lava" && Tmax > 2400 && !(F && F.bareLimit)) return { T: Tmax * 0.85, why: "lava" };
  return { T: Tmax, why: "bare" };
}
