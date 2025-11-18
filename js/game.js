// Brainrot Fighters v4.5 - Core Game Engine
// Complete rewrite with all features working

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
    practiceStats: { comboCount: 0, damageDealt: 0, startTime: 0 },
    parryCooldownActive: false,
    parryCooldownEnd: 0,
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
    onlineMatch: null,
    opponent: null,
    onlineInputs: [],
    lastInputSequence: 0
};

// Boss Settings
const BOSS_BALANCED_SETTINGS = {
    selfDamageInterval: 400,
    selfDamageAmount: 0.08,
    stunDuration: 400,
    playerHealInterval: 400,
    phaseDamageMultiplier: 0.05
};

// Cutscene Text
const BOSS_CUTSCENE_TEXTS = [
    "THE LEGEND OF 67...",
    "A FORCE BEYOND COMPREHENSION...",
    "IT CORRUPTS EVERYTHING IT TOUCHES...",
    "YOU CANNOT DEFEAT IT...",
    "YOU CAN ONLY SURVIVE...",
    "BEGIN!"
];

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    easy: { cpuHpMultiplier: 0.8, parryChance: 0.2, aggression: 0.3, learningRate: 0.1 },
    medium: { cpuHpMultiplier: 1.0, parryChance: 0.5, aggression: 0.6, learningRate: 0.3 },
    hard: { cpuHpMultiplier: 1.3, parryChance: 0.8, aggression: 0.9, learningRate: 0.5 },
    insane: { cpuHpMultiplier: 1.5, parryChance: 1.0, aggression: 1.0, learningRate: 0.8 },
    sixtyseven: { cpuHpMultiplier: 2.0, parryChance: 0.0, aggression: 1.0, learningRate: 0.7, isBoss: true }
};

// Boss Character
const BOSS_67 = {
    id: 6667,
    name: "67 BOSS",
    style: "Final Brainrot",
    hp: 3000,
    color: "#ff0000",
    icon: "67",
    description: "The ultimate 67 manifestation. Defeat it to uncover the truth.",
    moves: { punch: 60, kick: 55, special: 120 },
    isBoss: true,
    combos: [
        { input: ["right", "right", "punch"], name: "ULTIMATE UPPERCUT", damage: 200 },
        { input: ["down", "right", "punch"], name: "MEGA FIREBALL", damage: 180 }
    ]
};

// Audio Elements
let bossMusic = document.getElementById('bossMusic');
let menuMusic = document.getElementById('menuMusic');

// Initialize Game
function init() {
    console.log('Initializing Brainrot Fighters v4.5...');
    document.getElementById('highScore').textContent = gameState.highScore;
    document.getElementById('coinsAmount').textContent = gameState.coins;
    detectDevice();
    setupEventListeners();
    renderCharacterSelect();
    
    checkBossUnlock();
    
    // Initialize shop
    if (typeof loadShopItems === 'function') {
        setTimeout(loadShopItems, 100);
    }
    
    // Start menu music
    if (menuMusic) {
        menuMusic.volume = 0.7;
        menuMusic.play().catch(e => console.log("Menu music play failed:", e));
    }
    
    // Initialize online system
    if (typeof initOnlineSystem === 'function') {
        setTimeout(() => initOnlineSystem(), 1000);
    }
}

// Device Detection
function detectDevice() {
    const userAgent = navigator.userAgent.toLowerCase();
    const isAppleWatch = /watch/i.test(userAgent);
    const isTablet = /iPad|Android|Tablet/i.test(userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isMobile = /iPhone|Android|Mobile/i.test(userAgent);
    
    if (isAppleWatch) {
        gameState.deviceType = 'applewatch';
        document.getElementById('deviceType').textContent = '🍎 APPLE WATCH MODE';
    } else if (isTablet) {
        gameState.deviceType = 'tablet';
        document.getElementById('deviceType').textContent = 'TABLET MODE';
    } else if (isMobile) {
        gameState.deviceType = 'mobile';
        document.getElementById('deviceType').textContent = 'MOBILE MODE';
    } else {
        gameState.deviceType = 'desktop';
        document.getElementById('deviceType').textContent = 'DESKTOP MODE';
    }
}

// Loading System
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
            setTimeout(() => showScreen('mainMenu'), 500);
        }
        
        if (loadingBar) loadingBar.style.width = `${progress}%`;
        if (loadingText) loadingText.textContent = stages[Math.min(Math.floor(progress / 20), stages.length - 1)];
    }, 200);
}

// Screen Management
function showScreen(screenId) {
    console.log('Showing screen:', screenId);
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        gameState.currentScreen = screenId;
    }
    
    // Handle screen-specific initializations
    switch(screenId) {
        case 'onlineScreen':
            if (typeof showOnlineMainScreen === 'function') showOnlineMainScreen();
            if (typeof refreshLobbyList === 'function') refreshLobbyList();
            break;
        case 'gameScreen':
            setTimeout(() => {
                if (typeof initThreeJS === 'function') initThreeJS();
                startGame();
            }, 100);
            break;
        case 'shopScreen':
            setTimeout(() => {
                if (typeof loadShopItems === 'function') loadShopItems();
            }, 100);
            break;
        case 'characterSelect':
            renderCharacterSelect();
            break;
    }
    
    // Music management
    handleScreenMusic(screenId);
    
    // Touch controls
    const touchControls = document.getElementById('touchControls');
    if (touchControls) {
        const showTouch = screenId === 'gameScreen' && 
                         (gameState.deviceType === 'tablet' || gameState.deviceType === 'mobile');
        touchControls.classList.toggle('active', showTouch);
    }
}

