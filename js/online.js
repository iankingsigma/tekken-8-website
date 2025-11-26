// Updated Online System - No Friends Feature
class OnlineSystem {
    constructor() {
        this.lobbies = JSON.parse(localStorage.getItem('brainrot_lobbies')) || {};
        this.currentLobby = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Online menu buttons
        document.getElementById('onlineBtn').addEventListener('click', () => {
            this.showOnlineScreen();
        });

        document.getElementById('createLobbyBtn').addEventListener('click', () => {
            this.showCreateLobby();
        });

        document.getElementById('joinLobbyBtn').addEventListener('click', () => {
            this.showJoinLobby();
        });

        document.getElementById('confirmCreateLobby').addEventListener('click', () => {
            this.createLobby();
        });

        document.getElementById('confirmJoinLobby').addEventListener('click', () => {
            this.joinLobby();
        });

        document.getElementById('startMatchBtn').addEventListener('click', () => {
            this.startMatch();
        });

        document.getElementById('leaveLobbyBtn').addEventListener('click', () => {
            this.leaveLobby();
        });

        document.getElementById('refreshLobbiesBtn').addEventListener('click', () => {
            this.refreshLobbies();
        });

        document.getElementById('onlineBackBtn').addEventListener('click', () => {
            this.exitOnline();
        });
    }

    showOnlineScreen() {
        document.getElementById('mainMenu').classList.remove('active');
        document.getElementById('onlineScreen').classList.add('active');
        
        this.updateOnlineStatus();
        this.refreshLobbies();
    }

    updateOnlineStatus() {
        // Simple online status
        document.querySelector('.status-offline').style.display = 'block';
        document.querySelector('.status-online').style.display = 'none';
    }

    showCreateLobby() {
        this.hideAllSections();
        document.getElementById('createLobby').style.display = 'block';
    }

    showJoinLobby() {
        this.hideAllSections();
        document.getElementById('joinLobby').style.display = 'block';
    }

    hideAllSections() {
        document.getElementById('lobbyBrowser').style.display = 'none';
        document.getElementById('createLobby').style.display = 'none';
        document.getElementById('joinLobby').style.display = 'none';
        document.getElementById('currentLobby').style.display = 'none';
    }

    createLobby() {
        const name = document.getElementById('lobbyName').value;
        const password = document.getElementById('lobbyPassword').value;
        const maxPlayers = document.getElementById('lobbyMaxPlayers').value;

        if (!name) {
            this.showOnlineMessage('Please enter a lobby name', 'error');
            return;
        }

        const lobbyCode = this.generateLobbyCode();
        const lobby = {
            code: lobbyCode,
            name: name,
            password: password,
            maxPlayers: parseInt(maxPlayers),
            players: ['Player 1'],
            status: 'waiting',
            createdAt: new Date().toISOString()
        };

        this.lobbies[lobbyCode] = lobby;
        localStorage.setItem('brainrot_lobbies', JSON.stringify(this.lobbies));

        this.currentLobby = lobbyCode;
        this.showCurrentLobby();
        this.showOnlineMessage('Lobby created successfully!', 'success');
    }

    generateLobbyCode() {
        return Math.random().toString(36).substring(2, 6).toUpperCase();
    }

    joinLobby() {
        const code = document.getElementById('lobbyCodeInput').value.toUpperCase();
        const password = document.getElementById('lobbyPasswordInput').value;

        if (!code) {
            this.showOnlineMessage('Please enter a lobby code', 'error');
            return;
        }

        const lobby = this.lobbies[code];
        if (!lobby) {
            this.showOnlineMessage('Lobby not found', 'error');
            return;
        }

        if (lobby.password && lobby.password !== password) {
            this.showOnlineMessage('Incorrect password', 'error');
            return;
        }

        if (lobby.players.length >= lobby.maxPlayers) {
            this.showOnlineMessage('Lobby is full', 'error');
            return;
        }

        // Add player to lobby
        lobby.players.push('Player ' + (lobby.players.length + 1));

        this.lobbies[code] = lobby;
        localStorage.setItem('brainrot_lobbies', JSON.stringify(this.lobbies));

        this.currentLobby = code;
        this.showCurrentLobby();
        this.showOnlineMessage('Joined lobby successfully!', 'success');
    }

