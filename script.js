/**
 * POP REDE - RTP System with Provider-Based Image Loading
 * Purpose: Dynamically loads all images from provider folders with time-based RTP
 */

// ============================================
// CONFIGURATION
// ============================================

const CONFIG = {
    gamesPerProvider: 20, // Number of game cards to display when filtered (0 = show all)
    rtpRanges: {
        min: 30,
        max: 99
    },
    rtpwin: {
        min: 10,
        max: 100
        },
    
    multipliers: [
        { value: '3X', type: 'low' },
        { value: '7X', type: 'low' },
        { value: '9X', type: 'medium' },
        { value: '10X', type: 'medium' },
        { value: '11X', type: 'medium' },
        { value: '13X', type: 'high' },
        { value: '15X', type: 'high' },
        { value: '17X', type: 'high' },
        { value: '20X', type: 'high' }
    ]
};

// Application state
let showAllGames = true; // Show all games by default
let currentProvider = 'all'; // Current selected provider filter
let allGames = []; // Complete list of all games

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Gets the current 1-minute time window as a seed
 */
function getTimeSeed() {
    const now = new Date();
    const totalMinutes = now.getFullYear() * 525600 +
                        now.getMonth() * 43800 +
                        now.getDate() * 1440 +
                        now.getHours() * 60 +
                        now.getMinutes(); // Changed: now uses exact minute (no division by 10)
    return totalMinutes;
}

/**
 * Seeded random number generator using mulberry32
 */
function seededRandom(seed) {
    seed = Math.abs(seed | 0);
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

/**
 * Generates a seeded random integer between min and max
 */
function getSeededRandomInt(seed, min, max) {
    seed = (seed * 9301 + 49297) % 233280;
    const random = seededRandom(seed);
    return Math.floor(random * (max - min + 1)) + min;
}

/**
 * Converts a string to a numeric hash for seeding
 */
function stringToHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash);
}

/**
 * Generates a time-based RTP percentage for a specific game
 */
function generateRandomRTP(gameId) {
    const timeSeed = getTimeSeed();
    const gameNumericId = typeof gameId === 'string' ? stringToHash(gameId) : gameId;
    const combinedSeed = timeSeed * 1000 + gameNumericId;
    return getSeededRandomInt(combinedSeed, CONFIG.rtpRanges.min, CONFIG.rtpRanges.max);
}

/**
 * Generates a time-based multiplier configuration with Manual/Auto text
 */
function generateRandomMultiplier(gameId) {
    const timeSeed = getTimeSeed();
    const gameNumericId = typeof gameId === 'string' ? stringToHash(gameId) : gameId;
    
    const multiplierSeed = (timeSeed * 1000 + gameNumericId) * 7;
    const multiplierIndex = getSeededRandomInt(multiplierSeed, 0, CONFIG.multipliers.length - 1);
    const multiplier = CONFIG.multipliers[multiplierIndex];
    
    // Randomly determine if it's Manual or Auto (changes every minute)
    const textSeed = (timeSeed * 1000 + gameNumericId) * 11;
    const isManual = getSeededRandomInt(textSeed, 0, 1) === 1;
    const text = isManual ? 'Manual' : 'Auto';
    
    return {
        value: multiplier.value,
        type: multiplier.type,
        text: text
    };
}

/**
 * Determines the color class for RTP bar
 */
function getRTPColorClass(rtp) {
    if (rtp >= 70) return 'high';
    if (rtp >= 50) return 'medium';
    return 'low';
}

// ============================================
// GAME LOADING FUNCTIONS
// ============================================

/**
 * Automatically discover and load all games from provider folders
 */
