// js/shop.js
// Updated shop.js with background system

const SHOP_ITEMS = [
    // ... existing items ...
    {
        id: 'damageBoost',
        name: 'Damage Boost',
        description: 'Permanently increase your damage by 20%',
        price: 100,
        type: 'permanent',
        effect: 'damage',
        category: 'characters'
    },
    // ... other character items ...
    
    // Background Items
    {
        id: 'bg_space',
        name: 'Space Background',
        description: 'Cosmic space theme with stars and nebula',
        price: 200,
        type: 'permanent',
        effect: 'background',
        category: 'backgrounds',
        backgroundId: 'space'
    },
    {
        id: 'bg_hell',
        name: 'Hell Background',
        description: 'Fiery underworld theme with lava and flames',
        price: 250,
        type: 'permanent',
        effect: 'background',
        category: 'backgrounds',
        backgroundId: 'hell'
    },
    {
        id: 'bg_cyber',
        name: 'Cyber Background',
        description: 'Futuristic cyberpunk cityscape',
        price: 300,
        type: 'permanent',
        effect: 'background',
        category: 'backgrounds',
        backgroundId: 'cyber'
    },
    {
        id: 'bg_neon',
        name: 'Neon Background',
        description: 'Vibrant neon lights and synthwave aesthetic',
        price: 350,
        type: 'permanent',
        effect: 'background',
        category: 'backgrounds',
        backgroundId: 'neon'
    },
    
    // Effect Items
    {
        id: 'effect_golden',
        name: 'Golden Effects',
        description: 'Golden particle effects for all attacks',
        price: 150,
        type: 'permanent',
        effect: 'golden_effects',
        category: 'effects'
    },
    {
        id: 'effect_rainbow',
        name: 'Rainbow Trail',
        description: 'Rainbow-colored movement trails',
        price: 200,
        type: 'permanent',
        effect: 'rainbow_trail',
        category: 'effects'
    }
];

// Updated loadShopItems function
function loadShopItems(category = 'characters') {
    console.log('Loading shop items for category:', category);
    const shopItems = document.getElementById('shopItems');
    if (!shopItems) {
        console.error('Shop items container not found');
        return;
    }
    
    // Ensure shop is initialized
    initShop();
    
    // Clear the container first
    shopItems.innerHTML = '';
    
    // Add category title
    const categoryTitle = document.createElement('div');
    categoryTitle.className = 'shop-category-title';
    categoryTitle.textContent = category.toUpperCase();
    shopItems.appendChild(categoryTitle);
    
    // Filter items by category
    const categoryItems = SHOP_ITEMS.filter(item => item.category === category);
    
    // Create shop items
    categoryItems.forEach(item => {
        const isOwned = gameState.playerInventory[item.id];
        const canAfford = gameState.coins >= item.price;
        const isEquipped = item.category === 'backgrounds' && 
                          gameState.currentBackground === item.backgroundId;
        
        const itemElement = document.createElement('div');
        itemElement.className = 'shop-item';
        
        let previewHTML = '';
        if (item.category === 'backgrounds') {
            previewHTML = `<div class="background-preview background-${item.backgroundId}"></div>`;
        }
        
        itemElement.innerHTML = `
            ${previewHTML}
            <div class="item-name">${item.name}</div>
            <div class="item-desc">${item.description}</div>
            <div class="item-price">${item.price} COINS</div>
            <button class="buy-btn" data-id="${item.id}" ${isOwned || !canAfford ? 'disabled' : ''}>
                ${isOwned ? (isEquipped ? 'EQUIPPED' : 'OWNED') : (canAfford ? 'BUY NOW' : 'NEED COINS')}
            </button>
            ${isOwned ? `<div class="owned-badge">${isEquipped ? 'EQUIPPED' : 'OWNED'}</div>` : ''}
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

// Updated buyItem function
function buyItem(itemId) {
    const item = SHOP_ITEMS.find(i => i.id === itemId);
    if (!item) {
        console.error('Item not found:', itemId);
        alert('Item not found!');
        return;
    }
    
    // Check if already owned
    if (gameState.playerInventory[itemId]) {
        // If it's a background, equip it
        if (item.category === 'backgrounds') {
            changeBackground(item.backgroundId);
            loadShopItems('backgrounds'); // Refresh to show "EQUIPPED"
        }
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
        
        // Apply immediate effects
        if (item.id === 'bossUnlock') {
            gameState.bossUnlocked = true;
            localStorage.setItem('boss67Unlocked', 'true');
            alert('67 BOSS UNLOCKED! You can now play 67 BOSS Survival Mode!');
        } else if (item.category === 'backgrounds') {
            changeBackground(item.backgroundId);
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
    loadShopItems(item.category);
    
    // Show purchase success
    showPurchaseSuccess(item.name);
}

// Add category switching
document.addEventListener('DOMContentLoaded', function() {
    const categoryButtons = document.querySelectorAll('.category-btn');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const category = this.dataset.category;
            
            // Update active button
            categoryButtons.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Load items for category
            loadShopItems(category);
        });
    });
});