function handleScreenMusic(screenId) {
    if (screenId === 'gameScreen' && gameState.isBossFight) {
        if (menuMusic && !menuMusic.paused) menuMusic.pause();
        if (bossMusic) {
            bossMusic.currentTime = 0;
            bossMusic.volume = 0.7;
            bossMusic.play().catch(e => console.log("Boss music play failed:", e));
        }
    } else if (screenId !== 'gameScreen') {
        if (bossMusic && !bossMusic.paused) {
            bossMusic.pause();
            bossMusic.currentTime = 0;
        }
        if (menuMusic && menuMusic.paused) {
            menuMusic.currentTime = 0;
            menuMusic.volume = 0.7;
            menuMusic.play().catch(e => console.log("Menu music play failed:", e));
        }
    }
}

// Character Selection
function renderCharacterSelect() {
    const grid = document.getElementById('characterGrid');
    const difficultySelect = document.getElementById('difficultySelect');
    
    if (!grid) return;
    
    // Add 67 difficulty if boss is unlocked
    if (gameState.bossUnlocked && difficultySelect) {
        const sixtySevenOption = difficultySelect.querySelector('option[value="sixtyseven"]');
        if (!sixtySevenOption) {
            const option = document.createElement('option');
            option.value = 'sixtyseven';
            option.textContent = '67 BOSS - SURVIVAL';
            difficultySelect.appendChild(option);
        }
    }
    
    grid.innerHTML = '';
    
    CHARACTERS.forEach((character, index) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-icon" style="background: ${character.color}20; border-color: ${character.color}">
                ${character.icon}
            </div>
            <div class="character-name">${character.name}</div>
            <div class="character-style">${character.style}</div>
            <div class="character-stats">
                <div class="stat">
                    <div class="stat-value">${character.moves.punch}</div>
                    <div class="stat-label">PUNCH</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${character.moves.kick}</div>
                    <div class="stat-label">KICK</div>
                </div>
                <div class="stat">
                    <div class="stat-value">${character.hp}</div>
                    <div class="stat-label">HP</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            gameState.selectedCharacter = index;
            document.getElementById('confirmBtn').disabled = false;
            
            document.getElementById('previewName').textContent = character.name;
            document.getElementById('previewStyle').textContent = character.style;
            document.getElementById('previewDesc').textContent = character.description;
            document.getElementById('previewModel').textContent = character.icon;
            document.getElementById('previewModel').style.borderColor = character.color;
            
            // Show boss unlock info
            const bossUnlockInfo = document.getElementById('bossUnlockInfo');
            const bossUnlockedInfo = document.getElementById('bossUnlockedInfo');
            const bossWarningInfo = document.getElementById('bossWarningInfo');
            if (bossUnlockInfo && bossUnlockedInfo && bossWarningInfo) {
                if (gameState.bossUnlocked) {
                    bossUnlockInfo.style.display = 'none';
                    bossUnlockedInfo.style.display = 'block';
                    
                    const difficulty = document.getElementById('difficultySelect').value;
                    bossWarningInfo.style.display = difficulty === 'sixtyseven' ? 'block' : 'none';
                } else {
                    bossUnlockInfo.style.display = 'block';
                    bossUnlockedInfo.style.display = 'none';
                    bossWarningInfo.style.display = 'none';
                }
            }
        });
        
        grid.appendChild(card);
    });
    
    // Add event listener to difficulty select
    const difficultySelectElement = document.getElementById('difficultySelect');
    if (difficultySelectElement) {
        difficultySelectElement.addEventListener('change', () => {
            const difficulty = difficultySelectElement.value;
            const bossWarningInfo = document.getElementById('bossWarningInfo');
            if (bossWarningInfo) {
                bossWarningInfo.style.display = (difficulty === 'sixtyseven' && gameState.bossUnlocked) ? 'block' : 'none';
            }
        });
    }
}

// Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners for v4.5...');
    
    // Device detection
    const forceTablet = document.getElementById('forceTablet');
    const forceDesktop = document.getElementById('forceDesktop');
    
    if (forceTablet) forceTablet.addEventListener('click', () => {
        gameState.deviceType = 'tablet';
        document.getElementById('deviceType').textContent = 'TABLET MODE';
        simulateLoading();
    });
    
    if (forceDesktop) forceDesktop.addEventListener('click', () => {
        gameState.deviceType = 'desktop';
        document.getElementById('deviceType').textContent = 'DESKTOP MODE';
        simulateLoading();
    });
    
    // Main menu buttons
    const buttons = [
        'arcadeBtn', 'onlineBtn', 'practiceBtn', 'shopBtn', 'controlsBtn', 'updatesBtn', 'creditsBtn',
        'backBtn', 'controlsBackBtn', 'shopBackBtn', 'updatesBackBtn', 'creditsBackBtn',
        'exitBattleBtn', 'confirmBtn', 'onlineBackBtn'
    ];
    
    buttons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleButtonClick(btnId);
            });
        }
    });
    
    // Online multiplayer buttons
    const onlineButtons = [
        'quickMatchBtn', 'createLobbyBtn', 'joinLobbyBtn', 'friendsBtn',
        'refreshLobbiesBtn', 'confirmCreateLobby', 'confirmJoinLobby', 
        'addFriendBtn', 'startMatchBtn', 'leaveLobbyBtn'
    ];
    
    onlineButtons.forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                handleOnlineButtonClick(btnId);
            });
        }
    });
    
    // Input handling
    document.addEventListener('keydown', (e) => {
        if (gameState.cutsceneActive) return;
        
        const key = e.key.toLowerCase();
        gameState.keys[key] = true;
        
        handleGameInput(key, true);
        
        if (gameState.gameActive && gameState.player && gameState.player.attackCooldown <= 0) {
            if (key === 'z' || key === 'x') {
                doPlayerAttack('punch');
            } else if (key === 'a' || key === 's') {
                doPlayerAttack('kick');
            } else if (key === ' ') {
                doPlayerAttack('parry');
            } else if (key === 'c') {
                doPlayerAttack('special');
            }
        }
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });

    window.addEventListener('resize', () => {
        if (window.camera && window.renderer) {
            const canvas = document.getElementById('gameCanvas');
            window.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            window.camera.updateProjectionMatrix();
            window.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    });
}

