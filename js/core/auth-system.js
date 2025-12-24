/**
 * Authentication System - Login Page theo Rule
 * Xác thực & kiểm tra gói dịch vụ
 */
(function() {
    'use strict';

    console.log(' Authentication System v3.0.0 - ONLINE ONLY (MySQL)');

    // Configuration
    const AUTH_CONFIG = {
        onlineMode: true,
        sessionTimeout: 3600000, // 1 hour session
        validationInterval: 30000, // 30 seconds validation check
        debugMode: window.DEBUG_MODE || false,
        apiBaseUrl: window.API_BASE_URL || '/api', // API endpoint
        requireOnline: true // Require online connection
    };

    const LoginPage = React.memo(function LoginPage({ onLogin, onNavigate }) {
        console.log(' Rendering LoginPage...');

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
                console.log(' [LoginPage] Starting login via MySQL API for:', username);

                // Login via MySQL API - ONLINE ONLY
                const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/user-auth.php?action=login`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ username, password })
                });

                const result = await response.json();

                if (!response.ok) {
                    console.log(' [LoginPage] Login failed:', result.error);
                    setError(result.error || 'Đăng nhập thất bại');
                    return;
                }

                if (!result.success) {
                    setError(result.error || 'Đăng nhập thất bại');
                    return;
                }

                const user = result.user;

                // Check subscription status
                if (!user.subscriptionValid && user.subscriptionExpiry) {
                    console.log(' [LoginPage] User package expired:', username);
                    setError('Gói dịch vụ đã hết hạn. Vui lòng gia hạn.');
                    return;
                }

                // Process user for login
                const processedUser = AuthService.processUserForLogin(user);

                // Save token
                if (result.token) {
                    sessionStorage.setItem('user_token', result.token);
                }

                console.log(' [LoginPage] Login successful:', processedUser);
                onLogin(processedUser);

            } catch (error) {
                console.error(' [LoginPage] Login error:', error);
                if (error.message.includes('fetch') || error.name === 'TypeError') {
                    setError('Không thể kết nối server. Vui lòng kiểm tra kết nối mạng.');
                } else {
                    setError('Có lỗi xảy ra. Vui lòng thử lại.');
                }
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
                        <h2 className="text-3xl font-bold text-gray-900 mb-2"> Đăng Nhập</h2>
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
                        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                            <h3 className="text-sm font-medium text-blue-700 mb-2"> Thông tin đăng nhập:</h3>
                            <div className="text-xs text-blue-600">
                                <p>Sử dụng tài khoản được cấp bởi admin.</p>
                                <p className="mt-1">Liên hệ admin nếu chưa có tài khoản.</p>
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

        // Check if user account still exists via MySQL API
        checkUserExists: async function(username) {
            try {
                const response = await fetch(`${AUTH_CONFIG.apiBaseUrl}/user-auth.php?action=check&username=${encodeURIComponent(username)}`);
                const result = await response.json();

                if (result.success && result.user) {
                    return {
                        exists: true,
                        isActive: result.user.isActive,
                        subscriptionValid: result.user.subscriptionValid
                    };
                }

                return { exists: false };
            } catch (e) {
                console.error('Error checking user existence:', e);
                return { exists: false, error: true };
            }
        },

        // Validate current user session
        validateCurrentSession: function() {
            const currentUser = this.getCurrentUser();
            if (!currentUser) return false;

            // Check if user account still exists in admin system
            const userExists = this.checkUserExists(currentUser.username);
            if (!userExists) {
                console.log(' User account no longer exists, logging out...');
                this.logout();
                return false;
            }

            return true;
        },

        // Process user data for login, calculate package_status
        processUserForLogin: function(user) {
            console.log(' [AuthService] Processing user for login:', {
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

            console.log(' [AuthService] Package status calculated:', {
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
            console.log(' Admin user data changed, validating current session...');
            if (AuthService.isAuthenticated()) {
                const isValid = AuthService.validateCurrentSession();
                if (!isValid) {
                    console.log(' Current user no longer exists, logging out...');
                    AuthService.logout();
                    window.location.reload();
                }
            }
        }
    });

    window.LoginPage = LoginPage;
    window.AuthService = AuthService; // Export AuthService
    // ONLINE MODE: No demo accounts - all users from MySQL
    window.DEMO_ACCOUNTS = [];
    console.log(' Authentication System loaded successfully');
})(); 