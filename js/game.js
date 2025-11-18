// js/game.js - Brainrot Fighters v5.0 Complete Rewrite
class BrainrotGame {
    constructor() {
        this.state = {
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
            secondLifeUsed: false,
            bossPhase: 0,
            bossStunCooldown: 0,
            bossTotalTime: 0,
            currentBackground: localStorage.getItem('selectedBackground') || 'default',
            adminActive: false,
            musicStarted: false
        };

        this.BOSS_CUTSCENE_TEXTS = [
            "THE LEGEND OF 67...",
            "A FORCE BEYOND COMPREHENSION...",
            "IT CORRUPTS EVERYTHING IT TOUCHES...",
            "YOU CANNOT DEFEAT IT...",
            "YOU CAN ONLY SURVIVE...",
            "BUT EVEN IN DARKNESS...",
            "THERE IS HOPE...",
            "A SECOND CHANCE AWAITS...",
            "WHEN ALL SEEMS LOST...",
            "THE FIGHT CONTINUES...",
            "BEGIN!"
        ];

        this.DIFFICULTY_SETTINGS = {
            easy: { cpuHpMultiplier: 0.8, parryChance: 0.2, aggression: 0.3, learningRate: 0.1 },
            medium: { cpuHpMultiplier: 1.0, parryChance: 0.5, aggression: 0.6, learningRate: 0.3 },
            hard: { cpuHpMultiplier: 1.3, parryChance: 0.8, aggression: 0.9, learningRate: 0.5 },
            insane: { cpuHpMultiplier: 1.5, parryChance: 1.0, aggression: 1.0, learningRate: 0.8 },
            sixtyseven: { cpuHpMultiplier: 2.5, parryChance: 0.0, aggression: 1.2, learningRate: 0.9, isBoss: true }
        };

        this.init();
    }

    init() {
        console.log('Initializing Brainrot Fighters v5.0...');
        this.setupEventListeners();
        this.loadBackground();
        this.updateUI();
        this.startMenuMusic();
        
        if (typeof initOnlineSystem === 'function') {
            setTimeout(initOnlineSystem, 1000);
        }
    }

