// Field notes, recipe, viewpoints, key facts
// ================= Field notes and recipe =================
function notes() {
  const w = cur, sc = curSc();
  const kg = Math.round(70 * (sc.gOverride || w.g) / 9.81);
  const es = toLocal(localFrame(sc.theta, sc.lat), [1, 0, 0]).el;
  const items = [];
  const tag = l => `<span class="tag ${["t-m", "t-d", "t-sc", "t-im"][l]}">${TAGN[l]}</span>`;
  const n = (h, l, b, p) => items.push(`<dt>${h}${tag(l)}</dt><dd><b>${b}.</b> ${p}</dd>`);   // a two-column list: what, then the answer in a sentence
  n("The star", 1, `${w.angDeg.toFixed(w.angDeg < 1 ? 2 : 1)}° wide, ${(w.angDeg / 0.533).toFixed(1)}× the Sun`, `${w.star.name} is a ${w.star.Teff} K star. ${w.locked ? `The planet is tidally locked, so the star hangs still, ${Math.round(es)}° above the horizon here, forever.` : "The planet's spin is unknown, so days could be any length."}${w.star2 ? ` A second sun, ${w.star2.name} (${w.star2.Teff} K, ${w.ang2.toFixed(2)}°), shares the sky.` : ""}`);
  const xE = f => f >= 3 ? `${Math.round(f).toLocaleString()} times` : `${f < 0.1 ? (f * 100).toFixed(1) : Math.round(f * 100)}% of`;   // "1,700 times Earth's", not "169946%"
  n("Daylight", 1, `${xE(w.vis)} Earth's visible light`, `${xE(w.S).replace(/^./, c => c.toUpperCase())} Earth's total energy arrives, ${w.star.Teff < 4000 ? "but a red dwarf shines mostly in infrared, so it looks dim and amber, like a deep sunset." : "in a spectrum not far from the Sun's."}`);
  n("Your weight", 1, `${kg} kg`, `For someone who weighs 70 kg on Earth. Gravity is ${((sc.gOverride || w.g) / 9.81).toFixed(2)}× Earth's${sc.moon ? " on the imagined moon you stand on" : sc.ground === "clouds" ? " at the cloud-top level" : ""}${w.RpAssumed ? ", assuming an Earth-like size (the radius is unknown)" : ""}${w.MpAssumed ? ", from a mass estimated from its size" : ""}.`);
  { const mf = moonFate(w), yrs = t => t > 1e12 ? "far longer than the age of the universe" : t > 1e9 ? `about ${Math.round(t / 1e9)} billion years` : t > 1e6 ? `about ${Math.round(t / 1e6)} million years` : t > 1e3 ? `about ${Math.round(t / 1e3)} thousand years` : "a few years";
    if (!SOLAR.includes(w)) n("Moons?", 3, mf.ok ? "None known; one could survive" : "Unlikely: tides would remove one", mf.ok ? `No moon has been found around any exoplanet. A large moon could survive here: tides would take ${yrs(mf.t)} to pull it away (after Barnes & O'Brien 2002). An imagined one is drawn in the sky.` : mf.room === false ? "The planet's gravitational reach is too small for a moon to orbit outside it." : `Tides from its star would pull a large moon away within ${yrs(mf.t)}, much less than the system's age (Barnes & O'Brien 2002).`); }
  { const edge = w.a < w.hz[0] && w.a > w.hz[0] * 0.79;   // between the conservative inner edge and the optimistic (recent Venus) one, about 1.6× more starlight
    n("Habitable zone", 1, edge ? "Just inside the inner edge" : w.a < w.hz[0] ? "Too close to its star" : w.a > w.hz[1] ? "Too far from its star" : "Inside it", `Where an Earth-like planet could keep liquid water: ${w.hz[0].toFixed(3)}–${w.hz[1].toFixed(3)} AU for this star (Kopparapu et al. 2014). This planet orbits at ${w.a} AU${edge ? ", inside the cautious limit but within the wider, optimistic one that most papers quote" : ""}.`); }
  const RpE = w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, MpE = w.Mu === "MJ" ? w.Mp * 317.8 : w.Mp, vv = valleyOf(RpE, w.P, w.star.M, MpE, !w.MpAssumed && !w.msini);
  if (vv) n("Radius valley", 1, vv.side === "below" ? "Below the valley" : vv.side === "above" ? "Above the valley" : "Inside the valley",
    `At a ${w.P < 2 ? (w.P * 24).toFixed(0) + "-hour" : w.P.toFixed(1) + "-day"} orbit the gap between rocky super-Earths and gassy sub-Neptunes sits near ${vv.Rg.toFixed(2)} R⊕. ${vv.side === "below" ? "Planets this small are usually stripped rocky cores." : vv.side === "above" ? "Planets this large usually keep a hydrogen envelope (or are rich in water)." : "Planets here could be either."}${vv.comp ? " Its measured mass and radius: " + vv.comp + "." : ""}`);
  const sibs = w.siblings.map(s => { const d = Math.abs(s.a - w.a) * AU; return { n: s.name, ang: 2 * Math.asin(s.R * RE / d) / D2R, syn: 1 / Math.abs(1 / w.P - 1 / (w.P * Math.pow(s.a / w.a, 1.5))) }; }).sort((a, b) => b.ang - a.ang);
  if (sibs.length) n("Other worlds in the sky", 1, `${sibs[0].n.replace("TRAPPIST-1", "Planet ")} up to ${sibs[0].ang >= 0.1 ? sibs[0].ang.toFixed(2) + "°" : (sibs[0].ang * 60).toFixed(1) + "′"}`, `${sibs[0].ang > 0.45 ? `At closest approach that's ${(sibs[0].ang / 0.52).toFixed(1)}× the size of our full Moon. ` : ""}It swings by every ${sibs[0].syn.toFixed(1)} days.${sibs.length > 1 ? ` ${sibs.slice(1, 3).map(s => `${s.n.replace("TRAPPIST-1", "Planet ")} reaches ${s.ang >= 0.1 ? s.ang.toFixed(2) + "°" : (s.ang * 60).toFixed(1) + "′"}`).join("; ")}.` : ""} Surfaces unknown, drawn grey.`);
  if (w.points) n("Bright stars", 1, w.points.filter(p => !p.nolabel).map(p => p.name.split(" (")[0]).join(", "), w.id === "proxb" ? "Alpha Centauri A and B, about 13,000 AU away, shine at magnitude −6.6 and −5.3: brighter than Venus ever looks from Earth. Our Sun is an ordinary star (mag 0.4) in Cassiopeia." : "The red dwarf companion, about 216 AU away, would be brighter than anything in Earth's night sky except the Moon.");
  if (sc.Tstand && sc.atm && sc.ground !== "clouds") n("Temperature", 2, `about ${Math.round(sc.Tstand - 273)} °C where you stand`, `From a simple climate model of this scenario's air and ocean, at this spot; colder toward the ${w.locked ? "night side" : "poles"}. Other viewpoints give other temperatures.`);
  else if (sc.temp) n("Temperature", sc.temp[1], sc.temp[0], sc.temp[1] === 2 ? "Assumed by this scenario. Climate depends on an atmosphere we have not measured." : "From the planet's measured or calculated heat balance.");
  else if (!sc.atm && sc.ground !== "lava") { const T = w.star.Teff / Math.sqrt(w.aR) * Math.pow(Math.max(0.01, Math.sin(es * D2R)), 0.25); n("Ground temperature", sc.base === 1 ? 0 : 1, `${Math.round(T)} K (${Math.round(T - 273)} °C)`, sc.tempNote ? sc.tempNote : sc.hot ? "JWST measured a 490 K dayside. Hot enough to melt tin, near the point under the star." : "Bare rock in full starlight with no air to spread the heat. Far colder in shadow and on the night side."); }
  else if (sc.ground === "lava") { const dr = daysideRock(w, sc); n("Ground temperature", dr.why === "measured" ? 0 : 1, `~${Math.round(w.star.Teff / Math.sqrt(w.aR) * Math.pow(Math.max(0.01, Math.sin(es * D2R)), 0.25) * (dr.why === "lava" ? 0.85 : 1))} K`, "Molten rock in full starlight. Rock melts above about 1,600 K." + (dr.why === "lava" ? " Measured lava worlds are cooler than bare rock would be, probably from reflective clouds or vapour (Coy et al. 2026), so 85% of the bare-rock value is used." : "")); }
  n("Air", sc.atm ? sc.base : 1, sc.atm ? `${sc.atm.P >= 0.1 ? sc.atm.P + " bar" : "thin"} ${sc.atm.gas}` : "None", sc.atm ? (sc.base <= 1 ? "Measured or inferred from observations of this planet." : "Assumed for this scenario. Not breathable: no oxygen is expected without life.") : "Vacuum. No wind, no sound.");
  n("Weather", sc.base, { rain: "Rain", snow: "Snow crystals", glass: "Sideways glass rain?", dust: "Dust storms", none: "None", sparks: "Rock vapour" }[sc.weather], sc.wx);
  n("Life?", 3, sc.life.startsWith("No") ? "No" : "Unknown", `${sc.life} No life has been found beyond Earth, and no exoplanet's oxygen has been measured. The dial's biology stops show imagined life wherever liquid water is possible; animals appear only where oxygen-rich air is assumed.`);
  $("notes").innerHTML = items.join("");
}
function recipeTable() {
  const w = cur, sc = curSc(), rc = recipe(w, sc);
  $("r-title").textContent = `The recipe for ${dispName(w)}: ${sc.name.toLowerCase()}`;
  $("r-body").innerHTML = rc.rules.map(r => `<tr><td class="in">${r.input}</td><td>${r.r}</td><td>${r.effect}</td><td><span class="tag ${["t-m", "t-d", "t-sc", "t-im"][r.lvl]}">${r.lvl === 1 ? "rule" : TAGN[r.lvl]}</span></td></tr>`).join("");
}

// ================= Viewpoints =================
// Several spots on one planet. Each viewpoint is a copy of the scenario with a new location, and the ground follows the physics there.
let vp = 0;
function viewpoints(w, sc) {
  // every planet offers the same four places in the same order, counted from the point under the star. On a planet whose spin is unknown
  // they are times of day at the scenario's latitude. The scenario's own spot takes the place of the one nearest to it
  const lk = w.locked, la = l => lk ? l : sc.lat;
  const P = [{ label: lk ? "Under the star" : "Noon", theta: 6, lat: la(4) }, { label: lk ? "Day side" : "Afternoon", theta: 50, lat: la(10) },
    { label: lk ? "Day–night line" : "Sunset", theta: 88, lat: la(6) }, { label: lk ? "Night side" : "Night", theta: 150, lat: la(8) }];
  const k = sc.theta < 15 ? 0 : sc.theta < 80 ? 1 : sc.theta < 100 ? 2 : 3;
  P[k] = { ...P[k], theta: sc.theta, lat: sc.lat, own: true };
  return P;
}
// time of day on a spinning planet (hours, set by the slider); null = the scenario's own. Locked planets keep their fixed sky
let tod = null;
function curSc() { const s = curSc0(), w = cur; if (tod == null || w.locked || zoom < 2) return s;
  w._vpc = w._vpc || {}; const key = si + ":" + vp + ":t" + tod; return w._vpc[key] || (w._vpc[key] = { ...s, theta: Math.abs(tod - 12) * 15 + 0.01, tod }); }
function curSc0() {
  const w = cur, sc = w.scenarios[si], vps = viewpoints(w, sc), v = vps[Math.min(vp, vps.length - 1)];
  if (!v || v.own) return sc;
  w._vpc = w._vpc || {}; const key = si + ":" + vp; if (w._vpc[key]) return w._vpc[key];
  const s = { ...sc, theta: v.theta, lat: v.lat, vpLabel: v.label, lifeParent: sc.ground === "ocean" && !sc.noPlants && !!sc.atm };   // the scenario has life: its other spots get life suited to them
  const mu = Math.cos(v.theta * D2R) * Math.cos(v.lat * D2R), ang = Math.acos(Math.max(-1, Math.min(1, mu))) / D2R;
  if (sc.climate) { const x = sc.climate.locked ? mu : Math.cos(v.lat * D2R) / Math.PI; s.Tstand = sc.climate.T(x); s.temp = [`about ${Math.round(s.Tstand)} K here (simple climate model)`, 2]; }
  if (sc.ground === "ocean" && !sc.land && sc.oceanDeg) {
    if (ang > sc.oceanDeg + 2) Object.assign(s, { ground: "ice", weather: s.atm ? "snow" : "none", plants: false, floes: false, clouds: 0.15 });
    else if (ang < sc.oceanDeg - 10) Object.assign(s, { weather: "rain", clouds: Math.min(0.9, (sc.clouds || 0.5) * 1.4), floes: false });
  }
  if (sc.ground === "ocean" && sc.land === 1 && v.lat > (sc.iceLat || 90)) Object.assign(s, { ground: "ice", weather: "snow", plants: false });
  if (sc.ground === "lava") { const Tl = w.star.Teff / Math.sqrt(w.aR) * Math.pow(Math.max(0, mu), 0.25); if (Tl < 1500) Object.assign(s, { ground: "rock", rockMat: "basalt", weather: "none" }); s.temp = [`about ${Math.round(Math.max(40, Tl))} K here`, 1]; }
  if (!s.atm && sc.ground !== "lava" && !isGiantScene(sc)) { const Tl = w.star.Teff / Math.sqrt(w.aR) * Math.pow(Math.max(0, mu), 0.25); s.temp = [mu > 0 ? `about ${Math.round(Tl)} K here` : "very cold: no sunlight, no air to carry heat", 1]; }
  return (w._vpc[key] = s);
}

// ================= Key facts =================
// Discovery year, method and paper, spectral type, distance and age from the NASA Exoplanet Archive composite table (2026-10-27)
const DISC = {"55 Cnc e":[2004,"Radial Velocity","McArthur et al. 2004","https://ui.adsabs.harvard.edu/abs/2004ApJ...614L..81M/abstract","G8 V",12.5855,5.5],"GJ 1214 b":[2009,"Transit","Charbonneau et al. 2009","https://ui.adsabs.harvard.edu/abs/2009Natur.462..891C/abstract","M4 V",14.6427,3.0],"GJ 486 b":[2021,"Radial Velocity","Trifonov et al. 2021","https://ui.adsabs.harvard.edu/abs/2021Sci...371.1038T/abstract","M3.5 V",8.07426,4.0],"HD 189733 b":[2005,"Radial Velocity","Bouchy et al. 2005","https://ui.adsabs.harvard.edu/abs/2005A&A...444L..15B/abstract","K2 V",19.7638,1.4],"HD 209458 b":[1999,"Radial Velocity","Henry et al. 2000","https://ui.adsabs.harvard.edu/abs/2000ApJ...529L..41H/abstract","G0 V",48.3016,3.1],"K2-18 b":[2015,"Transit","Montet et al. 2015","https://ui.adsabs.harvard.edu/abs/2015ApJ...809...25M/abstract","M2.5 V",38.0266,null],"K2-266 c":[2018,"Transit","Rodriguez et al. 2018","https://ui.adsabs.harvard.edu/abs/2018AJ....156..245R/abstract","",77.5586,null],"K2-36 b":[2016,"Transit","Sinukoff et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...827...78S/abstract","K2 V",109.749,1.4],"KOI-3503 c":[2021,"Transit","Jontof-Hutter et al. 2021","https://ui.adsabs.harvard.edu/abs/2021AJ....161..246J/abstract","",887.064,11.48],"Kepler-10 b":[2011,"Transit","Batalha et al. 2011","https://ui.adsabs.harvard.edu/abs/2011ApJ...729...27B/abstract","",185.506,10.6],"Kepler-1229 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",265.482,3.72],"Kepler-1244 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",1075.81,1.7],"Kepler-1284 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",882.324,4.47],"Kepler-1306 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",1107.5,4.57],"Kepler-1323 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",465.417,3.55],"Kepler-1582 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",78.8906,7.76],"Kepler-16 b":[2011,"Transit","Doyle et al. 2011","https://ui.adsabs.harvard.edu/abs/2011Sci...333.1602D/abstract","",75.0852,3.8],"Kepler-1605 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",546.23,4.68],"Kepler-1616 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",1137.81,2.75],"Kepler-186 f":[2014,"Transit","Quintana et al. 2014","https://ui.adsabs.harvard.edu/abs/2014Sci...344..277Q/abstract","M1",177.594,4.0],"Kepler-324 b":[2014,"Transit","Rowe et al. 2014","https://ui.adsabs.harvard.edu/abs/2014ApJ...784...45R/abstract","",501.574,3.39],"Kepler-395 c":[2014,"Transit","Rowe et al. 2014","https://ui.adsabs.harvard.edu/abs/2014ApJ...784...45R/abstract","",421.382,1.6],"Kepler-452 b":[2015,"Transit","Jenkins et al. 2015","https://ui.adsabs.harvard.edu/abs/2015AJ....150...56J/abstract","G2",551.727,6.0],"Kepler-62 f":[2013,"Transit","Borucki et al. 2013","https://ui.adsabs.harvard.edu/abs/2013Sci...340..587B/abstract","K2 V",300.874,7.0],"LHS 1140 b":[2017,"Transit","Dittmann et al. 2017","https://ui.adsabs.harvard.edu/abs/2017Natur.544..333D/abstract","M4.5 V",14.9861,5.0],"LHS 3844 b":[2019,"Transit","Vanderspek et al. 2019","https://ui.adsabs.harvard.edu/abs/2019ApJ...871L..24V/abstract","M4.5-M5.0",14.8846,7.8],"LP 890-9 b":[2022,"Transit","Delrez et al. 2022","https://ui.adsabs.harvard.edu/abs/2022A&A...667A..59D/abstract","M6 V",32.4298,7.2],"Proxima Cen b":[2016,"Radial Velocity","Anglada-Escudé et al. 2016","https://ui.adsabs.harvard.edu/abs/2016Natur.536..437A/abstract","M5.5 V",1.30119,null],"TOI-270 d":[2019,"Transit","G&uuml;nther et al. 2019","https://ui.adsabs.harvard.edu/abs/2019NatAs...3.1099G/abstract","M3 V",22.4793,null],"TRAPPIST-1 b":[2016,"Transit","Gillon et al. 2016","https://ui.adsabs.harvard.edu/abs/2016Natur.533..221G/abstract","M8.0 V",12.42988881,7.6],"TRAPPIST-1 e":[2017,"Transit","Gillon et al. 2017","https://ui.adsabs.harvard.edu/abs/2017Natur.542..456G/abstract","M8.0 V",12.42988881,7.6],"WASP-107 b":[2017,"Transit","Anderson et al. 2017","https://ui.adsabs.harvard.edu/abs/2017A&A...604A.110A/abstract","K6",64.7414,3.4],"WASP-121 b":[2016,"Transit","Delrez et al. 2016","https://ui.adsabs.harvard.edu/abs/2016MNRAS.458.4025D/abstract","F6 V",269.898,1.11],"WASP-39 b":[2011,"Transit","Faedi et al. 2011","https://ui.adsabs.harvard.edu/abs/2011arXiv1102.1375F/abstract","",213.982,8.5],"bet Pic b":[2008,"Imaging","Lagrange et al. 2009","https://ui.adsabs.harvard.edu/abs/2009A&A...493L..21L/abstract","A6 V",19.7442,0.023],"CoRoT-1 b":[2008,"Transit","Barge et al. 2008","https://ui.adsabs.harvard.edu/abs/2008A&A...482L..17B/abstract","G0 V",787.909,1.6],"HAT-P-57 b":[2015,"Transit","Hartman et al. 2015","https://ui.adsabs.harvard.edu/abs/2015AJ....150..197H/abstract","A8 V",279.86,1.0],"HAT-P-63 b":[2021,"Transit","Bakos et al. 2021","https://ui.adsabs.harvard.edu/abs/2021AJ....162....7B/abstract","",403.458,9.0],"HD 213885 b":[2019,"Transit","Espinoza et al. 2020","https://ui.adsabs.harvard.edu/abs/2020MNRAS.491.2982E/abstract","G",48.0883,3.8],"HIP 41378 d":[2016,"Transit","Vanderburg et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...827L..10V/abstract","F6",106.289,2.07],"K2-100 b":[2016,"Transit","Mann et al. 2017","https://ui.adsabs.harvard.edu/abs/2017AJ....153...64M/abstract","G0 V",188.959,0.75],"K2-101 b":[2016,"Transit","Mann et al. 2017","https://ui.adsabs.harvard.edu/abs/2017AJ....153...64M/abstract","K3",188.33,0.79],"K2-155 d":[2018,"Transit","Hirano et al. 2018","https://ui.adsabs.harvard.edu/abs/2018AJ....155..124H/abstract","K7",72.7998,null],"K2-288 B b":[2018,"Transit","Feinstein et al. 2019","https://ui.adsabs.harvard.edu/abs/2019AJ....157...40F/abstract","M3 V",65.6138,1.0],"K2-58 c":[2016,"Transit","Crossfield et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJS..226....7C/abstract","",181.746,null],"Kepler-1017 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",552.058,2.95],"Kepler-1090 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",858.77,4.37],"Kepler-1311 d":[2021,"Transit","Valizadegan et al. 2022","https://ui.adsabs.harvard.edu/abs/2022ApJ...926..120V/abstract","",866.331,7.59],"Kepler-1318 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",475.248,4.57],"Kepler-146 c":[2014,"Transit","Rowe et al. 2014","https://ui.adsabs.harvard.edu/abs/2014ApJ...784...45R/abstract","",716.797,0.91],"Kepler-1515 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",539.321,1.82],"Kepler-1518 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",903.51,1.48],"Kepler-1518 c":[2023,"Transit","Valizadegan et al. 2023","https://ui.adsabs.harvard.edu/abs/2023AJ....166...28V/abstract","",903.51,1.48],"Kepler-1634 b":[2016,"Transit","Morton et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...822...86M/abstract","",617.339,4.47],"Kepler-1654 b":[2018,"Transit","Beichman et al. 2018","https://ui.adsabs.harvard.edu/abs/2018AJ....155..158B/abstract","G5 V",568.117,5.0],"Kepler-1704 b":[2021,"Transit","Dalba et al. 2021","https://ui.adsabs.harvard.edu/abs/2021AJ....162..154D/abstract","",835.455,7.4],"Kepler-1714 b":[2021,"Transit","Valizadegan et al. 2022","https://ui.adsabs.harvard.edu/abs/2022ApJ...926..120V/abstract","",409.46,2.29],"Kepler-1785 b":[2021,"Transit","Valizadegan et al. 2022","https://ui.adsabs.harvard.edu/abs/2022ApJ...926..120V/abstract","",745.74,0.3],"Kepler-1831 b":[2021,"Transit","Valizadegan et al. 2022","https://ui.adsabs.harvard.edu/abs/2022ApJ...926..120V/abstract","",1053.49,0.3],"Kepler-450 c":[2015,"Transit","Van Eylen & Albrecht 2015","https://ui.adsabs.harvard.edu/abs/2015ApJ...808..126V/abstract","",455.982,2.57],"LHS 1903 e":[2026,"Transit","Wilson et al. 2026","https://ui.adsabs.harvard.edu/abs/2026Sci...392l2348W/abstract","M",35.6917,7.08],"TIC 172900988 b":[2021,"Transit","Kostov et al. 2021","https://ui.adsabs.harvard.edu/abs/2021AJ....162..234K/abstract","F9",250.956,3.1],"TOI-1855 b":[2024,"Transit","Schulte et al. 2024","https://ui.adsabs.harvard.edu/abs/2024AJ....168...32S/abstract","",176.833,8.2],"TOI-2169 A b":[2025,"Transit","Yee et al. 2025","https://ui.adsabs.harvard.edu/abs/2025ApJS..280...30Y/abstract","",351.487,2.51],"TOI-2180 b":[2022,"Transit","Dalba et al. 2022","https://ui.adsabs.harvard.edu/abs/2022AJ....163...61D/abstract","G5",116.685,8.1],"TOI-2338 b":[2023,"Transit","Brahm et al. 2023","https://ui.adsabs.harvard.edu/abs/2023AJ....165..227B/abstract","",313.996,7.0],"WASP-87 b":[2016,"Transit","Addison et al. 2016","https://ui.adsabs.harvard.edu/abs/2016ApJ...823...29A/abstract","",298.392,null],"WD 1856+534 b":[2020,"Transit","Vanderburg et al. 2020","https://ui.adsabs.harvard.edu/abs/2020Natur.585..363V/abstract","DC",24.7359,7.93]};
const ARCH = { "Proxima b": "Proxima Cen b", "β Pictoris b": "bet Pic b", "55 Cancri e": "55 Cnc e" };
// names as shown to readers: archive style ("TRAPPIST-1 e"), except the popular names of a few hand-checked planets
const dispName = w => (typeof SOLAR !== "undefined" && SOLAR.includes(w)) || ARCH[w.name] ? w.name : w.name.replace(/(\d)([a-z])$/, "$1 $2");
const archName = w => ARCH[w.name] || w.name.replace(/(\S)([a-z])$/, "$1 $2");
const lnk = (t, u) => u ? `<a href="${u}" target="_blank" rel="noopener">${t}</a>` : t;
const KEYREFS = {
  t1e: [["Agol et al. 2021", "https://arxiv.org/abs/2010.01074"], ["Espinoza et al. 2025"], ["Glidden et al. 2025", "https://arxiv.org/abs/2509.05407"]],
  t1b: [["Greene et al. 2023", "https://arxiv.org/abs/2303.14849"], ["Ducrot et al. 2024"], ["Gillon et al. 2025", "https://arxiv.org/abs/2509.02128"]],
  proxb: [["Howard et al. 2018 (flares)", "https://arxiv.org/abs/1804.02001"], ["Suárez Mascareño et al. 2025"]],
  l1140: [["Cadieux et al. 2024a", "https://arxiv.org/abs/2310.15490"], ["Cadieux et al. 2024b", "https://arxiv.org/abs/2406.15136"], ["Damiano et al. 2024"]],
  k10b: [["Bonomo et al. 2025", "https://arxiv.org/abs/2502.07996"], ["Rouan et al. 2011", "https://arxiv.org/abs/1109.2768"]],
  hd189: [["Evans et al. 2013 (colour)", "https://arxiv.org/abs/1307.3239"], ["Fu et al. 2024 (H₂S)", "https://arxiv.org/abs/2407.06163"], ["Louden & Wheatley 2015 (winds)"]],
  k16b: [["Doyle et al. 2011", "https://arxiv.org/abs/1109.3432"], ["Triaud et al. 2022 (mass from the stars' wobble)", "https://arxiv.org/abs/2112.06584"]],
  w39: [["JWST ERS Team 2023 (CO₂)", "https://arxiv.org/abs/2208.11692"], ["Tsai et al. 2023 (SO₂)", "https://arxiv.org/abs/2211.10490"], ["Espinoza et al. 2024", "https://arxiv.org/abs/2407.10294"]],
  w121: [["Mikal-Evans et al. 2023", "https://arxiv.org/abs/2301.03209"], ["Evans-Soma et al. 2025 (SiO, night-side methane)"], ["Gapp et al. 2025", "https://arxiv.org/abs/2506.02199"]],
  hd209: [["Charbonneau et al. 2002 (sodium)"], ["Vidal-Madjar et al. 2003 (escaping hydrogen)"], ["Xue et al. 2024 (JWST)", "https://arxiv.org/abs/2310.03245"]],
  w107: [["Sing et al. 2024"], ["Welbanks et al. 2024"]],
  bpic: [["Snellen et al. 2014 (spin)"], ["Landman et al. 2024"], ["Ravet et al. 2025 (GRAVITY)", "https://arxiv.org/abs/2509.25338"]],
  lhs3844: [["Kreidberg et al. 2019"], ["Zieba et al. 2026 (JWST surface spectrum)"]],
  t270d: [["Benneke et al. 2024"], ["Holmberg & Madhusudhan 2024"]],
  k218: [["Madhusudhan et al. 2023", "https://arxiv.org/abs/2309.05566"], ["Madhusudhan et al. 2025 (DMS claim)"], ["Schmidt et al. 2025", "https://arxiv.org/abs/2501.18477"], ["Luque et al. 2025 (no significant DMS)", "https://arxiv.org/abs/2505.13407"], ["Hu et al. 2025", "https://arxiv.org/abs/2507.12622"]],
  k452b: [["Mullally et al. 2018 (validation questioned)", "https://arxiv.org/abs/1803.11307"]],
  "55cnce": [["Hu et al. 2024 (atmosphere)", "https://boris.unibe.ch/196653"], ["Patel et al. 2024 (variability)", "https://arxiv.org/abs/2407.12898"]],
  gj1214b: [["Kempton et al. 2023 (reflective haze)", "https://arxiv.org/abs/2305.06240"], ["Ohno et al. 2025 (metal-rich air?)"]],
  k186f: [["Quintana et al. 2014"], ["Bolmont et al. 2014 (climate, spin)", "https://arxiv.org/abs/1404.4368"]],
  // catalogue planets, by name
  "Kepler-442 b": [["Torres et al. 2015"]],
  "Kepler-62 f": [["Kaltenegger et al. 2013 (water world?)"], ["Shields et al. 2016 (climate)", "https://arxiv.org/abs/1603.01272"]],
  "K2-141 b": [["Zieba et al. 2022 (magma ocean)"]],
  "KELT-9 b": [["Hoeijmakers et al. 2018 (iron, titanium)"], ["Wong et al. 2020 (4,600 K day side)", "https://arxiv.org/abs/1910.01607"]],
  "WASP-76 b": [["Ehrenreich et al. 2020 (iron rain?)"], ["Kesseli & Snellen 2021"], ["Savel et al. 2022 (or a hot evening limb)"]],
};
const specFromT = T => T >= 7300 ? "A" : T >= 6000 ? "F" : T >= 5300 ? "G" : T >= 3900 ? "K" : "M";
function factsPanel() {
  const w = cur, sc = curSc(), d = DISC[archName(w)] || w.disc || [];
  const RpE = w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, MpE = w.Mu === "MJ" ? w.Mp * 317.8 : w.Mp, rho = MpE / RpE ** 3 * 5.51;
  const big = RpE > 6;
  // temperature: measured where known, else the giant model's day–night range, else equilibrium with the airless substellar maximum
  let temp = `${Math.round(w.Teq)} K`, tnote = "equilibrium (no albedo)";
  if (isGiantScene(sc)) { const m = giantOf(w).m; if (m.locked) { temp = `${Math.round(m.Tnight)}–${Math.round(m.Tday)} K`; tnote = "night side to day side"; } else if (m.Tint) { temp = `~${Math.round(m.Tint)} K`; tnote = "glow from internal heat"; } }
  else if (w.locked && !sc.atm) { temp = `${Math.round(w.Teq)}–${Math.round(w.star.Teff / Math.sqrt(w.aR))} K`; tnote = "equilibrium to hottest point (no air); night side far colder"; }
  if (w.id === "t1b") { temp = "490 ± 17 K"; tnote = "dayside, measured by JWST"; }
  if (w.id === "lhs3844") { temp = "1,040 K"; tnote = "dayside, measured by Spitzer; night side cold"; }
  if (w.id === "w121") { temp = "926–1,122 K night"; tnote = "night side measured by JWST; day side far hotter"; }
  if (sc.climate) tnote += `; ${Math.round(sc.climate.T0)} K at the warmest point in this scenario`;
  const dist = d[5] || w.dist, age = d[6] || w.age;
  const spt = d[4] || `${specFromT(w.star.Teff)}-type`;
  const cells = [
    [big ? `${(RpE / 11.21).toFixed(2)} R♃` : `${RpE.toFixed(2)} R⊕`, `size${w.RpAssumed ? " (calculated from mass: no transit)" : ""}`, big ? `${RpE.toFixed(1)} Earth radii` : `${Math.round(RpE * 6371 * 2).toLocaleString()} km across`],
    [big ? `${(MpE / 317.8).toFixed(2)} M♃` : `${MpE.toFixed(2)} M⊕`, w.msini ? "minimum mass" : w.MpAssumed ? "mass (assumed from size)" : "mass", `density ${rho.toFixed(rho < 1 ? 2 : 1)} g/cm³`],
    [temp, "temperature", tnote],
    [w.P < 2 ? `${(w.P * 24).toFixed(1)} h` : w.P < 1000 ? `${w.P.toFixed(1)} d` : `${(w.P / 365.25).toFixed(1)} yr`, "year (orbit)", `${w.a < 0.1 ? w.a.toFixed(4) : w.a.toFixed(2)} AU${w.locked ? " · tidally locked" : ""}`],
    [`${w.star.name}`, `star: ${spt}${w.star2 ? " + " + w.star2.name : ""}`, `${w.star.Teff} K · ${w.star.M ? w.star.M.toFixed(2) + " M☉ · " : ""}${w.star.Rs.toFixed(2)} R☉${age ? " · " + age + " Gyr" : ""}`],
    [dist ? `${Math.round(dist * 3.26156).toLocaleString()} ly` : "—", "distance", dist ? `${dist.toFixed(1)} pc` : ""],
    [d[0] ? `${d[0]}` : "—", "discovered", d[1] ? `${d[1]}` : ""],
  ];
  // how well studied: papers that fitted it and spectra taken (archive counts); only shown for catalogue planets
  const li = CAT_IX.get(archName(w)), nP = li != null ? LIT_N[li] : 0, nS = li != null ? LIT_SPEC[li] || 0 : 0;
  if (nP) cells.push([nP >= 99 ? "99+" : `${nP}`, nP === 1 ? "paper with its numbers" : "papers with its numbers",
    nS ? `${nS} spectr${nS === 1 ? "um" : "a"} taken${sc.spot || !w.auto ? "; checked against them" : ""}` : nP === 1 ? "known only from its discovery" : "no spectra yet"]);
  $("facts").innerHTML = cells.map(([b, s1, s2]) => `<div><b>${b}</b><span>${s1}</span>${s2 ? `<small>${s2}</small>` : ""}</div>`).join("");
  const refs = [...(d[2] ? [[`${d[2]} (discovery)`, d[3]]] : []), ...(KEYREFS[w.id] || KEYREFS[archName(w)] || [])];
  $("papers").innerHTML = refs.length ? `<b>Key papers</b>` + refs.map(r => `<span>${lnk(r[0], r[1])}</span>`).join("") : "";
  if (isGiantScene(w.scenarios[0] || {})) {
    if (!TWIN) { const me = w; setTimeout(() => { buildTwins(); if (cur === me) factsPanel(); }, 400); }
    else { const t = twinOf(w); if (t) { $("papers").insertAdjacentHTML("beforeend", `<span class="twin">Looks most like <a href="#" data-twin="${t.name}">${t.name}</a>${t.d < 0.04 ? ": practically identical (similar temperature, gravity and star, so the physics says they should look alike)" : t.d < 0.1 ? ": very similar" : ""}</span>`); $("papers").querySelector("[data-twin]").onclick = e => { e.preventDefault(); openWorld(catWorld(e.target.dataset.twin)); }; } }
  }
}

