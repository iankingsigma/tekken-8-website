// Online Multiplayer System for Brainrot Fighters v4.5

// Online State
let onlineState = {
    isOnline: false,
    playerId: null,
    playerName: `Player${Math.floor(Math.random() * 10000)}`,
    currentLobby: null,
    isHost: false,
    friends: [],
    friendCode: null,
    pendingInvites: []
};

// Initialize Online System
async function initOnlineSystem() {
    try {
        if (!window.firebaseAuth) {
            console.error('Firebase not initialized');
            return;
        }

        // Sign in anonymously
        const userCredential = await signInAnonymously(window.firebaseAuth);
        onlineState.playerId = userCredential.user.uid;
        onlineState.friendCode = generateFriendCode();
        
        // Create player profile
        await set(ref(window.firebaseDatabase, 'players/' + onlineState.playerId), {
            name: onlineState.playerName,
            friendCode: onlineState.friendCode,
            status: 'online',
            lastActive: Date.now()
        });
        
        onlineState.isOnline = true;
        updateOnlineStatus();
        console.log('Online system initialized:', onlineState.playerId);
        
    } catch (error) {
        console.error('Online system initialization failed:', error);
        onlineState.isOnline = false;
    }
}

// Generate unique friend code
function generateFriendCode() {
    return 'BR' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Update online status display
function updateOnlineStatus() {
    const statusElement = document.getElementById('onlineStatus');
    if (statusElement) {
        if (onlineState.isOnline) {
            statusElement.innerHTML = `<div class="status-online">🟢 ONLINE - ${onlineState.playerName} (${onlineState.friendCode})</div>`;
        } else {
            statusElement.innerHTML = `<div class="status-offline">🔴 OFFLINE</div>`;
        }
    }
}

// Quick Match System
async function findQuickMatch() {
    if (!onlineState.isOnline) {
        alert('Online system not available');
        return;
    }
    
    if (!gameState.selectedCharacter) {
        alert('Please select a character first!');
        showScreen('characterSelect');
        return;
    }

    const quickMatchRef = ref(window.firebaseDatabase, 'quickMatch');
    const playerData = {
        playerId: onlineState.playerId,
        playerName: onlineState.playerName,
        character: gameState.selectedCharacter,
        timestamp: Date.now()
    };
    
    // Remove old quick match entries
    cleanupOldQuickMatches();
    
    // Check for existing quick matches
    const snapshot = await get(quickMatchRef);
    if (snapshot.exists()) {
        const matches = snapshot.val();
        const availableMatch = Object.keys(matches).find(key => 
            matches[key].playerId !== onlineState.playerId
        );
        
        if (availableMatch) {
            // Join existing match
            const matchKey = availableMatch;
            const opponent = matches[matchKey];
            await remove(ref(window.firebaseDatabase, `quickMatch/${matchKey}`));
            await createOnlineLobby(opponent.playerId, 'Quick Match', '', 2, true);
            return;
        }
    }
    
    // Create new quick match entry
    const newMatchRef = push(quickMatchRef);
    await set(newMatchRef, playerData);
    
    // Show waiting message
    showQuickMatchWaiting();
    
    // Listen for match found
    const matchListener = onValue(quickMatchRef, (snapshot) => {
        if (!snapshot.exists()) {
            matchListener(); // Unsubscribe
            hideQuickMatchWaiting();
        }
    }, { onlyOnce: true });
    
    // Timeout after 30 seconds
    setTimeout(() => {
        matchListener();
        remove(ref(window.firebaseDatabase, `quickMatch/${newMatchRef.key}`));
        hideQuickMatchWaiting();
        alert('Quick match timeout. No opponents found.');
    }, 30000);
}

function showQuickMatchWaiting() {
    const onlineContent = document.querySelector('.online-content');
    if (onlineContent) {
        const waitingDiv = document.createElement('div');
        waitingDiv.id = 'quickMatchWaiting';
        waitingDiv.innerHTML = `
            <div class="waiting-message">
                <h3>🔍 FINDING OPPONENT...</h3>
                <div class="loading-spinner"></div>
                <p>Searching for players worldwide...</p>
                <button class="nav-btn" id="cancelQuickMatch">CANCEL</button>
            </div>
        `;
        onlineContent.appendChild(waitingDiv);
        
        document.getElementById('cancelQuickMatch').addEventListener('click', () => {
            remove(ref(window.firebaseDatabase, 'quickMatch'));
            hideQuickMatchWaiting();
        });
    }
}

function hideQuickMatchWaiting() {
    const waitingDiv = document.getElementById('quickMatchWaiting');
    if (waitingDiv) {
        waitingDiv.remove();
    }
}

function cleanupOldQuickMatches() {
    const quickMatchRef = ref(window.firebaseDatabase, 'quickMatch');
    get(quickMatchRef).then((snapshot) => {
        if (snapshot.exists()) {
            const matches = snapshot.val();
            const now = Date.now();
            Object.keys(matches).forEach(key => {
                if (now - matches[key].timestamp > 30000) { // 30 seconds old
                    remove(ref(window.firebaseDatabase, `quickMatch/${key}`));
                }
            });
        }
    });
}

// Lobby System
async function createOnlineLobby(opponentId = null, lobbyName = 'Private Lobby', password = '', maxPlayers = 2, isQuickMatch = false) {
    if (!onlineState.isOnline) {
        alert('Online system not available');
        return;
    }
    
    const lobbyCode = generateLobbyCode();
    const lobbyData = {
        code: lobbyCode,
        name: lobbyName,
        password: password,
        host: onlineState.playerId,
        players: {
            [onlineState.playerId]: {
                name: onlineState.playerName,
                character: gameState.selectedCharacter,
                ready: false
            }
        },
        maxPlayers: maxPlayers,
        status: 'waiting',
        created: Date.now(),
        isQuickMatch: isQuickMatch
    };
    
    if (opponentId) {
        lobbyData.players[opponentId] = {
            name: 'Opponent',
            character: null,
            ready: false
        };
    }
    
    await set(ref(window.firebaseDatabase, `lobbies/${lobbyCode}`), lobbyData);
    
    onlineState.currentLobby = lobbyCode;
    onlineState.isHost = true;
    
    // Join the lobby locally
    await joinLobby(lobbyCode, password);
}

function generateLobbyCode() {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
}

async function joinLobby(lobbyCode, password = '') {
    if (!onlineState.isOnline) {
        alert('Online system not available');
        return false;
    }
    
    const lobbyRef = ref(window.firebaseDatabase, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (!snapshot.exists()) {
        alert('Lobby not found!');
        return false;
    }
    
    const lobby = snapshot.val();
    
    if (lobby.password && lobby.password !== password) {
        alert('Incorrect password!');
        return false;
    }
    
    if (Object.keys(lobby.players).length >= lobby.maxPlayers) {
        alert('Lobby is full!');
        return false;
    }
    
    // Add player to lobby
    await update(ref(window.firebaseDatabase, `lobbies/${lobbyCode}/players/${onlineState.playerId}`), {
        name: onlineState.playerName,
        character: gameState.selectedCharacter,
        ready: false
    });
    
    onlineState.currentLobby = lobbyCode;
    onlineState.isHost = false;
    
    // Show lobby screen
    showLobbyScreen(lobbyCode);
    setupLobbyListener(lobbyCode);
    
    return true;
}

function showLobbyScreen(lobbyCode) {
    document.getElementById('lobbyBrowser').style.display = 'none';
    document.getElementById('createLobby').style.display = 'none';
    document.getElementById('joinLobby').style.display = 'none';
    document.getElementById('friendsList').style.display = 'none';
    document.getElementById('currentLobby').style.display = 'block';
    
    document.getElementById('currentLobbyName').textContent = 'Loading...';
    document.getElementById('lobbyCodeDisplay').textContent = lobbyCode;
    
    if (!onlineState.isHost) {
        document.getElementById('startMatchBtn').style.display = 'none';
    }
}

function setupLobbyListener(lobbyCode) {
    const lobbyRef = ref(window.firebaseDatabase, `lobbies/${lobbyCode}`);
    
    onValue(lobbyRef, (snapshot) => {
        if (!snapshot.exists()) {
            // Lobby was deleted
            alert('Lobby was closed by host!');
            showOnlineMainScreen();
            return;
        }
        
        const lobby = snapshot.val();
        updateLobbyDisplay(lobby);
        
        // Check if all players are ready and host can start
        if (onlineState.isHost) {
            const allReady = Object.values(lobby.players).every(player => player.ready);
            document.getElementById('startMatchBtn').disabled = !allReady;
        }
        
        // Check if game should start
        if (lobby.status === 'starting') {
            startOnlineMatch(lobby);
        }
    });
}

function updateLobbyDisplay(lobby) {
    document.getElementById('currentLobbyName').textContent = lobby.name;
    
    const playersContainer = document.getElementById('lobbyPlayers');
    playersContainer.innerHTML = '';
    
    Object.entries(lobby.players).forEach(([playerId, player]) => {
        const playerElement = document.createElement('div');
        playerElement.className = `lobby-player ${playerId === onlineState.playerId ? 'current-player' : ''}`;
        playerElement.innerHTML = `
            <div class="player-name">${player.name} ${playerId === lobby.host ? '👑' : ''}</div>
            <div class="player-character">${player.character !== null ? CHARACTERS[player.character].name : 'Not Selected'}</div>
            <div class="player-ready">${player.ready ? '✅ READY' : '❌ NOT READY'}</div>
            ${playerId === onlineState.playerId ? 
                `<button class="ready-btn" id="toggleReadyBtn">${player.ready ? 'UNREADY' : 'READY'}</button>` : 
                ''
            }
        `;
        playersContainer.appendChild(playerElement);
    });
    
    // Add event listener for ready button
    const readyBtn = document.getElementById('toggleReadyBtn');
    if (readyBtn) {
        readyBtn.onclick = toggleReadyStatus;
    }
}

async function toggleReadyStatus() {
    if (!onlineState.currentLobby) return;
    
    const playerRef = ref(window.firebaseDatabase, `lobbies/${onlineState.currentLobby}/players/${onlineState.playerId}/ready`);
    const snapshot = await get(playerRef);
    const currentReady = snapshot.val();
    
    await set(playerRef, !currentReady);
}

async function startOnlineMatch() {
    if (!onlineState.currentLobby || !onlineState.isHost) return;
    
    // Update lobby status to starting
    await update(ref(window.firebaseDatabase, `lobbies/${onlineState.currentLobby}`), {
        status: 'starting'
    });
    
    // Small delay to ensure all clients get the update
    setTimeout(() => {
        showScreen('gameScreen');
    }, 1000);
}

function startOnlineMatchFromLobby(lobby) {
    // Set up online game state
    gameState.gameMode = 'online';
    gameState.onlineMatch = {
        lobbyCode: onlineState.currentLobby,
        players: lobby.players,
        isHost: onlineState.isHost
    };
    
    // Start the game
    setTimeout(() => {
        showScreen('gameScreen');
        setTimeout(() => {
            if (typeof initThreeJS === 'function') {
                initThreeJS();
            }
            startGame();
        }, 100);
    }, 2000);
}

async function leaveLobby() {
    if (!onlineState.currentLobby) return;
    
    // Remove player from lobby
    await remove(ref(window.firebaseDatabase, `lobbies/${onlineState.currentLobby}/players/${onlineState.playerId}`));
    
    // If host leaves and no players left, delete lobby
    if (onlineState.isHost) {
        const lobbyRef = ref(window.firebaseDatabase, `lobbies/${onlineState.currentLobby}`);
        const snapshot = await get(lobbyRef);
        if (snapshot.exists()) {
            const lobby = snapshot.val();
            if (Object.keys(lobby.players).length === 0) {
                await remove(lobbyRef);
            } else {
                // Transfer host to another player
                const newHost = Object.keys(lobby.players)[0];
                await update(ref(window.firebaseDatabase, `lobbies/${onlineState.currentLobby}`), {
                    host: newHost
                });
            }
        }
    }
    
    onlineState.currentLobby = null;
    onlineState.isHost = false;
    showOnlineMainScreen();
}

// Friends System
async function addFriend(friendCode) {
    if (!onlineState.isOnline) {
        alert('Online system not available');
        return;
    }
    
    // Find player by friend code
    const playersRef = ref(window.firebaseDatabase, 'players');
    const snapshot = await get(playersRef);
    
    if (snapshot.exists()) {
        const players = snapshot.val();
        const friend = Object.entries(players).find(([id, player]) => 
            player.friendCode === friendCode && id !== onlineState.playerId
        );
        
        if (friend) {
            const [friendId, friendData] = friend;
            
            // Add to friends list
            onlineState.friends.push({
                id: friendId,
                name: friendData.name,
                friendCode: friendData.friendCode,
                status: friendData.status
            });
            
            // Save to database
            await update(ref(window.firebaseDatabase, `players/${onlineState.playerId}/friends`), onlineState.friends);
            
            alert(`Added ${friendData.name} as friend!`);
            updateFriendsList();
        } else {
            alert('Friend code not found!');
        }
    }
}

function updateFriendsList() {
    const friendsContainer = document.getElementById('friendsContainer');
    if (!friendsContainer) return;
    
    friendsContainer.innerHTML = '';
    
    onlineState.friends.forEach(friend => {
        const friendElement = document.createElement('div');
        friendElement.className = `friend-item ${friend.status === 'online' ? 'online' : 'offline'}`;
        friendElement.innerHTML = `
            <div class="friend-name">${friend.name}</div>
            <div class="friend-code">${friend.friendCode}</div>
            <div class="friend-status">${friend.status === 'online' ? '🟢 Online' : '🔴 Offline'}</div>
            <button class="invite-btn" data-friend-id="${friend.id}">INVITE</button>
        `;
        friendsContainer.appendChild(friendElement);
    });
    
    // Add invite event listeners
    document.querySelectorAll('.invite-btn').forEach(btn => {
        btn.onclick = (e) => {
            const friendId = e.target.dataset.friendId;
            inviteFriend(friendId);
        };
    });
}

async function inviteFriend(friendId) {
    if (!onlineState.isOnline) {
        alert('Online system not available');
        return;
    }
    
    // Create an invite
    const inviteData = {
        from: onlineState.playerId,
        fromName: onlineState.playerName,
        timestamp: Date.now(),
        type: 'game_invite'
    };
    
    await set(ref(window.firebaseDatabase, `invites/${friendId}/${onlineState.playerId}`), inviteData);
    alert('Invite sent!');
}

// Lobby Browsing
async function refreshLobbyList() {
    if (!onlineState.isOnline) {
        alert('Online system not available');
        return;
    }
    
    const lobbiesRef = ref(window.firebaseDatabase, 'lobbies');
    const snapshot = await get(lobbiesRef);
    
    const lobbyList = document.getElementById('lobbyList');
    lobbyList.innerHTML = '';
    
    if (snapshot.exists()) {
        const lobbies = snapshot.val();
        
        Object.entries(lobbies).forEach(([code, lobby]) => {
            if (lobby.status === 'waiting' && !lobby.players[onlineState.playerId]) {
                const playerCount = Object.keys(lobby.players).length;
                const lobbyElement = document.createElement('div');
                lobbyElement.className = 'lobby-item';
                lobbyElement.innerHTML = `
                    <div class="lobby-info">
                        <div class="lobby-name">${lobby.name}</div>
                        <div class="lobby-players">${playerCount}/${lobby.maxPlayers} Players</div>
                        <div class="lobby-privacy">${lobby.password ? '🔒 Private' : '🔓 Public'}</div>
                    </div>
                    <button class="join-lobby-btn" data-lobby-code="${code}">JOIN</button>
                `;
                lobbyList.appendChild(lobbyElement);
            }
        });
        
        // Add join event listeners
        document.querySelectorAll('.join-lobby-btn').forEach(btn => {
            btn.onclick = (e) => {
                const lobbyCode = e.target.dataset.lobbyCode;
                joinLobbyFromList(lobbyCode);
            };
        });
        
    } else {
        lobbyList.innerHTML = '<div class="no-lobbies">No public lobbies available</div>';
    }
}

async function joinLobbyFromList(lobbyCode) {
    const lobbyRef = ref(window.firebaseDatabase, `lobbies/${lobbyCode}`);
    const snapshot = await get(lobbyRef);
    
    if (snapshot.exists()) {
        const lobby = snapshot.val();
        if (lobby.password) {
            const password = prompt('Enter lobby password:');
            if (password !== null) {
                await joinLobby(lobbyCode, password);
            }
        } else {
            await joinLobby(lobbyCode);
        }
    }
}

// Online UI Management
function showOnlineMainScreen() {
    document.getElementById('lobbyBrowser').style.display = 'none';
    document.getElementById('createLobby').style.display = 'none';
    document.getElementById('joinLobby').style.display = 'none';
    document.getElementById('friendsList').style.display = 'none';
    document.getElementById('currentLobby').style.display = 'none';
}

// Make functions globally available
window.onlineState = onlineState;
window.findQuickMatch = findQuickMatch;
window.createOnlineLobby = createOnlineLobby;
window.joinLobby = joinLobby;
window.leaveLobby = leaveLobby;
window.addFriend = addFriend;
window.refreshLobbyList = refreshLobbyList;
window.showOnlineMainScreen = showOnlineMainScreen;
window.initOnlineSystem = initOnlineSystem;
window.startOnlineMatch = startOnlineMatch;
window.startOnlineMatchFromLobby = startOnlineMatchFromLobby;
