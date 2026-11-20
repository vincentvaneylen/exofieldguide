// Planet categories (v1): main classes by size, subtypes mostly by heating, plus flags for special hosts and orbits.
// The scheme follows the review in "Exoplanet Field Guide: review and v1 plan". Sub-Neptune subtypes are contested in the
// literature, so they are shown as alternative scenarios with their papers, never as a single verdict.

// Key references, shown beside the notes on the main page and listed in full on the technical page
const REFS = {
  vaneylen21: { cite: "Van Eylen et al. 2021", what: "the radius valley around M dwarfs", url: "https://ui.adsabs.harvard.edu/abs/2021MNRAS.507.2154V" },
  cloutier20: { cite: "Cloutier & Menou 2020", what: "the radius valley around mid-K to mid-M dwarfs: a different slope", url: "https://ui.adsabs.harvard.edu/abs/2020AJ....159..211C" },
  vaneylen18: { cite: "Van Eylen et al. 2018", what: "the radius valley's slope with orbital period, from asteroseismic stellar radii", url: "https://ui.adsabs.harvard.edu/abs/2018MNRAS.479.4786V" },
  petigura22: { cite: "Petigura et al. 2022", what: "the radius valley's dependence on orbit and stellar mass (California-Kepler Survey)", url: "https://ui.adsabs.harvard.edu/abs/2022AJ....163..179P" },
  fulton17: { cite: "Fulton et al. 2017", what: "the radius valley between rocky planets and sub-Neptunes", url: "https://ui.adsabs.harvard.edu/abs/2017AJ....154..109F" },
  chen17: { cite: "Chen & Kipping 2017", what: "masses from radii when no mass is measured", url: "https://ui.adsabs.harvard.edu/abs/2017ApJ...834...17C" },
  kopp13: { cite: "Kopparapu et al. 2013", what: "edges of the habitable zone", url: "https://ui.adsabs.harvard.edu/abs/2013ApJ...765..131K" },
  zahnle17: { cite: "Zahnle & Catling 2017", what: "the cosmic shoreline: which planets keep an atmosphere", url: "https://ui.adsabs.harvard.edu/abs/2017ApJ...843..122Z" },
  zhai18: { cite: "Zhai & Luo 2018", what: "incomplete chromatic adaptation: warm and very blue light keep their tint", url: "https://doi.org/10.1364/OE.26.007724" },
  sudarsky00: { cite: "Sudarsky et al. 2000", what: "giant-planet cloud classes by temperature", url: "https://ui.adsabs.harvard.edu/abs/2000ApJ...538..885S" },
  gao20: { cite: "Gao et al. 2020", what: "giant-planet aerosols: hydrocarbon haze below about 950 K, silicate clouds above", url: "https://ui.adsabs.harvard.edu/abs/2020NatAs...4..951G" },
  cowan11: { cite: "Cowan & Agol 2011", what: "day and night temperatures of hot Jupiters", url: "https://ui.adsabs.harvard.edu/abs/2011ApJ...729...54C" },
  castro24: { cite: "Castro-González et al. 2024", what: "the Neptunian desert, ridge and savanna", url: "https://astrobiology.com/2024/09/25/mapping-the-exo-neptunian-landscape-a-ridge-between-the-desert-and-savanna/" },
  madhu25: { cite: "Madhusudhan et al. 2025 (review)", what: "sub-Neptune classes: mini-Neptune, hycean, steam and ice worlds (debated)", url: "https://arxiv.org/pdf/2509.19247" },
  kite20: { cite: "Kite et al. 2020", what: "sub-Neptunes with magma oceans under hydrogen envelopes" },
  shorttle24: { cite: "Shorttle et al. 2024", what: "a magma-ocean reading of K2-18 b" },
  gladman96: { cite: "Gladman et al. 1996", what: "tidal locking timescales" },
  seidel25: { cite: "Seidel et al. 2025", what: "the layered jet stream of WASP-121 b", url: "https://eso.org/public/news/eso2504/" },
  kiang07: { cite: "Kiang et al. 2007", what: "pigment colours under other stars" },
  keating19: { cite: "Keating et al. 2019", what: "hot-Jupiter night sides cluster near 1,100 K, probably under clouds", url: "https://web3.arxiv.org/abs/1809.00002" },
  bell24: { cite: "Bell et al. 2024", what: "WASP-43 b: dayside 1,524 K, cloudy nightside 863 K (JWST MIRI)", url: "https://arxiv.org/abs/2401.13027v1" },
  benneke24: { cite: "Benneke et al. 2024", what: "TOI-270 d: a metal-rich, miscible envelope over a rocky interior", url: "https://arxiv.org/pdf/2403.03325" },
  piaulet24: { cite: "Piaulet-Ghorayeb et al. 2024", what: "GJ 9827 d: a steam-rich atmosphere", url: "https://arxiv.org/abs/2410.03527" },
  wogan24: { cite: "Wogan et al. 2024", what: "K2-18 b as a gas-rich mini-Neptune" },
  rigby24: { cite: "Rigby et al. 2024", what: "argues against a magma ocean on K2-18 b" },
  kempton23: { cite: "Kempton et al. 2023", what: "GJ 1214 b: reflective (Bond albedo 0.51), metal-rich", url: "https://arxiv.org/abs/2305.06240" },
  hu24: { cite: "Hu et al. 2024", what: "55 Cnc e: a volatile (CO₂/CO) atmosphere over a lava world", url: "https://arxiv.org/abs/2405.04744v1" },
  kreidberg19: { cite: "Kreidberg et al. 2019", what: "LHS 3844 b: dayside 1,040 K, no thick atmosphere", url: "https://arxiv.org/pdf/1908.06834" },
  greene23: { cite: "Greene et al. 2023; Ducrot et al. 2024", what: "TRAPPIST-1 b: dayside 503 K (478 K), consistent with bare rock" },
  zieba23: { cite: "Zieba et al. 2023", what: "TRAPPIST-1 c: dayside 380 K, no thick CO₂ atmosphere", url: "https://arxiv.org/pdf/2306.10150" },
  libby20: { cite: "Libby-Roberts et al. 2020", what: "super-puffs below 0.1 g/cm³ with featureless, hazy spectra", url: "https://arxiv.org/abs/1910.12988" },
  koch04: { cite: "Koch et al. 2004", what: "the hydraulic limits to tree height", url: "https://ui.adsabs.harvard.edu/abs/2004Natur.428..851K" },
  omalley19: { cite: "O'Malley-James & Kaltenegger 2019", what: "biofluorescence induced by stellar UV flares", url: "https://ui.adsabs.harvard.edu/abs/2019MNRAS.488.4530O" },
  sagan76: { cite: "Sagan & Salpeter 1976", what: "floating organisms in a dense atmosphere", url: "https://ui.adsabs.harvard.edu/abs/1976ApJS...32..737S" },
  lehmer18: { cite: "Lehmer et al. 2018", what: "photosynthesis is light-limited around cool M dwarfs", url: "https://ui.adsabs.harvard.edu/abs/2018ApJ...859..171L" },
  lavaRev: { cite: "Lava worlds (Kepler-10 b, K2-141 b, 55 Cnc e)", what: "rocky planets with molten day sides" },
  masuda14: { cite: "Masuda 2014; Lee & Chiang 2016", what: "super-puffs: planets of very low density" },
  pierre11: { cite: "Pierrehumbert 2011", what: "eyeball climates on tidally locked planets" },
  yang13: { cite: "Yang et al. 2013", what: "clouds under the star keep locked planets cooler" },
  baraffe03: { cite: "Baraffe et al. 2003; Burrows et al. 1997", what: "how young giant planets cool" }
};

