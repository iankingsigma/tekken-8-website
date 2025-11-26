// Authentication System
class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = JSON.parse(localStorage.getItem('brainrot_users')) || {};
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('brainrot_current_user');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showMainMenu();
        } else {
            this.showAuthScreen();
        }

        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.login());
        document.getElementById('signupBtn').addEventListener('click', () => this.signup());
        document.getElementById('saveAvatarBtn').addEventListener('click', () => this.saveAvatar());
        document.getElementById('continueToGameBtn').addEventListener('click', () => this.showMainMenu());
    }

    login() {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;

        if (!email || !password) {
            this.showAuthStatus('Please fill all fields', 'error');
            return;
        }

        if (this.users[email] && this.users[email].password === password) {
            this.currentUser = this.users[email];
            localStorage.setItem('brainrot_current_user', JSON.stringify(this.currentUser));
            this.showProfileSetup();
        } else {
            this.showAuthStatus('Invalid email or password', 'error');
        }
    }

    signup() {
        const email = document.getElementById('authEmail').value;
        const password = document.getElementById('authPassword').value;
        const username = document.getElementById('authUsername').value;

        if (!email || !password || !username) {
            this.showAuthStatus('Please fill all fields', 'error');
            return;
        }

        if (this.users[email]) {
            this.showAuthStatus('Email already exists', 'error');
            return;
        }

        // Create new user
        this.users[email] = {
            email,
            password,
            username,
            coins: 1000,
            highScore: 0,
            unlockedCharacters: ['67', '41', '21', '201'],
            unlockedBackgrounds: [],
            avatar: {
                type: 'color',
                value: '#ff0000'
            },
            friends: [],
            friendCode: this.generateFriendCode()
        };

        this.currentUser = this.users[email];
        localStorage.setItem('brainrot_users', JSON.stringify(this.users));
        localStorage.setItem('brainrot_current_user', JSON.stringify(this.currentUser));
        
        this.showAuthStatus('Account created successfully!', 'success');
        this.showProfileSetup();
    }

    generateFriendCode() {
        return Math.random().toString(36).substring(2, 8).toUpperCase();
    }

    saveAvatar() {
        const color = document.getElementById('avatarColor').value;
        const url = document.getElementById('avatarUrl').value;

        if (url) {
            this.currentUser.avatar = { type: 'url', value: url };
        } else {
            this.currentUser.avatar = { type: 'color', value: color };
        }

        // Update in storage
        this.users[this.currentUser.email] = this.currentUser;
        localStorage.setItem('brainrot_users', JSON.stringify(this.users));
        localStorage.setItem('brainrot_current_user', JSON.stringify(this.currentUser));

        this.updateAvatarPreview();
        this.showAuthStatus('Avatar saved!', 'success');
    }

    updateAvatarPreview() {
        const preview = document.getElementById('avatarPreview');
        if (this.currentUser.avatar.type === 'url') {
            preview.innerHTML = `<img src="${this.currentUser.avatar.value}" alt="Avatar" style="width: 100px; height: 100px; border-radius: 50%;">`;
        } else {
            preview.style.backgroundColor = this.currentUser.avatar.value;
        }
    }

    showAuthScreen() {
        document.getElementById('authScreen').classList.add('active');
        document.getElementById('deviceDetection').classList.remove('active');
        document.getElementById('profileSetup').style.display = 'none';
    }

    showProfileSetup() {
        document.getElementById('profileSetup').style.display = 'block';
        this.updateAvatarPreview();
    }

    showMainMenu() {
        document.getElementById('authScreen').classList.remove('active');
        document.getElementById('deviceDetection').classList.add('active');
        
        // Update UI with user info
        if (this.currentUser) {
            document.getElementById('userName').textContent = this.currentUser.username;
            document.getElementById('userCoins').textContent = this.currentUser.coins;
            document.getElementById('highScore').textContent = this.currentUser.highScore;

            // Update avatar in menu
            const userAvatar = document.getElementById('userAvatar');
            if (this.currentUser.avatar.type === 'url') {
                userAvatar.src = this.currentUser.avatar.value;
            } else {
                userAvatar.src = '';
                userAvatar.style.backgroundColor = this.currentUser.avatar.value;
            }
        }
    }

    showAuthStatus(message, type) {
        const status = document.getElementById('authStatus');
        status.textContent = message;
        status.className = `auth-status ${type}`;
        setTimeout(() => {
            status.textContent = '';
            status.className = 'auth-status';
        }, 3000);
    }

    // Getters for other systems to access user data
    getUser() {
        return this.currentUser;
    }

    updateUserCoins(coins) {
        if (this.currentUser) {
            this.currentUser.coins = coins;
            this.users[this.currentUser.email] = this.currentUser;
            localStorage.setItem('brainrot_users', JSON.stringify(this.users));
            localStorage.setItem('brainrot_current_user', JSON.stringify(this.currentUser));
            document.getElementById('userCoins').textContent = coins;
        }
    }

    updateHighScore(score) {
        if (this.currentUser && score > this.currentUser.highScore) {
            this.currentUser.highScore = score;
            this.users[this.currentUser.email] = this.currentUser;
            localStorage.setItem('brainrot_users', JSON.stringify(this.users));
            localStorage.setItem('brainrot_current_user', JSON.stringify(this.currentUser));
            document.getElementById('highScore').textContent = score;
        }
    }
}

// Initialize auth system when page loads
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
});