function handleButtonClick(btnId) {
    switch(btnId) {
        case 'arcadeBtn':
            showScreen('characterSelect');
            break;
        case 'onlineBtn':
            showScreen('onlineScreen');
            break;
        case 'practiceBtn':
            showScreen('characterSelect');
            gameState.gameMode = 'practice';
            break;
        case 'shopBtn':
            showScreen('shopScreen');
            break;
        case 'controlsBtn':
            showScreen('controlsScreen');
            break;
        case 'updatesBtn':
            showScreen('updatesScreen');
            break;
        case 'creditsBtn':
            showScreen('creditsScreen');
            break;
        case 'backBtn':
        case 'controlsBackBtn':
        case 'shopBackBtn':
        case 'updatesBackBtn':
        case 'creditsBackBtn':
        case 'onlineBackBtn':
            showScreen('mainMenu');
            break;
        case 'exitBattleBtn':
            if (gameState.gameMode === 'online') {
                if (typeof leaveLobby === 'function') leaveLobby();
            }
            showScreen('characterSelect');
            break;
        case 'confirmBtn':
            startBattle('arcade');
            break;
    }
}

function handleOnlineButtonClick(btnId) {
    switch(btnId) {
        case 'quickMatchBtn':
            if (typeof findQuickMatch === 'function') findQuickMatch();
            break;
        case 'createLobbyBtn':
            document.getElementById('lobbyBrowser').style.display = 'none';
            document.getElementById('createLobby').style.display = 'block';
            document.getElementById('joinLobby').style.display = 'none';
            document.getElementById('friendsList').style.display = 'none';
            break;
        case 'joinLobbyBtn':
            document.getElementById('lobbyBrowser').style.display = 'block';
            document.getElementById('createLobby').style.display = 'none';
            document.getElementById('joinLobby').style.display = 'none';
            document.getElementById('friendsList').style.display = 'none';
            if (typeof refreshLobbyList === 'function') refreshLobbyList();
            break;
        case 'friendsBtn':
            document.getElementById('lobbyBrowser').style.display = 'none';
            document.getElementById('createLobby').style.display = 'none';
            document.getElementById('joinLobby').style.display = 'none';
            document.getElementById('friendsList').style.display = 'block';
            if (typeof updateFriendsList === 'function') updateFriendsList();
            break;
        case 'refreshLobbiesBtn':
            if (typeof refreshLobbyList === 'function') refreshLobbyList();
            break;
        case 'confirmCreateLobby':
            const lobbyName = document.getElementById('lobbyName').value || 'Private Lobby';
            const password = document.getElementById('lobbyPassword').value;
            const maxPlayers = parseInt(document.getElementById('lobbyMaxPlayers').value);
            if (typeof createOnlineLobby === 'function') createOnlineLobby(null, lobbyName, password, maxPlayers, false);
            break;
        case 'confirmJoinLobby':
            const lobbyCode = document.getElementById('lobbyCodeInput').value.toUpperCase();
            const joinPassword = document.getElementById('lobbyPasswordInput').value;
            if (lobbyCode) {
                if (typeof joinLobby === 'function') joinLobby(lobbyCode, joinPassword);
            } else {
                alert('Please enter a lobby code!');
            }
            break;
        case 'addFriendBtn':
            const friendCode = document.getElementById('friendCodeInput').value.toUpperCase();
            if (friendCode) {
                if (typeof addFriend === 'function') addFriend(friendCode);
            } else {
                alert('Please enter a friend code!');
            }
            break;
        case 'startMatchBtn':
            if (typeof startOnlineMatch === 'function') startOnlineMatch();
            break;
        case 'leaveLobbyBtn':
            if (typeof leaveLobby === 'function') leaveLobby();
            break;
    }
}

// Game Systems
function startBattle(mode = 'arcade') {
    if (gameState.selectedCharacter === null) {
        alert('Please select a character first!');
        return;
    }
    
    gameState.gameMode = mode;
    gameState.difficulty = document.getElementById('difficultySelect').value;
    
    gameState.isBossFight = (gameState.difficulty === 'sixtyseven' && 
                            CHARACTERS[gameState.selectedCharacter].id === 67);
    
    if (gameState.isBossFight) {
        console.log('STARTING BALANCED 67 BOSS SURVIVAL MODE!');
    }
    
    showScreen('gameScreen');
}

function startGame() {
    console.log('Starting game...');
    
    if (gameState.gameMode === 'online' && gameState.onlineMatch) {
        startOnlineGame();
        return;
    }
    
    if (gameState.selectedCharacter === null) {
        console.error('No character selected');
        showScreen('characterSelect');
        return;
    }
    
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    const difficulty = DIFFICULTY_SETTINGS[gameState.difficulty];
    
    let cpuChar;
    let isBossFight = false;
    
    if (gameState.isBossFight) {
        cpuChar = BOSS_67;
        isBossFight = true;
        console.log('BALANCED BOSS SURVIVAL MODE INITIATED!');
        startBossCutscene();
    } else {
        let cpuIndex;
        do {
            cpuIndex = Math.floor(Math.random() * CHARACTERS.length);
        } while (cpuIndex === gameState.selectedCharacter && CHARACTERS.length > 1);
        cpuChar = CHARACTERS[cpuIndex];
    }
    
    setupSinglePlayerGame(playerChar, cpuChar, difficulty, isBossFight);
}

function startOnlineGame() {
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    
    gameState.player = {
        character: playerChar,
        x: -5,
        z: 0,
        health: playerChar.hp,
        maxHealth: playerChar.hp,
        facing: 1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        parryCooldown: 0,
        parryAvailable: true,
        items: gameState.playerInventory
    };
    
    gameState.opponent = {
        character: CHARACTERS[0],
        x: 5,
        z: 0,
        health: CHARACTERS[0].hp,
        maxHealth: CHARACTERS[0].hp,
        facing: -1,
        state: 'idle'
    };
    
    document.getElementById('p1Name').textContent = playerChar.name;
    document.getElementById('p2Name').textContent = "OPPONENT";
    document.getElementById('roundText').textContent = "ONLINE MATCH";
    
    updateHealthBars();
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    
    console.log('Online game started');
    animate();
}

