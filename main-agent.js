/**
 * Main Agent System - 5 TRANG BẮT BUỘC theo Rule
 * 1. Landing Page - Giới thiệu & mua gói
 * 2. Login Page - Xác thực & kiểm tra gói
 * 3. Formula Page - Hướng dẫn sử dụng
 * 4. Main Page - Tính năng chính (đối soát)
 * 5. Pricing Page - Gia hạn dịch vụ
 */
(function() {
    'use strict';

    console.log('🚀 Main Agent System v10.1 - 5 Pages Rule Compliant');

    // Error Boundary Component
    const ErrorBoundary = React.memo(function ErrorBoundary({ children }) {
        const [hasError, setHasError] = React.useState(false);
        const [error, setError] = React.useState(null);

        React.useEffect(() => {
            const handleError = (error) => {
                console.error('❌ Error caught by boundary:', error);
                setHasError(true);
                setError(error);
            };

            window.addEventListener('error', handleError);
            return () => window.removeEventListener('error', handleError);
        }, []);

        if (hasError) {
            return (
                <div className="min-h-screen bg-red-50 flex items-center justify-center p-8">
                    <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl">
                        <h2 className="text-2xl font-bold text-red-600 mb-4">❌ Lỗi Hệ Thống</h2>
                        <p className="text-gray-700 mb-4">Đã xảy ra lỗi khi tải trang. Vui lòng thử lại.</p>
                        {error && (
                            <details className="bg-gray-100 p-4 rounded">
                                <summary className="cursor-pointer font-medium">Chi tiết lỗi</summary>
                                <pre className="text-sm text-red-600 mt-2">{error.message}</pre>
                            </details>
                        )}
                        <button 
                            onClick={() => window.location.reload()} 
                            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                        >
                            Tải lại trang
                        </button>
                    </div>
                </div>
            );
        }

        return children;
    });

    // Main App Component với 5 trang bắt buộc
    const MainApp = React.memo(function MainApp() {
        console.log('🔄 Rendering MainApp...');

        const [currentPage, setCurrentPage] = React.useState('landing');
        const [user, setUser] = React.useState(null);
        const [isLoading, setIsLoading] = React.useState(false);

        // Check user authentication
        React.useEffect(() => {
            console.log('🔍 Checking authentication...');
            const checkAuth = () => {
                if (window.AuthService) {
                    const currentUser = window.AuthService.getCurrentUser();
                    console.log('👤 Current user:', currentUser);
                    if (currentUser) {
                        setUser(currentUser);
                        
                        // Check package status
                        if (currentUser.package_status === 'active') {
                            console.log('✅ User has active package, going to main page');
                            setCurrentPage('main'); // Go to main page if active
                        } else if (currentUser.package_status === 'expired' || currentUser.package_status === 'no_package') {
                            console.log('⚠️ User package expired/no package, going to pricing');
                            setCurrentPage('pricing'); // Redirect to pricing if expired/no package
                        }
                    }
                }
                else {
                    console.error('❌ AuthService not available');
                }
            };
            
            checkAuth();
        }, []);

        const handleNavigation = React.useCallback((page) => {
            console.log(`🔄 Navigating to: ${page}`);
            setCurrentPage(page);
        }, []);

        // Render current page
        const renderCurrentPage = () => {
            console.log(`🎯 Rendering page: ${currentPage}`);
            console.log('📦 Available components:', {
                LandingPage: !!window.LandingPage,
                LoginPage: !!window.LoginPage,
                FormulaPage: !!window.FormulaPage,
                MainReconciliation: !!window.MainReconciliation,
                PricingPage: !!window.PricingPage
            });

            try {
                switch (currentPage) {
                    case 'landing':
                        if (!window.LandingPage) {
                            console.error('❌ LandingPage component not found');
                            return <div className="p-8 text-center">❌ Landing Page không tải được</div>;
                        }
                        return React.createElement(window.LandingPage, { onNavigate: handleNavigation });
                    
                    case 'login':
                        if (!window.LoginPage) {
                            console.error('❌ LoginPage component not found');
                            return <div className="p-8 text-center">❌ Login Page không tải được</div>;
                        }
                        return React.createElement(window.LoginPage, {
                            onLogin: (userData) => {
                                console.log('🔐 Login successful:', userData);
                                // Set user to session storage via AuthService
                                if (window.AuthService) {
                                    window.AuthService.setCurrentUser(userData);
                                }
                                setUser(userData);
                                if (userData.package_status === 'active') {
                                    handleNavigation('main');
                                } else {
                                    handleNavigation('pricing');
                                }
                            },
                            onNavigate: handleNavigation
                        });
                    
                    case 'formula':
                        if (!window.FormulaPage) {
                            console.error('❌ FormulaPage component not found');
                            return <div className="p-8 text-center">❌ Formula Page không tải được</div>;
                        }
                        return React.createElement(window.FormulaPage, { onNavigate: handleNavigation });
                    
                    case 'main':
                        if (!window.MainReconciliation) {
                            console.error('❌ MainReconciliation component not found');
                            return <div className="p-8 text-center">❌ Main Page không tải được</div>;
                        }
                        return React.createElement(window.MainReconciliation);
                    
                    case 'pricing':
                        if (!window.PricingPage) {
                            console.error('❌ PricingPage component not found');
                            return <div className="p-8 text-center">❌ Pricing Page không tải được</div>;
                        }
                        return React.createElement(window.PricingPage, { onNavigate: handleNavigation });
                    
                    default:
                        return <div className="p-8 text-center">❌ Trang không tồn tại: {currentPage}</div>;
                }
            } catch (error) {
                console.error('❌ Error rendering page:', error);
                return (
                    <div className="p-8 text-center">
                        <div className="text-red-600 text-xl mb-4">❌ Lỗi tải trang</div>
                        <div className="text-gray-600 mb-4">Trang: {currentPage}</div>
                        <div className="text-sm text-gray-500">{error.message}</div>
                    </div>
                );
            }
        };

        // Navigation component - Chỉ hiển thị khi đã đăng nhập
        const Navigation = React.memo(function Navigation() {
            if (!user) return null;

            // Kiểm tra package status để quyết định hiển thị nút nào
            const isPackageActive = user.package_status === 'active';
            const isPackageExpired = user.package_status === 'expired' || user.package_status === 'no_package';

            return (
                <nav className="bg-white shadow-md">
                    <div className="container mx-auto px-4">
                        <div className="flex justify-between items-center py-4">
                            <div className="flex items-center space-x-8">
                                {/* Chỉ hiển thị nút Đối Soát và Công Thức khi package active */}
                                {isPackageActive && (
                                    <>
                                        <button 
                                            onClick={() => handleNavigation('main')} 
                                            className={`px-4 py-2 rounded-lg font-medium ${
                                                currentPage === 'main' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
                                            }`}
                                        >
                                            🧮 Đối Soát
                                        </button>
                                        <button 
                                            onClick={() => handleNavigation('formula')} 
                                            className={`px-4 py-2 rounded-lg font-medium ${
                                                currentPage === 'formula' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
                                            }`}
                                        >
                                            📖 Công Thức
                                        </button>
                                    </>
                                )}
                                
                                {/* Nút Mua Gói luôn hiển thị */}
                                <button 
                                    onClick={() => handleNavigation('pricing')} 
                                    className={`px-4 py-2 rounded-lg font-medium ${
                                        currentPage === 'pricing' ? 'bg-blue-600 text-white' : 'text-gray-600 hover:text-blue-600'
                                    }`}
                                >
                                    💰 Mua Gói
                                </button>

                                {/* Hiển thị cảnh báo khi package hết hạn */}
                                {isPackageExpired && (
                                    <div className="flex items-center gap-2 text-orange-600 text-sm">
                                        <span>⚠️</span>
                                        <span>Gói dịch vụ đã hết hạn. Vui lòng gia hạn để sử dụng tính năng.</span>
                                    </div>
                                )}
                            </div>
                            
                            <div className="flex items-center space-x-4">
                                {user && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">{user.username}</span>
                                        <span className="mx-2">•</span>
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            user.package_status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                        }`}>
                                            {user.package_status === 'active' ? 'Active' : 'Expired'}
                                        </span>
                                    </div>
                                )}
                                <button 
                                    onClick={() => { 
                                        if (window.AuthService) { 
                                            window.AuthService.logout(); 
                                            setUser(null); 
                                            handleNavigation('landing'); 
                                        } 
                                    }} 
                                    className="px-4 py-2 text-gray-600 hover:text-red-600 font-medium"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>
            );
        });

        return (
            <ErrorBoundary>
                <div className="min-h-screen bg-gray-50">
                    {/* Navigation */}
                    <Navigation />
                    
                    {/* Main Content */}
                    <main>
                        {renderCurrentPage()}
                    </main>
                </div>
            </ErrorBoundary>
        );
    });

    const initialize = () => {
        console.log('🎯 Initializing Main Agent System...');
        const rootElement = document.getElementById('root');
        if (rootElement) {
            ReactDOM.render(React.createElement(MainApp), rootElement);
            console.log('✅ Main Agent System initialized successfully');
        } else {
            console.error('❌ Root element not found');
        }
    };

    window.MainAgentSystem = { initialize: initialize };
    console.log('✅ Main Agent System loaded successfully');
})(); 