<?php
/**
 * User Authentication API
 * Xác thực user qua MySQL - Cho người dùng cuối (không phải admin)
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'POST':
        handlePost($action);
        break;
    case 'GET':
        handleGet($action);
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

// GET handlers
function handleGet($action) {
    switch ($action) {
        case 'check':
            // Check user subscription status
            $username = $_GET['username'] ?? '';
            if (empty($username)) {
                jsonResponse(['error' => 'Username required'], 400);
            }

            $db = getDB();
            $stmt = $db->prepare("
                SELECT id, username, full_name, status,
                       subscription_type, subscription_package,
                       subscription_expiry, subscription_status
                FROM users
                WHERE username = ? AND role = 'user'
            ");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user) {
                // Check if subscription is valid
                $isActive = $user['status'] === 'active';
                $hasSubscription = !empty($user['subscription_expiry']);
                $subscriptionValid = $hasSubscription && strtotime($user['subscription_expiry']) > time();

                jsonResponse([
                    'success' => true,
                    'user' => [
                        'id' => $user['id'],
                        'username' => $user['username'],
                        'fullName' => $user['full_name'],
                        'status' => $user['status'],
                        'subscriptionType' => $user['subscription_type'],
                        'subscriptionPackage' => $user['subscription_package'],
                        'subscriptionExpiry' => $user['subscription_expiry'],
                        'subscriptionStatus' => $user['subscription_status'],
                        'isActive' => $isActive,
                        'subscriptionValid' => $subscriptionValid
                    ]
                ]);
            } else {
                jsonResponse(['error' => 'User not found'], 404);
            }
            break;

        case 'packages':
            // Get available packages for users
            $db = getDB();
            $stmt = $db->query("SELECT * FROM packages WHERE active = 1 ORDER BY priority ASC");
            $packages = $stmt->fetchAll();

            $transformedPackages = array_map(function($p) {
                return [
                    'id' => $p['id'],
                    'name' => $p['name'],
                    'price' => $p['price'],
                    'duration' => $p['duration'],
                    'features' => json_decode($p['features'], true) ?? [],
                    'popular' => $p['popular'] == 1
                ];
            }, $packages);

            jsonResponse(['success' => true, 'data' => $transformedPackages]);
            break;

        default:
            jsonResponse(['error' => 'Invalid action'], 400);
    }
}

// POST handlers
function handlePost($action) {
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        jsonResponse(['error' => 'Invalid JSON input'], 400);
    }

    switch ($action) {
        case 'login':
            handleUserLogin($input);
            break;

        case 'register':
            handleUserRegister($input);
            break;

        case 'change-password':
            handleUserChangePassword($input);
            break;

        default:
            jsonResponse(['error' => 'Invalid action'], 400);
    }
}

// User login handler
function handleUserLogin($data) {
    $db = getDB();

    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'Vui lòng nhập username và password'], 400);
    }

    // Find user (role = 'user', not admin)
    $stmt = $db->prepare("
        SELECT id, username, password, full_name, email, phone, role, status,
               subscription_type, subscription_package, subscription_expiry, subscription_status,
               activated_at, activated_by
        FROM users
        WHERE username = ? AND role = 'user'
    ");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['error' => 'Tài khoản không tồn tại'], 401);
    }

    if ($user['status'] !== 'active') {
        jsonResponse(['error' => 'Tài khoản chưa được kích hoạt hoặc đã bị khóa'], 403);
    }

    // Verify password
    $passwordValid = false;

    if (password_get_info($user['password'])['algo'] !== null) {
        // Password is hashed
        $passwordValid = password_verify($password, $user['password']);
    } else {
        // Plain text password (legacy)
        $passwordValid = ($password === $user['password']);

        // Auto-migrate to hashed password
        if ($passwordValid) {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $updateStmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
            $updateStmt->execute([$hashedPassword, $user['id']]);
        }
    }

    if (!$passwordValid) {
        jsonResponse(['error' => 'Mật khẩu không đúng'], 401);
    }

    // Check subscription
    $hasSubscription = !empty($user['subscription_expiry']);
    $subscriptionValid = $hasSubscription && strtotime($user['subscription_expiry']) > time();

    // Update last login
    $updateStmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$user['id']]);

    // Generate session token
    $token = bin2hex(random_bytes(32));

    // Return success with user info
    jsonResponse([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $user['id'],
            'username' => $user['username'],
            'fullName' => $user['full_name'],
            'email' => $user['email'],
            'phone' => $user['phone'],
            'role' => $user['role'],
            'status' => $user['status'],
            'subscriptionType' => $user['subscription_type'],
            'subscriptionPackage' => $user['subscription_package'],
            'subscriptionExpiry' => $user['subscription_expiry'],
            'subscriptionStatus' => $user['subscription_status'],
            'subscriptionValid' => $subscriptionValid,
            'activatedAt' => $user['activated_at'],
            'activatedBy' => $user['activated_by']
        ]
    ]);
}

// User registration handler
function handleUserRegister($data) {
    $db = getDB();

    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';
    $fullName = $data['fullName'] ?? '';
    $email = $data['email'] ?? '';
    $phone = $data['phone'] ?? '';

    // Validation
    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'Username và password là bắt buộc'], 400);
    }

    if (strlen($username) < 3) {
        jsonResponse(['error' => 'Username phải có ít nhất 3 ký tự'], 400);
    }

    if (strlen($password) < 6) {
        jsonResponse(['error' => 'Password phải có ít nhất 6 ký tự'], 400);
    }

    // Check if username exists
    $stmt = $db->prepare("SELECT id FROM users WHERE username = ?");
    $stmt->execute([$username]);
    if ($stmt->fetch()) {
        jsonResponse(['error' => 'Username đã tồn tại'], 400);
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Create user with pending status (needs admin approval or payment)
    $insertStmt = $db->prepare("
        INSERT INTO users (username, password, full_name, email, phone, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, 'user', 'pending', NOW())
    ");
    $insertStmt->execute([$username, $hashedPassword, $fullName, $email, $phone]);

    $userId = $db->lastInsertId();

    jsonResponse([
        'success' => true,
        'message' => 'Đăng ký thành công. Vui lòng đợi admin kích hoạt tài khoản.',
        'userId' => $userId
    ]);
}

// User change password handler
function handleUserChangePassword($data) {
    $db = getDB();

    $username = $data['username'] ?? '';
    $currentPassword = $data['currentPassword'] ?? '';
    $newPassword = $data['newPassword'] ?? '';

    if (empty($username) || empty($currentPassword) || empty($newPassword)) {
        jsonResponse(['error' => 'Vui lòng điền đầy đủ các trường'], 400);
    }

    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'Mật khẩu mới phải có ít nhất 6 ký tự'], 400);
    }

    // Find user
    $stmt = $db->prepare("SELECT id, password FROM users WHERE username = ? AND role = 'user'");
    $stmt->execute([$username]);
    $user = $stmt->fetch();

    if (!$user) {
        jsonResponse(['error' => 'Tài khoản không tồn tại'], 404);
    }

    // Verify current password
    $passwordValid = false;

    if (password_get_info($user['password'])['algo'] !== null) {
        $passwordValid = password_verify($currentPassword, $user['password']);
    } else {
        $passwordValid = ($currentPassword === $user['password']);
    }

    if (!$passwordValid) {
        jsonResponse(['error' => 'Mật khẩu hiện tại không đúng'], 401);
    }

    // Hash and save new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $db->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
    $updateStmt->execute([$hashedPassword, $user['id']]);

    jsonResponse([
        'success' => true,
        'message' => 'Đổi mật khẩu thành công'
    ]);
}
?>
