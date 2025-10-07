/**
 * Game Data - Provider-based Image Loading System
 * Purpose: Dynamically loads all images from provider folders
 * 
 * Provider Structure:
 * - images/HACKSAW/
 * - images/PG SOFT/
 * - images/Pragmatic Play/
 * - images/Playtech/
 * - images/Play N' GO/
 * - images/TADA/
 */

// Provider list with display names and folder names
const PROVIDERS = {
    'HACKSAW': { displayName: 'Hacksaw Gaming', folder: 'HACKSAW', priority: 1 },
    'PG SOFT': { displayName: 'PG Soft', folder: 'PG SOFT', priority: 1 },
    'Pragmatic Play': { displayName: 'Pragmatic Play', folder: 'Pragmatic Play', priority: 1 },
    'Playtech': { displayName: 'Playtech', folder: 'Playtech', priority: 2 },
    'Play N\' GO': { displayName: 'Play N\' GO', folder: 'Play N\' GO', priority: 1 },
    'TADA': { displayName: 'TADAJILI', folder: 'TADA', priority: 2 }
};

// This will be populated dynamically by scanning the folders
// Format: { 'provider/imagename': { provider, image, path } }
const GAME_DATA = {};

// Export for use in other scripts
if (typeof window !== 'undefined') {
    window.GAME_DATA = GAME_DATA;
    window.PROVIDERS = PROVIDERS;
}
