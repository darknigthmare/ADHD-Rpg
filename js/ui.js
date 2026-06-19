/* ==========================================================================
   QuestLog RPG UI Manager (js/ui.js)
   Handles DOM rendering, particle animations, floating text, and modal controls.
   ========================================================================== */

// --- DOM Cache ---
const elements = {
  hudLevel: document.getElementById('hud-level'),
  hudName: document.getElementById('hud-name'),
  hudAvatar: document.getElementById('hud-avatar'),
  hudXpCurrent: document.getElementById('hud-xp-current'),
  hudXpNext: document.getElementById('hud-xp-next'),
  hudXpFill: document.getElementById('hud-xp-fill'),
  hudGold: document.getElementById('hud-gold'),
  hudStreak: document.getElementById('hud-streak'),
  streakContainer: document.getElementById('streak-container'),
  
  sheetAvatar: document.getElementById('sheet-avatar'),
  characterTitle: document.getElementById('character-title'),
  statPointsAlert: document.getElementById('stat-points-alert'),
  statPointsCount: document.getElementById('stat-points-count'),
  
  statStr: document.getElementById('stat-str'),
  statInt: document.getElementById('stat-int'),
  statWis: document.getElementById('stat-wis'),
  statCha: document.getElementById('stat-cha'),
  statCon: document.getElementById('stat-con'),
  
  slotWeapon: document.getElementById('slot-weapon'),
  slotArmor: document.getElementById('slot-armor'),
  slotAccessory: document.getElementById('slot-accessory'),
  
  questsList: document.getElementById('quests-list'),
  rewardsList: document.getElementById('rewards-list'),
  gearList: document.getElementById('gear-list'),
  
  levelUpSplash: document.getElementById('level-up-splash'),
  splashNewLevel: document.getElementById('splash-new-level'),
  closeLevelUpSplashBtn: document.getElementById('close-level-up-splash-btn'),
  
  soundToggle: document.getElementById('sound-toggle'),
  soundIcon: document.getElementById('sound-icon'),
  
  // Modals
  addQuestModal: document.getElementById('add-quest-modal'),
  addRewardModal: document.getElementById('add-reward-modal'),
  editProfileModal: document.getElementById('edit-profile-modal'),
  exportProfileModal: document.getElementById('export-profile-modal'),
  importFriendModal: document.getElementById('import-friend-modal'),
  createRaidModal: document.getElementById('create-raid-modal'),
  
  // Setup Wizard
  setupWizardOverlay: document.getElementById('setup-wizard-overlay'),
  setupAvatarSelector: document.getElementById('setup-avatar-selector')
};

// Available Avatar Seeds
const AVATAR_SEEDS = [
  "Adventurer", "Knight", "Mage", "Rogue", 
  "Princess", "Elf", "Orc", "Paladin", 
  "Wizard", "Shadow", "King", "Brave"
];

const CLASS_DESCRIPTIONS = {
  Guerrier: {
    title: "Guerrier",
    desc: "Spécialiste de l'effort physique et de la discipline. Parfait pour les quêtes liées au sport, à la musculation et aux tâches manuelles difficiles.",
    stats: "FOR +3, CON +2, INT -2, SAG -1"
  },
  Mage: {
    title: "Mage",
    desc: "Dédié aux études, à la programmation et à l'acquisition de savoir. Parfait pour la lecture de livres, le codage, l'apprentissage et le travail intellectuel.",
    stats: "INT +4, SAG +1, FOR -2, CON -0"
  },
  Voleur: {
    title: "Voleur",
    desc: "Maître de l'organisation agile, de l'efficacité et de la négociation. Idéal pour l'organisation de listes de tâches, la planification, le social et le travail d'équipe.",
    stats: "SAG +1, CHA +3, FOR -1, CON -1"
  },
  Prêtre: {
    title: "Prêtre",
    desc: "Dédié au bien-être, à la santé, au sommeil et à la méditation. Idéal pour les quêtes liées au repos, à la nutrition, au sommeil régulier et à l'empathie sociale.",
    stats: "CON +1, SAG +3, INT -1, FOR -1"
  }
};

// Active Filters & States
let currentQuestFilter = 'all'; // 'all' | 'main' | 'side' | 'daily' | 'completed'
let selectedAvatarSeed = "Adventurer";
let setupSelectedAvatarSeed = "Adventurer";
let setupSelectedClass = "Guerrier";

