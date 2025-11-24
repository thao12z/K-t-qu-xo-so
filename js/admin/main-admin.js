// 🚀 MAIN ADMIN MODULE - CORE ORCHESTRATOR
// Version: 1.0.1 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';

    // ===== ADMIN CONFIGURATION =====
    // Production: Set window.ADMIN_CREDENTIALS before loading this script
    // Or use localStorage 'admin_credentials' for persistence
    const isProductionEnv = window.location.hostname !== 'localhost' &&
                            window.location.hostname !== '127.0.0.1';

    const getAdminConfig = () => {
        // Priority 1: Window config (set by server/deployment)
        if (window.ADMIN_CREDENTIALS) {
            console.log('🔐 Using server-provided admin credentials');
            return window.ADMIN_CREDENTIALS;
        }

        // Priority 2: Stored credentials (after first setup)
        const stored = localStorage.getItem('admin_credentials');
        if (stored) {
            try {
                const creds = JSON.parse(stored);
                console.log('🔐 Using stored admin credentials');
                return creds;
            } catch (e) {
                console.warn('Invalid stored credentials');
            }
        }

        // Priority 3: Block on production, allow defaults only on localhost
        if (isProductionEnv) {
            console.error('❌ PRODUCTION: Admin credentials not configured!');
            console.error('Set window.ADMIN_CREDENTIALS or use window.setAdminCredentials()');
            // Return blocked credentials that won't work
            return {
                username: '__CREDENTIALS_NOT_SET__',
                password: '__CHANGE_IN_PRODUCTION__',
                email: '',
                fullName: 'Not Configured',
                phone: '',
                blocked: true
            };
        }

        // Development defaults (only on localhost)
        console.warn('⚠️ Using DEFAULT admin credentials - localhost only');
        return {
            username: 'admin',
            password: 'admin123',
            email: 'admin@lode.vn',
            fullName: 'Administrator',
            phone: ''
        };
    };

    const ADMIN_CONFIG = getAdminConfig();

    // Function to update admin credentials at runtime
    window.setAdminCredentials = (credentials) => {
        localStorage.setItem('admin_credentials', JSON.stringify(credentials));
        console.log('🔐 Admin credentials updated - reload page to apply');
    };

    const { useState, useEffect, useCallback, memo } = React;
    
    // ===== DASHBOARD COMPONENT =====
    const Dashboard = memo(() => {
        const [users, setUsers] = useState([]);
        const [payments, setPayments] = useState([]);
        const [packages, setPackages] = useState([]);
        const [notifications, setNotifications] = useState([]);
        const [loading, setLoading] = useState(true);
        
        // Subscribe to global state
        useEffect(() => {
            if (!window.GlobalStateManager) return;
            
            console.log('🔄 [Dashboard] COMPONENT_MOUNT');
            
            // Load initial data
            setUsers(window.GlobalStateManager.getData('users'));
            setPayments(window.GlobalStateManager.getData('payments'));
            setPackages(window.GlobalStateManager.getData('packages'));
            setNotifications(window.GlobalStateManager.getData('notifications'));
            setLoading(false);
            
            // Subscribe to changes
            const unsubscribeUsers = window.GlobalStateManager.subscribe('users', setUsers, 'Dashboard');
            const unsubscribePayments = window.GlobalStateManager.subscribe('payments', setPayments, 'Dashboard');
            const unsubscribePackages = window.GlobalStateManager.subscribe('packages', setPackages, 'Dashboard');
            const unsubscribeNotifications = window.GlobalStateManager.subscribe('notifications', setNotifications, 'Dashboard');
            
            return () => {
                unsubscribeUsers();
                unsubscribePayments();
                unsubscribePackages();
                unsubscribeNotifications();
                console.log('🔄 [Dashboard] COMPONENT_UNMOUNT');
            };
        }, []);
        
        // Calculate stats
        const stats = useCallback(() => {
            const activeUsers = users.filter(u => u.status === 'active').length;
            const completedPayments = payments.filter(p => p.status === 'completed');
            const totalRevenue = completedPayments.reduce((sum, p) => sum + p.amount, 0);
            const pendingPayments = payments.filter(p => p.status === 'pending').length;
            
            return {
                totalUsers: users.length,
                activeUsers,
                totalRevenue,
                pendingPayments
            };
        }, [users, payments]);
        
        // Format currency
        const formatCurrency = useCallback((amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        }, []);
        
        if (loading) {
            return <window.LoadingSpinner size="large" message="Loading dashboard..." />;
        }
        
        const currentStats = stats();
        
        return (
            <div className="space-y-6">
                <h1 className="text-2xl font-bold">📊 Dashboard</h1>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <window.Card padding="medium">
                        <div className="flex items-center">
                            <span className="text-3xl">👥</span>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#7B7B7B]">Total Users</p>
                                <p className="text-2xl font-bold text-[#121212]">{currentStats.totalUsers}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="medium">
                        <div className="flex items-center">
                            <span className="text-3xl">✅</span>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#7B7B7B]">Active Users</p>
                                <p className="text-2xl font-bold text-[#10B981]">{currentStats.activeUsers}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="medium">
                        <div className="flex items-center">
                            <span className="text-3xl">💰</span>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#7B7B7B]">Revenue</p>
                                <p className="text-2xl font-bold text-[#10B981]">
                                    {formatCurrency(currentStats.totalRevenue)}
                                </p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="medium">
                        <div className="flex items-center">
                            <span className="text-3xl">⏳</span>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-[#7B7B7B]">Pending Payments</p>
                                <p className="text-2xl font-bold text-[#F59E0B]">{currentStats.pendingPayments}</p>
                            </div>
                        </div>
                    </window.Card>
                </div>
                
                {/* Recent Activities */}
                <window.Card title="Recent Activities">
                    {notifications.length > 0 ? (
                        <div className="space-y-3">
                            {notifications.slice(0, 5).map((notification) => (
                                <div
                                    key={notification.id}
                                    className="flex items-start space-x-3 p-3 rounded-lg bg-[#F8F7F7]"
                                >
                                    <div className="flex-shrink-0">
                                        {notification.type === 'success' && <span className="text-[#10B981]">✅</span>}
                                        {notification.type === 'error' && <span className="text-[#FE5938]">❌</span>}
                                        {notification.type === 'warning' && <span className="text-[#F59E0B]">⚠️</span>}
                                        {notification.type === 'info' && <span className="text-[#E36323]">ℹ️</span>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-[#121212]">{notification.message}</p>
                                        <p className="text-xs text-[#7B7B7B]">
                                            {new Date(notification.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-[#7B7B7B] text-center py-4">No recent activities</p>
                    )}
                </window.Card>
            </div>
        );
    });

    // ===== DATA EXPORT/IMPORT COMPONENT =====
    const DataExportImport = memo(() => {
        const [isExporting, setIsExporting] = useState(false);
        const [isImporting, setIsImporting] = useState(false);
        const [importResult, setImportResult] = useState(null);
        const [lastExport, setLastExport] = useState(null);

        // Firebase config state
        const [firebaseConfig, setFirebaseConfig] = useState({
            apiKey: '',
            authDomain: '',
            databaseURL: '',
            projectId: '',
            storageBucket: '',
            messagingSenderId: '',
            appId: ''
        });
        const [firebaseEnabled, setFirebaseEnabled] = useState(false);
        const [firebaseSyncing, setFirebaseSyncing] = useState(false);

        // Load last export info and Firebase config
        useEffect(() => {
            const lastExportInfo = localStorage.getItem('lastDataExport');
            if (lastExportInfo) {
                setLastExport(JSON.parse(lastExportInfo));
            }

            // Load Firebase config
            const savedFirebaseConfig = localStorage.getItem('firebase_config');
            if (savedFirebaseConfig) {
                try {
                    const config = JSON.parse(savedFirebaseConfig);
                    setFirebaseConfig(config);
                    setFirebaseEnabled(true);
                } catch (e) {
                    console.error('Invalid Firebase config:', e);
                }
            }
        }, []);

        // Save Firebase config
        const handleSaveFirebaseConfig = useCallback(async () => {
            if (!firebaseConfig.databaseURL) {
                window.GlobalStateManager?.addNotification(
                    '❌ Vui lòng nhập Database URL',
                    'error',
                    'Firebase'
                );
                return;
            }

            try {
                localStorage.setItem('firebase_config', JSON.stringify(firebaseConfig));

                // Initialize Firebase
                if (window.FirebaseSyncService) {
                    const success = await window.FirebaseSyncService.init(firebaseConfig);
                    if (success) {
                        setFirebaseEnabled(true);
                        window.GlobalStateManager?.addNotification(
                            '✅ Firebase đã được kết nối thành công!',
                            'success',
                            'Firebase'
                        );
                    } else {
                        throw new Error('Failed to initialize Firebase');
                    }
                }
            } catch (error) {
                window.GlobalStateManager?.addNotification(
                    `❌ Lỗi kết nối Firebase: ${error.message}`,
                    'error',
                    'Firebase'
                );
            }
        }, [firebaseConfig]);

        // Sync to Firebase
        const handleFirebaseSync = useCallback(async () => {
            if (!window.FirebaseSyncService?.isEnabled) {
                window.GlobalStateManager?.addNotification(
                    '❌ Firebase chưa được cấu hình',
                    'error',
                    'Firebase'
                );
                return;
            }

            setFirebaseSyncing(true);
            try {
                await window.FirebaseSyncService.syncToCloud();
                window.GlobalStateManager?.addNotification(
                    '✅ Đã sync dữ liệu lên Firebase thành công!',
                    'success',
                    'Firebase'
                );
            } catch (error) {
                window.GlobalStateManager?.addNotification(
                    `❌ Sync thất bại: ${error.message}`,
                    'error',
                    'Firebase'
                );
            } finally {
                setFirebaseSyncing(false);
            }
        }, []);

        // Export all admin data to JSON file
        const handleExport = useCallback(() => {
            setIsExporting(true);
            try {
                // Collect all admin data from localStorage
                const exportData = {
                    version: '1.0',
                    exportedAt: new Date().toISOString(),
                    exportedFrom: window.location.hostname,

                    // Core data
                    users: window.GlobalStateManager?.getData('users') || [],
                    packages: window.GlobalStateManager?.getData('packages') || [],
                    payments: window.GlobalStateManager?.getData('payments') || [],
                    notifications: window.GlobalStateManager?.getData('notifications') || [],

                    // localStorage data
                    admin_users: JSON.parse(localStorage.getItem('admin_users') || '[]'),
                    adminUsers: JSON.parse(localStorage.getItem('adminUsers') || '[]'),
                    adminPackages: JSON.parse(localStorage.getItem('adminPackages') || '[]'),
                    adminPayments: JSON.parse(localStorage.getItem('adminPayments') || '[]'),
                    adminNotifications: JSON.parse(localStorage.getItem('adminNotifications') || '[]'),
                    registeredUsers: JSON.parse(localStorage.getItem('registeredUsers') || '[]'),
                    syncedDemoAccounts: JSON.parse(localStorage.getItem('syncedDemoAccounts') || '[]'),
                    userPackages: JSON.parse(localStorage.getItem('userPackages') || '[]'),

                    // Config data
                    adminContactInfo: JSON.parse(localStorage.getItem('adminContactInfo') || 'null'),
                    admin_paymentConfig: JSON.parse(localStorage.getItem('admin_paymentConfig') || 'null'),
                    admin_credentials: JSON.parse(localStorage.getItem('admin_credentials') || 'null'),

                    // Auto payment verifier data
                    autoPaymentVerifier_history: JSON.parse(localStorage.getItem('autoPaymentVerifier_history') || '[]'),
                    autoPaymentVerifier_lastCheck: localStorage.getItem('autoPaymentVerifier_lastCheck') || null
                };

                // Create and download JSON file
                const jsonString = JSON.stringify(exportData, null, 2);
                const blob = new Blob([jsonString], { type: 'application/json' });
                const url = URL.createObjectURL(blob);

                const link = document.createElement('a');
                link.href = url;
                link.download = `lode-admin-backup-${new Date().toISOString().split('T')[0]}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                // Save export info
                const exportInfo = {
                    date: new Date().toISOString(),
                    userCount: exportData.users.length || exportData.admin_users.length,
                    packageCount: exportData.packages.length || exportData.adminPackages.length,
                    paymentCount: exportData.payments.length || exportData.adminPayments.length
                };
                localStorage.setItem('lastDataExport', JSON.stringify(exportInfo));
                setLastExport(exportInfo);

                window.GlobalStateManager?.addNotification(
                    `✅ Xuất dữ liệu thành công: ${exportInfo.userCount} users, ${exportInfo.packageCount} packages, ${exportInfo.paymentCount} payments`,
                    'success',
                    'DataExport'
                );

                console.log('📦 [DataExport] Export completed:', exportInfo);

            } catch (error) {
                console.error('❌ [DataExport] Export failed:', error);
                window.GlobalStateManager?.addNotification(
                    `❌ Xuất dữ liệu thất bại: ${error.message}`,
                    'error',
                    'DataExport'
                );
            } finally {
                setIsExporting(false);
            }
        }, []);

        // Import data from JSON file
        const handleImport = useCallback((event) => {
            const file = event.target.files[0];
            if (!file) return;

            setIsImporting(true);
            setImportResult(null);

            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importData = JSON.parse(e.target.result);

                    // Validate import data
                    if (!importData.version || !importData.exportedAt) {
                        throw new Error('File không hợp lệ - không phải file export từ hệ thống');
                    }

                    const result = {
                        success: true,
                        imported: {
                            users: 0,
                            packages: 0,
                            payments: 0,
                            configs: 0
                        },
                        warnings: []
                    };

                    // Import users - merge with existing
                    if (importData.admin_users?.length > 0 || importData.users?.length > 0) {
                        const importUsers = importData.admin_users?.length > 0 ? importData.admin_users : importData.users;
                        const existingUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');

                        // Merge: add new users, skip existing by username
                        const existingUsernames = new Set(existingUsers.map(u => u.username));
                        const newUsers = importUsers.filter(u => !existingUsernames.has(u.username));
                        const mergedUsers = [...existingUsers, ...newUsers];

                        localStorage.setItem('admin_users', JSON.stringify(mergedUsers));
                        localStorage.setItem('adminUsers', JSON.stringify(mergedUsers));
                        localStorage.setItem('registeredUsers', JSON.stringify(mergedUsers));

                        // Update GlobalStateManager
                        if (window.GlobalStateManager) {
                            window.GlobalStateManager.updateData('users', mergedUsers, 'DataImport');
                        }

                        result.imported.users = newUsers.length;
                        if (importUsers.length - newUsers.length > 0) {
                            result.warnings.push(`${importUsers.length - newUsers.length} users đã tồn tại, bỏ qua`);
                        }
                    }

                    // Import packages
                    if (importData.adminPackages?.length > 0 || importData.packages?.length > 0) {
                        const importPackages = importData.adminPackages?.length > 0 ? importData.adminPackages : importData.packages;
                        const existingPackages = JSON.parse(localStorage.getItem('adminPackages') || '[]');

                        const existingPackageIds = new Set(existingPackages.map(p => p.id));
                        const newPackages = importPackages.filter(p => !existingPackageIds.has(p.id));
                        const mergedPackages = [...existingPackages, ...newPackages];

                        localStorage.setItem('adminPackages', JSON.stringify(mergedPackages));

                        if (window.GlobalStateManager) {
                            window.GlobalStateManager.updateData('packages', mergedPackages, 'DataImport');
                        }

                        result.imported.packages = newPackages.length;
                    }

                    // Import payments
                    if (importData.adminPayments?.length > 0 || importData.payments?.length > 0) {
                        const importPayments = importData.adminPayments?.length > 0 ? importData.adminPayments : importData.payments;
                        const existingPayments = JSON.parse(localStorage.getItem('adminPayments') || '[]');

                        const existingPaymentIds = new Set(existingPayments.map(p => p.id));
                        const newPayments = importPayments.filter(p => !existingPaymentIds.has(p.id));
                        const mergedPayments = [...existingPayments, ...newPayments];

                        localStorage.setItem('adminPayments', JSON.stringify(mergedPayments));

                        if (window.GlobalStateManager) {
                            window.GlobalStateManager.updateData('payments', mergedPayments, 'DataImport');
                        }

                        result.imported.payments = newPayments.length;
                    }

                    // Import configs (overwrite)
                    if (importData.adminContactInfo) {
                        localStorage.setItem('adminContactInfo', JSON.stringify(importData.adminContactInfo));
                        result.imported.configs++;
                    }

                    if (importData.admin_paymentConfig) {
                        localStorage.setItem('admin_paymentConfig', JSON.stringify(importData.admin_paymentConfig));
                        result.imported.configs++;
                    }

                    setImportResult(result);

                    window.GlobalStateManager?.addNotification(
                        `✅ Import thành công: ${result.imported.users} users, ${result.imported.packages} packages, ${result.imported.payments} payments`,
                        'success',
                        'DataImport'
                    );

                    console.log('📥 [DataImport] Import completed:', result);

                } catch (error) {
                    console.error('❌ [DataImport] Import failed:', error);
                    setImportResult({
                        success: false,
                        error: error.message
                    });

                    window.GlobalStateManager?.addNotification(
                        `❌ Import thất bại: ${error.message}`,
                        'error',
                        'DataImport'
                    );
                } finally {
                    setIsImporting(false);
                    // Reset file input
                    event.target.value = '';
                }
            };

            reader.onerror = () => {
                setIsImporting(false);
                setImportResult({
                    success: false,
                    error: 'Không thể đọc file'
                });
            };

            reader.readAsText(file);
        }, []);

        // Get current data stats
        const currentStats = React.useMemo(() => {
            return {
                users: window.GlobalStateManager?.getData('users')?.length ||
                       JSON.parse(localStorage.getItem('admin_users') || '[]').length,
                packages: window.GlobalStateManager?.getData('packages')?.length ||
                         JSON.parse(localStorage.getItem('adminPackages') || '[]').length,
                payments: window.GlobalStateManager?.getData('payments')?.length ||
                         JSON.parse(localStorage.getItem('adminPayments') || '[]').length
            };
        }, []);

        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">📦 Export / Import Data</h1>
                </div>

                {/* Firebase Cloud Sync */}
                <window.Card title="🔥 Firebase Cloud Sync (Tự động)">
                    <div className="space-y-4">
                        <div className={`p-3 rounded-lg ${firebaseEnabled ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'}`}>
                            <p className={`text-sm ${firebaseEnabled ? 'text-green-800' : 'text-gray-600'}`}>
                                <strong>Trạng thái:</strong> {firebaseEnabled ? '✅ Đã kết nối' : '⚪ Chưa cấu hình'}
                            </p>
                            {firebaseEnabled && (
                                <p className="text-xs text-green-600 mt-1">
                                    Dữ liệu sẽ tự động sync khi admin tạo/sửa users
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Database URL *</label>
                                <window.Input
                                    value={firebaseConfig.databaseURL}
                                    onChange={(value) => setFirebaseConfig(prev => ({ ...prev, databaseURL: value }))}
                                    placeholder="https://your-project.firebaseio.com"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                                    <window.Input
                                        value={firebaseConfig.apiKey}
                                        onChange={(value) => setFirebaseConfig(prev => ({ ...prev, apiKey: value }))}
                                        placeholder="AIza..."
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Project ID</label>
                                    <window.Input
                                        value={firebaseConfig.projectId}
                                        onChange={(value) => setFirebaseConfig(prev => ({ ...prev, projectId: value }))}
                                        placeholder="your-project-id"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <window.Button
                                variant="primary"
                                onClick={handleSaveFirebaseConfig}
                            >
                                💾 Lưu & Kết nối
                            </window.Button>

                            {firebaseEnabled && (
                                <window.Button
                                    variant="secondary"
                                    onClick={handleFirebaseSync}
                                    disabled={firebaseSyncing}
                                >
                                    {firebaseSyncing ? '⏳ Đang sync...' : '🔄 Sync ngay'}
                                </window.Button>
                            )}
                        </div>

                        <div className="text-xs text-gray-500 border-t pt-2">
                            <strong>Hướng dẫn:</strong> Tạo project Firebase miễn phí tại{' '}
                            <a href="https://console.firebase.google.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                console.firebase.google.com
                            </a>
                            {' '}→ Realtime Database → Copy config
                        </div>
                    </div>
                </window.Card>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 text-sm">
                        <strong>Backup thủ công:</strong> Nếu không dùng Firebase, bạn có thể export/import file JSON thủ công bên dưới.
                    </p>
                </div>

                {/* Current Data Stats */}
                <window.Card title="📊 Dữ Liệu Hiện Tại">
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600">{currentStats.users}</p>
                            <p className="text-sm text-gray-600">Users</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-green-600">{currentStats.packages}</p>
                            <p className="text-sm text-gray-600">Packages</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-2xl font-bold text-purple-600">{currentStats.payments}</p>
                            <p className="text-sm text-gray-600">Payments</p>
                        </div>
                    </div>
                </window.Card>

                {/* Export Section */}
                <window.Card title="📤 Export Data">
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Xuất toàn bộ dữ liệu admin ra file JSON. File này có thể được import vào máy khác.
                        </p>

                        {lastExport && (
                            <div className="bg-gray-50 p-3 rounded text-sm">
                                <p className="text-gray-600">
                                    <strong>Lần export cuối:</strong> {new Date(lastExport.date).toLocaleString('vi-VN')}
                                </p>
                                <p className="text-gray-500">
                                    {lastExport.userCount} users, {lastExport.packageCount} packages, {lastExport.paymentCount} payments
                                </p>
                            </div>
                        )}

                        <window.Button
                            variant="primary"
                            onClick={handleExport}
                            disabled={isExporting}
                            className="w-full sm:w-auto"
                        >
                            {isExporting ? '⏳ Đang xuất...' : '📥 Download Backup File'}
                        </window.Button>
                    </div>
                </window.Card>

                {/* Import Section */}
                <window.Card title="📥 Import Data">
                    <div className="space-y-4">
                        <p className="text-gray-600">
                            Import dữ liệu từ file JSON backup. Dữ liệu mới sẽ được merge với dữ liệu hiện tại
                            (users trùng username sẽ bị bỏ qua).
                        </p>

                        <div className="flex items-center justify-center w-full">
                            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                    <svg className="w-8 h-8 mb-3 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <p className="mb-2 text-sm text-gray-500">
                                        <span className="font-semibold">Click để chọn file</span> hoặc kéo thả vào đây
                                    </p>
                                    <p className="text-xs text-gray-500">JSON file (lode-admin-backup-*.json)</p>
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept=".json"
                                    onChange={handleImport}
                                    disabled={isImporting}
                                />
                            </label>
                        </div>

                        {isImporting && (
                            <div className="text-center py-4">
                                <window.LoadingSpinner size="medium" message="Đang import dữ liệu..." />
                            </div>
                        )}

                        {importResult && (
                            <div className={`p-4 rounded-lg ${importResult.success ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
                                {importResult.success ? (
                                    <div>
                                        <p className="font-semibold text-green-800 mb-2">✅ Import thành công!</p>
                                        <ul className="text-sm text-green-700 space-y-1">
                                            <li>• {importResult.imported.users} users mới</li>
                                            <li>• {importResult.imported.packages} packages mới</li>
                                            <li>• {importResult.imported.payments} payments mới</li>
                                            {importResult.imported.configs > 0 && (
                                                <li>• {importResult.imported.configs} configs cập nhật</li>
                                            )}
                                        </ul>
                                        {importResult.warnings?.length > 0 && (
                                            <div className="mt-2 text-yellow-700">
                                                <p className="font-medium">Cảnh báo:</p>
                                                <ul className="text-sm">
                                                    {importResult.warnings.map((w, i) => (
                                                        <li key={i}>• {w}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div>
                                        <p className="font-semibold text-red-800">❌ Import thất bại</p>
                                        <p className="text-sm text-red-700">{importResult.error}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </window.Card>

                {/* Instructions */}
                <window.Card title="📋 Hướng Dẫn Sử Dụng">
                    <div className="space-y-4 text-sm text-gray-600">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                            <p className="font-semibold text-green-800 mb-2">🌐 Cách 1: Publish lên Server (Khuyến nghị)</p>
                            <p className="text-green-700 mb-2">User ở máy khác sẽ tự động nhận data khi truy cập hệ thống</p>
                            <ol className="list-decimal list-inside space-y-1 text-green-700">
                                <li>Click "Download Backup File" để tải file JSON</li>
                                <li>Đổi tên file thành <code className="bg-green-100 px-1 rounded">admin-data.json</code></li>
                                <li>Copy file vào thư mục <code className="bg-green-100 px-1 rounded">/data/</code> trên server</li>
                                <li>Users ở các thiết bị khác sẽ tự động sync khi mở trang</li>
                            </ol>
                        </div>

                        <div className="border-t pt-3">
                            <p className="font-semibold text-gray-800 mb-2">📁 Cách 2: Import thủ công</p>
                            <div className="space-y-1">
                                <div className="flex items-start gap-2">
                                    <span className="font-bold text-[#E36323]">1.</span>
                                    <p>Download file JSON từ máy có dữ liệu</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold text-[#E36323]">2.</span>
                                    <p>Copy file sang máy khác (USB, email, cloud...)</p>
                                </div>
                                <div className="flex items-start gap-2">
                                    <span className="font-bold text-[#E36323]">3.</span>
                                    <p>Vào trang này trên máy đó → Import file JSON</p>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-gray-500 border-t pt-2">
                            <strong>Lưu ý:</strong> Users trùng username sẽ không bị ghi đè. Server sync URL: <code>/data/admin-data.json</code>
                        </div>
                    </div>
                </window.Card>
            </div>
        );
    });

    // ===== CONTACT SETTINGS COMPONENT =====
    const ContactSettings = memo(() => {
        const [contactInfo, setContactInfo] = useState({
            methods: ["Zalo", "Telegram", "Hotline"],
            zalo_number: "0123.456.789",
            telegram_username: "@admin_lode_b2b",
            hotline: "1900.1234",
            working_hours: "8:00 - 22:00 (Thứ 2 - Chủ Nhật)",
            payment_methods: ["Chuyển khoản", "Tiền mặt"],
            notes: [
                "Tất cả giao dịch mua/gia hạn qua Admin",
                "Thanh toán trước, kích hoạt ngay",
                "Hỗ trợ kỹ thuật 24/7 cho gói Enterprise",
                "Có thể tùy chỉnh gói theo yêu cầu"
            ],
            purchase_steps: [
                { step: 1, title: 'Chọn Gói', desc: 'Chọn gói phù hợp với nhu cầu', icon: '🎯' },
                { step: 2, title: 'Liên Hệ', desc: 'Liên hệ Admin qua Zalo/Telegram', icon: '📞' },
                { step: 3, title: 'Xác Nhận', desc: 'Admin xác nhận và báo giá', icon: '✅' },
                { step: 4, title: 'Thanh Toán', desc: 'Thanh toán theo hướng dẫn', icon: '💰' },
                { step: 5, title: 'Kích Hoạt', desc: 'Nhận tài khoản và sử dụng', icon: '🚀' }
            ]
        });
        const [isSaving, setIsSaving] = useState(false);
        const [newPaymentMethod, setNewPaymentMethod] = useState('');
        const [newNote, setNewNote] = useState('');

        // Load saved contact info
        useEffect(() => {
            const savedInfo = localStorage.getItem('adminContactInfo');
            if (savedInfo) {
                try {
                    setContactInfo(JSON.parse(savedInfo));
                } catch (e) {
                    console.error('Error loading contact info:', e);
                }
            }
        }, []);

        // Save contact info
        const handleSave = useCallback(() => {
            setIsSaving(true);
            try {
                if (window.SharedDataService && window.SharedDataService.saveContactInfo) {
                    window.SharedDataService.saveContactInfo(contactInfo);
                } else {
                    localStorage.setItem('adminContactInfo', JSON.stringify(contactInfo));
                }

                window.GlobalStateManager?.addNotification(
                    '✅ Contact settings saved successfully',
                    'success',
                    'ContactSettings'
                );
            } catch (error) {
                window.GlobalStateManager?.addNotification(
                    '❌ Failed to save contact settings',
                    'error',
                    'ContactSettings'
                );
            } finally {
                setIsSaving(false);
            }
        }, [contactInfo]);

        // Add payment method
        const addPaymentMethod = useCallback(() => {
            if (newPaymentMethod.trim()) {
                setContactInfo(prev => ({
                    ...prev,
                    payment_methods: [...prev.payment_methods, newPaymentMethod.trim()]
                }));
                setNewPaymentMethod('');
            }
        }, [newPaymentMethod]);

        // Remove payment method
        const removePaymentMethod = useCallback((index) => {
            setContactInfo(prev => ({
                ...prev,
                payment_methods: prev.payment_methods.filter((_, i) => i !== index)
            }));
        }, []);

        // Add note
        const addNote = useCallback(() => {
            if (newNote.trim()) {
                setContactInfo(prev => ({
                    ...prev,
                    notes: [...prev.notes, newNote.trim()]
                }));
                setNewNote('');
            }
        }, [newNote]);

        // Remove note
        const removeNote = useCallback((index) => {
            setContactInfo(prev => ({
                ...prev,
                notes: prev.notes.filter((_, i) => i !== index)
            }));
        }, []);

        // Update purchase step
        const updatePurchaseStep = useCallback((index, field, value) => {
            setContactInfo(prev => ({
                ...prev,
                purchase_steps: prev.purchase_steps.map((step, i) =>
                    i === index ? { ...step, [field]: value } : step
                )
            }));
        }, []);

        return (
            <div className="space-y-6 p-6">
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">📞 Contact Settings</h1>
                    <window.Button
                        variant="primary"
                        onClick={handleSave}
                        disabled={isSaving}
                    >
                        {isSaving ? 'Saving...' : '💾 Save Changes'}
                    </window.Button>
                </div>

                {/* Contact Information */}
                <window.Card>
                    <h2 className="text-lg font-semibold mb-4">📱 Thông Tin Liên Hệ</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-[#121212] mb-1">Zalo</label>
                            <window.Input
                                value={contactInfo.zalo_number}
                                onChange={(value) => setContactInfo(prev => ({ ...prev, zalo_number: value }))}
                                placeholder="0123.456.789"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121212] mb-1">Telegram</label>
                            <window.Input
                                value={contactInfo.telegram_username}
                                onChange={(value) => setContactInfo(prev => ({ ...prev, telegram_username: value }))}
                                placeholder="@username"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121212] mb-1">Hotline</label>
                            <window.Input
                                value={contactInfo.hotline}
                                onChange={(value) => setContactInfo(prev => ({ ...prev, hotline: value }))}
                                placeholder="1900.1234"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[#121212] mb-1">Giờ Làm Việc</label>
                            <window.Input
                                value={contactInfo.working_hours}
                                onChange={(value) => setContactInfo(prev => ({ ...prev, working_hours: value }))}
                                placeholder="8:00 - 22:00"
                            />
                        </div>
                    </div>
                </window.Card>

                {/* Payment Methods */}
                <window.Card>
                    <h2 className="text-lg font-semibold mb-4">💳 Phương Thức Thanh Toán</h2>
                    <div className="space-y-2 mb-4">
                        {contactInfo.payment_methods.map((method, index) => (
                            <div key={index} className="flex items-center justify-between bg-[#F8F7F7] p-2 rounded">
                                <span>{method}</span>
                                <button
                                    type="button"
                                    onClick={() => removePaymentMethod(index)}
                                    className="text-[#FE5938] hover:text-[#E54A2A]"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <window.Input
                            value={newPaymentMethod}
                            onChange={setNewPaymentMethod}
                            placeholder="Thêm phương thức thanh toán"
                            className="flex-1"
                        />
                        <window.Button type="button" variant="secondary" onClick={addPaymentMethod}>
                            ➕ Thêm
                        </window.Button>
                    </div>
                </window.Card>

                {/* Important Notes */}
                <window.Card>
                    <h2 className="text-lg font-semibold mb-4">⚠️ Lưu Ý Quan Trọng</h2>
                    <div className="space-y-2 mb-4">
                        {contactInfo.notes.map((note, index) => (
                            <div key={index} className="flex items-center justify-between bg-[#FFF9E6] p-2 rounded">
                                <span className="text-sm">{note}</span>
                                <button
                                    type="button"
                                    onClick={() => removeNote(index)}
                                    className="text-[#FE5938] hover:text-[#E54A2A]"
                                >
                                    🗑️
                                </button>
                            </div>
                        ))}
                    </div>
                    <div className="flex space-x-2">
                        <window.Input
                            value={newNote}
                            onChange={setNewNote}
                            placeholder="Thêm lưu ý"
                            className="flex-1"
                        />
                        <window.Button type="button" variant="secondary" onClick={addNote}>
                            ➕ Thêm
                        </window.Button>
                    </div>
                </window.Card>

                {/* Purchase Steps */}
                <window.Card>
                    <h2 className="text-lg font-semibold mb-4">📋 Quy Trình Mua Gói</h2>
                    <div className="space-y-4">
                        {contactInfo.purchase_steps.map((step, index) => (
                            <div key={index} className="bg-[#FFF3EE] p-4 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="text-2xl">{step.icon}</span>
                                    <span className="font-bold">Bước {step.step}</span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                    <window.Input
                                        value={step.icon}
                                        onChange={(value) => updatePurchaseStep(index, 'icon', value)}
                                        placeholder="Icon"
                                    />
                                    <window.Input
                                        value={step.title}
                                        onChange={(value) => updatePurchaseStep(index, 'title', value)}
                                        placeholder="Title"
                                    />
                                    <window.Input
                                        value={step.desc}
                                        onChange={(value) => updatePurchaseStep(index, 'desc', value)}
                                        placeholder="Description"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </window.Card>
            </div>
        );
    });

    // ===== LOGIN COMPONENT =====
    const LoginForm = memo(({ onLogin }) => {
        const [credentials, setCredentials] = useState({ username: '', password: '' });
        const [errors, setErrors] = useState({});
        const [isLoading, setIsLoading] = useState(false);
        
        // Handle form submission
        const handleSubmit = useCallback(async (e) => {
            e.preventDefault();
            
            // Basic validation
            const newErrors = {};
            if (!credentials.username) newErrors.username = 'Username is required';
            if (!credentials.password) newErrors.password = 'Password is required';
            
            if (Object.keys(newErrors).length > 0) {
                setErrors(newErrors);
                return;
            }
            
            setIsLoading(true);
            setErrors({});
            
            try {
                // Simulate login (in real app, this would be an API call)
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Check if credentials are blocked (production without config)
                if (ADMIN_CONFIG.blocked) {
                    setErrors({ general: 'Admin credentials not configured. Run window.setAdminCredentials({username, password, ...}) in console.' });
                    window.GlobalStateManager.addNotification(
                        '❌ Credentials not configured for production',
                        'error',
                        'Authentication'
                    );
                } else if (credentials.username === ADMIN_CONFIG.username && credentials.password === ADMIN_CONFIG.password) {
                    window.GlobalStateManager.addNotification(
                        '✅ Login successful',
                        'success',
                        'Authentication'
                    );
                    onLogin({ username: credentials.username, role: 'admin' });
                } else {
                    setErrors({ general: 'Invalid username or password' });
                    window.GlobalStateManager.addNotification(
                        '❌ Login failed',
                        'error',
                        'Authentication'
                    );
                }
            } catch (error) {
                setErrors({ general: 'Login failed. Please try again.' });
            } finally {
                setIsLoading(false);
            }
        }, [credentials, onLogin]);
        
        // Handle input changes
        const handleInputChange = useCallback((field, value) => {
            setCredentials(prev => ({ ...prev, [field]: value }));
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: null }));
            }
        }, [errors]);
        
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#F8F7F7] py-12 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-[#E36323] rounded-full flex items-center justify-center mb-4">
                            <span className="text-white text-2xl font-bold">A</span>
                        </div>
                        <h2 className="text-3xl font-bold text-[#121212]">Admin System</h2>
                        <p className="text-[#7B7B7B] mt-2">Please sign in to continue</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.general && (
                            <div className="bg-[#FFF5F5] border border-[#FE5938]/20 rounded-md p-4">
                                <p className="text-[#FE5938] text-sm">{errors.general}</p>
                            </div>
                        )}
                        
                        <window.Input
                            label="Username"
                            placeholder="Enter username"
                            value={credentials.username}
                            onChange={(value) => handleInputChange('username', value)}
                            error={errors.username}
                            required
                        />
                        
                        <window.Input
                            label="Password"
                            type="password"
                            placeholder="Enter password"
                            value={credentials.password}
                            onChange={(value) => handleInputChange('password', value)}
                            error={errors.password}
                            required
                        />
                        
                        <window.Button
                            type="submit"
                            variant="primary"
                            loading={isLoading}
                            className="w-full"
                        >
                            Sign In
                        </window.Button>
                        
                        <div className="text-center">
                            <p className="text-xs text-[#7B7B7B]">
                                Hệ thống quản trị đối soát lô đề
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        );
    });
    
    // ===== MAIN ADMIN SYSTEM =====
    const MainAdminSystem = memo(() => {
        const [isAuthenticated, setIsAuthenticated] = useState(false);
        const [currentPage, setCurrentPage] = useState('dashboard');
        const [user, setUser] = useState(null);
        const [sidebarOpen, setSidebarOpen] = useState(false);
        
        // PRODUCTION MODE - NO SAMPLE DATA
        useEffect(() => {
            if (!window.GlobalStateManager) return;
            
            console.log('✅ [MainAdminSystem] Production mode - No sample data');
            
            // Only initialize admin user if no users exist
            const existingUsers = window.GlobalStateManager.getData('users');
            if (existingUsers.length === 0) {
                // Create only admin user - NO SAMPLE DATA
                const adminUser = {
                    id: 1,
                    username: ADMIN_CONFIG.username,
                    email: ADMIN_CONFIG.email,
                    fullName: ADMIN_CONFIG.fullName,
                    phone: ADMIN_CONFIG.phone,
                    password: ADMIN_CONFIG.password,
                    role: 'admin',
                    accountType: 'admin',
                    status: 'active',
                    hasAdminAccess: true,
                    subscriptionType: null,
                    subscriptionPackage: null,
                    subscriptionExpiry: null,
                    subscriptionStatus: null,
                    createdAt: '2024-01-01',
                    createdBy: 'system',
                    lastLogin: null,
                    activatedAt: '2024-01-01',
                    activatedBy: 'system'
                };
                
                // Initialize only admin user
                window.GlobalStateManager.updateData('users', [adminUser], 'MainAdminSystem_Init');
                
                console.log('✅ [MainAdminSystem] Admin user initialized - No sample data');
            }
        }, []);
        
        // Handle login
        const handleLogin = useCallback((userData) => {
            setUser(userData);
            setIsAuthenticated(true);
            console.log('🔄 [MainAdminSystem] USER_LOGGED_IN', { username: userData.username });
        }, []);
        
        // Handle logout
        const handleLogout = useCallback(() => {
            setUser(null);
            setIsAuthenticated(false);
            setCurrentPage('dashboard');
            window.GlobalStateManager.addNotification(
                '✅ Logged out successfully',
                'info',
                'Authentication'
            );
            console.log('🔄 [MainAdminSystem] USER_LOGGED_OUT');
        }, []);
        
        // Handle page navigation
        const handlePageChange = useCallback((page) => {
            setCurrentPage(page);
            setSidebarOpen(false); // Close mobile sidebar
            console.log('🔄 [MainAdminSystem] PAGE_CHANGED', { page });
        }, []);
        
        // Render current page content
        const renderPageContent = useCallback(() => {
            switch (currentPage) {
                case 'dashboard':
                    return <Dashboard />;
                case 'pending':
                    return window.PendingRequests ? 
                        <window.PendingRequests /> : 
                        <div className="p-6">Pending Requests module not loaded</div>;
                case 'users':
                    return window.UserManagement ? 
                        <window.UserManagement /> : 
                        <div className="p-6">User Management module not loaded</div>;
                case 'payments':
                    return window.PaymentManagement ? 
                        <window.PaymentManagement /> : 
                        <div className="p-6">Payment Management module not loaded</div>;
                case 'payment-config':
                    return window.PaymentConfig ?
                        <window.PaymentConfig /> :
                        <div className="p-6">Payment Config module not loaded</div>;
                case 'auto-verify':
                    return window.AutoPaymentVerifier ?
                        <window.AutoPaymentVerifier /> :
                        <div className="p-6">Auto Payment Verifier module not loaded</div>;
                case 'packages':
                    return window.PackageManagement ? 
                        <window.PackageManagement /> : 
                        <div className="p-6">Package Management module not loaded</div>;
                case 'notifications':
                    return window.NotificationSystem ?
                        <window.NotificationSystem /> :
                        <div className="p-6">Notification System module not loaded</div>;
                case 'contact-settings':
                    return <ContactSettings />;
                case 'data-export':
                    return <DataExportImport />;
                default:
                    return <Dashboard />;
            }
        }, [currentPage]);
        
        // SVG Icon components for sidebar
        const SidebarIcons = {
            dashboard: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
            pending: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
            users: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
            payments: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
            'payment-config': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
            'auto-verify': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
            packages: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
            'contact-settings': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>,
            'data-export': <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" /></svg>,
            notifications: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
        };

        // Menu items
        const menuItems = [
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'pending', label: 'Pending Requests' },
            { id: 'users', label: 'User Management' },
            { id: 'payments', label: 'Payment Management' },
            { id: 'auto-verify', label: 'Auto Verify' },
            { id: 'payment-config', label: 'Payment Settings' },
            { id: 'packages', label: 'Package Management' },
            { id: 'contact-settings', label: 'Contact Settings' },
            { id: 'data-export', label: 'Export/Import Data' },
            { id: 'notifications', label: 'Notifications' }
        ];
        
        // If not authenticated, show login form
        if (!isAuthenticated) {
            return <LoginForm onLogin={handleLogin} />;
        }
        
        // Main admin interface
        return (
            <div className="min-h-screen bg-[#F8F7F7] flex">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-[#121212] bg-opacity-50 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                
                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                    {/* Sidebar header */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-[#ECECEC]">
                        <h1 className="text-xl font-bold text-[#121212]">Admin System</h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-[#7B7B7B] hover:text-[#121212]"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {/* Navigation menu */}
                    <nav className="mt-6 px-3">
                        <div className="space-y-1">
                            {menuItems.map((item) => (
                                <button
                                    key={item.id}
                                    onClick={() => handlePageChange(item.id)}
                                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                        currentPage === item.id
                                            ? 'bg-[#FFF3EE] text-[#E36323] border-r-2 border-[#E36323]'
                                            : 'text-[#7B7B7B] hover:bg-[#F8F7F7] hover:text-[#121212]'
                                    }`}
                                >
                                    <span className="mr-3">{SidebarIcons[item.id]}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </nav>
                    
                    {/* User info & logout */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-[#ECECEC]">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-[#E36323] rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-[#121212]">{user?.username}</p>
                                    <p className="text-xs text-[#7B7B7B]">Administrator</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-[#7B7B7B] hover:text-red-500 rounded-md hover:bg-[#F8F7F7]"
                                title="Logout"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Main content */}
                <div className="lg:pl-64 flex-1">
                    {/* Top header */}
                    <div className="bg-white shadow-sm border-b border-[#ECECEC]">
                        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-[#7B7B7B] hover:text-[#121212]"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            
                            <div className="flex-1 flex items-center justify-center lg:justify-start">
                                <h2 className="text-lg font-semibold text-[#121212]">
                                    {menuItems.find(item => item.id === currentPage)?.label || 'Dashboard'}
                                </h2>
                            </div>
                        </div>
                    </div>
                    
                    {/* Page content */}
                    <main className="flex-1 p-6">
                        {renderPageContent()}
                    </main>
                </div>
            </div>
        );
    });
    
    // ===== TESTING FUNCTIONS =====
    const TestMainAdmin = {
        testComponentRender: () => {
            console.assert(window.MainAdminSystem, '❌ MainAdminSystem not exported');
            console.log('✅ [TEST] MainAdminSystem component exists');
        },
        
        testSystemIntegration: () => {
            // Test that all required components are available
            const requiredComponents = [
                'GlobalStateManager',
                'LoadingSpinner', 'Button', 'Modal', 'Input', 'Select', 'Badge', 'Card',
                'NotificationSystem',
                'UserManagement',
                'PaymentManagement'
            ];
            
            let missingComponents = [];
            requiredComponents.forEach(component => {
                if (!window[component]) {
                    missingComponents.push(component);
                }
            });
            
            if (missingComponents.length > 0) {
                console.warn('⚠️ [TEST] Missing components:', missingComponents);
            } else {
                console.log('✅ [TEST] All required components available');
            }
        }
    };
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.MainAdminSystem = MainAdminSystem;
    window.Dashboard = Dashboard;
    window.LoginForm = LoginForm;
    window.TestMainAdmin = TestMainAdmin;
    
    // Auto-run tests
    setTimeout(() => {
        TestMainAdmin.testComponentRender();
        TestMainAdmin.testSystemIntegration();
    }, 200);
    
    // ===== AUTO-MOUNT APPLICATION =====
    // This will mount the application after all modules are loaded
    setTimeout(() => {
        if (window.GlobalStateManager && document.getElementById('root')) {
            console.log('🎯 [MainAdmin] MOUNTING_APPLICATION');
            
            try {
                const container = document.getElementById('root');
                const root = ReactDOM.createRoot(container);
                root.render(React.createElement(MainAdminSystem));
                
                console.log('✅ [MainAdmin] APPLICATION_MOUNTED_SUCCESSFULLY');
                
                // Add welcome notification
                window.GlobalStateManager.addNotification(
                    '🚀 Admin system loaded successfully!',
                    'success',
                    'System'
                );
                
                // ✅ DEBUG COMMANDS - Only in development mode
                const isDevMode = window.DEBUG_MODE || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

                if (isDevMode) {
                    window.DEBUG_ADMIN_SYSTEM = {
                        // Check current users
                        checkUsers: () => {
                            const users = window.GlobalStateManager.getData('users');
                            console.log('👥 Current users:', users);
                            console.table(users);
                            return users;
                        },

                        // Create test user
                        createTestUser: (username = 'testuser', password = 'test123') => {
                            const newUser = {
                                id: window.GlobalStateManager.getNextUserId(),
                                username: username,
                                email: `${username}@test.com`,
                                fullName: `Test User ${username}`,
                                phone: '+1234567890',
                                password: password,
                                role: 'user',
                                accountType: 'user',
                                status: 'active',
                                hasAdminAccess: false,
                                subscriptionType: 'package_30_days',
                                subscriptionPackage: '30 Days Package',
                                subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                                subscriptionStatus: 'active',
                                createdAt: new Date().toISOString(),
                                createdBy: 'debug_tool',
                                lastLogin: null,
                                activatedAt: new Date().toISOString(),
                                activatedBy: 'debug_tool'
                            };

                            const currentUsers = window.GlobalStateManager.getData('users');
                            const updatedUsers = [...currentUsers, newUser];
                            window.GlobalStateManager.updateData('users', updatedUsers, 'DebugTool');

                            console.log('✅ Created test user:', newUser);
                            return newUser;
                        },

                        // Check localStorage keys
                        checkStorage: () => {
                            const keys = ['admin_users', 'adminUsers', 'registeredUsers'];
                            const result = {};
                            keys.forEach(key => {
                                const data = localStorage.getItem(key);
                                result[key] = data ? JSON.parse(data) : null;
                            });
                            console.table(result);
                            return result;
                        },

                        // Clear all user data
                        clearAllUsers: () => {
                            if (confirm('Are you sure you want to clear all user data?')) {
                                window.GlobalStateManager.updateData('users', [], 'DebugTool');
                                console.log('🧹 Cleared all user data');
                            }
                        }
                    };

                    console.log('🔧 Admin Debug commands available: window.DEBUG_ADMIN_SYSTEM');
                    console.log('- window.DEBUG_ADMIN_SYSTEM.checkUsers()');
                    console.log('- window.DEBUG_ADMIN_SYSTEM.createTestUser(username, password)');
                    console.log('- window.DEBUG_ADMIN_SYSTEM.checkStorage()');
                    console.log('- window.DEBUG_ADMIN_SYSTEM.clearAllUsers()');
                }
                
            } catch (error) {
                console.error('❌ [MainAdmin] MOUNT_ERROR', { error });
                
                // Show error in DOM
                document.getElementById('root').innerHTML = `
                    <div style="display: flex; justify-content: center; align-items: center; height: 100vh; background: #f3f4f6;">
                        <div style="text-align: center; background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                            <h2 style="color: #dc2626; margin-bottom: 1rem;">❌ Application Mount Error</h2>
                            <p style="color: #6b7280; margin-bottom: 1rem;">${error.message}</p>
                            <button onclick="window.location.reload()" style="background: #3b82f6; color: white; padding: 0.5rem 1rem; border: none; border-radius: 4px; cursor: pointer;">
                                Reload Page
                            </button>
                        </div>
                    </div>
                `;
            }
        } else {
            console.error('❌ [MainAdmin] MOUNT_REQUIREMENTS_NOT_MET', {
                hasGlobalStateManager: !!window.GlobalStateManager,
                hasRootElement: !!document.getElementById('root')
            });
        }
    }, 300); // Delay to ensure all modules are loaded
    
})(); 