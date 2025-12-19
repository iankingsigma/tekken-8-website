// Game State
let gameState = {
    currentScreen: 'deviceDetection',
    selectedCharacter: null,
    player: null,
    cpu: null,
    keys: {},
    combo: [],
    lastKeyTime: 0,
    gameActive: false,
    roundTime: 99,
    comboCount: 0,
    score: 0,
    coins: parseInt(localStorage.getItem('brainrotCoins')) || 1000,
    highScore: localStorage.getItem('brainrotHighScore') || 0,
    deviceType: 'desktop',
    gameMode: 'arcade',
    difficulty: 'medium',
    cpuMemory: JSON.parse(localStorage.getItem('cpuMemory')) || {},
    playerInventory: JSON.parse(localStorage.getItem('playerInventory')) || {},
    practiceStats: {
        comboCount: 0,
        damageDealt: 0,
        startTime: 0
    },
    healCooldownActive: false,
    healCooldownEnd: 0,
    bossUnlocked: localStorage.getItem('boss67Unlocked') === 'true',
    bossDefeated: localStorage.getItem('boss67Defeated') === 'true',
    isBossFight: false,
    bossSpecialAttackCooldown: 0,
    bossStunTimer: 0,
    isBossStunned: false,
    bossSelfDamageTimer: 0,
    playerHiddenHealTimer: 0,
    playerFakeHP: 100,
    playerRealHP: 100,
    survivalPhase: 0,
    cutsceneActive: false,
    cutsceneTimer: 0,
    currentCutsceneText: "",
    cutsceneTextIndex: 0,
    adminMode: false,
    infiniteHeal: false,
    infiniteHP: false,
    secondLifeUsed: false,
    bossDamageMultiplier: 1.0,
    bossStunPhase: 0,
    globalMessage: "",
    customBackground: localStorage.getItem('customBackground') || 'default',
    customBackgroundUrl: localStorage.getItem('customBackgroundUrl') || '',
    // New properties for Boss 21
    isTurnBased: false,
    playerTurn: true,
    playerCharge: 0,
    boss21Pattern: [],
    boss21ActionIndex: 0,
    timingBarActive: false,
    timingIndicator: 0,
    greenZoneStart: 0,
    greenZoneEnd: 0,
    holdingFight: false,
    // Dodge mechanic for Boss 67
    dodgeWindow: false,
    dodgeTimer: 0,
    lastBossAttackTime: 0
};

// Extended Boss Cutscene Text (20 seconds total)
const BOSS_CUTSCENE_TEXTS = [
    "THE LEGEND OF 67...",
    "A FORCE BEYOND COMPREHENSION...",
    "IT CORRUPTS EVERYTHING IT TOUCHES...",
    "YOU CANNOT DEFEAT IT...",
    "YOU CAN ONLY SURVIVE...",
    "BUT EVEN IN DARKNESS...",
    "THERE IS HOPE...",
    "A SECOND CHANCE AWAITS...",
    "WHEN ALL SEEMS LOST...",
    "THE LEGEND WILL PROTECT YOU...",
    "THE LEGEND OF THE BLOODROT...",
    "FIGHT!"
];

// Boss 21 Cutscene Text (4 seconds)
const BOSS21_CUTSCENE_TEXTS = [
    "The Wind Master approaches...",
    "21 reveals his true power!",
    "Prepare for turn-based combat!",
    "Dodge or perish!"
];

// Admin Panel Functions
function initAdminPanel() {
    console.log('Initializing admin panel...');
    let adminCode = '';
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey || e.altKey) return;
        
        adminCode += e.key;
        if (adminCode.length > 6) {
            adminCode = adminCode.slice(1);
        }
        
        if (adminCode === '231214') {
            console.log('Admin code activated!');
            toggleAdminPanel();
            adminCode = '';
        }
    });
}

