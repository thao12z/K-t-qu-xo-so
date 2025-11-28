<?php
/**
 * Admin Authentication API
 * Xác thực admin qua MySQL - Bảo mật hơn localStorage
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
            // Check if admin exists in database
            $db = getDB();
            $stmt = $db->prepare("SELECT id, username, full_name, email FROM users WHERE role = 'admin' AND status = 'active' LIMIT 1");
            $stmt->execute();
            $admin = $stmt->fetch();

            if ($admin) {
                jsonResponse([
                    'success' => true,
                    'hasAdmin' => true,
                    'username' => $admin['username']
                ]);
            } else {
                jsonResponse([
                    'success' => true,
                    'hasAdmin' => false
                ]);
            }
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
            handleLogin($input);
            break;

        case 'change-password':
            handleChangePassword($input);
            break;

        case 'setup':
            handleSetup($input);
            break;

        default:
            jsonResponse(['error' => 'Invalid action'], 400);
    }
}

// Login handler - xác thực admin
function handleLogin($data) {
    $db = getDB();

    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if (empty($username) || empty($password)) {
        jsonResponse(['error' => 'Username and password required'], 400);
    }

    // Find admin user
    $stmt = $db->prepare("SELECT id, username, password, full_name, email, phone, role, status FROM users WHERE username = ? AND role = 'admin'");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if (!$admin) {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }

    if ($admin['status'] !== 'active') {
        jsonResponse(['error' => 'Account is not active'], 403);
    }

    // Verify password
    // Support both plain text (legacy) and hashed passwords
    $passwordValid = false;

    if (password_get_info($admin['password'])['algo'] !== null) {
        // Password is hashed
        $passwordValid = password_verify($password, $admin['password']);
    } else {
        // Plain text password (legacy) - should migrate to hash
        $passwordValid = ($password === $admin['password']);

        // Auto-migrate to hashed password
        if ($passwordValid) {
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
            $updateStmt = $db->prepare("UPDATE users SET password = ? WHERE id = ?");
            $updateStmt->execute([$hashedPassword, $admin['id']]);
        }
    }

    if (!$passwordValid) {
        jsonResponse(['error' => 'Invalid credentials'], 401);
    }

    // Update last login
    $updateStmt = $db->prepare("UPDATE users SET last_login = NOW() WHERE id = ?");
    $updateStmt->execute([$admin['id']]);

    // Generate session token (simple implementation)
    $token = bin2hex(random_bytes(32));

    // Return success with admin info (exclude password)
    jsonResponse([
        'success' => true,
        'token' => $token,
        'user' => [
            'id' => $admin['id'],
            'username' => $admin['username'],
            'fullName' => $admin['full_name'],
            'email' => $admin['email'],
            'phone' => $admin['phone'],
            'role' => $admin['role']
        ]
    ]);
}

// Change password handler
function handleChangePassword($data) {
    $db = getDB();

    $username = $data['username'] ?? '';
    $currentPassword = $data['currentPassword'] ?? '';
    $newPassword = $data['newPassword'] ?? '';

    if (empty($username) || empty($currentPassword) || empty($newPassword)) {
        jsonResponse(['error' => 'All fields required'], 400);
    }

    if (strlen($newPassword) < 6) {
        jsonResponse(['error' => 'New password must be at least 6 characters'], 400);
    }

    // Find admin user
    $stmt = $db->prepare("SELECT id, password FROM users WHERE username = ? AND role = 'admin'");
    $stmt->execute([$username]);
    $admin = $stmt->fetch();

    if (!$admin) {
        jsonResponse(['error' => 'Admin not found'], 404);
    }

    // Verify current password
    $passwordValid = false;

    if (password_get_info($admin['password'])['algo'] !== null) {
        $passwordValid = password_verify($currentPassword, $admin['password']);
    } else {
        $passwordValid = ($currentPassword === $admin['password']);
    }

    if (!$passwordValid) {
        jsonResponse(['error' => 'Current password is incorrect'], 401);
    }

    // Hash and save new password
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);
    $updateStmt = $db->prepare("UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?");
    $updateStmt->execute([$hashedPassword, $admin['id']]);

    jsonResponse([
        'success' => true,
        'message' => 'Password changed successfully'
    ]);
}

// Setup initial admin (only works if no admin exists)
function handleSetup($data) {
    $db = getDB();

    // Check if admin already exists
    $stmt = $db->query("SELECT COUNT(*) as count FROM users WHERE role = 'admin'");
    $result = $stmt->fetch();

    if ($result['count'] > 0) {
        jsonResponse(['error' => 'Admin already exists. Use change-password to update.'], 400);
    }

    $username = $data['username'] ?? 'admin';
    $password = $data['password'] ?? '';
    $email = $data['email'] ?? '';
    $fullName = $data['fullName'] ?? 'Administrator';

    if (empty($password) || strlen($password) < 6) {
        jsonResponse(['error' => 'Password must be at least 6 characters'], 400);
    }

    // Hash password
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

    // Create admin user
    $insertStmt = $db->prepare("
        INSERT INTO users (username, password, full_name, email, role, status, created_at)
        VALUES (?, ?, ?, ?, 'admin', 'active', NOW())
    ");
    $insertStmt->execute([$username, $hashedPassword, $fullName, $email]);

    jsonResponse([
        'success' => true,
        'message' => 'Admin account created successfully'
    ]);
}
?>
