// The trace (v4): for one planet and one world, what every step of the recipe took in and gave out, read from the same values the drawing
// code uses (deriveWorld, autoWorld's autoInfo, climate, lighting, skySampler, recipe's rules, the giant model's notes). Two things are
// built from it: "Why it looks like this" in the planet panel (and the box that opens when you click the picture), and the per-planet
// column on "How a picture is made". Nothing here recomputes a rule: if a value is not in the engine's output, it is not in the trace.
const STEP_TITLES = [null, "The numbers we start from", "The star's light", "Temperature from starlight", "What kind of planet", "Day and night", "Can it keep air",
  "Which worlds are shown", "Climate of a rocky world", "Giants and other worlds of gas", "Lava worlds", "The colour of the sky and of daylight", "The ground", "Other things in the sky",
  "The planet from space", "Imagined life", "Randomness", "Does it work?"];
const stepLink = n => `<a class="step" href="recipe.html#step${n}" data-step="${n}">Step ${n}</a>`;

// a colour in words, from linear display RGB
function colourName(rgb) {
  const m = Math.max(...rgb); if (m < 2e-3) return "black";
  const [r, g, b] = rgb.map(v => Math.pow(Math.max(0, v) / m, 1 / 2.2)), mx = Math.max(r, g, b), mn = Math.min(r, g, b), s = (mx - mn) / mx;
  let h = 0; if (mx !== mn) { h = mx === r ? ((g - b) / (mx - mn)) % 6 : mx === g ? (b - r) / (mx - mn) + 2 : (r - g) / (mx - mn) + 4; h *= 60; if (h < 0) h += 360; }
  if (s < 0.07) return m < 0.08 ? "dark grey" : "white";
  const hue = h < 18 || h >= 335 ? "red" : h < 42 ? "orange" : h < 68 ? "yellow" : h < 160 ? "green" : h < 200 ? "turquoise" : h < 262 ? "blue" : h < 300 ? "violet" : "pink";
  const tone = m < 0.05 ? "dark " : s < 0.22 ? "pale " : "";
  return tone + hue === "pale red" ? "pale pink" : tone + hue;
}
const starColourWord = T => T < 3200 ? "orange-red" : T < 3900 ? "amber" : T < 5300 ? "warm, faintly golden" : T < 6200 ? "white, like the Sun" : "white with a touch of blue";
const blueShare = T => T < 3200 ? "almost no blue light" : T < 3900 ? "very little blue light" : T < 5000 ? "less blue light than the Sun" : T < 6300 ? "as much blue light as the Sun" : "more blue light than the Sun";
const xTimes = f => f >= 100 ? `${nf(Math.round(f / (f > 1000 ? 100 : 10)) * (f > 1000 ? 100 : 10))} times` : f >= 1.5 ? `${nf(f, f < 10 ? 1 : 0)} times` : f > 0.8 ? "about the same as" : f >= 0.01 ? `${nf(f * 100, f < 0.1 ? 1 : 0)}% of` : "less than 1% of";
// the same rules, run for a hand-checked planet: the engine's own rule function, so the hand planets show what the rules would say
function rulesInfo(w) {
  if (w.autoInfo) return w.autoInfo;
  if (w._ri !== undefined) return w._ri;
  try { const a = autoWorld({ id: "ri", name: "rules-" + w.name, host: w.star.name, Teff: w.star.Teff, Rs: w.star.Rs, Ms: w.star.M || 1, age: w.age, a: w.a, P: w.P, Rp: rE(w), Mp: w.MpAssumed ? null : mE(w), e: w.e });
    w._ri = { ...a.autoInfo, ruleNames: a.scenarios.map(s => s.name) }; } catch (e) { w._ri = null; }
  return w._ri;
}
// which step each of the recipe's rule lines belongs to (scene-recipe.js); the build check fails if a line matches none
const RULE_STEP = [[7, /scenarios? (chosen|for|are)|Class and/i], [15, /Plant form|plant|vegetation|Shrub|biome|usable light|Photosynthesis|Biology control|microb|Animals? |animal|oxygen and time|meadow|Blooms|pigment|grows|forest|floater|swimmer|bird|hide|herd|eat/i],
  [13, /aurora/i], [5, /The star never moves|time of day/i], [8, /energy balance|Thick convective clouds|ice edge|ice cap|Open ocean within|greenhouse/i],
  [11, /cloud|haze|sky|rain|snow|scale height|Rayleigh|dust in the air|deck/i],
  [12, /./]];
const ruleStep = r => RULE_STEP.find(([, re]) => re.test(r.input + " " + r.r + " " + r.effect))[0];

