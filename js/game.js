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
    round: 1,
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
    parryCooldownActive: false,
    parryCooldownEnd: 0,
    bossUnlocked: localStorage.getItem('boss67Unlocked') === 'true',
    bossDefeated: localStorage.getItem('boss67Defeated') === 'true',
    isBossFight: false,
    bossSpecialAttackCooldown: 0,
    bossStunTimer: 0,
    isBossStunned: false,
    playerBaseHp: 0,
    lastHealTime: 0,
    // Online mode
    onlineMode: false,
    opponent: null,
    roomCode: null,
    isHost: false,
    playerReady: false,
    opponentReady: false,
    gameStarted: false
};

// Difficulty Settings
const DIFFICULTY_SETTINGS = {
    easy: {
        cpuHpMultiplier: 0.8,
        parryChance: 0.2,
        aggression: 0.3,
        learningRate: 0.1
    },
    medium: {
        cpuHpMultiplier: 1.0,
        parryChance: 0.5,
        aggression: 0.6,
        learningRate: 0.3
    },
    hard: {
        cpuHpMultiplier: 1.3,
        parryChance: 0.8,
        aggression: 0.9,
        learningRate: 0.5
    },
    insane: {
        cpuHpMultiplier: 1.5,
        parryChance: 1.0,
        aggression: 1.0,
        learningRate: 0.8
    },
    sixtyseven: {
        cpuHpMultiplier: 5.67,
        parryChance: 0.5,
        aggression: 1.2,
        learningRate: 0.9,
        isBoss: true,
        parryCooldown: 2
    }
};

// Initialize Game
function init() {
    console.log('Initializing Brainrot Fighters...');
    document.getElementById('highScore').textContent = gameState.highScore;
    document.getElementById('coinsAmount').textContent = gameState.coins;
    detectDevice();
    setupEventListeners();
    renderCharacterSelect();
    
    checkBossUnlock();
    
    if (typeof loadShopItems === 'function') {
        setTimeout(loadShopItems, 100);
    }

    if (window.onlineManager) {
        window.onlineManager.listenToLeaderboard();
    }
}

function checkBossUnlock() {
    const insaneCompleted = localStorage.getItem('insaneCompletedWith67');
    if (insaneCompleted === 'true' && !gameState.bossUnlocked) {
        gameState.bossUnlocked = true;
        localStorage.setItem('boss67Unlocked', 'true');
        console.log('67 BOSS UNLOCKED!');
    }
}

// Device Detection
function detectDevice() {
    const isTablet = /iPad|Android|Tablet/i.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    gameState.deviceType = isTablet ? 'tablet' : 'desktop';
    document.getElementById('deviceType').textContent = 
        gameState.deviceType === 'tablet' ? 'TABLET MODE' : 'DESKTOP MODE';
}

// Simulate loading progress
function simulateLoading() {
    let progress = 0;
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    const stages = [
        "INITIALIZING BRAINROT ENGINE...",
        "LOADING BRAINROTTERS...",
        "SETTING UP ARENA...",
        "CALIBRATING CONTROLS...",
        "CONNECTING TO ONLINE SERVICES...",
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
    } else {
        console.error('Screen not found:', screenId);
        return;
    }
    
    if (screenId === 'gameScreen') {
        setTimeout(() => {
            if (typeof initThreeJS === 'function') {
                initThreeJS();
            }
            if (gameState.onlineMode) {
                startOnlineGame();
            } else {
                startGame();
            }
        }, 100);
    } else if (screenId === 'practiceScreen') {
        startPracticeMode();
    } else if (screenId === 'shopScreen') {
        setTimeout(() => {
            if (typeof loadShopItems === 'function') {
                loadShopItems();
            }
        }, 100);
    } else if (screenId === 'characterSelect') {
        renderCharacterSelect();
    } else if (screenId === 'onlineScreen') {
        loadAvailableRooms();
    } else if (screenId === 'leaderboardScreen') {
        updateLeaderboard();
    }
    
    const touchControls = document.getElementById('touchControls');
    if (touchControls) {
        touchControls.classList.toggle('active', 
            screenId === 'gameScreen' && gameState.deviceType === 'tablet');
    }
}

// Character Selection
function renderCharacterSelect() {
    const grid = document.getElementById('characterGrid');
    const difficultySelect = document.getElementById('difficultySelect');
    
    if (!grid) {
        console.error('Character grid not found');
        return;
    }
    
    if (gameState.bossUnlocked && difficultySelect) {
        const sixtySevenOption = difficultySelect.querySelector('option[value="sixtyseven"]');
        if (!sixtySevenOption) {
            const option = document.createElement('option');
            option.value = 'sixtyseven';
            option.textContent = '67 BOSS';
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
            document.querySelectorAll('.character-card').forEach(c => {
                c.classList.remove('selected');
            });
            card.classList.add('selected');
            gameState.selectedCharacter = index;
            document.getElementById('confirmBtn').disabled = false;
            
            document.getElementById('previewName').textContent = character.name;
            document.getElementById('previewStyle').textContent = character.style;
            document.getElementById('previewDesc').textContent = character.description;
            document.getElementById('previewModel').textContent = character.icon;
            document.getElementById('previewModel').style.borderColor = character.color;
            
            const bossUnlockInfo = document.getElementById('bossUnlockInfo');
            const bossUnlockedInfo = document.getElementById('bossUnlockedInfo');
            if (bossUnlockInfo && bossUnlockedInfo) {
                if (gameState.bossUnlocked) {
                    bossUnlockInfo.style.display = 'none';
                    bossUnlockedInfo.style.display = 'block';
                } else {
                    bossUnlockInfo.style.display = 'block';
                    bossUnlockedInfo.style.display = 'none';
                }
            }
        });
        
        grid.appendChild(card);
    });
}