    showCurrentLobby() {
        this.hideAllSections();
        document.getElementById('currentLobby').style.display = 'block';

        const lobby = this.lobbies[this.currentLobby];
        document.getElementById('currentLobbyName').textContent = lobby.name;
        document.getElementById('lobbyCodeDisplay').textContent = lobby.code;

        this.updateLobbyPlayers();
    }

    updateLobbyPlayers() {
        const container = document.getElementById('lobbyPlayers');
        const lobby = this.lobbies[this.currentLobby];
        
        container.innerHTML = '';
        lobby.players.forEach((player, index) => {
            const playerElement = document.createElement('div');
            playerElement.className = 'lobby-player';
            playerElement.innerHTML = `
                <div class="player-avatar"></div>
                <div class="player-info">
                    <div class="player-username">${player} ${index === 0 ? '👑' : ''}</div>
                    <div class="player-status">Ready</div>
                </div>
            `;
            container.appendChild(playerElement);
        });

        // Show/hide start button for host
        const startBtn = document.getElementById('startMatchBtn');
        startBtn.style.display = 'block';
    }

    startMatch() {
        if (!this.currentLobby) return;

        const lobby = this.lobbies[this.currentLobby];
        if (lobby.players.length < 1) {
            this.showOnlineMessage('Need at least 2 players to start', 'error');
            return;
        }

        this.showOnlineMessage('Starting match...', 'success');
        
        // In a real implementation, you would transition to the game screen
        setTimeout(() => {
            this.showOnlineMessage('Match started!', 'success');
        }, 2000);
    }

    leaveLobby() {
        if (!this.currentLobby) return;

        const lobby = this.lobbies[this.currentLobby];
        
        // Remove player from lobby (simplified)
        if (lobby.players.length > 1) {
            lobby.players.pop();
            this.lobbies[this.currentLobby] = lobby;
        } else {
            delete this.lobbies[this.currentLobby];
        }

        localStorage.setItem('brainrot_lobbies', JSON.stringify(this.lobbies));
        
        this.currentLobby = null;
        this.hideAllSections();
        document.getElementById('lobbyBrowser').style.display = 'block';
        this.refreshLobbies();
        
        this.showOnlineMessage('Left lobby', 'info');
    }

    refreshLobbies() {
        const lobbyList = document.getElementById('lobbyList');
        lobbyList.innerHTML = '';

        Object.values(this.lobbies).forEach(lobby => {
            if (lobby.players.length < lobby.maxPlayers && lobby.status === 'waiting') {
                const lobbyElement = document.createElement('div');
                lobbyElement.className = 'lobby-item';
                lobbyElement.innerHTML = `
                    <div class="lobby-info">
                        <div class="lobby-name">${lobby.name}</div>
                        <div class="lobby-details">
                            ${lobby.players.length}/${lobby.maxPlayers} players • 
                            ${lobby.password ? '🔒' : '🔓'}
                        </div>
                    </div>
                    <button class="join-lobby-btn" data-code="${lobby.code}">JOIN</button>
                `;
                
                lobbyList.appendChild(lobbyElement);
            }
        });

        // Add event listeners to join buttons
        document.querySelectorAll('.join-lobby-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const code = e.target.dataset.code;
                document.getElementById('lobbyCodeInput').value = code;
                this.showJoinLobby();
            });
        });
    }

    showOnlineMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `online-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 10px 20px;
            background: ${type === 'error' ? '#ff0000' : type === 'success' ? '#00ff00' : '#0000ff'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 3000);
    }

    exitOnline() {
        document.getElementById('onlineScreen').classList.remove('active');
        document.getElementById('mainMenu').classList.add('active');
    }
}

// Initialize online system
let onlineSystem;
document.addEventListener('DOMContentLoaded', () => {
    onlineSystem = new OnlineSystem();
});