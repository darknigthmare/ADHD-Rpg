/* ==========================================================================
   QuestLog RPG State Manager (js/state.js)
   Handles all gameplay data, progression formulas, inventory, and LocalStorage.
   ========================================================================== */

// --- Game Constants ---
const DIFFICULTY_VALUES = {
  trivial: { xp: 10, gold: 5, stat: 1 },
  easy: { xp: 25, gold: 15, stat: 2 },
  medium: { xp: 50, gold: 30, stat: 4 },
  hard: { xp: 100, gold: 60, stat: 8 },
  epic: { xp: 250, gold: 150, stat: 20 }
};

const GEAR_CATALOG = [
  {
    id: "training_sword",
    name: "Épée d'Entraînement",
    description: "Une épée en bois pour débuter.",
    cost: 100,
    type: "weapon",
    statBoost: "STR",
    boostPercent: 0.15,
    effect: "+15% XP de Force",
    icon: "sword"
  },
  {
    id: "novice_wand",
    name: "Baguette d'Apprenti",
    description: "Canalise l'énergie intellectuelle.",
    cost: 120,
    type: "weapon",
    statBoost: "INT",
    boostPercent: 0.15,
    effect: "+15% XP d'Intelligence",
    icon: "wand"
  },
  {
    id: "leather_armor",
    name: "Plastron en Cuir",
    description: "Offre une protection légère mais souple.",
    cost: 150,
    type: "armor",
    statBoost: "CON",
    boostPercent: 0.15,
    effect: "+15% XP de Constitution",
    icon: "shield"
  },
  {
    id: "lucky_coin",
    name: "Pièce Porte-Bonheur",
    description: "Elle brille d'une lueur dorée.",
    cost: 200,
    type: "accessory",
    statBoost: null,
    boostPercent: 0.20,
    effect: "+20% d'Or sur toutes les quêtes",
    icon: "coins"
  }
];

// --- Initial Mock Data for first load ---
const INITIAL_QUESTS = [
  {
    id: "start-1",
    title: "Tutoriel : Accomplir sa première quête",
    description: "Appuyez sur le bouton de validation à droite de cette quête !",
    type: "side",
    difficulty: "trivial",
    associatedStat: "WIS",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "start-2",
    title: "Hydratation supérieure",
    description: "Boire un grand verre d'eau dès le matin.",
    type: "daily",
    difficulty: "trivial",
    associatedStat: "CON",
    completed: false,
    createdAt: new Date().toISOString()
  },
  {
    id: "start-3",
    title: "Séance de révision ou d'apprentissage",
    description: "Travailler 30 minutes sur un projet personnel, un cours ou coder.",
    type: "side",
    difficulty: "medium",
    associatedStat: "INT",
    completed: false,
    createdAt: new Date().toISOString()
  }
];

const INITIAL_REWARDS = [
  { id: "rew-1", name: "Prendre une pause café de 15 min", cost: 15, isCustom: false },
  { id: "rew-2", name: "Regarder un épisode de série", cost: 35, isCustom: false },
  { id: "rew-3", name: "Jouer 1 heure aux jeux vidéo", cost: 60, isCustom: false },
  { id: "rew-4", name: "Manger un repas plaisir / Cheat meal", cost: 120, isCustom: false }
];

const INITIAL_RAIDS = [
  {
    id: "raid-1",
    name: "Le Dragon de la Procrastination",
    maxHp: 300,
    currentHp: 300,
    rewardXp: 150,
    rewardGold: 80,
    completed: false
  },
  {
    id: "raid-2",
    name: "Le Spectre des Réseaux Sociaux",
    maxHp: 150,
    currentHp: 150,
    rewardXp: 80,
    rewardGold: 40,
    completed: false
  }
];

// --- State Object ---
let state = {
  player: {
    name: "Héros",
    avatar: "Adventurer",
    level: 1,
    xp: 0,
    xpNext: 100,
    gold: 50,
    streak: 0,
    lastActiveDate: null,
    stats: {
      STR: 10,
      INT: 10,
      WIS: 10,
      CHA: 10,
      CON: 10
    },
    statPoints: 0,
    equipment: {
      weapon: null,
      armor: null,
      accessory: null
    },
    inventory: [],
    setupComplete: false,
    class: ""
  },
  quests: [],
  rewards: [],
  party: [],
  raids: [],
  soundEnabled: true
};

// --- Storage Logic ---
const STORAGE_KEY = "questlog_rpg_state";
let isLocalStorageAvailable = true;

try {
  const testKey = "__test_local_storage__";
  localStorage.setItem(testKey, "test");
  localStorage.removeItem(testKey);
} catch (e) {
  isLocalStorageAvailable = false;
  console.warn("LocalStorage is not available. Using in-memory fallback.");
}

