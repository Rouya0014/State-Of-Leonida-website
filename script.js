/* ===========================================================
   État de Léonida — comportement du site (JavaScript simple)
   Rien à installer : le navigateur lit ce fichier tel quel.
   =========================================================== */

/* ---------- 1. RÉGLAGES : les seules lignes que tu as besoin de modifier ---------- */
const DISCORD_INVITE = "https://discord.gg/ksW9D8e8GU"; // lien d'invitation du serveur
const AUTH_URL = "https://stateofleonida.vercel.app/api/auth/discord/login"; // connexion Discord
// Adresse qui dit si un compte est banni. Elle doit autoriser ton site (CORS) pour répondre.
const STATUS_URL = "https://stateofleonida.vercel.app/api/bot/queue";

/* ---------- 2. Petits outils ---------- */
const $ = (id) => document.getElementById(id);
const icon = (name, size) =>
  `<svg class="icon" width="${size}" height="${size}"><use href="#i-${name}"/></svg>`;
// Protège le texte venant de l'URL (évite d'injecter du HTML par erreur)
const esc = (text) =>
  String(text).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

/* ---------- 3. Liens Discord, année, bandeau ---------- */
document.querySelectorAll("[data-invite]").forEach((link) => (link.href = DISCORD_INVITE));
$("year").textContent = new Date().getFullYear();

const track = $("ticker-track");
for (let i = 0; i < 3; i++) track.appendChild(track.firstElementChild.cloneNode(true));

/* ---------- 4. Menu mobile ---------- */
const menu = $("mobile-nav");
const menuButton = $("menu-button");

function setMenu(open) {
  menu.hidden = !open;
  $("icon-menu").hidden = open;
  $("icon-close").hidden = !open;
  menuButton.setAttribute("aria-expanded", open);
  menuButton.setAttribute("aria-label", open ? "Fermer le menu" : "Ouvrir le menu");
}
menuButton.addEventListener("click", () => setMenu(menu.hidden));
menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));
document.addEventListener("keydown", (e) => e.key === "Escape" && setMenu(false));

/* ---------- 5. Médaille qui s'incline avec la souris ---------- */
const scene = $("logo-scene");
const tilt = $("logo-tilt");
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

scene.addEventListener("pointermove", (e) => {
  if (e.pointerType === "touch" || reducedMotion.matches) return;
  const box = scene.getBoundingClientRect();
  tilt.style.setProperty("--tilt-x", ((e.clientY - box.top) / box.height - 0.5) * -15 + "deg");
  tilt.style.setProperty("--tilt-y", ((e.clientX - box.left) / box.width - 0.5) * 15 + "deg");
});
scene.addEventListener("pointerleave", () => {
  tilt.style.setProperty("--tilt-x", "0deg");
  tilt.style.setProperty("--tilt-y", "0deg");
});

/* ---------- 6. Fenêtre "Faire appel d'un bannissement" ---------- */
const dialog = $("appeal");
let stopPolling = () => {}; // sert à arrêter la vérification en cours

// Pour chaque situation (intro, checking, banned…) : titre, icône, texte et bouton.
function contentFor({ type, name = "", message = "" }) {
  const n = esc(name);
  switch (type) {
    case "intro":
      return { title: "UNE SECONDE CHANCE.", icon: "shield", button: ["Continuer avec Discord", AUTH_URL],
        body: `<p>Un bannissement ne doit pas être une impasse. Connecte ton compte Discord pour vérifier ta situation et accéder à la procédure d’appel.</p>
          <div class="dialog-steps">
            <span><i>1</i> Identifie-toi avec Discord</span>
            <span><i>2</i> Nous vérifions ton compte</span>
            <span><i>3</i> Si tu es banni, le bot te contacte en privé</span>
          </div>` };
    case "checking":
      return { title: "ON VÉRIFIE TON COMPTE.", icon: "loader",
        body: `<p>${n ? `Bonjour ${n}. ` : ""}Ton compte Discord a bien été identifié.</p>
          <p>La vérification peut prendre quelques secondes. Tu peux fermer cette fenêtre à tout moment.</p>` };
    case "banned":
      return { title: "PARLONS-EN.", icon: "shield",
        body: `<p>${n ? `Le compte ${n} est actuellement banni de la communauté.` : "Ton compte est actuellement banni de la communauté."}</p>
          <p>Un message privé va t’être envoyé sur Discord avec la possibilité de faire appel. Pense à autoriser les messages privés.</p>` };
    case "clear":
      return { title: "LA VOIE EST LIBRE.", icon: "check", button: ["Rejoindre le serveur", DISCORD_INVITE, true],
        body: `<p>${n ? `Bienvenue ${n} ! ` : ""}Ton compte n’est pas banni de la communauté.</p>
          <p>Tout est prêt pour ta prochaine aventure. Retrouve-nous sur le serveur !</p>` };
    case "success":
      return { title: "CONNEXION RÉUSSIE.", icon: "check", button: ["Vérifier mon compte", AUTH_URL],
        body: `<p>${n ? `Bienvenue ${n}. ` : ""}Ton compte Discord a bien été authentifié.</p>
          <p>Si tu souhaites vérifier ton bannissement, lance une nouvelle vérification.</p>` };
    default: // "error"
      return { title: "UN PETIT CONTRETEMPS.", icon: "shield", button: ["Réessayer avec Discord", AUTH_URL],
        body: `<p>${esc(message || "La vérification n’a pas pu être effectuée. Tu peux réessayer.")}</p>` };
  }
}

