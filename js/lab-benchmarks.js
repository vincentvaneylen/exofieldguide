// Prototype benchmarks (v1): the best-studied planets of each category, with what observations say about them.
// Each test compares something the guide derives with a published value or classification. "from memory" marks values
// not re-opened while building v1: they must be verified against the paper before an expert review.
// Test kinds: cat (category or subtype), flag (a special-case flag), tday / tnight / tint (temperatures, K, ± tolerance),
// rockday (dayside of a bare rock with no heat transport and no albedo, compared with a measured dayside), alt (an alternative
// scenario that must be offered), first (the ground of the first scenario), meas (a measured property the guide must carry).
const BENCH = [   // ok: true = value and source checked in the v1.0 review (29 Oct 2026); false = still to verify
  // lava worlds
  { p: "55 Cancri e", cat: "rocky/lava", tests: [["first", "lava"]], ok: true, ref: "Hu et al. 2024: volatile CO₂/CO atmosphere over a magma ocean; a thin rock-vapour veil is ruled out" },
  { p: "K2-141 b", cat: "rocky/lava", tests: [["first", "lava"], ["rockday", 2049, 0.2]], ok: true, ref: "Zieba et al. 2022: dayside 2,049 ± 360 K, night side near zero; a tenuous rock-vapour atmosphere is possible" },
  { p: "Kepler-10b", cat: "rocky/lava", tests: [["first", "lava"]], ok: true, ref: "Batalha et al. 2011: the first rocky planet found by Kepler, on a 0.84-day orbit" },
  // airless rocky: measured daysides near the bare-rock limit
  { p: "LHS 3844b", cat: "rocky/airless", tests: [["rockday", 1040, 0.1]], ok: true, ref: "Kreidberg et al. 2019: dayside 1,040 ± 40 K; no atmosphere above 10 bar; Bond albedo < 0.2" },
  { p: "TRAPPIST-1b", cat: "rocky/airless", tests: [["rockday", 503, 0.12]], ok: true, ref: "Greene et al. 2023: 503 ± 27 K at 15 µm; Ducrot et al. 2024: 478 ± 27 K" },
  { p: "GJ 1252 b", cat: "rocky/airless", tests: [["rockday", 1410, 0.12]], ok: true, ref: "Crossfield et al. 2022: about 1,410 K at 4.5 µm; surface pressure ≲ 10 bar" },
  // Venus-like and thin-air cases
  { p: "Venus", cat: "rocky/venus", tests: [["first", "clouds"]], ok: true, ref: "Solar System" },
  { p: "TRAPPIST-1 c", cat: "rocky/airless", tests: [["rockday", 380, 0.15]], ok: true, ref: "Zieba et al. 2023: 380 ± 31 K, below the 430 K bare-rock limit; bare rock or a thin atmosphere" },
  // temperate rocky
  { p: "Earth", cat: "rocky/temperate", tests: [["first", "ocean"]], ok: true, ref: "Solar System" },
  { p: "Mars", cat: "rocky/icy", tests: [], ok: true, ref: "Solar System" },
  { p: "TRAPPIST-1e", cat: "rocky/temperate", tests: [], ok: true, ref: "Habitable zone (Kopparapu et al. 2013)" },
  { p: "LHS 1140b", cat: "rocky/temperate", tests: [], ok: true, ref: "Cadieux et al. 2024: mini-Neptune excluded; tentative nitrogen-rich air; candidate eyeball water world" },
  // cold rocky and icy
  { p: "Titan", cat: "rocky/icy", tests: [], ok: true, ref: "Solar System" },
  // sub-Neptunes: subtypes are contested, so the test is that the main readings are offered
  { p: "GJ 1214b", cat: "subnep/warm", tests: [["alt", "steam"], ["alt", "miscible"], ["meas", "bright"]], ok: true, ref: "Kempton et al. 2023: Bond albedo 0.51 ± 0.06, metal-rich, reflective aerosols (reanalysis 0.42 ± 0.11)" },
  { p: "K2-18b", cat: "subnep/temperate", tests: [["alt", "hycean"], ["alt", "magma"], ["alt", "mini-Neptune"]], ok: true, ref: "Madhusudhan et al. 2023, 2025 (hycean); Wogan et al. 2024 (gas-rich mini-Neptune); Shorttle et al. 2024 (magma ocean), disputed by Rigby et al. 2024" },
  { p: "TOI-270d", cat: "subnep/temperate", tests: [["alt", "miscible"], ["alt", "mini-Neptune"]], ok: true, ref: "Benneke et al. 2024: metal-rich miscible envelope (about 58% metals by mass) over a rocky interior; Holmberg & Madhusudhan 2024" },
  { p: "GJ 9827 d", cat: "subnep/warm", tests: [["alt", "steam"]], ok: true, ref: "Piaulet-Ghorayeb et al. 2024: steam-rich atmosphere, water over 31% by volume" },
  { p: "GJ 3470 b", cat: "neptune/warm", tests: [["flag", "Escaping"]], ok: true, ref: "Bourrier et al. 2018: neutral hydrogen escaping beyond the Roche lobe; Palle et al. 2020: helium" },
  // hot Neptunes
  { p: "GJ 436 b", cat: "neptune/warm", tests: [["flag", "Escaping"]], ok: true, ref: "Ehrenreich et al. 2015: a comet-like hydrogen cloud, 56% UV transit depth" },
  { p: "LTT 9779 b", cat: "neptune/hot", tests: [["meas", "bright"]], ok: true, ref: "Hoyer et al. 2023: geometric albedo 0.80; Saha et al. 2025: 0.73 ± 0.11" },
  { p: "HAT-P-11 b", cat: "neptune/warm", tests: [["flag", "Escaping"]], ok: true, ref: "Allart et al. 2018: escaping helium beyond 5 planet radii" },
  { p: "WASP-107b", cat: "giant/puffy", tests: [["flag", "Escaping"]], ok: true, ref: "Piaulet et al. 2021: 30.5 ± 1.7 Earth masses, envelope > 85% of the mass; Sing et al. 2024; Welbanks et al. 2024" },
  // ice giants and cold giants
  { p: "Uranus", cat: "neptune/cold", tests: [], ok: true, ref: "Solar System" },
  { p: "Neptune", cat: "neptune/cold", tests: [], ok: true, ref: "Solar System; Irwin et al. 2024: pale greenish blue like Uranus" },
  { p: "Jupiter", cat: "giant/cold", tests: [["tint", 125, 0.2]], ok: true, ref: "Jupiter's effective temperature about 125 K" },
  { p: "Saturn", cat: "giant/cold", tests: [], ok: true, ref: "Solar System" },
  { p: "eps Ind A b", cat: "giant/cold", tests: [["tint", 275, 0.3]], ok: true, ref: "Matthews et al. 2024: imaged with JWST MIRI, about 275 K, about 6.5 Jupiter masses" },
  // warm giants
  { p: "WASP-80 b", cat: "giant/warm", tests: [], ok: true, ref: "Bell et al. 2023: methane detected at > 6σ; Teq about 825 K" },
  { p: "HD 80606 b", cat: "giant/warm", tests: [["flag", "eccentric"]], ok: true, ref: "Laughlin et al. 2009: e = 0.93" },
  { p: "Kepler-16b", cat: "giant/cold", tests: [["flag", "Circumbinary"]], ok: true, ref: "Doyle et al. 2011" },
  // hot Jupiters
  { p: "HD 189733b", cat: "giant/hot", tests: [["meas", "blue"], ["flag", "Escaping"]], ok: true, ref: "Evans et al. 2013: deep blue; Lecavelier des Etangs et al. 2010: escaping hydrogen" },
  { p: "HD 209458b", cat: "giant/hot", tests: [["flag", "Escaping"]], ok: true, ref: "Vidal-Madjar et al. 2003" },
  { p: "WASP-39b", cat: "giant/hot", tests: [], ok: true, ref: "JWST ERS 2023: inflated hot Saturn" },
  { p: "WASP-43 b", cat: "giant/hot", tests: [["tday", 1524, 0.12], ["tnight", 863, 0.2]], ok: true, ref: "Bell et al. 2024: 1,524 ± 35 K day, 863 ± 23 K night; cloudy night, clear day (JWST MIRI)" },
  // ultra-hot
  { p: "KELT-9 b", cat: "giant/ultra", tests: [["tday", 4566, 0.05], ["tnight", 2556, 0.1]], ok: true, ref: "Mansfield et al. 2020" },
  { p: "WASP-121b", cat: "giant/ultra", tests: [["tnight", 1020, 0.15], ["flag", "Stretched"]], ok: true, ref: "Mikal-Evans et al. 2023; Seidel et al. 2025" },
  { p: "WASP-76 b", cat: "giant/ultra", tests: [], ok: true, ref: "Ehrenreich et al. 2020" },
  { p: "WASP-18 b", cat: "giant/ultra", tests: [], ok: true, ref: "Coulombe et al. 2023: thermal inversion, 10.4 Jupiter masses" },
  { p: "WASP-12 b", cat: "giant/ultra", tests: [["flag", "Stretched"]], ok: true, ref: "Akinsanmi et al. 2024: tidal deformation measured (3.2σ); orbit decaying" },
  // young giants: measured effective temperatures
  { p: "β Pictoris b", cat: "giant/young", tests: [["tint", 1724, 0.12]], ok: true, ref: "Chilcote et al. 2017: 1,724 ± 15 K from luminosity; 1,700–1,800 K from spectra" },
  { p: "HR 8799 e", cat: "giant/young", tests: [["tint", 1150, 0.2]], ok: true, ref: "Lacour et al. 2019 (GRAVITY): 1,150 ± 50 K" },
  { p: "51 Eri b", cat: "giant/young", tests: [["tint", 750, 0.25]], ok: true, ref: "Macintosh et al. 2015: 600–750 K; Brown-Sevilla et al. 2023: 807 ± 45 K; 2–4 Jupiter masses" },
  { p: "AF Lep b", cat: "giant/young", tests: [["tint", 800, 0.25]], ok: true, ref: "Zhang et al. 2023; Franson et al. 2023: about 800 K, 2.8–3.7 Jupiter masses" },
  // puffy planets
  { p: "Kepler-51 b", cat: "giant/puffy", tests: [], ok: true, ref: "Libby-Roberts et al. 2020: all three planets below 0.1 g/cm³; featureless, hazy spectra" },
  { p: "Kepler-51 d", cat: "giant/puffy", tests: [], ok: true, ref: "Libby-Roberts et al. 2020; JWST: high-altitude haze over an H/He envelope" },
  { p: "WASP-193 b", cat: "giant/puffy", tests: [], ok: true, ref: "Barkaoui et al. 2024: 0.059 g/cm³" },
  // special hosts and orbits
  { p: "WD 1856+534 b", cat: "giant/cold", tests: [["flag", "White-dwarf"], ["tint", 186, 0.25]], ok: true, ref: "Vanderburg et al. 2020; Limbach et al. 2025: 186 K, at most 6 Jupiter masses (JWST)" },
  { p: "Kepler-1520 b", cat: "rocky/lava", tests: [["flag", "Disintegrating"]], ok: true, ref: "Rappaport et al. 2012 (KIC 12557548 b): a disintegrating body about Mercury's size with a dust tail" }
];