async function loadAllGames() {
    allGames = [];
    
    try {
        // Try PHP API first (dynamic discovery)
        const response = await fetch('get_images.php');
        
        if (response.ok) {
            const data = await response.json();
            
            if (data.success && data.providers) {
                // Load from API response
                for (const [provider, images] of Object.entries(data.providers)) {
                    images.forEach(imageName => {
                        const gameId = `${provider}/${imageName}`;
                        const priority = window.detectGamePriority 
                            ? window.detectGamePriority(imageName, provider) 
                            : 4;
                        
                        allGames.push({
                            id: gameId,
                            provider: provider,
                            imageName: imageName,
                            imagePath: `images/${provider}/${imageName}`,
                            priority: priority
                        });
                    });
                }
                
                // Sort by popularity
                if (window.sortGamesByPopularity) {
                    allGames = window.sortGamesByPopularity(allGames);
                    console.log(`✅ Loaded and sorted ${allGames.length} games by popularity`);
                } else {
                    console.log(`✅ Loaded ${allGames.length} games dynamically`);
                }
                
                return;
            }
        }
    } catch (error) {
        console.warn('⚠️ PHP API not available, trying fallback method...');
    }
    
    // Fallback: Use provider_image_lists.js if PHP not available
    if (window.PROVIDER_IMAGES) {
        for (const [provider, images] of Object.entries(window.PROVIDER_IMAGES)) {
            images.forEach(imageName => {
                const gameId = `${provider}/${imageName}`;
                const priority = window.detectGamePriority 
                    ? window.detectGamePriority(imageName, provider) 
                    : 4;
                
                allGames.push({
                    id: gameId,
                    provider: provider,
                    imageName: imageName,
                    imagePath: `images/${provider}/${imageName}`,
                    priority: priority
                });
            });
        }
        
        // Sort by popularity
        if (window.sortGamesByPopularity) {
            allGames = window.sortGamesByPopularity(allGames);
            console.log(`✅ Loaded and sorted ${allGames.length} games by popularity`);
        } else {
            console.log(`✅ Loaded ${allGames.length} games from provider_image_lists.js`);
        }
        
        return;
    }
    
    // If both methods fail
    console.error('❌ Could not load games. Please ensure get_images.php is working or provider_image_lists.js is loaded.');
}

/**
 * Filter games by provider
 */
function filterGamesByProvider(provider) {
    if (provider === 'all') {
        return allGames;
    }
    
    return allGames.filter(game => game.provider === provider);
}

// ============================================
// GAME CARD GENERATION
// ============================================

/**
 * Creates a single game card element
 */
function createGameCard(game, index) {
    const rtp = generateRandomRTP(game.id);
    const multiplier = generateRandomMultiplier(game.id);
    const colorClass = getRTPColorClass(rtp);
    
    // Create card container
    const card = document.createElement('div');
    card.className = 'game-card';
    card.style.animationDelay = `${index * 0.02}s`;
    card.setAttribute('data-game-id', game.id);
    card.setAttribute('data-provider', game.provider);
    
    // Build card HTML
    card.innerHTML = `
        <div class="game-image">
            <img src="${game.imagePath}" alt="${game.provider} Game" loading="lazy">
        </div>
        <div class="game-info">
            <div class="multiplier">
                <div class="multiplier-text">${multiplier.value} ${multiplier.text}</div>
            </div>
            <div class="rtp-container">
                <div class="rtp-bar-wrapper">
                    <div class="rtp-bar ${colorClass}" style="width: 0%" data-rtp="${rtp}">
                        ${rtp}%
                    </div>
                </div>
            </div>
        </div>
    `;
    
    // Add click handler to open popup
    card.addEventListener('click', function(e) {
        e.preventDefault();
        openPopup();
        console.log(`🎮 Game card clicked: ${game.provider} - ${game.imageName}`);
    });
    
    // Add cursor pointer style
    card.style.cursor = 'pointer';
    
    return card;
}


// ============================================
// RENDERING FUNCTIONS
// ============================================

/**
 * Renders all game cards to the grid
 */
 function renderGameCards() {
    const grid = document.getElementById('gamesGrid');
    grid.innerHTML = '';
    
    // Get filtered games
    const filteredGames = filterGamesByProvider(currentProvider);
    
    // Show all games (no limit)
    const maxCards = filteredGames.length;
    
    // Create and append cards
    for (let i = 0; i < maxCards; i++) {
        const game = filteredGames[i];
        const card = createGameCard(game, i);
        grid.appendChild(card);
    }
    
    // Animate RTP bars
    setTimeout(animateRTPBars, 100);
}

/**
 * Animates all RTP progress bars
 */
