// The guide's words (v4). Every sentence a reader sees about a planet is made here or in ui-trace.js, in plain English.
// There are no status labels: what is known about a world is told in prose ("Nobody has looked yet", "Spitzer showed", "Two teams disagree").
// The four source words (measured, calculated, assumed, imagined) are used only by "What's real?" and the technical table.
const SRCW = ["measured", "calculated", "assumed", "imagined"];
const srcTag = l => `<span class="srcw s${l}">${SRCW[l]}</span>`;
const cK = K => `${cOf(K)} (${nf(Math.round(K))}${NK}K)`;                    // a temperature somewhere you could stand: °C with kelvin in brackets
const rE = w => w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, mE = w => w.Mu === "MJ" ? w.Mp * 317.8 : w.Mp;
const isSolar = w => typeof SOLAR !== "undefined" && SOLAR.includes(w);
const catRow = w => { const i = CAT_IX.get(archName(w)) ?? CAT_IX.get(w.name); return i == null ? null : CAT[i]; };
const LC_OK = /^(A|An|The|No|About|Its|It|Every|Bare|Day|Night|Too|If|Only|Possible|Thick|Thin|Hot|Cold|Clouds?|Haze|Escaping|Tentative|Strong|Weak|Flat|Featureless|Directly|Colour|Composition|Phase|Atmosphere|Seen|Dense|Low|High|Most|Some|Air|Water|Steam|Hydrogen|Helium|Methane|One|Two|Both|Early|Measured|Dark|Bright|Reflective|Density|Mass|Radius|Size|Orbit|Imaged|Detected|Transit|Emission|Rock|Rocky|Lava|Magma|Glow|Glowing|Disintegrating|Evaporating|Probably|Likely|Below|Above|Despite|What|This|These|Open|Young|Old|Near|Far|Close|Whether|Still|Not|Likely|Unlikely|Models?|Ground-based|Whole|Small|Large|Heavy|Neither|Nitrogen|Carbon|Sulfur|Sodium|Silicate|Iron|Metal-rich|Very|Almost|At|In|On|With|Without|From|For|By|As)\b/;
const lc1 = t => LC_OK.test(t) ? t.replace(/^./, c => c.toLowerCase()) : t, uc1 = t => t.replace(/^./, c => c.toUpperCase());
const listAnd = (a, or) => a.length < 2 ? a.join("") : a.slice(0, -1).join(", ") + (or ? " or " : " and ") + a[a.length - 1];
const starKind = st => isWhiteDwarf(st) ? "a white dwarf (the small, hot core left when a star dies)" : isBrownDwarf(st) ? "a brown dwarf (an object too light to shine as a star)"
  : st.Teff < 3900 ? "a red dwarf (a small, cool star)" : st.Teff < 5300 ? "an orange star, a little cooler than the Sun" : st.Teff < 6000 ? "a star like the Sun" : st.Teff < 7500 ? "a white star, hotter than the Sun" : "a hot blue-white star";
const wideAs = (x, what) => x >= 1.95 ? `${nf(x, x < 10 ? 1 : 0)} times as wide as ${what}` : x > 1.05 ? `${nf((x - 1) * 100)}% wider than ${what}` : x >= 0.95 ? `about as wide as ${what}` : `${nf(x * 100)}% as wide as ${what}`;
const heavyAs = (x, what) => x >= 1.95 ? `${nf(x, x < 10 ? 1 : 0)} times as heavy${what ? " as " + what : ""}` : x > 1.05 ? `${nf((x - 1) * 100)}% heavier${what ? " than " + what : ""}` : x >= 0.95 ? `about as heavy${what ? " as " + what : ""}` : `${nf(x * 100, x < 0.1 ? 1 : 0)}% as heavy${what ? " as " + what : ""}`;
const yearOf = w => w.P < 2 ? `${nf(w.P * 24, 1)} hours` : w.P < 700 ? `${nf(w.P, w.P < 20 ? 1 : 0)} days` : w.P < 365.25 * 2000 ? `${nf(w.P / 365.25, w.P < 3652 ? 1 : 0)} years` : `about ${nf(Math.round(w.P / 365.25 / 1000) * 1000)} years`;

// words from the literature notes that a first-time reader would not know, made plain
const plainLit = t => (t || "").replace(/\bcloud decks?\b/g, "cloud layer").replace(/\bsubstellar point\b/g, "point under the star").replace(/\bsubstellar object\b/g, "object too light to be a star").replace(/\b[Mm]etal-rich\b/g, "rich in heavy elements").replace(/\bmetal-enriched\b/g, "enriched in heavy elements")
  .replace(/(\d[\d,.]*)\s*× solar\b/g, "$1 times the Sun's share").replace(/\bhydrogen(-helium)? envelope\b/g, "deep hydrogen atmosphere").replace(/\bdayside\b/g, "day side").replace(/\bnightside\b/g, "night side").replace(/\bhot ?spot\b/g, "hottest point")
  .replace(/\bflat transmission spectrum\b/g, "flat spectrum of the starlight filtered through its edge").replace(/SO₂/g, "sulfur dioxide").replace(/CH₄/g, "methane").replace(/CO₂/g, "carbon dioxide").replace(/H₂O/g, "water").replace(/H₂S/g, "hydrogen sulfide").replace(/\bH₂\/He\b/g, "hydrogen and helium").replace(/H₂(?![OS])/g, "hydrogen").replace(/N₂/g, "nitrogen");
