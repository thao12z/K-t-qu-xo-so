/**
 * Reconciliation Integration - Access Control & Usage Tracking
 * Manages user access based on package limits and tracks usage
 */

(function() {
    'use strict';

    console.log('🔗 Loading ReconciliationIntegration v1.0.0');

    const ReconciliationIntegration = {
        // Get user reconciliation access based on package
        getUserReconciliationAccess(userId, betType, amount) {
            try {
                const user = window.UserGlobalStateManager?.getUser(userId);
                if (!user) {
                    console.warn('User not found for reconciliation access check');
                    return { allowed: false, reason: 'User not found' };
                }

                // Check user status
                if (user.status !== 'active') {
                    return { allowed: false, reason: 'User not active' };
                }

                // Check subscription
                if (!user.package_end || new Date(user.package_end) <= new Date()) {
                    return { allowed: false, reason: 'Subscription expired' };
                }

                // Get package limits
                const packageLimits = this.getPackageLimits(user.package_type);
                if (!packageLimits) {
                    return { allowed: false, reason: 'Invalid package type' };
                }

                // Check daily usage limits
                const dailyUsage = this.getDailyUsage(userId);
                if (dailyUsage.betCount >= packageLimits.dailyBets) {
                    return { allowed: false, reason: 'Daily bet limit exceeded' };
                }

                if (dailyUsage.totalAmount + amount > packageLimits.maxBetAmount) {
                    return { allowed: false, reason: 'Daily amount limit exceeded' };
                }

                // Check bet type allowance
                if (!packageLimits.allowedBetTypes.includes(betType)) {
                    return { allowed: false, reason: 'Bet type not allowed in package' };
                }

                return { allowed: true, remainingBets: packageLimits.dailyBets - dailyUsage.betCount };
            } catch (error) {
                console.error('Reconciliation access check error:', error);
                return { allowed: false, reason: 'System error' };
            }
        },

        // Track reconciliation usage
        trackReconciliationUsage(userId, betType, amount) {
            try {
                const usage = this.getDailyUsage(userId);
                const today = new Date().toISOString().split('T')[0];

                // Update daily stats
                usage.betCount++;
                usage.totalAmount += amount;
                usage.lastBet = new Date().toISOString();

                // Update bet type stats
                if (!usage.betTypes[betType]) {
                    usage.betTypes[betType] = { count: 0, amount: 0 };
                }
                usage.betTypes[betType].count++;
                usage.betTypes[betType].amount += amount;

                // Save updated usage
                this.saveUsageHistory(userId, today, usage);

                console.log(`📊 Usage tracked: User ${userId}, ${betType}, ${amount.toLocaleString()}đ`);
                return true;
            } catch (error) {
                console.error('Usage tracking error:', error);
                return false;
            }
        },

        // Get daily usage for user
        getDailyUsage(userId) {
            try {
                const today = new Date().toISOString().split('T')[0];
                const usageKey = `usage_${userId}_${today}`;
                
                const stored = localStorage.getItem(usageKey);
                if (stored) {
                    return JSON.parse(stored);
                }

                // Return default usage
                return {
                    betCount: 0,
                    totalAmount: 0,
                    betTypes: {},
                    lastBet: null,
                    date: today
                };
            } catch (error) {
                console.error('Get daily usage error:', error);
                return {
                    betCount: 0,
                    totalAmount: 0,
                    betTypes: {},
                    lastBet: null,
                    date: new Date().toISOString().split('T')[0]
                };
            }
        },

        // Save usage history
        saveUsageHistory(userId, date, usage) {
            try {
                const usageKey = `usage_${userId}_${date}`;
                localStorage.setItem(usageKey, JSON.stringify(usage));
                
                // Also save to global history
                const historyKey = 'reconciliation_history';
                const history = JSON.parse(localStorage.getItem(historyKey) || '[]');
                
                const historyEntry = {
                    userId,
                    date,
                    usage,
                    timestamp: new Date().toISOString()
                };
                
                history.push(historyEntry);
                
                // Keep only last 30 days
                if (history.length > 30) {
                    history.splice(0, history.length - 30);
                }
                
                localStorage.setItem(historyKey, JSON.stringify(history));
            } catch (error) {
                console.error('Save usage history error:', error);
            }
        },

        // Update daily statistics
        updateDailyStats(userId) {
            try {
                const usage = this.getDailyUsage(userId);
                const user = window.UserGlobalStateManager?.getUser(userId);
                
                if (user) {
                    const stats = {
                        userId,
                        username: user.username,
                        packageType: user.package_type,
                        dailyBets: usage.betCount,
                        dailyAmount: usage.totalAmount,
                        lastActivity: usage.lastBet,
                        date: usage.date
                    };
                    
                    // Save to daily stats
                    const statsKey = `daily_stats_${usage.date}`;
                    const dailyStats = JSON.parse(localStorage.getItem(statsKey) || '[]');
                    dailyStats.push(stats);
                    localStorage.setItem(statsKey, JSON.stringify(dailyStats));
                    
                    return stats;
                }
            } catch (error) {
                console.error('Update daily stats error:', error);
            }
        },

        // Check usage limits
        checkUsageLimits(userId) {
            try {
                const user = window.UserGlobalStateManager?.getUser(userId);
                if (!user) return { exceeded: false };

                const packageLimits = this.getPackageLimits(user.package_type);
                if (!packageLimits) return { exceeded: false };

                const usage = this.getDailyUsage(userId);
                
                const limits = {
                    betCount: usage.betCount >= packageLimits.dailyBets,
                    amount: usage.totalAmount >= packageLimits.maxBetAmount,
                    betTypes: Object.keys(usage.betTypes).length >= packageLimits.allowedBetTypes.length
                };

                const exceeded = limits.betCount || limits.amount || limits.betTypes;
                
                return {
                    exceeded,
                    limits,
                    usage,
                    packageLimits
                };
            } catch (error) {
                console.error('Check usage limits error:', error);
                return { exceeded: false };
            }
        },

        // Show limit warning
        showLimitWarning(userId) {
            try {
                const limitCheck = this.checkUsageLimits(userId);
                if (limitCheck.exceeded) {
                    const warnings = [];
                    
                    if (limitCheck.limits.betCount) {
                        warnings.push('Đã đạt giới hạn số lần đặt cược hôm nay');
                    }
                    
                    if (limitCheck.limits.amount) {
                        warnings.push('Đã đạt giới hạn số tiền đặt cược hôm nay');
                    }
                    
                    if (limitCheck.limits.betTypes) {
                        warnings.push('Đã đạt giới hạn loại cược trong gói');
                    }
                    
                    // Show notification
                    if (window.BroadcastSync) {
                        window.BroadcastSync.showNotification(
                            '⚠️ Giới hạn gói',
                            warnings.join(', '),
                            'warning'
                        );
                    }
                    
                    return warnings;
                }
                
                return [];
            } catch (error) {
                console.error('Show limit warning error:', error);
                return [];
            }
        },

        // Validate bet access
        validateBetAccess(userId, betType, amount) {
            try {
                // Check reconciliation access
                const access = this.getUserReconciliationAccess(userId, betType, amount);
                
                if (!access.allowed) {
                    console.warn(`Bet access denied: ${access.reason}`);
                    return { allowed: false, reason: access.reason };
                }
                
                // Track usage if allowed
                this.trackReconciliationUsage(userId, betType, amount);
                
                // Check for warnings
                const warnings = this.showLimitWarning(userId);
                
                return {
                    allowed: true,
                    warnings,
                    remainingBets: access.remainingBets
                };
            } catch (error) {
                console.error('Validate bet access error:', error);
                return { allowed: false, reason: 'System error' };
            }
        },

        // Get package limits
        getPackageLimits(packageType) {
            const limits = {
                basic_7_days: {
                    dailyBets: 50,
                    maxBetAmount: 10000000, // 10M
                    allowedBetTypes: ['lô', 'đề'],
                    exportReports: false
                },
                standard_30_days: {
                    dailyBets: 200,
                    maxBetAmount: 50000000, // 50M
                    allowedBetTypes: ['lô', 'đề', 'xiên 2'],
                    exportReports: true
                },
                premium_90_days: {
                    dailyBets: 500,
                    maxBetAmount: 200000000, // 200M
                    allowedBetTypes: ['lô', 'đề', 'xiên 2', 'xiên 3'],
                    exportReports: true
                },
                enterprise_365_days: {
                    dailyBets: 1000,
                    maxBetAmount: 1000000000, // 1B
                    allowedBetTypes: ['lô', 'đề', 'xiên 2', 'xiên 3', 'xiên 4', 'ba càng'],
                    exportReports: true
                }
            };
            
            return limits[packageType] || limits.basic_7_days;
        }
    };

    // Export to window
    window.ReconciliationIntegration = ReconciliationIntegration;

    console.log('✅ ReconciliationIntegration loaded successfully');

})(); 