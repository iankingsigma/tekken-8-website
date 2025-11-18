// js/online.js
// Fixed online.js for V5

// Enhanced online state
let onlineState = {
    isOnline: false,
    playerId: null,
    playerName: `Player${Math.floor(Math.random() * 10000)}`,
    currentLobby: null,
    isHost: false,
    friends: [],
    friendCode: null,
    pendingInvites: [],
    connectionStatus: 'disconnected',
    matchmakingQueue: [],
    ping: 0
};

// Improved initialization
async function initOnlineSystem() {
    try {
        if (!window.firebaseAuth) {
            console.error('Firebase not initialized');
            showOfflineMode();
            return;
        }

        // Test connection first
        const connectionTest = await testConnection();
        if (!connectionTest) {
            showOfflineMode();
            return;
        }

        // Sign in anonymously with retry
        const userCredential = await signInAnonymouslyWithRetry(window.firebaseAuth);
        onlineState.playerId = userCredential.user.uid;
        onlineState.friendCode = generateFriendCode();
        
        // Create player profile with error handling
        await setWithRetry(ref(window.firebaseDatabase, 'players/' + onlineState.playerId), {
            name: onlineState.playerName,
            friendCode: onlineState.friendCode,
            status: 'online',
            lastActive: Date.now(),
            version: '5.0'
        });
        
        onlineState.isOnline = true;
        onlineState.connectionStatus = 'connected';
        updateOnlineStatus();
        
        // Start connection monitoring
        startConnectionMonitor();
        
        console.log('Online system initialized successfully:', onlineState.playerId);
        
    } catch (error) {
        console.error('Online system initialization failed:', error);
        showOfflineMode();
    }
}

// Connection testing
async function testConnection() {
    try {
        const testRef = ref(window.firebaseDatabase, 'connectionTest');
        await set(testRef, { test: Date.now() });
        await remove(testRef);
        return true;
    } catch (error) {
        console.error('Connection test failed:', error);
        return false;
    }
}

// Retry mechanism for Firebase operations
async function setWithRetry(ref, data, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            await set(ref, data);
            return true;
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

async function signInAnonymouslyWithRetry(auth, maxRetries = 3) {
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await signInAnonymously(auth);
        } catch (error) {
            if (i === maxRetries - 1) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}

// Connection monitoring
function startConnectionMonitor() {
    setInterval(async () => {
        try {
            const startTime = Date.now();
            await testConnection();
            onlineState.ping = Date.now() - startTime;
            onlineState.connectionStatus = 'connected';
        } catch (error) {
            onlineState.connectionStatus = 'disconnected';
            console.warn('Connection lost, attempting reconnect...');
            await attemptReconnect();
        }
        updateOnlineStatus();
    }, 5000);
}

async function attemptReconnect() {
    try {
        await initOnlineSystem();
    } catch (error) {
        console.error('Reconnection failed:', error);
    }
}

// Enhanced quick match with ELO-like system
async function findQuickMatch() {
    if (!onlineState.isOnline) {
        alert('Online system not available. Using offline mode.');
        startBattle('arcade');
        return;
    }
    
    if (!gameState.selectedCharacter) {
        alert('Please select a character first!');
        showScreen('characterSelect');
        return;
    }

    const quickMatchRef = ref(window.firebaseDatabase, 'quickMatch');
    
    // Clean up old matches first
    await cleanupOldQuickMatches();
    
    const playerData = {
        playerId: onlineState.playerId,
        playerName: onlineState.playerName,
        character: gameState.selectedCharacter,
        timestamp: Date.now(),
        ping: onlineState.ping,
        region: getPlayerRegion()
    };
    
    // Check for existing matches with better matching
    const snapshot = await get(quickMatchRef);
    if (snapshot.exists()) {
        const matches = snapshot.val();
        const availableMatch = findBestMatch(matches, playerData);
        
        if (availableMatch) {
            // Join existing match
            const matchKey = availableMatch.key;
            const opponent = availableMatch.data;
            await remove(ref(window.firebaseDatabase, `quickMatch/${matchKey}`));
            await createOnlineLobby(opponent.playerId, 'Quick Match', '', 2, true);
            return;
        }
    }
    
    // Create new quick match entry with expiration
    const newMatchRef = push(quickMatchRef);
    await set(newMatchRef, playerData);
    
    // Set auto-expiration
    setTimeout(async () => {
        try {
            await remove(ref(window.firebaseDatabase, `quickMatch/${newMatchRef.key}`));
        } catch (error) {
            console.log('Match already removed');
        }
    }, 30000);
    
    showQuickMatchWaiting();
    
    // Listen for match with better real-time updates
    const matchListener = onValue(quickMatchRef, (snapshot) => {
        if (!snapshot.exists()) {
            matchListener();
            hideQuickMatchWaiting();
            return;
        }
        
        const matches = snapshot.val();
        const bestMatch = findBestMatch(matches, playerData);
        
        if (bestMatch && bestMatch.key !== newMatchRef.key) {
            matchListener();
            remove(ref(window.firebaseDatabase, `quickMatch/${newMatchRef.key}`));
            remove(ref(window.firebaseDatabase, `quickMatch/${bestMatch.key}`));
            createOnlineLobby(bestMatch.data.playerId, 'Quick Match', '', 2, true);
        }
    });
    
    // Timeout after 30 seconds
    setTimeout(() => {
        matchListener();
        remove(ref(window.firebaseDatabase, `quickMatch/${newMatchRef.key}`));
        hideQuickMatchWaiting();
        if (confirm('No opponents found. Would you like to play against CPU instead?')) {
            startBattle('arcade');
        }
    }, 30000);
}

// Improved matchmaking algorithm
function findBestMatch(matches, playerData) {
    let bestMatch = null;
    let bestScore = -1;
    
    Object.entries(matches).forEach(([key, match]) => {
        if (match.playerId === playerData.playerId) return;
        
        let score = 0;
        
        // Ping-based matching (lower ping difference = better)
        const pingDiff = Math.abs((match.ping || 100) - (playerData.ping || 100));
        score += Math.max(0, 100 - pingDiff);
        
        // Region-based matching
        if (match.region === playerData.region) {
            score += 50;
        }
        
        // Time-based decay (prefer newer matches)
        const timeDiff = Date.now() - match.timestamp;
        score += Math.max(0, 30 - (timeDiff / 1000));
        
        if (score > bestScore) {
            bestScore = score;
            bestMatch = { key, data: match };
        }
    });
    
    return bestScore > 50 ? bestMatch : null;
}

function getPlayerRegion() {
    // Simple region detection based on timezone
    const offset = new Date().getTimezoneOffset();
    if (offset === 0) return 'eu';
    if (offset === 300) return 'us';
    if (offset === 480) return 'asia';
    return 'global';
}

// Enhanced lobby system with heartbeat
async function createOnlineLobby(opponentId = null, lobbyName = 'Private Lobby', password = '', maxPlayers = 2, isQuickMatch = false) {
    if (!onlineState.isOnline) {
        alert('Online system unavailable');
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
                ready: false,
                ping: onlineState.ping
            }
        },
        maxPlayers: maxPlayers,
        status: 'waiting',
        created: Date.now(),
        isQuickMatch: isQuickMatch,
        lastHeartbeat: Date.now()
    };
    
    if (opponentId) {
        lobbyData.players[opponentId] = {
            name: 'Opponent',
            character: null,
            ready: false,
            ping: 0
        };
    }
    
    await setWithRetry(ref(window.firebaseDatabase, `lobbies/${lobbyCode}`), lobbyData);
    
    onlineState.currentLobby = lobbyCode;
    onlineState.isHost = true;
    
    // Start heartbeat for lobby
    startLobbyHeartbeat(lobbyCode);
    
    await joinLobby(lobbyCode, password);
}