// ---------- what is known: is the radius measured, is the mass, has any telescope looked at its air, surface or heat ----------
function knownOf(w) {
  const row = catRow(w), i = row ? CAT_IX.get(row[0]) : null, lim = w.massLimit || {};
  const rMeas = !w.RpAssumed && !(row && row[8] == null), mMeas = !w.MpAssumed && !(i != null && typeof LIT_MR !== "undefined" && LIT_MR.has(i)) && !!mE(w);
  const method = row ? row[16] : w.disc ? ["Transit", "Radial Velocity", "Microlensing", "Imaging"].indexOf(w.disc[1]) : null;
  const massHow = w.massFix ? "estimated from its glow and age" : !mMeas ? (lim.up ? "estimated from its size; only an upper limit has been measured" : "estimated from its size, not measured")
    : w.msini ? "a minimum, from the wobble it gives its star (the tilt of its orbit is unknown)" : lim.low ? "a lower limit" : method === 3 ? "from its brightness and age, or from its pull on its star" : method === 4 ? "from the way it shifts its neighbours' transits" : method === 2 ? "from the way it changed the brightening, together with an estimate of its star's mass" : "from its pull on its star or on its neighbours";
  const massSays = w.massFix ? "Its mass is estimated from its glow and age." : !mMeas ? (lim.up ? "Its mass has not been measured, only an upper limit on it." : "Its mass has not been measured.") : w.msini ? "Its mass is known only as a minimum, from the wobble it gives its star, because the tilt of its orbit is unknown." : lim.low ? "Only a lower limit on its mass is known." : `Its mass comes ${massHow}.`;
  const sizeHow = rMeas ? (method === 3 ? "from its brightness" : "from the share of starlight it blocks") : method === 3 ? "from models of its glow" : "estimated from its mass, not measured";
  return { row, rMeas, mMeas, method, massHow, sizeHow, massSays };
}
// internal only, never shown as a label: how a world stands. seen (a telescope saw it), points (observations point to it), reading (one of
// several readings in dispute), open (observed, cannot tell), against (observations argue against it), predicted (nobody has looked)
const TELE = /JWST|Hubble|HST|Spitzer|TESS|CHEOPS|Kepler's|spectr|phase curve|eclipse|imaged|helium|transit depth|Lyman/i;
const wordsFor = (w, s) => { const o = typeof WORDS !== "undefined" && WORDS[fKey(archName(w))]; return (o && o.worlds && o.worlds[s.name]) || {}; };
const worldTitle = (w, s) => wordsFor(w, s).title || (w.auto && isGiantScene(s) && rE(w) >= 6 && !s.moon ? uc1(kindOf(w, s).replace(/^an? /, "")) : s.name);   // a giant is named by what its top looks like, not "above the cloud tops" when it has no clouds
function standingOf(w, s) {
  if (wordsFor(w, s).standing) return wordsFor(w, s).standing;
  if (isSolar(w)) return "predicted";
  const v = verdictOf(s.verdict, s.base, w, s)[1], t = s.verdict || "";
  if (/contested/.test(v)) return "reading";
  if (/^measured/.test(v)) return "seen";
  if (/^favoured/.test(v)) return /^Favoured by its low density/.test(t) ? "points" : "points";
  if (/^disfavoured/.test(v)) return /^Less favoured/.test(t) || TELE.test(t) ? "against" : "predicted";
  if (/^allowed/.test(v)) return s.spot || (!w.auto && TELE.test(t)) ? "open" : "predicted";
  return "predicted";
}
function lookedAt(w) {
  if (isSolar(w)) return true;
  const an = archName(w);
  return !!(measuredFor(w) || findingsOf(w) || w.scenarios.some(s => s.spot) || (typeof REVIEW_PLAIN !== "undefined" && TELE.test(REVIEW_PLAIN[an] || REVIEW_PLAIN[w.name] || "")) || w.scenarios.some(s => standingOf(w, s) !== "predicted"));
}

// ---------- a world in a few plain words ("bare rock", "an ocean facing the star, ringed by ice") ----------
function kindOf(w, sc) {
  if (wordsFor(w, sc).kind) return wordsFor(w, sc).kind;
  const g = sc.ground, a = sc.atm, R = rE(w);
  if (sc.moon) return "an imagined moon of the planet, with seas";
  if (g === "ocean") return sc.term ? "a dry world with lakes along the line between day and night" : sc.land === 1 ? "a world of seas and continents"
    : sc.land === -1 ? (a && /^H₂$/.test(a.gas) ? "an ocean under hydrogen air" : "an ocean with no land") : "an ocean facing the star, ringed by ice";
  if (g === "ice") return a ? (/CH₄/.test(a.gas) || a.dustMat === "tholin" ? "a frozen world under orange haze" : "a world frozen over") : /shell/i.test(sc.name) ? "a water-rich world frozen at the surface" : "a frozen world without air";
  if (g === "rock") return a ? "rock under thin air" : "bare rock";
  if (g === "regolith") return a ? "a cold desert under thin air" : "bare, dusty rock";
  if (g === "lava") return a ? (a.P >= 3 ? "a sea of lava under thick air" : "a sea of lava under thin air") : "a sea of lava under a black sky";
  if (g === "clouds") {
    if (sc.deck === "h2so4") return "a hot world wrapped in acid clouds, like Venus";
    if (a && /^H₂O/.test(a.gas)) return "a steam world";
    if (R >= 6) { if (sc.giantVar) return sc.giantVar === "bright" ? "a giant under bright, high clouds" : "a giant with a dark, clear sky";
      let m = null; try { m = giantOf(w, sc).m; } catch (e) {} if (!m) return "a gas giant"; const T = m.Teq;
      if (m.Tint && m.Tint > w.Teq * 1.2) { const yg = (w.age || 5) < 0.5 ? "a young giant" : "a giant still warm from its formation,"; return T > 1150 ? `${yg} glowing under red dust clouds` : T > 450 ? `${yg} with clear, dark air` : "a cold giant with water clouds"; }
      return T < 150 ? "a cold giant with clouds of ammonia ice" : T < 350 ? "a giant with water clouds" : T < 800 ? "a clear, blue giant without clouds" : T < 1400 ? "a dark giant without clouds" : T < 2000 ? "a hot giant with clouds of rock droplets" : "a giant too hot for clouds, glowing on its day side"; }
    return R >= 3.5 ? "a Neptune-like planet of deep gas" : "a small gas planet wrapped in haze";
  }
  return lc1(sc.name);
}

