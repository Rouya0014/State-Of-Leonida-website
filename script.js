(function () {
  // Adresse qui lance la connexion Discord
  var LOGIN_URL = "/api/auth/discord/login";

  // API qui contient le résultat de la vérification
  var STATUS_URL = "/api/bot/queue";

  // Invitation Discord du serveur
  var DISCORD_INVITE = "https://discord.gg/ksW9D8e8GU";

  // Intervalle entre chaque vérification
  var CHECK_INTERVAL = 2000;

  var modal = document.getElementById("modal");
  var body = document.getElementById("modal-body");
  var closeBtn = document.getElementById("modal-close");
  var lastFocus = null;

  function el(tag, cls, text) {
    var n = document.createElement(tag);

    if (cls) {
      n.className = cls;
    }

    if (text !== undefined) {
      n.textContent = text;
    }

    return n;
  }

  function openModal() {
    lastFocus = document.activeElement;
    modal.hidden = false;
    closeBtn.focus();
  }

  function closeModal() {
    modal.hidden = true;

    if (lastFocus && lastFocus.focus) {
      lastFocus.focus();
    }
  }

  closeBtn.addEventListener("click", closeModal);

  modal.addEventListener("click", function (e) {
    if (e.target === modal) {
      closeModal();
    }
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !modal.hidden) {
      closeModal();
    }
  });

  /*
   * ============================================================
   * POPUP CLASSIQUE
   * ============================================================
   */

  function showPopup(ok, title, lines) {
    body.textContent = "";

    body.appendChild(
      el(
        "div",
        ok ? "badge" : "badge bad",
        ok ? "✓" : "✕"
      )
    );

    var h = el("h2", "", title);
    h.id = "modal-title";

    body.appendChild(h);

    lines.forEach(function (l) {
      body.appendChild(
        el("p", "", l)
      );
    });

    var actions = el("div", "actions");

    if (!ok) {
      var retry = el(
        "a",
        "btn",
        "Réessayer"
      );

      retry.href = LOGIN_URL;

      actions.appendChild(retry);
    }

    var close = el(
      "button",
      "btn ghost",
      "Fermer"
    );

    close.type = "button";

    close.addEventListener(
      "click",
      closeModal
    );

    actions.appendChild(close);

    body.appendChild(actions);

    openModal();
  }

  /*
   * ============================================================
   * POPUP UTILISATEUR NON BANNI
   * ============================================================
   */

  function showNotBannedPopup(name) {
    body.textContent = "";

    body.appendChild(
      el(
        "div",
        "badge",
        "✓"
      )
    );

    var h = el(
      "h2",
      "",
      "Tu n'es pas banni"
    );

    h.id = "modal-title";

    body.appendChild(h);

    body.appendChild(
      el(
        "p",
        "",
        name
          ? "Bienvenue " + name + "."
          : "Ton compte Discord a bien été vérifié."
      )
    );

    body.appendChild(
      el(
        "p",
        "",
        "Ton compte n'est actuellement pas banni de la communauté."
      )
    );

    body.appendChild(
      el(
        "p",
        "",
        "Si tu souhaites rejoindre le serveur, tu peux le faire dès maintenant."
      )
    );

    var actions = el(
      "div",
      "actions"
    );

    var join = el(
      "a",
      "btn",
      "Rejoindre le serveur"
    );

    join.href = DISCORD_INVITE;
    join.target = "_blank";
    join.rel = "noopener noreferrer";

    actions.appendChild(join);

    var close = el(
      "button",
      "btn ghost",
      "Fermer"
    );

    close.type = "button";

    close.addEventListener(
      "click",
      closeModal
    );

    actions.appendChild(close);

    body.appendChild(actions);

    openModal();
  }

  /*
   * ============================================================
   * POPUP UTILISATEUR BANNI
   * ============================================================
   */

  function showBannedPopup(name) {
    body.textContent = "";

    body.appendChild(
      el(
        "div",
        "badge bad",
        "✕"
      )
    );

    var h = el(
      "h2",
      "",
      "Ton compte est banni"
    );

    h.id = "modal-title";

    body.appendChild(h);

    body.appendChild(
      el(
        "p",
        "",
        name
          ? "Le compte Discord " + name + " est actuellement banni de la communauté."
          : "Ton compte Discord est actuellement banni de la communauté."
      )
    );

    body.appendChild(
      el(
        "p",
        "",
        "Un message privé va t'être envoyé sur Discord avec la possibilité de faire appel de ton bannissement."
      )
    );

    var actions = el(
      "div",
      "actions"
    );

    var close = el(
      "button",
      "btn ghost",
      "Fermer"
    );

    close.type = "button";

    close.addEventListener(
      "click",
      closeModal
    );

    actions.appendChild(close);

    body.appendChild(actions);

    openModal();
  }

  /*
   * ============================================================
   * POPUP DE VÉRIFICATION
   * ============================================================
   */

  function showCheckingPopup(name) {
    body.textContent = "";

    body.appendChild(
      el(
        "div",
        "badge",
        "..."
      )
    );

    var h = el(
      "h2",
      "",
      "Vérification en cours"
    );

    h.id = "modal-title";

    body.appendChild(h);

    body.appendChild(
      el(
        "p",
        "",
        name
          ? "Bonjour " + name + "."
          : "Ton compte Discord a bien été identifié."
      )
    );

    body.appendChild(
      el(
        "p",
        "",
        "Nous vérifions actuellement si ton compte est banni de la communauté."
      )
    );

    body.appendChild(
      el(
        "p",
        "",
        "Cette vérification peut prendre quelques secondes."
      )
    );

    openModal();
  }

  /*
   * ============================================================
   * VÉRIFICATION DU RÉSULTAT
   * ============================================================
   */

  function checkBanStatus(checkId, name) {

    if (!checkId) {
      showPopup(
        false,
        "Connexion impossible",
        [
          "L'identifiant de vérification est manquant. Tu peux réessayer."
        ]
      );

      return;
    }

    showCheckingPopup(name);

    var attempts = 0;
    var MAX_ATTEMPTS = 30;

    function check() {

      attempts++;

      fetch(
        STATUS_URL +
        "?checkId=" +
        encodeURIComponent(checkId),
        {
          method: "GET",
          cache: "no-store"
        }
      )
        .then(function (response) {

          if (!response.ok) {
            throw new Error(
              "HTTP " + response.status
            );
          }

          return response.json();
        })
        .then(function (data) {

          /*
           * Le bot n'a pas encore traité
           * la demande.
           */

          if (data.status === "pending") {

            if (attempts >= MAX_ATTEMPTS) {

              showPopup(
                false,
                "Vérification trop longue",
                [
                  "La vérification prend plus de temps que prévu.",
                  "Tu peux fermer cette fenêtre et réessayer dans quelques instants."
                ]
              );

              return;
            }

            setTimeout(
              check,
              CHECK_INTERVAL
            );

            return;
          }

          /*
           * Le bot a terminé la vérification.
           */

          if (
            data.status === "processed" &&
            typeof data.banned === "boolean"
          ) {

            if (data.banned) {
              showBannedPopup(
                data.username || name
              );
            } else {
              showNotBannedPopup(
                data.username || name
              );
            }

            return;
          }

          /*
           * Statut intermédiaire.
           */

          if (
            data.status === "processing" ||
            data.status === "sent"
          ) {

            if (attempts >= MAX_ATTEMPTS) {

              showPopup(
                false,
                "Vérification trop longue",
                [
                  "La vérification prend plus de temps que prévu.",
                  "Tu peux fermer cette fenêtre et réessayer dans quelques instants."
                ]
              );

              return;
            }

            setTimeout(
              check,
              CHECK_INTERVAL
            );

            return;
          }

          /*
           * Réponse inattendue.
           */

          showPopup(
            false,
            "Vérification impossible",
            [
              "Nous n'avons pas pu déterminer le statut de ton compte.",
              "Tu peux réessayer."
            ]
          );
        })
        .catch(function (error) {

          console.error(
            "[OAuth] Erreur vérification :",
            error
          );

          if (attempts >= MAX_ATTEMPTS) {

            showPopup(
              false,
              "Vérification impossible",
              [
                "La vérification n'a pas pu être effectuée.",
                "Tu peux réessayer."
              ]
            );

            return;
          }

          setTimeout(
            check,
            CHECK_INTERVAL
          );
        });
    }

    check();
  }

  /*
   * ============================================================
   * RETOUR DE DISCORD OAUTH
   * ============================================================
   */

  var params =
    new URLSearchParams(
      window.location.search
    );

  var raw =
    (
      params.get("auth") ||
      params.get("login") ||
      params.get("status") ||
      ""
    ).toLowerCase();

  if (params.get("error")) {
    raw = "error";
  }

  var who =
    (params.get("name") || "")
      .slice(0, 40);

  var checkId =
    params.get("check");

  var GOOD = [
    "success",
    "ok",
    "true",
    "1",
    "connected"
  ];

  var BAD = [
    "error",
    "failed",
    "denied",
    "cancelled",
    "canceled",
    "access_denied"
  ];

  /*
   * ============================================================
   * VÉRIFICATION EN COURS
   * ============================================================
   */

  if (raw === "checking") {

    /*
     * On retire les paramètres de l'URL
     * mais on conserve checkId en mémoire.
     */

    [
      "auth",
      "login",
      "status",
      "error",
      "name",
      "check"
    ].forEach(function (k) {
      params.delete(k);
    });

    var qs =
      params.toString();

    history.replaceState(
      null,
      "",
      window.location.pathname +
      (qs ? "?" + qs : "") +
      window.location.hash
    );

    checkBanStatus(
      checkId,
      who
    );

    return;
  }

  /*
   * ============================================================
   * ANCIENS STATUTS / ERREURS
   * ============================================================
   */

  if (
    GOOD.indexOf(raw) !== -1 ||
    BAD.indexOf(raw) !== -1
  ) {

    [
      "auth",
      "login",
      "status",
      "error",
      "name",
      "check"
    ].forEach(function (k) {
      params.delete(k);
    });

    var qs =
      params.toString();

    history.replaceState(
      null,
      "",
      window.location.pathname +
      (qs ? "?" + qs : "") +
      window.location.hash
    );

    if (
      GOOD.indexOf(raw) !== -1
    ) {

      showPopup(
        true,
        "Authentification réussie",
        [
          who
            ? "Bienvenue " + who + "."
            : "Tu es bien connecté avec Discord.",
          "La vérification de ton compte va commencer."
        ]
      );

    } else {

      showPopup(
        false,
        "Connexion impossible",
        [
          "La connexion avec Discord n'a pas abouti. Tu peux réessayer."
        ]
      );
    }
  }

})();