function toggleAdminPanel() {
    console.log('Toggling admin panel...');
    const existingPanel = document.getElementById('adminPanel');
    if (existingPanel) {
        existingPanel.remove();
        gameState.adminMode = false;
        return;
    }
    
    const adminPanel = document.createElement('div');
    adminPanel.id = 'adminPanel';
    adminPanel.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0,0,0,0.9);
        border: 2px solid #ff0033;
        padding: 15px;
        z-index: 10000;
        color: white;
        font-family: 'Courier New', monospace;
        border-radius: 10px;
        min-width: 300px;
    `;
    
    adminPanel.innerHTML = `
        <div style="margin-bottom: 10px; color: #ff0033; font-weight: bold; text-align: center;">ADMIN PANEL</div>
        <div style="margin-bottom: 10px;">
            <label style="display: block; margin-bottom: 5px;">
                <input type="checkbox" id="infiniteHealCheckbox" ${gameState.infiniteHeal ? 'checked' : ''}>
                Infinite Heal
            </label>
            <label style="display: block; margin-bottom: 5px;">
                <input type="checkbox" id="infiniteHPCheckbox" ${gameState.infiniteHP ? 'checked' : ''}>
                Infinite HP
            </label>
        </div>
        <div style="margin-bottom: 10px;">
            <input type="text" id="globalMessageInput" placeholder="Global Message" 
                   style="width: 100%; padding: 5px; background: #222; color: white; border: 1px solid #ff0033; border-radius: 3px;">
        </div>
        <div style="margin-bottom: 10px;">
            <input type="text" id="customBgInput" placeholder="Custom Background URL" 
                   value="${gameState.customBackgroundUrl}"
                   style="width: 100%; padding: 5px; background: #222; color: white; border: 1px solid #ff0033; border-radius: 3px;">
        </div>
        <button id="sendGlobalMessage" style="width: 100%; padding: 8px; background: #ff0033; color: white; border: none; border-radius: 5px; cursor: pointer;">
            SEND GLOBAL MESSAGE
        </button>
        <button id="setCustomBg" style="width: 100%; padding: 8px; background: #ff0033; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px;">
            SET CUSTOM BG
        </button>
        <button id="closeAdminPanel" style="width: 100%; padding: 8px; background: #333; color: white; border: none; border-radius: 5px; cursor: pointer; margin-top: 5px;">
            CLOSE
        </button>
    `;
    
    document.body.appendChild(adminPanel);
    gameState.adminMode = true;
    
    // Event listeners
    document.getElementById('infiniteHealCheckbox').addEventListener('change', (e) => {
        gameState.infiniteHeal = e.target.checked;
        if (gameState.infiniteHeal) {
            const healButtons = document.querySelectorAll('[data-action="heal"]');
            healButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = 'rgba(100, 255, 100, 0.7)';
                btn.textContent = 'HEAL';
            });
        }
    });
    
    document.getElementById('infiniteHPCheckbox').addEventListener('change', (e) => {
        gameState.infiniteHP = e.target.checked;
        if (gameState.infiniteHP && gameState.player) {
            gameState.player.health = gameState.player.maxHealth;
            gameState.playerRealHP = 100;
            gameState.playerFakeHP = 100;
            updateHealthBars();
        }
    });
    
    document.getElementById('sendGlobalMessage').addEventListener('click', () => {
        const message = document.getElementById('globalMessageInput').value;
        if (message.trim()) {
            showGlobalMessage(message);
        }
    });
    
    document.getElementById('setCustomBg').addEventListener('click', () => {
        const bgUrl = document.getElementById('customBgInput').value;
        if (bgUrl.trim()) {
            setCustomBackground(bgUrl);
        }
    });
    
    document.getElementById('closeAdminPanel').addEventListener('click', () => {
        adminPanel.remove();
        gameState.adminMode = false;
    });
}

function setCustomBackground(url) {
    gameState.customBackgroundUrl = url;
    gameState.customBackground = 'custom';
    localStorage.setItem('customBackgroundUrl', url);
    localStorage.setItem('customBackground', 'custom');
    applyCustomBackground();
    showGlobalMessage('Custom background set!');
}

function showGlobalMessage(message) {
    gameState.globalMessage = message;
    
    const messageDiv = document.createElement('div');
    messageDiv.id = 'globalMessage';
    messageDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: #ffcc00;
        padding: 20px 40px;
        border: 3px solid #ff0033;
        border-radius: 10px;
        font-size: 2rem;
        font-weight: bold;
        text-align: center;
        z-index: 10001;
        text-shadow: 0 0 10px #ff0033;
        animation: pulseGlow 2s infinite;
    `;
    
    messageDiv.textContent = message;
    document.body.appendChild(messageDiv);
    
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.parentNode.removeChild(messageDiv);
        }
    }, 5000);
}

// Initialize game with admin panel
function init() {
    console.log('Initializing Brainrot Fighters...');
    document.getElementById('highScore').textContent = gameState.highScore;
    document.getElementById('coinsAmount').textContent = gameState.coins;
    detectDevice();
    setupEventListeners();
    renderCharacterSelect();
    initAdminPanel(); // Initialize admin panel
    applyCustomBackground(); // Apply custom background if set
    
    checkBossUnlock();
    
    if (typeof loadShopItems === 'function') {
        setTimeout(loadShopItems, 100);
    }
    
    if (menuMusic) {
        menuMusic.volume = 0.7;
        menuMusic.play().catch(e => {
            console.log("Menu music play failed:", e);
        });
    }
}

// Custom background system
function applyCustomBackground() {
    const body = document.body;
    
    // Remove existing custom background classes and styles
    body.classList.remove('bg-space', 'bg-neon', 'bg-matrix', 'bg-fire', 'bg-ice', 'bg-custom');
    body.style.backgroundImage = '';
    body.style.backgroundSize = '';
    body.style.backgroundPosition = '';
    body.style.backgroundRepeat = '';
    
    // Apply selected background
    if (gameState.customBackground === 'custom' && gameState.customBackgroundUrl) {
        body.classList.add('bg-custom');
        body.style.backgroundImage = `url('${gameState.customBackgroundUrl}')`;
        body.style.backgroundSize = 'cover';
        body.style.backgroundPosition = 'center';
        body.style.backgroundRepeat = 'no-repeat';
    } else if (gameState.customBackground !== 'default') {
        body.classList.add(`bg-${gameState.customBackground}`);
    }
}

// Updated 67 Boss functions with new mechanics
function startBossCutscene() {
    gameState.cutsceneActive = true;
    gameState.cutsceneTimer = 0;
    gameState.cutsceneTextIndex = 0;
    gameState.currentCutsceneText = "";
    gameState.secondLifeUsed = false;
    gameState.bossDamageMultiplier = 1.0;
    gameState.bossStunPhase = 0;
    gameState.bossStunTimer = 0;
    
    document.getElementById('gameCanvas').style.opacity = '0.3';
    document.querySelector('.hud').style.opacity = '0.3';
    const touchControls = document.getElementById('touchControls');
    if (touchControls) touchControls.style.opacity = '0.3';
    
    let cutsceneOverlay = document.getElementById('cutsceneOverlay');
    if (!cutsceneOverlay) {
        cutsceneOverlay = document.createElement('div');
        cutsceneOverlay.id = 'cutsceneOverlay';
        cutsceneOverlay.style.position = 'absolute';
        cutsceneOverlay.style.top = '0';
        cutsceneOverlay.style.left = '0';
        cutsceneOverlay.style.width = '100%';
        cutsceneOverlay.style.height = '100%';
        cutsceneOverlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        cutsceneOverlay.style.display = 'flex';
        cutsceneOverlay.style.flexDirection = 'column';
        cutsceneOverlay.style.justifyContent = 'center';
        cutsceneOverlay.style.alignItems = 'center';
        cutsceneOverlay.style.zIndex = '50';
        cutsceneOverlay.style.color = '#ffcc00';
        cutsceneOverlay.style.fontSize = '3rem';
        cutsceneOverlay.style.textAlign = 'center';
        cutsceneOverlay.style.padding = '2rem';
        
        const cutsceneText = document.createElement('div');
        cutsceneText.id = 'cutsceneText';
        cutsceneText.style.fontSize = '3rem';
        cutsceneText.style.textShadow = '0 0 10px #ff0033';
        cutsceneText.style.letterSpacing = '3px';
        cutsceneText.style.lineHeight = '1.5';
        cutsceneText.style.maxWidth = '80%';
        
        cutsceneOverlay.appendChild(cutsceneText);
        document.getElementById('gameScreen').appendChild(cutsceneOverlay);
    }
    
    cutsceneOverlay.style.display = 'flex';
    animateCutscene();
}

