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
    
    // Add 67 difficulty if boss is unlocked
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
            
            // Show boss unlock info
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
    
    // Check if this is a boss fight
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
    
    // Update guest slot
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
    
    // Update opponent position and game state
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
    
    // For online mode, we create a placeholder opponent that will be updated via Firebase
    const opponentChar = CHARACTERS[0]; // Default opponent character
    
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
    
    // Start listening to chat
    if (window.onlineManager) {
        window.onlineManager.listenToChat();
    }
    
    animate();
}

// Modified doPlayerAttack for online mode
function doPlayerAttack(type) {
    if (!gameState.gameActive || gameState.player.attackCooldown > 0) return;
    
    if (gameState.player.parryCooldown > 0 && type !== 'parry') {
        return;
    }
    
    const distance = Math.abs(gameState.player.x - (gameState.onlineMode ? gameState.opponent.x : gameState.cpu.x));
    if (distance > 3 && type !== 'parry') return;
    
    gameState.player.attackCooldown = 20;
    
    // Online mode: Send attack to opponent
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
    
    // PARRY SYSTEM WITH HEALING + DAMAGE + COOLDOWN
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
        
        const target = gameState.onlineMode ? gameState.opponent : gameState.cpu;
        const healAmount = gameState.player.maxHealth * 0.10;
        const damageAmount = target.maxHealth * 0.20;
        
        gameState.player.health = Math.min(gameState.player.maxHealth, gameState.player.health + healAmount);
        target.health = Math.max(0, target.health - damageAmount);
        
        // Set parry cooldown
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
    
    // For online mode, skip CPU parry logic
    if (!gameState.onlineMode) {
        // BOSS SPECIFIC: 50% parry chance (BUFFED)
        let parryChance = gameState.cpu.difficulty.parryChance;
        if (gameState.cpu.isBoss) {
            parryChance = 0.5; // 50% parry chance for boss (BUFFED)
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
    
    const target = gameState.onlineMode ? gameState.opponent : gameState.cpu;
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

// [Rest of the original game.js code remains the same - including startGame, checkCombos, executeCombo, animate, update, render, etc.]

// Update event listeners for online mode
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
        // Online mode buttons
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
    
    // Chat input enter key
    const chatInput = document.getElementById('chatInput');
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    }
    
    // Room code input
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
        // Online mode
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

// [Rest of the file remains the same - all the original functions like startGame, checkCombos, executeCombo, animate, update, render, etc.]

// Initialize game when loaded
window.addEventListener('load', init);
