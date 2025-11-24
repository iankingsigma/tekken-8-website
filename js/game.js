// BRAINROT FIGHTERS v5.0 - COMPLETE TEKKEN-STYLE OVERHAUL

// Enhanced Game State with Tekken mechanics
let gameState = {
    currentScreen: 'loading',
    selectedCharacter: null,
    player: null,
    cpu: null,
    keys: {},
    combo: [],
    lastKeyTime: 0,
    gameActive: false,
    roundTime: 60,
    comboCount: 0,
    score: 0,
    coins: parseInt(localStorage.getItem('brainrotCoins')) || 1000,
    highScore: localStorage.getItem('brainrotHighScore') || 0,
    deviceType: 'desktop',
    gameMode: 'arcade',
    difficulty: 'medium',
    
    // Enhanced Boss System
    isBossFight: false,
    bossUnlocked: localStorage.getItem('boss67Unlocked') === 'true',
    bossDefeated: localStorage.getItem('boss67Defeated') === 'true',
    bossPhase: 1,
    bossStunTimer: 0,
    isBossStunned: false,
    bossAttackPattern: 0,
    
    // Tekken Mechanics
    rageMeter: { player: 0, cpu: 0 },
    heatSystem: { player: false, cpu: false },
    wallSplat: false,
    stageInteractions: false,
    
    // Enhanced Admin Panel
    adminMode: false,
    adminFeatures: {
        infiniteHP: false,
        infiniteRage: false,
        oneHitKO: false,
        godMode: false,
        maxDamage: false,
        slowMotion: false,
        freezeEnemy: false
    },
    
    // Performance Optimization
    frameRate: 60,
    graphicsQuality: 'high',
    particleEffects: true,
    
    // Online Features
    onlineMatch: null,
    playerRank: 'Beginner',
    winStreak: 0
};

// Balanced Boss Configuration
const BOSS_CONFIG = {
    phases: [
        { duration: 30, damageMultiplier: 0.8, selfDamage: 5, stunChance: 0.1 },
        { duration: 25, damageMultiplier: 1.0, selfDamage: 8, stunChance: 0.2 },
        { duration: 20, damageMultiplier: 1.2, selfDamage: 12, stunChance: 0.3 },
        { duration: 15, damageMultiplier: 1.5, selfDamage: 15, stunChance: 0.4 }
    ],
    maxHealth: 2000,
    attackPatterns: [
        { moves: ['punch', 'punch', 'kick'], cooldown: 2.0 },
        { moves: ['special', 'punch'], cooldown: 3.0 },
        { moves: ['kick', 'kick', 'special'], cooldown: 2.5 }
    ]
};

// Enhanced Admin Panel System
function initEnhancedAdminPanel() {
    console.log('Initializing Enhanced Admin Panel...');
    
    let adminCode = '';
    const validCodes = ['231214', 'TEKKEN', 'BRAINROT', 'ADMIN'];
    
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.altKey && e.key === 'A') {
            toggleAdminPanel();
            return;
        }
        
        adminCode += e.key.toUpperCase();
        if (adminCode.length > 8) adminCode = adminCode.slice(1);
        
        if (validCodes.includes(adminCode)) {
            console.log('Admin access granted with code:', adminCode);
            toggleAdminPanel();
            adminCode = '';
        }
    });
}

