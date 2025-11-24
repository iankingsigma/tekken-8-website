// ENHANCED ONLINE MULTIPLAYER SYSTEM v5.0

class OnlineManager {
    constructor() {
        this.state = {
            isOnline: false,
            playerId: null,
            playerName: `Player${Math.floor(Math.random() * 10000)}`,
            currentLobby: null,
            isHost: false,
            friends: [],
            friendCode: null,
            pendingInvites: [],
            connectionStatus: 'disconnected',
            ping: 0
        };
        
        this.matchmakingQueue = [];
        this.lobbyListeners = new Map();
    }
    
    async initialize() {
        try {
            if (!window.firebaseAuth) {
                throw new Error('Firebase not initialized');
            }
            
            // Enhanced authentication
            const userCredential = await signInAnonymously(window.firebaseAuth);
            this.state.playerId = userCredential.user.uid;
            this.state.friendCode = this.generateFriendCode();
            
            // Create enhanced player profile
            await this.createPlayerProfile();
            
            this.state.isOnline = true;
            this.state.connectionStatus = 'connected';
            
            this.updateOnlineStatus();
            this.startConnectionMonitoring();
            
            console.log('Enhanced Online System initialized:', this.state.playerId);
            
        } catch (error) {
            console.error('Online system initialization failed:', error);
            this.state.isOnline = false;
            this.state.connectionStatus = 'error';
        }
    }
    
    async createPlayerProfile() {
        const playerData = {
            name: this.state.playerName,
            friendCode: this.state.friendCode,
            status: 'online',
            rank: 'Beginner',
            level: 1,
            wins: 0,
            losses: 0,
            lastActive: Date.now(),
            character: gameState.selectedCharacter || 0
        };
        
        await set(ref(window.firebaseDatabase, `players/${this.state.playerId}`), playerData);
    }
    
    generateFriendCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'BR';
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return result;
    }
    
    startConnectionMonitoring() {
        setInterval(() => {
            this.checkConnectionQuality();
        }, 5000);
    }
    
    async checkConnectionQuality() {
        const startTime = Date.now();
        try {
            // Simple ping test
            await get(ref(window.firebaseDatabase, '.info/connected'));
            this.state.ping = Date.now() - startTime;
            
            if (this.state.ping < 100) {
                this.state.connectionStatus = 'excellent';
            } else if (this.state.ping < 300) {
                this.state.connectionStatus = 'good';
            } else {
                this.state.connectionStatus = 'poor';
            }
        } catch (error) {
            this.state.connectionStatus = 'disconnected';
        }
        
        this.updateOnlineStatus();
    }
    
    updateOnlineStatus() {
        const statusElement = document.getElementById('onlineStatus');
        if (!statusElement) return;
        
        const statusColors = {
            connected: '#00ff00',
            disconnected: '#ff0000',
            excellent: '#00ff00',
            good: '#ffff00',
            poor: '#ff6600',
            error: '#ff0000'
        };
        
        const statusText = {
            connected: 'CONNECTED',
            disconnected: 'DISCONNECTED',
            excellent: 'EXCELLENT',
            good: 'GOOD',
            poor: 'POOR',
            error: 'ERROR'
        };
        
        statusElement.innerHTML = `
            <div class="online-status-enhanced" style="border-color: ${statusColors[this.state.connectionStatus]};">
                <span style="color: ${statusColors[this.state.connectionStatus]};">●</span>
                ${statusText[this.state.connectionStatus]} - ${this.state.playerName}
                ${this.state.ping ? `(${this.state.ping}ms)` : ''}
            </div>
        `;
    }
    
    // Enhanced Matchmaking
    async findEnhancedMatch() {
        if (!this.state.isOnline) {
            this.showErrorMessage('Online system unavailable');
            return;
        }
        
        if (!gameState.selectedCharacter) {
            this.showErrorMessage('Please select a character first');
            showScreen('characterSelect');
            return;
        }
        
        this.showMatchmakingScreen();
        
        // Add to matchmaking queue
        const matchData = {
            playerId: this.state.playerId,
            playerName: this.state.playerName,
            character: gameState.selectedCharacter,
            rank: this.state.rank || 'Beginner',
            timestamp: Date.now(),
            region: this.detectRegion()
        };
        
        const matchRef = push(ref(window.firebaseDatabase, 'matchmaking'));
        await set(matchRef, matchData);
        
        // Listen for matches
        this.setupMatchmakingListener(matchRef.key);
        
        // Timeout after 45 seconds
        setTimeout(() => {
            this.cancelMatchmaking(matchRef.key);
        }, 45000);
    }
    
    detectRegion() {
        // Simple region detection based on timezone
        const offset = new Date().getTimezoneOffset();
        if (offset === -300) return 'na'; // North America
        if (offset === 0) return 'eu';    // Europe
        return 'global';
    }
    
    setupMatchmakingListener(matchId) {
        const matchRef = ref(window.firebaseDatabase, `matches/${matchId}`);
        
        onValue(matchRef, (snapshot) => {
            if (snapshot.exists()) {
                const match = snapshot.val();
                if (match.players && match.players[this.state.playerId]) {
                    this.startOnlineMatch(match);
                }
            }
        });
    }
    
    async startOnlineMatch(matchData) {
        this.hideMatchmakingScreen();
        
        // Set up online game state
        gameState.gameMode = 'online';
        gameState.onlineMatch = {
            matchId: matchData.id,
            players: matchData.players,
            isHost: matchData.host === this.state.playerId
        };
        
        // Load opponent data
        const opponentId = Object.keys(matchData.players).find(id => id !== this.state.playerId);
        if (opponentId) {
            const opponentData = await this.getPlayerData(opponentId);
            gameState.onlineMatch.opponent = opponentData;
        }
        
        // Start the match
        showScreen('gameScreen');
        setTimeout(() => {
            if (typeof initThreeJS === 'function') {
                initThreeJS();
            }
            startGame();
        }, 2000);
    }
    
    async getPlayerData(playerId) {
        const playerRef = ref(window.firebaseDatabase, `players/${playerId}`);
        const snapshot = await get(playerRef);
        return snapshot.exists() ? snapshot.val() : null;
    }
    
    showMatchmakingScreen() {
        // Create enhanced matchmaking UI
        const matchmakingUI = document.createElement('div');
        matchmakingUI.id = 'matchmakingUI';
        matchmakingUI.innerHTML = `
            <div class="matchmaking-overlay">
                <div class="matchmaking-content">
                    <h3>🔍 FINDING OPPONENT</h3>
                    <div class="searching-animation">
                        <div class="searching-dot"></div>
                        <div class="searching-dot"></div>
                        <div class="searching-dot"></div>
                    </div>
                    <div class="matchmaking-info">
                        <div>Searching worldwide...</div>
                        <div class="ping-info">Ping: ${this.state.ping}ms</div>
                        <div class="region-info">Region: ${this.detectRegion().toUpperCase()}</div>
                    </div>
                    <div class="matchmaking-stats">
                        <div>Players Online: <span id="onlineCount">...</span></div>
                        <div>Average Wait: <span>15s</span></div>
                    </div>
                    <button class="tekken-btn cancel-btn" id="cancelMatchmaking">CANCEL SEARCH</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(matchmakingUI);
        
        document.getElementById('cancelMatchmaking').addEventListener('click', () => {
            this.cancelMatchmaking();
        });
        
        this.updateOnlinePlayerCount();
    }
    
    async updateOnlinePlayerCount() {
        try {
            const playersRef = ref(window.firebaseDatabase, 'players');
            const snapshot = await get(playersRef);
            if (snapshot.exists()) {
                const players = snapshot.val();
                const onlinePlayers = Object.values(players).filter(p => 
                    p.status === 'online' && Date.now() - p.lastActive < 300000
                ).length;
                
                const onlineCount = document.getElementById('onlineCount');
                if (onlineCount) {
                    onlineCount.textContent = onlinePlayers;
                }
            }
        } catch (error) {
            console.error('Error updating player count:', error);
        }
    }
    
    hideMatchmakingScreen() {
        const matchmakingUI = document.getElementById('matchmakingUI');
        if (matchmakingUI) {
            matchmakingUI.remove();
        }
    }
    
    cancelMatchmaking(matchId) {
        if (matchId) {
            remove(ref(window.firebaseDatabase, `matchmaking/${matchId}`));
        }
        this.hideMatchmakingScreen();
    }
    
    // Enhanced Lobby System
    async createEnhancedLobby(settings = {}) {
        const lobbyCode = this.generateLobbyCode();
        const lobbyData = {
            code: lobbyCode,
            name: settings.name || `${this.state.playerName}'s Lobby`,
            password: settings.password || '',
            host: this.state.playerId,
            players: {
                [this.state.playerId]: {
                    name: this.state.playerName,
                    character: gameState.selectedCharacter,
                    ready: false,
                    ping: this.state.ping
                }
            },
            maxPlayers: settings.maxPlayers || 2,
            status: 'waiting',
            settings: {
                rounds: settings.rounds || 3,
                timeLimit: settings.timeLimit || 60,
                stage: settings.stage || 'random'
            },
            created: Date.now()
        };
        
        await set(ref(window.firebaseDatabase, `lobbies/${lobbyCode}`), lobbyData);
        
        this.state.currentLobby = lobbyCode;
        this.state.isHost = true;
        
        this.showLobbyScreen(lobbyData);
        this.setupLobbyListener(lobbyCode);
        
        return lobbyCode;
    }
    
    generateLobbyCode() {
        return Math.random().toString(36).substr(2, 6).toUpperCase();
    }
    
    showLobbyScreen(lobbyData) {
        // Create enhanced lobby UI
        const lobbyUI = this.createLobbyUI(lobbyData);
        document.body.appendChild(lobbyUI);
    }
    
    createLobbyUI(lobbyData) {
        const lobbyUI = document.createElement('div');
        lobbyUI.id = 'lobbyUI';
        lobbyUI.className = 'lobby-overlay';
        lobbyUI.innerHTML = `
            <div class="lobby-content">
                <div class="lobby-header">
                    <h2>${lobbyData.name}</h2>
                    <div class="lobby-code">CODE: ${lobbyData.code}</div>
                </div>
                
                <div class="lobby-players" id="lobbyPlayers">
                    ${this.renderLobbyPlayers(lobbyData.players, lobbyData.host)}
                </div>
                
                <div class="lobby-settings">
                    <h3>MATCH SETTINGS</h3>
                    <div class="settings-grid">
                        <div>Rounds: ${lobbyData.settings.rounds}</div>
                        <div>Time: ${lobbyData.settings.timeLimit}s</div>
                        <div>Stage: ${lobbyData.settings.stage}</div>
                    </div>
                </div>
                
                <div class="lobby-controls">
                    ${this.state.isHost ? 
                        `<button class="tekken-btn" id="startMatchBtn">START MATCH</button>` : 
                        ''
                    }
                    <button class="tekken-btn" id="leaveLobbyBtn">LEAVE LOBBY</button>
                    ${this.state.isHost ? 
                        `<button class="tekken-btn" id="lobbySettingsBtn">SETTINGS</button>` : 
                        ''
                    }
                </div>
            </div>
        `;
        
        return lobbyUI;
    }
    
    renderLobbyPlayers(players, hostId) {
        return Object.entries(players).map(([playerId, player]) => `
            <div class="lobby-player ${playerId === this.state.playerId ? 'current-player' : ''}">
                <div class="player-info">
                    <div class="player-name">${player.name} ${playerId === hostId ? '👑' : ''}</div>
                    <div class="player-character">${CHARACTERS[player.character]?.name || 'Not Selected'}</div>
                    <div class="player-ping">${player.ping || 0}ms</div>
                </div>
                <div class="player-status">
                    <div class="ready-status ${player.ready ? 'ready' : 'not-ready'}">
                        ${player.ready ? '✅ READY' : '❌ NOT READY'}
                    </div>
                    ${playerId === this.state.playerId ? 
                        `<button class="ready-toggle" id="toggleReady">${player.ready ? 'UNREADY' : 'READY'}</button>` : 
                        ''
                    }
                </div>
            </div>
        `).join('');
    }
    
    setupLobbyListener(lobbyCode) {
        const lobbyRef = ref(window.firebaseDatabase, `lobbies/${lobbyCode}`);
        
        const listener = onValue(lobbyRef, (snapshot) => {
            if (!snapshot.exists()) {
                // Lobby was deleted
                this.leaveLobby();
                return;
            }
            
            const lobby = snapshot.val();
            this.updateLobbyUI(lobby);
            
            // Check if match should start
            if (lobby.status === 'starting') {
                this.startOnlineMatchFromLobby(lobby);
            }
        });
        
        this.lobbyListeners.set(lobbyCode, listener);
    }
    
    updateLobbyUI(lobby) {
        const playersContainer = document.getElementById('lobbyPlayers');
        if (playersContainer) {
            playersContainer.innerHTML = this.renderLobbyPlayers(lobby.players, lobby.host);
        }
        
        // Update start button based on readiness
        if (this.state.isHost) {
            const startBtn = document.getElementById('startMatchBtn');
            if (startBtn) {
                const allReady = Object.values(lobby.players).every(player => player.ready);
                startBtn.disabled = !allReady;
            }
        }
    }
    
    async startOnlineMatchFromLobby(lobby) {
        // Update game state for online match
        gameState.gameMode = 'online';
        gameState.onlineMatch = {
            lobbyCode: lobby.code,
            players: lobby.players,
            settings: lobby.settings,
            isHost: this.state.isHost
        };
        
        // Transition to game screen
        showScreen('gameScreen');
        
        setTimeout(() => {
            if (typeof initThreeJS === 'function') {
                initThreeJS();
            }
            startGame();
        }, 3000);
    }
    
    async leaveLobby() {
        if (!this.state.currentLobby) return;
        
        // Remove player from lobby
        await remove(ref(window.firebaseDatabase, `lobbies/${this.state.currentLobby}/players/${this.state.playerId}`));
        
        // Clean up lobby if empty
        if (this.state.isHost) {
            const lobbyRef = ref(window.firebaseDatabase, `lobbies/${this.state.currentLobby}`);
            const snapshot = await get(lobbyRef);
            if (snapshot.exists()) {
                const lobby = snapshot.val();
                if (Object.keys(lobby.players).length === 0) {
                    await remove(lobbyRef);
                } else {
                    // Transfer host
                    const newHost = Object.keys(lobby.players)[0];
                    await update(ref(window.firebaseDatabase, `lobbies/${this.state.currentLobby}`), {
                        host: newHost
                    });
                }
            }
        }
        
        // Clean up UI and state
        const lobbyUI = document.getElementById('lobbyUI');
        if (lobbyUI) lobbyUI.remove();
        
        const listener = this.lobbyListeners.get(this.state.currentLobby);
        if (listener) listener();
        
        this.state.currentLobby = null;
        this.state.isHost = false;
    }
    
    showErrorMessage(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(255,0,0,0.9);
            color: white;
            padding: 20px 40px;
            border-radius: 10px;
            font-weight: bold;
            z-index: 10000;
        `;
        
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 3000);
    }
}

// Initialize enhanced online system
const onlineManager = new OnlineManager();

// Make available globally
window.onlineManager = onlineManager;
window.findEnhancedMatch = () => onlineManager.findEnhancedMatch();
window.createEnhancedLobby = (settings) => onlineManager.createEnhancedLobby(settings);
window.leaveLobby = () => onlineManager.leaveLobby();

// Initialize when game starts
if (typeof initEnhancedGame === 'function') {
    // Wait for game initialization then initialize online
    setTimeout(() => {
        onlineManager.initialize();
    }, 2000);
}