function setupSinglePlayerGame(playerChar, cpuChar, difficulty, isBossFight) {
    const memoryKey = `${gameState.selectedCharacter}_${gameState.difficulty}`;
    if (!gameState.cpuMemory[memoryKey]) {
        gameState.cpuMemory[memoryKey] = {
            playerMoves: {punch: 1, kick: 1, special: 1, parry: 1},
            comboPatterns: {},
            dodgeChance: 0.1,
            counterChance: 0.1,
            fights: 0
        };
    }
    
    const cpuMemory = gameState.cpuMemory[memoryKey];
    cpuMemory.fights++;
    
    resetGameTimers();
    
    gameState.player = {
        character: playerChar,
        x: -5,
        z: 0,
        health: playerChar.hp,
        maxHealth: playerChar.hp,
        facing: 1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        parryCooldown: 0,
        parryAvailable: true,
        items: gameState.playerInventory
    };
    
    gameState.cpu = {
        character: cpuChar,
        x: 5,
        z: 0,
        health: Math.floor(cpuChar.hp * difficulty.cpuHpMultiplier),
        maxHealth: Math.floor(cpuChar.hp * difficulty.cpuHpMultiplier),
        facing: -1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        memory: cpuMemory,
        difficulty: difficulty,
        lastPlayerMove: null,
        isBoss: isBossFight
    };
    
    document.getElementById('p1Name').textContent = playerChar.name;
    document.getElementById('p2Name').textContent = cpuChar.name;
    
    if (isBossFight) {
        document.getElementById('p2Name').textContent = "67 BOSS";
        document.getElementById('p2Name').style.color = "#ff0000";
        document.getElementById('roundText').textContent = "SURVIVAL MODE";
    } else {
        document.getElementById('p2Name').style.color = "";
        document.getElementById('roundText').textContent = `ROUND 1`;
    }
    
    document.getElementById('roundTimer').textContent = gameState.roundTime;
    
    updateHealthBars();
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    gameState.comboCount = 0;
    gameState.score = 0;
    
    console.log('Game started:', playerChar.name, 'vs', cpuChar.name);
    
    if (!gameState.cutsceneActive) {
        animate();
    }
}

function resetGameTimers() {
    gameState.parryCooldownActive = false;
    gameState.parryCooldownEnd = 0;
    gameState.bossSpecialAttackCooldown = 0;
    gameState.bossStunTimer = 0;
    gameState.isBossStunned = false;
    
    gameState.bossSelfDamageTimer = 0;
    gameState.playerHiddenHealTimer = 0;
    gameState.playerFakeHP = 100;
    gameState.playerRealHP = 100;
    gameState.survivalPhase = 0;
    
    const parryButtons = document.querySelectorAll('[data-action="parry"]');
    parryButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.background = 'rgba(100, 255, 100, 0.7)';
        btn.textContent = 'PARRY';
    });
}

// Input and Combat Systems
function handleGameInput(key, isPressed) {
    const keyMap = {
        'arrowleft': 'left',
        'arrowright': 'right',
        'z': 'punch',
        'x': 'punch',
        'a': 'kick',
        's': 'kick',
        ' ': 'parry',
        'c': 'special'
    };
    
    const currentTime = Date.now();
    if (currentTime - gameState.lastKeyTime > 1000) {
        gameState.combo = [];
    }
    
    if (keyMap[key]) {
        gameState.combo.push(keyMap[key]);
        gameState.lastKeyTime = currentTime;
        checkCombos();
    }
}

function checkCombos() {
    if (!gameState.player) return;
    
    const character = gameState.player.character;
    
    if (gameState.cpu && gameState.cpu.memory && gameState.combo.length > 2) {
        const comboKey = gameState.combo.slice(-3).join('-');
        if (!gameState.cpu.memory.comboPatterns[comboKey]) {
            gameState.cpu.memory.comboPatterns[comboKey] = 0;
        }
        gameState.cpu.memory.comboPatterns[comboKey]++;
    }
    
    if (gameState.combo.length >= 3 && Math.random() > 0.7) {
        executeRandomCombo();
        gameState.combo = [];
        return;
    }
    
    for (const combo of character.combos) {
        if (gameState.combo.length < combo.input.length) continue;
        
        const recentInput = gameState.combo.slice(-combo.input.length);
        if (JSON.stringify(recentInput) === JSON.stringify(combo.input)) {
            executeCombo(combo);
            gameState.combo = [];
            break;
        }
    }
}

function executeRandomCombo() {
    const randomCombos = [
        { name: "RANDOM BRAINROT", damage: 80 + Math.floor(Math.random() * 50) },
        { name: "SPAM ATTACK", damage: 60 + Math.floor(Math.random() * 40) },
        { name: "CHAOS STRIKE", damage: 100 + Math.floor(Math.random() * 30) },
        { name: "MEME COMBO", damage: 70 + Math.floor(Math.random() * 60) }
    ];
    
    const combo = randomCombos[Math.floor(Math.random() * randomCombos.length)];
    executeCombo(combo);
}

