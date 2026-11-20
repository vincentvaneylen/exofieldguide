// "About this planet" (v4). One panel, four parts, always in this order: an overview in plain English (what it is, what has been observed
// and how, why it is interesting, the worlds shown); why each part of the picture looks as it does; a technical table; references.
// Every sentence comes from ui-words.js (the overview) or ui-trace.js (the picture and the numbers). There are no status labels.
let panelTrace = null;
function fillAbout() {
  const w = cur, sc = curSc(), sc0 = w.scenarios[si], used = new Set(), pn = archName(w);
  const T = panelTrace = traceOf(w, sc, { odds: true, tint: typeof tintCache !== "undefined" ? tintCache : null });
  const L = t => linkCites(t, pn, used);
  const interest = interestPara(w);
  const rec = (typeof recOf === "function" && recOf(w)) || (typeof ctxOf === "function" && ctxOf(w)) || null;
  const A = `<section class="part"><h3>What it is</h3><p>${L(whatItIs(w))}</p>
    <h3>What has been observed, and how</h3><p>${L(observedPara(w, used))}</p>
    ${interest ? `<h3>Why it is interesting</h3><p>${L(interest)}</p>` : ""}
    ${rec && rec.text.system ? `<h3>Its star and system</h3><p>${L(rec.text.system)}</p>` : ""}
    ${rec && rec.text.history ? `<h3>How it got here</h3><p>${L(rec.text.history)}</p>` : ""}
    ${rec && rec.text.open ? `<h3>What is still open</h3><p>${L(rec.text.open)}</p>` : ""}
    <h3>The worlds shown</h3><p>${L(worldsIntro(w))}</p>
    <ul class="pworlds">${w.scenarios.map((s, i) => `<li class="${i === si ? "on" : ""}"><button type="button" data-w="${i}" ${i === si ? 'aria-current="true"' : ""}>${worldTitle(w, s)}</button>${i === si ? '<span class="onscreen">on screen</span>' : ""}<p>${L(worldWhy(w, s))}</p></li>`).join("")}</ul></section>`;
  const B = `<section class="part"><h2 class="ph">Why it looks like this</h2><p class="hint">${zoom === 2 ? "Click any part of the picture to jump to its entry here." : "Each part of the picture, and what makes it look that way."}</p>
    <dl class="pwhy">${WHY_ORDER.map(([k, title]) => T.why[k] ? `<dt id="why-${k}">${title}</dt><dd>${L(T.why[k].t)} <span class="meta">${srcTag(T.why[k].src)} ${stepLink(T.why[k].step)}</span></dd>` : "").join("")}</dl></section>`;
  const grp = (title, steps, filter) => { const rows = steps.flatMap(n => (T.steps[n] || []).filter(r => !filter || filter(r, n))); return rows.length ? `<tr><th colspan="3">${title}</th></tr>` + rows.map(r => `<tr><td>${r.label}</td><td>${L(r.value)}</td><td>${srcTag(r.src)}</td></tr>`).join("") : ""; };
  const C = `<section class="part"><h2 class="ph">Technical summary</h2>
    <p class="hint">Each number is ${srcTag(0)} by a telescope, ${srcTag(1)} from measured numbers by a stated rule, ${srcTag(2)} because nothing measures it, or ${srcTag(3)}.</p>
    <div class="tablewrap"><table class="tech">${grp("The star and the planet", [1])}${grp("Worked out from those", [2, 3, 4, 5, 6], (r, n) => !(n === 3 && r.label === "Where you stand"))}${grp(`The world on screen: ${worldTitle(w, sc0)}`, [8, 9, 10, 11, 13, 14], (r, n) => n !== 13 || /moon/i.test(r.label))}</table></div>
    <p><a class="btn" href="recipe.html#p=${encodeURIComponent(w.catalogue || w.auto && !ALL.includes(w) ? pn : w.id || pn)}&w=${si}">Every step for this planet →</a></p></section>`;
  const refs = refsForPlanet(w, used);
  const D = `<section class="part"><h2 class="ph">References</h2>${refs.main ? `<ol class="prefs">${refs.main}</ol>` : `<p class="hint">Nothing is cited for this planet beyond the catalogue.</p>`}
    ${rec ? `<p class="hint">${rec.engine === undefined && !rec.in ? `For this planet ${rec.counts.found.toLocaleString("en-GB")} papers were found that name it or its star; the abstracts of the ${rec.counts.read} most relevant were read for the text above (${rec.researched.slice(0, 4)}).` : `For this planet ${rec.counts.found.toLocaleString("en-GB")} papers were found that name it or its star, ${rec.counts.about} of them about the planet itself; ${rec.counts.read} were read (${rec.researched.slice(0, 4)}).`}</p>` : ""}
    ${refs.more ? `<h3>Other relevant references</h3><p class="hint">Papers about this planet that the text above does not cite, newest first.</p><ol class="prefs">${refs.more}</ol>` : ""}
    <p class="hint">Catalogue values: <a href="https://exoplanetarchive.ipac.caltech.edu" target="_blank" rel="noopener">NASA Exoplanet Archive ↗</a>. All papers the guide uses: <a href="refs.html">References</a>.</p>
    <details class="more" id="corrSec"><summary>Suggest a correction</summary><div class="corr" id="corrBox"></div></details></section>`;
  $("panelIn").innerHTML = `<h2 id="d-title">${dispName(w)}</h2>` + A + B + C + D;
  $("panelIn").querySelectorAll(".pworlds [data-w]").forEach(b => b.onclick = () => setWorld(+b.dataset.w));
  correctionForm(w);
}
// open the panel at one entry of "Why it looks like this" and flash it
function showWhyEntry(k) {
  fillAbout(); $("drawer").hidden = false;
  const dt = document.getElementById("why-" + k); if (!dt) return;
  const dd = dt.nextElementSibling; dt.scrollIntoView({ block: "center" });
  for (const e of [dt, dd]) { e.classList.remove("flash"); void e.offsetWidth; e.classList.add("flash"); }
}