function benchWorld(name) { if (typeof REC_ALIAS !== "undefined" && REC_ALIAS[name]) name = REC_ALIAS[name]; return ALL.find(w => w.name === name) || (typeof catWorld === "function" ? catWorld(name) : null); }
function runBenchmarks() {
  const rows = [];
  for (const b of BENCH) {
    const w = benchWorld(b.p);
    if (!w) { rows.push({ p: b.p, test: "found", ok: false, got: "not in the catalogue", want: "", ref: b.ref }); continue; }
    const c = categorize(w), got = c.main + "/" + c.sub;
    if (b.cat) rows.push({ p: b.p, test: "category", ok: got === b.cat, got: c.subName, want: b.cat, ref: b.ref + (b.ok ? "" : " · source still to verify") });
    for (const [kind, v, tol] of b.tests) {
      let ok = false, g = "";
      if (kind === "first") { g = w.scenarios[0].ground; ok = g === v; }
      else if (kind === "flag") { ok = c.flags.some(f => f.toLowerCase().includes(v.toLowerCase())); g = c.flags.join("; ") || "none"; }
      else if (kind === "alt") { ok = c.alt.some(a => a.toLowerCase().includes(v.toLowerCase())); g = c.alt.join("; ") || "none"; }
      else if (kind === "meas") { const M = GIANT.MEAS, m = M[w.name] || M[w.name.replace(/(\d)([a-z])$/, "$1 $2")] || {}; ok = v === "bright" ? !!m.bright : v === "blue" ? m.deck === "hd189" : false; g = ok ? v : "not carried"; }
      else {
        let T = null;
        if (kind === "rockday") T = daysideRock(w, w.scenarios[0]).T;   // the guide's day-side rule: bare rock (Cowan & Agol 2011, ε = 0), cooler for the hottest lava worlds
        else { const gm = giantOf(w), m = gm && gm.m; if (m) T = kind === "tday" ? m.Tday : kind === "tnight" ? m.Tnight : Math.pow((m.T0 / Math.SQRT2) ** 4 + (m.Tint || 0) ** 4, 0.25); }   // tint: effective temperature, sunlight plus internal heat
        g = T == null ? "no value" : Math.round(T) + " K"; ok = T != null && Math.abs(T - v) <= v * tol;
      }
      rows.push({ p: b.p, test: kind + (kind === "alt" || kind === "flag" || kind === "meas" || kind === "first" ? " " + v : ""), ok, got: g, want: kind === "rockday" || kind === "tday" || kind === "tnight" || kind === "tint" ? `${v} K ± ${Math.round(tol * 100)}%` : v, ref: b.ref });
    }
  }
  return rows;
}
