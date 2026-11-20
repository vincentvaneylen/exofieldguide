// "Around the Sun": the same host stars as the sky map, placed in 3D at their true directions and distances, with the Sun at the centre.
// Distances run from 4 to over 20,000 light years, so the radius is logarithmic (rings at 10, 100, 1,000 and 10,000 light years). Drag to
// turn it; hover to name a star; click to visit its planet. Drawn on the sky map's canvas with a simple perspective, no WebGL.
SKY.mode = "sky"; SKY.rot = [0.6, 0.35];   // turn about the galactic pole, then tilt
const LY = 3.26156;
function spacePos(ra, dec, dly) {   // equatorial direction + distance → a point, radius log-scaled (10 ly → 1, 10,000 ly → 4)
  const r = Math.max(0.15, Math.log10(Math.max(1.5, dly))), a = ra * D2R, d = dec * D2R;
  return [r * Math.cos(d) * Math.cos(a), r * Math.sin(d), r * Math.cos(d) * Math.sin(a)];
}
function drawSpace() {
  const cv = $("sky"), c = cv.getContext("2d"), Wd = cv.width, Hd = cv.height, cx = Wd / 2, cy = Hd / 2, sc = Hd * 0.11, [ya, pi] = SKY.rot;
  const cyw = Math.cos(ya), syw = Math.sin(ya), cp = Math.cos(pi), sp = Math.sin(pi), cam = 12;
  const proj = ([x, y, z]) => { const x1 = x * cyw + z * syw, z1 = -x * syw + z * cyw, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp, k = cam / (cam - z2); return [cx + x1 * sc * k, cy - y1 * sc * k, z2, k]; };
  c.fillStyle = "#05060a"; c.fillRect(0, 0, Wd, Hd);
  // distance rings in the plane of our sky's equator, and the galactic plane as a faint band
  c.lineWidth = 1; c.font = "13px IBM Plex Mono, monospace"; c.textAlign = "left";
  [[1, "10 ly"], [2, "100 ly"], [3, "1,000 ly"], [4, "10,000 ly"]].forEach(([r, t]) => { c.strokeStyle = "rgba(231,228,220,0.14)"; c.beginPath();
    for (let a = 0; a <= 360; a += 4) { const p = proj([r * Math.cos(a * D2R), 0, r * Math.sin(a * D2R)]); a ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
    const la = (200 + r * 25) * D2R, p = proj([r * Math.cos(la), 0, r * Math.sin(la)]); c.fillStyle = "rgba(231,228,220,0.45)"; c.fillText(t, p[0] + 4, p[1] - 4); });
  c.strokeStyle = "rgba(150,170,230,0.18)"; c.lineWidth = 6; c.beginPath();
  for (let l = 0; l <= 360; l += 4) { const [ra, de] = galToEq(l, 0), p = proj(spacePos(ra, de, 25000)); l ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]); } c.stroke();
  // the stars, far ones first
  const pts = (SKY.pts || []).filter(h => h.d).map(h => { const P = proj(spacePos(h.ra, h.dec, h.d * LY)); return { ...h, sx: P[0], sy: P[1], z: P[2], k: P[3] }; }).sort((a, b) => a.z - b.z);
  for (const h of pts) { const rgb = starRGB(h.T), r = Math.max(0.9, Math.min(4, 1.6 * h.k * (h.d < 30 ? 1.8 : 1))); c.fillStyle = `rgba(${rgb.join(",")},${0.45 + 0.45 * Math.min(1, h.k - 0.6)})`; c.beginPath(); c.arc(h.sx, h.sy, r, 0, 6.283); c.fill(); }
  SKY.pts3 = pts;
  const o = proj([0, 0, 0]); c.fillStyle = "#ffe9b0"; c.beginPath(); c.arc(o[0], o[1], 5, 0, 6.283); c.fill(); c.font = "600 15px IBM Plex Sans, sans-serif"; c.fillText("Sun (and Earth)", o[0] + 8, o[1] + 16);
  const r0 = CAT[CAT_IX.get(archName(cur))] || CAT[CAT_IX.get(cur.name)];
  if (r0 && r0[13] != null && r0[12]) { const p = proj(spacePos(r0[13], r0[14], r0[12] * LY)); c.strokeStyle = "#f0a35a"; c.lineWidth = 2; c.setLineDash([4, 4]); c.beginPath(); c.moveTo(o[0], o[1]); c.lineTo(p[0], p[1]); c.stroke(); c.setLineDash([]);
    c.beginPath(); c.arc(p[0], p[1], 10, 0, 6.283); c.stroke(); c.fillStyle = "#f0a35a"; c.fillText(`${dispName(cur)} · ${Math.round(r0[12] * LY).toLocaleString()} light years`, p[0] + 14, p[1] - 10); }
  $("skynote").textContent = `${pts.length.toLocaleString()} host stars with known distances, around the Sun. Distance from the centre is logarithmic: each ring is ten times farther than the last. The blue band is the plane of the Milky Way. Drag to turn; click a star to visit its planet.`;
}
{
  const cv = $("sky"); let drag = null, moved = false;
  cv.addEventListener("mousedown", e => { if (SKY.mode !== "3d") return; drag = [e.clientX, e.clientY, ...SKY.rot]; moved = false; });
  window.addEventListener("mousemove", e => { if (!drag) return; const dx = e.clientX - drag[0], dy = e.clientY - drag[1]; if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
    SKY.rot = [drag[2] + dx * 0.006, Math.max(-1.4, Math.min(1.4, drag[3] + dy * 0.006))]; drawSpace(); });
  window.addEventListener("mouseup", () => { drag = null; });
  cv.addEventListener("click", e => { if (moved) { e.stopImmediatePropagation(); moved = false; } }, true);   // a drag is not a click
  document.querySelectorAll("#sky-mode button").forEach(b => b.onclick = () => { SKY.mode = b.dataset.m; document.querySelectorAll("#sky-mode button").forEach(x => x.setAttribute("aria-pressed", x === b)); drawSky(); });
}
