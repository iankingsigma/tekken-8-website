// Admin Panel System
class AdminSystem {
    constructor() {
        this.adminCode = '231213';
        this.isAdmin = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupMobileAdmin();
    }

    setupEventListeners() {
        // Desktop admin panel
        document.getElementById('adminSubmit').addEventListener('click', () => {
            this.checkAdminCode();
        });

        // Mobile admin panel
        document.getElementById('adminSubmitMobile').addEventListener('click', () => {
            this.checkAdminCodeMobile();
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

        document.getElementById('globalMessageBtn').addEventListener('click', () => {
            this.sendGlobalMessage();
        });

        // Keyboard shortcut for admin panel (Ctrl+Shift+A)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'A') {
                e.preventDefault();
                this.toggleAdminPanel();
            }
        });
    }

    setupMobileAdmin() {
        // Show mobile admin panel on mobile devices
        if (this.isMobileDevice()) {
            document.getElementById('adminPanelMobile').style.display = 'block';
        }
    }

    isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    toggleAdminPanel() {
        const panel = document.getElementById('adminPanel');
        if (panel.style.display === 'none') {
            panel.style.display = 'block';
        } else {
            panel.style.display = 'none';
        }
    }

    checkAdminCode() {
        const code = document.getElementById('adminCode').value;
        if (code === this.adminCode) {
            this.isAdmin = true;
            document.getElementById('adminFeatures').style.display = 'block';
            this.showAdminMessage('Admin access granted!', 'success');
        } else {
            this.showAdminMessage('Invalid admin code!', 'error');
        }
    }

    checkAdminCodeMobile() {
        const code = document.getElementById('adminCodeMobile').value;
        if (code === this.adminCode) {
            this.isAdmin = true;
            this.showAdminMessage('Admin access granted! Features activated.', 'success');
            this.enableAllAdminFeatures();
        } else {
            this.showAdminMessage('Invalid admin code!', 'error');
        }
    }

    enableAllAdminFeatures() {
        this.enableInfiniteCoins();
        this.enableInfiniteHP();
        this.enableInfiniteParry();
        this.unlockAll();
    }

    enableInfiniteCoins() {
        const user = authSystem.getUser();
        if (user) {
            authSystem.updateUserCoins(999999);
            this.showAdminMessage('Infinite coins activated!', 'success');
        }
    }

    enableInfiniteHP() {
        // This would be implemented in the game system
        if (gameSystem) {
            gameSystem.infiniteHP = true;
            this.showAdminMessage('Infinite HP activated!', 'success');
        }
    }

    enableInfiniteParry() {
        // This would be implemented in the game system
        if (gameSystem) {
            gameSystem.infiniteParry = true;
            this.showAdminMessage('Infinite Parry activated!', 'success');
        }
    }

    unlockAll() {
        const user = authSystem.getUser();
        if (user) {
            user.unlockedCharacters = ['67', '41', '21', '201', '67boss'];
            user.unlockedBackgrounds = ['color', 'url'];
            authSystem.updateUser(user);
            this.showAdminMessage('All content unlocked!', 'success');
        }
    }

    sendGlobalMessage() {
        const message = prompt('Enter global message:');
        if (message) {
            // In a real implementation, this would send to all online players
            this.showGlobalMessage(message);
        }
    }

    showGlobalMessage(message) {
        const messageEl = document.createElement('div');
        messageEl.className = 'global-message';
        messageEl.innerHTML = `
            <div class="global-message-content">
                <strong>ADMIN MESSAGE:</strong> ${message}
            </div>
        `;
        messageEl.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.9);
            color: #ff0000;
            padding: 20px;
            border-radius: 10px;
            z-index: 10000;
            font-size: 24px;
            text-align: center;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 5000);
    }

    showAdminMessage(message, type) {
        const messageEl = document.createElement('div');
        messageEl.className = `admin-message ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 10px 20px;
            background: ${type === 'error' ? '#ff0000' : '#00ff00'};
            color: white;
            border-radius: 5px;
            z-index: 1000;
        `;
        
        document.body.appendChild(messageEl);
        
        setTimeout(() => {
            document.body.removeChild(messageEl);
        }, 3000);
    }
}

// Initialize admin system
let adminSystem;
document.addEventListener('DOMContentLoaded', () => {
    adminSystem = new AdminSystem();
});