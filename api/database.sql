-- =============================================
-- Database Schema cho Hệ thống Đối soát Lô Đề
-- Chạy file này trong phpMyAdmin của cPanel
-- =============================================

-- Tạo bảng users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) DEFAULT '',
    email VARCHAR(100) DEFAULT '',
    phone VARCHAR(20) DEFAULT '',
    role ENUM('admin', 'user') DEFAULT 'user',
    status ENUM('active', 'inactive', 'pending', 'deleted') DEFAULT 'active',
    subscription_type VARCHAR(50) DEFAULT NULL,
    subscription_package VARCHAR(100) DEFAULT NULL,
    subscription_expiry DATE DEFAULT NULL,
    subscription_status VARCHAR(20) DEFAULT NULL,
    activated_at DATETIME DEFAULT NULL,
    activated_by VARCHAR(50) DEFAULT NULL,
    last_login DATETIME DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng packages
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    price VARCHAR(50) NOT NULL,
    duration INT NOT NULL COMMENT 'Số ngày',
    features JSON DEFAULT NULL,
    max_transactions INT DEFAULT -1,
    regions JSON DEFAULT NULL,
    target VARCHAR(50) DEFAULT 'general',
    popular TINYINT(1) DEFAULT 0,
    priority INT DEFAULT 999,
    active TINYINT(1) DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng payments
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    username VARCHAR(50) DEFAULT '',
    package_id VARCHAR(50) NOT NULL,
    amount DECIMAL(15, 0) NOT NULL,
    status ENUM('pending', 'completed', 'rejected', 'cancelled') DEFAULT 'pending',
    order_id VARCHAR(50) DEFAULT NULL,
    transaction_id VARCHAR(100) DEFAULT NULL,
    payment_method VARCHAR(50) DEFAULT 'transfer',
    note TEXT DEFAULT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_user_id (user_id),
    INDEX idx_status (status),
    INDEX idx_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tạo bảng app_config
CREATE TABLE IF NOT EXISTS app_config (
    id INT PRIMARY KEY DEFAULT 1,
    contact_info JSON DEFAULT NULL,
    payment_config JSON DEFAULT NULL,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Thêm admin mặc định (password: admin123)
INSERT INTO users (username, password, full_name, role, status, created_at)
VALUES ('admin', 'admin123', 'Administrator', 'admin', 'active', NOW())
ON DUPLICATE KEY UPDATE id=id;

-- Thêm gói mặc định
INSERT INTO packages (id, name, price, duration, features, popular, active) VALUES
('basic_7', 'Gói 7 Ngày', '50000', 7, '["Đối soát kết quả XSMB", "Hỗ trợ cơ bản"]', 0, 1),
('standard_30', 'Gói 30 Ngày', '150000', 30, '["Đối soát kết quả XSMB", "Lịch sử 30 ngày", "Hỗ trợ ưu tiên"]', 1, 1),
('premium_90', 'Gói 90 Ngày', '350000', 90, '["Đối soát kết quả XSMB", "Lịch sử không giới hạn", "Hỗ trợ 24/7", "Xuất báo cáo"]', 0, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Config mặc định
INSERT INTO app_config (id, contact_info, payment_config) VALUES (1, NULL, NULL)
ON DUPLICATE KEY UPDATE id=id;
