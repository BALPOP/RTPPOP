<?php
/**
 * Dynamic Image Discovery API
 * Automatically scans provider folders and returns all images
 * No manual listing needed!
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$imagesDir = 'images';
$providers = [
    'HACKSAW',
    'PG SOFT',
    'Pragmatic Play',
    'Playtech',
    'Play N\' GO',
    'TADA'
];

$result = [];
$totalImages = 0;

foreach ($providers as $provider) {
    $providerPath = $imagesDir . '/' . $provider;
    $images = [];
    
    if (is_dir($providerPath)) {
        $files = scandir($providerPath);
        
        foreach ($files as $file) {
            // Skip . and .. and non-image files
            if ($file !== '.' && $file !== '..' && preg_match('/\.(jpg|jpeg|png|webp|gif)$/i', $file)) {
                $images[] = $file;
            }
        }
        
        sort($images);
    }
    
    $result[$provider] = $images;
    $totalImages += count($images);
}

// Return as JSON
echo json_encode([
    'success' => true,
    'providers' => $result,
    'totalImages' => $totalImages,
    'timestamp' => time()
]);
?>

