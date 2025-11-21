/**
 * Authentication System - Login Page theo Rule
 * Xác thực & kiểm tra gói dịch vụ
 */
(function() {
    'use strict';

    console.log('🔐 Authentication System v1.3.0 - Rule Compliant');

    const DEMO_ACCOUNTS_FOR_DISPLAY = { // Renamed for clarity, not used for auth
        admin: { username: "admin", password: "123456", package: "enterprise", status: "active", package_status: "active", package_start: "2024-01-01", package_end: "2024-12-31" },
        user1: { username: "user1", password: "123456", package: "basic", status: "active", package_status: "active", package_start: "2024-01-01", package_end: "2024-12-31" },
        demo: { username: "demo", password: "demo", package: null, status: "no_package", package_status: "no_package", package_start: null, package_end: null }
    };

    const LoginPage = React.memo(function LoginPage({ onLogin, onNavigate }) {
        console.log('🔄 Rendering LoginPage...');

        const [username, setUsername] = React.useState('');
        const [password, setPassword] = React.useState('');
        const [isLoading, setIsLoading] = React.useState(false);
        const [error, setError] = React.useState('');

        const handleLogin = React.useCallback(async () => {
            if (!username.trim() || !password.trim()) {
                setError('Vui lòng nhập đầy đủ thông tin');
                return;
            }
            setIsLoading(true);
            setError('');

            try {
                await new Promise(resolve => setTimeout(resolve, 1000));

                console.log('🔐 [LoginPage] Starting login process for:', username);

                // Try to get users from SharedDataService (synced from admin)
                let usersFromAdmin = {};
                if (window.SharedDataService) {
                    usersFromAdmin = window.SharedDataService.syncUsersFromAdmin(); // Ensure latest sync
                    console.log('📡 [LoginPage] Users from SharedDataService:', Object.keys(usersFromAdmin));
                }

                // Fallback to direct localStorage read if SharedDataService didn't provide
                if (Object.keys(usersFromAdmin).length === 0) {
                    console.log('⚠️ [LoginPage] No users from SharedDataService, trying localStorage...');
                    const registeredUsersData = localStorage.getItem('registeredUsers') || localStorage.getItem('adminUsers') || localStorage.getItem('admin_users');
                    if (registeredUsersData) {
                        const users = JSON.parse(registeredUsersData);
                        console.log('📦 [LoginPage] Users from localStorage:', users.length);
                        users.forEach(u => {
                            usersFromAdmin[u.username] = u; // Index by username for easy lookup
                        });
                    }
                }

                console.log('🔍 [LoginPage] Available users:', Object.keys(usersFromAdmin));
                const user = usersFromAdmin[username];
                
                if (!user) {
                    console.log('❌ [LoginPage] User not found:', username);
                    setError('Tên đăng nhập hoặc mật khẩu không đúng.');
                    return;
                }

                console.log('✅ [LoginPage] User found:', {
                    username: user.username,
                    password: user.password ? '***' : 'NO_PASSWORD',
                    inputPassword: password ? '***' : 'NO_INPUT',
                    status: user.status,
                    subscriptionStatus: user.subscriptionStatus
                });

                if (user.password !== password) { // Basic password check, should be hashed in production
                    console.log('❌ [LoginPage] Password mismatch for user:', username);
                    setError('Tên đăng nhập hoặc mật khẩu không đúng.');
                    return;
                }

                // Standardize user object and calculate package_status
                const processedUser = AuthService.processUserForLogin(user);
                if (processedUser.package_status === 'expired') {
                    console.log('⚠️ [LoginPage] User package expired:', username);
                    setError('Gói dịch vụ đã hết hạn. Vui lòng gia hạn.');
                    return;
                }

                console.log('✅ [LoginPage] Login successful:', processedUser);
                onLogin(processedUser);

            } catch (error) {
                console.error('❌ [LoginPage] Login error:', error);
                setError('Có lỗi xảy ra. Vui lòng thử lại.');
            } finally {
                setIsLoading(false);
            }
        }, [username, password, onLogin]);

        const handleKeyPress = React.useCallback((e) => {
            if (e.key === 'Enter') {
                handleLogin();
            }
        }, [handleLogin]);

        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">🔐 Đăng Nhập</h2>
                        <p className="text-gray-600">Hệ thống đối soát lô đề đại lý</p>
                    </div>

                    <div className="bg-white rounded-lg shadow-xl p-8">
                        <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">Tên đăng nhập</label>
                                <input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} onKeyPress={handleKeyPress} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nhập tên đăng nhập" disabled={isLoading}/>
                            </div>
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Mật khẩu</label>
                                <input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyPress={handleKeyPress} className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nhập mật khẩu" disabled={isLoading}/>
                            </div>
                            {error && (<div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">{error}</div>)}
                            <button type="submit" disabled={isLoading} className={`w-full py-2 px-4 rounded-md font-medium ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                                {isLoading ? (<><div className="loading-spinner inline-block w-4 h-4 mr-2"></div>Đang đăng nhập...</>) : ('Đăng Nhập')}
                            </button>
                        </form>
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="text-sm font-medium text-gray-700 mb-2">📋 Tài khoản demo (chỉ để tham khảo):</h3>
                            <div className="space-y-1 text-xs text-gray-600">
                                <div>• admin / 123456 (Enterprise - Active)</div>
                                <div>• user1 / 123456 (Basic - Active)</div>
                                <div>• demo / demo (No Package)</div>
                            </div>
                        </div>
                        <div className="mt-4 text-center">
                            <button onClick={() => onNavigate('landing')} className="text-blue-600 hover:text-blue-800 text-sm">← Quay lại trang chủ</button>
                        </div>
                    </div>
                </div>
            </div>
        );
    });

    const AuthService = {
        // Get current user from session storage
        getCurrentUser: function() {
            try {
                const userData = sessionStorage.getItem('currentUser');
                return userData ? JSON.parse(userData) : null;
            } catch (e) {
                console.error('Error getting current user from session storage:', e);
                return null;
            }
        },

        // Set current user to session storage
        setCurrentUser: function(user) {
            try {
                sessionStorage.setItem('currentUser', JSON.stringify(user));
            } catch (e) {
                console.error('Error setting current user to session storage:', e);
            }
        },

        // Check if user account still exists in admin system
        checkUserExists: function(username) {
            try {
                // Get users from admin system
                let usersFromAdmin = {};
                if (window.SharedDataService) {
                    usersFromAdmin = window.SharedDataService.syncUsersFromAdmin();
                }

                // Fallback to direct localStorage read
                if (Object.keys(usersFromAdmin).length === 0) {
                    const registeredUsersData = localStorage.getItem('registeredUsers') || localStorage.getItem('adminUsers') || localStorage.getItem('admin_users');
                    if (registeredUsersData) {
                        JSON.parse(registeredUsersData).forEach(u => {
                            usersFromAdmin[u.username] = u;
                        });
                    }
                }

                return !!usersFromAdmin[username];
            } catch (e) {
                console.error('Error checking user existence:', e);
                return false;
            }
        },

        // Validate current user session
        validateCurrentSession: function() {
            const currentUser = this.getCurrentUser();
            if (!currentUser) return false;

            // Check if user account still exists in admin system
            const userExists = this.checkUserExists(currentUser.username);
            if (!userExists) {
                console.log('⚠️ User account no longer exists, logging out...');
                this.logout();
                return false;
            }

            return true;
        },

        // Process user data for login, calculate package_status
        processUserForLogin: function(user) {
            console.log('🔍 [AuthService] Processing user for login:', {
                username: user.username,
                status: user.status,
                subscriptionStatus: user.subscriptionStatus,
                subscriptionExpiry: user.subscriptionExpiry,
                subscriptionType: user.subscriptionType
            });
            
            const now = new Date();
            const expiry = user.subscriptionExpiry ? new Date(user.subscriptionExpiry) : null;
            let package_status = 'no_package';

            // Check if user has active subscription
            if (user.status === 'active' && user.subscriptionStatus === 'active') {
                if (expiry && expiry > now) {
                    package_status = 'active';
                } else if (expiry && expiry <= now) {
                    package_status = 'expired';
                } else if (!expiry && user.subscriptionType) {
                    // If no expiry date but has subscription type, consider active
                    package_status = 'active';
                }
            } else if (user.status === 'pending') {
                package_status = 'pending';
            }

            console.log('✅ [AuthService] Package status calculated:', {
                username: user.username,
                package_status: package_status,
                expiry: expiry,
                now: now
            });

            return {
                id: user.id,
                username: user.username,
                fullName: user.fullName,
                package_type: user.subscriptionType,
                package_start: user.activatedAt,
                package_end: user.subscriptionExpiry,
                package_status: package_status, // Calculated status
                role: user.role || 'user'
            };
        },

        // Logout function
        logout: function() {
            sessionStorage.removeItem('currentUser');
            console.log('User logged out.');
        },

        // Check if user is authenticated
        isAuthenticated: function() {
            return !!this.getCurrentUser();
        }
    };

    // Auto-check user session every 30 seconds
    setInterval(() => {
        if (AuthService.isAuthenticated()) {
            const isValid = AuthService.validateCurrentSession();
            if (!isValid) {
                // Force page reload to trigger logout
                window.location.reload();
            }
        }
    }, 30000); // Check every 30 seconds

    // Listen for admin data changes (when admin deletes users)
    window.addEventListener('storage', (e) => {
        if (e.key === 'registeredUsers' || e.key === 'adminUsers' || e.key === 'admin_users') {
            console.log('📡 Admin user data changed, validating current session...');
            if (AuthService.isAuthenticated()) {
                const isValid = AuthService.validateCurrentSession();
                if (!isValid) {
                    console.log('❌ Current user no longer exists, logging out...');
                    AuthService.logout();
                    window.location.reload();
                }
            }
        }
    });

    window.LoginPage = LoginPage;
    window.AuthService = AuthService; // Export AuthService
    window.DEMO_ACCOUNTS = DEMO_ACCOUNTS_FOR_DISPLAY; // Export for display only
    console.log('✅ Authentication System loaded successfully');
})(); 