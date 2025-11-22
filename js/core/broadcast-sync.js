/**
 * Broadcast Sync System - Real-time Admin ↔ User Synchronization
 * Enhanced with WebSocket support and auto-recovery
 */

const BroadcastSync = {
    channel: null,
    socket: null,
    isInitialized: false,
    listeners: new Map(),
    reconnectAttempts: 0,
    maxReconnectAttempts: 5,
    syncQueue: [],
    isProcessingQueue: false,

    // Initialize with WebSocket support
    init: function(wsUrl = null) {
        if (this.isInitialized) return;

        try {
            // Initialize BroadcastChannel for local sync
            this.channel = new BroadcastChannel('lode_b2b_sync_v2');
            console.log('📡 BroadcastSync initialized');

            this.channel.onmessage = (event) => {
                this.handleMessage(event.data, 'local');
            };

            // Initialize WebSocket for server sync if URL provided
            if (wsUrl) {
                this.initWebSocket(wsUrl);
            }

            this.isInitialized = true;
            this.reconnectAttempts = 0;

            // Send initialization signal
            this.broadcast('system_init', {
                source: this.getSystemType(),
                timestamp: Date.now(),
                version: '2.1.0',
                capabilities: ['broadcast', 'websocket', 'queue']
            });

            // Start processing queued messages
            this.processQueue();

        } catch (error) {
            console.error('❌ Failed to initialize BroadcastSync:', error);
            this.handleError();
        }
    },

    // Initialize WebSocket connection
    initWebSocket: function(wsUrl) {
        try {
            this.socket = new WebSocket(wsUrl);
            
            this.socket.onopen = () => {
                console.log('🌐 WebSocket connected');
                this.reconnectAttempts = 0;
                this.processQueue();
            };

            this.socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data, 'websocket');
                    // Broadcast to other local tabs
                    this.channel.postMessage(data);
                } catch (error) {
                    console.error('❌ WebSocket message parse error:', error);
                }
            };

            this.socket.onclose = () => {
                console.log('🔌 WebSocket disconnected');
                this.handleWebSocketReconnect(wsUrl);
            };

            this.socket.onerror = (error) => {
                console.error('❌ WebSocket error:', error);
            };

        } catch (error) {
            console.error('❌ WebSocket initialization error:', error);
        }
    },

    // Handle WebSocket reconnection
    handleWebSocketReconnect: function(wsUrl) {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
            
            console.log(`🔄 Reconnecting WebSocket (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms`);
            
            setTimeout(() => {
                this.initWebSocket(wsUrl);
            }, delay);
        } else {
            console.error('❌ WebSocket reconnection failed after maximum attempts');
        }
    },

    // Enhanced message handling with source tracking
    handleMessage: function(data, source = 'unknown') {
        console.log(`📨 Broadcast received from ${source}:`, data);

        if (!data || !data.type) {
            console.warn('⚠️ Invalid broadcast message format');
            return;
        }

        // Prevent message loops
        if (data.source === this.getSystemType() && source === 'local') {
            return;
        }

        try {
            switch(data.type) {
                case 'packages_updated':
                    this.handlePackagesUpdate(data.payload);
                    break;
                case 'user_activated':
                    this.handleUserActivation(data.payload);
                    break;
                case 'payment_approved':
                    this.handlePaymentApproval(data.payload);
                    break;
                case 'user_status_changed':
                    this.handleUserStatusChange(data.payload);
                    break;
                case 'new_purchase_request':
                    this.handleNewPurchaseRequest(data.payload);
                    break;
                case 'system_maintenance':
                    this.handleSystemMaintenance(data.payload);
                    break;
                case 'real_time_notification':
                    this.handleRealTimeNotification(data.payload);
                    break;
                case 'heartbeat':
                    this.handleHeartbeat(data.payload);
                    break;
                default:
                    console.log('📋 Unknown message type:', data.type);
            }

            this.triggerListeners(data.type, data.payload);

        } catch (error) {
            console.error('❌ Error handling message:', error);
        }
    },

    // Enhanced message broadcasting with queue
    broadcast: function(type, payload, priority = 'normal') {
        const message = {
            type,
            payload,
            timestamp: Date.now(),
            source: this.getSystemType(),
            id: this.generateMessageId(),
            priority
        };

        // Local broadcast
        try {
            if (this.channel) {
                this.channel.postMessage(message);
            }
        } catch (error) {
            console.error('❌ Local broadcast error:', error);
        }

        // WebSocket broadcast with queue
        if (this.socket?.readyState === WebSocket.OPEN) {
            try {
                this.socket.send(JSON.stringify(message));
            } catch (error) {
                console.error('❌ WebSocket send error:', error);
                this.queueMessage(message);
            }
        } else {
            this.queueMessage(message);
        }

        return true;
    },

    // Message queue management
    queueMessage: function(message) {
        this.syncQueue.push(message);
        
        // Limit queue size
        if (this.syncQueue.length > 100) {
            this.syncQueue = this.syncQueue.slice(-50);
        }
    },

    // Process queued messages
    processQueue: function() {
        if (this.isProcessingQueue || this.syncQueue.length === 0) {
            return;
        }

        if (this.socket?.readyState !== WebSocket.OPEN) {
            return;
        }

        this.isProcessingQueue = true;

        try {
            // Sort by priority and timestamp
            this.syncQueue.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority === 'high' ? -1 : 1;
                }
                return a.timestamp - b.timestamp;
            });

            // Process messages
            while (this.syncQueue.length > 0 && this.socket?.readyState === WebSocket.OPEN) {
                const message = this.syncQueue.shift();
                this.socket.send(JSON.stringify(message));
            }

        } catch (error) {
            console.error('❌ Queue processing error:', error);
        } finally {
            this.isProcessingQueue = false;
        }
    },

    // Enhanced event handlers
    handlePackagesUpdate: function(payload) {
        if (window.SharedDataService) {
            window.SharedDataService.syncPackagesFromAdmin();
        }
        this.showNotification('Gói dịch vụ đã được cập nhật!', 'info');
        
        // Auto-refresh pricing page
        if (window.location.pathname.includes('pricing')) {
            setTimeout(() => location.reload(), 1000);
        }
    },

    handleUserActivation: function(payload) {
        const currentUserId = this.getCurrentUserId();
        if (payload.userId === currentUserId) {
            this.showNotification('🎉 Tài khoản của bạn đã được kích hoạt!', 'success');
            
            // Auto-refresh user data
            if (window.AuthService) {
                setTimeout(() => {
                    window.AuthService.logout();
                    window.location.href = '/user/index.html';
                }, 2000);
            }
        }
    },

    handlePaymentApproval: function(payload) {
        const currentUserId = this.getCurrentUserId();
        if (payload.userId === currentUserId) {
            this.showNotification('✅ Thanh toán đã được duyệt!', 'success');
            
            // Update user package immediately
            if (window.UserGlobalStateManager) {
                window.UserGlobalStateManager.updateUserPackage(payload.packageInfo);
            }
            
            setTimeout(() => {
                if (confirm('Thanh toán đã được duyệt! Trang sẽ được tải lại để cập nhật thông tin.')) {
                    location.reload();
                }
            }, 1500);
        }
    },

    handleUserStatusChange: function(payload) {
        const currentUserId = this.getCurrentUserId();
        if (payload.userId === currentUserId) {
            if (payload.status === 'suspended') {
                this.showNotification('⚠️ Tài khoản đã bị tạm khóa. Vui lòng liên hệ admin.', 'warning');
            } else if (payload.status === 'expired') {
                this.showNotification('⏰ Gói dịch vụ đã hết hạn. Vui lòng gia hạn.', 'warning');
            }
        }
    },

    handleNewPurchaseRequest: function(payload) {
        if (this.getSystemType() === 'admin') {
            this.showNotification(`💰 Yêu cầu mua gói mới từ ${payload.username}`, 'info');
            
            if (window.GlobalStateManager) {
                window.GlobalStateManager.addNotification({
                    type: 'purchase_request',
                    message: `Yêu cầu mua gói từ ${payload.username}`,
                    data: payload
                });
            }
        }
    },

    handleSystemMaintenance: function(payload) {
        if (payload.status === 'starting') {
            this.showNotification('🔧 Hệ thống sẽ bảo trì trong vài phút. Vui lòng lưu công việc.', 'warning');
        } else if (payload.status === 'completed') {
            this.showNotification('✅ Bảo trì hoàn tất. Hệ thống đã được cập nhật.', 'success');
        }
    },

    handleRealTimeNotification: function(payload) {
        this.showNotification(payload.message, payload.type || 'info');
    },

    handleHeartbeat: function(payload) {
        // Respond to server heartbeat
        if (this.socket?.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({
                type: 'heartbeat_response',
                timestamp: Date.now(),
                source: this.getSystemType()
            }));
        }
    },

    // Add listener
    addListener: function(eventType, callback) {
        if (!this.listeners.has(eventType)) {
            this.listeners.set(eventType, []);
        }
        this.listeners.get(eventType).push(callback);
    },

    // Remove listener
    removeListener: function(eventType, callback) {
        if (this.listeners.has(eventType)) {
            const callbacks = this.listeners.get(eventType);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    },

    // Trigger listeners
    triggerListeners: function(eventType, payload) {
        if (this.listeners.has(eventType)) {
            this.listeners.get(eventType).forEach(callback => {
                try {
                    callback(payload);
                } catch (error) {
                    console.error('❌ Error in custom listener:', error);
                }
            });
        }
    },

    // Get system type
    getSystemType: function() {
        if (window.location.pathname.includes('admin')) {
            return 'admin';
        } else if (window.location.pathname.includes('user')) {
            return 'user';
        } else {
            return 'unknown';
        }
    },

    // Get current user ID
    getCurrentUserId: function() {
        if (window.UserGlobalStateManager && window.UserGlobalStateManager.getCurrentUser) {
            const user = window.UserGlobalStateManager.getCurrentUser();
            return user ? user.id : null;
        }
        
        const userData = localStorage.getItem('currentUser');
        if (userData) {
            try {
                return JSON.parse(userData).id;
            } catch (e) {
                return null;
            }
        }
        
        return null;
    },

    // Generate message ID
    generateMessageId: function() {
        return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    // Enhanced notification system
    showNotification: function(message, type = 'info') {
        if (window.showToast) {
            window.showToast(message, type);
            return;
        }

        console.log(`🔔 ${type.toUpperCase()}: ${message}`);
        
        const toast = document.createElement('div');
        toast.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-sm ${this.getToastStyles(type)} animate-slide-in`;
        toast.innerHTML = `
            <div class="flex items-center">
                <span class="flex-1">${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-2 text-lg hover:opacity-80">&times;</button>
            </div>
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            if (toast.parentElement) {
                toast.classList.add('animate-slide-out');
                setTimeout(() => toast.remove(), 300);
            }
        }, 5000);
    },

    // Get toast styles
    getToastStyles: function(type) {
        switch (type) {
            case 'success':
                return 'bg-green-500 text-white border-l-4 border-green-700';
            case 'error':
                return 'bg-red-500 text-white border-l-4 border-red-700';
            case 'warning':
                return 'bg-yellow-500 text-black border-l-4 border-yellow-700';
            default:
                return 'bg-blue-500 text-white border-l-4 border-blue-700';
        }
    },

    // Handle errors
    handleError: function() {
        console.error('❌ BroadcastSync encountered an error');
        // Implement retry logic if needed
    },

    // Cleanup
    destroy: function() {
        if (this.channel) {
            this.channel.close();
            this.channel = null;
        }
        
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.listeners.clear();
        this.syncQueue = [];
        this.isInitialized = false;
        console.log('🗑️ BroadcastSync destroyed');
    }
};

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    BroadcastSync.init();
});

window.addEventListener('beforeunload', () => {
    BroadcastSync.destroy();
});

// Export
window.BroadcastSync = BroadcastSync; 