// v2 interface: the picture is the page. A gallery of showcase worlds opens one planet full-screen; a globe with numbered places is how you
// move around it, possible-world cards switch scenario, and two switches replace v1's dial: "What's real?" (dial 1 with labels) and
// "Imagine life" (the life level this planet's rules allow). Everything below drives the v1 engine's own state (cur, si, vp, yaw, dial, life, zoom).

const GLOBE_LAM = 75;
GLOBE_K = 0.56; GLOBE_Y = 0.41;   // the whole-planet globe, small and high enough to clear the title and the panel   // the globe is seen from 75° round from the star: every one of the four places is on the visible side
let realMode = false, lifeOn = false, looked = false;
labels = false;

// ---------- showcase worlds: the front door ----------
const SHOW = [
  ["TRAPPIST-1e", "water", "An ocean facing a star that never moves"],
  ["LHS 1140b", "water", "A super-Earth that may hold an ocean under nitrogen air"],
  ["Proxima b", "water", "The nearest exoplanet, under a flaring red dwarf"],
  ["Kepler-442 b", "water", "A rocky world in the habitable zone of an orange star"],
  ["Kepler-62 f", "water", "A rocky coast under thick CO₂, or a world of water"],
  ["Kepler-186f", "water", "The first Earth-sized planet found in a habitable zone"],
  ["Kepler-452b", "water", "A larger, older cousin of Earth around a Sun-like star"],
  ["K2-18b", "water", "Hydrogen haze, or an ocean underneath? Still argued over"],
  ["TOI-270d", "water", "Methane, CO₂ and water: an ocean world or a hot, mixed envelope"],
  ["TRAPPIST-1b", "rock", "Bare dark rock: JWST measured its hot day side"],
  ["LHS 3844b", "rock", "No air at all: a hot day side and a frozen night"],
  ["Kepler-10b", "rock", "Kepler's first rocky planet, scorched on a 20-hour orbit"],
  ["55 Cancri e", "hot", "A lava world under a thick atmosphere"],
  ["K2-141 b", "hot", "Magma seas and rock-vapour winds, with a 7-hour year"],
  ["KELT-9 b", "hot", "The hottest planet known: 4,600 K on its day side"],
  ["WASP-121b", "hot", "An ultra-hot giant with a glowing day side"],
  ["WASP-76 b", "hot", "Where iron may rain out on the night side"],
  ["HD 189733b", "giant", "Deep blue: a colour actually measured"],
  ["HD 209458b", "giant", "The first planet ever seen crossing its star"],
  ["WASP-39b", "giant", "Where JWST first saw carbon dioxide on another world"],
  ["WASP-107b", "giant", "A puffy giant with the mass of Neptune"],
  ["β Pictoris b", "giant", "A young giant still glowing from its birth"],
  ["Kepler-16b", "giant", "A giant that orbits two stars at once"],
  ["GJ 1214b", "giant", "A steamy sub-Neptune under a bright haze"],
  ["Earth", "solar", "Our own planet, rebuilt by the same rules as a check"],
  ["Venus", "solar", "The runaway greenhouse next door"],
  ["Mars", "solar", "A thin, cold, dusty desert"],
  ["Titan", "solar", "Orange haze over a frozen moon"],
  ["Jupiter", "solar", "The Solar System's largest planet"],
  ["Uranus", "solar", "An ice giant under a methane haze"],
];
// the order on the front page: the first rows are chosen to differ as much as possible (measured on the gallery images: colour layout,
// 24×14 pixels), so a first look shows the range of worlds rather than three similar oceans; the filters still group them by kind
const FRONT = ["TRAPPIST-1e", "55 Cancri e", "Kepler-16b", "LHS 3844b", "β Pictoris b", "Titan", "WASP-121b", "K2-18b", "Earth", "HD 189733b", "Proxima b", "Kepler-10b",
  "Venus", "GJ 1214b", "LHS 1140b", "KELT-9 b", "Mars", "WASP-107b", "Kepler-186f", "TRAPPIST-1b", "Jupiter", "K2-141 b", "Kepler-62 f", "WASP-39b", "Uranus", "Kepler-442 b",
  "WASP-76 b", "TOI-270d", "Kepler-452b", "HD 209458b"];