// ---------- why a world is offered: one plain sentence saying whose reading it is, or which rule predicts it ----------
const stripLead = v => (v || "").replace(/^(Contested|Measured|Favoured(?: by [^:]*)?|Allowed|Tentative|Speculative|Unlikely|Untested|Less favoured(?: by the measurements)?|Possible|Consistent|Optimistic habitable zone|Model)\b\s*[:·,]?\s*/i, "").trim();
const endDot = t => t ? t.replace(/\s*\.?\s*$/, ".") : "";
function offeredBecause(w, sc) {   // worlds no telescope has tested: the rule that offers them, in plain words (the rule itself is step 7 of the recipe)
  const g = sc.ground, a = sc.atm, ai = w.autoInfo || {}, R = rE(w), rest = stripLead(sc.verdict), red = w.star.Teff < 3900;
  if (sc.moon) return "No moon of any exoplanet has been found. This one is imagined, because a giant at this distance could hold a large moon where water stays liquid.";
  if (g === "clouds" && sc.deck !== "h2so4" && !(a && /^H₂O/.test(a.gas))) {
    if (sc.giantVar) return endDot(uc1(rest));
    if (R >= 6) { const m = giantOf(w, sc).m, own = m.Tint && m.Tint > w.Teq * 1.2;
      return own ? `${(w.age || 5) < 0.5 ? "This giant is young and still glowing with the heat of its birth" : "This giant still glows with heat left over from its formation, more than its star gives it"}, so its clouds are expected to match those of failed stars (brown dwarfs) of the same temperature.` : `What a giant planet at about ${cK(m.Teq || sc.T || w.Teq)} is expected to look like, from how clouds form at that temperature.`; }
    if (/low density/.test(sc.verdict || "")) return endDot(uc1(rest));
    // how likely a hydrogen envelope is depends on size: most planets above about 2 Earth radii have one, most below about 1.6 have lost it,
    // and in between (the radius valley) both kinds are common (Fulton et al. 2017)
    const env = "a thick hydrogen atmosphere with haze high up, and no surface you could reach";
    return R >= 2 ? `The usual outcome for a planet this size: ${env}.` : R >= 1.6 ? `Planets of this size are split between rocky ones and ones that kept ${env}; this is the second kind.` : `Possible but less likely: most planets this small have lost the hydrogen they formed with, but some keep ${env}.`;
  }
  if (g === "clouds" && a && /^H₂O/.test(a.gas)) return "Possible if the planet is rich in water: this close to its star the water would be a deep atmosphere of steam.";
  if (g === "clouds") return ai.keep > 0.2 ? "It is heavy enough to hold a thick atmosphere. This close to its star that air would trap heat under acid clouds, as on Venus." : "If it has kept its air: this close to its star the air would trap heat under acid clouds, as on Venus.";
  if (g === "ocean" && sc.land === -1) return "Possible if the planet is rich in water: it lies where a deep ocean could stay liquid at the surface." + (R > 2 ? " Whether a planet this large can have a liquid surface at all is disputed (Innes et al. 2023; Shorttle et al. 2024)." : "");
  if (g === "ocean" && sc.term) return "Too much starlight for oceans, but if the planet is nearly dry, a mild ring could exist between the hot day side and the frozen night side (Leconte et al. 2013; Lobo et al. 2023).";
  if (g === "ocean") { const far = w.hz && w.a > w.hz[1], near = w.hz && w.a < w.hz[0];
    return `It lies ${far ? "near the cold edge of" : near ? "just inside the hot edge of" : "in"} its star's habitable zone, the range of distances where water could be liquid, and is heavy enough to hold air.`
      + (far ? " Staying warm this far out needs a strong greenhouse." : near ? " Staying temperate this close needs thick clouds that reflect much of the starlight (Yang et al. 2013)." : "")
      + (/too small to hold thick air/.test(sc.verdict || "") ? " But it may be too small to hold thick air." : "")
      + (red && !sc.term ? " Red dwarfs shine far more brightly in their youth, which may have boiled such an ocean away long ago (Luger & Barnes 2015)." : ""); }
  if (g === "ice" && a) return /CH₄/.test(a.gas) ? "Cold and heavy enough to keep nitrogen and methane, which starlight would turn into orange haze, as on Saturn's moon Titan." : "The same planet with a weaker greenhouse: frozen over.";
  if (g === "ice") return /shell/i.test(sc.name) ? "Possible if the planet is rich in water: this far from its star the water would be frozen at the surface." : "Beyond the habitable zone, too cold for liquid water at the surface.";
  if (g === "lava") return a ? endDot(uc1(rest || "A sea of lava can release gas faster than starlight strips it away")) : "The day side is hot enough to melt rock. In this world the planet has no air.";
  if (g === "regolith") return "The same planet with only thin air, like Mars.";
  if (g === "rock") {
    if (rest && !/^Below the cosmic/.test(sc.verdict) && !/^Untested$/i.test(sc.verdict || "")) return endDot(uc1(rest));
    return ai.keep != null && ai.keep < 0.01 ? "Too small, and too strongly lit by its star, to hold on to air. Bare rock is what is expected." : red ? "If its star's flares and ultraviolet light have stripped its air: bare rock." : "If it has lost its air: bare rock.";
  }
  return endDot(uc1(rest || sc.wx || ""));
}
function worldWhy(w, sc) {
  if (wordsFor(w, sc).why) return wordsFor(w, sc).why;
  if (isSolar(w)) return offeredBecause(w, sc);
  const st = standingOf(w, sc), rest = plainLit(stripLead(sc.verdict)), by = ((sc.verdict || "").match(/^Favoured by ([^:]+?)(?::|$)/) || [])[1];
  const sayRest = t => t ? ": " + lc1(t).replace(/\.$/, "") + "." : ".";
  if (st === "predicted") return offeredBecause(w, sc);
  if (st === "seen") { const m = measuredFor(w);
    if (isGiantScene(sc) && /^Model/.test(sc.verdict || "")) return m === 2 ? "Telescopes have measured this planet's heat or colour, and the picture uses those measurements. The cloud patterns are calculated." : "Telescopes have read this planet's air, which confirms it is a giant of this kind. Its colours are calculated from its temperature.";
    return rest ? `This is what telescopes saw${sayRest(rest)}` : "This is what telescopes saw."; }
  if (st === "points") return /low density/.test(sc.verdict || "") ? `Its measured size and mass point to this${sayRest(rest.replace(/^by its low density:?\s*/i, ""))}` : `${by && !/low density/.test(by) ? `What ${by} saw points` : "The observations point"} to this world${sayRest(rest)}`;
  if (st === "reading") return rest ? endDot(uc1(rest)) : "One of the readings astronomers have given of the observations.";
  if (st === "open") return rest ? endDot(uc1(rest)) : "The observations so far cannot tell this world from the others.";
  if (st === "against") return rest && !/^Less favoured/.test(sc.verdict) ? `The observations argue against this world${sayRest(rest)}` : "The observations point to another world. This one is not ruled out" + (rest ? sayRest(rest) : ".");
  return offeredBecause(w, sc);
}
// one or two sentences that open "The worlds shown": how many pictures the planet has, and why
function worldsIntro(w) {
  const n = w.scenarios.length, name = dispName(w), st = w.scenarios.map(s => standingOf(w, s)), kinds = w.scenarios.map(s => kindOf(w, s));
  const num = ["no", "one", "two", "three", "four", "five", "six"][n] || n;
  { const o = typeof WORDS !== "undefined" && WORDS[fKey(archName(w))]; if (o && o.intro) return o.intro; }
  if (isSolar(w)) return n === 1 ? `${name} is here as a test. Given only its size, mass and orbit, the guide's rules offer one world: ${kinds[0]}. Compare it with the real one.`
    : `${name} is here as a test. Given only its size, mass and orbit, the guide's rules offer ${num} worlds: ${listAnd(kinds)}. Compare them with the real one.`;
  if (!lookedAt(w)) {
    const what = isGiantScene(w.scenarios[0]) ? "clouds" : "air or surface";
    return n === 1 ? `Nobody has looked at ${name}'s ${what} yet. It has one picture: ${kinds[0]}, which is what a planet of its size and temperature is expected to be.`
      : `Nobody has looked at ${name}'s ${what} yet. It could be ${listAnd(kinds, true)}, so it has ${num} pictures. The first is the one the guide's rules make likeliest.`;
  }
  if (n === 1) return st[0] === "seen" || st[0] === "points" ? `Telescopes have looked at ${name}, and what they saw leaves one kind of world: ${kinds[0]}.` : `Telescopes have looked at ${name}. It has one picture: ${kinds[0]}.`;
  if (st.filter(x => x === "reading").length >= 2) return `Astronomers disagree about ${name}: the same observations have been read as ${listAnd(kinds.filter((k, i) => st[i] === "reading"))}. ${n === 2 ? "Both are" : "Each is"} shown.`;
  if (st[0] === "seen" || st[0] === "points") return `Telescopes have looked at ${name}, and what they saw points to the first world: ${kinds[0]}. ${n === 2 ? "The other is" : "The others are"} shown because ${n === 2 ? "it is" : "they are"} not ruled out.`;
  if (st.includes("reading")) return `Telescopes have looked at ${name}, and astronomers do not agree on what they saw. It has ${num} pictures.`;
  return `Telescopes have looked at ${name}, but what they saw cannot yet tell these ${num} worlds apart: ${listAnd(kinds)}.`;
}

