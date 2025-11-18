[file name]: js/shop.js
[file content begin]
// Shop System - FIXED AND WORKING v4.0
const SHOP_ITEMS = [
    {
        id: 'damageBoost',
        name: 'Damage Boost',
        description: 'Permanently increase your damage by 20%',
        price: 100,
        type: 'permanent',
        effect: 'damage'
    },
    {
        id: 'healthBoost',
        name: 'Health Boost',
        description: 'Permanently increase your health by 15%',
        price: 150,
        type: 'permanent',
        effect: 'health'
    },
    {
        id: 'comboMaster',
        name: 'Combo Master',
        description: 'Combo damage increased by 25%',
        price: 200,
        type: 'permanent',
        effect: 'combo'
    },
    {
        id: 'parryCharm',
        name: 'Parry Charm',
        description: 'Reduces CPU parry chance by 20%',
        price: 120,
        type: 'permanent',
        effect: 'parry'
    },
    {
        id: 'doubleCoins',
        name: 'Double Coins',
        description: 'Earn double coins for 5 matches',
        price: 80,
        type: 'temporary',
        duration: 5,
        effect: 'coins'
    },
    {
        id: 'bossUnlock',
        name: '67 BOSS Unlock',
        description: 'Instantly unlock 67 BOSS mode',
        price: 500,
        type: 'permanent',
        effect: 'boss'
    }
];

// Initialize Shop
function initShop() {
    console.log('Initializing shop system...');
    
    // Ensure gameState exists
    if (!window.gameState) {
        console.error('gameState not found');
        return;
    }
    
    // Initialize coins if not set
    if (!gameState.coins) {
        gameState.coins = parseInt(localStorage.getItem('brainrotCoins')) || 1000;
    }
    
    // Initialize inventory if not set
    if (!gameState.playerInventory) {
        gameState.playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {};
    }
    
    console.log('Shop initialized with coins:', gameState.coins);
}

// Load Shop Items - FIXED VERSION
function loadShopItems() {
    console.log('Loading shop items...');
    const shopItems = document.getElementById('shopItems');
    if (!shopItems) {
        console.error('Shop items container not found');
        return;
    }
    
    // Ensure shop is initialized
    initShop();
    
    // Clear the container first
    shopItems.innerHTML = '';
    
    console.log('Game state coins:', gameState.coins);
    console.log('Player inventory:', gameState.playerInventory);
    
    // Create shop items
    SHOP_ITEMS.forEach(item => {
        const isOwned = gameState.playerInventory[item.id];
        const canAfford = gameState.coins >= item.price;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        itemElement.innerHTML = `
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.description}</div>
            <div class="item-price">${item.price} COINS</div>
            <button class="buy-btn" data-id="${item.id}" ${isOwned || !canAfford ? 'disabled' : ''}>
                ${isOwned ? 'OWNED' : (canAfford ? 'BUY NOW' : 'NEED COINS')}
            </button>
            ${isOwned ? '<div class="owned-badge">OWNED</div>' : ''}
        `;
        
        shopItems.appendChild(itemElement);
    });
    
    // Add event listeners to buy buttons
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            buyItem(itemId);
        });
    });
    
    // Update coins display
    updateCoinsDisplay();
}

// Update Coins Display
function updateCoinsDisplay() {
    const coinsDisplay = document.getElementById('coinsAmount');
    if (coinsDisplay) {
        coinsDisplay.textContent = gameState.coins;
        console.log('Updated coins display to:', gameState.coins);
    }
}

