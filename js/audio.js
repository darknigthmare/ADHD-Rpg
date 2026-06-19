/* ==========================================================================
   QuestLog RPG Audio Manager (js/audio.js)
   Synthesizes retro 8-bit sound effects using the Web Audio API.
   ========================================================================== */

let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    // Standard AudioContext initialization
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// Play a short synth note
function playNote(freq, type, duration, startTime, volume = 0.1) {
  if (!RPGState.state.soundEnabled) return;
  
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  osc.type = type; // 'sine' | 'square' | 'sawtooth' | 'triangle'
  osc.frequency.setValueAtTime(freq, startTime);
  
  gainNode.gain.setValueAtTime(volume, startTime);
  // Exponential decay
  gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
}

// 1. Sound: Quest Complete (Ascending Arpeggio)
function playQuestCompleteSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    const notes = [261.63, 329.63, 392.00, 523.25]; // C4, E4, G4, C5
    notes.forEach((freq, index) => {
      playNote(freq, 'triangle', 0.25, now + index * 0.08, 0.12);
    });
  } catch (e) {
    console.warn("Audio Context blocked by browser policy.", e);
  }
}

// 2. Sound: Level Up (Celebration Fanfare)
function playLevelUpSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Quick ascending notes
    const introNotes = [261.63, 329.63, 392.00, 523.25, 392.00, 523.25];
    introNotes.forEach((freq, index) => {
      playNote(freq, 'square', 0.12, now + index * 0.08, 0.08);
    });
    
    // Sustained triumphant final chord at 0.5s
    const finalChord = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    finalChord.forEach(freq => {
      playNote(freq, 'triangle', 0.8, now + 0.48, 0.08);
    });
  } catch (e) {
    console.warn("Audio Context blocked by browser policy.", e);
  }
}

// 3. Sound: Coin Purchase / Gold Chime
function playCoinSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Classic high pitch coin chime
    playNote(987.77, 'sine', 0.08, now, 0.1); // B5
    playNote(1318.51, 'sine', 0.25, now + 0.06, 0.1); // E6
  } catch (e) {
    console.warn("Audio Context blocked by browser policy.", e);
  }
}

// 4. Sound: Stat Allocation Blip
function playStatUpSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Quick rising sweep
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(1000, now + 0.15);
    
    gainNode.gain.setValueAtTime(0.1, now);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
    
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    
    osc.start(now);
    osc.stop(now + 0.15);
  } catch (e) {
    console.warn("Audio Context blocked by browser policy.", e);
  }
}

// 5. Sound: Error / Insufficient Gold
function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Low buzzer sound
    playNote(150, 'sawtooth', 0.2, now, 0.12);
  } catch (e) {
    console.warn("Audio Context blocked by browser policy.", e);
  }
}

// Warm up audio context (bound to first body click event)
function initAudio() {
  try {
    getAudioContext();
  } catch (e) {
    // Silent fail if browser blocks
  }
}

// --- Expose Audio globally ---
window.RPGAudio = {
  playQuestCompleteSound,
  playLevelUpSound,
  playCoinSound,
  playStatUpSound,
  playErrorSound,
  initAudio
};