    setupEventListeners() {
        // Device detection
        document.getElementById('forceTablet')?.addEventListener('click', () => this.setDeviceType('tablet'));
        document.getElementById('forceDesktop')?.addEventListener('click', () => this.setDeviceType('desktop'));

        // Navigation buttons
        const buttons = [
            'arcadeBtn', 'practiceBtn', 'shopBtn', 'controlsBtn', 'updatesBtn', 'creditsBtn',
            'onlineBtn', 'backBtn', 'controlsBackBtn', 'shopBackBtn', 'updatesBackBtn', 
            'creditsBackBtn', 'exitBattleBtn', 'confirmBtn', 'onlineBackBtn'
        ];

        buttons.forEach(btnId => {
            document.getElementById(btnId)?.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleButtonClick(btnId);
            });
        });

        // Character selection
        document.getElementById('difficultySelect')?.addEventListener('change', (e) => {
            this.state.difficulty = e.target.value;
            this.updateBossWarning();
        });

        // Keyboard controls
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Window resize
        window.addEventListener('resize', () => this.handleResize());
    }

    setDeviceType(type) {
        this.state.deviceType = type;
        document.getElementById('deviceType').textContent = type === 'tablet' ? 'TABLET MODE' : 'DESKTOP MODE';
        this.simulateLoading();
    }

    simulateLoading() {
        let progress = 0;
        const loadingBar = document.getElementById('loadingBar');
        const loadingText = document.getElementById('loadingText');
        const stages = [
            "INITIALIZING BRAINROT ENGINE v5.0...",
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
                setTimeout(() => this.showScreen('mainMenu'), 500);
            }
            
            loadingBar.style.width = `${progress}%`;
            loadingText.textContent = stages[Math.min(Math.floor(progress / 20), stages.length - 1)];
        }, 200);
    }

    showScreen(screenId) {
        console.log('Showing screen:', screenId);
        
        // Hide all screens
        document.querySelectorAll('.screen').forEach(screen => {
            screen.classList.remove('active');
        });

        // Show target screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.add('active');
            this.state.currentScreen = screenId;
        }

        // Screen-specific setup
        switch(screenId) {
            case 'mainMenu':
                this.startMenuMusic();
                break;
            case 'characterSelect':
                this.renderCharacterSelect();
                break;
            case 'gameScreen':
                this.startGame();
                break;
            case 'shopScreen':
                setTimeout(() => {
                    if (typeof loadShopItems === 'function') loadShopItems('characters');
                }, 100);
                break;
            case 'onlineScreen':
                if (typeof showOnlineMainScreen === 'function') showOnlineMainScreen();
                break;
        }

        // Touch controls
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            touchControls.classList.toggle('active', 
                screenId === 'gameScreen' && this.state.deviceType === 'tablet');
        }
    }

    renderCharacterSelect() {
        const grid = document.getElementById('characterGrid');
        const difficultySelect = document.getElementById('difficultySelect');
        
        if (!grid) return;

        // Add boss difficulty option if unlocked
        if (this.state.bossUnlocked && difficultySelect) {
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
            
            card.addEventListener('click', () => this.selectCharacter(index));
            grid.appendChild(card);
        });

        this.updateBossWarning();
    }

    selectCharacter(index) {
        document.querySelectorAll('.character-card').forEach(c => {
            c.classList.remove('selected');
        });
        
        const cards = document.querySelectorAll('.character-card');
        if (cards[index]) cards[index].classList.add('selected');
        
        this.state.selectedCharacter = index;
        document.getElementById('confirmBtn').disabled = false;

        const character = CHARACTERS[index];
        document.getElementById('previewName').textContent = character.name;
        document.getElementById('previewStyle').textContent = character.style;
        document.getElementById('previewDesc').textContent = character.description;
        document.getElementById('previewModel').textContent = character.icon;
        document.getElementById('previewModel').style.borderColor = character.color;

        this.updateBossWarning();
    }

    updateBossWarning() {
        const bossUnlockInfo = document.getElementById('bossUnlockInfo');
        const bossUnlockedInfo = document.getElementById('bossUnlockedInfo');
        const bossWarningInfo = document.getElementById('bossWarningInfo');
        
        if (!bossUnlockInfo || !bossUnlockedInfo || !bossWarningInfo) return;

        if (this.state.bossUnlocked) {
            bossUnlockInfo.style.display = 'none';
            bossUnlockedInfo.style.display = 'block';
            
            const difficulty = document.getElementById('difficultySelect').value;
            if (difficulty === 'sixtyseven' && this.state.selectedCharacter !== null && 
                CHARACTERS[this.state.selectedCharacter].id === 67) {
                bossWarningInfo.style.display = 'block';
            } else {
                bossWarningInfo.style.display = 'none';
            }
        } else {
            bossUnlockInfo.style.display = 'block';
            bossUnlockedInfo.style.display = 'none';
            bossWarningInfo.style.display = 'none';
        }
    }

    handleButtonClick(btnId) {
        switch(btnId) {
            case 'arcadeBtn':
                this.showScreen('characterSelect');
                break;
            case 'onlineBtn':
                this.showScreen('onlineScreen');
                break;
            case 'practiceBtn':
                this.showScreen('characterSelect');
                this.state.gameMode = 'practice';
                break;
            case 'shopBtn':
                this.showScreen('shopScreen');
                break;
            case 'controlsBtn':
                this.showScreen('controlsScreen');
                break;
            case 'updatesBtn':
                this.showScreen('updatesScreen');
                break;
            case 'creditsBtn':
                this.showScreen('creditsScreen');
                break;
            case 'backBtn':
            case 'controlsBackBtn':
            case 'shopBackBtn':
            case 'updatesBackBtn':
            case 'creditsBackBtn':
            case 'onlineBackBtn':
                this.showScreen('mainMenu');
                break;
            case 'exitBattleBtn':
                this.showScreen('characterSelect');
                break;
            case 'confirmBtn':
                this.startBattle();
                break;
        }
    }

    startBattle() {
        if (this.state.selectedCharacter === null) {
            alert('Please select a character first!');
            return;
        }

        this.state.gameMode = this.state.gameMode || 'arcade';
        this.state.difficulty = document.getElementById('difficultySelect').value;
        
        this.state.isBossFight = (this.state.difficulty === 'sixtyseven' && 
                                CHARACTERS[this.state.selectedCharacter].id === 67);

        this.showScreen('gameScreen');
    }

    startGame() {
        console.log('Starting game...');
        
        if (this.state.selectedCharacter === null) {
            this.showScreen('characterSelect');
            return;
        }

        const playerChar = CHARACTERS[this.state.selectedCharacter];
        const difficulty = this.DIFFICULTY_SETTINGS[this.state.difficulty];

        let cpuChar;
        if (this.state.isBossFight) {
            cpuChar = BOSS_67;
            console.log('BOSS SURVIVAL MODE INITIATED!');
            this.startBossCutscene();
        } else {
            let cpuIndex;
            do {
                cpuIndex = Math.floor(Math.random() * CHARACTERS.length);
            } while (cpuIndex === this.state.selectedCharacter && CHARACTERS.length > 1);
            cpuChar = CHARACTERS[cpuIndex];
        }

        // Initialize game state
        this.initializeGameState(playerChar, cpuChar, difficulty);

        if (!this.state.cutsceneActive) {
            this.startGameLoop();
        }
    }

    initializeGameState(playerChar, cpuChar, difficulty) {
        const memoryKey = `${this.state.selectedCharacter}_${this.state.difficulty}`;
        if (!this.state.cpuMemory[memoryKey]) {
            this.state.cpuMemory[memoryKey] = {
                playerMoves: {punch: 1, kick: 1, special: 1, parry: 1},
                comboPatterns: {},
                dodgeChance: 0.1,
                counterChance: 0.1,
                fights: 0
            };
        }

        const cpuMemory = this.state.cpuMemory[memoryKey];
        cpuMemory.fights++;

        // Reset battle state
        this.state.parryCooldownActive = false;
        this.state.parryCooldownEnd = 0;
        this.state.bossSpecialAttackCooldown = 0;
        this.state.bossStunTimer = 0;
        this.state.isBossStunned = false;
        this.state.bossSelfDamageTimer = 0;
        this.state.playerHiddenHealTimer = 0;
        this.state.playerFakeHP = 100;
        this.state.playerRealHP = 100;
        this.state.survivalPhase = 0;
        this.state.secondLifeUsed = false;
        this.state.bossPhase = 0;
        this.state.bossStunCooldown = 0;
        this.state.bossTotalTime = 0;
        this.state.musicStarted = false;

        // Initialize player
        this.state.player = {
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
            items: this.state.playerInventory
        };

        // Initialize CPU
        this.state.cpu = {
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
            isBoss: this.state.isBossFight
        };

        // Update UI
        document.getElementById('p1Name').textContent = playerChar.name;
        document.getElementById('p2Name').textContent = this.state.isBossFight ? "67 BOSS" : cpuChar.name;
        
        if (this.state.isBossFight) {
            document.getElementById('p2Name').style.color = "#ff0000";
            document.getElementById('roundText').textContent = "SURVIVAL MODE";
        } else {
            document.getElementById('p2Name').style.color = "";
            document.getElementById('roundText').textContent = `ROUND ${this.state.round || 1}`;
        }

        document.getElementById('roundTimer').textContent = this.state.roundTime;

        this.updateHealthBars();
        this.state.gameActive = true;
        this.state.roundTime = 99;
        this.state.comboCount = 0;
        this.state.score = 0;

        // Reset parry buttons
        const parryButtons = document.querySelectorAll('[data-action="parry"]');
        parryButtons.forEach(btn => {
            btn.disabled = false;
            btn.style.opacity = '1';
            btn.style.background = 'rgba(100, 255, 100, 0.7)';
            btn.textContent = 'PARRY';
        });

        console.log('Game started:', playerChar.name, 'vs', this.state.isBossFight ? '67 BOSS' : cpuChar.name);
    }

    startBossCutscene() {
        this.state.cutsceneActive = true;
        this.state.cutsceneTimer = 0;
        this.state.cutsceneTextIndex = 0;
        this.state.currentCutsceneText = "";

        // Dim game elements
        document.getElementById('gameCanvas').style.opacity = '0.3';
        document.querySelector('.hud').style.opacity = '0.3';
        document.getElementById('touchControls').style.opacity = '0.3';

        // Create or show cutscene overlay
        let cutsceneOverlay = document.getElementById('cutsceneOverlay');
        if (!cutsceneOverlay) {
            cutsceneOverlay = document.createElement('div');
            cutsceneOverlay.id = 'cutsceneOverlay';
            cutsceneOverlay.style.cssText = `
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: rgba(0,0,0,0.8); display: flex; flex-direction: column;
                justify-content: center; align-items: center; z-index: 50;
                color: #ffcc00; font-size: 3rem; text-align: center; padding: 2rem;
            `;
            
            const cutsceneText = document.createElement('div');
            cutsceneText.id = 'cutsceneText';
            cutsceneText.style.cssText = `
                font-size: 3rem; text-shadow: 0 0 10px #ff0033;
                letter-spacing: 3px; line-height: 1.5; max-width: 80%;
            `;
            
            cutsceneOverlay.appendChild(cutsceneText);
            document.getElementById('gameScreen').appendChild(cutsceneOverlay);
        } else {
            cutsceneOverlay.style.display = 'flex';
        }

        this.animateCutscene();
    }

    animateCutscene() {
        if (!this.state.cutsceneActive) return;
        
        this.state.cutsceneTimer++;
        const totalCutsceneTime = 1900; // 19 seconds at ~100fps
        
        const cutsceneText = document.getElementById('cutsceneText');
        const textDuration = Math.floor(totalCutsceneTime / this.BOSS_CUTSCENE_TEXTS.length);
        
        // Calculate current text index
        const currentTextIndex = Math.floor(this.state.cutsceneTimer / textDuration);
        
        if (currentTextIndex < this.BOSS_CUTSCENE_TEXTS.length) {
            if (currentTextIndex !== this.state.cutsceneTextIndex) {
                this.state.cutsceneTextIndex = currentTextIndex;
                this.state.currentCutsceneText = this.BOSS_CUTSCENE_TEXTS[currentTextIndex];
                cutsceneText.textContent = this.state.currentCutsceneText;
                cutsceneText.style.opacity = '1';
            }
            
            // Fade effect
            const textProgress = (this.state.cutsceneTimer % textDuration) / textDuration;
            if (textProgress > 0.8) {
                cutsceneText.style.opacity = (1 - (textProgress - 0.8) * 5).toString();
            } else if (textProgress < 0.2) {
                cutsceneText.style.opacity = (textProgress * 5).toString();
            } else {
                cutsceneText.style.opacity = '1';
            }
        } else {
            // End cutscene
            cutsceneText.style.opacity = Math.max(0, 1 - (this.state.cutsceneTimer - totalCutsceneTime) / 500).toString();
            
            if (this.state.cutsceneTimer > totalCutsceneTime + 500) {
                this.endCutscene();
            }
        }
        
        requestAnimationFrame(() => this.animateCutscene());
    }

    endCutscene() {
        this.state.cutsceneActive = false;
        
        const cutsceneOverlay = document.getElementById('cutsceneOverlay');
        if (cutsceneOverlay) {
            cutsceneOverlay.style.display = 'none';
        }
        
        document.getElementById('gameCanvas').style.opacity = '1';
        document.querySelector('.hud').style.opacity = '1';
        document.getElementById('touchControls').style.opacity = '1';

        // Start boss music
        this.startBossMusic();

        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "SURVIVE! Boss defeats itself every 5s";
            display.classList.add('active');
            setTimeout(() => {
                display.classList.remove('active');
            }, 3000);
        }

        this.startGameLoop();
    }

    startGameLoop() {
        // Initialize Three.js if available
        if (typeof initThreeJS === 'function') {
            setTimeout(() => {
                initThreeJS();
                this.gameLoop();
            }, 100);
        } else {
            this.gameLoop();
        }
    }

    gameLoop() {
        if (!this.state.gameActive) return;

        this.update();
        this.render();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (!this.state.player || !this.state.cpu || this.state.cutsceneActive) return;

        // Admin system checks
        if (window.adminSystem) {
            window.adminSystem.checkInfiniteHP();
            window.adminSystem.checkInfiniteParry();
            window.adminSystem.checkOneHitKill();
        }

        // Update cooldowns
        if (this.state.player.attackCooldown > 0) this.state.player.attackCooldown--;
        if (this.state.cpu.attackCooldown > 0) this.state.cpu.attackCooldown--;
        if (this.state.player.parryCooldown > 0) this.state.player.parryCooldown--;
        if (this.state.bossSpecialAttackCooldown > 0) this.state.bossSpecialAttackCooldown--;

        // Boss-specific updates
        if (this.state.isBossFight) {
            this.updateBossMechanics();
        } else {
            this.updateNormalCPUBattle();
        }

        // Player movement
        this.updatePlayerMovement();

        // Round timer
        if (this.state.roundTime > 0 && Math.random() < 0.01) {
            this.state.roundTime--;
            document.getElementById('roundTimer').textContent = this.state.roundTime;
        }

        // Check round end
        if (this.state.player.health <= 0 || this.state.cpu.health <= 0 || this.state.roundTime <= 0) {
            this.endRound();
        }
    }

    updateBossMechanics() {
        this.state.bossTotalTime++;
        this.state.bossSelfDamageTimer++;

        // Update boss timer display
        this.updateBossTimer();

        // 40-second stun cycle
        if (this.state.bossStunCooldown <= 0) {
            this.state.bossStunCooldown = 2400; // 40 seconds at 60fps
            this.state.isBossStunned = true;
            this.state.bossStunTimer = 1200; // 20 seconds

            this.createBossStunEffect();

            const display = document.getElementById('comboDisplay');
            if (display) {
                display.textContent = "67 BOSS STUNNED! - SAFE FOR 20s";
                display.classList.add('active');
                setTimeout(() => {
                    display.classList.remove('active');
                }, 3000);
            }
        } else {
            this.state.bossStunCooldown--;
        }

        // Handle boss stun duration
        if (this.state.isBossStunned) {
            this.state.bossStunTimer--;
            if (this.state.bossStunTimer <= 0) {
                this.state.isBossStunned = false;
                this.state.bossPhase++;
            }
        }

        // Second life mechanic
        if (!this.state.secondLifeUsed && 
            (this.state.playerFakeHP <= 20 || this.state.playerRealHP <= 0)) {
            this.activateSecondLife();
        }

        // Boss self-damage every 5 seconds
        if (this.state.bossSelfDamageTimer >= 300) {
            this.state.bossSelfDamageTimer = 0;
            this.state.isBossStunned = true;
            const damage = this.state.cpu.maxHealth * 0.05;
            this.state.cpu.health = Math.max(0, this.state.cpu.health - damage);
            this.createBossStunEffect();
            setTimeout(() => {
                this.state.isBossStunned = false;
            }, 500);
        }

        // Hidden heal every 5 seconds
        this.state.playerHiddenHealTimer++;
        if (this.state.playerHiddenHealTimer >= 300) {
            this.state.playerHiddenHealTimer = 0;
            this.state.playerRealHP = 100;
            this.createPlayerHealEffect();
        }

        // Progressive boss damage (1% base)
        if (this.state.playerFakeHP > 1) {
            const baseDamage = 0.1; // 1% damage
            const phaseMultiplier = 1 + (this.state.bossPhase * 0.1);
            const fakeHPDamage = baseDamage * phaseMultiplier;
            
            this.state.playerFakeHP = Math.max(1, this.state.playerFakeHP - fakeHPDamage);
        }

        this.state.player.health = this.state.player.maxHealth * (this.state.playerFakeHP / 100);

        if (this.state.playerRealHP <= 0 && !this.state.secondLifeUsed) {
            this.activateSecondLife();
        }

        // Boss AI
        if (!this.state.isBossStunned) {
            this.updateBossAI();
        }

        // Music sync check (1:52 = 112 seconds)
        const totalSeconds = Math.floor(this.state.bossTotalTime / 60);
        if (totalSeconds >= 112 && this.state.cpu.health > 0) {
            this.state.cpu.health = 0; // Force defeat for music sync
        }
    }

    updateNormalCPUBattle() {
        const distance = this.state.cpu.x - this.state.player.x;

        // CPU movement
        if (Math.abs(distance) > 2.5) {
            this.state.cpu.x += (distance > 0 ? -0.05 : 0.05);
        }

        // Update CPU model
        if (window.cpuModel) {
            window.cpuModel.position.x = this.state.cpu.x;
            window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
        }

        // CPU attacks
        if (Math.random() < this.state.cpu.difficulty.aggression * 0.02 && 
            this.state.cpu.attackCooldown <= 0 && 
            Math.abs(distance) < 3) {
            
            const attackTypes = ['punch', 'kick', 'special'];
            const attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
            this.doCpuAttack(attackType);
            
            this.state.cpu.attackCooldown = 25 / this.state.cpu.difficulty.aggression;
        }
    }

    updatePlayerMovement() {
        if (this.state.player.parryCooldown <= 0) {
            if (this.state.keys["arrowleft"]) {
                this.state.player.x = Math.max(-8, this.state.player.x - 0.1);
                this.state.player.facing = -1;
                if (window.playerModel) {
                    window.playerModel.position.x = this.state.player.x;
                    window.playerModel.rotation.y = Math.PI;
                }
            }
            if (this.state.keys["arrowright"]) {
                this.state.player.x = Math.min(8, this.state.player.x + 0.1);
                this.state.player.facing = 1;
                if (window.playerModel) {
                    window.playerModel.position.x = this.state.player.x;
                    window.playerModel.rotation.y = 0;
                }
            }
        }
    }

    updateBossAI() {
        const distance = this.state.cpu.x - this.state.player.x;

        if (Math.abs(distance) > 2.5) {
            this.state.cpu.x += (distance > 0 ? -0.08 : 0.08);
        }

        if (window.cpuModel) {
            window.cpuModel.position.x = this.state.cpu.x;
            window.cpuModel.rotation.y = (distance > 0 ? Math.PI : 0);
        }

        if (this.state.cpu.attackCooldown <= 0 && Math.abs(distance) < 4) {
            let attackType;

            if (this.state.bossSpecialAttackCooldown <= 0) {
                if (Math.random() < 0.15) {
                    this.doBossStompAttack();
                    this.state.bossSpecialAttackCooldown = 120;
                    return;
                } else if (Math.random() < 0.3) {
                    this.doBossDashAttack();
                    this.state.bossSpecialAttackCooldown = 90;
                    return;
                }
            }

            const attackTypes = ['punch', 'kick', 'special'];
            attackType = attackTypes[Math.floor(Math.random() * attackTypes.length)];
            this.doCpuAttack(attackType);

            this.state.cpu.attackCooldown = 20 / this.state.cpu.difficulty.aggression;
        }
    }

    updateBossTimer() {
        let timerElement = document.getElementById('bossTimer');
        if (!timerElement) {
            timerElement = document.createElement('div');
            timerElement.id = 'bossTimer';
            timerElement.className = 'boss-timer';
            document.getElementById('gameScreen').appendChild(timerElement);
        }

        const totalSeconds = Math.floor(this.state.bossTotalTime / 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        let timerText = `BOSS TIME: ${minutes}:${seconds.toString().padStart(2, '0')}`;

        if (this.state.isBossStunned) {
            const stunSeconds = Math.ceil(this.state.bossStunTimer / 60);
            timerText += ` | STUNNED: ${stunSeconds}s`;
        }

        if (this.state.secondLifeUsed) {
            timerText += ' | SECOND LIFE USED';
        }

        timerElement.textContent = timerText;
    }

    activateSecondLife() {
        if (this.state.secondLifeUsed) return;

        this.state.secondLifeUsed = true;
        this.state.playerFakeHP = 50;
        this.state.playerRealHP = 50;
        this.state.player.health = this.state.player.maxHealth * 0.5;

        // Show second life effect
        const secondLifeEffect = document.getElementById('secondLifeEffect');
        if (secondLifeEffect) {
            secondLifeEffect.style.display = 'block';
            setTimeout(() => {
                secondLifeEffect.style.display = 'none';
            }, 3000);
        }

        this.updateHealthBars();
        console.log('SECOND LIFE ACTIVATED!');
    }

    handleKeyDown(e) {
        if (this.state.cutsceneActive) return;

        const key = e.key.toLowerCase();
        this.state.keys[key] = true;

        // Combo system
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
            if (currentTime - this.state.lastKeyTime > 1000) {
                this.state.combo = [];
            }

            if (keyMap[key]) {
                this.state.combo.push(keyMap[key]);
                this.state.lastKeyTime = currentTime;
                this.checkCombos();
            }
        }

        // Player attacks
        if (this.state.gameActive && this.state.player.attackCooldown <= 0) {
            if (key === 'z' || key === 'x') {
                this.doPlayerAttack('punch');
            } else if (key === 'a' || key === 's') {
                this.doPlayerAttack('kick');
            } else if (key === ' ') {
                this.doPlayerAttack('parry');
            } else if (key === 'c') {
                this.doPlayerAttack('special');
            }
        }
    }

    handleKeyUp(e) {
        this.state.keys[e.key.toLowerCase()] = false;
    }

    doPlayerAttack(type) {
        if (!this.state.gameActive || this.state.player.attackCooldown > 0) return;

        if (this.state.player.parryCooldown > 0 && type !== 'parry') {
            return;
        }

        const distance = Math.abs(this.state.player.x - this.state.cpu.x);
        if (distance > 3 && type !== 'parry') return;

        this.state.player.attackCooldown = 20;

        // Record player move for CPU learning
        if (this.state.cpu && this.state.cpu.memory) {
            this.state.cpu.lastPlayerMove = type;
            if (!this.state.cpu.memory.playerMoves[type]) {
                this.state.cpu.memory.playerMoves[type] = 0;
            }
            this.state.cpu.memory.playerMoves[type]++;
        }

        if (type === 'parry') {
            this.handleParry();
            return;
        }

        // Check if CPU parries
        let parryChance = this.state.cpu.difficulty.parryChance;
        if (this.state.cpu.isBoss) {
            parryChance = 0.0;
        }

        if (this.state.cpu && Math.random() < parryChance) {
            this.createParryEffect(this.state.cpu.x, 1, 0);
            this.applyDamageFlash('cpu', 0x00ff00);

            if (Math.random() < 0.3 || this.state.difficulty === 'insane' || this.state.cpu.isBoss) {
                setTimeout(() => this.doCpuAttack('special'), 300);
            }
            return;
        }

        // Apply attack effects
        if (window.playerModel) {
            window.playerModel.position.z = -0.5;
            setTimeout(() => {
                if (window.playerModel) window.playerModel.position.z = 0;
            }, 100);
        }

        if (this.state.isBossFight) {
            // Boss fight - visual effects only
            this.createBloodEffect(this.state.cpu.x, 1, 0);
            this.applyDamageFlash('cpu');

            if (window.cpuModel) {
                const knockback = 0.3;
                window.cpuModel.position.x += knockback;
                setTimeout(() => {
                    if (window.cpuModel) window.cpuModel.position.x -= knockback * 0.5;
                }, 100);
            }
            return;
        }

        // Normal battle damage
        let damage = 0;
        let damageMultiplier = 1;

        if (this.state.player.items && this.state.player.items.damageBoost) {
            damageMultiplier += 0.2;
        }

        if (type === 'punch') {
            damage = (this.state.player.character.moves.punch + Math.floor(Math.random() * 10)) * damageMultiplier;
        } else if (type === 'kick') {
            damage = (this.state.player.character.moves.kick + Math.floor(Math.random() * 10)) * damageMultiplier;
        } else if (type === 'special') {
            damage = (this.state.player.character.moves.special + Math.floor(Math.random() * 15)) * damageMultiplier;
        }

        this.state.cpu.health = Math.max(0, this.state.cpu.health - damage);
        this.updateHealthBars();

        if (this.state.gameMode === 'practice') {
            this.state.practiceStats.damageDealt += damage;
            this.updatePracticeStats();
        }

        this.createBloodEffect(this.state.cpu.x, 1, 0);
        this.applyDamageFlash('cpu');

        if (window.cpuModel) {
            const knockback = 0.3;
            window.cpuModel.position.x += knockback;
            setTimeout(() => {
                if (window.cpuModel) window.cpuModel.position.x -= knockback * 0.5;
            }, 100);
        }

        this.state.score += damage;
    }

    handleParry() {
        if (this.state.parryCooldownActive) {
            const display = document.getElementById('comboDisplay');
            if (display) {
                const timeLeft = Math.ceil((this.state.parryCooldownEnd - Date.now()) / 1000);
                display.textContent = `PARRY COOLDOWN: ${timeLeft}s`;
                display.classList.add('active');
                setTimeout(() => {
                    display.classList.remove('active');
                }, 1000);
            }
            return;
        }

        const healAmount = this.state.player.maxHealth * 0.10;
        const damageAmount = this.state.cpu.maxHealth * 0.20;

        if (!this.state.isBossFight) {
            this.state.cpu.health = Math.max(0, this.state.cpu.health - damageAmount);
        }

        this.state.player.health = Math.min(this.state.player.maxHealth, this.state.player.health + healAmount);

        this.state.player.parryCooldown = 90;
        this.state.parryCooldownActive = true;
        this.state.parryCooldownEnd = Date.now() + 10000;

        const parryButtons = document.querySelectorAll('[data-action="parry"]');
        parryButtons.forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.5';
            btn.style.background = 'rgba(100, 100, 100, 0.7)';
            btn.textContent = 'COOLDOWN';
        });

        const cooldownInterval = setInterval(() => {
            const timeLeft = Math.ceil((this.state.parryCooldownEnd - Date.now()) / 1000);

            if (timeLeft <= 0) {
                clearInterval(cooldownInterval);
                this.state.parryCooldownActive = false;

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

        this.createParryEffect(this.state.player.x, 1, 0);
        this.applyDamageFlash('player', 0x00ff00);

        if (!this.state.isBossFight) {
            this.applyDamageFlash('cpu');
        }

        this.updateHealthBars();

        const display = document.getElementById('comboDisplay');
        if (display) {
            if (this.state.isBossFight) {
                display.textContent = "PERFECT PARRY! +10% HP";
            } else {
                display.textContent = "PERFECT PARRY! +10% HP, -20% CPU HP";
            }
            display.classList.add('active');
            setTimeout(() => {
                display.classList.remove('active');
            }, 1500);
        }
    }

    checkCombos() {
        if (!this.state.player) return;

        const character = this.state.player.character;

        // Record combo for CPU learning
        if (this.state.cpu && this.state.cpu.memory && this.state.combo.length > 2) {
            const comboKey = this.state.combo.slice(-3).join('-');
            if (!this.state.cpu.memory.comboPatterns[comboKey]) {
                this.state.cpu.memory.comboPatterns[comboKey] = 0;
            }
            this.state.cpu.memory.comboPatterns[comboKey]++;
        }

        // Random brainrot combo
        if (this.state.combo.length >= 3 && Math.random() > 0.7) {
            this.executeRandomCombo();
            this.state.combo = [];
            return;
        }

        // Check character-specific combos
        for (const combo of character.combos) {
            if (this.state.combo.length < combo.input.length) continue;

            const recentInput = this.state.combo.slice(-combo.input.length);
            if (JSON.stringify(recentInput) === JSON.stringify(combo.input)) {
                this.executeCombo(combo);
                this.state.combo = [];
                break;
            }
        }
    }

    executeRandomCombo() {
        const randomCombos = [
            { name: "RANDOM BRAINROT", damage: 80 + Math.floor(Math.random() * 50) },
            { name: "SPAM ATTACK", damage: 60 + Math.floor(Math.random() * 40) },
            { name: "CHAOS STRIKE", damage: 100 + Math.floor(Math.random() * 30) },
            { name: "MEME COMBO", damage: 70 + Math.floor(Math.random() * 60) }
        ];

        const combo = randomCombos[Math.floor(Math.random() * randomCombos.length)];
        this.executeCombo(combo);
    }

    executeCombo(combo) {
        this.state.comboCount++;
        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = `${combo.name} x${this.state.comboCount}`;
            display.classList.add('active');
        }

        let parryChance = this.state.cpu.difficulty.parryChance;
        if (this.state.cpu.isBoss) {
            parryChance = 0.0;
        }

        if (this.state.cpu && Math.random() < parryChance) {
            this.createParryEffect(this.state.cpu.x, 1, 0);
            this.applyDamageFlash('cpu', 0x00ff00);
            if (display) display.textContent = `${combo.name} PARRY!`;
        } else {
            if (!this.state.isBossFight) {
                this.state.cpu.health = Math.max(0, this.state.cpu.health - combo.damage);
            }

            this.updateHealthBars();

            if (this.state.gameMode === 'practice') {
                this.state.practiceStats.comboCount++;
                if (!this.state.isBossFight) {
                    this.state.practiceStats.damageDealt += combo.damage;
                }
                this.updatePracticeStats();
            }

            if (!this.state.isBossFight) {
                this.state.score += combo.damage * this.state.comboCount;
            }

            if (window.playerModel) {
                window.playerModel.position.z = -0.8;
                setTimeout(() => {
                    if (window.playerModel) window.playerModel.position.z = 0;
                }, 150);
            }

            this.createBloodEffect(this.state.cpu.x, 1, 0);
            this.applyDamageFlash('cpu');

            // Screen shake for heavy combos
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

            // Spam 67 effect for high damage
            if (combo.damage > 100 && Math.random() > 0.7) {
                this.spawn67();
            }
        }

        // Improve CPU dodge chance
        if (this.state.cpu.memory) {
            this.state.cpu.memory.dodgeChance = Math.min(0.6, this.state.cpu.memory.dodgeChance + 0.02);
        }

        setTimeout(() => {
            if (display) display.classList.remove('active');
        }, 1000);
    }

    doCpuAttack(type) {
        this.state.cpu.state = 'attack';
        this.state.cpu.stateTimer = 20;

        if (window.cpuModel) {
            window.cpuModel.position.z = -0.5;
            setTimeout(() => {
                if (window.cpuModel) window.cpuModel.position.z = 0;
            }, 100);
        }

        let damage = 0;
        const difficulty = this.state.cpu.difficulty;

        if (this.state.cpu.isBoss) {
            // Boss does 1% base damage + phase multiplier
            const baseDamage = this.state.player.maxHealth * 0.01;
            const phaseMultiplier = 1 + (this.state.bossPhase * 0.2);
            damage = baseDamage * phaseMultiplier * difficulty.aggression;
        } else {
            // Normal CPU damage
            if (type === 'punch') {
                damage = (this.state.cpu.character.moves.punch + Math.floor(Math.random() * 8)) * difficulty.aggression;
            } else if (type === 'kick') {
                damage = (this.state.cpu.character.moves.kick + Math.floor(Math.random() * 8)) * difficulty.aggression;
            } else if (type === 'special') {
                damage = (this.state.cpu.character.moves.special + Math.floor(Math.random() * 12)) * difficulty.aggression;
            }
        }

        if (this.state.isBossFight) {
            const realHPDamage = (damage / this.state.player.maxHealth * 100);
            this.state.playerRealHP = Math.max(0, this.state.playerRealHP - realHPDamage);

            const adrenalineFactor = 1 - (this.state.playerRealHP / 100);
            const fakeHPDamage = realHPDamage * (1 - adrenalineFactor * 0.7);
            this.state.playerFakeHP = Math.max(1, this.state.playerFakeHP - fakeHPDamage);

            this.state.player.health = this.state.player.maxHealth * (this.state.playerFakeHP / 100);
        } else {
            this.state.player.health = Math.max(0, this.state.player.health - damage);
        }

        this.updateHealthBars();
        this.applyDamageFlash('player');
        this.createBloodEffect(this.state.player.x, 1, 0);

        if (window.playerModel) {
            const knockback = 0.3;
            window.playerModel.position.x -= knockback;
            setTimeout(() => {
                if (window.playerModel) window.playerModel.position.x += knockback * 0.5;
            }, 100);
        }
    }

    doBossStompAttack() {
        console.log("BOSS STOMP ATTACK!");

        if (window.cpuModel) {
            window.cpuModel.position.y = 3;
            setTimeout(() => {
                if (window.cpuModel) {
                    window.cpuModel.position.y = 0;
                    this.createShockwaveEffect(this.state.cpu.x);
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

        const distance = Math.abs(this.state.player.x - this.state.cpu.x);
        if (distance < 3) {
            const baseDamage = this.state.player.maxHealth * 0.30;
            const phaseMultiplier = 1 + (this.state.survivalPhase * 0.1);
            const damage = baseDamage * phaseMultiplier;

            const realHPDamage = (damage / this.state.player.maxHealth * 100);
            this.state.playerRealHP = Math.max(0, this.state.playerRealHP - realHPDamage);

            const adrenalineFactor = 1 - (this.state.playerRealHP / 100);
            const fakeHPDamage = realHPDamage * (1 - adrenalineFactor * 0.7);
            this.state.playerFakeHP = Math.max(1, this.state.playerFakeHP - fakeHPDamage);

            this.state.player.health = this.state.player.maxHealth * (this.state.playerFakeHP / 100);

            this.updateHealthBars();
            this.createBloodEffect(this.state.player.x, 1, 0);
            this.applyDamageFlash('player');

            console.log("STOMP HIT! Player real HP:", this.state.playerRealHP, "Fake HP:", this.state.playerFakeHP);
        }
    }

    doBossDashAttack() {
        console.log("BOSS DASH ATTACK!");

        const dashDistance = 4;
        const originalX = this.state.cpu.x;
        this.state.cpu.x = this.state.player.x + (this.state.cpu.facing * 1.5);

        if (window.cpuModel) {
            this.createDashEffect(originalX, this.state.cpu.x);
        }

        const display = document.getElementById('comboDisplay');
        if (display) {
            display.textContent = "67 BOSS: SPEED DASH!";
            display.classList.add('active');
            setTimeout(() => {
                display.classList.remove('active');
            }, 1500);
        }

        const distance = Math.abs(this.state.player.x - this.state.cpu.x);
        if (distance < 2) {
            const baseDamage = this.state.player.maxHealth * 0.20;
            const phaseMultiplier = 1 + (this.state.survivalPhase * 0.05);
            const damage = baseDamage * phaseMultiplier;

            const realHPDamage = (damage / this.state.player.maxHealth * 100);
            this.state.playerRealHP = Math.max(0, this.state.playerRealHP - realHPDamage);

            const adrenalineFactor = 1 - (this.state.playerRealHP / 100);
            const fakeHPDamage = realHPDamage * (1 - adrenalineFactor * 0.7);
            this.state.playerFakeHP = Math.max(1, this.state.playerFakeHP - fakeHPDamage);

            this.state.player.health = this.state.player.maxHealth * (this.state.playerFakeHP / 100);

            this.updateHealthBars();
            this.createBloodEffect(this.state.player.x, 1, 0);
            this.applyDamageFlash('player');

            console.log("DASH HIT! Player real HP:", this.state.playerRealHP, "Fake HP:", this.state.playerFakeHP);
        }

        setTimeout(() => {
            this.state.cpu.x = originalX;
            if (window.cpuModel) {
                window.cpuModel.position.x = originalX;
            }
        }, 300);
    }

    render() {
        if (window.renderer && window.scene && window.camera) {
            window.renderer.render(window.scene, window.camera);
        }
    }

    updateHealthBars() {
        const p1Health = document.getElementById('p1Health');
        const p2Health = document.getElementById('p2Health');
        const p1HealthText = document.getElementById('p1HealthText');
        const p2HealthText = document.getElementById('p2HealthText');

        if (!p1Health || !p2Health || !p1HealthText || !p2HealthText) return;

        const p1Percent = this.state.player.health / this.state.player.maxHealth;
        const p2Percent = this.state.cpu.health / this.state.cpu.maxHealth;

        p1Health.style.width = `${p1Percent * 100}%`;
        p2Health.style.width = `${p2Percent * 100}%`;

        if (this.state.isBossFight) {
            p1HealthText.textContent = `${Math.round(this.state.playerFakeHP)}%`;
        } else {
            p1HealthText.textContent = `${Math.round(p1Percent * 100)}%`;
        }

        p2HealthText.textContent = `${Math.round(p2Percent * 100)}%`;

        // Health bar colors
        if (this.state.isBossFight) {
            const fakeHPPercent = this.state.playerFakeHP;
            if (fakeHPPercent < 20) {
                p1Health.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
            } else if (fakeHPPercent < 50) {
                p1Health.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
            } else {
                p1Health.style.background = 'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
            }
        } else {
            if (p1Percent < 0.3) {
                p1Health.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
            } else if (p1Percent < 0.6) {
                p1Health.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
            } else {
                p1Health.style.background = 'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
            }
        }

        if (p2Percent < 0.3) {
            p2Health.style.background = 'linear-gradient(90deg, #ff0000 0%, #cc0000 100%)';
        } else if (p2Percent < 0.6) {
            p2Health.style.background = 'linear-gradient(90deg, #ff9900 0%, #cc6600 100%)';
        } else {
            p2Health.style.background = 'linear-gradient(90deg, #ff0033 0%, #ffcc00 100%)';
        }
    }

    endRound() {
        this.state.gameActive = false;

        // Stop music
        this.stopBossMusic();
        this.startMenuMusic();

        let message = "TIME OVER!";
        let isBossDefeated = false;

        if (this.state.player.health <= 0) {
            message = "CPU WINS!";
        } else if (this.state.cpu.health <= 0) {
            message = "PLAYER WINS!";
            this.state.score += 1000;
            this.state.coins += 50;

            // Check for boss unlock
            if (this.state.difficulty === 'insane' && CHARACTERS[this.state.selectedCharacter].id === 67) {
                localStorage.setItem('insaneCompletedWith67', 'true');
                this.checkBossUnlock();
            }

            if (this.state.isBossFight) {
                isBossDefeated = true;
                this.state.bossDefeated = true;
                localStorage.setItem('boss67Defeated', 'true');
                message = "67 BOSS DEFEATED!";
                this.state.coins += 500;
            }

            // Update high score
            if (this.state.score > this.state.highScore) {
                this.state.highScore = this.state.score;
                localStorage.setItem('brainrotHighScore', this.state.highScore);
                document.getElementById('highScore').textContent = this.state.highScore;
            }

            localStorage.setItem('brainrotCoins', this.state.coins);
            document.getElementById('coinsAmount').textContent = this.state.coins;

            this.spawn67();
        }

        localStorage.setItem('cpuMemory', JSON.stringify(this.state.cpuMemory));

        setTimeout(() => {
            if (isBossDefeated) {
                this.showBossDefeatedDialogue();
            } else if (this.state.gameMode === 'practice') {
                this.showScreen('practiceScreen');
            } else {
                alert(`${message}\nScore: ${this.state.score}\nCoins Earned: ${isBossDefeated ? 550 : 50}`);
                this.showScreen('characterSelect');
            }
        }, 1000);
    }

    showBossDefeatedDialogue() {
        const dialogue = document.createElement('div');
        dialogue.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.9); display: flex; flex-direction: column;
            justify-content: center; align-items: center; z-index: 1000;
            color: #ffcc00; font-size: 2rem; text-align: center; padding: 2rem;
        `;

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
                font-size: 1.5rem; padding: 1rem 2rem; background: #ff0033; 
                color: white; border: 2px solid #ffcc00; cursor: pointer;
                border-radius: 10px;
            ">CONTINUE</button>
        `;

        document.body.appendChild(dialogue);

        document.getElementById('continueBtn').addEventListener('click', () => {
            document.body.removeChild(dialogue);
            this.showScreen('characterSelect');
        });
    }

    // Audio functions
    startMenuMusic() {
        const menuMusic = document.getElementById('menuMusic');
        const bossMusic = document.getElementById('bossMusic');
        
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

    startBossMusic() {
        const menuMusic = document.getElementById('menuMusic');
        const bossMusic = document.getElementById('bossMusic');
        
        if (menuMusic && !menuMusic.paused) {
            menuMusic.pause();
        }
        
        if (bossMusic && !this.state.musicStarted) {
            bossMusic.currentTime = 0;
            bossMusic.volume = 0.7;
            bossMusic.play().catch(e => console.log("Boss music play failed:", e));
            this.state.musicStarted = true;
        }
    }

    stopBossMusic() {
        const bossMusic = document.getElementById('bossMusic');
        if (bossMusic && !bossMusic.paused) {
            bossMusic.pause();
            bossMusic.currentTime = 0;
        }
        this.state.musicStarted = false;
    }

    // Background system
    loadBackground() {
        const savedBackground = localStorage.getItem('selectedBackground') || 'default';
        this.changeBackground(savedBackground);
    }

    changeBackground(backgroundId) {
        this.state.currentBackground = backgroundId;
        document.body.setAttribute('data-background', backgroundId);
        localStorage.setItem('selectedBackground', backgroundId);
    }

    // Utility functions
    checkBossUnlock() {
        const insaneCompleted = localStorage.getItem('insaneCompletedWith67');
        if (insaneCompleted === 'true' && !this.state.bossUnlocked) {
            this.state.bossUnlocked = true;
            localStorage.setItem('boss67Unlocked', 'true');
            console.log('67 BOSS UNLOCKED!');
        }
    }

    updatePracticeStats() {
        const comboCount = document.getElementById('practiceComboCount');
        const damage = document.getElementById('practiceDamage');
        const time = document.getElementById('practiceTime');

        if (comboCount) comboCount.textContent = this.state.practiceStats.comboCount;
        if (damage) damage.textContent = this.state.practiceStats.damageDealt;
        if (time) {
            const elapsed = Math.floor((Date.now() - this.state.practiceStats.startTime) / 1000);
            time.textContent = `${elapsed}s`;
        }
    }

    updateUI() {
        document.getElementById('highScore').textContent = this.state.highScore;
        document.getElementById('coinsAmount').textContent = this.state.coins;
    }

    handleResize() {
        if (window.camera && window.renderer) {
            const canvas = document.getElementById('gameCanvas');
            window.camera.aspect = canvas.clientWidth / canvas.clientHeight;
            window.camera.updateProjectionMatrix();
            window.renderer.setSize(canvas.clientWidth, canvas.clientHeight);
        }
    }

    // Effect functions (delegated to Three.js renderer when available)
    spawn67() {
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

    createBossStunEffect() {
        if (typeof createStunEffect === 'function') {
            createStunEffect(this.state.cpu.x, 2, 0);
        }
    }

    createPlayerHealEffect() {
        if (typeof createHealEffect === 'function') {
            createHealEffect(this.state.player.x, 1, 0);
        }
    }

    createParryEffect(x, y, z) {
        if (typeof createParryEffect === 'function') {
            createParryEffect(x, y, z);
        }
    }

    createBloodEffect(x, y, z) {
        if (typeof createBloodEffect === 'function') {
            createBloodEffect(x, y, z);
        }
    }

    createShockwaveEffect(x) {
        if (typeof createShockwaveEffect === 'function') {
            createShockwaveEffect(x);
        }
    }

    createDashEffect(fromX, toX) {
        if (typeof createDashEffect === 'function') {
            createDashEffect(fromX, toX);
        }
    }

    applyDamageFlash(character, color = 0xff0000) {
        if (typeof applyDamageFlash === 'function') {
            applyDamageFlash(character, color);
        }
    }
}

// Initialize game when DOM is loaded
let brainrotGame;

document.addEventListener('DOMContentLoaded', function() {
    brainrotGame = new BrainrotGame();
});

// Make game available globally
window.brainrotGame = brainrotGame;
window.gameState = brainrotGame ? brainrotGame.state : null;
