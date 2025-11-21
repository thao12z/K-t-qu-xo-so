(function() {
    'use strict';
    
    const { useState, useCallback, useEffect, memo } = React;
    
    console.log('🛒 Pricing Page v1.1.1 loaded - Admin sync fixed!');
    console.log('🔍 React hooks check:', { useState: !!useState, useCallback: !!useCallback, useEffect: !!useEffect, memo: !!memo });
    
    // ===== DYNAMIC PRICING PACKAGES FROM ADMIN =====
    const getPackagesFromAdmin = () => {
        if (window.SharedDataService) {
            return window.SharedDataService.getPackages();
        }
        
        // Fallback packages if SharedDataService not loaded
        return {
            basic: {
                id: "basic",
                name: "Gói Cơ Bản",
                price: "199k/tháng",
                duration_days: 30,
                features: [
                    "Đối soát miền Bắc",
                    "1,000 giao dịch/ngày", 
                    "Báo cáo cơ bản"
                ],
                max_transactions_per_day: 1000,
                enabled_regions: ["bac"],
                target: "Đại lý nhỏ",
                priority: 1
            },
            
            pro: {
                id: "pro",
                name: "Gói Chuyên Nghiệp", 
                price: "499k/tháng",
                duration_days: 30,
                features: [
                    "Đối soát 3 miền (sắp có)",
                    "Không giới hạn giao dịch",
                    "Báo cáo chi tiết", 
                    "API tích hợp"
                ],
                max_transactions_per_day: -1,
                enabled_regions: ["bac", "trung", "nam"],
                target: "Đại lý vừa",
                popular: true,
                priority: 2
            },
            
            enterprise: {
                id: "enterprise",
                name: "Gói Doanh Nghiệp",
                price: "999k/tháng",
                duration_days: 30,
                features: [
                    "Tất cả tính năng",
                    "Multi-user",
                    "Hỗ trợ 24/7",
                    "Tùy chỉnh theo yêu cầu"
                ],
                max_transactions_per_day: -1,
                enabled_regions: ["bac", "trung", "nam"],
                target: "Chuỗi đại lý",
                priority: 3
            }
        };
    };

    const CONTACT_INFO = {
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
        ]
    };

    // Pricing Page Component
    const PricingPage = memo(({ onNavigate }) => {
        // Check if user is already logged in
        const currentUser = window.AuthService?.getCurrentUser();
        const [selectedPackage, setSelectedPackage] = useState(null);
        const [packages, setPackages] = useState(getPackagesFromAdmin());
        const [lastSync, setLastSync] = useState(null);
        const [showPaymentModal, setShowPaymentModal] = useState(false);
        const [paymentConfig, setPaymentConfig] = useState(null);

        const handleBackToLanding = useCallback(() => {
            onNavigate('landing');
        }, [onNavigate]);

        const handleLogin = useCallback(() => {
            onNavigate('login');
        }, [onNavigate]);

        const handleContactForPackage = useCallback((packageId) => {
            setSelectedPackage(packages[packageId]);
            setShowPaymentModal(true);
        }, [packages]);

        // Auto-sync packages from admin
        useEffect(() => {
            // Force load packages on mount
            const loadPackages = () => {
                console.log('📦 [PricingPage] Loading packages from admin...');
                if (window.SharedDataService) {
                    const updatedPackages = window.SharedDataService.getPackages();
                    console.log('📦 [PricingPage] Loaded packages:', Object.keys(updatedPackages));
                    setPackages(updatedPackages);
                    setLastSync(new Date().toLocaleTimeString());
                } else {
                    console.log('⚠️ [PricingPage] SharedDataService not available');
                }
            };

            loadPackages();
            
            // Listen for admin data changes
            const handleAdminDataChange = (event) => {
                console.log('📡 [PricingPage] Admin data change event:', event.detail);
                if (event.detail && event.detail.type === 'packages') {
                    console.log('📦 [PricingPage] Admin packages changed, reloading...');
                    loadPackages();
                }
            };

            const handleStorageChange = (e) => {
                if (e.key === 'adminPackages' || e.key === 'admin_packages') {
                    console.log('📦 [PricingPage] Storage change detected:', e.key);
                    loadPackages();
                }
            };

            // Listen for manual sync events
            const handleSharedDataUpdate = (event) => {
                if (event.detail?.packages) {
                    console.log('📦 [PricingPage] SharedDataService update');
                    setPackages(event.detail.packages);
                    setLastSync(new Date().toLocaleTimeString());
                }
                
                // Load payment config if available
                if (window.SharedDataService) {
                    const config = window.SharedDataService.getPaymentConfig();
                    if (config) {
                        setPaymentConfig(config);
                    }
                }
            };
            
            window.addEventListener('adminDataChanged', handleAdminDataChange);
            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('sharedDataUpdated', handleSharedDataUpdate);
            
            return () => {
                window.removeEventListener('adminDataChanged', handleAdminDataChange);
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('sharedDataUpdated', handleSharedDataUpdate);
            };
        }, []);

        const renderPackageCard = (pkg) => {
            const isPopular = pkg.popular;
            
            return React.createElement('div', {
                key: pkg.id,
                className: `relative bg-white rounded-lg shadow-lg p-6 ${
                    isPopular ? 'ring-2 ring-blue-500 transform scale-105' : ''
                }`
            },
                // Popular Badge
                isPopular && React.createElement('div', {
                    className: 'absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-sm font-bold'
                }, 'PHỔ BIẾN'),

                // Package Header
                React.createElement('div', { className: 'text-center mb-6' },
                    React.createElement('h3', { className: 'text-2xl font-bold text-gray-900 mb-2' }, pkg.name),
                    React.createElement('div', { className: 'text-4xl font-bold text-blue-600 mb-2' }, pkg.price),
                    React.createElement('div', { className: 'text-sm text-gray-600' }, `Thời hạn: ${pkg.duration_days} ngày`),
                    React.createElement('div', { className: 'text-sm text-gray-500 mt-1' }, `Phù hợp: ${pkg.target}`)
                ),

                // Features List
                React.createElement('ul', { className: 'space-y-3 mb-8' },
                    pkg.features.map((feature, index) =>
                        React.createElement('li', {
                            key: index,
                            className: 'flex items-center gap-3'
                        },
                            React.createElement('div', { className: 'text-green-500 text-xl' }, '✓'),
                            React.createElement('span', { className: 'text-gray-700' }, feature)
                        )
                    )
                ),

                // Technical Details
                React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4 mb-6' },
                    React.createElement('div', { className: 'text-sm text-gray-600 space-y-1' },
                        React.createElement('div', {}, 
                            `Giao dịch/ngày: ${pkg.max_transactions_per_day === -1 ? 'Không giới hạn' : pkg.max_transactions_per_day.toLocaleString()}`
                        ),
                        React.createElement('div', {}, 
                            `Miền hỗ trợ: ${pkg.enabled_regions.map(r => r.toUpperCase()).join(', ')}`
                        )
                    )
                ),

                // CTA Button
                React.createElement('button', {
                    className: `w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                        isPopular 
                            ? 'bg-blue-600 text-white hover:bg-blue-700' 
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                    }`,
                    onClick: () => handleContactForPackage(pkg.id)
                }, 'Liên Hệ Mua Gói')
            );
        };

        return React.createElement('div', { className: 'min-h-screen bg-gray-50' },
            // Header
            React.createElement('header', { className: 'bg-white shadow-sm' },
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-4' },
                    React.createElement('div', { className: 'flex items-center justify-between' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('button', {
                                className: 'text-blue-600 hover:text-blue-800',
                                onClick: handleBackToLanding
                            }, '← Trang chủ'),
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('div', { className: 'text-2xl' }, '🛒'),
                                React.createElement('h1', { className: 'text-xl font-bold text-gray-800' }, 'Gói Dịch Vụ')
                            )
                        ),
                        currentUser ? (
                            // Show user info if logged in
                            React.createElement('div', { className: 'flex items-center gap-3' },
                                React.createElement('span', { className: 'text-sm text-gray-600' }, 
                                    `Xin chào, ${currentUser.username}`
                                ),
                                React.createElement('button', {
                                    className: 'px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium',
                                    onClick: () => {
                                        if (window.AuthService) {
                                            window.AuthService.logout();
                                            onNavigate('landing');
                                        }
                                    }
                                }, 'Đăng xuất')
                            )
                        ) : (
                            // Show login button if not logged in
                            React.createElement('button', {
                                className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium',
                                onClick: handleLogin
                            }, 'Đăng Nhập')
                        )
                    )
                )
            ),

            // Main Content
            React.createElement('main', { className: 'max-w-7xl mx-auto px-4 py-8' },
                // Header Section
                React.createElement('div', { className: 'text-center mb-12' },
                    React.createElement('h1', { className: 'text-4xl font-bold text-gray-900 mb-4' },
                        'Chọn Gói Phù Hợp'
                    ),
                    React.createElement('p', { className: 'text-xl text-gray-600 max-w-3xl mx-auto' },
                        'Tất cả gói đều được Admin hỗ trợ trực tiếp. Liên hệ ngay để được tư vấn và kích hoạt.'
                    )
                ),

                // Sync Status (if available)
                lastSync && React.createElement('div', { className: 'text-center mb-4' },
                    React.createElement('div', { className: 'inline-flex items-center gap-2 bg-green-50 border border-green-200 rounded-full px-4 py-2' },
                        React.createElement('div', { className: 'text-green-500 text-sm' }, '🔄'),
                        React.createElement('span', { className: 'text-green-700 text-sm' }, `Cập nhật từ Admin: ${lastSync}`)
                    )
                ),

                // Packages Grid
                React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-8 mb-16' },
                    Object.values(packages)
                        .filter(pkg => pkg.status === 'active') // Only show active packages
                        .sort((a, b) => (a.priority || 999) - (b.priority || 999))
                        .map(pkg => renderPackageCard(pkg))
                ),

                // Contact Section
                React.createElement('div', { 
                    id: 'contact-section',
                    className: 'bg-white rounded-lg shadow-lg p-8 mb-12'
                },
                    React.createElement('div', { className: 'text-center mb-8' },
                        React.createElement('h2', { className: 'text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center gap-3' },
                            React.createElement('span', { className: 'text-4xl' }, '📞'),
                            'Liên Hệ Mua Gói'
                        ),
                        selectedPackage && React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4' },
                            React.createElement('div', { className: 'text-blue-800 font-semibold' },
                                `Bạn đã chọn: ${packages[selectedPackage]?.name}`
                            ),
                            React.createElement('div', { className: 'text-blue-600 text-sm' },
                                'Vui lòng liên hệ Admin qua một trong các kênh dưới đây'
                            )
                        )
                    ),

                    // Contact Methods
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' },
                        // Zalo
                        React.createElement('div', { className: 'text-center p-6 bg-green-50 rounded-lg border border-green-200' },
                            React.createElement('div', { className: 'text-4xl mb-3' }, '💬'),
                            React.createElement('h3', { className: 'text-xl font-bold text-green-800 mb-2' }, 'Zalo'),
                            React.createElement('div', { className: 'text-green-700 font-mono text-lg' }, CONTACT_INFO.zalo_number),
                            React.createElement('div', { className: 'text-sm text-green-600 mt-2' }, 'Phản hồi nhanh nhất')
                        ),

                        // Telegram
                        React.createElement('div', { className: 'text-center p-6 bg-blue-50 rounded-lg border border-blue-200' },
                            React.createElement('div', { className: 'text-4xl mb-3' }, '✈️'),
                            React.createElement('h3', { className: 'text-xl font-bold text-blue-800 mb-2' }, 'Telegram'),
                            React.createElement('div', { className: 'text-blue-700 font-mono text-lg' }, CONTACT_INFO.telegram_username),
                            React.createElement('div', { className: 'text-sm text-blue-600 mt-2' }, 'Hỗ trợ 24/7')
                        ),

                        // Hotline
                        React.createElement('div', { className: 'text-center p-6 bg-red-50 rounded-lg border border-red-200' },
                            React.createElement('div', { className: 'text-4xl mb-3' }, '☎️'),
                            React.createElement('h3', { className: 'text-xl font-bold text-red-800 mb-2' }, 'Hotline'),
                            React.createElement('div', { className: 'text-red-700 font-mono text-lg' }, CONTACT_INFO.hotline),
                            React.createElement('div', { className: 'text-sm text-red-600 mt-2' }, 'Gọi trực tiếp')
                        )
                    ),

                    // Working Hours & Payment Info
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8' },
                        React.createElement('div', { className: 'bg-gray-50 rounded-lg p-6' },
                            React.createElement('h4', { className: 'font-bold text-gray-800 mb-3 flex items-center gap-2' },
                                React.createElement('span', { className: 'text-2xl' }, '🕐'),
                                'Giờ Làm Việc'
                            ),
                            React.createElement('div', { className: 'text-gray-700' }, CONTACT_INFO.working_hours)
                        ),

                        React.createElement('div', { className: 'bg-gray-50 rounded-lg p-6' },
                            React.createElement('h4', { className: 'font-bold text-gray-800 mb-3 flex items-center gap-2' },
                                React.createElement('span', { className: 'text-2xl' }, '💳'),
                                'Phương Thức Thanh Toán'
                            ),
                            React.createElement('ul', { className: 'text-gray-700 space-y-1' },
                                CONTACT_INFO.payment_methods.map((method, index) =>
                                    React.createElement('li', { key: index }, `• ${method}`)
                                )
                            )
                        )
                    )
                ),

                // Purchase Flow
                React.createElement('div', { className: 'bg-blue-50 rounded-lg p-8 mb-12' },
                    React.createElement('h2', { className: 'text-2xl font-bold text-blue-900 mb-6 text-center flex items-center justify-center gap-3' },
                        React.createElement('span', { className: 'text-3xl' }, '📋'),
                        'Quy Trình Mua Gói'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-5 gap-4' },
                        [
                            { step: 1, title: 'Chọn Gói', desc: 'Chọn gói phù hợp với nhu cầu', icon: '🎯' },
                            { step: 2, title: 'Liên Hệ', desc: 'Liên hệ Admin qua Zalo/Telegram', icon: '📞' },
                            { step: 3, title: 'Xác Nhận', desc: 'Admin xác nhận và báo giá', icon: '✅' },
                            { step: 4, title: 'Thanh Toán', desc: 'Thanh toán theo hướng dẫn', icon: '💰' },
                            { step: 5, title: 'Kích Hoạt', desc: 'Nhận tài khoản và sử dụng', icon: '🚀' }
                        ].map((item, index) =>
                            React.createElement('div', {
                                key: index,
                                className: 'text-center p-4 bg-white rounded-lg shadow-sm'
                            },
                                React.createElement('div', { className: 'text-3xl mb-2' }, item.icon),
                                React.createElement('div', { className: 'font-bold text-blue-900 mb-1' }, 
                                    `${item.step}. ${item.title}`
                                ),
                                React.createElement('div', { className: 'text-sm text-blue-700' }, item.desc)
                            )
                        )
                    )
                ),

                // Important Notes
                React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-6' },
                    React.createElement('h3', { className: 'text-xl font-bold text-yellow-800 mb-4 flex items-center gap-2' },
                        React.createElement('span', { className: 'text-2xl' }, '⚠️'),
                        'Lưu Ý Quan Trọng'
                    ),
                    React.createElement('ul', { className: 'space-y-2 text-yellow-700' },
                        CONTACT_INFO.notes.map((note, index) =>
                            React.createElement('li', { key: index }, `• ${note}`)
                        )
                    )
                )
            ),

            // Footer
            React.createElement('footer', { className: 'bg-gray-900 text-white py-8' },
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 text-center' },
                    React.createElement('div', { className: 'flex items-center justify-center gap-2 mb-4' },
                        React.createElement('div', { className: 'text-2xl' }, '🎯'),
                        React.createElement('span', { className: 'text-xl font-bold' }, 'Hệ Thống Đối Soát Lô Đề B2B')
                    ),
                    React.createElement('p', { className: 'text-gray-400 mb-2' },
                        'Giải pháp tự động hóa cho đại lý lô đề'
                    ),
                    React.createElement('p', { className: 'text-gray-500 text-sm' },
                        'Mọi thắc mắc vui lòng liên hệ Admin để được hỗ trợ tốt nhất'
                    )
                )
            ),
            
            // Payment Modal
            showPaymentModal && React.createElement(window.PaymentModal, {
                isOpen: showPaymentModal,
                onClose: () => setShowPaymentModal(false),
                selectedPackage: selectedPackage,
                paymentConfig: paymentConfig
            })
        );
    });

    // Export to window
    window.PricingPage = PricingPage;
    
    console.log('✅ Pricing Page component loaded successfully');

})(); 