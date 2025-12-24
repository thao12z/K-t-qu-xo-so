-- ============================================
-- HỆ THỐNG ĐỐI SOÁT LÔ ĐỀ - DATABASE SETUP
-- Chạy file này trong phpMyAdmin 1 lần duy nhất
-- ============================================

-- 1. Bảng Users (Admin + User)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    role VARCHAR(50) DEFAULT 'user',
    status VARCHAR(50) DEFAULT 'active',
    subscription_type VARCHAR(100),
    subscription_package VARCHAR(255),
    subscription_expiry DATE,
    subscription_status VARCHAR(50),
    activated_at DATETIME,
    activated_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. Bảng Packages (Gói dịch vụ)
CREATE TABLE IF NOT EXISTS packages (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price INT NOT NULL,
    duration INT,
    duration_type VARCHAR(50) DEFAULT 'days',
    features JSON,
    max_transactions INT DEFAULT -1,
    regions JSON,
    target VARCHAR(50) DEFAULT 'general',
    popular TINYINT DEFAULT 0,
    priority INT DEFAULT 999,
    active TINYINT DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. Bảng Payments (Thanh toán)
CREATE TABLE IF NOT EXISTS payments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    username VARCHAR(100),
    package_id VARCHAR(100),
    amount INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    order_id VARCHAR(100),
    transaction_id VARCHAR(255),
    payment_method VARCHAR(50),
    transfer_content VARCHAR(255),
    image_url TEXT,
    approved_at DATETIME,
    approved_by VARCHAR(100),
    rejected_at DATETIME,
    rejected_by VARCHAR(100),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. Bảng App Config (Cấu hình hệ thống)
CREATE TABLE IF NOT EXISTS app_config (
    id INT PRIMARY KEY DEFAULT 1,
    contact_info JSON,
    payment_config JSON,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================
-- TẠO TÀI KHOẢN ADMIN MẶC ĐỊNH
-- Username: admin
-- Password: admin123
-- ============================================
INSERT INTO users (username, password, full_name, role, status, created_at)
VALUES (
    'admin',
    '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'Administrator',
    'admin',
    'active',
    NOW()
) ON DUPLICATE KEY UPDATE updated_at = NOW();

-- ============================================
-- TẠO CÁC GÓI DỊCH VỤ MẪU
-- ============================================
INSERT INTO packages (id, name, price, duration, features, popular, active) VALUES
('pkg_basic', 'Gói Cơ Bản', 199000, 30, '["Đối soát cơ bản", "1 khu vực", "Hỗ trợ email"]', 0, 1),
('pkg_pro', 'Gói Chuyên Nghiệp', 499000, 30, '["Đối soát nâng cao", "3 khu vực", "Hỗ trợ 24/7", "Báo cáo chi tiết"]', 1, 1),
('pkg_enterprise', 'Gói Doanh Nghiệp', 999000, 30, '["Không giới hạn", "Tất cả khu vực", "Hỗ trợ VIP", "API truy cập", "Tùy chỉnh báo cáo"]', 0, 1)
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- ============================================
-- HOÀN TẤT!
-- Đăng nhập admin: admin / admin123
-- Nhớ đổi password sau khi đăng nhập
-- ============================================