// Start Battle
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
        console.log('STARTING 67 BOSS FIGHT!');
    }
    
    showScreen('gameScreen');
}

// Online Mode Functions
function showOnlineScreen() {
    showScreen('onlineScreen');
}

async function loadAvailableRooms() {
    if (!window.onlineManager) return;
    
    try {
        const rooms = await window.onlineManager.getAvailableRooms();
        const roomList = document.getElementById('roomList');
        
        if (roomList) {
            roomList.innerHTML = '';
            
            if (rooms.length === 0) {
                roomList.innerHTML = '<div style="text-align: center; color: #aaa; padding: 2rem;">No rooms available. Create one!</div>';
                return;
            }
            
            rooms.forEach(room => {
                const roomElement = document.createElement('div');
                roomElement.className = 'room-item';
                roomElement.innerHTML = `
                    <div class="room-info">
                        <div class="room-code">${room.code}</div>
                        <div class="room-host">Host: ${room.hostCharacter !== undefined ? CHARACTERS[room.hostCharacter].name : 'Unknown'}</div>
                    </div>
                    <div class="room-players">${room.players ? room.players.length : 1}/2</div>
                `;
                
                roomElement.addEventListener('click', () => {
                    joinOnlineRoom(room.code);
                });
                
                roomList.appendChild(roomElement);
            });
        }
    } catch (error) {
        console.error('Error loading rooms:', error);
    }
}

async function createOnlineRoom() {
    if (gameState.selectedCharacter === null) {
        alert('Please select a character first!');
        showScreen('characterSelect');
        return;
    }
    
    try {
        const roomCode = await window.onlineManager.createRoom(gameState.selectedCharacter);
        gameState.roomCode = roomCode;
        gameState.isHost = true;
        gameState.onlineMode = true;
        
        showScreen('waitingRoom');
        updateWaitingRoom();
        
    } catch (error) {
        alert('Error creating room: ' + error.message);
    }
}

async function joinOnlineRoom(roomCode) {
    if (gameState.selectedCharacter === null) {
        alert('Please select a character first!');
        showScreen('characterSelect');
        return;
    }
    
    try {
        await window.onlineManager.joinRoom(roomCode, gameState.selectedCharacter);
        gameState.roomCode = roomCode;
        gameState.isHost = false;
        gameState.onlineMode = true;
        
        showScreen('waitingRoom');
        updateWaitingRoom();
        
    } catch (error) {
        alert('Error joining room: ' + error.message);
    }
}

function joinRoomWithCode() {
    const codeInput = document.getElementById('roomCodeInput');
    if (codeInput && codeInput.value.trim().length === 6) {
        joinOnlineRoom(codeInput.value.trim().toUpperCase());
    } else {
        alert('Please enter a valid 6-character room code');
    }
}

function updateWaitingRoom() {
    const roomCodeElement = document.getElementById('waitingRoomCode');
    const hostSlot = document.getElementById('hostSlot');
    const guestSlot = document.getElementById('guestSlot');
    const startBtn = document.getElementById('startGameBtn');
    const readyBtn = document.getElementById('readyBtn');
    
    if (roomCodeElement) {
        roomCodeElement.textContent = gameState.roomCode;
    }
    
    if (hostSlot) {
        hostSlot.classList.add('occupied');
        hostSlot.innerHTML = `
            <div class="character-icon" style="background: ${CHARACTERS[gameState.selectedCharacter].color}20; border-color: ${CHARACTERS[gameState.selectedCharacter].color}">
                ${CHARACTERS[gameState.selectedCharacter].icon}
            </div>
            <div class="character-name">${CHARACTERS[gameState.selectedCharacter].name}</div>
            ${gameState.playerReady ? '<div class="player-ready">READY!</div>' : ''}
        `;
    }
    
    if (guestSlot && !gameState.isHost) {
        guestSlot.classList.add('occupied');
        guestSlot.innerHTML = `
            <div class="character-icon" style="background: ${CHARACTERS[gameState.selectedCharacter].color}20; border-color: ${CHARACTERS[gameState.selectedCharacter].color}">
                ${CHARACTERS[gameState.selectedCharacter].icon}
            </div>
            <div class="character-name">${CHARACTERS[gameState.selectedCharacter].name}</div>
            ${gameState.playerReady ? '<div class="player-ready">READY!</div>' : ''}
        `;
    }
    
    if (startBtn) {
        startBtn.style.display = gameState.isHost ? 'block' : 'none';
        startBtn.disabled = !(gameState.playerReady && gameState.opponentReady);
    }
    
    if (readyBtn) {
        readyBtn.textContent = gameState.playerReady ? 'NOT READY' : 'READY';
    }
}

