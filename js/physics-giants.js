// Giant-planet appearance model (cloud and haze spectra, measured values, appearance, shading helpers), shared with the Giant Planet Atlas page
// ================= Giant-planet appearance model (shared with the Giant Planet Atlas page) =================
const GIANT = (() => {
  let showIm = true, earthEye = false;
const fbm = (x, y, z, o = 4) => { let s = 0, a = 0.5, f = 1; for (let i = 0; i < o; i++) { s += a * vnoise(x * f, y * f, z * f); a *= 0.5; f *= 2.03; } return s; };
// ================= Cloud and haze spectra (Lambert reflectance) =================
const MAT = {
  iceCloud: spec(l => 0.74 - 0.04 * (l - 380) / 400),                       // methane / H₂S ice: white
  jupZone: spec(l => 0.46 + 0.28 * sig((l - 470) / 35)),                     // ammonia ice + a little chromophore: cream
  jupBelt: spec(l => 0.16 + 0.36 * sig((l - 540) / 45)),                     // deeper, chromophore-rich: brown-orange
  satZone: spec(l => 0.40 + 0.30 * sig((l - 500) / 45)),
  satBelt: spec(l => 0.30 + 0.30 * sig((l - 530) / 45)),
  waterCloud: spec(() => 0.8),
  clearBlue: spec(l => 0.04 + 0.32 * sig((460 - l) / 30)),                   // class III: Rayleigh above deep clouds, red absorbed
  alkaliDark: spec(l => 0.05 + 0.04 * sig((470 - l) / 20)),                  // class IV: Na and K absorb most light
  silicate: spec(l => 0.12 + 0.05 * (l - 380) / 400),
  silCloud: spec(l => 0.5 + 0.08 * (l - 380) / 400),                         // bright silicate cloud tops
  ultra: spec(() => 0.03),
  hd189: spec(l => 0.04 + 0.05 * sig((570 - l) / 12) + 0.51 * sig((450 - l) / 12)),   // Evans et al. 2013, × 1.5
  redSpot: spec(l => 0.12 + 0.42 * sig((l - 560) / 35)),
  darkSpot: spec(l => 0.1 + 0.15 * sig((460 - l) / 40)),
  ring: spec(l => 0.32 + 0.22 * sig((l - 520) / 60)),
  hazeBright: spec(l => 0.42 + 0.16 * sig((l - 480) / 40)),   // reflective haze (GJ 1214b-like)
  hazeTholin: spec(l => 0.06 + 0.40 * sig((l - 580) / 45)),   // organic, Titan-like haze
  kcl: spec(l => 0.62 - 0.05 * (l - 380) / 400),               // KCl and ZnS clouds: white
  na2s: spec(l => 0.18 + 0.36 * sig((l - 510) / 40)),           // Na₂S clouds: yellow-brown
  mns: spec(l => 0.14 + 0.34 * sig((l - 565) / 40)),            // MnS clouds: reddish brown
  s8: spec(l => 0.08 + 0.62 * sig((l - 465) / 22)),             // sulfur (S₈) haze: yellow
};
// methane optical depth above the clouds, shaped so that strength 1 reproduces Uranus's reflectance relative to 450 nm
// (≈0.8 at 550, 0.4 at 620–650, 0.1 at 730 nm; Irwin et al. 2024). Interpolated linearly between these points.
const CH4_PTS = [[380, 0], [450, 0], [500, 0.05], [550, 0.22], [600, 0.6], [620, 0.92], [650, 0.92], [700, 1.39], [730, 2.5], [780, 2.3]];
const CH4 = spec(l => { for (let i = 1; i < CH4_PTS.length; i++) if (l <= CH4_PTS[i][0]) { const [a, va] = CH4_PTS[i - 1], [b, vb] = CH4_PTS[i]; return va + (vb - va) * (l - a) / (b - a); } return 2.3; });
const RAYL = spec(l => (550 / l) ** 4);

// ================= Planets =================
const MEAS = {
  "KELT-9 b": { Tday: 4566, Tnight: 2556, text: "The hottest known giant: day side about 4,600 K, night side about 2,600 K (Mansfield et al. 2020). Molecules are broken apart, iron and titanium are ionised (Hoeijmakers et al. 2018), and hydrogen streams away: gas absorbing in Hα reaches about 1.6 planet radii (Yan & Henning 2018). No cloud can form anywhere on it.", wind: "Hydrogen molecules split on the day side and recombine on the night side, releasing heat there (Bell & Cowan 2018); ionised gas is braked by the planet's magnetic field, which weakens the jet." },
  "WASP-76 b": { text: "Iron absorption shows on the evening edge but not the morning edge: iron vapour may condense on the night side (Ehrenreich et al. 2020).", wind: "Line shifts during transit show day-to-night winds of several km/s (Ehrenreich et al. 2020); WASP-76b and WASP-121b differ in how the shift changes through transit, in line with their temperatures (Kesseli, Snellen et al. 2023)." },
  "WASP-121b": { wind: "Three layers measured with ESPRESSO using all four VLT telescopes: iron traces deep winds flowing from day to night; above them a sodium jet circles the equator faster than the planet spins and speeds up across the day side; hydrogen traces the top (Seidel et al. 2025, Nature). Titanium sits just below the jet (Prinoth et al. 2025).", Tday: 2717, Tnight: 1020 /* the night side at the wavelengths JWST NIRSpec sees (Mikal-Evans et al. 2023); adding up all wavelengths gives 1,562 K (Splinter et al. 2025): which to draw is an open choice */, hotOff: 3, text: "JWST phase curves: the hottest point lies about 3° east of the point under the star, and the night side is cool enough at the heights JWST sees, 926–1122 K, for silicate clouds (Mikal-Evans et al. 2023). Adding up the light at all wavelengths gives about 2,720 K for the day side and 1,560 K for the night side: it reflects about 28% of the starlight and carries little heat round (Splinter et al. 2025)." },
  "β Pictoris b": { Tint: 1724, rotH: 8.7, text: "Directly imaged and only ~20 Myr old: glows at 1,724 ± 15 K from its own heat (Chilcote et al. 2017). Spin 8.7 h from spectral line broadening (Snellen et al. 2014; Landman et al. 2024)." },
  "HR 8799 e": { Tint: 1150, text: "Directly imaged: effective temperature 1,150 ± 50 K from GRAVITY spectroscopy, near the L/T transition (Lacour et al. 2019)." },
  "51 Eri b": { Tint: 750, text: "Directly imaged, methane-rich and cool: 600–810 K depending on the study (Macintosh et al. 2015; Brown-Sevilla et al. 2023)." },
  "AF Lep b": { Tint: 800, text: "Directly imaged: about 800 K, metal-rich, 2.8–3.7 Jupiter masses from its orbit (Zhang et al. 2023; Franson et al. 2023)." },
  "eps Ind A b": { Tint: 275, text: "Imaged by JWST in the mid-infrared: about 275 K, an old, cold super-Jupiter of about 6.5 Jupiter masses (Matthews et al. 2024)." },
  "WD 1856+534 b": { Tint: 186, text: "JWST thermal emission: 186 K, the coldest planet seen in its own light; at most 6 Jupiter masses (Limbach et al. 2025)." },
  "WASP-39b": { text: "JWST: CO₂, SO₂ made by starlight, H₂O, CO, Na, K; evening edge 177 K hotter than the morning edge (JWST ERS 2023; Tsai 2023; Espinoza 2024)." },
  "HD 209458b": { hotOff: 41 /* Spitzer 4.5 µm phase curve, 40.9° east (Zellem et al. 2014) */, wind: "Lines shifted about 2 km/s toward us during transit: gas flowing from the day side to the night side (Snellen et al. 2010).", text: "First transiting planet; sodium detected, and a comet-like tail of escaping hydrogen (Charbonneau 2002; Vidal-Madjar 2003)." },
  "WASP-107b": { text: "Puffy (0.13 g/cm³). JWST finds SO₂ and little methane: a hot, tidally heated interior mixes the atmosphere (Sing et al. 2024; Welbanks et al. 2024)." },
  "TOI-270d": { text: "JWST: CH₄, CO₂ and H₂O in a metal-rich atmosphere (Benneke et al. 2024; Holmberg & Madhusudhan 2024)." },
  "K2-18b": { text: "JWST: CH₄ and probably CO₂; dimethyl sulfide not confirmed (Madhusudhan 2023; Schmidt 2025; Hu 2025)." },
  "GJ 1214 b": { bright: true, text: "Bright, reflective haze: Bond albedo 0.51 ± 0.06 (Kempton et al. 2023)." },
  "55 Cancri e": { text: "" },
  "HD 189733 b": { wind: "The two edges move differently: an eastward jet plus the planet's spin (Louden & Wheatley 2015); spin consistent with tidal locking (Brogi et al. 2016).", deck: "hd189", text: "Colour measured by Hubble: deep blue (Evans et al. 2013)." },
  "TrES-2 b": { scale: 0.22, text: "Darkest known: reflects about 1% of light (Kipping & Spiegel 2011)." },
  "Kepler-7 b": { westClouds: 0.9, text: "Bright clouds on the western dayside, albedo 0.25–0.35 (Demory et al. 2013)." },
  "LTT 9779 b": { bright: true, text: "Geometric albedo 0.73 ± 0.11: the most reflective known (Saha et al. 2025)." },
  "HAT-P-7 b": { text: "Geometric albedo 0.077 ± 0.006 (Mansfield et al. 2018)." },
  "WASP-12 b": { scale: 0.7, text: "Very dark: geometric albedo below 0.064 (Bell et al. 2017)." },
  "HIP 41378 f": { ringCandidate: true, text: "Super-puff; rings could explain its low density, but none are confirmed (Akinsanmi et al. 2020)." },
};
// added by the November 2026 literature review (v2/REVIEW-100.md): temperatures where a phase curve measured them, and what each study found.
// Merged into MEAS; where an entry already exists, the text is appended and measured values fill gaps only
for (const [n, e] of Object.entries({
  "WASP-43 b": { Tday: 1524, Tnight: 863, hotOff: 7, text: "JWST MIRI phase curve: day side 1,524 K, night side 863 K; clouds hide the night side below about 0.1 bar, and no methane is seen there (Bell et al. 2024)." },
  "WASP-17 b": { deck: "silicate", text: "JWST MIRI found quartz (SiO₂) crystals, only about 10 nm across, in its high clouds (Grant et al. 2023)." },
  "WASP-19 b": { Tday: 2240, text: "TESS phase curve: day side about 2,240 K, and it reflects 16% of visible light, more than most hot Jupiters, perhaps from clouds or haze (Wong et al. 2020)." },
  "KELT-1 b": { Tday: 2988, Tnight: 1173, text: "A transiting brown dwarf: day side about 3,000 K, night side about 1,170 K, with clouds on the night side (Beatty et al. 2019)." },
  "KOI-13 b": { Tday: 2750, text: "Kepler-13 A b. Day side about 2,750 K with a temperature inversion; its visible reflectivity is debated, 0.10–0.33 (Shporer et al. 2014)." },
  "LTT 9779 b": { westClouds: 0.9, text: "JWST phase curve: bright white clouds on the western day side reflect about 80% of the light; the eastern side is darker (Coulombe et al. 2025)." },
  "eps Ind A b": { text: "JWST MIRI: ammonia confirmed; thick water-ice clouds are the preferred explanation of its 11 µm brightness (Matthews et al. 2026)." },
  "CoRoT-2 b": { hotOff: -23, text: "Its hottest spot lies 23° west of noon, the opposite of almost every other hot Jupiter: perhaps it spins out of step, or clouds cover one side (Dang et al. 2018)." },
  "HAT-P-2 b": { text: "On a very oval orbit: Spitzer saw its glow peak a few hours after closest approach, as the day side flashes hundreds of kelvin hotter (Lewis et al. 2013)." },
  "XO-3 b": { text: "Massive and on an oval orbit; tidal heating helps inflate it (Wong et al. 2014; Dang et al. 2022)." },
  "WASP-14 b": { text: "Spitzer phase curves fit a moderate temperature inversion on the day side (Wong et al. 2015)." },
  "WASP-33 b": { text: "A day-side temperature inversion is well established; titanium oxide is claimed but contested (Haynes et al. 2015; Cont et al. 2021)." },
  "KELT-20 b": { text: "Iron emission lines show a temperature inversion on the day side (Yan et al. 2022)." },
  "WASP-18 b": { text: "JWST NIRISS: water seen in emission and a thermal inversion; the day side is hottest near noon and water is depleted there (Coulombe et al. 2023)." },
  "WASP-103 b": { text: "So close to its star that tides stretch it into a rugby-ball shape (Barros et al. 2022, CHEOPS)." },
  "HD 149026 b": { text: "JWST emission shows CO₂ and water in very metal-rich air, 59–276× solar (Bean et al. 2023); a reanalysis finds about 20× (Gagnebin et al. 2024)." },
  "WASP-77 A b": { text: "JWST emission: metal-poor air with a low carbon-to-oxygen ratio (August et al. 2023)." },
  "WASP-80 b": { text: "JWST found methane in both transmission and emission (Bell et al. 2023)." },
  "GJ 3470 b": { text: "JWST: water, methane, CO₂ and SO₂ in air about 100× richer in heavy elements than the Sun's (Beatty et al. 2024)." },
  "GJ 436 b": { text: "JWST emission: weak features, metal-rich air (≥80× solar) (Mukherjee et al. 2025); a comet-like hydrogen tail streams behind it (Ehrenreich et al. 2015)." },
  "HAT-P-26 b": { text: "Water detected under a haze; heavy elements about 15× solar (Wakeford et al. 2017; Ramos Rosado & Miller 2025)." },
  "GJ 3090 b": { text: "JWST: escaping helium and a muted spectrum, so very metal-rich air (>100× solar) (Ahrer et al. 2025)." },
  "TOI-5205 b": { text: "A giant around a small red dwarf: JWST found methane and H₂S in metal-poor air, behind strong starspot contamination (Cañas et al. 2026)." },
  "WASP-96 b": { text: "JWST NIRISS: water and a haze that scatters blue light; no grey cloud deck (Taylor et al. 2023)." },
  "WASP-127 b": { wind: "An equatorial jet of about 9 km/s, the fastest wind measured on any planet, with cooler poles (Nortmann et al. 2025)." },
  "WASP-52 b": { text: "Cloudy; JWST NIRISS: water and helium escaping in a tail (Fournier-Tondreau et al. 2024)." },
  "HAT-P-18 b": { text: "JWST NIRISS: water, escaping helium and haze, behind starspot contamination (Fournier-Tondreau et al. 2024)." },
  "HAT-P-12 b": { text: "A hazy sub-Saturn: muted water and a scattering slope (Wong et al. 2020); JWST adds patchy clouds and too little methane (Heinke et al. 2026)." },
  "HAT-P-32 b": { text: "A high haze leaves only narrow sodium and potassium lines (Gibson et al. 2013; Alam et al. 2020); escaping helium trails it in a long tail (Zhang et al. 2023)." },
  "WASP-6 b": { text: "Hazy: a strong scattering slope, with sodium, potassium and water (Nikolov et al. 2015; Carter et al. 2020)." },
  "WASP-74 b": { text: "A scattering slope reaching into the infrared and muted water: hazy or cloudy (Luque et al. 2020)." },
  "WASP-62 b": { text: "A clear, cloud-free atmosphere (Alam et al. 2021)." },
  "WASP-94 A b": { text: "JWST: CO₂ but no SO₂, and less carbon relative to oxygen than its star (Ahrer et al. 2025)." },
  "WASP-29 b": { text: "A flat spectrum: clouds high in the atmosphere hide its gases (Wong et al. 2022)." },
  "WASP-31 b": { text: "High clouds mute its spectrum; an earlier potassium detection was not confirmed (McGruder et al. 2020)." },
  "WASP-63 b": { text: "Muted water: high clouds (Kilpatrick et al. 2018)." },
  "KELT-7 b": { text: "A nearly featureless spectrum dominated by H⁻ ions (Pluriel et al. 2020; Gascón et al. 2025)." },
  "WASP-79 b": { text: "Water and H⁻ ions detected (Sotzen et al. 2020; Rathcke et al. 2021)." },
  "XO-2 N b": { text: "Sodium and potassium detected in its air (Sing et al. 2012)." },
  "AF Lep b": { text: "JWST NIRCam: out-of-equilibrium carbon chemistry and metal-rich air; about 3 Jupiter masses (Franson et al. 2024)." },
  "HR 8799 c": { text: "JWST NIRCam: strong CO₂ absorption, so metal-rich air (Balmer et al. 2025)." },
  "HR 8799 d": { text: "JWST NIRCam: strong CO₂ absorption, so metal-rich air (Balmer et al. 2025)." },
  "Kepler-51 d": { text: "JWST: a steep, nearly featureless spectrum from a very high haze (1–100 µbar) over a vast hydrogen envelope, or a thin ring (Libby-Roberts et al. 2025)." },
  "HD 3167 c": { text: "Hubble hints at water, HCN, CO₂ or CH₄, and rules out clear hydrogen-rich air below ~100× solar metals (Mikal-Evans et al. 2021)." },
  "TOI-776 c": { text: "A featureless JWST spectrum: metal-rich air or high haze (Teske et al. 2025)." },
  "HD 15337 c": { text: "A flat JWST spectrum, like other sub-Neptunes of its size: metal-rich air or high haze (Wallack et al. 2026)." },
  // planet-by-planet review from the arXiv pull (REVIEW-triage.md), batch 1
  "HAT-P-1 b": { text: "JWST with Hubble: water and CO₂, about 10× solar metals, oxygen-rich, and no sign of clouds muting the spectrum (Ashtari et al. 2026)." },
  "HAT-P-14 b": { text: "JWST: water and perhaps a grey cloud deck, roughly solar metals (Liu et al. 2025)." },
  "HAT-P-30 b": { text: "JWST: water and CO₂ with muted features; metal-poor and carbon-poor air (Claringbold et al. 2026)." },
  "HAT-P-13 b": { text: "Spitzer eclipses fit solar-composition air with no thermal inversion (Hardy et al. 2017)." },
  "WASP-12 b": { text: "Hydrogen streams off it: Hα absorption lasts beyond the transit and moves with the star, not the planet, as gas overflowing its Roche lobe is sheared into tails (Vissapragada et al. 2026; Saidel et al. 2026)." },
  "WASP-20 b": { text: "Tentative water vapour from high-resolution spectra (Maimone et al. 2022)." },
  "KELT-8 b": { text: "Water detected; water-rich, carbon-poor air (Basilicata et al. 2025)." },
  "NGTS-10 b": { westClouds: 0.8, Tday: 1650, Tnight: 1150, text: "JWST phase curve separating heat from reflected light: patchy silicate clouds, evaporated from the hottest region east of noon, so the west is cloudier. Day side about 1,500–1,800 K, night side 1,000–1,300 K; it reflects almost nothing (Bond albedo ~0.03) and carries a third of its heat round (Coulombe et al. 2026)." },
  "V1298 Tau c": { text: "Only about 23 million years old. JWST: water vapour, about 15× solar metals, less than older planets of its size (Murphy et al. 2026); its spectrum may also be hazy (Barat et al. 2024). No escaping helium detected (Alam et al. 2024)." },
  "TOI-125 b": { text: "JWST: muted features, so metal-rich air (~150× solar) or clouds above ~3 mbar (Chai et al. 2026)." },
  "TOI-125 c": { text: "JWST: muted features, so metal-rich air (~100× solar) or clouds above ~10 mbar (Chai et al. 2026)." },
  "TOI-776 b": { text: "JWST: a flat spectrum; hydrogen-rich air below ~100× solar metals is ruled out, leaving water-rich air, high clouds or none (Alderson et al. 2025)." },
  "TOI-2076 b": { text: "Escaping helium detected: a thick outflow that trails behind the planet (Zhang et al. 2022)." },
  "TOI-2109 b": { Tday: 3631, text: "Day side about 3,600 K (Wong et al. 2021) with a thermal inversion from 3,200 to 4,600 K; iron and CO emission, no water; night side below 2,400 K, so little heat crosses over (Cont et al. 2025)." },
  "HATS-75 b": { text: "JWST: methane, CO and CO₂ in metal-poor air, read through spots on its M-dwarf star (Ashtari et al. 2026)." },
  "TOI-1231 b": { text: "JWST: strong methane and some CO₂ in deep hydrogen-rich air, no surface (Sarkar et al. 2026)." },
  "TOI-1420 b": { text: "A super-puff, about 0.08 g/cm³. Escaping helium detected, but slowly enough to keep its air for billions of years (Vissapragada et al. 2024)." },
  "TOI-2134 b": { text: "Escaping helium detected, the faintest helium signal and the oldest mini-Neptune seen losing gas (Zhang et al. 2023)." },
  "TOI-3884 b": { text: "Escaping helium, absorbing 6.8% of starlight and arriving hours before the planet like a headwind (Ninan et al. 2026). It crosses a giant starspot near its star's pole on every transit." },
  "TOI-5293 A b": { text: "JWST: methane in metal-poor air, read through a fast-changing spotted star (Kanodia et al. 2026)." },
  "WASP-193 b": { text: "One of the least dense planets known, 0.06 g/cm³ (Barkaoui et al. 2023)." },
  "K2-33 b": { text: "About 10 million years old. Its transit is twice as deep in visible light as in the infrared: a thick photochemical haze (Thao et al. 2022) or a thin dust ring round the planet (Ohno et al. 2022). Tentative escaping helium (Hirano et al. 2024)." },
  "GU Psc b": { Tint: 1000, text: "Directly imaged 2,000 au from its star: a T-type planetary-mass companion of about 1,000 K (Naud et al. 2014). Hubble saw its brightness vary by 2.7% as patchy clouds rotate, over at least 8 hours (Lew et al. 2019)." },
  "TYC 8998-760-1 b": { Tint: 1700, text: "YSES-1 b. Directly imaged, ~17 million years old and about 1,700 K (Bohn et al. 2020); its carbon is unusually rich in ¹³C, perhaps from ices it accreted (Zhang et al. 2021). JWST found a dusty disc round it, still feeding it or building moons (Hoch et al. 2025)." },
  "TYC 8998-760-1 c": { deck: "silicate", text: "YSES-1 c. Directly imaged; JWST found tiny silicate cloud grains, probably with iron, high in its air (Hoch et al. 2025)." },
  "51 Peg b": { text: "The first planet found round a Sun-like star. Seen in its own light at high resolution: water and probably CO, no thermal inversion, metal-rich air (Cont et al. 2026); no reflected light detected (Scandariato et al. 2020)." },
  "Kepler-41 b": { westClouds: 0.8, text: "Kepler phase curve: brightest west of noon, from reflective clouds on the west side (Shporer & Hu 2015)." },
  "KELT-17 b": { text: "Iron hydride (FeH) detected in its air (Meni-Gallardo et al. 2026)." },
  "KELT-23 A b": { text: "Water detected (Basilicata et al. 2025)." },
  "WASP-21 b": { text: "Sodium detected, and a blue slope too steep for clear hydrogen: haze in its air (Alderson et al. 2020; Chen et al. 2020)." },
  "KELT-18 b": { text: "Escaping helium detected, absorbing 1.1% of starlight (Chella et al. 2026)." },
  "Kepler-79 d": { text: "A super-puff with a featureless spectrum: high haze, perhaps carried up by its escaping air (Chachan et al. 2020)." },
  "HD 191939 b": { text: "Hubble: a featureless spectrum, so metal-rich air or high clouds (Gapp et al. 2026)." },
  "HN Peg b": { Tint: 1100, rotH: 15.4, text: "Directly imaged, at the L/T transition, about 1,100 K. Hubble saw it brighten and dim by 1.2% as patchy clouds of large grains turn with a 15.4-hour day (Zhou et al. 2018)." },
  "Ross 458 c": { Tint: 650, text: "Directly imaged, a T8 object of about 650 K whose spectrum still shows cloud, unusual that cold (Burgasser et al. 2010)." },
  "WASP-85 A b": { text: "Tentative hydrogen (Hα) and calcium absorption (Jiang et al. 2023)." },
  "HD 179949 b": { text: "Not transiting, but seen in its own light at high resolution: water vapour (Webb et al. 2020)." },
  "TWA 7 b": { Tint: 315, text: "Imaged by JWST in the mid-infrared inside its young star's debris disc: about Saturn's mass and only ~315 K, the lightest planet ever imaged (Lagrange et al. 2025; Crotts et al. 2025)." },
  "TOI-1268 b": { text: "Young and puffy; escaping helium detected (Pérez González et al. 2023)." },
  "2M0437 b": { Tint: 1200, text: "Directly imaged, only 2–5 million years old: CO and probably water and methane in a dusty atmosphere of about 1,200 K (Gaidos & Hirano 2023)." },
  "MASCARA-4 b": { text: "Ultra-hot: iron, magnesium, calcium, sodium and hydrogen, and the first rubidium and samarium in an exoplanet (Zhang et al. 2022; Jiang et al. 2023)." },
  "HAT-P-4 b": { text: "Spitzer eclipses: a dark day side that keeps its heat, little carried to the night (Todorov et al. 2013)." },
  "KELT-10 b": { text: "No sodium detected (Steiner et al. 2023)." },
  "BD+60 1417 b": { text: "A young, red, very cloudy L-type companion: its spectrum needs clouds (Phillips et al. 2024)." },
  // measured hot-spot offsets: WASP-43 b 7° east (JWST MIRI, Bell et al. 2024) and CoRoT-2 b 23° west (Dang et al. 2018) sit in their entries above:
  // a second entry under the same name would silently replace the first
  "HD 189733 b": { hotOff: 16 },  // Spitzer 8 µm map, ~16° east (Knutson et al. 2007)
  "OGLE-TR-56 b": { Tday: 2718, text: "The first planet whose own glow was seen in visible light, from the ground: a day side of about 2,700 K, very dark and keeping its heat (Sing & López-Morales 2009)." },
  "HAT-P-3 b": { text: "Spitzer eclipses: a dark day side that keeps its heat (Todorov et al. 2013); no escaping helium detected (Orell-Miquel et al. 2025)." },
  "MASCARA-1 b": { Tday: 2952, Tnight: 1300, hotOff: -6, text: "Day side about 2,950 K, night side about 1,300 K, hot spot near noon (Spitzer; Bell et al. 2020). Thermal inversion with CO, water, OH, iron, magnesium, calcium and titanium in emission; roughly solar metals but extra rock-forming elements (Kanumalla et al. 2026)." },
  "KELT-16 b": { Tday: 3070, Tnight: 1900, hotOff: -38, text: "Day side about 3,070 K, night side about 1,900 K, hot spot perhaps west of noon though uncertain (Spitzer; Bell et al. 2020)." },
  "TOI-1518 b": { text: "Iron (neutral and ionised), with hints of chromium and nickel, in its transmission spectrum, and winds measured across the transit (Basinger et al. 2025); CO emission from the day side (Finnerty et al. 2026)." },
  "TOI-1431 b": { text: "Iron glowing on its day side in a thermal inversion, about 2,000 K below and 4,500 K above, and signs of winds (Sikora et al. 2026)." },
  "WASP-167 b": { Tday: 2790, text: "Day side about 2,790 K from its TESS phase curve (Kálmán et al. 2024); iron and hydrogen absorption at high resolution (Jiang et al. 2026)." },
  "WASP-117 b": { text: "Water seen by Hubble; clear skies and very high metals are preferred, but a cloud deck with fewer metals also fits (Carone et al. 2020). Marginal hydrogen and lithium (Jiang et al. 2026)." },
  "WASP-50 b": { text: "No absorption found at high resolution (Jiang et al. 2026)." },
  "WASP-156 b": { text: "No absorption found at high resolution (Jiang et al. 2026)." },
  "WASP-173 A b": { text: "No absorption found at high resolution (Jiang et al. 2026)." },
  "Kepler-76 b": { Tday: 2830, hotOff: 9, text: "Day side about 2,830 K, hot spot 9° east of noon; its phase curve varies over tens of days, a sign of changing weather (Jackson et al. 2019)." },
  "Kepler-77 b": { scale: 0.4, text: "Very dark: geometric albedo below 0.09 (Gandolfi et al. 2013)." },
  "HATS-11 b": { westClouds: 0.6, text: "Unusually reflective for its temperature: best matched by bright silicate clouds reaching high in the air (Adams et al. 2021)." },
  "K2-31 b": { text: "Low optical albedo, matched by clear skies or compact clouds (Adams et al. 2021)." },
  "K2-107 b": { text: "Low optical albedo, matched by clear skies or compact clouds (Adams et al. 2021)." },
  "Kepler-8 b": { text: "Its optical albedo fits moderately extended clouds (Adams et al. 2021)." },
  "Kepler-17 b": { text: "Its optical albedo fits moderately extended clouds (Adams et al. 2021)." },
  "HD 202772 A b": { Tday: 2400, text: "Spitzer eclipses: day side about 2,100–2,600 K (Adams et al. 2024)." },
  "WASP-26 b": { Tday: 1775, text: "Spitzer eclipses: day side about 1,750 K, close to isothermal (Mahtani et al. 2013)." },
  "WASP-5 b": { text: "Deep layers of the day side about 2,700 K, higher layers about 1,900 K: no thermal inversion (Chen et al. 2014)." },
  "WASP-34 b": { text: "Its day-side spectrum looks like a plain blackbody, redder than similar warm Jupiters (Challener et al. 2021)." },
  "HAT-P-8 b": { text: "Spitzer eclipses fit an atmosphere without a thermal inversion (Todorov et al. 2011)." },
  "KELT-2 A b": { text: "Water vapour detected in its thermal emission (Piskorz et al. 2018)." },
  "WASP-88 b": { text: "Featureless optical spectrum, rising to the blue: hints of high haze (Spyratos et al. 2021)." },
  "HAT-P-44 b": { text: "Sodium and signs of water, a clear sky and several times solar metals, like its near-twin WASP-39 b (Claringbold et al. 2026)." },
  "HAT-P-55 b": { text: "Sodium detected in transmission (Kang et al. 2024)." },
  "WASP-172 b": { text: "Sodium, hydrogen and probably iron in transmission, with strong winds (Seidel et al. 2023)." },
  "HATS-46 b": { text: "Featureless spectrum: clouds favoured, a clear atmosphere ruled out at 3σ (Ahrer et al. 2023)." },
  "HATS-8 b": { text: "An extreme scattering slope in its optical spectrum, stronger than Rayleigh scattering: tiny haze or condensate particles (May et al. 2018)." },
  "HAT-P-47 b": { text: "Aerosols and tentative TiO in its optical spectrum (Wang et al. 2026)." },
  "HATS-5 b": { text: "Tentative water and little sodium or potassium: a clear atmosphere if confirmed (Allen et al. 2022)." },
  "WASP-7 b": { text: "Sodium detected in transmission (Rahmati et al. 2022)." },
  "WASP-110 b": { text: "No sodium or potassium features: clouds and starspot faculae (Nikolov et al. 2021)." },
  "WASP-124 b": { text: "Featureless optical spectrum (McGruder et al. 2023)." },
  "WASP-48 b": { text: "No escaping helium (Bennett et al. 2023); day-side emission fits models with or without an inversion." },
  "HAT-P-67 b": { text: "One of the least dense giants: calcium and sodium in its upper air (Bello-Arufe et al. 2023) and a huge helium tail streaming ahead of it, up to 130 planet radii, as gas overflows its Roche lobe (Gully-Santiago et al. 2023)." },
  "WASP-177 b": { text: "Tentative helium (Kirk et al. 2022), not confirmed (Orell-Miquel et al. 2025)." },
  "TOI-1259 A b": { text: "Escaping helium: losing its atmosphere at about 2×10¹⁰ g/s (Saidel et al. 2024)." },
  "HD 143105 b": { text: "Detected directly in K band: a true mass of 1.2 Jupiters, cloud-free to about 1 bar, water absorption and no thermal inversion (Finnerty et al. 2024)." },
  "tau Boo b": { text: "Water vapour detected in its thermal emission (Lockwood et al. 2014)." },
  "HD 88133 b": { text: "A claimed direct detection was later judged unlikely (Buzard et al. 2021)." },
  "HIP 99770 b": { text: "JWST images show CO₂ and CO: an enriched atmosphere suggesting it formed in a disk like a planet (Balmer et al. 2026)." },
  "kap And b": { rotH: 4, text: "Spins fast, near half its break-up speed (a day of at most about 4 hours); water and CO detected (Morris et al. 2024)." },
  "DH Tau b": { text: "Rotates slowly for its age, 9–15% of break-up speed (Xuan et al. 2020)." },
  "HD 106906 b": { text: "Marginal 4-hour brightness variation (Zhou et al. 2020)." },
  "LP 261-75 b": { rotH: 4.8, deck: "silicate", text: "An L6 companion whose spectrum varies as patchy clouds rotate, every ~4.8 hours (Manjavacas et al. 2017)." },
  "CWISEP J193518.59-154620.3 b": { Tint: 480, text: "JWST sees methane glowing at 3.3 μm: a temperature inversion high in its air, probably heated by aurorae (Faherty et al. 2024)." },
  "HD 206893 b": { Tint: 1400, deck: "silicate", text: "The reddest substellar object known: a high layer of fine dust; 1,200–1,800 K (Ward-Duong et al. 2020)." },
  "HD 206893 c": { text: "Imaged by GRAVITY: 12.7 Jupiter masses at 3.5 au, possibly burning deuterium (Hinkley et al. 2022)." },
  "WD 1856+534 b": { text: "A JWST transmission spectrum since finds methane-rich air with haze and a warmer night side, 390 to 412 K, perhaps reheated when it migrated inwards; the two temperatures are not yet reconciled (MacDonald et al. 2026)." },
  "LTT 3780 c": { text: "TOI-732 c. JWST finds methane, about 1%, in hydrogen-rich air, and no ammonia; hints of more complex molecules are unconfirmed (Rigby et al. 2025)." },
  "2MASS J12073346-3932539 b": { Tint: 1300, deck: "silicate", text: "2M1207 b. JWST sees silicate and iron clouds whose patchiness changes over hours (Adams et al. 2025), silicate cloud absorption in the mid-infrared, and a likely disc round it (Patapis et al. 2025)." },
  "Kepler-167 e": { text: "A Jupiter analogue on a 3-year orbit. JWST transit: not visibly flattened, so a day of at least ~7 hours if its axis is upright (Cassese et al. 2025); no large moon found." },
})) { const o = MEAS[n]; if (!o) { MEAS[n] = e; continue; } for (const k in e) if (k === "text" || k === "wind") o[k] = o[k] ? o[k] + " " + e[k] : e[k]; else if (o[k] == null) o[k] = e[k]; }
// added by the deep literature pass (B1, November 2026): values measured from each planet's own glow that the drawing was not yet using.
// Each was read from the paper's arXiv record or full text. Tday, Tnight in kelvin; hotOff in degrees east of the point under the star.
// Same merge as above: text is appended, numbers fill gaps only.
for (const [n, e] of Object.entries({
  "HAT-P-7 b": { Tday: 2667, Tnight: 1500, hotOff: 0, text: "Spitzer watched a whole orbit: the day side is about 2,670 K, with a layer that grows hotter with height. The night side is far colder, about 1,700 K at one infrared wavelength and below 1,360 K at another, and the hottest point sits under the star, so little heat is carried round (Wong et al. 2016). Hubble's spectrum of the day side is featureless, like a glowing body at 2,690 K (Mansfield et al. 2018)." },
  "KELT-9 b": { hotOff: 19, text: "Its hottest point lies about 19° east of the point under the star, further than models predict (Mansfield et al. 2020)." },
  "WASP-18 b": { Tday: 2894, hotOff: 5, text: "Hubble watched a whole orbit: day side about 2,890 K, night side below 1,430 K, and the hottest point only 4.5° east of the point under the star, so winds carry very little heat round (Arcangeli et al. 2019)." },
  "WASP-103 b": { Tday: 2930, Tnight: 1880, text: "Hubble and Spitzer watched a whole orbit: about 2,930 K on the day side and 1,880 K on the night side, each glowing like a plain hot body (Kreidberg et al. 2018)." },
  "WASP-76 b": { Tday: 2699, Tnight: 1259, hotOff: 1, text: "Spitzer watched a whole orbit: day side about 2,700 K, night side about 1,260 K, and the hottest point under the star to within a degree (May et al. 2021)." },
  "WASP-14 b": { Tday: 2402, Tnight: 1380, text: "Spitzer watched a whole orbit: day side about 2,400 K; night side about 1,380 K at one infrared wavelength and below 1,080 K at another (Wong et al. 2015)." },
  "WASP-19 b": { Tnight: 1090, text: "Spitzer watched a whole orbit: the day side glows like a body at 2,370 K and the night side at about 1,090 K (Wong et al. 2016)." },
  "WASP-12 b": { Tday: 2900, text: "CHEOPS and TESS see a day side of about 2,900 K that reflects almost nothing, and a planet pulled out of round by its star's tides (Akinsanmi et al. 2024)." },
  "WASP-33 b": { Tday: 3144, Tnight: 1757, hotOff: 16, text: "Spitzer watched a whole orbit: day side about 3,140 K, night side about 1,760 K, hottest point 13–20° east of the point under the star (Zhang et al. 2018)." },
  "HD 149026 b": { Tday: 1804, Tnight: 1032, text: "Spitzer watched a whole orbit: day side about 1,800 K, night side about 1,030 K; the position of its hottest point could not be measured reliably (Zhang et al. 2018)." },
  "KELT-1 b": { hotOff: 19, text: "Its hottest point lies about 19° east of the point under the star, or 28° at a shorter infrared wavelength (Beatty et al. 2019)." },
  "HD 189733 b": { Tday: 1212, Tnight: 973, text: "The first map of an exoplanet's heat: Spitzer saw it vary from about 970 K on the night side to 1,210 K on the day side, so winds carry heat round efficiently (Knutson et al. 2007)." },
  "HD 209458b": { Tday: 1499, Tnight: 972, text: "Spitzer watched a whole orbit: day side about 1,500 K, night side about 970 K, hottest point 41° east of the point under the star (Zellem et al. 2014)." },
  "Qatar-1 b": { Tday: 1557, Tnight: 1167, hotOff: 0, text: "Spitzer watched a whole orbit: day side about 1,560 K, night side about 1,170 K, and no shift of the hottest point, where models predict tens of degrees (Keating et al. 2020)." },
  "WASP-77 A b": { Tday: 1780, Tnight: 1234, hotOff: 16, text: "Spitzer watched a whole orbit: day side about 1,780 K, night side about 1,230 K, hottest point about 16° east of the point under the star (Davenport et al. 2025)." },
  "WASP-17 b": { Tnight: 1005, hotOff: 19, text: "JWST mapped the day side as it slid behind the star: the hottest point lies about 19° east of the point under the star (Valentine et al. 2024). The night side is about 1,000 K (Lustig-Yaeger et al. 2025)." },
  "KELT-20 b": { Tday: 2566, text: "CHEOPS sees a day side of about 2,570 K that reflects about a quarter of the light falling on it, and passes almost no heat to the night side (Singh et al. 2023)." },
  "WASP-80 b": { Tday: 851, text: "Spitzer finds a day side of about 850 K (Wong et al. 2022); JWST finds it reflects about a fifth of the light falling on it, probably from haze (Morel et al. 2025)." },
  "WASP-29 b": { Tday: 937, text: "Spitzer finds a day side of about 940 K (Wong et al. 2022)." },
  "HAT-P-23 b": { Tday: 2154, text: "Spitzer finds a day side that glows like a body at about 2,150 K (O'Rourke et al. 2013)." },
  "WASP-48 b": { Tday: 2158, text: "Spitzer finds a day side that glows like a body at about 2,160 K (O'Rourke et al. 2013)." },
  "HAT-P-12 b": { Tday: 890, text: "Spitzer finds a day side of about 890 K, which means heat is carried round efficiently (Wong et al. 2020)." },
  "TrES-2 b": { Tday: 1500, text: "Spitzer finds a day side that glows like a body at about 1,500 K (O'Donovan et al. 2010)." },
  "WASP-100 b": { Tday: 2710, Tnight: 2380, text: "TESS watched many orbits: a day side of at most about 2,710 K and a warm night side of about 2,380 K, so heat is carried round well; it reflects about 16% of the light (Jansen & Kipping 2020)." },
  "TOI-1518 b": { Tday: 3237, text: "TESS finds a day side of about 3,240 K (Cabot et al. 2021)." },
  "GJ 1214 b": { Tday: 553, Tnight: 437, text: "JWST watched a whole orbit: about 550 K on the day side and 440 K on the night side (Kempton et al. 2023)." },
  "WASP-189 b": { hotOff: 0, text: "CHEOPS watched whole orbits and found no shift of the hottest point (Deline et al. 2022)." },
})) { const o = MEAS[n]; if (!o) { MEAS[n] = e; continue; } for (const k in e) if (k === "text" || k === "wind") o[k] = o[k] ? o[k] + " " + e[k] : e[k]; else if (o[k] == null) o[k] = e[k]; }
// ================= Appearance model =================
function model(p) {
  if (!MEAS[p.name]) { const alt = p.name.replace(/(\d)([a-z])$/, '$1 $2'); if (MEAS[alt]) MEAS[p.name] = MEAS[alt]; }
  const ME_ = MEAS[p.name] || {};
  if (ME_.rotH) p.rotH = ME_.rotH;   // measured spin (e.g. from line broadening)
  const R = rng(strHash(p.name)), notes = [];
  const note = (lvl, k, t) => notes.push({ lvl, k, t });
  const L = p.Rs ** 2 * (p.Teff / 5772) ** 4, aR = p.a * AU / (p.Rs * RSUN);
  // internal heat: giants are born hot and cool for billions of years; a fit to cooling tracks, T ≈ 447 K (M / M♃)^0.5 (age / 20 Myr)^-0.32,
  // gives about 1,550 K for a 12 M♃ planet at 20 Myr (β Pic b: 1,724 K measured), 770 K for 51 Eri b and 80 K for Jupiter (its internal heat alone is
  // about 100 K). Neptunes and smaller are not given this term.
  const MpG = p.Mp || (p.Rp > 7 ? 318 : 17), Tcool = MpG > 60 ? 447 * Math.pow(MpG / 317.8, 0.5) * Math.pow(Math.max(0.005, p.age || 5) / 0.02, -0.32) : 0;   // fitted to directly imaged giants (AF Lep b, 51 Eri b, HR 8799 e); the age slope as in cooling tracks (Burrows et al. 1997: L ∝ M^2.6 t^-1.3)
  const T0 = p.Teff / Math.sqrt(aR), Tint = ME_.Tint || Tcool, Teq = ((T0 / Math.SQRT2) ** 4 + Tint ** 4) ** 0.25;   // starlight and internal heat add as fluxes (fourth powers)
  const ownHeat = Tint > T0 / Math.SQRT2 * 1.2;   // self-luminous: follows the brown-dwarf sequence, not the irradiated classes
  const neptune = p.Rp < 7;
  // mass: reject implausible catalogue masses (upper limits); giants default to 1 Jupiter mass, Neptunes to 17 M⊕
  let Mp = p.Mp, massNote = "measured";
  if (Mp) { const rho = Mp / p.Rp ** 3 * 5.51; if ((rho > 18 && !(Mp >= 1300 && p.Rp >= 6)) || rho < 0.03) { Mp = null; massNote = "catalogue value implausible"; } }
  if (!Mp) { Mp = p.Rp < 4 ? massFromRadius(p.Rp) : neptune ? 17 : 318; if (massNote === "measured") massNote = "assumed"; }
  // atmospheric metallicity falls with mass (methane in the Solar System giants, water in exoplanets; Welbanks et al. 2019):
  // about 3× solar for Jupiter, ~10× for Saturn, ~50× for Neptune and more for mini-Neptunes. Heavier air means a smaller scale height.
  const Zx = p.Z || Math.max(1, Math.min(300, 3 * Math.pow(Mp / 317.8, -1))), mu = 2.3 * (1 + 0.004 * Zx);
  const uv = p.Teff < 3900 ? 1.3 : p.Teff > 6300 ? 1.2 : 1;   // UV-active M dwarfs and UV-bright F stars drive more photochemistry
  const g = G * Mp * ME / (p.Rp * RE) ** 2, Hkm = 3.6 * Teq / g * 2.3 / mu;
  const locked = !p.rotH && (p.locked != null ? p.locked : p.a < 0.27 * Math.cbrt(p.Ms) && p.P < 40);
  const rotH = p.rotH || (locked ? p.P * 24 : 8 + 14 * R());
  // group
  p.group = p.group || (p.Rp >= 6 && Mp < 40 ? "puff" : !neptune ? (Teq < 200 ? "cold" : Teq < 700 ? "warm" : Teq < 1800 ? "hot" : "ultra") : (Teq < 700 ? "coldnep" : "hotnep"));
  if (isWD(p.Rs, p.Ms)) note(0, "Host", "A white dwarf: the planet survived its star's death. The model treats it like a star of the same temperature.");
  // day and night temperatures (Cowan & Agol 2011), redistribution falling with temperature
  const eps = locked ? 1 / (1 + (Teq / 1500) ** 3) : 1;
  const Tday = ME_.Tday || T0 * Math.pow(2 / 3 - 5 / 12 * eps, 0.25);
  // night side: measured hot-Jupiter night sides cluster near 1,000–1,100 K, probably the tops of night-side clouds (Keating et al. 2019;
  // Bell et al. 2024 for WASP-43 b, 863 K). Between about 1,000 and 2,300 K that empirical trend replaces the heat-transport model; the hottest planets clear their clouds
  const TnModel = T0 * Math.pow(eps / 4, 0.25), TnCloud = Math.max(700, Math.min(1150, 800 + 0.15 * (Teq - 1200))), wClear = Math.max(0, Math.min(1, (Teq - 2300) / 500));
  const nightClouds = locked && Teq > 1000 && !ME_.Tnight;
  const Tnight = ME_.Tnight || Math.min(Tday, nightClouds ? TnCloud * (1 - wClear) + TnModel * wClear : TnModel);   // measured phase-curve values win; a calculated night side is never hotter than a measured day side
  const hotOff = locked ? (ME_.hotOff != null ? ME_.hotOff : 30 * eps + 5) : 0;   // measured offsets win (negative = west, as on CoRoT-2 b)
  // cloud chemistry: base zone and belt spectra by temperature, interpolated in log T
  const bins = neptune
    ? [[50, "iceCloud", "iceCloud"], [150, "iceCloud", "satBelt"], [300, "waterCloud", "satZone"], [600, "clearBlue", "waterCloud"], [1000, "alkaliDark", "clearBlue"], [1600, "silicate", "alkaliDark"], [2400, "ultra", "silicate"]]
    : [[60, "satZone", "satBelt"], [130, "jupZone", "jupBelt"], [260, "waterCloud", "satZone"], [550, "clearBlue", "waterCloud"], [1000, "alkaliDark", "clearBlue"], [1600, "silicate", "alkaliDark"], [2400, "ultra", "silicate"]];
  // self-luminous giants: like L and T brown dwarfs, dusty and red with silicate clouds when hot, clearing at the L/T transition (lower at low
  // gravity: young imaged planets stay dusty down to ~1,000 K, e.g. HR 8799 and 2M1207 b; Marley et al. 2012), then clear and methane-dark, with water clouds below ~400 K
  const Tlt = g < 100 ? 1050 : 1250;
  if (ownHeat && !neptune) bins.splice(0, bins.length, [400, "waterCloud", "satZone"], [600, "alkaliDark", "clearBlue"], [Tlt - 150, "alkaliDark", "alkaliDark"], [Tlt + 150, "silicate", "alkaliDark"], [2600, "silicate", "silicate"]);
  if (ownHeat && !neptune) note(1, "Clouds", Teq > Tlt + 100 ? "Glowing from within like a young L-type brown dwarf: thick, red silicate dust clouds." : Teq > Tlt - 150 ? "At the transition where brown dwarfs lose their dust clouds: patchy silicate clouds over clearer, deeper air." : Teq > 450 ? "Cool enough, like a T-type brown dwarf, for its dust clouds to sink out of sight: clear air where methane and water absorb." : "Cold enough for water clouds, like the coldest brown dwarfs.");
  let i = 0; while (i < bins.length - 1 && Teq > bins[i + 1][0]) i++;
  const j = Math.min(bins.length - 1, i + 1), t = i === j || Teq <= bins[0][0] ? 0 : Math.min(1, Math.max(0, Math.log(Teq / bins[i][0]) / Math.log(bins[j][0] / bins[i][0])));
  let zone = mixS(MAT[bins[i][1]], MAT[bins[j][1]], t), belt = mixS(MAT[bins[i][2]], MAT[bins[j][2]], t);
  // Saturn sits colder than Jupiter, but its colours are Saturn's own
  if (p.name === "Saturn") { zone = MAT.satZone; belt = MAT.satBelt; }
  // between ~600 and 1,400 K, salts and sulfides condense high up (KCl and ZnS below ~900 K, Na₂S and MnS above; Morley et al. 2012).
  // More heavy elements make thicker decks; low gravity lofts them higher, where they show.
  const clw = Teq > 600 && Teq < 1400 && !ME_.deck ? Math.min(0.75, Math.max(0, 0.15 + 0.25 * Math.log10(Zx)) * Math.min(1.4, Math.sqrt(25 / Math.max(5, G * Mp * ME / (p.Rp * RE) ** 2)))) : 0;
  if (clw > 0.05) { const sal = Teq < 900 ? MAT.kcl : Teq < 1150 ? mixS(MAT.na2s, MAT.kcl, 0.3) : MAT.mns; zone = mixS(zone, sal, clw); belt = mixS(belt, sal, clw * 0.6); }
  // where the deck is clear (blue or dark), more heavy elements mean more water and alkali absorption: darker
  if (Teq > 550 && Teq < 1600 && Zx > 3) { const dk = Math.pow(Zx / 3, -0.12); zone = zone.map(v => v * dk); belt = belt.map(v => v * dk); }
  // mini-Neptunes (below 4 R⊕): metal-rich envelopes; photochemical haze forms most efficiently at ~300–950 K (Morley et al. 2015;
  // Gao et al. 2020). Haze composition is unknown, so the seed mixes reflective and organic (tholin-like) haze.
  const mini = p.Rp < 4;
  let hazeMix = 0;
  if (mini && Teq > 300 && Teq < 950 && !ME_.bright) { hazeMix = Math.min(0.95, (0.15 + 0.7 * R()) * uv); zone = mixS(MAT.hazeBright, MAT.hazeTholin, hazeMix); belt = mixS(zone, MAT.hazeTholin, 0.3); }
  // sulfur: SO₂ made by starlight in metal-rich air (JWST: WASP-39b, WASP-107b) turns into yellow S₈ haze below ~800 K (Zahnle et al. 2016; Gao et al. 2017)
  const sHaze = Teq > 350 && Teq < 800 && Zx > 10 && !ME_.deck && !ME_.bright ? Math.min(0.5, (0.12 + 0.15 * Math.log10(Zx / 10)) * uv) : 0;
  if (sHaze) { zone = mixS(zone, MAT.s8, sHaze); belt = mixS(belt, MAT.s8, sHaze * 0.8); }
  const cls = Teq < 150 ? "ammonia-ice clouds" : Teq < 350 ? "water clouds" : Teq < 800 ? "cloud-free, deep and blue" : Teq < 1400 ? "sodium and potassium absorb: dark" : Teq < 2000 ? "silicate clouds where cool enough" : "too hot for dayside clouds";
  note(1, "Clouds", `<b>${Math.round(Teq)} K</b>: ${cls}${neptune && Teq < 150 ? " (methane and H₂S ice for an ice giant)" : ""}.`);
  note(1, "Metals", `Heavy elements about <b>${Zx < 10 ? Zx.toFixed(1) : Math.round(Zx)}×</b> solar, estimated from the mass (lighter planets are richer); mean molecular weight ${mu.toFixed(1)}.`);
  if (clw > 0.05) note(1, "Clouds", `Salt and sulfide clouds (${Teq < 900 ? "KCl, ZnS" : Teq < 1150 ? "Na₂S" : "MnS"}) make up about ${Math.round(clw * 100)}% of the deck colour: more for metal-rich, low-gravity planets.`);
  if (sHaze) note(2, "Haze", `Metal-rich air at ${Math.round(Teq)} K: starlight turns SO₂ into a yellow sulfur haze (${Math.round(sHaze * 100)}% of the colour).`);
  // methane: present below ~1,000 K; stronger for metal-rich Neptunes and when clouds sit deep (cold)
  const ch4 = (Teq > 1000 ? 0 : (neptune ? Math.min(0.9, 0.22 * Math.pow(Zx / 3, 0.45)) : 0.22 * Math.pow(Zx / 3, 0.25)) * (Teq < 90 ? 1 : Teq < 200 ? 0.55 : 0.3)) * (mini && Teq > 600 ? 0.2 : 1);   // hot, metal-rich: methane gives way to CO and CO₂
  if (ch4 > 0.15) note(1, "Methane", `${neptune ? "Heavy-element-rich, so lots of methane" : "Some methane"} above the clouds absorbs red: ${neptune ? "cyan to blue" : "a slight blue-grey cast"}.`);
  // Rayleigh scattering by the hydrogen above the reflecting layer
  // (the class-III and class-IV spectra already include their Rayleigh blue, so little extra is added there)
  // tuned once against the Solar System (Uranus and Neptune pale greenish-blue; Saturn and Jupiter with high clouds and little blue)
  const tauR = Teq < 90 ? (neptune ? 0.32 : 0.03) : Teq < 200 ? 0.03 : Teq < 350 ? 0.08 : Teq < 800 ? 0.15 : Teq < 1400 ? 0.1 : 0.05;
  // bands: count ∝ sqrt(size × spin rate), scaled to Jupiter; Neptune-sized planets have few broad bands
  const nb = Math.max(1, Math.min(9, Math.round(6 * Math.sqrt((p.Rp / 11.2) * (10 / rotH)) * (neptune ? 0.42 : 1))));
  let contrast = Teq < 90 ? 0.14 : Teq < 220 ? 0.6 : Teq < 350 ? 0.28 : Teq < 800 ? 0.07 : Teq < 1400 ? 0.1 : Teq < 2000 ? 0.3 : 0.05;
  if (p.name === "Saturn") contrast = 0.6;
  const mute = Math.max(hazeMix ? 0.55 : 0, Math.min(0.75, Math.max(0, (Hkm - 28) / 70)));
  contrast *= 1 - mute;
  note(p.rotH ? 0 : locked ? 1 : 3, "Spin", p.rotH ? `Measured ${rotH.toFixed(1)} h rotation: <b>${nb}</b> band${nb > 1 ? "s" : ""} per hemisphere.` : locked ? `Tidally locked: one spin per ${p.P.toFixed(1)}-day orbit, so few bands; the day–night pattern dominates.` : `Spin unknown; <b>${rotH.toFixed(0)} h</b> assumed by the seed gives ${nb} band${nb > 1 ? "s" : ""} per hemisphere.`);
  note(1, "Haze", `Scale height <b>${Math.round(Hkm)} km</b> (Jupiter: 27). ${mute > 0.3 ? "A tall, hazy atmosphere mutes the bands." : mute > 0.05 ? "Some haze softens the bands." : "Thin haze: band contrast preserved."}`);
  if (hazeMix) note(3, "Haze", `Photochemical haze, common at ${Math.round(Teq)} K; its makeup is unknown, drawn as ${Math.round(hazeMix * 100)}% orange organic haze, the rest bright and reflective.`);
  if (mini) { const Rc = Math.pow(Mp, 0.25), Renv = p.Rp - Rc; if (Renv > 0.05) { const fenv = 5 * Math.pow(Renv / (2.06 * Math.pow(Mp, -0.21)), 1 / 0.59); note(1, "Envelope", `Radius beyond a rocky core suggests hydrogen and helium make up about <b>${fenv < 0.1 ? "less than 0.1" : fenv < 1 ? fenv.toFixed(1) : Math.round(fenv)}%</b> of the mass (Lopez & Fortney 2014)${massNote === "measured" ? "" : "; mass assumed"}. Water-rich interiors could explain the same size.`); } }
  if (locked) note(1, "Day / night", `Day side about <b>${Math.round(Tday)} K</b>, night side about <b>${Math.round(Tnight)} K</b>; hotspot ${Math.abs(Math.round(hotOff))}° ${hotOff < 0 ? "west" : "east"} of the point under the star${ME_.hotOff != null ? " (measured)" : ""}.`);
  // winds: a permanent day side drives an eastward equatorial jet; speed grows with the day–night difference (≈ 3 km/s × √(ΔT / 1000 K),
  // close to the 2–5 km/s measured for HD 189733b and WASP-121b); fast spinners instead get Jupiter-like zonal bands
  const wind = locked ? 3 * Math.sqrt(Math.max(0, Tday - Tnight) / 1000) : 0.15;
  note(1, "Winds", locked ? `A permanent day side drives an eastward jet of about <b>${wind.toFixed(1)} km/s</b> that carries heat to the night side and streaks the clouds.${Teq > 2000 ? " This hot, models switch toward flow straight from day to night over both edges, and the winds are layered: measured speeds grow with height, to 10–20 km/s in the upper atmosphere (Seidel et al. 2025)." : ""}` : `No permanent day side: the spin organises the winds into zonal bands, as on Jupiter (jets of order 100 m/s).`);
  if (ME_.wind) note(0, "Winds", ME_.wind);
  if (Tint > 400 && !ME_.Tint) note(1, "Glow", `Still cooling from its formation: about <b>${Math.round(Tint)} K</b> of its own heat at ${p.age < 1 ? Math.round(p.age * 1000) + " million" : p.age.toFixed(1) + " billion"} years (a fit to imaged young giants; uncertain by about 25%, and more if the catalogue mass is uncertain).`);
  if (nightClouds && Teq < 2500) note(1, "Night side", `About <b>${Math.round(Tnight)} K</b>: measured hot-Jupiter night sides cluster near 1,000–1,100 K, probably the tops of night-side clouds (Keating et al. 2019).`);
  if (Tday > 1500) note(1, "Glow", `Hot enough to glow: the ${Tday > 2500 ? "day side shines orange" : "deepest layers glow dull red"} at its Planck colour.`);
  // features
  const feats = [];
  const nf = Teq < 220 && !neptune ? 4 + Math.floor(R() * 6) : neptune && Teq < 300 ? 1 + Math.floor(R() * 3) : 0;
  for (let k = 0; k < nf; k++) {
    const big = k === 0 && !neptune && R() < 0.6;
    feats.push({ lat: (R() - 0.5) * 1.6 * (neptune ? 0.8 : 1), lon: R() * Math.PI * 2, a: big ? 0.28 : 0.05 + 0.08 * R(), b: big ? 0.12 : 0.03 + 0.03 * R(),
      type: neptune ? (k === 0 && R() < 0.5 ? "dark" : "bright") : big ? "red" : "white" });
  }
  if (nf) note(3, "Storms", `${nf} ${neptune ? "dark spots and bright methane clouds" : "long-lived ovals"}: their number and positions are imagined (Jupiter and Neptune both have them).`);
  // hot-Jupiter clouds: condense where the local temperature drops below ~1,700 K (silicates), i.e. the western dayside
  const westClouds = locked && Teq > 1000 && Teq < 2100 ? (MEAS[p.name] && MEAS[p.name].westClouds) || 0.35 + 0.4 * R() : 0;
  if (westClouds) note(2, "Clouds", "Patchy silicate clouds on the cooler western (morning) day side; coverage is a model.");
  // oblateness from spin (f ≈ 0.68 q)
  const Om = 2 * Math.PI / (rotH * 3600), q = Om * Om * (p.Rp * RE) ** 3 / (G * Mp * ME), flat = Math.min(0.2, 0.68 * q);
  if (flat > 0.02) note(p.rotH ? 0 : 3, "Shape", `Spin flattens it by <b>${(flat * 100).toFixed(0)}%</b>.`);
  // tidal stretching: a giant this close to its star is pulled into an egg shape pointing at the star. The long axis exceeds the others by
  // about (3/2) h q_t, with q_t = (M★/Mp)(Rp/a)³ and a fluid Love number h ≈ 1.5 (WASP-103 b: measured; Barros et al. 2022). WASP-12 b ≈ 13%.
  const qt = (p.Ms * 333000 / Mp) * Math.pow(p.Rp * RE / (p.a * AU), 3), stretch = locked ? Math.min(0.25, 1.5 * 1.5 * qt) : 0;
  if (stretch > 0.03) note(1, "Shape", `Tides from its star stretch it into an egg about <b>${(stretch * 100).toFixed(0)}%</b> longer toward the star than across (Love number about 1.5, as measured for WASP-103 b; Barros et al. 2022).`);
  // obliquity
  const obl = p.obl != null ? p.obl : locked ? 0 : 30 * R();
  // rings: Saturn real; exoplanets only beyond the snow line, only as imagined
  const snow = 2.7 * Math.sqrt(L);
  let rings = p.rings ? "saturn" : null;
  if (!rings && p.group !== "solar" && !MEAS[p.name] && !locked && p.a > snow && R() < 0.4) rings = "imagined";   // Jupiter, Uranus and Neptune have real but faint, dark rings: not drawn
  if (MEAS[p.name] && MEAS[p.name].ringCandidate) rings = "candidate";
  if (rings === "imagined") note(3, "Rings", `Beyond the snow line (${snow.toFixed(1)} AU), so icy rings could survive. None has ever been confirmed on an exoplanet: these are imagined.`);
  if (rings === "candidate") note(2, "Rings", "Candidate rings drawn faintly: unconfirmed.");
  // Solar System: real storms in their real latitudes (longitude chosen to face the viewer)
  if (p.name === "Jupiter") { feats.length = 0; feats.push({ lat: -22 * D2R, lon: 0.5, a: 0.3, b: 0.11, type: "red" }); for (const [la, lo] of [[-33, 1.1], [-35, -0.3], [-40, 0.2], [20, 0.9], [-31, -0.9]]) feats.push({ lat: la * D2R, lon: lo, a: 0.07, b: 0.04, type: "white" }); }
  if (p.name === "Neptune") { feats.length = 0; feats.push({ lat: -20 * D2R, lon: 0.6, a: 0.2, b: 0.09, type: "dark" }, { lat: -27 * D2R, lon: 0.6, a: 0.12, b: 0.03, type: "bright" }, { lat: 35 * D2R, lon: 1.0, a: 0.35, b: 0.035, type: "bright" }); }
  if (p.name === "Uranus" || p.name === "Saturn") feats.length = 0;
  const meas = MEAS[p.name];
  if (meas) note(0, "Measured", meas.text);
  if (meas && meas.deck) { zone = MAT[meas.deck]; belt = mixS(MAT[meas.deck], MAT.clearBlue, 0.4); contrast = 0.05; }
  if (meas && meas.scale) { zone = zone.map(v => v * meas.scale); belt = belt.map(v => v * meas.scale); }
  if (meas && meas.bright) { zone = MAT.silCloud; belt = mixS(MAT.silCloud, MAT.silicate, 0.4); }
  // a second possible world for giants whose albedo is unmeasured: measured albedos of warm and hot giants span about 0.03 to 0.4
  if (p.variant === "bright") { zone = MAT.silCloud; belt = mixS(MAT.silCloud, zone, 0.3); note(2, "Clouds", "In this possible world high, reflective clouds cover the planet, as on the few bright hot giants measured (Kepler-7 b; Demory et al. 2013)."); }
  if (p.variant === "dark") { zone = zone.map(v => v * 0.35); belt = belt.map(v => v * 0.35); note(2, "Clouds", "In this possible world the sky is clear and the planet as dark as most hot Jupiters measured, reflecting under a tenth of its light (Esteves et al. 2015)."); }
  note(massNote === "measured" ? 0 : 1, "Mass", massNote === "measured" ? `${Math.round(Mp)} M⊕; gravity ${(g / 9.81).toFixed(1)} g.` : `${massNote === "assumed" ? "Unknown" : "Catalogue value implausible"}: ${Mp} M⊕ assumed (gravity ${(g / 9.81).toFixed(1)} g).`);
  const wc = meas && meas.deck ? 0 : westClouds;   // a measured colour already includes whatever clouds there are
  // Rayleigh light is lost to absorption on dark (alkali) worlds: weight it by how reflective the deck is
  const rayW = Math.min(1, (zone.reduce((a, v) => a + v, 0) / zone.length) * 3);
  const tauEff = hazeMix ? 0.02 : tauR;   // a high haze hides most of the clear hydrogen below it
  // broken cloud cover: gaps show the deeper, darker or bluer air below (imagined amount)
  const patch = Teq < 1800 && !(meas && (meas.deck || meas.bright)) ? 0.1 + 0.5 * R() : 0, deep = Teq < 1000 ? mixS(MAT.clearBlue, zone, 0.25) : mixS(MAT.alkaliDark, zone, 0.25);
  if (patch > 0.3) note(3, "Clouds", `Cloud cover broken into clear patches (${Math.round(patch * 100)}% of the sky in the landscape): imagined.`);
  return { wind, R, notes, Teq, T0, Tint, Tday, Tnight, eps, hotOff, locked, rotH, nb, contrast, mute, zone, belt, ch4, tauR: tauEff, rayW, feats, westClouds: wc, flat, stretch, obl, rings, Hkm, g, Mp, neptune, seed: strHash(p.name) % 1000, L, Zx, mu, clw, sHaze, patch, deep };
}

// ================= Renderer =================
function render(p, cv, N) {
  const m = p.m, c = cv.getContext("2d"), Wc = cv.width;
  const S = starSpec(p.Teff), aR = p.a * AU / (p.Rs * RSUN), dil = 1 / aR ** 2;
  const white = toXYZ(S), M = earthEye ? XYZ2RGB : adaptMatrix(eyeWhite(white, p.Teff));
  let k = 1 / (white[1] * dil);
  if (m.Tint > 900) k = Math.min(k, 0.7 / toXYZ(spec(l => planck(l, m.Tint)))[1]);   // self-luminous: the eye adapts to the planet's own glow
  // geometry: star along +X; orbit normal +Z; spin axis tilted by the obliquity toward the star (solstice-like for Uranus)
  const ob = m.obl * D2R, s = [Math.sin(ob), 0, Math.cos(ob)];
  // locked planets are seen at a wider phase so the day–night contrast and eastward hotspot show
  const ph = (m.locked ? 62 : 38) * D2R, lift = 10 * D2R, f = [Math.cos(ph) * Math.cos(lift), Math.sin(ph) * Math.cos(lift), Math.sin(lift)];
  // screen "up" is the orbit normal, so a tilted spin axis (Uranus) shows as tilted
  let u = [-f[0] * f[2], -f[1] * f[2], 1 - f[2] * f[2]]; const ul = Math.hypot(...u); u = u.map(v => v / ul);
  const r = [u[1] * f[2] - u[2] * f[1], u[2] * f[0] - u[0] * f[2], u[0] * f[1] - u[1] * f[0]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  // projected spin axis on screen: the globe is flattened along it
  const sa0 = Math.atan2(dot(s, r), dot(s, u)), csa = Math.cos(sa0), ssa = Math.sin(sa0);
  const sdl = Math.hypot(r[0], u[0]) || 1, sdx = r[0] / sdl, sdy = u[0] / sdl;   // the star direction (+X) projected on the screen, and how much of it shows
  // body frame for longitudes: e1 toward the star (for locked planets the substellar longitude is 0)
  let e1 = [1 - s[0] * s[0], -s[0] * s[1], -s[0] * s[2]]; const el = Math.hypot(...e1) || 1; e1 = e1.map(v => v / el);
  const e2 = [s[1] * e1[2] - s[2] * e1[1], s[2] * e1[0] - s[0] * e1[2], s[0] * e1[1] - s[1] * e1[0]];
  const fl = m.flat, scale = m.rings ? 0.42 : 0.86;   // leave room for rings
  const img = c.createImageData(N, N), d = img.data;
  const ringOp = rho => {
    if (!m.rings || (!showIm && m.rings !== "saturn")) return 0;
    if (m.rings === "saturn") { if (rho < 1.24 || rho > 2.27) return 0; if (rho < 1.53) return 0.12; if (rho < 1.95) return 0.85 - 0.25 * Math.abs(rho - 1.75); if (rho < 2.03) return 0.05; return 0.5; }
    const inner = 1.3, outer = m.rings === "candidate" ? 2.2 : 1.9 + 0.5 * ((m.seed % 7) / 7);
    if (rho < inner || rho > outer) return 0;
    const band = 0.5 + 0.5 * Math.sin(rho * 23 + m.seed);
    return (m.rings === "candidate" ? 0.12 : 0.35 + 0.3 * band);
  };
  const lit = (n, P) => { // reflected + emitted radiance for a point on the planet
    const mu0 = dot(n, [1, 0, 0]), muv = Math.max(0.02, dot(n, f));
    const lat = Math.asin(Math.max(-1, Math.min(1, dot(P, s)))), lon = Math.atan2(dot(P, e2), dot(P, e1));
    // zonal bands with turbulent edges (noise stretched along longitude)
    const cl = Math.cos(lat), q1 = cl * Math.cos(lon) * 3, q2 = cl * Math.sin(lon) * 3, q3 = Math.sin(lat) * 11;
    const warp = showIm ? (fbm(q1 + m.seed, q2, q3) - 0.5) * 0.16 + (fbm(q1 * 4, q2 * 4 + m.seed, q3 * 3) - 0.5) * 0.05 : 0;
    const phase = showIm ? m.seed * 0.37 : 0;
    const bandv = Math.cos((lat + warp) * m.nb * 2 + phase);
    let mask = 0.5 + 0.5 * Math.tanh(bandv * 3);
    let refl = mixS(m.zone, m.belt, mask * m.contrast + (1 - m.contrast) * 0.15);
    if (Math.abs(lat) > 1.05 && !m.locked) refl = mixS(refl, m.belt, 0.35 * Math.min(1, m.contrast * 2.5));   // darker, hazier polar caps
    if (showIm) refl = refl.map(v => v * (1 + 0.12 * (fbm(q1 * 6, q2 * 6, q3 * 2 + m.seed) - 0.5) * (0.3 + m.contrast)));
    let ch4 = m.ch4;
    // storms and bright clouds
    if (showIm) for (const ft of m.feats) {
      let dl = lon - ft.lon; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
      const dd = (dl * Math.cos(ft.lat) / ft.a) ** 2 + ((lat - ft.lat) / ft.b) ** 2;
      if (dd < 1) {
        const tmat = ft.type === "red" ? MAT.redSpot : ft.type === "dark" ? MAT.darkSpot : ft.type === "bright" ? MAT.iceCloud : MAT.waterCloud;
        const w = (1 - dd) ** 0.6 * (ft.type === "bright" ? 0.9 : 0.85);
        refl = mixS(refl, ft.type === "bright" ? tmat.map(v => v * 1.1) : tmat, w);
        if (ft.type === "bright") ch4 *= 1 - 0.4 * w;   // methane-ice clouds sit high, above some of the methane gas
      }
    }
    // hot Jupiters: local temperature map with an eastward hotspot; clouds only where cool enough
    let T = 0;
    if (m.locked) {
      const cz = Math.cos(lat) * Math.cos(lon - m.hotOff * D2R);
      const Tmax = m.Tday / Math.pow(2 / 3, 0.25);
      T = Math.pow(m.Tnight ** 4 + Math.max(0, Tmax ** 4 - m.Tnight ** 4) * Math.max(0, cz), 0.25);
      if (m.westClouds && mu0 > 0) {
        // clouds favour the cooler western side; the edge is a smooth temperature gradient, not a line
        const cn = showIm ? fbm(q1 * 2 + 9, q2 * 2, q3 * 0.6) : 0.5;
        const west = 0.5 + 0.5 * Math.tanh(-(lon - m.hotOff * D2R) * 1.6);
        const cool = Math.max(0, Math.min(1, (1900 - T) / 500));
        const cov = Math.max(0, Math.min(1, (cn - 0.55 + 0.5 * m.westClouds * west) * 2.2)) * cool * west;
        refl = mixS(refl, MAT.silCloud, cov * 0.7);
      }
    }
    let X = 0, Y = 0, Z = 0;
    if (mu0 > 0) {
      // the planet's shadow from the rings
      let shade = 1;
      if (m.rings) { const ts = -dot(P, s) / s[0]; if (ts > 0 && Math.abs(s[0]) > 0.02) { const Q = [P[0] + ts, P[1], P[2]]; shade = 1 - ringOp(Math.hypot(...Q)) * 0.9; } }
      const limb = m.mute > 0.3 ? 1 + 0.5 * m.mute * (1 - muv) ** 2 : Math.pow(muv, 0.12 + 0.2 * (1 - m.mute));
      const mm2 = 1 / Math.max(0.03, mu0) + 1 / muv;
      for (let b = 0; b < NB; b++) {
        // hydrogen Rayleigh layer over the cloud deck, energy-conserving: light it scatters out of the beam comes back as
        // diffuse, bluer reflection (a thick conservative Rayleigh layer reflects ~75%), minus what methane absorbs
        const att = Math.exp(-m.tauR * RAYL[b] * mm2 * 0.5);
        const rv = (refl[b] * att + (1 - att) * 0.75 * m.rayW) * Math.exp(-ch4 * CH4[b]);
        const rad = S[b] * dil * shade * rv * mu0 * limb;
        X += rad * CX[b]; Y += rad * CY[b]; Z += rad * CZ[b];
      }
    }
    // thermal glow, limb-darkened: near the edge we see higher, cooler layers
    if (!m.locked && m.Tint > 900) T = m.Tint * (0.97 + 0.06 * mask * m.contrast);   // self-luminous: glows all round, bands slightly hotter
    if (T > 900) { const Te = T * (0.82 + 0.18 * Math.sqrt(muv)); const th = toXYZ(spec(l => planck(l, Te))); X += th[0]; Y += th[1]; Z += th[2]; }
    return [X, Y, Z];
  };
  for (let jy = 0; jy < N; jy++) for (let ix = 0; ix < N; ix++) {
    const o = 4 * (jy * N + ix);
    let x = ((2 * ix + 1) / N - 1) / scale, y = (1 - (2 * jy + 1) / N) / scale;
    if (m.stretch > 0.03) { const as = x * sdx + y * sdy, k = as / (1 + m.stretch * sdl) - as; x += k * sdx; y += k * sdy; }   // tidal egg: squeeze screen coordinates along the star's projected direction
    // planet, oblate along the projected spin axis (screen coordinates rotated to along / across the axis)
    const al = x * ssa + y * csa, ac = x * csa - y * ssa;
    const yy = al / (1 - fl), q = ac * ac + yy * yy;
    let pz = q <= 1 ? Math.sqrt(1 - q) : null;
    let col = null, alpha = 0;
    // ring plane intersection along the line of sight
    let ringHit = null;
    if (m.rings && Math.abs(dot(f, s)) > 0.01) {
      const tt = -(x * dot(r, s) + y * dot(u, s)) / dot(f, s);
      const Pr = [x * r[0] + y * u[0] + tt * f[0], x * r[1] + y * u[1] + tt * f[1], x * r[2] + y * u[2] + tt * f[2]];
      const rho = Math.hypot(...Pr), op = ringOp(rho);
      if (op > 0 && (pz === null || tt > pz)) {
        // ring lit by the star, unless the planet shadows it
        const mu0r = Math.abs(s[0]);
        const sh = Pr[0] < 0 && Math.hypot(Pr[1], Pr[2]) < 1 ? 0.05 : 1;   // in the planet's shadow (star along +X)
        let X = 0, Y = 0, Z = 0;
        for (let b = 0; b < NB; b++) { const rad = S[b] * dil * MAT.ring[b] * Math.max(0.05, mu0r) * sh * 1.6; X += rad * CX[b]; Y += rad * CY[b]; Z += rad * CZ[b]; }
        ringHit = { c: clip(mv(M, [X * k, Y * k, Z * k])), op };
      } else if (op > 0 && pz !== null && tt < pz) ringHit = { behind: true };
    }
    if (pz !== null) {
      const P = [x * r[0] + y * u[0] + pz * f[0], x * r[1] + y * u[1] + pz * f[1], x * r[2] + y * u[2] + pz * f[2]];
      const na = yy / (1 - fl), nx = ac * csa + na * ssa, ny = -ac * ssa + na * csa;   // gradient rotated back to screen axes
      const nn = [nx * r[0] + ny * u[0] + pz * f[0], nx * r[1] + ny * u[1] + pz * f[1], nx * r[2] + ny * u[2] + pz * f[2]], nl = Math.hypot(...nn);
      const xyz = lit(nn.map(v => v / nl), P.map(v => v / Math.hypot(...P)));
      col = clip(mv(M, xyz.map(v => v * k))); alpha = Math.min(1, (1 - Math.sqrt(q)) * N * scale * 0.5);
    }
    if (ringHit && !ringHit.behind) { const base = col || [0, 0, 0], a = ringHit.op; col = base.map((v, ii) => v * (1 - a) + ringHit.c[ii] * a); alpha = Math.max(alpha, a); }
    if (col) { d[o] = 255 * gam(col[0]); d[o + 1] = 255 * gam(col[1]); d[o + 2] = 255 * gam(col[2]); d[o + 3] = 255 * alpha; }
  }
  const off = document.createElement("canvas"); off.width = off.height = N; off.getContext("2d").putImageData(img, 0, 0);
  c.fillStyle = "#000"; c.fillRect(0, 0, Wc, Wc); c.imageSmoothingQuality = "high"; c.drawImage(off, 0, 0, Wc, Wc);
}

  return { model, render, CH4, MEAS, set(o) { showIm = o.showIm; earthEye = o.earthEye; } };   // MEAS: measured values, read by the benchmarks
})();

