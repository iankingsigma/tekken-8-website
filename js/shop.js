// Shop System - Brainrot Fighters v5.0
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
        id: 'healCharm',
        name: 'Heal Charm',
        description: 'Reduces heal cooldown by 20%',
        price: 120,
        type: 'permanent',
        effect: 'heal'
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
    
    if (!window.gameState) {
        console.error('gameState not found');
        return;
    }
    
    if (!gameState.coins) {
        gameState.coins = parseInt(localStorage.getItem('brainrotCoins')) || 1000;
    }
    
    if (!gameState.playerInventory) {
        gameState.playerInventory = JSON.parse(localStorage.getItem('playerInventory')) || {};
    }
    
    console.log('Shop initialized with coins:', gameState.coins);
}

// Load Shop Items
function loadShopItems() {
    console.log('Loading shop items...');
    const shopItems = document.getElementById('shopItems');
    if (!shopItems) {
        console.error('Shop items container not found');
        return;
    }
    
    initShop();
    
    shopItems.innerHTML = '';
    
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
            ${isOwned ? `<div class="owned-badge">OWNED</div>` : ''}
        `;
        
        shopItems.appendChild(itemElement);
    });
    
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const itemId = e.target.dataset.id;
            buyItem(itemId);
        });
    });
    
    updateCoinsDisplay();
}

// Update Coins Display
function updateCoinsDisplay() {
    const coinsDisplay = document.getElementById('coinsAmount');
    if (coinsDisplay) {
        coinsDisplay.textContent = gameState.coins;
    }
}

// Buy Item
function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        alert('Item not found!');
        return;
    }
    
    if (gameState.playerInventory[itemId]) {
        alert('You already own this item!');
        return;
    }
    
    if (gameState.coins < item.price) {
        alert('Not enough coins!');
        return;
    }
    
    gameState.coins -= item.price;
    
    if (item.type === 'permanent') {
        gameState.playerInventory[itemId] = true;
        
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
    
    localStorage.setItem('brainrotCoins', gameState.coins);
    localStorage.setItem('playerInventory', JSON.stringify(gameState.playerInventory));
    
    loadShopItems();
    
    showPurchaseSuccess(item.name);
}

// Show Purchase Success
function showPurchaseSuccess(itemName) {
    const successDiv = document.createElement('div');
    successDiv.className = 'purchase-success';
    successDiv.innerHTML = `
        <div class="success-message" style="
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.95);
            border: 3px solid #00ff00;
            border-radius: 10px;
            padding: 2rem;
            z-index: 1000;
            text-align: center;
        ">
            <h3 style="color: #00ff00; margin-bottom: 1rem;">✅ PURCHASE SUCCESSFUL!</h3>
            <p style="color: #ffcc00; margin-bottom: 1rem;">You bought: ${itemName}</p>
            <button class="nav-btn" id="closeSuccess">CLOSE</button>
        </div>
    `;
    
    successDiv.style.position = 'fixed';
    successDiv.style.top = '0';
    successDiv.style.left = '0';
    successDiv.style.width = '100%';
    successDiv.style.height = '100%';
    successDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
    successDiv.style.zIndex = '1000';
    
    document.body.appendChild(successDiv);
    
    document.getElementById('closeSuccess').addEventListener('click', () => {
        document.body.removeChild(successDiv);
    });
}

// Make functions globally available
window.loadShopItems = loadShopItems;
window.buyItem = buyItem;
window.initShop = initShop;
