// per-planet results from spot checks of the literature (JWST mostly): which scenario they favour, and the evidence. Grows as checks are done
const SPOT = {
  // sub-Neptunes whose spectra speak to which world they are; "others" is the verdict for the remaining worlds
  gj436b: { first: /Neptune-size/, verdict: "Favoured: a comet-like hydrogen tail streams from it, so it has a hydrogen envelope; JWST finds it very metal-rich, at least 80× solar (Ehrenreich et al. 2015; Mukherjee et al. 2025)", others: "Less favoured by the measurements: its escaping hydrogen needs a hydrogen envelope" },
  toi1231b: { first: /Neptune-size/, verdict: "Favoured by JWST: strong methane and some CO₂ in deep hydrogen-rich air (Sarkar et al. 2026)", others: "Less favoured by the measurements: JWST sees hydrogen-rich air" },
  ltt3780c: { first: /mini-Neptune/, verdict: "Favoured by JWST: about 1% methane in hydrogen-rich air (TOI-732 c; Rigby et al. 2025)", others: "Less favoured by the measurements: JWST sees hydrogen-rich air" },
  toi2076b: { first: /mini-Neptune/, verdict: "Favoured: escaping helium shows a hydrogen-helium envelope (Zhang et al. 2022)", others: "Less favoured by the measurements: escaping helium needs a hydrogen-helium envelope" },
  toi2134b: { first: /mini-Neptune/, verdict: "Favoured: escaping helium shows a hydrogen-helium envelope (Zhang et al. 2023)", others: "Less favoured by the measurements: escaping helium needs a hydrogen-helium envelope" },
  gj3090b: { first: /mini-Neptune/, verdict: "Favoured by JWST: escaping helium and a muted spectrum, so a hydrogen envelope rich in heavy elements (Ahrer et al. 2025)", others: "Less favoured by the measurements: escaping helium needs a hydrogen-helium envelope" },
  k233b: { first: /Neptune-size/, verdict: "Favoured: its transit is twice as deep in visible light as in the infrared, from a thick haze in an extended envelope", others: "Less favoured by the measurements: the haze needs an extended envelope" },
  hd3167c: { first: /mini-Neptune/, verdict: "Allowed: Hubble rules out clear hydrogen air with fewer than ~100× solar metals; hazy or metal-rich air fits (Mikal-Evans et al. 2021)", others: "Allowed: a water-rich atmosphere also fits Hubble's spectrum" },
  hd15337c: { first: /mini-Neptune/, verdict: "Allowed: JWST's flat spectrum fits metal-rich air or high haze (Wallack et al. 2026)", others: "Allowed: a flat spectrum also fits steam-rich air" },
  toi125b: { first: /mini-Neptune/, verdict: "Allowed: JWST's muted spectrum fits metal-rich air (~150× solar) or high clouds (Chai et al. 2026)", others: "Allowed: metal-rich air could be mostly steam" },
  toi125c: { first: /mini-Neptune/, verdict: "Allowed: JWST's muted spectrum fits metal-rich air (~100× solar) or high clouds (Chai et al. 2026)", others: "Allowed: metal-rich air could be mostly steam" },
  toi776b: { first: /mini-Neptune/, verdict: "Allowed: JWST's flat spectrum rules out clear hydrogen air below ~100× solar metals; high haze fits (Teske et al. 2025)", others: "Allowed: a flat spectrum also fits water-rich air, or no air at all" },
  toi776c: { first: /mini-Neptune/, verdict: "Allowed: JWST's featureless spectrum fits metal-rich air or high haze (Teske et al. 2025)", others: "Allowed: metal-rich air could be mostly steam" },
  hd191939b: { first: /mini-Neptune/, verdict: "Allowed: Hubble's featureless spectrum fits metal-rich air or high clouds (Gapp et al. 2026)", others: "Allowed: metal-rich air could be mostly steam" },
  // rocky planets around M dwarfs (JWST, mostly the Hot Rocks and COMPASS programmes)
  toi561b: { thick: "CO₂ + H₂O", first: /thick atmosphere/, verdict: "Atmosphere inferred: day side far cooler than bare rock (JWST, Teske et al. 2025)" },
  gj1132b: { first: /bare rock/i, verdict: "Favoured by JWST: a featureless 709 K day side and a flat transmission spectrum (Xue et al. 2024; Bennett et al. 2025)" },
  gj486b: { first: /bare rock/i, verdict: "Favoured by JWST: an 865 K day side, airless or nearly so; the water hint was starspots (Mansfield et al. 2024)" },
  ltt1445ab: { first: /bare rock/i, verdict: "Favoured: a 525 K day side rules out thick CO₂ air (JWST, Wachiraphan et al. 2025)" },
  l9859b: { first: /bare rock/i, verdict: "Bare or thin volcanic air: JWST prefers SO₂ at 3.6σ (Bello-Arufe et al. 2025)" },
  trappist1c: { first: /bare rock/i, verdict: "Favoured: its day-side glow rules out thick CO₂ air (JWST, Zieba et al. 2023)" },
  trappist1d: { first: /bare rock/i, verdict: "Favoured: JWST sees no sign of a thick atmosphere (Piaulet-Ghorayeb et al. 2025)" },
  lhs475b: { first: /bare rock/i, verdict: "Favoured: a flat JWST spectrum rules out hydrogen-rich air (Lustig-Yaeger et al. 2023)" },
  gj341b: { first: /bare rock/i, verdict: "Favoured: a flat JWST spectrum, no hydrogen-rich air (Kirk et al. 2024)" },
  l1689b: { first: /bare rock/i, verdict: "Favoured: a flat JWST spectrum (Alam et al. 2025)" },
  toi1685b: { first: /bare rock/i, verdict: "Favoured: JWST finds a dark bare rock; thick air ruled out (Luque et al. 2025; Fisher et al. 2026)" },
  toi1468b: { first: /bare rock/i, verdict: "Favoured: day side as hot as dark bare rock; thick carbon dioxide or steam ruled out (JWST, Meier Valdés et al. 2025)" },
  lhs1140c: { first: /bare rock/i, verdict: "Favoured: day side as hot as bare rock, no sign of air (JWST, Rochon et al. 2025)" },
  toi431b: { first: /thin CO₂/, verdict: "Possible atmosphere: day side cooler than bare dark rock (JWST, Smith et al. 2026; Spitzer, Monaghan et al. 2025)" },
  ltt3780b: { first: /bare rock/i, verdict: "Favoured: day side too hot for thick air (JWST, Allen et al. 2025)" },
  gj367b: { verdict: "No thick atmosphere: a hot, dark bare day side (JWST, Zhang et al. 2024)" },
  toi836b: { first: /bare rock/i, verdict: "Favoured: a flat JWST spectrum, no clear hydrogen-rich air (Alderson et al. 2024)" },
  hd3167b: { thick: "CO₂", first: /thick atmosphere/, verdict: "Atmosphere favoured: its day side is about 1,300 K, barely half what bare rock would reach (JWST MIRI, Coy et al. 2026)" },
  toi2431b: { first: /Shore of a lava sea/, verdict: "Favoured: a day side as hot as bare rock can be, with no heat reaching the night (HST, Zieba et al. 2026)" },
  gj3473b: { first: /bare rock/i, verdict: "Bare rock or thin air: JWST rules out thick CO₂ (Holmberg et al. 2026)" },
  gj3929b: { first: /bare rock/i, verdict: "Bare rock or thin air: a 641 K day side rules out thick CO₂ (JWST, Connors et al. 2026)" },
  gj9827b: { first: /bare rock/i, verdict: "Favoured: no extended atmosphere seen (HST and CARMENES, Carleo et al. 2021)" },
  toi1444b: { verdict: "Allowed: TESS finds it unusually reflective, like other lava worlds, so silicate clouds or vapour may cool its day side; whether it has air is still open (Coy et al. 2026)" },
  toi1347b: { verdict: "Allowed: dense rock and iron with no hydrogen envelope; a hint of a TESS phase curve leaves room for a heavy, outgassed atmosphere (Rubenzahl et al. 2024)" },
  "bd+054868ab": { verdict: "Measured: it is disintegrating, with dust tails both ahead of and behind it; about the Moon's mass, gone within a few million years (TESS, Hon et al. 2025)" },
  k222b: { verdict: "Measured: it is disintegrating; a dusty tail streams from its surface (Sanchis-Ojeda et al. 2015)" },
  // sub-Neptunes and Neptunes
  l9859d: { first: /haze/i, verdict: "Tentative: JWST hints at sulphur gases in hydrogen-rich air (Gressier et al. 2024)" },
  gj9827d: { first: /steam/i, verdict: "Favoured: JWST finds a water-rich, steamy atmosphere (Piaulet-Ghorayeb et al. 2024)" },
  kepler138c: { first: /steam/i, verdict: "Favoured: its low density points to a volatile-rich world (Piaulet et al. 2023)" },
  kepler138d: { first: /steam/i, verdict: "Favoured: its low density points to a volatile-rich world (Piaulet et al. 2023)" },
  toi421b: { verdict: "Measured: clear hydrogen air with water vapour, no haze (JWST, Davenport et al. 2025)" },
  gj3470b: { verdict: "Measured: methane, water, CO₂ and SO₂ (JWST, Beatty et al. 2024)" },
  hatp11b: { verdict: "Water vapour detected (HST, Fraine et al. 2014)" },
  ltt9779b: { deck: "cloud", verdict: "Measured: bright metal clouds reflect most of the light (CHEOPS, Hoyer et al. 2023)" },
  kepler51d: { verdict: "Measured: a flat spectrum, so a very puffy planet with high haze (HST, Libby-Roberts et al. 2020)" },
  kepler51b: { verdict: "Flat spectrum: a very puffy planet with high haze (HST, Libby-Roberts et al. 2020)" },
  hip41378f: { verdict: "Measured: a flat spectrum, from high haze or rings that make it look bigger (Alam et al. 2022)" },
  // giants
  wasp12b: { deck: "alkaliDark", verdict: "Measured: very dark, reflecting almost no light (HST, Bell et al. 2017)" },
  tres2b: { deck: "alkaliDark", verdict: "Measured: among the darkest planets known, reflecting under 1% of light (Kipping & Spiegel 2011)" },
  wasp17b: { verdict: "Quartz (silica) clouds detected (JWST, Grant et al. 2023)" },
  wasp76b: { verdict: "Measured: iron vapour on the day side, which may rain out on the night side (Ehrenreich et al. 2020)" },
  kelt9b: { verdict: "Measured: the hottest planet known, with atomic iron and titanium in its air (Hoeijmakers et al. 2018)" },
  wasp18b: { verdict: "Measured: a day side hot enough to split water, with a thermal inversion (JWST, Coulombe et al. 2023)" },
  wasp33b: { verdict: "Measured: a thermal inversion with titanium oxide (Nugroho et al. 2017)" },
  wasp43b: { verdict: "Measured: a cloudy night side and clearer day side (JWST phase curve, Bell et al. 2024)" },
  wasp80b: { verdict: "Methane detected (JWST, Bell et al. 2023)" },
  wasp96b: { verdict: "Water and clouds measured (JWST, Radica et al. 2023)" },
  wasp19b: { verdict: "Titanium oxide detected (Sedaghati et al. 2017)" },
  kelt20b: { verdict: "Measured: a thermal inversion, from iron emission lines (Yan et al. 2020)" },
  wasp189b: { verdict: "Titanium oxide and metals detected (Prinoth et al. 2022)" },
  hd149026b: { verdict: "Measured: very metal-rich air (JWST, Bean et al. 2023)" },
  wasp69b: { verdict: "Measured: its atmosphere streams away in a long tail (Tyler et al. 2024)" },
  hatp7b: { verdict: "Measured: its day-side clouds shift with the weather (Kepler, Armstrong et al. 2016)" },
  hatp26b: { verdict: "Water detected; a low-metal atmosphere (HST, Wakeford et al. 2017)" },
  wasp6b: { verdict: "Hazy: a scattering slope seen (HST, Sing et al. 2016)" },
  hatp12b: { verdict: "Hazy: a scattering slope seen (HST, Sing et al. 2016)" },
  hd80606b: { verdict: "Measured: on its very eccentric orbit it heats by hundreds of kelvin in hours at closest approach (Laughlin et al. 2009)" },
  // directly imaged giants
  epsindab: { verdict: "Directly imaged by JWST at about 275 K (Matthews et al. 2024)" },
  pds70b: { verdict: "Measured: still growing, gathering gas from its birth disc (Haffert et al. 2019)" },
  pds70c: { verdict: "Measured: still growing, gathering gas from its birth disc (Haffert et al. 2019)" },
  "51erib": { verdict: "Methane seen in its directly imaged spectrum (Macintosh et al. 2015)" },
  hip65426b: { verdict: "The first exoplanet imaged by JWST (Carter et al. 2023)" },
  "vhsj125601.92125723.9b": { verdict: "Silicate clouds measured by JWST; its brightness changes hour by hour (Miles et al. 2023)" },
  hr8799b: { verdict: "Directly imaged, glowing with the heat of its formation (Marois et al. 2008)" },
  hr8799c: { verdict: "Directly imaged, glowing with the heat of its formation (Marois et al. 2008)" },
  hr8799d: { verdict: "Directly imaged, glowing with the heat of its formation (Marois et al. 2008)" },
  hr8799e: { verdict: "Directly imaged, glowing with the heat of its formation (Marois et al. 2010)" },
  // studied in detail without spectra: masses and densities, Kepler and Spitzer light curves, timing, disputes
  kepler78b: { verdict: "Earth-like density; its glow and reflected light measured by Kepler (Sanchis-Ojeda et al. 2013)" },
  k2141b: { verdict: "Spitzer's day-side glow fits a magma ocean under at most thin rock-vapour air (Zieba et al. 2022)" },
  corot7b: { note: "The first rocky planet found by its transit (Léger et al. 2009)" },
  k2229b: { verdict: "Allowed: very dense, so an iron-rich 'super-Mercury' (Santerne et al. 2018)" },
  kepler107c: { verdict: "Allowed: twice as dense as its inner sibling: perhaps stripped by a giant impact (Bonomo et al. 2019)" },
  kepler36b: { verdict: "Allowed: rocky by its density, while its puffy neighbour Kepler-36 c orbits only 0.013 AU away (Carter et al. 2012)" },
  kepler36c: { verdict: "Allowed: its low density needs a gas envelope, though the rocky Kepler-36 b orbits only 0.013 AU away (Carter et al. 2012)" },
  kepler138b: { verdict: "Mars-sized: among the smallest planets with a measured mass (Jontof-Hutter et al. 2015)" },
  gj1252b: { verdict: "Favoured: Spitzer finds the day side too hot for thick air (Crossfield et al. 2022)" },
  toi1452b: { first: /steam|water world/i, verdict: "Allowed: its low density fits a water world, up to 30% water by mass (Cadieux et al. 2022)" },
  kepler69c: { first: /Venus/, verdict: "Favoured: probably too close to its star for oceans, a 'super-Venus' (Kane et al. 2013)" },
  kepler438b: { note: "Its star flares strongly, which may strip away its air (Armstrong et al. 2016)" },
  yzcetb: { note: "Radio bursts may be signs of its magnetic field meeting its star's (Pineda & Villadsen 2023)" },
  barnardb: { verdict: "Confirmed in 2024, after an earlier claimed planet was retracted (González Hernández et al. 2024)" },
  lhs3154b: { note: "Surprisingly massive for its tiny star, a puzzle for how planets form (Stefánsson et al. 2023)" },
  kepler51c: { verdict: "Measured: a 'super-puff', one of the least dense planets known (Masuda 2014)" },
  wasp193b: { verdict: "Measured: one of the least dense planets known, about as dense as candyfloss (Barkaoui et al. 2024)" },
  kepler7b: { verdict: "Measured: bright, patchy clouds on its western side, the first cloud map of an exoplanet (Demory et al. 2013)" },
  kepler1625b: { note: "A large moon was proposed from Hubble timing (Teachey & Kipping 2018); a reanalysis finds it may be a fitting artefact (Heller & Hippke 2023), which its discoverers dispute (Kipping et al. 2024)" },
  kepler1708b: { note: "A large moon was proposed from Kepler transits (Kipping et al. 2022); a reanalysis finds much weaker evidence (Heller & Hippke 2023), which its discoverers dispute (Kipping et al. 2024)" },
  hd110067b: { note: "Innermost of six planets locked in a resonant chain (Luque et al. 2023)" },
  kepler223b: { note: "Part of a four-planet resonant chain (Mills et al. 2016)" }
};
// could a large moon survive? A moon at the edge of stability (0.4 Hill radii) is driven out by tides; this is how long that takes, after
// Barnes & O'Brien (2002). A Moon-like moon for rocky planets (1.2% of the planet's mass), a Ganymede-like one for giants (0.008%). Inputs in
// Earth radii and masses, solar masses, AU and Gyr; returns the survival time in years and whether it exceeds the system's age
function moonSurvival(RpE, MpE, Ms, aAU, ageGyr) {
  const G = 6.674e-11, Mp = MpE * 5.972e24, Rp = RpE * 6.371e6, a = aAU * 1.496e11, giant = RpE > 6;
  const am = 0.4 * a * Math.cbrt(Mp / (3 * Ms * 1.989e30)), q = giant ? 8e-5 : 0.0123, Q = giant ? 1e5 : 100, k2 = giant ? 0.38 : 0.3;
  if (am < 3 * Rp) return { ok: false, t: 0, room: false };
  const t = 2 / 13 * Math.pow(am, 6.5) * Q / (3 * k2 * q * Math.pow(Rp, 5) * Math.sqrt(G * Mp)) / 3.156e7;
  return { ok: t > (ageGyr || 5) * 1e9, t, room: true };
}
// Catalogue-generated worlds: the scenario rules
// ================= Catalogue-generated worlds =================
// Only catalogue values go in. Class and scenarios come from rules; known results can be added as small overrides.
function massFromRadius(R) { return R < 1.23 ? Math.pow(R / 1.008, 1 / 0.279) : Math.pow(R / 0.80811, 1 / 0.589); } // Chen & Kipping 2017
function hzOf(Teff, L) {
  const T = Math.max(2600, Math.min(7200, Teff)) - 5780, s = (S0, a, b, c, d) => S0 + a * T + b * T * T + c * T ** 3 + d * T ** 4;
  return [Math.sqrt(L / s(1.107, 1.332e-4, 1.58e-8, -8.308e-12, -1.931e-15)), Math.sqrt(L / s(0.356, 6.171e-5, 1.698e-9, -3.198e-12, -5.575e-16)),
    Math.sqrt(L / s(1.776, 2.136e-4, 2.533e-8, -1.332e-11, -3.097e-15)), Math.sqrt(L / s(0.3207, 5.547e-5, 1.526e-9, -2.874e-12, -5.011e-16))];   // runaway, maximum greenhouse; optimistic: recent Venus, early Mars
}
// how much cloud haze hangs in the air above a giant's cloud deck, by temperature: little in the cloud-free classes (350–1,400 K, where clear
// hydrogen scatters blue light over a dark deck, as measured for HD 189733 b; Evans et al. 2013), more where silicate and iron clouds form
// high up (1,400–2,000 K; Gao et al. 2020), none on ultra-hot day sides where every cloud evaporates
function giantHaze(T) { return T < 350 ? 0.05 : T < 1400 ? 0.012 : T < 2000 ? 0.08 : 0.004; }
function sudarsky(T) { return T < 150 ? ["saturn", "saturnB", "I · ammonia clouds"] : T < 350 ? ["waterCloud", "saturn", "II · water clouds"] : T < 800 ? ["clearBlue", "waterCloud", "III · cloudless, blue"] : T < 1400 ? ["alkaliDark", "silicate", "IV · sodium and potassium absorb, dark"] : ["silicate", "alkaliDark", "V · silicate clouds"]; }
// self-luminous giants follow the brown-dwarf sequence (L: dusty silicate clouds; L/T transition near 1,250 K, ~1,050 K at low gravity; T: clear, methane;
// Y: water clouds below ~400 K; Kirkpatrick 2005; Marley et al. 2012)
function bdType(T, low) { const lt = low ? 1050 : 1250; return T > lt + 100 ? ["silicate", "silicate", "an L dwarf · thick, red silicate dust clouds"] : T > lt - 150 ? ["silicate", "alkaliDark", "the L/T transition · patchy silicate clouds breaking up"] : T > 450 ? ["alkaliDark", "clearBlue", "a T dwarf · clear air darkened by methane and water"] : ["waterCloud", "saturn", "a Y dwarf · water clouds"]; }
function lumHaze(T, low) { const lt = low ? 1050 : 1250; return T > lt + 100 ? 0.15 : T > lt - 150 ? 0.06 : 0.01; }
// cloud and haze colour as a smooth function of temperature: interpolate (in log T) between neighbouring classes
MAT.ultra = spec(() => 0.035);                                          // ultra-hot daysides: almost no reflection
const DECK_BINS = {
  giant: [[120, "saturn", "saturnB"], [250, "waterCloud", "saturn"], [500, "clearBlue", "waterCloud"], [1000, "alkaliDark", "silicate"], [1700, "silicate", "alkaliDark"], [2400, "ultra", "silicate"]],
  lum: [[400, "waterCloud", "saturn"], [600, "alkaliDark", "clearBlue"], [1100, "alkaliDark", "alkaliDark"], [1400, "silicate", "alkaliDark"], [2600, "silicate", "silicate"]],
  lumLow: [[400, "waterCloud", "saturn"], [600, "alkaliDark", "clearBlue"], [900, "alkaliDark", "alkaliDark"], [1200, "silicate", "alkaliDark"], [2600, "silicate", "silicate"]],
  haze: [[300, "brightHaze", "waterCloud"], [550, "tholin", "brightHaze"], [900, "alkaliDark", "tholin"], [1400, "silicate", "alkaliDark"], [2200, "ultra", "silicate"]],
};
function deckFor(T, kind, id) {
  const bins = DECK_BINS[kind]; let i = 0;
  while (i < bins.length - 1 && T > bins[i + 1][0]) i++;
  const j = Math.min(bins.length - 1, i + 1), t = i === j || T <= bins[0][0] ? 0 : Math.min(1, Math.max(0, Math.log(T / bins[i][0]) / Math.log(bins[j][0] / bins[i][0])));
  const A = mixS(MAT[bins[i][1]], MAT[bins[j][1]], t), B = mixS(MAT[bins[i][2]], MAT[bins[j][2]], t);
  MAT[`deck_${id}_A`] = A; MAT[`deck_${id}_B`] = B;
  return [`deck_${id}_A`, `deck_${id}_B`, t < 0.5 ? bins[i][1] : bins[j][1]];
}
// Radius valley (Fulton et al. 2017): its centre falls with orbital period, log R_gap = 0.37 − 0.09 log P (Van Eylen et al. 2018,
// Sun-like stars), and moves to smaller radii around lower-mass stars (approximate M★^0.26 scaling, a model choice). The scaling stops at
// 0.5 M☉: around M dwarfs the valley is observed near 1.6–1.8 Earth radii (Van Eylen et al. 2021), its slope is disputed (Cloutier & Menou 2020),
// and carrying the scaling further would put it near 1 Earth radius around the smallest stars, which no survey sees. The period is held to the
// 1–100 days over which the valley is measured
function radiusGap(P, Ms) { return Math.pow(10, 0.37 - 0.09 * Math.log10(Math.min(100, Math.max(1, P)))) * Math.pow(Math.max(0.5, Ms || 1), 0.26); }
function valleyOf(Rp, P, Ms, Mp, MpMeasured) {
  if (Rp > 4.5) return null;
  const Rg = radiusGap(P, Ms), side = Rp < Rg * 0.9 ? "below" : Rp > Rg * 1.1 ? "above" : "in";
  let comp = null;
  if (Mp && MpMeasured) { const Rrock = Math.pow(Mp, 0.27), q = Rp / Rrock; comp = q < 0.92 ? "denser than Earth-like rock: iron-rich, like Mercury" : q <= 1.08 ? "matches Earth-like rock and iron" : Rp < 2.2 && q < 1.35 ? "too large for bare rock: needs water or a thin hydrogen layer" : "needs a substantial volatile envelope (hydrogen, water, or both)"; }
  return { Rg, side, comp };
}
// Tidal locking: time to despin from an initial ~12 h (rocky) or ~10 h (giant) day, t ≈ ω a⁶ α m Q / (3 G M★² k₂ R³) (Gladman et al. 1996),
// with Q = 100, k₂ = 0.3, α = 0.33 for rock and Q = 10⁵, k₂ = 0.5, α = 0.25 for giants. Locked if that is shorter than the system's age.
// Eccentric orbits (e > 0.1) settle into a faster, pseudo-synchronous spin instead (Hut 1981), so no permanent day side.
function lockYears(Mp, Rp, a, Ms) {
  const giant = Rp > 4, w0 = 2 * Math.PI / ((giant ? 10 : 12) * 3600), Q = giant ? 1e5 : 100, k2 = giant ? 0.5 : 0.3, al = giant ? 0.25 : 0.33;
  const am = a * AU, m = Mp * ME, R = Rp * RE, M = Ms * 1.989e30;
  return w0 * am ** 6 * al * m * Q / (3 * G * M * M * k2 * R ** 3) / 3.156e7;
}
function autoWorld(c) {
  const L1 = c.Rs ** 2 * (c.Teff / 5772) ** 4, L = L1 + (c.L2 || 0), S = L / c.a ** 2, aR = c.a * AU / (c.Rs * RSUN);   // L2: a second star's light (circumbinary)
  const Teq = c.Teff * Math.sqrt(1 / (2 * aR)) * (L / L1) ** 0.25, Tsub = c.Teff / Math.sqrt(aR), hz = hzOf(c.Teff, L);
  // data guards: catalogue values that would break the rules are flagged, and the rule falls back to something safe
  const checks = [];
  let MpIn = c.Mp;
  if (MpIn) { const rho = MpIn / c.Rp ** 3 * 5.51; if ((rho > 18 && !(MpIn >= 1300 && c.Rp >= 6)) || (c.Rp >= 2 && rho > 12 && !(MpIn >= 1300 && c.Rp >= 6)) || rho < 0.01)   /* above ~4 Jupiter masses degeneracy pressure keeps giants Jupiter-sized, so densities of 20–80 g/cm³ are real (brown dwarfs) */   /* super-puffs such as Kepler-51 b really are ~0.03 g/cm³ */ { checks.push(["data", `Catalogue mass ${Math.round(MpIn)} M⊕ gives density ${rho.toFixed(rho < 1 ? 2 : 0)} g/cm³, which is physically implausible (likely an upper limit). Mass from radius used instead.`]); MpIn = null; } }
  if (isWD(c.Rs, c.Ms)) checks.push(["data", `Host star radius ${+c.Rs.toFixed(4)} R☉: a white dwarf. Habitable-zone and tidal-locking rules were built for main-sequence stars.`]);
  else if (isBD(c.Ms)) checks.push(["data", `Host of ${c.Ms} M☉: a brown dwarf, too light to shine as a star. It glows dull red from leftover heat; the habitable-zone and tidal-locking rules were built for main-sequence stars.`]);
  if (c.Teff < 2600 || c.Teff > 7200) checks.push(["rule", `Star at ${c.Teff} K is outside the 2,600–7,200 K range of the habitable-zone formula; limits are extrapolated.`]);
  if (aR < 2.5) checks.push(["rule", `Orbit only ${aR.toFixed(1)} stellar radii out: the star would fill ${Math.round(2 * Math.asin(1 / aR) / D2R)}° of sky, beyond what the landscape camera frames well.`]);
  const Mp = MpIn || massFromRadius(c.Rp);
  const tLock = lockYears(Mp, c.Rp, c.a, c.Ms), locked = tLock < 0.3 * (c.age || 5) * 1e9 && !(c.e > 0.1);   // the estimate is uncertain by orders of magnitude (Q, the first spin): only a clear margin counts as locked (cf. Bolmont et al. 2014 on Kepler-186 f)
  // cosmic shoreline (Zahnle & Catling 2017): a rocky planet keeps an atmosphere if its escape speed is high for the starlight it gets
  // (dividing line I ∝ v_esc⁴). keep: Earth 1, Venus 0.4, Titan 0.3, Mars 0.1, Mercury 0.003.
  // red dwarfs give their planets far more X-ray and UV light for the same total light; taken here as ×4 (debated, being tested by JWST)
  const keep = Math.sqrt(Mp / c.Rp) ** 4 / (S * (1 + 3 * Math.max(0, Math.min(1, (4500 - c.Teff) / 1000))));   // cooler stars stay active longer: their cumulative ultraviolet counts up to ×4, rising smoothly from K to M dwarfs (no cliff at one temperature)
  const Rg = radiusGap(c.P, c.Ms);
  const optHZ = c.a >= Math.min(hz[2], hz[0] / Math.SQRT2) && c.a <= hz[3], cls0 = c.Rp >= 6 ? "giant" : c.Rp >= 4 ? "subneptune" : c.Rp < Rg * 0.9 ? "rocky" : c.Rp > Rg * 1.1 ? "subneptune" : "transition";
  const cls = cls0 === "subneptune" && c.Rp < 1.9 && optHZ ? "transition" : cls0;   // in the habitable zone, below 1.9 R⊕ a rocky planet is still a real possibility
  const sc = [];
  const where = locked ? { theta: 55, lat: 10 } : { theta: 58, lat: 0 };
  const L_ROCKY = [[1, "#6a6058", "rock mantle"], [0.55, "#5a4a3a", "iron core"]];
  const verdict = "Untested";
  // scale height H = kT / (μ m_H g) for H₂/He (μ ≈ 2.3): about 3.6 T / g km. Low gravity and heat make puffy, hazy envelopes
  const gPl = G * Mp * ME / (c.Rp * RE) ** 2, Hkm = 3.6 * Teq / gPl;
  const hazeTau = Math.min(0.6, 0.12 + 0.0016 * Hkm) * (Teq > 350 && Teq < 950 ? 1.4 : 1);   // photochemical hazes are most efficient at ~400–900 K
  const hazeDeck = deckFor(Teq, "haze", c.id + "h"), giantDeck = deckFor(Teq, "giant", c.id + "g");
  const streak = locked ? Math.max(0, Math.min(0.85, (Teq - 500) / 1200)) : (cls === "giant" ? 0.2 : 0);   // day-to-night jets on hot locked giants; zonal jets stretch cloud bands on fast spinners
  const temperate = vd => locked
    ? ({ name: "Shore of an eyeball ocean", verdict: vd, ground: "ocean", oceanDeg: 50, floes: true, autoP: true, ...where, atm: { P: 1, gas: "N₂" }, T: 278, weather: "rain", clouds: 0.5, plants: true, base: 2,
        layers: [[1, "#2b6aa3", "ocean facing the star, ice elsewhere"], [0.96, "#6a6058", "rock mantle"], [0.55, "#5a4a3a", "iron core"]], wx: "Rain under the cloud deck over the star-facing ocean." + (c.Teff < 3900 ? " Red dwarfs shine brightly for their first few hundred million years, which may have boiled such an ocean away long ago (Luger & Barnes 2015)." : ""), life: "Liquid water exists in this scenario. No evidence of life." })
    : ({ name: "Coast with continents", verdict: vd, ground: "ocean", land: 1, autoP: true, ...where, atm: { P: S < 0.5 ? 3 : 1, gas: S < 0.5 ? "N₂ + CO₂" : "N₂" }, T: 285, weather: "rain", clouds: 0.45, plants: true, base: 2,
        layers: [[1, "#2b6aa3", "oceans and continents"], [0.96, "#6a6058", "rock mantle"], [0.55, "#5a4a3a", "iron core"]],
        wx: S < 0.5 ? "With so little sunlight, staying warm needs a thick CO₂ greenhouse." : "Earth-like sunlight; days and seasons depend on a spin we cannot measure.", life: "Liquid water exists in this scenario. No evidence of life." });
  // a giant near the habitable zone that could keep a large moon gets an imagined habitable moon, the giant hanging in its sky (Heller & Barnes 2013)
  if (cls === "giant") {
    // young or massive giants far from their star are warmed mostly by their own heat of formation: the same cooling fit as the giant model
    // (physics-giants.js), or a measured temperature, sets the cloud class (e.g. GU Psc b: 2,000 au from its star, but about 1,000 K)
    const Tint = (typeof GIANT !== "undefined" && GIANT.MEAS[c.name] && GIANT.MEAS[c.name].Tint) || (Mp > 60 ? 447 * Math.sqrt(Mp / 317.8) * Math.pow(Math.max(0.005, c.age || 5) / 0.02, -0.32) : 0);
    const Tg = (Teq ** 4 + Tint ** 4) ** 0.25, own = Tint > Teq * 1.2, gLow = G * Mp * ME / (c.Rp * RE) ** 2 < 100, gDeck = own ? deckFor(Tg, gLow ? "lumLow" : "lum", c.id + "g") : giantDeck;
    const [, , label] = own ? bdType(Tg, gLow) : sudarsky(Tg);
    sc.push({ name: Tg > 2000 && !own ? "High in a cloudless, glowing sky" : "Above the cloud tops", verdict: own ? `Model · like ${label.split(" ·")[0]}` : `Model · ${label.split(" · ")[1]}`, ground: "clouds", deck: gDeck[0], deckB: gDeck[1], streak, ...where, atm: { P: 0.1, gas: "H₂", dust: own ? lumHaze(Tg, gLow) : giantHaze(Tg), dustMat: gDeck[0] }, T: Tg, weather: "none", base: 2,
      layers: [[1, "#b8b0a0", "cloud deck"], [0.93, "#8a8f9c", "H₂/He envelope"], [0.3, "#5a4a3a", "core (unknown)"]],
      wx: own ? `Its own heat, about ${Math.round(Tg)} K and still cooling since it formed, outweighs its star's, so its clouds follow the brown dwarfs: ${label.split(" · ")[1]}.` : `At about ${Math.round(Teq)} K, models expect ${label.split(" · ")[1]} (cloud class ${label.split(" ·")[0]} of Sudarsky et al. 2000).`, life: "No surface: no." });
    // albedo is unmeasured for most giants, and measured ones span coal-dark to bright: offer the other extreme as a second world
    const gm = typeof GIANT !== "undefined" && GIANT.MEAS[c.name], albedoKnown = gm && (gm.deck || gm.scale || gm.bright || gm.westClouds || gm.Tday);   // a measured day side constrains the albedo too
    if (!own && Tg > 350 && Tg < 2000 && !albedoKnown) { const L0 = sc[sc.length - 1];
      sc.push(Tg < 1400 ? { ...L0, name: "Above bright, high clouds", giantVar: "bright", verdict: "Allowed: a few warm and hot giants are this bright (Kepler-7 b reflects about a third of its light; Demory et al. 2013), though most measured ones are dark", wx: "High, reflective clouds over the whole planet, as on the brightest hot giants measured." }
        : { ...L0, name: "Above a dark, cloud-free sky", giantVar: "dark", verdict: "Allowed: most hot Jupiters measured are darker than coal, reflecting under a tenth of their light (Esteves et al. 2015)", wx: "A clear sky over a deep, dark atmosphere, as on most hot Jupiters measured." }); }
  }
  if (cls === "subneptune" || cls === "transition") {
    sc.push({ name: c.Rp >= 3.5 ? (Teq < 150 ? "Above the methane haze of an ice giant" : "Above the clouds of a Neptune-size planet") : "Above the haze of a mini-Neptune", verdict, ground: "clouds", deck: hazeDeck[0], deckB: hazeDeck[1], streak, ...where, atm: { P: 0.1, gas: "H₂", dust: hazeTau * 0.35, dustMat: hazeDeck[0] }   /* standing above the main haze layer: only its thin upper part is overhead */, T: Teq, weather: "none", base: 2,
      layers: [[1, "#a39b8c", "haze and H₂/He envelope"], [0.75, "#8a7b70", "hot, dense H₂ + H₂O"], [0.5, "#7a5a43", "rock + iron core"]],
      wx: "A thick hydrogen envelope with photochemical haze: the most common outcome for planets this size.", life: "No surface we could stand on." });
    const rhoW = MpIn && c.RpMeas !== false ? MpIn / c.Rp ** 3 * 5.51 : null;
    // a surface ocean only within the habitable zone; hotter, a water-rich planet keeps its water as steam over supercritical water (Turbet et al. 2020)
    // beyond the habitable zone a water-rich planet is frozen at the surface (a giant Europa or Ganymede), not an open ocean
    if (c.a > hz[3] && Teq < 200) sc.push({ name: "Ice shell of a frozen water world", verdict: rhoW && rhoW > 2.5 && rhoW < 4.5 ? "Allowed: its density fits a planet rich in water" : verdict, ground: "ice", ...where, atm: null, T: Math.round(Teq), weather: "none", base: 2,
      layers: [[1, "#dfe8ee", "ice shell"], [0.92, "#2b6aa3", "deep ocean, if any heat keeps it liquid"], [0.8, "#8fc3d9", "high-pressure ice"], [0.6, "#7a5a43", "rock + iron"]],
      wx: "Far beyond the habitable zone: a water-rich planet this cold is frozen at the surface, perhaps with an ocean under the ice, like a giant Europa or Ganymede.", life: "Only possible under the ice." });
    else if (Teq < 420 && c.a >= hz[0] * 0.95) sc.push({ name: "Open ocean of a water world", verdict: rhoW && rhoW > 2.5 && rhoW < 4.5 ? "Allowed: its density fits a planet rich in water" : verdict, ground: "ocean", land: -1, ...where, atm: { P: 5, gas: "N₂ + H₂O" }, T: 300, weather: "rain", clouds: 0.6, base: 2,
      layers: [[1, "#2b6aa3", "deep global ocean"], [0.85, "#8fc3d9", "high-pressure ice"], [0.6, "#7a5a43", "rock + iron"]],
      wx: "No land anywhere: hundreds of kilometres of water over high-pressure ice.", life: "Possible in principle; no evidence." });
    else if (Teq < 900) sc.push({ name: "Above the steam of a water world", verdict: rhoW && rhoW > 2.5 && rhoW < 4.5 ? "Allowed: its density fits a planet rich in water" : verdict, ground: "clouds", deck: "waterCloud", deckB: "waterCloud", ...where, atm: { P: 1, gas: "H₂O", dust: 0.3 }, T: Teq, weather: "none", base: 2,
      layers: [[1, "#d6dde2", "deep steam atmosphere"], [0.85, "#8fc3d9", "supercritical water"], [0.6, "#7a5a43", "rock + iron"]],
      wx: "Too much starlight for a surface ocean: a planet this rich in water and this hot keeps it as a deep steam atmosphere over supercritical water (Turbet et al. 2020).", life: "No surface ocean." });
  }
  if (cls === "rocky" || cls === "transition") {
    // lava: stand where the local radiative-equilibrium temperature is safely above the ~1,600 K melting point
    const thLava = Tsub > 1650 ? Math.min(60, Math.acos(Math.min(1, (1650 / Tsub) ** 4)) / D2R - 8) : 0;   // farthest spot from the substellar point that is still molten
    if (thLava >= 30) { sc.push({ name: "Shore of a lava sea", verdict, ground: "lava", theta: Math.round(thLava), lat: locked ? 8 : 0, atm: null, weather: "sparks", base: 2,
      layers: [[1, "#e06a2a", "dayside magma ocean"], [0.97, "#6a6058", "rock mantle"], [0.5, "#5a4a3a", "iron core"]], wx: "The dayside is hot enough to melt rock.", life: "No." });
      // offered on every lava world, not only above the cosmic shoreline: a magma ocean can outgas air faster than starlight strips it. Both lava
      // worlds JWST has measured with air sit far below the shoreline (55 Cnc e, Hu et al. 2024; TOI-561 b, Teske et al. 2025)
      sc.push({ name: "Lava sea under a thin CO₂ atmosphere", verdict: "Possible: about half the lava worlds measured show air (55 Cnc e, TOI-561 b, HD 3167 b), the rest look bare (GJ 367 b, TOI-2431 b)", ground: "lava", theta: Math.round(thLava), lat: locked ? 8 : 0,
      atm: { P: 1, gas: "CO₂ + CO" }, weather: "sparks", base: 2, layers: [[1, "#e06a2a", "dayside magma ocean"], [0.97, "#6a6058", "rock mantle"], [0.5, "#5a4a3a", "iron core"]],
      wx: "JWST found that 55 Cnc e keeps a volatile, CO₂- or CO-rich atmosphere, probably outgassed by its magma ocean (Hu et al. 2024); a planet this massive could too.", life: "No." }); }
    else if (c.a < hz[0] * 0.92) {
      if (keep < 0.01) sc.push({ name: "Scorched bare rock", verdict: "Below the cosmic shoreline", ground: "rock", ...where, atm: null, weather: "none", base: 1, layers: L_ROCKY, wx: "Too small and too strongly lit to keep an atmosphere (below the cosmic shoreline of Zahnle & Catling 2017).", life: "No." });
      else sc.push({ name: "Scorched bare rock", verdict, ground: "rock", ...where, atm: null, weather: "none", base: 2, layers: L_ROCKY, wx: "Too close for liquid water. No air in this scenario.", life: "No." });
      sc.push({ name: "Venus-like", verdict, ground: "clouds", deck: "h2so4", deckB: "h2so4", ...where, atm: { P: 0.1, gas: "CO₂" }, T: 300, weather: "none", base: 2,
        layers: [[1, "#d8c48a", "thick CO₂, H₂SO₄ clouds"], [0.95, "#a0603a", "hot rock surface"], [0.5, "#5a4a3a", "iron core"]], wx: "Seen from above the sulfuric-acid cloud deck, as a balloon might see Venus.", life: "Not at the surface." });
      if (keep < 0.01) sc.pop();                        // no air to make clouds from
      else if (keep > 0.2) sc.unshift(sc.pop());        // massive enough to hold a thick atmosphere: Venus-like comes first
      if (c.a >= (locked ? hz[0] / Math.SQRT2 : hz[2]) && keep >= 0.01) sc.push(temperate(locked ? "Possible if day-side clouds reflect enough starlight (Yang et al. 2013)" : "Optimistic habitable zone: needs thick, reflective clouds"));
      // too hot for oceans, but a locked planet that is nearly dry can keep a mild ring along its terminator: little water vapour means a weak
      // greenhouse, and what water there is gathers as ice on the night side and melts at its edge (Leconte et al. 2013; Lobo et al. 2023)
      else if (locked && c.a >= hz[0] / 2 && keep >= 0.05) sc.push({ name: "Lakeshore on the terminator of a dry world", verdict: "Speculative: only if the planet is nearly dry (Leconte et al. 2013; Lobo et al. 2023)",
        ground: "ocean", land: 1, term: true, theta: 85, lat: 6, atm: { P: 0.5, gas: "N₂" }, T: 290, weather: "none", clouds: 0.15, plants: true, base: 2,
        layers: [[1, "#b08a5a", "scorched day side, frozen night side"], [0.96, "#6a6058", "rock mantle"], [0.55, "#5a4a3a", "iron core"]],
        wx: "Too much starlight for oceans. If the planet is nearly dry, the day side is a hot desert and the night side frozen, and between them a ring of mild ground where meltwater from the night-side ice pools in lakes.",
        life: "Liquid water is possible in this scenario, only along the terminator. No evidence of life." });
    } else if (c.a <= hz[3] && keep < 0.01) {
      sc.push({ name: "Airless rock", verdict: "Below the cosmic shoreline", ground: "rock", ...where, atm: null, weather: "none", base: 1, layers: L_ROCKY, wx: "In the habitable zone, but too small to keep an atmosphere, so no liquid water (cosmic shoreline, Zahnle & Catling 2017).", life: "No." });
    } else if (c.a <= hz[3]) {
      sc.push(temperate(c.a > hz[1] ? "Optimistic habitable zone: needs a strong greenhouse" : verdict));
      sc.push({ name: "Snowball", verdict, ground: "ice", ...where, atm: { P: 1, gas: "N₂" }, T: 230, weather: "snow", base: 2, layers: L_ICE, wx: "Frozen over, with light snow.", life: "Only possible under the ice." });
      if (c.a < hz[0] * 1.1) sc.push({ name: "Venus-like (runaway greenhouse)", verdict, ground: "clouds", deck: "h2so4", deckB: "h2so4", ...where, atm: { P: 0.1, gas: "CO₂" }, T: 300, weather: "none", base: 2,
        layers: [[1, "#d8c48a", "thick CO₂, H₂SO₄ clouds"], [0.95, "#a0603a", "hot rock surface"], [0.5, "#5a4a3a", "iron core"]], wx: "Right at the inner edge of the habitable zone, oceans may have boiled away. Seen from above the acid cloud deck.", life: "Not at the surface." });
      else sc.push({ name: "Cold desert", verdict, ground: "regolith", ...where, atm: { P: 0.01, gas: "CO₂", dust: 0.5 }, T: 230, weather: "dust", base: 2, layers: L_ROCKY, wx: "Thin CO₂ air and blowing dust, like Mars.", life: "No liquid water at the surface." });
      // red dwarfs: every rocky planet JWST has tested around one looks bare or nearly so (Zieba et al. 2023; Greene et al. 2023; Xue et al. 2024;
      // Mansfield et al. 2024), though all were hotter than this. The shoreline's ×4 ultraviolet factor is a guess JWST is still testing, so airless stays on the table.
      if (c.Teff < 3900 && (cls === "rocky" || cls === "transition")) sc.push({ name: "Airless rock", verdict: "Allowed: every rocky planet of a red dwarf that JWST has measured so far looks bare, though none as temperate as this has been tested", ground: "rock", ...where, atm: null, weather: "none", base: 2, layers: L_ROCKY,
        wx: "Red dwarfs flare and blast their planets with ultraviolet light for billions of years. If that stripped the air, this is bare, sunbaked rock under a black sky.", life: "No liquid water at the surface." });
    } else {
      sc.push({ name: "Frozen world", verdict, ground: "ice", ...where, atm: null, T: Math.round(Teq), weather: "none", base: 2, layers: L_ICE, wx: "Beyond the habitable zone: ice, frost and starlight.", life: "Only possible deep below the ice." });
      // cold and able to hold air: nitrogen with methane, and starlight turns the methane into an orange organic haze (as on Titan)
      if (keep > 0.2 && Teq < 160) sc.unshift({ name: "Hazy nitrogen world (Titan-like)", verdict, ground: "ice", ...where, atm: { P: 1.5, gas: "N₂ + CH₄", dust: 0.9, dustMat: "tholin" }, T: Math.round(Teq), weather: "none", clouds: 0.2, base: 2, layers: L_ICE,
        wx: "Cold enough for methane to stay in the air, and heavy enough to keep it: starlight turns it into a thick orange organic haze, as on Titan.", life: "Unknown chemistry; no evidence." });
    }
  }
  // a measured density below bare rock's (radius more than 7% above Earth-like rock at that mass) points to water or a thin envelope: the water-world reading
  // comes first. Density nudges the order of scenarios; it does not set the category (density classes are disputed)
  const lowRho = cls !== "subneptune" && MpIn && c.RpMeas !== false && c.Rp < 2.2 && Teq > 250 && c.Rp >= 1.3 && c.Rp > 1.18 * Math.pow(MpIn, 0.27);   // radius 18%+ above Earth-like rock (Zeng et al. 2016), warm enough for water to be liquid or steam
  const lavaW = sc.find(x => x.ground === "lava");
  if (lowRho && lavaW) {   // a molten planet too large for rock: a thick volatile atmosphere over the magma ocean (as on TOI-561 b; Teske et al. 2025)
    sc.unshift({ ...lavaW, name: "Magma ocean under a thick atmosphere", verdict: "Favoured by its low density: a thick atmosphere over a magma ocean (as measured on TOI-561 b)", atm: { P: 5, gas: "CO₂ + H₂O" }, base: 2,
      wx: "A thick, volatile-rich atmosphere over the magma ocean carries heat to the night side, so the day side is far cooler than bare rock would be." });
  } else if (lowRho) {
    // rocky-sized but too large for its mass to be rock and iron: it must hold water or a thin hydrogen envelope. If the rules offered neither
    // (a planet classed as rocky), both are added; the water-rich reading leads (as measured for GJ 9827 d and inferred for π Men c and
    // Kepler-138 c, d), the hydrogen one follows (as JWST suggests for L 98-59 d)
    if (!sc.some(x => /water world/.test(x.name))) {
      if (Teq < 420 && c.a >= hz[0] * 0.95) sc.push({ name: "Open ocean of a water world", verdict, ground: "ocean", land: -1, ...where, atm: { P: 5, gas: "N₂ + H₂O" }, T: 300, weather: "rain", base: 2,
        layers: [[1, "#2b6aa3", "deep global ocean"], [0.85, "#8fc3d9", "high-pressure ice"], [0.6, "#7a5a43", "rock + iron"]], wx: "No land anywhere: hundreds of kilometres of water over high-pressure ice.", life: "Possible in principle; no evidence." });
      else sc.push({ name: "Above the steam of a water world", verdict, ground: "clouds", deck: "waterCloud", deckB: "waterCloud", ...where, atm: { P: 1, gas: "H₂O", dust: 0.3 }, T: Teq, weather: "none", base: 2,
        layers: [[1, "#d6dde2", "deep steam atmosphere"], [0.85, "#8fc3d9", "supercritical water"], [0.6, "#7a5a43", "rock + iron"]], wx: "Too much starlight for a surface ocean: a water-rich planet this hot keeps its water as a deep steam atmosphere over supercritical water (Turbet et al. 2020).", life: "No surface ocean." });
    }
    if (!sc.some(x => /mini-Neptune/.test(x.name))) sc.push({ name: "Above the haze of a mini-Neptune", verdict: "Possible: a thin hydrogen envelope would also explain its low density", ground: "clouds", deck: hazeDeck[0], deckB: hazeDeck[1], streak, ...where,
      atm: { P: 0.1, gas: "H₂", dust: hazeTau, dustMat: hazeDeck[0] }, T: Teq, weather: "none", base: 2, layers: [[1, "#a39b8c", "haze and thin H₂/He envelope"], [0.75, "#8a7b70", "hot, dense H₂ + H₂O"], [0.5, "#7a5a43", "rock + iron core"]],
      wx: "A thin hydrogen envelope over a rocky core, with photochemical haze.", life: "No surface we could stand on." });
    const k = sc.findIndex(x => /water world/.test(x.name)); if (k > 0) sc.unshift(sc.splice(k, 1)[0]); if (k >= 0) sc[0].verdict = "Favoured by its low density: too large for its mass to be rock and iron";
  }
  if ((cls === "rocky" || cls === "transition") && keep >= 0.01 && keep < 0.2 && !/^Favoured by its low density/.test((sc[0] || {}).verdict || "")) {   // near the shoreline: thin air is the likelier outcome
    const k = sc.findIndex(x => x.ground === "regolith"); if (k > 0) sc.unshift(sc.splice(k, 1)[0]);
    sc.forEach(x => { if (x.ground === "ocean") x.verdict = "Unlikely: too small to hold thick air"; });
  }
  // planets in the 1.6–2 R⊕ radius gap: below ~1.8 R⊕ most are rocky, above it most keep a gas envelope (Fulton et al. 2017)
  if (cls === "rocky" && c.P < 50 && sc[0]) sc[0].wx += " It is small enough that it has probably lost any hydrogen it was born with, leaving rock and iron.";
  const gassy = x => (x.ground === "clouds" && x.deck !== "h2so4") || x.land === -1;   // hydrogen envelopes and water worlds, not Venus-like rocky planets
  if (cls === "transition" && (c.Rp < Rg || c.Rp < 1.6) && !lowRho) sc.sort((x, y) => (gassy(x) ? 1 : 0) - (gassy(y) ? 1 : 0));
  // a liquid surface under a thick envelope on planets above ~2 R⊕ is disputed: the ocean may be supercritical or dissolved into the
  // hydrogen (Innes et al. 2023; Pierrehumbert 2023; Shorttle et al. 2024), so such oceans carry the dispute in their verdict
  if (c.Rp > 2) sc.forEach(x => { if (x.ground === "ocean" && x.land === -1 && !/^Measured/.test(x.verdict || "")) x.verdict = /^Favoured/.test(x.verdict || "") ? x.verdict + "; whether a liquid surface exists at this size is disputed" : "Contested: whether a planet this large can keep a liquid ocean surface is disputed (Innes et al. 2023; Shorttle et al. 2024)"; });
  // spot checks: where a closer look at the literature settles which reading leads, that scenario comes first with the evidence as its verdict
  const ruleLead = sc[0] && sc[0].name;   // what the rules alone would show first, kept to audit the rules against the literature
  const spot = SPOT[c.name.toLowerCase().replace(/[\s\-'’]/g, "")];
  if (spot && spot.thick) { const L = sc.find(x => x.ground === "lava"); if (L) sc.push({ ...L, name: "Magma ocean under a thick atmosphere", atm: { P: 5, gas: spot.thick }, base: 1,
    wx: "A thick, volatile-rich atmosphere over the magma ocean carries heat to the night side, so the day side is far cooler than bare rock would be." }); }
  if (spot) { const bare = !spot.first && /bare|no thick|no atmosphere|airless|disintegrat|dust|glow and reflected/i.test(spot.verdict || "") && sc[0] && sc[0].ground === "lava" && sc[0].atm;   // a "bare" finding on a lava world means the airless shore
    const k = spot.first ? sc.findIndex(x => spot.first.test(x.name)) : bare ? Math.max(0, sc.findIndex(x => x.ground === "lava" && !x.atm)) : 0; if (k >= 0) { sc.unshift(sc.splice(k, 1)[0]); if (spot.verdict) sc[0].verdict = spot.verdict; if (spot.note) sc[0].wx = (sc[0].wx || "") + " " + spot.note + "."; sc[0].spot = true;
    if (spot.deck) { sc[0].deck = sc[0].deckB = spot.deck; if (sc[0].atm) sc[0].atm = { ...sc[0].atm, dustMat: spot.deck }; }
    // where a measurement favours one world, the untested others are less likely, and say so
    if (spot.others) for (const x of sc.slice(1)) { if (!/^Measured/.test(x.verdict || "")) x.verdict = spot.others; }
    else if (/^(Favoured|Measured|Atmosphere favoured|Atmosphere inferred)/.test(spot.verdict || "")) for (const x of sc.slice(1)) if (!x.verdict || /^Untested$/i.test(x.verdict)) x.verdict = "Less favoured by the measurements"; } }
  // findings from papers can add possible worlds the rules would not offer (e.g. 55 Cancri e's air coming and going)
  const F = typeof FINDINGS !== "undefined" ? FINDINGS[c.name.toLowerCase().replace(/[\s\-'’]/g, "")] : null;
  if (F && F.worlds) for (const x of F.worlds) { const base = sc.find(s => s.ground === x.like) || sc[0]; const { like, lead, ...rest } = x; const v = { ...base, ...rest, spot: true };
    const dup = sc.findIndex(s => s.name === v.name); if (dup >= 0) sc.splice(dup, 1);   // the finding's version replaces the rules' world of the same name
    if (lead) sc.unshift(v); else sc.push(v); }
  const w = {
    id: c.id, name: c.name, auto: true, age: c.age || 5, sub: c.sub || "", flag: c.flag,
    star: { name: c.host, Teff: c.Teff, Rs: c.Rs, M: c.Ms }, a: c.a, Rp: c.Rp, Mp, MpAssumed: !MpIn, P: c.P, locked, siblings: c.siblings || [], system: c.system || [{ name: c.name, a: c.a, R: c.Rp }],
    scenarios: sc, ruleLead, points: c.points, cls, autoInfo: { Teq, Tsub, S, hz, cls, locked, keep, tLock, e: c.e }, checks,
  };
  if (c.override) c.override(w);
  if (!w.sub) w.sub = `${c.Rp} Earth radii${c.Mp ? `, ${c.Mp} Earth masses` : ""}, orbiting a ${c.Teff} K star every ${c.P < 2 ? (c.P * 24).toFixed(1) + " hours" : Math.round(c.P) + " days"}. Generated from catalogue values only.`;
  return w;
}
const AUTO = [
  autoWorld({ id: "k186f", name: "Kepler-186f", host: "Kepler-186", Teff: 3755, Rs: 0.523, Ms: 0.544, age: 4, a: 0.432, P: 129.94, Rp: 1.17,
    siblings: [{ name: "Kepler-186b", a: 0.0343, R: 1.07 }, { name: "Kepler-186c", a: 0.0451, R: 1.25 }, { name: "Kepler-186d", a: 0.0781, R: 1.40 }, { name: "Kepler-186e", a: 0.110, R: 1.27 }],
    system: [{ name: "Kepler-186b", a: 0.0343, R: 1.07 }, { name: "Kepler-186c", a: 0.0451, R: 1.25 }, { name: "Kepler-186d", a: 0.0781, R: 1.40 }, { name: "Kepler-186e", a: 0.110, R: 1.27 }, { name: "Kepler-186f", a: 0.432, R: 1.17 }],
    sub: "The first Earth-sized planet found in a habitable zone (2014). Only its size and orbit are known: no mass, no atmosphere. Climate models need 0.5–5 bar of CO₂ to keep it above freezing, and whether it keeps one face to its star depends on its unknown early spin (Bolmont et al. 2014). Generated from catalogue values only." }),
  autoWorld({ id: "k452b", name: "Kepler-452b", host: "Kepler-452", Teff: 5757, Rs: 1.11, Ms: 1.037, age: 6, a: 1.046, P: 384.84, Rp: 1.63, flag: "Existence disputed",
    sub: "Billed as Earth's \"older cousin\": a year of 385 days around a Sun-like star. Later analyses could not confirm it is a planet rather than a noise signal (Mullally et al. 2018). At 1.6 Earth radii it could be rocky or gassy. Generated from catalogue values only." }),
  autoWorld({ id: "55cnce", name: "55 Cancri e", host: "55 Cancri A", Teff: 5172, Rs: 0.943, Ms: 0.905, age: 10, a: 0.01544, P: 0.7365, Rp: 1.875, Mp: 7.99,
    siblings: [{ name: "55 Cancri b", a: 0.118, R: 11.2 }, { name: "55 Cancri c", a: 0.247, R: 7 }, { name: "55 Cancri f", a: 0.802, R: 6.5 }],
    system: [{ name: "55 Cancri e", a: 0.01544, R: 1.875 }, { name: "55 Cancri b", a: 0.118, R: 11.2, note: "≥ 0.83 M♃, size assumed" }, { name: "55 Cancri c", a: 0.247, R: 7, note: "size assumed" }, { name: "55 Cancri f", a: 0.802, R: 6.5, note: "size assumed" }],
    farNote: "A fifth giant, 55 Cancri d, orbits at 5.6 AU, far outside this view.",
    sub: "A super-Earth with an 18-hour year, so hot its dayside is likely molten. JWST found signs of a secondary atmosphere, probably CO or CO₂ breathed out by the magma (Hu et al. 2024). Its glow changes from year to year and even week to week, so that air may come and go (Demory et al. 2016; Patel et al. 2024). A giant sibling looms Moon-sized in its sky.",
    override: w => { const s = w.scenarios.find(x => x.ground === "lava"); if (s) { s.name = "Lava sea under a CO/CO₂ atmosphere"; s.atm = { P: 1, gas: "CO₂ + CO" }; s.verdict = "Favoured: a CO/CO₂ atmosphere fits JWST's emission, though not conclusively (Hu et al. 2024)"; s.base = 1; s.wx = "JWST thermal emission points to a volatile atmosphere, probably CO- or CO₂-rich, outgassed by the magma ocean. Pressure unknown; 1 bar is drawn."; } w.scenarios = w.scenarios.filter(x => x.ground === "lava" && x.name !== "Lava sea under a thin CO₂ atmosphere"); } }),   // the generic outgassed-air world would repeat the measured one
  autoWorld({ id: "gj1214b", name: "GJ 1214b", host: "GJ 1214", Teff: 3101, Rs: 0.2162, Ms: 0.182, age: 5, a: 0.01505, P: 1.5804, Rp: 2.733, Mp: 8.41,
    sub: "A warm sub-Neptune 48 light years away. JWST's phase curve shows a metal-rich atmosphere under a bright, reflective haze that bounces back half the starlight (Kempton et al. 2023). Its air may be made mostly of heavy elements rather than hydrogen (Ohno et al. 2025).",
    override: w => { const s = w.scenarios[0]; s.deck = "brightHaze"; s.deckB = "tholin"; s.verdict = "Haze measured"; s.base = 1; s.wx = "A thick, highly reflective haze or cloud deck (Bond albedo 0.51 ± 0.06) over a metal-rich atmosphere with likely water vapour."; w.scenarios = [s]; } }),
];