function toggleAdminPanel() {
    const existingPanel = document.getElementById('adminPanelTekken');
    if (existingPanel) {
        existingPanel.remove();
        gameState.adminMode = false;
        return;
    }
    
    const adminPanel = document.createElement('div');
    adminPanel.id = 'adminPanelTekken';
    adminPanel.className = 'admin-panel-tekken';
    adminPanel.innerHTML = `
        <div style="text-align: center; margin-bottom: 15px;">
            <div style="color: #ff0033; font-weight: bold; font-size: 1.2em;">TEKKEN ADMIN PANEL v5.0</div>
            <div style="font-size: 0.8em; color: #ccc;">Full Control System</div>
        </div>
        
        <div class="admin-section">
            <h3>🧙 PLAYER CONTROLS</h3>
            <div class="admin-control">
                <label>Infinite HP:</label>
                <input type="checkbox" id="adminInfiniteHP" ${gameState.adminFeatures.infiniteHP ? 'checked' : ''}>
            </div>
            <div class="admin-control">
                <label>Infinite Rage:</label>
                <input type="checkbox" id="adminInfiniteRage" ${gameState.adminFeatures.infiniteRage ? 'checked' : ''}>
            </div>
            <div class="admin-control">
                <label>One-Hit KO:</label>
                <input type="checkbox" id="adminOneHitKO" ${gameState.adminFeatures.oneHitKO ? 'checked' : ''}>
            </div>
            <div class="admin-control">
                <label>God Mode:</label>
                <input type="checkbox" id="adminGodMode" ${gameState.adminFeatures.godMode ? 'checked' : ''}>
            </div>
        </div>
        
        <div class="admin-section">
            <h3>⚡ GAME MODIFIERS</h3>
            <div class="admin-control">
                <label>Slow Motion:</label>
                <input type="checkbox" id="adminSlowMotion" ${gameState.adminFeatures.slowMotion ? 'checked' : ''}>
            </div>
            <div class="admin-control">
                <label>Freeze Enemy:</label>
                <input type="checkbox" id="adminFreezeEnemy" ${gameState.adminFeatures.freezeEnemy ? 'checked' : ''}>
            </div>
            <div class="admin-control">
                <label>Max Damage:</label>
                <input type="checkbox" id="adminMaxDamage" ${gameState.adminFeatures.maxDamage ? 'checked' : ''}>
            </div>
        </div>
        
        <div class="admin-section">
            <h3>🎮 QUICK ACTIONS</h3>
            <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                <button class="admin-btn" id="adminAddCoins">+1000 COINS</button>
                <button class="admin-btn" id="adminUnlockAll">UNLOCK ALL</button>
                <button class="admin-btn" id="adminMaxLevel">MAX LEVEL</button>
                <button class="admin-btn" id="adminWinGame">INSTANT WIN</button>
                <button class="admin-btn" id="adminSpawnBoss">SPAWN BOSS</button>
            </div>
        </div>
        
        <div class="admin-section">
            <h3>🔧 ADVANCED</h3>
            <div class="admin-control">
                <label>Player HP:</label>
                <input type="number" id="adminPlayerHP" value="100" min="1" max="1000">
            </div>
            <div class="admin-control">
                <label>Enemy HP:</label>
                <input type="number" id="adminEnemyHP" value="100" min="1" max="1000">
            </div>
            <div class="admin-control">
                <label>Game Speed:</label>
                <input type="number" id="adminGameSpeed" value="1.0" min="0.1" max="5.0" step="0.1">
            </div>
        </div>
        
        <div style="text-align: center; margin-top: 15px;">
            <button class="admin-btn" id="adminClose" style="background: #333;">CLOSE PANEL</button>
        </div>
    `;
    
    document.body.appendChild(adminPanel);
    gameState.adminMode = true;
    
    // Event Listeners for Admin Controls
    setupAdminEventListeners();
}