// The scheme: main classes and their subtypes, with the references behind each
const CATEGORIES = [
  { id: "rocky", name: "Rocky planet", refs: ["fulton17", "zahnle17"], subs: [
    { id: "lava", name: "Lava world", refs: ["lavaRev", "hu24"] },
    { id: "airless", name: "Airless or scorched rock", refs: ["zahnle17", "kreidberg19", "greene23", "zieba23"] },
    { id: "venus", name: "Venus-like", refs: ["kopp13"] },
    { id: "temperate", name: "Temperate rocky", refs: ["kopp13", "pierre11", "yang13"] },
    { id: "icy", name: "Cold rocky: icy or desert", refs: ["kopp13"] } ] },
  { id: "subnep", name: "Sub-Neptune", refs: ["fulton17", "madhu25"], subs: [
    { id: "hot", name: "Hot sub-Neptune", refs: ["madhu25"] },
    { id: "warm", name: "Warm sub-Neptune", refs: ["madhu25", "kempton23", "piaulet24", "benneke24"] },
    { id: "temperate", name: "Temperate sub-Neptune", refs: ["madhu25", "benneke24", "wogan24", "shorttle24", "rigby24"] },
    { id: "cold", name: "Cold sub-Neptune", refs: ["madhu25"] } ] },
  { id: "neptune", name: "Neptune-size planet", refs: ["castro24"], subs: [
    { id: "hot", name: "Hot Neptune", refs: ["castro24"] },
    { id: "warm", name: "Warm Neptune", refs: [] },
    { id: "cold", name: "Cold Neptune or ice giant", refs: [] } ] },
  { id: "giant", name: "Giant planet", refs: ["sudarsky00", "gao20"], subs: [
    { id: "cold", name: "Cold giant", refs: ["sudarsky00"] },
    { id: "warm", name: "Warm giant", refs: ["gao20"] },
    { id: "hot", name: "Hot Jupiter", refs: ["gao20", "cowan11", "keating19", "bell24"] },
    { id: "ultra", name: "Ultra-hot Jupiter", refs: ["cowan11", "seidel25"] },
    { id: "young", name: "Young, self-luminous giant", refs: ["baraffe03"] },
    { id: "puffy", name: "Puffy planet or super-puff", refs: ["masuda14", "libby20"] } ] }
];

