//  PENDING REQUESTS MODULE - Handle User Registrations & Payments
// Version: 1.1.0 | Created: 2024 | ONLINE SYNC MODE
(function() {
    'use strict';

    const { useState, useEffect, useCallback, memo } = React;

    // ===== API CONFIGURATION =====
    const API_BASE_URL = window.API_BASE_URL || '/api';

    // ===== MYSQL SYNC HELPERS =====
    const syncUserToMySQL = async (userData, action = 'save') => {
        try {
            const response = await fetch(`${API_BASE_URL}/sync.php?action=user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            if (result.success) {
                console.log(` [PendingRequests] User MySQL sync ${action}:`, userData.id);
                return true;
            } else {
                console.error(` [PendingRequests] User MySQL sync failed:`, result.error);
                return false;
            }
        } catch (error) {
            console.error(' [PendingRequests] User MySQL sync error:', error);
            return false;
        }
    };

    const syncPaymentToMySQL = async (paymentData, action = 'save') => {
        try {
            const response = await fetch(`${API_BASE_URL}/sync.php?action=payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();
            if (result.success) {
                console.log(` [PendingRequests] Payment MySQL sync ${action}:`, paymentData.id);
                return true;
            } else {
                console.error(` [PendingRequests] Payment MySQL sync failed:`, result.error);
                return false;
            }
        } catch (error) {
            console.error(' [PendingRequests] Payment MySQL sync error:', error);
            return false;
        }
    };
    
    // ===== PENDING REQUESTS COMPONENT =====
    const PendingRequests = memo(() => {
        const [pendingUsers, setPendingUsers] = useState([]);
        const [pendingPayments, setPendingPayments] = useState([]);
        const [activeTab, setActiveTab] = useState('users');
        const [loading, setLoading] = useState(true);
        
        // Load data from localStorage
        useEffect(() => {
            loadPendingData();
            
            // Setup interval to refresh data
            const interval = setInterval(loadPendingData, 5000);
            
            return () => clearInterval(interval);
        }, []);
        
        const loadPendingData = useCallback(() => {
            try {
                // Load pending users
                const usersData = localStorage.getItem('adminPendingUsers');
                if (usersData) {
                    setPendingUsers(JSON.parse(usersData));
                }
                
                // Load pending payments
                const paymentsData = localStorage.getItem('adminPendingPayments');
                if (paymentsData) {
                    setPendingPayments(JSON.parse(paymentsData));
                }
                
                setLoading(false);
            } catch (error) {
                console.error('Error loading pending data:', error);
                setLoading(false);
            }
        }, []);
        
        // Approve user registration
        const handleApproveUser = useCallback((userData) => {
            try {
                // Create new user in admin system
                const newUser = {
                    id: Date.now(),
                    username: userData.username,
                    email: userData.email,
                    fullName: userData.fullName,
                    phone: userData.phone,
                    password: userData.password,
                    role: 'user',
                    accountType: 'user',
                    status: 'active',
                    hasAdminAccess: false,
                    subscriptionType: userData.packageId,
                    subscriptionPackage: userData.packageName,
                    subscriptionExpiry: calculateExpiryDate(userData.packageId),
                    subscriptionStatus: 'active',
                    createdAt: new Date().toISOString(),
                    createdBy: 'admin_approval',
                    activatedAt: new Date().toISOString(),
                    activatedBy: 'admin_manual',
                    source: userData.source
                };
                
                // Add to admin users
                const currentUsers = window.GlobalStateManager.getData('users');
                currentUsers.push(newUser);
                window.GlobalStateManager.updateData('users', currentUsers, 'PendingRequests');

                //  SYNC USER TO MYSQL
                syncUserToMySQL(newUser, 'approve').then(success => {
                    if (success) {
                        console.log(' [PendingRequests] New user synced to MySQL');
                    }
                });

                // Remove from pending
                const updatedPending = pendingUsers.filter(u => u.id !== userData.id);
                setPendingUsers(updatedPending);
                localStorage.setItem('adminPendingUsers', JSON.stringify(updatedPending));

                // Create payment record if exists
                if (userData.paymentId) {
                    const paymentData = pendingPayments.find(p => p.id === userData.paymentId);
                    if (paymentData) {
                        const paymentRecord = {
                            id: paymentData.id,
                            userId: newUser.id,
                            packageId: userData.packageId,
                            amount: userData.packagePrice,
                            method: paymentData.method,
                            status: 'completed',
                            createdAt: paymentData.createdAt,
                            approvedAt: new Date().toISOString(),
                            approvedBy: 'admin'
                        };

                        const currentPayments = window.GlobalStateManager.getData('payments');
                        currentPayments.push(paymentRecord);
                        window.GlobalStateManager.updateData('payments', currentPayments, 'PendingRequests');

                        //  SYNC PAYMENT TO MYSQL
                        syncPaymentToMySQL(paymentRecord, 'approve').then(success => {
                            if (success) {
                                console.log(' [PendingRequests] Payment synced to MySQL');
                            }
                        });

                        // Remove from pending payments
                        const updatedPendingPayments = pendingPayments.filter(p => p.id !== paymentData.id);
                        setPendingPayments(updatedPendingPayments);
                        localStorage.setItem('adminPendingPayments', JSON.stringify(updatedPendingPayments));
                    }
                }

                window.GlobalStateManager.addNotification(
                    ` User ${userData.fullName} approved and activated`,
                    'success',
                    'PendingRequests'
                );
                
            } catch (error) {
                console.error('Error approving user:', error);
                window.GlobalStateManager.addNotification(
                    ' Error approving user',
                    'error',
                    'PendingRequests'
                );
            }
        }, [pendingUsers, pendingPayments]);
        
        // Reject user registration
        const handleRejectUser = useCallback((userData) => {
            if (confirm(`Are you sure you want to reject ${userData.fullName}'s registration?`)) {
                const updatedPending = pendingUsers.filter(u => u.id !== userData.id);
                setPendingUsers(updatedPending);
                localStorage.setItem('adminPendingUsers', JSON.stringify(updatedPending));
                
                // Also remove associated payment if exists
                if (userData.paymentId) {
                    const updatedPendingPayments = pendingPayments.filter(p => p.id !== userData.paymentId);
                    setPendingPayments(updatedPendingPayments);
                    localStorage.setItem('adminPendingPayments', JSON.stringify(updatedPendingPayments));
                }
                
                window.GlobalStateManager.addNotification(
                    ` Registration rejected for ${userData.fullName}`,
                    'warning',
                    'PendingRequests'
                );
            }
        }, [pendingUsers, pendingPayments]);
        
        // Calculate expiry date based on package
        const calculateExpiryDate = useCallback((packageId) => {
            // Get package info
            const packages = window.GlobalStateManager.getData('packages');
            const packageInfo = packages.find(p => p.id === packageId);
            
            if (packageInfo && packageInfo.duration) {
                const expiry = new Date();
                expiry.setDate(expiry.getDate() + packageInfo.duration);
                return expiry.toISOString().split('T')[0];
            }
            
            return null;
        }, []);
        
        // Format currency
        const formatCurrency = useCallback((amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        }, []);
        
        // Get status badge
        const getStatusBadge = useCallback((status) => {
            const statusMap = {
                'pending_payment': { variant: 'warning', label: 'Pending Payment' },
                'pending': { variant: 'warning', label: 'Pending' },
                'completed': { variant: 'success', label: 'Completed' }
            };
            
            const statusInfo = statusMap[status] || { variant: 'default', label: status };
            return React.createElement(window.Badge, { variant: statusInfo.variant }, statusInfo.label);
        }, []);
        
        if (loading) {
            return React.createElement(window.LoadingSpinner, { size: 'large', message: 'Loading pending requests...' });
        }
        
        return React.createElement('div', { className: 'space-y-6' },
            // Header
            React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('h1', { className: 'text-2xl font-bold' }, ' Pending Requests'),
                React.createElement('div', { className: 'flex gap-2' },
                    React.createElement(window.Badge, { variant: 'warning' }, `${pendingUsers.length} Users`),
                    React.createElement(window.Badge, { variant: 'info' }, `${pendingPayments.length} Payments`)
                )
            ),
            
            // Tab Navigation
            React.createElement('div', { className: 'border-b border-[#ECECEC]' },
                React.createElement('nav', { className: '-mb-px flex space-x-8' },
                    [
                        { id: 'users', label: ' Pending Users', count: pendingUsers.length },
                        { id: 'payments', label: ' Pending Payments', count: pendingPayments.length }
                    ].map(tab => 
                        React.createElement('button', {
                            key: tab.id,
                            onClick: () => setActiveTab(tab.id),
                            className: `py-2 px-1 border-b-2 font-medium text-sm ${
                                activeTab === tab.id
                                    ? 'border-[#E36323] text-[#E36323]'
                                    : 'border-transparent text-[#7B7B7B] hover:text-[#121212] hover:border-gray-300'
                            }`
                        }, `${tab.label} (${tab.count})`)
                    )
                )
            ),
            
            // Content
            React.createElement('div', { className: 'mt-6' },
                // Pending Users Tab
                activeTab === 'users' && React.createElement(window.Card, { title: 'Pending User Registrations' },
                    pendingUsers.length === 0 ? 
                        React.createElement('p', { className: 'text-[#7B7B7B] text-center py-8' }, 'No pending user registrations') :
                        React.createElement('div', { className: 'overflow-x-auto' },
                            React.createElement('table', { className: 'min-w-full' },
                                React.createElement('thead', { className: 'bg-[#F8F7F7]' },
                                    React.createElement('tr', {},
                                        ['Full Name', 'Username', 'Email', 'Phone', 'Package', 'Created', 'Actions'].map(header =>
                                            React.createElement('th', {
                                                key: header,
                                                className: 'px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase'
                                            }, header)
                                        )
                                    )
                                ),
                                React.createElement('tbody', { className: 'bg-white divide-y divide-[#ECECEC]' },
                                    pendingUsers.map(user =>
                                        React.createElement('tr', { key: user.id },
                                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                                React.createElement('div', {},
                                                    React.createElement('div', { className: 'font-medium text-[#121212]' }, user.fullName),
                                                    React.createElement('div', { className: 'text-sm text-[#7B7B7B]' }, user.source)
                                                )
                                            ),
                                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-[#121212]' }, user.username),
                                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-[#121212]' }, user.email),
                                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-[#121212]' }, user.phone),
                                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap' },
                                                React.createElement('div', {},
                                                    React.createElement('div', { className: 'text-sm font-medium text-[#121212]' }, user.packageName),
                                                    React.createElement('div', { className: 'text-sm text-[#7B7B7B]' }, formatCurrency(user.packagePrice))
                                                )
                                            ),
                                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm text-[#7B7B7B]' },
                                                new Date(user.createdAt).toLocaleDateString('vi-VN')
                                            ),
                                            React.createElement('td', { className: 'px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2' },
                                                React.createElement(window.Button, {
                                                    size: 'small',
                                                    variant: 'success',
                                                    onClick: () => handleApproveUser(user)
                                                }, ' Approve'),
                                                React.createElement(window.Button, {
                                                    size: 'small',
                                                    variant: 'danger',
                                                    onClick: () => handleRejectUser(user)
                                                }, ' Reject')
                                            )
                                        )
                                    )
                                )
                            )
                        )
                ),
                
                // Pending Payments Tab
                activeTab === 'payments' && React.createElement(window.Card, { title: 'Pending Payments' },
                    pendingPayments.length === 0 ? 
                        React.createElement('p', { className: 'text-[#7B7B7B] text-center py-8' }, 'No pending payments') :
                        React.createElement('div', { className: 'space-y-4' },
                            pendingPayments.map(payment =>
                                React.createElement('div', {
                                    key: payment.id,
                                    className: 'border rounded-lg p-4'
                                },
                                    React.createElement('div', { className: 'flex justify-between items-start' },
                                        React.createElement('div', { className: 'flex-1' },
                                            React.createElement('h4', { className: 'font-medium text-[#121212] mb-2' }, 
                                                `${payment.userInfo.fullName} - ${payment.packageName}`
                                            ),
                                            React.createElement('div', { className: 'grid grid-cols-2 gap-4 text-sm text-[#7B7B7B]' },
                                                React.createElement('div', {},
                                                    React.createElement('p', {}, React.createElement('strong', {}, 'Amount: '), formatCurrency(payment.amount)),
                                                    React.createElement('p', {}, React.createElement('strong', {}, 'Method: '), payment.methodName),
                                                    React.createElement('p', {}, React.createElement('strong', {}, 'Email: '), payment.userInfo.email)
                                                ),
                                                React.createElement('div', {},
                                                    React.createElement('p', {}, React.createElement('strong', {}, 'Phone: '), payment.userInfo.phone),
                                                    React.createElement('p', {}, React.createElement('strong', {}, 'Created: '), 
                                                        new Date(payment.createdAt).toLocaleDateString('vi-VN')
                                                    ),
                                                    React.createElement('p', {}, getStatusBadge(payment.status))
                                                )
                                            ),
                                            
                                            // Payment proof
                                            payment.paymentProof && React.createElement('div', { className: 'mt-4' },
                                                React.createElement('p', { className: 'text-sm font-medium text-[#121212] mb-2' }, 'Payment Proof:'),
                                                React.createElement('img', {
                                                    src: payment.paymentProof.dataUrl,
                                                    alt: 'Payment Proof',
                                                    className: 'max-w-48 max-h-48 border rounded-lg cursor-pointer',
                                                    onClick: () => window.open(payment.paymentProof.dataUrl, '_blank')
                                                })
                                            )
                                        )
                                    )
                                )
                            )
                        )
                )
            )
        );
    });
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.PendingRequests = PendingRequests;
    
    console.log(' PendingRequests module loaded successfully');
    
})(); 