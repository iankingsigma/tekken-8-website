// Shop System
const SHOP_ITEMS = [
    {
        id: 'damageBoost',
        name: 'Damage Boost',
        description: 'Permanently increase your damage by 20%',
        price: 100,
        type: 'permanent'
    },
    {
        id: 'healthBoost',
        name: 'Health Boost',
        description: 'Permanently increase your health by 15%',
        price: 150,
        type: 'permanent'
    },
    {
        id: 'comboMaster',
        name: 'Combo Master',
        description: 'Combo damage increased by 25%',
        price: 200,
        type: 'permanent'
    },
    {
        id: 'parryCharm',
        name: 'Parry Charm',
        description: 'Reduces CPU parry chance by 20%',
        price: 120,
        type: 'permanent'
    },
    {
        id: 'doubleCoins',
        name: 'Double Coins',
        description: 'Earn double coins for 5 matches',
        price: 80,
        type: 'temporary',
        duration: 5
    }
];

function loadShopItems() {
    const shopItems = document.getElementById('shopItems');
    if (!shopItems) {
        console.error('Shop items container not found');
        return;
    }
    
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
                ${isOwned ? 'OWNED' : (canAfford ? 'BUY' : 'NEED COINS')}
            </button>
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
    const coinsDisplay = document.getElementById('coinsAmount');
    if (coinsDisplay) {
        coinsDisplay.textContent = gameState.coins;
    }
}

function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        console.error('Item not found:', itemId);
        return;
    }
    
    if (gameState.coins >= item.price) {
        gameState.coins -= item.price;
        
        if (item.type === 'permanent') {
            gameState.playerInventory[itemId] = true;
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
        
        alert(`Successfully purchased ${item.name}!`);
    } else {
        alert('Not enough coins!');
    }
}

// Make sure shop loads when screen is shown
document.addEventListener('DOMContentLoaded', function() {
    // Initialize shop when shop screen is active
    if (document.getElementById('shopScreen') && document.getElementById('shopScreen').classList.contains('active')) {
        loadShopItems();
    }
});