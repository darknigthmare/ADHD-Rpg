/* ==========================================================================
   QuestLog RPG Application Entry Point (js/app.js)
   Initializes the app, binds modal forms, and monitors daily resets.
   ========================================================================== */

// --- DOM Cache for Modals & Trigger Buttons ---
const elements = {
  // Add Quest Modal triggers
  openAddQuestBtn: document.getElementById('open-add-quest-btn'),
  closeAddQuestBtn: document.getElementById('close-add-quest-btn'),
  cancelAddQuestBtn: document.getElementById('cancel-add-quest-btn'),
  addQuestModal: document.getElementById('add-quest-modal'),
  addQuestForm: document.getElementById('add-quest-form'),

  // Add Reward Modal triggers
  openAddRewardBtn: document.getElementById('open-add-reward-btn'),
  closeAddRewardBtn: document.getElementById('close-add-reward-btn'),
  cancelAddRewardBtn: document.getElementById('cancel-add-reward-btn'),
  addRewardModal: document.getElementById('add-reward-modal'),
  addRewardForm: document.getElementById('add-reward-form'),

  // Profile Modal triggers
  playerTrigger: document.getElementById('player-trigger'),
  changeAvatarBtn: document.getElementById('change-avatar-btn'),
  closeEditProfileBtn: document.getElementById('close-edit-profile-btn'),
  cancelEditProfileBtn: document.getElementById('cancel-edit-profile-btn'),
  editProfileModal: document.getElementById('edit-profile-modal'),
  editProfileForm: document.getElementById('edit-profile-form'),

  // Export Profile Modal triggers
  openExportProfileBtn: document.getElementById('open-export-profile-btn'),
  closeExportProfileBtn: document.getElementById('close-export-profile-btn'),
  copyExportCodeBtn: document.getElementById('copy-export-code-btn'),
  exportProfileModal: document.getElementById('export-profile-modal'),
  exportCodeBox: document.getElementById('export-code-box'),

  // Import Friend Modal triggers
  openImportFriendBtn: document.getElementById('open-import-friend-btn'),
  closeImportFriendBtn: document.getElementById('close-import-friend-btn'),
  cancelImportFriendBtn: document.getElementById('cancel-import-friend-btn'),
  importFriendModal: document.getElementById('import-friend-modal'),
  importFriendForm: document.getElementById('import-friend-form'),
  importCodeBox: document.getElementById('import-code-box'),

  // Create Raid Boss Modal triggers
  openCreateRaidBtn: document.getElementById('open-create-raid-btn'),
  closeCreateRaidBtn: document.getElementById('close-create-raid-btn'),
  cancelCreateRaidBtn: document.getElementById('cancel-create-raid-btn'),
  createRaidModal: document.getElementById('create-raid-modal'),
  createRaidForm: document.getElementById('create-raid-form'),

  // Setup Wizard triggers
  setupWizardOverlay: document.getElementById('setup-wizard-overlay'),
  setupWizardForm: document.getElementById('setup-wizard-form'),

  // Audio Toggle
  soundToggle: document.getElementById('sound-toggle')
};

// --- Initialization Logic ---
function initApp() {
  // 1. Load data from LocalStorage
  RPGState.loadState();

  // 2. Perform daily quest reset calculations
  RPGState.checkDailyReset();

  // 3. Render initial interface
  RPGUI.renderHUD();
  RPGUI.renderCharacterSheet();
  RPGUI.renderQuests();
  RPGUI.renderShop();
  RPGUI.renderSoundToggle();
  
  // Render party-related views
  RPGUI.renderParty();
  RPGUI.renderRaids();

  // 4. Bind listeners
  RPGUI.bindUIEvents();
  bindModalEvents();

  // 5. Check first time character creation setup
  checkSetupWizard();

  // 6. Warm up audio context on first user click
  document.body.addEventListener('click', () => {
    RPGAudio.initAudio();
  }, { once: true });

  // 7. Monitor page focus to reset quests if the user left the app open overnight
  window.addEventListener('focus', () => {
    const resetDone = RPGState.checkDailyReset();
    if (resetDone) {
      RPGUI.renderHUD();
      RPGUI.renderQuests();
      RPGUI.renderCharacterSheet();
      RPGUI.renderParty();
      RPGUI.renderRaids();
    }
  });

  console.log("QuestLog RPG loaded successfully!");
}

// --- Check Setup Wizard ---
function checkSetupWizard() {
  const state = RPGState.state;
  if (!state.player.setupComplete) {
    // Show creation screen
    elements.setupWizardOverlay.classList.remove('hidden');
    RPGUI.populateSetupAvatarOptions();
  } else {
    elements.setupWizardOverlay.classList.add('hidden');
  }
}

