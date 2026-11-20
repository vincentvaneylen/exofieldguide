// One reference style (v4). Every "Author et al. Year" in reader-facing text becomes a link to that paper's entry on the References page
// (refs.html), which gives the title, authors, journal and the link out. The registry is js/data-refs.js, built by tools/refs_build.py.
// A citation the builder could not match to a record still links to the References page, where it is listed as not yet matched.
const CITE_RE = /((?:(?:de|van|von|Van|De|Di|Le|La|Weiner|Ramos|Suárez|García|Lillo) )?[A-Z][A-Za-zéüöäñçøåíáóèúÉ'’\-]+(?: (?:&|and) (?:(?:de|van|von|Van|De|Di|Le|La) )?[A-Z][A-Za-zéüöäñçøåíáóèú'’\-]+| et al\.)),? \(?((?:19|20)\d\d)([a-z])?\b/g;
const CITE_BAD = /^(In|On|Since|By|Until|From|JWST|Hubble|Spitzer|TESS|Cycle|Kepler|CRIRES|Early|Late|Before|After|Around|Program|GO|Gaia|TOI|HD|GJ|K2|Data|DR|Team|ERS|MIRI|AAS|UCLA|VIII|MAROON|Collaboration|January|February|March|April|May|June|July|August|September|October|November|December)\b/;
const refSlug = c => "u-" + c.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
function refKeysFor(cite, pname) {
  const by = typeof REF_BY !== "undefined" ? REF_BY[cite] || REF_BY[cite.replace(/[a-z]$/, "")] : null;
  if (!by) return null;
  if (by[pname] || by[""]) return by[pname] || by[""];
  const all = [...new Set(Object.values(by).flat())];   // cited for another planet: safe to reuse only if the citation means one paper
  return all.length === 1 ? all : null;
}
// link every citation in a piece of text (HTML allowed; existing links are left alone). used: a Set that collects the keys cited
function linkCites(html, pname, used) {
  if (!html) return "";
  let inA = 0;
  return html.split(/(<[^>]+>)/).map(seg => {
    if (seg[0] === "<") { if (/^<a\b/i.test(seg)) inA++; else if (/^<\/a/i.test(seg)) inA = Math.max(0, inA - 1); return seg; }
    if (inA) return seg;
    return seg.replace(CITE_RE, (m, a, y, sfx) => {
      if (CITE_BAD.test(a)) return m;
      const cite = `${a} ${y}${sfx || ""}`, keys = refKeysFor(cite, pname), key = keys ? keys[0] : refSlug(cite);
      if (used) (keys || [key]).forEach(k => used.add(k));
      return `<a class="cite" href="refs.html#${key}">${m}</a>`;
    });
  }).join("");
}
// the discovery paper: its entry on the References page is made from the catalogue's own reference and ADS bibcode
function discKey(w) { const row = catRow(w); return row && row[18] ? "ads" + row[18].replace(/[^A-Za-z0-9]/g, "") : null; }
function discCite(w, ref, used) {
  const k = discKey(w) || refSlug(ref);
  if (used) used.add(k);
  return `<a class="cite" href="refs.html#${k}">${ref}</a>`;
}
// one entry of a reference list, in the house format: authors, year, title, journal, and the link out
function refEntry(key) {
  const r = typeof REFLIST !== "undefined" ? REFLIST[key] : null;
  if (r) {
    const out = r.url ? ` <a href="${r.url}" target="_blank" rel="noopener">${/arxiv\.org/.test(r.url) ? "arXiv" : /adsabs/.test(r.url) ? "ADS" : "Paper"} ↗</a>` : "";
    if (r.kind === "paper") return `${r.authors} ${r.year}. <i>${r.title}</i>.${r.journal ? " " + r.journal.replace(/\.$/, "") + "." : ""}${out}`;
    return `${r.cite}.${r.what ? " On " + r.what + "." : ""}${out}`;
  }
  if (/^ads/.test(key) && typeof DISC_BY_KEY !== "undefined" && DISC_BY_KEY.get(key)) { const d = DISC_BY_KEY.get(key);
    return `${d.ref}. Discovery paper${d.n > 1 ? ` (${d.n} planets)` : ""}. <a href="https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(d.bib)}/abstract" target="_blank" rel="noopener">ADS ↗</a>`; }
  return null;
}
let DISC_BY_KEY = null;
function discIndex() {   // every discovery paper in the catalogue, by key
  if (DISC_BY_KEY) return DISC_BY_KEY; DISC_BY_KEY = new Map();
  for (const r of CAT) { if (!r[18]) continue; const k = "ads" + r[18].replace(/[^A-Za-z0-9]/g, ""), e = DISC_BY_KEY.get(k); if (e) { e.n++; if (e.planets.length < 6) e.planets.push(r[0]); } else DISC_BY_KEY.set(k, { ref: r[17], bib: r[18], n: 1, planets: [r[0]] }); }
  return DISC_BY_KEY;
}
// a planet's own list: what its text cites, then other papers about it
function refsForPlanet(w, used) {
  discIndex(); const an = archName(w), items = [], seen = new Set();
  // one paper, one line: the catalogue's discovery record (ADS) and the same paper's arXiv record are merged when they share author and year
  const label = k => { const r = typeof REFLIST !== "undefined" ? REFLIST[k] : null; if (r && r.cite) return r.cite.toLowerCase(); const d = /^ads/.test(k) && DISC_BY_KEY.get(k); return d ? d.ref.toLowerCase() : k; };
  const keys = [...used].filter(k => !seen.has(k) && seen.add(k)), byLab = new Map();
  for (const k of keys) { const l = label(k); if (!byLab.has(l)) byLab.set(l, []); byLab.get(l).push(k); }
  for (const ks of byLab.values()) { const full = ks.find(k => !/^ads/.test(k) && refEntry(k)) || ks[0], ads = ks.find(k => /^ads/.test(k) && k !== full), e = refEntry(full);
    const extra = ads && DISC_BY_KEY.get(ads) ? ` Discovery paper. <a href="https://ui.adsabs.harvard.edu/abs/${encodeURIComponent(DISC_BY_KEY.get(ads).bib)}/abstract" target="_blank" rel="noopener">ADS ↗</a>` : "";
    items.push(e ? `<li id="r-${full}">${e}${extra}</li>` : `<li id="r-${full}">${full.replace(/^u-/, "").replace(/-/g, " ")}: cited in the text, not yet matched to a record. <a href="refs.html#${full}">See the References page</a></li>`); }
  const more = (typeof REF_MORE !== "undefined" && REF_MORE[an]) || [];
  return { main: items.join(""), more: more.map(m => `<li>${m[1]}. <i>${m[2]}</i>.${m[3] ? " " + m[3].replace(/\.$/, "") + "." : ""} <a href="https://arxiv.org/abs/${m[0]}" target="_blank" rel="noopener">arXiv ↗</a></li>`).join("") };
}
