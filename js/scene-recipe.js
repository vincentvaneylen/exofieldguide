// The recipe: rules from physics, details from a seed
// ================= The recipe: rules from physics, details from a seed =================
let BIOME_TEST = null;   // set by the test harness to show one biome
function recipe(w, sc) {
  const R = rng(strHash(w.name + "|" + sc.name + (sc.vpLabel ? "|" + sc.vpLabel : ""))), rules = [];   // each viewpoint is a different place: its own hills and coast
  const rule = (input, r, effect, lvl) => rules.push({ input, r, effect, lvl });
  const gRel = (sc.gOverride || w.g) / 9.81, airP = sc.atm ? sc.atm.P : 0, airless = airP < 0.003;
  const T = sc.T || (sc.ground === "rock" || sc.ground === "lava" ? w.star.Teff / Math.sqrt(w.aR) * 0.85 : w.Teq);
  const out = { seed: [R() * 5000, R() * 5000] };
  // relief: mountains and crater depth scale inversely with gravity (taller on Mars, lower on super-Earths)
  out.reliefM = Math.max(90, Math.min(1100, 420 / gRel)) * (airP > 3 ? 0.7 : 1) * (sc.ground === "ice" ? 0.4 : 1);   // ice flows: lower relief than rock
  rule(`gravity ${gRel.toFixed(2)} g`, "Relief ∝ 1 / gravity", `Mountains up to about ${Math.round(out.reliefM * 1.1)} m in view`, 1);
  // landforms: airless worlds keep craters and sharp ridges; air erodes, deposits dust and builds dunes
  let crat = airless ? 0.55 + 0.4 * R() : airP < 0.05 ? 0.25 * R() + 0.1 : 0.04;
  if (airless && w.age > 6) crat = Math.min(1, crat + 0.15);
  let mesa = airless ? 0.15 * R() : 0.2 + 0.6 * R(), ridge = 0.35 + 0.65 * R(), dunes = (!airless && (sc.ground === "regolith" || sc.ground === "ice")) ? 0.4 + 0.6 * R() : 0;
  if (sc.ground === "ice") { crat *= 0.6; dunes *= 0.5; }
  const sum = mesa + ridge || 1; mesa /= sum; ridge /= sum;
  out.style = [crat, mesa, ridge, dunes];
  rule(airless ? "no atmosphere" : `${airP < 0.05 ? "thin" : airP + " bar"} ${sc.atm.gas}`, airless ? "No erosion: impacts accumulate" : "Wind and weather erode and deposit",
    airless ? `Crater fields${w.age > 6 ? ` (old system, ${w.age} Gyr: heavily cratered)` : ""}, sharp ridges, black-shadowed boulders` : `Rounded ${mesa > 0.45 ? "mesas and layered cliffs" : "hills"}${dunes ? ", wind-built dunes" : ""}`, airless ? 1 : 2);
  // wind direction: on a tidally locked world, surface winds converge on the point under the star
  const wa = w.locked ? 0 : R() * Math.PI * 2; out.wind = [Math.sin(wa), Math.cos(wa)];
  if (dunes) rule(w.locked ? "tidally locked" : "spin unknown", w.locked ? "Day-to-night circulation: winds blow toward the point under the star" : "Wind direction unknown: chosen by the seed", "Orientation of the dune crests", w.locked ? 1 : 3);
  // volcano: only on rocky ground, only sometimes, always marked imagined
  out.volc = (sc.ground === "rock" || sc.ground === "regolith" || sc.ground === "lava") && R() < 0.4 ? [(R() - 0.5) * 7000, 3000 + R() * 4000, 0.6 + 0.6 * R()] : [0, 0, 0];
  const F = typeof findingsOf === "function" ? findingsOf(w) : null;   // what papers measured about this planet: overrides the rules below
  if (F && F.volc === false) { if (out.volc[2] || (w.P < 1 && airless)) rule(F.src, F.t, "No volcano drawn: the finding overrides the imagined one", 0); out.volc = [0, 0, 0]; }
  if (out.volc[2]) rule("seed", "A volcanic cone is placed on the horizon", "Volcano with a summit crater", 3);
  // rock colour: basaltic base, mixed toward highland grey or oxidised red within plausible bounds; airless and old means darker (space weathering)
  const ox = sc.ground === "regolith" ? 0.75 + 0.2 * R() : (airless || sc.ground === "lava") ? 0.08 * R() : 0.15 + 0.35 * R();
  const hl = airless ? 0.15 + 0.45 * R() : 0.1 + 0.25 * R();
  let rockA = mixS(mixS(MAT.basalt, MAT.highland, hl), MAT.regolith, ox), rockB = mixS(MAT.basalt, MAT.regolith, ox * 0.7);
  if (sc.rockMat) { rockA = MAT[sc.rockMat]; rockB = mixS(MAT[sc.rockMat], MAT.basalt, 0.5); }
  // lava worlds: freshly frozen crust is dark, glassy basalt, so the glowing cracks stand out
  if (sc.ground === "lava") { rockA = MAT.basalt.map(v => v * 0.85); rockB = MAT.basalt.map(v => v * 0.7); rule("molten dayside", "Freshly frozen lava crust is dark basalt", `Dark crust plates with glowing seams${w.id === "k10b" ? " (Kepler's high measured reflectivity may be thermal glow or high clouds, so it isn't used for the crust)" : ""}`, 1); }
  if (airless && w.age > 5) { rockA = rockA.map(v => v * 0.85); rule(`system age ${w.age} Gyr, no air`, "Space weathering darkens exposed rock", "Darker, more uniform ground", 1); }
  if (F && F.rock) { rockA = MAT[F.rock]; rockB = mixS(MAT[F.rock], MAT.basalt, 0.3); rule(F.src, F.t, `Ground coloured as measured: ${F.rock === "ultramafic" ? "dark, olivine-rich ultramafic rock" : "space-weathered basalt"}`, 0); }   // a measured surface replaces the seeded rock mix
  out.rockA = rockA; out.rockB = rockB;
  rule(sc.ground === "regolith" ? "scenario: oxidised desert" : airless ? "no air, no water" : "rocky planet", "Basalt base, mixed by the seed toward highland grey or oxidised red",
    `${Math.round(hl * 100)}% highland-type rock, ${Math.round(ox * 100)}% oxidised`, sc.ground === "regolith" ? 2 : 3);
  out.dust = sc.ground === "regolith" ? 0.8 : airless ? 0.45 : 0.25;
  out.rockDen = airless ? 0.9 : sc.ground === "ice" ? 0.2 : 0.5;
  // frost: water or CO₂ ice in cold shadows
  out.frost = (T < 240 && sc.ground !== "ice" && !airless) ? 0.6 : (T < 150 && sc.ground !== "ice") ? 0.4 : 0;
  if (out.frost) rule(`${Math.round(T)} K`, T < 150 ? "Below CO₂ and water frost points" : "Below the water frost point", "Frost in shadows and on flat ground", 2);
  out.strata = mesa > 0.4 && !airless ? 0.6 + 0.4 * R() : 0.1 * R();
  // clouds: types follow temperature; cover from the scenario
  out.clouds = sc.clouds || 0; out.clouds2 = !airless && sc.ground !== "clouds" && airP >= 0.3 ? 0.25 + 0.4 * R() : 0;
  if (out.clouds || out.clouds2) rule(`${Math.round(T)} K, ${sc.atm.gas}`, "Water clouds form between about 230 and 330 K", "Low heaped clouds and high streaky ones (their shapes are imagined)", 2);
  if (sc.ground === "clouds") rule(`equilibrium ${Math.round(w.Teq)} K`, sc.deck === "h2so4" ? "In CO₂ air with sulfur and a little water, sulfuric-acid droplets form a planet-wide deck (as on Venus)" : "Giant-planet cloud chemistry depends on temperature (Sudarsky classes)", `Deck colours ${sc.deck} / ${sc.deckB || sc.deck}${w.id === "hd189" ? " (blue measured by Hubble)" : ""}`, w.id === "hd189" ? 0 : 2);
  if (sc.ground === "clouds") {
    out.style = [0, 0.2 + 0.6 * R(), 0.4 + 0.6 * R(), 0.5 + 0.5 * R()];
    const mu = /^H/.test(sc.atm.gas) ? 2.3 : /CO₂/.test(sc.atm.gas) ? 44 : 28, Hkm = 8.314 * (sc.T || w.Teq) / (mu * w.g);   // scale height kT / μ m_H g, by the air's mean molecular weight
    rule(`${Math.round(sc.T || w.Teq)} K, ${gRel.toFixed(1)} g`, `Scale height H ≈ kT / μg for ${mu < 3 ? "hydrogen" : mu > 40 ? "CO₂" : "nitrogen"} air (μ = ${mu})`, `H ≈ ${Math.round(Hkm)} km: ${Hkm > 150 ? "broad, puffy cloud billows and thick haze" : Hkm < 50 ? "compact, tightly packed cloud tops" : "medium-sized billows"}`, 1);
    if (sc.streak) rule("tidally locked, hot", "Fast day-to-night jets stretch the clouds", "Cloud tops drawn out into streaks", 1);
    if ((sc.T || w.Teq) > 1300) rule(`${Math.round(sc.T || w.Teq)} K`, "Planck emission becomes visible above ~1,300 K", "Deeper cloud layers glow faintly red", 1);
    if (sc.atm && sc.atm.dust > 0.1) rule(`haze optical depth ${sc.atm.dust.toFixed(2)}`, "Photochemical haze scatters light and tints the sky with its own colour", "Hazy, tinted sky instead of clear hydrogen blue", 2);
  }
  // plants: colour follows the star (Kiang et al. 2007); always speculative
  out.plantMat = w.star.Teff < 4200 ? MAT.plantPurple : MAT.plantGreen;
  if (sc.plants) rule(`${w.star.Teff} K star`, w.star.Teff < 4200 ? "Scarce visible light: pigments absorb almost all of it (Kiang et al. 2007)" : "Sun-like light: Earth-like pigments are plausible", w.star.Teff < 4200 ? "Very dark purple vegetation: ground cover, shrubs, kelp" : "Green vegetation: ground cover, shrubs, kelp", 3);
  // where you stand: a small seeded shift keeps the same scenario looking different between planets
  out.landDir = (() => { const a = (R() < 0.5 ? 1 : -1) * Math.PI * (0.38 + 0.24 * R()); return [Math.sin(a), Math.cos(a)]; })();   // the coast runs across the view: land on one side, sea on the other, whichever way you look
  rule(w.locked ? "tidally locked" : "spin unknown", w.locked ? "The star never moves" : "Time of day chosen for the view", `Star ${Math.round(90 - sc.theta)}° above the horizon`, w.locked ? 1 : 3);
  if (w.MpAssumed) rule(`radius ${w.Rp} R⊕, mass unknown`, "Mass from the Chen & Kipping (2017) relation", `Gravity ${gRel.toFixed(2)} g (assumed)`, 1);
  if (w.auto) rule(`${w.Rp} R⊕, ${Math.round(w.autoInfo.Teq)} K, ${w.autoInfo.locked ? "locked" : "not locked"}`, "Class and scenarios chosen by rules from size, temperature and the habitable zone", `${w.cls === "transition" ? "Could be rocky or gassy: both kinds of scenario are offered" : "Scenarios for a " + w.cls + " planet"}`, 1);
  // super-Earth interiors: iron-rich planets (denser than Earth-like rock) are drawn darker and more metallic-grey
  const RpE = w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, vv = valleyOf(RpE, w.P, w.star.M, w.Mu === "MJ" ? w.Mp * 317.8 : w.Mp, !w.MpAssumed && !w.msini);
  if (vv && vv.comp && /iron-rich/.test(vv.comp) && (sc.ground === "rock" || sc.ground === "lava")) { out.rockA = mixS(out.rockA, MAT.basalt, 0.5).map(v => v * 0.8); rule("density above Earth-like rock", "Iron-rich interior, like Mercury", "Darker, metallic-grey ground", 1); }
  // ultra-short orbits: tides (from any eccentricity or nearby siblings) may heat the interior and drive volcanism, as on Io
  // tidal volcanism needs an orbit kept slightly oval by neighbours, as Io's is by Europa; a lone planet on a circular orbit is not heated this way
  if (w.P < 3 && airless && sc.ground === "rock" && (w.siblings || []).length && !(F && F.volc === false)) { out.volc = [(R() - 0.5) * 5000, 2600 + R() * 2500, 1.1]; rule(`${w.P < 1 ? (w.P * 24).toFixed(0) + "-hour" : w.P.toFixed(1) + "-day"} orbit, with neighbours`, "Tidal heating from an orbit kept slightly oval by its neighbours can drive volcanism (Io-like)", "A volcanic cone on the horizon (location imagined)", 2); }
  if (sc.climate) {
    // clouds follow the climate: tidally locked oceans build a thick convective deck over the substellar point (Yang et al. 2013)
    if (sc.climate.locked && sc.clouds) { out.clouds = Math.min(0.85, sc.clouds * (0.35 + 1.1 * Math.cos(sc.theta * D2R))); rule("tidally locked ocean", "Thick convective clouds over the substellar point, thinning toward the ocean's edge", `Cloud cover ${Math.round(out.clouds * 100)}% where you stand`, 2); }
    if (sc.Tstand < 280 && sc.land === 1) { out.frost = Math.max(out.frost, 0.5); rule(`${Math.round(sc.Tstand)} K where you stand`, "Cold coast: tundra-like ground", "Frost and patchy snow inland", 2); }
    if (sc.noPlants) rule(`${Math.round(sc.Tstand)} K where you stand`, "Too cold for liquid water at the surface here", "No vegetation drawn", 2);
  }
  if (sc.climate) { const c = sc.climate; rule(`${w.S.toFixed(2)}× Earth's sunlight, ${sc.atm.P} bar ${sc.atm.gas}`, "Simple energy balance: greenhouse warming and heat transport from the scenario's air",
    c.locked ? (c.deg >= 175 ? "Warm enough everywhere: no ice edge" : c.deg <= 10 ? `Too cold for open water except a small patch (model gives ${Math.round(c.deg)}°)` : `Open ocean within ${Math.round(c.deg)}° of the point under the star (${Math.round(c.T0)} K there, ${Math.round(c.Tn)} K on the night side); you stand at its edge`)
      : (c.lat >= 90 ? "No polar ice" : `Ice caps poleward of ${Math.round(Math.max(15, c.lat))}° latitude (equator ~${Math.round(c.T0)} K)`), 2); }
  // land types tied to rules
  out.landform = 0;
  if (sc.ground === "rock" && airless) { if (w.P < 1 || w.age < 1) { out.landform = 2; rule(w.P < 1 ? "ultra-short orbit" : "young system", "Tidal or internal heat resurfaces the crust", "Smooth volcanic plains with shield cones", 2); } }
  else if (sc.ground === "regolith") { const x = R(); out.landform = x < 0.4 ? 1 : x < 0.7 ? 5 : 3;
    rule("thin air, dusty, cold", ["", "Ancient water or tectonics carve canyons into layered rock (as on Mars)", "", "Evaporated lakes leave salt flats", "", "Wind-blown dust sculpts the ground"][out.landform], ["", "Canyons cut into layered plateaus", "", "White salt crust with polygon ridges", "", "Yardangs: streamlined ridges along the wind"][out.landform], 3); }
  else if (sc.ground === "ice" && airless) { out.landform = 6; rule("ice shell, no air", "Tides flex the shell; cracks build double ridges stained by salts (as on Europa)", "Criss-crossing ridges with reddish-brown lines", 3); }
  else if (sc.ground === "ice") { out.landform = 4; rule("ice-covered", "Ice sheets end in cliffs where they flow and fracture", "A wall of blue ice on the horizon", 3); }
  // tidal heating: an eccentric orbit flexes the planet and heats it from inside, k₂/Q ≈ 0.003 for rock (as Io is heated by Jupiter)
  { const ecc = w.orbit ? w.orbit.e : 0;
    if (ecc > 0.005 && w.Rp < 2 && sc.ground !== "clouds") { const G = 6.674e-11, Ms = w.star.M * 1.989e30, Rm = w.Rp * 6.371e6, am = w.a * 1.496e11, n = 2 * Math.PI / (w.P * 86400);
      const q = 10.5 * 0.003 * G * Ms * Ms * Rm ** 5 * n * ecc * ecc / am ** 6 / (4 * Math.PI * Rm * Rm);   // heat flow, W/m²
      if (q > 0.3) { if (sc.ground === "rock" || sc.ground === "regolith") out.landform = 2;
        rule(`e = ${ecc.toFixed(2)}, ${w.P.toFixed(1)}-day orbit`, `Tides flex the planet on its eccentric orbit and heat it from inside: about ${q < 10 ? q.toFixed(1) : Math.round(q)} W/m² (Io: about 2; Earth's own heat: 0.09)`, sc.ground === "rock" || sc.ground === "regolith" ? "Young volcanic plains with shield cones" : "Volcanism likely beneath", 2); } } }
  if (out.landform === 2) { out.rockA = MAT.basalt.map(v => v * 0.8); out.rockB = MAT.basalt.map(v => v * 0.7); }
  // tides from the star scale with M★ / a³; Earth's (Sun and Moon together) are about 3.2 times the Sun's alone
  out.tide = 1;
  if (sc.ground === "ocean" && sc.land === 1) { const td = (w.star.M || 1) / w.a ** 3 / 3.2; out.tide = Math.max(0.6, Math.min(6, td));
    if (td > 1.5) rule(`${(w.star.M || 1).toFixed(2)} M☉ star at ${w.a.toFixed(2)} AU`, "Tides raised by the star scale with M★ / a³", `Tides about ${td.toFixed(1)}× Earth's: wide tidal flats cut by channels`, 1); }
  // coast type: physics tips the odds, the planet's seed picks (imagined). Strong tides make flats; low gravity favours high mountains;
  // layered rock makes cliffs; cold coasts are carved by glaciers into steep mountain shores
  out.coast = 0;
  if (sc.ground === "ocean" && sc.atm && (sc.land === 1 || sc.oceanDeg)) {
    const wts = [1, 0.8 + out.style[1], 0.6 + (gRel < 0.9 ? 1 : 0) + ((sc.Tstand || 290) < 283 ? 1.2 : 0), (out.tide || 1) > 2.5 ? 3 : 0.5, 0.6 + (sc.oceanDeg ? 0.3 : 0), 0.8 + (w.star.Teff < 4200 ? 0.4 : 0)];
    let x = R() * wts.reduce((a, b) => a + b, 0); out.coast = 0; while (out.coast < 5 && (x -= wts[out.coast]) > 0) out.coast++;
    const names = ["Sandy beach backed by hills", "Sea cliffs of layered rock", gRel < 0.9 ? "Mountains straight from the sea: low gravity lets them stand tall" : "Steep mountain shore", "Low coastal plain and mudflats", "Archipelago: islands offshore", "Shallow lagoon behind a shelf, crowded with stromatolites"];
    if (out.coast === 1) out.style[1] = Math.max(out.style[1], 0.75);
    if (out.coast === 2) { out.reliefM *= 1.5; out.style[2] = Math.max(out.style[2], 0.85); }
    if (out.coast === 3) { out.reliefM *= 0.3; out.style[1] = Math.min(out.style[1], 0.3); out.tide = Math.max(out.tide || 1, 2.5); }
    // where you stand and what lies underfoot differ by coast: wading in a lagoon, facing islands, on bare mud, among boulders below cliffs
    out.rockDen = [0.3, 0.9, 0.7, 0.04, 0.4, 0.08][out.coast]; out.coastOff = out.coast === 5 ? -45 : out.coast === 3 ? 8 : 0;
    if (out.coast >= 4) { const a = Math.PI * (1 + (R() - 0.5) * 0.5); out.landDir = [Math.sin(a), Math.cos(a)]; }   // land behind you: the view toward the star is the islands or the lagoon
    rule(`seed${(out.tide || 1) > 2.5 ? ", strong tides" : ""}${gRel < 0.9 ? ", low gravity" : ""}`, "Coast type: rules set the odds, the seed picks one", names[out.coast], 3);
  }
  if (sc.ground === "ocean" && sc.land !== 1 && w.locked) rule("tidally locked", "The star's tide never moves on a locked planet", "No tidal flats: the shore stays put", 1);
  // microbial mats (imagined): life on Earth was microbial for most of its history; pigments follow the starlight (Kiang et al. 2007)
  out.mats = 0;
  if (sc.ground === "ocean" && !sc.noPlants && sc.atm) { out.mats = 0.75; out.matMat = w.star.Teff < 4200 ? MAT.matPurple : mixS(MAT.plantGreen, MAT.tholin, 0.35);
    if (sc.land === -1) { out.raft = 1; rule("no land, open ocean", "Life here would float or swim. Floating plants keep the 'red edge' that marks land plants, so a floating meadow could even be seen from afar (Murakami et al. 2025)", "Plants stop: floating meadows drifting in long rafts", 3);
      rule("hundreds of km of water over high-pressure ice", "With no land to weather and the rocky floor sealed under ice, nutrients such as phosphorus may be scarce (Kite & Ford 2018; debated)", "Blooms and meadows drawn thinner than on a coast", 3); out.mats *= 0.6; }
    rule("liquid water where you stand", "Set by the Biology control. If there is life, microbes are the likeliest form (Earth's life was microbial for 3 billion years); under red dwarfs, purple bacteria that use near-infrared light are a leading idea (Coelho et al. 2024)", `${w.star.Teff < 4200 ? "Purple" : "Green-orange"} mats on wet shores, stromatolite mounds in the shallows, plankton blooms`, 3); }
  // plant height: lower gravity allows taller growth, dim light favours low forms
  // usable light: photons at 400–750 nm relative to Earth's, from the star's model spectrum and the light the planet gets. Plant cover thins below about
  // a quarter of Earth's (a square-root fall-off, after the productivity estimates of Lehmer et al. 2018)
  const phF = T => starSpec(T).reduce((a, v, i) => a + (LAM[i] >= 400 && LAM[i] <= 740 ? v * LAM[i] : 0), 0) / T ** 4;   // photons in the band per unit of total light
  const par = w.S * phF(w.star.Teff) / phF(5772); out.par = par;
  const dim = Math.min(1, Math.sqrt(par / 0.25));
  out.shrub = Math.max(0.5, Math.min(2.2, Math.pow(1 / gRel, 0.5) * (0.7 + 0.3 * dim)));
  // biome: what grows follows the temperature where you stand and how wet it is (always imagined; Earth's biomes as the guide)
  const Tb = sc.Tstand || sc.T || 285, rr = R(), lockW = sc.climate && sc.climate.locked && sc.theta != null;
  // rainfall where you stand: climate, plus where the seed puts you (coast or interior, windward or lee). On a locked planet the rain falls
  // under the star, where the air rises, and the terminator is dry (Yang et al. 2013)
  const wet = Math.max(0, Math.min(1, lockW ? 0.2 + 0.7 * Math.cos(sc.theta * D2R) + 0.3 * (rr - 0.5)
    : 0.25 + 0.4 * (sc.clouds || 0.4) + (sc.weather === "rain" ? 0.15 : 0) + 0.5 * (rr - 0.5)));
  const red = w.star.Teff < 4200, hs = out.shrub;   // pigments follow the star; heights follow gravity
  const P1 = out.plantMat, Pb = red ? MAT.plantMaroon : MAT.plantBlueGreen, Py = red ? mixS(MAT.plantPurple, MAT.matPurple, 0.35) : MAT.plantYellowGreen;
  const GR = red ? mixS(MAT.plantPurple, MAT.matPurple, 0.45) : mixS(MAT.plantGreen, MAT.plantYellowGreen, 0.5), DRY = mixS(MAT.straw, GR, 0.25);
  const FL = [MAT.flowerYellow, MAT.flowerWhite, MAT.flowerMagenta, MAT.lichenOrange][Math.floor(R() * 4)], ACC = red ? [MAT.lichenOrange, MAT.flowerWhite][Math.floor(R() * 2)] : [MAT.flowerYellow, MAT.lichenOrange, MAT.flowerMagenta][Math.floor(R() * 3)];
  // Earth's vegetation zones as templates (imagined): canopy (cover, crown spacing m, height m, shape 0 dome / 1 spire / 2 broad, emergents, patch m, treeline m, waterside cover),
  // lone plants drawn individually (1 broadleaf, 2 conifer, 3 umbrella, 4 palm, 5 column succulent, 6 mangrove, 7 cushion bush), ground cover, and the land itself
  const BS = {
    tundra: { n: "Tundra: mottled moss, lichen and cushion plants on flat, wet ground; no trees", sdf: [7, 7, 0, 0.35, 0.8, 0.8, 2.4], g: { grass: mixS(GR, MAT.straw, 0.5), cover: 0.6, lichen: 0.9, moss: 0.6, flower: 0.3 }, rel: 0.15, inland: 120, dryW: 0 },
    taiga: { n: "Boreal forest: dark spires of conifers over moss, with bogs and clearings", can: [0.85, 4.5, 17, 1, 0, 420, 260, 0.9], p1: Pb, p2: mixS(Pb, P1, 0.5), g: { grass: mixS(GR, Pb, 0.4), cover: 0.8, moss: 0.7, lichen: 0.4 }, rel: 0.8 },
    coldrain: { n: "Temperate rainforest: towering conifers, moss on everything, mist", can: [0.97, 6, 38, 1, 0, 600, 500, 1], p1: Pb, p2: P1, g: { grass: P1, cover: 0.95, moss: 0.9 }, rel: 1.15, haze: 1.6 },
    broadleaf: { n: "Temperate broadleaf woods in a patchwork with flowering meadows", can: [0.7, 8, 22, 0, 0, 280, 600, 0.95], sdf: [7, 7, 0, 0.25, 2.2, 2.2, 6], p1: P1, p2: Py, acc: 0.15, g: { grass: GR, cover: 0.95, flower: 0.5, moss: 0.3 }, rel: 1 },
    steppe: { n: "Steppe: wide, wind-combed grassland and flowers; trees only along the water", can: [0.03, 7, 14, 0, 0, 200, 400, 0.55], p1: P1, p2: Py, g: { grass: mixS(GR, MAT.straw, 0.45), cover: 1, flower: 0.55, tall: 1 }, rel: 0.12, inland: 260, dryW: 1 },
    maquis: { n: "Mediterranean-like scrub: dense evergreen bushes on rocky hills, scattered umbrella pines", can: [0.5, 3.5, 4, 0, 0, 160, 900, 0.6], p1: mixS(P1, Pb, 0.5), p2: Py, sdf: [3, 3, 0, 0.1, 13, 13, 30], g: { grass: DRY, cover: 0.7, dry: 0.5, flower: 0.2 }, rel: 1.1 },
    jungle: { n: "Tropical rainforest: a dense canopy of broad crowns with emergent giants over a shrubby understorey, in humid haze", can: [1, 10, 30, 0, 0.12, 900, 1500, 1], sdf: [7, 7, 0, 0.7, 3, 3, 5], p1: P1, p2: Py, acc: 0.12, g: { grass: P1, cover: 0.9, moss: 0.5 }, rel: 1.4, haze: 1.8 },
    savanna: { n: "Savanna: golden grass to the horizon, flat-topped trees, gallery forest along water", can: [0.02, 9, 16, 0, 0, 250, 1000, 0.6], p1: P1, p2: Py, sdf: [3, 7, 0.3, 0.32, 10, 1.8, 24], g: { grass: mixS(MAT.straw, GR, 0.2), cover: 1, dry: 0.5, tall: 1, crypto: 0.1 }, rel: 0.12, inland: 260, dryW: 1 },
    desert: { n: "Hot desert: dunes and bare rock, with column succulents and cushion bushes few and far between", sdf: [5, 7, 0.5, 0.2, 7, 1.3, 14], g: { grass: MAT.straw, cover: 0.06, dry: 0.9, crypto: 0.5 }, rel: 0.2, inland: 320, dune: 1, dryW: 1 },
    barren: { n: "Too hot for any Earth plant: bare ground with heat-loving microbial crusts", g: { crypto: 0.7, dry: 0.85 }, rel: 0.3, inland: 200, dryW: 1 }
  };
  const bk = BIOME_TEST || (w.name === "Earth" ? "broadleaf" : null) || (Tb > 330 ? "barren" : Tb > 318 ? "desert" : Tb > 300 ? (wet > 0.62 ? "jungle" : wet > 0.45 ? "maquis" : wet > 0.25 ? "savanna" : "desert")
    : Tb > 288 ? (wet > 0.72 ? "coldrain" : wet > 0.42 ? "broadleaf" : wet > 0.22 ? "steppe" : "desert") : Tb > 279 ? (wet > 0.25 ? "taiga" : "tundra") : "tundra");
  let B = { ...BS[bk], g: { ...BS[bk].g } };
  // the coast adds its own communities
  const sdf = B.sdf ? [...B.sdf] : null; let extra = "";
  if (Tb > 296 && Tb < 318 && wet > 0.35 && (out.coast === 0 || out.coast === 4) && bk !== "desert" && bk !== "barren") { B.sdf = sdf ? [sdf[0], 4, 0.45, Math.max(sdf[3], 0.25), sdf[4], 15, sdf[6]] : [4, 4, 0, 0.3, 15, 15, 16]; extra += "; palms along the shore"; }
  if (Tb > 297 && wet > 0.35 && !B.dryW && (out.coast === 3 || out.coast === 5)) { B.sdf = [6, sdf ? sdf[0] : 6, sdf ? 0.3 : 0, 0.75, 8, sdf ? sdf[4] : 8, 11]; extra += "; mangroves standing in the shallows"; }
  if (Tb > 279 && Tb < 302 && (out.coast === 3 || (out.tide || 1) > 2)) { B.g.marsh = 0.9; extra += "; salt marsh between the tides"; }
  const on = !!sc.plants, g = B.g, cn = B.can, sd = B.sdf;
  out.bio = { tree1: on && sd ? [sd[0], sd[1], sd[2], sd[3] * dim] : [0, 0, 0, 0], tree2: sd ? [sd[4] * hs, sd[5] * hs, sd[6] * hs, 300] : [1, 1, 10, 300],
    tree3: sd ? [0.8, Math.min(1400, sd[6] * hs * 70), Math.max(sd[4], sd[5]) * hs * 1.35 + 1.5, 0] : [0, 0, 0, 0],
    can1: on && cn ? [cn[0] * dim, cn[1] * hs, cn[2] * hs, cn[3]] : [0, 4, 10, 0], can2: cn ? [cn[4], cn[5], cn[6], cn[7]] : [0, 300, 500, 0],
    bio1: on ? [g.flower || 0, g.lichen || 0, g.moss || 0, g.marsh || 0] : [0, 0, 0, 0], bio2: on ? [g.crypto || 0, g.seagrass || 0, g.cover || 0, g.dry || 0] : [g.crypto || 0, 0, 0, 0],
    bio3: [on ? g.tall || 0 : 0, B.dune || 0, B.acc || 0, 0], grass: g.grass || GR, plant2: B.p2 || Py, plant1: B.p1 || P1, flower: FL, accent: ACC };
  // the Speculative dial stop: forms that this planet's own properties would favour, each from a physical argument or a classic thought
  // experiment. Speculation, not prediction: Earth's forms are the "Plants" stop; these are what might differ
  out.spec = null;
  if (on && bk === "barren") out.spec = { forest: 0, lone: 0, can: 0, hMul: 1, glow: 0, silver: 0, floaters: 0, p1: P1, p2: Py, notes: [[`about ${Math.round(Tb)} K`, "Above about 330 K proteins and membranes fail; no land plant we can argue for survives", "Still bare ground"]] };
  if (out.spec) { out.specLine = "none here: too hot for land plants"; rule(out.spec.notes[0][0], out.spec.notes[0][1], "Plant form: " + out.spec.notes[0][2], 3); }
  const esL = sc.theta != null ? 90 - Math.acos(Math.max(-1, Math.min(1, Math.cos(sc.theta * D2R) * Math.cos((sc.lat || 0) * D2R)))) / D2R : 45;   // the star's height where you stand
  if (on && !out.spec) { const f = [], sp = { forest: 0, lone: 0, alt: 0, can: cn ? cn[3] : 0, hMul: 1, glow: 0, silver: 0, floaters: 0, p1: B.p1 || P1, p2: B.p2 || Py };
    if (gRel < 0.8) { sp.forest = 8; sp.lone = 8; sp.alt = 8; sp.can = 1; sp.hMul = Math.min(2, Math.pow(1 / gRel, 0.6));
      f.push(["low gravity", `${gRel.toFixed(2)} g: water can be lifted higher and stems carry less weight, so the tallest heights scale roughly as 1/g (Koch et al. 2004)`, "Slender spires, far taller than Earth's trees"]); }
    else if (gRel > 1.5) { sp.forest = 9; sp.lone = 9; sp.alt = 9; sp.can = 2; sp.hMul = Math.max(0.45, 1 / gRel);
      f.push(["high gravity", `${gRel.toFixed(2)} g: weight grows faster than strength, so plants stay low and thick, as in Clement's high-gravity Mesklin (Mission of Gravity, 1954)`, "Squat cushion-trees on thick trunks"]); }
    if (w.locked && esL < 40) { sp.lone = 10; if (!sp.forest) { sp.forest = 10; sp.can = 2; }
      f.push([`tidally locked, star ${Math.round(esL)}° up`, "The star never moves in the sky, so a leaf low on the light can turn to face it for good, like the sun-tracking plants of Aldiss's Hothouse (1962)", "Dish-shaped leaves that all face the low star"]); }
    else if (w.locked) { if (!sp.forest) sp.can = 2; } if (w.locked && esL >= 40) f.push([`tidally locked, star ${Math.round(esL)}° up`, "With the star high and fixed, flat crowns already catch its light", "Broad, flat crowns (no dishes needed here)"]);
    if (par < 0.3) { sp.p1 = mixS(sp.p1, MAT.basalt, 0.7); sp.p2 = mixS(sp.p2, MAT.basalt, 0.6); if (!sp.lone) sp.lone = 10;
      f.push([`usable light ${par.toFixed(2)}× Earth's`, "In dim light the best leaf absorbs everything it can: near-black pigments are suggested for faint or red stars (Kiang et al. 2007)", "Wide, nearly black light-sails"]); }
    if (Tb > 305 && par >= 0.3) { sp.silver = 0.7; sp.p1 = mixS(sp.p1, MAT.frost, 0.22); sp.p2 = mixS(sp.p2, MAT.frost, 0.15);
      f.push([`about ${Math.round(Tb)} K`, "Hot-climate plants on Earth reflect light with pale hairs and waxes to stay cool", "Silvery, reflective leaves"]); }
    if (w.star.Teff < 3900) { sp.glow = 1;
      f.push([`${w.star.Teff} K red dwarf`, "Red dwarfs flare with strong ultraviolet; life might protect itself by turning UV into harmless visible light, a glow during flares (O'Malley-James & Kaltenegger 2019)", "Biofluorescent foliage, glowing green-cyan when the star is low"]); }
    if (sc.atm && sc.atm.P >= 3) { sp.floaters = Math.min(1, sc.atm.P / 10);
      f.push([`${sc.atm.P} bar air`, "Dense air makes gas-filled floaters easier to lift, as in Sagan & Salpeter's floaters for Jupiter's atmosphere (1976)", "Gas-bag floaters drifting in the sky"]); }
    if (!f.length) f.push(["Earth-like gravity, light and orbit", "No property here pushes life away from Earth's forms", "Earth-like plant forms"]);
    sp.notes = f; out.spec = sp; out.specLine = f.map(x => x[2].toLowerCase()).join("; ");
    for (const x of f) rule(x[0], x[1], "Plant form: " + x[2], 3); }
  out.biome = bk + extra; out.dry = g.dry || 0; out.hazeMul = B.haze || 1; out.dryW = !!B.dryW;   // dry biomes: no rain, few clouds
  if (B.dryW) out.clouds = (out.clouds || 0) * 0.35;
  // the land follows the biome too: plains for grassland, dunes for desert, steep wet hills for rainforest; interiors are seen from inland
  out.reliefM *= B.rel || 1;
  if (out.coast <= 3 && B.inland) out.coastOff = (out.coastOff || 0) + B.inland;
  if (sc.plants || bk === "barren" || bk === "desert") rule(`about ${Math.round(Tb)} K where you stand, ${wet > 0.6 ? "wet" : wet > 0.35 ? "moderately wet" : "dry"}, ${red ? "red-dwarf light" : "Sun-like light"}`, "What grows follows temperature and rainfall, as Earth's vegetation zones do; above about 330 K no Earth plant survives", B.n + extra, 3);
  if (sc.plants) rule(`${gRel.toFixed(2)} g, ${w.S.toFixed(2)}× Earth's light`, "Taller plants under low gravity, low forms in dim light", `Shrubs ${out.shrub > 1.2 ? "taller" : out.shrub < 0.8 ? "lower" : "about as tall"} than on Earth`, 3);
  if (sc.plants) rule(`${w.S.toFixed(2)}× Earth's light from a ${w.star.Teff} K star`, "Photosynthesis counts photons at 400–750 nm; cover thins below about a quarter of Earth's (Lehmer et al. 2018)", `Usable light ${par < 0.1 ? par.toFixed(2) : par.toFixed(1)}× Earth's: ${dim > 0.95 ? "enough for full cover" : `plant cover cut to about ${Math.round(dim * 100)}%`}`, 3);
  if (sc.plants && lockW) rule(`locked, ${Math.round(sc.theta)}° from the point under the star`, "Rain falls where air rises under the star; the line between day and night is dry (Yang et al. 2013)", wet > 0.6 ? "Wet: under the thick cloud that sits below the star" : wet > 0.35 ? "Moderately wet" : "Dry: far from the rainy region under the star", 3);
  if (sc.atm && sc.atm.dustMat === "tholin") rule("organic haze", "Haze particles settle and coat the ground (Titan's surface is dark)", "Dark orange-brown ice and frost", 2);
  // auroras: particles from the star light up the upper air; red dwarfs flare often and strongly
  out.aurora = sc.atm && sc.atm.P >= 0.005 && sc.ground !== "clouds" ? (w.star.Teff < 3900 ? 1 : 0.4) : 0;
  if (out.aurora) rule(`${w.star.Teff} K star, ${sc.atm.gas} air`, w.star.Teff < 3900 ? "Red dwarfs flare often; their particle storms drive strong auroras" : "The star's wind drives auroras (strength unknown)", `Auroras in a dark sky, ${/^H/.test(sc.atm.gas) ? "pink (hydrogen)" : /CO₂/.test(sc.atm.gas) && !/^N/.test(sc.atm.gas) ? "green (oxygen from CO₂, as seen on Mars)" : "violet-blue (nitrogen)"}`, 2);
  // accent minerals and stone shapes: what the planet's conditions would make
  out.accent = 0; out.rockC = out.rockA; out.slab = out.strata > 0.5 ? 0.8 : 0;
  if (out.slab) rule("layered rock", "Sedimentary or lava layers split along their beds", "Flat, slab-shaped stones", 3);
  if (sc.ground === "regolith") { out.rockC = MAT.sulfate; out.accent = 0.35; rule("thin CO₂ air over oxidised dust", "Evaporating brines leave pale sulfate deposits (as on Mars)", "Light-toned patches on flat ground", 3); }
  else if (sc.ground === "rock" && airless && T > 700) { out.rockC = MAT.glass; out.accent = 0.65; rule(`${Math.round(T)} K dayside, no air`, "Rock sinters and partly melts in the heat", "Dark glassy patches", 2); }
  else if (sc.ground === "ocean" && sc.land === 1) { out.rockC = MAT.clay; out.accent = 0.5; rule("liquid water on rock", "Chemical weathering turns rock into clay-rich soil", "Brownish soil inland", 2); }
  else if (out.landform === 6) { out.rockC = MAT.saltStain; out.accent = 0.7; }

  // the Animals stop (imagined): body plans and numbers from gravity, air, temperature, light and biome (scene-animals.js)
  out.anim = (sc.ground === "ocean" || sc.lifeParent) && sc.atm && (!sc.noPlants || sc.lifeParent) ? animalPlan(w, sc, out, { Tb, bk, gRel, par }) : null;
  if (out.anim) for (const x of out.anim.notes) rule(x[0], x[1], "Animals stop: " + x[2], 3);
  out.rules = rules;
  return out;
}