// --- Bind Dialog & Modals Forms ---
function bindModalEvents() {
  // --- A. Setup Wizard Form ---
  elements.setupWizardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('setup-name').value;
    const selectedClass = RPGGUI.setupSelectedClass;
    const selectedAvatar = RPGGUI.setupSelectedAvatarSeed;
    
    RPGState.completeSetup(nameInput, selectedAvatar, selectedClass);
    
    // Hide overlay
    elements.setupWizardOverlay.classList.add('hidden');
    
    // Refresh GUI
    RPGUI.renderHUD();
    RPGUI.renderCharacterSheet();
    RPGUI.renderQuests();
    RPGUI.renderShop();
    RPGUI.renderParty();
    RPGUI.renderRaids();
    
    // Play sound FX
    RPGAudio.playLevelUpSound();
    
    // Spawn welcome text
    RPGUI.spawnFloatingText("AVENTURE LANCÉE !", 'var(--color-xp)', { x: window.innerWidth / 2, y: window.innerHeight / 2 });
  });

  // --- B. Add Quest Modal ---
  elements.openAddQuestBtn.addEventListener('click', () => RPGGUI.openModal(elements.addQuestModal));
  
  const closeQuestModal = () => RPGGUI.closeModal(elements.addQuestModal);
  elements.closeAddQuestBtn.addEventListener('click', closeQuestModal);
  elements.cancelAddQuestBtn.addEventListener('click', closeQuestModal);

  elements.addQuestForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('quest-title').value;
    const desc = document.getElementById('quest-desc').value;
    const type = document.getElementById('quest-type').value;
    const difficulty = document.getElementById('quest-difficulty').value;
    const stat = document.getElementById('quest-stat').value;
    
    RPGState.addQuest(title, desc, type, difficulty, stat);
    closeQuestModal();
    RPGUI.renderQuests();
  });

  // --- C. Add Custom Reward Modal ---
  elements.openAddRewardBtn.addEventListener('click', () => RPGGUI.openModal(elements.addRewardModal));
  
  const closeRewardModal = () => RPGGUI.closeModal(elements.addRewardModal);
  elements.closeAddRewardBtn.addEventListener('click', closeRewardModal);
  elements.cancelAddRewardBtn.addEventListener('click', closeRewardModal);

  elements.addRewardForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const title = document.getElementById('reward-title').value;
    const cost = document.getElementById('reward-cost').value;
    
    RPGState.addCustomReward(title, cost);
    closeRewardModal();
    RPGUI.renderShop();
  });

  // --- D. Edit Profile Modal ---
  const openProfileModal = () => {
    RPGUI.setProfileDialogData();
    RPGUI.openModal(elements.editProfileModal);
  };
  
  elements.playerTrigger.addEventListener('click', openProfileModal);
  elements.changeAvatarBtn.addEventListener('click', openProfileModal);

  const closeProfileModal = () => RPGGUI.closeModal(elements.editProfileModal);
  elements.closeEditProfileBtn.addEventListener('click', closeProfileModal);
  elements.cancelEditProfileBtn.addEventListener('click', closeProfileModal);

  elements.editProfileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('profile-name').value;
    const avatar = RPGGUI.selectedAvatarSeed;
    
    RPGState.setPlayerProfile(name, avatar);
    closeProfileModal();
    RPGUI.renderHUD();
    RPGUI.renderCharacterSheet();
    RPGUI.renderParty(); // Re-render party card to sync name change
  });

  // --- E. Export Profile Code Modal ---
  elements.openExportProfileBtn.addEventListener('click', () => {
    const code = RPGState.generateInviteCode();
    elements.exportCodeBox.value = code;
    RPGUI.openModal(elements.exportProfileModal);
  });
  
  const closeExportModal = () => RPGGUI.closeModal(elements.exportProfileModal);
  elements.closeExportProfileBtn.addEventListener('click', closeExportModal);
  
  elements.copyExportCodeBtn.addEventListener('click', () => {
    elements.exportCodeBox.select();
    try {
      navigator.clipboard.writeText(elements.exportCodeBox.value);
      const rect = elements.copyExportCodeBtn.getBoundingClientRect();
      RPGUI.spawnFloatingText("Code Copié !", 'var(--color-gold)', { x: rect.left + rect.width / 2, y: rect.top - 20 });
      RPGAudio.playCoinSound();
    } catch (err) {
      console.error('Could not copy text: ', err);
    }
  });

  // --- F. Import Friend Invite Code Modal ---
  elements.openImportFriendBtn.addEventListener('click', () => RPGGUI.openModal(elements.importFriendModal));
  
  const closeImportModal = () => RPGGUI.closeModal(elements.importFriendModal);
  elements.closeImportFriendBtn.addEventListener('click', closeImportModal);
  elements.cancelImportFriendBtn.addEventListener('click', closeImportModal);
  
  elements.importFriendForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const code = elements.importCodeBox.value;
    const result = RPGState.importFriend(code);
    
    if (result.success) {
      closeImportModal();
      RPGUI.renderParty();
      RPGAudio.playCoinSound();
      RPGUI.spawnFloatingText(`${result.friend.name} a rejoint l'équipe !`, 'var(--color-xp)', { x: window.innerWidth / 2, y: window.innerHeight / 2 });
    } else {
      RPGAudio.playErrorSound();
      alert(result.message || "Erreur de code.");
    }
  });

  // --- G. Create Raid Boss Modal ---
  elements.openCreateRaidBtn.addEventListener('click', () => RPGGUI.openModal(elements.createRaidModal));
  
  const closeCreateRaidModal = () => RPGGUI.closeModal(elements.createRaidModal);
  elements.closeCreateRaidBtn.addEventListener('click', closeCreateRaidModal);
  elements.cancelCreateRaidBtn.addEventListener('click', closeCreateRaidModal);

  elements.createRaidForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('raid-name').value;
    const hp = document.getElementById('raid-hp').value;
    const xp = document.getElementById('raid-reward-xp').value;
    const gold = document.getElementById('raid-reward-gold').value;
    
    RPGState.addRaidBoss(name, hp, xp, gold);
    closeCreateRaidModal();
    RPGUI.renderRaids();
    RPGAudio.playCoinSound();
  });

  // --- H. Sound Toggle Trigger ---
  elements.soundToggle.addEventListener('click', () => {
    RPGState.toggleSound();
    RPGUI.renderSoundToggle();
  });
}

// Run bootstrap when DOM is fully ready
document.addEventListener('DOMContentLoaded', initApp);
