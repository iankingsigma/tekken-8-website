// Admin Panel System - Tiny Version
class AdminSystem {
    constructor() {
        this.adminCode = '231213';
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Admin panel toggle
        document.querySelector('.admin-toggle').addEventListener('click', () => {
            this.toggleAdminPanel();
        });

        // Admin code submission
        document.getElementById('adminSubmit').addEventListener('click', () => {
            this.checkAdminCode();
        });

        // Admin features
        document.getElementById('infiniteCoinsBtn').addEventListener('click', () => {
            this.enableInfiniteCoins();
        });

        document.getElementById('infiniteHpBtn').addEventListener('click', () => {
            this.enableInfiniteHP();
        });

        document.getElementById('infiniteParryBtn').addEventListener('click', () => {
            this.enableInfiniteParry();
        });

        document.getElementById('unlockAllBtn').addEventListener('click', () => {
            this.unlockAll();
        });

        // Keyboard shortcut for admin panel (Ctrl+Shift+A)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleAdminPanel();
            }
        });
    }

    toggleAdminPanel() {
        const content = document.querySelector('.admin-content');
        if (content.style.display === 'none') {
            content.style.display = 'block';
        } else {
            content.style.display = 'none';
        }
    }

    checkAdminCode() {
        const code = document.getElementById('adminCode').value;
        if (code === this.adminCode) {
            this.isAdmin = true;
            document.getElementById('adminFeatures').style.display = 'block';
            this.showAdminMessage('Admin access granted!', 'success');
        } else {
            this.showAdminMessage('Invalid code!', 'error');
        }
    }

    enableInfiniteCoins() {
        document.getElementById('userCoins').textContent = '999999';
        document.getElementById('coinsAmount').textContent = '999999';
        this.showAdminMessage('Infinite coins activated!', 'success');
    }

    enableInfiniteHP() {
        if (gameSystem) {
            gameSystem.infiniteHP = true;
            this.showAdminMessage('Infinite HP activated!', 'success');
        }
    }

    enableInfiniteParry() {
        if (gameSystem) {
            gameSystem.infiniteParry = true;
            this.showAdminMessage('Infinite Parry activated!', 'success');
        }
    }

    unlockAll() {
        // Unlock all characters and backgrounds
        const difficultySelect = document.getElementById('difficultySelect');
        if (!difficultySelect.querySelector('option[value="67boss"]')) {
            const bossOption = document.createElement('option');
            bossOption.value = '67boss';
            bossOption.textContent = '67 BOSS';
            difficultySelect.appendChild(bossOption);
        }
        
        // Unlock shop items
        document.getElementById('purchaseBgColor').style.display = 'none';
        document.getElementById('purchaseBgUrl').style.display = 'none';
        document.querySelector('.color-picker').style.display = 'block';
        document.querySelector('.url-picker').style.display = 'block';
        
        this.showAdminMessage('All content unlocked!', 'success');
    }

    showAdminMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `admin-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 15px 30px;
            background: ${type === 'error' ? '#ff0000' : '#00ff00'};
            color: ${type === 'error' ? 'white' : 'black'};
            border-radius: 8px;
            z-index: 10000;
            font-weight: bold;
            font-size: 16px;
            box-shadow: 0 10px 25px rgba(0,0,0,0.5);
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 2000);
    }
}

// Initialize admin system
let adminSystem;
document.addEventListener('DOMContentLoaded', () => {
    adminSystem = new AdminSystem();
});