function animateRTPBars() {
    const rtpBars = document.querySelectorAll('.rtp-bar');
    rtpBars.forEach((bar, index) => {
        const targetRTP = parseInt(bar.getAttribute('data-rtp'));
        setTimeout(() => {
            bar.style.width = `${targetRTP}%`;
        }, index * 20);
    });
}

// ============================================
// HAMBURGER MENU FUNCTIONALITY
// ============================================

/**
 * Sets up the hamburger provider menu
 */
function setupHamburgerMenu() {
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const providerMenu = document.getElementById('providerMenu');
    const providerItems = document.querySelectorAll('.provider-item');
    const currentProviderName = document.getElementById('currentProviderName');
    const currentProviderCount = document.getElementById('currentProviderCount');
    
    if (!hamburgerBtn || !providerMenu) return;
    
    // Toggle menu on hamburger button click
    hamburgerBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        providerMenu.classList.toggle('active');
    });
    
    // Close menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!providerMenu.contains(e.target) && e.target !== hamburgerBtn) {
            providerMenu.classList.remove('active');
        }
    });
    
    // Handle provider selection
    providerItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // Update active state
            providerItems.forEach(i => i.classList.remove('active'));
            this.classList.add('active');
            
            // Get provider info
            const provider = this.getAttribute('data-provider');
            const providerText = this.querySelector('.provider-text').textContent;
            const providerCount = this.querySelector('.provider-game-count').textContent;
            
            // Update hamburger button text
            currentProviderName.textContent = providerText;
            currentProviderCount.textContent = providerCount;
            
            // Update current provider
            currentProvider = provider;
            
            // Reset to showing all games
            showAllGames = true;
            
            // Render games
            renderGameCards();
            
            // Close menu
            providerMenu.classList.remove('active');
            
            // Scroll to games grid
            const gamesGrid = document.getElementById('gamesGrid');
            gamesGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            console.log(`📊 Switched to provider: ${providerText}`);
        });
    });
    
    console.log('✅ Hamburger menu initialized');
}


// ============================================
// CAROUSEL FUNCTIONALITY
// ============================================

/**
 * Sets up the banner carousel with auto-slide and navigation
 */
function setupCarousel() {
    const track = document.getElementById('carouselTrack');
    const slides = document.querySelectorAll('.carousel-slide');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const dots = document.querySelectorAll('.dot');
    
    if (!track || slides.length === 0) {
        console.warn('⚠️ Carousel elements not found');
        return;
    }
    
    let currentSlide = 0;
    const totalSlides = slides.length;
    let autoSlideInterval;
    
    // Update carousel position
    function updateCarousel() {
        const offset = -currentSlide * 100;
        track.style.transform = `translateX(${offset}%)`;
        
        // Update dots
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentSlide);
        });
    }
    
    // Go to specific slide
    function goToSlide(index) {
        currentSlide = index;
        if (currentSlide < 0) currentSlide = totalSlides - 1;
        if (currentSlide >= totalSlides) currentSlide = 0;
        updateCarousel();
        resetAutoSlide();
    }
    
    // Next slide
    function nextSlide() {
        goToSlide(currentSlide + 1);
    }
    
    // Previous slide
    function prevSlide() {
        goToSlide(currentSlide - 1);
    }
    
    // Auto slide function
    function startAutoSlide() {
        autoSlideInterval = setInterval(nextSlide, 5000); // 5 seconds
    }
    
    // Reset auto slide
    function resetAutoSlide() {
        clearInterval(autoSlideInterval);
        startAutoSlide();
    }
    
    // Event listeners
    if (nextBtn) {
        nextBtn.addEventListener('click', nextSlide);
    }
    
    if (prevBtn) {
        prevBtn.addEventListener('click', prevSlide);
    }
    
    // Dot navigation
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            goToSlide(index);
        });
    });
    
    // Touch/Swipe support
    let touchStartX = 0;
    let touchEndX = 0;
    
    track.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
    });
    
    track.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    });
    
    function handleSwipe() {
        const swipeThreshold = 50;
        const diff = touchStartX - touchEndX;
        
        if (Math.abs(diff) > swipeThreshold) {
            if (diff > 0) {
                nextSlide(); // Swipe left
            } else {
                prevSlide(); // Swipe right
            }
        }
    }
    
    // Pause auto-slide on hover
    track.addEventListener('mouseenter', () => {
        clearInterval(autoSlideInterval);
    });
    
    track.addEventListener('mouseleave', () => {
        startAutoSlide();
    });
    
    // Initialize
    updateCarousel();
    startAutoSlide();
    
    console.log(`✅ Carousel initialized with ${totalSlides} slides`);
}

