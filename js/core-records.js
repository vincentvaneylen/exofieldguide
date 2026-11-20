// Records (v5). A planet that has a researched record (records/<slug>.json, built into data-records.js) takes everything about itself
// from that record: the star and planet numbers, the measured values the drawing uses, which world leads, its texts and its references.
// Every older per-planet store is emptied for that planet first, so nothing written before the record can leak back in.
// The engine and the general rules are untouched: a record only feeds them inputs through the stores they already read.
const REC_ALIAS = {};   // older display names ("LHS 3844b", "β Pictoris b") → the record's name
const recOf = w => typeof RECORDS !== "undefined" && w ? RECORDS[w.name] || RECORDS[archName(w)] || null : null;
// Kinds of world that papers describe and the size-and-orbit rules do not offer. These are general templates, not planet data:
// a record names the kind and gives the paper's verdict; the template says how that kind is drawn.
const REC_WORLD = {
  miscible: { like: "clouds", name: "Above a hot, fully mixed (miscible) envelope", deck: "silicate", theta: 50, lat: 10, atm: { P: 0.1, gas: "H₂" }, weather: "none", base: 1,
    layers: [[1, "#a39b8c", "H₂ mixed with CO₂, CH₄, H₂O"], [0.75, "#8a7b70", "dense, miscible envelope"], [0.5, "#7a5a43", "rock + iron"]], life: "Not at any surface." },
  hycean: { like: "ocean", name: "Ocean under hydrogen-rich air (hycean)", ground: "ocean", land: -1, theta: 50, lat: 10, atm: { P: 5, gas: "H₂" }, T: 300, weather: "rain", clouds: 0.6, base: 2,
    layers: [[1, "#7d8fa8", "thin H₂ atmosphere"], [0.93, "#2b6aa3", "liquid water ocean"], [0.85, "#8fc3d9", "high-pressure ice"], [0.6, "#7a5a43", "rock"]], wx: "Rain under a thick, warm sky.", life: "Possible only if the ocean exists." },
  bareLava: { like: "lava", name: "Magma ocean with no lasting air", atm: null, base: 1, weather: "sparks", wx: "The magma lies under at most a thin veil of rock vapour: a black sky over a glowing sea." }
};
const REC_RETIRED = {};   // what was removed, per planet: shown in the lab so the hand-over can be audited
(function applyRecords() {
  const alt = n => n.replace(/ ([a-z])$/, "$1");
  for (const [n, r] of Object.entries(RECORDS)) {
    const gone = REC_RETIRED[n] = [];
    // 1. retire the older stores
    for (let i = ALL.length - 1; i >= 0; i--) { const w = ALL[i]; if (w.solar || !(archName(w) === n || fKey(w.name) === fKey(n) || fKey(w.name) === fKey(r.show) || (r.also || []).some(x => fKey(x) === fKey(w.name)))) continue;
      REC_ALIAS[w.name] = n; if (w.id) REC_ALIAS[w.id] = n; ALL.splice(i, 1); const j = WORLDS.indexOf(w); if (j >= 0) WORLDS.splice(j, 1); gone.push(j >= 0 ? "hand-entered world" : "hand-entered sample world");
      for (const S of [FINDINGS, SPOT]) if (S[fKey(w.name)] != null) { delete S[fKey(w.name)]; gone.push(S === FINDINGS ? "FINDINGS" : "SPOT"); } }
    for (const a of [r.show, ...(r.also || [])]) { REC_ALIAS[a] = n; REC_ALIAS[alt(a)] = n; }
    REC_ALIAS[alt(n)] = n;
    const drop = (S, k, what) => { if (S && S[k] != null) { delete S[k]; gone.push(what); } };
    for (const k of [n, alt(n), r.show, alt(r.show), ...(r.also || [])]) { drop(GIANT.MEAS, k, "MEAS"); drop(typeof REVIEW_PLAIN !== "undefined" && REVIEW_PLAIN, k, "REVIEW_PLAIN"); drop(typeof STORY !== "undefined" && STORY, k, "STORY"); drop(typeof REVIEW !== "undefined" && REVIEW, k, "REVIEW"); drop(DATA_FIX, k, "DATA_FIX"); drop(typeof REF_MORE !== "undefined" && REF_MORE, k, "REF_MORE"); }
    for (const k of [fKey(n), fKey(r.show)]) { drop(FINDINGS, k, "FINDINGS"); drop(SPOT, k, "SPOT"); drop(typeof OBS_HAND !== "undefined" && OBS_HAND, k, "OBS_HAND"); drop(typeof INTEREST !== "undefined" && INTEREST, k, "INTEREST"); drop(typeof WORDS !== "undefined" && WORDS, k, "WORDS"); }
    if (typeof NOTES !== "undefined") for (const k of [noteKey(n), noteKey(r.show)]) drop(NOTES, k, "NOTES");
    // 2. the record's numbers replace the catalogue row (the star's numbers for every planet of that star)
    const i = CAT_IX.get(n), row = i == null ? null : CAT[i], S = r.in.star || {}, p = r.in.planet || {};
    if (row) {
      for (const x of CAT_HOST.get(row[1]) || [row]) { if (S.Teff) x[2] = S.Teff; if (S.Rs) x[3] = S.Rs; if (S.Ms) x[4] = S.Ms; if (S.age) x[5] = S.age; }
      if (p.a) row[6] = p.a; if (p.P) row[7] = p.P; if (p.Rp) row[8] = p.Rp;
      if (p.Mp) { row[9] = p.Mp; row[10] = 0; delete CAT_LIM[n]; } if (p.e != null) row[11] = p.e;
    }
    // 3. measured values the drawing uses, through the stores the engine already reads
    const E = r.engine || {};
    if (E.giant) GIANT.MEAS[n] = { ...E.giant };
    if (E.rocky || E.worlds) FINDINGS[fKey(n)] = { ...(E.rocky || {}), ...(E.worlds ? { worlds: E.worlds.map(x => ({ ...REC_WORLD[x.kind], ...x, kind: undefined })) } : {}) };
    if (E.lead) SPOT[fKey(n)] = { ...E.lead, first: E.lead.first ? new RegExp(E.lead.first, "i") : undefined };
    // 4. references: the record's papers join the one registry
    const more = [];
    for (const e of r.refs) { REFLIST[e.key] = { ...e, planets: [n] }; (REF_BY[e.cite] = REF_BY[e.cite] || {})[n] = [...((REF_BY[e.cite] || {})[n] || []), e.key];
      if (!e.cited && e.arxiv && !/^nothing/.test(e.took)) more.push([e.arxiv, e.cite, e.title, e.journal]); }
    if (more.length) REF_MORE[n] = more.sort((a, b) => b[1].slice(-4) - a[1].slice(-4));
  }
})();
// a record planet's one-line summary and display name
function recordWorld(w) { const r = recOf(w); if (!r) return; w.record = true; w.sub = r.text.why.split(/(?<=[.)])\s+(?=[A-Z])/)[0]; }

// Reader context (v5): planets whose key papers were read for the reader texts (data-context.js). Only texts and references:
// the drawing and every measured value stay as the general pipeline makes them.
const ctxOf = w => typeof CONTEXT !== "undefined" && w ? CONTEXT[w.name] || CONTEXT[archName(w)] || null : null;
if (typeof CONTEXT !== "undefined") for (const [n, c] of Object.entries(CONTEXT)) for (const e of c.refs) { REFLIST[e.key] = { ...e, planets: [n] }; (REF_BY[e.cite] = REF_BY[e.cite] || {})[n] = [e.key]; }
