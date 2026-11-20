// Diagnostics for testing on real devices. Silent unless the address has ?diag: then it records the device and graphics chip, how long
// the page and its data took to load, every landscape drawing (cost estimate, resolution, strips, how long until sharp), shader builds,
// pauses where the page could not respond, GPU context losses and script errors. It shows a small live readout and sends the record to
// the server that served the page (POST /log), so a test on a phone can be read on the computer.
(() => {
  if (!/[?&]diag\b/.test(location.search)) return;
  const t0 = performance.now(), LOG = [], sid = Math.random().toString(36).slice(2, 7);
  const now = () => Math.round(performance.now() - t0);
  const log = (ev, d = {}) => { const e = { t: now(), ev, ...d }; LOG.push(e); queue.push(e); paint(e); };
  const queue = [];
  const send = () => { if (!queue.length) return; const body = JSON.stringify({ sid, items: queue.splice(0) });
    try { if (!navigator.sendBeacon || !navigator.sendBeacon("/log", body)) fetch("/log", { method: "POST", body, keepalive: true }).catch(() => {}); } catch (e) {} };
  setInterval(send, 1500); addEventListener("pagehide", send); addEventListener("visibilitychange", () => { log("visibility", { state: document.visibilityState }); send(); });
  let box = null; const lines = [];
  function paint(e) {
    if (!box) { if (!document.body) return; box = document.createElement("pre");
      box.style.cssText = "position:fixed;left:4px;bottom:4px;z-index:99999;max-width:96vw;max-height:30vh;overflow:auto;margin:0;padding:6px 8px;font:10px/1.3 ui-monospace,Menlo,monospace;background:rgba(0,0,0,.78);color:#9f9;border-radius:6px;pointer-events:none;white-space:pre-wrap";
      document.body.appendChild(box); }
    lines.push(`${(e.t / 1000).toFixed(1)}s ${e.ev} ${Object.entries(e).filter(([k]) => k !== "t" && k !== "ev").map(([k, v]) => `${k}=${typeof v === "object" ? JSON.stringify(v) : v}`).join(" ")}`.slice(0, 160));
    box.textContent = lines.slice(-14).join("\n");
  }
  addEventListener("error", e => log("error", { msg: String(e.message), at: `${(e.filename || "").split("/").pop()}:${e.lineno}` }));
  addEventListener("unhandledrejection", e => log("rejection", { msg: String(e.reason && e.reason.message || e.reason) }));
  const ce = console.error; console.error = (...a) => { log("console.error", { msg: a.map(String).join(" ").slice(0, 300) }); ce.apply(console, a); };
  log("start", { ua: navigator.userAgent, dpr: devicePixelRatio, vw: innerWidth, vh: innerHeight, mem: navigator.deviceMemory, cores: navigator.hardwareConcurrency, url: location.pathname + location.hash });
  // pauses: any gap between animation frames over 250 ms is time the page could not respond
  let last = performance.now();
  (function f(t) { const g = t - last; if (g > 250 && document.visibilityState === "visible") log("pause", { ms: Math.round(g) }); last = t; requestAnimationFrame(f); })(last);
  addEventListener("load", () => {
    const nav = performance.getEntriesByType("navigation")[0];
    const big = performance.getEntriesByType("resource").filter(r => /\.js/.test(r.name) && (r.decodedBodySize || 0) > 200000)
      .map(r => `${r.name.split("/").pop()}:${Math.round((r.transferSize || 0) / 1024)}k/${Math.round(r.duration)}ms`);
    log("loaded", { dom: nav && Math.round(nav.domContentLoadedEventEnd), load: nav && Math.round(nav.loadEventEnd || performance.now()), bigJs: big });
    if (typeof gl !== "undefined" && gl) {
      const dbg = gl.getExtension("WEBGL_debug_renderer_info");
      log("gpu", { renderer: dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER), parallelCompile: !!(typeof pcx !== "undefined" && pcx),
        maxTex: gl.getParameter(gl.MAX_TEXTURE_SIZE), canvas: `${glc.width}x${glc.height}`, highp: (gl.getShaderPrecisionFormat(gl.FRAGMENT_SHADER, gl.HIGH_FLOAT) || {}).precision });
    } else log("gpu", { renderer: "none: WebGL unavailable" });
    const c = document.getElementById("gl");
    if (c) { c.addEventListener("webglcontextlost", () => log("CONTEXT LOST")); c.addEventListener("webglcontextrestored", () => log("context restored")); }
    // drawings: one record per landscape view, from the first draw call to "sharp"
    if (typeof drawGL === "function") {
      let job = null; const orig = drawGL;
      window.drawGL = function (time, jit = [0, 0], scale = 1, strip = null, s, probe = false) {
        const a = performance.now(), r = orig.apply(this, arguments), d = performance.now() - a;
        if (!probe && typeof viewJob !== "undefined") {
          if (!job || job.id !== viewJob) { if (job && !job.done) log("view abandoned", { calls: job.calls, ms: Math.round(a - job.a) }); job = { id: viewJob, a, calls: 0, strips: 0, maxCall: 0, scales: new Set(), done: false, world: s && s.sc && s.sc.name, planet: typeof cur !== "undefined" && cur.name }; }
          job.calls++; if (strip) job.strips = strip[1]; job.scales.add(+scale.toFixed(2)); job.maxCall = Math.max(job.maxCall, d);
          if (r === false) job.waiting = (job.waiting || 0) + 1;
        }
        return r;
      };
      const ov = setInterval(() => { if (job && !job.done && typeof viewDone !== "undefined" && viewDone && job.id === viewJob) { job.done = true;
        log("view sharp", { planet: job.planet, world: job.world, ms: Math.round(performance.now() - job.a), calls: job.calls, strips: job.strips, scales: [...job.scales].join(","), maxCallMs: Math.round(job.maxCall), notReadyFrames: job.waiting || 0 }); } }, 100);
    }
    if (typeof useProg === "function") {
      const orig = useProg;
      window.useProg = function (ground, mode, bio = 0) { const key = ground * 2 + mode + bio * 64, was = progs[key] && progs[key].ready, a = performance.now();
        const r = orig.apply(this, arguments); const d = performance.now() - a;
        if (!was && progs[key] && (progs[key].ready || progs[key].failed)) log("shader ready", { ground, mode, bio, failed: !!progs[key].failed, blockMs: Math.round(d) });
        else if (d > 100) log("shader wait", { ground, mode, ms: Math.round(d) });
        return r; };
    }
    if (typeof renderGlobe === "function") { const orig = renderGlobe; window.renderGlobe = function () { const a = performance.now(), r = orig.apply(this, arguments), d = performance.now() - a; if (d > 150) log("globe slow", { ms: Math.round(d) }); return r; }; }
    send();
  });
})();
