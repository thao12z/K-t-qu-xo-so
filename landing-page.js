(function() {
    'use strict';
    
    const { useState, useCallback, useEffect, memo } = React;
    
    console.log('🏠 Landing Page v2.2.0 - Fixed Data Sync');

    // Landing Page Component
    const LandingPage = memo(({ onNavigate }) => {
        const [packages, setPackages] = useState([]);
        const [paymentConfig, setPaymentConfig] = useState(null);
        const [showRegisterForm, setShowRegisterForm] = useState(false);
        const [selectedPackage, setSelectedPackage] = useState(null);
        const [currentStep, setCurrentStep] = useState(1); // 1: register, 2: payment, 3: confirmation
        const [selectedPaymentMethod, setSelectedPaymentMethod] = useState(null);
        const [paymentProof, setPaymentProof] = useState(null);
        const [registerData, setRegisterData] = useState({
            fullName: '',
            username: '',
            email: '',
            phone: '',
            password: '',
            confirmPassword: ''
        });

        // Load packages from admin
        useEffect(() => {
            const loadAdminData = () => {
                // Load packages
                const adminPackages = localStorage.getItem('adminPackages');
                if (adminPackages) {
                    try {
                        const parsedPackages = JSON.parse(adminPackages);
                        const activePackages = parsedPackages.filter(pkg => pkg.active);
                        setPackages(activePackages);
                        console.log('📦 Loaded', activePackages.length, 'packages from admin');
                    } catch (error) {
                        console.error('Error parsing packages:', error);
                    }
                }

                // Load payment config
                const adminPaymentConfig = localStorage.getItem('admin_paymentConfig');
                if (adminPaymentConfig) {
                    try {
                        const parsedConfig = JSON.parse(adminPaymentConfig);
                        if (parsedConfig.length > 0) {
                            setPaymentConfig(parsedConfig[0]);
                            console.log('💳 Loaded payment config');
                        }
                    } catch (error) {
                        console.error('Error parsing payment config:', error);
                    }
                } else {
                    // Try alternative key
                    const altConfig = localStorage.getItem('paymentConfig');
                    if (altConfig) {
                        try {
                            const parsedConfig = JSON.parse(altConfig);
                            if (parsedConfig.length > 0) {
                                setPaymentConfig(parsedConfig[0]);
                            }
                        } catch (error) {
                            console.error('Error parsing alt payment config:', error);
                        }
                    }
                }
            };

            loadAdminData();

            // Listen for admin data changes
            const handleStorageChange = (e) => {
                if (e.key === 'adminPackages' || e.key === 'admin_paymentConfig' || e.key === 'admin_packages') {
                    console.log('📦 [LandingPage] Storage change detected:', e.key);
                    loadAdminData();
                }
            };

            const handleAdminDataChange = (e) => {
                console.log('📡 [LandingPage] Admin data change event:', e.detail);
                if (e.detail && (e.detail.type === 'packages' || e.detail.type === 'paymentConfig')) {
                    loadAdminData();
                }
            };

            window.addEventListener('storage', handleStorageChange);
            window.addEventListener('adminDataChanged', handleAdminDataChange);

            return () => {
                window.removeEventListener('storage', handleStorageChange);
                window.removeEventListener('adminDataChanged', handleAdminDataChange);
            };
        }, []);

        const handleLogin = useCallback(() => {
            onNavigate('login');
        }, [onNavigate]);

        const handleBuyPackage = useCallback((pkg) => {
            setSelectedPackage(pkg);
            setShowRegisterForm(true);
        }, []);

        const handleRegisterSubmit = useCallback((e) => {
            e.preventDefault();
            
            // Basic validation
            if (!registerData.fullName || !registerData.username || !registerData.email || 
                !registerData.phone || !registerData.password) {
                alert('Vui lòng điền đầy đủ thông tin');
                return;
            }

            if (registerData.password !== registerData.confirmPassword) {
                alert('Mật khẩu xác nhận không khớp');
                return;
            }

            // Move to payment step
            setCurrentStep(2);
        }, [registerData]);

        const handlePaymentMethodSelect = useCallback((method) => {
            setSelectedPaymentMethod(method);
        }, []);

        const handlePaymentSubmit = useCallback((e) => {
            e.preventDefault();
            
            if (!selectedPaymentMethod) {
                alert('Vui lòng chọn phương thức thanh toán');
                return;
            }

            // Create payment record
            const paymentRecord = {
                id: Date.now(),
                userId: `user_${Date.now()}`,
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                amount: selectedPackage.price,
                method: selectedPaymentMethod.id,
                methodName: selectedPaymentMethod.name,
                status: 'pending',
                createdAt: new Date().toISOString(),
                userInfo: registerData,
                paymentProof: paymentProof,
                source: 'user_registration'
            };

            // Create user request
            const userRequest = {
                id: paymentRecord.userId,
                ...registerData,
                packageId: selectedPackage.id,
                packageName: selectedPackage.name,
                packagePrice: selectedPackage.price,
                status: 'pending_payment',
                createdAt: new Date().toISOString(),
                source: 'landing_page',
                paymentId: paymentRecord.id
            };

            // Save to admin system
            const pendingUsers = JSON.parse(localStorage.getItem('adminPendingUsers') || '[]');
            const pendingPayments = JSON.parse(localStorage.getItem('adminPendingPayments') || '[]');
            
            pendingUsers.unshift(userRequest);
            pendingPayments.unshift(paymentRecord);
            
            localStorage.setItem('adminPendingUsers', JSON.stringify(pendingUsers));
            localStorage.setItem('adminPendingPayments', JSON.stringify(pendingPayments));

            // Move to confirmation step
            setCurrentStep(3);
        }, [registerData, selectedPackage, selectedPaymentMethod, paymentProof]);

        const handleFormClose = useCallback(() => {
            setShowRegisterForm(false);
            setCurrentStep(1);
            setSelectedPaymentMethod(null);
            setPaymentProof(null);
            setRegisterData({
                fullName: '', username: '', email: '', phone: '', password: '', confirmPassword: ''
            });
        }, []);

        const handleInputChange = useCallback((field, value) => {
            setRegisterData(prev => ({ ...prev, [field]: value }));
        }, []);

        const formatCurrency = useCallback((amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        }, []);

        const openTelegram = useCallback(() => {
            if (paymentConfig?.telegramId) {
                window.open(`https://t.me/${paymentConfig.telegramId}`, '_blank');
            } else if (paymentConfig?.bankInfo?.telegramId) {
                window.open(`https://t.me/${paymentConfig.bankInfo.telegramId}`, '_blank');
            }
        }, [paymentConfig]);

        const handlePaymentProofUpload = useCallback((event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    setPaymentProof({
                        file: file,
                        dataUrl: e.target.result,
                        name: file.name,
                        size: file.size,
                        type: file.type
                    });
                };
                reader.readAsDataURL(file);
            }
        }, []);

        const getAvailablePaymentMethods = useCallback(() => {
            if (!paymentConfig) return [];
            
            const methods = [];
            
            // Bank Transfer
            if (paymentConfig.paymentMethods?.bank_transfer?.enabled || paymentConfig.bankInfo?.enabled) {
                methods.push({
                    id: 'bank_transfer',
                    name: 'Chuyển khoản ngân hàng',
                    icon: '🏦',
                    type: 'bank',
                    config: paymentConfig.bankInfo
                });
            }
            
            // QR Codes
            if (paymentConfig.paymentMethods?.qr_code?.enabled) {
                // Check for QR codes matching the package
                Object.entries(paymentConfig.qrCodes || {}).forEach(([packageType, qrConfig]) => {
                    if (qrConfig.enabled && qrConfig.url) {
                        methods.push({
                            id: `qr_${packageType}`,
                            name: `QR Code (${packageType})`,
                            icon: '📱',
                            type: 'qr',
                            config: qrConfig
                        });
                    }
                });
            }
            
            return methods;
        }, [paymentConfig]);

        return React.createElement('div', { className: 'min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100' },
            // Header - Simple logo + login
            React.createElement('header', { className: 'bg-white shadow-sm' },
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-4' },
                    React.createElement('div', { className: 'flex items-center justify-between' },
                        React.createElement('div', { className: 'flex items-center gap-2' },
                            React.createElement('div', { className: 'text-2xl' }, '🎯'),
                            React.createElement('h1', { className: 'text-xl font-bold text-gray-800' }, 'Hệ Thống Đối Soát Lô Đề')
                        ),
                        React.createElement('button', {
                            className: 'px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium',
                            onClick: handleLogin
                        }, 'Đăng Nhập')
                    )
                )
            ),

            // Main Content
            React.createElement('main', { className: 'max-w-7xl mx-auto px-4 py-8' },
                // Admin Contact Info (if available)
                paymentConfig && React.createElement('div', { className: 'bg-white p-6 rounded-lg shadow-md mb-8' },
                    React.createElement('div', { className: 'text-center' },
                        React.createElement('h2', { className: 'text-2xl font-bold text-gray-900 mb-4' }, 'Liên Hệ Admin'),
                        
                        // Telegram info
                        (paymentConfig.telegramId || paymentConfig.bankInfo?.telegramId) && React.createElement('div', { className: 'mb-4' },
                            React.createElement('p', { className: 'text-gray-600 mb-2' }, 'Telegram Admin:'),
                            React.createElement('button', {
                                className: 'px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-medium inline-flex items-center gap-2',
                                onClick: openTelegram
                            }, 
                                React.createElement('span', {}, '📱'),
                                `@${paymentConfig.telegramId || paymentConfig.bankInfo?.telegramId || 'admin'}`
                            )
                        ),
                        
                        // Bank info if available
                        paymentConfig.bankInfo && paymentConfig.bankInfo.enabled && React.createElement('div', { className: 'text-sm text-gray-600' },
                            paymentConfig.bankInfo.bankName && React.createElement('p', {}, `Ngân hàng: ${paymentConfig.bankInfo.bankName}`),
                            paymentConfig.bankInfo.accountNumber && React.createElement('p', {}, `STK: ${paymentConfig.bankInfo.accountNumber}`),
                            paymentConfig.bankInfo.accountName && React.createElement('p', {}, `Chủ TK: ${paymentConfig.bankInfo.accountName}`)
                        )
                    )
                ),

                // Packages Section
                React.createElement('div', { className: 'mb-8' },
                    React.createElement('h2', { className: 'text-3xl font-bold text-center text-gray-900 mb-8' }, 'Gói Dịch Vụ'),
                    
                    packages.length > 0 ? 
                        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' },
                            packages.map(pkg => 
                                React.createElement('div', {
                                    key: pkg.id,
                                    className: `bg-white rounded-lg shadow-lg p-6 relative ${pkg.popular ? 'ring-2 ring-blue-500 transform scale-105' : ''}`
                                },
                                    // Popular badge
                                    pkg.popular && React.createElement('div', {
                                        className: 'absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-bold'
                                    }, 'PHỔ BIẾN'),

                                    // Package info
                                    React.createElement('div', { className: 'text-center mb-6' },
                                        React.createElement('h3', { className: 'text-xl font-bold text-gray-900 mb-2' }, pkg.name),
                                        React.createElement('div', { className: 'text-3xl font-bold text-blue-600 mb-2' }, 
                                            formatCurrency(pkg.price)
                                        ),
                                        React.createElement('div', { className: 'text-sm text-gray-600' }, 
                                            `Thời hạn: ${pkg.duration} ngày`
                                        )
                                    ),

                                    // Features
                                    pkg.features && pkg.features.length > 0 && React.createElement('ul', { className: 'space-y-2 mb-6' },
                                        pkg.features.map((feature, idx) =>
                                            React.createElement('li', {
                                                key: idx,
                                                className: 'flex items-center gap-2 text-sm text-gray-700'
                                            },
                                                React.createElement('span', { className: 'text-green-500' }, '✓'),
                                                feature
                                            )
                                        )
                                    ),

                                    // Buy button
                                    React.createElement('button', {
                                        className: `w-full py-3 px-4 rounded-lg font-semibold transition-all ${
                                            pkg.popular 
                                                ? 'bg-blue-600 text-white hover:bg-blue-700' 
                                                : 'bg-gray-800 text-white hover:bg-gray-900'
                                        }`,
                                        onClick: () => handleBuyPackage(pkg)
                                    }, 'Mua Gói')
                                )
                            )
                        ) :
                        React.createElement('div', { className: 'text-center py-16' },
                            React.createElement('div', { className: 'text-6xl mb-4' }, '📦'),
                            React.createElement('h3', { className: 'text-xl font-semibold text-gray-700 mb-2' }, 'Chưa có gói dịch vụ'),
                            React.createElement('p', { className: 'text-gray-500 mb-4' }, 'Admin chưa tạo gói dịch vụ nào.'),
                            paymentConfig && React.createElement('p', { className: 'text-blue-600' }, 'Vui lòng liên hệ Admin qua Telegram để được tư vấn.')
                        )
                )
            ),

            // Multi-step Registration & Payment Modal
            showRegisterForm && React.createElement('div', { 
                className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4' 
            },
                React.createElement('div', { className: 'bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto' },
                    React.createElement('div', { className: 'p-6' },
                        // Header with step indicator
                        React.createElement('div', { className: 'flex justify-between items-center mb-6' },
                            React.createElement('div', {},
                                React.createElement('h3', { className: 'text-xl font-bold' }, 
                                    currentStep === 1 ? `Đăng ký ${selectedPackage?.name}` :
                                    currentStep === 2 ? 'Thanh toán' : 'Xác nhận'
                                ),
                                React.createElement('div', { className: 'flex items-center mt-2 space-x-2' },
                                    React.createElement('div', { className: `w-3 h-3 rounded-full ${currentStep >= 1 ? 'bg-blue-500' : 'bg-gray-300'}` }),
                                    React.createElement('div', { className: 'w-8 h-0.5 bg-gray-300' }),
                                    React.createElement('div', { className: `w-3 h-3 rounded-full ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-300'}` }),
                                    React.createElement('div', { className: 'w-8 h-0.5 bg-gray-300' }),
                                    React.createElement('div', { className: `w-3 h-3 rounded-full ${currentStep >= 3 ? 'bg-blue-500' : 'bg-gray-300'}` })
                                )
                            ),
                            React.createElement('button', {
                                className: 'text-gray-400 hover:text-gray-600 text-2xl',
                                onClick: handleFormClose
                            }, '×')
                        ),

                        // Step 1: Registration Form
                        currentStep === 1 && React.createElement('form', { onSubmit: handleRegisterSubmit, className: 'space-y-4' },
                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Họ tên *'),
                                React.createElement('input', {
                                    type: 'text',
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    value: registerData.fullName,
                                    onChange: (e) => handleInputChange('fullName', e.target.value),
                                    required: true
                                })
                            ),

                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Tên đăng nhập *'),
                                React.createElement('input', {
                                    type: 'text',
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    value: registerData.username,
                                    onChange: (e) => handleInputChange('username', e.target.value),
                                    required: true
                                })
                            ),

                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Email *'),
                                React.createElement('input', {
                                    type: 'email',
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    value: registerData.email,
                                    onChange: (e) => handleInputChange('email', e.target.value),
                                    required: true
                                })
                            ),

                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Số điện thoại *'),
                                React.createElement('input', {
                                    type: 'tel',
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    value: registerData.phone,
                                    onChange: (e) => handleInputChange('phone', e.target.value),
                                    required: true
                                })
                            ),

                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Mật khẩu *'),
                                React.createElement('input', {
                                    type: 'password',
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    value: registerData.password,
                                    onChange: (e) => handleInputChange('password', e.target.value),
                                    required: true
                                })
                            ),

                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-1' }, 'Xác nhận mật khẩu *'),
                                React.createElement('input', {
                                    type: 'password',
                                    className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                                    value: registerData.confirmPassword,
                                    onChange: (e) => handleInputChange('confirmPassword', e.target.value),
                                    required: true
                                })
                            ),

                            // Package info
                            React.createElement('div', { className: 'bg-gray-50 p-4 rounded-md' },
                                React.createElement('h4', { className: 'font-medium text-gray-900 mb-2' }, 'Thông tin gói đã chọn:'),
                                React.createElement('p', { className: 'text-sm text-gray-600' }, 
                                    `${selectedPackage?.name} - ${formatCurrency(selectedPackage?.price || 0)}`
                                ),
                                React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, 
                                    `Thời hạn: ${selectedPackage?.duration} ngày`
                                )
                            ),

                            React.createElement('div', { className: 'flex gap-3 pt-4' },
                                React.createElement('button', {
                                    type: 'button',
                                    className: 'flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50',
                                    onClick: handleFormClose
                                }, 'Hủy'),
                                React.createElement('button', {
                                    type: 'submit',
                                    className: 'flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700'
                                }, 'Tiếp tục')
                            )
                        ),

                        // Step 2: Payment Method Selection
                        currentStep === 2 && React.createElement('form', { onSubmit: handlePaymentSubmit, className: 'space-y-4' },
                            React.createElement('div', { className: 'bg-blue-50 p-4 rounded-md mb-4' },
                                React.createElement('h4', { className: 'font-medium text-blue-900 mb-2' }, 'Thông tin thanh toán'),
                                React.createElement('p', { className: 'text-sm text-blue-800' }, 
                                    `Gói: ${selectedPackage?.name}`
                                ),
                                React.createElement('p', { className: 'text-sm text-blue-800' }, 
                                    `Số tiền: ${formatCurrency(selectedPackage?.price || 0)}`
                                )
                            ),

                            React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-3' }, 'Chọn phương thức thanh toán *'),
                                React.createElement('div', { className: 'space-y-3' },
                                    getAvailablePaymentMethods().map(method => 
                                        React.createElement('div', {
                                            key: method.id,
                                            className: `border rounded-lg p-4 cursor-pointer transition-colors ${
                                                selectedPaymentMethod?.id === method.id 
                                                    ? 'border-blue-500 bg-blue-50' 
                                                    : 'border-gray-300 hover:border-gray-400'
                                            }`,
                                            onClick: () => handlePaymentMethodSelect(method)
                                        },
                                            React.createElement('div', { className: 'flex items-center gap-3' },
                                                React.createElement('input', {
                                                    type: 'radio',
                                                    name: 'paymentMethod',
                                                    checked: selectedPaymentMethod?.id === method.id,
                                                    onChange: () => handlePaymentMethodSelect(method),
                                                    className: 'text-blue-600'
                                                }),
                                                React.createElement('span', { className: 'text-2xl' }, method.icon),
                                                React.createElement('div', {},
                                                    React.createElement('div', { className: 'font-medium text-gray-900' }, method.name),
                                                    method.type === 'bank' && method.config && React.createElement('div', { className: 'text-sm text-gray-600' },
                                                        `${method.config.bankName} - ${method.config.accountNumber}`
                                                    )
                                                )
                                            )
                                        )
                                    )
                                )
                            ),

                            // Payment Details
                            selectedPaymentMethod && React.createElement('div', { className: 'bg-gray-50 p-4 rounded-md' },
                                React.createElement('h4', { className: 'font-medium text-gray-900 mb-3' }, 'Thông tin chuyển khoản'),
                                
                                selectedPaymentMethod.type === 'bank' && selectedPaymentMethod.config && React.createElement('div', { className: 'space-y-2 text-sm' },
                                    selectedPaymentMethod.config.bankName && React.createElement('p', {}, 
                                        React.createElement('strong', {}, 'Ngân hàng: '), selectedPaymentMethod.config.bankName
                                    ),
                                    selectedPaymentMethod.config.accountNumber && React.createElement('p', {}, 
                                        React.createElement('strong', {}, 'Số tài khoản: '), selectedPaymentMethod.config.accountNumber
                                    ),
                                    selectedPaymentMethod.config.accountName && React.createElement('p', {}, 
                                        React.createElement('strong', {}, 'Tên tài khoản: '), selectedPaymentMethod.config.accountName
                                    ),
                                    React.createElement('p', {}, 
                                        React.createElement('strong', {}, 'Số tiền: '), formatCurrency(selectedPackage?.price || 0)
                                    ),
                                    React.createElement('p', { className: 'text-red-600 font-medium' }, 
                                        'Nội dung CK: ', `${registerData.fullName} - ${selectedPackage?.name}`
                                    )
                                ),

                                selectedPaymentMethod.type === 'qr' && selectedPaymentMethod.config?.url && React.createElement('div', { className: 'text-center' },
                                    React.createElement('p', { className: 'text-sm text-gray-600 mb-3' }, 'Quét mã QR để thanh toán'),
                                    React.createElement('img', {
                                        src: selectedPaymentMethod.config.url,
                                        alt: 'QR Code Payment',
                                        className: 'mx-auto max-w-48 max-h-48 border rounded-lg'
                                    })
                                )
                            ),

                            // Payment Proof Upload
                            selectedPaymentMethod && React.createElement('div', {},
                                React.createElement('label', { className: 'block text-sm font-medium text-gray-700 mb-2' }, 'Tải lên bằng chứng thanh toán'),
                                React.createElement('input', {
                                    type: 'file',
                                    accept: 'image/*',
                                    onChange: handlePaymentProofUpload,
                                    className: 'block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100'
                                }),
                                paymentProof && React.createElement('div', { className: 'mt-2' },
                                    React.createElement('img', {
                                        src: paymentProof.dataUrl,
                                        alt: 'Payment Proof',
                                        className: 'max-w-32 max-h-32 border rounded-lg'
                                    }),
                                    React.createElement('p', { className: 'text-xs text-gray-500 mt-1' }, paymentProof.name)
                                )
                            ),

                            React.createElement('div', { className: 'flex gap-3 pt-4' },
                                React.createElement('button', {
                                    type: 'button',
                                    className: 'flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50',
                                    onClick: () => setCurrentStep(1)
                                }, 'Quay lại'),
                                React.createElement('button', {
                                    type: 'submit',
                                    className: 'flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700',
                                    disabled: !selectedPaymentMethod
                                }, 'Xác nhận thanh toán')
                            )
                        ),

                        // Step 3: Confirmation
                        currentStep === 3 && React.createElement('div', { className: 'text-center py-8' },
                            React.createElement('div', { className: 'text-6xl mb-4' }, '✅'),
                            React.createElement('h3', { className: 'text-xl font-bold text-green-900 mb-4' }, 'Đăng ký thành công!'),
                            React.createElement('div', { className: 'bg-green-50 p-4 rounded-md mb-6' },
                                React.createElement('p', { className: 'text-sm text-green-800 mb-2' }, 
                                    `Gói: ${selectedPackage?.name}`
                                ),
                                React.createElement('p', { className: 'text-sm text-green-800 mb-2' }, 
                                    `Số tiền: ${formatCurrency(selectedPackage?.price || 0)}`
                                ),
                                React.createElement('p', { className: 'text-sm text-green-800' }, 
                                    `Phương thức: ${selectedPaymentMethod?.name}`
                                )
                            ),
                            React.createElement('div', { className: 'text-sm text-gray-600 mb-6' },
                                React.createElement('p', { className: 'mb-2' }, 'Yêu cầu đăng ký và thanh toán đã được gửi đến Admin.'),
                                React.createElement('p', { className: 'mb-2' }, 'Admin sẽ xác nhận thanh toán và kích hoạt tài khoản trong vòng 24h.'),
                                paymentConfig?.bankInfo?.telegramId && React.createElement('p', {}, 
                                    'Liên hệ Admin qua Telegram nếu cần hỗ trợ: @', 
                                    paymentConfig.bankInfo.telegramId
                                )
                            ),
                            React.createElement('button', {
                                className: 'px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700',
                                onClick: handleFormClose
                            }, 'Đóng')
                        )
                    )
                )
            )
        );
    });

    // Export to window
    window.LandingPage = LandingPage;
    console.log('✅ Landing Page v2.2.0 loaded successfully');

})(); 