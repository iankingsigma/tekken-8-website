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
    highScore: localStorage.getItem('brainrotHighScore') || 0,
    deviceType: 'desktop',
    gameMode: 'arcade',
    cpuLearning: {},
    practiceStats: {
        comboCount: 0,
        damageDealt: 0,
        startTime: 0
    }
};

// Initialize Game
function init() {
    document.getElementById('highScore').textContent = gameState.highScore;
    detectDevice();
    setupEventListeners();
    renderCharacterSelect();
}

// Device Detection
function detectDevice() {
    const isTablet = /iPad|Android|Tablet/i.test(navigator.userAgent) || 
                    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    
    gameState.deviceType = isTablet ? 'tablet' : 'desktop';
    document.getElementById('deviceType').textContent = 
        gameState.deviceType === 'tablet' ? 'TABLET MODE' : 'DESKTOP MODE';
    
    // Show/hide versus mode based on device
    const versusBtn = document.getElementById('versusBtn');
    versusBtn.style.display = gameState.deviceType === 'tablet' ? 'block' : 'none';
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
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    gameState.currentScreen = screenId;
    
    if (screenId === 'gameScreen') {
        initThreeJS();
        startGame();
    } else if (screenId === 'practiceScreen') {
        startPracticeMode();
    }
    
    // Show/hide touch controls
    const touchControls = document.getElementById('touchControls');
    if (touchControls) {
        touchControls.classList.toggle('active', 
            screenId === 'gameScreen' && gameState.deviceType === 'tablet');
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
function startBattle(mode = 'arcade') {
    if (gameState.selectedCharacter === null) return;
    gameState.gameMode = mode;
    showScreen('gameScreen');
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
    document.getElementById('practiceComboCount').textContent = gameState.practiceStats.comboCount;
    document.getElementById('practiceDamage').textContent = gameState.practiceStats.damageDealt;
    const elapsed = Math.floor((Date.now() - gameState.practiceStats.startTime) / 1000);
    document.getElementById('practiceTime').textContent = `${elapsed}s`;
}

// Game Setup
function startGame() {
    const playerChar = CHARACTERS[gameState.selectedCharacter];
    let cpuChar;
    
    if (gameState.gameMode === 'versus') {
        // For versus mode, use second player's selected character
        cpuChar = CHARACTERS[(gameState.selectedCharacter + 1) % CHARACTERS.length];
    } else {
        // For arcade/practice, pick random CPU
        const cpuIndex = (gameState.selectedCharacter + Math.floor(Math.random() * (CHARACTERS.length - 1)) + 1) % CHARACTERS.length;
        cpuChar = CHARACTERS[cpuIndex];
    }
    
    // Initialize CPU learning if not exists
    if (!gameState.cpuLearning[gameState.selectedCharacter]) {
        gameState.cpuLearning[gameState.selectedCharacter] = {
            dodgeChance: 0.1,
            counterChance: 0.1,
            comboPrediction: 0.1
        };
    }
    
    gameState.player = {
        character: playerChar,
        x: -5,
        y: 0,
        z: 0,
        health: playerChar.hp,
        facing: 1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0
    };
    
    gameState.cpu = {
        character: cpuChar,
        x: 5,
        y: 0,
        z: 0,
        health: cpuChar.hp,
        facing: -1,
        state: 'idle',
        stateTimer: 0,
        attackCooldown: 0,
        learning: gameState.cpuLearning[gameState.selectedCharacter]
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
    // Device detection buttons
    document.getElementById('forceTablet').addEventListener('click', () => {
        gameState.deviceType = 'tablet';
        document.getElementById('deviceType').textContent = 'TABLET MODE';
        document.getElementById('versusBtn').style.display = 'block';
        simulateLoading();
    });
    
    document.getElementById('forceDesktop').addEventListener('click', () => {
        gameState.deviceType = 'desktop';
        document.getElementById('deviceType').textContent = 'DESKTOP MODE';
        document.getElementById('versusBtn').style.display = 'none';
        simulateLoading();
    });
    
    // Menu buttons
    document.getElementById('arcadeBtn').addEventListener('click', () => showScreen('characterSelect'));
    document.getElementById('versusBtn').addEventListener('click', () => {
        if (gameState.deviceType === 'tablet') {
            startBattle('versus');
        }
    });
    document.getElementById('practiceBtn').addEventListener('click', () => showScreen('practiceScreen'));
    document.getElementById('controlsBtn').addEventListener('click', () => showScreen('controlsScreen'));
    
    // Practice mode buttons
    document.getElementById('comboPracticeBtn').addEventListener('click', () => {
        gameState.gameMode = 'practice';
        showScreen('characterSelect');
    });
    document.getElementById('freePracticeBtn').addEventListener('click', () => {
        gameState.gameMode = 'practice';
        showScreen('characterSelect');
    });
    document.getElementById('dummySettingsBtn').addEventListener('click', () => {
        alert('Dummy settings: CPU will not attack, perfect for combo practice!');
    });
    document.getElementById('practiceBackBtn').addEventListener('click', () => showScreen('mainMenu'));
    
    // Navigation buttons
    document.getElementById('backBtn').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('controlsBackBtn').addEventListener('click', () => showScreen('mainMenu'));
    document.getElementById('exitBattleBtn').addEventListener('click', () => showScreen('characterSelect'));
    document.getElementById('confirmBtn').addEventListener('click', () => startBattle('arcade'));
    
    // Game controls
    document.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        gameState.keys[key] = true;
        
        // Add to combo sequence
        if (['arrowleft', 'arrowright', 'arrowup', 'arrowdown', 'z', 'x', 'a', 's', ' ', 'c'].includes(key)) {
            const keyMap = {
                'arrowleft': 'left',
                'arrowright': 'right',
                'arrowup': 'up',
                'arrowdown': 'down',
                'z': 'punch',
                'x': 'punch',
                'a': 'kick',
                's': 'kick',
                ' ': 'block',
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
        
        // Player attacks
        if (gameState.gameActive && gameState.player.attackCooldown <= 0) {
            if (key === 'z' || key === 'x') {
                doPlayerAttack('punch');
            } else if (key === 'a' || key === 's') {
                doPlayerAttack('kick');
            } else if (key === ' ') {
                doPlayerAttack('block');
            } else if (key === 'c') {
                doPlayerAttack('special');
            }
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

// Player Attack
function doPlayerAttack(type) {
    if (!gameState.gameActive || gameState.player.attackCooldown > 0) return;
    
    const distance = Math.abs(gameState.player.x - gameState.cpu.x);
    if (distance > 3) return; // Too far to attack
    
    gameState.player.attackCooldown = 20;
    
    // Attack animation
    if (window.playerModel) {
        // Lean forward for attack
        window.playerModel.position.z = -0.5;
        setTimeout(() => {
            if (window.playerModel) window.playerModel.position.z = 0;
        }, 100);
    }
    
    // Calculate damage
    let damage = 0;
    if (type === 'punch') {
        damage = gameState.player.character.moves.punch + Math.floor(Math.random() * 10);
    } else if (type === 'kick') {
        damage = gameState.player.character.moves.kick + Math.floor(Math.random() * 10);
    } else if (type === 'special') {
        damage = gameState.player.character.moves.special + Math.floor(Math.random() * 15);
    } else if (type === 'block') {
        // Block reduces incoming damage
        return;
    }
    
    // Apply damage to CPU
    gameState.cpu.health = Math.max(0, gameState.cpu.health - damage);
    updateHealthBars();
    
    // Update practice stats
    if (gameState.gameMode === 'practice') {
        gameState.practiceStats.damageDealt += damage;
        updatePracticeStats();
    }
    
    // Visual effects
    createBloodEffect(gameState.cpu.x, 1, 0);
    applyDamageFlash('cpu');
    
    // Knockback
    if (window.cpuModel) {
        const knockback = 0.3;
        window.cpuModel.position.x += knockback;
        setTimeout(() => {
            if (window.cpuModel) window.cpuModel.position.x -= knockback * 0.5;
        }, 100);
    }
    
    // Add to score
    gameState.score += damage;
}

// Combo System
function checkCombos() {
    if (!gameState.player) return;
    
    const character = gameState.player.character;
    
    // Random brainrot combo for spamming
    if (gameState.combo.length >= 3 && Math.random() > 0.7) {
        executeRandomCombo();
        gameState.combo = [];
        return;
    }
    
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
    display.textContent = `${combo.name} x${gameState.comboCount}`;
    display.classList.add('active');
    
    // Apply damage to CPU
    gameState.cpu.health = Math.max(0, gameState.cpu.health - combo.damage);
    updateHealthBars();
    
    // Update practice stats
    if (gameState.gameMode === 'practice') {
        gameState.practiceStats.comboCount++;
        gameState.practiceStats.damageDealt += combo.damage;
        updatePracticeStats();
    }
    
    // Add to score
    gameState.score += combo.damage * gameState.comboCount;
    
    // Visual effects
    if (window.playerModel) {
        // Attack animation
        window.playerModel.position.z = -0.8;
        setTimeout(() => {
            if (window.playerModel) window.playerModel.position.z = 0;
        }, 150);
    }
    
    // Blood effect at CPU position
    createBloodEffect(gameState.cpu.x, 1, 0);
    
    // Damage flash on CPU
    applyDamageFlash('cpu');
    
    // Screen shake for powerful combos
    if (combo.damage > 100) {
        const canvas = document.getElementById('gameCanvas');
        const originalTransform = canvas.style.transform || '';
        canvas.style.transform = 'translateX(-5px)';
        setTimeout(() => {
            canvas.style.transform = 'translateX(5px)';
            setTimeout(() => {
                canvas.style.transform = originalTransform;
            }, 50);
        }, 50);
    }
    
    // Secret 67 effect for high damage combos
    if (combo.damage > 100 && Math.random() > 0.7) {
        spawn67();
    }
    
    // CPU learning - increase dodge chance
    if (gameState.cpu.learning) {
        gameState.cpu.learning.dodgeChance = Math.min(0.5, gameState.cpu.learning.dodgeChance + 0.05);
        gameState.cpu.learning.counterChance = Math.min(0.4, gameState.cpu.learning.counterChance + 0.03);
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
    
    // Update cooldowns
    if (gameState.player.attackCooldown > 0) gameState.player.attackCooldown--;
    if (gameState.cpu.attackCooldown > 0) gameState.cpu.attackCooldown--;
    
    // Player movement with up/down
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
    if (gameState.keys['arrowup']) {
        gameState.player.y = Math.min(2, gameState.player.y + 0.1);
        if (window.playerModel) {
            window.playerModel.position.y = gameState.player.y;
        }
    }
    if (gameState.keys['arrowdown']) {
        gameState.player.y = Math.max(-1, gameState.player.y - 0.1);
        if (window.playerModel) {
            window.playerModel.position.y = gameState.player.y;
        }
    }
    
    // CPU AI with learning
    const distance = gameState.cpu.x - gameState.player.x;
    const verticalDistance = gameState.cpu.y - gameState.player.y;
    
    // CPU movement with vertical tracking
    if (Math.abs(distance) > 2.5) {
        gameState.cpu.x += (distance > 0 ? -0.05 : 0.05);
    }
    
    if (Math.abs(verticalDistance) > 0.5) {
        gameState.cpu.y += (verticalDistance > 0 ? -0.03 : 0.03);
    }
    
    if (window.cpuModel) {
        window.cpuModel.position.x = gameState.cpu.x;
        window.cpuModel.position.y = gameState.cpu.y;
        window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
    }
    
    // Smarter CPU attacks with learning
    if (Math.random() < 0.02 && gameState.cpu.attackCooldown <= 0 && Math.abs(distance) < 3) {
        // Use learned behavior
        const shouldDodge = Math.random() < gameState.cpu.learning.dodgeChance;
        const shouldCounter = Math.random() < gameState.cpu.learning.counterChance;
        
        if (shouldDodge) {
            // Dodge movement
            gameState.cpu.x += (Math.random() > 0.5 ? 1 : -1) * 2;
            gameState.cpu.y += (Math.random() > 0.5 ? 0.5 : -0.5);
        } else if (shouldCounter && gameState.player.attackCooldown > 0) {
            // Counter attack when player is vulnerable
            doCpuAttack('special');
        } else {
            // Normal attack
            const attackTypes = ['punch', 'kick', 'special'];
            const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
            doCpuAttack(attackType);
        }
        
        gameState.cpu.attackCooldown = 25;
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

function doCpuAttack(type) {
    gameState.cpu.state = 'attack';
    gameState.cpu.stateTimer = 20;
    
    // CPU attack animation
    if (window.cpuModel) {
        window.cpuModel.position.z = -0.5;
        setTimeout(() => {
            if (window.cpuModel) window.cpuModel.position.z = 0;
        }, 100);
    }
    
    // CPU damage calculation (stronger in later rounds)
    let damage = 0;
    const roundMultiplier = 1 + (gameState.round - 1) * 0.2;
    
    if (type === 'punch') {
        damage = (gameState.cpu.character.moves.punch + Math.floor(Math.random() * 8)) * roundMultiplier;
    } else if (type === 'kick') {
        damage = (gameState.cpu.character.moves.kick + Math.floor(Math.random() * 8)) * roundMultiplier;
    } else if (type === 'special') {
        damage = (gameState.cpu.character.moves.special + Math.floor(Math.random() * 12)) * roundMultiplier;
    }
    
    // Apply damage to player
    gameState.player.health = Math.max(0, gameState.player.health - damage);
    updateHealthBars();
    
    // Visual feedback
    applyDamageFlash('player');
    createBloodEffect(gameState.player.x, 1, 0);
    
    // Knockback
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
    const p1Percent = gameState.player.health / gameState.player.character.hp;
    const p2Percent = gameState.cpu.health / gameState.cpu.character.hp;
    
    document.getElementById('p1Health').style.width = `${p1Percent * 100}%`;
    document.getElementById('p2Health').style.width = `${p2Percent * 100}%`;
    
    document.getElementById('p1HealthText').textContent = `${Math.round(p1Percent * 100)}%`;
    document.getElementById('p2HealthText').textContent = `${Math.round(p2Percent * 100)}%`;
    
    // Change health bar color based on health
    const p1HealthBar = document.getElementById('p1Health');
    const p2HealthBar = document.getElementById('p2Health');
    
    if (p1Percent < 0.3) {
        p1HealthBar.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
    } else if (p1Percent < 0.6) {
        p1HealthBar.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
    } else {
        p1HealthBar.style.background = 'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
    }
    
    if (p2Percent < 0.3) {
        p2HealthBar.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
    } else if (p2Percent < 0.6) {
        p2HealthBar.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
    } else {
        p2HealthBar.style.background = 'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
    }
}

function endRound() {
    gameState.gameActive = false;
    
    let message = "TIME OVER!";
    if (gameState.player.health <= 0) {
        message = "CPU WINS!";
        // CPU learns from victory
        if (gameState.cpu.learning) {
            gameState.cpu.learning.dodgeChance = Math.min(0.6, gameState.cpu.learning.dodgeChance + 0.1);
            gameState.cpu.learning.counterChance = Math.min(0.5, gameState.cpu.learning.counterChance + 0.08);
        }
    } else if (gameState.cpu.health <= 0) {
        message = "PLAYER WINS!";
        gameState.score += 1000;
        
        // Update high score
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('brainrotHighScore', gameState.highScore);
            document.getElementById('highScore').textContent = gameState.highScore;
        }
        
        spawn67(); // Victory 67 effect
    }
    
    setTimeout(() => {
        if (gameState.gameMode === 'practice') {
            showScreen('practiceScreen');
        } else {
            alert(`${message}\nScore: ${gameState.score}`);
            showScreen('characterSelect');
        }
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

// Damage flash effect
function applyDamageFlash(character) {
    if (character === 'player' && window.playerModel) {
        // Store original colors
        if (!window.playerOriginalColors) {
            window.playerOriginalColors = [];
            window.playerModel.children.forEach(child => {
                if (child.material) {
                    window.playerOriginalColors.push(child.material.color.clone());
                }
            });
        }
        
        // Flash red
        window.playerModel.children.forEach((child, index) => {
            if (child.material && window.playerOriginalColors[index]) {
                child.material.color.set(0xff0000);
            }
        });
        
        // Reset after delay
        setTimeout(() => {
            if (window.playerModel && window.playerOriginalColors) {
                window.playerModel.children.forEach((child, index) => {
                    if (child.material && window.playerOriginalColors[index]) {
                        child.material.color.copy(window.playerOriginalColors[index]);
                    }
                });
            }
        }, 200);
    } else if (character === 'cpu' && window.cpuModel) {
        // Store original colors
        if (!window.cpuOriginalColors) {
            window.cpuOriginalColors = [];
            window.cpuModel.children.forEach(child => {
                if (child.material) {
                    window.cpuOriginalColors.push(child.material.color.clone());
                }
            });
        }
        
        // Flash red
        window.cpuModel.children.forEach((child, index) => {
            if (child.material && window.cpuOriginalColors[index]) {
                child.material.color.set(0xff0000);
            }
        });
        
        // Reset after delay
        setTimeout(() => {
            if (window.cpuModel && window.cpuOriginalColors) {
                window.cpuModel.children.forEach((child, index) => {
                    if (child.material && window.cpuOriginalColors[index]) {
                        child.material.color.copy(window.cpuOriginalColors[index]);
                    }
                });
            }
        }, 200);
    }
}

// Initialize game when loaded
window.addEventListener('load', init);
