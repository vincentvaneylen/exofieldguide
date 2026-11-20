// Checks on the words (v4), beside runBenchmarks() and consistencyReport(). textReport() builds every world of every catalogue planet
// and of the hand-checked planets, and fails on: a step or a "Why it looks like this" entry that came out empty; a sentence that could
// not be made; an internal word reaching the reader; a broken value (undefined, NaN). It also counts citations with no matched record.
const BANNED = [/\bscenarios?\b/i, /\bdefaults?\b/i, /\bseed(ed)?\b/i, /\bdecks?\b/i, /\bSudarsky class/i, /\bclass (I|II|III|IV|V)\b/, /\bsubstellar\b/i, /\bverdict\b/i, /catalogue[- ]only/i, /catalogue values only/i, /\bspot check/i, /the guide corrects/i, /\brule lead/i,
  /\bundefined\b/, /\bNaN\b/, /\[object /, /\bnull\b/, /\buntested\b/i, /the data allow/i, /Contested:/, /\bModel ·/];
const ALWAYS_STEPS = [1, 2, 3, 4, 5, 7, 11, 13, 14, 15, 16];
function textReport(limit = 6, every = 1) {
  const out = {}, add = (k, n, why) => { (out[k] = out[k] || []).push(n + (why ? ": " + why : "")); }, strip = t => (t || "").replace(/<[^>]+>/g, "");
  const check = (n, where, t) => { const p = strip(t); if (!p.trim()) { add("empty text", n, where); return; } for (const re of BANNED) if (re.test(p)) { add("internal word: " + re.source.replace(/\\b|\(.*?\)\?|\\/g, ""), n, where + ": " + (p.match(new RegExp(".{0,40}" + re.source + ".{0,30}", re.flags)) || [""])[0]); break; } };
  const list = [...ALL, ...CAT.filter((r, i) => i % every === 0).map(r => r[0])]; let worlds = 0, cites = 0, unres = 0;
  for (const it of list) {
    let w; try { w = typeof it === "string" ? catWorld(it) : it; } catch (e) { add("build error", String(it), e.message); continue; }
    const n = w.name;
    try { check(n, "what it is", whatItIs(w)); check(n, "observed", observedPara(w)); check(n, "worlds intro", worldsIntro(w)); check(n, "hook", hookShort(w)); const ip = interestPara(w); if (ip) check(n, "interest", ip); const R = (typeof recOf === "function" && recOf(w)) || (typeof ctxOf === "function" && ctxOf(w)); if (R) for (const k of ["system", "history", "open"]) if (R.text[k]) check(n, "record: " + k, R.text[k]);
      // the planet's own text must not contradict the general sentences around it
      const kn = kindNoun(w); if (/hot Jupiter/.test(kn) && !/heated as strongly as/.test(kn) && (w.P || 0) > 10) add("'hot Jupiter' on an orbit longer than 10 days", n, Math.round(w.P) + " days");
      if (R) { const obs = strip(observedPara(w)), all = Object.values(R.text).join(" "), wi = strip(whatItIs(w));
        if (/Its mass comes/.test(obs) && !/Its mass comes/.test(all) && /\bweigh|\bmass(es)?\b/i.test(all)) add("general mass sentence beside the planet's own account of its mass", n);
        if (/does not give (its|their) distance/.test(wi) && R.text.system) add("says the companion's distance is unknown, but the planet's text describes the system", n);
        if (/\b(was|were) (first )?(found|discovered)\b[^.]*\b(radial|wobble|microlens|transit|imag)/i.test(R.text.observed || "")) add("repeats how the planet was found", n); } } catch (e) { add("overview error", n, e.message); }
    w.scenarios.forEach(sc => { worlds++;
      try { check(n, "world: " + sc.name, worldWhy(w, sc)); check(n, "kind: " + sc.name, kindOf(w, sc)); check(n, "caption: " + sc.name, worldClause(w, sc)); check(n, "title", worldTitle(w, sc)); } catch (e) { add("world text error", n, sc.name + ": " + e.message); }
      let T; try { T = traceOf(w, sc); } catch (e) { add("trace error", n, sc.name + ": " + e.message); return; }
      for (const [k] of WHY_ORDER) { if (k === "moon" && !T.why.moon) continue;   // only where a moon is drawn
        if (!T.why[k] || !strip(T.why[k].t).trim()) add("no explanation", n, sc.name + ": " + k); else check(n, "why " + k + " (" + sc.name + ")", T.why[k].t); }
      for (const s of ALWAYS_STEPS) if (!T.steps[s] || !T.steps[s].length) add("step with no values", n, sc.name + ": step " + s);
      const g = isGiantScene(sc); if (g && !T.steps[9]) add("step with no values", n, sc.name + ": step 9"); if (sc.ground === "lava" && !T.steps[10]) add("step with no values", n, sc.name + ": step 10");
      for (const s in T.steps) for (const r of T.steps[s]) check(n, "step " + s + " " + r.label, r.label + " " + r.value);
      const txt = [worldWhy(w, sc), ...Object.values(T.why).map(x => x.t)].join(" "); let m; CITE_RE.lastIndex = 0;
      while ((m = CITE_RE.exec(strip(txt)))) { if (CITE_BAD.test(m[1])) continue; cites++; if (!refKeysFor(`${m[1]} ${m[2]}${m[3] || ""}`, archName(w))) unres++; }
    });
  }
  const counts = {}, examples = {}; for (const k in out) { counts[k] = out[k].length; examples[k] = out[k].slice(0, limit); }
  return { counts, examples, planets: list.length, worlds, citations: cites, citationsUnmatched: unres };
}
