/**
 * Game Popularity Detection System - FORTUNE & POPULAR Priority
 * Detects FORTUNE_* and POPULAR_* image names and places them at the top
 */

// ============================================
// PRIORITY LEVELS
// ============================================
const PRIORITIES = {
    FORTUNE_NAMED: 1,    // FORTUNE_1.jpg, FORTUNE_2.jpg, etc. (HIGHEST)
    POPULAR_NAMED: 2,    // POPULAR_1.jpg, POPULAR_2.jpg, etc.
    FORTUNE_PROVIDER: 3, // Other PG SOFT & TADA games
    OLYMPUS_GAMES: 4,    // Pragmatic Play Olympus/popular games
    POPULAR_PROVIDER: 5, // HACKSAW & Play N' GO
    REGULAR: 6           // All other games
};

// ============================================
// SMART DETECTION BASED ON IMAGE NAME
// ============================================

/**
 * Detects game priority based on image filename and provider
 * @param {string} imageName - The image filename (e.g., "FORTUNE_1.jpg")
 * @param {string} provider - The provider name (e.g., "PG SOFT")
 * @returns {number} Priority level (1-6, lower = higher priority)
 */
window.detectGamePriority = function(imageName, provider) {
    const lowerImageName = imageName.toLowerCase();
    const lowerProvider = provider.toLowerCase();
    
    // PRIORITY 1: Images explicitly named FORTUNE_*
    if (imageName.startsWith('FORTUNE_')) {
        return PRIORITIES.FORTUNE_NAMED;
    }
    
    // PRIORITY 2: Images explicitly named POPULAR_*
    if (imageName.startsWith('POPULAR_')) {
        return PRIORITIES.POPULAR_NAMED;
    }
    
    // PRIORITY 3: Other Fortune-related providers (PG SOFT, TADA)
    if (lowerProvider === 'pg soft' || lowerProvider === 'tada') {
        return PRIORITIES.FORTUNE_PROVIDER;
    }
    
    // PRIORITY 4: Olympus/Zeus games (Pragmatic Play)
    if (lowerProvider === 'pragmatic play') {
        return PRIORITIES.OLYMPUS_GAMES;
    }
    
    // PRIORITY 5: Popular providers (HACKSAW, Play N' GO)
    if (lowerProvider === 'hacksaw' || lowerProvider === "play n' go") {
        return PRIORITIES.POPULAR_PROVIDER;
    }
    
    // PRIORITY 6: Regular games
    return PRIORITIES.REGULAR;
};

// ============================================
// SORTING FUNCTION
// ============================================

/**
 * Sorts games by popularity (priority)
 * Lower priority number = more popular = appears first
 */
window.sortGamesByPopularity = function(games) {
    return games.sort((a, b) => {
        // Sort by priority first (1, 2, 3, 4, 5, 6)
        if (a.priority !== b.priority) {
            return a.priority - b.priority;
        }
        
        // For FORTUNE_* and POPULAR_* images, sort by number in filename
        const aIsNumbered = a.imageName.match(/^(FORTUNE|POPULAR)_(\d+)/);
        const bIsNumbered = b.imageName.match(/^(FORTUNE|POPULAR)_(\d+)/);
        
        if (aIsNumbered && bIsNumbered) {
            const aNum = parseInt(aIsNumbered[2]);
            const bNum = parseInt(bIsNumbered[2]);
            return aNum - bNum; // FORTUNE_1 before FORTUNE_2, etc.
        }
        
        // Within same priority, sort alphabetically by provider
        if (a.provider !== b.provider) {
            return a.provider.localeCompare(b.provider);
        }
        
        // Within same provider, sort alphabetically by image name
        return a.imageName.localeCompare(b.imageName);
    });
};

// ============================================
// PRIORITY LABELS (for display/debugging)
// ============================================

window.getPriorityLabel = function(priority) {
    const labels = {
        1: '⭐⭐⭐ FORTUNE GAMES',
        2: '⭐⭐ POPULAR GAMES',
        3: '🎯 Fortune Providers',
        4: '🏛️ Olympus Games',
        5: '🎰 Popular Providers',
        6: '📱 Regular Games'
    };
    return labels[priority] || 'Regular Games';
};

console.log('✅ Game Popularity System Loaded - FORTUNE & POPULAR Priority');
console.log('📊 Priority Levels:');
console.log('   1️⃣  FORTUNE_* images (PG SOFT) - TOP PRIORITY');
console.log('   2️⃣  POPULAR_* images (Pragmatic Play)');
console.log('   3️⃣  Other PG SOFT & TADA games');
console.log('   4️⃣  Other Pragmatic Play games');
console.log('   5️⃣  HACKSAW & Play N\' GO games');
console.log('   6️⃣  Regular Games (Others)');
