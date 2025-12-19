// Touch Controls for Tablet - FIXED COOLDOWN VERSION
class TouchControls {
    constructor() {
        this.movementButtons = document.querySelectorAll('.movement-btn');
        this.actionButtons = document.querySelectorAll('.touch-btn');
        this.activeDirections = {
            left: false,
            right: false
        };
        
        this.init();
    }
    
    init() {
        this.setupMovementButtons();
        this.setupActionButtons();
    }
    
    setupMovementButtons() {
        this.movementButtons.forEach(button => {
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                const direction = button.dataset.direction;
                this.handleMovement(direction, true);
                button.classList.add('active');
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                const direction = button.dataset.direction;
                this.handleMovement(direction, false);
                button.classList.remove('active');
            });
            
            // Mouse events for testing
            button.addEventListener('mousedown', (e) => {
                const direction = button.dataset.direction;
                this.handleMovement(direction, true);
                button.classList.add('active');
            });
            
            button.addEventListener('mouseup', (e) => {
                const direction = button.dataset.direction;
                this.handleMovement(direction, false);
                button.classList.remove('active');
            });
            
            button.addEventListener('mouseleave', (e) => {
                const direction = button.dataset.direction;
                this.handleMovement(direction, false);
                button.classList.remove('active');
            });
        });
    }
    
    handleMovement(direction, isPressed) {
        this.activeDirections[direction] = isPressed;
        this.updateGameInput();
    }
    
    updateGameInput() {
        gameState.keys['arrowleft'] = this.activeDirections.left;
        gameState.keys['arrowright'] = this.activeDirections.right;
    }
    
    setupActionButtons() {
        this.actionButtons.forEach(button => {
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                if (button.disabled) return;
                this.handleAction(button.dataset.action, true);
                button.classList.add('active');
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                if (button.disabled) return;
                this.handleAction(button.dataset.action, false);
                button.classList.remove('active');
            });
            
            // Mouse events for testing
            button.addEventListener('mousedown', (e) => {
                if (button.disabled) return;
                this.handleAction(button.dataset.action, true);
                button.classList.add('active');
            });
            
            button.addEventListener('mouseup', (e) => {
                if (button.disabled) return;
                this.handleAction(button.dataset.action, false);
                button.classList.remove('active');
            });
            
            button.addEventListener('mouseleave', (e) => {
                if (button.disabled) return;
                this.handleAction(button.dataset.action, false);
                button.classList.remove('active');
            });
        });
    }
    
    handleAction(action, isPressed) {
        const keyMap = {
            'punch': ['z', 'x'],
            'kick': ['a', 's'],
            'special': ['c'],
            'heal': [' '] // Changed from 'parry' to 'heal'
        };
        
        if (keyMap[action]) {
            keyMap[action].forEach(key => {
                gameState.keys[key] = isPressed;
                
                // Trigger attack immediately on press
                if (isPressed && gameState.gameActive && gameState.player.attackCooldown <= 0) {
                    if (action === 'punch') {
                        doPlayerAttack('punch');
                    } else if (action === 'kick') {
                        doPlayerAttack('kick');
                    } else if (action === 'special') {
                        doPlayerAttack('special');
                    } else if (action === 'heal') { // Changed from 'parry' to 'heal'
                        doPlayerAttack('heal');
                    }
                }
            });
        }
    }
}

let touchControls = null;

function initTouchControls() {
    if (gameState.deviceType === 'tablet') {
        touchControls = new TouchControls();
    }
}

// Override showScreen to handle touch controls properly
const originalShowScreen = window.showScreen || function(screenId) {
    // Default implementation if not defined
    const screens = document.querySelectorAll('.screen');
    screens.forEach(screen => screen.classList.remove('active'));
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
};

window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    
    if (screenId === 'gameScreen' && gameState.deviceType === 'tablet') {
        setTimeout(() => {
            if (!touchControls) {
                initTouchControls();
            }
        }, 100);
    }
};

// Make functions globally available
window.TouchControls = TouchControls;
window.initTouchControls = initTouchControls;
