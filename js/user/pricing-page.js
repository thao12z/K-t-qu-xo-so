(function() {
    'use strict';
    
    const { useState, useCallback, useEffect, memo } = React;
    
    console.log(' Pricing Page v1.1.1 loaded - Admin sync fixed!');
    console.log(' React hooks check:', { useState: !!useState, useCallback: !!useCallback, useEffect: !!useEffect, memo: !!memo });
    
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

    // ===== DYNAMIC CONTACT INFO FROM ADMIN =====
    const getContactInfoFromAdmin = () => {
        if (window.SharedDataService && window.SharedDataService.getContactInfo) {
            const adminContactInfo = window.SharedDataService.getContactInfo();
            if (adminContactInfo) {
                return adminContactInfo;
            }
        }

        // Fallback contact info if SharedDataService not loaded
        return {
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
                { step: 1, title: 'Chọn Gói', desc: 'Chọn gói phù hợp với nhu cầu', icon: '' },
                { step: 2, title: 'Liên Hệ', desc: 'Liên hệ Admin qua Zalo/Telegram', icon: '' },
                { step: 3, title: 'Xác Nhận', desc: 'Admin xác nhận và báo giá', icon: '' },
                { step: 4, title: 'Thanh Toán', desc: 'Thanh toán theo hướng dẫn', icon: '' },
                { step: 5, title: 'Kích Hoạt', desc: 'Nhận tài khoản và sử dụng', icon: '' }
            ]
        };
    };

    // Pricing Page Component
    const PricingPage = memo(({ onNavigate }) => {
        // Check if user is already logged in
        const currentUser = window.AuthService?.getCurrentUser();
        const [selectedPackage, setSelectedPackage] = useState(null);
        const [packages, setPackages] = useState(getPackagesFromAdmin());
        const [contactInfo, setContactInfo] = useState(getContactInfoFromAdmin());
        const [lastSync, setLastSync] = useState(null);
        const [showPaymentModal, setShowPaymentModal] = useState(false);
        const [paymentConfig, setPaymentConfig] = useState(null);

        // Sync contact info from admin
        useEffect(() => {
            const syncContactInfo = () => {
                const adminContactInfo = getContactInfoFromAdmin();
                setContactInfo(adminContactInfo);
            };

            syncContactInfo();

            // Listen for updates
            const handleStorageChange = (e) => {
                if (e.key === 'adminContactInfo') {
                    syncContactInfo();
                }
            };
            window.addEventListener('storage', handleStorageChange);

            return () => {
                window.removeEventListener('storage', handleStorageChange);
            };
        }, []);

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
                console.log(' [PricingPage] Loading packages from admin...');
                if (window.SharedDataService) {
                    const updatedPackages = window.SharedDataService.getPackages();
                    console.log(' [PricingPage] Loaded packages:', Object.keys(updatedPackages));
                    setPackages(updatedPackages);
                    setLastSync(new Date().toLocaleTimeString());
                } else {
                    console.log(' [PricingPage] SharedDataService not available');
                }
            };

            loadPackages();
            
            // Listen for admin data changes
            const handleAdminDataChange = (event) => {
                console.log(' [PricingPage] Admin data change event:', event.detail);
                if (event.detail && event.detail.type === 'packages') {
                    console.log(' [PricingPage] Admin packages changed, reloading...');
                    loadPackages();
                }
            };

            const handleStorageChange = (e) => {
                if (e.key === 'adminPackages' || e.key === 'admin_packages') {
                    console.log(' [PricingPage] Storage change detected:', e.key);
                    loadPackages();
                }
            };

            // Listen for manual sync events
            const handleSharedDataUpdate = (event) => {
                if (event.detail?.packages) {
                    console.log(' [PricingPage] SharedDataService update');
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
                    isPopular ? 'ring-2 ring-[#E36323] transform scale-105' : ''
                }`
            },
                // Popular Badge
                isPopular && React.createElement('div', {
                    className: 'absolute -top-3 left-1/2 transform -translate-x-1/2 bg-[#E36323] text-white px-4 py-1 rounded-full text-sm font-bold'
                }, 'PHỔ BIẾN'),

                // Package Header
                React.createElement('div', { className: 'text-center mb-6' },
                    React.createElement('h3', { className: 'text-2xl font-bold text-[#121212] mb-2' }, pkg.name),
                    React.createElement('div', { className: 'text-4xl font-bold text-[#E36323] mb-2' }, pkg.price),
                    React.createElement('div', { className: 'text-sm text-[#7B7B7B]' }, `Thời hạn: ${pkg.duration_days} ngày`),
                    React.createElement('div', { className: 'text-sm text-[#7B7B7B] mt-1' }, `Phù hợp: ${pkg.target}`)
                ),

                // Features List
                React.createElement('ul', { className: 'space-y-3 mb-8' },
                    pkg.features.map((feature, index) =>
                        React.createElement('li', {
                            key: index,
                            className: 'flex items-center gap-3'
                        },
                            React.createElement('div', { className: 'text-[#10B981] text-xl' }, ''),
                            React.createElement('span', { className: 'text-[#121212]' }, feature)
                        )
                    )
                ),

                // Technical Details
                React.createElement('div', { className: 'bg-[#F8F7F7] rounded-lg p-4 mb-6' },
                    React.createElement('div', { className: 'text-sm text-[#7B7B7B] space-y-1' },
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
                            ? 'bg-[#E36323] text-white hover:bg-[#DF5A18]' 
                            : 'bg-[#F8F7F7] text-[#121212] hover:bg-[#ECECEC]'
                    }`,
                    onClick: () => handleContactForPackage(pkg.id)
                }, 'Liên Hệ Mua Gói')
            );
        };

        return React.createElement('div', { className: 'min-h-screen bg-[#F8F7F7]' },
            // Header
            React.createElement('header', { className: 'bg-white shadow-sm' },
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-4' },
                    React.createElement('div', { className: 'flex items-center justify-between' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('button', {
                                className: 'text-[#E36323] hover:text-[#DF5A18]',
                                onClick: handleBackToLanding
                            }, '← Trang chủ'),
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('div', { className: 'text-2xl' }, ''),
                                React.createElement('h1', { className: 'text-xl font-bold text-[#121212]' }, 'Gói Dịch Vụ')
                            )
                        ),
                        currentUser ? (
                            // Show user info if logged in
                            React.createElement('div', { className: 'flex items-center gap-3' },
                                React.createElement('span', { className: 'text-sm text-[#7B7B7B]' }, 
                                    `Xin chào, ${currentUser.username}`
                                ),
                                React.createElement('button', {
                                    className: 'px-4 py-2 bg-[#FE5938] text-white rounded-lg hover:bg-[#E54A2A] font-medium',
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
                                className: 'px-4 py-2 bg-[#E36323] text-white rounded-lg hover:bg-[#DF5A18] font-medium',
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
                    React.createElement('h1', { className: 'text-4xl font-bold text-[#121212] mb-4' },
                        'Chọn Gói Phù Hợp'
                    ),
                    React.createElement('p', { className: 'text-xl text-[#7B7B7B] max-w-3xl mx-auto' },
                        'Tất cả gói đều được Admin hỗ trợ trực tiếp. Liên hệ ngay để được tư vấn và kích hoạt.'
                    )
                ),

                // Sync Status (if available)
                lastSync && React.createElement('div', { className: 'text-center mb-4' },
                    React.createElement('div', { className: 'inline-flex items-center gap-2 bg-[#ECFDF5] border border-[#10B981]/20 rounded-full px-4 py-2' },
                        React.createElement('div', { className: 'text-[#10B981] text-sm' }, ''),
                        React.createElement('span', { className: 'text-[#10B981] text-sm' }, `Cập nhật từ Admin: ${lastSync}`)
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
                        React.createElement('h2', { className: 'text-3xl font-bold text-[#121212] mb-4 flex items-center justify-center gap-3' },
                            React.createElement('span', { className: 'text-4xl' }, ''),
                            'Liên Hệ Mua Gói'
                        ),
                        selectedPackage && React.createElement('div', { className: 'bg-[#FFF3EE] border border-[#E36323]/20 rounded-lg p-4' },
                            React.createElement('div', { className: 'text-[#E36323] font-semibold' },
                                `Bạn đã chọn: ${packages[selectedPackage]?.name}`
                            ),
                            React.createElement('div', { className: 'text-[#E36323] text-sm' },
                                'Vui lòng liên hệ Admin qua một trong các kênh dưới đây'
                            )
                        )
                    ),

                    // Contact Methods
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-6 mb-8' },
                        // Zalo
                        React.createElement('div', { className: 'text-center p-6 bg-[#ECFDF5] rounded-lg border border-[#10B981]/20' },
                            React.createElement('div', { className: 'text-4xl mb-3' }, ''),
                            React.createElement('h3', { className: 'text-xl font-bold text-[#10B981] mb-2' }, 'Zalo'),
                            React.createElement('div', { className: 'text-[#10B981] font-mono text-lg' }, contactInfo.zalo_number),
                            React.createElement('div', { className: 'text-sm text-[#059669] mt-2' }, 'Phản hồi nhanh nhất')
                        ),

                        // Telegram
                        React.createElement('div', { className: 'text-center p-6 bg-[#FFF3EE] rounded-lg border border-[#E36323]/20' },
                            React.createElement('div', { className: 'text-4xl mb-3' }, ''),
                            React.createElement('h3', { className: 'text-xl font-bold text-[#E36323] mb-2' }, 'Telegram'),
                            React.createElement('div', { className: 'text-[#E36323] font-mono text-lg' }, contactInfo.telegram_username),
                            React.createElement('div', { className: 'text-sm text-[#E36323] mt-2' }, 'Hỗ trợ 24/7')
                        ),

                        // Hotline
                        React.createElement('div', { className: 'text-center p-6 bg-[#FFF5F5] rounded-lg border border-[#FE5938]/20' },
                            React.createElement('div', { className: 'text-4xl mb-3' }, ''),
                            React.createElement('h3', { className: 'text-xl font-bold text-[#FE5938] mb-2' }, 'Hotline'),
                            React.createElement('div', { className: 'text-[#FE5938] font-mono text-lg' }, contactInfo.hotline),
                            React.createElement('div', { className: 'text-sm text-[#FE5938] mt-2' }, 'Gọi trực tiếp')
                        )
                    ),

                    // Working Hours & Payment Info
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-6 mb-8' },
                        React.createElement('div', { className: 'bg-[#F8F7F7] rounded-lg p-6' },
                            React.createElement('h4', { className: 'font-bold text-[#121212] mb-3 flex items-center gap-2' },
                                React.createElement('span', { className: 'text-2xl' }, ''),
                                'Giờ Làm Việc'
                            ),
                            React.createElement('div', { className: 'text-[#121212]' }, contactInfo.working_hours)
                        ),

                        React.createElement('div', { className: 'bg-[#F8F7F7] rounded-lg p-6' },
                            React.createElement('h4', { className: 'font-bold text-[#121212] mb-3 flex items-center gap-2' },
                                React.createElement('span', { className: 'text-2xl' }, ''),
                                'Phương Thức Thanh Toán'
                            ),
                            React.createElement('ul', { className: 'text-[#121212] space-y-1' },
                                contactInfo.payment_methods.map((method, index) =>
                                    React.createElement('li', { key: index }, `• ${method}`)
                                )
                            )
                        )
                    )
                ),

                // Purchase Flow
                React.createElement('div', { className: 'bg-[#FFF3EE] rounded-lg p-8 mb-12' },
                    React.createElement('h2', { className: 'text-2xl font-bold text-[#E36323] mb-6 text-center flex items-center justify-center gap-3' },
                        React.createElement('span', { className: 'text-3xl' }, ''),
                        'Quy Trình Mua Gói'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-5 gap-4' },
                        (contactInfo.purchase_steps || [
                            { step: 1, title: 'Chọn Gói', desc: 'Chọn gói phù hợp với nhu cầu', icon: '' },
                            { step: 2, title: 'Liên Hệ', desc: 'Liên hệ Admin qua Zalo/Telegram', icon: '' },
                            { step: 3, title: 'Xác Nhận', desc: 'Admin xác nhận và báo giá', icon: '' },
                            { step: 4, title: 'Thanh Toán', desc: 'Thanh toán theo hướng dẫn', icon: '' },
                            { step: 5, title: 'Kích Hoạt', desc: 'Nhận tài khoản và sử dụng', icon: '' }
                        ]).map((item, index) =>
                            React.createElement('div', {
                                key: index,
                                className: 'text-center p-4 bg-white rounded-lg shadow-sm'
                            },
                                React.createElement('div', { className: 'text-3xl mb-2' }, item.icon),
                                React.createElement('div', { className: 'font-bold text-[#E36323] mb-1' }, 
                                    `${item.step}. ${item.title}`
                                ),
                                React.createElement('div', { className: 'text-sm text-[#E36323]' }, item.desc)
                            )
                        )
                    )
                ),

                // Important Notes
                React.createElement('div', { className: 'bg-[#FFF9E6] border border-[#F59E0B]/20 rounded-lg p-6' },
                    React.createElement('h3', { className: 'text-xl font-bold text-[#F59E0B] mb-4 flex items-center gap-2' },
                        React.createElement('span', { className: 'text-2xl' }, ''),
                        'Lưu Ý Quan Trọng'
                    ),
                    React.createElement('ul', { className: 'space-y-2 text-[#F59E0B]' },
                        contactInfo.notes.map((note, index) =>
                            React.createElement('li', { key: index }, `• ${note}`)
                        )
                    )
                )
            ),

            // Footer
            React.createElement('footer', { className: 'bg-[#121212] text-white py-8' },
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 text-center' },
                    React.createElement('div', { className: 'flex items-center justify-center gap-2 mb-4' },
                        React.createElement('div', { className: 'text-2xl' }, ''),
                        React.createElement('span', { className: 'text-xl font-bold' }, 'Hệ Thống Đối Soát Lô Đề B2B')
                    ),
                    React.createElement('p', { className: 'text-[#7B7B7B] mb-2' },
                        'Giải pháp tự động hóa cho đại lý lô đề'
                    ),
                    React.createElement('p', { className: 'text-[#7B7B7B] text-sm' },
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
    
    console.log(' Pricing Page component loaded successfully');

})(); 