function executeCombo(combo) {
    gameState.comboCount++;
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = `${combo.name} x${gameState.comboCount}`;
        display.classList.add('active');
    }
    
    let parryChance = gameState.cpu.difficulty.parryChance;
    if (gameState.cpu.isBoss) parryChance = 0.0;
    
    if (gameState.cpu && Math.random() < parryChance) {
        createParryEffect(gameState.cpu.x, 1, 0);
        applyDamageFlash('cpu', 0x00ff00);
        if (display) display.textContent = `${combo.name} PARRY!`;
    } else {
        if (!gameState.isBossFight) {
            gameState.cpu.health = Math.max(0, gameState.cpu.health - combo.damage);
        }
        
        updateHealthBars();
        
        if (gameState.gameMode === 'practice') {
            gameState.practiceStats.comboCount++;
            if (!gameState.isBossFight) gameState.practiceStats.damageDealt += combo.damage;
        }
        
        if (!gameState.isBossFight) gameState.score += combo.damage * gameState.comboCount;
        
        if (window.playerModel) {
            window.playerModel.position.z = -0.8;
            setTimeout(() => { if (window.playerModel) window.playerModel.position.z = 0; }, 150);
        }
        
        createBloodEffect(gameState.cpu.x, 1, 0);
        applyDamageFlash('cpu');
        
        if (combo.damage > 100) {
            const canvas = document.getElementById('gameCanvas');
            if (canvas) {
                canvas.style.transform = 'translateX(-5px)';
                setTimeout(() => {
                    canvas.style.transform = 'translateX(5px)';
                    setTimeout(() => canvas.style.transform = '', 50);
                }, 50);
            }
        }
        
        if (combo.damage > 100 && Math.random() > 0.7) spawn67();
    }
    
    if (gameState.cpu.memory) {
        gameState.cpu.memory.dodgeChance = Math.min(0.6, gameState.cpu.memory.dodgeChance + 0.02);
    }
    
    setTimeout(() => { if (display) display.classList.remove('active'); }, 1000);
}