function saveState() {
  if (!isLocalStorageAvailable) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to LocalStorage:", e);
  }
}

function loadState() {
  if (!isLocalStorageAvailable) {
    resetToDefault();
    return;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = JSON.parse(saved);
      // Ensure basic structure is updated if loaded state is old
      if (!state.player.equipment) state.player.equipment = { weapon: null, armor: null, accessory: null };
      if (!state.player.inventory) state.player.inventory = [];
      if (!state.party) state.party = [];
      if (!state.raids) state.raids = [];
      if (typeof state.player.setupComplete === "undefined") state.player.setupComplete = false;
      if (typeof state.player.class === "undefined") state.player.class = "";
      if (typeof state.soundEnabled === "undefined") state.soundEnabled = true;
    } else {
      resetToDefault();
    }
  } catch (e) {
    console.error("Error loading state, resetting.", e);
    resetToDefault();
  }
}

function resetToDefault() {
  state.player = {
    name: "Héros",
    avatar: "Adventurer",
    level: 1,
    xp: 0,
    xpNext: 100,
    gold: 50,
    streak: 0,
    lastActiveDate: new Date().toDateString(),
    stats: { STR: 10, INT: 10, WIS: 10, CHA: 10, CON: 10 },
    statPoints: 0,
    equipment: { weapon: null, armor: null, accessory: null },
    inventory: [],
    setupComplete: false,
    class: ""
  };
  state.quests = [...INITIAL_QUESTS];
  state.rewards = [...INITIAL_REWARDS];
  state.party = [];
  state.raids = [...INITIAL_RAIDS];
  state.soundEnabled = true;
  saveState();
}

// --- Setup Wizard ---
function completeSetup(name, avatar, className) {
  state.player.name = name.trim() || "Héros";
  state.player.avatar = avatar || "Adventurer";
  state.player.class = className || "Guerrier";
  state.player.setupComplete = true;

  // Apply starting stats bonuses based on Class choice
  if (className === "Guerrier") {
    state.player.stats = { STR: 13, INT: 8, WIS: 9, CHA: 10, CON: 12 };
  } else if (className === "Mage") {
    state.player.stats = { STR: 8, INT: 14, WIS: 11, CHA: 9, CON: 10 };
  } else if (className === "Voleur") {
    state.player.stats = { STR: 9, INT: 10, WIS: 11, CHA: 13, CON: 9 };
  } else if (className === "Prêtre") {
    state.player.stats = { STR: 9, INT: 9, WIS: 13, CHA: 10, CON: 11 };
  } else {
    state.player.stats = { STR: 10, INT: 10, WIS: 10, CHA: 10, CON: 10 };
  }

  state.player.level = 1;
  state.player.xp = 0;
  state.player.xpNext = 100;
  state.player.gold = 50;

  saveState();
}

// --- Player Operations ---
function setPlayerProfile(name, avatar) {
  state.player.name = name.trim() || "Héros";
  state.player.avatar = avatar || "Adventurer";
  saveState();
}

function toggleSound() {
  state.soundEnabled = !state.soundEnabled;
  saveState();
  return state.soundEnabled;
}

function allocateStatPoint(stat) {
  if (state.player.statPoints > 0 && state.player.stats[stat] !== undefined) {
    state.player.stats[stat] += 1;
    state.player.statPoints -= 1;
    saveState();
    return true;
  }
  return false;
}

// --- Quest Operations ---
function addQuest(title, description, type, difficulty, associatedStat) {
  const quest = {
    id: "quest-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
    title: title.trim(),
    description: description.trim(),
    type, // 'main' | 'side' | 'daily'
    difficulty, // 'trivial' | 'easy' | 'medium' | 'hard' | 'epic'
    associatedStat, // 'STR' | 'INT' | 'WIS' | 'CHA' | 'CON'
    completed: false,
    createdAt: new Date().toISOString(),
    completedAt: null
  };
  state.quests.unshift(quest);
  saveState();
  return quest;
}

function deleteQuest(id) {
  state.quests = state.quests.filter(q => q.id !== id);
  saveState();
}

