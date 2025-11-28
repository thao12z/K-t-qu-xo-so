<?php
/**
 * ⚙️ CẤU HÌNH DATABASE - CHỈ CẦN SỬA 3 DÒNG BÊN DƯỚI
 *
 * Hướng dẫn:
 * 1. Vào cPanel → MySQL Databases → Tạo database mới
 * 2. Tạo user và gán quyền ALL PRIVILEGES cho database
 * 3. Điền thông tin vào 3 dòng bên dưới
 */

// ========== SỬA 3 DÒNG NÀY ==========
define('DB_NAME', 'TEN_DATABASE');      // Ví dụ: cpanel_lode
define('DB_USER', 'USERNAME_DATABASE'); // Ví dụ: cpanel_admin
define('DB_PASS', 'PASSWORD_DATABASE'); // Ví dụ: MatKhau123
// =====================================

// Không cần sửa các dòng bên dưới
define('DB_HOST', 'localhost');

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
        echo json_encode(['error' => 'Lỗi kết nối database: ' . $e->getMessage()]);
        exit();
    }
}

// JSON response helper
function jsonResponse($data, $code = 200) {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit();
}
?>