// --- HUD & Character Sheet Rendering ---
function renderHUD() {
  const state = RPGState.state;
  elements.hudLevel.textContent = state.player.level;
  elements.hudName.textContent = state.player.name;
  elements.hudAvatar.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${state.player.avatar}`;
  
  elements.hudXpCurrent.textContent = state.player.xp;
  elements.hudXpNext.textContent = state.player.xpNext;
  
  // Calculate percentage
  const percent = Math.min(100, Math.round((state.player.xp / state.player.xpNext) * 100));
  elements.hudXpFill.style.width = `${percent}%`;
  
  elements.hudGold.textContent = state.player.gold;
  elements.hudStreak.textContent = state.player.streak;
  
  // Class badge
  const badgeClass = document.getElementById('hud-class-badge');
  if (badgeClass) {
    badgeClass.textContent = state.player.class || "Novice";
  }

  if (state.player.streak > 0) {
    elements.streakContainer.classList.remove('hidden');
  } else {
    elements.streakContainer.classList.add('hidden');
  }
}

function renderCharacterSheet() {
  const state = RPGState.state;
  elements.sheetAvatar.src = `https://api.dicebear.com/7.x/pixel-art/svg?seed=${state.player.avatar}`;
  elements.characterTitle.textContent = RPGState.getRankTitle(state.player.level);
  
  // Stats
  elements.statStr.textContent = state.player.stats.STR;
  elements.statInt.textContent = state.player.stats.INT;
  elements.statWis.textContent = state.player.stats.WIS;
  elements.statCha.textContent = state.player.stats.CHA;
  elements.statCon.textContent = state.player.stats.CON;
  
  // Stat points allocation
  const points = state.player.statPoints;
  if (points > 0) {
    elements.statPointsAlert.classList.remove('hidden');
    elements.statPointsCount.textContent = points;
    // Show plus buttons
    document.querySelectorAll('.btn-stat-up').forEach(btn => btn.classList.remove('hidden'));
  } else {
    elements.statPointsAlert.classList.add('hidden');
    document.querySelectorAll('.btn-stat-up').forEach(btn => btn.classList.add('hidden'));
  }
  
  // Equipment Slots
  renderEquippedSlot('weapon', elements.slotWeapon, "Poing nu");
  renderEquippedSlot('armor', elements.slotArmor, "Vêtements simples");
  renderEquippedSlot('accessory', elements.slotAccessory, "Aucun accessoire");
}

function renderEquippedSlot(type, domElement, defaultName) {
  const state = RPGState.state;
  const itemId = state.player.equipment[type];
  if (itemId) {
    const item = RPGState.GEAR_CATALOG.find(i => i.id === itemId);
    if (item) {
      domElement.textContent = item.name;
      domElement.classList.add('equipped');
      domElement.closest('.equipment-slot').setAttribute('title', `${item.name} (${item.effect})`);
      return;
    }
  }
  domElement.textContent = defaultName;
  domElement.classList.remove('equipped');
  domElement.closest('.equipment-slot').setAttribute('title', `Emplacement vide`);
}