function setupAdminEventListeners() {
    // Toggle controls
    document.getElementById('adminInfiniteHP').addEventListener('change', (e) => {
        gameState.adminFeatures.infiniteHP = e.target.checked;
        if (gameState.player) gameState.player.health = gameState.player.maxHealth;
    });
    
    document.getElementById('adminInfiniteRage').addEventListener('change', (e) => {
        gameState.adminFeatures.infiniteRage = e.target.checked;
        gameState.rageMeter.player = 100;
    });
    
    document.getElementById('adminOneHitKO').addEventListener('change', (e) => {
        gameState.adminFeatures.oneHitKO = e.target.checked;
    });
    
    document.getElementById('adminGodMode').addEventListener('change', (e) => {
        gameState.adminFeatures.godMode = e.target.checked;
    });
    
    document.getElementById('adminSlowMotion').addEventListener('change', (e) => {
        gameState.adminFeatures.slowMotion = e.target.checked;
    });
    
    document.getElementById('adminFreezeEnemy').addEventListener('change', (e) => {
        gameState.adminFeatures.freezeEnemy = e.target.checked;
    });
    
    document.getElementById('adminMaxDamage').addEventListener('change', (e) => {
        gameState.adminFeatures.maxDamage = e.target.checked;
    });
    
    // Quick actions
    document.getElementById('adminAddCoins').addEventListener('click', () => {
        gameState.coins += 1000;
        updateCoinsDisplay();
        showAdminMessage('+1000 COINS ADDED!');
    });
    
    document.getElementById('adminUnlockAll').addEventListener('click', () => {
        gameState.bossUnlocked = true;
        localStorage.setItem('boss67Unlocked', 'true');
        showAdminMessage('ALL CONTENT UNLOCKED!');
    });
    
    document.getElementById('adminMaxLevel').addEventListener('click', () => {
        gameState.highScore = 999999;
        localStorage.setItem('brainrotHighScore', '999999');
        showAdminMessage('MAX LEVEL ACHIEVED!');
    });
    
    document.getElementById('adminWinGame').addEventListener('click', () => {
        if (gameState.cpu) gameState.cpu.health = 0;
        showAdminMessage('VICTORY!');
    });
    
    document.getElementById('adminSpawnBoss').addEventListener('click', () => {
        if (gameState.cpu) {
            gameState.cpu.character = BOSS_67;
            gameState.cpu.health = BOSS_CONFIG.maxHealth;
            gameState.cpu.maxHealth = BOSS_CONFIG.maxHealth;
            gameState.isBossFight = true;
            showAdminMessage('67 BOSS SPAWNED!');
        }
    });
    
    // Advanced controls
    document.getElementById('adminPlayerHP').addEventListener('change', (e) => {
        if (gameState.player) {
            gameState.player.health = parseInt(e.target.value);
            gameState.player.maxHealth = parseInt(e.target.value);
        }
    });
    
    document.getElementById('adminEnemyHP').addEventListener('change', (e) => {
        if (gameState.cpu) {
            gameState.cpu.health = parseInt(e.target.value);
            gameState.cpu.maxHealth = parseInt(e.target.value);
        }
    });
    
    document.getElementById('adminGameSpeed').addEventListener('change', (e) => {
        gameState.gameSpeed = parseFloat(e.target.value);
    });
    
    document.getElementById('adminClose').addEventListener('click', () => {
        document.getElementById('adminPanelTekken').remove();
        gameState.adminMode = false;
    });
}

