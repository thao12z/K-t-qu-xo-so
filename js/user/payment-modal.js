// 💳 PAYMENT MODAL - User Payment Flow with Order ID Generation
// Version: 2.0.0 | Created: 2024
(function() {
    'use strict';

    const { useState, useEffect, useCallback, memo } = React;

    console.log('💳 PaymentModal v2.0.0 loaded - Order ID Generation');

    // Generate unique Order ID
    const generateOrderId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORDER${timestamp}${random}`;
    };

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND'
        }).format(amount);
    };

    // Parse price string to number (e.g., "199k" -> 199000)
    const parsePrice = (priceStr) => {
        if (typeof priceStr === 'number') return priceStr;
        if (!priceStr) return 0;

        const cleaned = priceStr.toLowerCase().replace(/[^\d.km]/g, '');
        let value = parseFloat(cleaned) || 0;

        if (priceStr.toLowerCase().includes('k')) {
            value *= 1000;
        } else if (priceStr.toLowerCase().includes('m')) {
            value *= 1000000;
        }

        return value;
    };

    // Payment Modal Component
    const PaymentModal = memo(({ isOpen, onClose, selectedPackage, paymentConfig }) => {
        const [orderId, setOrderId] = useState('');
        const [paymentMethod, setPaymentMethod] = useState('qr_code');
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [paymentCreated, setPaymentCreated] = useState(false);
        const [config, setConfig] = useState(null);

        // Generate Order ID when modal opens
        useEffect(() => {
            if (isOpen && selectedPackage) {
                const newOrderId = generateOrderId();
                setOrderId(newOrderId);
                setPaymentCreated(false);
                console.log('💳 Generated Order ID:', newOrderId);
            }
        }, [isOpen, selectedPackage]);

        // Load payment config
        useEffect(() => {
            if (paymentConfig) {
                setConfig(paymentConfig);
            } else if (window.SharedDataService) {
                const adminConfig = window.SharedDataService.getPaymentConfig();
                if (adminConfig) {
                    setConfig(adminConfig);
                }
            }
        }, [paymentConfig]);

        // Copy to clipboard
        const copyToClipboard = useCallback((text, label) => {
            navigator.clipboard.writeText(text).then(() => {
                alert(`Đã copy ${label}: ${text}`);
            }).catch(() => {
                // Fallback for older browsers
                const textarea = document.createElement('textarea');
                textarea.value = text;
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
                alert(`Đã copy ${label}: ${text}`);
            });
        }, []);

        // Create pending payment
        const handleCreatePayment = useCallback(() => {
            if (!selectedPackage || !orderId) return;

            setIsSubmitting(true);

            try {
                const currentUser = window.AuthService?.getCurrentUser();
                const amount = parsePrice(selectedPackage.price);

                // Create payment record
                const paymentRecord = {
                    id: Date.now(),
                    orderId: orderId,
                    userId: currentUser?.id || 'guest',
                    packageId: selectedPackage.id,
                    packageName: selectedPackage.name,
                    amount: amount,
                    method: paymentMethod,
                    transferContent: orderId,
                    status: 'pending',
                    createdAt: new Date().toISOString(),
                    userInfo: {
                        username: currentUser?.username || 'guest',
                        fullName: currentUser?.fullName || 'Guest User',
                        email: currentUser?.email || '',
                        phone: currentUser?.phone || ''
                    }
                };

                // Save to localStorage for admin to see
                const existingPayments = JSON.parse(localStorage.getItem('adminPendingPayments') || '[]');
                existingPayments.push(paymentRecord);
                localStorage.setItem('adminPendingPayments', JSON.stringify(existingPayments));

                // Also save to GlobalStateManager if available
                if (window.GlobalStateManager) {
                    const payments = window.GlobalStateManager.getData('payments') || [];
                    payments.push(paymentRecord);
                    window.GlobalStateManager.updateData('payments', payments, 'PaymentModal');
                }

                console.log('✅ Payment record created:', paymentRecord);
                setPaymentCreated(true);

            } catch (error) {
                console.error('Error creating payment:', error);
                alert('Lỗi tạo giao dịch. Vui lòng thử lại.');
            } finally {
                setIsSubmitting(false);
            }
        }, [selectedPackage, orderId, paymentMethod]);

        if (!isOpen || !selectedPackage) return null;

        const bankInfo = config?.bankInfo || {
            bankName: 'Chưa cấu hình',
            accountNumber: 'Chưa cấu hình',
            accountName: 'Chưa cấu hình'
        };

        const qrCodeUrl = config?.qrCodes?.main?.url || null;
        const amount = parsePrice(selectedPackage.price);

        return React.createElement('div', {
            className: 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4'
        },
            React.createElement('div', {
                className: 'bg-white rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto'
            },
                // Header
                React.createElement('div', {
                    className: 'bg-[#E36323] text-white p-4 rounded-t-lg'
                },
                    React.createElement('div', { className: 'flex justify-between items-center' },
                        React.createElement('h2', { className: 'text-xl font-bold' }, '💳 Thanh Toán'),
                        React.createElement('button', {
                            onClick: onClose,
                            className: 'text-white hover:text-gray-200 text-2xl'
                        }, '×')
                    )
                ),

                // Content
                React.createElement('div', { className: 'p-6 space-y-6' },
                    // Package Info
                    React.createElement('div', { className: 'bg-[#FFF3EE] rounded-lg p-4' },
                        React.createElement('h3', { className: 'font-bold text-[#E36323] mb-2' }, selectedPackage.name),
                        React.createElement('div', { className: 'text-2xl font-bold text-[#E36323]' }, formatCurrency(amount)),
                        React.createElement('div', { className: 'text-sm text-[#E36323]' }, `Thời hạn: ${selectedPackage.duration_days} ngày`)
                    ),

                    // Order ID - CRITICAL
                    React.createElement('div', { className: 'bg-[#FEF3C7] border-2 border-[#F59E0B] rounded-lg p-4' },
                        React.createElement('h4', { className: 'font-bold text-[#F59E0B] mb-2 flex items-center gap-2' },
                            React.createElement('span', {}, '⚠️'),
                            'MÃ GIAO DỊCH (Nội dung CK)'
                        ),
                        React.createElement('div', {
                            className: 'bg-white border-2 border-dashed border-[#F59E0B] rounded p-3 text-center'
                        },
                            React.createElement('div', {
                                className: 'font-mono text-xl font-bold text-[#E36323] select-all'
                            }, orderId),
                            React.createElement('button', {
                                onClick: () => copyToClipboard(orderId, 'Mã giao dịch'),
                                className: 'mt-2 text-sm text-[#E36323] hover:text-[#DF5A18] underline'
                            }, '📋 Copy mã')
                        ),
                        React.createElement('p', { className: 'text-xs text-[#F59E0B] mt-2 text-center' },
                            'Vui lòng ghi chính xác mã này vào nội dung chuyển khoản'
                        )
                    ),

                    // Payment Method Tabs
                    React.createElement('div', { className: 'border-b border-gray-200' },
                        React.createElement('div', { className: 'flex' },
                            React.createElement('button', {
                                onClick: () => setPaymentMethod('qr_code'),
                                className: `flex-1 py-2 px-4 text-sm font-medium ${
                                    paymentMethod === 'qr_code'
                                        ? 'border-b-2 border-[#E36323] text-[#E36323]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`
                            }, '📱 QR Code'),
                            React.createElement('button', {
                                onClick: () => setPaymentMethod('bank_transfer'),
                                className: `flex-1 py-2 px-4 text-sm font-medium ${
                                    paymentMethod === 'bank_transfer'
                                        ? 'border-b-2 border-[#E36323] text-[#E36323]'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`
                            }, '🏦 Chuyển khoản')
                        )
                    ),

                    // Payment Details
                    paymentMethod === 'qr_code' ? (
                        // QR Code
                        React.createElement('div', { className: 'text-center' },
                            qrCodeUrl ? (
                                React.createElement('div', {},
                                    React.createElement('img', {
                                        src: qrCodeUrl,
                                        alt: 'QR Code',
                                        className: 'mx-auto w-48 h-48 border-2 border-gray-200 rounded-lg'
                                    }),
                                    React.createElement('p', { className: 'text-sm text-gray-600 mt-2' },
                                        'Quét mã QR để thanh toán'
                                    )
                                )
                            ) : (
                                React.createElement('div', { className: 'bg-gray-100 p-8 rounded-lg' },
                                    React.createElement('p', { className: 'text-gray-500' },
                                        'QR Code chưa được cấu hình. Vui lòng sử dụng chuyển khoản.'
                                    )
                                )
                            )
                        )
                    ) : (
                        // Bank Transfer
                        React.createElement('div', { className: 'space-y-3' },
                            React.createElement('div', { className: 'bg-gray-50 rounded-lg p-4' },
                                React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-sm' },
                                    React.createElement('span', { className: 'text-gray-600' }, 'Ngân hàng:'),
                                    React.createElement('span', { className: 'font-medium' }, bankInfo.bankName),

                                    React.createElement('span', { className: 'text-gray-600' }, 'Số tài khoản:'),
                                    React.createElement('div', { className: 'flex items-center gap-2' },
                                        React.createElement('span', { className: 'font-mono font-medium' }, bankInfo.accountNumber),
                                        React.createElement('button', {
                                            onClick: () => copyToClipboard(bankInfo.accountNumber, 'STK'),
                                            className: 'text-[#E36323] hover:text-[#DF5A18] text-xs'
                                        }, '📋')
                                    ),

                                    React.createElement('span', { className: 'text-gray-600' }, 'Chủ TK:'),
                                    React.createElement('span', { className: 'font-medium' }, bankInfo.accountName),

                                    React.createElement('span', { className: 'text-gray-600' }, 'Số tiền:'),
                                    React.createElement('span', { className: 'font-bold text-[#E36323]' }, formatCurrency(amount)),

                                    React.createElement('span', { className: 'text-gray-600' }, 'Nội dung:'),
                                    React.createElement('div', { className: 'flex items-center gap-2' },
                                        React.createElement('span', { className: 'font-mono font-bold text-[#E36323]' }, orderId),
                                        React.createElement('button', {
                                            onClick: () => copyToClipboard(orderId, 'Nội dung'),
                                            className: 'text-[#E36323] hover:text-[#DF5A18] text-xs'
                                        }, '📋')
                                    )
                                )
                            )
                        )
                    ),

                    // Action Buttons
                    !paymentCreated ? (
                        React.createElement('div', { className: 'space-y-3' },
                            React.createElement('button', {
                                onClick: handleCreatePayment,
                                disabled: isSubmitting,
                                className: 'w-full py-3 bg-[#E36323] text-white rounded-lg font-semibold hover:bg-[#DF5A18] disabled:opacity-50'
                            }, isSubmitting ? '⏳ Đang xử lý...' : '✅ Đã chuyển khoản'),
                            React.createElement('p', { className: 'text-xs text-gray-500 text-center' },
                                'Nhấn nút sau khi đã chuyển khoản để gửi thông báo cho Admin'
                            )
                        )
                    ) : (
                        React.createElement('div', { className: 'bg-[#ECFDF5] border border-[#10B981] rounded-lg p-4 text-center' },
                            React.createElement('div', { className: 'text-3xl mb-2' }, '✅'),
                            React.createElement('h4', { className: 'font-bold text-[#10B981] mb-2' }, 'Đã ghi nhận!'),
                            React.createElement('p', { className: 'text-sm text-[#10B981]' },
                                'Admin sẽ xác nhận và kích hoạt gói trong thời gian sớm nhất.'
                            ),
                            React.createElement('p', { className: 'text-xs text-[#059669] mt-2' },
                                `Mã giao dịch: ${orderId}`
                            )
                        )
                    ),

                    // Contact Info
                    React.createElement('div', { className: 'text-center text-sm text-gray-500' },
                        React.createElement('p', {}, 'Cần hỗ trợ? Liên hệ Admin qua Zalo/Telegram'),
                        config?.bankInfo?.telegramId && React.createElement('p', { className: 'text-[#E36323]' },
                            `Telegram: @${config.bankInfo.telegramId}`
                        )
                    )
                )
            )
        );
    });

    // Export to global scope
    window.PaymentModal = PaymentModal;

    console.log('✅ PaymentModal component loaded');

})();