// ---------- Part A: the overview ----------
const KINDNOUN = { "temperate rocky": "a rocky planet at a temperate distance from its star", "cold rocky: icy or desert": "a cold rocky planet", "airless or scorched rock": "a scorched rocky planet", "venus-like": "a rocky planet as strongly heated as Venus",
  "lava world": "a rocky planet hot enough to melt its own surface", "cold neptune or ice giant": "a cold giant like Neptune", "young, self-luminous giant": "a young giant planet, still glowing with the heat of its birth", "puffy planet or super-puff": "a planet of extremely low density, sometimes called a super-puff" };
function kindNoun(w) {
  const c = categorize(w), k = c.subName.toLowerCase();
  if (k === "young, self-luminous giant" && (w.age || 5) >= 0.5) return "a giant planet that still glows with heat left over from its formation";
  // a rocky reading that the worlds shown do not settle: say so, since a gas planet is also offered
  const gasAlt = w.scenarios.some(x => x.ground === "clouds" && x.deck !== "h2so4") && /rocky|rock|lava|venus/.test(k);
  if (KINDNOUN[k] && gasAlt) return KINDNOUN[k] + ", if it is rocky; it may instead be wrapped in a deep hydrogen atmosphere with no surface";
  if (/hot jupiter/.test(k) && (w.P || 0) > 10) return `a giant planet heated as strongly as ${/ultra/.test(k) ? "an ultra-hot" : "a hot"} Jupiter, though on a ${Math.round(w.P)}-day orbit`;   // "hot Jupiter" is a name for orbits of a few days
  if (KINDNOUN[k]) return KINDNOUN[k];
  if (/sub-neptune/.test(k)) return `a ${k.replace(/sub-neptune/, "sub-Neptune")}, a planet between Earth and Neptune in size, a kind the Solar System lacks`;
  return `${/^[aeiou]/.test(k) ? "an" : "a"} ${k.replace(/jupiter/g, "Jupiter").replace(/neptune/g, "Neptune").replace(/saturn/g, "Saturn")}`;
}
function whatItIs(w) {
  if (isSolar(w)) return `${dispName(w)} is one of the Solar System's own worlds. It is drawn by the same steps as every exoplanet, from its size, mass and orbit alone, so that the steps can be checked against a place we know.`;
  const K = knownOf(w), R = rE(w), M = mE(w), big = R > 6, d = (DISC[archName(w)] || w.disc || [])[5] || w.dist;
  const size = big ? wideAs(R / 11.21, "Jupiter") : wideAs(R, "Earth"), mass = M ? (big ? heavyAs(M / 317.8, "") : heavyAs(M, "")) : "";
  const s1 = `${uc1(kindNoun(w))}. It is ${K.rMeas ? "" : "roughly "}${size}${mass ? ` and ${K.mMeas ? "" : "perhaps "}${mass}` : ""}${K.rMeas && K.mMeas ? "" : ` (${[K.rMeas ? "" : "its size is " + K.sizeHow, K.mMeas ? "" : "its mass is " + K.massHow].filter(Boolean).join("; ")})`}.`;
  const close = w.locked ? ", so close that one side probably always faces the star" : "";
  const nst = K.row ? K.row[20] || 1 : 1, wide = nst > 1 && !w.star2;   // other stars in the system, not drawn (the catalogue gives no orbit for them)
  const s2 = `It circles ${w.star.name}, ${starKind(w.star)}${w.star2 ? ", which has a companion star" : wide ? `, one of ${nst === 2 ? "two" : nst === 3 ? "three" : nst} stars in the system` : ""}${d ? `, ${nf(d * 3.26156)} light-years from us` : ""}, once every ${yearOf(w)}${close}.`;
  // a heavy companion of a brown dwarf: whether to call it a planet is a matter of definition, and the reader should know
  const bd = typeof isBrownDwarf === "function" && isBrownDwarf(w.star), q = M && w.star.M ? M / 332946 / w.star.M : 0;
  const s3 = bd && q > 0.1 ? ` It is ${q > 0.3 ? "almost half as heavy as" : "a sizeable fraction of the mass of"} the brown dwarf it circles, so many astronomers would call the pair a double brown dwarf rather than a planet and its star: it probably formed the way double stars do, not in a disc. It is listed as a planet because it is lighter than about 13 Jupiters.` : "";
  const recS = (typeof recOf === "function" && recOf(w)) || (typeof ctxOf === "function" && ctxOf(w)), s4 = wide && recS && recS.text.system ? " The other stars are described below; they are not yet drawn in the sky." : wide ? ` The other star${nst > 2 ? "s are" : " is"} not drawn: the catalogue does not give ${nst > 2 ? "their" : "its"} distance from ${w.star.name}, so where ${nst > 2 ? "they" : "it"} would appear in the sky is unknown.` : "";
  return s1 + " " + s2 + s3 + s4;
}
const METHOD_PLAIN = ["by the dimming of its star each time it passes in front, which is called a transit", "by the wobble its pull gives its star", "when its gravity briefly magnified the light of a star far behind it, which is called gravitational microlensing. Such an alignment happens only once, so the planet will probably never be seen again from Earth", "in photographs, as a faint point of light beside its star",
  "by the way it shifts the transit times of a neighbouring planet", "by changes in the timing of its two stars' eclipses", "by the small brightness changes it causes along its orbit", "by its effect on a pulsar's ticks", "by the sideways wobble it gives its star on the sky", "by its effect on its star's pulsations", "by the way it stirs the gas disc around its star"];
