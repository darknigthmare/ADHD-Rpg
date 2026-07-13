(function () {
  const DIALOG_SELECTOR = ".modal-overlay, #welcome-gate, #setup-wizard-overlay";
  const FOCUSABLE_SELECTOR = [
    "a[href]",
    "button:not([disabled])",
    "input:not([disabled])",
    "select:not([disabled])",
    "textarea:not([disabled])",
    "[tabindex]:not([tabindex='-1'])"
  ].join(",");
  const backgroundSnapshots = new Map();
  const returnFocusByDialog = new WeakMap();
  let currentDialog = null;

  function isOpen(dialog) {
    if (!dialog) return false;
    if (dialog.classList.contains("modal-overlay")) return dialog.classList.contains("active");
    return !dialog.classList.contains("hidden");
  }

  function getActiveDialog() {
    const modal = Array.from(document.querySelectorAll(".modal-overlay.active")).pop();
    if (modal) return modal;
    const setup = document.getElementById("setup-wizard-overlay");
    if (isOpen(setup)) return setup;
    const welcome = document.getElementById("welcome-gate");
    return isOpen(welcome) ? welcome : null;
  }

  function rememberBackground(element) {
    if (backgroundSnapshots.has(element)) return;
    backgroundSnapshots.set(element, {
      ariaHidden: element.getAttribute("aria-hidden"),
      inert: element.hasAttribute("inert")
    });
  }

  function setElementInert(element, shouldBeInert) {
    if (shouldBeInert) {
      element.setAttribute("inert", "");
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
      return;
    }
    element.removeAttribute("inert");
    element.inert = false;
  }

  function syncBackground(activeDialog) {
    Array.from(document.body.children).forEach(element => {
      if (["SCRIPT", "STYLE", "LINK"].includes(element.tagName)) return;
      if (element.matches(DIALOG_SELECTOR)) return;
      if (activeDialog) {
        rememberBackground(element);
        setElementInert(element, true);
        return;
      }
      const snapshot = backgroundSnapshots.get(element);
      if (!snapshot) return;
      if (snapshot.inert) element.setAttribute("inert", "");
      else element.removeAttribute("inert");
      element.inert = snapshot.inert;
      if (snapshot.ariaHidden === null) element.removeAttribute("aria-hidden");
      else element.setAttribute("aria-hidden", snapshot.ariaHidden);
      backgroundSnapshots.delete(element);
    });
  }

  function ensureDialogName(dialog) {
    if (dialog.hasAttribute("aria-label") || dialog.hasAttribute("aria-labelledby")) return;
    const heading = dialog.querySelector("h1, h2, h3");
    if (!heading) {
      dialog.setAttribute("aria-label", "Fenetre NeuroQuest");
      return;
    }
    if (!heading.id) heading.id = `${dialog.id || "neuroquest-dialog"}-title`;
    dialog.setAttribute("aria-labelledby", heading.id);
  }

  function focusDialog(dialog) {
    window.setTimeout(() => {
      if (!dialog || dialog !== getActiveDialog()) return;
      const target = dialog.querySelector("[autofocus], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex='-1'])");
      const fallback = dialog.querySelector(".modal-card, .welcome-scene, .setup-sheet") || dialog;
      if (!fallback.hasAttribute("tabindex")) fallback.setAttribute("tabindex", "-1");
      (target || fallback).focus({ preventScroll: true });
    }, 0);
  }

  function sync() {
    const activeDialog = getActiveDialog();
    document.querySelectorAll(DIALOG_SELECTOR).forEach(dialog => {
      const active = dialog === activeDialog;
      ensureDialogName(dialog);
      dialog.setAttribute("role", "dialog");
      dialog.setAttribute("aria-modal", active ? "true" : "false");
      dialog.setAttribute("aria-hidden", active ? "false" : "true");
      setElementInert(dialog, !active);
      if (active) dialog.removeAttribute("aria-hidden");
    });
    syncBackground(activeDialog);

    if (activeDialog && activeDialog !== currentDialog) {
      currentDialog = activeDialog;
      focusDialog(activeDialog);
    } else if (!activeDialog && currentDialog) {
      const previousDialog = currentDialog;
      currentDialog = null;
      const returnTarget = returnFocusByDialog.get(previousDialog);
      if (returnTarget && returnTarget.isConnected && typeof returnTarget.focus === "function") {
        window.setTimeout(() => returnTarget.focus({ preventScroll: true }), 0);
      }
    }
    return activeDialog;
  }

  function open(dialog) {
    if (!dialog) return;
    returnFocusByDialog.set(dialog, document.activeElement);
    dialog.classList.add("active");
    sync();
  }

  function close(dialog) {
    if (!dialog) return;
    dialog.classList.remove("active");
    sync();
  }

  document.addEventListener("keydown", event => {
    if (event.key !== "Tab") return;
    const dialog = getActiveDialog();
    if (!dialog) return;
    const focusable = Array.from(dialog.querySelectorAll(FOCUSABLE_SELECTOR)).filter(element => {
      const style = window.getComputedStyle(element);
      return style.display !== "none" && style.visibility !== "hidden" && !element.closest("[inert]");
    });
    if (!focusable.length) {
      event.preventDefault();
      focusDialog(dialog);
      return;
    }
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }, true);

  window.NeuroQuestA11y = { sync, open, close, getActiveDialog };
})();
