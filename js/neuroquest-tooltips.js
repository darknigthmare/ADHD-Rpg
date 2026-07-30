(function () {
  const BY_ID = {
    "welcome-start-btn": "Entre dans NeuroQuest. Une sauvegarde existante reprend ici; sinon la creation du heros commence.",
    "welcome-cloud-login-btn": "Connecte ton compte pour retrouver ta sauvegarde cloud sur plusieurs appareils.",
    "welcome-cloud-register-btn": "Cree un compte NeuroQuest. Valide ensuite l'email si Supabase le demande.",
    "welcome-cloud-logout-btn": "Deconnecte ce compte. La sauvegarde locale reste disponible en secours.",
    "open-cloud-account-btn": "Ouvre le compte, la synchronisation cloud et les outils de sauvegarde.",
    "open-collections-btn": "Ouvre les collections: bestiaire, familiers, objets et hauts faits.",
    "open-settings-btn": "Ouvre le profil, les sons, la sauvegarde et les preferences d'affichage.",
    "nav-dash-tab": "Aujourd'hui: priorite, bataille, prochaine action et aide TDA(H).",
    "nav-quests-tab": "Quetes: journal complet, mondes, filtres, planner et propositions.",
    "nav-tools-tab": "Outils: focus, sons, bruit, recuperation et controles d'aide.",
    "nav-shop-tab": "Boutique: equipement, soins, consommables et recompenses reelles.",
    "nav-party-tab": "Mon Equipe: invitations, amis live et raids cooperatifs.",
    "global-focus-toggle-btn": "Active ou coupe le Focus depuis n'importe quel onglet. Une seule quete reste prioritaire.",
    "pomo-play-btn": "Lance un Focus Raid avec le son choisi. La musique se coupe sauf avec Musique theme.",
    "pomo-stop-btn": "Arrete le Focus Raid en cours sans supprimer la quete.",
    "manual-save-btn": "Enregistre immediatement l'etat complet sur cet appareil et programme la synchronisation cloud.",
    "cloud-sync-now-btn": "Envoie maintenant la sauvegarde locale vers ton compte cloud.",
    "cloud-load-btn": "Remplace la sauvegarde locale par la derniere sauvegarde cloud disponible.",
    "export-save-btn": "Exporte une copie de secours de la sauvegarde NeuroQuest.",
    "import-save-btn": "Importe une copie de sauvegarde choisie.",
    "reset-btn": "Efface la progression locale apres une double confirmation. Cette action est reservee au recommencement total.",
    "change-avatar-btn": "Change l'apparence du heros sans modifier les stats ni la progression.",
    "open-add-quest-btn": "Ajoute une quete complete avec monde, difficulte, stat, timer et sous-taches.",
    "today-refresh-btn": "Actualise les priorites, le planner et le bilan du jour.",
    "today-guide-btn": "Choisit la quete la plus utile maintenant et propose une premiere micro-action.",
    "stuck-help-btn": "Reduit la prochaine etape quand tu es bloque: choix simples, faible energie et micro-action.",
    "today-low-energy-btn": "Affiche une seule priorite et reduit la pression visuelle pour les jours de faible energie.",
    "today-save-day-btn": "Ouvre l'assistant pour garder, reporter ou simplifier les quetes du jour.",
    "quest-navigation-collapse-btn": "Replie ou affiche les filtres de mondes et de types sans modifier les quetes.",
    "calm-mode-btn": "Active une scene et une interface plus simples pour limiter la fatigue visuelle.",
    "adhd-tools-collapse-btn": "Replie ou affiche les outils TDA(H). La prochaine action reste visible.",
    "adhd-two-minute-btn": "Cree une micro-quete timer de deux minutes sans activer automatiquement le Focus.",
    "btn-reroll-common-quests": "Propose une nouvelle selection sans toucher aux quetes deja ajoutees.",
    "btn-toggle-solo-proposals": "Replie ou affiche les quetes solo proposees.",
    "planner-collapse-btn": "Replie ou affiche le planner. Les horaires restent sauvegardes.",
    "noise-collapse-btn": "Replie ou affiche le panneau Bruit sans interrompre le son actif.",
    "noise-stop-btn": "Coupe le bruit actif et restaure la musique si le Focus n'est pas actif.",
    "noise-play-btn": "Lance le bruit selectionne et coupe la musique de fond.",
    "btn-reroll-rewards": "Rafraichit les recompenses reelles proposees.",
    "open-add-reward-btn": "Cree une recompense personnelle a acheter avec des PO.",
    "open-create-raid-btn": "Cree un boss de raid personnalise pour un gros objectif.",
    "sound-toggle": "Active ou coupe les effets sonores de l'application.",
    "music-toggle": "Active ou coupe la musique de fond hors mode bruit ou Focus.",
    "close-inventory-btn": "Ferme l'inventaire et revient a l'ecran precedent.",
    "sync-live-team-btn": "Recharge les amis live depuis le compte cloud.",
    "open-export-profile-btn": "Genere une invitation live ou un code local de secours.",
    "open-import-friend-btn": "Ajoute un ami avec une invitation recue.",
    "add-subtask-input-btn": "Ajoute un champ de sous-tache a la quete en cours d'edition.",
    "ok-noob-help-btn": "Ferme le guide des termes RPG.",
    "copy-export-link-btn": "Copie le lien d'invitation pour le partager.",
    "copy-export-code-btn": "Copie le code d'invitation de secours.",
    "event-merchant-modal": "Marchand evenementiel temporaire.",
    "event-chest-modal": "Coffre evenementiel temporaire.",
    "close-level-up-splash-btn": "Ferme l'ecran de niveau gagne et reprend l'aventure."
  };

  function normalizeText(value) {
    return String(value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  }

  function contextual(button) {
    if (!button) return "";
    if (button.id === "global-focus-toggle-btn") {
      return button.getAttribute("aria-pressed") === "true"
        ? "Coupe le Focus et revient a la liste normale."
        : "Active le Focus et garde une seule quete prioritaire.";
    }
    if (button.id && BY_ID[button.id]) return BY_ID[button.id];
    if (button.dataset.saveDayChoice) {
      return ({
        keep: "Garde une seule priorite et active le Focus dessus.",
        postpone: "Reporte deux quetes pour liberer de la place mentale.",
        simplify: "Transforme la priorite en micro-action de deux minutes.",
        "two-minute": "Cree un demarrage de deux minutes sans reorganiser toute la liste."
      })[button.dataset.saveDayChoice] || "";
    }
    if (button.dataset.filter) {
      return ({
        all: "Affiche toutes les quetes du monde selectionne.",
        main: "Affiche les quetes principales.",
        side: "Affiche les quetes secondaires.",
        daily: "Affiche les routines et quetes quotidiennes.",
        completed: "Affiche les quetes terminees dans le cimetiere."
      })[button.dataset.filter] || "";
    }
    if (button.dataset.world) return button.dataset.world === "all" ? "Affiche les quetes de tous les mondes." : "Selectionne ce monde et ses quetes.";
    if (button.dataset.category) {
      return ({
        all: "Affiche tout le catalogue.", weapon: "Affiche les armes.", armor: "Affiche les armures.",
        accessory: "Affiche les accessoires.", pet: "Affiche les familiers.", healing: "Affiche les soins.",
        consumable: "Affiche les consommables lies a des actions reelles."
      })[button.dataset.category] || "";
    }
    if (button.classList.contains("inventory-tab")) {
      return ({ weapon: "Affiche les armes possedees.", armor: "Affiche les armures possedees.", accessory: "Affiche les accessoires possedes.", pet: "Affiche les familiers possedes." })[button.dataset.tab] || "";
    }
    if (button.classList.contains("collections-tab")) {
      return ({ bestiary: "Affiche les monstres et boss rencontres.", familiars: "Affiche tous les familiers decouverts.", achievements: "Affiche les hauts faits et leurs recompenses." })[button.dataset.tab] || "";
    }
    if (button.classList.contains("shop-tab")) return button.dataset.shopTab === "gear" ? "Affiche l'equipement et les soins." : "Affiche les recompenses reelles.";
    if (button.dataset.teamDrawerToggle) return "Replie ou affiche cette section de Mon Equipe.";
    if (button.dataset.emptyAction) return ({ all: "Retire le filtre actuel.", quick: "Place le curseur dans l'ajout rapide.", micro: "Cree une micro-quete de deux minutes." })[button.dataset.emptyAction] || "";
    if (button.dataset.shopJump) return "Ouvre directement la categorie conseillee.";
    if (button.dataset.deleteWorld) return "Supprime ce monde et replace ses quetes dans General.";
    if (button.dataset.closeWorldSettings !== undefined) return "Ferme les parametres du monde.";
    if (button.dataset.worldSettings) return "Ouvre le nom, le theme et l'etat de ce monde.";
    if (button.classList.contains("accept-prop-btn")) return "Ajoute cette proposition au journal de quetes.";
    if (button.classList.contains("refuse-prop-btn")) return "Retire cette proposition de la liste.";
    if (button.classList.contains("btn-toggle-timer")) return "Demarre ou met en pause le timer de cette quete.";
    if (button.classList.contains("btn-complete-quest")) return "Valide la quete et attribue ses gains.";
    if (button.classList.contains("btn-edit-quest")) return "Modifie les champs de cette quete.";
    if (button.classList.contains("btn-delete-quest")) return "Supprime definitivement cette quete.";
    if (button.classList.contains("btn-delete-planner-item")) return "Retire cette entree du planner sans supprimer la quete.";
    if (button.classList.contains("btn-purchase-reward")) return "Achete cette recompense reelle apres confirmation de l'action.";
    if (button.classList.contains("btn-delete-reward")) return "Supprime cette recompense personnelle.";
    if (button.classList.contains("btn-purchase-gear")) return "Achete cet objet. Une action reelle peut etre demandee avant validation.";
    if (button.classList.contains("btn-equip-gear") || button.classList.contains("btn-equip-inv")) return "Equipe cet objet et applique son bonus.";
    if (button.classList.contains("btn-unequip-inv")) return "Retire cet objet de l'emplacement equipe.";
    if (button.classList.contains("btn-remove-member")) return "Retire cet ami de ton equipe.";
    if (button.classList.contains("btn-launch-suggested-raid")) return "Ajoute ce boss aux raids actifs.";
    if (button.classList.contains("boss-delete-btn")) return "Supprime ce boss de la liste des raids.";
    if (button.classList.contains("modal-close")) return "Ferme cette fenetre sans valider.";
    if (button.classList.contains("setup-stat-btn")) return "Ajuste les points de depart de cette statistique.";
    if (button.classList.contains("remove-subtask-input-btn")) return "Retire cette sous-tache du formulaire.";
    const text = normalizeText(button.textContent);
    if (text === "annuler") return "Annule et ferme sans enregistrer.";
    if (text.includes("enregistrer")) return "Enregistre les changements de cette section.";
    if (text.includes("creer")) return "Cree un nouvel element avec les informations saisies.";
    if (text.includes("invoquer")) return "Cree ce boss et l'ajoute aux raids.";
    if (text.includes("ouvrir le coffre")) return "Ouvre le coffre et attribue son butin au heros.";
    if (text.includes("marchand")) return "Ouvre le marchand evenementiel et son offre temporaire.";
    if (text.includes("rejoindre")) return "Accepte l'invitation et synchronise l'equipe.";
    if (text.includes("continuer")) return "Ferme cet ecran et continue l'aventure.";
    if (text.includes("connexion")) return "Connecte le compte avec les identifiants saisis.";
    if (text.includes("deconnexion")) return "Deconnecte le compte actuel.";
    return "";
  }

  function hydrate(root) {
    const scope = root && root.querySelectorAll ? root : document;
    scope.querySelectorAll("button, [role='button']").forEach(button => {
      if (button.classList.contains("modal-close")) {
        button.removeAttribute("title");
        button.removeAttribute("data-tooltip");
        if (!button.getAttribute("aria-label")) button.setAttribute("aria-label", "Fermer");
        return;
      }
      const existing = (button.getAttribute("title") || button.getAttribute("aria-label") || "").trim();
      const tooltip = contextual(button) || existing;
      if (!tooltip) return;
      button.setAttribute("title", tooltip);
      button.setAttribute("data-tooltip", tooltip);
      if (!button.getAttribute("aria-label")) {
        const label = String(button.textContent || "").replace(/\s+/g, " ").trim();
        button.setAttribute("aria-label", label ? `${label} - ${tooltip}` : tooltip);
      }
    });
  }

  function startObserver() {
    if (window.neuroQuestTooltipObserver) return;
    hydrate(document);
    window.neuroQuestTooltipObserver = new MutationObserver(mutations => {
      mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
        if (node.nodeType !== 1) return;
        if (node.matches && (node.matches("button") || node.matches("[role='button']"))) {
          const tooltip = contextual(node) || node.getAttribute("title") || "";
          if (tooltip) {
            node.setAttribute("title", tooltip);
            node.setAttribute("data-tooltip", tooltip);
            if (!node.getAttribute("aria-label")) node.setAttribute("aria-label", tooltip);
          }
        }
        hydrate(node);
      }));
    });
    window.neuroQuestTooltipObserver.observe(document.body, { childList: true, subtree: true });
  }

  window.NeuroQuestTooltips = { hydrate, startObserver, contextual };
})();