function startLobbyHeartbeat(lobbyCode) {
    if (!onlineState.isHost) return;
    
    const heartbeatInterval = setInterval(async () => {
        if (onlineState.currentLobby !== lobbyCode) {
            clearInterval(heartbeatInterval);
            return;
        }
        
        try {
            await update(ref(window.firebaseDatabase, `lobbies/${lobbyCode}`), {
                lastHeartbeat: Date.now()
            });
        } catch (error) {
            console.error('Lobby heartbeat failed:', error);
            clearInterval(heartbeatInterval);
        }
    }, 10000);
}

// Enhanced lobby cleanup
async function cleanupOldQuickMatches() {
    const quickMatchRef = ref(window.firebaseDatabase, 'quickMatch');
    const lobbiesRef = ref(window.firebaseDatabase, 'lobbies');
    
    try {
        const [matchesSnapshot, lobbiesSnapshot] = await Promise.all([
            get(quickMatchRef),
            get(lobbiesRef)
        ]);
        
        const now = Date.now();
        const cleanupPromises = [];
        
        // Clean old quick matches
        if (matchesSnapshot.exists()) {
            const matches = matchesSnapshot.val();
            Object.keys(matches).forEach(key => {
                if (now - matches[key].timestamp > 30000) {
                    cleanupPromises.push(remove(ref(window.firebaseDatabase, `quickMatch/${key}`)));
                }
            });
        }
        
        // Clean old lobbies
        if (lobbiesSnapshot.exists()) {
            const lobbies = lobbiesSnapshot.val();
            Object.keys(lobbies).forEach(key => {
                if (now - lobbies[key].lastHeartbeat > 60000) {
                    cleanupPromises.push(remove(ref(window.firebaseDatabase, `lobbies/${key}`)));
                }
            });
        }
        
        await Promise.all(cleanupPromises);
    } catch (error) {
        console.error('Cleanup failed:', error);
    }
}

// Offline mode fallback
function showOfflineMode() {
    onlineState.isOnline = false;
    onlineState.connectionStatus = 'offline';
    updateOnlineStatus();
    
    // Disable online features in UI
    const onlineBtn = document.getElementById('onlineBtn');
    if (onlineBtn) {
        onlineBtn.disabled = true;
        onlineBtn.innerHTML = 'ONLINE MODE (OFFLINE)';
    }
}

// Enhanced status display
function updateOnlineStatus() {
    const statusElement = document.getElementById('onlineStatus');
    if (!statusElement) return;
    
    let statusHTML = '';
    
    if (onlineState.isOnline) {
        statusHTML = `
            <div class="status-online">
                🟢 ONLINE - ${onlineState.playerName} (${onlineState.friendCode})
                ${onlineState.ping ? `<br><small>Ping: ${onlineState.ping}ms</small>` : ''}
            </div>
        `;
    } else {
        statusHTML = `
            <div class="status-offline">
                🔴 OFFLINE - Playing in offline mode
            </div>
        `;
    }
    
    statusElement.innerHTML = statusHTML;
}

// Make sure to update all function exports at the bottom
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
