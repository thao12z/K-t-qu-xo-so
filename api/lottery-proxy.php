<?php
/**
 * Lottery Proxy - Bypass CORS issues
 * Fetches lottery data from xosodaiphat.com
 * Supports both RSS feed and specific date pages
 */

// CORS Headers
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Get URL from parameter, default to RSS feed
$defaultUrl = 'https://xosodaiphat.com/ket-qua-xo-so-mien-bac-xsmb.rss';
$targetUrl = isset($_GET['url']) ? $_GET['url'] : $defaultUrl;

// Security: Only allow xosodaiphat.com URLs
if (strpos($targetUrl, 'xosodaiphat.com') === false) {
    http_response_code(403);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Only xosodaiphat.com URLs are allowed']);
    exit();
}

// Set content type based on URL
if (strpos($targetUrl, '.rss') !== false) {
    header('Content-Type: application/xml; charset=utf-8');
} else {
    header('Content-Type: text/html; charset=utf-8');
}

// Initialize cURL
$ch = curl_init();

curl_setopt_array($ch, [
    CURLOPT_URL => $targetUrl,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_TIMEOUT => 30,
    CURLOPT_SSL_VERIFYPEER => false,
    CURLOPT_HTTPHEADER => [
        'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language: vi-VN,vi;q=0.9,en;q=0.8',
        'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    ]
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

if ($error) {
    http_response_code(500);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Failed to fetch: ' . $error]);
    exit();
}

if ($httpCode !== 200) {
    http_response_code($httpCode);
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Source returned HTTP ' . $httpCode]);
    exit();
}

// Return the content
echo $response;
?>