function doPlayerAttack(type) {
    if (!gameState.gameActive || !gameState.player || gameState.player.attackCooldown > 0) return;
    
    if (gameState.player.parryCooldown > 0 && type !== 'parry') return;
    
    const distance = Math.abs(gameState.player.x - (gameState.cpu?.x || gameState.opponent?.x || 5));
    if (distance > 3 && type !== 'parry') return;
    
    gameState.player.attackCooldown = 20;
    
    if (gameState.cpu && gameState.cpu.memory) {
        gameState.cpu.lastPlayerMove = type;
        if (!gameState.cpu.memory.playerMoves[type]) gameState.cpu.memory.playerMoves[type] = 0;
        gameState.cpu.memory.playerMoves[type]++;
    }
    
    if (type === 'parry') {
        if (gameState.parryCooldownActive) {
            const display = document.getElementById('comboDisplay');
            if (display) {
                const timeLeft = Math.ceil((gameState.parryCooldownEnd - Date.now()) / 1000);
                display.textContent = `PARRY COOLDOWN: ${timeLeft}s`;
                display.classList.add('active');
                setTimeout(() => display.classList.remove('active'), 1000);
            }
            return;
        }
        
        const healAmount = gameState.player.maxHealth * 0.10;
        const damageAmount = (gameState.cpu?.maxHealth || 1000) * 0.20;
        
        if (!gameState.isBossFight && gameState.cpu) {
            gameState.cpu.health = Math.max(0, gameState.cpu.health - damageAmount);
        }
        
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
        
        gameState.player.parryCooldown = 90;
        gameState.parryCooldownActive = true;
        gameState.parryCooldownEnd = Date.now() + 10000;
        
        const parryButtons = document.querySelectorAll('[data-action="parry"]');
        parryButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.background = 'rgba(100, 100, 100, 0.7)';
            btn.textContent = 'COOLDOWN';
        });
        
        const cooldownInterval = setInterval(() => {
            const timeLeft = Math.ceil((gameState.parryCooldownEnd - Date.now()) / 1000);
            
            if (timeLeft <= 0) {
                clearInterval(cooldownInterval);
                gameState.parryCooldownActive = false;
                
                parryButtons.forEach(btn => {
                    btn.disabled = false;
                    btn.style.opacity = '1';
                    btn.style.background = 'rgba(100, 255, 100, 0.7)';
                    btn.textContent = 'PARRY';
                });
                
                const display = document.getElementById('comboDisplay');
                if (display) {
                    display.textContent = "PARRY READY!";
                    display.classList.add('active');
                    setTimeout(() => display.classList.remove('active'), 1000);
                }
            } else {
                parryButtons.forEach(btn => btn.textContent = timeLeft + 's');
            }
        }, 1000);
        
        createParryEffect(gameState.player.x, 1, 0);
        applyDamageFlash('player', 0x00ff00);
        
        if (!gameState.isBossFight) applyDamageFlash('cpu');
        
        updateHealthBars();
        
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = gameState.isBossFight ? "PERFECT PARRY! +10% HP" : "PERFECT PARRY! +10% HP +20% DMG";
            display.classList.add('active');
            setTimeout(() => display.classList.remove('active'), 1500);
        }
        
        return;
    }
    
    let parryChance = gameState.cpu?.difficulty?.parryChance || 0;
    if (gameState.cpu?.isBoss) parryChance = 0.0;
    
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
        setTimeout(() => { if (window.playerModel) window.playerModel.position.z = 0; }, 100);
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
    
    if (gameState.player.items && gameState.player.items.damageBoost) damageMultiplier += 0.2;
    
    if (type === 'punch') {
        damage = (gameState.player.character.moves.punch + Math.floor(Math.random() * 10)) * damageMultiplier;
    } else if (type === 'kick') {
        damage = (gameState.player.character.moves.kick + Math.floor(Math.random() * 10)) * damageMultiplier;
    } else if (type === 'special') {
        damage = (gameState.player.character.moves.special + Math.floor(Math.random() * 15)) * damageMultiplier;
    }
    
    if (gameState.cpu) {
        gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
        updateHealthBars();
    }
    
    if (gameState.gameMode === 'practice') {
        gameState.practiceStats.damageDealt += damage;
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

// Game Loop and Updates
function animate() {
    if (!gameState.gameActive) return;
    
    requestAnimationFrame(animate);
    
    const delta = window.clock ? window.clock.getDelta() : 0.016;
    
    try {
        update();
        render();
        
        if (window.mixerPlayer) window.mixerPlayer.update(delta);
        if (window.mixerCpu) window.mixerCpu.update(delta);
    } catch (error) {
        console.error('Error in game loop:', error);
    }
}

function update() {
    if (!gameState.player) return;
    if (gameState.cutsceneActive) return;
    
    if (gameState.player.attackCooldown > 0) gameState.player.attackCooldown--;
    if (gameState.cpu && gameState.cpu.attackCooldown > 0) gameState.cpu.attackCooldown--;
    if (gameState.player.parryCooldown > 0) gameState.player.parryCooldown--;
    if (gameState.bossSpecialAttackCooldown > 0) gameState.bossSpecialAttackCooldown--;
    
    if (gameState.gameMode === 'online') {
        updateOnlineGame();
        return;
    }
    
    // Boss survival mode mechanics
    if (gameState.isBossFight) {
        gameState.bossSelfDamageTimer += 1;
        
        if (gameState.bossSelfDamageTimer >= BOSS_BALANCED_SETTINGS.selfDamageInterval) {
            gameState.bossSelfDamageTimer = 0;
            gameState.isBossStunned = true;
            
            const damage = gameState.cpu.maxHealth * BOSS_BALANCED_SETTINGS.selfDamageAmount;
            gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
            
            createBossStunEffect();
            gameState.survivalPhase++;
            
            const display = document.getElementById('comboDisplay');
            if (display) {
                display.textContent = `67 BOSS STUNNED! -${Math.round(BOSS_BALANCED_SETTINGS.selfDamageAmount * 100)}% HP`;
                display.classList.add('active');
                setTimeout(() => display.classList.remove('active'), 2000);
            }
            
            setTimeout(() => gameState.isBossStunned = false, BOSS_BALANCED_SETTINGS.stunDuration);
        }
        
        gameState.playerHiddenHealTimer += 1;
        
        if (gameState.playerHiddenHealTimer >= BOSS_BALANCED_SETTINGS.playerHealInterval) {
            gameState.playerHiddenHealTimer = 0;
            gameState.playerRealHP = 100;
            createPlayerHealEffect();
        }
        
        if (gameState.playerFakeHP > 1) {
            const adrenalineFactor = 1 - (gameState.playerRealHP / 100);
            const fakeHPDamage = 0.08 * (1 - adrenalineFactor * 0.5);
            gameState.playerFakeHP = Math.max(1, gameState.playerFakeHP - fakeHPDamage);
        }
        
        gameState.player.health = gameState.player.maxHealth * (gameState.playerFakeHP / 100);
        
        if (gameState.playerRealHP <= 0) {
            gameState.player.health = 0;
        }
    }
    
    if (gameState.player.parryCooldown <= 0) {
        if (gameState.keys["arrowleft"]) {
            gameState.player.x = Math.max(-8, gameState.player.x - 0.1);
            gameState.player.facing = -1;
            if (window.playerModel) {
                window.playerModel.position.x = gameState.player.x;
                window.playerModel.rotation.y = Math.PI;
            }
        }
        if (gameState.keys["arrowright"]) {
            gameState.player.x = Math.min(8, gameState.player.x + 0.1);
            gameState.player.facing = 1;
            if (window.playerModel) {
                window.playerModel.position.x = gameState.player.x;
                window.playerModel.rotation.y = 0;
            }
        }
    }
    
    // CPU AI
    if (gameState.cpu && !gameState.cpu.isBoss && gameState.cpu.attackCooldown <= 0) {
        const distance = Math.abs(gameState.player.x - gameState.cpu.x);
        if (Math.random() < gameState.cpu.difficulty.aggression * 0.02 && distance < 3) {
            const attackTypes = ['punch', 'kick', 'special'];
            const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
            doCpuAttack(attackType);
            gameState.cpu.attackCooldown = 25 / gameState.cpu.difficulty.aggression;
        }
    }
    
    if (gameState.roundTime > 0 && Math.random() < 0.01) {
        gameState.roundTime--;
        const timerElement = document.getElementById('roundTimer');
        if (timerElement) timerElement.textContent = gameState.roundTime;
    }
    
    if (gameState.player.health <= 0 || (gameState.cpu && gameState.cpu.health <= 0) || gameState.roundTime <= 0) {
        endRound();
    }
}

function updateOnlineGame() {
    if (gameState.player.parryCooldown <= 0) {
        if (gameState.keys["arrowleft"]) {
            gameState.player.x = Math.max(-8, gameState.player.x - 0.1);
            gameState.player.facing = -1;
            if (window.playerModel) {
                window.playerModel.position.x = gameState.player.x;
                window.playerModel.rotation.y = Math.PI;
            }
        }
        if (gameState.keys["arrowright"]) {
            gameState.player.x = Math.min(8, gameState.player.x + 0.1);
            gameState.player.facing = 1;
            if (window.playerModel) {
                window.playerModel.position.x = gameState.player.x;
                window.playerModel.rotation.y = 0;
            }
        }
    }
    
    sendOnlineInput();
    
    if (gameState.opponent && window.cpuModel) {
        window.cpuModel.position.x = gameState.opponent.x;
        window.cpuModel.rotation.y = (gameState.opponent.facing === 1 ? 0 : Math.PI);
    }
    
    if (gameState.roundTime > 0 && Math.random() < 0.01) {
        gameState.roundTime--;
        const timerElement = document.getElementById('roundTimer');
        if (timerElement) timerElement.textContent = gameState.roundTime;
    }
    
    if (gameState.player.health <= 0 || (gameState.opponent && gameState.opponent.health <= 0) || gameState.roundTime <= 0) {
        endRound();
    }
}

function sendOnlineInput() {
    if (!gameState.onlineMatch || !onlineState?.isOnline) return;
    
    const input = {
        sequence: gameState.lastInputSequence++,
        playerId: onlineState.playerId,
        x: gameState.player.x,
        facing: gameState.player.facing,
        keys: {...gameState.keys},
        timestamp: Date.now()
    };
    
    simulateOpponentInput();
}

function simulateOpponentInput() {
    if (!gameState.opponent) return;
    
    const distance = gameState.opponent.x - gameState.player.x;
    
    if (Math.abs(distance) > 2.5) {
        gameState.opponent.x += (distance > 0 ? -0.05 : 0.05);
    }
    
    gameState.opponent.facing = (distance > 0 ? -1 : 1);
    
    if (Math.random() < 0.02 && Math.abs(distance) < 3) {
        createBloodEffect(gameState.player.x, 1, 0);
        applyDamageFlash('player');
        
        const damage = 20 + Math.floor(Math.random() * 30);
        gameState.player.health = Math.max(0, gameState.player.health - damage);
        updateHealthBars();
    }
}

// Utility Functions
function checkBossUnlock() {
    const insaneCompleted = localStorage.getItem('insaneCompletedWith67');
    if (insaneCompleted === 'true' && !gameState.bossUnlocked) {
        gameState.bossUnlocked = true;
        localStorage.setItem('boss67Unlocked', 'true');
        console.log('67 BOSS UNLOCKED!');
    }
}

function updateHealthBars() {
    const p1Health = document.getElementById('p1Health');
    const p2Health = document.getElementById('p2Health');
    const p1HealthText = document.getElementById('p1HealthText');
    const p2HealthText = document.getElementById('p2HealthText');
    
    if (!p1Health || !p2Health || !p1HealthText || !p2HealthText) return;
    
    const p1Percent = gameState.player.health / gameState.player.maxHealth;
    const p2Percent = (gameState.cpu?.health || gameState.opponent?.health || 0) / (gameState.cpu?.maxHealth || gameState.opponent?.maxHealth || 1);
    
    p1Health.style.width = `${p1Percent * 100}%`;
    p2Health.style.width = `${p2Percent * 100}%`;
    
    if (gameState.isBossFight) {
        p1HealthText.textContent = `${Math.round(gameState.playerFakeHP)}%`;
    } else {
        p1HealthText.textContent = `${Math.round(p1Percent * 100)}%`;
    }
    
    p2HealthText.textContent = `${Math.round(p2Percent * 100)}%`;
    
    // HP bar colors
    const updateHealthBarColor = (element, percent, isBoss = false) => {
        if (percent < 0.3) {
            element.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
        } else if (percent < 0.6) {
            element.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
        } else {
            element.style.background = isBoss ? 
                'linear-gradient(90deg, #ff0000 0%, #ff6600 100%)' :
                'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
        }
    };
    
    updateHealthBarColor(p1Health, p1Percent, false);
    updateHealthBarColor(p2Health, p2Percent, gameState.isBossFight);
}

function spawn67() {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const element = document.createElement('div');
            element.className = 'secret-67';
            element.textContent = '67';
            element.style.left = `${Math.random() * 80 + 10}%`;
            element.style.top = `${Math.random() * 80 + 10}%`;
            document.body.appendChild(element);
            
            setTimeout(() => element.remove(), 2000);
        }, i * 100);
    }
}

