<?php
/**
 * Data Sync API - Đồng bộ dữ liệu admin/users qua MySQL
 */

require_once 'config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

switch ($method) {
    case 'GET':
        handleGet($action);
        break;
    case 'POST':
        handlePost($action);
        break;
    default:
        jsonResponse(['error' => 'Method not allowed'], 405);
}

// GET handlers
function handleGet($action) {
    $db = getDB();

    switch ($action) {
        case 'users':
            $stmt = $db->query("SELECT * FROM users WHERE status != 'deleted' ORDER BY id DESC");
            $users = $stmt->fetchAll();
            jsonResponse(['success' => true, 'data' => $users]);
            break;

        case 'packages':
            $stmt = $db->query("SELECT * FROM packages ORDER BY id ASC");
            $packages = $stmt->fetchAll();
            jsonResponse(['success' => true, 'data' => $packages]);
            break;

        case 'payments':
            $stmt = $db->query("SELECT * FROM payments ORDER BY created_at DESC");
            $payments = $stmt->fetchAll();
            jsonResponse(['success' => true, 'data' => $payments]);
            break;

        case 'config':
            $stmt = $db->query("SELECT * FROM app_config LIMIT 1");
            $config = $stmt->fetch();
            jsonResponse(['success' => true, 'data' => $config]);
            break;

        case 'all':
            // Get all data for initial sync
            $users = $db->query("SELECT * FROM users WHERE status != 'deleted'")->fetchAll();
            $packages = $db->query("SELECT * FROM packages")->fetchAll();
            $payments = $db->query("SELECT * FROM payments")->fetchAll();
            $config = $db->query("SELECT * FROM app_config LIMIT 1")->fetch();

            jsonResponse([
                'success' => true,
                'data' => [
                    'users' => $users,
                    'packages' => $packages,
                    'payments' => $payments,
                    'config' => $config
                ],
                'syncedAt' => date('c')
            ]);
            break;

        default:
            jsonResponse(['error' => 'Invalid action'], 400);
    }
}

// POST handlers
function handlePost($action) {
    $db = getDB();
    $input = json_decode(file_get_contents('php://input'), true);

    if (!$input) {
        jsonResponse(['error' => 'Invalid JSON input'], 400);
    }

    switch ($action) {
        case 'user':
            saveUser($db, $input);
            break;

        case 'users':
            saveUsers($db, $input);
            break;

        case 'package':
            savePackage($db, $input);
            break;

        case 'payment':
            savePayment($db, $input);
            break;

        case 'config':
            saveConfig($db, $input);
            break;

        case 'sync':
            syncAll($db, $input);
            break;

        default:
            jsonResponse(['error' => 'Invalid action'], 400);
    }
}

// Save single user
function saveUser($db, $data) {
    $sql = "INSERT INTO users (id, username, password, full_name, email, phone, role, status,
            subscription_type, subscription_package, subscription_expiry, subscription_status,
            activated_at, activated_by, created_at, updated_at)
            VALUES (:id, :username, :password, :full_name, :email, :phone, :role, :status,
            :subscription_type, :subscription_package, :subscription_expiry, :subscription_status,
            :activated_at, :activated_by, :created_at, NOW())
            ON DUPLICATE KEY UPDATE
            password = VALUES(password),
            full_name = VALUES(full_name),
            email = VALUES(email),
            phone = VALUES(phone),
            role = VALUES(role),
            status = VALUES(status),
            subscription_type = VALUES(subscription_type),
            subscription_package = VALUES(subscription_package),
            subscription_expiry = VALUES(subscription_expiry),
            subscription_status = VALUES(subscription_status),
            activated_at = VALUES(activated_at),
            activated_by = VALUES(activated_by),
            updated_at = NOW()";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'] ?? null,
        ':username' => $data['username'],
        ':password' => $data['password'],
        ':full_name' => $data['fullName'] ?? $data['full_name'] ?? '',
        ':email' => $data['email'] ?? '',
        ':phone' => $data['phone'] ?? '',
        ':role' => $data['role'] ?? 'user',
        ':status' => $data['status'] ?? 'active',
        ':subscription_type' => $data['subscriptionType'] ?? $data['subscription_type'] ?? null,
        ':subscription_package' => $data['subscriptionPackage'] ?? $data['subscription_package'] ?? null,
        ':subscription_expiry' => $data['subscriptionExpiry'] ?? $data['subscription_expiry'] ?? null,
        ':subscription_status' => $data['subscriptionStatus'] ?? $data['subscription_status'] ?? null,
        ':activated_at' => $data['activatedAt'] ?? $data['activated_at'] ?? null,
        ':activated_by' => $data['activatedBy'] ?? $data['activated_by'] ?? null,
        ':created_at' => $data['createdAt'] ?? $data['created_at'] ?? date('Y-m-d H:i:s')
    ]);

    $userId = $data['id'] ?? $db->lastInsertId();
    jsonResponse(['success' => true, 'id' => $userId]);
}