const OBS_NOTE = /JWST|Hubble|HST|Spitzer|spectr|phase curve|eclipse|photographed|imaged|helium|Lyman|measured its|measured at|detected in its/;   // a note that reports an observation of the planet itself
function observedPara(w, used) {
  if (isSolar(w)) return "Spacecraft have visited it. None of that knowledge is used in the picture, which is the point of the test.";
  const an = archName(w), K = knownOf(w), d = DISC[an] || w.disc || [], row = K.row, yr = d[0] || (row && row[15]), ref = d[2] || (row && row[17]), out = [];
  const hand = typeof OBS_HAND !== "undefined" && OBS_HAND[fKey(an)];
  if (yr || ref) out.push(`It was found${yr ? ` in ${yr}` : ""}${ref ? ` (${discCite(w, ref, used)})` : ""}${K.method != null && METHOD_PLAIN[K.method] ? " " + METHOD_PLAIN[K.method] : ""}.`);
  // the archive's own flag (column 22): the planet's confirmation has been questioned in a published paper
  if (row && row[22] && !/disput|question|doubt/i.test(w.sub || "")) out.push("The NASA Exoplanet Archive notes that a published paper has questioned whether this planet is real.");
  const R = typeof recOf === "function" && recOf(w);   // a planet with a researched record: the account comes from the record alone
  if (R) { out.push(R.text.observed); return out.join(" "); }
  const st0 = typeof STORY !== "undefined" && (STORY[an] || STORY[w.name]);   // a fuller account that tells how the mass was measured replaces the general sentence
  // where the new text explains how the mass or size was measured, it wins and the general sentence is left out
  const cx0 = typeof ctxOf === "function" && ctxOf(w), cxAll = cx0 ? Object.values(cx0.text).join(" ") : "";
  const massSaid = cx0 && /\bweigh|\bmass(es)?\b/i.test(cxAll), sizeSaid = cx0 && K.rMeas && /\b(radius|radii)\b/i.test(cxAll);
  if (!hand) out.push(`${sizeSaid ? "" : K.rMeas ? `Its size comes ${K.sizeHow}.` : "Its size has not been measured."} ${(st0 && /Its mass/.test(st0.obs || "")) || massSaid ? "" : K.massSays}`.trim());
  const F = findingsOf(w), gm = GIANT.MEAS[an] || GIANT.MEAS[w.name] || {};
  // one pipeline for every planet: a fuller account where one has been written (STORY), else the literature summary; measured values
  // the summary does not mention are added from MEAS, so nothing the drawing uses goes unsaid
  const story = typeof STORY !== "undefined" && (STORY[an] || STORY[w.name]), rp = typeof REVIEW_PLAIN !== "undefined" && (REVIEW_PLAIN[an] || REVIEW_PLAIN[w.name]);
  const extra = base => !gm.text ? "" : gm.text.split(/(?<=[.)])\s+(?=[A-Z])/).filter(t => { const c = t.match(CITE_RE); return c && !c.some(x => base.includes(x.replace(/[()]/g, "").trim())); }).join(" ");
  const cx = typeof ctxOf === "function" && ctxOf(w);   // reader context written from the planet's key papers replaces the older summaries
  const plain = (cx && (x => cx.text.observed + (x ? " " + x : ""))(extra(cx.text.observed))) || hand || (story && story.obs) || (rp && (x => endDot(rp) + (x ? " " + x : ""))(extra(rp))) || gm.text || (F && F.t ? `${F.t} (${F.src.replace(/ \((.*)\)$/, "; $1")})` : "") || (sp => sp && TELE.test(sp.verdict || "") ? stripLead(sp.verdict) : "")(w.scenarios.find(s => s.spot))
    || (n => n && OBS_NOTE.test(n) ? n : "")(NOTES[noteKey(an)] || NOTES[noteKey(w.name)]) || (!w.auto && w.sub && /\d{4}\)/.test(w.sub) ? w.sub.split(/(?<=[.)])\s+(?=[A-Z])/).slice(1).join(" ") : "");
  // the literature summary may restate what the line above already says (no mass measured, no atmosphere data): keep only what is new
  const fresh = plain && !hand ? plain.split(/(?<=\.)\s+(?=[A-Z])/).filter(t => !(/(its|the) mass has not been measured|no atmosphere or spin data/i.test(t) && !K.mMeas)).join(" ") : plain;
  if (fresh) out.push(endDot(plainLit(/^[a-z]/.test(fresh) ? "Telescopes found " + fresh : fresh)));
  if (!fresh) out.push(`Nothing has been observed beyond its ${listAnd([K.rMeas ? "size" : "", K.mMeas ? "mass" : "", "orbit"].filter(Boolean))}. Everything else on this page is a prediction.`);
  return out.join(" ");
}
function interestPara(w) {
  const R = typeof recOf === "function" && recOf(w); if (R) return R.text.why;
  const C = typeof ctxOf === "function" && ctxOf(w); if (C && C.text.why) return C.text.why;
  const an = archName(w), st = typeof STORY !== "undefined" && (STORY[an] || STORY[w.name]), h = (st && st.why) || (typeof INTEREST !== "undefined" && INTEREST[fKey(an)]);
  if (h) return h;
  const n = NOTES[noteKey(an)] || NOTES[noteKey(w.name)];
  if (!n || OBS_NOTE.test(n)) return "";   // a note that reports an observation is told under "What has been observed" instead
  const obs = observedPara(w); return obs.includes(n.replace(/\.$/, "")) ? "" : n;
}

