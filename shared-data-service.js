/**
 * Shared Data Service - Enhanced Admin ↔ User Integration
 * Real-time synchronization with auto-actions and notifications
 */

(function() {
    'use strict';

    console.log('🔄 SharedDataService v2.0 - Enhanced Integration');

    const SharedDataService = {
        // Configuration
        config: {
            pollingInterval: 30000, // Reduced from 5s for better performance
            maxRetries: 3,
            enableRealTimeSync: true,
            enableAutoActions: true
        },

        // State tracking
        state: {
            lastSyncTime: null,
            syncInProgress: false,
            errorCount: 0,
            isConnected: true
        },

        // Initialize service
        init: function() {
            console.log('📡 Initializing Enhanced SharedDataService...');
            
            // Start background sync
            this.startBackgroundSync();
            
            // Setup real-time listeners
            this.setupRealTimeListeners();
            
            // Setup auto-actions
            this.setupAutoActions();
            
            console.log('✅ SharedDataService initialized with enhanced features');
        },

        // Enhanced package sync from admin
        syncPackagesFromAdmin: function() {
            try {
                const adminPackagesData = localStorage.getItem('adminPackages');
                if (!adminPackagesData) {
                    console.log('📦 No admin packages found in localStorage');
                    return {};
                }

                const adminPackages = JSON.parse(adminPackagesData);
                const userPackages = {};

                // Transform admin packages to user format with enhanced metadata
                adminPackages.forEach(pkg => {
                    userPackages[pkg.id] = {
                        id: pkg.id,
                        name: pkg.name,
                        price: pkg.price,
                        priceNumber: parseInt(pkg.price) || 0,
                        duration_days: pkg.duration,
                        features: Array.isArray(pkg.features) ? pkg.features : [],
                        max_transactions_per_day: pkg.maxTransactions || -1,
                        enabled_regions: pkg.regions || ['bac'],
                        target: pkg.target || 'general',
                        popular: pkg.popular || false,
                        priority: pkg.priority || 999,
                        status: pkg.active ? 'active' : 'inactive',
                        // Enhanced metadata
                        created_at: pkg.created_at || new Date().toISOString(),
                        updated_at: pkg.updated_at || new Date().toISOString(),
                        sync_version: pkg.sync_version || 1,
                        admin_notes: pkg.admin_notes || ''
                    };
                });

                // Store transformed packages
                localStorage.setItem('userPackages', JSON.stringify(userPackages));
                localStorage.setItem('packages_last_sync', new Date().toISOString());

                console.log(`✅ Synced ${Object.keys(userPackages).length} packages from admin`);

                // Broadcast update to components
                this.broadcastUpdate('packages_updated', userPackages);

                return userPackages;

            } catch (error) {
                console.error('❌ Error syncing packages from admin:', error);
                this.handleSyncError('packages', error);
                return {};
            }
        },

        // Enhanced user sync from admin
        syncUsersFromAdmin: function() {
            try {
                // ✅ SỬA: Try multiple keys for admin users
                let adminUsersData = localStorage.getItem('registeredUsers') ||  // First priority: what admin saves
                                   localStorage.getItem('adminUsers') || 
                                   localStorage.getItem('admin_users'); // Legacy fallback
                if (!adminUsersData) {
                    console.log('👥 No admin users found in localStorage (checked both adminUsers and admin_users)');
                    return {};
                }

                const adminUsers = JSON.parse(adminUsersData);
                const demoAccounts = {};

                // Transform admin users to demo accounts (include active and pending for flexibility)
                adminUsers
                    .filter(user => user.status === 'active' || user.status === 'pending')
                    .forEach(user => {
                        // ✅ SỬA: Index by username for login compatibility
                        demoAccounts[user.username] = {
                            id: user.id,
                            username: user.username,
                            password: user.password, // Note: Should be hashed in production
                            fullName: user.fullName,
                            package_type: user.subscriptionType,
                            package_start: user.activatedAt,
                            package_end: user.subscriptionExpiry,
                            status: this.calculateUserStatus(user),
                            // Enhanced metadata
                            role: user.role || 'user',
                            permissions: user.permissions || [],
                            last_login: user.lastLogin,
                            created_at: user.created_at,
                            sync_version: user.sync_version || 1,
                            // ✅ THÊM: Add subscription fields for login compatibility
                            subscriptionType: user.subscriptionType,
                            subscriptionPackage: user.subscriptionPackage,
                            subscriptionExpiry: user.subscriptionExpiry,
                            subscriptionStatus: user.subscriptionStatus,
                            activatedAt: user.activatedAt,
                            activatedBy: user.activatedBy
                        };
                    });

                // Store transformed users
                localStorage.setItem('syncedDemoAccounts', JSON.stringify(demoAccounts));
                localStorage.setItem('users_last_sync', new Date().toISOString());

                console.log(`✅ Synced ${Object.keys(demoAccounts).length} users from admin`);

                // Broadcast update to components
                this.broadcastUpdate('users_updated', demoAccounts);

                return demoAccounts;

            } catch (error) {
                console.error('❌ Error syncing users from admin:', error);
                this.handleSyncError('users', error);
                return {};
            }
        },

        // Calculate user status based on subscription
        calculateUserStatus: function(user) {
            if (!user.subscriptionExpiry) return 'no_package';
            
            const now = new Date();
            const expiry = new Date(user.subscriptionExpiry);
            
            if (expiry < now) return 'expired';
            if (user.status !== 'active') return 'suspended';
            
            return 'active';
        },

        // ✅ CRITICAL: Add getPackages method for pricing page
        getPackages: function() {
            try {
                // Force sync packages first
                const syncedPackages = this.syncPackagesFromAdmin();
                
                if (syncedPackages && Object.keys(syncedPackages).length > 0) {
                    console.log('✅ [SharedDataService] getPackages returning synced packages:', Object.keys(syncedPackages).length);
                    return syncedPackages;
                }
                
                // Fallback: try direct localStorage read
                const adminPackagesData = localStorage.getItem('adminPackages');
                if (adminPackagesData) {
                    const adminPackages = JSON.parse(adminPackagesData);
                    const transformedPackages = {};
                    
                    adminPackages.forEach(pkg => {
                        transformedPackages[pkg.id] = {
                            id: pkg.id,
                            name: pkg.name,
                            price: pkg.price,
                            priceNumber: parseInt(pkg.price) || 0,
                            duration_days: pkg.duration,
                            features: Array.isArray(pkg.features) ? pkg.features : [],
                            popular: pkg.popular || false,
                            status: pkg.active ? 'active' : 'inactive'
                        };
                    });
                    
                    console.log('✅ [SharedDataService] getPackages returning transformed packages from fallback:', Object.keys(transformedPackages).length);
                    return transformedPackages;
                }
                
                console.log('⚠️ [SharedDataService] getPackages: No packages found');
                return {};
                
            } catch (error) {
                console.error('❌ [SharedDataService] getPackages error:', error);
                return {};
            }
        },

        // Enhanced payment approval handler
        handlePaymentApproval: async function(paymentData) {
            try {
                console.log('💳 Processing payment approval:', paymentData);

                // Update user status in admin system
                const result = await this.updateUserInAdmin(paymentData.userId, {
                    status: 'active',
                    subscriptionType: paymentData.packageId,
                    subscriptionExpiry: paymentData.expiryDate,
                    activatedAt: new Date().toISOString(),
                    paymentReference: paymentData.paymentId
                });

                if (result.success) {
                    // Sync updated user data
                    this.syncUsersFromAdmin();

                    // Broadcast payment approval
                    this.broadcastUpdate('payment_approved', {
                        userId: paymentData.userId,
                        paymentId: paymentData.paymentId,
                        packageInfo: paymentData.packageInfo,
                        expiryDate: paymentData.expiryDate
                    });

                    // Auto-login if current user
                    if (this.config.enableAutoActions) {
                        this.handleAutoLogin(paymentData.userId);
                    }

                    console.log('✅ Payment approval processed successfully');
                    return { success: true };
                }

            } catch (error) {
                console.error('❌ Error processing payment approval:', error);
                return { success: false, error: error.message };
            }
        },

        // Handle package purchase request
        handlePackageRequest: async function(requestData) {
            try {
                console.log('📦 Processing package request:', requestData);

                // Save request to admin system
                const requests = JSON.parse(localStorage.getItem('adminPackageRequests') || '[]');
                const newRequest = {
                    id: Date.now(),
                    userId: requestData.userId,
                    packageId: requestData.packageId,
                    userInfo: requestData.userInfo,
                    contactInfo: requestData.contactInfo,
                    timestamp: new Date().toISOString(),
                    status: 'pending',
                    source: 'user_system'
                };

                requests.unshift(newRequest);
                localStorage.setItem('adminPackageRequests', JSON.stringify(requests));

                // Broadcast to admin system
                this.broadcastUpdate('new_package_request', newRequest);

                console.log('✅ Package request submitted successfully');
                return { success: true, requestId: newRequest.id };

            } catch (error) {
                console.error('❌ Error processing package request:', error);
                return { success: false, error: error.message };
            }
        },

        // Auto-login handler
        handleAutoLogin: function(userId) {
            if (!this.config.enableAutoActions) return;

            const currentUser = window.AuthService?.getCurrentUser();
            if (currentUser?.id === userId) {
                // Refresh user status and redirect
                setTimeout(() => {
                    if (confirm('Tài khoản đã được kích hoạt! Bạn có muốn chuyển đến trang chính không?')) {
                        if (window.MainAgentSystem) {
                            window.MainAgentSystem.navigate('main');
                        } else {
                            window.location.href = '/user/index.html#main';
                        }
                    }
                }, 1000);
            }
        },

        // Update user in admin system
        updateUserInAdmin: async function(userId, updateData) {
            try {
                // Get current admin users
                const adminUsers = JSON.parse(localStorage.getItem('adminUsers') || '[]');
                
                // Find and update user
                const userIndex = adminUsers.findIndex(user => user.id === userId);
                if (userIndex !== -1) {
                    adminUsers[userIndex] = { ...adminUsers[userIndex], ...updateData };
                    localStorage.setItem('adminUsers', JSON.stringify(adminUsers));
                    
                    return { success: true, user: adminUsers[userIndex] };
                }

                return { success: false, error: 'User not found' };

            } catch (error) {
                console.error('❌ Error updating user in admin:', error);
                return { success: false, error: error.message };
            }
        },

        // Setup real-time listeners
        setupRealTimeListeners: function() {
            if (!this.config.enableRealTimeSync) return;

            // Listen for BroadcastSync events
            if (window.BroadcastSync) {
                window.BroadcastSync.addListener('admin_data_changed', (data) => {
                    this.handleAdminDataChange(data);
                });

                window.BroadcastSync.addListener('payment_approved', (data) => {
                    this.handlePaymentApproval(data);
                });

                window.BroadcastSync.addListener('user_status_changed', (data) => {
                    this.syncUsersFromAdmin();
                });
            }

            // Listen for storage events (cross-tab sync)
            window.addEventListener('storage', (event) => {
                this.handleStorageChange(event);
            });

            // ✅ ADD: Listen for admin data changes
            window.addEventListener('adminDataChanged', (event) => {
                if (event.detail.type === 'users') {
                    console.log('📡 [SharedDataService] Received admin users update');
                    this.syncUsersFromAdmin();
                } else if (event.detail.type === 'packages') {
                    console.log('📡 [SharedDataService] Received admin packages update');
                    this.syncPackagesFromAdmin();
                }
            });
        },

        // Setup auto-actions
        setupAutoActions: function() {
            if (!this.config.enableAutoActions) return;

            // Auto-sync on visibility change
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden && this.state.isConnected) {
                    this.performFullSync();
                }
            });

            // Auto-sync on focus
            window.addEventListener('focus', () => {
                if (this.state.isConnected) {
                    this.performFullSync();
                }
            });
        },

        // Handle admin data changes
        handleAdminDataChange: function(data) {
            console.log('📡 Admin data changed:', data.type);

            switch (data.type) {
                case 'packages':
                    this.syncPackagesFromAdmin();
                    break;
                case 'users':
                    this.syncUsersFromAdmin();
                    break;
                case 'payment':
                    this.handlePaymentApproval(data.payload);
                    break;
            }
        },

        // Handle storage changes
        handleStorageChange: function(event) {
            if (event.key === 'adminPackages') {
                this.syncPackagesFromAdmin();
            } else if (event.key === 'adminUsers') {
                this.syncUsersFromAdmin();
            }
        },

        // Broadcast updates to components
        broadcastUpdate: function(type, data) {
            // Use BroadcastSync if available
            if (window.BroadcastSync) {
                window.BroadcastSync.broadcast(type, data);
            }

            // Dispatch custom event
            window.dispatchEvent(new CustomEvent('sharedDataUpdate', {
                detail: { type, data }
            }));

            // Update state
            this.state.lastSyncTime = new Date().toISOString();
        },

        // Perform full sync
        performFullSync: function() {
            if (this.state.syncInProgress) return;

            this.state.syncInProgress = true;
            console.log('🔄 Performing full sync...');

            try {
                this.syncPackagesFromAdmin();
                this.syncUsersFromAdmin();
                
                this.state.errorCount = 0;
                this.state.isConnected = true;
                
                console.log('✅ Full sync completed');

            } catch (error) {
                console.error('❌ Full sync error:', error);
                this.handleSyncError('full_sync', error);
            } finally {
                this.state.syncInProgress = false;
            }
        },

        // Start background sync
        startBackgroundSync: function() {
            // Initial sync
            this.performFullSync();

            // Setup interval sync
            setInterval(() => {
                if (this.state.isConnected && !this.state.syncInProgress) {
                    this.performFullSync();
                }
            }, this.config.pollingInterval);

            console.log(`🔄 Background sync started (${this.config.pollingInterval}ms interval)`);
        },

        // Handle sync errors
        handleSyncError: function(operation, error) {
            this.state.errorCount++;
            
            if (this.state.errorCount >= this.config.maxRetries) {
                this.state.isConnected = false;
                console.error(`❌ Sync failed after ${this.config.maxRetries} retries for ${operation}`);
                
                // Broadcast error
                this.broadcastUpdate('sync_error', {
                    operation,
                    error: error.message,
                    retryCount: this.state.errorCount
                });
            }
        },

        // Get sync status
        getSyncStatus: function() {
            return {
                lastSync: this.state.lastSyncTime,
                isConnected: this.state.isConnected,
                inProgress: this.state.syncInProgress,
                errorCount: this.state.errorCount,
                config: this.config
            };
        },

        // Force sync
        forceSync: function() {
            this.state.errorCount = 0;
            this.state.isConnected = true;
            this.performFullSync();
        },

        // Debug function to check sync status
        debugSyncStatus: function() {
            console.log('🔍 [SharedDataService] DEBUG SYNC STATUS');
            
            // Check admin data
            const registeredUsers = localStorage.getItem('registeredUsers');
            const adminUsers = localStorage.getItem('adminUsers');
            const admin_users = localStorage.getItem('admin_users');
            
            console.log('📊 Admin Data Check:');
            console.log('- registeredUsers:', registeredUsers ? JSON.parse(registeredUsers).length + ' users' : 'null');
            console.log('- adminUsers:', adminUsers ? JSON.parse(adminUsers).length + ' users' : 'null');
            console.log('- admin_users:', admin_users ? JSON.parse(admin_users).length + ' users' : 'null');
            
            // Check synced data
            const syncedAccounts = localStorage.getItem('syncedDemoAccounts');
            console.log('- syncedDemoAccounts:', syncedAccounts ? Object.keys(JSON.parse(syncedAccounts)).length + ' accounts' : 'null');
            
            // Force sync
            console.log('🔄 Forcing sync...');
            const result = this.syncUsersFromAdmin();
            console.log('✅ Sync result:', Object.keys(result).length + ' accounts');
            
            return result;
        },

        // Enhanced sync with better error handling
        forceSyncAllData: function() {
            console.log('🔄 [SharedDataService] FORCE SYNC ALL DATA');
            
            try {
                // Sync users
                const users = this.syncUsersFromAdmin();
                console.log('✅ Users synced:', Object.keys(users).length);
                
                // Sync packages  
                const packages = this.syncPackagesFromAdmin();
                console.log('✅ Packages synced:', Object.keys(packages).length);
                
                // Broadcast updates
                this.broadcastUpdate('full_sync_complete', { users, packages });
                
                return { users, packages };
            } catch (error) {
                console.error('❌ Force sync failed:', error);
                return { users: {}, packages: {} };
            }
        },

        // Get payment configuration from admin
        getPaymentConfig: function() {
            try {
                // Try multiple keys for payment config
                const adminPaymentConfig = localStorage.getItem('admin_paymentConfig') || 
                                         localStorage.getItem('paymentConfig') ||
                                         localStorage.getItem('adminPaymentConfig');
                
                if (!adminPaymentConfig) {
                    console.log('💳 No payment config found in localStorage');
                    return null;
                }

                const config = JSON.parse(adminPaymentConfig);
                
                // Ensure config has required structure
                if (config && config.length > 0) {
                    const paymentConfig = config[0];
                    
                    // Validate QR code structure
                    if (paymentConfig.qrCodes && !paymentConfig.qrCodes.main) {
                        // Convert old format to new unified format
                        paymentConfig.qrCodes = {
                            main: {
                                url: paymentConfig.qrCodes.basic?.url || '',
                                enabled: true,
                                description: 'QR Code chung cho tất cả gói'
                            }
                        };
                    }
                    
                    console.log('✅ Payment config loaded:', paymentConfig);
                    return paymentConfig;
                }
                
                return null;
            } catch (error) {
                console.error('❌ Error loading payment config:', error);
                return null;
            }
        }
    };

    // Auto-initialize
    document.addEventListener('DOMContentLoaded', () => {
        SharedDataService.init();
    });

    // Debug helper for admin testing
    window.debugDataSync = function() {
        console.log('🔍 DATA SYNC DEBUG:');
        console.log('===================');
        console.log('📦 Admin Packages:', localStorage.getItem('adminPackages'));
        console.log('📦 Admin Packages (alt):', localStorage.getItem('admin_packages'));
        console.log('👥 Registered Users:', localStorage.getItem('registeredUsers'));
        console.log('👥 Admin Users:', localStorage.getItem('adminUsers'));
        console.log('👥 Admin Users (alt):', localStorage.getItem('admin_users'));
        console.log('💳 Admin Payment Config:', localStorage.getItem('admin_paymentConfig'));
        console.log('💳 Payment Config:', localStorage.getItem('paymentConfig'));
        
        // Force sync and test
        if (window.SharedDataService) {
            console.log('🔄 Force syncing...');
            const packages = window.SharedDataService.syncPackagesFromAdmin();
            const users = window.SharedDataService.syncUsersFromAdmin();
            console.log('✅ Synced Packages:', Object.keys(packages).length, 'items');
            console.log('✅ Synced Users:', Object.keys(users).length, 'items');
            
            // Test getPackages method
            const packagesByMethod = window.SharedDataService.getPackages();
            console.log('📦 getPackages() returned:', Object.keys(packagesByMethod).length, 'items');
        } else {
            console.log('❌ SharedDataService not available');
        }
    };

    // Export to window
    window.SharedDataService = SharedDataService;

    console.log('✅ Enhanced SharedDataService v2.2.0 loaded successfully - No demo data!');

})(); 