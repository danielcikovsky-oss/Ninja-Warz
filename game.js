/**
 * NINJA WARZ – Game Logic
 * Vanilla JavaScript, no external dependencies.
 *
 * Sections:
 *  1. Constants & Data
 *  2. Game State
 *  3. Save / Load
 *  4. Ninja Factory
 *  5. UI Helpers
 *  6. Clan Section
 *  7. Battle Section
 *  8. Shop Section
 *  9. Navigation
 * 10. Initialization
 */

/* ==========================================
   1. CONSTANTS & DATA
   ========================================== */

const NINJA_NAMES = [
  'Shadow Kage', 'Storm Ryu', 'Iron Fist', 'Dark Blade', 'Silent Wind',
  'Thunder Fang', 'Blood Moon', 'Swift Shadow', 'Crimson Claw', 'Night Striker',
  'Death Lotus', 'Phantom Edge', 'Steel Ghost', 'Venom Fang', 'Burning Blade',
  'Frost Bite', 'Jade Serpent', 'Black Lotus', 'Dragon Tail', 'Wolf Shadow',
  'Sand Storm', 'Ice Viper', 'Fire Cobra', 'Shadow Paw', 'Stone Fist',
];

const NINJA_EMOJIS = ['🥷', '⚔️', '🗡️', '💀', '🌑', '🔥', '🌊', '⚡', '🌪️', '🐉'];

const WEAPONS = [
  { id: 'fists',    name: 'Bare Fists',    icon: '✊', atkBonus: 0,  price: 0,    description: 'No weapon equipped' },
  { id: 'sword',    name: 'Iron Sword',    icon: '🗡️', atkBonus: 5,  price: 50,   description: 'A basic iron sword' },
  { id: 'shuriken', name: 'Shurikens',     icon: '⭐', atkBonus: 8,  price: 100,  description: 'Throwing stars for ranged attacks' },
  { id: 'nunchaku', name: 'Nunchaku',      icon: '🥊', atkBonus: 12, price: 200,  description: 'Double chain flails' },
  { id: 'katana',   name: 'Katana',        icon: '⚔️', atkBonus: 20, price: 400,  description: 'The legendary samurai blade' },
  { id: 'kama',     name: 'War Kama',      icon: '🪝', atkBonus: 28, price: 700,  description: 'Curved scythe blades' },
  { id: 'dragon',   name: 'Dragon Blade',  icon: '🔥', atkBonus: 40, price: 1200, description: 'Forged in dragon fire' },
];

const DIFFICULTY = {
  easy: {
    label: 'Easy',
    icon: '🟢',
    desc: 'Weak enemies, low rewards',
    goldMin: 20, goldMax: 50,
    xpMin: 15,   xpMax: 35,
    enemyLevelMin: 1, enemyLevelMax: 2,
    enemyCount: 1,
  },
  medium: {
    label: 'Medium',
    icon: '🟡',
    desc: 'Balanced challenge, decent rewards',
    goldMin: 50,  goldMax: 120,
    xpMin: 40,    xpMax: 90,
    enemyLevelMin: 3, enemyLevelMax: 5,
    enemyCount: 1,
  },
  hard: {
    label: 'Hard',
    icon: '🔴',
    desc: 'Tough enemies, big rewards',
    goldMin: 120, goldMax: 280,
    xpMin: 90,    xpMax: 180,
    enemyLevelMin: 6, enemyLevelMax: 10,
    enemyCount: 1,
  },
};

const RECRUIT_COST = 80;

/* ==========================================
   2. GAME STATE
   ========================================== */

let state = {
  gold: 200,
  clan: [],         // array of ninja objects
  ownedWeapons: [], // array of weapon IDs owned
  battleActive: false,
};

/* ==========================================
   3. SAVE / LOAD (localStorage)
   ========================================== */

function saveGame() {
  try {
    localStorage.setItem('ninjawarz_save', JSON.stringify(state));
  } catch (e) {
    console.warn('Could not save game:', e);
  }
}

function loadGame() {
  try {
    const raw = localStorage.getItem('ninjawarz_save');
    if (raw) {
      const loaded = JSON.parse(raw);
      // Merge to ensure new keys exist if save is older
      state = Object.assign({}, state, loaded);
    }
  } catch (e) {
    console.warn('Could not load saved game:', e);
  }
}

