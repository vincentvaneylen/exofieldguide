// Sky map
// ================= Sky map: every host star as seen from Earth (Hammer projection, right ascension increasing to the left) =================
const SKY = { base: null, pts: null };
function hammer(ra, dec) {   // degrees → x, y in [-1, 1] (x) and [-0.5, 0.5] (y)
  let l = ((ra + 180) % 360 + 360) % 360 - 180; l = -l * D2R; const b = dec * D2R;
  const z = Math.sqrt(1 + Math.cos(b) * Math.cos(l / 2));
  return [Math.cos(b) * Math.sin(l / 2) / z, Math.sin(b) / z / 2];
}
function galToEq(l, b) {   // galactic → equatorial (J2000), degrees
  const L = l * D2R, B = b * D2R, ag = 192.85948 * D2R, dg = 27.12825 * D2R, lc = 122.93192 * D2R;
  const sd = Math.sin(dg) * Math.sin(B) + Math.cos(dg) * Math.cos(B) * Math.cos(lc - L), dec = Math.asin(sd);
  const ra = ag + Math.atan2(Math.cos(B) * Math.sin(lc - L), Math.cos(dg) * Math.sin(B) - Math.sin(dg) * Math.cos(B) * Math.cos(lc - L));
  return [ra / D2R, dec / D2R];
}
const starRGB = (() => { const c = {}; return T => { const k = Math.round(T / 100); if (!c[k]) { const x = toXYZ(starSpec(k * 100)), r = mv(XYZ2RGB, x).map(v => Math.max(0, v)), m = Math.max(...r); c[k] = r.map(v => Math.round(255 * Math.pow(v / m, 1 / 2.2))); } return c[k]; }; })();
function drawSky() {
  const cv = $("sky"), c = cv.getContext("2d"), Wd = cv.width, Hd = cv.height, cx = Wd / 2, cy = Hd / 2, sx = Wd / 2 * 0.98, sy = Hd * 0.98;
  const P = (ra, dec) => { const [x, y] = hammer(ra, dec); return [cx + x * sx, cy - y * sy]; };
  if (!SKY.base) {
    const b = document.createElement("canvas"); b.width = Wd; b.height = Hd; const g = b.getContext("2d");
    g.fillStyle = "#05060a"; g.beginPath(); g.ellipse(cx, cy, sx, sy / 2, 0, 0, 7); g.fill(); g.save(); g.clip();   // the whole sky is an ellipse in this projection
    // the Milky Way: a soft band along the galactic plane, brightest toward the centre in Sagittarius
    for (let l = 0; l < 360; l += 1.5) for (let bb = -14; bb <= 14; bb += 2) { const [ra, de] = galToEq(l, bb), [x, y] = P(ra, de), a = 0.05 * Math.exp(-(bb * bb) / 60) * (0.5 + 0.9 * Math.exp(-(((l + 180) % 360 - 180) ** 2) / 1800)); g.fillStyle = `rgba(160,170,210,${(a * 0.6).toFixed(3)})`; g.beginPath(); g.arc(x, y, 16, 0, 7); g.fill(); }
    g.strokeStyle = "rgba(231,228,220,0.12)"; g.lineWidth = 1;
    for (let ra = 0; ra < 360; ra += 30) { g.beginPath(); for (let d = -90; d <= 90; d += 3) { const [x, y] = P(ra === 180 ? 179.999 : ra, d); d === -90 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    for (let d = -60; d <= 60; d += 30) { g.beginPath(); for (let ra = -179.999; ra <= 179.999; ra += 3) { const [x, y] = P(ra, d); ra === -179.999 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    g.fillStyle = "rgba(231,228,220,0.4)"; g.font = "14px IBM Plex Mono, monospace"; g.textAlign = "center";
    for (let h = 0; h < 24; h += 4) { const [x, y] = P(h * 15 + 0.01, 0); g.fillText(h + "h", x, y - 6); }
    // host stars: colour from temperature, size from closeness
    const hosts = new Map();
    for (const r of CAT) { if (r[13] == null) continue; if (!hosts.has(r[1])) hosts.set(r[1], { host: r[1], ra: r[13], dec: r[14], T: r[2] || 5000, d: r[12], n: 0, first: r[0], meth: r[16] }); hosts.get(r[1]).n++; }
    SKY.pts = [...hosts.values()].map(h => { const [x, y] = P(h.ra, h.dec); return { ...h, x, y }; });
    for (const h of SKY.pts) { const rgb = starRGB(h.T), rr = Math.max(1.1, Math.min(4.2, 4.4 - 0.9 * Math.log10(Math.max(1, h.d || 500)))); g.fillStyle = `rgba(${rgb.join(",")},${h.d && h.d < 50 ? 0.95 : 0.7})`; g.beginPath(); g.arc(h.x, h.y, rr, 0, 7); g.fill(); }
    // landmarks
    g.font = "15px IBM Plex Sans, sans-serif"; g.fillStyle = "rgba(231,228,220,0.75)"; g.textAlign = "left";
    const lab = (ra, dec, t, dx = 10, dy = -10, al = "left") => { const [x, y] = P(ra, dec); g.textAlign = al; g.fillText(t, x + dx, y + dy); };
    lab(291, 44.5, "Kepler field (Cygnus–Lyra): thousands of transiting planets", -50, -42, "right");
    lab(269, -29, "Galactic centre: microlensing planets", 14, 30);
    g.restore(); g.strokeStyle = "rgba(231,228,220,0.25)"; g.beginPath(); g.ellipse(cx, cy, sx, sy / 2, 0, 0, 7); g.stroke();
    SKY.base = b;
    $("skynote").textContent = `${SKY.pts.length.toLocaleString()} host stars of ${CAT.length.toLocaleString()} planets. Colour shows the star's temperature; nearer stars are drawn larger. Hover over a star (or tap it) to name it; click it (or tap again) to visit its planet.`; SKY.note2d = $("skynote").textContent;
  }
  if (SKY.mode === "3d") { drawSpace(); return; }
  if (SKY.note2d) $("skynote").textContent = SKY.note2d;
  c.clearRect(0, 0, Wd, Hd); c.drawImage(SKY.base, 0, 0);
  const r = CAT[CAT_IX.get(archName(cur))] || CAT[CAT_IX.get(cur.name)];
  if (r && r[13] != null) { const [x, y] = P(r[13], r[14]); c.strokeStyle = "#f0a35a"; c.lineWidth = 2.5; c.beginPath(); c.arc(x, y, 11, 0, 7); c.stroke(); c.fillStyle = "#f0a35a"; c.font = "600 16px IBM Plex Sans, sans-serif"; c.textAlign = x > Wd * 0.75 ? "right" : "left"; c.fillText(`${dispName(cur)}${r[12] ? ` · ${Math.round(r[12] * 3.26156).toLocaleString()} light years` : ""}`, x + (x > Wd * 0.75 ? -16 : 16), y + 5); }
  else if (cur.solar) { c.fillStyle = "#f0a35a"; c.font = "600 16px IBM Plex Sans, sans-serif"; c.textAlign = "center"; c.fillText("The Solar System: this map is drawn from here", cx, Hd - 20); }
}
{
  const cv = $("sky"), tip = $("skytip");
  const near = e => { const b = cv.getBoundingClientRect(), k = cv.width / b.width, x = (e.clientX - b.left) * k, y = (e.clientY - b.top) * k; let best = null, bd = 12 * k; for (const p of (SKY.mode === "3d" ? (SKY.pts3 || []).map(q => ({ ...q, x: q.sx, y: q.sy })) : SKY.pts) || []) { const d = Math.hypot(p.x - x, p.y - y); if (d < bd) { bd = d; best = p; } } return [best, e.clientX - b.left, e.clientY - b.top]; };
  cv.onmousemove = e => { const [p, x, y] = near(e); if (!p) { tip.hidden = true; return; } tip.hidden = false; tip.textContent = `${p.host} · ${p.n} planet${p.n > 1 ? "s" : ""}${p.d ? ` · ${Math.round(p.d * 3.26156).toLocaleString()} ly` : ""} · ${p.T} K`; tip.style.left = Math.min(x + 12, cv.getBoundingClientRect().width - 220) + "px"; tip.style.top = (y + 12) + "px"; };
  cv.onmouseleave = () => tip.hidden = true;
  // touch screens have no hover: the first tap names a star, a second tap on the same star visits it
  let tapped = null;
  cv.onclick = e => { const [p] = near(e); if (!p) { tip.hidden = true; tapped = null; return; }
    if (matchMedia("(hover: none)").matches && tapped !== p) { tapped = p; cv.onmousemove(e); tip.textContent += " · tap again to visit"; return; }
    closeMap(); openPlanet(catWorld(p.first)); };
}
// pick any planet in the catalogue: names match ignoring spaces, hyphens and case ("WASP-17b" finds "WASP-17 b")
const normName = n => n.toLowerCase().replace(/[\s\-_'’.]/g, "");
const CAT_NORM = new Map(CAT.map(r => [normName(r[0]), r[0]]));