// Buy Item - FIXED VERSION
function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        console.error('Item not found:', itemId);
        alert('Item not found!');
        return;
    }
    
    // Check if already owned
    if (gameState.playerInventory[itemId]) {
        alert('You already own this item!');
        return;
    }
    
    // Check if player can afford
    if (gameState.coins < item.price) {
        alert('Not enough coins!');
        return;
    }
    
    // Process purchase
    gameState.coins -= item.price;
    
    if (item.type === 'permanent') {
        gameState.playerInventory[itemId] = true;
        
        // Apply immediate effects for certain items
        if (item.id === 'bossUnlock') {
            gameState.bossUnlocked = true;
            localStorage.setItem('boss67Unlocked', 'true');
            alert('67 BOSS UNLOCKED! You can now play 67 BOSS Survival Mode!');
        }
    } else {
        if (!gameState.playerInventory[itemId]) {
            gameState.playerInventory[itemId] = 0;
        }
        gameState.playerInventory[itemId] += item.duration;
    }
    
    // Save to localStorage
    localStorage.setItem('brainrotCoins', gameState.coins);
    localStorage.setItem('playerInventory', JSON.stringify(gameState.playerInventory));
    
    // Update UI
    loadShopItems();
    
    // Show purchase success
    showPurchaseSuccess(item.name);
}

// Show Purchase Success
function showPurchaseSuccess(itemName) {
    const successDiv = document.createElement('div');
    successDiv.className = 'purchase-success';
    successDiv.innerHTML = `
        <div class="success-message">
            <h3>✅ PURCHASE SUCCESSFUL!</h3>
            <p>You bought: ${itemName}</p>
            <button class="nav-btn" id="closeSuccess">CLOSE</button>
        </div>
    `;
    
    successDiv.style.position = 'fixed';
    successDiv.style.top = '0';
    successDiv.style.left = '0';
    successDiv.style.width = '100%';
    successDiv.style.height = '100%';
    successDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    successDiv.style.display = 'flex';
    successDiv.style.justifyContent = 'center';
    successDiv.style.alignItems = 'center';
    successDiv.style.zIndex = '1000';
    
    document.body.appendChild(successDiv);
    
    document.getElementById('closeSuccess').addEventListener('click', () => {
        document.body.removeChild(successDiv);
    });
}

// Apply Shop Effects in Game
function applyShopEffects() {
    if (!gameState.player || !gameState.playerInventory) return;
    
    const inventory = gameState.playerInventory;
    
    // Damage Boost
    if (inventory.damageBoost) {
        if (!gameState.player.damageMultiplier) {
            gameState.player.damageMultiplier = 1.0;
        }
        gameState.player.damageMultiplier = 1.2;
    }
    
    // Health Boost
    if (inventory.healthBoost) {
        if (gameState.player.character) {
            const originalHP = gameState.player.character.hp;
            gameState.player.maxHealth = Math.floor(originalHP * 1.15);
            gameState.player.health = gameState.player.maxHealth;
        }
    }
    
    // Combo Master
    if (inventory.comboMaster) {
        gameState.player.comboMultiplier = 1.25;
    }
    
    // Parry Charm
    if (inventory.parryCharm) {
        if (gameState.cpu && gameState.cpu.difficulty) {
            gameState.cpu.difficulty.parryChance *= 0.8;
        }
    }
    
    // Double Coins
    if (inventory.doubleCoins && inventory.doubleCoins > 0) {
        gameState.coinMultiplier = 2;
    }
}

// Update Double Coins Counter
function updateDoubleCoins() {
    if (gameState.playerInventory.doubleCoins > 0) {
        gameState.playerInventory.doubleCoins--;
        
        if (gameState.playerInventory.doubleCoins <= 0) {
            delete gameState.playerInventory.doubleCoins;
            alert('Double Coins effect has expired!');
        }
        
        localStorage.setItem('playerInventory', JSON.stringify(gameState.playerInventory));
    }
}

// Initialize shop when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing shop...');
    initShop();
    
    // Load shop items if on shop screen
    if (document.getElementById('shopScreen') && document.getElementById('shopScreen').classList.contains('active')) {
        console.log('Shop screen is active, loading items...');
        loadShopItems();
    }
});

// Override showScreen to load shop items when shop screen is shown
const originalShowScreen = window.showScreen;
window.showScreen = function(screenId) {
    originalShowScreen(screenId);
    
    if (screenId === 'shopScreen') {
        console.log('Shop screen shown, loading items...');
        setTimeout(() => {
            loadShopItems();
        }, 100);
    }
};

// Make functions globally available
window.loadShopItems = loadShopItems;
window.buyItem = buyItem;
window.applyShopEffects = applyShopEffects;
window.updateDoubleCoins = updateDoubleCoins;
[file content end]
