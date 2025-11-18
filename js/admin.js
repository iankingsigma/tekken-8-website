// js/admin.js
// Admin Panel System for Brainrot Fighters v5.0

class AdminSystem {
    constructor() {
        this.isActive = false;
        this.infiniteHP = false;
        this.infiniteParry = false;
        this.oneHitKill = false;
        this.adminCode = '231214';
        
        this.init();
    }
    
    init() {
        this.setupAdminAccess();
        this.setupAdminControls();
        console.log('Admin system initialized');
    }
    
    setupAdminAccess() {
        const adminAccess = document.getElementById('adminAccess');
        const adminCodeInput = document.getElementById('adminCodeInput');
        const submitAdminCode = document.getElementById('submitAdminCode');
        
        if (!adminAccess || !adminCodeInput || !submitAdminCode) {
            console.error('Admin access elements not found');
            return;
        }
        
        submitAdminCode.addEventListener('click', () => {
            if (adminCodeInput.value === this.adminCode) {
                this.activateAdminPanel();
                adminCodeInput.value = '';
            } else {
                alert('Invalid admin code!');
            }
        });
        
        // Enter key support
        adminCodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                submitAdminCode.click();
            }
        });
    }
    
    setupAdminControls() {
        const adminPanel = document.getElementById('adminPanel');
        if (!adminPanel) return;
        
        document.getElementById('adminInfiniteHP').addEventListener('click', () => {
            this.infiniteHP = !this.infiniteHP;
            this.updateAdminButtons();
            this.showAdminMessage(`Infinite HP: ${this.infiniteHP ? 'ON' : 'OFF'}`);
        });
        
        document.getElementById('adminInfiniteParry').addEventListener('click', () => {
            this.infiniteParry = !this.infiniteParry;
            this.updateAdminButtons();
            this.showAdminMessage(`Infinite Parry: ${this.infiniteParry ? 'ON' : 'OFF'}`);
        });
        
        document.getElementById('adminOneHitKill').addEventListener('click', () => {
            this.oneHitKill = !this.oneHitKill;
            this.updateAdminButtons();
            this.showAdminMessage(`One Hit Kill: ${this.oneHitKill ? 'ON' : 'OFF'}`);
        });
        
        document.getElementById('sendGlobalMessage').addEventListener('click', () => {
            const messageInput = document.getElementById('globalMessageInput');
            if (messageInput.value.trim()) {
                this.sendGlobalMessage(messageInput.value);
                messageInput.value = '';
            }
        });
        
        document.getElementById('closeAdminPanel').addEventListener('click', () => {
            this.deactivateAdminPanel();
        });
    }
    
    activateAdminPanel() {
        this.isActive = true;
        document.getElementById('adminPanel').style.display = 'block';
        document.getElementById('adminAccess').style.display = 'none';
        this.showAdminMessage('Admin panel activated!');
        
        // Apply initial admin effects
        this.applyAdminEffects();
    }
    
    deactivateAdminPanel() {
        this.isActive = false;
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminAccess').style.display = 'flex';
        this.showAdminMessage('Admin panel deactivated');
        
        // Remove admin effects
        this.removeAdminEffects();
    }
    
    updateAdminButtons() {
        const buttons = {
            'adminInfiniteHP': this.infiniteHP,
            'adminInfiniteParry': this.infiniteParry,
            'adminOneHitKill': this.oneHitKill
        };
        
        Object.entries(buttons).forEach(([id, isActive]) => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.style.background = isActive ? 
                    'rgba(0, 255, 0, 0.7)' : 
                    'rgba(255, 0, 51, 0.3)';
                btn.textContent = btn.textContent.replace(/ON|OFF/g, isActive ? 'ON' : 'OFF');
            }
        });
    }
    
    applyAdminEffects() {
        if (this.infiniteHP && window.gameState && window.gameState.player) {
            window.gameState.player.health = window.gameState.player.maxHealth;
        }
        
        if (this.infiniteParry) {
            window.gameState.parryCooldownActive = false;
        }
    }
    
    removeAdminEffects() {
        // Reset any modified game state when admin is deactivated
        this.infiniteHP = false;
        this.infiniteParry = false;
        this.oneHitKill = false;
        this.updateAdminButtons();
    }
    
    sendGlobalMessage(message) {
        // Show message locally
        this.displayGlobalMessage(message);
        
        // If online system is available, send to all players
        if (window.onlineState && window.onlineState.isOnline) {
            this.broadcastGlobalMessage(message);
        }
    }
    
    displayGlobalMessage(message) {
        const messageDisplay = document.getElementById('globalMessageDisplay');
        if (!messageDisplay) return;
        
        messageDisplay.textContent = `ADMIN: ${message}`;
        messageDisplay.style.display = 'block';
        
        setTimeout(() => {
            messageDisplay.style.display = 'none';
        }, 5000);
    }
    
    broadcastGlobalMessage(message) {
        // Implementation for online broadcast would go here
        console.log('Broadcasting global message:', message);
        // This would use Firebase to send messages to all connected players
    }
    
    showAdminMessage(message) {
        console.log(`[ADMIN] ${message}`);
        // Could add a small notification system here
    }
    
    // Game integration methods
    checkInfiniteHP() {
        if (this.isActive && this.infiniteHP && window.gameState && window.gameState.player) {
            window.gameState.player.health = window.gameState.player.maxHealth;
            window.gameState.playerFakeHP = 100;
            window.gameState.playerRealHP = 100;
        }
    }
    
    checkInfiniteParry() {
        if (this.isActive && this.infiniteParry) {
            window.gameState.parryCooldownActive = false;
            const parryButtons = document.querySelectorAll('[data-action="parry"]');
            parryButtons.forEach(btn => {
                btn.disabled = false;
                btn.style.opacity = '1';
                btn.style.background = 'rgba(100, 255, 100, 0.7)';
                btn.textContent = 'PARRY';
            });
        }
    }
    
    checkOneHitKill() {
        if (this.isActive && this.oneHitKill && window.gameState && window.gameState.cpu) {
            window.gameState.cpu.health = 1;
        }
    }
}

// Initialize admin system when DOM is loaded
let adminSystem = null;

document.addEventListener('DOMContentLoaded', function() {
    adminSystem = new AdminSystem();
});

// Make admin system globally available
window.adminSystem = adminSystem;
