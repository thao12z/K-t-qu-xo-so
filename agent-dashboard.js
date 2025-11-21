/**
 * Enhanced Agent Dashboard - Predictive Analytics & Advanced Reporting
 * Real-time metrics, trend analysis, and comprehensive reporting
 */

const AgentDashboard = {
    // Configuration
    config: {
        refreshInterval: 10000, // 10 seconds
        maxHistoryDays: 365,
        enablePredictive: true,
        enableRealTime: true
    },

    // State management
    state: {
        isInitialized: false,
        lastUpdate: null,
        cachedData: new Map(),
        realTimeMetrics: {},
        subscriptions: new Set()
    },

    // Initialize dashboard
    init: function() {
        if (this.state.isInitialized) return;

        console.log('📊 Initializing Enhanced Agent Dashboard...');
        
        this.setupEventListeners();
        this.startRealTimeUpdates();
        this.state.isInitialized = true;
        
        console.log('✅ Enhanced Agent Dashboard initialized');
    },

    // Real-time metrics
    getRealtimeMetrics: function() {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        
        // Simulate real-time data (in production, this would come from WebSocket)
        const metrics = {
            timestamp: now.toISOString(),
            currentOnline: this.getOnlineUsers(),
            activeGames: this.getActiveGames(),
            pendingBets: this.getPendingBets(),
            todayRevenue: this.getTodayRevenue(),
            todayProfit: this.getTodayProfit(),
            recentActivity: this.getRecentActivity(10),
            systemHealth: this.getSystemHealth(),
            alerts: this.getActiveAlerts()
        };

        this.state.realTimeMetrics = metrics;
        return metrics;
    },

    // Enhanced daily statistics
    getDailyStats: function(userId) {
        const today = new Date().toISOString().split('T')[0];
        const history = this.getBettingHistory(userId, 1);
        
        if (history.length === 0) {
            return {
                date: today,
                totalBets: 0,
                totalAmount: 0,
                winAmount: 0,
                lossAmount: 0,
                netResult: 0,
                winRate: 0,
                avgBetAmount: 0,
                topNumbers: [],
                hourlyDistribution: this.getEmptyHourlyDistribution(),
                betTypeDistribution: {},
                riskScore: 0,
                performance: 'no_data'
            };
        }

        // Calculate comprehensive daily statistics
        const stats = history.reduce((acc, record) => {
            acc.totalBets += record.betData.totalBets;
            acc.totalAmount += record.betData.totalAmount;
            acc.winAmount += record.betData.winAmount;
            acc.lossAmount += record.betData.lossAmount;
            
            // Track numbers frequency
            if (record.betData.numbers) {
                record.betData.numbers.forEach(num => {
                    acc.numberFrequency[num] = (acc.numberFrequency[num] || 0) + 1;
                });
            }
            
            // Track bet types
            if (record.betData.betTypes) {
                record.betData.betTypes.forEach(type => {
                    acc.betTypeFrequency[type] = (acc.betTypeFrequency[type] || 0) + 1;
                });
            }
            
            // Track hourly distribution
            const hour = new Date(record.timestamp).getHours();
            acc.hourlyDistribution[hour] = (acc.hourlyDistribution[hour] || 0) + record.betData.totalBets;
            
            return acc;
        }, {
            totalBets: 0,
            totalAmount: 0,
            winAmount: 0,
            lossAmount: 0,
            numberFrequency: {},
            betTypeFrequency: {},
            hourlyDistribution: {}
        });

        const netResult = stats.winAmount - stats.lossAmount;
        const winRate = stats.totalBets > 0 ? (stats.winAmount > 0 ? 1 : 0) : 0;
        const avgBetAmount = stats.totalBets > 0 ? stats.totalAmount / stats.totalBets : 0;

        // Get top numbers
        const topNumbers = Object.entries(stats.numberFrequency)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([number, count]) => ({ number, count }));

        return {
            date: today,
            totalBets: stats.totalBets,
            totalAmount: stats.totalAmount,
            winAmount: stats.winAmount,
            lossAmount: stats.lossAmount,
            netResult,
            winRate: Math.round(winRate * 100),
            avgBetAmount: Math.round(avgBetAmount),
            topNumbers,
            hourlyDistribution: stats.hourlyDistribution,
            betTypeDistribution: stats.betTypeFrequency,
            riskScore: this.calculateRiskScore(history),
            performance: netResult > 0 ? 'profit' : netResult < 0 ? 'loss' : 'break_even'
        };
    },

    // Enhanced weekly statistics
    getWeeklyStats: function(userId) {
        const history = this.getBettingHistory(userId, 7);
        const dailyStats = [];
        
        // Generate daily breakdown for the week
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayHistory = history.filter(record => 
                record.date === dateStr
            );
            
            const dayStats = this.calculateDayStats(dayHistory, dateStr);
            dailyStats.push(dayStats);
        }

        // Calculate week totals
        const weekTotals = dailyStats.reduce((acc, day) => {
            acc.totalBets += day.totalBets;
            acc.totalAmount += day.totalAmount;
            acc.winAmount += day.winAmount;
            acc.lossAmount += day.lossAmount;
            return acc;
        }, { totalBets: 0, totalAmount: 0, winAmount: 0, lossAmount: 0 });

        return {
            period: 'week',
            dailyStats,
            totals: {
                ...weekTotals,
                netResult: weekTotals.winAmount - weekTotals.lossAmount,
                avgDailyBets: Math.round(weekTotals.totalBets / 7),
                avgDailyAmount: Math.round(weekTotals.totalAmount / 7)
            },
            trends: this.calculateTrends(dailyStats),
            insights: this.generateInsights(dailyStats)
        };
    },

    // Enhanced monthly report
    getMonthlyReport: function(userId, month, year) {
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);
        const daysInMonth = endDate.getDate();
        
        const history = this.getBettingHistory(userId, daysInMonth);
        const monthlyData = {
            month,
            year,
            period: `${year}-${String(month).padStart(2, '0')}`,
            dailyBreakdown: [],
            summary: {},
            analytics: {},
            recommendations: []
        };

        // Generate daily breakdown
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month - 1, day);
            const dateStr = date.toISOString().split('T')[0];
            
            const dayHistory = history.filter(record => record.date === dateStr);
            const dayStats = this.calculateDayStats(dayHistory, dateStr);
            
            monthlyData.dailyBreakdown.push(dayStats);
        }

        // Calculate summary
        monthlyData.summary = this.calculateMonthlySummary(monthlyData.dailyBreakdown);
        
        // Generate analytics
        monthlyData.analytics = this.generateMonthlyAnalytics(monthlyData.dailyBreakdown);
        
        // Generate recommendations
        monthlyData.recommendations = this.generateRecommendations(monthlyData);

        return monthlyData;
    },

    // Predictive analytics
    getPredictiveAnalytics: function(userId) {
        if (!this.config.enablePredictive) {
            return { available: false, message: 'Predictive analytics disabled' };
        }

        const history = this.getBettingHistory(userId, 90);
        
        if (history.length < 7) {
            return { 
                available: false, 
                message: 'Insufficient data for predictions (minimum 7 days required)' 
            };
        }

        return {
            available: true,
            trendAnalysis: this.analyzeTrends(history),
            riskScore: this.calculateRiskScore(history),
            recommendations: this.generateRecommendations(history),
            forecast: this.generateForecast(history),
            patterns: this.identifyPatterns(history),
            anomalies: this.detectAnomalies(history)
        };
    },

    // Performance metrics
    getPerformanceMetrics: function(userId) {
        const history = this.getBettingHistory(userId, 30);
        
        if (history.length === 0) {
            return {
                roi: 0,
                winRate: 0,
                avgBetSize: 0,
                profitFactor: 0,
                consistency: 0,
                riskLevel: 'unknown'
            };
        }

        const totals = history.reduce((acc, record) => {
            acc.totalBets += record.betData.totalBets;
            acc.totalAmount += record.betData.totalAmount;
            acc.winAmount += record.betData.winAmount;
            acc.lossAmount += record.betData.lossAmount;
            acc.winCount += record.betData.winAmount > 0 ? 1 : 0;
            return acc;
        }, { totalBets: 0, totalAmount: 0, winAmount: 0, lossAmount: 0, winCount: 0 });

        const roi = totals.totalAmount > 0 ? 
            ((totals.winAmount - totals.lossAmount) / totals.totalAmount) * 100 : 0;
        
        const winRate = history.length > 0 ? (totals.winCount / history.length) * 100 : 0;
        
        const avgBetSize = totals.totalBets > 0 ? totals.totalAmount / totals.totalBets : 0;
        
        const profitFactor = totals.lossAmount > 0 ? totals.winAmount / totals.lossAmount : 0;
        
        return {
            roi: Math.round(roi * 100) / 100,
            winRate: Math.round(winRate),
            avgBetSize: Math.round(avgBetSize),
            profitFactor: Math.round(profitFactor * 100) / 100,
            consistency: this.calculateConsistency(history),
            riskLevel: this.assessRiskLevel(roi, winRate, profitFactor)
        };
    },

    // Advanced reporting with charts
    exportAdvancedReport: function(userId, period = 'month') {
        const data = this.gatherReportData(userId, period);
        const charts = this.generateCharts(data);
        const insights = this.generateInsights(data);
        
        const report = {
            metadata: {
                userId,
                period,
                generated: new Date().toISOString(),
                version: '2.0'
            },
            data,
            charts,
            insights,
            summary: this.generateSummary(data),
            recommendations: this.generateRecommendations(data)
        };

        return this.createExportableReport(report);
    },

    // Export to CSV with enhanced data
    exportDataToCSV: function(data, filename = 'agent_report.csv') {
        if (!data || !Array.isArray(data)) {
            console.error('❌ Invalid data for CSV export');
            return false;
        }

        try {
            // Enhanced CSV headers
            const headers = [
                'Date', 'Total Bets', 'Total Amount', 'Win Amount', 'Loss Amount', 
                'Net Result', 'Win Rate %', 'Avg Bet Size', 'Risk Score',
                'Top Numbers', 'Bet Types', 'Performance'
            ];

            const csvContent = [
                headers.join(','),
                ...data.map(row => [
                    row.date,
                    row.totalBets,
                    row.totalAmount,
                    row.winAmount,
                    row.lossAmount,
                    row.netResult,
                    row.winRate,
                    row.avgBetAmount,
                    row.riskScore,
                    `"${row.topNumbers?.map(n => n.number).join(', ') || ''}"`,
                    `"${Object.keys(row.betTypeDistribution || {}).join(', ')}"`,
                    row.performance
                ].join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log('✅ CSV export completed:', filename);
            return true;

        } catch (error) {
            console.error('❌ CSV export error:', error);
            return false;
        }
    },

    // Helper methods
    getBettingHistory: function(userId, days = 30) {
        try {
            const historyKey = `reconciliation_history_${userId}`;
            const storedHistory = localStorage.getItem(historyKey);
            
            if (!storedHistory) return [];

            const history = JSON.parse(storedHistory);
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - days);

            return history.filter(record => {
                const recordDate = new Date(record.timestamp);
                return recordDate >= cutoffDate;
            });

        } catch (error) {
            console.error('❌ Error getting betting history:', error);
            return [];
        }
    },

    calculateDayStats: function(dayHistory, date) {
        if (dayHistory.length === 0) {
            return {
                date,
                totalBets: 0,
                totalAmount: 0,
                winAmount: 0,
                lossAmount: 0,
                netResult: 0,
                winRate: 0,
                avgBetAmount: 0,
                sessions: 0,
                performance: 'no_data'
            };
        }

        const stats = dayHistory.reduce((acc, record) => {
            acc.totalBets += record.betData.totalBets;
            acc.totalAmount += record.betData.totalAmount;
            acc.winAmount += record.betData.winAmount;
            acc.lossAmount += record.betData.lossAmount;
            acc.sessions += 1;
            return acc;
        }, { totalBets: 0, totalAmount: 0, winAmount: 0, lossAmount: 0, sessions: 0 });

        const netResult = stats.winAmount - stats.lossAmount;
        const winRate = stats.sessions > 0 ? (stats.winAmount > 0 ? 1 : 0) : 0;
        const avgBetAmount = stats.totalBets > 0 ? stats.totalAmount / stats.totalBets : 0;

        return {
            date,
            ...stats,
            netResult,
            winRate: Math.round(winRate * 100),
            avgBetAmount: Math.round(avgBetAmount),
            performance: netResult > 0 ? 'profit' : netResult < 0 ? 'loss' : 'break_even'
        };
    },

    calculateRiskScore: function(history) {
        if (history.length === 0) return 0;

        // Calculate volatility based on daily results
        const dailyResults = history.map(record => 
            record.betData.winAmount - record.betData.lossAmount
        );

        const avgResult = dailyResults.reduce((a, b) => a + b, 0) / dailyResults.length;
        const variance = dailyResults.reduce((acc, result) => 
            acc + Math.pow(result - avgResult, 2), 0) / dailyResults.length;
        
        const volatility = Math.sqrt(variance);
        
        // Normalize to 0-100 scale
        return Math.min(100, Math.round((volatility / 100000) * 100));
    },

    // Real-time helper methods
    getOnlineUsers: function() {
        // Simulate real-time data
        return Math.floor(Math.random() * 50) + 10;
    },

    getActiveGames: function() {
        return Math.floor(Math.random() * 5) + 1;
    },

    getPendingBets: function() {
        return Math.floor(Math.random() * 20);
    },

    getTodayRevenue: function() {
        return Math.floor(Math.random() * 10000000) + 1000000;
    },

    getTodayProfit: function() {
        return Math.floor(Math.random() * 2000000) - 1000000;
    },

    getRecentActivity: function(limit = 10) {
        // Simulate recent activity
        const activities = [];
        for (let i = 0; i < limit; i++) {
            activities.push({
                id: i,
                type: ['bet_placed', 'bet_won', 'bet_lost'][Math.floor(Math.random() * 3)],
                amount: Math.floor(Math.random() * 100000) + 10000,
                timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
            });
        }
        return activities;
    },

    getSystemHealth: function() {
        return {
            status: 'healthy',
            uptime: '99.9%',
            responseTime: Math.floor(Math.random() * 100) + 50,
            errorRate: Math.random() * 0.1
        };
    },

    getActiveAlerts: function() {
        return [];
    },

    // Event listeners and real-time updates
    setupEventListeners: function() {
        // Listen for data updates
        window.addEventListener('sharedDataUpdate', (event) => {
            this.handleDataUpdate(event.detail);
        });

        // Listen for user activity
        if (window.BroadcastSync) {
            window.BroadcastSync.addListener('bet_processed', (data) => {
                this.handleBetProcessed(data);
            });
        }
    },

    startRealTimeUpdates: function() {
        if (!this.config.enableRealTime) return;

        setInterval(() => {
            this.getRealtimeMetrics();
            this.notifySubscribers();
        }, this.config.refreshInterval);
    },

    handleDataUpdate: function(data) {
        this.state.lastUpdate = new Date().toISOString();
        this.notifySubscribers();
    },

    handleBetProcessed: function(data) {
        // Update real-time metrics when bets are processed
        this.getRealtimeMetrics();
        this.notifySubscribers();
    },

    notifySubscribers: function() {
        this.state.subscriptions.forEach(callback => {
            try {
                callback(this.state.realTimeMetrics);
            } catch (error) {
                console.error('❌ Error notifying subscriber:', error);
            }
        });
    },

    // Subscription management
    subscribe: function(callback) {
        this.state.subscriptions.add(callback);
        return () => this.state.subscriptions.delete(callback);
    },

    // Placeholder UI renderer (to be implemented based on UI framework)
    renderDashboardUI: function(userId, containerId) {
        console.log('📊 Rendering enhanced dashboard UI for user:', userId);
        // Implementation depends on UI framework (React, Vue, etc.)
        return {
            success: true,
            message: 'Dashboard UI rendered successfully'
        };
    }
};

// Auto-initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        AgentDashboard.init();
    });
} else {
    AgentDashboard.init();
}

// Export
window.AgentDashboard = AgentDashboard; 