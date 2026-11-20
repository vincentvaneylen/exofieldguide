// Hand-checked worlds
// ================= Hand-checked worlds =================
const T1 = { b: [0.01154, 1.116], c: [0.01580, 1.097], d: [0.02227, 0.788], e: [0.02925, 0.920], f: [0.03849, 1.045], g: [0.04683, 1.129], h: [0.06189, 0.755] };
const t1sys = Object.entries(T1).map(([k, [a, R]]) => ({ name: `TRAPPIST-1${k}`, short: k, a, R }));
const sib = here => t1sys.filter(s => s.short !== here);
const L_ROCK = [[1, "#6a6058", "rock mantle"], [0.55, "#5a4a3a", "iron core"]];
const L_OCEAN = [[1, "#2b6aa3", "ocean facing the star, ice elsewhere"], [0.96, "#6a6058", "rock mantle"], [0.55, "#5a4a3a", "iron core"]];
const L_ICE = [[1, "#dfeaf2", "ice shell"], [0.96, "#6a6058", "rock mantle"], [0.55, "#5a4a3a", "iron core"]];
const WORLDS = [
  {
    id: "t1e", name: "TRAPPIST-1e", age: 7.6, sub: "Earth-sized, in its red dwarf's habitable zone, 41 light years away, with six siblings in its sky. JWST has ruled out hydrogen-rich air; nitrogen-rich air fits its first spectra, but so does bare rock (Espinoza et al. 2025; Glidden et al. 2025). If it has air, a heavy gas such as nitrogen with a trace of methane fits best, but starspots make the signal hard to read; fifteen more JWST transits are planned.",
    star: { name: "TRAPPIST-1", Teff: 2566, Rs: 0.1192, M: 0.0898 }, a: 0.02925, Rp: 0.92, Mp: 0.692, P: 6.101, locked: true, siblings: sib("e"), system: t1sys,
    scenarios: [
      { name: "Shore of an eyeball ocean", verdict: "Allowed: JWST rules out hydrogen-rich air, not nitrogen", ground: "ocean", oceanDeg: 55, floes: true, theta: 52, lat: 12, atm: { P: 1, gas: "N₂" }, temp: ["about 0–10 °C", 2], T: 278, weather: "rain", clouds: 0.5, plants: true, base: 2, layers: L_OCEAN,
        wx: "Thick cloud and frequent rain over the open ocean that faces the star. Ice floes drift at its edge.",
        life: "Liquid water: the one thing life as we know it needs. Plants here would probably be very dark, almost black, to soak up the scarce visible light. No life has been found on any exoplanet." },
      { name: "Snowball", verdict: "Allowed: JWST's first spectra do not rule it out", ground: "ice", theta: 60, lat: 10, atm: { P: 1, gas: "N₂" }, temp: ["about −40 °C", 2], T: 233, weather: "snow", base: 2, layers: L_ICE,
        wx: "Clear and still. Fine ice crystals glitter as they fall through the light.",
        life: "Only possible under the ice, as in the oceans of Europa or Enceladus." },
      { name: "Bare rock", verdict: "Allowed: bare rock fits JWST's first spectra as well as nitrogen air does (Glidden et al. 2025)", ground: "rock", theta: 60, lat: 10, atm: null, weather: "none", base: 2, layers: L_ROCK,
        wx: "No air, so no wind, no sound and no weather. Shadows are pitch black.",
        life: "No air and no liquid water at the surface: lifeless." },
    ],
  },
  {
    id: "t1b", name: "TRAPPIST-1b", age: 7.6, sub: "The innermost TRAPPIST-1 planet. JWST measured its dayside at 490 K, matching bare rock with no air. A full JWST phase curve found almost no heat reaching the night side, ruling out thick air; the surface fits fresh, dark ultramafic rock best (Gillon et al. 2025).",
    star: { name: "TRAPPIST-1", Teff: 2566, Rs: 0.1192, M: 0.0898 }, a: 0.01154, Rp: 1.116, Mp: 1.374, P: 1.511, locked: true, siblings: sib("b"), system: t1sys,
    scenarios: [
      { name: "Bare dark rock", verdict: "Favoured by JWST", ground: "rock", theta: 55, lat: 15, atm: null, weather: "none", base: 1, hot: true, layers: L_ROCK,
        wx: "No air. The ground is hotter than an oven, and the sky is black at noon, so stars and planets shine in daylight.",
        life: "Far too hot, with no air or water: lifeless." },
    ],
  },
  {
    id: "proxb", name: "Proxima b", age: 4.85, sub: "The nearest exoplanet, 4.2 light years away. It doesn't transit, so only its minimum mass (about 1.06 Earths, Suárez Mascareño et al. 2025) is known and its size is assumed. Its star flares often and strongly. A smaller sibling, Proxima d, about a quarter of Earth's mass, orbits closer in. Alpha Centauri A and B blaze in its sky.",
    star: { name: "Proxima Centauri", Teff: 2900, Rs: 0.141, M: 0.122 }, a: 0.04848, Rp: 1.03, RpAssumed: true, Mp: 1.055, msini: true, P: 11.185, locked: true, siblings: [], flareStar: true,
    system: [{ name: "Proxima d", a: 0.02885, R: 0.65, note: "≥ 0.26 M⊕" }, { name: "Proxima b", a: 0.04848, R: 1.03 }],
    points: [
      { name: "α Centauri A", mag: -6.6, Teff: 5790, az: 168, el: 28, lvl: 1 },
      { name: "α Centauri B", mag: -5.3, Teff: 5260, az: 168.12, el: 28.06, lvl: 1, nolabel: true },
      { name: "the Sun", mag: 0.4, Teff: 5772, az: 205, el: 30, lvl: 1 },
    ],
    scenarios: [
      { name: "Shore of an eyeball ocean", verdict: "Untested", ground: "ocean", oceanDeg: 50, floes: true, theta: 50, lat: 10, atm: { P: 1, gas: "N₂" }, temp: ["about 0–10 °C", 2], T: 278, weather: "rain", clouds: 0.45, plants: true, base: 2, layers: L_OCEAN,
        wx: "Showers from the cloud deck over the star-facing ocean. About five times a year a superflare makes the star briefly far brighter, blasting the surface with ultraviolet.",
        life: "Possible in principle: liquid water, and plants would likely be near-black. But frequent flares strip air and sterilise unprotected surfaces. No evidence either way." },
      { name: "Mars-like desert", verdict: "Untested", ground: "regolith", theta: 55, lat: 10, atm: { P: 0.006, gas: "CO₂", dust: 0.6 }, T: 230, weather: "dust", base: 2, layers: L_ROCK,
        wx: "Thin CO₂ air carrying fine red dust that tints the sky, as on Mars.",
        life: "Too thin an atmosphere for liquid water at the surface." },
      { name: "Bare rock", verdict: "Untested", ground: "rock", theta: 55, lat: 10, atm: null, weather: "none", base: 2, layers: L_ROCK,
        wx: "No air: flares may have stripped it away. The sky is black and Alpha Centauri shines in daylight.",
        life: "No air and no liquid water: lifeless." },
    ],
  },
  {
    id: "l1140", name: "LHS 1140b", age: 5, sub: "A super-Earth that is probably 10–20% water, 49 light years away. JWST hints at nitrogen-rich air and rules out hydrogen: the best candidate yet for an eyeball planet, iced over except for an ocean under its star (Cadieux et al. 2024; Damiano et al. 2024).",
    star: { name: "LHS 1140", Teff: 3096, Rs: 0.2159, M: 0.1844 }, a: 0.0946, Rp: 1.73, Mp: 5.6, P: 24.74, locked: true, siblings: [{ name: "LHS 1140c", a: 0.02675, R: 1.272 }],
    system: [{ name: "LHS 1140c", a: 0.02675, R: 1.272 }, { name: "LHS 1140b", a: 0.0946, R: 1.73 }],
    scenarios: [
      { name: "Snowball", verdict: "Consistent", ground: "ice", theta: 62, lat: 10, atm: { P: 1, gas: "N₂" }, temp: ["about −50 °C", 2], T: 223, weather: "snow", base: 2,
        layers: [[1, "#dfeaf2", "ice shell"], [0.93, "#8fc3d9", "high-pressure ice"], [0.8, "#6a6058", "rock mantle"], [0.45, "#5a4a3a", "iron core"]],
        wx: "Cold and calm, with light snow drifting under a dim red star.",
        life: "Only possible under the ice." },
      { name: "Eyeball ocean", verdict: "Favoured: tentative nitrogen-rich air (JWST)", ground: "ocean", oceanDeg: 35, floes: true, theta: 33, lat: 8, atm: { P: 2, gas: "N₂ + CO₂" }, temp: ["about 0–5 °C", 2], T: 276, weather: "rain", clouds: 0.55, plants: true, base: 2,
        layers: [[1, "#2b6aa3", "liquid ocean (star side), ice elsewhere"], [0.93, "#8fc3d9", "high-pressure ice"], [0.8, "#6a6058", "rock mantle"], [0.45, "#5a4a3a", "iron core"]],
        wx: "Needs a strong CO₂ greenhouse to keep this patch of ocean open. Heavy clouds over the water.",
        life: "Liquid water, so not excluded. You would weigh almost twice as much as on Earth." },
    ],
  },
  {
    id: "k10b", name: "Kepler-10b", age: 10.6, sub: "A rocky planet so close to its star that the dayside is molten. A year lasts 20 hours. Its mass, about 3.3 Earths, fits an Earth-like mix of rock and iron (Bonomo et al. 2025).",
    star: { name: "Kepler-10", Teff: 5708, Rs: 1.065, M: 0.91 }, a: 0.01685, Rp: 1.47, Mp: 3.24, P: 0.8375, locked: true, siblings: [{ name: "Kepler-10c", a: 0.241, R: 2.35 }],
    system: [{ name: "Kepler-10b", a: 0.01685, R: 1.47 }, { name: "Kepler-10c", a: 0.241, R: 2.35 }, { name: "Kepler-10d", a: 0.538, R: 3, note: "radius unknown, ≥ 12 M⊕" }],
    scenarios: [
      { name: "Shore of the lava sea", verdict: "Model", ground: "lava", theta: 60, lat: 8, atm: null, weather: "sparks", base: 1,
        layers: [[1, "#e06a2a", "dayside magma ocean"], [0.97, "#6a6058", "rock mantle"], [0.3, "#5a4a3a", "small or no iron core"]],
        wx: "No real atmosphere, perhaps a thin vapour of sodium and silicon oxides boiled from the rock. The star fills a third of the sky.",
        life: "No. The rock itself is molten." },
    ],
  },
  {
    id: "hd189", name: "HD 189733b", age: 5, sub: "A hot Jupiter whose deep blue colour has been measured; JWST has also found hydrogen sulfide in its air (Fu et al. 2024). There is no ground: these views float above the cloud deck. The same spectrum shows water, CO₂ and CO but no methane, and a metal content a few times the Sun's, like Jupiter's.",
    star: { name: "HD 189733", Teff: 4875, Rs: 0.805, M: 0.79 }, a: 0.03142, Rp: 1.13, Ru: "RJ", Mp: 1.13, Mu: "MJ", P: 2.219, locked: true, siblings: [],
    system: [{ name: "HD 189733b", a: 0.03142, R: 12.67 }], farNote: "A red dwarf companion, HD 189733B, orbits about 216 AU away: 7,000 times farther than this view.",
    points: [{ name: "HD 189733B (red dwarf)", mag: -8.1, Teff: 3200, az: 150, el: 30, lvl: 1 }],
    scenarios: [
      { name: "Above the blue haze", verdict: "Colour measured", ground: "clouds", deck: "hd189", deckB: "clearBlue", theta: 50, lat: 10, atm: { P: 0.05, gas: "H₂" }, temp: ["about 1,200 K", 0], T: 1200, weather: "glass", base: 1,
        layers: [[1, "#4a6fb5", "silicate haze and clouds"], [0.93, "#6a7690", "H₂/He envelope"], [0.3, "#5a4a3a", "heavy-element core (inferred)"]],
        wx: "Measured winds of about 8,700 km/h blow from day side to night side. Models suggest silicate particles, effectively glass, condense in the clouds and may rain sideways.",
        life: "No. Searing hydrogen and no surface." },
    ],
    gasGiant: true,
  },
  {
    id: "k16b", name: "Kepler-16b", age: 3, sub: "A cold Saturn-mass planet orbiting two stars. The real \"Tatooine\": every day has two sunrises. Its mass, about a third of Jupiter's, was confirmed from its stars' wobble: the first circumbinary planet found that way (Triaud et al. 2022).",
    star: { name: "Kepler-16 A", Teff: 4450, Rs: 0.6489, M: 0.6897 }, star2: { name: "Kepler-16 B", Teff: 3311, Rs: 0.2255, M: 0.2026, abin: 0.2243, Pbin: 41.08, sepDeg: 11 },
    a: 0.7048, Rp: 0.7538, Ru: "RJ", Mp: 0.333, Mu: "MJ", P: 228.8, locked: false, siblings: [], system: [{ name: "Kepler-16b", a: 0.7048, R: 8.45 }],
    scenarios: [
      { name: "Above the cloud tops", verdict: "Model", ground: "clouds", deck: "saturn", deckB: "saturnB", theta: 70, lat: 10, atm: { P: 0.1, gas: "H₂" }, temp: ["about −80 °C", 1], T: 190, weather: "none", base: 2,
        layers: [[1, "#d9cfb0", "water-ice clouds (model)"], [0.93, "#8a8f9c", "H₂/He envelope"], [0.4, "#5a4a3a", "core (unknown)"]],
        wx: "Pale cloud decks, probably water ice at this temperature. The two suns circle each other every 41 days, so their spacing changes through the month.",
        life: "No surface and very cold: unlikely." },
    ],
    gasGiant: true,
  },
  // ---- well-studied additions ----
  {
    id: "w39", name: "WASP-39b", age: 8.5, sub: "A puffy hot Saturn and JWST's first in-depth target: CO₂, SO₂, water and more have all been measured in its air.",
    star: { name: "WASP-39", Teff: 5485, Rs: 0.939, M: 0.913 }, a: 0.04828, Rp: 14.34, Mp: 89.3, P: 4.0553, locked: true, siblings: [], system: [{ name: "WASP-39b", a: 0.04828, R: 14.34 }],
    scenarios: [{ name: "Above the clouds", verdict: "Composition measured", ground: "clouds", deck: "silicate", theta: 50, lat: 10, atm: { P: 0.1, gas: "H₂" }, temp: ["about 1,100–1,200 K", 1], T: 1166, weather: "none", base: 1,
      layers: [[1, "#5a5348", "H₂/He, clouds at the morning edge"], [0.8, "#6a6458", "deep H₂/He"], [0.25, "#5a4a3a", "core (inferred)"]],
      wx: "Starlight breaks up hydrogen sulfide and makes sulfur dioxide. The morning edge is cloudier and cooler than the evening edge.", life: "No." }],
    gasGiant: true,
  },
  {
    id: "w121", name: "WASP-121b", age: 1.1, sub: "An ultra-hot Jupiter with a 30-hour year. Its day side is hot enough to break molecules apart; on the night side, metal and silicate clouds may form. JWST found silicon monoxide on the day side, the first in any planet's air, and methane on the night side, stirred up from deep below (Evans-Soma et al. 2025).",
    star: { name: "WASP-121", Teff: 6628, Rs: 1.461, M: 1.33 }, a: 0.02571, Rp: 19.53, Mp: 371.9, P: 1.2749, locked: true, siblings: [], system: [{ name: "WASP-121b", a: 0.02571, R: 19.53 }],
    scenarios: [{ name: "High in an ultra-hot sky", verdict: "Phase curve measured", ground: "clouds", deck: "silicate", theta: 40, lat: 8, atm: { P: 0.05, gas: "H₂" }, temp: ["night 926–1122 K (measured)", 0], T: 2400, weather: "none", base: 1,
      layers: [[1, "#a0603a", "dissociated H, metal vapour (day)"], [0.9, "#6a6058", "deep H₂/He"], [0.25, "#5a4a3a", "core"]],
      wx: "Supersonic winds carry heat east of the point under the star. The night side is cool enough for silicate and iron clouds.", life: "No." }],
    gasGiant: true,
  },
  {
    id: "hd209", name: "HD 209458b", age: 3.1, sub: "The first planet seen transiting its star (1999), and the first with a detected atmosphere. A tail of hydrogen streams away from it. JWST found water and carbon dioxide in its air (Xue et al. 2024).",
    star: { name: "HD 209458", Teff: 6091, Rs: 1.19, M: 1.23 }, a: 0.04707, Rp: 15.58, Mp: 232, P: 3.5247, locked: true, siblings: [], system: [{ name: "HD 209458b", a: 0.04707, R: 15.58 }],
    scenarios: [{ name: "Above the cloud tops", verdict: "Atmosphere detected", ground: "clouds", deck: "silicate", theta: 50, lat: 10, atm: { P: 0.1, gas: "H₂" }, T: 1450, weather: "none", base: 1,
      layers: [[1, "#4a4038", "H₂/He with Na; escaping H above"], [0.85, "#6a6458", "deep H₂/He"], [0.25, "#5a4a3a", "core"]],
      wx: "Very dark: sodium absorbs most visible light. The planet is slowly losing hydrogen to space.", life: "No." }],
    gasGiant: true,
  },
  {
    id: "w107", name: "WASP-107b", age: 3.4, sub: "Jupiter-sized but only 30 Earth masses: one of the fluffiest planets known. JWST shows its interior is unexpectedly hot: methane is a thousand times scarcer than expected, a sign of tidal heating from its slightly oval orbit (Sing et al. 2024; Welbanks et al. 2024).",
    star: { name: "WASP-107", Teff: 4425, Rs: 0.657, M: 0.683 }, a: 0.055, Rp: 10.48, Mp: 33, P: 5.7215, locked: true, siblings: [], system: [{ name: "WASP-107b", a: 0.055, R: 10.48 }],
    scenarios: [{ name: "Above the haze", verdict: "Composition measured", ground: "clouds", deck: "silicate", theta: 50, lat: 10, atm: { P: 0.1, gas: "H₂" }, T: 740, weather: "none", base: 1,
      layers: [[1, "#8a8070", "hazy H₂/He with SO₂"], [0.7, "#6a6458", "hot, deep envelope"], [0.2, "#5a4a3a", "small core (~10 M⊕)"]],
      wx: "Tidal heating keeps the deep atmosphere hot, stirring up gas from below. Silicate clouds and photochemical haze are both seen.", life: "No." }],
    gasGiant: true,
  },
  {
    id: "bpic", name: "β Pictoris b", age: 0.02, sub: "A young giant photographed directly, 10 AU from a bright A-type star. It glows from the heat of its own formation, and its 8.7-hour spin has been measured.",
    star: { name: "β Pictoris", Teff: 8039, Rs: 1.544, M: 1.789 }, a: 10.07, Rp: 18.5, Mp: 2765, P: 8682, locked: false, siblings: [], system: [{ name: "β Pictoris b", a: 10.07, R: 18.5 }, { name: "β Pictoris c", a: 2.7, R: 13, note: "≈ 8 M♃, size assumed" }],
    scenarios: [{ name: "Above the glowing clouds", verdict: "Directly imaged", ground: "clouds", deck: "silicate", theta: 60, lat: 0, atm: { P: 0.1, gas: "H₂" }, temp: ["about 1,650 K (internal heat)", 0], T: 1650, weather: "none", base: 1,
      layers: [[1, "#8a4a30", "silicate and iron clouds"], [0.9, "#6a6458", "hot H₂/He"], [0.3, "#5a4a3a", "core (unknown)"]],
      wx: "Starlight barely matters out here; the planet's own heat lights its clouds a deep red. Days last under nine hours.", life: "No." }],
    gasGiant: true,
  },
  {
    id: "lhs3844", name: "LHS 3844b", age: 7.8, sub: "A hot super-Earth with an 11-hour year. Spitzer saw a hot day side and a cold night side: no thick atmosphere carries the heat around. JWST's mid-infrared spectrum shows a dark, featureless surface like basalt or the Moon's maria, with no granite-like crust and no sign of active volcanoes (Zieba et al. 2026).",
    star: { name: "LHS 3844", Teff: 3080, Rs: 0.189, M: 0.151 }, a: 0.00624, Rp: 1.286, Mp: 2.37, P: 0.4629, locked: true, siblings: [], system: [{ name: "LHS 3844b", a: 0.00624, R: 1.286 }],
    scenarios: [{ name: "Bare dark rock", verdict: "No atmosphere (Spitzer)", ground: "rock", theta: 50, lat: 10, atm: null, weather: "none", base: 1,
      tempNote: "Spitzer measured a 1,040 K day side and almost nothing from the night side: bare rock with a dark, basalt-like surface (Kreidberg et al. 2019).",
      layers: L_ROCK, wx: "No air at all. The surface is probably dark basaltic rock, like the Moon's maria or Mercury.", life: "No." }],
  },
  {
    id: "t270d", name: "TOI-270d", age: 5, sub: "A temperate sub-Neptune above the radius valley. JWST found methane, carbon dioxide and water in a hydrogen-rich but metal-rich atmosphere.",
    star: { name: "TOI-270", Teff: 3506, Rs: 0.38, M: 0.386 }, a: 0.0721, Rp: 2.0, Mp: 4.2, P: 11.382, locked: true,
    siblings: [{ name: "TOI-270b", a: 0.03197, R: 1.28 }, { name: "TOI-270c", a: 0.04526, R: 2.33 }],
    system: [{ name: "TOI-270b", a: 0.03197, R: 1.28, note: "below the valley: rocky" }, { name: "TOI-270c", a: 0.04526, R: 2.33 }, { name: "TOI-270d", a: 0.0721, R: 2.0 }],
    scenarios: [
      { name: "Above a metal-rich haze", verdict: "Consistent", ground: "clouds", deck: "silicate", theta: 50, lat: 10, atm: { P: 0.1, gas: "H₂" }, T: 380, weather: "none", base: 1,
        layers: [[1, "#a39b8c", "H₂ mixed with CO₂, CH₄, H₂O"], [0.75, "#8a7b70", "dense, miscible envelope"], [0.5, "#7a5a43", "rock + iron"]],
        wx: "One reading: no clear boundary between gas and ocean, but a hot, dense mix of hydrogen and water all the way down (Benneke et al. 2024).", life: "Not at any surface." },
      { name: "Hycean ocean", verdict: "Contested: one reading of its JWST spectrum allows an ocean under hydrogen air (Holmberg & Madhusudhan 2024); another finds a deep, mixed metal-rich envelope with no ocean (Benneke et al. 2024)", ground: "ocean", land: -1, theta: 50, lat: 10, atm: { P: 5, gas: "H₂" }, T: 300, weather: "rain", clouds: 0.6, base: 2,
        layers: [[1, "#7d8fa8", "thin H₂ atmosphere"], [0.93, "#2b6aa3", "liquid water ocean"], [0.85, "#8fc3d9", "high-pressure ice"], [0.6, "#7a5a43", "rock"]],
        wx: "Rain under a thick, warm sky.", life: "Possible only if the ocean exists." },
    ],
  },
  {
    id: "k218", name: "K2-18b", age: 3, sub: "A sub-Neptune in the habitable zone, made famous by a debated claim of a biosignature gas. Methane is detected; the rest is argued over. Independent reanalyses find no significant sign of the claimed biosignature gases DMS and DMDS (Luque et al. 2025; Schmidt et al. 2025).",
    star: { name: "K2-18", Teff: 3457, Rs: 0.411, M: 0.359 }, a: 0.1429, Rp: 2.61, Mp: 8.63, P: 32.94, locked: true, siblings: [], system: [{ name: "K2-18b", a: 0.1429, R: 2.61 }],
    scenarios: [
      { name: "Above the hydrogen haze", verdict: "Consistent", ground: "clouds", deck: "silicate", theta: 50, lat: 10, atm: { P: 0.1, gas: "H₂" }, T: 284, weather: "none", base: 1,
        layers: [[1, "#7d8fa8", "H₂/He envelope, no surface"], [0.72, "#8a7b70", "hot, dense H₂ + H₂O"], [0.52, "#7a5a43", "rock + iron core"]],
        wx: "A gas-rich mini-Neptune: hazy hydrogen sky, no ground (Wogan et al. 2024).", life: "No surface." },
      { name: "Hycean ocean", verdict: "Contested: a water ocean under thin hydrogen air fits the JWST spectrum only on some readings; others need no ocean (Madhusudhan et al. 2023; Shorttle et al. 2024; Wogan et al. 2024)", ground: "ocean", land: -1, theta: 50, lat: 10, atm: { P: 5, gas: "H₂" }, T: 300, weather: "rain", clouds: 0.6, base: 2,
        layers: [[1, "#7d8fa8", "H₂-rich atmosphere"], [0.93, "#2b6aa3", "liquid water ocean"], [0.84, "#8fc3d9", "high-pressure ice"], [0.58, "#7a5a43", "rock + iron"]],
        wx: "If the ocean exists (Madhusudhan 2023): warm water under a hydrogen sky. Independent analyses do not require it.", life: "Claimed biosignature not confirmed." },
    ],
  },
];
// LHS 1140 b: JWST's tentative nitrogen-rich air makes the eyeball ocean the favoured reading, so it comes first
{ const w = WORLDS.find(x => x.id === "l1140"), i = w.scenarios.findIndex(x => x.name === "Eyeball ocean"); if (i > 0) w.scenarios.unshift(w.scenarios.splice(i, 1)[0]); }
