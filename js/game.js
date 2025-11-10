// Game State
let gameState = {
    currentScreen: 'loading',
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
    highScore: localStorage.getItem('tekkenHighScore') || 0
};

// Initialize Game
function init() {
    document.getElementById('highScore').textContent = gameState.highScore;
    simulateLoading();
    setupEventListeners();
    renderCharacterSelect();
}

// Simulate loading progress
function simulateLoading() {
    let progress = 0;
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');
    const stages = [
        "INITIALIZING 3D ENGINE...",
        "LOADING CHARACTER DATA...",
        "SETTING UP ARENA...",
        "CALIBRATING CONTROLS...",
        "READY TO FIGHT!"
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
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
    
    if (screenId === 'gameScreen') {
        initThreeJS();
        startGame();
    }
}

// Character Selection
function renderCharacterSelect() {
    const grid = document.getElementById('characterGrid');
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
            
            // Update preview
            document.getElementById('previewName').textContent = character.name;
            document.getElementById('previewStyle').textContent = character.style;
            document.getElementById('previewDesc').textContent = character.description;
            document.getElementById('previewModel').textContent = character.icon;
            document.getElementById('previewModel').style.borderColor = character.color;
        });
        
        grid.appendChild(card);
    });
}

// Start Battle
function startBattle() {
    if (gameState.selectedCharacter === null) return;
    showScreen('gameScreen');
}

// Game Setup
function startGame() {
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    const cpuIndex = (gameState.selectedCharacter + 1) % CHARACTERS.length;
    const cpuChar = CHARACTERS[cpuIndex];
    
    gameState.player = {
        character: playerChar,
        x: -3,
        y: 1,
        z: 0,
        health: playerChar.hp,
        facing: 1,
        state: 'idle',
        stateTimer: 0
    };
    
    gameState.cpu = {
        character: cpuChar,
        x: 3,
        y: 1,
        z: 0,
        health: cpuChar.hp,
        facing: -1,
        state: 'idle',
        stateTimer: 0
    };
    
    updateHealthBars();
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    gameState.comboCount = 0;
    
    // Start game loop
    animate();
}

// Event Listeners
function setupEventListeners() {
    // Menu buttons
    document.getElementById('arcadeBtn').addEventListener('click', () => showScreen('characterSelect'));
    document.getElementById('versusBtn').addEventListener('click', () => alert('Versus mode coming soon!'));
    document.getElementById('practiceBtn').addEventListener('click', () => alert('Practice mode coming soon!'));
    document.getElementById('controlsBtn').addEventListener('click', () => showScreen('controlsScreen'));
    document.getElementById('galleryBtn').addEventListener('click', () => alert('Gallery coming soon!'));
    
    // Navigation buttons
    document.getElementById('backBtn').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('controlsBackBtn').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('exitBattleBtn').addEventListener('click', () => showScreen('characterSelect'));
    document.getElementById('confirmBtn').addEventListener('click', startBattle);
    
    // Game controls
    document.addEventListener('keydown', (e) => {
        gameState.keys[e.key.toLowerCase()] = true;
        
        // Add to combo sequence
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'z', 'x', 'a', 's'].includes(e.key.toLowerCase())) {
            const keyMap = {
                'arrowleft': 'left',
                'arrowright': 'right',
                'arrowup': 'up',
                'arrowdown': 'down',
                'z': 'punch',
                'x': 'punch',
                'a': 'kick',
                's': 'kick'
            };
            
            const currentTime = Date.now();
            if (currentTime - gameState.lastKeyTime > 1000) {
                gameState.combo = [];
            }
            
            gameState.combo.push(keyMap[e.key.toLowerCase()]);
            gameState.lastKeyTime = currentTime;
            
            checkCombos();
        }
    });
    
    document.addEventListener('keyup', (e) => {
        gameState.keys[e.key.toLowerCase()] = false;
    });

    // Handle window resize
    window.addEventListener('resize', () => {
        if (window.camera && window.renderer) {
            const canvas = document.getElementById('gameCanvas');
            window.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            window.camera.updateProjectionMatrix();
            window.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    });
}

// Combo System
function checkCombos() {
    if (!gameState.player) return;
    
    const character = gameState.player.character;
    
    for (const combo of character.combos) {
        if (gameState.combo.length < combo.input.length) continue;
        
        const recentInput = gameState.combo.slice(-combo.input.length);
        if (JSON.stringify(recentInput) === JSON.stringify(combo.input)) {
            // Combo successful!
            executeCombo(combo);
            gameState.combo = [];
            break;
        }
    }
}

