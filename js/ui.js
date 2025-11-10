// UI Utility Functions
// This file contains additional UI helper functions if needed

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