function toggleReady() {
    gameState.playerReady = !gameState.playerReady;
    window.onlineManager.setReady(gameState.playerReady);
    updateWaitingRoom();
}

function startOnlineGameFromWaiting() {
    if (gameState.isHost) {
        window.onlineManager.startGame();
    }
}

function leaveOnlineRoom() {
    if (window.onlineManager) {
        window.onlineManager.leaveRoom();
    }
    gameState.onlineMode = false;
    gameState.gameStarted = false;
    showScreen('onlineScreen');
}

function updateLeaderboard() {
    // Leaderboard is updated automatically via Firebase listener
}

function sendChatMessage() {
    const chatInput = document.getElementById('chatInput');
    if (chatInput && chatInput.value.trim() !== '') {
        window.onlineManager.sendChatMessage(chatInput.value.trim());
        chatInput.value = '';
    }
}

function toggleChat() {
    const chat = document.getElementById('chatContainer');
    chat.classList.toggle('active');
}

// Global handlers for online events
window.handleRoomUpdate = function(roomData) {
    console.log('Room updated:', roomData);
    
    if (roomData.hostReady !== undefined && gameState.isHost) {
        gameState.playerReady = roomData.hostReady;
    }
    
    if (roomData.guestReady !== undefined && !gameState.isHost) {
        gameState.opponentReady = roomData.guestReady;
    }
    
    if (roomData.guest !== null && roomData.guestCharacter !== null) {
        const guestSlot = document.getElementById('guestSlot');
        if (guestSlot) {
            guestSlot.classList.add('occupied');
            guestSlot.innerHTML = `
                <div class="character-icon" style="background: ${CHARACTERS[roomData.guestCharacter].color}20; border-color: ${CHARACTERS[roomData.guestCharacter].color}">
                    ${CHARACTERS[roomData.guestCharacter].icon}
                </div>
                <div class="character-name">${CHARACTERS[roomData.guestCharacter].name}</div>
                ${roomData.guestReady ? '<div class="player-ready">READY!</div>' : ''}
            `;
        }
    }
    
    if (roomData.status === 'playing' && !gameState.gameStarted) {
        gameState.gameStarted = true;
        startOnlineBattle();
    }
    
    updateWaitingRoom();
};

window.handleGameStateUpdate = function(gameStateUpdate) {
    if (!gameState.onlineMode || gameState.isHost) return;
    
    if (gameState.opponent) {
        gameState.opponent.x = gameStateUpdate.p2Position || 5;
        gameState.opponent.health = gameStateUpdate.p2Health || 100;
        
        if (window.cpuModel) {
            window.cpuModel.position.x = gameStateUpdate.p2Position || 5;
        }
    }
    
    if (gameStateUpdate.time) {
        gameState.roundTime = gameStateUpdate.time;
        document.getElementById('roundTimer').textContent = gameState.roundTime;
    }
    
    updateHealthBars();
};

