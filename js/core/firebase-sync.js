/**
 * Firebase Sync Service - Real-time cloud sync for user data
 * Cho phép sync data tự động giữa admin và users trên các thiết bị khác nhau
 */

(function() {
    'use strict';

    console.log(' Firebase Sync Service v1.0 loading...');

    const FirebaseSyncService = {
        // Firebase configuration
        config: null,
        database: null,
        isInitialized: false,
        isEnabled: false,

        // Initialize Firebase with config
        init: async function(firebaseConfig) {
            if (!firebaseConfig || !firebaseConfig.databaseURL) {
                console.log(' Firebase config not provided - sync disabled');
                this.isEnabled = false;
                return false;
            }

            try {
                // Check if Firebase SDK is loaded
                if (typeof firebase === 'undefined') {
                    console.warn(' Firebase SDK not loaded - loading from CDN...');
                    await this.loadFirebaseSDK();
                }

                // Initialize Firebase app if not already done
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }

                this.database = firebase.database();
                this.config = firebaseConfig;
                this.isInitialized = true;
                this.isEnabled = true;

                // Setup real-time listeners
                this.setupRealtimeListeners();

                // Initial sync from cloud
                await this.syncFromCloud();

                console.log(' Firebase Sync Service initialized successfully');
                return true;

            } catch (error) {
                console.error(' Firebase initialization failed:', error);
                this.isEnabled = false;
                return false;
            }
        },

        // Load Firebase SDK from CDN
        loadFirebaseSDK: function() {
            return new Promise((resolve, reject) => {
                // Firebase App
                const appScript = document.createElement('script');
                appScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js';
                appScript.onload = () => {
                    // Firebase Database
                    const dbScript = document.createElement('script');
                    dbScript.src = 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database-compat.js';
                    dbScript.onload = resolve;
                    dbScript.onerror = reject;
                    document.head.appendChild(dbScript);
                };
                appScript.onerror = reject;
                document.head.appendChild(appScript);
            });
        },

        // Save data to Firebase
        saveToCloud: async function(path, data) {
            if (!this.isEnabled || !this.database) {
                console.log(' Firebase not enabled - saving to localStorage only');
                return false;
            }

            try {
                await this.database.ref(path).set({
                    data: data,
                    updatedAt: new Date().toISOString(),
                    updatedBy: window.location.hostname
                });
                console.log(` Saved to cloud: ${path}`);
                return true;
            } catch (error) {
                console.error(` Failed to save to cloud: ${path}`, error);
                return false;
            }
        },

        // Get data from Firebase
        getFromCloud: async function(path) {
            if (!this.isEnabled || !this.database) {
                return null;
            }

            try {
                const snapshot = await this.database.ref(path).once('value');
                const result = snapshot.val();
                if (result && result.data) {
                    console.log(` Loaded from cloud: ${path}`);
                    return result.data;
                }
                return null;
            } catch (error) {
                console.error(` Failed to load from cloud: ${path}`, error);
                return null;
            }
        },

        // Sync all admin data to cloud
        syncToCloud: async function() {
            if (!this.isEnabled) return false;

            try {
                console.log(' Syncing all data to cloud...');

                // Get all admin data from localStorage
                const adminData = {
                    users: JSON.parse(localStorage.getItem('admin_users') || '[]'),
                    packages: JSON.parse(localStorage.getItem('adminPackages') || '[]'),
                    payments: JSON.parse(localStorage.getItem('adminPayments') || '[]'),
                    contactInfo: JSON.parse(localStorage.getItem('adminContactInfo') || 'null'),
                    paymentConfig: JSON.parse(localStorage.getItem('admin_paymentConfig') || 'null')
                };

                // Save to cloud
                await this.saveToCloud('adminData', adminData);

                console.log(' All data synced to cloud');
                return true;

            } catch (error) {
                console.error(' Sync to cloud failed:', error);
                return false;
            }
        },

        // Sync from cloud to localStorage
        syncFromCloud: async function() {
            if (!this.isEnabled) return false;

            try {
                console.log(' Syncing data from cloud...');

                const cloudData = await this.getFromCloud('adminData');
                if (!cloudData) {
                    console.log(' No cloud data found');
                    return false;
                }

                // Merge cloud data with localStorage
                if (cloudData.users && cloudData.users.length > 0) {
                    const localUsers = JSON.parse(localStorage.getItem('admin_users') || '[]');
                    const mergedUsers = this.mergeData(localUsers, cloudData.users, 'username');

                    localStorage.setItem('admin_users', JSON.stringify(mergedUsers));
                    localStorage.setItem('adminUsers', JSON.stringify(mergedUsers));
                    localStorage.setItem('registeredUsers', JSON.stringify(mergedUsers));

                    console.log(` Merged ${mergedUsers.length} users from cloud`);
                }

                if (cloudData.packages && cloudData.packages.length > 0) {
                    const localPackages = JSON.parse(localStorage.getItem('adminPackages') || '[]');
                    const mergedPackages = this.mergeData(localPackages, cloudData.packages, 'id');
                    localStorage.setItem('adminPackages', JSON.stringify(mergedPackages));
                    console.log(` Merged ${mergedPackages.length} packages from cloud`);
                }

                if (cloudData.payments && cloudData.payments.length > 0) {
                    const localPayments = JSON.parse(localStorage.getItem('adminPayments') || '[]');
                    const mergedPayments = this.mergeData(localPayments, cloudData.payments, 'id');
                    localStorage.setItem('adminPayments', JSON.stringify(mergedPayments));
                }

                if (cloudData.contactInfo) {
                    localStorage.setItem('adminContactInfo', JSON.stringify(cloudData.contactInfo));
                }

                if (cloudData.paymentConfig) {
                    localStorage.setItem('admin_paymentConfig', JSON.stringify(cloudData.paymentConfig));
                }

                // Trigger SharedDataService sync
                if (window.SharedDataService) {
                    window.SharedDataService.syncAll();
                }

                console.log(' Cloud sync completed');
                return true;

            } catch (error) {
                console.error(' Sync from cloud failed:', error);
                return false;
            }
        },

        // Merge local and cloud data
        mergeData: function(localData, cloudData, keyField) {
            const localMap = new Map(localData.map(item => [item[keyField], item]));

            cloudData.forEach(cloudItem => {
                const localItem = localMap.get(cloudItem[keyField]);
                if (!localItem) {
                    // New item from cloud
                    localMap.set(cloudItem[keyField], cloudItem);
                } else {
                    // Check which is newer
                    const cloudTime = new Date(cloudItem.updatedAt || cloudItem.createdAt || 0).getTime();
                    const localTime = new Date(localItem.updatedAt || localItem.createdAt || 0).getTime();
                    if (cloudTime > localTime) {
                        localMap.set(cloudItem[keyField], cloudItem);
                    }
                }
            });

            return Array.from(localMap.values());
        },

        // Setup real-time listeners for cloud changes
        setupRealtimeListeners: function() {
            if (!this.isEnabled || !this.database) return;

            // Listen for changes to admin data
            this.database.ref('adminData').on('value', (snapshot) => {
                const data = snapshot.val();
                if (data && data.updatedBy !== window.location.hostname) {
                    console.log(' Cloud data changed - syncing...');
                    this.syncFromCloud();
                }
            });

            console.log(' Real-time listeners setup complete');
        },

        // Auto-sync when admin data changes
        onAdminDataChanged: async function(dataType, data) {
            if (!this.isEnabled) return;

            console.log(` Admin data changed: ${dataType}`);

            // Debounce to avoid too many writes
            if (this._syncTimeout) {
                clearTimeout(this._syncTimeout);
            }

            this._syncTimeout = setTimeout(() => {
                this.syncToCloud();
            }, 1000); // Wait 1 second before syncing
        },

        // Get sync status
        getStatus: function() {
            return {
                isEnabled: this.isEnabled,
                isInitialized: this.isInitialized,
                config: this.config ? {
                    projectId: this.config.projectId,
                    databaseURL: this.config.databaseURL
                } : null
            };
        }
    };

    // Export to window
    window.FirebaseSyncService = FirebaseSyncService;

    // Auto-initialize if config is available
    document.addEventListener('DOMContentLoaded', () => {
        // Check for Firebase config in localStorage or window
        const savedConfig = localStorage.getItem('firebase_config');
        if (savedConfig) {
            try {
                const config = JSON.parse(savedConfig);
                FirebaseSyncService.init(config);
            } catch (e) {
                console.log(' Invalid saved Firebase config');
            }
        } else if (window.FIREBASE_CONFIG) {
            FirebaseSyncService.init(window.FIREBASE_CONFIG);
        }
    });

    console.log(' Firebase Sync Service loaded');

})();
