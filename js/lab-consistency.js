// Whole-catalogue consistency checks: every planet is built and its worlds checked against each other and against physics. Run from the
// browser console on science.html: consistencyReport() → { counts, examples }. Each check names what would look wrong to a reader.
function consistencyReport(limit = 8) {
  const out = {}, add = (k, n, why) => { (out[k] = out[k] || []).push(n + (why ? ": " + why : "")); };
  for (const r of CAT) {
    let w; try { w = catWorld(r[0]); } catch (e) { add("build error", r[0], e.message); continue; }
    if (!w || !w.scenarios || !w.scenarios.length) { add("no worlds", r[0]); continue; }
    const s0 = w.scenarios[0], Tsub = w.star.Teff / Math.sqrt(w.aR), RpE = w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, c = categorize(w);
    for (const s of w.scenarios) {
      const v = (s.verdict || "").toLowerCase();
      if (!s.atm && /atmosphere (favoured|inferred|detected)|air fits|thick air fits/.test(v)) add("verdict says air, world has none", w.name, s.name);
      if (s.atm && s.atm.P > 0.5 && /^(favoured: )?(bare rock|no (thick )?atmosphere|airless)/.test(v) && !/or thin/.test(v)) add("verdict says airless, world has air", w.name, s.name);
      if (s.ground === "lava" && Tsub < 1500) add("lava below melting", w.name, `${Math.round(Tsub)} K under the star`);
      if (s.ground === "ocean" && s.atm && w.Teq > 420 && !s.term) add("ocean too hot", w.name, `${Math.round(w.Teq)} K`);
      if (s.ground === "ice" && w.Teq > 330 && !w.locked) add("ice too warm", w.name, `${Math.round(w.Teq)} K`);
      if (/lava/i.test(s.name) && s.ground !== "lava") add("name/ground mismatch", w.name, s.name);
      if (/ocean/i.test(s.name) && !/magma ocean/i.test(s.name) && s.ground !== "ocean") add("name/ground mismatch", w.name, s.name);
    }
    const giant = isGiantScene(s0);
    if (c.main === "rocky" && giant) add("rocky category, gas world first", w.name, s0.name);
    if (c.main === "giant" && !giant) add("giant category, surface world first", w.name, s0.name);
    if (RpE > 8 && !giant) add("giant size, surface world", w.name, `${RpE.toFixed(1)} R⊕, ${s0.name}`);
    if (RpE < 1.3 && giant && !w.MpAssumed) add("Earth-size, gas world first", w.name, `${RpE.toFixed(2)} R⊕, ${s0.name}`);
    if (giant) { try { const m = giantOf(w).m; if (!isFinite(m.Teq) || m.Teq <= 0) add("giant model temperature", w.name); } catch (e) { add("giant model error", w.name, e.message); } }
    if (!isFinite(w.Teq) || !isFinite(w.angDeg) || !isFinite(w.g)) add("non-finite derived value", w.name);
    if (w.angDeg > 60) add("star over 60° wide", w.name, `${w.angDeg.toFixed(0)}°`);
  }
  // evidence tables: every key must name a planet, or its measurement is silently unused
  const norm = n => n.toLowerCase().replace(/[\s\-'’]/g, ""), names = new Set(), normed = new Set();
  for (const r of CAT) { names.add(r[0]); normed.add(norm(r[0])); }
  for (const w of [...ALL, ...SHEET]) { names.add(w.name); normed.add(norm(w.name)); }
  for (const k in GIANT.MEAS) if (!names.has(k)) add("evidence key names no planet", "MEAS", k);
  for (const k in SPOT) if (!normed.has(k)) add("evidence key names no planet", "SPOT", k);
  for (const k in FINDINGS) if (!normed.has(k)) add("evidence key names no planet", "FINDINGS", k);
  const counts = {}, examples = {};
  for (const k in out) { counts[k] = out[k].length; examples[k] = out[k].slice(0, limit); }
  return { counts, examples };
}
