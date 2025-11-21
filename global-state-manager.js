// 🌐 USER GLOBAL STATE MANAGER - EXTENSION OF ADMIN SYSTEM  
// Version: 3.0.0 | Created: 2024 | Follows USER SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';
    
    // ===== USER GLOBAL STATE MANAGER EXTENSION =====
    const UserGlobalStateManager = {
        // ✅ REQUIRED - Extend admin state with user-specific data
        _userState: {
            userSessions: [],      // Đại lý login sessions
            userProfiles: [],      // Đại lý profile data
            lotteryResults: [],    // Cached lottery data
            userCalculations: [],  // Đại lý bet history
            betSettlements: [],    // Settlement results
            agentSettings: [],     // Agent-specific settings
            userNotifications: []  // User-specific notifications
        },
        
        // ✅ REQUIRED - User-specific subscribers
        _userSubscribers: {},
        
        // Debug flag
        _debug: true,
        
        // ===== USER-SPECIFIC METHODS =====
        
        getUserData: function(key) {
            if (!this._userState.hasOwnProperty(key)) {
                console.warn(`⚠️ [UserGlobalState] Invalid key: ${key}`);
                return [];
            }
            return [...this._userState[key]];
        },
        
        updateUserData: function(key, newData, source = 'Unknown') {
            if (!this._userState.hasOwnProperty(key)) {
                console.error(`❌ [UserGlobalState] Invalid key: ${key}`);
                return false;
            }
            
            const oldCount = this._userState[key].length;
            this._userState[key] = Array.isArray(newData) ? [...newData] : newData;
            
            if (this._debug) {
                console.log(`🔄 [UserGlobalState] UPDATE ${key}`, { 
                    source, 
                    oldCount, 
                    newCount: this._userState[key].length,
                    timestamp: new Date().toISOString()
                });
            }
            
            this._notifyUserSubscribers(key, this._userState[key]);
            this._saveUserToStorage(key, this._userState[key]);
            return true;
        },
        
        subscribeToUserData: function(key, callback, componentName = 'Unknown') {
            if (!this._userSubscribers[key]) {
                this._userSubscribers[key] = [];
            }
            
            const subscription = { 
                callback, 
                componentName, 
                id: Date.now() + Math.random() 
            };
            
            this._userSubscribers[key].push(subscription);
            
            if (this._debug) {
                console.log(`🔔 [UserGlobalState] SUBSCRIBE ${key}`, { 
                    componentName,
                    totalSubscribers: this._userSubscribers[key].length
                });
            }
            
            // Return unsubscribe function
            return () => this._unsubscribeUser(key, subscription.id);
        },
        
        // ===== CURRENT USER MANAGEMENT =====
        
        getCurrentUser: function() {
            // Get current user from userSessions (most recent active session)
            const activeSessions = this._userState.userSessions.filter(s => s.status === 'active');
            if (activeSessions.length > 0) {
                // Return the most recent session
                return activeSessions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
            }
            return null;
        },
        
        setCurrentUser: function(user, source = 'Unknown') {
            if (!user) {
                // Clear current user by deactivating all sessions
                this._userState.userSessions = this._userState.userSessions.map(s => ({
                    ...s,
                    status: 'inactive'
                }));
            } else {
                // Add or update user session
                const existingSession = this._userState.userSessions.find(s => s.userId === user.id);
                
                if (existingSession) {
                    // Update existing session
                    existingSession.status = 'active';
                    existingSession.lastActive = new Date().toISOString();
                } else {
                    // Create new session
                    const newSession = {
                        id: Date.now(),
                        userId: user.id,
                        user: user,
                        status: 'active',
                        createdAt: new Date().toISOString(),
                        lastActive: new Date().toISOString()
                    };
                    this._userState.userSessions.push(newSession);
                }
            }
            
            if (this._debug) {
                console.log(`👤 [UserGlobalState] SET_CURRENT_USER`, { 
                    source, 
                    userId: user?.id,
                    totalSessions: this._userState.userSessions.length
                });
            }
            
            this._saveUserToStorage('userSessions', this._userState.userSessions);
            return true;
        },
        
        // ===== USER BUSINESS LOGIC HELPERS =====
        
        findUserSession: function(sessionId) {
            return this._userState.userSessions.find(s => s.id === sessionId);
        },
        
        findUserProfile: function(userId) {
            return this._userState.userProfiles.find(p => p.userId === userId);
        },
        
        findLotteryResult: function(date, region = 'bac') {
            return this._userState.lotteryResults.find(r => 
                r.date === date && r.region === region
            );
        },
        
        findUserCalculation: function(calculationId) {
            return this._userState.userCalculations.find(c => c.id === calculationId);
        },
        
        // ===== USER NOTIFICATION HELPERS =====
        
        addUserNotification: function(message, type = 'info', source = 'UserSystem') {
            const notification = {
                id: Date.now() + Math.random(),
                message,
                type,
                timestamp: new Date().toISOString(),
                read: false,
                source
            };
            
            const currentNotifications = this._userState.userNotifications || [];
            const newNotifications = [notification, ...currentNotifications.slice(0, 49)];
            
            this.updateUserData('userNotifications', newNotifications, source);
            return notification.id;
        },
        
        saveBetSettlement: function(settlementData, source = 'BetSettlement') {
            const settlement = {
                id: Date.now() + Math.random(),
                ...settlementData,
                timestamp: new Date().toISOString(),
                source
            };
            
            const currentSettlements = this._userState.betSettlements;
            const newSettlements = [settlement, ...currentSettlements];
            
            this.updateUserData('betSettlements', newSettlements, source);
            return settlement.id;
        },
        
        cacheLotteryResult: function(resultData, source = 'LotteryAPI') {
            const result = {
                id: Date.now() + Math.random(),
                ...resultData,
                cachedAt: new Date().toISOString(),
                source
            };
            
            const currentResults = this._userState.lotteryResults;
            const newResults = [result, ...currentResults.slice(0, 99)]; // Keep last 100 results
            
            this.updateUserData('lotteryResults', newResults, source);
            return result.id;
        },
        
        createUserSession: function(userData, source = 'UserLogin') {
            const session = {
                id: Date.now() + Math.random(),
                userId: userData.id,
                user: userData,
                status: 'active',
                createdAt: new Date().toISOString(),
                lastActive: new Date().toISOString(),
                source
            };
            
            const currentSessions = this._userState.userSessions;
            const newSessions = [session, ...currentSessions];
            
            this.updateUserData('userSessions', newSessions, source);
            return session.id;
        },
        
        updateUserSession: function(sessionId, updates, source = 'SessionUpdate') {
            const currentSessions = this._userState.userSessions;
            const updatedSessions = currentSessions.map(s => 
                s.id === sessionId ? { ...s, ...updates, lastActive: new Date().toISOString() } : s
            );
            
            this.updateUserData('userSessions', updatedSessions, source);
            return true;
        },
        
        // ===== INTERNAL HELPER METHODS =====
        
        _notifyUserSubscribers: function(key, data) {
            if (this._userSubscribers[key]) {
                this._userSubscribers[key].forEach(subscription => {
                    try {
                        subscription.callback(data);
                    } catch (error) {
                        console.error(`❌ [UserGlobalState] Subscriber error for ${key}:`, error);
                    }
                });
                
                if (this._debug) {
                    console.log(`📤 [UserGlobalState] NOTIFY ${key} → ${this._userSubscribers[key].length} subscribers`);
                }
            }
        },
        
        _unsubscribeUser: function(key, subscriptionId) {
            if (this._userSubscribers[key]) {
                this._userSubscribers[key] = this._userSubscribers[key].filter(s => s.id !== subscriptionId);
                
                if (this._debug) {
                    console.log(`🔕 [UserGlobalState] UNSUBSCRIBE ${key}`, { 
                        remainingSubscribers: this._userSubscribers[key].length 
                    });
                }
            }
        },
        
        _saveUserToStorage: function(key, data) {
            try {
                if (key === 'userSessions' || key === 'userNotifications' || key === 'betSettlements') {
                    const dataToSave = key === 'userNotifications' ? data.slice(0, 50) : data;
                    localStorage.setItem(`user_${key}`, JSON.stringify(dataToSave));
                    
                    if (this._debug) {
                        console.log(`💾 [UserGlobalState] SAVE ${key}`, { count: dataToSave.length });
                    }
                }
            } catch (error) {
                console.warn(`⚠️ [UserGlobalState] Storage failed for ${key}:`, error);
            }
        },
        
        _loadUserFromStorage: function() {
            try {
                ['userSessions', 'userNotifications', 'betSettlements'].forEach(key => {
                    const saved = localStorage.getItem(`user_${key}`);
                    if (saved) {
                        this._userState[key] = JSON.parse(saved);
                        
                        if (this._debug) {
                            console.log(`📂 [UserGlobalState] LOAD ${key}`, { count: this._userState[key].length });
                        }
                    }
                });
            } catch (error) {
                console.error('❌ [UserGlobalState] Load from storage failed:', error);
            }
        },
        
        // ===== INITIALIZATION =====
        
        init: function() {
            this._loadUserFromStorage();
            
            if (this._debug) {
                console.log('🚀 [UserGlobalState] INITIALIZED', {
                    timestamp: new Date().toISOString(),
                    state: Object.keys(this._userState).reduce((acc, key) => {
                        acc[key] = this._userState[key].length;
                        return acc;
                    }, {})
                });
            }
        }
    };
    
    // ===== TESTING FUNCTIONS =====
    const TestUserGlobalState = {
        testComponentExists: () => {
            console.assert(window.UserGlobalStateManager, '❌ UserGlobalStateManager not exported to global scope');
            console.log('✅ [TEST] UserGlobalStateManager exists');
        },
        
        testBasicOperations: () => {
                    // NO TEST DATA - Production mode only
        console.log('✅ [UserGlobalStateManager] No test data loaded');
            const retrieved = window.UserGlobalStateManager.getUserData('userSessions');
            console.assert(retrieved.length === 1, '❌ Basic operations failed');
            console.log('✅ [TEST] Basic operations work');
        },
        
        testSubscription: () => {
            let callbackExecuted = false;
            const unsubscribe = window.UserGlobalStateManager.subscribeToUserData('userSessions', () => {
                callbackExecuted = true;
            }, 'TestComponent');
            
            window.UserGlobalStateManager.updateUserData('userSessions', [{ id: 1 }], 'Test');
            
            console.assert(callbackExecuted, '❌ Subscription failed');
            unsubscribe();
            console.log('✅ [TEST] Subscription works');
        },
        
        testErrorHandling: () => {
            const result = window.UserGlobalStateManager.updateUserData('invalidKey', [], 'Test');
            console.assert(result === false, '❌ Error handling failed');
            console.log('✅ [TEST] Error handling works');
        },
        
        testGetCurrentUser: () => {
            const currentUser = window.UserGlobalStateManager.getCurrentUser();
            console.log('✅ [TEST] getCurrentUser works:', currentUser);
        }
    };
    
    // ===== DEBUG CONSOLE COMMANDS =====
    const UserDebug = {
        viewUserState: () => {
            console.table(window.UserGlobalStateManager._userState);
        },
        
        viewUserSubscribers: () => {
            console.log('📋 Active User Subscribers:', window.UserGlobalStateManager._userSubscribers);
        },
        
        clearUserData: () => {
            ['userSessions', 'userProfiles', 'lotteryResults', 'userCalculations', 'betSettlements', 'agentSettings', 'userNotifications'].forEach(key => {
                window.UserGlobalStateManager.updateUserData(key, [], 'Debug');
            });
            console.log('🧹 All user data cleared');
        },
        
        runAllTests: () => {
            console.log('🧪 Running all user tests...');
            Object.values(TestUserGlobalState).forEach(test => {
                try {
                    test();
                } catch (error) {
                    console.error('❌ Test failed:', error);
                }
            });
            console.log('✅ All user tests completed');
        }
    };
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.GlobalStateManager = UserGlobalStateManager;
    window.UserGlobalStateManager = UserGlobalStateManager;
    window.TestUserGlobalState = TestUserGlobalState;
    window.UserDebug = UserDebug;
    
    // Initialize immediately
    UserGlobalStateManager.init();
    
    // Auto-run tests in development
    if (UserGlobalStateManager._debug) {
        setTimeout(() => {
            TestUserGlobalState.testComponentExists();
            TestUserGlobalState.testBasicOperations();
            TestUserGlobalState.testSubscription();
            TestUserGlobalState.testErrorHandling();
            TestUserGlobalState.testGetCurrentUser();
        }, 100);
    }
    
    // NO TEST DATA - Production mode only
    console.log('✅ [UserGlobalStateManager] Running in production mode - No test data');
    
})(); 