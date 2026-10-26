<?php
// Hostinger Secure Upload, Download & Delete API Script
// Lossless Binary File Handling - Disables Server Compression

// Increase limits for large binary files
@ini_set('memory_limit', '512M');
@ini_set('max_execution_time', '300');

// Disable LiteSpeed/Apache GZIP and PHP zlib output compression
if (function_exists('apache_setenv')) {
    @apache_setenv('no-gzip', '1');
}
@ini_set('zlib.output_compression', 'Off');

// CORS Headers for secure API access
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// IMPORTANT: This must match the HOSTINGER_API_SECRET in your Vercel .env settings.
$secret = 'pixbox_secure_upload_key_123!'; 

if (!isset($_GET['key']) || $_GET['key'] !== $secret) {
    http_response_code(401);
    die('Unauthorized');
}

$bucket = $_GET['bucket'] ?? '';
$path = $_GET['path'] ?? '';

if (!$bucket || !$path) {
    http_response_code(400);
    die('Missing bucket or path');
}

// Security: Prevent saving files outside the uploads directory
$path = str_replace(['../', '..\\'], '', $path);
$bucket = str_replace(['../', '..\\'], '', $bucket);
$targetFile = __DIR__ . '/uploads/' . $bucket . '/' . $path;

// Handle Direct File Downloads (GET with action=download)
if (isset($_GET['action']) && $_GET['action'] === 'download') {
    if (!file_exists($targetFile) || !is_file($targetFile)) {
        http_response_code(404);
        die('File not found');
    }

    if (ob_get_level()) {
        ob_end_clean();
    }

    $filename = $_GET['filename'] ?? basename($targetFile);
    $filesize = filesize($targetFile);

    // Serve as application/octet-stream with no-transform to prevent web server compression or WebP conversion
    header('X-LiteSpeed-Cache-Control: no-cache');
    header('Content-Description: File Transfer');
    header('Content-Type: application/octet-stream');
    header('Content-Disposition: attachment; filename="' . rawurlencode($filename) . '"');
    header('Content-Transfer-Encoding: binary');
    header('Expires: 0');
    header('Cache-Control: must-revalidate, post-check=0, pre-check=0, no-transform, no-store, no-cache');
    header('Pragma: no-cache');
    header('Content-Length: ' . $filesize);

    readfile($targetFile);
    exit;
}

// Handle File Uploads (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $targetDir = dirname($targetFile);
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    
    $fileData = file_get_contents('php://input');
    if ($fileData !== false && file_put_contents($targetFile, $fileData)) {
        http_response_code(200);
        echo "OK";
    } else {
        http_response_code(500);
        echo "Failed to save file";
    }
} 
// Handle File Deletions (DELETE)
elseif ($_SERVER['REQUEST_METHOD'] === 'DELETE') {
    if (file_exists($targetFile)) {
        unlink($targetFile);
    }
    http_response_code(200);
    echo "OK";
} else {
    http_response_code(405);
    echo "Method not allowed";
}
?>