// ============================================
// AUTO-REFRESH FUNCTIONALITY
// ============================================

/**
 * Calculates time until next RTP update (next minute)
 */
function getTimeUntilNextUpdate() {
    const now = new Date();
    const currentSeconds = now.getSeconds();
    const currentMilliseconds = now.getMilliseconds();
    
    // Time until next minute (60 seconds - current seconds)
    const msUntilNext = (60 - currentSeconds) * 1000 - currentMilliseconds;
    
    return msUntilNext;
}

/**
 * Sets up auto-refresh timer
 */
function setupAutoRefresh() {
    const scheduleNextRefresh = () => {
        const timeUntilNext = getTimeUntilNextUpdate();
        const nextUpdateTime = new Date(Date.now() + timeUntilNext);
        
        console.log(`⏰ Próxima atualização de RTP: ${nextUpdateTime.toLocaleTimeString('pt-BR')}`);
        
        setTimeout(() => {
            console.log('🔄 Atualizando RTP values...');
            renderGameCards();
            scheduleNextRefresh();
        }, timeUntilNext);
    };
    
    scheduleNextRefresh();
}

// ============================================
// POPUP FUNCTIONALITY
// ============================================

/**
 * Sets up the sticky register button and popup functionality
 */
function setupPopupFunctionality() {
    const stickyBtn = document.getElementById('stickyRegisterBtn');
    const popupOverlay = document.getElementById('popupOverlay');
    const popupClose = document.getElementById('popupClose');
    const popupButtons = document.querySelectorAll('.popup-btn');
    
    if (!stickyBtn || !popupOverlay || !popupClose) {
        console.warn('⚠️ Popup elements not found');
        return;
    }
    
    // Open popup when sticky button is clicked
    stickyBtn.addEventListener('click', function() {
        openPopup();
    });
    
    // Close popup when close button is clicked
    popupClose.addEventListener('click', function() {
        closePopup();
    });
    
    // Close popup when clicking outside the modal
    popupOverlay.addEventListener('click', function(e) {
        if (e.target === popupOverlay) {
            closePopup();
        }
    });
    
    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popupOverlay.classList.contains('active')) {
            closePopup();
        }
    });
    
    // Handle popup button clicks
    popupButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            const platform = this.querySelector('span').textContent;
            
            console.log(`🔗 Redirecting to: ${platform} (${url})`);
            
            // For now, just log the action. Later you can replace with actual redirect
            alert(`Redirecionando para: ${platform}\nURL: ${url}`);
            
            // Uncomment the line below when you want actual redirects
            // window.open(url, '_blank');
            
            closePopup();
        });
    });
    
    console.log('✅ Popup functionality initialized');
}

/**
 * Opens the popup modal
 */
function openPopup() {
    const popupOverlay = document.getElementById('popupOverlay');
    if (popupOverlay) {
        popupOverlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        console.log('📱 Popup opened');
    }
}

/**
 * Closes the popup modal
 */
function closePopup() {
    const popupOverlay = document.getElementById('popupOverlay');
    if (popupOverlay) {
        popupOverlay.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
        console.log('📱 Popup closed');
    }
}

/**
 * Updates popup button URLs and images (for future use)
 */