function showDialog(state) {
  const c = contentFor(state);
  $("appeal-title").textContent = c.title;
  $("appeal-text").innerHTML = c.body;
  $("appeal-icon").className = `dialog-icon dialog-icon-${state.type}`;
  $("appeal-icon").innerHTML = c.icon === "loader"
    ? `<span class="animate-spin">${icon("loader", 28)}</span>` : icon(c.icon, 28);

  const main = $("appeal-main");
  main.hidden = !c.button;
  if (c.button) {
    const [label, href, external] = c.button;
    main.innerHTML = `<span>${label}</span>${icon(external ? "arrow-up-right" : "external", 17)}`;
    main.href = href;
    main.target = external ? "_blank" : "";
    main.rel = external ? "noopener noreferrer" : "";
  }
  $("appeal-note").hidden = state.type !== "intro";
  $("appeal-close").textContent = state.type === "intro" ? "Revenir à Léonida" : "Fermer";

  if (!dialog.open) dialog.showModal(); // showModal() gère déjà le focus, la touche Échap et le fond assombri
  document.body.style.overflow = "hidden";
}

function closeDialog() { dialog.close(); }
dialog.addEventListener("close", () => {
  stopPolling();
  document.body.style.overflow = "";
});
$("appeal-open").addEventListener("click", () => showDialog({ type: "intro" }));
$("appeal-open-header").addEventListener("click", () => showDialog({ type: "intro" }));
$("appeal-x").addEventListener("click", closeDialog);
$("appeal-close").addEventListener("click", closeDialog);
dialog.addEventListener("click", (e) => e.target === dialog && closeDialog()); // clic sur le fond

/* ---------- 7. Retour de Discord + vérification du bannissement ---------- */
// Discord nous renvoie sur le site avec, par exemple : ?auth=checking&check=abc123&name=Paul
const params = new URLSearchParams(location.search);
const status = (params.has("error") ? "error" : params.get("auth") || params.get("login") || params.get("status") || "").toLowerCase();
const name = (params.get("name") || "").slice(0, 40);
const checkId = params.get("check");

if (status) {
  if (status === "checking" && checkId) {
    showDialog({ type: "checking", name });
    checkBan(checkId, name);
  } else if (status === "checking") {
    showDialog({ type: "error", message: "L’identifiant de vérification est manquant. Tu peux réessayer." });
  } else if (["success", "ok", "true", "1", "connected"].includes(status)) {
    showDialog({ type: "success", name });
  } else if (["error", "failed", "denied", "cancelled", "canceled", "access_denied"].includes(status)) {
    showDialog({ type: "error", message: "La connexion avec Discord n’a pas abouti. Tu peux réessayer." });
  }
  // On enlève ces paramètres de l'adresse (les autres restent)
  ["auth", "login", "status", "error", "name", "check"].forEach((k) => params.delete(k));
  const query = params.toString();
  history.replaceState(null, "", location.pathname + (query ? "?" + query : "") + location.hash);
}

// Demande le résultat au serveur toutes les 2 secondes, 30 fois maximum.
async function checkBan(id, pseudo) {
  const controller = new AbortController();
  let stopped = false;
  stopPolling = () => { stopped = true; controller.abort(); };

  for (let attempt = 0; attempt < 30 && !stopped; attempt++) {
    try {
      const url = new URL(STATUS_URL);
      url.searchParams.set("checkId", id);
      const response = await fetch(url, { cache: "no-store", signal: controller.signal });
      if (response.ok) {
        const data = await response.json();
        if (data.status === "processed" && typeof data.banned === "boolean") {
          return showDialog({ type: data.banned ? "banned" : "clear", name: (data.username || pseudo).slice(0, 40) });
        }
        if (!["pending", "processing", "sent"].includes(data.status)) {
          return showDialog({ type: "error", message: "Nous n’avons pas pu déterminer le statut de ton compte. Tu peux réessayer." });
        }
      }
    } catch { /* problème réseau ponctuel : on réessaie */ }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
  if (!stopped) showDialog({ type: "error", message: "La vérification prend plus de temps que prévu. Réessaie dans quelques instants." });
}
