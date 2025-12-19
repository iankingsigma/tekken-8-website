// --- Pixel Tekken (Playable!) by ian kishk, ziad and aahil ---

// Global game state reference
let gameState = window.gameState || {};

// --- DOM and Game State ---
const $menu = document.getElementById("menu");
const $select = document.getElementById("select");
const $fightUI = document.getElementById("fightUI");
const $fighterList = document.getElementById("fighterList");
const $vsBtn = document.getElementById("vsBtn");
const $canvas = document.getElementById("canvas");
const ctx = $canvas ? $canvas.getContext("2d") : null;
const $stats = document.getElementById("fightStats");
const $controlsBar = document.getElementById("controls-bar");
let selected = null;

// Screen management
window.showMenu = function() {
    showScreen('mainMenu');
    selected = null;
};

window.showSelect = function() {
    showScreen('characterSelect');
    selected = null;
    renderSelect();
};

function renderSelect() {
    if (!CHARACTERS) return;
    
    let html = "";
    CHARACTERS.forEach((f, i) => {
        html += `<div class="char-card ${selected === i ? "selected" : ""}" tabindex="0" data-idx="${i}">
            <img src="${f.img}" class="char-img" alt="${f.name}">
            <div class="char-name">${f.name}</div>
            <span class="char-hp">HP: ${f.hp}</span>
            <div class="char-desc">${f.description}</div>
            <span class="char-punch">Punch: ${f.punch} &nbsp; Kick: ${f.kick} &nbsp; Combo: ${f.combo}</span>
        </div>`;
    });
    
    if ($fighterList) {
        $fighterList.innerHTML = html;
    }
    
    const pickTitle = document.querySelector("#pickTitles span");
    if (pickTitle) {
        pickTitle.innerText = "Player: " + (selected === null ? "Choose!" : CHARACTERS[selected].name);
    }
    
    document.querySelectorAll('.char-card').forEach(card => {
        card.onclick = function() {
            const charIdx = Number(card.getAttribute("data-idx"));
            selected = charIdx;
            renderSelect();
            showFightBtn();
        };
    });
    showFightBtn();
}

function showFightBtn() {
    if ($vsBtn) {
        $vsBtn.style.display = (selected !== null) ? "block" : "none";
    }
}

if ($vsBtn) {
    $vsBtn.onclick = startFightGame;
}

// ---- PLAYABLE FIGHT SYSTEM ----
let fightAnimRequest = null;
let keys = {};
let game = null;

// Key listener (real time controls)
window.addEventListener('keydown', e => {
    if (!game || game.over) return;
    keys[e.key.toLowerCase()] = true;
    performPlayerAction();
});

window.addEventListener('keyup', e => {
    keys[e.key.toLowerCase()] = false;
});

// Start fight and initialize game engine
function startFightGame() {
    if (selected === null || !CHARACTERS) return;
    
    showScreen('gameScreen');
    if ($controlsBar) $controlsBar.style.display = "flex";
    if ($stats) $stats.innerHTML = "";
    
    game = initGameState(selected, pickCpu());
    if (fightAnimRequest) cancelAnimationFrame(fightAnimRequest);
    fightAnimRequest = requestAnimationFrame(gameLoop);
}

function pickCpu() {
    if (!CHARACTERS) return 0;
    let cpuChoices = CHARACTERS.map((_, i) => i).filter(i => i !== selected);
    return cpuChoices[Math.floor(Math.random() * cpuChoices.length)];
}

// Main game state
function initGameState(youIdx, cpuIdx) {
    return {
        you: { ...CHARACTERS[youIdx] },
        cpu: { ...CHARACTERS[cpuIdx] },
        youX: 120,
        cpuX: 500,
        youHP: CHARACTERS[youIdx].hp,
        cpuHP: CHARACTERS[cpuIdx].hp,
        youDir: 1,
        cpuDir: -1,
        phase: "ready",
        timer: 0,
        lastMove: {},
        cpuCooldown: 0,
        anims: [],
        over: false
    };
}