function showAdminMessage(message) {
    const msg = document.createElement('div');
    msg.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.9);
        color: #00ff00;
        padding: 20px 40px;
        border: 3px solid #00ff00;
        border-radius: 10px;
        font-size: 1.5rem;
        font-weight: bold;
        z-index: 10001;
        text-align: center;
    `;
    msg.textContent = message;
    document.body.appendChild(msg);
    
    setTimeout(() => {
        if (msg.parentNode) msg.parentNode.removeChild(msg);
    }, 2000);
}

// Enhanced Boss Fight System
function updateBossFight() {
    if (!gameState.isBossFight || !gameState.cpu) return;
    
    const boss = gameState.cpu;
    const currentPhase = BOSS_CONFIG.phases[gameState.bossPhase - 1];
    
    // Boss phase management
    gameState.bossStunTimer++;
    
    // Phase transitions
    const phaseDuration = currentPhase.duration * 60; // Convert to frames
    if (gameState.bossStunTimer >= phaseDuration && gameState.bossPhase < BOSS_CONFIG.phases.length) {
        gameState.bossPhase++;
        gameState.bossStunTimer = 0;
        triggerBossPhaseTransition(gameState.bossPhase);
    }
    
    // Boss self-damage
    if (gameState.bossStunTimer % 180 === 0) { // Every 3 seconds
        const selfDamage = boss.maxHealth * (currentPhase.selfDamage / 100);
        boss.health = Math.max(1, boss.health - selfDamage);
        
        createBossSelfDamageEffect();
        updateHealthBars();
    }
    
    // Boss stun chances
    if (Math.random() < currentPhase.stunChance && gameState.bossStunTimer % 120 === 0) {
        triggerBossStun(2.0); // 2 second stun
    }
    
    // Boss attack patterns
    if (!gameState.isBossStunned && boss.attackCooldown <= 0) {
        const pattern = BOSS_CONFIG.attackPatterns[gameState.bossAttackPattern];
        executeBossAttackPattern(pattern);
        gameState.bossAttackPattern = (gameState.bossAttackPattern + 1) % BOSS_CONFIG.attackPatterns.length;
        boss.attackCooldown = pattern.cooldown * 60;
    }
}

function triggerBossPhaseTransition(phase) {
    const phaseMessages = [
        "PHASE 1: TESTING YOUR SKILLS",
        "PHASE 2: INTENSIFYING BATTLE",
        "PHASE 3: UNLEASHING TRUE POWER",
        "FINAL PHASE: ULTIMATE CHALLENGE"
    ];
    
    showComboDisplay(phaseMessages[phase - 1], '#ff6600');
    
    // Visual effects for phase transition
    createPhaseTransitionEffect();
}

function triggerBossStun(duration) {
    gameState.isBossStunned = true;
    showComboDisplay('BOSS STUNNED!', '#ffff00');
    
    setTimeout(() => {
        gameState.isBossStunned = false;
    }, duration * 1000);
}

function executeBossAttackPattern(pattern) {
    pattern.moves.forEach((move, index) => {
        setTimeout(() => {
            if (gameState.gameActive && !gameState.isBossStunned) {
                doCpuAttack(move);
            }
        }, index * 500); // 0.5 seconds between moves
    });
}

// Enhanced Combat System with Tekken Mechanics
function updateTekkenMechanics() {
    // Rage System
    if (gameState.player && gameState.player.health < gameState.player.maxHealth * 0.3) {
        gameState.rageMeter.player = Math.min(100, gameState.rageMeter.player + 1);
    }
    
    if (gameState.cpu && gameState.cpu.health < gameState.cpu.maxHealth * 0.3) {
        gameState.rageMeter.cpu = Math.min(100, gameState.rageMeter.cpu + 1);
    }
    
    // Heat System (when rage is full)
    if (gameState.rageMeter.player >= 100 && !gameState.heatSystem.player) {
        activateHeatSystem('player');
    }
    
    if (gameState.rageMeter.cpu >= 100 && !gameState.heatSystem.cpu) {
        activateHeatSystem('cpu');
    }
    
    // Update rage bars
    updateRageBars();
}

function activateHeatSystem(character) {
    if (character === 'player') {
        gameState.heatSystem.player = true;
        gameState.rageMeter.player = 100;
        showComboDisplay('HEAT ACTIVATED!', '#ff3300');
        
        // Enhanced abilities during heat
        if (gameState.player) {
            gameState.player.damageMultiplier = 1.5;
            gameState.player.attackCooldown *= 0.7;
        }
        
        setTimeout(() => {
            gameState.heatSystem.player = false;
            if (gameState.player) {
                gameState.player.damageMultiplier = 1.0;
                gameState.player.attackCooldown /= 0.7;
            }
            gameState.rageMeter.player = 0;
        }, 10000); // 10 seconds duration
    }
}

function updateRageBars() {
    const p1Rage = document.getElementById('p1Rage');
    const p2Rage = document.getElementById('p2Rage');
    
    if (p1Rage) {
        p1Rage.style.setProperty('--rage-width', `${gameState.rageMeter.player}%`);
    }
    
    if (p2Rage) {
        p2Rage.style.setProperty('--rage-width', `${gameState.rageMeter.cpu}%`);
    }
}

// Enhanced Visual Effects
function createPhaseTransitionEffect() {
    if (!window.scene) return;
    
    // Create a flash effect
    const flashGeometry = new THREE.PlaneGeometry(20, 20);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xff6600,
        transparent: true,
        opacity: 0.5
    });
    
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.z = -5;
    window.scene.add(flash);
    
    // Animate flash
    let opacity = 0.5;
    function animateFlash() {
        opacity -= 0.02;
        flashMaterial.opacity = opacity;
        
        if (opacity > 0) {
            requestAnimationFrame(animateFlash);
        } else {
            window.scene.remove(flash);
        }
    }
    animateFlash();
}

function createBossSelfDamageEffect() {
    if (!window.scene || !window.cpuModel) return;
    
    // Create damage numbers
    const damageText = document.createElement('div');
    damageText.style.cssText = `
        position: absolute;
        color: #ff0000;
        font-size: 1.5rem;
        font-weight: bold;
        pointer-events: none;
        z-index: 100;
    `;
    damageText.textContent = 'SELF DAMAGE!';
    document.getElementById('gameScreen').appendChild(damageText);
    
    // Position near boss
    const bossRect = window.cpuModel.getBoundingClientRect();
    damageText.style.left = `${bossRect.left}px`;
    damageText.style.top = `${bossRect.top - 50}px`;
    
    // Animate
    let opacity = 1;
    let yPos = bossRect.top - 50;
    function animateDamage() {
        opacity -= 0.02;
        yPos -= 2;
        damageText.style.opacity = opacity;
        damageText.style.top = `${yPos}px`;
        
        if (opacity > 0) {
            requestAnimationFrame(animateDamage);
        } else {
            damageText.remove();
        }
    }
    animateDamage();
}

// Enhanced Combo System
function executeEnhancedCombo(combo) {
    gameState.comboCount++;
    
    // Combo damage scaling
    let damageMultiplier = 1 + (gameState.comboCount * 0.1);
    if (gameState.heatSystem.player) {
        damageMultiplier *= 1.5;
    }
    
    const finalDamage = Math.floor(combo.damage * damageMultiplier);
    
    // Show enhanced combo display
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = `${combo.name} x${gameState.comboCount} (${finalDamage} DAMAGE!)`;
        display.style.color = getComboColor(gameState.comboCount);
        display.classList.add('active');
    }
    
    // Apply damage
    if (!gameState.isBossFight) {
        gameState.cpu.health = Math.max(0, gameState.cpu.health - finalDamage);
    }
    
    // Visual effects based on combo count
    if (gameState.comboCount >= 5) {
        createScreenShake(10);
    }
    
    if (gameState.comboCount >= 10) {
        createScreenShake(20);
        spawn67();
    }
    
    updateHealthBars();
    
    setTimeout(() => {
        if (display) display.classList.remove('active');
    }, 2000);
}

function getComboColor(comboCount) {
    if (comboCount >= 10) return '#ff00ff';
    if (comboCount >= 5) return '#ffff00';
    if (comboCount >= 3) return '#00ffff';
    return '#ffcc00';
}

function createScreenShake(intensity) {
    const canvas = document.getElementById('gameCanvas');
    if (!canvas) return;
    
    const originalTransform = canvas.style.transform || '';
    let shakeCount = 0;
    const maxShakes = 10;
    
    function shake() {
        const x = (Math.random() - 0.5) * intensity;
        const y = (Math.random() - 0.5) * intensity;
        canvas.style.transform = `translate(${x}px, ${y}px)`;
        
        shakeCount++;
        if (shakeCount < maxShakes) {
            requestAnimationFrame(shake);
        } else {
            canvas.style.transform = originalTransform;
        }
    }
    shake();
}

// Enhanced Initialization
function initEnhancedGame() {
    console.log('Initializing Brainrot Fighters v5.0 - Tekken Style');
    
    // Load saved data
    loadGameData();
    
    // Initialize systems
    detectDevice();
    setupEventListeners();
    renderCharacterSelect();
    initEnhancedAdminPanel();
    applyCustomBackground();
    
    // Start loading
    simulateEnhancedLoading();
    
    // Initialize audio
    initAudioSystem();
    
    console.log('Game initialized successfully');
}

function simulateEnhancedLoading() {
    let progress = 0;
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    
    const stages = [
        "LOADING KING'S RAGE ENGINE...",
        "INITIALIZING TEKKEN SYSTEMS...",
        "LOADING FIGHTER ROSTER...",
        "CALIBRATING COMBAT MECHANICS...",
        "READY FOR BATTLE!"
    ];
    
    const interval = setInterval(() => {
        progress += Math.random() * 12 + 3;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            loadingText.textContent = "READY FOR BATTLE!";
            loadingBar.style.width = '100%';
            
            setTimeout(() => {
                showScreen('mainMenu');
            }, 1000);
        }
        
        loadingBar.style.width = `${progress}%`;
        const stageIndex = Math.min(Math.floor(progress / 20), stages.length - 1);
        loadingText.textContent = stages[stageIndex];
    }, 200);
}

function loadGameData() {
    // Enhanced data loading with error handling
    try {
        gameState.coins = parseInt(localStorage.getItem('brainrotCoins')) || 1000;
        gameState.highScore = localStorage.getItem('brainrotHighScore') || 0;
        gameState.bossUnlocked = localStorage.getItem('boss67Unlocked') === 'true';
        gameState.playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {};
        
        // Update UI
        document.getElementById('highScore').textContent = gameState.highScore;
        document.getElementById('coinsAmount').textContent = gameState.coins;
    } catch (error) {
        console.error('Error loading game data:', error);
        // Initialize with default values
        gameState.coins = 1000;
        gameState.highScore = 0;
        gameState.playerInventory = {};
    }
}

function initAudioSystem() {
    // Enhanced audio system with error handling
    try {
        if (menuMusic) {
            menuMusic.volume = 0.7;
            menuMusic.loop = true;
        }
        
        if (bossMusic) {
            bossMusic.volume = 0.8;
            bossMusic.loop = true;
        }
    } catch (error) {
        console.error('Audio system initialization failed:', error);
    }
}

// Enhanced character selection rendering
function renderEnhancedCharacterSelect() {
    const grid = document.getElementById('characterGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    CHARACTERS.forEach((character, index) => {
        const card = document.createElement('div');
        card.className = 'character-card-tekken';
        card.innerHTML = `
            <div class="character-icon-tekken" style="background: ${character.color}20; border-color: ${character.color}">
                ${character.icon}
            </div>
            <div class="character-name-tekken">${character.name}</div>
            <div class="character-style-tekken">${character.style}</div>
            <div class="character-stats-tekken">
                <div class="stat-bar">
                    <div class="stat-fill" style="width: ${(character.hp / 2000) * 100}%"></div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            selectCharacter(index);
        });
        
        grid.appendChild(card);
    });
}

function selectCharacter(index) {
    gameState.selectedCharacter = index;
    const character = CHARACTERS[index];
    
    // Update preview
    document.getElementById('previewName').textContent = character.name;
    document.getElementById('previewStyle').textContent = character.style;
    document.getElementById('previewDesc').textContent = character.description;
    
    // Update stats
    document.getElementById('healthStat').style.width = `${(character.hp / 2000) * 100}%`;
    document.getElementById('powerStat').style.width = `${((character.moves.punch + character.moves.kick) / 100) * 100}%`;
    document.getElementById('speedStat').style.width = `${(100 - (character.hp / 20))}%`;
    
    // Enable confirm button
    document.getElementById('confirmBtn').disabled = false;
}

// Start the enhanced game
window.addEventListener('load', initEnhancedGame);