// Boss Cutscene System
function startBossCutscene() {
    gameState.cutsceneActive = true;
    gameState.cutsceneTimer = 0;
    gameState.cutsceneTextIndex = 0;
    gameState.currentCutsceneText = "";
    
    document.getElementById('gameCanvas').style.opacity = '0.3';
    document.querySelector('.hud').style.opacity = '0.3';
    document.getElementById('touchControls').style.opacity = '0.3';
    
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
    
    if (bossMusic) {
        bossMusic.currentTime = 0;
        bossMusic.volume = 0.5;
        bossMusic.play().catch(e => console.log("Boss music play failed:", e));
    }
    
    animateCutscene();
}

function animateCutscene() {
    if (!gameState.cutsceneActive) return;
    
    gameState.cutsceneTimer++;
    const cutsceneText = document.getElementById('cutsceneText');
    const textStages = [
        { start: 0, end: 150, textIndex: 0, fadeIn: true },
        { start: 150, end: 300, textIndex: 0, fadeIn: false },
        { start: 200, end: 350, textIndex: 1, fadeIn: true },
        { start: 350, end: 500, textIndex: 1, fadeIn: false },
        { start: 400, end: 550, textIndex: 2, fadeIn: true },
        { start: 550, end: 700, textIndex: 2, fadeIn: false },
        { start: 600, end: 750, textIndex: 3, fadeIn: true },
        { start: 750, end: 900, textIndex: 3, fadeIn: false },
        { start: 800, end: 950, textIndex: 4, fadeIn: true },
        { start: 950, end: 1100, textIndex: 4, fadeIn: false },
        { start: 1000, end: 1150, textIndex: 5, fadeIn: true }
    ];
    
    for (const stage of textStages) {
        if (gameState.cutsceneTimer >= stage.start && gameState.cutsceneTimer <= stage.end) {
            if (gameState.cutsceneTextIndex !== stage.textIndex) {
                gameState.cutsceneTextIndex = stage.textIndex;
                gameState.currentCutsceneText = BOSS_CUTSCENE_TEXTS[stage.textIndex];
                cutsceneText.textContent = gameState.currentCutsceneText;
                cutsceneText.style.opacity = '0';
            }
            
            const progress = (gameState.cutsceneTimer - stage.start) / (stage.end - stage.start);
            cutsceneText.style.opacity = stage.fadeIn ? Math.min(1, progress).toString() : Math.max(0, 1 - progress).toString();
            
            if (stage.textIndex === 5 && progress > 0.5 && bossMusic) {
                // BEAT DROP when "BEGIN!" is shown
                bossMusic.volume = 0.8;
                const canvas = document.getElementById('gameCanvas');
                if (canvas) {
                    canvas.style.transform = 'scale(1.05)';
                    setTimeout(() => canvas.style.transform = 'scale(1)', 200);
                }
            }
            
            break;
        }
    }
    
    if (gameState.cutsceneTimer >= 1200) {
        endCutscene();
        return;
    }
    
    requestAnimationFrame(animateCutscene);
}

