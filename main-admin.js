// 🚀 MAIN ADMIN MODULE - CORE ORCHESTRATOR
// Version: 1.0.0 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';
    
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
                                <p className="text-sm font-medium text-gray-600">Total Users</p>
                                <p className="text-2xl font-bold text-gray-900">{currentStats.totalUsers}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="medium">
                        <div className="flex items-center">
                            <span className="text-3xl">✅</span>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Active Users</p>
                                <p className="text-2xl font-bold text-green-900">{currentStats.activeUsers}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="medium">
                        <div className="flex items-center">
                            <span className="text-3xl">💰</span>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Revenue</p>
                                <p className="text-2xl font-bold text-green-900">
                                    {formatCurrency(currentStats.totalRevenue)}
                                </p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="medium">
                        <div className="flex items-center">
                            <span className="text-3xl">⏳</span>
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-600">Pending Payments</p>
                                <p className="text-2xl font-bold text-yellow-900">{currentStats.pendingPayments}</p>
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
                                    className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50"
                                >
                                    <div className="flex-shrink-0">
                                        {notification.type === 'success' && <span className="text-green-600">✅</span>}
                                        {notification.type === 'error' && <span className="text-red-600">❌</span>}
                                        {notification.type === 'warning' && <span className="text-yellow-600">⚠️</span>}
                                        {notification.type === 'info' && <span className="text-blue-600">ℹ️</span>}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">{notification.message}</p>
                                        <p className="text-xs text-gray-500">
                                            {new Date(notification.timestamp).toLocaleString()}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-center py-4">No recent activities</p>
                    )}
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
                
                if (credentials.username === 'admin' && credentials.password === 'admin123') {
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
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
                <div className="max-w-md w-full space-y-8">
                    <div className="text-center">
                        <div className="mx-auto h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center mb-4">
                            <span className="text-white text-2xl font-bold">A</span>
                        </div>
                        <h2 className="text-3xl font-bold text-gray-900">Admin System</h2>
                        <p className="text-gray-600 mt-2">Please sign in to continue</p>
                    </div>
                    
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {errors.general && (
                            <div className="bg-red-50 border border-red-200 rounded-md p-4">
                                <p className="text-red-700 text-sm">{errors.general}</p>
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
                            <p className="text-xs text-gray-500">
                                Demo credentials: admin / admin123
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
                    username: 'admin',
                    email: 'admin@example.com',
                    fullName: 'Administrator',
                    phone: '+1234567890',
                    password: 'admin123',
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
                case 'packages':
                    return window.PackageManagement ? 
                        <window.PackageManagement /> : 
                        <div className="p-6">Package Management module not loaded</div>;
                case 'notifications':
                    return window.NotificationSystem ? 
                        <window.NotificationSystem /> : 
                        <div className="p-6">Notification System module not loaded</div>;
                default:
                    return <Dashboard />;
            }
        }, [currentPage]);
        
        // Menu items
        const menuItems = [
            { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
            { id: 'pending', label: '📋 Pending Requests', icon: '📋' },
            { id: 'users', label: '👥 User Management', icon: '👥' },
            { id: 'payments', label: '💳 Payment Management', icon: '💳' },
            { id: 'payment-config', label: '⚙️ Payment Settings', icon: '⚙️' },
            { id: 'packages', label: '📦 Package Management', icon: '📦' },
            { id: 'notifications', label: '🔔 Notifications', icon: '🔔' }
        ];
        
        // If not authenticated, show login form
        if (!isAuthenticated) {
            return <LoginForm onLogin={handleLogin} />;
        }
        
        // Main admin interface
        return (
            <div className="min-h-screen bg-gray-50 flex">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div 
                        className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                
                {/* Sidebar */}
                <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
                    sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                }`}>
                    {/* Sidebar header */}
                    <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
                        <h1 className="text-xl font-bold text-gray-900">Admin System</h1>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                        >
                            ✕
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
                                            ? 'bg-blue-100 text-blue-700 border-r-2 border-blue-500'
                                            : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                                >
                                    <span className="mr-3">{item.icon}</span>
                                    {item.label}
                                </button>
                            ))}
                        </div>
                    </nav>
                    
                    {/* User info & logout */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                                    <span className="text-white text-sm font-medium">
                                        {user?.username?.charAt(0).toUpperCase()}
                                    </span>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                                    <p className="text-xs text-gray-500">Administrator</p>
                                </div>
                            </div>
                            <button
                                onClick={handleLogout}
                                className="p-2 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100"
                                title="Logout"
                            >
                                🚪
                            </button>
                        </div>
                    </div>
                </div>
                
                {/* Main content */}
                <div className="lg:pl-64 flex-1">
                    {/* Top header */}
                    <div className="bg-white shadow-sm border-b border-gray-200">
                        <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 text-gray-400 hover:text-gray-600"
                            >
                                ☰
                            </button>
                            
                            <div className="flex-1 flex items-center justify-center lg:justify-start">
                                <h2 className="text-lg font-semibold text-gray-900">
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
                
                // ✅ ADD DEBUG COMMANDS FOR ADMIN SYSTEM
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