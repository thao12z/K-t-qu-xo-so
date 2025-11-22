/**
 * Enhanced Packages - Detailed Package Structure & Features
 * Comprehensive package definitions with reconciliation limits
 */

(function() {
    'use strict';

    console.log('📦 Loading EnhancedPackages v1.0.0');

    // Simple and clean package definitions
    const EnhancedPackages = {
        packages: {
            basic_7_days: {
                id: 'basic_7_days',
                name: 'Gói Cơ Bản',
                duration: 7,
                price: 500000,
                features: [
                    'Đối soát lô đề cơ bản',
                    'Hỗ trợ lô và đề',
                    'Tối đa 50 lần đặt cược/ngày'
                ],
                reconciliationLimits: {
                    dailyBets: 50,
                    maxBetAmount: 1000000,
                    allowedBetTypes: ['lo', 'de'],
                    exportReports: false,
                    analytics: false,
                    priority: 'normal'
                },
                support: 'email'
            },
            
            standard_30_days: {
                id: 'standard_30_days',
                name: 'Gói Tiêu Chuẩn',
                duration: 30,
                price: 2000000,
                features: [
                    'Đối soát lô đề nâng cao',
                    'Hỗ trợ tất cả loại cược',
                    'Tối đa 200 lần đặt cược/ngày',
                    'Xuất báo cáo',
                    'Hỗ trợ 24/7'
                ],
                reconciliationLimits: {
                    dailyBets: 200,
                    maxBetAmount: 5000000,
                    allowedBetTypes: ['lo', 'de', 'xien2', 'xien3', 'bacang'],
                    exportReports: true,
                    analytics: false,
                    priority: 'high'
                },
                support: 'phone'
            }
        },

        // Get package by ID
        getPackage: function(packageId) {
            return this.packages[packageId] || null;
        },

        // Get all packages
        getAllPackages: function() {
            return Object.values(this.packages);
        },

        // Get sorted packages by price
        getSortedPackages: function() {
            return Object.values(this.packages).sort(function(a, b) {
                return a.price - b.price; 
            });
        },

        // Calculate package value
        calculatePackageValue: function(packageId) {
            const pkg = this.getPackage(packageId);
            if (!pkg) return 0;
            
            const dailyValue = pkg.price / pkg.duration;
            const betValue = pkg.reconciliationLimits.dailyBets * 1000;
            const amountValue = pkg.reconciliationLimits.maxBetAmount * 0.01;
            
            return dailyValue + betValue + amountValue;
        },

        // Format package for display
        formatForDisplay: function(packageId) {
            const pkg = this.getPackage(packageId);
            if (!pkg) return null;
            
            return {
                id: pkg.id,
                name: pkg.name,
                duration: pkg.duration,
                price: pkg.price,
                features: pkg.features,
                formattedPrice: this.formatMoney(pkg.price),
                dailyPrice: this.formatMoney(pkg.price / pkg.duration),
                value: this.calculatePackageValue(packageId),
                reconciliationLimits: pkg.reconciliationLimits,
                support: pkg.support
            };
        },

        // Format money
        formatMoney: function(amount) {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        },

        // Sync with admin system
        syncWithAdmin: function() {
            try {
                if (window.BroadcastSync && window.SharedDataService) {
                    console.log('📦 Setting up sync with admin system');
                    
                    window.BroadcastSync.addListener('packages_updated', function(data) {
                        console.log('📦 Received package updates from admin:', data);
                        
                        if (data.packages) {
                            Object.assign(this.packages, data.packages);
                            console.log('✅ Packages synced with admin');
                        }
                    }.bind(this));
                    
                    // Request package data using the correct method
                    window.SharedDataService.syncPackagesFromAdmin();
                    console.log('✅ Admin sync initialized');
                } else {
                    console.warn('⚠️ BroadcastSync or SharedDataService not available');
                }
            } catch (error) {
                console.error('❌ Sync setup failed:', error);
            }
        }
    };

    // Export to window IMMEDIATELY
    window.EnhancedPackages = EnhancedPackages;
    console.log('✅ EnhancedPackages exported to window');

    // Fallback export if dependencies not available
    if (!window.BroadcastSync || !window.SharedDataService) {
        console.warn('⚠️ EnhancedPackages: Dependencies not ready, using standalone mode');
        // Create minimal implementations
        window.BroadcastSync = window.BroadcastSync || { addListener: function() {} };
        window.SharedDataService = window.SharedDataService || { requestData: function() {} };
    }

    // Defer sync setup with longer delay
    setTimeout(function() {
        try {
            if (window.EnhancedPackages && window.EnhancedPackages.syncWithAdmin) {
                window.EnhancedPackages.syncWithAdmin();
            }
        } catch (error) {
            console.warn('EnhancedPackages sync deferred:', error.message);
        }
    }, 2000); // Longer delay for dependencies to load

    console.log('✅ EnhancedPackages loaded successfully (with fallbacks)');

})(); 