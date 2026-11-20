// Share: a link that opens this planet, place and world, and a postcard (the current view with a caption) saved through the page's
// downloads capability on claude.ai, or as an ordinary browser download elsewhere. The link uses the guide's own address plus the
// view's hash (#pl-name or a showcase id): the claude.ai address inside the artifact, whose frame has a sandboxed origin, and the
// page's own address on any other host (GitHub Pages).
const GUIDE_URL = "https://claude.ai/artifact/8fhSmbLDHTcmVNMmtMY7w3";
const ON_CLAUDE = !!(window.claude && window.claude.use);
let DL = null;
if (!ON_CLAUDE) document.getElementById("savePost").hidden = false;
(async () => { try { if (ON_CLAUDE) { DL = await claude.use("downloads"); if (DL) document.getElementById("savePost").hidden = false; } } catch (e) { DL = null; } })();
function shareLink() { return (ON_CLAUDE ? GUIDE_URL : location.origin + location.pathname) + (location.hash || ""); }
function browserSave(blob, filename) { const u = URL.createObjectURL(blob), a = document.createElement("a"); a.href = u; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); }
async function postcard() {
  const src = document.getElementById("c2"), fx = document.getElementById("fx"), w = cur, ps = placesOf(), p = ps[vp], sc = w.scenarios[si];
  const W = 1600, H = 1000, band = 100, o = document.createElement("canvas"); o.width = W; o.height = H; const c = o.getContext("2d");
  const sw = src.width, sh = src.height, ch = Math.min(sh, sw * (H - band) / W), cw = ch * W / (H - band);
  c.fillStyle = "#07080c"; c.fillRect(0, 0, W, H);
  c.drawImage(src, (sw - cw) / 2, (sh - ch) / 2, cw, ch, 0, 0, W, H - band);
  if (fx && fx.width) c.drawImage(fx, (sw - cw) / 2 * fx.width / sw, (sh - ch) / 2 * fx.height / sh, cw * fx.width / sw, ch * fx.height / sh, 0, 0, W, H - band);
  c.fillStyle = "#eceef4"; c.font = "700 40px 'Bricolage Grotesque', system-ui"; c.fillText(w.name, 40, H - band + 50);
  c.fillStyle = "#a3a9b8"; c.font = "22px 'IBM Plex Sans', system-ui"; c.fillText(`${p.label} · ${sc.name}${sc.verdict ? " · " + sc.verdict.split(/[:(]/)[0].trim() : ""}`.slice(0, 110), 40, H - band + 84);
  c.textAlign = "right"; c.fillStyle = "#f0a35a"; c.font = "500 18px 'IBM Plex Mono', monospace"; c.fillText("EXOPLANET FIELD GUIDE", W - 40, H - band + 50);
  c.fillStyle = "#a3a9b8"; c.font = "16px 'IBM Plex Sans', system-ui"; c.fillText("Built from measurements; imagined details are marked in the guide", W - 40, H - band + 82);
  return new Promise(r => o.toBlob(r, "image/jpeg", 0.9));
}
$("shareBtn").onclick = () => { const pop = $("sharePop"), open = pop.hidden; pop.hidden = !open; $("shareBtn").setAttribute("aria-expanded", open); $("shareMsg").textContent = ""; };
$("copyLink").onclick = async () => { const u = shareLink(); try { await navigator.clipboard.writeText(u); $("shareMsg").textContent = "Link copied."; } catch (e) { $("shareMsg").textContent = u; } };
$("savePost").onclick = async () => { if (!DL && ON_CLAUDE) return; $("shareMsg").textContent = "Making the postcard…";
  try { const b = await postcard(), fn = `${cur.name.replace(/[^\w-]+/g, "-")}-${placesOf()[vp].label.replace(/\W+/g, "-")}.jpg`;
    if (DL) await DL.save({ filename: fn, data: b }); else browserSave(b, fn); $("shareMsg").textContent = "Saved."; }
  catch (e) { $("shareMsg").textContent = "Not saved."; } };
document.addEventListener("click", e => { if (!$("sharePop").hidden && !e.target.closest(".topbtns")) { $("sharePop").hidden = true; $("shareBtn").setAttribute("aria-expanded", "false"); } });