window.handleChatUpdate = function(messages) {
    const chatMessages = document.getElementById('chatMessages');
    if (chatMessages) {
        chatMessages.innerHTML = '';
        messages.forEach(msg => {
            const messageElement = document.createElement('div');
            messageElement.className = 'chat-message';
            messageElement.textContent = `${msg.playerId === window.onlineManager.playerId ? 'You' : 'Opponent'}: ${msg.message}`;
            chatMessages.appendChild(messageElement);
        });
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
};

window.handleLeaderboardUpdate = function(leaderboard) {
    const leaderboardElement = document.getElementById('leaderboardList');
    if (leaderboardElement) {
        leaderboardElement.innerHTML = '';
        
        leaderboard.forEach((entry, index) => {
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="leaderboard-rank">#${index + 1}</div>
                <div class="leaderboard-name">${entry.playerName || 'Unknown'}</div>
                <div class="leaderboard-score">${entry.score || 0}</div>
            `;
            leaderboardElement.appendChild(item);
        });
    }
};

window.handleRoomClosed = function() {
    alert('Room has been closed by the host.');
    showScreen('onlineScreen');
    gameState.onlineMode = false;
    gameState.gameStarted = false;
};

function startOnlineBattle() {
    gameState.gameMode = 'online';
    showScreen('gameScreen');
}

function startOnlineGame() {
    console.log('Starting online game...');
    
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    const opponentChar = CHARACTERS[0];
    
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
        character: opponentChar,
        x: 5,
        z: 0,
        health: opponentChar.hp,
        maxHealth: opponentChar.hp,
        facing: -1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0
    };
    
    document.getElementById('p1Name').textContent = playerChar.name;
    document.getElementById('p2Name').textContent = "OPPONENT";
    document.getElementById('roundText').textContent = 'ONLINE BATTLE';
    
    document.getElementById('roundTimer').textContent = gameState.roundTime;
    
    updateHealthBars();
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    gameState.comboCount = 0;
    gameState.score = 0;
    
    console.log('Online game started');
    
    if (window.onlineManager) {
        window.onlineManager.listenToChat();
    }
    
    animate();
}

// Start Practice Mode
function startPracticeMode() {
    gameState.practiceStats = {
        comboCount: 0,
        damageDealt: 0,
        startTime: Date.now()
    };
    updatePracticeStats();
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

// Game Setup
function startGame() {
    console.log('Starting game...');
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
        console.log('BOSS FIGHT INITIATED!');
    } else {
        let cpuIndex;
        do {
            cpuIndex = Math.floor(Math.random() * CHARACTERS.length);
        } while (cpuIndex === gameState.selectedCharacter && CHARACTERS.length > 1);
        cpuChar = CHARACTERS[cpuIndex];
    }
    
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
    
    gameState.parryCooldownActive = false;
    gameState.parryCooldownEnd = 0;
    gameState.bossSpecialAttackCooldown = 0;
    gameState.bossStunTimer = 0;
    gameState.isBossStunned = false;
    gameState.lastHealTime = Date.now();
    
    const parryButtons = document.querySelectorAll('[data-action="parry"]');
    parryButtons.forEach(btn => {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.background = 'rgba(100, 255, 100, 0.7)';
        btn.textContent = 'PARRY';
    });
    
    const playerHpMultiplier = isBossFight ? 6.77 : 1;
    const baseHp = playerChar.hp;
    const boostedHp = Math.floor(baseHp * playerHpMultiplier);
    
    gameState.playerBaseHp = baseHp;
    
    gameState.player = {
        character: playerChar,
        x: -5,
        z: 0,
        health: boostedHp,
        maxHealth: boostedHp,
        baseHealth: baseHp,
        facing: 1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        parryCooldown: 0,
        parryAvailable: true,
        items: gameState.playerInventory,
        isBossFight: isBossFight
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
        document.getElementById('roundText').textContent = "FINAL BOSS";
        
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "677% HP BOOST ACTIVATED!";
            display.style.fontSize = "2rem";
            display.style.color = "#00ff00";
            display.classList.add('active');
            setTimeout(() => {
                display.textContent = "BRAINROT COMBO!";
                display.style.fontSize = "";
                display.style.color = "";
            }, 3000);
        }
        
        document.getElementById('p1Name').textContent = playerChar.name + " (677%)";
        document.getElementById('p1Name').style.color = "#00ff00";
        
        console.log('67 BOSS HP:', gameState.cpu.health, '(567% of base', cpuChar.hp + ')');
    } else {
        document.getElementById('p2Name').style.color = "";
        document.getElementById('roundText').textContent = `ROUND ${gameState.round}`;
        document.getElementById('p1Name').style.color = "";
    }
    
    document.getElementById('roundTimer').textContent = gameState.roundTime;
    
    updateHealthBars();
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    gameState.comboCount = 0;
    gameState.score = 0;
    
    console.log('Game started:', playerChar.name, 'vs', cpuChar.name);
    if (isBossFight) {
        console.log('Player HP:', boostedHp, '(677% of base', baseHp + ')');
        console.log('Boss HP:', gameState.cpu.health, '(567% of base', cpuChar.hp + ')');
    }
    
    animate();
}

// Player Attack
function doPlayerAttack(type) {
    if (!gameState.gameActive || gameState.player.attackCooldown > 0) return;
    
    if (gameState.player.parryCooldown > 0 && type !== 'parry') {
        return;
    }
    
    const target = gameState.onlineMode ? gameState.opponent : gameState.cpu;
    const distance = Math.abs(gameState.player.x - target.x);
    if (distance > 3 && type !== 'parry') return;
    
    gameState.player.attackCooldown = 20;
    
    if (gameState.onlineMode && window.onlineManager) {
        window.onlineManager.updateGameState({
            attack: type,
            playerPosition: gameState.player.x,
            playerHealth: gameState.player.health,
            timestamp: Date.now()
        });
    }
    
    if (gameState.cpu && gameState.cpu.memory) {
        gameState.cpu.lastPlayerMove = type;
        if (!gameState.cpu.memory.playerMoves[type]) {
            gameState.cpu.memory.playerMoves[type] = 0;
        }
        gameState.cpu.memory.playerMoves[type]++;
    }
    
    if (type === 'parry') {
        if (gameState.parryCooldownActive) {
            const display = document.getElementById('comboDisplay');
            if (display) {
                const timeLeft = Math.ceil((gameState.parryCooldownEnd - Date.now()) / 1000);
                display.textContent = `PARRY COOLDOWN: ${timeLeft}s`;
                display.classList.add('active');
                setTimeout(() => {
                    display.classList.remove('active');
                }, 1000);
            }
            return;
        }
        
        const healAmount = gameState.player.maxHealth * 0.10;
        const damageAmount = target.maxHealth * 0.20;
        
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
        target.health = Math.max(0, target.health - damageAmount);
        
        const cooldownTime = gameState.difficulty === 'sixtyseven' ? 2000 : 10000;
        
        gameState.player.parryCooldown = 90;
        gameState.parryCooldownActive = true;
        gameState.parryCooldownEnd = Date.now() + cooldownTime;
        
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
                    setTimeout(() => {
                        display.classList.remove('active');
                    }, 1000);
                }
            } else {
                parryButtons.forEach(btn => {
                    btn.textContent = timeLeft + 's';
                });
            }
        }, 1000);
        
        createParryEffect(gameState.player.x, 1, 0);
        applyDamageFlash('player', 0x00ff00);
        if (gameState.onlineMode) {
            applyDamageFlash('opponent');
        } else {
            applyDamageFlash('cpu');
        }
        
        updateHealthBars();
        
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "PERFECT PARRY! +10% HP";
            display.classList.add('active');
            setTimeout(() => {
                display.classList.remove('active');
            }, 1500);
        }
        
        return;
    }
    
    if (!gameState.onlineMode) {
        let parryChance = gameState.cpu.difficulty.parryChance;
        if (gameState.cpu.isBoss) {
            parryChance = 0.5;
        }
        
        if (gameState.cpu && Math.random() < parryChance) {
            createParryEffect(gameState.cpu.x, 1, 0);
            applyDamageFlash('cpu', 0x00ff00);
            
            if (Math.random() < 0.3 || gameState.difficulty === 'insane' || gameState.cpu.isBoss) {
                setTimeout(() => doCpuAttack('special'), 300);
            }
            
            return;
        }
    }
    
    if (window.playerModel) {
        window.playerModel.position.z = -0.5;
        setTimeout(() => {
            if (window.playerModel) window.playerModel.position.z = 0;
        }, 100);
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
    
    target.health = Math.max(0, target.health - damage);
    updateHealthBars();
    
    if (gameState.gameMode === 'practice') {
        gameState.practiceStats.damageDealt += damage;
        updatePracticeStats();
    }
    
    createBloodEffect(target.x, 1, 0);
    if (gameState.onlineMode) {
        applyDamageFlash('opponent');
    } else {
        applyDamageFlash('cpu');
    }
    
    if (window.cpuModel && !gameState.onlineMode) {
        const knockback = 0.3;
        window.cpuModel.position.x += knockback;
        setTimeout(() => {
            if (window.cpuModel) window.cpuModel.position.x -= knockback * 0.5;
        }, 100);
    }
    
    gameState.score += damage;
}

// Combo System
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
    
    const target = gameState.onlineMode ? gameState.opponent : gameState.cpu;
    
    if (!gameState.onlineMode) {
        let parryChance = gameState.cpu.difficulty.parryChance;
        if (gameState.cpu.isBoss) {
            parryChance = 0.5;
        }
        
        if (gameState.cpu && Math.random() < parryChance) {
            createParryEffect(gameState.cpu.x, 1, 0);
            applyDamageFlash('cpu', 0x00ff00);
            if (display) display.textContent = `${combo.name} PARRY!`;
        } else {
            target.health = Math.max(0, target.health - combo.damage);
            updateHealthBars();
            
            if (gameState.gameMode === 'practice') {
                gameState.practiceStats.comboCount++;
                gameState.practiceStats.damageDealt += combo.damage;
                updatePracticeStats();
            }
            
            gameState.score += combo.damage * gameState.comboCount;
            
            if (window.playerModel) {
                window.playerModel.position.z = -0.8;
                setTimeout(() => {
                    if (window.playerModel) window.playerModel.position.z = 0;
                }, 150);
            }
            
            createBloodEffect(target.x, 1, 0);
            if (gameState.onlineMode) {
                applyDamageFlash('opponent');
            } else {
                applyDamageFlash('cpu');
            }
            
            if (combo.damage > 100) {
                const canvas = document.getElementById('gameCanvas');
                if (canvas) {
                    const originalTransform = canvas.style.transform || '';
                    canvas.style.transform = 'translateX(-5px)';
                    setTimeout(() => {
                        canvas.style.transform = 'translateX(5px)';
                        setTimeout(() => {
                            canvas.style.transform = originalTransform;
                        }, 50);
                    }, 50);
                }
            }
            
            if (combo.damage > 100 && Math.random() > 0.7) {
                spawn67();
            }
        }
    } else {
        target.health = Math.max(0, target.health - combo.damage);
        updateHealthBars();
        gameState.score += combo.damage * gameState.comboCount;
        
        createBloodEffect(target.x, 1, 0);
        applyDamageFlash('opponent');
    }
    
    if (gameState.cpu && gameState.cpu.memory) {
        gameState.cpu.memory.dodgeChance = Math.min(0.6, gameState.cpu.memory.dodgeChance + 0.02);
    }
    
    setTimeout(() => {
        if (display) display.classList.remove('active');
    }, 1000);
}

// Animation Loop
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

// Update Game State
function update() {
    if (!gameState.player || (!gameState.cpu && !gameState.opponent)) return;
    
    if (gameState.player.attackCooldown > 0) gameState.player.attackCooldown--;
    if (gameState.cpu && gameState.cpu.attackCooldown > 0) gameState.cpu.attackCooldown--;
    if (gameState.player.parryCooldown > 0) gameState.player.parryCooldown--;
    if (gameState.bossSpecialAttackCooldown > 0) gameState.bossSpecialAttackCooldown--;
    
    if (gameState.cpu && gameState.cpu.isBoss) {
        gameState.bossStunTimer += 1;
        
        if (gameState.bossStunTimer >= 300) {
            gameState.isBossStunned = true;
            gameState.bossStunTimer = 0;
            
            const display = document.getElementById('comboDisplay');
            if (display) {
                display.textContent = "67 BOSS STUNNED!";
                display.classList.add('active');
                setTimeout(() => {
                    display.classList.remove('active');
                }, 500);
            }
            
            createStunEffect(gameState.cpu.x, 2, 0);
            
            setTimeout(() => {
                gameState.isBossStunned = false;
            }, 500);
        }
    }
    
    const currentTime = Date.now();
    if (currentTime - gameState.lastHealTime > 1000) {
        gameState.lastHealTime = currentTime;
        const healAmount = gameState.player.maxHealth * 0.01;
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
        updateHealthBars();
    }
    
    if (gameState.player.parryCooldown <= 0) {
        if (gameState.keys['arrowleft']) {
            gameState.player.x = Math.max(-8, gameState.player.x - 0.1);
            gameState.player.facing = -1;
            if (window.playerModel) {
                window.playerModel.position.x = gameState.player.x;
                window.playerModel.rotation.y = Math.PI;
            }
        }
        if (gameState.keys['arrowright']) {
            gameState.player.x = Math.min(8, gameState.player.x + 0.1);
            gameState.player.facing = 1;
            if (window.playerModel) {
                window.playerModel.position.x = gameState.player.x;
                window.playerModel.rotation.y = 0;
            }
        }
    }
    
    const target = gameState.onlineMode ? gameState.opponent : gameState.cpu;
    const distance = target.x - gameState.player.x;
    
    if (gameState.onlineMode) {
        if (window.cpuModel) {
            window.cpuModel.position.x = target.x;
            window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
        }
    } else if (gameState.cpu && gameState.cpu.isBoss && !gameState.isBossStunned) {
        updateBossAI();
    } else if (gameState.cpu && !gameState.cpu.isBoss) {
        if (Math.abs(distance) > 2.5) {
            gameState.cpu.x += (distance > 0 ? -0.05 : 0.05);
        }
        
        if (window.cpuModel) {
            window.cpuModel.position.x = gameState.cpu.x;
            window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
        }
        
        if (Math.random() < gameState.cpu.difficulty.aggression * 0.02 && 
            gameState.cpu.attackCooldown <= 0 && 
            Math.abs(distance) < 3) {
            
            const attackTypes = ['punch', 'kick', 'special'];
            const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
            doCpuAttack(attackType);
            
            gameState.cpu.attackCooldown = 25 / gameState.cpu.difficulty.aggression;
        }
    }
    
    if (gameState.player.stateTimer > 0) gameState.player.stateTimer--;
    if (gameState.cpu && gameState.cpu.stateTimer > 0) gameState.cpu.stateTimer--;
    
    if (gameState.roundTime > 0 && Math.random() < 0.01) {
        gameState.roundTime--;
        const timerElement = document.getElementById('roundTimer');
        if (timerElement) timerElement.textContent = gameState.roundTime;
    }
    
    if (gameState.player.health <= 0 || (target.health <= 0) || gameState.roundTime <= 0) {
        endRound();
    }
}

function updateBossAI() {
    const distance = gameState.cpu.x - gameState.player.x;
    
    if (Math.abs(distance) > 2.5) {
        gameState.cpu.x += (distance > 0 ? -0.08 : 0.08);
    }
    
    if (window.cpuModel) {
        window.cpuModel.position.x = gameState.cpu.x;
        window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
    }
    
    if (gameState.cpu.attackCooldown <= 0 && Math.abs(distance) < 4) {
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
    
    const distance = Math.abs(gameState.player.x - gameState.cpu.x);
    if (distance < 3) {
        const damage = 267;
        gameState.player.health = Math.max(0, gameState.player.health - damage);
        
        updateHealthBars();
        createBloodEffect(gameState.player.x, 1, 0);
        applyDamageFlash('player');
        
        console.log("STOMP HIT! 267 damage");
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
    
    const distance = Math.abs(gameState.player.x - gameState.cpu.x);
    if (distance < 2) {
        const damage = 267;
        gameState.player.health = Math.max(0, gameState.player.health - damage);
        
        updateHealthBars();
        createBloodEffect(gameState.player.x, 1, 0);
        applyDamageFlash('player');
        
        console.log("DASH HIT! 267 damage");
    }
    
    setTimeout(() => {
        gameState.cpu.x = originalX;
        if (window.cpuModel) {
            window.cpuModel.position.x = originalX;
        }
    }, 300);
}

function doCpuAttack(type) {
    if (gameState.onlineMode) return;
    
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
    
    if (gameState.cpu.isBoss) {
        damage = 267;
    } else {
        if (type === 'punch') {
            damage = (gameState.cpu.character.moves.punch + Math.floor(Math.random() * 8)) * difficulty.aggression;
        } else if (type === 'kick') {
            damage = (gameState.cpu.character.moves.kick + Math.floor(Math.random() * 8)) * difficulty.aggression;
        } else if (type === 'special') {
            damage = (gameState.cpu.character.moves.special + Math.floor(Math.random() * 12)) * difficulty.aggression;
        }
    }
    
    gameState.player.health = Math.max(0, gameState.player.health - damage);
    
    updateHealthBars();
    
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

// Render Game
function render() {
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

function updateHealthBars() {
    const p1Health = document.getElementById('p1Health');
    const p2Health = document.getElementById('p2Health');
    const p1HealthText = document.getElementById('p1HealthText');
    const p2HealthText = document.getElementById('p2HealthText');
    
    if (!p1Health || !p2Health || !p1HealthText || !p2HealthText) return;
    
    const target = gameState.onlineMode ? gameState.opponent : gameState.cpu;
    
    const p1Percent = gameState.player.health / gameState.player.maxHealth;
    const p2Percent = target.health / target.maxHealth;
    
    p1Health.style.width = `${p1Percent * 100}%`;
    p2Health.style.width = `${p2Percent * 100}%`;
    
    if (gameState.isBossFight) {
        p1HealthText.textContent = `${gameState.player.health}/${gameState.player.maxHealth}`;
    } else {
        p1HealthText.textContent = `${Math.round(p1Percent * 100)}%`;
    }
    p2HealthText.textContent = `${Math.round(p2Percent * 100)}%`;
    
    if (p1Percent < 0.3) {
        p1Health.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
    } else if (p1Percent < 0.6) {
        p1Health.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
    } else {
        p1Health.style.background = 'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
    }
    
    if (p2Percent < 0.3) {
        p2Health.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
    } else if (p2Percent < 0.6) {
        p2Health.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
    } else {
        p2Health.style.background = 'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
    }
}

function endRound() {
    gameState.gameActive = false;
    
    let message = "TIME OVER!";
    let isBossDefeated = false;
    const target = gameState.onlineMode ? gameState.opponent : gameState.cpu;
    
    if (gameState.player.health <= 0) {
        message = gameState.onlineMode ? "OPPONENT WINS!" : "CPU WINS!";
    } else if (target.health <= 0) {
        if (gameState.onlineMode) {
            message = "YOU WIN!";
            gameState.score += 1000;
            gameState.coins += 100;
            
            if (window.onlineManager) {
                window.onlineManager.submitScore(gameState.score);
            }
        } else {
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
                
                const secretCredit = document.getElementById('secretBossCredit');
                const bossMessage = document.getElementById('bossDefeatedMessage');
                if (secretCredit) secretCredit.style.display = 'block';
                if (bossMessage) bossMessage.style.display = 'block';
            }
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
    
    if (!gameState.onlineMode) {
        localStorage.setItem('cpuMemory', JSON.stringify(gameState.cpuMemory));
    }
    
    setTimeout(() => {
        if (isBossDefeated) {
            showBossDefeatedDialogue();
        } else if (gameState.gameMode === 'practice') {
            showScreen('practiceScreen');
        } else if (gameState.onlineMode) {
            alert(`${message}\nScore: ${gameState.score}\nCoins Earned: 100`);
            showScreen('onlineScreen');
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

function spawn67() {
    for (let i = 0; i < 15; i++) {
        setTimeout(() => {
            const element = document.createElement('div');
            element.className = 'secret-67';
            element.textContent = '67';
            element.style.left = `${Math.random() * 80 + 10}%`;
            element.style.top = `${Math.random() * 80 + 10}%`;
            document.body.appendChild(element);
            
            setTimeout(() => {
                element.remove();
            }, 2000);
        }, i * 100);
    }
}

function applyDamageFlash(character, color = 0xff0000) {
    let model;
    if (character === 'player') {
        model = window.playerModel;
    } else if (character === 'cpu') {
        model = window.cpuModel;
    } else if (character === 'opponent') {
        model = window.cpuModel;
    }
    
    if (!model) return;
    
    model.children.forEach(child => {
        if (child.material) {
            const originalColor = child.material.color.clone();
            child.material.color.set(color);
            
            setTimeout(() => {
                if (child.material) {
                    child.material.color.copy(originalColor);
                }
            }, 200);
        }
    });
}

function createParryEffect(x, y, z) {
    if (!window.scene) return;
    
    const parryGeometry = new THREE.RingGeometry(0.2, 0.5, 16);
    const parryMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x00ff00,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.8
    });
    
    const parry = new THREE.Mesh(parryGeometry, parryMaterial);
    parry.position.set(x, y, z);
    parry.rotation.x = Math.PI / 2;
    window.scene.add(parry);
    
    const startTime = Date.now();
    const duration = 500;
    
    function animateParry() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            parry.scale.set(1 + progress * 2, 1 + progress * 2, 1);
            parry.material.opacity = 0.8 * (1 - progress);
            requestAnimationFrame(animateParry);
        } else {
            window.scene.remove(parry);
        }
    }
    
    animateParry();
}

function createShockwaveEffect(x) {
    if (!window.scene) return;
    
    const shockwaveGeometry = new THREE.RingGeometry(0.5, 3, 32);
    const shockwaveMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0000,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7
    });
    
    const shockwave = new THREE.Mesh(shockwaveGeometry, shockwaveMaterial);
    shockwave.position.set(x, 0.1, 0);
    shockwave.rotation.x = Math.PI / 2;
    window.scene.add(shockwave);
    
    const startTime = Date.now();
    const duration = 1000;
    
    function animateShockwave() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            shockwave.scale.set(1 + progress * 3, 1 + progress * 3, 1);
            shockwave.material.opacity = 0.7 * (1 - progress);
            requestAnimationFrame(animateShockwave);
        } else {
            window.scene.remove(shockwave);
        }
    }
    
    animateShockwave();
}

function createDashEffect(fromX, toX) {
    if (!window.scene) return;
    
    const dashLineGeometry = new THREE.BoxGeometry(Math.abs(toX - fromX), 0.1, 0.1);
    const dashLineMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff0066,
        transparent: true,
        opacity: 0.8
    });
    
    const dashLine = new THREE.Mesh(dashLineGeometry, dashLineMaterial);
    dashLine.position.set((fromX + toX) / 2, 1, 0);
    window.scene.add(dashLine);
    
    const startTime = Date.now();
    const duration = 300;
    
    function animateDash() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            dashLine.material.opacity = 0.8 * (1 - progress);
            requestAnimationFrame(animateDash);
        } else {
            window.scene.remove(dashLine);
        }
    }
    
    animateDash();
}

function createStunEffect(x, y, z) {
    if (!window.scene) return;
    
    const stunGeometry = new THREE.SphereGeometry(1, 16, 16);
    const stunMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00,
        transparent: true,
        opacity: 0.5,
        wireframe: true
    });
    
    const stun = new THREE.Mesh(stunGeometry, stunMaterial);
    stun.position.set(x, y, z);
    window.scene.add(stun);
    
    const startTime = Date.now();
    const duration = 500;
    
    function animateStun() {
        const elapsed = Date.now() - startTime;
        const progress = elapsed / duration;
        
        if (progress < 1) {
            stun.scale.set(1 + Math.sin(progress * 10) * 0.2, 1 + Math.sin(progress * 10) * 0.2, 1 + Math.sin(progress * 10) * 0.2);
            stun.rotation.y += 0.1;
            stun.material.opacity = 0.5 * (1 - progress);
            requestAnimationFrame(animateStun);
        } else {
            window.scene.remove(stun);
        }
    }
    
    animateStun();
}

// Event Listeners
function setupEventListeners() {
    console.log('Setting up event listeners...');
    
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
    
    const buttons = [
        'arcadeBtn', 'practiceBtn', 'shopBtn', 'controlsBtn', 'updatesBtn', 'creditsBtn',
        'comboPracticeBtn', 'freePracticeBtn', 'dummySettingsBtn', 'practiceBackBtn',
        'backBtn', 'controlsBackBtn', 'shopBackBtn', 'updatesBackBtn', 'creditsBackBtn',
        'exitBattleBtn', 'confirmBtn',
        'onlineBtn', 'hostBtn', 'joinBtn', 'joinRoomBtn', 'joinBackBtn', 'readyBtn', 
        'startGameBtn', 'leaveRoomBtn', 'leaderboardBtn', 'leaderboardBackBtn', 'onlineBackBtn',
        'sendChatBtn', 'toggleChat'
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
    
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    const roomCodeInput = document.getElementById('roomCodeInput');
    if (roomCodeInput) {
        roomCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                joinRoomWithCode();
            }
        });
    }
    
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        gameState.keys[key] = true;
        
        if (['arrowleft', 'arrowright', 'z', 'x', 'a', 's', ' ', 'c'].includes(key)) {
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
        
        if (gameState.gameActive && gameState.player.attackCooldown <= 0) {
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
            showOnlineScreen();
            break;
        case 'practiceBtn':
            showScreen('practiceScreen');
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
        case 'comboPracticeBtn':
        case 'freePracticeBtn':
            gameState.gameMode = 'practice';
            showScreen('characterSelect');
            break;
        case 'dummySettingsBtn':
            alert('Dummy settings: CPU will not attack, perfect for combo practice!');
            break;
        case 'practiceBackBtn':
        case 'backBtn':
        case 'controlsBackBtn':
        case 'shopBackBtn':
        case 'updatesBackBtn':
        case 'creditsBackBtn':
        case 'onlineBackBtn':
        case 'leaderboardBackBtn':
            showScreen('mainMenu');
            break;
        case 'exitBattleBtn':
            if (gameState.onlineMode) {
                leaveOnlineRoom();
            } else {
                showScreen('characterSelect');
            }
            break;
        case 'confirmBtn':
            startBattle('arcade');
            break;
        case 'hostBtn':
            createOnlineRoom();
            break;
        case 'joinBtn':
            showScreen('joinRoom');
            break;
        case 'joinRoomBtn':
            joinRoomWithCode();
            break;
        case 'joinBackBtn':
            showScreen('onlineScreen');
            break;
        case 'readyBtn':
            toggleReady();
            break;
        case 'startGameBtn':
            startOnlineGameFromWaiting();
            break;
        case 'leaveRoomBtn':
            leaveOnlineRoom();
            break;
        case 'leaderboardBtn':
            showScreen('leaderboardScreen');
            break;
        case 'sendChatBtn':
            sendChatMessage();
            break;
        case 'toggleChat':
            toggleChat();
            break;
    }
}

// Initialize game when loaded
window.addEventListener('load', init);
