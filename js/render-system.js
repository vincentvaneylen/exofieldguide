// Level 1: system to scale
// ================= Level 1: system to scale =================
let sysT0 = performance.now(), sysPos = null, tintCache = null, sysMerc = 0;
function renderSystem(now) {
  const w = cur, c = ctx2;
  c.fillStyle = "#05060a"; c.fillRect(0, 0, W, H);
  const bodies = w.system;
  const amax = Math.max(...bodies.map(b => b.a), w.star2 ? w.star2.abin : 0) * 1.12;
  const R0 = Math.min(W * 0.46, H * 0.36), s = R0 / amax, cx = W / 2, cy = H * 0.4;   // kept high: the caption panel covers the bottom of the view
  const M = XYZ2RGB;   // seen from outside, stars keep their true colours against the Sun's (standing on the planet, the eye adapts instead)
  if (dial >= 1 && w.hz[0] < amax * 1.6) {
    const ro = Math.min(w.hz[1] * s, 4000), ri = w.hz[0] * s;
    c.fillStyle = "rgba(111,207,151,0.10)"; c.beginPath(); c.arc(cx, cy, ro, 0, 2 * Math.PI); c.moveTo(cx + ri, cy); c.arc(cx, cy, ri, 0, 2 * Math.PI, true); c.fill("evenodd");
    callouts.push({ x: cx + Math.min(w.hz[1] * s, W * 0.45) * 0.72, y: cy - Math.min(w.hz[1] * s, H * 0.45) * 0.72, t: `habitable zone ${w.hz[0].toFixed(w.hz[0] < 0.1 ? 3 : 2)}–${w.hz[1].toFixed(w.hz[1] < 0.1 ? 3 : 2)} AU`, lvl: 1 });
  }
  const days = ((now - sysT0) / 1000) * (w.P / 8);
  const starAt = (x, y, Rs, spc, nm) => {
    const r = Math.max(2.5, Rs * RSUN / AU * s), col = disp(toXYZ(spc), M, 0.92 / toXYZ(spc)[1]);
    const g = c.createRadialGradient(x, y, 0, x, y, r * 2.5 + 8); g.addColorStop(0, css(col)); g.addColorStop(0.4, css(col, 0.5)); g.addColorStop(1, css(col, 0)); c.fillStyle = g; c.beginPath(); c.arc(x, y, r * 2.5 + 8, 0, 7); c.fill();
    c.fillStyle = css(col); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill();
    callouts.push({ x, y: y - r, t: `${nm} · ${r > 3 ? "star to scale" : "star (enlarged to be visible)"}`, lvl: 0 });
  };
  if (w.star2) {
    const ph = 2 * Math.PI * days / w.star2.Pbin, q = w.star2.M / (w.star.M + w.star2.M), ab = w.star2.abin;
    const xa = cx - Math.cos(ph) * ab * q * s, ya = cy - Math.sin(ph) * ab * q * s, xb = cx + Math.cos(ph) * ab * (1 - q) * s, yb = cy + Math.sin(ph) * ab * (1 - q) * s;
    c.strokeStyle = "rgba(240,163,90,0.25)"; c.setLineDash([3, 5]); c.beginPath(); c.arc(cx, cy, ab * (1 - q) * s, 0, 7); c.stroke(); c.setLineDash([]);
    starAt(xa, ya, w.star.Rs, w.spec, w.star.name); starAt(xb, yb, w.star2.Rs, w.spec2, w.star2.name);
  } else starAt(cx, cy, w.star.Rs, w.spec, w.star.name);
  sysPos = null;
  bodies.forEach((b, i) => {
    const P = w.P * Math.pow(b.a / w.a, 1.5), ph = 2 * Math.PI * days / P + i * 1.7;
    const me = b.name === w.name;
    c.strokeStyle = me ? "rgba(240,163,90,0.6)" : "rgba(143,179,217,0.28)"; c.lineWidth = me ? 1.6 : 1;
    c.beginPath(); c.arc(cx, cy, b.a * s, 0, 7); c.stroke();
    const x = cx + Math.cos(ph) * b.a * s, y = cy + Math.sin(ph) * b.a * s;
    const rd = Math.max(me ? 4.5 : 2.2, b.R * RE / AU * s);
    c.fillStyle = me ? css(tintCache || [180, 180, 180]) : "#8a8d98"; c.beginPath(); c.arc(x, y, rd, 0, 7); c.fill();
    if (me) { sysPos = [x, y]; c.strokeStyle = "#f0a35a"; c.lineWidth = 1.5; c.beginPath(); c.arc(x, y, rd + 7, 0, 7); c.stroke(); }
    callouts.push({ x, y, t: `${b.name.replace("TRAPPIST-1", "")}${me ? " · you are going here" : ""}${b.note ? " · " + b.note : ""}`, lvl: 0, quiet: !me });
  });
  const nice = [0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.2, 0.5, 1].find(v => v * s > 90) || 1;
  // the scale bar sits bottom right, clear of the caption panel; the comparison with Mercury is said in the caption (sysMerc)
  const x1 = W - 110, x0 = x1 - nice * s;
  c.strokeStyle = "#e7e4dc"; c.lineWidth = 2; c.beginPath(); c.moveTo(x0, H - 40); c.lineTo(x1, H - 40); c.stroke();
  c.font = "500 18px IBM Plex Mono, monospace"; c.fillStyle = "#e7e4dc"; c.textAlign = "right";
  c.fillText(`${nice} AU`, x1, H - 52); c.textAlign = "left";
  sysMerc = 0.387 / amax;
  if (w.farNote) c.fillText(w.farNote, W - 40 - c.measureText(w.farNote).width, 50);
}