// --- Quest Log Rendering ---
function renderQuests() {
  elements.questsList.innerHTML = '';
  
  // Filter quests
  const filtered = RPGState.state.quests.filter(q => {
    if (currentQuestFilter === 'completed') return q.completed;
    if (q.completed) return false; // Hide completed in active lists
    if (currentQuestFilter === 'all') return true;
    return q.type === currentQuestFilter;
  });

  if (filtered.length === 0) {
    let emptyText = "Aucune quête en cours dans cette catégorie.";
    let emptySub = "Créez une nouvelle quête pour débuter votre aventure !";
    if (currentQuestFilter === 'completed') {
      emptyText = "Aucune quête complétée pour le moment.";
      emptySub = "Relevez des défis pour remplir votre historique d'exploits !";
    }
    
    elements.questsList.innerHTML = `
      <div class="empty-state">
        <i data-lucide="scroll-text" class="empty-icon"></i>
        <p>${emptyText}</p>
        <p class="empty-sub">${emptySub}</p>
      </div>
    `;
    createIcons();
    return;
  }

  filtered.forEach(quest => {
    const card = document.createElement('div');
    card.className = `quest-card quest-${quest.type} ${quest.completed ? 'quest-completed' : ''}`;
    card.id = quest.id;
    
    // Type badge translation
    const typeNames = { main: 'Principale', side: 'Secondaire', daily: 'Quotidienne' };
    
    // Reward details
    const difficultyData = RPGState.DIFFICULTY_VALUES[quest.difficulty];
    let xpReward = difficultyData.xp;
    let goldReward = difficultyData.gold;
    
    if (quest.type === 'main') {
      xpReward = Math.round(xpReward * 1.5);
      goldReward = Math.round(goldReward * 1.5);
    }
    
    const difficultyNames = {
      trivial: 'Trivial',
      easy: 'Facile',
      medium: 'Moyen',
      hard: 'Difficile',
      epic: 'Épique'
    };

    // Stat icon mapping
    const statIcons = {
      STR: 'swords',
      INT: 'brain',
      WIS: 'scroll',
      CHA: 'message-square',
      CON: 'heart'
    };
    const statNameFrench = {
      STR: 'Force',
      INT: 'Intelligence',
      WIS: 'Sagesse',
      CHA: 'Charisme',
      CON: 'Constitution'
    };
    
    card.innerHTML = `
      <div class="quest-info">
        <div class="quest-meta-top">
          <span class="quest-badge badge-${quest.type}">${typeNames[quest.type]}</span>
          <span class="difficulty-badge">${difficultyNames[quest.difficulty]}</span>
        </div>
        <h3 class="quest-title">${escapeHTML(quest.title)}</h3>
        ${quest.description ? `<p class="quest-description">${escapeHTML(quest.description)}</p>` : ''}
        <div class="quest-rewards-row">
          <span class="reward-item reward-xp" title="Expérience gagnée">+${xpReward} XP</span>
          <span class="reward-item reward-gold" title="Or gagné"><i data-lucide="coins"></i>+${goldReward} PO</span>
          <span class="reward-item reward-stat-bonus" title="Statistique améliorée">
            <i data-lucide="${statIcons[quest.associatedStat]}"></i>+${difficultyData.stat} ${statNameFrench[quest.associatedStat]}
          </span>
        </div>
      </div>
      <div class="quest-actions">
        ${!quest.completed ? `
          <button class="btn-complete-quest" data-id="${quest.id}" title="Marquer comme complétée">
            <i data-lucide="check"></i>
          </button>
        ` : ''}
        <button class="btn-delete-quest" data-id="${quest.id}" title="Supprimer la quête">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
    `;
    
    elements.questsList.appendChild(card);
  });
  
  createIcons();
}

// --- Shop & Rewards Rendering ---
function renderShop() {
  const state = RPGState.state;
  // 1. Render Custom Rewards
  elements.rewardsList.innerHTML = '';
  if (state.rewards.length === 0) {
    elements.rewardsList.innerHTML = `<p class="shop-desc" style="text-align:center; padding:1rem;">Aucune récompense créée.</p>`;
  } else {
    state.rewards.forEach(rew => {
      const row = document.createElement('div');
      row.className = 'shop-item-card';
      row.innerHTML = `
        <div class="shop-item-icon"><i data-lucide="gift"></i></div>
        <div class="shop-item-info">
          <span class="shop-item-title">${escapeHTML(rew.name)}</span>
          <span class="shop-item-effect">Récompense personnelle dans la vie réelle</span>
        </div>
        <div style="display:flex; align-items:center; gap:0.4rem;">
          <button class="btn-buy-item btn-purchase-reward" data-id="${rew.id}" ${state.player.gold < rew.cost ? 'disabled' : ''}>
            ${rew.cost} PO
          </button>
          ${rew.isCustom ? `
            <button class="btn-delete-reward" data-id="${rew.id}" title="Supprimer">
              <i data-lucide="x"></i>
            </button>
          ` : ''}
        </div>
      `;
      elements.rewardsList.appendChild(row);
    });
  }

  // 2. Render Shop Gear / Equipment
  elements.gearList.innerHTML = '';
  RPGState.GEAR_CATALOG.forEach(item => {
    const isOwned = state.player.inventory.includes(item.id);
    const isEquipped = state.player.equipment[item.type] === item.id;
    
    const row = document.createElement('div');
    row.className = 'shop-item-card';
    
    let actionBtnHTML = '';
    if (isEquipped) {
      actionBtnHTML = `<button class="btn-buy-item purchased" disabled>ÉQUIPÉ</button>`;
    } else if (isOwned) {
      actionBtnHTML = `<button class="btn-buy-item btn-equip-gear" data-id="${item.id}">ÉQUIPER</button>`;
    } else {
      actionBtnHTML = `
        <button class="btn-buy-item btn-purchase-gear" data-id="${item.id}" ${state.player.gold < item.cost ? 'disabled' : ''}>
          ${item.cost} PO
        </button>
      `;
    }

    row.innerHTML = `
      <div class="shop-item-icon" style="color:var(--color-xp); border-color:rgba(0, 245, 212, 0.2)">
        <i data-lucide="${item.icon}"></i>
      </div>
      <div class="shop-item-info">
        <span class="shop-item-title">${item.name}</span>
        <span class="shop-item-effect bonus">${item.effect}</span>
      </div>
      <div>
        ${actionBtnHTML}
      </div>
    `;
    elements.gearList.appendChild(row);
  });
  
  createIcons();
}