function animateCutscene() {
    if (!gameState.cutsceneActive) return;
    
    const cutsceneText = document.getElementById('cutsceneText');
    const texts = BOSS_CUTSCENE_TEXTS;
    const totalDuration = 20000; // 20 seconds in milliseconds
    const textDuration = totalDuration / texts.length; // ~1.67 seconds per text
    
    const currentTime = Date.now();
    if (!gameState.cutsceneStartTime) {
        gameState.cutsceneStartTime = currentTime;
    }
    
    const elapsed = currentTime - gameState.cutsceneStartTime;
    const currentTextIndex = Math.floor(elapsed / textDuration);
    
    if (currentTextIndex < texts.length) {
        if (currentTextIndex !== gameState.cutsceneTextIndex) {
            gameState.cutsceneTextIndex = currentTextIndex;
            gameState.currentCutsceneText = texts[currentTextIndex];
            cutsceneText.textContent = gameState.currentCutsceneText;
            cutsceneText.style.opacity = '0';
            
            // Fade in
            setTimeout(() => {
                cutsceneText.style.opacity = '1';
            }, 100);
        }
        
        // Fade out near the end of each text segment
        const progressInText = (elapsed % textDuration) / textDuration;
        if (progressInText > 0.8) {
            cutsceneText.style.opacity = (1 - ((progressInText - 0.8) * 5)).toString();
        } else if (progressInText < 0.2) {
            cutsceneText.style.opacity = (progressInText * 5).toString();
        } else {
            cutsceneText.style.opacity = '1';
        }
    } else {
        // End cutscene
        endCutscene();
        return;
    }
    
    requestAnimationFrame(animateCutscene);
}

function endCutscene() {
    gameState.cutsceneActive = false;
    gameState.cutsceneStartTime = null;
    
    const cutsceneOverlay = document.getElementById('cutsceneOverlay');
    if (cutsceneOverlay) {
        cutsceneOverlay.style.display = 'none';
    }
    
    document.getElementById('gameCanvas').style.opacity = '1';
    document.querySelector('.hud').style.opacity = '1';
    const touchControls = document.getElementById('touchControls');
    if (touchControls) touchControls.style.opacity = '1';
    
    animate();
    
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = "SURVIVE! Boss stuns every 40s with 1% damage!";
        display.classList.add('active');
        setTimeout(() => {
            display.classList.remove('active');
        }, 3000);
    }
}

// Boss 21 Turn-based Combat System
function startBoss21Cutscene() {
    gameState.cutsceneActive = true;
    gameState.cutsceneTimer = 0;
    gameState.cutsceneTextIndex = 0;
    gameState.currentCutsceneText = "";
    gameState.isTurnBased = true;
    gameState.playerTurn = true;
    gameState.playerCharge = 0;
    gameState.boss21ActionIndex = 0;
    
    // Initialize boss 21 attack pattern
    gameState.boss21Pattern = [
        { action: 'charge', text: '21 is charging power...' },
        { action: 'gun', text: '21 aims his wind gun!', dodgeable: true },
        { action: 'dash', text: '21 dashes forward!', dodgeable: true },
        { action: 'combo', text: '21 unleashes a combo!', dodgeable: true }
    ];
    
    document.getElementById('gameCanvas').style.opacity = '0.3';
    document.querySelector('.hud').style.opacity = '0.3';
    
    let cutsceneOverlay = document.getElementById('cutsceneOverlay');
    if (!cutsceneOverlay) {
        cutsceneOverlay = document.createElement('div');
        cutsceneOverlay.id = 'cutsceneOverlay';
        cutsceneOverlay.style.position = 'absolute';
        cutsceneOverlay.style.top = '0';
        cutsceneOverlay.style.left = '0';
        cutsceneOverlay.style.width = '100%';
        cutsceneOverlay.style.height = '100%';
        cutsceneOverlay.style.backgroundColor = 'rgba(0,0,0,0.8)';
        cutsceneOverlay.style.display = 'flex';
        cutsceneOverlay.style.flexDirection = 'column';
        cutsceneOverlay.style.justifyContent = 'center';
        cutsceneOverlay.style.alignItems = 'center';
        cutsceneOverlay.style.zIndex = '50';
        cutsceneOverlay.style.color = '#00ccff';
        cutsceneOverlay.style.fontSize = '3rem';
        cutsceneOverlay.style.textAlign = 'center';
        cutsceneOverlay.style.padding = '2rem';
        
        const cutsceneText = document.createElement('div');
        cutsceneText.id = 'cutsceneText';
        cutsceneText.style.fontSize = '3rem';
        cutsceneText.style.textShadow = '0 0 10px #00ccff';
        cutsceneText.style.letterSpacing = '3px';
        cutsceneText.style.lineHeight = '1.5';
        cutsceneText.style.maxWidth = '80%';
        
        cutsceneOverlay.appendChild(cutsceneText);
        document.getElementById('gameScreen').appendChild(cutsceneOverlay);
    }
    
    cutsceneOverlay.style.display = 'flex';
    cutsceneOverlay.style.color = '#00ccff';
    cutsceneOverlay.style.textShadow = '0 0 10px #00ccff';
    
    // Play 21 boss music
    const boss21Music = document.getElementById('boss21Music');
    if (boss21Music) {
        boss21Music.volume = 0.7;
        boss21Music.play().catch(e => console.log("Boss 21 music play failed:", e));
    }
    
    animateBoss21Cutscene();
}

