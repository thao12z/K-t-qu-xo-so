<?php
/**
 * Database Configuration
 * Cấu hình kết nối MySQL - Chỉnh sửa thông tin bên dưới
 */

// Database credentials - THAY ĐỔI THEO THÔNG TIN CPANEL CỦA BẠN
define('DB_HOST', 'localhost');
define('DB_NAME', 'lode_db');           // Tên database bạn tạo trong cPanel
define('DB_USER', 'lode_user');         // Username database
define('DB_PASS', 'your_password');     // Password database

// API Security
define('API_KEY', 'your-secret-api-key-here'); // Đổi thành key bí mật của bạn

// CORS Headers
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, X-API-Key');

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Database connection function
function getDB() {
    try {
        $pdo = new PDO(
            "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4",
            DB_USER,
            DB_PASS,
            [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false
            ]
        );
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit();
    }
}

// API Key validation (optional - bỏ comment nếu muốn bảo mật)
// function validateApiKey() {
//     $headers = getallheaders();
//     $apiKey = $headers['X-API-Key'] ?? '';
//     if ($apiKey !== API_KEY) {
//         http_response_code(401);
//         echo json_encode(['error' => 'Invalid API key']);
//         exit();
//     }
// }

// JSON response helper
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}
?>