// Main loop
function gameLoop() {
    renderFightCanvas();
    if (game.over) return;
    
    // CPU AI: move closer, attack when near, random action
    if (game.phase === "play") {
        if (game.cpuCooldown > 0) game.cpuCooldown--;
        let dx = game.cpuX - game.youX;
        if (Math.abs(dx) > 84) { // Move closer
            if (dx > 0) { 
                game.cpuX -= 5; 
            } else { 
                game.cpuX += 5; 
            }
            game.cpuDir = dx > 0 ? -1 : 1;
        }
        if (Math.abs(dx) <= 94 && game.cpuCooldown <= 0) {
            // Random attack: punch/kick/combo
            let move = Math.random();
            if (move < 0.5) doCpuAction("punch");
            else if (move < 0.81) doCpuAction("kick");
            else doCpuAction("combo");
            game.cpuCooldown = Math.floor(20 + Math.random() * 25);
        }
    }
    
    // Start phase
    if (game.phase === "ready") {
        game.timer++;
        if ($stats) $stats.innerHTML = "FIGHT! Use controls below to attack.";
        if (game.timer > 50) { game.phase = "play"; }
    }
    
    fightAnimRequest = requestAnimationFrame(gameLoop);
}

// Player controls
function performPlayerAction() {
    if (game.phase !== "play" || game.over) return;
    let acted = false;
    
    // Move
    if (keys["arrowleft"]) { 
        if (game.youX > 67) game.youX -= 12;
        game.youDir = -1;
        acted = true;
    }
    if (keys["arrowright"]) { 
        if (game.youX < 573) game.youX += 12;
        game.youDir = 1;
        acted = true;
    }
    
    // Attacks
    if (keys["z"]) { 
        doPlayerAction("punch"); 
        acted = true;
    }
    if (keys["x"]) { 
        doPlayerAction("kick"); 
        acted = true;
    }
    if (keys["c"]) { 
        doPlayerAction("combo"); 
        acted = true;
    }
    
    if (acted) renderFightCanvas();
}

function doPlayerAction(type) {
    if (game.over) return;
    let dx = Math.abs(game.youX - game.cpuX);
    if (dx > 90) return;
    doAttack("you", type);
}

function doCpuAction(type) {
    if (game.over) return;
    let dx = Math.abs(game.youX - game.cpuX);
    if (dx > 95) return;
    doAttack("cpu", type);
}

// Attack logic
function doAttack(from, type) {
    let attacker, defender;
    if (from === "you") {
        attacker = game.you; 
        defender = game.cpu; 
    } else {
        attacker = game.cpu; 
        defender = game.you; 
    }
    
    // Damage calculation
    let dmg = 0;
    let animColor = "#fff";
    if (type === "punch") {
        dmg = attacker.punch + Math.floor(Math.random() * 7) - 3;
        animColor = "#fbc531";
    } else if (type === "kick") {
        dmg = attacker.kick + Math.floor(Math.random() * 6) - 3;
        animColor = "#36d851";
    } else if (type === "combo") {
        dmg = attacker.combo + Math.floor(Math.random() * 8) - 5;
        animColor = "#ff0367";
    }
    dmg = Math.max(5, dmg);
    
    // Anim
    let fxX, fxY;
    if (from === "you") {
        fxX = game.cpuX;
        fxY = 210;
        game.lastMove = { type, dir: game.youDir, from: 'you' };
    } else {
        fxX = game.youX;
        fxY = 210;
        game.lastMove = { type, dir: game.cpuDir, from: 'cpu' };
    }
    game.anims.push({ fxX, fxY, animColor, type, frame: 0 });
    
    // Apply damage
    if (from === "you") {
        game.cpuHP -= dmg;
        if (game.cpu.name === "Character 67" && type === "combo") { 
            spam67(); 
        }
        if (game.cpuHP <= 0) {
            game.cpuHP = 0;
            game.over = true;
            if ($stats) $stats.innerHTML = `You Win! - ${attacker.name}`;
        }
    } else {
        game.youHP -= dmg;
        if (game.you.name === "Character 67" && type === "combo") { 
            spam67(); 
        }
        if (game.youHP <= 0) {
            game.youHP = 0;
            game.over = true;
            if ($stats) $stats.innerHTML = `CPU Wins! - ${attacker.name}`;
        }
    }
}