SHOW.sort((a, b) => FRONT.indexOf(a[0]) - FRONT.indexOf(b[0]));
const FILTERS = [["all", "All 30"], ["water", "Could hold water"], ["rock", "Bare rock"], ["hot", "Scorched"], ["giant", "Worlds of gas"], ["solar", "Our Solar System"]];   // these sort the 30 planets shown here, not the whole catalogue
const slug = n => n.normalize("NFD").replace(/[^\w]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
let filt = "all";
function gallery() {
  $("filters").innerHTML = FILTERS.map(([k, l]) => `<button class="chip" type="button" data-f="${k}" aria-pressed="${k === filt}">${l}</button>`).join("");
  $("filters").querySelectorAll("button").forEach(b => b.onclick = () => { filt = b.dataset.f; gallery(); });
  $("cards").innerHTML = SHOW.filter(s => filt === "all" || s[1] === filt).map(([n, , t]) => `<button class="card" type="button" data-n="${n}" aria-label="${n.replace(/(\d)([b-h])$/, "$1 $2")}: ${t}"><img src="gallery/${slug(n)}.jpg" alt="" loading="lazy" width="640" height="360"><span class="t"><b>${n.replace(/(\d)([b-h])$/, "$1 $2")}</b><span>${t}</span></span></button>`).join("");
  $("cards").querySelectorAll(".card").forEach(b => b.onclick = () => openPlanet(benchWorld(b.dataset.n)));
}
$("catN").textContent = `${CAT.length.toLocaleString()} planets known on ${CAT_DATE}`;

// search all planets: names match ignoring spaces, hyphens and case ("WASP-17b" finds "WASP-17 b")
{ const q = $("q");
  q.onfocus = () => { if (!$("q-list").childElementCount) $("q-list").innerHTML = CAT.map(r => `<option value="${r[0].replace(/"/g, "&quot;")}">`).join(""); };
  const go = () => { const v = q.value.trim(); if (!v) return; const n = CAT_NORM.get(normName(v)), w = n ? catWorld(n) : ALL.find(x => normName(x.name) === normName(v));
    if (w) { q.value = ""; $("qmsg").textContent = ""; openPlanet(w); return; }
    // no exact name: a star's name, or part of a name, lists its planets ("wasp-43" offers WASP-43 b)
    const k = normName(v), near = k.length < 2 ? [] : CAT.filter(r => normName(r[0]).startsWith(k)).concat(CAT.filter(r => !normName(r[0]).startsWith(k) && normName(r[0]).includes(k))).slice(0, 8).map(r => r[0]);
    if (near.length === 1) { q.value = ""; $("qmsg").textContent = ""; openPlanet(catWorld(near[0])); return; }
    const m = $("qmsg"); m.textContent = near.length ? `No planet is called exactly “${v}”. Did you mean: ` : `No planet is called “${v}”. Try a name such as WASP-17 b or TRAPPIST-1 f.`;
    near.forEach(n => { const bt = document.createElement("button"); bt.type = "button"; bt.className = "qhit"; bt.textContent = n; bt.onclick = () => { q.value = ""; m.textContent = ""; openPlanet(catWorld(n)); }; m.appendChild(bt); }); };
  q.onchange = go; q.onkeydown = e => { if (e.key === "Enter") go(); };
  $("randBtn").onclick = () => openPlanet(catWorld(CAT[Math.floor(Math.random() * CAT.length)][0]));
}
// the star map, an overlay over whatever is open
function openMap() { $("map").hidden = false; drawSky(); $("mapX").focus(); }
function closeMap() { $("map").hidden = true; }
$("mapBtn").onclick = openMap; $("mapX").onclick = closeMap;

// ---------- one planet ----------
const canLife = sc0 => sc0.ground === "ocean" && !sc0.noPlants && !!sc0.atm;
const placesOf = () => viewpoints(cur, cur.scenarios[si]);
function applyMode() {   // the two switches, translated to the engine's dial and life stops
  const sc0 = cur.scenarios[si];
  dial = realMode ? 1 : 3; labels = realMode;
  if (!lifeOn || realMode || !canLife(sc0)) { life = 0; return; }
  life = 3; const an = recipe(cur, curSc()).anim; if (an && an.ok) life = 4;   // animals only where the rules allow them (oxygen-rich air assumed)
}
function openPlanet(w, s0 = 0) {
  if (!w) return;
  if ($("why")) $("why").hidden = true;   // an open "why" box belongs to the view it was asked about
  cur = w; si = Math.min(s0, w.scenarios.length - 1); vp = openingPlace(w); yaw = 0; zoom = 2; tod = null; tintCache = null; sysT0 = performance.now();
  $("gallery").hidden = true; $("planet").hidden = false; closeMap();
  fitShape();
  setTimeout(() => warm(cur), 0);
  try { history.replaceState(null, "", "#" + (w.catalogue ? "pl-" + normName(w.name) : w.id)); } catch (e) {}
  applyMode(); draw();
  if (!$("drawer").hidden) fillDrawer();
}
function closePlanet() { $("planet").hidden = true; $("gallery").hidden = false; $("drawer").hidden = true; try { history.replaceState(null, "", location.pathname); } catch (e) {} }
// where a planet's view opens: the world's own spot, except that on catalogue planets whose ground looks the same everywhere (bare rock,
// cloud decks) about a third open at the terminator or sunset instead, chosen by the planet's name so it is the same every visit. All four
// places are always offered; this only varies the first impression, so that similar planets do not all open on the same noon view.
function openingPlace(w) {
  const own = Math.max(0, placesOf().findIndex(p => p.own)), sc = w.scenarios[si] || {};
  if (!w.auto || sc.spot || SHOW.some(x => normName(x[0]) === normName(w.name) || normName(x[0]) === normName(archName(w))) || !["rock", "regolith", "clouds"].includes(sc.ground) || /scorched/i.test(sc.name) || own !== 1) return own;   // a scorched world opens in its heat, not at the cool terminator
  return strHash(w.name + "|open") % 100 < 35 ? 2 : own;
}
function goPlace(i) { if (i === vp && zoom === 2) return; if ($("why")) $("why").hidden = true; vp = i; tintCache = null; applyMode(); if (zoom === 2) draw(); else zoomTo(2); $("dock").scrollTo({ top: 0, behavior: "smooth" }); }
function setWorld(i) { if ($("why")) $("why").hidden = true; si = i; vp = Math.max(0, placesOf().findIndex(p => p.own)); tintCache = null; applyMode(); draw(); if (!$("drawer").hidden) fillDrawer(); }
function turn(d) { if (zoom !== 2) return; yaw = ((yaw + d) % 360 + 360) % 360; looked = true; tintCache = null; draw(); }

// ---------- the globes: the engine's own globe, with every place marked from its projection ----------
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
const sph = (th, lat) => { const t = th * D2R, b = lat * D2R; return [Math.cos(t) * Math.cos(b), Math.sin(t) * Math.cos(b), Math.sin(b)]; };
function markPos(g, p) { const n = sph(p.theta, p.lat); let x = dot3(n, g.rr), y = dot3(n, g.u); const front = dot3(n, g.f) > 0;
  if (!front) { const l = Math.hypot(x, y) || 1; x /= l; y /= l; }   // on the far side: pinned to the edge, drawn dashed
  return { x: g.cx + x * g.R, y: g.cy - y * g.R, front }; }
function drawMark(c, x, y, r, i, on, front) {
  c.setLineDash(front ? [] : [4, 3]);
  c.beginPath(); c.arc(x, y, r, 0, 7); c.fillStyle = on ? "#f0a35a" : "rgba(8,10,16,0.85)"; c.fill(); c.lineWidth = Math.max(2, r / 6); c.strokeStyle = on ? "#fff3e4" : "#eceef4"; c.stroke();
  c.setLineDash([]); c.fillStyle = on ? "#1a1006" : "#eceef4"; c.font = `600 ${Math.round(r * 1.15)}px IBM Plex Mono, monospace`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(i + 1, x, y + 1);
}
let smallKey = "", smallBase = null, smallGeo = null, smallMarks = [];
function drawPlaceGlobe() {   // called by draw() before the landscape: it borrows the visible canvas, like v1's corner globe
  const cv = $("globeSmall"), S = cv.width, key = [cur.id, si, dial, earthEye].join("|");
  if (key !== smallKey || !smallBase) {
    const keep = callouts; callouts = []; renderGlobe(GLOBE_LAM, true); callouts = keep;
    const g = globeGeo, E = g.R * 1.1; smallBase = document.createElement("canvas"); smallBase.width = smallBase.height = S;
    smallBase.getContext("2d").drawImage(c2, g.cx - E, g.cy - E, 2 * E, 2 * E, 0, 0, S, S);
    const k = S / (2 * E); smallGeo = { ...g, cx: S / 2, cy: S / 2, R: g.R * k };
    ctx2.fillStyle = "#000"; ctx2.fillRect(0, 0, W, H); smallKey = key;
  }
  const c = cv.getContext("2d"); c.clearRect(0, 0, S, S); c.drawImage(smallBase, 0, 0);
  c.strokeStyle = "rgba(231,228,220,0.3)"; c.lineWidth = 2; c.beginPath(); limbPath(c, S / 2, S / 2, smallGeo); c.stroke();   // the limb, so a dark night side still shows
  smallMarks = placesOf().map((p, i) => ({ ...markPos(smallGeo, p), i }));
  for (const m of smallMarks) drawMark(c, m.x, m.y, 17, m.i, m.i === vp, m.front);
}
// the limb outline: a circle, or for a tidally stretched giant an ellipse, longer along the star's direction as seen on screen
function limbPath(c, cx, cy, g) {
  let st = 0; try { if (isGiantScene(cur.scenarios[0] || {})) st = giantOf(cur).m.stretch || 0; } catch (e) {}
  if (st <= 0.03 || !g.rr || !g.u) { c.arc(cx, cy, g.R, 0, 7); return; }
  const l = Math.hypot(g.rr[0], g.u[0]) || 1; c.ellipse(cx, cy, g.R * (1 + st * l), g.R, Math.atan2(-g.u[0], g.rr[0]), 0, 7);
}
let bigMarks = [];
function drawPlaceMarks() {   // the whole-planet view: the same places, large, with their names, on the label layer
  const g = globeGeo, c = lctx, ps = placesOf();
  bigMarks = ps.map((p, i) => ({ ...markPos(g, p), i }));
  c.strokeStyle = "rgba(231,228,220,0.28)"; c.lineWidth = 2; c.beginPath(); limbPath(c, g.cx, g.cy, g); c.stroke();   // the limb, so the dark night side still reads as planet
  c.font = "500 19px IBM Plex Sans, sans-serif"; c.textBaseline = "middle";
  for (const m of bigMarks) { drawMark(c, m.x, m.y, 20, m.i, m.i === vp, m.front);
  }   // the names are in the numbered list beside the picture, as for the small globe
  const a = Math.atan2(-g.u[0], g.rr[0]), sx = g.cx + Math.cos(a) * (g.R + 60), sy = g.cy + Math.sin(a) * (g.R + 60) + 70;   // which way the star is, below the places
  c.fillStyle = "#f0a35a"; c.font = "16px IBM Plex Sans, sans-serif"; c.textAlign = "center";
  const st = sx < g.cx ? `← toward ${cur.star.name}` : `toward ${cur.star.name} →`, hw = c.measureText(st).width / 2 + 12;
  c.fillText(st, Math.max(hw, Math.min(W - hw, sx)), sy);   // kept inside a narrow (phone) picture
}
$("globeSmall").onclick = e => { const b = e.currentTarget.getBoundingClientRect(), k = e.currentTarget.width / b.width, x = (e.clientX - b.left) * k, y = (e.clientY - b.top) * k;
  const m = smallMarks.map(m => [Math.hypot(m.x - x, m.y - y), m]).sort((a, b2) => a[0] - b2[0])[0];
  if (m && m[0] < 40) goPlace(m[1].i); else zoomTo(1); };

// ---------- the words: everything in full sentences ----------
const LOOK = ["toward the star", "45° to the right of the star", "90° to the right of the star", "135° to the right of the star", "away from the star", "135° to the left of the star", "90° to the left of the star", "45° to the left of the star"];
const cap = t => t.replace(/^./, c => c.toUpperCase());
const sysName = w => SOLAR.includes(w) ? "The Solar System" : `The ${w.star.name} system`;
const gasName = g => g.replace("N₂", "nitrogen").replace("CO₂", "carbon dioxide").replace(/^H₂$/, "hydrogen").replace("H₂O", "steam");
function placeSentence(w, sc, p) {
  const es = Math.round(lighting(w, sc).es), gas = sc.ground === "clouds", sol = SOLAR.includes(w), i = vp;
  const verb = gas ? `You are floating high in the atmosphere of ${dispName(w)}` : "You are standing", rotH = gas && typeof giantOf === "function" && GIANT.MEAS[w.name] && GIANT.MEAS[w.name].rotH,   // a measured spin (β Pictoris b: 8.7 h)
    spinNote = sol ? "" : rotH ? ` Its day lasts about ${rotH} hours, which is measured; the picture shows one moment of it.` : ` Nobody knows how fast ${dispName(w)} spins, so the time of day is a choice.`;
  if (w.locked) return `${verb} ${["right under the star, which stays overhead for ever", `on the day side, where the star hangs ${es}° above the horizon and never moves`, es > 1 ? `near the line between day and night, where the star sits just ${es}° up in an endless sunset` : "on the line between day and night, where the star sits on the horizon in an endless sunset", "on the night side, where the star never rises"][i]}.${gas ? " There is no ground." : ""}`;
  return `${verb} ${["at noon", "in the afternoon", "at sunset", "at night"][i]}${es > 0 ? `, with the ${w.star2 ? "brighter star" : "star"} ${es}° above the horizon` : `, with the ${w.star2 ? "brighter star" : "star"} below the horizon`}.${gas ? " There is no ground." : ""}${spinNote}`;
}
function caption() {   // two sentences at most: where you are, and which world this is
  const w = cur, sc = curSc(), p = placesOf()[vp], L = t => linkCites(t, archName(w));
  if (zoom === 0) return `${sysName(w).replace(/^The /, "The whole ")}, with every orbit, star and planet to scale; planets too small to see at this scale are drawn as dots.${sysMerc > 1.05 ? ` Mercury's orbit round the Sun would be ${sysMerc.toFixed(sysMerc < 10 ? 1 : 0)} times wider than this view.` : ""} ${w.system.length > 1 ? "The other planets are grey because nobody knows what they look like. " : ""}Click anywhere to go back to ${dispName(w)}.`;
  if (zoom === 1) return `${dispName(w)} seen from space, lit by its star${realMode ? "" : `: ${kindOf(w, w.scenarios[si])}`}. The numbered marks are the places you can stand${w.locked ? "" : " (each is a time of day, because nobody knows how fast it spins)"}. Click one to go there.`;
  if (realMode) {
    const pos = sc.ground === "clouds" ? "" : ` where the star stands in the sky (${[`overhead`, `${Math.round(lighting(w, sc).es)}° up`, "on the horizon", "below the horizon"][vp]}),`;
    const seen = sc.base <= 1 && !SOLAR.includes(w);
    return `<div class="legend"><span><i class="dot" style="background:var(--m)"></i><span><b>Measured:</b> the star's size and colour (${w.angDeg.toFixed(w.angDeg < 1 ? 2 : 1)}° wide, ${(w.angDeg / 0.533).toFixed(1)} times the Sun from Earth), and the planet's size and orbit${seen ? `. Telescopes have also seen what kind of world this is: ${kindOf(w, sc)}` : ""}.</span></span>`
      + `<span><i class="dot" style="background:var(--d)"></i><span><b>Calculated from those:</b>${pos} the colour of the light and the pull of gravity (${((sc.gOverride || w.g) / 9.81).toFixed(2)} times Earth's).</span></span>`
      + `<span><i class="dot" style="background:#6b7080"></i><span><b>Left grey:</b> ${seen ? `the ground's shapes and texture. No telescope can see the surface of a planet round another star, so even an observed world's ${sc.ground === "lava" ? "lava, crust and shoreline are" : sc.ground === "clouds" ? "cloud shapes are" : "rocks and hills are"} assumed or imagined` : "the ground, the air and the clouds. They are assumed or imagined"}, so they are hidden while “What's real?” is on.</span></span>`
      + `</div>`;
  }
  let lifeT = "";
  if (life) { const rc = recipe(w, sc), an = rc.anim; lifeT = life >= 4 && an && an.ok ? ` The animals and plants are imagined: ${plainRule(an.line)}, if the air held oxygen.` : ` The plants are imagined${rc.specLine ? ` (${plainRule(rc.specLine)})` : ""}, coloured to suit this star's light.`; }
  return L(`${placeSentence(w, sc, p)} ${worldClause(w, sc)}${lifeT}`);   // the direction you face is on the picture itself (the look chip), not repeated here
}

// ---------- after every draw: the panel follows the engine's state ----------
function onDrawn() {
  const w = cur, ps = placesOf(), sc0 = w.scenarios[si], p = ps[vp];
  document.title = `${dispName(w)} · Exoplanet Field Guide`;
  $("pname").textContent = zoom === 0 ? sysName(w) : dispName(w);
  $("phook").textContent = hookShort(w);
  const lv = [[sysName(w), 0], [dispName(w), 1], [p.label, 2]];
  $("crumbs").innerHTML = `<button type="button" id="cAll">‹ Home</button><i class="lv">/</i><button class="lv" type="button" id="cMap">Star map</button>` + lv.map(([t, z]) => `<i class="lv">/</i><button class="lv" type="button" data-z="${z}" aria-current="${z === zoom}">${t}</button>`).join("");
  $("cAll").onclick = closePlanet; $("cMap").onclick = openMap; $("crumbs").querySelectorAll("[data-z]").forEach(b => b.onclick = () => zoomTo(+b.dataset.z));
  $("whereH").textContent = w.locked ? "Where you stand" : "Time of day";
  $("places").innerHTML = ps.map((q, i) => `<button type="button" data-p="${i}" aria-pressed="${i === vp}"><span class="n">${i + 1}</span><span>${q.label}</span></button>`).join("");
  $("places").querySelectorAll("[data-p]").forEach(b => b.onclick = () => goPlace(+b.dataset.p));
  $("whereBox").style.display = zoom === 0 ? "none" : "";   // on the whole-planet view the list names the marks on the big globe
  $("globeSmall").style.display = $("seePlanet").style.display = zoom === 2 ? "" : "none";
  $("phook").style.display = zoom === 2 ? "" : "none";
  const many = w.scenarios.length > 1;
  $("worldsBox").style.display = many && zoom > 0 ? "" : "none";
  $("worlds").style.setProperty("--n", Math.min(4, w.scenarios.length));
  $("worlds").innerHTML = w.scenarios.map((s, i) => `<button class="wcard" type="button" data-w="${i}" aria-pressed="${i === si}" title="${worldWhy(w, s).replace(/"/g, "&quot;")}"><b>${worldTitle(w, s)}</b></button>`).join("");   // the name only: what is known about each world is told in the panel
  $("worlds").querySelectorAll("[data-w]").forEach(b => b.onclick = () => setWorld(+b.dataset.w));
  $("levelBtns").innerHTML = zoom === 1 ? `<button class="btn" type="button" id="toSurf">Back to the surface</button><button class="btn" type="button" id="toSys">See the whole system</button>` : zoom === 0 ? `<button class="btn" type="button" id="toPlanet">Back to ${dispName(w)}</button>` : "";
  if (zoom === 1) { $("toSurf").onclick = () => zoomTo(2); $("toSys").onclick = () => zoomTo(0); } if (zoom === 0) $("toPlanet").onclick = () => zoomTo(1);
  $("switches").style.display = zoom === 0 ? "none" : "";
  $("realBtn").setAttribute("aria-pressed", realMode);
  const lifeOK = canLife(sc0);
  $("lifeBtn").disabled = !lifeOK || realMode || zoom !== 2; $("lifeBtn").setAttribute("aria-pressed", !!life);
  $("lifeWhy").textContent = zoom !== 2 ? "" : !lifeOK ? `No life is drawn here${(t => t ? `: ${t.replace(/^./, c => c.toLowerCase())}` : ".")(plainRule(sc0.life || "").replace(/^No\.\s*/, "").replace(/:\s*no\.?$/i, ".").trim())}` : realMode ? "Life is imagined, so it is hidden while “What's real?” is on." : "";
  $("caption").innerHTML = caption();
  if (zoom === 0) requestAnimationFrame(() => requestAnimationFrame(() => { if (zoom === 0) $("caption").innerHTML = caption(); }));   // the system map measures itself on its first frame
  ["turnL", "turnR"].forEach(id => $(id).style.display = zoom === 2 ? "" : "none");
  $("lookchip").textContent = zoom !== 2 ? "" : looked ? `Looking ${LOOK[yaw / 45]}` : (innerWidth > 760 ? "Click the picture to ask why · drag to look around" : "Tap the picture to ask why");
  $("c2").setAttribute("aria-label", `${dispName(w)}: ${zoom === 2 ? `${p.label}, looking ${LOOK[yaw / 45]}` : zoom === 1 ? "the whole planet" : "the whole system"}`);
}

// ---------- the stage: drag to look round, click to ask why, click a place on the planet ----------
// the picture is rendered in the shape of its frame (setViewShape), so it fills a phone in portrait or a wide monitor without cropping
function fitShape() { const sg = $("stage"); if (!sg.clientHeight) return false; const ch = setViewShape(sg.clientWidth / sg.clientHeight); if (ch) { smallKey = ""; tintCache = null; } return ch; }
{ let rz = null; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(() => { if (!$("planet").hidden && fitShape()) draw(); }, 250); }); }
{ const sg = $("stage"); let x0 = null, moved = false;
  sg.addEventListener("pointerdown", e => { if (e.target.closest("button, a, .why")) return; x0 = e.clientX; moved = false; });
  addEventListener("pointermove", e => { if (x0 != null && Math.abs(e.clientX - x0) > 6) moved = true; });
  addEventListener("pointerup", e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (moved && zoom === 2 && Math.abs(dx) > 50) turn(dx > 0 ? -45 : 45); });   // drag the world to the right: you turn left
  sg.addEventListener("click", e => { if (moved || e.target.closest("button, a, .why") || (typeof tapClosed !== "undefined" && performance.now() - tapClosed < 600)) return; const [x, y, px, py] = toCanvas(e);
    if (zoom === 2) { if (!$("drawer").hidden && innerWidth > 760) showWhyEntry(whyKeyAt(x, y)); else showWhy(x, y, px, py); }   // with the panel open beside the picture, a click jumps to that entry in it
    else if (zoom === 1) { const m = bigMarks.map(m => [Math.hypot(m.x - x, m.y - y), m]).sort((a, b) => a[0] - b[0])[0]; if (m && m[0] < 45) goPlace(m[1].i); }
    else zoomTo(1); });
}
$("turnL").onclick = () => turn(-45); $("turnR").onclick = () => turn(45);
$("seePlanet").onclick = () => zoomTo(1);
$("realBtn").onclick = () => { realMode = !realMode; tintCache = null; smallKey = ""; applyMode(); draw(); };
$("lifeBtn").onclick = () => { lifeOn = !life; applyMode(); draw(); };
addEventListener("keydown", e => {
  if (e.key === "Escape") { if (!$("map").hidden) closeMap(); else if (!$("drawer").hidden) $("drawer").hidden = true; return; }
  if ($("planet").hidden || zoom !== 2 || /INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === "ArrowLeft") { turn(-45); e.preventDefault(); } else if (e.key === "ArrowRight") { turn(45); e.preventDefault(); }
});
let wheelAcc = 0, wheelT = 0;
$("stage").addEventListener("wheel", e => { if (!e.ctrlKey && !e.metaKey) return; e.preventDefault(); wheelAcc += e.deltaY; const now = performance.now(); if (now - wheelT < 500) return;   // a pinch zooms between levels
  if (Math.abs(wheelAcc) > 60) { wheelT = now; zoomTo(zoom + (wheelAcc < 0 ? 1 : -1)); wheelAcc = 0; } }, { passive: false });