// one line under the planet's name
function hookShort(w) {
  if (isSolar(w)) return "One of the Solar System's own worlds, drawn here as a test of the guide.";
  const st = w.star, d = (DISC[archName(w)] || w.disc || [])[5] || w.dist;
  const star = isWhiteDwarf(st) ? "a white dwarf" : isBrownDwarf(st) ? "a brown dwarf" : st.Teff < 3900 ? "a red dwarf" : st.Teff < 5300 ? "an orange star" : st.Teff < 6000 ? "a Sun-like star" : st.Teff < 7500 ? "a white star" : "a blue-white star";
  return `${uc1(kindNoun(w).replace(/,.*$/, ""))}, circling ${star}${w.star2 ? " and its companion" : ""}${d ? ` ${nf(d * 3.26156)} light-years away` : ""}.`;
}
// ---------- the caption under the picture: where you are, and which world this is ----------
function worldClause(w, sc) {
  if (isSolar(w)) return `This is ${dispName(w)} as the guide's rules draw it from its size, mass and orbit alone: ${kindOf(w, sc)}. It is here to test those rules against a place we know.`;
  const n = w.scenarios.length, st = standingOf(w, sc), k = kindOf(w, sc), what = isGiantScene(sc) ? "clouds" : "air or surface";
  if (st === "predicted") return !lookedAt(w) ? (n === 1 ? `Nobody has looked at its ${what} yet: this is what a planet of its size and temperature is expected to be.` : `Nobody has looked at its ${what} yet. This picture shows one of ${n} possibilities: ${k}.`)
    : `This picture shows ${k}, a possibility no telescope has tested.`;
  if (st === "seen") return isGiantScene(sc) && /^Model/.test(sc.verdict || "") ? `Telescopes have studied this planet, and the picture uses what they measured; the rest is calculated.` : `This picture shows what telescopes saw: ${k}.`;
  if (st === "points") return `This picture shows ${k}, which is what the observations point to.`;
  if (st === "reading") return `Astronomers disagree about this planet. This picture shows one reading: ${k}.`;
  if (st === "open") return `This picture shows ${k}, one of ${n > 1 ? n + " worlds" : "the worlds"} the observations leave open.`;
  return `This picture shows ${k}, which the observations argue against but do not rule out.`;
}

