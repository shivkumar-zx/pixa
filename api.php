<?php
// Hostinger Secure Upload & Delete API Script

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

// Handle File Uploads (POST)
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $targetDir = dirname($targetFile);
    if (!file_exists($targetDir)) {
        mkdir($targetDir, 0755, true);
    }
    
    $fileData = file_get_contents('php://input');
    if (file_put_contents($targetFile, $fileData)) {
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
