// What each planet is like, in plain words: one generated sentence for every planet, from its size, orbit, starlight and star, and for the
// well-known ones a note on what makes them notable, with the paper it comes from.

// notable planets (keys: the name in lower case without spaces or hyphens). Planets drawn by hand keep their own descriptions
const NOTES = {
  k2141b: "One of the hottest rocky planets known, circling its star every 6.7 hours. Its day side is probably a magma ocean, and rock vapour may blow toward a frozen night side (Zieba et al. 2022).",
  lhs3844b: "Spitzer measured a hot day side and an ice-cold night side, with no heat carried between them: a bare, dark rock without a thick atmosphere (Kreidberg et al. 2019).",
  gj1252b: "Its day side, measured at about 1,400 K, is too hot for the planet to have kept a thick atmosphere (Crossfield et al. 2022).",
  trappist1c: "JWST measured its day side at about 380 K, which rules out a thick, Venus-like CO₂ atmosphere (Zieba et al. 2023).",
  trappist1d: "JWST found no sign of a thick, Earth-like atmosphere in its spectrum (Piaulet-Ghorayeb et al. 2025).",
  trappist1f: "One of three TRAPPIST-1 planets in the habitable zone. All seven of the system's Earth-sized planets orbit closer to their star than Mercury does to the Sun.",
  trappist1g: "The largest of the seven TRAPPIST-1 planets, near the outer edge of the habitable zone.",
  trappist1h: "The smallest and outermost of the seven TRAPPIST-1 planets, probably too cold for liquid water at its surface.",
  toi270d: "JWST found methane, CO₂ and water vapour. It has been read both as a hycean world and as a planet with a hot, metal-rich mixed envelope (Holmberg & Madhusudhan 2024; Benneke et al. 2024).",
  gj9827d: "JWST found an atmosphere rich in water vapour, making it a candidate 'steam world' (Piaulet-Ghorayeb et al. 2024).",
  gj3470b: "A warm Neptune losing its atmosphere: helium escaping into space has been detected around it (Ninan et al. 2020; Pallé et al. 2020).",
  gj436b: "A warm Neptune trailing a giant, comet-like cloud of hydrogen that escapes from its atmosphere (Ehrenreich et al. 2015).",
  ltt9779b: "An ultra-hot Neptune in the 'hot-Neptune desert', where few such planets survive. Its day side reflects about 80% of the starlight, probably from metallic clouds (Hoyer et al. 2023).",
  hatp11b: "A warm Neptune on a tilted, eccentric orbit, and the first Neptune-size planet with water vapour detected in its air (Fraine et al. 2014).",
  epsindab: "A cold giant 12 light years away, photographed by JWST in 2024: at about 275 K, one of the coldest planets ever imaged (Matthews et al. 2024).",
  wasp80b: "JWST detected methane in this warm Jupiter's atmosphere (Bell et al. 2023).",
  hd80606b: "On one of the most eccentric orbits known: at closest approach it heats from about 800 K to over 1,400 K within hours (Laughlin et al. 2009).",
  wasp43b: "JWST mapped the whole planet: clouds on the night side, and winds carrying heat from day to night (Bell et al. 2024).",
  kelt9b: "The hottest planet known. Its day side reaches about 4,600 K, hotter than many stars, and its molecules are broken apart (Gaudi et al. 2017).",
  wasp76b: "Iron may evaporate on its day side and condense on the night side as 'iron rain' (Ehrenreich et al. 2020), though a hotter evening limb could explain the same signal (Savel et al. 2022).",
  wasp18b: "About ten times Jupiter's mass, on a 23-hour orbit. JWST mapped its day side and found water vapour (Coulombe et al. 2023).",
  wasp12b: "Its orbit is shrinking: it is spiralling into its star and may be destroyed within a few million years (Yee et al. 2020).",
  wasp17b: "JWST found quartz (silica) crystals in its high clouds (Grant et al. 2023).",
  wasp96b: "JWST's first published exoplanet spectrum (2022) showed clear signs of water vapour (Radica et al. 2023).",
  tres2b: "One of the darkest planets known, reflecting less than 1% of the light that falls on it (Kipping & Spiegel 2011).",
  hd149026b: "Small for a Saturn-mass giant, which implies an unusually large core of heavy elements (Sato et al. 2005).",
  kepler7b: "The first exoplanet with a map of its clouds, which are brightest on its western half (Demory et al. 2013).",
  hr8799b: "One of four giant planets photographed around a young star (Marois et al. 2008, 2010).",
  hr8799c: "One of four giant planets photographed around a young star (Marois et al. 2008, 2010).",
  hr8799d: "One of four giant planets photographed around a young star (Marois et al. 2008, 2010).",
  hr8799e: "One of four giant planets photographed around a young star, and the first exoplanet observed with optical interferometry (GRAVITY Collaboration 2019).",
  "51erib": "A young giant photographed by the Gemini Planet Imager, with methane in its atmosphere (Macintosh et al. 2015).",
  aflepb: "A young giant found in 2023 by direct imaging, guided by the star's wobble as measured by the Hipparcos and Gaia satellites (Franson et al. 2023; De Rosa et al. 2023).",
  "2massj120733463932539b": "The first exoplanet ever photographed (2004), orbiting a young brown dwarf (Chauvin et al. 2004).",
  pds70b: "Still forming: photographed inside the gap it is clearing in its star's disc of gas and dust (Keppler et al. 2018).",
  pds70c: "Still forming, and surrounded by its own disc of dust, where moons could form (Benisty et al. 2021).",
  kepler51b: "A 'super-puff': about Saturn's size but only a few Earth masses, as low in density as candyfloss (Masuda 2014; Libby-Roberts et al. 2020).",
  kepler51c: "A 'super-puff': about Saturn's size but only a few Earth masses, as low in density as candyfloss (Masuda 2014; Libby-Roberts et al. 2020).",
  kepler51d: "A 'super-puff': about Saturn's size but only a few Earth masses, as low in density as candyfloss (Masuda 2014; Libby-Roberts et al. 2020).",
  wasp193b: "One of the least dense planets known: half as wide again as Jupiter, with about a seventh of its mass (Barkaoui et al. 2024).",
  "wd1856+534b": "A giant planet orbiting a white dwarf every 1.4 days: it survived, or arrived after, the death of its star (Vanderburg et al. 2020).",
  kepler1520b: "A disintegrating planet: a tail of dust boiling off its surface makes every transit look different (Rappaport et al. 2012).",
  toi700d: "An Earth-sized planet in its red dwarf's habitable zone, found by TESS (Gilbert et al. 2020).",
  toi700e: "Slightly smaller than Earth, in the optimistic habitable zone of its red dwarf (Gilbert et al. 2023).",
  kepler62f: "A super-Earth about 1.4 times Earth's size in the habitable zone of an orange dwarf (Borucki et al. 2013). A candidate water world; its mass is unmeasured, and climate models need 1.6–5 bar of CO₂ to keep its surface above freezing (Kaltenegger et al. 2013; Shields et al. 2016).",
  kepler442b: "One of the most Earth-like planets known by size and starlight: about 1.3 times Earth's size, receiving about 70% of Earth's light from an orange dwarf (Torres et al. 2015). Its mass is unmeasured: at this size it has about a 60% chance of being rocky.",
  kepler22b: "The first Kepler planet found in a habitable zone (2011). At 2.4 times Earth's size it is probably not rocky (Borucki et al. 2012).",
  kepler1649c: "Earth-sized and receiving about 75% of Earth's light, found by re-examining Kepler data (Vanderburg et al. 2020).",
  "51pegb": "The first planet found around a Sun-like star (Mayor & Queloz 1995), a discovery recognised by the 2019 Nobel Prize in Physics.",
  teegardensstarb: "One of the most Earth-like planets known by mass and starlight, around a small red dwarf 12.5 light years away (Zechmeister et al. 2019).",
  ross128b: "A temperate planet around a quiet red dwarf 11 light years away (Bonfils et al. 2018).",
  gj367b: "An 8-hour year, and dense enough to be mostly iron (Lam et al. 2021; Goffo et al. 2023).",
  corot7b: "The first rocky exoplanet with a measured size (Léger et al. 2009).",
  kepler78b: "Earth-sized with an 8.5-hour year; its measured mass shows it is rocky like Earth (Howard et al. 2013; Pepe et al. 2013).",
  toi849b: "Possibly the exposed core of a giant planet: Neptune's size but about 40 Earth masses, with almost no gas (Armstrong et al. 2020).",
  lhs475b: "The first rocky exoplanet confirmed with JWST (Lustig-Yaeger et al. 2023).",
  toi1452b: "Its density leaves room for up to about 30% water by mass: a possible water world (Cadieux et al. 2022).",
  kepler138d: "Its low density suggests a large fraction of water (Piaulet et al. 2023).",
  lp79118d: "Tides raised by a sibling planet may heat its interior and make it volcanic (Peterson et al. 2023).",
  barnardb: "A small planet around Barnard's Star, the nearest single star to the Sun (González Hernández et al. 2024).",
  toi561b: "An 11-hour year around a star twice the Sun's age. JWST found its day side far cooler than bare rock: a thick, volatile-rich atmosphere over a magma ocean (Teske et al. 2025).",
  l9859b: "Smaller than Earth, and perhaps volcanic: JWST hints at sulfur dioxide in its air, a sign of an atmosphere fed by eruptions (3.6σ, Bello-Arufe et al. 2025).",
  gj1132b: "JWST's transmission and emission data point to bare rock, or at most the thinnest air (2025).",
  gj486b: "Its first JWST spectrum hinted at water vapour, but later emission data favour bare rock or thin air; the hint was probably starspots (2025).",
  ltt1445ab: "JWST's measurement of its heat rules out a very thick CO₂ atmosphere (Wachiraphan et al. 2025).",
  wasp127b: "Winds of about 33,000 km/h, the fastest measured on any planet (VLT CRIRES+, Nortmann et al. 2025)."
};
const noteKey = n => n.toLowerCase().replace(/[\s\-'’]/g, "");
// one sentence anyone can follow: what kind of planet, how big, how long its year, how much starlight, and what its sun looks like
function likeLine(w) {
  const c = categorize(w), R = w.Rp || 1, P = w.P, T = w.Teq, Teff = w.star.Teff;
  const size = R >= 6 ? (R / 11.21 > 0.92 && R / 11.21 < 1.08 ? "about the size of Jupiter" : `${(R / 11.21).toFixed(1)} times the size of Jupiter`) : R > 0.9 && R < 1.1 ? "about the size of Earth" : `${R.toFixed(1)} times the size of Earth`;
  const year = P < 2 ? `a year of ${Math.round(P * 24)} hours` : P < 700 ? `a year of ${Math.round(P)} days` : `a year of ${(P / 365.25).toFixed(1)} Earth years`;
  const light = w.S > 3 ? `${Math.round(w.S).toLocaleString("en")} times the starlight Earth gets` : w.S > 0.93 && w.S < 1.07 ? "about the same starlight as Earth" : w.S > 0.1 ? `${w.S.toFixed(1)} times the starlight Earth gets` : w.S > 1e-4 ? `${+(w.S * 100).toPrecision(1)}% of the starlight Earth gets` : "almost no starlight";
  const feel = T > 1500 ? ", hot enough to glow" : T > 380 ? ", far too hot for liquid water" : T < 150 ? ", deep-frozen" : "";   // equilibrium temperature: no albedo, heat spread evenly
  const kind = isWhiteDwarf(w.star) ? "white dwarf" : isBrownDwarf(w.star) ? "brown dwarf" : Teff < 3900 ? "red dwarf" : Teff < 5300 ? "orange star" : Teff < 6000 ? "yellow star" : Teff < 7500 ? "white star" : "blue-white star";
  const k = w.angDeg / 0.53, look = k > 1.6 ? `would look ${k.toFixed(k < 10 ? 1 : 0)} times wider than the Sun does from Earth` : k < 0.6 ? `would look ${k < 0.1 ? "like a brilliant point" : `${(1 / k).toFixed(1)} times smaller than the Sun does from Earth`}` : "would look about as big as the Sun does from Earth";
  const n = c.subName.replace(/^./, x => x.toLowerCase()).replace(/ rocky$/, " rocky planet").replace(/^airless or scorched rock$/, "scorched rocky planet").replace(/^cold rocky: icy or desert$/, "cold rocky planet");
  const giantLike = isGiantScene(w.scenarios[0] || {});
  return `${/^[aeiou]/.test(n) ? "An" : "A"} ${n}, ${size}, with ${year} and ${light}. ${giantLike ? `That light heats its upper air to about ${Math.round(T - 273)} °C${feel}.` : `With no air to trap heat, that light alone would hold it near ${Math.round(T - 273)} °C${feel}.`}${w.locked ? " It probably always turns the same face to its star." : ""} Its ${kind} ${look}.`;
}
function describe(w) { const n = !w.sub || /Generated from catalogue values only/.test(w.sub) ? NOTES[noteKey(w.name)] : null; return { like: likeLine(w), note: n }; }

// ---- layered descriptions. Layer 1, above the picture: one sentence on what the planet is. Layer 2, under it: what you are looking at,
// rewritten whenever the scenario, viewpoint, heading or dial changes. Layer 3 is the folded detail (facts, category, rules, technical notes)
function hookLine(w) {
  const sents = t => t.split(/(?<=[.)])\s+(?=[A-Z])/);
  let base;
  if (w.sub && !/Generated from catalogue values only\.$/.test(w.sub) && !w.catalogue) base = sents(w.sub).slice(0, 2).join(" ");   // hand-drawn planets: their own words
  else if (w.sub && w.auto && !/^\d/.test(w.sub)) base = sents(w.sub)[0];
  else base = NOTES[noteKey(w.name)] || genHook(w);
  return base + vivid(w, base);
}
// a natural first sentence from the numbers, for planets nobody has written about
function genHook(w) {
  const c = categorize(w), R = w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, P = w.P;
  const size = R > 8 ? (R / 11.21 > 0.85 && R / 11.21 < 1.15 ? "about Jupiter's size" : `${(R / 11.21).toFixed(1)} times Jupiter's size`) : R > 0.9 && R < 1.1 ? "about Earth's size" : `${R.toFixed(1)} times Earth's size`;
  const year = P < 2 ? `${Math.round(P * 24)}-hour year` : P < 700 ? `${Math.round(P)}-day year` : `${(P / 365.25).toFixed(0)}-year orbit`;
  const light = w.S > 1.4 ? `${w.S > 10 ? Math.round(w.S).toLocaleString("en") : w.S.toFixed(1)} times Earth's starlight` : w.S > 0.7 ? "about Earth's starlight" : w.S > 0.01 ? `${Math.round(w.S * 100)}% of Earth's starlight` : "only a glimmer of starlight";
  const n = c.subName.replace(/^./, x => x.toLowerCase()).replace(/^temperate rocky$/, "temperate rocky planet").replace(/^airless or scorched rock$/, "scorched rocky planet").replace(/^cold rocky: icy or desert$/, "cold rocky planet").replace(/^lava world$/, "lava world");
  return `${/^[aeiou]/.test(n) ? "An" : "A"} ${n}, ${size}, with a ${year} and ${light}.`;
}
// one striking fact about the view from there, if the sentence above doesn't already give it
function vivid(w, said) {
  const k = w.angDeg / 0.533;
  if (k > 6 && !/star (would )?(look|fill)|wider than/.test(said)) return ` From there its star would look ${Math.round(k)} times wider than our Sun, filling ${k > 30 ? "a large part of the sky" : "a broad patch of sky"}.`;
  if (w.locked && !/face|locked/.test(said) && w.Teq < 700) return " One side always faces its star, so the sky never changes.";
  if (w.Teq < 120 && !/cold|frozen|ice/i.test(said)) return ` Starlight alone would leave it near ${Math.round(w.Teq - 273)} °C.`;
  return "";
}
// what a scenario's verdict means, in a few plain words, and a one-word tag for its button
// hedged wording is matched first, so "Not yet excluded by JWST" or "Tentative: JWST hints …" never count as measured; anything unmatched
// falls back on the scenario's own data level (base: 0–1 observed, 2 scenario, 3 imagined)
// Every world carries one of five statuses, strongest first: measured, favoured, allowed, disfavoured, untested; "contested" is a flag that
// can sit on any of them. A world may set sc.status itself; otherwise the status is read from its verdict's opening words (hedged wording
// first, so "Not yet excluded" or "Tentative: …" never count as measured). A giant's modelled world counts as measured when measurements of
// that planet (temperatures, cloud colour, spin, hot spot) set what is drawn.
const STATUSES = ["measured", "favoured", "allowed", "disfavoured", "untested"];
const VERDICTS = [[/Speculative/, "disfavoured", "it needs special conditions"],
  [/Unlikely|Below the cosmic/, "disfavoured", "the rules make it unlikely"], [/^Less favoured/, "disfavoured", "the measurements favour another world"], [/Untested|Not yet/, "untested", "no measurement tests it yet"],
  [/Tentative/, "favoured", "early hints point to it"], [/Favoured/, "favoured", "the data favour it"],
  [/Allowed|Consistent|Possible|allows|Optimistic/, "allowed", "the data allow it"],
  [/measured|detected|Measured|Phase curve|imaged|seen|No atmosphere|No thick atmosphere|Spitzer|JWST|HST|CHEOPS/, "measured", "measurements support it"],
  [/Model/, "model", ""]];
const MEAS_KEYS = ["Tday", "Tnight", "Tint", "deck", "rotH", "hotOff", "scale", "bright", "westClouds"];
function measuredFor(w) {   // does a measurement of this planet set part of what its first world shows?
  if (!w || typeof GIANT === "undefined") return false;
  const m = GIANT.MEAS[w.name] || GIANT.MEAS[archName(w)], F = typeof findingsOf === "function" ? findingsOf(w) : null;
  return m && MEAS_KEYS.some(k => m[k] != null) || F && F.Tday ? 2 : m && m.text ? 1 : 0;
}
function verdictOf(v, base, w, sc) {
  const t = v || "", contested = /Contested|disput/.test(t);
  // a contested world takes its status only from words that open its verdict ("Contested: favoured by …"); otherwise it is allowed
  const rest = t.replace(/^Contested:?\s*/, "");
  let hit = contested ? (/^(Favoured|Tentative|Unlikely|Speculative|Less favoured)/i.test(rest) ? VERDICTS.find(([re]) => re.test(rest.replace(/^./, c => c.toUpperCase()))) : null) : VERDICTS.find(([re]) => re.test(t));
  if (hit && hit[1] === "model") hit = w && sc && (w.scenarios[0] === sc || w.scenarios[0].name === sc.name) && isGiantScene(sc) && measuredFor(w) ? [null, "measured", measuredFor(w) === 2 ? "measurements of this planet set its temperatures or colours; the rest follows a model" : "telescopes have studied its air, which confirms this kind of world; its colours follow a model"] : [null, "untested", "it follows a model; no measurement tests it yet"];
  if (!hit) hit = contested ? [null, "allowed", ""] : base != null && base <= 1 ? [null, "measured", "it rests on observations of this planet"] : base === 3 ? [null, "untested", "it is imagined"] : [null, "untested", "no measurement tests it yet"];
  return contested ? [hit[0], hit[1] + " · contested", "the literature disputes it"] : hit;
}
// the reason part of a verdict, without its opening status words ("Allowed: …", "Model · …", "Contested: …")
const verdictRest = v => (v || "").replace(/^(Contested|Measured|Favoured( by [^:]*)?|Allowed|Tentative|Speculative|Unlikely|Untested|Less favoured( by the measurements)?|Possible|Consistent|Model)\b\s*[:·,]?\s*/i, "").replace(/^(Possible|Consistent)\b\s*[:·,]?\s*/i, "");
// the reason shown beside a world's label: the verdict's own reason, or for modelled worlds what the model expects (or why it counts as measured)
function reasonOf(w, s) {
  const v = verdictOf(s.verdict, s.base, w, s);
  if (/^Model/.test(s.verdict || "")) return v[1] === "measured" ? v[2] : (t => t ? "models expect " + t.replace(/^./, c => c.toLowerCase()) : v[2])(verdictRest(s.verdict));
  return verdictRest(s.verdict) || (v[1] === "untested" ? "" : v[2]);
}
function hereText(w, sc) {   // a short paragraph under the picture, in full sentences: where you are, which world this is, and what the dial has added
  const sc0 = w.scenarios[si], canLife = sc0.ground === "ocean" && !sc0.noPlants && !!sc0.atm, sol = SOLAR.includes(w);
  const why = ` <a href="#recipesec" class="quiet">Why it looks like this →</a>`;
  const verdict = sol ? "" : ` ${verdictOf(sc.verdict, sc.base, w, sc)[2].replace(/^./, c => c.toUpperCase())}.`;
  if (zoom === 0) return `You are looking at the whole ${w.star.name} system, with every orbit, star and planet to scale. ${w.system.length > 1 ? "The other planets are grey because nobody knows what their surfaces look like. " : ""}Click ${dispName(w)}, or press +, to fly closer.`;
  if (zoom === 1) return sc.moon ? `This is ${dispName(w)} as a whole globe. In this scenario you stand on an imagined moon of it, the small dot ringed in orange: no moon of an exoplanet has been found yet.${why}`
    : `This is ${dispName(w)} as a whole globe, lit by its star and coloured as the “${sc.name.toLowerCase()}” scenario would make it.${verdict} The orange ring marks where you will stand.${sc.layers ? " Tick Cutaway to see inside." : ""}${why}`;
  const es = Math.round(lighting(w, sc).es), gas = sc.ground === "clouds", lk = w.locked && !(sc.land === 1 && !sc.term);
  const where = sc.moon ? `You are standing on an imagined moon of ${dispName(w)}, which hangs in the sky 11° wide.`
    : gas ? `You are floating above the cloud tops of ${dispName(w)}: there is no ground to stand on.`
    : lk ? (es > 78 ? "You are standing right under the star, which stays overhead for ever." : es < -3 ? "You are on the night side, where the star never rises." : es < 8 ? "You are on the terminator, where the star sits on the horizon for ever." : `You are on the day side, where the star hangs ${es}° above the horizon and never moves.`)
    : sol ? `The star is ${es}° above the horizon.` : `The star is ${es}° above the horizon. Nobody knows how fast ${dispName(w)} spins, so this time of day is a choice.`;
  const air = sc.atm ? `${sc.atm.P >= 0.1 ? sc.atm.P + " bar of " : "a thin "}${sc.atm.gas}${sc.atm.P >= 0.1 ? "" : " atmosphere"}` : "no air";
  const world = sol ? `This is the real ${dispName(w)}, rebuilt from its size, mass and orbit to check that the rules work.`
    : `This view shows the “${sc.name.toLowerCase()}” scenario: ${air}${sc.Tstand && !gas ? `, about ${Math.round(sc.Tstand - 273)} °C here` : ""}.${verdict}`;
  const shown = ["Only measured things are drawn; the rest is left grey.", "On top of the measurements, physics works out the star's true colour and size, the temperature and the gravity; the ground is left grey.", "The air, weather and ground come from the scenario; nothing is invented beyond that.", "The exact shapes of the hills, rocks and clouds are imagined."][dial]
    + (dial === 3 && canLife && life ? ["", " So are the microbial mats on the shore.", " So are the plants.", " So are the plants, shaped by this planet's light and gravity.", " So are the plants and animals; animals assume oxygen-rich air."][life] : "");
  return `${where} ${world} ${shown}${zoom === 3 ? " You are looking through binoculars, about 3.5 times closer." : ""}${why}`;
}
