// Firebase configuration
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

class OnlineManager {
    constructor() {
        this.playerId = this.generatePlayerId();
        this.currentRoom = null;
        this.roomListener = null;
        this.gameListener = null;
        this.leaderboardListener = null;
        this.chatListener = null;
        this.isHost = false;
        
        console.log('Online Manager initialized. Player ID:', this.playerId);
        this.initFirebase();
    }

    async initFirebase() {
        try {
            // Dynamically import Firebase modules
            const { initializeApp } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js');
            const { getFirestore, collection, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, deleteDoc, addDoc } = await import('https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js');
            
            this.firebase = { 
                initializeApp, 
                getFirestore, 
                collection, 
                doc, 
                setDoc, 
                getDoc, 
                updateDoc, 
                onSnapshot, 
                query, 
                where, 
                orderBy, 
                limit, 
                serverTimestamp, 
                deleteDoc, 
                addDoc 
            };
            
            this.app = initializeApp(firebaseConfig);
            this.db = getFirestore(this.app);
            
            console.log('Firebase initialized successfully');
            
            // Initialize listeners if we're in a room
            if (this.currentRoom) {
                this.listenToRoomChanges();
                this.listenToGameState();
            }
            
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
                await this.initFirebase();
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
                createdAt: this.firebase.serverTimestamp(),
                players: [this.playerId]
            };

            const roomRef = this.firebase.doc(this.firebase.collection(this.db, 'rooms'), roomCode);
            await this.firebase.setDoc(roomRef, roomData);
            
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
                await this.initFirebase();
            }
            
            const roomRef = this.firebase.doc(this.db, 'rooms', roomCode);
            const roomSnap = await this.firebase.getDoc(roomRef);
            
            if (!roomSnap.exists()) {
                throw new Error('Room not found');
            }
            
            const roomData = roomSnap.data();
            
            if (roomData.status !== 'waiting') {
                throw new Error('Room is not available');
            }
            
            if (roomData.players && roomData.players.length >= 2) {
                throw new Error('Room is full');
            }
            
            await this.firebase.updateDoc(roomRef, {
                guest: this.playerId,
                guestCharacter: characterId,
                guestReady: false,
                players: [...(roomData.players || []), this.playerId]
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
            const roomRef = this.firebase.doc(this.db, 'rooms', this.currentRoom);
            const roomSnap = await this.firebase.getDoc(roomRef);
            
            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                
                if (this.isHost) {
                    await this.firebase.deleteDoc(roomRef);
                } else {
                    await this.firebase.updateDoc(roomRef, {
                        guest: null,
                        guestCharacter: null,
                        guestReady: false,
                        players: roomData.players.filter(p => p !== this.playerId)
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
            const roomRef = this.firebase.doc(this.db, 'rooms', this.currentRoom);
            const field = this.isHost ? 'hostReady' : 'guestReady';
            
            await this.firebase.updateDoc(roomRef, {
                [field]: ready
            });
        } catch (error) {
            console.error('Error setting ready status:', error);
        }
    }

    async startGame() {
        if (!this.currentRoom || !this.isHost || !this.db) return;
        
        try {
            const roomRef = this.firebase.doc(this.db, 'rooms', this.currentRoom);
            await this.firebase.updateDoc(roomRef, {
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
            const roomRef = this.firebase.doc(this.db, 'rooms', this.currentRoom);
            await this.firebase.updateDoc(roomRef, {
                gameState: gameState
            });
        } catch (error) {
            console.error('Error updating game state:', error);
        }
    }

    async sendChatMessage(message) {
        if (!this.currentRoom || !this.db) return;
        
        try {
            await this.firebase.addDoc(this.firebase.collection(this.db, 'rooms', this.currentRoom, 'chat'), {
                playerId: this.playerId,
                message: message,
                timestamp: this.firebase.serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending chat message:', error);
        }
    }

    async submitScore(score) {
        if (!this.db) return;
        
        try {
            const playerName = localStorage.getItem('playerName') || `Player${this.playerId.substr(-4)}`;
            
            await this.firebase.addDoc(this.firebase.collection(this.db, 'leaderboard'), {
                playerId: this.playerId,
                playerName: playerName,
                score: score,
                timestamp: this.firebase.serverTimestamp()
            });
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    listenToRoomChanges() {
        if (!this.currentRoom || !this.db) return;
        
        const roomRef = this.firebase.doc(this.db, 'rooms', this.currentRoom);
        this.roomListener = this.firebase.onSnapshot(roomRef, (snapshot) => {
            if (!snapshot.exists()) {
                this.handleRoomClosed();
                return;
            }
            
            const roomData = snapshot.data();
            this.handleRoomUpdate(roomData);
        });
    }

    listenToGameState() {
        if (!this.currentRoom || !this.db) return;
        
        const gameRef = this.firebase.doc(this.db, 'rooms', this.currentRoom);
        this.gameListener = this.firebase.onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) return;
            
            const roomData = snapshot.data();
            if (roomData.gameState && !this.isHost) {
                this.handleGameStateUpdate(roomData.gameState);
            }
        });
    }

    listenToChat() {
        if (!this.currentRoom || !this.db) return;
        
        const chatRef = this.firebase.collection(this.db, 'rooms', this.currentRoom, 'chat');
        const chatQuery = this.firebase.query(chatRef, this.firebase.orderBy('timestamp', 'desc'), this.firebase.limit(20));
        
        this.chatListener = this.firebase.onSnapshot(chatQuery, (snapshot) => {
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
        
        const leaderboardRef = this.firebase.collection(this.db, 'leaderboard');
        const leaderboardQuery = this.firebase.query(leaderboardRef, this.firebase.orderBy('score', 'desc'), this.firebase.limit(10));
        
        this.leaderboardListener = this.firebase.onSnapshot(leaderboardQuery, (snapshot) => {
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
            await this.initFirebase();
        }
        
        try {
            const roomsRef = this.firebase.collection(this.db, 'rooms');
            const roomsQuery = this.firebase.query(roomsRef, this.firebase.where('status', '==', 'waiting'));
            
            return new Promise((resolve) => {
                const unsubscribe = this.firebase.onSnapshot(roomsQuery, (snapshot) => {
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

// Initialize online manager immediately
window.onlineManager = new OnlineManager();

// Also export for debugging
window.OnlineManager = OnlineManager;
