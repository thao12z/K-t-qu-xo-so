// 🌐 GLOBAL STATE MANAGER - FOUNDATION MODULE
// Version: 1.0.0 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';
    
    // ===== GLOBAL STATE MANAGER IMPLEMENTATION =====
    const GlobalStateManager = {
        // ✅ REQUIRED - Internal state storage
        _state: {
            users: [],
            payments: [],
            packages: [],
            notifications: [],
            paymentConfig: []
        },
        
        // ✅ REQUIRED - Subscriber management
        _subscribers: {},
        
        // Debug flag
        _debug: true,
        
        // ===== CORE METHODS =====
        
        getData: function(key) {
            if (!this._state.hasOwnProperty(key)) {
                console.warn(`⚠️ [GlobalState] Invalid key: ${key}`);
                return [];
            }
            return [...this._state[key]];
        },
        
        updateData: function(key, newData, source = 'Unknown') {
            if (!this._state.hasOwnProperty(key)) {
                console.error(`❌ [GlobalState] Invalid key: ${key}`);
                return false;
            }
            
            const oldCount = this._state[key].length;
            this._state[key] = Array.isArray(newData) ? [...newData] : newData;
            
            if (this._debug) {
                console.log(`🔄 [GlobalState] UPDATE ${key}`, { 
                    source, 
                    oldCount, 
                    newCount: this._state[key].length,
                    timestamp: new Date().toISOString()
                });
            }
            
            this._notifySubscribers(key, this._state[key]);
            this._saveToStorage(key, this._state[key]);
            return true;
        },
        
        subscribe: function(key, callback, componentName = 'Unknown') {
            if (!this._subscribers[key]) {
                this._subscribers[key] = [];
            }
            
            const subscription = { 
                callback, 
                componentName, 
                id: Date.now() + Math.random() 
            };
            
            this._subscribers[key].push(subscription);
            
            if (this._debug) {
                console.log(`🔔 [GlobalState] SUBSCRIBE ${key}`, { 
                    componentName,
                    totalSubscribers: this._subscribers[key].length
                });
            }
            
            // Return unsubscribe function
            return () => this._unsubscribe(key, subscription.id);
        },
        
        // ===== BUSINESS LOGIC HELPERS =====
        
        findUser: function(userId) {
            return this._state.users.find(u => u.id == userId);
        },
        
        findPayment: function(paymentId) {
            return this._state.payments.find(p => p.id == paymentId);
        },
        
        findPackage: function(packageId) {
            return this._state.packages.find(p => p.id === packageId);
        },
        
        getNextUserId: function() {
            const users = this._state.users;
            if (users.length === 0) return 1;
            
            // Filter out any non-numeric IDs and get the maximum
            const numericIds = users
                .map(u => u.id)
                .filter(id => typeof id === 'number' && Number.isInteger(id) && id > 0);
            
            if (numericIds.length === 0) return 1;
            
            return Math.max(...numericIds) + 1;
        },
        
        getNextPaymentId: function() {
            const payments = this._state.payments;
            if (payments.length === 0) return 1;
            
            // Filter out any non-numeric IDs and get the maximum
            const numericIds = payments
                .map(p => p.id)
                .filter(id => typeof id === 'number' && Number.isInteger(id) && id > 0);
            
            if (numericIds.length === 0) return 1;
            
            return Math.max(...numericIds) + 1;
        },
        
        // Fix user IDs that are not numbers
        fixUserIds: function() {
            const users = this._state.users;
            let hasChanges = false;
            
            const fixedUsers = users.map((user, index) => {
                // Check if ID is not a valid number
                if (typeof user.id !== 'number' || !Number.isInteger(user.id) || user.id <= 0) {
                    console.warn(`⚠️ [GlobalState] Fixing invalid user ID: ${user.id} for user: ${user.username}`);
                    hasChanges = true;
                    return {
                        ...user,
                        id: index + 1 // Assign sequential ID
                    };
                }
                return user;
            });
            
            if (hasChanges) {
                this.updateData('users', fixedUsers, 'FixUserIds');
                console.log('✅ [GlobalState] Fixed user IDs');
            }
            
            return hasChanges;
        },
        
        addNotification: function(message, type = 'info', source = 'System') {
            const notification = {
                id: Date.now() + Math.random(),
                message,
                type, // success, error, warning, info
                timestamp: new Date().toISOString(),
                read: false,
                source
            };
            
            const currentNotifications = this._state.notifications;
            const newNotifications = [notification, ...currentNotifications.slice(0, 49)];
            
            this.updateData('notifications', newNotifications, source);
            return notification.id;
        },
        
        // ===== ATOMIC OPERATIONS =====
        
        updatePaymentAndUser: function(paymentId, userId, activationData, source = 'PaymentApproval') {
            if (this._debug) {
                console.log(`🔄 [GlobalState] ATOMIC_UPDATE_START`, { paymentId, userId, source });
            }
            
            const success = this._atomicUpdate(() => {
                // Update payment
                const updatedPayments = this._state.payments.map(p =>
                    p.id == paymentId ? {
                        ...p,
                        status: 'completed',
                        approvedAt: new Date().toISOString(),
                        approvedBy: 'admin'
                    } : p
                );
                
                // Update user
                const updatedUsers = this._state.users.map(u =>
                    u.id == userId ? {
                        ...u,
                        status: 'active',
                        subscriptionType: activationData.packageId,
                        subscriptionPackage: activationData.packageName,
                        subscriptionStatus: 'active', // Add this field
                        subscriptionExpiry: activationData.expiryDate,
                        activatedAt: new Date().toISOString(),
                        activatedBy: source
                    } : u
                );
                
                // Apply both updates
                this.updateData('payments', updatedPayments, source);
                this.updateData('users', updatedUsers, source);
            });
            
            if (success) {
                this.addNotification(
                    `✅ Payment approved and user activated: ${activationData.userName}`,
                    'success',
                    source
                );
                
                if (this._debug) {
                    console.log(`✅ [GlobalState] ATOMIC_UPDATE_SUCCESS`, { paymentId, userId });
                }
            }
            
            return success;
        },
        
        // ===== PRIVATE METHODS =====
        
        _atomicUpdate: function(updateFunction) {
            try {
                updateFunction.call(this);
                return true;
            } catch (error) {
                console.error('❌ [GlobalState] Atomic update failed:', error);
                this.addNotification('❌ System error occurred', 'error', 'GlobalState');
                return false;
            }
        },
        
        _notifySubscribers: function(key, newData) {
            if (this._subscribers[key]) {
                this._subscribers[key].forEach((sub, index) => {
                    try {
                        if (this._debug) {
                            console.log(`📤 [GlobalState] NOTIFY ${key} → ${sub.componentName}`);
                        }
                        sub.callback([...newData]);
                    } catch (error) {
                        console.error(`❌ [GlobalState] Subscriber error in ${sub.componentName}:`, error);
                    }
                });
            }
        },
        
        _unsubscribe: function(key, subscriptionId) {
            if (this._subscribers[key]) {
                this._subscribers[key] = this._subscribers[key].filter(sub => sub.id !== subscriptionId);
                
                if (this._debug) {
                    console.log(`🔕 [GlobalState] UNSUBSCRIBE ${key}`, { 
                        remainingSubscribers: this._subscribers[key].length 
                    });
                }
            }
        },
        
        _saveToStorage: function(key, data) {
            try {
                const dataToSave = key === 'notifications' ? data.slice(0, 50) : data;
                
                // ✅ SAVE ALL IMPORTANT DATA WITH USER-COMPATIBLE KEYS
                if (key === 'users') {
                    // Save for admin system
                    localStorage.setItem('admin_users', JSON.stringify(dataToSave));
                    localStorage.setItem('adminUsers', JSON.stringify(dataToSave));
                    
                    // ✅ CRITICAL: Save for user auth system
                    localStorage.setItem('registeredUsers', JSON.stringify(dataToSave));
                    
                    console.log(`💾 [GlobalState] USERS saved to multiple keys`, { count: dataToSave.length });
                }
                
                if (key === 'packages') {
                    // Save for admin system
                    localStorage.setItem('admin_packages', JSON.stringify(dataToSave));
                    
                    // ✅ CRITICAL: Save for user system
                    localStorage.setItem('adminPackages', JSON.stringify(dataToSave));
                    
                    console.log(`💾 [GlobalState] PACKAGES saved to user system`, { count: dataToSave.length });
                }
                
                if (key === 'notifications') {
                    localStorage.setItem('admin_notifications', JSON.stringify(dataToSave));
                    localStorage.setItem('adminNotifications', JSON.stringify(dataToSave));
                }
                
                if (key === 'payments') {
                    localStorage.setItem('admin_payments', JSON.stringify(dataToSave));
                    localStorage.setItem('adminPayments', JSON.stringify(dataToSave));
                }
                
                // Special handling for payment config
                if (key === 'paymentConfig') {
                    localStorage.setItem('admin_paymentConfig', JSON.stringify(data));
                    localStorage.setItem('paymentConfig', JSON.stringify(data));
                }
                
                // ✅ BROADCAST: Notify user system about ALL changes
                try {
                    window.dispatchEvent(new CustomEvent('adminDataChanged', {
                        detail: { 
                            type: key,
                            data: dataToSave,
                            timestamp: new Date().toISOString()
                        }
                    }));
                    console.log(`📡 [GlobalState] BROADCAST ${key} changes to user system`);
                } catch (broadcastError) {
                    console.warn('⚠️ [GlobalState] Broadcast failed:', broadcastError);
                }
                
                if (this._debug) {
                    console.log(`💾 [GlobalState] SAVE ${key}`, { count: Array.isArray(dataToSave) ? dataToSave.length : 'N/A' });
                }
            } catch (error) {
                console.warn(`⚠️ [GlobalState] Storage failed for ${key}:`, error);
            }
        },
        
        _loadFromStorage: function() {
            try {
                ['users', 'notifications'].forEach(key => {
                    // ✅ FIX: Load từ cả hai key formats
                    const keyMapping = {
                        'users': 'adminUsers',
                        'notifications': 'adminNotifications'
                    };
                    const newKey = keyMapping[key];
                    const oldKey = `admin_${key}`;
                    
                    const saved = localStorage.getItem(newKey) || localStorage.getItem(oldKey);
                    if (saved) {
                        this._state[key] = JSON.parse(saved);
                        
                        if (this._debug) {
                            console.log(`📂 [GlobalState] LOAD ${key} from ${newKey || oldKey}`, { count: this._state[key].length });
                        }
                    }
                });
            } catch (error) {
                console.error('❌ [GlobalState] Load from storage failed:', error);
            }
        },
        
        // ===== INITIALIZATION =====
        
        init: function() {
            console.log('🚀 [GlobalStateManager] Initializing...');
            
            // Load data from localStorage
            this._loadFromStorage();
            
            // Fix any invalid user IDs
            this.fixUserIds();
            
            // Setup storage event listener
            window.addEventListener('storage', (e) => {
                if (this._validKeys.includes(e.key)) {
                    console.log(`📡 [GlobalState] Storage change detected: ${e.key}`);
                    this._loadFromStorage();
                    this._notifySubscribers(e.key, this._state[e.key]);
                }
            });
            
            console.log('✅ [GlobalStateManager] Initialized successfully');
        },
    };
    
    // ===== TESTING FUNCTIONS =====
    const TestGlobalState = {
        testComponentExists: () => {
            console.assert(window.GlobalStateManager, '❌ GlobalStateManager not exported to global scope');
            console.log('✅ [TEST] GlobalStateManager exists');
        },
        
        testBasicOperations: () => {
                    // NO TEST DATA - Production mode only
        console.log('✅ [GlobalStateManager] No test data loaded');
            const retrieved = window.GlobalStateManager.getData('users');
            console.assert(retrieved.length === 1, '❌ Basic operations failed');
            console.log('✅ [TEST] Basic operations work');
        },
        
        testSubscription: () => {
            let callbackExecuted = false;
            const unsubscribe = window.GlobalStateManager.subscribe('users', () => {
                callbackExecuted = true;
            }, 'TestComponent');
            
            window.GlobalStateManager.updateData('users', [{ id: 1 }], 'Test');
            
            console.assert(callbackExecuted, '❌ Subscription failed');
            unsubscribe();
            console.log('✅ [TEST] Subscription works');
        },
        
        testAtomicUpdate: () => {
            // Setup test data
            window.GlobalStateManager.updateData('users', [{ id: 2, status: 'pending' }], 'Test');
            window.GlobalStateManager.updateData('payments', [{ id: 1, userId: 2, status: 'pending' }], 'Test');
            
            const result = window.GlobalStateManager.updatePaymentAndUser(
                1, 
                2, 
                { packageId: 'test', packageName: 'Test Package', expiryDate: '2024-12-31', userName: 'Test User' }
            );
            
            console.assert(result === true, '❌ Atomic update failed');
            
            const user = window.GlobalStateManager.findUser(2);
            console.assert(user.status === 'active', '❌ User not activated');
            
            console.log('✅ [TEST] Atomic update works');
        },
        
        testErrorHandling: () => {
            const result = window.GlobalStateManager.updateData('invalidKey', [], 'Test');
            console.assert(result === false, '❌ Error handling failed');
            console.log('✅ [TEST] Error handling works');
        }
    };
    
    // ===== DEBUG CONSOLE COMMANDS =====
    const AdminDebug = {
        viewState: () => {
            console.table(window.GlobalStateManager._state);
        },
        
        viewSubscribers: () => {
            console.log('📋 Active Subscribers:', window.GlobalStateManager._subscribers);
        },
        
        testPaymentApproval: (paymentId = 2, userId = 3) => {
            return window.GlobalStateManager.updatePaymentAndUser(
                paymentId, 
                userId, 
                { 
                    packageId: 'package_30_days', 
                    packageName: 'Test Package',
                    expiryDate: '2024-12-31',
                    userName: 'Test User'
                }
            );
        },
        
        clearData: () => {
            ['users', 'payments', 'packages', 'notifications'].forEach(key => {
                window.GlobalStateManager.updateData(key, [], 'Debug');
            });
            console.log('🧹 All data cleared');
        },
        
        runAllTests: () => {
            console.log('🧪 Running all tests...');
            Object.values(TestGlobalState).forEach(test => {
                try {
                    test();
                } catch (error) {
                    console.error('❌ Test failed:', error);
                }
            });
            console.log('✅ All tests completed');
        }
    };
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.GlobalStateManager = GlobalStateManager;
    window.TestGlobalState = TestGlobalState;
    window.AdminDebug = AdminDebug;
    
    // Initialize immediately
    GlobalStateManager.init();
    
    // Auto-run tests in development
    if (GlobalStateManager._debug) {
        setTimeout(() => {
            TestGlobalState.testComponentExists();
            TestGlobalState.testBasicOperations();
            TestGlobalState.testSubscription();
            TestGlobalState.testErrorHandling();
        }, 100);
    }
    
    // NO TEST DATA - Production mode only
    console.log('✅ [GlobalStateManager] Running in production mode - No test data');
    
})(); 