function animateBoss21Cutscene() {
    if (!gameState.cutsceneActive) return;
    
    const cutsceneText = document.getElementById('cutsceneText');
    const texts = BOSS21_CUTSCENE_TEXTS;
    const totalDuration = 4000; // 4 seconds in milliseconds
    const textDuration = totalDuration / texts.length; // 1 second per text
    
    const currentTime = Date.now();
    if (!gameState.cutsceneStartTime) {
        gameState.cutsceneStartTime = currentTime;
    }
    
    const elapsed = currentTime - gameState.cutsceneStartTime;
    const currentTextIndex = Math.floor(elapsed / textDuration);
    
    if (currentTextIndex < texts.length) {
        if (currentTextIndex !== gameState.cutsceneTextIndex) {
            gameState.cutsceneTextIndex = currentTextIndex;
            gameState.currentCutsceneText = texts[currentTextIndex];
            cutsceneText.textContent = gameState.currentCutsceneText;
            cutsceneText.style.opacity = '0';
            
            // Fade in
            setTimeout(() => {
                cutsceneText.style.opacity = '1';
            }, 100);
        }
    } else {
        // End cutscene and start turn-based combat
        endBoss21Cutscene();
        return;
    }
    
    requestAnimationFrame(animateBoss21Cutscene);
}

function endBoss21Cutscene() {
    gameState.cutsceneActive = false;
    gameState.cutsceneStartTime = null;
    
    const cutsceneOverlay = document.getElementById('cutsceneOverlay');
    if (cutsceneOverlay) {
        cutsceneOverlay.style.display = 'none';
    }
    
    document.getElementById('gameCanvas').style.opacity = '1';
    document.querySelector('.hud').style.opacity = '1';
    
    // Show turn-based UI
    const turnBasedUI = document.getElementById('turnBasedUI');
    if (turnBasedUI) {
        turnBasedUI.style.display = 'block';
    }
    
    // Initialize turn-based combat
    initTurnBasedCombat();
    
    animate();
}

function initTurnBasedCombat() {
    updateTurnBasedUI();
    
    // Set up turn-based button event listeners
    document.getElementById('fightBtn').addEventListener('click', () => {
        if (gameState.playerTurn && gameState.playerCharge > 0) {
            startTimingBar();
        }
    });
    
    document.getElementById('healBtn').addEventListener('click', () => {
        if (gameState.playerTurn && gameState.playerCharge > 0) {
            playerHeal();
        }
    });
    
    document.getElementById('chargeBtn').addEventListener('click', () => {
        if (gameState.playerTurn) {
            playerCharge();
        }
    });
}

function updateTurnBasedUI() {
    const turnIndicator = document.getElementById('turnIndicator');
    const fightBtn = document.getElementById('fightBtn');
    const healBtn = document.getElementById('healBtn');
    const chargeBtn = document.getElementById('chargeBtn');
    
    if (turnIndicator) {
        turnIndicator.textContent = gameState.playerTurn ? 'YOUR TURN' : 'BOSS 21 TURN';
        turnIndicator.style.color = gameState.playerTurn ? '#00ff00' : '#ff0033';
    }
    
    if (fightBtn) {
        fightBtn.disabled = !gameState.playerTurn || gameState.playerCharge === 0;
        fightBtn.textContent = gameState.playerCharge === 0 ? 'FIGHT (NEED CHARGE)' : 'FIGHT';
    }
    
    if (healBtn) {
        healBtn.disabled = !gameState.playerTurn || gameState.playerCharge === 0;
        healBtn.textContent = gameState.playerCharge === 0 ? 'HEAL (NEED CHARGE)' : 'HEAL';
    }
    
    if (chargeBtn) {
        chargeBtn.disabled = !gameState.playerTurn;
        chargeBtn.textContent = 'CHARGE';
    }
}

function startTimingBar() {
    gameState.timingBarActive = true;
    gameState.timingIndicator = 0;
    gameState.holdingFight = false;
    
    const container = document.getElementById('timingBarContainer');
    const indicator = document.getElementById('timingIndicator');
    const greenZone = document.getElementById('greenZone');
    
    if (container) container.style.display = 'block';
    
    // Random green zone position
    gameState.greenZoneStart = 30 + Math.random() * 40; // 30-70%
    gameState.greenZoneEnd = gameState.greenZoneStart + 15; // 15% wide
    
    if (greenZone) {
        greenZone.style.left = gameState.greenZoneStart + '%';
        greenZone.style.width = '15%';
    }
    
    // Start timing bar animation
    animateTimingBar();
    
    // Set up mouse/touch events for timing
    const fightBtn = document.getElementById('fightBtn');
    fightBtn.addEventListener('mousedown', startHolding);
    fightBtn.addEventListener('mouseup', releaseHold);
    fightBtn.addEventListener('touchstart', startHolding);
    fightBtn.addEventListener('touchend', releaseHold);
}

function animateTimingBar() {
    if (!gameState.timingBarActive) return;
    
    gameState.timingIndicator += 2; // Move right
    if (gameState.timingIndicator > 100) {
        gameState.timingIndicator = 0;
    }
    
    const indicator = document.getElementById('timingIndicator');
    if (indicator) {
        indicator.style.left = gameState.timingIndicator + '%';
    }
    
    if (gameState.holdingFight) {
        // Check if in green zone
        const inGreenZone = gameState.timingIndicator >= gameState.greenZoneStart && 
                           gameState.timingIndicator <= gameState.greenZoneEnd;
        
        if (inGreenZone) {
            // Perfect timing - execute attack
            executePerfectAttack();
            return;
        }
    }
    
    requestAnimationFrame(animateTimingBar);
}

function startHolding(e) {
    e.preventDefault();
    gameState.holdingFight = true;
}

function releaseHold(e) {
    e.preventDefault();
    gameState.holdingFight = false;
}

