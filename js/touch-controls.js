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
            'parry': [' ']
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
                    } else if (action === 'parry') {
                        doPlayerAttack('parry');
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

const originalShowScreen = showScreen;
showScreen = function(screenId) {
    originalShowScreen(screenId);
    
    if (screenId === 'gameScreen' && gameState.deviceType === 'tablet') {
        setTimeout(() => {
            if (!touchControls) {
                initTouchControls();
            }
        }, 100);
    }
};