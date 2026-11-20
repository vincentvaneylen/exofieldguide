// Click the picture to ask why (v4): the star, the sky, the ground or sea, or anything alive. The box shows the same text as the entry
// under "Why it looks like this" in the planet panel (one text, shown in two places), and links to that entry.
function whyKeyAt(x, y) {
  const s = scene, F = s.fauna;
  const hit = F && F.hits ? [...F.hits].reverse().find(h => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1) : null;
  if (hit) return "life";
  const sh = (s.skyHits || []).slice().reverse().find(h => x >= h.x0 && x <= h.x1 && y >= h.y0 && y <= h.y1);   // floaters, fliers, a moon, a neighbouring planet
  if (sh && !rayHitsGround(x, y)) return sh.k;
  const st = s.cam.project(0, s.Lt.es), starR = Math.max(28, s.cam.f * Math.tan(s.w.angDeg / 2 * D2R) + 18);
  if (st && Math.hypot(st[0] - x, st[1] - y) < starR) return "star";
  return rayHitsGround(x, y) ? "ground" : "sky";
}
// does the ray through this point of the picture meet the ground? Hills rise above the flat horizon, so the horizon line alone cannot tell:
// the ground's height is asked of the same shader that draws it (its probe pass), at points along the ray out to 30 km
function rayHitsGround(x, y) {
  const s = scene, f = s.cam.f, cp = Math.cos(s.pitch * D2R), sp = Math.sin(s.pitch * D2R), cy = Math.cos(s.yawDeg * D2R), sy = Math.sin(s.yawDeg * D2R);
  const x1 = (x - W / 2) / f, y2 = (H / 2 - y) / f, yy = y2 * cp + sp, z1 = -y2 * sp + cp, dx = x1 * cy + z1 * sy, dz = -x1 * sy + z1 * cy, hz = Math.hypot(dx, dz);
  const slope = yy / hz; if (slope > 0.4) return false;   // well above any hill
  const ds = Array.from({ length: 48 }, (_, i) => 0.3 * Math.pow(30000 / 0.3, i / 47)), pts = ds.map(d => ({ x: d * dx / hz, z: d * dz / hz }));
  let res = null; if (!glOK || !drawGL(0, [0, 0], 1, null, s, probe => { res = probe(pts); }) || !res) return slope < 0;
  const sea = s.sc.ground === "ocean" || s.sc.ground === "lava";
  return res.some((r, i) => (sea ? Math.max(r.h, 0) : r.h) >= s.camH + ds[i] * slope);
}
function showWhy(x, y, px, py) {
  const s = scene, box = $("why"); if (!s || !s.cam) return;
  const k = whyKeyAt(x, y), T = traceOf(s.w, s.sc, { tint: typeof tintCache !== "undefined" ? tintCache : null }), e = T.why[k]; if (!e) return;
  const title = WHY_ORDER.find(o => o[0] === k)[1], extra = k === "sky" && T.why.clouds && s.sc.atm ? `<p>${linkCites(T.why.clouds.t, archName(s.w))}</p>` : "";
  box.innerHTML = `<button type="button" class="x" aria-label="Close">×</button><h4>${title}</h4><p>${linkCites(e.t, archName(s.w))}</p>${extra}<p class="meta">${srcTag(e.src)} ${stepLink(e.step)} · <a href="#why-${k}" class="tomore">Open in “About this planet”</a></p>`;
  const sb = $("stage").getBoundingClientRect(); box.hidden = false; box.style.left = Math.max(8, Math.min(sb.width - box.offsetWidth - 8, px + 12)) + "px"; box.style.top = Math.max(8, Math.min(sb.height - box.offsetHeight - 8, py + 12)) + "px";
  box.querySelector(".x").onclick = ev => { ev.stopPropagation(); box.hidden = true; };
  box.querySelector(".tomore").onclick = ev => { ev.preventDefault(); ev.stopPropagation(); box.hidden = true; showWhyEntry(k); };
}