// ---------- hand-written paragraphs: why a planet matters, and fuller accounts of what has been observed ----------
// Keys as FINDINGS: the archive name in lower case without spaces or hyphens. Each fact is one the guide already holds in its notes
// and references; the citations in OBS_HAND were checked against the arXiv records in review/raw.
const INTEREST = {
  trappist1e: "Of the seven TRAPPIST-1 planets it is the one best placed to hold liquid water, and it is close enough for JWST to test for air. Red dwarfs are the commonest stars, so whether their small planets can keep atmospheres decides where most of the Galaxy's temperate worlds are.",
  trappist1b: "It was the first Earth-sized planet whose heat JWST measured directly. The answer, no thick air, set the tone for the search around red dwarfs.",
  proximacenb: "It is the nearest planet beyond the Solar System, at a distance from its star where water could be liquid. It does not pass in front of its star, so its size and air are unknown, and the star's flares may long ago have stripped it.",
  lhs1140b: "It is one of the best candidates for a temperate world rich in water: too dense for a deep layer of gas, and placed where an ocean could stay open on the side that faces its star.",
  kepler10b: "It was the Kepler telescope's first rocky planet, and one of the first whose density showed rock and iron.",
  hd189733b: "It is one of the two best-studied hot Jupiters, and the first exoplanet whose colour was measured: a deep blue.",
  kepler16b: "It was the first planet found circling two stars at once, so it has two suns in its sky.",
  wasp39b: "It is where JWST first found carbon dioxide in an exoplanet's air, and then sulfur dioxide made by starlight: the first chemistry driven by light seen beyond the Solar System.",
  wasp121b: "It is an ultra-hot giant, so close to its star that tides pull it out of round, and its air has been followed from the day side to the night side.",
  hd209458b: "It was the first planet seen crossing the face of its star, and the first whose atmosphere was detected.",
  wasp107b: "It is as wide as Jupiter with about a tenth of its mass, one of the puffiest planets known, which makes its air unusually easy to read.",
  betpicb: "It is a young giant still glowing with the heat of its birth, photographed directly, and the first exoplanet whose spin was measured.",
  lhs3844b: "It was the first rocky planet of a red dwarf shown to have no atmosphere, and it remains one of the clearest cases. Red dwarfs are the commonest stars, so whether their planets can keep air at all decides where life could be.",
  toi270d: "It is one of only a few planets of this in-between size whose atmosphere has been read in detail, and the disagreement about it matters. If it has an ocean, worlds like it would be a large new class of places where water could be liquid. If it has none, they are not.",
  k218b: "It is at the centre of the argument over whether planets of this size can hide oceans under hydrogen, and of a disputed claim to have seen a gas that on Earth only living things make.",
  kepler452b: "It has been called Earth's cousin: a little larger than Earth, with a 385-day year around a star like the Sun. Whether the planet exists at all has since been questioned.",
  "55cnce": "It is a lava world whose year lasts 18 hours. JWST found signs of air above the molten rock, which would make it the first rocky exoplanet with a detected atmosphere.",
  gj1214b: "For a decade it was the model of a small planet hidden under haze: every spectrum came back flat. JWST finally measured its heat and showed how reflective that haze is.",
  kepler186f: "It was the first Earth-sized planet found in the habitable zone of another star.",
  kelt9b: "It is the hottest planet known. Its day side is hotter than many stars, hot enough to break molecules apart into atoms.",
  wasp76b: "It became famous for a claim that iron rains on its night side, a reading that later work has questioned.",
};
const OBS_HAND = {
  toi270d: "Its size comes from the share of starlight it blocks. Its mass, 4.8 Earth masses, was measured from the wobble the three planets give their star; size and mass together mean it cannot be rock alone, and must carry a layer of gas or water (Van Eylen et al. 2021). The planets also pull on each other and shift their transit times by about ten minutes, which sharpens the masses (Kaye et al. 2022). Hubble found the first signs of a hydrogen-rich atmosphere with water vapour (Mikal-Evans et al. 2023). JWST then read the starlight filtered through its air and found methane, carbon dioxide and water (Benneke et al. 2024; Holmberg & Madhusudhan 2024). The two teams agree on the gases but not on what lies beneath them. A later JWST spectrum in the mid-infrared shows methane and carbon dioxide again, with hints of further gases not yet identified (Holmberg et al. 2026)",
};