// ---------- about this planet ----------
function fillDrawer() { fillAbout(); }
$("aboutBtn").onclick = () => { fillDrawer(); $("drawer").hidden = false; $("drawer").scrollTop = 0; $("drawerX").focus({ preventScroll: true }); };   // always opens at the top
$("drawerX").onclick = () => { $("drawer").hidden = true; $("aboutBtn").focus(); };
// on a phone the panel is a sheet over the picture: a tap outside it closes it
let tapClosed = 0;   // the tap that closes the sheet must not also ask "why" of the picture under it
document.addEventListener("pointerdown", e => { if ($("drawer").hidden || innerWidth > 760) return; if (!e.target.closest("#drawer, #aboutBtn, .why")) { $("drawer").hidden = true; tapClosed = performance.now(); } });
// a "Step N" link carries the planet and world along, so the recipe page opens with this planet's values beside that step
document.addEventListener("click", e => { const a = e.target.closest && e.target.closest("a.step"); if (a && cur && !$("planet").hidden) a.href = `recipe.html#p=${encodeURIComponent(ALL.includes(cur) ? cur.id : archName(cur))}&w=${si}&step=${a.dataset.step}`; }, true);

// the planet's category with its references (from v1)
const refLink = k => { const r = REFS[k]; if (!r) return ""; return r.url ? `<a href="${r.url}" target="_blank" rel="noopener" title="${r.what}">${r.cite}</a>` : `<span title="${r.what}">${r.cite}</span>`; };
let catIndex = null;
function catalogueByCategory() {   // every catalogue planet's subtype, worked out once (used by the science page)
  if (catIndex) return catIndex; catIndex = {};
  for (const r of CAT) { let w; try { w = catWorld(r[0]); } catch (e) { continue; } if (!w) continue; const c = categorize(w), k = c.main + "/" + c.sub; (catIndex[k] = catIndex[k] || []).push([r[0], r[12] || 1e9]); }
  return catIndex;
}
function oddsLine(w) {
  const o = categoryOdds(w); if (!o) return "";
  const top = o.filter(x => x[1] >= 0.03).slice(0, 4), pc = x => x >= 0.995 ? "over 99%" : Math.round(x * 100) + "%";
  return `<div class="catnote" title="The planet rebuilt 300 times from its catalogue values, each drawn within typical measurement errors and model uncertainties, and classified each time"><b>How sure:</b> ${top.map(x => `${x[0]} ${pc(x[1])}`).join(" · ")}</div>`;
}
function placeCategory() {
  const w = cur, c = categorize(w);
  $("p-cat").innerHTML = `<span class="cat">Category: ${c.name} › <b>${c.subName}</b></span>` + c.flags.map(f => `<span class="flag">${f}</span>`).join("")
    + (c.notes.length ? `<div class="catnote">${c.notes.join(". ")}.</div>` : "") + (c.near.length ? `<div class="catnote"><b>Near a boundary:</b> ${c.near.join(". ")}.</div>` : "")
    + oddsLine(w) + (c.alt.length ? `<div class="catnote"><b>Readings in the literature</b> (debated; the possible worlds show them): ${c.alt.join(" · ")}.</div>` : "");
  const ci = CAT_IX.get(archName(w)) ?? CAT_IX.get(w.name), noMass = ci != null && CAT[ci][9] == null;
  $("p-refs").innerHTML = `<span>Category references</span> ` + [...new Set([...c.refs, ...(noMass ? ["chen17"] : []), "gladman96"])].map(refLink).filter(Boolean).join(" · ");
}

