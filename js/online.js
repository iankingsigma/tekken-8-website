// Simple Firebase v9 CDN approach
class OnlineManager {
    constructor() {
        this.playerId = this.generatePlayerId();
        this.currentRoom = null;
        this.roomListener = null;
        this.gameListener = null;
        this.leaderboardListener = null;
        this.chatListener = null;
        this.isHost = false;
        this.db = null;
        
        console.log('Online Manager initialized. Player ID:', this.playerId);
        this.loadFirebase();
    }

    async loadFirebase() {
        return new Promise((resolve, reject) => {
            // Check if Firebase is already loaded
            if (window.firebase && window.firebase.firestore) {
                this.initFirebase();
                resolve();
                return;
            }

            // Load Firebase v9 CDN
            const script = document.createElement('script');
            script.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-app-compat.js';
            script.onload = () => {
                const script2 = document.createElement('script');
                script2.src = 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore-compat.js';
                script2.onload = () => {
                    this.initFirebase();
                    resolve();
                };
                script2.onerror = reject;
                document.head.appendChild(script2);
            };
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    initFirebase() {
        try {
            const firebaseConfig = {
                apiKey: "AIzaSyC_oGcKpg_AQLngNmAWFV18vH4yY0t09Dc",
                authDomain: "brainrot-fighters-servers.firebaseapp.com",
                databaseURL: "https://brainrot-fighters-servers-default-rtdb.asia-southeast1.firebasedatabase.app",
                projectId: "brainrot-fighters-servers",
                storageBucket: "brainrot-fighters-servers.appspot.com",
                messagingSenderId: "889390120088",
                appId: "1:889390120088:web:9d72aff815d75fe868e4ed",
                measurementId: "G-QWJ18BM9HZ"
            };

            firebase.initializeApp(firebaseConfig);
            this.db = firebase.firestore();
            console.log('Firebase initialized successfully');
        } catch (error) {
            console.error('Error initializing Firebase:', error);
        }
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    async createRoom(characterId) {
        try {
            if (!this.db) {
                await this.loadFirebase();
            }
            
            const roomCode = this.generateRoomCode();
            const roomData = {
                code: roomCode,
                host: this.playerId,
                hostCharacter: characterId,
                hostReady: false,
                guest: null,
                guestCharacter: null,
                guestReady: false,
                status: 'waiting',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                players: [this.playerId]
            };

            await this.db.collection('rooms').doc(roomCode).set(roomData);
            
            this.currentRoom = roomCode;
            this.isHost = true;
            
            this.listenToRoomChanges();
            this.listenToGameState();
            
            console.log('Room created:', roomCode);
            return roomCode;
        } catch (error) {
            console.error('Error creating room:', error);
            throw error;
        }
    }

    generateRoomCode() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    async joinRoom(roomCode, characterId) {
        try {
            if (!this.db) {
                await this.loadFirebase();
            }
            
            const roomRef = this.db.collection('rooms').doc(roomCode);
            const roomSnap = await roomRef.get();
            
            if (!roomSnap.exists) {
                throw new Error('Room not found');
            }
            
            const roomData = roomSnap.data();
            
            if (roomData.status !== 'waiting') {
                throw new Error('Room is not available');
            }
            
            if (roomData.players && roomData.players.length >= 2) {
                throw new Error('Room is full');
            }
            
            await roomRef.update({
                guest: this.playerId,
                guestCharacter: characterId,
                guestReady: false,
                players: firebase.firestore.FieldValue.arrayUnion(this.playerId)
            });
            
            this.currentRoom = roomCode;
            this.isHost = false;
            
            this.listenToRoomChanges();
            this.listenToGameState();
            
            console.log('Joined room:', roomCode);
            return true;
        } catch (error) {
            console.error('Error joining room:', error);
            throw error;
        }
    }

    async leaveRoom() {
        if (!this.currentRoom || !this.db) return;
        
        try {
            const roomRef = this.db.collection('rooms').doc(this.currentRoom);
            const roomSnap = await roomRef.get();
            
            if (roomSnap.exists) {
                const roomData = roomSnap.data();
                
                if (this.isHost) {
                    await roomRef.delete();
                } else {
                    await roomRef.update({
                        guest: null,
                        guestCharacter: null,
                        guestReady: false,
                        players: firebase.firestore.FieldValue.arrayRemove(this.playerId)
                    });
                }
            }
            
            this.cleanup();
        } catch (error) {
            console.error('Error leaving room:', error);
        }
    }

    async setReady(ready) {
        if (!this.currentRoom || !this.db) return;
        
        try {
            const roomRef = this.db.collection('rooms').doc(this.currentRoom);
            const field = this.isHost ? 'hostReady' : 'guestReady';
            
            await roomRef.update({
                [field]: ready
            });
        } catch (error) {
            console.error('Error setting ready status:', error);
        }
    }

    async startGame() {
        if (!this.currentRoom || !this.isHost || !this.db) return;
        
        try {
            const roomRef = this.db.collection('rooms').doc(this.currentRoom);
            await roomRef.update({
                status: 'playing',
                gameState: {
                    round: 1,
                    time: 99,
                    p1Health: 100,
                    p2Health: 100,
                    p1Position: -5,
                    p2Position: 5
                }
            });
        } catch (error) {
            console.error('Error starting game:', error);
        }
    }

    async updateGameState(gameState) {
        if (!this.currentRoom || !this.db) return;
        
        try {
            const roomRef = this.db.collection('rooms').doc(this.currentRoom);
            await roomRef.update({
                gameState: gameState
            });
        } catch (error) {
            console.error('Error updating game state:', error);
        }
    }

    async sendChatMessage(message) {
        if (!this.currentRoom || !this.db) return;
        
        try {
            await this.db.collection('rooms').doc(this.currentRoom).collection('chat').add({
                playerId: this.playerId,
                message: message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending chat message:', error);
        }
    }

    async submitScore(score) {
        if (!this.db) return;
        
        try {
            const playerName = localStorage.getItem('playerName') || `Player${this.playerId.substr(-4)}`;
            
            await this.db.collection('leaderboard').add({
                playerId: this.playerId,
                playerName: playerName,
                score: score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    listenToRoomChanges() {
        if (!this.currentRoom || !this.db) return;
        
        const roomRef = this.db.collection('rooms').doc(this.currentRoom);
        this.roomListener = roomRef.onSnapshot((snapshot) => {
            if (!snapshot.exists) {
                this.handleRoomClosed();
                return;
            }
            
            const roomData = snapshot.data();
            this.handleRoomUpdate(roomData);
        });
    }

    listenToGameState() {
        if (!this.currentRoom || !this.db) return;
        
        const gameRef = this.db.collection('rooms').doc(this.currentRoom);
        this.gameListener = gameRef.onSnapshot((snapshot) => {
            if (!snapshot.exists) return;
            
            const roomData = snapshot.data();
            if (roomData.gameState && !this.isHost) {
                this.handleGameStateUpdate(roomData.gameState);
            }
        });
    }

    listenToChat() {
        if (!this.currentRoom || !this.db) return;
        
        const chatRef = this.db.collection('rooms').doc(this.currentRoom).collection('chat')
            .orderBy('timestamp', 'desc')
            .limit(20);
        
        this.chatListener = chatRef.onSnapshot((snapshot) => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push(doc.data());
            });
            messages.reverse();
            this.handleChatUpdate(messages);
        });
    }

    listenToLeaderboard() {
        if (!this.db) return;
        
        const leaderboardRef = this.db.collection('leaderboard')
            .orderBy('score', 'desc')
            .limit(10);
        
        this.leaderboardListener = leaderboardRef.onSnapshot((snapshot) => {
            const leaderboard = [];
            snapshot.forEach(doc => {
                leaderboard.push(doc.data());
            });
            this.handleLeaderboardUpdate(leaderboard);
        });
    }

    handleRoomUpdate(roomData) {
        if (typeof window.handleRoomUpdate === 'function') {
            window.handleRoomUpdate(roomData);
        }
    }

    handleGameStateUpdate(gameState) {
        if (typeof window.handleGameStateUpdate === 'function') {
            window.handleGameStateUpdate(gameState);
        }
    }

    handleChatUpdate(messages) {
        if (typeof window.handleChatUpdate === 'function') {
            window.handleChatUpdate(messages);
        }
    }

    handleLeaderboardUpdate(leaderboard) {
        if (typeof window.handleLeaderboardUpdate === 'function') {
            window.handleLeaderboardUpdate(leaderboard);
        }
    }

    handleRoomClosed() {
        if (typeof window.handleRoomClosed === 'function') {
            window.handleRoomClosed();
        }
        this.cleanup();
    }

    cleanup() {
        if (this.roomListener) {
            this.roomListener();
            this.roomListener = null;
        }
        if (this.gameListener) {
            this.gameListener();
            this.gameListener = null;
        }
        if (this.chatListener) {
            this.chatListener();
            this.chatListener = null;
        }
        if (this.leaderboardListener) {
            this.leaderboardListener();
            this.leaderboardListener = null;
        }
        
        this.currentRoom = null;
        this.isHost = false;
    }

    async getAvailableRooms() {
        if (!this.db) {
            await this.loadFirebase();
        }
        
        try {
            const roomsRef = this.db.collection('rooms').where('status', '==', 'waiting');
            
            return new Promise((resolve) => {
                const unsubscribe = roomsRef.onSnapshot((snapshot) => {
                    const rooms = [];
                    snapshot.forEach(doc => {
                        const roomData = doc.data();
                        rooms.push({
                            id: doc.id,
                            ...roomData
                        });
                    });
                    resolve(rooms);
                    unsubscribe();
                });
            });
        } catch (error) {
            console.error('Error getting rooms:', error);
            return [];
        }
    }
}

// Initialize online manager with error handling
try {
    window.onlineManager = new OnlineManager();
    console.log('Online Manager created successfully');
} catch (error) {
    console.error('Failed to create Online Manager:', error);
    // Fallback: create a dummy onlineManager that shows error messages
    window.onlineManager = {
        createRoom: async () => { 
            alert('Online features temporarily unavailable. Please try again later.'); 
            throw new Error('Online features disabled');
        },
        joinRoom: async () => { 
            alert('Online features temporarily unavailable. Please try again later.'); 
            throw new Error('Online features disabled');
        },
        sendChatMessage: async () => { 
            alert('Chat unavailable'); 
        },
        // Add other methods as needed
    };
}

window.OnlineManager = OnlineManager;
