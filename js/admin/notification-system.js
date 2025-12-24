//  NOTIFICATION SYSTEM MODULE
// Version: 1.0.0 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';
    
    const { useState, useEffect, useCallback, memo } = React;
    
    // ===== NOTIFICATION SYSTEM COMPONENT =====
    const NotificationSystem = memo(() => {
        const [notifications, setNotifications] = useState([]);
        const [showAll, setShowAll] = useState(false);
        const [filter, setFilter] = useState('all'); // all, unread, success, error, warning, info
        const [loading, setLoading] = useState(true);
        
        // Subscribe to global notifications
        useEffect(() => {
            if (!window.GlobalStateManager) {
                console.error(' [NotificationSystem] GlobalStateManager not available');
                return;
            }
            
            console.log(' [NotificationSystem] COMPONENT_MOUNT');
            
            // Load initial data
            const initialNotifications = window.GlobalStateManager.getData('notifications');
            setNotifications(initialNotifications);
            setLoading(false);
            
            // Subscribe to changes
            const unsubscribe = window.GlobalStateManager.subscribe('notifications', (newNotifications) => {
                console.log(' [NotificationSystem] NOTIFICATIONS_UPDATE', { count: newNotifications.length });
                setNotifications(newNotifications);
            }, 'NotificationSystem');
            
            return () => {
                unsubscribe();
                console.log(' [NotificationSystem] COMPONENT_UNMOUNT');
            };
        }, []);
        
        // Mark notification as read
        const markAsRead = useCallback((notificationId) => {
            const updatedNotifications = notifications.map(n => 
                n.id === notificationId ? { ...n, read: true } : n
            );
            window.GlobalStateManager.updateData('notifications', updatedNotifications, 'NotificationSystem');
            
            console.log(' [NotificationSystem] NOTIFICATION_MARKED_READ', { notificationId });
        }, [notifications]);
        
        // Mark all as read
        const markAllAsRead = useCallback(() => {
            const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
            window.GlobalStateManager.updateData('notifications', updatedNotifications, 'NotificationSystem');
            
            window.GlobalStateManager.addNotification(
                ' All notifications marked as read',
                'success',
                'NotificationSystem'
            );
            
            console.log(' [NotificationSystem] ALL_NOTIFICATIONS_MARKED_READ');
        }, [notifications]);
        
        // Clear old notifications (older than 7 days)
        const clearOldNotifications = useCallback(() => {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            
            const filteredNotifications = notifications.filter(n => 
                new Date(n.timestamp) > sevenDaysAgo
            );
            
            window.GlobalStateManager.updateData('notifications', filteredNotifications, 'NotificationSystem');
            
            window.GlobalStateManager.addNotification(
                ' Old notifications cleared',
                'info',
                'NotificationSystem'
            );
            
            console.log(' [NotificationSystem] OLD_NOTIFICATIONS_CLEARED', { 
                removed: notifications.length - filteredNotifications.length 
            });
        }, [notifications]);
        
        // Clear all notifications
        const clearAllNotifications = useCallback(() => {
            if (confirm('Are you sure you want to clear all notifications?')) {
                window.GlobalStateManager.updateData('notifications', [], 'NotificationSystem');
                
                window.GlobalStateManager.addNotification(
                    ' All notifications cleared',
                    'info',
                    'NotificationSystem'
                );
                
                console.log(' [NotificationSystem] ALL_NOTIFICATIONS_CLEARED');
            }
        }, []);
        
        // Filter notifications
        const filteredNotifications = useCallback(() => {
            return notifications.filter(n => {
                if (filter === 'unread') return !n.read;
                if (filter !== 'all') return n.type === filter;
                return true;
            });
        }, [notifications, filter]);
        
        // Get notification icon
        const getNotificationIcon = useCallback((type) => {
            switch (type) {
                case 'success': return '';
                case 'error': return '';
                case 'warning': return '';
                case 'info': return '';
                default: return '';
            }
        }, []);
        
        // Get notification color
        const getNotificationColor = useCallback((type) => {
            switch (type) {
                case 'success': return 'border-green-200 bg-green-50';
                case 'error': return 'border-red-200 bg-red-50';
                case 'warning': return 'border-yellow-200 bg-yellow-50';
                case 'info': return 'border-blue-200 bg-blue-50';
                default: return 'border-gray-200 bg-gray-50';
            }
        }, []);
        
        if (loading) {
            return <window.LoadingSpinner size="large" message="Loading notifications..." />;
        }
        
        const currentNotifications = filteredNotifications();
        const displayNotifications = showAll ? currentNotifications : currentNotifications.slice(0, 10);
        const unreadCount = notifications.filter(n => !n.read).length;
        
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold"> Notification System</h1>
                    <div className="flex space-x-3">
                        {unreadCount > 0 && (
                            <window.Button
                                onClick={markAllAsRead}
                                variant="secondary"
                                size="small"
                            >
                                 Mark All Read
                            </window.Button>
                        )}
                        <window.Button
                            onClick={clearOldNotifications}
                            variant="warning"
                            size="small"
                        >
                             Clear Old
                        </window.Button>
                        <window.Button
                            onClick={clearAllNotifications}
                            variant="danger"
                            size="small"
                        >
                             Clear All
                        </window.Button>
                    </div>
                </div>
                
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Total</p>
                                <p className="text-xl font-bold text-gray-900">{notifications.length}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Unread</p>
                                <p className="text-xl font-bold text-blue-900">{unreadCount}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Success</p>
                                <p className="text-xl font-bold text-green-900">
                                    {notifications.filter(n => n.type === 'success').length}
                                </p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-gray-600">Errors</p>
                                <p className="text-xl font-bold text-red-900">
                                    {notifications.filter(n => n.type === 'error').length}
                                </p>
                            </div>
                        </div>
                    </window.Card>
                </div>
                
                {/* Filter Tabs */}
                <window.Card>
                    <div className="flex space-x-2 mb-4 text-sm">
                        {[
                            { key: 'all', label: 'All', count: notifications.length },
                            { key: 'unread', label: 'Unread', count: unreadCount },
                            { key: 'success', label: 'Success', count: notifications.filter(n => n.type === 'success').length },
                            { key: 'error', label: 'Error', count: notifications.filter(n => n.type === 'error').length },
                            { key: 'warning', label: 'Warning', count: notifications.filter(n => n.type === 'warning').length },
                            { key: 'info', label: 'Info', count: notifications.filter(n => n.type === 'info').length }
                        ].map(tab => (
                            <button
                                key={tab.key}
                                onClick={() => setFilter(tab.key)}
                                className={`px-3 py-1 rounded ${
                                    filter === tab.key 
                                        ? 'bg-blue-500 text-white' 
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                            >
                                {tab.label} ({tab.count})
                            </button>
                        ))}
                    </div>
                    
                    {/* Notifications List */}
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                        {displayNotifications.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">No notifications found</p>
                        ) : (
                            displayNotifications.map(notification => (
                                <div
                                    key={notification.id}
                                    onClick={() => !notification.read && markAsRead(notification.id)}
                                    className={`p-3 rounded-lg border cursor-pointer transition-all ${
                                        getNotificationColor(notification.type)
                                    } ${!notification.read ? 'ring-2 ring-blue-200' : 'opacity-70'}`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-start space-x-3 flex-1">
                                            <div className="flex-shrink-0 mt-0.5">
                                                {getNotificationIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm ${!notification.read ? 'font-medium' : ''}`}>
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {new Date(notification.timestamp).toLocaleString('vi-VN')}
                                                    {notification.source && (
                                                        <span className="ml-2 text-gray-400">
                                                            • {notification.source}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                        </div>
                                        {!notification.read && (
                                            <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1"></span>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    
                    {/* Show More Button */}
                    {currentNotifications.length > 10 && (
                        <div className="mt-4 pt-4 border-t">
                            <window.Button
                                onClick={() => setShowAll(!showAll)}
                                variant="secondary"
                                className="w-full"
                            >
                                {showAll ? 'Show Less' : `Show All (${currentNotifications.length})`}
                            </window.Button>
                        </div>
                    )}
                </window.Card>
            </div>
        );
    });

    // ===== EXPORT TO GLOBAL SCOPE =====
    window.NotificationSystem = NotificationSystem;
    
})(); 