// planets with observed escaping gas or dust (helium, hydrogen or dust tails); names compared without spaces
const TAILS = { evaporating: ["WASP-107b", "GJ436b", "HAT-P-11b", "HD189733b", "HD209458b", "GJ3470b", "WASP-69b", "HAT-P-32b"],
  disintegrating: ["Kepler-1520b", "K2-22b", "KOI-2700b", "BD+054868Ab"], stretched: ["WASP-12b", "WASP-103b", "WASP-121b"] };
const nameKey = n => n.replace(/\s+/g, "");

// how sure is the category? Boundaries are not sharp: the planet is rebuilt 300 times from catalogue values drawn within typical uncertainties,
// and each copy is classified. Measurement: radius 5% for transiting planets, 15% when it comes from the mass (Chen & Kipping 2017);
// mass 15%; star temperature 2%. Model: the radius valley's position (8% in radius; Van Eylen et al. 2018; Petigura et al. 2022) and the
// planet's equilibrium temperature through albedo and heat transport (4%, so 8% in starlight, which also covers the habitable-zone edges).
// The catalogue's own error bars would replace the typical ones (planned).
function categoryOdds(w) {
  if (w._odds !== undefined) return w._odds;
  w._odds = null;
  // hand-checked planets are tested through their catalogue entry: the same numbers, varied within their errors
  const nm = w.catalogue ? w.name : typeof archName === "function" && CAT_IX.has(archName(w)) ? archName(w) : null; if (!nm) return null;
  const R = rng(strHash(w.name + "|odds")), gauss = () => Math.sqrt(-2 * Math.log(R() + 1e-12)) * Math.cos(2 * Math.PI * R());
  const sR = Math.hypot(w.RpAssumed ? 0.15 : 0.05, 0.08), sM = 0.15, sT = Math.hypot(0.02, 0.04), tally = {}, N = 300;
  const pos = w.orbit ? w.orbit.pos : "mean";
  for (let k = 0; k < N; k++) {
    let v; try { v = catWorld(nm, pos, { R: Math.exp(sR * gauss()), M: Math.exp(sM * gauss()), T: Math.exp(sT * gauss()) }); } catch (e) { continue; }
    if (!v) continue; const c = categorize(v), key = c.name + " › " + c.subName; tally[key] = (tally[key] || 0) + 1;
  }
  const tot = Object.values(tally).reduce((a, b) => a + b, 0); if (!tot) return null;
  w._odds = Object.entries(tally).map(([k, n]) => [k, n / tot]).sort((a, b) => b[1] - a[1]);
  return w._odds;
}
function categorize(w) {
  const Re = w.Rp * (w.Ru === "RJ" ? 11.21 : 1), Me = w.Mp ? w.Mp * (w.Mu === "MJ" ? 317.8 : 1) : null, T = w.Teq;
  const s0 = w.scenarios[0] || {}, g0 = s0.ground, rho = Me ? 5.51 * Me / Re ** 3 : null, k = nameKey(w.name);
  const ci = CAT_IX.get(typeof archName === "function" ? archName(w) : w.name) ?? CAT_IX.get(w.name), row = ci == null ? null : CAT[ci];   // catalogue row: eccentricity, number of stars, circumbinary
  const ecc = w.e ?? (row ? row[11] : null), nStars = row ? row[20] : 1, circum = !!(w.star2 || (row && row[21]));
  let main, sub, alt = [], notes = [];
  const dis = TAILS.disintegrating.includes(k);   // the catalogue radius of a disintegrating planet is its dust tail, not its body
  const puffy = !dis && Re >= 5 && Me && (rho < 0.08 || (rho < 0.2 && T < 1000));   // very low density that strong heating cannot explain (super-puffs are often only Neptune-sized)
  if (dis) { main = "rocky"; sub = T > 1500 ? "lava" : "airless"; notes.push("The catalogue radius comes from the dust tail it sheds; the body itself is probably smaller than Mercury"); }
  else if (puffy) { main = "giant"; sub = "puffy"; notes.push(`Density ${rho.toFixed(2)} g/cm³: lower than Saturn's 0.69, with a radius of ${Re.toFixed(1)} Earth radii from only ${Math.round(Me)} Earth masses`); }
  else if (Re >= 8 || (Me && Me > 80)) {
    main = "giant";
    let Tint = 0; try { const gm = giantOf(w); Tint = gm && gm.m ? gm.m.Tint || 0 : 0; } catch (e) {}
    sub = Tint > 500 && T < 1000 && (!w.age || w.age < 0.5) ? "young" : T < 300 ? "cold" : T < 950 ? "warm" : T < 2000 ? "hot" : "ultra";   // puffy = low density not explained by strong heating
    if (sub === "hot" && Me && rho < 0.3) notes.push("Inflated: larger than its mass would suggest, as strongly heated giants often are");
    if (Me) notes.push(Me > 13 * 317.8 ? "Brown-dwarf mass: above about 13 Jupiter masses deuterium burns, so it may be a brown dwarf rather than a planet"
      : Me > 4 * 317.8 ? "Super-Jupiter: more than 4 Jupiter masses" : Me < 0.6 * 317.8 ? "Saturn-mass giant" : "Jupiter-mass giant");
  } else if (Re >= 4 || (Re >= 3.5 && Me && Me >= 12)) {   // Neptune itself is 3.9 Earth radii
    main = "neptune"; sub = T > 900 ? "hot" : T > 300 ? "warm" : "cold";
    if (sub === "hot") notes.push(w.P < 3.2 ? "In the Neptunian desert (orbit under 3.2 days), where Neptunes are rare" : w.P < 5.7 ? "On the Neptunian ridge (orbits of 3.2 to 5.7 days)" : "In the Neptunian savanna (orbits beyond 5.7 days)");
  } else if ((g0 === "clouds" && s0.deck !== "h2so4") || s0.land === -1) {
    main = "subnep"; sub = T > 1000 ? "hot" : T > 400 ? "warm" : T > 250 ? "temperate" : "cold";
    alt = { hot: ["hydrogen-rich envelope", "steam world"], warm: ["hydrogen-rich mini-Neptune with haze", "metal-rich mixed (miscible) envelope", "steam world"],
      temperate: ["hydrogen-rich mini-Neptune", "metal-rich mixed (miscible) envelope", "hycean world (ocean under thin hydrogen)", "magma ocean under a deep envelope"],
      cold: ["hydrogen-rich mini-Neptune", "ice world"] }[sub];
    if (Re < 2) alt = ["rocky super-Earth that lost its hydrogen", ...alt];   // near the radius valley either is possible
  } else {
    main = "rocky";
    const inHZ = w.hz && w.a >= w.hz[2] && w.a <= w.hz[3];
    sub = g0 === "lava" ? "lava" : inHZ && (g0 === "ocean" || g0 === "ice") && w.scenarios.some(x => x.ground === "ocean" && x.atm) ? "temperate" : g0 === "clouds" ? "venus" : g0 === "ocean" ? "temperate" : g0 === "ice" ? "icy" : (g0 === "rock" || g0 === "regolith") && T > 300 ? "airless" : T < 230 ? "icy" : "airless";
    if (rho && Re < 2 && rho > 8) notes.push("Very dense for its size: possibly iron-rich, a super-Mercury");
  }
  // boundaries are not sharp: measurement errors and model assumptions (albedo, heat transport, the valley's exact position) blur them,
  // so a planet close to one is flagged rather than presented as clearly on one side
  const near = [], close = (x, b, f) => Math.abs(x - b) <= b * f;
  if ((main === "rocky" || main === "subnep") && w.P) { const Rg = radiusGap(w.P, w.star.M || 1); if (close(Re, Rg, 0.15)) near.push(`Close to the radius valley (about ${Rg.toFixed(1)} Earth radii at this orbit): within the uncertainties it could be a rocky planet or one with a gas envelope`); }
  const tb = { giant: [[200, "cold", "warm"], [950, "warm", "hot"], [2000, "hot", "ultra-hot"]], subnep: [[250, "cold", "temperate"], [400, "temperate", "warm"], [1000, "warm", "hot"]], neptune: [[300, "cold", "warm"], [900, "warm", "hot"]] }[main] || [];
  for (const [b, lo, hi] of tb) if (close(T, b, 0.08)) near.push(`Equilibrium temperature ${Math.round(T)} K is close to the ${b.toLocaleString()} K line between ${lo} and ${hi}: albedo and heat transport could move it either way`);
  if (main === "rocky" && w.hz) for (const [edge, nm] of [[w.hz[0], "inner (runaway greenhouse)"], [w.hz[1], "outer (maximum greenhouse)"]]) if (close(w.a, edge, 0.1)) near.push(`Within 10% of the habitable zone's ${nm} edge, whose position depends on the climate model`);
  if (main === "neptune" && sub === "hot") for (const b of [3.2, 5.7]) if (close(w.P, b, 0.1)) near.push(`Its ${w.P.toFixed(1)}-day orbit is near the ${b}-day edge of the Neptunian ridge, an edge measured with uncertainty`);
  const flags = [];
  if (circum) flags.push("Circumbinary: orbits two stars"); else if (nStars > 1) flags.push("In a multiple-star system");
  if (isWhiteDwarf(w.star)) flags.push("White-dwarf host"); else if (isBrownDwarf(w.star)) flags.push("Brown-dwarf host");
  if (ecc > 0.4) flags.push(`Very eccentric orbit (e = ${(+ecc).toFixed(2)})`);
  if (w.age && w.age < 0.1) flags.push("Young: under 100 million years");
  if (w.P < 1) flags.push("Ultra-short period: under a day");
  if (TAILS.evaporating.includes(k)) flags.push("Escaping atmosphere observed");
  if (TAILS.disintegrating.includes(k)) flags.push("Disintegrating: dust tail observed");
  if (TAILS.stretched.includes(k)) flags.push("Stretched by tides near the Roche limit");
  const C = CATEGORIES.find(c => c.id === main), S = C.subs.find(x => x.id === sub);
  return { main, sub, name: C.name, subName: S.name, alt, notes, near, flags, refs: [...new Set([...C.refs, ...S.refs])] };
}