/* ==========================================
   4. NINJA FACTORY
   ========================================== */

function xpForLevel(level) {
  // XP needed to reach next level: 100 * level^1.4
  return Math.floor(100 * Math.pow(level, 1.4));
}

function createNinja(overrides = {}) {
  const level = overrides.level || 1;
  const ninja = {
    id:      Date.now() + Math.random(),
    name:    overrides.name    || randomName(),
    emoji:   overrides.emoji   || randomItem(NINJA_EMOJIS),
    level,
    hp:      overrides.hp   !== undefined ? overrides.hp   : hpForLevel(level),
    maxHp:   hpForLevel(level),
    attack:  overrides.attack  || atkForLevel(level),
    defense: overrides.defense || defForLevel(level),
    xp:      0,
    xpToLevel: xpForLevel(level),
    weapon:  'fists',
    resting: false,
  };
  return ninja;
}

function hpForLevel(lvl) { return 50 + (lvl - 1) * 18; }
function atkForLevel(lvl) { return 10 + (lvl - 1) * 5; }
function defForLevel(lvl) { return 4  + (lvl - 1) * 3; }

function randomName() {
  return NINJA_NAMES[Math.floor(Math.random() * NINJA_NAMES.length)];
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Give XP to a ninja, handle level-ups, return array of levelup messages */
function awardXP(ninja, amount) {
  const messages = [];
  ninja.xp += amount;
  while (ninja.xp >= ninja.xpToLevel) {
    ninja.xp -= ninja.xpToLevel;
    ninja.level += 1;
    ninja.maxHp   = hpForLevel(ninja.level);
    ninja.attack  = atkForLevel(ninja.level) + weaponBonus(ninja);
    ninja.defense = defForLevel(ninja.level);
    ninja.hp      = ninja.maxHp; // full heal on level up
    ninja.xpToLevel = xpForLevel(ninja.level);
    messages.push(`⬆️ ${ninja.name} reached Level ${ninja.level}!`);
  }
  return messages;
}

function weaponBonus(ninja) {
  const w = WEAPONS.find(w => w.id === ninja.weapon);
  return w ? w.atkBonus : 0;
}

function ninjaEffectiveAtk(ninja) {
  return ninja.attack + weaponBonus(ninja);
}

/* ==========================================
   5. UI HELPERS
   ========================================== */

function $(id) { return document.getElementById(id); }
function $$(sel) { return document.querySelectorAll(sel); }

function showToast(msg, type = 'info', duration = 3000) {
  const container = $('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), duration + 100);
}

function updateTopBar() {
  $('top-gold').textContent = state.gold;
  $('top-clan-size').textContent = state.clan.length;
  const avgLevel = state.clan.length
    ? Math.round(state.clan.reduce((a, n) => a + n.level, 0) / state.clan.length)
    : 0;
  $('top-clan-level').textContent = `Avg Lv.${avgLevel}`;
}

function hpPercent(ninja) {
  return Math.max(0, Math.min(100, (ninja.hp / ninja.maxHp) * 100));
}

/* ==========================================
   6. CLAN SECTION
   ========================================== */

function renderClan() {
  updateTopBar();
  const grid = $('ninja-grid');
  grid.innerHTML = '';

  if (state.clan.length === 0) {
    grid.innerHTML = `<div class="empty-state"><span class="empty-icon">🥷</span>Your clan is empty!<br>Recruit your first ninja.</div>`;
    return;
  }

  state.clan.forEach(ninja => {
    const card = document.createElement('div');
    card.className = 'ninja-card' + (ninja.resting ? ' resting' : '');
    card.id = `ninja-card-${ninja.id}`;

    const w = WEAPONS.find(w => w.id === ninja.weapon) || WEAPONS[0];
    const hpPct = hpPercent(ninja);
    const xpPct = Math.min(100, (ninja.xp / ninja.xpToLevel) * 100);

    card.innerHTML = `
      <div class="ninja-card-header">
        <div class="ninja-avatar">${ninja.emoji}</div>
        <div class="ninja-name-block">
          <div class="ninja-name">${ninja.name}</div>
          <div class="ninja-level">Level ${ninja.level}</div>
          ${ninja.weapon !== 'fists' ? `<div class="ninja-weapon-badge">${w.icon} ${w.name}</div>` : ''}
        </div>
      </div>
      <div class="stat-bar-wrap">
        <div class="stat-bar-label"><span>HP</span><span>${ninja.hp}/${ninja.maxHp}</span></div>
        <div class="stat-bar"><div class="stat-bar-fill bar-hp" style="width:${hpPct}%"></div></div>
      </div>
      <div class="stat-bar-wrap">
        <div class="stat-bar-label"><span>XP</span><span>${ninja.xp}/${ninja.xpToLevel}</span></div>
        <div class="stat-bar"><div class="stat-bar-fill bar-xp" style="width:${xpPct}%"></div></div>
      </div>
      <div class="ninja-stats">
        <div class="stat-item"><div class="s-label">ATK</div><div class="s-value">${ninjaEffectiveAtk(ninja)}</div></div>
        <div class="stat-item"><div class="s-label">DEF</div><div class="s-value">${ninja.defense}</div></div>
        <div class="stat-item"><div class="s-label">LVL</div><div class="s-value">${ninja.level}</div></div>
      </div>
      <div class="ninja-card-footer">
        ${ninja.resting
          ? `<span class="rest-indicator">😴 Resting (HP restoring…)</span>
             <button class="btn btn-outline btn-sm" onclick="healNinja('${ninja.id}')">Heal (free)</button>`
          : `<span></span>`
        }
      </div>
    `;

    grid.appendChild(card);
  });
}

function recruitNinja() {
  if (state.gold < RECRUIT_COST) {
    showToast(`❌ Not enough gold! Need ${RECRUIT_COST}💰`, 'error');
    return;
  }
  // Show confirmation modal
  const modal = $('recruit-modal');
  modal.classList.add('open');
}

function confirmRecruit() {
  if (state.gold < RECRUIT_COST) {
    showToast('❌ Not enough gold!', 'error');
    closeRecruitModal();
    return;
  }
  state.gold -= RECRUIT_COST;
  const ninja = createNinja();
  state.clan.push(ninja);
  saveGame();
  renderClan();
  showToast(`🥷 ${ninja.name} joined your clan!`, 'success');
  closeRecruitModal();
}

function closeRecruitModal() {
  $('recruit-modal').classList.remove('open');
}

function healNinja(ninjaId) {
  const ninja = state.clan.find(n => String(n.id) === String(ninjaId));
  if (!ninja) return;
  ninja.hp = ninja.maxHp;
  ninja.resting = false;
  saveGame();
  renderClan();
  showToast(`💚 ${ninja.name} is fully healed!`, 'success');
}

/* ==========================================
   7. BATTLE SECTION
   ========================================== */

let selectedDifficulty = 'easy';
let selectedNinjaId    = null;
let battleInProgress   = false;

function renderBattle() {
  updateTopBar();
  renderNinjaSelector();
}

function renderNinjaSelector() {
  const container = $('ninja-selector');
  container.innerHTML = '';

  const available = state.clan.filter(n => !n.resting);

  if (available.length === 0) {
    container.innerHTML = `<div class="empty-state" style="padding:16px 0"><span class="empty-icon">😴</span>All ninjas are resting. Heal them first!</div>`;
    selectedNinjaId = null;
    updateFightButton();
    return;
  }

  available.forEach(ninja => {
    const btn = document.createElement('button');
    btn.className = 'ninja-select-btn' + (String(ninja.id) === String(selectedNinjaId) ? ' selected' : '');
    btn.innerHTML = `
      <span>${ninja.emoji}</span>
      <div>
        <div class="ninja-select-name">${ninja.name}</div>
        <div class="ninja-select-info">Lv.${ninja.level} · ATK:${ninjaEffectiveAtk(ninja)} · DEF:${ninja.defense} · HP:${ninja.hp}/${ninja.maxHp}</div>
      </div>
    `;
    btn.onclick = () => selectNinja(ninja.id);
    container.appendChild(btn);
  });

  // Auto-select first if none selected or previously selected is now resting
  if (!selectedNinjaId || !available.find(n => String(n.id) === String(selectedNinjaId))) {
    selectNinja(available[0].id);
  }
}

function selectNinja(id) {
  selectedNinjaId = id;
  renderNinjaSelector();
  updateFightButton();
}

function selectDifficulty(diff) {
  selectedDifficulty = diff;
  $$('.diff-btn').forEach(b => b.classList.remove('selected'));
  $(`diff-${diff}`)?.classList.add('selected');
  updateFightButton();
}

function updateFightButton() {
  const btn = $('fight-btn');
  if (!btn) return;
  const canFight = selectedNinjaId && !battleInProgress;
  btn.disabled = !canFight;
}

function startBattle() {
  if (battleInProgress) return;
  const ninja = state.clan.find(n => String(n.id) === String(selectedNinjaId));
  if (!ninja || ninja.resting) {
    showToast('❌ Select an available ninja first!', 'error');
    return;
  }

  const diff = DIFFICULTY[selectedDifficulty];
  const enemyLevel = rand(diff.enemyLevelMin, diff.enemyLevelMax);
  const enemy = createNinja({
    level: enemyLevel,
    name:  randomName(),
    emoji: randomItem(['👹', '💀', '👺', '🤖', '👽']),
    hp:    hpForLevel(enemyLevel),
  });

  battleInProgress = true;
  state.battleActive = true;

  // Show arena
  const arena = $('battle-arena');
  arena.classList.add('visible');
  $('battle-result').style.display = 'none';
  $('battle-result').className = 'battle-result';

  // Set up fighter displays
  setupFighter('player', ninja);
  setupFighter('enemy', enemy);

  $('battle-log').innerHTML = '';
  addLog(`⚔️ Battle begins! ${ninja.name} vs ${enemy.name}`, 'system');
  addLog(`Difficulty: ${diff.label} | Enemy Level: ${enemyLevel}`, 'system');
  addLog('─────────────────────────────', 'system');

  // Disable fight button during battle
  updateFightButton();

  // Run battle turns with delays for visual effect
  runBattleTurns(ninja, enemy, diff);
}

function setupFighter(side, ninja) {
  $(`${side}-avatar`).textContent    = ninja.emoji;
  $(`${side}-name`).textContent      = ninja.name + (side === 'enemy' ? ` (Lv.${ninja.level})` : ` (Lv.${ninja.level})`);
  $(`${side}-hp-fill`).style.width   = '100%';
  $(`${side}-hp-text`).textContent   = `${ninja.hp}/${ninja.maxHp} HP`;
  $(`fighter-${side}`).classList.remove('attacking', 'hit', 'dead');
}

function updateFighterHP(side, ninja) {
  const pct = Math.max(0, (ninja.hp / ninja.maxHp) * 100);
  $(`${side}-hp-fill`).style.width = pct + '%';
  $(`${side}-hp-text`).textContent = `${Math.max(0, ninja.hp)}/${ninja.maxHp} HP`;
}

function addLog(msg, cls = '') {
  const log = $('battle-log');
  const entry = document.createElement('div');
  entry.className = 'log-entry' + (cls ? ' ' + cls : '');
  entry.textContent = msg;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function runBattleTurns(playerNinja, enemyNinja, diff) {
  let turn = 0;
  const maxTurns = 30; // safety cap

  while (playerNinja.hp > 0 && enemyNinja.hp > 0 && turn < maxTurns) {
    turn++;
    await sleep(600);

    // -- Player attacks enemy --
    const playerAtk = ninjaEffectiveAtk(playerNinja);
    let playerDmg = Math.max(1, playerAtk - enemyNinja.defense + rand(-3, 5));
    const playerCrit = Math.random() < 0.15;
    if (playerCrit) { playerDmg = Math.floor(playerDmg * 1.75); }

    enemyNinja.hp -= playerDmg;

    animateFighter('player', 'attacking');
    await sleep(200);
    animateFighter('enemy', 'hit');
    updateFighterHP('enemy', enemyNinja);

    if (playerCrit) {
      addLog(`💥 CRITICAL! ${playerNinja.name} strikes for ${playerDmg} dmg!`, 'crit');
    } else {
      addLog(`⚔️ ${playerNinja.name} attacks → ${playerDmg} damage`, 'hit-enemy');
    }

    await sleep(400);

    if (enemyNinja.hp <= 0) break;

    // -- Enemy attacks player --
    const enemyAtk = ninjaEffectiveAtk(enemyNinja);
    let enemyDmg = Math.max(1, enemyAtk - playerNinja.defense + rand(-3, 5));
    const enemyCrit = Math.random() < 0.12;
    if (enemyCrit) { enemyDmg = Math.floor(enemyDmg * 1.75); }

    playerNinja.hp -= enemyDmg;

    animateFighter('enemy', 'attacking');
    await sleep(200);
    animateFighter('player', 'hit');
    updateFighterHP('player', playerNinja);

    if (enemyCrit) {
      addLog(`💥 CRITICAL! ${enemyNinja.name} hits for ${enemyDmg} dmg!`, 'crit');
    } else {
      addLog(`🔥 ${enemyNinja.name} counters → ${enemyDmg} damage`, 'hit-player');
    }

    await sleep(300);
  }

  // -- Battle outcome --
  await sleep(500);
  const playerWon = playerNinja.hp > 0 && enemyNinja.hp <= 0;
  endBattle(playerWon, playerNinja, diff);
}

function animateFighter(side, animClass) {
  const el = $(`fighter-${side}`);
  el.classList.remove('attacking', 'hit');
  // Force reflow to restart animation
  void el.offsetWidth;
  el.classList.add(animClass);
  setTimeout(() => el.classList.remove(animClass), 500);
}

function endBattle(playerWon, playerNinja, diff) {
  const resultEl = $('battle-result');
  const ninja = state.clan.find(n => String(n.id) === String(playerNinja.id));

  addLog('─────────────────────────────', 'system');

  if (playerWon) {
    $(`fighter-enemy`).classList.add('dead');

    const goldEarned = rand(diff.goldMin, diff.goldMax);
    const xpEarned   = rand(diff.xpMin,   diff.xpMax);

    state.gold += goldEarned;

    if (ninja) {
      ninja.hp = Math.max(1, playerNinja.hp); // preserve HP from battle
      const lvlUpMsgs = awardXP(ninja, xpEarned);
      if (lvlUpMsgs.length > 0) {
        lvlUpMsgs.forEach(m => addLog(m, 'system'));
        showToast(lvlUpMsgs[0], 'success', 4000);
        // Visual feedback on card
        setTimeout(() => {
          const card = $(`ninja-card-${ninja.id}`);
          if (card) card.classList.add('leveled-up');
        }, 500);
      }
    }

    saveGame();
    addLog(`🏆 VICTORY! Earned: ${goldEarned}💰  +${xpEarned} XP`, 'system');

    resultEl.className  = 'battle-result victory';
    resultEl.innerHTML  = `🏆 VICTORY! <br><span style="font-size:0.85rem;font-weight:400">+${goldEarned} 💰 Gold &nbsp;|&nbsp; +${xpEarned} XP</span>`;
    resultEl.style.display = 'block';

    showToast(`🏆 Victory! +${goldEarned}💰  +${xpEarned}XP`, 'success');
  } else {
    $(`fighter-player`).classList.add('dead');

    // Ninjas rest after defeat (HP set to 1, resting = true)
    if (ninja) {
      ninja.hp = 1;
      ninja.resting = true;
    }

    saveGame();
    addLog(`💀 DEFEAT… ${playerNinja.name} must rest to recover.`, 'hit-player');

    resultEl.className  = 'battle-result defeat';
    resultEl.innerHTML  = `💀 DEFEAT <br><span style="font-size:0.85rem;font-weight:400">Your ninja needs to rest. Heal them in the Clan tab.</span>`;
    resultEl.style.display = 'block';

    showToast(`💀 Defeated… your ninja needs rest.`, 'error');
  }

  battleInProgress = false;
  state.battleActive = false;
  updateTopBar();
  updateFightButton();
  renderNinjaSelector();
}

/* ==========================================
   8. SHOP SECTION
   ========================================== */

function renderShop() {
  updateTopBar();
  const grid = $('shop-grid');
  grid.innerHTML = '';

  // Skip fists (id 0, not purchasable)
  WEAPONS.filter(w => w.price > 0).forEach(weapon => {
    const owned   = state.ownedWeapons.includes(weapon.id);
    const canBuy  = !owned && state.gold >= weapon.price;
    const tooExpensive = !owned && state.gold < weapon.price;

    const item = document.createElement('div');
    item.className = 'shop-item';
    item.id = `shop-item-${weapon.id}`;

    let actionsHTML = '';
    if (owned) {
      actionsHTML = `
        <div class="owned-badge">✅ Owned</div>
        <select class="assign-select" id="assign-${weapon.id}" onchange="assignWeapon('${weapon.id}', this.value)">
          <option value="">— Assign to Ninja —</option>
          ${state.clan.map(n => `<option value="${n.id}" ${n.weapon === weapon.id ? 'selected' : ''}>${n.emoji} ${n.name} (Lv.${n.level})</option>`).join('')}
        </select>
      `;
    } else {
      actionsHTML = `
        <button class="btn ${canBuy ? 'btn-gold' : 'btn-outline'}" ${canBuy ? '' : 'disabled'}
          onclick="buyWeapon('${weapon.id}')">
          ${tooExpensive ? '🔒 Need more gold' : `🛒 Buy`}
        </button>
      `;
    }

    item.innerHTML = `
      <div class="shop-item-icon">${weapon.icon}</div>
      <div class="shop-item-name">${weapon.name}</div>
      <div class="shop-item-bonus">+${weapon.atkBonus} Attack</div>
      <div style="font-size:0.78rem;color:var(--text-muted);text-align:center">${weapon.description}</div>
      <div class="shop-item-price">
        <span>💰</span><span>${weapon.price.toLocaleString()}</span>
      </div>
      <div class="shop-item-actions">${actionsHTML}</div>
    `;

    grid.appendChild(item);
  });
}

function buyWeapon(weaponId) {
  const weapon = WEAPONS.find(w => w.id === weaponId);
  if (!weapon) return;
  if (state.gold < weapon.price) {
    showToast(`❌ Not enough gold! Need ${weapon.price}💰`, 'error');
    return;
  }
  if (state.ownedWeapons.includes(weaponId)) {
    showToast('You already own this weapon!', 'info');
    return;
  }
  state.gold -= weapon.price;
  state.ownedWeapons.push(weaponId);
  saveGame();
  renderShop();
  updateTopBar();
  showToast(`🗡️ Purchased ${weapon.name}!`, 'success');
}

function assignWeapon(weaponId, ninjaId) {
  if (!ninjaId) return;
  const ninja = state.clan.find(n => String(n.id) === String(ninjaId));
  if (!ninja) return;
  const weapon = WEAPONS.find(w => w.id === weaponId);

  // Unequip from whoever had it
  state.clan.forEach(n => {
    if (n.weapon === weaponId) n.weapon = 'fists';
  });

  ninja.weapon = weaponId;
  saveGame();
  renderShop();
  renderClan();
  showToast(`⚔️ ${weapon.name} assigned to ${ninja.name}!`, 'success');
}

/* ==========================================
   9. NAVIGATION
   ========================================== */

function showSection(sectionId) {
  $$('.section').forEach(s => s.classList.remove('active'));
  $$('.nav-btn').forEach(b => b.classList.remove('active'));

  const section = $(sectionId);
  if (section) section.classList.add('active');

  const btn = $(`nav-${sectionId}`);
  if (btn) btn.classList.add('active');

  // Render correct section
  if (sectionId === 'section-clan')   renderClan();
  if (sectionId === 'section-battle') renderBattle();
  if (sectionId === 'section-shop')   renderShop();
}

/* ==========================================
   10. INITIALIZATION
   ========================================== */

function init() {
  loadGame();

  // Create starter ninja if clan is empty
  if (state.clan.length === 0) {
    const starter = createNinja();
    state.clan.push(starter);
    saveGame();
    showToast(`🥷 ${starter.name} joined your clan as your first ninja!`, 'success', 4000);
  }

  // Default battle difficulty
  selectDifficulty('easy');

  // Show clan section by default
  showSection('section-clan');
}

// Expose to window for HTML onclick attributes
window.recruitNinja       = recruitNinja;
window.confirmRecruit     = confirmRecruit;
window.closeRecruitModal  = closeRecruitModal;
window.healNinja          = healNinja;
window.selectDifficulty   = selectDifficulty;
window.startBattle        = startBattle;
window.buyWeapon          = buyWeapon;
window.assignWeapon       = assignWeapon;
window.showSection        = showSection;

// Start the game when DOM is ready
document.addEventListener('DOMContentLoaded', init);