function executePerfectAttack() {
    gameState.timingBarActive = false;
    
    const container = document.getElementById('timingBarContainer');
    if (container) container.style.display = 'none';
    
    // Apply damage to boss
    const damage = gameState.cpu.maxHealth * 0.25 * gameState.playerCharge;
    gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
    
    // Reset charge
    gameState.playerCharge = 0;
    
    // Show success message
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = "PERFECT TIMING! CRITICAL HIT!";
        display.classList.add('active');
        setTimeout(() => {
            display.classList.remove('active');
        }, 2000);
    }
    
    updateHealthBars();
    updateTurnBasedUI();
    
    // Switch to boss turn
    setTimeout(() => {
        gameState.playerTurn = false;
        updateTurnBasedUI();
        executeBoss21Action();
    }, 1000);
}

function playerHeal() {
    if (gameState.playerCharge === 0) return;
    
    const healAmount = gameState.player.maxHealth * 0.15 * gameState.playerCharge;
    gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
    
    gameState.playerCharge = 0;
    
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = "HEALED! HEALTH RESTORED!";
        display.classList.add('active');
        setTimeout(() => {
            display.classList.remove('active');
        }, 2000);
    }
    
    updateHealthBars();
    updateTurnBasedUI();
    
    // Switch to boss turn
    setTimeout(() => {
        gameState.playerTurn = false;
        updateTurnBasedUI();
        executeBoss21Action();
    }, 1000);
}

function playerCharge() {
    gameState.playerCharge = Math.min(3, gameState.playerCharge + 1);
    
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = `CHARGED! POWER LEVEL: ${gameState.playerCharge}`;
        display.classList.add('active');
        setTimeout(() => {
            display.classList.remove('active');
        }, 1500);
    }
    
    updateTurnBasedUI();
    
    // Switch to boss turn
    setTimeout(() => {
        gameState.playerTurn = false;
        updateTurnBasedUI();
        executeBoss21Action();
    }, 1000);
}

function executeBoss21Action() {
    const actionDisplay = document.getElementById('bossActionDisplay');
    const currentAction = gameState.boss21Pattern[gameState.boss21ActionIndex % gameState.boss21Pattern.length];
    
    if (actionDisplay) {
        actionDisplay.textContent = currentAction.text;
        actionDisplay.style.display = 'block';
    }
    
    gameState.boss21ActionIndex++;
    
    if (currentAction.dodgeable) {
        // Show dodge window for 2 seconds
        showDodgeWindow();
        
        setTimeout(() => {
            if (gameState.dodgeWindow) {
                // Player failed to dodge
                const damage = gameState.player.maxHealth * 0.20;
                applyPlayerDamage(damage);
                
                const display = document.getElementById('comboDisplay');
                if (display) {
                    display.textContent = "HIT! DODGE FAILED!";
                    display.classList.add('active');
                    setTimeout(() => {
                        display.classList.remove('active');
                    }, 1500);
                }
            }
            
            hideDodgeWindow();
            
            // Back to player turn
            setTimeout(() => {
                gameState.playerTurn = true;
                updateTurnBasedUI();
                if (actionDisplay) actionDisplay.style.display = 'none';
            }, 1000);
        }, 2000);
    } else {
        // Non-dodgeable action (charging)
        setTimeout(() => {
            // Back to player turn
            gameState.playerTurn = true;
            updateTurnBasedUI();
            if (actionDisplay) actionDisplay.style.display = 'none';
        }, 2000);
    }
}

function showDodgeWindow() {
    gameState.dodgeWindow = true;
    const dodgeIndicator = document.getElementById('dodgeIndicator');
    if (dodgeIndicator) {
        dodgeIndicator.style.display = 'block';
    }
    
    // Set up dodge click handler
    document.addEventListener('click', handleDodge);
    document.addEventListener('touchstart', handleDodge);
}

function hideDodgeWindow() {
    gameState.dodgeWindow = false;
    const dodgeIndicator = document.getElementById('dodgeIndicator');
    if (dodgeIndicator) {
        dodgeIndicator.style.display = 'none';
    }
    
    // Remove dodge handlers
    document.removeEventListener('click', handleDodge);
    document.removeEventListener('touchstart', handleDodge);
}

function handleDodge(e) {
    if (gameState.dodgeWindow) {
        e.preventDefault();
        gameState.dodgeWindow = false;
        
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "PERFECT DODGE!";
            display.classList.add('active');
            setTimeout(() => {
                display.classList.remove('active');
            }, 1500);
        }
        
        hideDodgeWindow();
    }
}

// Dodge mechanic for Boss 67
function showDodgeIndicator() {
    const dodgeIndicator = document.getElementById('dodgeIndicator');
    if (dodgeIndicator) {
        dodgeIndicator.style.display = 'block';
        
        setTimeout(() => {
            dodgeIndicator.style.display = 'none';
        }, 1000); // 1 second dodge window
    }
}

// Updated boss fight mechanics
function updateBossAI() {
    const distance = gameState.cpu.x - gameState.player.x;
    
    // Boss movement
    if (Math.abs(distance) > 2.5 && !gameState.isBossStunned) {
        gameState.cpu.x += (distance > 0 ? -0.08 : 0.08);
    }
    
    if (window.cpuModel) {
        window.cpuModel.position.x = gameState.cpu.x;
        window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
    }
    
    // Boss stun phases (40 seconds progression)
    gameState.bossStunTimer++;
    
    // Phase 1: 0-40 seconds - normal
    // Phase 2: 40-80 seconds - 1% damage
    // Phase 3: 80-112 seconds (1:52) - fully stunned
    if (gameState.bossStunTimer >= 1200 && gameState.bossStunPhase === 0) { // 40 seconds
        gameState.bossStunPhase = 1;
        triggerBossStun(25); // 25% self damage
    } else if (gameState.bossStunTimer >= 2400 && gameState.bossStunPhase === 1) { // 80 seconds
        gameState.bossStunPhase = 2;
        triggerBossStun(25); // Another 25% self damage
    } else if (gameState.bossStunTimer >= 3360 && gameState.bossStunPhase === 2) { // 112 seconds (1:52)
        gameState.bossStunPhase = 3;
        triggerBossStun(50); // Final 50% self damage to defeat boss
    }
    
    // Boss attacks
    if (!gameState.isBossStunned && gameState.cpu.attackCooldown <= 0 && Math.abs(distance) < 4) {
        let attackType;
        
        if (gameState.bossSpecialAttackCooldown <= 0) {
            if (Math.random() < 0.15) {
                doBossStompAttack();
                gameState.bossSpecialAttackCooldown = 120;
                return;
            } else if (Math.random() < 0.3) {
                doBossDashAttack();
                gameState.bossSpecialAttackCooldown = 90;
                return;
            }
        }
        
        const attackTypes = ['punch', 'kick', 'special'];
        attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
        doCpuAttack(attackType);
        
        gameState.cpu.attackCooldown = 20 / gameState.cpu.difficulty.aggression;
    }
}