// ---------- start ----------
glOK = initGL();
// a phone may reset the GPU (memory pressure, or a draw that ran too long): keep the context restorable, then rebuild and redraw
// twice is a device that cannot cope with this view: stop retrying (each retry froze the page) and say so
let glLost = 0;
glc.addEventListener("webglcontextlost", e => { glLost++; glOK = false; viewJob++; const n = $("busyNote");
  if (glLost < 2) { e.preventDefault(); if (n) { n.textContent = "Redrawing…"; n.hidden = false; } return; }
  if (n) n.hidden = true; ctx2.fillStyle = "#000"; ctx2.fillRect(0, 0, W, H); ctx2.fillStyle = "#c9cdd8"; ctx2.font = "26px IBM Plex Sans, sans-serif";
  ctx2.fillText("This device's graphics chip could not draw this view.", 40, H / 2 - 16); ctx2.fillStyle = "#8a8a94"; ctx2.font = "22px IBM Plex Sans, sans-serif";
  ctx2.fillText("The text, numbers and star map still work. Reloading the page tries again.", 40, H / 2 + 22); });
glc.addEventListener("webglcontextrestored", () => { glOK = initGL(); texScene = null; FAUNA_CACHE.clear(); if (glOK && !$("planet").hidden) draw(); });
gallery();
requestAnimationFrame(loop);
{ const h = decodeURIComponent(location.hash.slice(1));
  const w = h.startsWith("pl-") ? catWorld(CAT_NORM.get(h.slice(3))) : h ? ALL.find(x => x.id === h) : null;
  if (w) openPlanet(w); }
