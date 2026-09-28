// Colle ici le lien d'ajout du bot (installation utilisateur) pour activer le bouton d'appel de ban.
var APPEL_URL = "";
var a = document.getElementById("appeal");
if (APPEL_URL) { a.href = APPEL_URL; a.target = "_blank"; a.rel = "noopener"; }
else a.addEventListener("click", function (e) {
  e.preventDefault();
  document.getElementById("note").textContent = "Le lien de l'appel de ban arrive bientôt.";
});
