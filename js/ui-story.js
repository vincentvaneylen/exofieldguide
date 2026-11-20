// "The planet in words": a plain account of what a planet is, how it is known, how well it has been studied and what the literature check
// found, with its key sources. Built from the catalogue row, the discovery table, the archive's study counts and REVIEW (data-review.js).
const METHOD = ["the transit method (it dims its star once an orbit)", "radial velocities (the wobble it gives its star)", "gravitational microlensing (it briefly magnified a background star)",
  "direct imaging (its own glow, photographed beside its star)", "transit timing (it tugs on a transiting neighbour)", "eclipse timing of its binary star", "the brightness changes it causes along its orbit",
  "pulsar timing", "astrometry (the star's sideways wobble on the sky)", "the pulsations of its star", "the motion of gas in its star's disc"];
const ART = s => /^([aeiou8]|[FHLMNRSX](?![a-z])|[FHLMNRSX]\d)/i.test(s) && !/^(one|uni|eu)/i.test(s) ? "an" : "a";   // "an M dwarf", "an F8 star"
const arxivLink = id => `<a href="https://arxiv.org/abs/${id}" target="_blank" rel="noopener">arXiv:${id}</a>`;
const fmtDate = s => s ? new Date(2000 + +s.slice(0, 2), +s.slice(2, 4) - 1, +s.slice(4, 6)).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

function storyOf(w) {
  const an = typeof archName === "function" ? archName(w) : w.name, i = CAT_IX.get(an) ?? CAT_IX.get(w.name), row = i == null ? null : CAT[i];
  const d = DISC[an] || w.disc || [], c = categorize(w), rv = REVIEW[an] || REVIEW[w.name];
  const RpE = w.Ru === "RJ" ? w.Rp * 11.21 : w.Rp, MpE = w.Mu === "MJ" ? w.Mp * 317.8 : w.Mp;
  const P = [], src = [];
  // 1. what it is
  if (typeof SOLAR !== "undefined" && SOLAR.includes(w)) return { paras: [`<b>${dispName(w)}</b> is one of our own Solar System's planets, included for comparison: every rule the guide applies to exoplanets is checked against it.`], sources: [] };
  const NOUN = { "temperate rocky": "temperate rocky planet", "cold rocky: icy or desert": "cold rocky planet, icy or desert", "airless or scorched rock": "scorched, probably airless rocky planet",
    "venus-like": "Venus-like planet", "cold neptune or ice giant": "cold Neptune-like ice giant", "young, self-luminous giant": "young giant, still glowing from its formation", "puffy planet or super-puff": "super-puff, a planet of extraordinarily low density" };
  const dist = d[5] || w.dist, spt = d[4] || `${specFromT(w.star.Teff)}-type`, kind = NOUN[c.subName.toLowerCase()] || c.subName.replace(/^([A-Z])(?=[a-z])/, x => x.toLowerCase());
  const est = w.RpAssumed || (row0 => row0 && row0[8] == null)(i == null ? null : CAT[i]);
  const size = (est ? "roughly " : "") + (RpE > 6 ? `${(RpE / 11.21).toFixed(RpE > 20 ? 1 : 2)} times Jupiter's size` : RpE < 0.9 || RpE > 1.1 ? `${RpE.toFixed(RpE < 2 ? 2 : 1)} times Earth's size` : "about Earth's size");
  const yr = w.P < 2 ? `${(w.P * 24).toFixed(0)} hours` : w.P < 700 ? `${w.P.toFixed(w.P < 10 ? 1 : 0)} days` : w.P < 365.25 * 200 ? `${(w.P / 365.25).toFixed(w.P < 365.25 * 20 ? 1 : 0)} years` : `${Math.round(w.P / 365.25 / 1000).toLocaleString()},000 years or so`;
  P.push(`<b>${dispName(w)}</b> is ${ART(kind)} ${kind}, ${size}, circling ${w.star.name}${spt ? `, ${ART(spt)} ${spt} star` : ""}, once every ${yr}`
    + (dist ? `, about ${Math.round(dist * 3.26156).toLocaleString()} light-years from us.` : "."));
  // 2. how it was found and what is actually measured
  if (row || d[0]) {
    const m = row ? row[16] : null, how = m != null && METHOD[m] ? METHOD[m] : d[1] ? d[1].toLowerCase() : "";
    let t = `It was found${d[0] ? ` in ${d[0]}` : ""}${how ? ` by ${how}` : ""}${d[2] ? `, by ${d[2]}` : ""}.`;
    if (d[2]) src.push(d[3] ? `<a href="${d[3]}" target="_blank" rel="noopener">${d[2]}</a> (discovery)` : `${d[2]} (discovery)`);
    const radM = row && row[8] != null && !w.RpAssumed, massM = !w.MpAssumed && !(row && i != null && LIT_MR.has(i));
    const known = [radM ? "its size (from how much starlight it blocks)" : null, massM ? (w.msini ? "a minimum mass (its true mass depends on the unknown tilt of its orbit)" : "its mass") : null].filter(Boolean);
    t += known.length ? ` Measured: ${known.join(" and ")}.` : "";
    if (!radM) t += ` Its size is not measured${row && row[16] === 3 ? "; for an imaged planet it comes from models of its glow" : ": the guide estimates it from the mass"}.`;
    else if (!massM) t += " Its mass has not been measured: the guide estimates it from the size, so its density, and whether it is rocky, are uncertain.";
    else if (MpE && RpE) t += ` Together they give a density of ${(MpE / RpE ** 3 * 5.51).toFixed(MpE / RpE ** 3 * 5.51 < 1 ? 2 : 1)} g/cm³ (Earth 5.5, Jupiter 1.3).`;
    P.push(t);
  }
  // 3. how well studied, and what the literature check found
  if (row) {
    const nFit = +(LIT_N[i] || 0), nSpec = LIT_SPEC[i] || 0;
    let t = `${nFit === 1 ? "One paper gives" : `${nFit} papers give`} its size, mass or orbit, and the archive holds ${nSpec ? `${nSpec} spectr${nSpec === 1 ? "um" : "a"} of it` : "no spectrum of it"}.`;
    if (rv) {
      const [dt, st, nAx, nLook, sum, ids] = rv;
      if (st === "p") t += " Its literature has not yet been checked one paper at a time.";
      else {
        t += ` On ${fmtDate(dt)} the guide searched arXiv: ${nAx ? `${nAx} paper${nAx === 1 ? " names" : "s name"} it` : "no paper names it beyond its catalogue entry"}${nLook ? `, ${nLook} of them possibly about its air, surface or surroundings` : ""}.`;
        const plain = (typeof REVIEW_PLAIN !== "undefined" && (REVIEW_PLAIN[an] || REVIEW_PLAIN[w.name])) || ((GIANT.MEAS[an] || GIANT.MEAS[w.name] || {}).text || "").replace(/\.$/, "") || sum;
        t += st === "r" ? ` What they found: ${plain.replace(/\s*\.\s*$/, "")}.` : st === "n" ? (sum ? ` They were read: ${sum.replace(/\s*\.\s*$/, "")}.` : " They were read: none yet measures its air or surface, so what you see rests on the general rules.")
          : st === "c" ? " They report its discovery, mass and orbit only: what you see rests on the general rules." : " What you see rests on the general rules.";
        for (const id of (ids || "").split(";").filter(Boolean)) src.push(arxivLink(id));
      }
    }
    P.push(t);
  }
  const F = findingsOf(w); if (F && F.src && !src.some(s => s.includes(F.src))) src.push(F.src);
  return { paras: P, sources: [...new Set(src)] };
}