// Draw scene and fighters
function renderFightCanvas() {
    if (!$canvas || !ctx) return;
    ctx.clearRect(0, 0, $canvas.width, $canvas.height);
    
    // Arena/bar
    ctx.fillStyle = "#222237";
    ctx.fillRect(0, 0, $canvas.width, $canvas.height);
    ctx.fillStyle = "#c84141";
    ctx.fillRect(74, 260, 490, 16);
    ctx.fillStyle = "#888";
    ctx.fillRect(79, 276, 480, 7);
    
    // Fighters
    renderFighter(game.youX, 210, selected, game.youHP, game.lastMove && game.lastMove.from === "you" ? game.lastMove : null, game.youDir);
    renderFighter(game.cpuX, 210, pickCpu(), game.cpuHP, game.lastMove && game.lastMove.from === "cpu" ? game.lastMove : null, game.cpuDir);

    // HP bars
    ctx.save();
    ctx.fillStyle = "#212140";
    ctx.fillRect(88, 35, 160, 17);
    ctx.fillRect(392, 35, 160, 17);
    
    // Player
    if (CHARACTERS && CHARACTERS[selected]) {
        ctx.fillStyle = CHARACTERS[selected].color;
        ctx.fillRect(91, 39, Math.max(2, 156 * (game.youHP / CHARACTERS[selected].hp)), 13);
        ctx.fillStyle = "#fed";
        ctx.font = "bold 15px Orbitron";
        ctx.textAlign = "left";
        ctx.fillText(CHARACTERS[selected].name, 88, 31);
        ctx.textAlign = "right";
        ctx.fillText(Math.max(0, game.youHP) + " HP", 244, 49);
    }
    
    // CPU
    let cpuIdx = pickCpu();
    if (CHARACTERS && CHARACTERS[cpuIdx]) {
        ctx.fillStyle = CHARACTERS[cpuIdx].color;
        ctx.fillRect(395, 39, Math.max(2, 156 * (game.cpuHP / CHARACTERS[cpuIdx].hp)), 13);
        ctx.textAlign = "right";
        ctx.fillText(CHARACTERS[cpuIdx].name, 552, 31);
        ctx.textAlign = "left";
        ctx.fillText(Math.max(0, game.cpuHP) + " HP", 400, 49);
    }
    ctx.restore();

    // Animated hit FX
    for (let i = game.anims.length - 1; i >= 0; i--) {
        let fx = game.anims[i];
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - fx.frame / 8);
        ctx.font = fx.type === "combo" ? "bold 33px Orbitron" : "bold 27px Orbitron";
        ctx.fillStyle = fx.animColor;
        ctx.textAlign = "center";
        ctx.fillText(fx.type.toUpperCase(), fx.fxX, fx.fxY - (fx.frame * 7));
        ctx.restore();
        if (++fx.frame > 8) game.anims.splice(i, 1);
    }
}