function triggerBossStun(selfDamagePercent) {
    gameState.isBossStunned = true;
    
    // Set damage multiplier based on phase
    if (gameState.bossStunPhase === 1) {
        gameState.bossDamageMultiplier = 0.01; // 1% damage during first stun phase
    } else if (gameState.bossStunPhase === 2) {
        gameState.bossDamageMultiplier = 0.01; // 1% damage during second stun phase
    } else if (gameState.bossStunPhase === 3) {
        gameState.bossDamageMultiplier = 0.0; // No damage during final phase
    }
    
    // Self damage
    if (selfDamagePercent > 0) {
        const damage = gameState.cpu.maxHealth * (selfDamagePercent / 100);
        gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
    }
    
    createBossStunEffect();
    
    const display = document.getElementById('comboDisplay');
    if (display) {
        let message = "";
        if (gameState.bossStunPhase === 1) {
            message = `67 BOSS STUNNED! -${selfDamagePercent}% HP (1% DMG)`;
        } else if (gameState.bossStunPhase === 2) {
            message = `67 BOSS WEAKENED! -${selfDamagePercent}% HP (1% DMG)`;
        } else if (gameState.bossStunPhase === 3) {
            message = `67 BOSS DEFEATED! -${selfDamagePercent}% HP`;
        }
        display.textContent = message;
        display.classList.add('active');
        setTimeout(() => {
            display.classList.remove('active');
        }, 3000);
    }
    
    // Stun duration based on phase
    let stunDuration = 600; // 20 seconds for first two phases
    if (gameState.bossStunPhase === 3) {
        stunDuration = 1; // Instant for final phase
    }
    
    setTimeout(() => {
        gameState.isBossStunned = false;
        gameState.secondLifeUsed = false; // Reset second life for next phase
        
        if (gameState.bossStunPhase !== 3) {
            gameState.bossDamageMultiplier = 1.0; // Reset damage between phases
        } else {
            // Boss defeated
            gameState.cpu.health = 0;
        }
    }, stunDuration * 33); // Convert frames to milliseconds
}

// Second Life mechanic
function checkSecondLife() {
    if (gameState.isBossFight && !gameState.secondLifeUsed && 
        (gameState.playerRealHP <= 20 || (gameState.playerRealHP - 10 <= 0))) {
        
        gameState.secondLifeUsed = true;
        gameState.playerRealHP = 100;
        gameState.playerFakeHP = 100;
        gameState.player.health = gameState.player.maxHealth;
        
        createSecondLifeEffect();
        
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "SECOND LIFE ACTIVATED! FULL HEALTH RESTORED!";
            display.classList.add('active');
            setTimeout(() => {
                display.classList.remove('active');
            }, 3000);
        }
        
        return true;
    }
    return false;
}

