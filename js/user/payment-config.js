// ⚙️ PAYMENT CONFIG MODULE
// Version: 1.1.0 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
// ✅ UPDATED: QR Code UI Simplified for Single QR Logic
(function() {
    'use strict';
    
    console.log('🔄 [PaymentConfig] Loading version 1.1.0 - QR UI Updated');
    
    const { useState, useEffect, useCallback, memo } = React;
    
    // ===== PAYMENT CONFIG COMPONENT =====
    const PaymentConfig = memo(() => {
        const [config, setConfig] = useState({
            bankInfo: {
                bankName: '',
                accountNumber: '',
                accountName: '',
                branch: '',
                swiftCode: '',
                telegramId: '',
                enabled: true
            },
            qrCodes: {
                // ✅ CHUNG MỘT QR CHO TẤT CẢ GÓI
                main: { 
                    url: '', 
                    enabled: true,
                    description: 'QR Code chung cho tất cả gói'
                }
            },
            businessRules: {
                minAmount: 10000,
                maxAmount: 10000000,
                processingFee: 0,
                processingTime: 'instant',
                autoApprove: false
            },
            paymentMethods: {
                bank_transfer: { enabled: true, name: 'Bank Transfer', icon: '🏦' },
                qr_code: { enabled: true, name: 'QR Code', icon: '📱' },
                bank_card: { enabled: true, name: 'Bank Card', icon: '💳' },
                cash: { enabled: true, name: 'Cash', icon: '💰' }
            }
        });
        
        const [loading, setLoading] = useState(true);
        const [activeTab, setActiveTab] = useState('bank');
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
        const [isSaving, setIsSaving] = useState(false);
        
        // Load config from global state
        useEffect(() => {
            if (!window.GlobalStateManager) {
                console.error('❌ [PaymentConfig] GlobalStateManager not available');
                return;
            }
            
            console.log('🔄 [PaymentConfig] COMPONENT_MOUNT');
            
            // Load initial config
            const savedConfig = window.GlobalStateManager.getData('paymentConfig');
            if (savedConfig && savedConfig.length > 0) {
                setConfig(savedConfig[0]);
            }
            setLoading(false);
            
            // Subscribe to changes
            const unsubscribe = window.GlobalStateManager.subscribe('paymentConfig', (newConfig) => {
                console.log('🔄 [PaymentConfig] CONFIG_UPDATE');
                if (newConfig && newConfig.length > 0) {
                    setConfig(newConfig[0]);
                }
            }, 'PaymentConfig');
            
            return () => {
                unsubscribe();
                console.log('🔄 [PaymentConfig] COMPONENT_UNMOUNT');
            };
        }, []);
        
        // Auto-save with debounce
        const autoSave = useCallback(() => {
            if (hasUnsavedChanges) {
                try {
                    window.GlobalStateManager.updateData('paymentConfig', [config], 'PaymentConfig');
                    setHasUnsavedChanges(false);
                    console.log('🔄 [PaymentConfig] AUTO_SAVED');
                } catch (error) {
                    console.error('❌ [PaymentConfig] AUTO_SAVE_ERROR', { error });
                }
            }
        }, [config, hasUnsavedChanges]);

        // Manual save with feedback
        const saveConfig = useCallback(() => {
            if (!hasUnsavedChanges) {
                window.GlobalStateManager.addNotification(
                    'ℹ️ No changes to save',
                    'info',
                    'PaymentConfig'
                );
                return;
            }

            setIsSaving(true);
            try {
                window.GlobalStateManager.updateData('paymentConfig', [config], 'PaymentConfig');
                setHasUnsavedChanges(false);
                window.GlobalStateManager.addNotification(
                    '✅ Payment configuration saved successfully!',
                    'success',
                    'PaymentConfig'
                );
                console.log('🔄 [PaymentConfig] CONFIG_SAVED');
            } catch (error) {
                console.error('❌ [PaymentConfig] SAVE_ERROR', { error });
                window.GlobalStateManager.addNotification(
                    '❌ Failed to save payment configuration',
                    'error',
                    'PaymentConfig'
                );
            } finally {
                setIsSaving(false);
            }
        }, [config, hasUnsavedChanges]);

        // Auto-save effect
        useEffect(() => {
            if (hasUnsavedChanges) {
                const timeoutId = setTimeout(autoSave, 2000); // Auto-save after 2 seconds
                return () => clearTimeout(timeoutId);
            }
        }, [autoSave, hasUnsavedChanges]);
        
        // Update bank info
        const updateBankInfo = useCallback((field, value) => {
            setConfig(prev => ({
                ...prev,
                bankInfo: {
                    ...prev.bankInfo,
                    [field]: value
                }
            }));
            setHasUnsavedChanges(true);
        }, []);
        
        // Update QR code
        const updateQrCode = useCallback((field, value) => {
            setConfig(prev => ({
                ...prev,
                qrCodes: {
                    ...prev.qrCodes,
                    main: {
                        ...prev.qrCodes.main,
                        [field]: value
                    }
                }
            }));
            setHasUnsavedChanges(true);
        }, []);
        
        // Update business rules
        const updateBusinessRules = useCallback((field, value) => {
            setConfig(prev => ({
                ...prev,
                businessRules: {
                    ...prev.businessRules,
                    [field]: value
                }
            }));
            setHasUnsavedChanges(true);
        }, []);
        
        // Toggle payment method
        const togglePaymentMethod = useCallback((method) => {
            setConfig(prev => ({
                ...prev,
                paymentMethods: {
                    ...prev.paymentMethods,
                    [method]: {
                        ...prev.paymentMethods[method],
                        enabled: !prev.paymentMethods[method].enabled
                    }
                }
            }));
            setHasUnsavedChanges(true);
        }, []);
        
        // Handle file upload for QR codes
        const handleQrCodeUpload = useCallback((event) => {
            const file = event.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (e) => {
                    updateQrCode('url', e.target.result);
                };
                reader.readAsDataURL(file);
            }
        }, [updateQrCode]);
        
        if (loading) {
            return <window.LoadingSpinner size="large" message="Loading payment configuration..." />;
        }
        
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">⚙️ Payment Configuration</h1>
                    <div className="flex items-center space-x-3">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                ⚠️ Unsaved changes
                            </span>
                        )}
                        <window.Button
                            onClick={saveConfig}
                            variant={hasUnsavedChanges ? "primary" : "secondary"}
                            disabled={isSaving}
                        >
                            {isSaving ? '💾 Saving...' : hasUnsavedChanges ? '💾 Save Changes' : '💾 Save Configuration'}
                        </window.Button>
                    </div>
                </div>
                
                {/* Tab Navigation */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        {[
                            { id: 'bank', label: '🏦 Bank Info', icon: '🏦' },
                            { id: 'qr', label: '📱 QR Codes', icon: '📱' },
                            { id: 'methods', label: '💳 Payment Methods', icon: '💳' },
                            { id: 'rules', label: '📋 Business Rules', icon: '📋' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                                    activeTab === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {tab.icon} {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>
                
                {/* Tab Content */}
                <div className="mt-6">
                    {/* Bank Info Tab */}
                    {activeTab === 'bank' && (
                        <window.Card title="Bank Transfer Configuration">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <window.Input
                                    label="Bank Name"
                                    placeholder="Enter bank name"
                                    value={config.bankInfo.bankName}
                                    onChange={(value) => updateBankInfo('bankName', value)}
                                />
                                
                                <window.Input
                                    label="Account Number"
                                    placeholder="Enter account number"
                                    value={config.bankInfo.accountNumber}
                                    onChange={(value) => updateBankInfo('accountNumber', value)}
                                />
                                
                                <window.Input
                                    label="Account Name"
                                    placeholder="Enter account holder name"
                                    value={config.bankInfo.accountName}
                                    onChange={(value) => updateBankInfo('accountName', value)}
                                />
                                
                                <window.Input
                                    label="Branch"
                                    placeholder="Enter branch name"
                                    value={config.bankInfo.branch}
                                    onChange={(value) => updateBankInfo('branch', value)}
                                />
                                
                                <window.Input
                                    label="SWIFT Code"
                                    placeholder="Enter SWIFT code"
                                    value={config.bankInfo.swiftCode}
                                    onChange={(value) => updateBankInfo('swiftCode', value)}
                                />
                                
                                <window.Input
                                    label="Telegram ID (for customer contact)"
                                    placeholder="Enter telegram username (without @)"
                                    value={config.bankInfo.telegramId}
                                    onChange={(value) => updateBankInfo('telegramId', value)}
                                />
                                
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={config.bankInfo.enabled}
                                        onChange={(e) => updateBankInfo('enabled', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Enable Bank Transfer</span>
                                </div>
                            </div>
                        </window.Card>
                    )}
                    
                    {/* QR Codes Tab - UPDATED UI */}
                    {activeTab === 'qr' && (
                        <window.Card title="QR Code Configuration">
                            <div className="space-y-6">
                                {/* ✅ THÔNG TIN ĐƠN GIẢN */}
                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <h4 className="font-medium text-blue-900 mb-2">🎯 QR Code Duy Nhất</h4>
                                    <p className="text-sm text-blue-700">
                                        Chỉ cần upload 1 QR Code duy nhất. Hệ thống sẽ tự động hiển thị QR này cho tất cả gói khi người dùng thanh toán.
                                    </p>
                                </div>
                                
                                {/* QR Code Upload - ĐƠN GIẢN */}
                                <div className="border rounded-lg p-6">
                                    <div className="text-center mb-6">
                                        <h4 className="text-lg font-medium text-gray-900 mb-2">
                                            📱 QR Code Thanh Toán
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Upload QR Code của bạn để người dùng có thể thanh toán
                                        </p>
                                    </div>
                                    
                                    <div className="space-y-6">
                                        {/* Upload Section */}
                                        <div className="text-center">
                                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 hover:border-blue-400 transition-colors">
                                                <div className="space-y-4">
                                                    <div className="text-4xl">📱</div>
                                                    <div>
                                                        <label className="cursor-pointer">
                                                            <input
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleQrCodeUpload}
                                                                className="hidden"
                                                            />
                                                            <span className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                                                                Chọn File QR Code
                                                            </span>
                                                        </label>
                                                    </div>
                                                    <p className="text-xs text-gray-500">
                                                        Hỗ trợ: PNG, JPG, JPEG
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Preview Section */}
                                        {config.qrCodes.main.url && (
                                            <div className="text-center">
                                                <h5 className="font-medium text-gray-900 mb-4">QR Code Preview</h5>
                                                <div className="inline-block">
                                                    <img
                                                        src={config.qrCodes.main.url}
                                                        alt="QR Code"
                                                        className="w-40 h-40 border-2 border-gray-200 rounded-lg shadow-lg"
                                                    />
                                                    <div className="mt-3 text-sm text-green-600">
                                                        ✅ QR Code đã sẵn sàng sử dụng
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Enable/Disable */}
                                        <div className="text-center">
                                            <label className="flex items-center justify-center space-x-2 cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    checked={config.qrCodes.main.enabled}
                                                    onChange={(e) => updateQrCode('enabled', e.target.checked)}
                                                    className="rounded"
                                                />
                                                <span className="text-sm font-medium">
                                                    {config.qrCodes.main.enabled ? '✅ QR Code đang hoạt động' : '❌ QR Code đã tắt'}
                                                </span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* ✅ HƯỚNG DẪN SỬ DỤNG */}
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <h4 className="font-medium text-green-900 mb-3">📋 Cách hoạt động</h4>
                                    <div className="text-sm text-green-700 space-y-2">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-600">1.</span>
                                            <span>Người dùng chọn gói và phương thức "QR Code"</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-600">2.</span>
                                            <span>Hệ thống hiển thị QR này + thông tin gói</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-600">3.</span>
                                            <span>Người dùng scan QR và chuyển tiền</span>
                                        </div>
                                        <div className="flex items-start space-x-2">
                                            <span className="text-green-600">4.</span>
                                            <span>Admin xác nhận thanh toán</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </window.Card>
                    )}
                    
                    {/* Payment Methods Tab */}
                    {activeTab === 'methods' && (
                        <window.Card title="Payment Methods Configuration">
                            <div className="space-y-4">
                                {Object.entries(config.paymentMethods).map(([method, methodConfig]) => (
                                    <div key={method} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <span className="text-2xl">{methodConfig.icon}</span>
                                            <div>
                                                <h4 className="font-medium text-gray-900">{methodConfig.name}</h4>
                                                <p className="text-sm text-gray-500">Method ID: {method}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center space-x-3">
                                            <window.Badge variant={methodConfig.enabled ? 'success' : 'error'}>
                                                {methodConfig.enabled ? 'Enabled' : 'Disabled'}
                                            </window.Badge>
                                            
                                            <window.Button
                                                size="small"
                                                variant={methodConfig.enabled ? 'warning' : 'success'}
                                                onClick={() => togglePaymentMethod(method)}
                                            >
                                                {methodConfig.enabled ? 'Disable' : 'Enable'}
                                            </window.Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </window.Card>
                    )}
                    
                    {/* Business Rules Tab */}
                    {activeTab === 'rules' && (
                        <window.Card title="Business Rules Configuration">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <window.Input
                                    label="Minimum Amount (VND)"
                                    type="number"
                                    placeholder="Enter minimum amount"
                                    value={config.businessRules.minAmount}
                                    onChange={(value) => updateBusinessRules('minAmount', parseInt(value) || 0)}
                                />
                                
                                <window.Input
                                    label="Maximum Amount (VND)"
                                    type="number"
                                    placeholder="Enter maximum amount"
                                    value={config.businessRules.maxAmount}
                                    onChange={(value) => updateBusinessRules('maxAmount', parseInt(value) || 0)}
                                />
                                
                                <window.Input
                                    label="Processing Fee (%)"
                                    type="number"
                                    placeholder="Enter processing fee"
                                    value={config.businessRules.processingFee}
                                    onChange={(value) => updateBusinessRules('processingFee', parseFloat(value) || 0)}
                                />
                                
                                <window.Select
                                    label="Processing Time"
                                    value={config.businessRules.processingTime}
                                    onChange={(value) => updateBusinessRules('processingTime', value)}
                                    options={[
                                        { value: 'instant', label: 'Instant' },
                                        { value: '5min', label: '5 minutes' },
                                        { value: '15min', label: '15 minutes' },
                                        { value: '1hour', label: '1 hour' },
                                        { value: '24hours', label: '24 hours' }
                                    ]}
                                />
                                
                                <div className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={config.businessRules.autoApprove}
                                        onChange={(e) => updateBusinessRules('autoApprove', e.target.checked)}
                                        className="rounded"
                                    />
                                    <span className="text-sm">Auto-approve payments</span>
                                </div>
                            </div>
                        </window.Card>
                    )}
                </div>
            </div>
        );
    });
    
    // ===== TESTING FUNCTIONS =====
    const TestPaymentConfig = {
        testComponentRender: () => {
            console.assert(window.PaymentConfig, '❌ PaymentConfig not exported');
            console.log('✅ [TEST] PaymentConfig component exists');
        },
        
        testDataFlow: () => {
            // Test payment config operations
            const testConfig = {
                bankInfo: {
                    bankName: 'Test Bank',
                    accountNumber: '1234567890',
                    accountName: 'Test Account',
                    branch: 'Test Branch',
                    swiftCode: 'TESTUS33',
                    enabled: true
                },
                qrCodes: {
                    main: { 
                        url: 'data:image/png;base64,test', 
                        enabled: true,
                        description: 'QR Code chung cho tất cả gói'
                    }
                },
                businessRules: {
                    minAmount: 10000,
                    maxAmount: 10000000,
                    processingFee: 0,
                    processingTime: 'instant',
                    autoApprove: false
                },
                paymentMethods: {
                    bank_transfer: { enabled: true, name: 'Bank Transfer', icon: '🏦' },
                    qr_code: { enabled: true, name: 'QR Code', icon: '📱' },
                    bank_card: { enabled: true, name: 'Bank Card', icon: '💳' },
                    cash: { enabled: true, name: 'Cash', icon: '💰' }
                }
            };
            
            window.GlobalStateManager.updateData('paymentConfig', [testConfig], 'Test');
            
            const retrieved = window.GlobalStateManager.getData('paymentConfig');
            console.assert(retrieved.length > 0 && retrieved[0].bankInfo.bankName === 'Test Bank', '❌ Payment config data flow failed');
            
            console.log('✅ [TEST] Payment config data flow works');
        }
    };
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.PaymentConfig = PaymentConfig;
    window.TestPaymentConfig = TestPaymentConfig;
    
    // Auto-run tests
    setTimeout(() => {
        TestPaymentConfig.testComponentRender();
        if (window.GlobalStateManager) {
            TestPaymentConfig.testDataFlow();
        }
    }, 140);
    
})(); 