// Draw pixel fighter with optional attack pose
function renderFighter(x, y, cIdx, hp, move, dir) {
    if (!CHARACTERS || !CHARACTERS[cIdx]) return;
    
    let f = CHARACTERS[cIdx];
    ctx.save();
    ctx.translate(x, y);
    if (dir < 0) ctx.scale(-1, 1);

    // Main body
    ctx.beginPath();
    ctx.arc(0, 0, 37, 0, 2 * Math.PI); 
    ctx.fillStyle = f.color;
    ctx.globalAlpha = 0.89;
    ctx.fill();

    // Hands/Gloves (move forward if punch/kick)
    let armOffset = move && (move.type === "punch" || move.type === "kick" || move.type === "combo") ? 32 : 19;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.arc(-armOffset, 35, 13, 0, 2 * Math.PI);
    ctx.arc(armOffset, 35, 13, 0, 2 * Math.PI);
    ctx.fillStyle = move && move.type === "kick" ? "#36d851" : "#e84118";
    ctx.fill();

    // Kick pose
    if (move && move.type === "kick") {
        ctx.save();
        ctx.rotate(0.28);
        ctx.fillStyle = "#36d851";
        ctx.fillRect(17, 52, 24, 8);
        ctx.restore();
        ctx.save();
        ctx.rotate(-0.35);
        ctx.fillStyle = "#d8f561";
        ctx.fillRect(-38, 56, 27, 7);
        ctx.restore();
    }
    
    // Combo pose
    if (move && move.type === "combo") {
        ctx.save();
        ctx.rotate(0.17);
        ctx.fillStyle = "#ff0367";
        ctx.fillRect(19, 51, 27, 7);
        ctx.restore();
        ctx.save();
        ctx.rotate(-0.22);
        ctx.fillStyle = "#ff0367";
        ctx.fillRect(-34, 54, 24, 7);
        ctx.restore();
    }
    
    // Draw avatar overlay (face/body image)
    let imgObj = new window.Image();
    imgObj.src = f.img;
    ctx.save();
    ctx.globalAlpha = 0.95;
    ctx.drawImage(imgObj, -33, -48, 66, 76);
    ctx.restore();
    
    // HP bar above
    ctx.save();
    ctx.fillStyle = "#212140";
    ctx.fillRect(-32, -58, 64, 10);
    ctx.fillStyle = f.color;
    ctx.fillRect(-32, -58, Math.max(2, 64 * (Math.max(0, hp) / f.hp)), 10);
    ctx.font = "bold 12px Orbitron";
    ctx.fillStyle = "#fbc531";
    ctx.textAlign = "center";
    ctx.fillText(hp + "", 0, -48);
    ctx.restore();

    ctx.restore();
}

// Meme 67 effect
function spam67() {
    for (let i = 0; i < 21; i++) {
        setTimeout(() => {
            const s = document.createElement('span');
            s.className = 'secret-67';
            s.textContent = '67';
            s.style.left = (Math.random() * window.innerWidth * 0.8) + 'px';
            s.style.top = (Math.random() * window.innerHeight * 0.8) + 'px';
            document.body.appendChild(s);
            setTimeout(() => s.remove(), 1100 + Math.random() * 600);
        }, Math.random() * 800);
    }
}

// Screen management function
function showScreen(screenId) {
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        gameState.currentScreen = screenId;
    }
}

// Setup event listeners
function setupEventListeners() {
    // Main menu buttons
    const arcadeBtn = document.getElementById('arcadeBtn');
    if (arcadeBtn) {
        arcadeBtn.addEventListener('click', () => {
            gameState.gameMode = 'arcade';
            showScreen('characterSelect');
        });
    }
    
    const practiceBtn = document.getElementById('practiceBtn');
    if (practiceBtn) {
        practiceBtn.addEventListener('click', () => {
            gameState.gameMode = 'practice';
            showScreen('characterSelect');
        });
    }
    
    const shopBtn = document.getElementById('shopBtn');
    if (shopBtn) {
        shopBtn.addEventListener('click', () => {
            showScreen('shopScreen');
            if (typeof loadShopItems === 'function') {
                loadShopItems();
            }
        });
    }
    
    const controlsBtn = document.getElementById('controlsBtn');
    if (controlsBtn) {
        controlsBtn.addEventListener('click', () => {
            showScreen('controlsScreen');
        });
    }
    
    const updatesBtn = document.getElementById('updatesBtn');
    if (updatesBtn) {
        updatesBtn.addEventListener('click', () => {
            showScreen('updatesScreen');
        });
    }
    
    const creditsBtn = document.getElementById('creditsBtn');
    if (creditsBtn) {
        creditsBtn.addEventListener('click', () => {
            showScreen('creditsScreen');
        });
    }
    
    // Back buttons
    const backBtns = document.querySelectorAll('[id$="BackBtn"]');
    backBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            showScreen('mainMenu');
        });
    });
    
    // Device detection buttons
    const forceTablet = document.getElementById('forceTablet');
    if (forceTablet) {
        forceTablet.addEventListener('click', () => {
            gameState.deviceType = 'tablet';
            document.getElementById('deviceType').textContent = 'TABLET MODE';
            showScreen('loading');
            simulateLoading();
        });
    }
    
    const forceDesktop = document.getElementById('forceDesktop');
    if (forceDesktop) {
        forceDesktop.addEventListener('click', () => {
            gameState.deviceType = 'desktop';
            document.getElementById('deviceType').textContent = 'DESKTOP MODE';
            showScreen('loading');
            simulateLoading();
        });
    }
    
    // Exit battle button
    const exitBattleBtn = document.getElementById('exitBattleBtn');
    if (exitBattleBtn) {
        exitBattleBtn.addEventListener('click', () => {
            if (fightAnimRequest) {
                cancelAnimationFrame(fightAnimRequest);
            }
            showScreen('mainMenu');
        });
    }
}

