// 💳 PAYMENT MODAL COMPONENT
// Version: 1.0.0 | Created: 2024 | Handles unified QR code payment with order IDs
(function() {
    'use strict';
    
    const { useState, useEffect, useCallback, memo } = React;
    
    // ===== ORDER ID GENERATOR =====
    const generateOrderId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORDER${timestamp}${random}`;
    };
    
    // ===== PAYMENT MODAL COMPONENT =====
    const PaymentModal = memo(({ 
        isOpen, 
        onClose, 
        selectedPackage, 
        paymentConfig = null 
    }) => {
        const [selectedMethod, setSelectedMethod] = useState('qr_code');
        const [showQR, setShowQR] = useState(false);
        const [loading, setLoading] = useState(false);
        const [orderId, setOrderId] = useState('');
        
        // Generate order ID when modal opens
        useEffect(() => {
            if (isOpen && selectedPackage) {
                setOrderId(generateOrderId());
            }
        }, [isOpen, selectedPackage]);
        
        // Load payment config from admin
        useEffect(() => {
            if (!paymentConfig && window.SharedDataService) {
                const config = window.SharedDataService.getPaymentConfig();
                if (config && config.qrCodes && config.qrCodes.main) {
                    setShowQR(true);
                }
            }
        }, [paymentConfig]);
        
        // Handle payment method selection
        const handleMethodSelect = useCallback((method) => {
            setSelectedMethod(method);
            if (method === 'qr_code') {
                setShowQR(true);
            } else {
                setShowQR(false);
            }
        }, []);
        
        // Handle payment submission
        const handlePaymentSubmit = useCallback(async () => {
            if (!selectedPackage || !orderId) return;
            
            setLoading(true);
            
            try {
                // Create payment record with order ID
                const paymentData = {
                    id: Date.now(),
                    orderId: orderId,
                    userId: window.currentUser?.id || 'guest',
                    packageId: selectedPackage.id,
                    amount: selectedPackage.price,
                    method: selectedMethod,
                    status: 'pending',
                    packageType: selectedPackage.id,
                    createdAt: new Date().toISOString(),
                    packageName: selectedPackage.name,
                    packageDuration: selectedPackage.duration_days,
                    transferContent: `Thanh toan goi ${selectedPackage.name} ${orderId}`
                };
                
                // Save to localStorage for admin to process
                const existingPayments = JSON.parse(localStorage.getItem('pendingPayments') || '[]');
                existingPayments.push(paymentData);
                localStorage.setItem('pendingPayments', JSON.stringify(existingPayments));
                
                // Notify admin system
                window.dispatchEvent(new CustomEvent('newPaymentCreated', {
                    detail: paymentData
                }));
                
                // Show success message
                if (window.GlobalStateManager) {
                    window.GlobalStateManager.addNotification(
                        `✅ Đã tạo yêu cầu thanh toán cho ${selectedPackage.name} (Mã: ${orderId})`,
                        'success',
                        'PaymentModal'
                    );
                }
                
                // Close modal after delay
                setTimeout(() => {
                    onClose();
                    setLoading(false);
                }, 2000);
                
            } catch (error) {
                console.error('❌ Payment submission failed:', error);
                setLoading(false);
            }
        }, [selectedPackage, selectedMethod, orderId, onClose]);
        
        if (!isOpen || !selectedPackage) return null;
        
        // Get payment config
        const config = paymentConfig || (window.SharedDataService ? window.SharedDataService.getPaymentConfig() : null);
        const qrCode = config?.qrCodes?.main;
        
        // Generate transfer content with order ID
        const transferContent = `Thanh toan goi ${selectedPackage.name} ${orderId}`;
        
        return (
            <window.Modal
                isOpen={isOpen}
                onClose={onClose}
                title="💳 Thanh Toán Gói"
                size="large"
            >
                <div className="space-y-6">
                    {/* Package Info */}
                    <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="font-bold text-blue-900 mb-2">
                            📦 {selectedPackage.name}
                        </h3>
                        <div className="text-blue-700">
                            <p>💰 Giá: {selectedPackage.price}</p>
                            <p>⏱️ Thời hạn: {selectedPackage.duration_days} ngày</p>
                            <p>🎯 Mục tiêu: {selectedPackage.target}</p>
                            <p className="font-bold text-orange-600">🆔 Mã đơn hàng: {orderId}</p>
                        </div>
                    </div>
                    
                    {/* Payment Methods */}
                    <div>
                        <h4 className="font-bold text-gray-900 mb-3">💳 Chọn phương thức thanh toán:</h4>
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { id: 'qr_code', name: 'QR Code', icon: '📱', enabled: qrCode?.enabled },
                                { id: 'bank_transfer', name: 'Chuyển khoản', icon: '🏦', enabled: config?.paymentMethods?.bank_transfer?.enabled },
                                { id: 'cash', name: 'Tiền mặt', icon: '💰', enabled: config?.paymentMethods?.cash?.enabled },
                                { id: 'contact', name: 'Liên hệ Admin', icon: '📞', enabled: true }
                            ].filter(method => method.enabled).map(method => (
                                <button
                                    key={method.id}
                                    onClick={() => handleMethodSelect(method.id)}
                                    className={`p-4 border rounded-lg text-center transition-colors ${
                                        selectedMethod === method.id
                                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <div className="text-2xl mb-2">{method.icon}</div>
                                    <div className="font-medium">{method.name}</div>
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {/* QR Code Display */}
                    {selectedMethod === 'qr_code' && showQR && qrCode?.url && (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                            <h4 className="font-bold text-green-900 mb-4 flex items-center gap-2">
                                📱 QR Code Thanh Toán
                            </h4>
                            
                            <div className="flex flex-col md:flex-row items-center gap-6">
                                {/* QR Code */}
                                <div className="text-center">
                                    <img
                                        src={qrCode.url}
                                        alt="QR Code"
                                        className="w-48 h-48 border-4 border-green-200 rounded-lg"
                                    />
                                    <p className="text-sm text-green-700 mt-2">
                                        Scan QR để thanh toán
                                    </p>
                                </div>
                                
                                {/* Payment Info */}
                                <div className="flex-1">
                                    <div className="bg-white rounded-lg p-4 border">
                                        <h5 className="font-bold text-gray-900 mb-3">
                                            📋 Thông tin thanh toán
                                        </h5>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span>Gói:</span>
                                                <span className="font-medium">{selectedPackage.name}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Giá:</span>
                                                <span className="font-medium text-green-600">{selectedPackage.price}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Thời hạn:</span>
                                                <span className="font-medium">{selectedPackage.duration_days} ngày</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Phương thức:</span>
                                                <span className="font-medium">QR Code</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Mã đơn hàng:</span>
                                                <span className="font-medium font-mono text-orange-600">{orderId}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                                            <p className="text-sm text-yellow-800">
                                                ⚠️ Sau khi chuyển tiền, vui lòng liên hệ Admin để xác nhận
                                            </p>
                                            <p className="text-sm text-yellow-800 mt-1">
                                                📝 Nội dung chuyển khoản sẽ tự động: <span className="font-mono">{transferContent}</span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Bank Transfer Info */}
                    {selectedMethod === 'bank_transfer' && config?.bankInfo && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                            <h4 className="font-bold text-blue-900 mb-4 flex items-center gap-2">
                                🏦 Thông tin chuyển khoản
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Ngân hàng:</label>
                                    <p className="font-medium">{config.bankInfo.bankName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Số tài khoản:</label>
                                    <p className="font-medium font-mono">{config.bankInfo.accountNumber}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Tên tài khoản:</label>
                                    <p className="font-medium">{config.bankInfo.accountName}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-700">Chi nhánh:</label>
                                    <p className="font-medium">{config.bankInfo.branch}</p>
                                </div>
                            </div>
                            
                            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
                                <p className="text-sm text-yellow-800">
                                    💰 Số tiền: <span className="font-bold">{selectedPackage.price}</span>
                                </p>
                                <p className="text-sm text-yellow-800 mt-1">
                                    📝 Nội dung: <span className="font-mono">{transferContent}</span>
                                </p>
                                <p className="text-sm text-yellow-800 mt-1">
                                    🆔 Mã đơn hàng: <span className="font-mono text-orange-600">{orderId}</span>
                                </p>
                            </div>
                        </div>
                    )}
                    
                    {/* Contact Admin */}
                    {selectedMethod === 'contact' && (
                        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                            <h4 className="font-bold text-purple-900 mb-4 flex items-center gap-2">
                                📞 Liên hệ Admin
                            </h4>
                            
                            <div className="space-y-3">
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">📱</span>
                                    <div>
                                        <p className="font-medium">Zalo/Telegram</p>
                                        <p className="text-sm text-gray-600">@admin_lode_b2b</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-3">
                                    <span className="text-2xl">☎️</span>
                                    <div>
                                        <p className="font-medium">Hotline</p>
                                        <p className="text-sm text-gray-600">1900.1234</p>
                                    </div>
                                </div>
                                
                                <div className="mt-4 p-3 bg-blue-50 rounded border border-blue-200">
                                    <p className="text-sm text-blue-800">
                                        💬 Vui lòng nhắn tin với thông tin: Gói {selectedPackage.name} - {selectedPackage.price} - Mã: {orderId}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                    
                    {/* Action Buttons */}
                    <div className="flex justify-end space-x-3">
                        <window.Button
                            onClick={onClose}
                            variant="secondary"
                            disabled={loading}
                        >
                            ❌ Hủy
                        </window.Button>
                        
                        <window.Button
                            onClick={handlePaymentSubmit}
                            variant="primary"
                            loading={loading}
                        >
                            {loading ? '⏳ Đang xử lý...' : '✅ Xác nhận thanh toán'}
                        </window.Button>
                    </div>
                </div>
            </window.Modal>
        );
    });
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.PaymentModal = PaymentModal;
    
    console.log('✅ PaymentModal component loaded successfully');
    
})();