function completeQuest(id) {
  const quest = state.quests.find(q => q.id === id);
  if (!quest || quest.completed) return null;

  const baseRewards = DIFFICULTY_VALUES[quest.difficulty];
  let xpGained = baseRewards.xp;
  let goldGained = baseRewards.gold;
  let statGained = baseRewards.stat;

  // 1. Apply Quest Type Multipliers
  if (quest.type === "main") {
    xpGained = Math.round(xpGained * 1.5);
    goldGained = Math.round(goldGained * 1.5);
  }

  // 2. Apply Equipment Boosts
  // Check Weapon boost
  const weaponItem = GEAR_CATALOG.find(i => i.id === state.player.equipment.weapon);
  if (weaponItem && weaponItem.statBoost === quest.associatedStat) {
    xpGained = Math.round(xpGained * (1 + weaponItem.boostPercent));
  }

  // Check Armor boost
  const armorItem = GEAR_CATALOG.find(i => i.id === state.player.equipment.armor);
  if (armorItem && armorItem.statBoost === quest.associatedStat) {
    xpGained = Math.round(xpGained * (1 + armorItem.boostPercent));
  }

  // Check Accessory boost (+Gold)
  const accessoryItem = GEAR_CATALOG.find(i => i.id === state.player.equipment.accessory);
  if (accessoryItem && accessoryItem.id === "lucky_coin") {
    goldGained = Math.round(goldGained * (1 + accessoryItem.boostPercent));
  }

  // 3. Apply Daily Quest Streak Bonus
  if (quest.type === "daily") {
    // Up to +50% extra gold/XP based on current streak
    const streakBonus = Math.min(0.5, state.player.streak * 0.05);
    xpGained = Math.round(xpGained * (1 + streakBonus));
    goldGained = Math.round(goldGained * (1 + streakBonus));
  }

  // 4. Update Stats
  state.player.stats[quest.associatedStat] += statGained;

  // 5. Add Gold & XP
  state.player.gold += goldGained;
  state.player.xp += xpGained;

  // 6. Mark Completed
  quest.completed = true;
  quest.completedAt = new Date().toISOString();

  // 7. Check Level Up
  let leveledUp = false;
  while (state.player.xp >= state.player.xpNext) {
    state.player.xp -= state.player.xpNext;
    state.player.level += 1;
    state.player.xpNext = state.player.level * 100;
    state.player.statPoints += 5;
    state.player.gold += 50; // Level up gold bonus!
    leveledUp = true;
  }

  // 8. Update active date and daily streak
  updateStreak();

  // 9. Deal damage to active co-op raids
  // Damage scales with XP earned and is boosted by party size!
  const damageDealt = Math.round(xpGained * (1 + state.party.length * 0.25));
  const bossesDefeated = [];
  
  state.raids.forEach(boss => {
    if (!boss.completed) {
      boss.currentHp -= damageDealt;
      if (boss.currentHp <= 0) {
        boss.currentHp = 0;
        boss.completed = true;
        // Award boss loot to user
        state.player.gold += boss.rewardGold;
        state.player.xp += boss.rewardXp;
        bossesDefeated.push(boss);

        // Check level-up from boss rewards
        while (state.player.xp >= state.player.xpNext) {
          state.player.xp -= state.player.xpNext;
          state.player.level += 1;
          state.player.xpNext = state.player.level * 100;
          state.player.statPoints += 5;
          state.player.gold += 50;
          leveledUp = true;
        }
      }
    }
  });

  saveState();

  return {
    xpGained,
    goldGained,
    statGained,
    statType: quest.associatedStat,
    leveledUp,
    level: state.player.level,
    damageDealt,
    bossesDefeated
  };
}

// Check and update player streaks
function updateStreak() {
  const todayStr = new Date().toDateString();
  const yesterdayStr = new Date(Date.now() - 86400000).toDateString();

  if (state.player.lastActiveDate === yesterdayStr) {
    // Completed a quest on consecutive day!
    state.player.streak += 1;
  } else if (state.player.lastActiveDate !== todayStr) {
    // Broke streak (more than a day gap)
    state.player.streak = 1;
  }
  state.player.lastActiveDate = todayStr;
}

// Reset daily quests check (called on app startup and focus)
function checkDailyReset() {
  const todayStr = new Date().toDateString();
  const lastActiveStr = state.player.lastActiveDate;

  if (lastActiveStr && lastActiveStr !== todayStr) {
    // It's a new day! Reset all daily quests to not-completed
    let dailyResetHappened = false;
    state.quests.forEach(q => {
      if (q.type === "daily" && q.completed) {
        q.completed = false;
        q.completedAt = null;
        dailyResetHappened = true;
      }
    });

    const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
    if (lastActiveStr !== yesterdayStr) {
      // User missed yesterday entirely, break streak
      state.player.streak = 0;
    }

    if (dailyResetHappened) {
      saveState();
      return true; // daily reset completed
    }
  }
  return false;
}

// --- Shop & Custom Rewards Operations ---
function addCustomReward(name, cost) {
  const reward = {
    id: "rew-" + Date.now(),
    name: name.trim(),
    cost: parseInt(cost, 10),
    isCustom: true
  };
  state.rewards.push(reward);
  saveState();
  return reward;
}

