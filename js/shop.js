// Updated Shop System with Custom Backgrounds
class ShopSystem {
    constructor() {
        this.currentCategory = 'backgrounds';
        this.unlockedBgColor = false;
        this.unlockedBgUrl = false;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.loadShopItems();
    }

    setupEventListeners() {
        // Category buttons
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchCategory(e.target.dataset.category);
            });
        });

        // Background customization
        document.getElementById('applyBgColor').addEventListener('click', () => {
            this.applyBackgroundColor();
        });

        document.getElementById('applyBgUrl').addEventListener('click', () => {
            this.applyBackgroundUrl();
        });

        document.getElementById('purchaseBgColor').addEventListener('click', () => {
            this.purchaseBackgroundColor();
        });

        document.getElementById('purchaseBgUrl').addEventListener('click', () => {
            this.purchaseBackgroundUrl();
        });

        // Back button
        document.getElementById('shopBackBtn').addEventListener('click', () => {
            this.exitShop();
        });
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // Update active button
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-category="${category}"]`).classList.add('active');
        
        // Show/hide sections
        document.querySelectorAll('.shop-section').forEach(section => {
            section.style.display = 'none';
        });
        
        if (category === 'backgrounds') {
            document.getElementById('backgroundSection').style.display = 'block';
        }
    }

    loadShopItems() {
        // Load user's unlocked status
        const user = authSystem.getUser();
        if (user) {
            this.unlockedBgColor = user.unlockedBackgrounds.includes('color');
            this.unlockedBgUrl = user.unlockedBackgrounds.includes('url');
            
            this.updateShopUI();
        }
    }

    updateShopUI() {
        // Update purchase buttons based on what's unlocked
        const colorBtn = document.getElementById('purchaseBgColor');
        const urlBtn = document.getElementById('purchaseBgUrl');
        
        if (this.unlockedBgColor) {
            colorBtn.style.display = 'none';
            document.querySelector('.color-picker').style.display = 'block';
        } else {
            colorBtn.style.display = 'block';
            document.querySelector('.color-picker').style.display = 'none';
        }
        
        if (this.unlockedBgUrl) {
            urlBtn.style.display = 'none';
            document.querySelector('.url-picker').style.display = 'block';
        } else {
            urlBtn.style.display = 'block';
            document.querySelector('.url-picker').style.display = 'none';
        }
    }

    applyBackgroundColor() {
        if (!this.unlockedBgColor) return;
        
        const color = document.getElementById('bgColorPicker').value;
        document.body.style.backgroundColor = color;
        
        // Update preview
        document.getElementById('bgPreview').style.backgroundColor = color;
        
        // Save to user preferences
        this.saveBackgroundPreference('color', color);
    }

    applyBackgroundUrl() {
        if (!this.unlockedBgUrl) return;
        
        const url = document.getElementById('bgUrlInput').value;
        if (url) {
            document.body.style.backgroundImage = `url('${url}')`;
            document.body.style.backgroundSize = 'cover';
            document.body.style.backgroundPosition = 'center';
            
            // Update preview
            document.getElementById('bgPreview').style.backgroundImage = `url('${url}')`;
            
            // Save to user preferences
            this.saveBackgroundPreference('url', url);
        }
    }

    saveBackgroundPreference(type, value) {
        const user = authSystem.getUser();
        if (user) {
            user.backgroundPreference = { type, value };
            authSystem.updateUser(user);
        }
    }

    purchaseBackgroundColor() {
        const user = authSystem.getUser();
        const price = 100;
        
        if (user.coins >= price) {
            authSystem.updateUserCoins(user.coins - price);
            this.unlockedBgColor = true;
            user.unlockedBackgrounds.push('color');
            authSystem.updateUser(user);
            this.updateShopUI();
            this.showPurchaseSuccess('Color Picker Unlocked!');
        } else {
            this.showPurchaseError('Not enough coins!');
        }
    }

    purchaseBackgroundUrl() {
        const user = authSystem.getUser();
        const price = 500;
        
        if (user.coins >= price) {
            authSystem.updateUserCoins(user.coins - price);
            this.unlockedBgUrl = true;
            user.unlockedBackgrounds.push('url');
            authSystem.updateUser(user);
            this.updateShopUI();
            this.showPurchaseSuccess('Custom URL Unlocked!');
        } else {
            this.showPurchaseError('Not enough coins!');
        }
    }

    showPurchaseSuccess(message) {
        // Show success message
        const success = document.createElement('div');
        success.className = 'purchase-success';
        success.textContent = message;
        success.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #00ff00;
            color: #000;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
        `;
        document.body.appendChild(success);
        
        setTimeout(() => {
            document.body.removeChild(success);
        }, 2000);
    }

    showPurchaseError(message) {
        // Show error message
        const error = document.createElement('div');
        error.className = 'purchase-error';
        error.textContent = message;
        error.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #ff0000;
            color: #fff;
            padding: 20px;
            border-radius: 10px;
            z-index: 1000;
        `;
        document.body.appendChild(error);
        
        setTimeout(() => {
            document.body.removeChild(error);
        }, 2000);
    }

    exitShop() {
        document.getElementById('shopScreen').classList.remove('active');
        document.getElementById('mainMenu').classList.add('active');
    }
}

// Initialize shop system
let shopSystem;
document.addEventListener('DOMContentLoaded', () => {
    shopSystem = new ShopSystem();
});