// Hand-written words for the worlds of the best-studied planets: whose reading each world is, in one or two plain sentences (why), a
// clearer title than the internal name (title), the world in a few words (kind), and how it stands (standing; internal, never shown).
// The internal names stay as they are, because the random layout of each landscape is fixed by them.
const WORDS = {
  trappist1e: { worlds: {
    "Shore of an eyeball ocean": { standing: "open", why: "JWST has ruled out a hydrogen-rich atmosphere here, but not a heavier one such as nitrogen (Espinoza et al. 2025; Glidden et al. 2025). With air like that, the side facing the star could hold open water." },
    "Snowball": { standing: "open", why: "The same air, with too weak a greenhouse to keep the water liquid. JWST's first spectra do not rule it out." },
    "Bare rock": { standing: "open", why: "No air at all fits JWST's first spectra as well as nitrogen air does (Glidden et al. 2025)." } } },
  trappist1b: { worlds: { "Bare dark rock": { standing: "seen", why: "JWST measured the heat of its day side: about 490 K, as hot as bare rock with no air would be (Greene et al. 2023). Watching a whole orbit showed almost no heat reaching the night side, and fresh, dark rock fits best (Gillon et al. 2025)." } } },
  lhs1140b: { worlds: {
    "Eyeball ocean": { standing: "points", why: "JWST rules out a hydrogen-rich atmosphere and hints at air rich in nitrogen (Cadieux et al. 2024; Damiano et al. 2024). The planet's density suggests it is 10 to 20% water, so the side facing the star could be open ocean." },
    "Snowball": { standing: "open", why: "The same water-rich planet with its ocean frozen over. The observations so far do not rule it out." } } },
  kepler10b: { worlds: { "Shore of the lava sea": { why: "Its density shows rock and iron, and its day side is hot enough to melt rock. Nobody has measured whether it has air; in this world it has none." } } },
  hd189733b: { worlds: { "Above the blue haze": { standing: "seen", why: "Hubble measured its colour from the light that goes missing when the planet passes behind its star: a deep blue (Evans et al. 2013). The blue probably comes from haze scattering light, as air does on Earth." } } },
  kepler16b: { worlds: { "Above the cloud tops": { why: "What a giant at this temperature is expected to look like. Its orbit round two stars is measured (Doyle et al. 2011); its clouds are not." } } },
  wasp39b: { worlds: { "Above the clouds": { standing: "seen", why: "JWST has read its air in detail, finding carbon dioxide, water, and sulfur dioxide made by starlight (Tsai et al. 2023). The colours of its clouds are calculated from its temperature." } } },
  wasp121b: { worlds: { "High in an ultra-hot sky": { standing: "seen", why: "Its heat has been followed right round its orbit, which gives the temperatures of its day and night sides (Mikal-Evans et al. 2023). The picture uses those; the look of the glowing sky is calculated." } } },
  hd209458b: { worlds: { "Above the cloud tops": { standing: "seen", why: "Its atmosphere was the first ever detected, from sodium in the starlight it filters (Charbonneau et al. 2002), and JWST has since measured its air (Xue et al. 2024). The colours of its clouds are calculated from its temperature." } } },
  wasp107b: { worlds: { "Above the haze": { standing: "seen", why: "JWST has read its air in detail (Sing et al. 2024; Welbanks et al. 2024). The haze and its colours are calculated from its temperature." } } },
  betpicb: { worlds: { "Above the glowing clouds": { standing: "seen", why: "It has been photographed directly, glowing with the heat of its birth, and its spin has been measured (Snellen et al. 2014). The cloud patterns are calculated." } } },
  lhs3844b: { worlds: { "Bare dark rock": { standing: "seen", why: "Spitzer watched the planet through whole orbits and found a hot day side and a cold night side, which air would have evened out (Kreidberg et al. 2019). JWST then found dark, basalt-like rock and no volcanic gas (Zieba et al. 2026)." } } },
  toi270d: { intro: "Two teams disagree about TOI-270 d: one sees a deep, hot atmosphere with no surface, the other an ocean under hydrogen. Both are shown.", worlds: {
    "Above a metal-rich haze": { standing: "reading", title: "Deep hot atmosphere, no surface", kind: "a deep, hot atmosphere with no surface", why: "The reading of Benneke et al. 2024: the gases JWST saw are mixed through a deep, hot atmosphere rich in heavy elements, with no ocean underneath." },
    "Hycean ocean": { standing: "reading", title: "Ocean under hydrogen (“Hycean”)", kind: "an ocean under hydrogen air", why: "The reading of Holmberg & Madhusudhan 2024: the same gases sit in a thin hydrogen atmosphere above an ocean of liquid water. A world like that is called Hycean." } } },
  k218b: { worlds: {
    "Above the hydrogen haze": { standing: "reading", title: "Deep hydrogen atmosphere, no ocean", kind: "a deep hydrogen atmosphere with no ocean", why: "One reading of its JWST spectrum: a deep hydrogen atmosphere with no ocean, which several teams find fits as well as an ocean does (Wogan et al. 2024; Shorttle et al. 2024)." },
    "Hycean ocean": { standing: "reading", title: "Ocean under hydrogen (“Hycean”)", kind: "an ocean under hydrogen air", why: "The other reading: an ocean of liquid water under thin hydrogen air (Madhusudhan et al. 2023). A world like that is called Hycean." } } },
  "55cnce": { worlds: {
    "Lava sea under a CO/CO₂ atmosphere": { standing: "points", why: "JWST's measurements of its heat fit an atmosphere of carbon monoxide or carbon dioxide released by the lava, though not conclusively (Hu et al. 2024)." },
    "Magma ocean after its air has gone": { standing: "seen", why: "On some JWST visits the glow of the day side almost vanishes, as if the air comes and goes (Patel et al. 2024). This is the planet between outbursts." } } },
  gj1214b: { worlds: { "Above the haze of a mini-Neptune": { standing: "seen", why: "JWST followed its heat round a whole orbit and found it unusually reflective: a thick, bright haze over air rich in heavy elements (Kempton et al. 2023)." } } },
};