// Save multiple users
function saveUsers($db, $data) {
    $count = 0;
    foreach ($data as $user) {
        try {
            $sql = "INSERT INTO users (id, username, password, full_name, email, phone, role, status,
                    subscription_type, subscription_package, subscription_expiry, subscription_status,
                    activated_at, activated_by, created_at, updated_at)
                    VALUES (:id, :username, :password, :full_name, :email, :phone, :role, :status,
                    :subscription_type, :subscription_package, :subscription_expiry, :subscription_status,
                    :activated_at, :activated_by, :created_at, NOW())
                    ON DUPLICATE KEY UPDATE
                    password = VALUES(password),
                    full_name = VALUES(full_name),
                    status = VALUES(status),
                    subscription_type = VALUES(subscription_type),
                    subscription_package = VALUES(subscription_package),
                    subscription_expiry = VALUES(subscription_expiry),
                    subscription_status = VALUES(subscription_status),
                    updated_at = NOW()";

            $stmt = $db->prepare($sql);
            $stmt->execute([
                ':id' => $user['id'] ?? null,
                ':username' => $user['username'],
                ':password' => $user['password'],
                ':full_name' => $user['fullName'] ?? $user['full_name'] ?? '',
                ':email' => $user['email'] ?? '',
                ':phone' => $user['phone'] ?? '',
                ':role' => $user['role'] ?? 'user',
                ':status' => $user['status'] ?? 'active',
                ':subscription_type' => $user['subscriptionType'] ?? $user['subscription_type'] ?? null,
                ':subscription_package' => $user['subscriptionPackage'] ?? $user['subscription_package'] ?? null,
                ':subscription_expiry' => $user['subscriptionExpiry'] ?? $user['subscription_expiry'] ?? null,
                ':subscription_status' => $user['subscriptionStatus'] ?? $user['subscription_status'] ?? null,
                ':activated_at' => $user['activatedAt'] ?? $user['activated_at'] ?? null,
                ':activated_by' => $user['activatedBy'] ?? $user['activated_by'] ?? null,
                ':created_at' => $user['createdAt'] ?? $user['created_at'] ?? date('Y-m-d H:i:s')
            ]);
            $count++;
        } catch (Exception $e) {
            // Skip errors for individual users
            error_log("Error saving user: " . $e->getMessage());
        }
    }

    jsonResponse(['success' => true, 'count' => $count]);
}

// Save package
function savePackage($db, $data) {
    $sql = "INSERT INTO packages (id, name, price, duration, features, max_transactions, regions,
            target, popular, priority, active, created_at)
            VALUES (:id, :name, :price, :duration, :features, :max_transactions, :regions,
            :target, :popular, :priority, :active, NOW())
            ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            price = VALUES(price),
            duration = VALUES(duration),
            features = VALUES(features),
            active = VALUES(active)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':name' => $data['name'],
        ':price' => $data['price'],
        ':duration' => $data['duration'],
        ':features' => json_encode($data['features'] ?? []),
        ':max_transactions' => $data['maxTransactions'] ?? -1,
        ':regions' => json_encode($data['regions'] ?? ['bac']),
        ':target' => $data['target'] ?? 'general',
        ':popular' => $data['popular'] ? 1 : 0,
        ':priority' => $data['priority'] ?? 999,
        ':active' => $data['active'] ? 1 : 0
    ]);

    jsonResponse(['success' => true, 'id' => $data['id']]);
}

// Save payment
function savePayment($db, $data) {
    $sql = "INSERT INTO payments (id, user_id, username, package_id, amount, status,
            order_id, transaction_id, payment_method, created_at)
            VALUES (:id, :user_id, :username, :package_id, :amount, :status,
            :order_id, :transaction_id, :payment_method, :created_at)
            ON DUPLICATE KEY UPDATE
            status = VALUES(status),
            transaction_id = VALUES(transaction_id)";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':id' => $data['id'],
        ':user_id' => $data['userId'] ?? $data['user_id'],
        ':username' => $data['username'] ?? '',
        ':package_id' => $data['packageId'] ?? $data['package_id'],
        ':amount' => $data['amount'],
        ':status' => $data['status'],
        ':order_id' => $data['orderId'] ?? $data['order_id'] ?? null,
        ':transaction_id' => $data['transactionId'] ?? $data['transaction_id'] ?? null,
        ':payment_method' => $data['paymentMethod'] ?? $data['payment_method'] ?? 'transfer',
        ':created_at' => $data['createdAt'] ?? $data['created_at'] ?? date('Y-m-d H:i:s')
    ]);

    jsonResponse(['success' => true, 'id' => $data['id']]);
}

