/**
 * Shared Data Service - Enhanced Admin ↔ User Integration
 * Real-time synchronization with auto-actions and notifications
 */

(function() {
    'use strict';

    console.log(' SharedDataService v4.0 - ONLINE ONLY (MySQL)');

    const SharedDataService = {
        // Configuration - ONLINE ONLY MODE (No localStorage fallback)
        config: {
            pollingInterval: 10000, // 10 seconds for faster sync
            maxRetries: 5,
            enableRealTimeSync: true,
            enableAutoActions: true,
            onlineMode: true, // REQUIRED: Always online
            apiBaseUrl: window.API_BASE_URL || '/api', // API endpoint
            wsUrl: window.WS_URL || null, // WebSocket URL for realtime
            cacheMaxAge: 60000, // 1 minute cache max
            debugMode: window.DEBUG_MODE || false,
            // REMOVED: serverDataUrl - no static file fallback
            enableServerSync: false, // DISABLED: No static file sync
            enableMySQLSync: true, // REQUIRED: MySQL API only
            requireOnline: true // NEW: Require online connection
        },

        // In-memory cache (loaded from MySQL)
        cache: {
            users: [],
            packages: [],
            payments: [],
            config: null,
            lastFetch: null
        },

        // State tracking
        state: {
            lastSyncTime: null,
            syncInProgress: false,
            errorCount: 0,
            isConnected: true,
            isOnline: navigator.onLine,
            wsConnected: false
        },

        // Online status check - REQUIRED for operation
        checkOnlineStatus: function() {
            this.state.isOnline = navigator.onLine;
            if (!this.state.isOnline) {
                console.error(' Network offline - System requires internet connection');
                this.showOfflineError();
            }
            return this.state.isOnline;
        },

        // Show offline error to user
        showOfflineError: function() {
            if (document.getElementById('offline-error')) return;

            const errorDiv = document.createElement('div');
            errorDiv.id = 'offline-error';
            errorDiv.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#FE5938;color:white;padding:15px;text-align:center;z-index:99999;font-weight:bold;';
            errorDiv.innerHTML = ' Mất kết nối mạng! Hệ thống yêu cầu kết nối internet để hoạt động.';
            document.body.prepend(errorDiv);
        },

        // Hide offline error
        hideOfflineError: function() {
            const errorDiv = document.getElementById('offline-error');
            if (errorDiv) errorDiv.remove();
        },

        // Fetch data from server and merge with localStorage
        fetchFromServer: async function() {
            if (!this.config.enableServerSync) {
                console.log(' Server sync disabled');
                return false;
            }

            try {
                console.log(' Fetching data from server:', this.config.serverDataUrl);

                const response = await fetch(this.config.serverDataUrl, {
                    method: 'GET',
                    cache: 'no-cache',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        console.log(' No server data file found (404) - using localStorage only');
                        return false;
                    }
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                const serverData = await response.json();

                // Validate server data
                if (!serverData.version || !serverData.exportedAt) {
                    console.warn(' Invalid server data format');
                    return false;
                }

                console.log(' Server data fetched successfully:', {
                    exportedAt: serverData.exportedAt,
                    users: serverData.admin_users?.length || serverData.users?.length || 0,
                    packages: serverData.adminPackages?.length || serverData.packages?.length || 0
                });

                // Merge users from server with localStorage
                if (serverData.admin_users?.length > 0 || serverData.users?.length > 0) {
                    const serverUsers = serverData.admin_users?.length > 0 ? serverData.admin_users : serverData.users;
                    const existingUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');

                    // Merge: server data takes priority for new users, keep local for existing
                    const existingUsernames = new Set(existingUsers.map(u => u.username));
                    const newUsers = serverUsers.filter(u => !existingUsernames.has(u.username));
                    const mergedUsers = [...existingUsers, ...newUsers];

                    // Also update existing users with server data if newer
                    serverUsers.forEach(serverUser => {
                        const localIndex = mergedUsers.findIndex(u => u.username === serverUser.username);
                        if (localIndex !== -1) {
                            // Check if server data is newer
                            const serverTime = new Date(serverUser.updatedAt || serverUser.createdAt || 0).getTime();
                            const localTime = new Date(mergedUsers[localIndex].updatedAt || mergedUsers[localIndex].createdAt || 0).getTime();
                            if (serverTime > localTime) {
                                mergedUsers[localIndex] = serverUser;
                            }
                        }
                    });

                    localStorage.setItem('admin_users', JSON.stringify(mergedUsers));
                    localStorage.setItem('adminUsers', JSON.stringify(mergedUsers));
                    localStorage.setItem('registeredUsers', JSON.stringify(mergedUsers));

                    console.log(` Merged ${newUsers.length} new users from server (total: ${mergedUsers.length})`);
                }

                // Merge packages from server
                if (serverData.adminPackages?.length > 0 || serverData.packages?.length > 0) {
                    const serverPackages = serverData.adminPackages?.length > 0 ? serverData.adminPackages : serverData.packages;
                    const existingPackages = JSON.parse(localStorage.getItem('adminPackages') || '[]');

                    const existingPackageIds = new Set(existingPackages.map(p => p.id));
                    const newPackages = serverPackages.filter(p => !existingPackageIds.has(p.id));
                    const mergedPackages = [...existingPackages, ...newPackages];

                    localStorage.setItem('adminPackages', JSON.stringify(mergedPackages));

                    console.log(` Merged ${newPackages.length} new packages from server`);
                }

                // Merge payments from server
                if (serverData.adminPayments?.length > 0 || serverData.payments?.length > 0) {
                    const serverPayments = serverData.adminPayments?.length > 0 ? serverData.adminPayments : serverData.payments;
                    const existingPayments = JSON.parse(localStorage.getItem('adminPayments') || '[]');

                    const existingPaymentIds = new Set(existingPayments.map(p => p.id));
                    const newPayments = serverPayments.filter(p => !existingPaymentIds.has(p.id));
                    const mergedPayments = [...existingPayments, ...newPayments];

                    localStorage.setItem('adminPayments', JSON.stringify(mergedPayments));
                }

                // Import configs if present (overwrite)
                if (serverData.adminContactInfo) {
                    localStorage.setItem('adminContactInfo', JSON.stringify(serverData.adminContactInfo));
                }

                if (serverData.admin_paymentConfig) {
                    localStorage.setItem('admin_paymentConfig', JSON.stringify(serverData.admin_paymentConfig));
                }

                // Save last server sync time
                localStorage.setItem('lastServerSync', new Date().toISOString());
                localStorage.setItem('serverDataVersion', serverData.exportedAt);

                // Trigger local sync to update transformed data
                this.syncAll();

                return true;

            } catch (error) {
                console.warn(' Server fetch failed:', error.message);
                return false;
            }
        },

        // Fetch data from MySQL API - PRIMARY DATA SOURCE
        fetchFromMySQL: async function() {
            try {
                console.log(' Fetching data from MySQL API...');

                const response = await fetch(`${this.config.apiBaseUrl}/sync.php?action=all`, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (!response.ok) {
                    if (response.status === 404) {
                        console.error(' MySQL API not found at:', this.config.apiBaseUrl);
                        return false;
                    }
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();

                if (!result.success || !result.data) {
                    console.error(' Invalid API response');
                    return false;
                }

                const { users, packages, payments, config } = result.data;

                // Save users to memory cache AND localStorage (for component compatibility)
                if (users && users.length > 0) {
                    const transformedUsers = users.map(u => ({
                        id: u.id,
                        username: u.username,
                        password: u.password,
                        fullName: u.full_name,
                        email: u.email,
                        phone: u.phone,
                        role: u.role,
                        status: u.status,
                        subscriptionType: u.subscription_type,
                        subscriptionPackage: u.subscription_package,
                        subscriptionExpiry: u.subscription_expiry,
                        subscriptionStatus: u.subscription_status,
                        activatedAt: u.activated_at,
                        activatedBy: u.activated_by,
                        createdAt: u.created_at,
                        updatedAt: u.updated_at
                    }));

                    // Store in memory cache
                    this.cache.users = transformedUsers;

                    // Also store in localStorage for component compatibility
                    localStorage.setItem('admin_users', JSON.stringify(transformedUsers));
                    localStorage.setItem('adminUsers', JSON.stringify(transformedUsers));
                    localStorage.setItem('registeredUsers', JSON.stringify(transformedUsers));

                    console.log(` Loaded ${transformedUsers.length} users from MySQL`);
                }

                // Save packages to cache and localStorage
                if (packages && packages.length > 0) {
                    const transformedPackages = packages.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: p.price,
                        duration: p.duration,
                        features: typeof p.features === 'string' ? JSON.parse(p.features) : p.features,
                        active: p.active == 1
                    }));

                    this.cache.packages = transformedPackages;
                    localStorage.setItem('adminPackages', JSON.stringify(transformedPackages));
                    console.log(` Loaded ${transformedPackages.length} packages from MySQL`);
                }

                // Save payments to cache
                if (payments && payments.length > 0) {
                    this.cache.payments = payments;
                    localStorage.setItem('adminPayments', JSON.stringify(payments));
                }

                // Save config to cache
                if (config) {
                    this.cache.config = config;
                    if (config.contact_info) {
                        localStorage.setItem('adminContactInfo', config.contact_info);
                    }
                    if (config.payment_config) {
                        localStorage.setItem('admin_paymentConfig', config.payment_config);
                    }
                }

                this.cache.lastFetch = new Date().toISOString();
                console.log(' MySQL sync completed - Data cached');
                return true;

            } catch (error) {
                console.error(' MySQL fetch failed:', error.message);
                return false;
            }
        },

        // Save data to MySQL API
        saveToMySQL: async function(action, data) {
            if (!this.config.enableMySQLSync) {
                return false;
            }

            try {
                const response = await fetch(`${this.config.apiBaseUrl}/sync.php?action=${action}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(data)
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const result = await response.json();
                console.log(` Saved to MySQL (${action}):`, result);
                return result.success;

            } catch (error) {
                console.warn(` Save to MySQL failed (${action}):`, error.message);
                return false;
            }
        },

        // Sync all localStorage data to MySQL
        syncAllToMySQL: async function() {
            if (!this.config.enableMySQLSync) {
                return false;
            }

            try {
                console.log(' Syncing all data to MySQL...');

                const data = {
                    users: JSON.parse(localStorage.getItem('admin_users') || '[]'),
                    packages: JSON.parse(localStorage.getItem('adminPackages') || '[]'),
                    config: {
                        contactInfo: JSON.parse(localStorage.getItem('adminContactInfo') || 'null'),
                        paymentConfig: JSON.parse(localStorage.getItem('admin_paymentConfig') || 'null')
                    }
                };

                const result = await this.saveToMySQL('sync', data);
                console.log(' Synced all data to MySQL');
                return result;

            } catch (error) {
                console.error(' Sync to MySQL failed:', error);
                return false;
            }
        },

        // Initialize service - ONLINE ONLY
        init: async function() {
            console.log(' Initializing SharedDataService v4.0 ONLINE ONLY MODE...');

            // Setup online/offline event listeners
            window.addEventListener('online', () => {
                this.state.isOnline = true;
                this.hideOfflineError();
                console.log(' Network online - syncing data...');
                this.fetchFromMySQL();
            });

            window.addEventListener('offline', () => {
                this.state.isOnline = false;
                this.showOfflineError();
                console.error(' Network offline - System cannot operate');
            });

            // Initial online check
            this.checkOnlineStatus();

            // REQUIRED: Fetch from MySQL (no fallback)
            if (this.state.isOnline) {
                const mysqlSuccess = await this.fetchFromMySQL();
                if (!mysqlSuccess) {
                    console.error(' Failed to connect to MySQL API. System cannot operate.');
                    this.showAPIError();
                    return;
                }
            } else {
                console.error(' System requires internet connection');
                return;
            }

            // Start background sync
            this.startBackgroundSync();

            // Setup real-time listeners
            this.setupRealTimeListeners();

            // Setup auto-actions
            this.setupAutoActions();

            // Initial sync from cache
            this.syncAll();

            console.log(' SharedDataService v4.0 initialized - ONLINE ONLY');
        },

        // Show API connection error
        showAPIError: function() {
            const errorDiv = document.createElement('div');
            errorDiv.id = 'api-error';
            errorDiv.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:white;padding:30px;border-radius:10px;box-shadow:0 4px 20px rgba(0,0,0,0.3);text-align:center;z-index:99999;max-width:400px;';
            errorDiv.innerHTML = `
                <h2 style="color:#FE5938;margin-bottom:15px;"> Lỗi Kết Nối Server</h2>
                <p style="color:#666;margin-bottom:20px;">Không thể kết nối đến MySQL API. Vui lòng kiểm tra:</p>
                <ul style="text-align:left;color:#666;margin-bottom:20px;">
                    <li>File api/config.php đã được cấu hình</li>
                    <li>Database MySQL đã được tạo</li>
                    <li>Server đang chạy</li>
                </ul>
                <button onclick="location.reload()" style="background:#E36323;color:white;border:none;padding:10px 20px;border-radius:5px;cursor:pointer;">
                     Thử Lại
                </button>
            `;
            document.body.appendChild(errorDiv);
        },

        // Sync all data
        syncAll: function() {
            console.log(' Syncing all data...');
            this.syncPackagesFromAdmin();
            this.syncUsersFromAdmin();
            this.state.lastSyncTime = new Date().toISOString();
        },

        // Enhanced package sync from admin
        syncPackagesFromAdmin: function() {
            try {
                const adminPackagesData = localStorage.getItem('adminPackages');
                if (!adminPackagesData) {
                    console.log(' No admin packages found in localStorage');
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

                console.log(` Synced ${Object.keys(userPackages).length} packages from admin`);

                // Broadcast update to components
                this.broadcastUpdate('packages_updated', userPackages);

                return userPackages;

            } catch (error) {
                console.error(' Error syncing packages from admin:', error);
                this.handleSyncError('packages', error);
                return {};
            }
        },

        // Get packages for user system (called by pricing-page.js)
        getPackages: function() {
            // First try to get from cached userPackages
            const cachedPackages = localStorage.getItem('userPackages');
            if (cachedPackages) {
                try {
                    return JSON.parse(cachedPackages);
                } catch (e) {
                    console.warn('Failed to parse cached packages, syncing fresh...');
                }
            }
            // Sync fresh from admin
            return this.syncPackagesFromAdmin();
        },

        // Enhanced user sync from admin
        syncUsersFromAdmin: function() {
            try {
                //  SỬA: Try multiple keys for admin users
                let adminUsersData = localStorage.getItem('registeredUsers') ||  // First priority: what admin saves
                                   localStorage.getItem('adminUsers') || 
                                   localStorage.getItem('admin_users'); // Legacy fallback
                if (!adminUsersData) {
                    console.log(' No admin users found in localStorage (checked both adminUsers and admin_users)');
                    return {};
                }

                const adminUsers = JSON.parse(adminUsersData);
                const demoAccounts = {};

                // Transform admin users to demo accounts (include active and pending for flexibility)
                adminUsers
                    .filter(user => user.status === 'active' || user.status === 'pending')
                    .forEach(user => {
                        //  SỬA: Index by username for login compatibility
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
                            //  THÊM: Add subscription fields for login compatibility
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

                console.log(` Synced ${Object.keys(demoAccounts).length} users from admin`);

                // Broadcast update to components
                this.broadcastUpdate('users_updated', demoAccounts);

                return demoAccounts;

            } catch (error) {
                console.error(' Error syncing users from admin:', error);
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

        //  CRITICAL: Add getPackages method for pricing page
        getPackages: function() {
            try {
                // Force sync packages first
                const syncedPackages = this.syncPackagesFromAdmin();
                
                if (syncedPackages && Object.keys(syncedPackages).length > 0) {
                    console.log(' [SharedDataService] getPackages returning synced packages:', Object.keys(syncedPackages).length);
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
                    
                    console.log(' [SharedDataService] getPackages returning transformed packages from fallback:', Object.keys(transformedPackages).length);
                    return transformedPackages;
                }
                
                console.log(' [SharedDataService] getPackages: No packages found');
                return {};
                
            } catch (error) {
                console.error(' [SharedDataService] getPackages error:', error);
                return {};
            }
        },

        // Enhanced payment approval handler
        handlePaymentApproval: async function(paymentData) {
            try {
                console.log(' Processing payment approval:', paymentData);

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

                    console.log(' Payment approval processed successfully');
                    return { success: true };
                }

            } catch (error) {
                console.error(' Error processing payment approval:', error);
                return { success: false, error: error.message };
            }
        },

        // Handle package purchase request
        handlePackageRequest: async function(requestData) {
            try {
                console.log(' Processing package request:', requestData);

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

                console.log(' Package request submitted successfully');
                return { success: true, requestId: newRequest.id };

            } catch (error) {
                console.error(' Error processing package request:', error);
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
                console.error(' Error updating user in admin:', error);
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

            //  ADD: Listen for admin data changes
            window.addEventListener('adminDataChanged', (event) => {
                if (event.detail.type === 'users') {
                    console.log(' [SharedDataService] Received admin users update');
                    this.syncUsersFromAdmin();
                } else if (event.detail.type === 'packages') {
                    console.log(' [SharedDataService] Received admin packages update');
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
            console.log(' Admin data changed:', data.type);

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
            console.log(' Performing full sync...');

            try {
                this.syncPackagesFromAdmin();
                this.syncUsersFromAdmin();
                
                this.state.errorCount = 0;
                this.state.isConnected = true;
                
                console.log(' Full sync completed');

            } catch (error) {
                console.error(' Full sync error:', error);
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

            console.log(` Background sync started (${this.config.pollingInterval}ms interval)`);
        },

        // Handle sync errors
        handleSyncError: function(operation, error) {
            this.state.errorCount++;
            
            if (this.state.errorCount >= this.config.maxRetries) {
                this.state.isConnected = false;
                console.error(` Sync failed after ${this.config.maxRetries} retries for ${operation}`);
                
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
            console.log(' [SharedDataService] DEBUG SYNC STATUS');
            
            // Check admin data
            const registeredUsers = localStorage.getItem('registeredUsers');
            const adminUsers = localStorage.getItem('adminUsers');
            const admin_users = localStorage.getItem('admin_users');
            
            console.log(' Admin Data Check:');
            console.log('- registeredUsers:', registeredUsers ? JSON.parse(registeredUsers).length + ' users' : 'null');
            console.log('- adminUsers:', adminUsers ? JSON.parse(adminUsers).length + ' users' : 'null');
            console.log('- admin_users:', admin_users ? JSON.parse(admin_users).length + ' users' : 'null');
            
            // Check synced data
            const syncedAccounts = localStorage.getItem('syncedDemoAccounts');
            console.log('- syncedDemoAccounts:', syncedAccounts ? Object.keys(JSON.parse(syncedAccounts)).length + ' accounts' : 'null');
            
            // Force sync
            console.log(' Forcing sync...');
            const result = this.syncUsersFromAdmin();
            console.log(' Sync result:', Object.keys(result).length + ' accounts');
            
            return result;
        },

        // Enhanced sync with better error handling
        forceSyncAllData: function() {
            console.log(' [SharedDataService] FORCE SYNC ALL DATA');
            
            try {
                // Sync users
                const users = this.syncUsersFromAdmin();
                console.log(' Users synced:', Object.keys(users).length);
                
                // Sync packages  
                const packages = this.syncPackagesFromAdmin();
                console.log(' Packages synced:', Object.keys(packages).length);
                
                // Broadcast updates
                this.broadcastUpdate('full_sync_complete', { users, packages });
                
                return { users, packages };
            } catch (error) {
                console.error(' Force sync failed:', error);
                return { users: {}, packages: {} };
            }
        },

        // Get contact info from admin
        getContactInfo: function() {
            try {
                const contactInfoData = localStorage.getItem('adminContactInfo');
                if (!contactInfoData) {
                    console.log(' No contact info found in localStorage');
                    return null;
                }

                const contactInfo = JSON.parse(contactInfoData);
                console.log(' Contact info loaded from admin');
                return contactInfo;
            } catch (error) {
                console.error(' Error loading contact info:', error);
                return null;
            }
        },

        // Save contact info (called from admin)
        saveContactInfo: function(contactInfo) {
            try {
                localStorage.setItem('adminContactInfo', JSON.stringify(contactInfo));
                localStorage.setItem('contactInfo_last_update', new Date().toISOString());

                // Broadcast update
                this.broadcastUpdate('contact_info_updated', contactInfo);

                console.log(' Contact info saved successfully');
                return { success: true };
            } catch (error) {
                console.error(' Error saving contact info:', error);
                return { success: false, error: error.message };
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
                    console.log(' No payment config found in localStorage');
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
                    
                    console.log(' Payment config loaded:', paymentConfig);
                    return paymentConfig;
                }
                
                return null;
            } catch (error) {
                console.error(' Error loading payment config:', error);
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
        console.log(' DATA SYNC DEBUG:');
        console.log('===================');
        console.log(' Admin Packages:', localStorage.getItem('adminPackages'));
        console.log(' Admin Packages (alt):', localStorage.getItem('admin_packages'));
        console.log(' Registered Users:', localStorage.getItem('registeredUsers'));
        console.log(' Admin Users:', localStorage.getItem('adminUsers'));
        console.log(' Admin Users (alt):', localStorage.getItem('admin_users'));
        console.log(' Admin Payment Config:', localStorage.getItem('admin_paymentConfig'));
        console.log(' Payment Config:', localStorage.getItem('paymentConfig'));
        
        // Force sync and test
        if (window.SharedDataService) {
            console.log(' Force syncing...');
            const packages = window.SharedDataService.syncPackagesFromAdmin();
            const users = window.SharedDataService.syncUsersFromAdmin();
            console.log(' Synced Packages:', Object.keys(packages).length, 'items');
            console.log(' Synced Users:', Object.keys(users).length, 'items');
            
            // Test getPackages method
            const packagesByMethod = window.SharedDataService.getPackages();
            console.log(' getPackages() returned:', Object.keys(packagesByMethod).length, 'items');
        } else {
            console.log(' SharedDataService not available');
        }
    };

    // Export to window
    window.SharedDataService = SharedDataService;

    console.log(' SharedDataService v4.0 loaded - ONLINE ONLY MODE (MySQL)');

})(); 