function traceOf(w, sc, opt = {}) {
  const T = { steps: {}, why: {}, w, sc }, put = (n, label, value, src) => (T.steps[n] = T.steps[n] || []).push({ label, value: n > 2 ? kToC(value) : value, src });
  const K = knownOf(w), row = K.row, ri = rulesInfo(w), R = rE(w), M = mE(w), sol = isSolar(w), giant = isGiantScene(sc), gm = giant ? giantOf(w, sc).m : null;
  const Lt = opt.Lt || lighting(w, sc), rc = opt.rc || recipe(w, sc), name = dispName(w), an = archName(w);
  const starSrc = w.auto && row && catStar(row).notes.length ? 1 : 0;

  // 1 the numbers
  put(1, "Star", `${w.star.name}: ${nf(w.star.Teff)}${NK}K, ${nf(w.star.Rs, 2)} × the Sun's radius, ${nf(w.star.M || 1, 2)} × its mass`, starSrc);
  if (starSrc) put(1, "Filled in", `The catalogue lacks the ${listAnd(catStar(row).notes)}; ${catStar(row).notes.length > 1 ? "they are" : "it is"} estimated from the star's other values`, 1);
  put(1, "Orbit", `${nf(w.a, w.a < 0.1 ? 4 : w.a < 10 ? 3 : 0)} AU from the star, one orbit in ${yearOf(w)}`, row && (!row[6] || !row[7]) ? 1 : 0);
  put(1, "Size", `${nf(R, 2)} × Earth's radius, ${K.sizeHow}`, K.rMeas ? 0 : 1);
  put(1, "Mass", M ? `${nf(M, M < 10 ? 2 : 0)} × Earth's mass, ${K.massHow}` : "unknown", K.mMeas ? 0 : 1);
  if (w.age) put(1, "Age of the system", `${nf(w.age, w.age < 1 ? 2 : 1)} billion years${w.auto && row && !row[5] ? " (not in the catalogue: 5 billion years is used)" : ""}`, row && !row[5] ? 2 : 0);
  if (typeof DATA_FIX !== "undefined" && DATA_FIX[an]) put(1, "Corrected by hand", DATA_FIX[an].why || "A catalogue value for this planet is replaced by a published one", 0);
  if (!w.auto && !sol) put(1, "Source", "This planet's numbers come from the papers in its reference list, not from the catalogue", 0);
  for (const c of (w.checks || [])) put(1, "Warning", c[1], 1);

  // 2 the star's light
  const ang = w.angDeg, starCol = starColourWord(w.star.Teff);
  put(2, "Size in the sky", `${nf(ang, ang < 1 ? 2 : 1)}° across, ${xTimes(ang / 0.533)} the Sun as seen from Earth`, 1);
  put(2, "Starlight arriving", `${xTimes(w.S)} what Earth gets in total; ${xTimes(w.vis)} Earth's in light the eye can see`, 1);
  put(2, "Colour of the star", `${starCol} (after the eye has partly adjusted to it)`, 1);
  if (w.star2) put(2, "Second star", `${w.star2.name || "a companion"}: ${nf(w.star2.Teff)}${NK}K, ${nf(w.ang2, 2)}° across${w.star2.assumed ? " (its size and temperature are not in the catalogue and are assumed)" : ""}`, w.star2.assumed ? 2 : 0);
  if (w.star.Teff < 2000) T.why.star = { step: 2, src: 1, t: `There is no sun in this sky. ${w.star.name} is a brown dwarf at ${nf(w.star.Teff)}${NK}K, too cool to shine visibly: it gives off almost all its light as infrared, which our eyes cannot see. At most it would be a faint, deep-red point ${nf(ang, 2)}° across.` }; else
  T.why.star = { step: 2, src: 1, t: `${ang > 15 ? "Enormous" : ang > 2.5 ? "Several times wider than our Sun looks" : ang > 0.8 ? "Larger than our Sun looks" : ang > 0.35 ? "About as large as our Sun looks" : ang > 0.05 ? "Small" : "A brilliant point"}: ${nf(ang, ang < 1 ? 2 : 1)}° across, ${xTimes(ang / 0.533)} the Sun as we see it, because the planet is ${w.aR < 60 ? "only " : ""}${nf(w.aR, w.aR < 10 ? 1 : 0)} times the star's own radius away from it. Its light is ${starCol}, because the star's surface is at ${nf(w.star.Teff)}${NK}K${w.star.Teff < 5000 ? `, cooler than the Sun's 5,770${NK}K` : w.star.Teff > 6300 ? `, hotter than the Sun's 5,770${NK}K` : ""}.`
    + (Lt.es < -1 ? " From where you stand it is below the horizon." : Lt.es < 6 ? ` From here it sits on the horizon, ${Lt.es < 2 ? "half set and " : ""}dimmed and reddened by the long path of air its light crosses${Lt.tau + Lt.dust > 0.3 ? ", so it looks far smaller and fainter than it would overhead" : ""}.` : "") + (Lt.es >= 6 && Lt.dust > 0.3 ? " Haze softens its edge and spreads its glow." : "") + (Lt.es < 6 ? "" : w.locked && !(gm && gm.rotH) ? ` It stays fixed ${Math.round(Lt.es)}° above the horizon, because the planet keeps one face to it.` : "") + (w.star2 ? ` A second star shares the sky${w.star2.assumed ? " (its look is assumed)" : ""}.` : "") };

  // 3 temperature
  put(3, "Temperature from starlight", `${cK(w.Teq)}, if the planet reflected nothing and spread the heat evenly`, 1);
  if (gm && gm.Tint > 50) put(3, "Its own heat", `${cK(gm.Tint)}${(GIANT.MEAS[an] || GIANT.MEAS[w.name] || {}).Tint ? ", measured from its glow" : ", from its mass and age"}; together with starlight ${cK(gm.Teq)}`, (GIANT.MEAS[an] || GIANT.MEAS[w.name] || {}).Tint ? 0 : 1);

  // 4 kind
  const cat = categorize(w), vv = valleyOf(R, w.P, w.star.M, M, K.mMeas && !w.msini);
  put(4, "Type", `${cat.name}: ${lc1(cat.subName)}`, 1);
  if (vv) put(4, "Radius valley", `The dividing size at this orbit is ${nf(vv.Rg, 2)} Earth radii; this planet is ${vv.side === "in" ? "inside the band where either kind is possible" : vv.side + " it"}${vv.comp ? `. Its size and mass: ${vv.comp}` : ""}`, 1);
  if (M && K.mMeas && K.rMeas) put(4, "Density", `${nf(M / R ** 3 * 5.51, M / R ** 3 * 5.51 < 1 ? 2 : 1)} g/cm³ (Earth 5.5, Jupiter 1.3)`, 1);
  if (opt.odds) { const o = categoryOdds(w); if (o) put(4, "How sure the type is", o.filter(x => x[1] >= 0.03).slice(0, 4).map(x => `${lc1(x[0].replace(/^.* › /, ""))} ${x[1] >= 0.995 ? "over 99" : Math.round(x[1] * 100)}%`).join(", ") + " (the planet rebuilt 300 times within typical measurement errors)", 1); }
  for (const nn of cat.near || []) put(4, "Near a boundary", nn, 1);

  // 5 day and night
  const rotH = gm && gm.rotH && (GIANT.MEAS[an] || GIANT.MEAS[w.name] || {}).rotH;
  if (rotH) put(5, "Spin", `One turn in about ${rotH} hours, measured`, 0);
  else if (ri && ri.tLock != null && !sol) put(5, "One face to the star?", `${w.locked ? "Probably yes" : "Not assumed"}: tides would stop its spin in about ${ri.tLock > 1e12 ? "far longer than the age of the universe" : ri.tLock > 1e9 ? nf(ri.tLock / 1e9, 1) + " billion years" : ri.tLock > 1e6 ? nf(ri.tLock / 1e6, 0) + " million years" : nf(Math.max(1, ri.tLock / 1e3), 0) + " thousand years"}, against a system age of ${nf(w.age || 5, 1)} billion${ri.e > 0.1 ? "; its stretched orbit (eccentricity above 0.1) keeps it turning" : ""}`, 1);
  else put(5, "One face to the star?", w.locked ? "Yes" : sol ? "No: its spin is known" : "Unknown", sol ? 0 : 1);
  if (ri && !w.auto && ri.locked !== undefined && !!ri.locked !== !!w.locked && !sol) put(5, "Set from its papers", `The rule alone would say ${ri.locked ? "one face to the star" : "spinning freely"}; this planet's value follows its papers`, 0);
  put(5, "Where the star stands", Lt.es < -1 ? "Below the horizon here" : `${Math.round(Lt.es)}° above the horizon at this place`, w.locked ? 1 : 2);

  // 6 air
  if (ri && ri.keep != null && R < 4.5) put(6, "Hold on its air", `${ri.keep >= 10 ? nf(ri.keep, 0) : ri.keep >= 0.1 ? nf(ri.keep, 2) : ri.keep.toPrecision(1)} on a scale where Earth is 1, Mars 0.1 and Mercury 0.003. ${ri.keep < 0.01 ? "Below 0.01: expected to be airless" : ri.keep < 0.2 ? "Between 0.01 and 0.2: thin air is the likelier outcome" : "Above 0.2: can hold a thick atmosphere"}`, 1);
  else if (R >= 4.5) put(6, "Hold on its air", "Not tested: a planet this large keeps its gas", 1);
  if (ri && ri.hz) put(6, "Habitable zone", `${nf(ri.hz[0], ri.hz[0] < 1 ? 3 : 2)} to ${nf(ri.hz[1], ri.hz[1] < 1 ? 3 : 2)} AU (wider, optimistic limits ${nf(ri.hz[2], ri.hz[2] < 1 ? 3 : 2)} to ${nf(ri.hz[3], ri.hz[3] < 1 ? 3 : 2)} AU); the planet is at ${nf(w.a, w.a < 1 ? 3 : 2)} AU: ${w.a < ri.hz[2] ? "too close" : w.a < ri.hz[0] ? "inside the optimistic inner limit only" : w.a <= ri.hz[1] ? "inside it" : w.a <= ri.hz[3] ? "inside the optimistic outer limit only" : "beyond it"}`, 1);

  // 7 worlds
  const obs = !sol && lookedAt(w), F = findingsOf(w);
  put(7, "Has a telescope looked?", sol ? "It has been visited; none of that is used" : obs ? "Yes: observations of this planet set or order its worlds" : "No: the worlds below come from the rules alone", obs ? 0 : 1);
  w.scenarios.forEach((s, i) => put(7, `World ${i + 1}${s === w.scenarios.find(x => x.name === sc.name) ? " (on screen)" : ""}`, `${worldTitle(w, s)}. ${worldWhy(w, s)}`, ["seen", "points"].includes(standingOf(w, s)) ? 0 : standingOf(w, s) === "predicted" ? 1 : 2));
  if (w.ruleLead && w.ruleLead !== w.scenarios[0].name) put(7, "Order changed by an observation", `The rules alone would put “${w.ruleLead}” first`, 0);
  if (ri && ri.ruleNames && !sol) put(7, "What the rules alone would offer", ri.ruleNames.join("; "), 1);

  // 8 climate, 9 giants, 10 lava: the temperature where you are
  const a = sc.atm, airSeen = sc.base <= 1 || ["seen", "points"].includes(standingOf(w, sc));
  if (a && !giant) put(8, "Air of this world", `${a.P >= 0.1 ? nf(a.P, a.P < 1 ? 1 : 0) + " bar of " : "a thin layer of "}${GAS(a.gas)}`, airSeen ? 0 : 2);
  let tempT, tempStep = 8, tempSrc = 2;
  if (sc.climate) { const c = sc.climate;
    put(8, "Energy balance", c.locked ? `${cK(c.T0)} under the star, ${cK(c.Tn)} on the night side${sc.oceanDeg ? `; open water within ${Math.round(sc.oceanDeg)}° of the point under the star` : ""}` : `${cK(c.T0)} at the equator, ${cK(c.Tn)} at the poles${sc.iceLat ? `; ice beyond latitude ${Math.round(sc.iceLat)}°` : ""}`, 2);
    if (sc.autoP) put(8, "Greenhouse search", `The thinnest air of 1, 2, 3, 5 or 8 bar that keeps the warmest place above 10 °C: ${nf(a.P)} bar`, 2); }
  if (giant) { tempStep = 9;
    for (const n of gm.notes) put(9, plainGiant(n.k), plainGiant(n.t), n.lvl);
    const mMeas = GIANT.MEAS[an] || GIANT.MEAS[w.name] || {}; tempSrc = mMeas.Tday || mMeas.Tnight || mMeas.Tint ? 0 : 1;
    tempT = gm.Tint && gm.Tint > w.Teq * 1.2 ? `About ${cK(gm.Teq)} at the cloud tops, almost all of it the planet's own heat, left from its birth.` : gm.locked && Math.abs(gm.Tday - gm.Tnight) > 15 ? `About ${cK(gm.Tday)} on the day side and ${cK(gm.Tnight)} on the night side, at the height of the cloud tops${tempSrc === 0 ? "; measured from the planet's own glow" : "; calculated from the starlight and how well such air carries heat round the planet"}.` : `About ${cK(gm.Teq || sc.T || w.Teq)} at the cloud tops, set by ${gm.Tint > w.Teq * 0.5 ? "starlight and the planet's own heat together" : "the starlight it absorbs"}.`; }
  else if (sc.ground === "lava") { tempStep = 10; const dr = daysideRock(w, sc), Tm = w.star.Teff / Math.sqrt(w.aR) * Math.pow(2 / 3, 0.25); tempSrc = dr.why === "measured" ? 0 : 1;
    put(10, "Hottest a bare, dark rock could be", cK(Tm), 1); put(10, "Day side used", `${cK(dr.T)}: ${dr.why === "measured" ? "measured" : dr.why === "lava" ? "85% of that limit, the middle of the lava worlds measured so far" : "the limit itself"}`, tempSrc);
    tempT = `About ${cK(dr.T)} on the day side, ${dr.why === "measured" ? `measured${F && F.src ? ` (${(F.TdaySrc || F.src).replace(/ \(.*$/, "")})` : ""}` : dr.why === "lava" ? "taken as 85% of the hottest a bare, dark rock could reach here: the lava worlds measured so far are cooler than that limit" : "the hottest a bare, dark rock can reach this close to its star"}. Rock melts above about 1,330 °C (1,600${NK}K).`; }
  else if (F && F.Tday) { tempSrc = 0; tempT = `About ${cK(F.Tday)} on the day side, measured (${(F.TdaySrc || F.src).replace(/ \(.*$/, "")}).`; }
  else if (sc.Tstand && a) tempT = `About ${cK(sc.Tstand)} where you stand, from a simple balance of the starlight coming in and the heat this world's air (${a.P >= 0.1 ? nf(a.P, a.P < 1 ? 1 : 0) + " bar of " : "thin "}${GAS(a.gas)}, ${airSeen ? "as observed" : "assumed"}) holds and carries round. It is colder toward the ${w.locked && sc.land !== 1 ? "night side" : "poles"}.`;
  else if (!a) { const Tl = w.star.Teff / Math.sqrt(w.aR) * Math.pow(Math.max(0.01, Math.sin(Lt.es * D2R)), 0.25); tempSrc = 1; tempStep = 3;
    tempT = sc.T && sc.ground === "ice" ? `About ${cK(sc.T)}, from the starlight alone: there is no air to hold heat.` : Lt.es > 0 ? `About ${cK(Tl)} on the ground here, in full starlight with no air to carry heat away. In shadow and on the night side it is far colder.${sc.tempNote ? " " + sc.tempNote : ""}` : "Far below freezing: no starlight reaches this side, and there is no air to bring heat."; }
  else if (sc.temp) { tempSrc = sc.temp[1]; tempT = `${uc1(sc.temp[0].replace(/^about/, "About"))}${/[.!]$/.test(sc.temp[0]) ? "" : "."} ${sc.temp[1] === 2 ? "This is assumed for this world: nobody has measured its climate." : sc.temp[1] === 0 ? "Measured." : ""}`; }
  else tempT = `About ${cK(sc.T || w.Teq)}${sc.T ? ", which is what this world assumes" : ", from the starlight alone"}.`;
  T.why.temp = { step: tempStep, src: tempSrc, t: tempT.trim() };
  if (tempStep === 3 || (!giant && sc.ground !== "lava")) put(tempStep === 3 ? 3 : 8, "Where you stand", tempT.replace(/<[^>]+>/g, ""), tempSrc);

  // 11 the sky
  const skyAt = skySampler(w, sc, Lt), side = skyAt(90, 40), up = skyAt(180, 75), toward = skyAt(18, Math.max(8, Lt.es));
  const skyCol = colourName(side), hasAir = Lt.atmOn && (Lt.tau > 0 || Lt.dust > 0), tauE = Lt.tau / 0.097, night = Lt.mu0 < -0.05;
  if (a) put(11, "Scattering by the gas", `${nf(Lt.tau, Lt.tau < 0.1 ? 3 : 2)} at 550 nm (Earth's air: 0.097), from ${nf(a.P, a.P < 1 ? 2 : 0)} bar of ${GAS(a.gas)} under ${nf(w.g / 9.81, 2)} × Earth's gravity; ${/^H/.test(a.gas) ? "hydrogen scatters 2.8 times as strongly as nitrogen per bar" : /CO₂/.test(a.gas) && !/^N/.test(a.gas) ? "carbon dioxide scatters 1.6 times as strongly as nitrogen per bar" : "nitrogen is the reference gas"}`, airSeen ? 1 : 2);
  if (a && a.dust) put(11, "Haze or dust", `${nf(a.dust, 2)} extra dimming along a straight-up path, ${giant ? "coloured like the cloud tops" : a.dustMat === "tholin" ? "orange organic haze" : "fine dust, coloured like the ground"}`, 2);
  put(11, "Sky colour as drawn", hasAir && !night ? `${skyCol} to the side of the star; ${colourName(up)} overhead; ${colourName(toward)} near the star` : "black", hasAir ? 1 : sc.base <= 1 ? 0 : 1);
  { let t;
    const stn = standingOf(w, sc), told = ["seen", "points"].includes(stn) && !sol;
    const evid = !a && told ? ` That it has no air is ${stn === "seen" ? "observed" : "what the observations point to"}: ${lc1(wordsFor(w, sc).why ? wordsFor(w, sc).why.split(/(?<!et al)\.\s+(?=[A-Z])/)[0] : plainLit(stripLead(sc.verdict)) || (F && F.t) || "see “What has been observed”").replace(/\.$/, "")}.` : "";
    if (!a) t = `Black, with stars out in daytime, because ${told ? "this planet" : "this world"} has no air to scatter light.${evid}${!evid && !sol ? " The lack of air is " + (stn === "predicted" ? (ri && ri.keep != null && ri.keep < 0.01 ? "what the rules expect for a planet this small and this strongly lit; nobody has observed it." : "one possibility; nobody has observed it.") : "what this world supposes.") : ""}`;
    else if (!Lt.atmOn) t = "Shown black for now: “What's real?” is on, and this world's air is assumed, not measured.";
    else if (night) t = "Dark, with stars: the star is below the horizon here, so there is no daylight for the air to scatter.";
    else { const thick = tauE > 8 ? "far more than" : tauE > 1.8 ? "more than" : tauE > 0.6 ? "about as much as" : tauE > 0.05 ? "less than" : "far less than";
      const dusty = (a.dust || 0) > Math.max(0.05, Lt.tau * 0.6);
      t = `${uc1(skyCol)}${colourName(up) !== skyCol ? `, shading to ${colourName(up)} overhead` : ""}. Air scatters starlight, blue most of all, and that scattered light is the sky. This star gives off ${blueShare(w.star.Teff)}, and ${giant ? `the air above you (${nf(a.P, a.P < 1 ? 2 : 0)} bar of ${GAS(a.gas)}: you float high, above most of the atmosphere)` : `this world's air (${nf(a.P, a.P < 1 ? 2 : 0)} bar of ${GAS(a.gas)}, ${airSeen ? "as observed" : "assumed"})`} scatters ${thick} Earth's${tauE > 1.8 || tauE < 0.6 ? ` (${xTimes(tauE)} it)` : ""}.`
        + (Lt.tau > 0.6 ? " Air this deep scatters every colour many times over, so the sky takes on the colour of the starlight itself and not a clear blue." : w.star.Teff < 3900 && Lt.tau > 0.02 ? " With so little blue to scatter, the sky is dim and takes its tint from the star." : "")
        + (dusty ? ` ${giant ? "Haze" : a.dustMat === "tholin" ? "Orange organic haze" : "Dust"} in the air adds ${giant ? "a veil the colour of the cloud tops" : a.dustMat === "tholin" ? "its own colour" : "a veil the colour of the ground"}; how much there is ${giant && gm ? "follows the temperature" : "is assumed"}.` : "")
        + ` The colour is shown as an eye would see it after partly adjusting to this star's light.`; }
    T.why.sky = { step: 11, src: !a ? (told ? 0 : stn === "predicted" ? 1 : 2) : airSeen ? 1 : 2, t };
  }
  // clouds, haze and weather: the recipe's own lines
  const R11 = rc.rules.filter(r => ruleStep(r) === 11), cloudT = [];
  for (const r of rc.rules) { const n = ruleStep(r); if (giant && /^(Deck colours|H ≈)/.test(r.effect)) continue;   // a world of gas takes its cloud colours from the giant model (step 9), not from these two lines
    if (/The star never moves/.test(r.r)) continue;   // told in step 5
    if (sc.ground === "ocean" && sc.land === -1 && n === 12) continue;   // open sea everywhere: the land rules draw nothing
    if (n !== 15 || life) put(n, plainRule(r.input), `${plainRule(r.effect)}. ${plainRule(r.r)}`, r.lvl === 1 ? 1 : r.lvl); }
  if (giant) { const cl = gm.notes.filter(n => /Clouds|Haze|Methane/.test(n.k) && !/Scale height/.test(n.t)).map(n => plainGiant(n.t).replace(/^[\d,]+ K: /, ""));
    cloudT.push(`You float high in the atmosphere, looking down on its top layer. At this temperature that layer is expected to be: ${lc1(cl[0] || "cloud")}${cl.length > 1 ? " " + cl.slice(1, 4).map(x => endDot(uc1(x))).join(" ") : ""}`); }
  else if (!a) cloudT.push("None: without air there are no clouds, no haze and no weather.");
  else { for (const r of R11) if (!/^(H ≈|Deck colours)/.test(r.effect)) cloudT.push(`${endDot(plainRule(r.effect))} ${endDot(plainRule(r.r))}`);
    if (sc.wx && !/^No air/.test(sc.wx) && !sol) cloudT.push(endDot(plainRule(w.auto && !sc.spot ? sc.wx.split(/(?<=[.)])\s+(?=[A-Z])/)[0] : sc.wx)));
    if (!cloudT.length) cloudT.push(a.P < 0.05 ? "No clouds: the air is too thin." : "No clouds are drawn: at this temperature nothing in this air condenses."); }
  T.why.clouds = { step: giant ? 9 : 11, src: giant ? 1 : 2, t: cloudT.join(" ") };

  // 12 the ground
  { const g = sc.ground, R12 = rc.rules.filter(r => ruleStep(r) === 12 && r.lvl < 3), shapes = " The exact shapes of the hills, rocks and shores are imagined; they are fixed by the planet's name, so they are the same on every visit.";
    let t = g === "clouds" ? (sc.deck === "h2so4" ? "There is no ground in view: you are above a layer of acid cloud, as a balloon would be over Venus. The hot surface lies far below." : `There is no ground: you float high in ${a && /^H₂O/.test(a.gas) ? "an atmosphere of steam" : "the atmosphere"}, looking down on its top layer. Below, the gas gets hotter and denser without ever reaching a surface you could stand on.`)
      : g === "ocean" ? `${sc.land === -1 ? "Open sea in every direction: this world has no land." : sc.land === 1 ? "A coast: sea and land together." : "The shore of the ocean that faces the star; beyond it the sea is frozen."} Seawater looks dark because water soaks up red light and mirrors the sky.`
      : g === "ice" ? `Ice and frost, pale because ice reflects most of the light that falls on it${a && (a.dustMat === "tholin" || /CH₄/.test(a.gas)) ? ", here stained orange by haze settling out of the air" : ""}.`
      : g === "lava" ? "Molten rock with a dark, cooling crust. In daylight the glow of the lava is faint beside the star, so the surface looks dark grey; it shows as orange in shadow and toward the night side."
      : `${F && F.rock ? "Dark rock, as measured" : "Rock"}: ${g === "regolith" ? "dust and stones, rusted where air has reached them" : "the dark grey of basalt, the commonest rock on airless worlds, darkened further by ages of starlight and particles"}.`;
    if (F && F.t && (F.rock || F.volc === false)) t += ` ${endDot(F.t)} (${(F.TdaySrc || F.src).replace(/ \(.*$/, "")})`;
    if (g !== "clouds" && !(g === "ocean" && sc.land === -1)) t += " " + R12.filter(r => !/^Gravity/.test(r.effect) && (!/^Mountains/.test(r.effect) || g !== "ocean" || sc.land === 1) && !(g === "lava" && /Crater|Mountains/.test(r.effect))).slice(0, 3).map(r => `${endDot(plainRule(r.effect))}`).join(" ") + (R12.find(r => /gravity/.test(r.input)) ? ` Hills are ${w.g > 11 ? "lower than" : w.g < 8.5 ? "taller than" : "about as tall as"} Earth's because gravity is ${nf(w.g / 9.81, 2)} times Earth's.` : "") + shapes;
    T.why.ground = { step: g === "clouds" ? 9 : 12, src: g === "clouds" ? 1 : sc.base <= 1 ? 0 : 2, t: t.replace(/\s+/g, " ").trim() }; }

  if (sc.ground === "ocean" && sc.land === -1) put(12, "Ground", "None in view: open sea in every direction", 2);
  // 13 other things in the sky
  { const sibs = (w.siblings || []).map(s => ({ n: (s.name || "").replace(/(\d)([a-z])$/, "$1 $2"), ang: 2 * Math.asin(s.R * RE / (Math.abs(s.a - w.a) * AU)) / D2R })).sort((x, y) => y.ang - x.ang), mf = moonFate(w), parts = [];
    if (sibs.length) { parts.push(`${sibs.length === 1 ? "The neighbouring planet" : "Neighbouring planets"} ${sibs[0].ang > 0.2 ? `can show a disc: ${sibs[0].n} looks up to ${nf(sibs[0].ang / 0.52, 1)} times as wide as our full Moon at its closest` : `show${sibs.length === 1 ? "s" : ""} as ${sibs.length === 1 ? "a bright point" : "bright points"} of light (${listAnd(sibs.slice(0, 3).map(s => s.n))})`}.${sol ? "" : ` ${sibs.length === 1 ? "It is" : "They are"} drawn grey, because nobody knows what ${sibs.length === 1 ? "its surface looks" : "their surfaces look"} like.`}`);
      put(13, "Neighbours", sibs.slice(0, 4).map(s => `${s.n} up to ${s.ang >= 0.1 ? nf(s.ang, 2) + "°" : nf(s.ang * 60, 1) + " arcminutes"}`).join("; "), 1); }
    else parts.push("No other planets are known in this system.");
    if (w.star2) parts.push(`The second star of the pair is in the sky too${w.star2.assumed ? "; its size and colour are assumed" : ""}.`);
    if (w.points) parts.push(`Bright stars: ${listAnd(w.points.filter(p => !p.nolabel).map(p => p.name.split(" (")[0]))}.`);
    if (!sol) { parts.push(mf.ok ? "A moon is drawn in the sky, and it is imagined: no moon of any exoplanet has been found, though one could survive here." : mf.room === false ? "No moon is drawn: this close to the star, the planet's pull does not reach far enough to hold one." : "No moon is drawn: the star's tides would have pulled one away long ago.");
      put(13, "Could a moon survive?", mf.ok ? "Yes, for longer than the system's age; an imagined one is drawn" : mf.room === false ? "No room: the star's pull wins everywhere a moon could orbit" : `No: tides would remove it in about ${mf.t > 1e9 ? nf(mf.t / 1e9, 1) + " billion" : mf.t > 1e6 ? nf(mf.t / 1e6) + " million" : nf(Math.max(1, mf.t / 1e3)) + " thousand"} years`, mf.ok ? 3 : 1); }
    if (rc.aurora) parts.push(`Auroras are drawn${a ? `, ${/^H/.test(a.gas) ? "pink for hydrogen" : /CO₂/.test(a.gas) && !/^N/.test(a.gas) ? "green for carbon dioxide" : "violet-blue for nitrogen"}` : ""}: ${w.star.Teff < 3900 ? "red dwarfs flare often, and their particle storms would light up any air" : "the star's wind would light up the air near the poles"}. That is assumed, not observed.`);
    // where to look for the neighbours right now, from the drawing itself
    const live = typeof scene !== "undefined" && scene && scene.w === w && scene.sc && scene.sc.name === sc.name ? scene : null;
    if (live && live.sibs && live.sibs.length) { const up = live.sibs.filter(b => b.L && b.L.el > 4).sort((p, q) => q.ang - p.ang).slice(0, 3);
      if (up.length) parts.push(`Where to look now: ${listAnd(up.map(b => `${(b.name || "").replace(/(\d)([a-z])$/, "$1 $2")} ${Math.abs(Math.round(b.L.az)) < 8 ? "near the star's direction" : `${Math.abs(Math.round(b.L.az))}° to the ${b.L.az > 0 ? "right" : "left"} of the star`}, ${Math.round(b.L.el)}° up`))}. Turn with ‹ › to find ${up.length > 1 ? "them" : "it"}; ${up.length > 1 ? "they move" : "it moves"} through the sky as the planets orbit.`);
      else parts.push("At this moment none of them is above the horizon here."); }
    if (giant && gm.rings) parts.push(gm.rings === "saturn" ? "Saturn's rings arch across the sky." : `${gm.rings === "candidate" ? "Candidate rings, not confirmed," : "Rings"} arch across the sky. ${gm.rings === "candidate" ? "" : "They are imagined: no exoplanet is known to have rings, but a giant this far from its star could hold rings of ice like Saturn's, and they are drawn with Saturn's proportions."}`.trim());
    T.why.other = { step: 13, src: 1, t: parts.join(" ") };
    if (!sol && mf.ok) T.why.moon = { step: 13, src: 3, t: `This moon is imagined. No moon of any planet outside the Solar System has been found yet. One is drawn because a moon could survive here: the planet's pull reaches far enough to hold it, and the star's tides would not pull it away within the system's age. It is drawn ${giant ? "about the size of Jupiter's moon Io, on an Io-like orbit" : "about the size of our Moon, on a fairly close orbit"}; its size, colour and position are imagined.` }; }

  // 14 the planet from space
  { const tint = opt.tint || null, g = sc.ground;
    const base = giant ? `the top of its atmosphere, whose colour follows its temperature (${(gm.notes.filter(n => n.k === "Clouds").map(n => plainGiant(n.t).replace(/^[\d,]+ K: /, "")).slice(0, 1).join("") || "calculated").replace(/\.$/, "")})`
      : g === "clouds" ? "pale acid cloud" : g === "ocean" ? (sc.land === 1 ? "dark sea and rock-coloured land" : sc.land === -1 ? "dark sea" : "dark sea on the side facing the star, white ice beyond") : g === "ice" ? "bright ice" : g === "lava" ? "dark rock, glowing where it is molten under the star" : "dark rock";
    let t = `From space you would see ${base}${!giant && sc.clouds ? ", with white cloud over about " + Math.round((rc.clouds != null ? Math.min(0.85, sc.clouds) : sc.clouds) * 100) + "% of the day side" : ""}.`;
    if (!giant && a && Lt.tau > 0.3) t += ` Its thick air scatters starlight back to space, so the whole globe is veiled in the colour of the starlight, ${starColourWord(w.star.Teff)} here.`;
    else if (!giant && a && Lt.tau > 0.03) t += " A thin veil of scattered light softens the edge.";
    if (g === "ocean") { const sea = Lt.albedo(MAT.ocean); t += ` Seawater reflects only a few per cent of the light, mostly blue; under this star's light it is drawn ${colourName(sea)}, and dark.`; }
    if (tint) t += ` Averaged over the day side, the globe is drawn ${colourName(tint.map(v => Math.pow(v / 255, 2.2)))}.`;
    { const veg = life && sc.ground === "ocean" && !!sc.atm && !sc.noPlants ? (rc.rules || []).find(r => ruleStep(r) === 15 && /vegetation|mats/i.test(r.effect)) : null;
      if (veg) t += ` With “Imagine life” on, the land is tinted by the imagined ${/mats/i.test(veg.effect) ? "microbial mats" : "vegetation"}: ${lc1(endDot(plainRule(veg.effect)))} ${endDot(plainRule(veg.r))} Switch life off to see the bare land.`; }
    t += w.locked && !giant ? " One half is always lit and the other always dark." : "";
    if (tint) put(14, "Average colour of the day side", colourName(tint.map(v => Math.pow(v / 255, 2.2))), 1);
    put(14, "What is drawn", `${uc1(base)}${a && !giant ? `; air with scattering ${nf(Lt.tau, 2)}` : ""}`, giant ? 1 : sc.base <= 1 ? 0 : 2);
    T.why.space = { step: 14, src: giant ? 1 : sc.base <= 1 ? 0 : 2, t }; }

  // 15 life, 16 randomness
  { const can = sc.ground === "ocean" && !sc.noPlants && !!a;
    T.why.life = { step: 15, src: 3, t: !can ? `No life is drawn. ${sc.life ? endDot(plainRule(sc.life).replace(/^No\.\s*/, "").replace(/^No$/, "")) : ""} No life has been found beyond Earth.`.replace(/\s+/g, " ")
      : life ? lifeStory(rc, life) : "No life is drawn unless you ask for it with “Imagine life”. This world has liquid water, the one thing all life on Earth needs; no life has been found beyond Earth." };
    put(15, "Life", can ? (life ? "Drawn, because you asked: all of it imagined" : "Could be drawn here (liquid water); off until asked for") : "Not drawn: no liquid water at the surface in this world", 3);
    put(16, "Random draws", `Fixed by the text “${w.name}|${sc.name}”: the layout of hills, coast, clouds and rocks${giant ? ", and the number and place of storms" : ""}. The same every visit`, 3); }
  return T;
}
// the giant model's notes, made plain
function plainGiant(t) {
  return (t || "").replace(/<[^>]+>/g, "").replace(/\bthe seed\b/g, "a random draw fixed by the planet's name").replace(/Metal-rich air/g, "Air rich in heavy elements").replace(/Heavy-element-rich, so lots of/g, "Rich in heavy elements, so plenty of")
    .replace(/\bMetals\b/g, "Heavy elements").replace(/× solar/g, " times the Sun's share").replace(/mean molecular weight/g, "average weight of a gas particle").replace(/\bhotspot\b/g, "hottest point").replace(/Photochemical haze/g, "Haze made by starlight")
    .replace(/Scale height (\d+) km \(Jupiter: 27\)/g, "The air thins about threefold with every $1 km of height (Jupiter: 27 km)").replace(/M⊕/g, " Earth masses").replace(/M♃/g, " Jupiter masses").replace(/(\d(?:\.\d+)?) g\b(?!\/)/g, "$1 times Earth's gravity")
    .replace(/sodium and potassium absorb: dark/g, "no clouds, and dark, because sodium and potassium in the hot air soak up light").replace(/cloud-free, deep and blue/g, "no clouds: clear, deep air that looks blue").replace(/silicate clouds where cool enough/g, "clouds of rock droplets (silicates) where it is cool enough").replace(/too hot for dayside clouds/g, "nothing: it is too hot for any cloud on the day side")
    .replace(/more for metal-rich, low-gravity planets/g, "more on planets rich in heavy elements and with low gravity").replace(/\bmetal-rich\b/g, "rich in heavy elements").replace(/coverage is a model/g, "how much is covered is calculated").replace(/\bsubstellar object\b/g, "object too light to be a star").replace(/\bsubstellar\b/g, "under-the-star")
    .replace(/SO₂/g, "sulfur dioxide").replace(/CH₄/g, "methane").replace(/CO₂/g, "carbon dioxide").replace(/H₂O/g, "water").replace(/H₂S/g, "hydrogen sulfide").replace(/H₂(?![OS])/g, "hydrogen").replace(/Tidally locked: /g, "One face always to the star: ").replace(/\bdeck\b/g, "cloud layer").replace(/Sudarsky(?! et)/g, "Sudarsky et al. 2000").trim();
}
// the recipe's rule lines were written for a table; here they are made plain
function plainRule(t) {
  return (t || "").replace(/(\d(?:\.\d+)?) g\b(?!\/)/g, "$1 × Earth's gravity").replace(/\b(not )?tidally locked\b/gi, (m, n) => n ? "not held with one face to the star" : "one face always to the star").replace(/\bon a locked planet\b/g, "on such a planet").replace(/\b(not )?locked\b/g, (m, n) => n ? "turning freely" : "one face to the star")
    .replace(/R⊕/g, "Earth radii").replace(/M⊕/g, "Earth masses").replace(/(\d) Gyr\b/g, "$1 billion years").replace(/\bspin unknown\b/g, "spin not known").replace(/\bhaze optical depth\b/g, "haze thickness").replace(/\bPlanck emission\b/g, "The glow of hot matter").replace(/\bPhotochemical haze\b/g, "Haze made by starlight")
    .replace(/\bthe seed\b/g, "chance").replace(/\bseed\b/g, "chance (fixed by the planet's name)").replace(/\bin this scenario\b/g, "in this world").replace(/\bthis scenario\b/g, "this world").replace(/\bthe scenario's\b/g, "this world's").replace(/\bscenario\b/g, "world")
    .replace(/Set by the Biology control\.\s*/g, "").replace(/\bsubstellar point\b/g, "point under the star").replace(/∝ 1 \/ gravity/g, "is lower where gravity is stronger").replace(/\bRelief\b/g, "The height of the land").replace(/\bdeck\b/g, "layer")
    .replace(/Deck colours h2so4 \/ h2so4/g, "Pale yellow-white cloud tops, the colour of sulfuric-acid droplets").replace(/H ≈ (\d+) km: /g, "The air thins about threefold with every $1 km of height: ").replace(/Scale height H ≈ kT \/ μg for ([^(]+)\(μ = [\d.]+\)/g, "How fast air thins with height follows from its temperature, its weight and the gravity")
    .replace(/\bScenarios for\b/g, "Worlds for").replace(/Class and scenarios chosen by rules/g, "Type and worlds set by the rules").replace(/both kinds of scenario/g, "both kinds of world").replace(/Plants stop: /g, "").replace(/Animals stop: /g, "").replace(/Plant form: /g, "").replace(/N₂/g, "nitrogen").replace(/CO₂/g, "carbon dioxide").replace(/H₂O/g, "water vapour").replace(/H₂(?![OS])/g, "hydrogen").replace(/CH₄/g, "methane").trim();
}
// the eight things in a picture, in the order the panel lists them
// everything alive that is drawn, each with the reason for its look: plants (colour and form), floaters, animals and fliers
function lifeStory(rc, lv) {
  const R = (rc.rules || []).filter(r => ruleStep(r) === 15), eff = re => R.filter(r => re.test(r.effect)), say = r => `${lc1(endDot(plainRule(r.effect).replace(/^(Plant form|Animals stop):\s*/, "")))} ${endDot(plainRule(r.r))}`;
  const out = ["Everything alive in this picture is imagined: no life has been found beyond Earth. Here is what is drawn, and why it looks the way it does."];
  const colour = eff(/vegetation|mats|microb/i)[0]; if (colour) out.push(`Colour: ${say(colour)}`);
  for (const r of eff(/^Plant form/)) out.push(`${/floater/i.test(r.effect) ? "The shapes drifting in the sky" : "Plant shapes"}: ${say(r)}`);
  const biome = eff(/forest|grass|scrub|desert|tundra|taiga|savann|steppe/i).find(r => !/^Plant form|^Animals/.test(r.effect)); if (biome) out.push(`What grows where you stand: ${say(biome)}`);
  const an = eff(/^Animals stop/); if (lv >= 4 && an.length) out.push(`Animals: ${an.map(r => endDot(plainRule(r.effect).replace(/^Animals stop:\s*/, ""))).filter(t => !/^Animals allowed/i.test(t)).map(lc1).join(" ")} Animals need oxygen, so oxygen-rich air is assumed for them, although no telescope has found oxygen on any exoplanet.`);
  return out.join(" ");
}
const WHY_ORDER = [["star", "The star"], ["sky", "The colour of the sky"], ["clouds", "Clouds, haze and weather"], ["ground", "The ground or sea"], ["temp", "The temperature where you are"], ["other", "Other things in the sky"], ["moon", "The moon in the sky"], ["space", "The planet seen from space"], ["life", "Life"]];
