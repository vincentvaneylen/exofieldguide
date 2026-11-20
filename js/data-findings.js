// Findings: what papers have measured about individual planets. A finding overrides the general rules (scene-recipe.js, physics-worlds-auto.js):
// where a rule would guess (an imagined volcano, a rock colour, a cloud deck), the measured result wins, and the recipe shows it as a measured
// rule with its source. Keys: the planet's name in lower case without spaces or hyphens (as SPOT); either the guide's name or the archive's.
// Fields: Tday (measured day-side temperature, K), volc (false: no volcanism seen), rock (a MAT surface), worlds (extra possible worlds the papers describe; lead: true puts one first), t (the finding), src.
const FINDINGS = {
  toi1444b: { src: "Coy et al. 2026 (TESS phase curve)", t: "TESS sees it reflecting much more light than hot Jupiters of the same temperature, like other lava worlds: reflective silicate clouds probably cool its day side" },
  toi1347b: { src: "Rubenzahl et al. 2024", t: "Dense for its size (1.8 Earth radii, 11 Earth masses): Earth-like rock and iron, with any hydrogen envelope ruled out; a tentative TESS phase curve could mean a heavy, outgassed atmosphere" },
  toi1235b: { src: "Krishnamurthy et al. 2023 (Subaru)", t: "No escaping helium: no extended hydrogen atmosphere" },
  hip94235b: { src: "Morrissey et al. 2024, 2025 (Hubble, VLT CRIRES+)", t: "Despite its youth (120 Myr), neither escaping helium nor escaping hydrogen is seen, and no water in its spectrum" },
  toi1634b: { src: "Kawauchi et al. 2026 (Subaru)", t: "No escaping helium detected" },
  lhs3844b: { Tday: 1040, TdaySrc: "Kreidberg et al. 2019", volc: false, rock: "weatheredBasalt", src: "Zieba et al. 2026 (JWST MIRI)",
    t: "A dark, featureless day-side spectrum: basalt- or mantle-like rock, no granite-like crust, and no SO₂, so no active volcanism; an old surface weathered by space, like the Moon's maria or Mercury" },
  trappist1b: { Tday: 490, rock: "ultramafic", src: "Gillon et al. 2025 (JWST phase curve)",
    t: "A 490 K day side, no heat reaching the night side and no hot-spot offset: airless, with fresh, dark ultramafic rock favoured over other surfaces" },
  "55cancrie": { src: "Patel et al. 2024 (JWST NIRCam); Hu et al. 2024",
    t: "The day side's glow changes from week to week, from no signal to a clear one: some visits fit a CO/CO₂ atmosphere, others rock vapour only",
    worlds: [{ like: "lava", name: "Magma ocean after its air has gone", atm: null, base: 1, weather: "sparks",
      verdict: "Seen on some JWST visits: the day side brightens and dims week to week, as if its air comes and goes (Patel et al. 2024)",
      wx: "Between outbursts the magma lies under at most a thin veil of rock vapour: a black sky over a glowing sea." }] },
  pimenc: { src: "García Muñoz et al. 2020, 2021 (HST)",
    t: "Hubble saw no escaping hydrogen, which hydrogen-rich air should show, but did see ionised carbon streaming away (3.4σ): a thick atmosphere at least half made of heavy molecules such as water, not necessarily carbon-rich",
    worlds: [{ like: "clouds", lead: true, name: "Above the steam of a water world", deck: "waterCloud", deckB: "waterCloud", atm: { P: 1, gas: "H₂O", dust: 0.3 },
      layers: [[1, "#d6dde2", "deep steam atmosphere"], [0.85, "#8fc3d9", "supercritical water"], [0.6, "#7a5a43", "rock + iron"]],
      verdict: "Favoured: no escaping hydrogen, so heavy air such as steam (HST, García Muñoz et al. 2020, 2021)",
      wx: "Too hot for a surface ocean: water-rich air this hot is a deep steam atmosphere over supercritical water.", life: "No surface ocean." }] },
  k2141b: { Tday: 2049, src: "Zieba et al. 2022 (Spitzer and K2 phase curves)", t: "A day side of about 2,050 K (give or take 360 K) and a night side too cold to detect: no thick atmosphere carries heat round, and a thin rock-vapour atmosphere fits slightly better than bare rock" },
  hd3167b: { Tday: 1300, src: "Coy et al. 2026 (JWST MIRI)", t: "A day side of about 1,300 K, barely half what bare dark rock would reach: an atmosphere is reflecting light or carrying heat to the night side" },
  // added by the deep literature pass (B1, November 2026): day-side temperatures measured from each planet's own glow, read from the papers' arXiv records
  toi431b: { Tday: 1967, src: "Smith et al. 2026 (JWST MIRI)", t: "A day side of about 1,970 K, cooler than bare dark rock would be here, as Spitzer had already found (Monaghan et al. 2025): it may have an atmosphere" },
  toi1468b: { Tday: 1024, src: "Meier Valdés et al. 2025 (JWST MIRI)", t: "A day side of about 1,020 K, as hot as dark bare rock: an atmosphere of carbon dioxide or steam thicker than 1 bar is ruled out" },
  lhs1140c: { Tday: 595, src: "Rochon et al. 2025 (JWST MIRI)", t: "A day side of about 595 K, as hot as bare rock: no sign of an atmosphere" },
  gj357b: { src: "Zgraggen et al. 2026 (JWST MIRI)", t: "At a wavelength of 15 µm its day side glows like a body at about 920 K, well above the 690 K that bare dark rock could reach here: not yet explained" },
  gj3929b: { Tday: 641, src: "Connors et al. 2026 (JWST MIRI)" },
  ltt3780b: { Tday: 1143, src: "Allen et al. 2025 (JWST MIRI)" },
  gj1252b: { Tday: 1410, src: "Crossfield et al. 2022 (Spitzer)" },
  toi2431b: { bareLimit: true, src: "Zieba et al. 2026 (HST)", t: "Hubble and TESS eclipses: a day side at the hottest a bare, dark rock can be, with no heat reaching the night side" },
};
const fKey = n => (n || "").toLowerCase().replace(/[\s\-'’]/g, "");
function findingsOf(w) { return FINDINGS[fKey(w.name)] || (typeof archName === "function" ? FINDINGS[fKey(archName(w))] : null) || null; }