function updatePopupButtons(buttonData) {
    const popupButtonsContainer = document.getElementById('popupButtons');
    if (!popupButtonsContainer || !buttonData) return;
    
    popupButtonsContainer.innerHTML = '';
    
    buttonData.forEach((button, index) => {
        const buttonElement = document.createElement('a');
        buttonElement.href = '#';
        buttonElement.className = button.image ? 'popup-btn popup-btn-image' : 'popup-btn';
        buttonElement.setAttribute('data-url', button.url || '#');
        
        if (button.image) {
            // Full image button (no text)
            buttonElement.innerHTML = `<img src="${button.image}" alt="${button.name || `POP ${index + 1}`}" />`;
        } else {
            // Legacy button with icon and text
            buttonElement.innerHTML = `
                <div class="popup-btn-icon">
                    ${button.icon || '🎰'}
                </div>
                <span>${button.name || `Plataforma ${index + 1}`}</span>
            `;
        }
        
        // Add click handler
        buttonElement.addEventListener('click', function(e) {
            e.preventDefault();
            const url = this.getAttribute('data-url');
            const platform = button.name || `POP Platform ${index + 1}`;
            
            console.log(`🔗 Redirecting to: ${platform} (${url})`);
            alert(`Redirecionando para: ${platform}\nURL: ${url}`);
            
            // Uncomment for actual redirects
            // window.open(url, '_blank');
            
            closePopup();
        });
        
        popupButtonsContainer.appendChild(buttonElement);
    });
    
    console.log(`✅ Updated popup with ${buttonData.length} buttons`);
}

// ============================================
// INITIALIZATION
// ============================================

/**
 * Main initialization function
 */
async function init() {
    console.log('🎰 POP REDE - RTP Inicializando...');
    
    // Show loading message
    document.getElementById('gamesGrid').innerHTML = '<p style="color: #fff; padding: 20px; text-align: center;">⏳ Carregando jogos...</p>';
    
    // Load all games from provider folders (automatic discovery)
    await loadAllGames();
    
    if (allGames.length === 0) {
        console.error('❌ No games loaded!');
        document.getElementById('gamesGrid').innerHTML = '<p style="color: red; padding: 20px;">❌ Erro: Nenhum jogo encontrado. Verifique se get_images.php está funcionando.</p>';
        return;
    }
    
    // Setup event listeners
    setupCarousel(); // Initialize carousel
    setupHamburgerMenu();
    setupPopupFunctionality(); // Add popup functionality
    
    // Initial render
    renderGameCards();
    
    // Setup auto-refresh
    setupAutoRefresh();
    
    console.log('✅ POP REDE - RTP Pronto!');
    console.log(`📊 Total de ${allGames.length} jogos disponíveis`);
    console.log('🔄 RTP values mudam a cada 10 minutos');
    
    // Show provider breakdown
    const providerCounts = {};
    allGames.forEach(game => {
        providerCounts[game.provider] = (providerCounts[game.provider] || 0) + 1;
    });
    console.log('📈 Por Provider:', providerCounts);
    
    // Show priority breakdown
    const priorityCounts = {
        '1: ⭐⭐⭐ FORTUNE_* images': 0,
        '2: ⭐⭐ POPULAR_* images': 0,
        '3: 🎯 Fortune Providers': 0,
        '4: 🏛️ Olympus Games': 0,
        '5: 🎰 Popular Providers': 0,
        '6: 📱 Regular Games': 0
    };
    allGames.forEach(game => {
        if (game.priority === 1) priorityCounts['1: ⭐⭐⭐ FORTUNE_* images']++;
        else if (game.priority === 2) priorityCounts['2: ⭐⭐ POPULAR_* images']++;
        else if (game.priority === 3) priorityCounts['3: 🎯 Fortune Providers']++;
        else if (game.priority === 4) priorityCounts['4: 🏛️ Olympus Games']++;
        else if (game.priority === 5) priorityCounts['5: 🎰 Popular Providers']++;
        else priorityCounts['6: 📱 Regular Games']++;
    });
    console.log('🎯 Por Popularidade:', priorityCounts);
    
    // Show first 20 games to verify sorting (including image names)
    console.log('🔥 Top 20 Jogos (Mais Populares):');
    allGames.slice(0, 20).forEach((game, i) => {
        const priorityLabel = window.getPriorityLabel ? window.getPriorityLabel(game.priority) : `Priority ${game.priority}`;
        console.log(`  ${i + 1}. [P${game.priority}] ${game.imageName} (${game.provider})`);
    });
}

// Wait for DOM to be fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
