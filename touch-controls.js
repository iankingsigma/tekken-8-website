// Touch Controls for Tablet
class TouchControls {
    constructor() {
        this.joystickArea = document.getElementById('joystickArea');
        this.joystick = document.getElementById('joystick');
        this.actionButtons = document.querySelectorAll('.touch-btn');
        this.isDragging = false;
        this.joystickPos = { x: 35, y: 35 };
        this.activeDirections = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        this.init();
    }
    
    init() {
        this.setupJoystick();
        this.setupActionButtons();
    }
    
    setupJoystick() {
        // Touch events
        this.joystickArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.isDragging = true;
            this.updateJoystickPosition(e.touches[0]);
        });
        
        this.joystickArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (this.isDragging) {
                this.updateJoystickPosition(e.touches[0]);
            }
        });
        
        this.joystickArea.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.isDragging = false;
            this.resetJoystick();
        });
        
        // Mouse events for testing
        this.joystickArea.addEventListener('mousedown', (e) => {
            this.isDragging = true;
            this.updateJoystickPosition(e);
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isDragging) {
                this.updateJoystickPosition(e);
            }
        });
        
        document.addEventListener('mouseup', (e) => {
            this.isDragging = false;
            this.resetJoystick();
        });
    }
    
    updateJoystickPosition(touch) {
        const rect = this.joystickArea.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const touchX = touch.clientX;
        const touchY = touch.clientY;
        
        // Calculate distance from center
        const deltaX = touchX - centerX;
        const deltaY = touchY - centerY;
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        // Limit to joystick area radius
        const maxDistance = rect.width / 2 - 25;
        const limitedDistance = Math.min(distance, maxDistance);
        
        if (limitedDistance > 0) {
            const angle = Math.atan2(deltaY, deltaX);
            const newX = Math.cos(angle) * limitedDistance;
            const newY = Math.sin(angle) * limitedDistance;
            
            this.joystick.style.transform = `translate(${newX}px, ${newY}px)`;
            
            // Update active directions
            this.updateDirections(angle, limitedDistance / maxDistance);
        }
    }
    
    updateDirections(angle, intensity) {
        const threshold = 0.3;
        
        // Reset directions
        this.activeDirections = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        
        // Set active directions based on angle
        if (intensity > threshold) {
            // Convert angle to degrees and normalize
            let degrees = (angle * 180 / Math.PI + 360) % 360;
            
            if (degrees > 45 && degrees < 135) {
                this.activeDirections.down = true;
            } else if (degrees > 135 && degrees < 225) {
                this.activeDirections.left = true;
            } else if (degrees > 225 && degrees < 315) {
                this.activeDirections.up = true;
            } else {
                this.activeDirections.right = true;
            }
        }
        
        // Update game state
        this.updateGameInput();
    }
    
    updateGameInput() {
        // Simulate keyboard input based on touch controls
        gameState.keys['arrowleft'] = this.activeDirections.left;
        gameState.keys['arrowright'] = this.activeDirections.right;
        gameState.keys['arrowup'] = this.activeDirections.up;
        gameState.keys['arrowdown'] = this.activeDirections.down;
    }
    
    resetJoystick() {
        this.joystick.style.transform = 'translate(0, 0)';
        this.activeDirections = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.updateGameInput();
    }
    
    setupActionButtons() {
        this.actionButtons.forEach(button => {
            // Touch events
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleAction(button.dataset.action, true);
                button.classList.add('active');
            });
            
            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.handleAction(button.dataset.action, false);
                button.classList.remove('active');
            });
            
            // Mouse events for testing
            button.addEventListener('mousedown', (e) => {
                this.handleAction(button.dataset.action, true);
                button.classList.add('active');
            });
            
            button.addEventListener('mouseup', (e) => {
                this.handleAction(button.dataset.action, false);
                button.classList.remove('active');
            });
            
            button.addEventListener('mouseleave', (e) => {
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
            'block': [' ']
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
                    } else if (action === 'block') {
                        doPlayerAttack('block');
                    }
                }
            });
        }
    }
}

// Initialize touch controls when in tablet mode
let touchControls = null;

function initTouchControls() {
    if (gameState.deviceType === 'tablet') {
        touchControls = new TouchControls();
    }
}

// Update the showScreen function to initialize touch controls
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