// Save config
function saveConfig($db, $data) {
    $sql = "INSERT INTO app_config (id, contact_info, payment_config, updated_at)
            VALUES (1, :contact_info, :payment_config, NOW())
            ON DUPLICATE KEY UPDATE
            contact_info = VALUES(contact_info),
            payment_config = VALUES(payment_config),
            updated_at = NOW()";

    $stmt = $db->prepare($sql);
    $stmt->execute([
        ':contact_info' => json_encode($data['contactInfo'] ?? null),
        ':payment_config' => json_encode($data['paymentConfig'] ?? null)
    ]);

    jsonResponse(['success' => true]);
}

// Sync all data at once
function syncAll($db, $data) {
    $result = ['users' => 0, 'packages' => 0, 'payments' => 0];

    // Sync users
    if (!empty($data['users'])) {
        foreach ($data['users'] as $user) {
            try {
                $sql = "INSERT INTO users (id, username, password, full_name, email, phone, role, status,
                        subscription_type, subscription_package, subscription_expiry, subscription_status,
                        activated_at, activated_by, created_at, updated_at)
                        VALUES (:id, :username, :password, :full_name, :email, :phone, :role, :status,
                        :subscription_type, :subscription_package, :subscription_expiry, :subscription_status,
                        :activated_at, :activated_by, :created_at, NOW())
                        ON DUPLICATE KEY UPDATE
                        password = VALUES(password),
                        full_name = VALUES(full_name),
                        status = VALUES(status),
                        subscription_type = VALUES(subscription_type),
                        subscription_package = VALUES(subscription_package),
                        subscription_expiry = VALUES(subscription_expiry),
                        subscription_status = VALUES(subscription_status),
                        updated_at = NOW()";

                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $user['id'] ?? null,
                    ':username' => $user['username'],
                    ':password' => $user['password'],
                    ':full_name' => $user['fullName'] ?? $user['full_name'] ?? '',
                    ':email' => $user['email'] ?? '',
                    ':phone' => $user['phone'] ?? '',
                    ':role' => $user['role'] ?? 'user',
                    ':status' => $user['status'] ?? 'active',
                    ':subscription_type' => $user['subscriptionType'] ?? $user['subscription_type'] ?? null,
                    ':subscription_package' => $user['subscriptionPackage'] ?? $user['subscription_package'] ?? null,
                    ':subscription_expiry' => $user['subscriptionExpiry'] ?? $user['subscription_expiry'] ?? null,
                    ':subscription_status' => $user['subscriptionStatus'] ?? $user['subscription_status'] ?? null,
                    ':activated_at' => $user['activatedAt'] ?? $user['activated_at'] ?? null,
                    ':activated_by' => $user['activatedBy'] ?? $user['activated_by'] ?? null,
                    ':created_at' => $user['createdAt'] ?? $user['created_at'] ?? date('Y-m-d H:i:s')
                ]);
                $result['users']++;
            } catch (Exception $e) {
                error_log("Sync user error: " . $e->getMessage());
            }
        }
    }

    // Sync packages
    if (!empty($data['packages'])) {
        foreach ($data['packages'] as $pkg) {
            try {
                $sql = "INSERT INTO packages (id, name, price, duration, features, active, created_at)
                        VALUES (:id, :name, :price, :duration, :features, :active, NOW())
                        ON DUPLICATE KEY UPDATE
                        name = VALUES(name), price = VALUES(price), duration = VALUES(duration),
                        features = VALUES(features), active = VALUES(active)";

                $stmt = $db->prepare($sql);
                $stmt->execute([
                    ':id' => $pkg['id'],
                    ':name' => $pkg['name'],
                    ':price' => $pkg['price'],
                    ':duration' => $pkg['duration'],
                    ':features' => json_encode($pkg['features'] ?? []),
                    ':active' => $pkg['active'] ? 1 : 0
                ]);
                $result['packages']++;
            } catch (Exception $e) {
                error_log("Sync package error: " . $e->getMessage());
            }
        }
    }

    // Sync config
    if (!empty($data['config'])) {
        saveConfig($db, $data['config']);
    }

    jsonResponse(['success' => true, 'synced' => $result]);
}
?>
