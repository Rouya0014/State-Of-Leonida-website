(function () {
  // Adresse qui lance la connexion Discord (ta route existante)
  var LOGIN_URL = "/api/auth/discord";

  var modal = document.getElementById("modal");
  var body = document.getElementById("modal-body");
  var closeBtn = document.getElementById("modal-close");
  var lastFocus = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text !== undefined) n.textContent = text;
    return n;
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    closeBtn.focus();
  }
  function closeModal() {
    modal.hidden = true;
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }
  closeBtn.addEventListener("click", closeModal);
  modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  function showPopup(ok, title, lines) {
    body.textContent = "";
    body.appendChild(el("div", ok ? "badge" : "badge bad", ok ? "✓" : "✕"));
    var h = el("h2", "", title);
    h.id = "modal-title";
    body.appendChild(h);
    lines.forEach(function (l) { body.appendChild(el("p", "", l)); });
    var actions = el("div", "actions");
    if (!ok) {
      var retry = el("a", "btn", "Réessayer");
      retry.href = LOGIN_URL;
      actions.appendChild(retry);
    }
    var close = el("button", "btn ghost", "Fermer");
    close.type = "button";
    close.addEventListener("click", closeModal);
    actions.appendChild(close);
    body.appendChild(actions);
    openModal();
  }

  // Au retour de Discord, la page reçoit ?auth=success (ou error / cancelled).
  var params = new URLSearchParams(window.location.search);
  var raw = (params.get("auth") || params.get("login") || params.get("status") || "").toLowerCase();
  if (params.get("error")) raw = "error";
  var GOOD = ["success", "ok", "true", "1", "connected"];
  var BAD = ["error", "failed", "denied", "cancelled", "canceled", "access_denied"];

  if (GOOD.indexOf(raw) !== -1 || BAD.indexOf(raw) !== -1) {
    ["auth", "login", "status", "error"].forEach(function (k) { params.delete(k); });
    var qs = params.toString();
    history.replaceState(null, "", window.location.pathname + (qs ? "?" + qs : "") + window.location.hash);

    if (GOOD.indexOf(raw) !== -1) {
      showPopup(true, "Authentification réussie", [
        "Tu es bien connecté avec Discord.",
        "Le bot va t'envoyer un message privé : vérifie tes messages Discord."
      ]);
    } else {
      showPopup(false, "Connexion impossible", [
        "La connexion avec Discord n'a pas abouti. Tu peux réessayer."
      ]);
    }
  }
})();
