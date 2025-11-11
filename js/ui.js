// UI Utility Functions
// This file contains additional UI helper functions

// Example: Add screen transition effects
function fadeScreen(fromScreen, toScreen, callback) {
    const fromElement = document.getElementById(fromScreen);
    const toElement = document.getElementById(toScreen);
    
    fromElement.style.opacity = '1';
    toElement.style.opacity = '0';
    toElement.classList.add('active');
    
    let opacity = 1;
    const fadeOut = setInterval(() => {
        opacity -= 0.05;
        fromElement.style.opacity = opacity;
        if (opacity <= 0) {
            clearInterval(fadeOut);
            fromElement.classList.remove('active');
            
            let fadeInOpacity = 0;
            const fadeIn = setInterval(() => {
                fadeInOpacity += 0.05;
                toElement.style.opacity = fadeInOpacity;
                if (fadeInOpacity >= 1) {
                    clearInterval(fadeIn);
                    if (callback) callback();
                }
            }, 16);
        }
    }, 16);
}

// Mobile-specific UI adjustments
function adjustUIForMobile() {
    if (gameState.deviceType === 'tablet') {
        // Adjust font sizes for tablet
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .pixel-logo, .main-title { 
                    font-size: 2.5rem !important; 
                }
                .menu-btn { 
                    font-size: 1.1rem !important; 
                    width: 250px !important; 
                    padding: 10px 20px !important;
                }
                .character-grid { 
                    grid-template-columns: 1fr !important; 
                }
            }
        `;
        document.head.appendChild(style);
    }
}

// Initialize UI adjustments
adjustUIForMobile();