function executeCombo(combo) {
    gameState.comboCount++;
    const display = document.getElementById('comboDisplay');
    display.textContent = `${combo.name} x${gameState.comboCount}`;
    display.classList.add('active');
    
    // Apply damage to CPU
    gameState.cpu.health = Math.max(0, gameState.cpu.health - combo.damage);
    updateHealthBars();
    
    // Add to score
    gameState.score += combo.damage * gameState.comboCount;
    
    // Visual effects
    if (window.playerModel) {
        window.playerModel.scale.set(1.2, 1.2, 1.2);
        setTimeout(() => {
            window.playerModel.scale.set(1, 1, 1);
        }, 100);
    }
    
    // Secret 67 effect for high damage combos
    if (combo.damage > 100 && Math.random() > 0.7) {
        spawn67();
    }
    
    setTimeout(() => {
        display.classList.remove('active');
    }, 1000);
}

// Animation Loop
function animate() {
    if (!gameState.gameActive) return;
    
    requestAnimationFrame(animate);
    
    const delta = window.clock.getDelta();
    
    update();
    render();
    
    // Update Three.js animations
    if (window.mixerPlayer) window.mixerPlayer.update(delta);
    if (window.mixerCpu) window.mixerCpu.update(delta);
}

// Update Game State
function update() {
    if (!gameState.player || !gameState.cpu) return;
    
    // Player movement
    if (gameState.keys['arrowleft']) {
        gameState.player.x = Math.max(-8, gameState.player.x - 0.1);
        gameState.player.facing = -1;
        if (window.playerModel) window.playerModel.rotation.y = Math.PI;
    }
    if (gameState.keys['arrowright']) {
        gameState.player.x = Math.min(8, gameState.player.x + 0.1);
        gameState.player.facing = 1;
        if (window.playerModel) window.playerModel.rotation.y = 0;
    }
    
    // Update player model position
    if (window.playerModel) {
        window.playerModel.position.x = gameState.player.x;
    }
    
    // CPU AI (simple)
    const distance = gameState.cpu.x - gameState.player.x;
    if (Math.abs(distance) > 2) {
        gameState.cpu.x += (distance > 0 ? -0.05 : 0.05);
        if (window.cpuModel) {
            window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
        }
    }
    
    // Update CPU model position
    if (window.cpuModel) {
        window.cpuModel.position.x = gameState.cpu.x;
    }
    
    // Random CPU attacks
    if (Math.random() < 0.02) {
        gameState.cpu.state = 'attack';
        gameState.cpu.stateTimer = 20;
        
        // Simple CPU damage
        if (Math.abs(distance) < 3) {
            gameState.player.health = Math.max(0, gameState.player.health - 30);
            updateHealthBars();
            
            // Visual feedback
            if (window.playerModel) {
                window.playerModel.position.x += gameState.cpu.facing * 0.5;
            }
        }
    }
    
    // Update state timers
    if (gameState.player.stateTimer > 0) gameState.player.stateTimer--;
    if (gameState.cpu.stateTimer > 0) gameState.cpu.stateTimer--;
    
    // Round timer
    if (gameState.roundTime > 0 && Math.random() < 0.01) {
        gameState.roundTime--;
        document.getElementById('roundTimer').textContent = gameState.roundTime;
    }
    
    // Check win conditions
    if (gameState.player.health <= 0 || gameState.cpu.health <= 0 || gameState.roundTime <= 0) {
        endRound();
    }
}

// Render Game
function render() {
    if (window.renderer && window.scene && window.camera) {
        window.renderer.render(window.scene, window.camera);
    }
}

function updateHealthBars() {
    const p1Percent = gameState.player.health / gameState.player.character.hp;
    const p2Percent = gameState.cpu.health / gameState.cpu.character.hp;
    
    document.getElementById('p1Health').style.width = `${p1Percent * 100}%`;
    document.getElementById('p2Health').style.width = `${p2Percent * 100}%`;
    
    document.getElementById('p1HealthText').textContent = `${Math.round(p1Percent * 100)}%`;
    document.getElementById('p2HealthText').textContent = `${Math.round(p2Percent * 100)}%`;
}

function endRound() {
    gameState.gameActive = false;
    
    let message = "TIME OVER!";
    if (gameState.player.health <= 0) {
        message = "CPU WINS!";
    } else if (gameState.cpu.health <= 0) {
        message = "PLAYER WINS!";
        gameState.score += 1000;
        
        // Update high score
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('tekkenHighScore', gameState.highScore);
            document.getElementById('highScore').textContent = gameState.highScore;
        }
        
        spawn67(); // Victory 67 effect
    }
    
    setTimeout(() => {
        alert(`${message}\nScore: ${gameState.score}`);
        showScreen('characterSelect');
    }, 1000);
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

// Initialize game when loaded
window.addEventListener('load', init);