function createSecondLifeEffect() {
    const effect = document.createElement('div');
    effect.className = 'second-life-effect';
    effect.textContent = 'SECOND LIFE!';
    effect.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 4rem;
        color: #00ff00;
        text-shadow: 0 0 20px #00ff00;
        z-index: 100;
        animation: secondLifePulse 2s infinite;
    `;
    
    document.getElementById('gameScreen').appendChild(effect);
    
    setTimeout(() => {
        if (effect.parentNode) {
            effect.parentNode.removeChild(effect);
        }
    }, 2000);
}

// Updated damage application with admin checks
function applyPlayerDamage(damage) {
    if (gameState.infiniteHP) return;
    
    if (gameState.isBossFight) {
        // Check for second life before applying damage
        if (checkSecondLife()) return;
        
        const realHPDamage = (damage / gameState.player.maxHealth * 100) * gameState.bossDamageMultiplier;
        gameState.playerRealHP = Math.max(0, gameState.playerRealHP - realHPDamage);
        
        const adrenalineFactor = 1 - (gameState.playerRealHP / 100);
        const fakeHPDamage = realHPDamage * (1 - adrenalineFactor * 0.7);
        gameState.playerFakeHP = Math.max(1, gameState.playerFakeHP - fakeHPDamage);
        
        gameState.player.health = gameState.player.maxHealth * (gameState.playerFakeHP / 100);
    } else {
        gameState.player.health = Math.max(0, gameState.player.health - damage);
    }
    
    updateHealthBars();
}

// Updated heal function with admin check
function doPlayerAttack(type) {
    if (!gameState.gameActive || gameState.player.attackCooldown > 0) return;
    
    if (type === 'heal') {
        if (!gameState.infiniteHeal && gameState.healCooldownActive) {
            const display = document.getElementById('comboDisplay');
            if (display) {
                const timeLeft = Math.ceil((gameState.healCooldownEnd - Date.now()) / 1000);
                display.textContent = `HEAL COOLDOWN: ${timeLeft}s`;
                display.classList.add('active');
                setTimeout(() => {
                    display.classList.remove('active');
                }, 1000);
            }
            return;
        }
        
        const healAmount = gameState.player.maxHealth * 0.10;
        const damageAmount = gameState.cpu.maxHealth * 0.20;
        
        if (!gameState.isBossFight) {
            gameState.cpu.health = Math.max(0, gameState.cpu.health - damageAmount);
        }
        
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
        
        if (!gameState.infiniteHeal) {
            gameState.player.healCooldown = 90;
            gameState.healCooldownActive = true;
            gameState.healCooldownEnd = Date.now() + 10000;
            
            const healButtons = document.querySelectorAll('[data-action="heal"]');
            healButtons.forEach(btn => {
                btn.disabled = true;
                btn.style.opacity = '0.5';
                btn.style.background = 'rgba(100, 100, 100, 0.7)';
                btn.textContent = 'COOLDOWN';
            });
            
            const cooldownInterval = setInterval(() => {
                const timeLeft = Math.ceil((gameState.healCooldownEnd - Date.now()) / 1000);
                
                if (timeLeft <= 0) {
                    clearInterval(cooldownInterval);
                    gameState.healCooldownActive = false;
                    
                    healButtons.forEach(btn => {
                        btn.disabled = false;
                        btn.style.opacity = '1';
                        btn.style.background = 'rgba(100, 255, 100, 0.7)';
                        btn.textContent = 'HEAL';
                    });
                    
                    const display = document.getElementById('comboDisplay');
                    if (display) {
                        display.textContent = "HEAL READY!";
                        display.classList.add('active');
                        setTimeout(() => {
                            display.classList.remove('active');
                        }, 1000);
                    }
                } else {
                    healButtons.forEach(btn => {
                        btn.textContent = timeLeft + 's';
                    });
                }
            }, 1000);
        }
        
        createParryEffect(gameState.player.x, 1, 0);
        applyDamageFlash('player', 0x00ff00);
        
        if (!gameState.isBossFight) {
            applyDamageFlash('cpu');
        }
        
        updateHealthBars();
        
        const display = document.getElementById('comboDisplay');
        if (display) {
            if (gameState.isBossFight) {
                display.textContent = "PERFECT HEAL! +10% HP";
            } else {
                display.textContent = "PERFECT HEAL! +10% HP";
            }
            display.classList.add('active');
            setTimeout(() => {
                display.classList.remove('active');
            }, 1500);
        }
        
        return;
    }
    
    // Rest of the attack logic remains the same...
    if (gameState.player.healCooldown > 0 && type !== 'heal') {
        return;
    }
    
    const distance = Math.abs(gameState.player.x - gameState.cpu.x);
    if (distance > 3 && type !== 'heal') return;
    
    gameState.player.attackCooldown = 20;
    
    if (gameState.cpu && gameState.cpu.memory) {
        gameState.cpu.lastPlayerMove = type;
        if (!gameState.cpu.memory.playerMoves[type]) {
            gameState.cpu.memory.playerMoves[type] = 0;
        }
        gameState.cpu.memory.playerMoves[type]++;
    }
    
    let parryChance = gameState.cpu.difficulty.parryChance;
    if (gameState.cpu.isBoss) {
        parryChance = 0.0;
    }
    
    if (gameState.cpu && Math.random() < parryChance) {
        createParryEffect(gameState.cpu.x, 1, 0);
        applyDamageFlash('cpu', 0x00ff00);
        
        if (Math.random() < 0.3 || gameState.difficulty === 'insane' || gameState.cpu.isBoss) {
            setTimeout(() => doCpuAttack('special'), 300);
        }
        
        return;
    }
    
    if (window.playerModel) {
        window.playerModel.position.z = -0.5;
        setTimeout(() => {
            if (window.playerModel) window.playerModel.position.z = 0;
        }, 100);
    }
    
    if (gameState.isBossFight) {
        createBloodEffect(gameState.cpu.x, 1, 0);
        applyDamageFlash('cpu');
        
        if (window.cpuModel) {
            const knockback = 0.3;
            window.cpuModel.position.x += knockback;
            setTimeout(() => {
                if (window.cpuModel) window.cpuModel.position.x -= knockback * 0.5;
            }, 100);
        }
        
        return;
    }
    
    let damage = 0;
    let damageMultiplier = 1;
    
    if (gameState.player.items && gameState.player.items.damageBoost) {
        damageMultiplier += 0.2;
    }
    
    if (type === 'punch') {
        damage = (gameState.player.character.moves.punch + Math.floor(Math.random() * 10)) * damageMultiplier;
    } else if (type === 'kick') {
        damage = (gameState.player.character.moves.kick + Math.floor(Math.random() * 10)) * damageMultiplier;
    } else if (type === 'special') {
        damage = (gameState.player.character.moves.special + Math.floor(Math.random() * 15)) * damageMultiplier;
    }
    
    gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
    updateHealthBars();
    
    if (gameState.gameMode === 'practice') {
        gameState.practiceStats.damageDealt += damage;
        updatePracticeStats();
    }
    
    createBloodEffect(gameState.cpu.x, 1, 0);
    applyDamageFlash('cpu');
    
    if (window.cpuModel) {
        const knockback = 0.3;
        window.cpuModel.position.x += knockback;
        setTimeout(() => {
            if (window.cpuModel) window.cpuModel.position.x -= knockback * 0.5;
        }, 100);
    }
    
    gameState.score += damage;
}

// Boss attack functions
function doBossStompAttack() {
    console.log("BOSS STOMP ATTACK!");
    
    if (window.cpuModel) {
        window.cpuModel.position.y = 3;
        setTimeout(() => {
            if (window.cpuModel) {
                window.cpuModel.position.y = 0;
                createShockwaveEffect(gameState.cpu.x);
            }
        }, 500);
    }
    
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = "67 BOSS: MEGA STOMP!";
        display.classList.add('active');
        setTimeout(() => {
            display.classList.remove('active');
        }, 2000);
    }
    
    // Show dodge indicator for Boss 67
    showDodgeIndicator();
    
    const distance = Math.abs(gameState.player.x - gameState.cpu.x);
    if (distance < 3) {
        const baseDamage = gameState.player.maxHealth * 0.30;
        const phaseMultiplier = 1 + (gameState.survivalPhase * 0.1);
        const damage = baseDamage * phaseMultiplier;
        
        applyPlayerDamage(damage);
        
        console.log("STOMP HIT! Player real HP:", gameState.playerRealHP, "Fake HP:", gameState.playerFakeHP);
    }
}

function doBossDashAttack() {
    console.log("BOSS DASH ATTACK!");
    
    const dashDistance = 4;
    const originalX = gameState.cpu.x;
    gameState.cpu.x = gameState.player.x + (gameState.cpu.facing * 1.5);
    
    if (window.cpuModel) {
        createDashEffect(originalX, gameState.cpu.x);
    }
    
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = "67 BOSS: SPEED DASH!";
        display.classList.add('active');
        setTimeout(() => {
            display.classList.remove('active');
        }, 1500);
    }
    
    // Show dodge indicator for Boss 67
    showDodgeIndicator();
    
    const distance = Math.abs(gameState.player.x - gameState.cpu.x);
    if (distance < 2) {
        const baseDamage = gameState.player.maxHealth * 0.20;
        const phaseMultiplier = 1 + (gameState.survivalPhase * 0.05);
        const damage = baseDamage * phaseMultiplier;
        
        applyPlayerDamage(damage);
        
        console.log("DASH HIT! Player real HP:", gameState.playerRealHP, "Fake HP:", gameState.playerFakeHP);
    }
    
    setTimeout(() => {
        gameState.cpu.x = originalX;
        if (window.cpuModel) {
            window.cpuModel.position.x = originalX;
        }
    }, 300);
}

function doCpuAttack(type) {
    gameState.cpu.state = 'attack';
    gameState.cpu.stateTimer = 20;
    
    if (window.cpuModel) {
        window.cpuModel.position.z = -0.5;
        setTimeout(() => {
            if (window.cpuModel) window.cpuModel.position.z = 0;
        }, 100);
    }
    
    let damage = 0;
    const difficulty = gameState.cpu.difficulty;
    
    if (type === 'punch') {
        damage = (gameState.cpu.character.moves.punch + Math.floor(Math.random() * 8)) * difficulty.aggression;
    } else if (type === 'kick') {
        damage = (gameState.cpu.character.moves.kick + Math.floor(Math.random() * 8)) * difficulty.aggression;
    } else if (type === 'special') {
        damage = (gameState.cpu.character.moves.special + Math.floor(Math.random() * 12)) * difficulty.aggression;
    }
    
    applyPlayerDamage(damage);
    
    applyDamageFlash('player');
    createBloodEffect(gameState.player.x, 1, 0);
    
    if (window.playerModel) {
        const knockback = 0.3;
        window.playerModel.position.x -= knockback;
        setTimeout(() => {
            if (window.playerModel) window.playerModel.position.x += knockback * 0.5;
        }, 100);
    }
}

// Practice Mode Functions
function startPracticeMode() {
    console.log('Starting practice mode...');
    gameState.practiceStats = {
        comboCount: 0,
        damageDealt: 0,
        startTime: Date.now()
    };
    
    // Create practice UI if it doesn't exist
    let practiceUI = document.getElementById('practiceUI');
    if (!practiceUI) {
        practiceUI = document.createElement('div');
        practiceUI.id = 'practiceUI';
        practiceUI.style.cssText = `
            position: absolute;
            top: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: #ffcc00;
            padding: 20px;
            border: 2px solid #ff0033;
            border-radius: 10px;
            z-index: 100;
            text-align: center;
        `;
        practiceUI.innerHTML = `
            <h3>PRACTICE MODE</h3>
            <div>Combos: <span id="practiceComboCount">0</span></div>
            <div>Damage: <span id="practiceDamage">0</span></div>
            <div>Time: <span id="practiceTime">0s</span></div>
            <button id="resetPractice" style="margin-top: 10px; padding: 5px 10px; background: #ff0033; color: white; border: none; border-radius: 5px;">RESET</button>
        `;
        document.getElementById('gameScreen').appendChild(practiceUI);
        
        document.getElementById('resetPractice').addEventListener('click', () => {
            startPracticeMode();
        });
    }
    
    updatePracticeStats();
    
    // Start a simple practice match
    if (gameState.selectedCharacter === null) {
        // Default to first character for practice
        gameState.selectedCharacter = 0;
    }
    
    gameState.gameMode = 'practice';
    startGame();
}

function updatePracticeStats() {
    const comboCount = document.getElementById('practiceComboCount');
    const damage = document.getElementById('practiceDamage');
    const time = document.getElementById('practiceTime');
    
    if (comboCount) comboCount.textContent = gameState.practiceStats.comboCount;
    if (damage) damage.textContent = gameState.practiceStats.damageDealt;
    if (time) {
        const elapsed = Math.floor((Date.now() - gameState.practiceStats.startTime) / 1000);
        time.textContent = `${elapsed}s`;
    }
}

// Rest of the existing functions remain the same...
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isMobile = /mobile|android|tablet|ipad|iphone/.test(userAgent);
    const isTablet = /tablet|ipad|playbook|silk|kindle|(android(?!.*mobile))/.test(userAgent);
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    
    if (isTablet || (isMobile && hasTouch && window.innerWidth >= 768)) {
        gameState.deviceType = 'tablet';
    } else {
        gameState.deviceType = 'desktop';
    }
    
    document.getElementById('deviceType').textContent = 
        gameState.deviceType === 'tablet' ? 'TABLET MODE' : 'DESKTOP MODE';
}

function simulateLoading() {
    let progress = 0;
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    const stages = [
        "INITIALIZING BRAINROT ENGINE...",
        "LOADING BRAINROTTERS...",
        "SETTING UP ARENA...",
        "CALIBRATING CONTROLS...",
        "READY TO BRAINROT!"
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            setTimeout(() => {
                showScreen('mainMenu');
            }, 500);
        }
        
        loadingBar.style.width = `${progress}%`;
        loadingText.textContent = stages[Math.min(Math.floor(progress / 20), stages.length - 1)];
    }, 200);
}

// Make functions globally available
window.gameState = gameState;
window.init = init;
window.startBossCutscene = startBossCutscene;
window.startBoss21Cutscene = startBoss21Cutscene;
window.showScreen = showScreen;
window.showDodgeIndicator = showDodgeIndicator;
