// The Animals dial stop (always imagined): whether this scenario can have animals at all, and if so their body plan, numbers and
// placement, each set by one planet property with its reason. Physics sets the scale and posture; the seed varies the rest.
// Animals need oxygen-rich air (Catling et al. 2005), which no exoplanet has been shown to have: the stop assumes it.
function animalPlan(w, sc, out, k) {
  const R = rng(strHash(w.name + "|" + sc.name + "|anim")), notes = [];
  const note = (input, r, effect) => notes.push([input, r, effect]);
  const gas = sc.atm ? sc.atm.gas : "", P = sc.atm ? sc.atm.P : 0, age = w.age, open = sc.land === -1;
  const no = why => ({ ok: false, why, notes: [["oxygen and time", why, "No animals"]] });
  // the oxygen gate: hydrogen-rich air and free oxygen cannot coexist (they react), and Earth took about 2 billion years to build an oxygen-rich atmosphere
  if (/^H/.test(gas)) return no("Hydrogen-rich air cannot hold much free oxygen (the two react), and animals need oxygen (Catling et al. 2005)");
  if (age != null && age < 2) return no(`The system is about ${age < 1 ? Math.round(age * 1000) + " million" : age.toFixed(1) + " billion"} years old: Earth needed about 2 billion years before oxygen rose (Catling et al. 2005)`);
  if (!open && !sc.plants && !sc.lifeParent) return no("Nothing grows here for animals to eat");
  if (k.bk === "barren") return no("Too hot for any land plant, so nothing for animals to eat");
  if (P < 0.3) return no(`${P} bar is too thin for oxygen-rich air at a useful pressure (animals need roughly 0.01 bar of oxygen; Catling et al. 2005)`);
  note("oxygen-rich air (assumed)" + (age != null ? `, ${age.toFixed(1)} billion years` : ", age unknown"),
    "Animals need oxygen: aerobic metabolism gives about ten times the energy per meal, and Earth's air took about 2 billion years to build it up (Catling et al. 2005). No exoplanet's oxygen has been measured: this stop assumes it",
    "Animals allowed");
  const g = k.gRel;
  // body plan in units of body length: leg length, neck length, leg pairs (0 = swimmer), girth | sail or crest, neck angle, tail, head size
  let legL = Math.max(0.2, Math.min(1.25, 0.55 / g)), neck = Math.max(0.12, Math.min(0.75, 0.32 / Math.sqrt(g))), pairs = 2, girth = 0.15, crest = 0, nAng = 0.75, tail = 0.25, head = 0.075;
  let size = Math.max(1.2, Math.min(5.5, 2.4 / Math.sqrt(g)));
  if (g < 0.8) note(`${g.toFixed(2)} g`, "Weight grows with size³ but bone strength only with size², so low gravity lets animals stand taller on thinner legs (square-cube scaling; Dewolf et al. 2025 for elephants and sauropods)", "Tall, long-necked, long-legged grazers");
  else if (g > 1.4) { pairs = 3; girth = 0.19; legL = Math.min(legL, 0.28); neck = 0.14; nAng = 0.35; head = 0.085;
    note(`${g.toFixed(2)} g`, "Strength falls behind weight in high gravity, so bodies stay low and spread their load over more, thicker legs, like Clement's Mesklinites (Mission of Gravity, 1954)", "Low, wide bodies on six thick legs"); }
  else note(`${g.toFixed(2)} g`, "Earth-like gravity allows Earth-like proportions", "Four-legged grazers of familiar build");
  const Tb = k.Tb;
  if (Tb < 283) { girth += 0.03; size *= 1.15; tail = 0.12; note(`about ${Math.round(Tb)} K`, "Cold favours bulky bodies that keep heat in (Bergmann's rule) and short limbs and tails (Allen's rule)", "Bulky, round bodies"); }
  else if (Tb > 300) { crest = 0.22; note(`about ${Math.round(Tb)} K`, "Heat favours ways to shed it: thin sails and big ears carry blood close to the air (Allen's rule)", "A tall cooling sail along the back"); }
  // colour: hides blend with the ground the biome gives; under a red dwarf, dark hides absorb the scarce visible light (our reasoning)
  const red = w.star.Teff < 3900;
  let hide = mixS(MAT.straw, MAT.bark, k.bk === "savanna" || k.bk === "steppe" || k.bk === "desert" ? 0.5 : 0.8).map(v => v * 0.45), belly = mixS(hide, MAT.frost, 0.18);
  if (red) { hide = mixS(hide, MAT.basalt, 0.65); belly = mixS(belly, MAT.basalt, 0.4);
    note(`${w.star.Teff} K red dwarf`, "Under faint red light, dark hides absorb what warmth and light there is, and large eyes collect it (our reasoning, by analogy with dark leaves: Kiang et al. 2007)", "Dark hides"); }
  if (Tb < 275 + 8 && !red) { hide = mixS(hide, MAT.frost, 0.35); }
  // numbers: grassland supports herds, forest few animals, desert scattered ones (Earth's biomes as templates)
  const B = { savanna: [9, 7, "Grassland: large herds"], steppe: [8, 6, "Grassland: large herds"], tundra: [6, 4, "Tundra: small herds"], maquis: [4, 3, "Scrub: small groups"],
    broadleaf: [4, 0, "Woodland: a few animals in the clearings"], taiga: [3, 0, "Forest: a few animals in the clearings"], coldrain: [2, 0, "Rainforest: animals stay under cover; few in view"],
    jungle: [2, 0, "Rainforest: animals stay under cover; few in view"], desert: [2, 2, "Desert: scattered, solitary animals"] }[k.bk] || [4, 3, "Small herds"];
  const groups = [];
  const locked = !!(sc.climate && sc.climate.locked) || (w.locked && sc.term);
  const hd = locked ? Math.PI / 2 * (R() < 0.5 ? 1 : -1) : R() * 6.283;   // on a locked planet herds walk along the band of mild climate, side-on to the star
  if (open) {
    pairs = 0; neck = 0.1; nAng = 0.2; legL = 0; tail = 0.35; crest = 0.16; girth = 0.13; size = Math.max(4, Math.min(16, 8 / Math.sqrt(g)));
    hide = mixS(MAT.basalt, MAT.ocean, 0.3); belly = mixS(MAT.frost, MAT.basalt, 0.5);
    notes.length = 1;
    note("open ocean", "With no land, animal life would be marine: grazers of the plankton and floating meadows. Water supports their weight, so gravity limits size much less", "Large swimmers surfacing, schools under the surface");
    groups.push({ az: (R() - 0.5) * 50, d: 40 + 50 * R(), n: 3, spread: 30, sea: 1 }, { az: 180 + (R() - 0.5) * 60, d: 70 + 90 * R(), n: 4, spread: 50, sea: 1 });
  } else {
    // a herd toward the star (backlit, rim-lit silhouettes), one behind you (lit from the front), and a few animals near you
    // (the landscape camera is wide, about 110° across: a 2.5 m animal is a few pixels at 400 m, so herds stay within a few hundred metres)
    if (B[0]) groups.push({ az: (R() - 0.5) * 40, d: 110 + 200 * R(), n: B[0], spread: 10 + 5 * B[0], head: hd });
    if (B[1]) groups.push({ az: 180 + (R() - 0.5) * 70, d: 160 + 280 * R(), n: B[1], spread: 12 + 5 * B[1], head: hd + Math.PI });
    groups.push({ az: (R() < 0.5 ? -1 : 1) * (10 + 20 * R()), d: 16 + 18 * R(), n: B[0] >= 6 ? 2 : 1, spread: 6, head: hd + 0.4 });
    groups.push({ az: 180 + (R() - 0.5) * 50, d: 22 + 20 * R(), n: 1, spread: 4, head: hd - 0.5 });
    note(`${k.bk} where you stand`, "Herds follow open grass, as on Earth's savannas; forest animals stay near cover and come out at its edges", B[2]);
    if (locked) note("tidally locked", "The band of mild climate runs around the planet; migrating along it keeps the climate the same (our reasoning)", "Herds walk along the terminator band, side-on to the star");
  }
  // fliers: lift grows with air density, weight with gravity
  const lift = P / g;
  const fly = P >= 0.5 ? { n: Math.round(Math.min(40, 8 + 10 * lift)), span: Math.max(0.6, Math.min(4, 1.2 * Math.sqrt(lift))), big: lift > 2 } : null;
  if (fly) note(`${P} bar air, ${g.toFixed(2)} g`, "Lift grows with air density and weight with gravity, so dense air or low gravity favours large fliers", fly.big ? "Large gliders and flocks" : "Flocks of fliers");
  else note(`${P} bar air`, "Thin air gives little lift: flight would be hard", "No fliers");
  const line = notes.slice(1).map(x => x[2].toLowerCase()).join("; ");
  const herdN = { savanna: 30, steppe: 26, tundra: 16, maquis: 10, broadleaf: 9, taiga: 7, coldrain: 6, jungle: 6, desert: 5 }[k.bk] ?? 10;   // how many in view: grassland herds; forest animals come out in small groups at its edges
  // how much life a place can carry: usable light times how productive the biome is (grassland most, desert least); it tilts each spot's odds
  // of being nearly empty or teeming
  const prod = Math.min(1, Math.sqrt(k.par || 1)) * (open ? 0.8 : { savanna: 1, steppe: 0.9, tundra: 0.55, maquis: 0.6, broadleaf: 0.6, taiga: 0.45, desert: 0.2 }[k.bk] ?? 0.5);
  // species: the rules set the bounds, the planet's own seed picks within them, so two planets with similar gravity, climate and star still
  // have their own animals. A main grazer and a second species (smaller runners or tall browsers), each with its own build, head, coat and colour
  const Rs = rng(strHash(w.name + "|species")), pick = a => a[Math.floor(Rs() * a.length)];
  const PAL = [MAT.straw, MAT.bark, MAT.clay, MAT.sand, MAT.basalt, MAT.regolith, MAT.lichenOrange, MAT.highland].filter(Boolean);
  const coat = () => { let h = mixS(pick(PAL), pick(PAL), Rs()).map(v => v * (0.35 + 0.3 * Rs())); if (red) h = mixS(h, MAT.basalt, 0.45); if (Tb < 283 && Rs() < 0.5) h = mixS(h, MAT.frost, 0.3); return [h, mixS(h, MAT.frost, 0.12 + 0.2 * Rs())]; };
  const species = second => { const [hd2, bl2] = coat(), browse = second && Rs() < 0.4, kk = second ? (browse ? 1.35 : 0.45) : 0.75 + 0.6 * Rs();
    const L2 = Math.max(0.18, Math.min(1.35, legL * (second && !browse ? 1.15 : 1) * (0.85 + 0.3 * Rs()))), N2 = Math.max(0.1, Math.min(0.95, neck * (browse ? 1.7 : second ? 0.6 : 0.75 + 0.6 * Rs())));
    return { body: [L2, N2, pairs, girth * (0.85 + 0.35 * Rs()) * (second && !browse ? 0.85 : 1)], body2: [crest * (Rs() < 0.8 ? 1 : 0), nAng + (browse ? 0.3 : (Rs() - 0.5) * 0.3), tail * (0.5 + 1.2 * Rs()), head * (0.85 + 0.4 * Rs())],
      size: size * kk, hide: hd2, belly: bl2, pattern: pick([0, 0, 1, 2, 3]), gear: pick([0, 1, 1, 2, 3]) }; };
  const sp = [species(false), species(true)];
  const wader = { leg: 0.75 + 0.55 * Rs(), neck: 0.8 + 0.5 * Rs(), beak: (Rs() - 0.5) * 0.3, pale: Rs() < 0.5 }, swim = { fin: 0.6 + 1.0 * Rs(), size: Rs(), type: Math.floor(Rs() * 4) };   // whale-like, long-necked, plate-backed or sail-finned
  return { ok: true, bk: k.bk, herdN, prod, sp, wader, swim, notes, line, body: [legL, neck, pairs, girth], body2: [crest, nAng, tail, head], size, hide, belly, groups, fly, red, sea: open ? 1 : 0, hd };
}
// candidate spots for each group's members, around the group's centre (azimuth az, distance d; azimuth 0 = toward the star)
function animalCandidates(an, place) {
  const R = rng(97), c = [];
  const k = AN_MAX / 16;   // a pre-rendered plate draws fuller herds
  an.groups.forEach((gp, gi) => { const at = place[gi]; if (!at) return; const cx = at.x, cz = at.z, nn = Math.round(gp.n * (gi < 2 ? k : 1)), m = Math.ceil(nn * 1.6);
    const sp = gp.spread * Math.sqrt(nn / gp.n);
    for (let i = 0; i < m; i++) { const r = sp * Math.sqrt(R()), b = R() * 6.283, along = (R() - 0.5) * sp * 1.4;   // herds string out along their heading
      c.push({ x: cx + Math.cos(b) * r * 0.5 + Math.sin(gp.head || 0) * along, z: cz + Math.sin(b) * r * 0.5 + Math.cos(gp.head || 0) * along,
        h: (gp.head ?? R() * 6.283) + (R() - 0.5) * 0.7, want: nn, gi, sea: gp.sea || 0 }); } });
  return c;
}
// each group's preferred direction first, then others: on a coast the view toward the star is often sea, and in woodland a spot may be forest
const AN_ALT = [0, 20, -20, 40, -40, 180, 160, -160, 70, -70, 110, -110];