function endCutscene() {
    gameState.cutsceneActive = false;
    
    const cutsceneOverlay = document.getElementById('cutsceneOverlay');
    if (cutsceneOverlay) cutsceneOverlay.style.display = 'none';
    
    document.getElementById('gameCanvas').style.opacity = '1';
    document.querySelector('.hud').style.opacity = '1';
    document.getElementById('touchControls').style.opacity = '1';
    
    animate();
    
    const display = document.getElementById('comboDisplay');
    if (display) {
        display.textContent = "SURVIVE! Boss defeats itself every 5s";
        display.classList.add('active');
        setTimeout(() => display.classList.remove('active'), 3000);
    }
}

function endRound() {
    gameState.gameActive = false;
    
    if (bossMusic && !bossMusic.paused) {
        bossMusic.pause();
        bossMusic.currentTime = 0;
    }
    
    if (menuMusic && menuMusic.paused) {
        menuMusic.currentTime = 0;
        menuMusic.volume = 0.7;
        menuMusic.play().catch(e => console.log("Menu music play failed:", e));
    }
    
    let message = "TIME OVER!";
    let isBossDefeated = false;
    
    if (gameState.player.health <= 0) {
        message = "CPU WINS!";
    } else if ((gameState.cpu && gameState.cpu.health <= 0) || (gameState.opponent && gameState.opponent.health <= 0)) {
        message = "PLAYER WINS!";
        gameState.score += 1000;
        gameState.coins += 50;
        
        if (gameState.difficulty === 'insane' && CHARACTERS[gameState.selectedCharacter].id === 67) {
            localStorage.setItem('insaneCompletedWith67', 'true');
            checkBossUnlock();
        }
        
        if (gameState.isBossFight) {
            isBossDefeated = true;
            gameState.bossDefeated = true;
            localStorage.setItem('boss67Defeated', 'true');
            message = "67 BOSS DEFEATED!";
            gameState.coins += 500;
        }
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('brainrotHighScore', gameState.highScore);
            const highScoreElement = document.getElementById('highScore');
            if (highScoreElement) highScoreElement.textContent = gameState.highScore;
        }
        
        localStorage.setItem('brainrotCoins', gameState.coins);
        const coinsElement = document.getElementById('coinsAmount');
        if (coinsElement) coinsElement.textContent = gameState.coins;
        
        spawn67();
    }
    
    if (gameState.cpuMemory) {
        localStorage.setItem('cpuMemory', JSON.stringify(gameState.cpuMemory));
    }
    
    setTimeout(() => {
        if (isBossDefeated) {
            showBossDefeatedDialogue();
        } else if (gameState.gameMode === 'practice') {
            showScreen('mainMenu');
        } else {
            alert(`${message}\nScore: ${gameState.score}\nCoins Earned: ${isBossDefeated ? 550 : 50}`);
            showScreen('characterSelect');
        }
    }, 1000);
}

function showBossDefeatedDialogue() {
    const dialogue = document.createElement('div');
    dialogue.style.position = 'fixed';
    dialogue.style.top = '0';
    dialogue.style.left = '0';
    dialogue.style.width = '100%';
    dialogue.style.height = '100%';
    dialogue.style.backgroundColor = 'rgba(0,0,0,0.9)';
    dialogue.style.display = 'flex';
    dialogue.style.flexDirection = 'column';
    dialogue.style.justifyContent = 'center';
    dialogue.style.alignItems = 'center';
    dialogue.style.zIndex = '1000';
    dialogue.style.color = '#ffcc00';
    dialogue.style.fontSize = '2rem';
    dialogue.style.textAlign = 'center';
    dialogue.style.padding = '2rem';
    
    dialogue.innerHTML = `
        <div style="margin-bottom: 2rem; font-size: 3rem; color: #ff0000; text-shadow: 0 0 20px #ff0000;">67 BOSS DEFEATED!</div>
        <div style="margin-bottom: 3rem; font-size: 1.5rem; line-height: 1.6;">
            "What just happened...?"<br>
            The true power of 67 has been unleashed...<br>
            But at what cost?
        </div>
        <div style="margin-bottom: 2rem; font-size: 1.2rem; color: #00ff00;">
            Reward: 500 COINS + 50 Bonus!
        </div>
        <button id="continueBtn" style="
            font-size: 1.5rem; 
            padding: 1rem 2rem; 
            background: #ff0033; 
            color: white; 
            border: 2px solid #ffcc00; 
            cursor: pointer;
            border-radius: 10px;
        ">CONTINUE</button>
    `;
    
    document.body.appendChild(dialogue);
    
    document.getElementById('continueBtn').addEventListener('click', () => {
        document.body.removeChild(dialogue);
        showScreen('characterSelect');
    });
}

function render() {
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

// Missing function stubs for Three.js effects
function createParryEffect(x, y, z) {
    // Three.js effect implementation would go here
    console.log('Parry effect at:', x, y, z);
}

function applyDamageFlash(character, color = 0xff0000) {
    // Three.js effect implementation would go here
    console.log('Damage flash for:', character, 'color:', color);
}

function createBloodEffect(x, y, z) {
    // Three.js effect implementation would go here
    console.log('Blood effect at:', x, y, z);
}

function createBossStunEffect() {
    // Three.js effect implementation would go here
    console.log('Boss stun effect');
}

function createPlayerHealEffect() {
    // Three.js effect implementation would go here
    console.log('Player heal effect');
}

function doCpuAttack(type) {
    // CPU attack logic would go here
    console.log('CPU attack:', type);
}

// Initialize when loaded
window.addEventListener('load', init);

// Make functions globally available
window.showScreen = showScreen;
window.startBattle = startBattle;
window.gameState = gameState;
