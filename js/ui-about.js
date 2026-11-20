// Helpers for reader-facing numbers (v4): number format, gas names, and one temperature format. The panel itself is js/ui-panel.js.
const nf = (v, d = 0) => (+v).toLocaleString("en-GB", { maximumFractionDigits: d, minimumFractionDigits: d });
const GAS = g => g.replace(/N₂/g, "nitrogen").replace(/CO₂/g, "carbon dioxide").replace(/\bCO\b/g, "carbon monoxide").replace(/H₂O/g, "water vapour").replace(/H₂/g, "hydrogen")
  .replace(/CH₄/g, "methane").replace(/SO₂/g, "sulfur dioxide").replace(/O₂/g, "oxygen").replace(/ \+ /g, " and ");
const degC = K => `${nf(K - 273)} °C`.replace(/^-/, "−");
const times = (x, what) => x >= 1.95 ? `${nf(x, x < 10 ? 1 : 0)} times ${what}` : x > 1.05 ? `${nf((x - 1) * 100)}% more than ${what}` : x >= 0.95 ? `about the same as ${what}` : `${nf(x * 100, x < 0.1 ? 1 : 0)}% of ${what}`;

// ================= One temperature format for readers =================
// Papers and rules give temperatures in kelvin; readers get °C first with the kelvin value in brackets ("about 1,250 °C (1,524 K)").
// Star temperatures stay in kelvin, as astronomers quote them. The converted text uses a narrow space before K, so it is never converted twice.
const NK = " ";
function cOf(K) { const c = K - 273; return (Math.abs(c) >= 1000 ? nf(Math.round(c / 10) * 10) : nf(Math.round(c))).replace(/^-/, "−") + " °C"; }
function kToC(t) {
  const num = s => +s.replace(/,/g, "");
  // a value with its error ("2,667 ± 57 K"): the error is a difference, so it keeps its size and only the value is shifted
  t = t.replace(/(\d[\d,]*) ± (\d[\d,]*) K\b(?!\s*(?:stars?|dwarfs?|suns?|host))/g, (m, a, e) => `${cOf(num(a)).replace(" °C", "")} ± ${e} °C (${a} ± ${e}${NK}K)`);
  t = t.replace(/(\d[\d,]*)\s*(to|and|–|-)\s*(\d[\d,]*) K\b(?!\s*(?:stars?|dwarfs?|suns?|host))/g, (m, a, j, b) => `${cOf(num(a))} ${j === "and" ? "and" : "to"} ${cOf(num(b))} (${a}–${b}${NK}K)`);
  return t.replace(/(\d[\d,]*) K\b(?!\s*(?:stars?|dwarfs?|suns?|host|-type))/g, (m, a) => `${cOf(num(a))} (${a}${NK}K)`);
}
function convertTemps(root) {
  if (!root) return; const it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
  while ((n = it.nextNode())) { if (/\d K\b/.test(n.nodeValue) && !n.parentElement.closest("table,code,.mono")) { const v = kToC(n.nodeValue); if (v !== n.nodeValue) n.nodeValue = v; } }
}
if (typeof MutationObserver !== "undefined") {
  const mo = new MutationObserver(ms => { for (const m of ms) convertTemps(m.target.nodeType === 1 ? m.target : m.target.parentElement); });
  for (const id of ["caption", "drawer", "worlds", "why", "phook", "rsteps"]) { const el = document.getElementById(id); if (el) { convertTemps(el); mo.observe(el, { childList: true, subtree: true, characterData: true }); } }
}
