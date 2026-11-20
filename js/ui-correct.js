// "Suggest a correction": a reader's note about one planet (a wrong value, a missed paper, a picture that contradicts a result), kept in the
// artifact's database as a private suggestion box. Each reader has one document, corrections/<their id>, holding their notes; only the
// owner reads them (rules in the page's declaration). Where the database is not available (signed out, or a viewer outside the
// organisation), the form says so instead.
// Off claude.ai (the public GitHub Pages copy) there is no database: the form opens a pre-filled GitHub issue instead, when
// ISSUES_URL is set, and the section is hidden when it is not.
const ISSUES_URL = "https://github.com/vincentvaneylen/exofieldguide/issues/new";   // e.g. "https://github.com/<user>/<repo>/issues/new"
let CORR = null;   // { db, id } once available
(async () => {
  try {
    if (!window.claude || !claude.use) return;
    const [db, user] = await Promise.all([claude.use("db"), claude.use("user")]);
    if (!db || !user) return;
    const me = await user.me(); if (!me) return;
    CORR = { db, id: me.id || (await user.id()) };
  } catch (e) { CORR = null; }
})();

function correctionForm(w) {
  const box = document.getElementById("corrBox"); if (!box) return;
  if (!(window.claude && window.claude.use)) {
    const sec = document.getElementById("corrSec");
    if (!ISSUES_URL) { if (sec) sec.hidden = true; return; }
    const u = ISSUES_URL + "?title=" + encodeURIComponent("Correction: " + w.name) + "&body=" + encodeURIComponent("Planet: " + w.name + "\n\nWhat is wrong or missing:\n\nSource (arXiv number, DOI or link):\n");
    box.innerHTML = `<p>Spotted a wrong value, a missed paper, or a picture that contradicts a measurement? <a href="${u}" target="_blank" rel="noopener">Open a correction for ${dispName(w)} on GitHub</a> (needs a free GitHub account).</p>`;
    return;
  }
  box.innerHTML = `<label for="corrText">What is wrong or missing for ${dispName(w)}?</label>
    <textarea id="corrText" rows="3" maxlength="2000" placeholder="For example: a value, a paper the guide has missed, or something in the picture that contradicts a measurement"></textarea>
    <input id="corrSrc" maxlength="300" placeholder="A source, if you have one (arXiv number, DOI or link)" aria-label="Source">
    <div class="corrrow"><button class="btn" type="button" id="corrSend">Send correction</button><span class="src" id="corrMsg" aria-live="polite"></span></div>`;
  document.getElementById("corrSend").onclick = async () => {
    const t = document.getElementById("corrText").value.trim(), s = document.getElementById("corrSrc").value.trim(), msg = document.getElementById("corrMsg");
    if (t.length < 5) { msg.textContent = "Please describe the problem first."; return; }
    if (!CORR) { msg.textContent = "Corrections can be sent only by signed-in viewers of this guide on claude.ai. Thank you for looking so closely."; return; }
    msg.textContent = "Sending…";
    try {
      const ref = CORR.db.doc("corrections/" + CORR.id), cur = await ref.get(), items = (cur && cur.data && cur.data.items) || (cur && cur.items) || [];
      items.push({ planet: w.name, text: t.slice(0, 2000), source: s.slice(0, 300), at: new Date().toISOString() });
      await ref.set({ items: items.slice(-50) });
      msg.textContent = "Sent. Thank you: it will be checked against the literature.";
      document.getElementById("corrText").value = ""; document.getElementById("corrSrc").value = "";
    } catch (e) { msg.textContent = "Could not send it just now. Please try again later."; }
  };
}