// --- Sound Controls View ---
function renderSoundToggle() {
  if (RPGState.state.soundEnabled) {
    elements.soundToggle.classList.remove('muted');
    elements.soundIcon.setAttribute('data-lucide', 'volume-2');
  } else {
    elements.soundToggle.classList.add('muted');
    elements.soundIcon.setAttribute('data-lucide', 'volume-x');
  }
  createIcons();
}

// --- Mon Équipe: Party Rendering ---
function renderParty() {
  const state = RPGState.state;
  const grid = document.getElementById('party-members-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Slot 1: User Card
  const activeWeapon = state.player.equipment.weapon;
  const weaponItem = RPGState.GEAR_CATALOG.find(i => i.id === activeWeapon);
  const weaponName = weaponItem ? weaponItem.name : "Poing nu";
  
  const userCard = document.createElement('div');
  userCard.className = 'party-member-card user-card';
  userCard.innerHTML = `
    <img class="member-avatar" src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${state.player.avatar}" alt="Votre Avatar">
    <span class="member-name">${escapeHTML(state.player.name)} <span style="color:var(--color-xp); font-size:0.75rem;">(Vous)</span></span>
    <span class="member-class-level">${state.player.class || 'Guerrier'} - NIV ${state.player.level}</span>
    <span style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Arme : ${weaponName}</span>
    <div class="member-stats-mini">
      <div class="member-stat-col"><span style="color:var(--color-str);">${state.player.stats.STR}</span><span class="lbl">FOR</span></div>
      <div class="member-stat-col"><span style="color:var(--color-int);">${state.player.stats.INT}</span><span class="lbl">INT</span></div>
      <div class="member-stat-col"><span style="color:var(--color-wis);">${state.player.stats.WIS}</span><span class="lbl">SAG</span></div>
      <div class="member-stat-col"><span style="color:var(--color-cha);">${state.player.stats.CHA}</span><span class="lbl">CHA</span></div>
      <div class="member-stat-col"><span style="color:var(--color-con);">${state.player.stats.CON}</span><span class="lbl">CON</span></div>
    </div>
  `;
  grid.appendChild(userCard);

  // Slots 2, 3, 4: Friends or Empty Slots
  for (let i = 0; i < 3; i++) {
    const friend = state.party[i];
    if (friend) {
      const friendCard = document.createElement('div');
      friendCard.className = 'party-member-card';
      friendCard.innerHTML = `
        <button class="btn-remove-member" data-id="${friend.id}" title="Retirer de l'équipe">
          <i data-lucide="x"></i>
        </button>
        <img class="member-avatar" src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${friend.avatar}" alt="Avatar">
        <span class="member-name">${escapeHTML(friend.name)}</span>
        <span class="member-class-level">${friend.class} - NIV ${friend.level}</span>
        <span style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Arme : ${friend.weapon}</span>
        <div class="member-stats-mini">
          <div class="member-stat-col"><span style="color:var(--color-str);">${friend.stats.STR}</span><span class="lbl">FOR</span></div>
          <div class="member-stat-col"><span style="color:var(--color-int);">${friend.stats.INT}</span><span class="lbl">INT</span></div>
          <div class="member-stat-col"><span style="color:var(--color-wis);">${friend.stats.WIS}</span><span class="lbl">SAG</span></div>
          <div class="member-stat-col"><span style="color:var(--color-cha);">${friend.stats.CHA}</span><span class="lbl">CHA</span></div>
          <div class="member-stat-col"><span style="color:var(--color-con);">${friend.stats.CON}</span><span class="lbl">CON</span></div>
        </div>
      `;
      grid.appendChild(friendCard);
    } else {
      const emptySlot = document.createElement('div');
      emptySlot.className = 'party-empty-slot';
      emptySlot.innerHTML = `
        <i data-lucide="user-plus" class="party-empty-icon"></i>
        <span class="party-empty-text">Emplacement vide</span>
        <span style="font-size:0.7rem; color:var(--text-muted);">Rejoindre via code</span>
      `;
      emptySlot.addEventListener('click', () => {
        openModal(elements.importFriendModal);
      });
      grid.appendChild(emptySlot);
    }
  }
  createIcons();
}

// --- Mon Équipe: Boss Raids Rendering ---
function renderRaids() {
  const state = RPGState.state;
  const grid = document.getElementById('raids-bosses-grid');
  if (!grid) return;
  grid.innerHTML = '';

  if (state.raids.length === 0) {
    grid.innerHTML = `
      <div class="empty-state" style="grid-column: 1 / -1; min-height: 180px;">
        <i data-lucide="sword" class="empty-icon"></i>
        <p>Aucun boss n'est actif.</p>
        <p class="empty-sub">Créez un boss pour coordonner les efforts de votre équipe !</p>
      </div>
    `;
    createIcons();
    return;
  }

  state.raids.forEach(boss => {
    const card = document.createElement('div');
    card.className = `boss-card ${boss.completed ? 'completed' : ''}`;
    card.id = boss.id;

    const hpPercent = Math.max(0, Math.round((boss.currentHp / boss.maxHp) * 100));

    card.innerHTML = `
      <div class="boss-meta">
        <span class="boss-badge ${boss.completed ? 'victory' : ''}">
          ${boss.completed ? 'VAINCU' : 'RAID ACTIF'}
        </span>
        <span style="font-size:0.75rem; color:var(--text-secondary); font-weight:600;">HP Max : ${boss.maxHp}</span>
      </div>
      <h3 class="boss-title">${escapeHTML(boss.name)}</h3>
      
      <div class="boss-hp-section">
        <div class="boss-hp-labels">
          <span>POINTS DE VIE</span>
          <span>${boss.currentHp} / ${boss.maxHp} HP</span>
        </div>
        <div class="boss-hp-container">
          <div class="boss-hp-fill" style="width: ${hpPercent}%"></div>
        </div>
      </div>
      
      <div class="boss-rewards">
        <span style="font-weight: 700; color:var(--text-muted);">BUTIN :</span>
        <span class="reward-item reward-xp">+${boss.rewardXp} XP</span>
        <span class="reward-item reward-gold"><i data-lucide="coins"></i>+${boss.rewardGold} PO</span>
      </div>

      ${boss.completed ? '' : `
        <button class="boss-delete-btn" data-id="${boss.id}" title="Supprimer le boss">
          <i data-lucide="trash-2"></i>
        </button>
      `}
    `;
    grid.appendChild(card);
  });
  createIcons();
}

// --- Visual FX Functions ---

// Spawns floating text rising (+50 XP, etc.)
function spawnFloatingText(text, color, elementIdOrCoord) {
  const span = document.createElement('span');
  span.className = 'floaty-text';
  span.textContent = text;
  span.style.color = color;
  
  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2 - 100;
  
  if (typeof elementIdOrCoord === 'string') {
    const el = document.getElementById(elementIdOrCoord);
    if (el) {
      const rect = el.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top;
    }
  } else if (elementIdOrCoord && typeof elementIdOrCoord.x === 'number') {
    x = elementIdOrCoord.x;
    y = elementIdOrCoord.y;
  }
  
  span.style.left = `${x}px`;
  span.style.top = `${y}px`;
  
  document.body.appendChild(span);
  
  // Remove after animation finishes
  setTimeout(() => {
    span.remove();
  }, 1200);
}

// Particle explosion effect
function spawnParticleBurst(x, y, color = '#00f5d4') {
  const particleCount = 15;
  for (let i = 0; i < particleCount; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    
    // Random sizes
    const size = Math.random() * 6 + 4;
    p.style.width = `${size}px`;
    p.style.height = `${size}px`;
    
    // Set colors
    p.style.background = color;
    p.style.boxShadow = `0 0 6px ${color}`;
    
    // Set position
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    
    // Calculate custom translation destinations for CSS keyframes
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * 80 + 30;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    
    p.style.setProperty('--tx', `${tx}px`);
    p.style.setProperty('--ty', `${ty}px`);
    
    document.body.appendChild(p);
    
    setTimeout(() => {
      p.remove();
    }, 600);
  }
}

// Screen Effects (shake & flash)
function triggerScreenEffects() {
  // Screen Flash
  const flash = document.createElement('div');
  flash.className = 'flash-screen';
  document.body.appendChild(flash);
  setTimeout(() => flash.remove(), 400);

  // Screen Shake
  document.body.classList.add('shake-screen');
  setTimeout(() => {
    document.body.classList.remove('shake-screen');
  }, 500);
}

// Level Up Splash Screen Modal
function triggerLevelUpSplash(level) {
  triggerScreenEffects();
  RPGAudio.playLevelUpSound();
  
  elements.splashNewLevel.textContent = level;
  elements.levelUpSplash.classList.remove('hidden');
  
  // Dynamic floating text
  spawnFloatingText("LEVEL UP!", "var(--color-gold)", { x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 });
}

// --- Modal Helper Functions ---
function openModal(modal) {
  modal.classList.add('active');
  // Auto focus first input
  const input = modal.querySelector('input');
  if (input) input.focus();
}

function closeModal(modal) {
  modal.classList.remove('active');
  const form = modal.querySelector('form');
  if (form) form.reset();
}

// --- Edit Profile Avatar Selector ---
function populateAvatarOptions() {
  const grid = document.getElementById('avatar-selector');
  grid.innerHTML = '';
  
  AVATAR_SEEDS.forEach(seed => {
    const item = document.createElement('div');
    item.className = `avatar-option ${seed === selectedAvatarSeed ? 'selected' : ''}`;
    item.dataset.seed = seed;
    item.innerHTML = `<img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}" alt="${seed}">`;
    
    item.addEventListener('click', () => {
      document.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      selectedAvatarSeed = seed;
    });
    
    grid.appendChild(item);
  });
}

function setProfileDialogData() {
  selectedAvatarSeed = RPGState.state.player.avatar;
  document.getElementById('profile-name').value = RPGState.state.player.name;
  populateAvatarOptions();
}

// --- Setup Wizard Avatar Selector ---
function populateSetupAvatarOptions() {
  const grid = elements.setupAvatarSelector;
  if (!grid) return;
  grid.innerHTML = '';
  
  AVATAR_SEEDS.forEach(seed => {
    const item = document.createElement('div');
    item.className = `avatar-option ${seed === setupSelectedAvatarSeed ? 'selected' : ''}`;
    item.dataset.seed = seed;
    item.innerHTML = `<img src="https://api.dicebear.com/7.x/pixel-art/svg?seed=${seed}" alt="${seed}">`;
    
    item.addEventListener('click', () => {
      grid.querySelectorAll('.avatar-option').forEach(el => el.classList.remove('selected'));
      item.classList.add('selected');
      setupSelectedAvatarSeed = seed;
    });
    
    grid.appendChild(item);
  });
}

// --- Event Handlers / Event Listeners Binding ---
function bindUIEvents() {
  // Navigation tabs view switching
  const navDash = document.getElementById('nav-dash-tab');
  const navParty = document.getElementById('nav-party-tab');
  const viewDash = document.getElementById('view-dashboard');
  const viewParty = document.getElementById('view-party');

  if (navDash && navParty && viewDash && viewParty) {
    navDash.addEventListener('click', () => {
      navDash.classList.add('active');
      navParty.classList.remove('active');
      viewDash.classList.add('active');
      viewParty.classList.remove('active');
      renderHUD();
      renderCharacterSheet();
      renderQuests();
      renderShop();
    });

    navParty.addEventListener('click', () => {
      navParty.classList.add('active');
      navDash.classList.remove('active');
      viewParty.classList.add('active');
      viewDash.classList.remove('active');
      renderParty();
      renderRaids();
    });
  }

  // Setup Wizard Class Card Click
  const classCards = document.querySelectorAll('.class-selection-grid .class-card');
  classCards.forEach(card => {
    card.addEventListener('click', () => {
      classCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      setupSelectedClass = card.dataset.class;
      
      // Update details box
      const classInfo = CLASS_DESCRIPTIONS[setupSelectedClass];
      document.getElementById('class-preview-title').textContent = classInfo.title;
      document.getElementById('class-preview-desc').textContent = classInfo.desc;
      
      const statsBox = document.querySelector('.class-stats-preview');
      statsBox.innerHTML = '';
      classInfo.stats.split(', ').forEach(s => {
        statsBox.innerHTML += `<span>${s}</span>`;
      });
    });
  });

  // Quest filters tabs
  document.querySelectorAll('.filter-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentQuestFilter = tab.dataset.filter;
      renderQuests();
    });
  });

  // Shop content tabs
  document.querySelectorAll('.shop-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.shop-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      document.querySelectorAll('.shop-content').forEach(c => c.classList.remove('active'));
      document.getElementById(`shop-${tab.dataset.shopTab}`).classList.add('active');
    });
  });

  // Quest Actions (Complete and Delete)
  elements.questsList.addEventListener('click', (e) => {
    const completeBtn = e.target.closest('.btn-complete-quest');
    const deleteBtn = e.target.closest('.btn-delete-quest');
    
    if (completeBtn) {
      const id = completeBtn.dataset.id;
      const card = document.getElementById(id);
      
      // Complete quest logic
      const result = RPGState.completeQuest(id);
      if (result) {
        // Play Complete Sound
        RPGAudio.playQuestCompleteSound();
        
        // UI Animations
        const rect = completeBtn.getBoundingClientRect();
        spawnParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 'var(--color-xp)');
        
        // Floating Text
        const statNames = { STR: 'FOR', INT: 'INT', WIS: 'SAG', CHA: 'CHA', CON: 'CON' };
        spawnFloatingText(`+${result.xpGained} XP`, 'var(--color-xp)', { x: rect.left, y: rect.top - 20 });
        setTimeout(() => {
          spawnFloatingText(`+${result.goldGained} Or`, 'var(--color-gold)', { x: rect.left, y: rect.top - 40 });
        }, 150);
        setTimeout(() => {
          spawnFloatingText(`+${result.statGained} ${statNames[result.statType]}`, 'var(--text-secondary)', { x: rect.left, y: rect.top - 60 });
        }, 300);

        // Raid Boss Damage cues
        if (RPGState.state.raids.some(b => !b.completed)) {
          setTimeout(() => {
            spawnFloatingText(`-${result.damageDealt} HP Boss !`, '#ff4d6d', { x: rect.left, y: rect.top - 80 });
            // Shake screen slightly on boss hit
            document.body.classList.add('shake-screen');
            setTimeout(() => document.body.classList.remove('shake-screen'), 300);
          }, 450);
        }

        // Add class for fade out
        if (card) {
          card.classList.add('disintegrate-animation');
          setTimeout(() => {
            renderHUD();
            renderCharacterSheet();
            renderQuests();
            renderShop();
          }, 450);
        }

        // Defeated Boss triggers
        if (result.bossesDefeated && result.bossesDefeated.length > 0) {
          result.bossesDefeated.forEach(boss => {
            setTimeout(() => {
              spawnFloatingText(`BOSS VAINCU : ${boss.name} !`, '#ffb703', { x: window.innerWidth / 2, y: window.innerHeight / 2 - 120 });
              RPGAudio.playLevelUpSound();
            }, 600);
          });
        }

        // Level Up Trigger!
        if (result.leveledUp) {
          setTimeout(() => {
            triggerLevelUpSplash(result.level);
          }, 850);
        }
      }
    }
    
    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      const card = document.getElementById(id);
      if (card) {
        card.classList.add('disintegrate-animation');
        setTimeout(() => {
          RPGState.deleteQuest(id);
          renderQuests();
        }, 450);
      }
    }
  });

  // Teammates removal binding
  const partyGrid = document.getElementById('party-members-grid');
  if (partyGrid) {
    partyGrid.addEventListener('click', (e) => {
      const removeBtn = e.target.closest('.btn-remove-member');
      if (removeBtn) {
        const id = removeBtn.dataset.id;
        const card = removeBtn.closest('.party-member-card');
        if (card) {
          card.classList.add('disintegrate-animation');
          setTimeout(() => {
            RPGState.removeFriend(id);
            renderParty();
          }, 350);
        }
      }
    });
  }

  // Boss deletion binding
  const raidsGrid = document.getElementById('raids-bosses-grid');
  if (raidsGrid) {
    raidsGrid.addEventListener('click', (e) => {
      const deleteBtn = e.target.closest('.boss-delete-btn');
      if (deleteBtn) {
        const id = deleteBtn.dataset.id;
        const card = deleteBtn.closest('.boss-card');
        if (card) {
          card.classList.add('disintegrate-animation');
          setTimeout(() => {
            RPGState.deleteRaidBoss(id);
            renderRaids();
          }, 350);
        }
      }
    });
  }

  // Reward purchasing
  elements.rewardsList.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.btn-purchase-reward');
    const deleteBtn = e.target.closest('.btn-delete-reward');
    
    if (buyBtn) {
      const id = buyBtn.dataset.id;
      const success = RPGState.purchaseReward(id);
      if (success) {
        RPGAudio.playCoinSound();
        const rect = buyBtn.getBoundingClientRect();
        spawnParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 'var(--color-gold)');
        spawnFloatingText("RÉCOMPENSE DÉBLOQUÉE !", 'var(--color-gold)', { x: rect.left, y: rect.top - 25 });
        
        renderHUD();
        renderShop();
      } else {
        RPGAudio.playErrorSound();
      }
    }

    if (deleteBtn) {
      const id = deleteBtn.dataset.id;
      RPGState.deleteCustomReward(id);
      renderShop();
    }
  });

  // Gear purchasing and equipping
  elements.gearList.addEventListener('click', (e) => {
    const buyBtn = e.target.closest('.btn-purchase-gear');
    const equipBtn = e.target.closest('.btn-equip-gear');
    
    if (buyBtn) {
      const id = buyBtn.dataset.id;
      const result = RPGState.purchaseGear(id);
      if (result.success) {
        RPGAudio.playCoinSound();
        const rect = buyBtn.getBoundingClientRect();
        spawnParticleBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 'var(--color-gold)');
        spawnFloatingText(`${result.gear.name} équipé !`, 'var(--color-gold)', { x: rect.left, y: rect.top - 25 });
        
        renderHUD();
        renderCharacterSheet();
        renderShop();
      } else {
        RPGAudio.playErrorSound();
      }
    }
    
    if (equipBtn) {
      const id = equipBtn.dataset.id;
      const gearItem = RPGState.GEAR_CATALOG.find(i => i.id === id);
      if (gearItem) {
        RPGState.state.player.equipment[gearItem.type] = id;
        RPGAudio.playStatUpSound();
        const rect = equipBtn.getBoundingClientRect();
        spawnFloatingText(`${gearItem.name} équipé !`, 'var(--color-gold)', { x: rect.left, y: rect.top - 25 });
        
        renderCharacterSheet();
        renderShop();
      }
    }
  });

  // Stat point allocation
  document.querySelectorAll('.btn-stat-up').forEach(btn => {
    btn.addEventListener('click', () => {
      const stat = btn.dataset.stat;
      const success = RPGState.allocateStatPoint(stat);
      if (success) {
        RPGAudio.playStatUpSound();
        
        const rect = btn.getBoundingClientRect();
        spawnFloatingText("+1 !", 'var(--color-xp)', { x: rect.left, y: rect.top - 15 });
        
        renderCharacterSheet();
      }
    });
  });

  // Level Up close splash btn
  elements.closeLevelUpSplashBtn.addEventListener('click', () => {
    elements.levelUpSplash.classList.add('hidden');
    renderCharacterSheet(); // Refresh stats panel
  });
}

// --- Helper Utilities ---
function escapeHTML(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// --- Expose GUI globally ---
window.RPGUI = {
  renderHUD,
  renderCharacterSheet,
  renderQuests,
  renderShop,
  renderSoundToggle,
  renderParty,
  renderRaids,
  spawnFloatingText,
  spawnParticleBurst,
  triggerLevelUpSplash,
  openModal,
  closeModal,
  populateAvatarOptions,
  populateSetupAvatarOptions,
  setProfileDialogData,
  bindUIEvents,
  get selectedAvatarSeed() { return selectedAvatarSeed; },
  set selectedAvatarSeed(val) { selectedAvatarSeed = val; },
  get setupSelectedAvatarSeed() { return setupSelectedAvatarSeed; },
  set setupSelectedAvatarSeed(val) { setupSelectedAvatarSeed = val; },
  get setupSelectedClass() { return setupSelectedClass; }
};


// Safe Lucide icon renderer
function createIcons() {
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  } else {
    console.warn('Lucide CDN is offline. Icons not rendered.');
  }
}

