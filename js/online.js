import { db, collection, addDoc, doc, setDoc, getDoc, updateDoc, onSnapshot, query, where, orderBy, limit, serverTimestamp, deleteDoc } from './firebase.js';

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
    }

    generatePlayerId() {
        return 'player_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }

    async createRoom(characterId) {
        try {
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
                createdAt: serverTimestamp(),
                players: [this.playerId]
            };

            const roomRef = doc(collection(db, 'rooms'), roomCode);
            await setDoc(roomRef, roomData);
            
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
            const roomRef = doc(db, 'rooms', roomCode);
            const roomSnap = await getDoc(roomRef);
            
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
            
            await updateDoc(roomRef, {
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
        if (!this.currentRoom) return;
        
        try {
            const roomRef = doc(db, 'rooms', this.currentRoom);
            const roomSnap = await getDoc(roomRef);
            
            if (roomSnap.exists()) {
                const roomData = roomSnap.data();
                
                if (this.isHost) {
                    await deleteDoc(roomRef);
                } else {
                    await updateDoc(roomRef, {
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
        if (!this.currentRoom) return;
        
        try {
            const roomRef = doc(db, 'rooms', this.currentRoom);
            const field = this.isHost ? 'hostReady' : 'guestReady';
            
            await updateDoc(roomRef, {
                [field]: ready
            });
        } catch (error) {
            console.error('Error setting ready status:', error);
        }
    }

    async startGame() {
        if (!this.currentRoom || !this.isHost) return;
        
        try {
            const roomRef = doc(db, 'rooms', this.currentRoom);
            await updateDoc(roomRef, {
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
        if (!this.currentRoom) return;
        
        try {
            const roomRef = doc(db, 'rooms', this.currentRoom);
            await updateDoc(roomRef, {
                gameState: gameState
            });
        } catch (error) {
            console.error('Error updating game state:', error);
        }
    }

    async sendChatMessage(message) {
        if (!this.currentRoom) return;
        
        try {
            await addDoc(collection(db, 'rooms', this.currentRoom, 'chat'), {
                playerId: this.playerId,
                message: message,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error sending chat message:', error);
        }
    }

    async submitScore(score) {
        try {
            const playerName = localStorage.getItem('playerName') || `Player${this.playerId.substr(-4)}`;
            
            await addDoc(collection(db, 'leaderboard'), {
                playerId: this.playerId,
                playerName: playerName,
                score: score,
                timestamp: serverTimestamp()
            });
        } catch (error) {
            console.error('Error submitting score:', error);
        }
    }

    listenToRoomChanges() {
        if (!this.currentRoom) return;
        
        const roomRef = doc(db, 'rooms', this.currentRoom);
        this.roomListener = onSnapshot(roomRef, (snapshot) => {
            if (!snapshot.exists()) {
                this.handleRoomClosed();
                return;
            }
            
            const roomData = snapshot.data();
            this.handleRoomUpdate(roomData);
        });
    }

    listenToGameState() {
        if (!this.currentRoom) return;
        
        const gameRef = doc(db, 'rooms', this.currentRoom);
        this.gameListener = onSnapshot(gameRef, (snapshot) => {
            if (!snapshot.exists()) return;
            
            const roomData = snapshot.data();
            if (roomData.gameState && !this.isHost) {
                this.handleGameStateUpdate(roomData.gameState);
            }
        });
    }

    listenToChat() {
        if (!this.currentRoom) return;
        
        const chatRef = collection(db, 'rooms', this.currentRoom, 'chat');
        const chatQuery = query(chatRef, orderBy('timestamp', 'desc'), limit(20));
        
        this.chatListener = onSnapshot(chatQuery, (snapshot) => {
            const messages = [];
            snapshot.forEach(doc => {
                messages.push(doc.data());
            });
            messages.reverse();
            this.handleChatUpdate(messages);
        });
    }

    listenToLeaderboard() {
        const leaderboardRef = collection(db, 'leaderboard');
        const leaderboardQuery = query(leaderboardRef, orderBy('score', 'desc'), limit(10));
        
        this.leaderboardListener = onSnapshot(leaderboardQuery, (snapshot) => {
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
        try {
            const roomsRef = collection(db, 'rooms');
            const roomsQuery = query(roomsRef, where('status', '==', 'waiting'));
            
            return new Promise((resolve) => {
                const unsubscribe = onSnapshot(roomsQuery, (snapshot) => {
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

window.OnlineManager = OnlineManager;
window.onlineManager = new OnlineManager();