// Character selection
function renderCharacterSelect() {
    const characterGrid = document.getElementById('characterGrid');
    const previewName = document.getElementById('previewName');
    const previewStyle = document.getElementById('previewStyle');
    const previewDesc = document.getElementById('previewDesc');
    const confirmBtn = document.getElementById('confirmBtn');
    
    if (!characterGrid || !CHARACTERS) return;
    
    characterGrid.innerHTML = '';
    
    CHARACTERS.forEach((character, index) => {
        const card = document.createElement('div');
        card.className = 'character-card';
        card.innerHTML = `
            <div class="character-icon" style="background-color: ${character.color}">${character.icon}</div>
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
                    <div class="stat-value">${character.moves.special}</div>
                    <div class="stat-label">SPECIAL</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => {
            // Remove previous selection
            document.querySelectorAll('.character-card').forEach(c => c.classList.remove('selected'));
            card.classList.add('selected');
            
            // Update preview
            if (previewName) previewName.textContent = character.name;
            if (previewStyle) previewStyle.textContent = character.style;
            if (previewDesc) previewDesc.textContent = character.description;
            
            gameState.selectedCharacter = index;
            
            if (confirmBtn) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = 'FIGHT!';
            }
        });
        
        characterGrid.appendChild(card);
    });
    
    // Confirm button handler
    if (confirmBtn) {
        confirmBtn.addEventListener('click', () => {
            if (gameState.selectedCharacter !== null) {
                const difficulty = document.getElementById('difficultySelect').value;
                gameState.difficulty = difficulty;
                
                // Check for boss fights
                if (difficulty === 'boss67') {
                    gameState.isBossFight = true;
                    gameState.cpu = { ...BOSS_67 };
                    startBossCutscene();
                } else if (difficulty === 'boss21') {
                    gameState.isBossFight = true;
                    gameState.cpu = { ...BOSS_21 };
                    startBoss21Cutscene();
                } else {
                    gameState.isBossFight = false;
                    startGame();
                }
            }
        });
    }
}

// Start game function
function startGame() {
    if (gameState.selectedCharacter === null || !CHARACTERS) return;
    
    showScreen('gameScreen');
    
    // Initialize Three.js if available
    if (typeof initThreeJS === 'function') {
        initThreeJS();
    }
    
    // Set up player and CPU
    gameState.player = {
        character: CHARACTERS[gameState.selectedCharacter],
        x: -5,
        health: CHARACTERS[gameState.selectedCharacter].hp,
        maxHealth: CHARACTERS[gameState.selectedCharacter].hp,
        facing: 1,
        attackCooldown: 0,
        state: 'idle',
        stateTimer: 0
    };
    
    // Set up CPU based on difficulty
    const difficulty = DIFFICULTIES[gameState.difficulty] || DIFFICULTIES.medium;
    
    if (gameState.difficulty === 'boss67') {
        gameState.cpu = {
            character: BOSS_67,
            x: 5,
            health: BOSS_67.hp,
            maxHealth: BOSS_67.hp,
            facing: -1,
            attackCooldown: 0,
            state: 'idle',
            stateTimer: 0,
            difficulty: difficulty,
            isBoss: true,
            memory: { playerMoves: {} }
        };
    } else if (gameState.difficulty === 'boss21') {
        gameState.cpu = {
            character: BOSS_21,
            x: 5,
            health: BOSS_21.hp,
            maxHealth: BOSS_21.hp,
            facing: -1,
            attackCooldown: 0,
            state: 'idle',
            stateTimer: 0,
            difficulty: difficulty,
            isBoss: true,
            isTurnBased: true,
            memory: { playerMoves: {} }
        };
    } else {
        const cpuCharIndex = Math.floor(Math.random() * CHARACTERS.length);
        gameState.cpu = {
            character: CHARACTERS[cpuCharIndex],
            x: 5,
            health: CHARACTERS[cpuCharIndex].hp,
            maxHealth: CHARACTERS[cpuCharIndex].hp,
            facing: -1,
            attackCooldown: 0,
            state: 'idle',
            stateTimer: 0,
            difficulty: difficulty,
            memory: { playerMoves: {} }
        };
    }
    
    gameState.gameActive = true;
    gameState.roundTime = 99;
    gameState.playerFakeHP = 100;
    gameState.playerRealHP = 100;
    
    // Apply shop effects
    if (typeof applyShopEffects === 'function') {
        applyShopEffects();
    }
    
    // Start the game loop
    animate();
    
    // Start round timer
    const timerInterval = setInterval(() => {
        if (!gameState.gameActive) {
            clearInterval(timerInterval);
            return;
        }
        
        gameState.roundTime--;
        const timerElement = document.getElementById('roundTimer');
        if (timerElement) {
            timerElement.textContent = gameState.roundTime;
        }
        
        if (gameState.roundTime <= 0) {
            gameState.gameActive = false;
            clearInterval(timerInterval);
            endGame();
        }
    }, 1000);
    
    // Update health bars
    updateHealthBars();
}

// Game animation loop
function animate() {
    if (!gameState.gameActive) return;
    
    // Update player and CPU positions
    if (window.playerModel && gameState.player) {
        window.playerModel.position.x = gameState.player.x;
    }
    
    if (window.cpuModel && gameState.cpu) {
        window.cpuModel.position.x = gameState.cpu.x;
        window.cpuModel.rotation.y = gameState.cpu.facing > 0 ? 0 : Math.PI;
    }
    
    // Update cooldowns
    if (gameState.player) {
        if (gameState.player.attackCooldown > 0) {
            gameState.player.attackCooldown--;
        }
        if (gameState.player.stateTimer > 0) {
            gameState.player.stateTimer--;
        } else {
            gameState.player.state = 'idle';
        }
    }
    
    if (gameState.cpu) {
        if (gameState.cpu.attackCooldown > 0) {
            gameState.cpu.attackCooldown--;
        }
        if (gameState.cpu.stateTimer > 0) {
            gameState.cpu.stateTimer--;
        } else {
            gameState.cpu.state = 'idle';
        }
    }
    
    // Boss AI
    if (gameState.isBossFight && gameState.cpu && gameState.cpu.isBoss) {
        if (typeof updateBossAI === 'function') {
            updateBossAI();
        }
    } else {
        // Regular CPU AI
        updateCpuAI();
    }
    
    // Check for game end
    if (gameState.player && gameState.player.health <= 0) {
        endGame('cpu');
        return;
    }
    
    if (gameState.cpu && gameState.cpu.health <= 0) {
        endGame('player');
        return;
    }
    
    requestAnimationFrame(animate);
}

// Regular CPU AI
function updateCpuAI() {
    if (!gameState.cpu || !gameState.player) return;
    
    const distance = gameState.cpu.x - gameState.player.x;
    const absDistance = Math.abs(distance);
    
    // Movement
    if (absDistance > 3 && gameState.cpu.state === 'idle') {
        if (distance > 0) {
            gameState.cpu.x -= 0.05;
        } else {
            gameState.cpu.x += 0.05;
        }
        gameState.cpu.facing = distance > 0 ? -1 : 1;
    }
    
    // Attacking
    if (absDistance < 4 && gameState.cpu.attackCooldown <= 0) {
        const difficulty = gameState.cpu.difficulty;
        const parryChance = difficulty.parryChance;
        
        // Check if player is attacking (for parry)
        if (Math.random() < parryChance && gameState.player.state === 'attack') {
            // CPU parries
            createParryEffect(gameState.cpu.x, 1, 0);
            applyDamageFlash('cpu', 0x00ff00);
            
            // Counter-attack
            setTimeout(() => doCpuAttack('special'), 300);
            return;
        }
        
        // Regular attack
        const attackTypes = ['punch', 'kick', 'special'];
        const weights = [0.4, 0.4, 0.2];
        
        let random = Math.random();
        let attackType = 'punch';
        let cumulative = 0;
        
        for (let i = 0; i < weights.length; i++) {
            cumulative += weights[i];
            if (random < cumulative) {
                attackType = attackTypes[i];
                break;
            }
        }
        
        doCpuAttack(attackType);
        gameState.cpu.attackCooldown = 30 / difficulty.aggression;
    }
}

// CPU attack function
function doCpuAttack(type) {
    if (!gameState.cpu || !gameState.player) return;
    
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

// Update health bars
function updateHealthBars() {
    if (!gameState.player || !gameState.cpu) return;
    
    const p1Health = document.getElementById('p1Health');
    const p1HealthText = document.getElementById('p1HealthText');
    const p2Health = document.getElementById('p2Health');
    const p2HealthText = document.getElementById('p2HealthText');
    
    if (p1Health) {
        const playerHealthPercent = (gameState.player.health / gameState.player.maxHealth) * 100;
        p1Health.style.width = playerHealthPercent + '%';
    }
    
    if (p1HealthText) {
        p1HealthText.textContent = Math.ceil(gameState.player.health) + '/' + gameState.player.maxHealth;
    }
    
    if (p2Health) {
        const cpuHealthPercent = (gameState.cpu.health / gameState.cpu.maxHealth) * 100;
        p2Health.style.width = cpuHealthPercent + '%';
    }
    
    if (p2HealthText) {
        p2HealthText.textContent = Math.ceil(gameState.cpu.health) + '/' + gameState.cpu.maxHealth;
    }
}

// End game function
function endGame(winner) {
    gameState.gameActive = false;
    
    if (winner === 'player') {
        // Player won
        gameState.coins += 50;
        gameState.score += 100;
        
        if (gameState.score > gameState.highScore) {
            gameState.highScore = gameState.score;
            localStorage.setItem('brainrotHighScore', gameState.highScore);
        }
        
        localStorage.setItem('brainrotCoins', gameState.coins);
        
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "YOU WIN! +50 COINS";
            display.classList.add('active');
        }
        
        // Check for boss unlock
        if (gameState.difficulty === 'insane' && CHARACTERS[gameState.selectedCharacter].id === 67) {
            gameState.bossUnlocked = true;
            localStorage.setItem('boss67Unlocked', 'true');
        }
    } else {
        // CPU won
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "CPU WINS!";
            display.classList.add('active');
        }
    }
    
    setTimeout(() => {
        showScreen('mainMenu');
        if (display) display.classList.remove('active');
    }, 3000);
}

// Check boss unlock status
function checkBossUnlock() {
    const bossUnlockInfo = document.getElementById('bossUnlockInfo');
    const bossUnlockedInfo = document.getElementById('bossUnlockedInfo');
    const bossWarningInfo = document.getElementById('bossWarningInfo');
    
    if (gameState.bossUnlocked) {
        if (bossUnlockInfo) bossUnlockInfo.style.display = 'none';
        if (bossUnlockedInfo) bossUnlockedInfo.style.display = 'block';
        if (bossWarningInfo) bossWarningInfo.style.display = 'block';
    } else {
        if (bossUnlockInfo) bossUnlockInfo.style.display = 'block';
        if (bossUnlockedInfo) bossUnlockedInfo.style.display = 'none';
        if (bossWarningInfo) bossWarningInfo.style.display = 'none';
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing game...');
    
    // Initialize game state
    if (typeof init === 'function') {
        init();
    }
    
    // Setup event listeners
    setupEventListeners();
    
    // Render character select
    renderCharacterSelect();
    
    // Check boss unlock status
    checkBossUnlock();
    
    // Start loading simulation
    simulateLoading();
});

// Make functions globally available
window.showMenu = showMenu;
window.showSelect = showSelect;
window.startFightGame = startFightGame;
window.showScreen = showScreen;
window.renderCharacterSelect = renderCharacterSelect;