function deleteCustomReward(id) {
  state.rewards = state.rewards.filter(r => r.id !== id);
  saveState();
}

function purchaseReward(id) {
  const reward = state.rewards.find(r => r.id === id);
  if (!reward || state.player.gold < reward.cost) return false;

  state.player.gold -= reward.cost;
  saveState();
  return true;
}

function purchaseGear(itemId) {
  const gear = GEAR_CATALOG.find(item => item.id === itemId);
  if (!gear || state.player.gold < gear.cost) return { success: false, message: "Or insuffisant." };

  // Deduct gold
  state.player.gold -= gear.cost;
  
  // Add to inventory and auto-equip
  state.player.inventory.push(gear.id);
  state.player.equipment[gear.type] = gear.id;
  
  saveState();
  return { success: true, gear };
}

function getRankTitle(level) {
  if (level < 5) return "Novice Polyvalent";
  if (level < 10) return "Aventurier Agile";
  if (level < 15) return "Guerrier d'Élite";
  if (level < 20) return "Savant Sage";
  if (level < 30) return "Grand Maître";
  return "Héros Légendaire";
}

// --- Party / Social System Operations ---
function generateInviteCode() {
  const activeWeapon = state.player.equipment.weapon;
  const weaponItem = GEAR_CATALOG.find(i => i.id === activeWeapon);
  
  const data = {
    name: state.player.name,
    avatar: state.player.avatar,
    class: state.player.class || "Guerrier",
    level: state.player.level,
    stats: state.player.stats,
    weapon: weaponItem ? weaponItem.name : "Poing nu"
  };
  
  // Encode JSON string into base64 safely supporting UTF-8 characters
  const jsonStr = JSON.stringify(data);
  return btoa(encodeURIComponent(jsonStr).replace(/%([0-9A-F]{2})/g, function(match, p1) {
    return String.fromCharCode(parseInt(p1, 16));
  }));
}

function importFriend(code) {
  try {
    const rawJson = decodeURIComponent(Array.prototype.map.call(atob(code.trim()), function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    
    const data = JSON.parse(rawJson);
    
    if (!data.name || !data.level || !data.class) {
      return { success: false, message: "Code erroné ou incomplet." };
    }
    
    // Check duplication
    const duplicate = state.party.find(f => f.name.toLowerCase() === data.name.toLowerCase() && f.class === data.class);
    if (duplicate) {
      return { success: false, message: "Ce héro est déjà dans votre équipe !" };
    }
    
    // Check party cap
    if (state.party.length >= 3) {
      return { success: false, message: "Votre équipe est complète (maximum 4 membres : vous + 3 amis)." };
    }
    
    const friend = {
      id: "friend-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      name: data.name,
      avatar: data.avatar || "Knight",
      class: data.class,
      level: data.level,
      stats: data.stats || { STR: 10, INT: 10, WIS: 10, CHA: 10, CON: 10 },
      weapon: data.weapon || "Poing nu"
    };
    
    state.party.push(friend);
    saveState();
    return { success: true, friend };
  } catch (e) {
    console.error("Failed to parse invite code:", e);
    return { success: false, message: "Code d'invitation corrompu ou illisible." };
  }
}

function removeFriend(id) {
  state.party = state.party.filter(f => f.id !== id);
  saveState();
}

// --- Co-op Boss Raids Operations ---
function addRaidBoss(name, hp, rewardXp, rewardGold) {
  const boss = {
    id: "raid-" + Date.now(),
    name: name.trim(),
    maxHp: parseInt(hp, 10),
    currentHp: parseInt(hp, 10),
    rewardXp: parseInt(rewardXp, 10),
    rewardGold: parseInt(rewardGold, 10),
    completed: false
  };
  state.raids.unshift(boss);
  saveState();
  return boss;
}

function deleteRaidBoss(id) {
  state.raids = state.raids.filter(r => r.id !== id);
  saveState();
}

// --- Expose State globally ---
window.RPGState = {
  DIFFICULTY_VALUES,
  GEAR_CATALOG,
  get state() { return state; },
  saveState,
  loadState,
  setPlayerProfile,
  toggleSound,
  allocateStatPoint,
  addQuest,
  deleteQuest,
  completeQuest,
  checkDailyReset,
  addCustomReward,
  deleteCustomReward,
  purchaseReward,
  purchaseGear,
  getRankTitle,
  completeSetup,
  generateInviteCode,
  importFriend,
  removeFriend,
  addRaidBoss,
  deleteRaidBoss
};
