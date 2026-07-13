(function () {
  const WORLD_THEME_OPTIONS = Object.freeze([
    { id: "medieval", label: "Medieval" },
    { id: "horror", label: "Horror" },
    { id: "zombie", label: "Survie zombie" },
    { id: "cyberpunk", label: "Cyberpunk" },
    { id: "scifi", label: "Sci-Fi" },
    { id: "noir", label: "Noir" },
    { id: "inferno", label: "Enfer brutal" },
    { id: "arcane", label: "Ecole de magie" },
    { id: "stargate", label: "Portail egyptien" }
  ]);

  window.NeuroQuestConfig = Object.freeze({
    WORLD_THEME_OPTIONS,
    STORAGE_KEY: "neuroquest_state_v2",
    LEGACY_STORAGE_KEYS: Object.freeze(["questlog_rpg_state"])
  });
})();
