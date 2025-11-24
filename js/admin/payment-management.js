//  PAYMENT MANAGEMENT MODULE
// Version: 1.2.0 | Created: 2024 | ONLINE SYNC MODE
(function() {
    'use strict';

    const { useState, useEffect, useCallback, memo, useMemo } = React;

    // ===== API CONFIGURATION =====
    const API_BASE_URL = window.API_BASE_URL || '/api';

    // ===== MYSQL SYNC HELPER =====
    const syncPaymentToMySQL = async (paymentData, action = 'save') => {
        try {
            const response = await fetch(`${API_BASE_URL}/sync.php?action=payment`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(paymentData)
            });

            const result = await response.json();
            if (result.success) {
                console.log(` [PaymentManagement] MySQL sync ${action}:`, paymentData.id);
                return true;
            } else {
                console.error(` [PaymentManagement] MySQL sync failed:`, result.error);
                return false;
            }
        } catch (error) {
            console.error(' [PaymentManagement] MySQL sync error:', error);
            return false;
        }
    };

    const syncUserToMySQL = async (userData, action = 'save') => {
        try {
            const response = await fetch(`${API_BASE_URL}/sync.php?action=user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const result = await response.json();
            if (result.success) {
                console.log(` [PaymentManagement] User MySQL sync ${action}:`, userData.id);
                return true;
            } else {
                console.error(` [PaymentManagement] User MySQL sync failed:`, result.error);
                return false;
            }
        } catch (error) {
            console.error(' [PaymentManagement] User MySQL sync error:', error);
            return false;
        }
    };
    
    // ===== ORDER ID GENERATOR =====
    const generateOrderId = () => {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `ORDER${timestamp}${random}`;
    };
    
    // ===== PAYMENT MANAGEMENT COMPONENT =====
    const PaymentManagement = memo(() => {
        const [payments, setPayments] = useState([]);
        const [users, setUsers] = useState([]);
        const [packages, setPackages] = useState([]);
        const [loading, setLoading] = useState(true);
        const [filter, setFilter] = useState('all'); // all, pending, completed, failed
        
        // Subscribe to global state
        useEffect(() => {
            if (!window.GlobalStateManager) {
                console.error(' [PaymentManagement] GlobalStateManager not available');
                return;
            }
            
            console.log(' [PaymentManagement] COMPONENT_MOUNT');
            
            // Load initial data
            const initialPayments = window.GlobalStateManager.getData('payments');
            const initialUsers = window.GlobalStateManager.getData('users');
            const initialPackages = window.GlobalStateManager.getData('packages');
            
            setPayments(initialPayments);
            setUsers(initialUsers);
            setPackages(initialPackages);
            setLoading(false);
            
            // Subscribe to changes
            const unsubscribePayments = window.GlobalStateManager.subscribe('payments', (newPayments) => {
                console.log(' [PaymentManagement] PAYMENTS_UPDATE', { count: newPayments.length });
                setPayments(newPayments);
            }, 'PaymentManagement');
            
            const unsubscribeUsers = window.GlobalStateManager.subscribe('users', (newUsers) => {
                console.log(' [PaymentManagement] USERS_UPDATE', { count: newUsers.length });
                setUsers(newUsers);
            }, 'PaymentManagement');
            
            const unsubscribePackages = window.GlobalStateManager.subscribe('packages', (newPackages) => {
                console.log(' [PaymentManagement] PACKAGES_UPDATE', { count: newPackages.length });
                setPackages(newPackages);
            }, 'PaymentManagement');
            
            return () => {
                unsubscribePayments();
                unsubscribeUsers();
                unsubscribePackages();
                console.log(' [PaymentManagement] COMPONENT_UNMOUNT');
            };
        }, []);
        
        // Handle payment approval
        const handleApprovePayment = useCallback((paymentId) => {
            console.log(' [PaymentManagement] APPROVE_PAYMENT', { paymentId });
            
            try {
                // Find required data
                const payment = window.GlobalStateManager.findPayment(paymentId);
                if (!payment) {
                    alert(' Payment not found');
                    return;
                }
                
                const packageInfo = window.GlobalStateManager.findPackage(payment.packageId);
                if (!packageInfo) {
                    alert(' Package not found');
                    return;
                }
                
                const user = window.GlobalStateManager.findUser(payment.userId);
                if (!user) {
                    alert(' User not found');
                    return;
                }
                
                console.log(' [PaymentManagement] DATA_VALIDATED', {
                    payment: payment.id,
                    user: user.fullName,
                    package: packageInfo.name,
                    orderId: payment.orderId
                });
                
                // Calculate activation data
                let expiryDate = null;
                if (packageInfo.duration) {
                    const expiry = new Date();
                    expiry.setDate(expiry.getDate() + packageInfo.duration);
                    expiryDate = expiry.toISOString().split('T')[0];
                }
                
                const activationData = {
                    packageId: payment.packageId,
                    packageName: packageInfo.name,
                    expiryDate: expiryDate,
                    userName: user.fullName
                };
                
                // Atomic update - payment and user in single operation
                const success = window.GlobalStateManager.updatePaymentAndUser(
                    paymentId,
                    payment.userId,
                    activationData
                );
                
                if (!success) {
                    alert(' Failed to process payment approval');
                    return;
                }

                //  SYNC PAYMENT TO MYSQL
                const updatedPayment = {
                    ...payment,
                    status: 'completed',
                    approvedAt: new Date().toISOString(),
                    approvedBy: 'admin'
                };
                syncPaymentToMySQL(updatedPayment, 'approve').then(paymentSynced => {
                    if (paymentSynced) {
                        console.log(' [PaymentManagement] Payment synced to MySQL');
                    }
                });

                //  SYNC USER TO MYSQL
                const updatedUser = {
                    ...user,
                    status: 'active',
                    subscriptionType: activationData.packageId,
                    subscriptionPackage: activationData.packageName,
                    subscriptionStatus: 'active',
                    subscriptionExpiry: activationData.expiryDate,
                    activatedAt: new Date().toISOString(),
                    activatedBy: 'PaymentApproval'
                };
                syncUserToMySQL(updatedUser, 'activate').then(userSynced => {
                    if (userSynced) {
                        console.log(' [PaymentManagement] User activation synced to MySQL');
                    }
                });

                // Show success message with order ID
                const orderId = payment.orderId || 'N/A';
                alert(` Payment approved for ${user.fullName} - ${packageInfo.name}\nOrder ID: ${orderId}`);
                console.log(' [PaymentManagement] APPROVE_PAYMENT_SUCCESS', {
                    paymentId,
                    orderId: orderId,
                    packageName: packageInfo.name,
                    userName: user.fullName
                });

            } catch (error) {
                console.error(' [PaymentManagement] APPROVE_PAYMENT_ERROR', { error });
                alert(' Error occurred: ' + error.message);
            }
        }, []);
        
        // Handle payment rejection
        const handleRejectPayment = useCallback((paymentId) => {
            const payment = window.GlobalStateManager.findPayment(paymentId);
            if (!payment) return;

            if (confirm('Are you sure you want to reject this payment?')) {
                const rejectedPayment = {
                    ...payment,
                    status: 'failed',
                    rejectedAt: new Date().toISOString(),
                    rejectedBy: 'admin'
                };

                const currentPayments = window.GlobalStateManager.getData('payments');
                const updatedPayments = currentPayments.map(p =>
                    p.id === paymentId ? rejectedPayment : p
                );

                window.GlobalStateManager.updateData('payments', updatedPayments, 'PaymentManagement');

                //  SYNC TO MYSQL
                syncPaymentToMySQL(rejectedPayment, 'reject').then(success => {
                    if (success) {
                        console.log(' [PaymentManagement] Payment rejection synced to MySQL');
                    }
                });

                window.GlobalStateManager.addNotification(
                    ' Payment rejected',
                    'success',
                    'PaymentManagement'
                );

                console.log(' [PaymentManagement] PAYMENT_REJECTED', { paymentId });
            }
        }, []);
        
        // Format currency
        const formatCurrency = useCallback((amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        }, []);
        
        // Get payment status variant
        const getStatusVariant = useCallback((status) => {
            switch (status) {
                case 'completed': return 'success';
                case 'pending': return 'warning';
                case 'failed': return 'error';
                default: return 'default';
            }
        }, []);
        
        // Get payment method icon
        const getMethodIcon = useCallback((method) => {
            switch (method) {
                case 'bank_transfer': return '';
                case 'qr_code': return '';
                case 'bank_card': return '';
                case 'cash': return '';
                default: return '';
            }
        }, []);
        
        // Filter payments
        const filteredPayments = useCallback(() => {
            let filtered = payments;
            if (filter !== 'all') {
                filtered = payments.filter(payment => payment.status === filter);
            }
            
            // Sort by ID ascending
            return filtered.sort((a, b) => a.id - b.id);
        }, [payments, filter]);
        
        // Format transfer content with image preview
        const formatTransferContent = useCallback((content, imageUrl) => {
            if (!content) return 'N/A';
            
            const displayContent = content.length > 20 ? content.substring(0, 20) + '...' : content;
            
            return (
                <div className="flex flex-col space-y-1">
                    <span className="font-mono text-sm bg-[#F8F7F7] px-2 py-1 rounded">
                        {displayContent}
                    </span>
                    {imageUrl && (
                        <a 
                            href={imageUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-[#E36323] hover:text-[#DF5A18] underline"
                        >
                             Xem ảnh
                        </a>
                    )}
                </div>
            );
        }, []);
        
        // Calculate stats
        const stats = useMemo(() => {
            const completed = payments.filter(p => p.status === 'completed');
            const pending = payments.filter(p => p.status === 'pending');
            const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
            
            return {
                total: payments.length,
                completed: completed.length,
                pending: pending.length,
                failed: payments.filter(p => p.status === 'failed').length,
                revenue: totalRevenue
            };
        }, [payments]);
        
        if (loading) {
            return <window.LoadingSpinner size="large" message="Loading payments..." />;
        }
        
        const currentStats = stats;
        const currentPayments = filteredPayments();
        
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold"> Payment Management</h1>
                    
                    <div className="flex items-center space-x-4">
                        {/* Filter */}
                        <window.Select
                            value={filter}
                            onChange={setFilter}
                            options={[
                                { value: 'all', label: 'All Payments' },
                                { value: 'pending', label: 'Pending' },
                                { value: 'completed', label: 'Completed' },
                                { value: 'failed', label: 'Failed' }
                            ]}
                            className="w-48"
                        />
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-[#7B7B7B]">Total</p>
                                <p className="text-xl font-bold text-[#121212]">{currentStats.total}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-[#7B7B7B]">Completed</p>
                                <p className="text-xl font-bold text-[#10B981]">{currentStats.completed}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl">⏳</span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-[#7B7B7B]">Pending</p>
                                <p className="text-xl font-bold text-[#F59E0B]">{currentStats.pending}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-[#7B7B7B]">Failed</p>
                                <p className="text-xl font-bold text-[#FE5938]">{currentStats.failed}</p>
                            </div>
                        </div>
                    </window.Card>
                    
                    <window.Card padding="small">
                        <div className="flex items-center">
                            <span className="text-2xl"></span>
                            <div className="ml-3">
                                <p className="text-sm font-medium text-[#7B7B7B]">Revenue</p>
                                <p className="text-lg font-bold text-[#10B981]">
                                    {formatCurrency(currentStats.revenue)}
                                </p>
                            </div>
                        </div>
                    </window.Card>
                </div>
                
                {/* Payments Table */}
                <window.Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-[#F8F7F7]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Order ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Package</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Amount</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Method</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Transfer Content</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Date</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">User Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#ECECEC]">
                                {currentPayments.map((payment) => {
                                    const user = users.find(u => u.id === payment.userId);
                                    const packageInfo = packages.find(p => p.id === payment.packageId);
                                    
                                    // Debug log for payment data
                                    console.log(' [PaymentManagement] Rendering payment:', {
                                        id: payment.id,
                                        orderId: payment.orderId,
                                        userId: payment.userId,
                                        packageId: payment.packageId,
                                        packageName: packageInfo?.name,
                                        status: payment.status
                                    });
                                    
                                    return (
                                        <tr key={payment.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                                {payment.id}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                                <span className="font-mono text-[#E36323] font-medium">
                                                    {payment.orderId || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <div className="font-medium text-[#121212]">
                                                        {user?.fullName || 'Unknown User'}
                                                    </div>
                                                    <div className="text-sm text-[#7B7B7B]">
                                                        {user?.email}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                                {packageInfo?.name || payment.packageType || 'Unknown Package'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                                {formatCurrency(payment.amount)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                                {getMethodIcon(payment.method)} {payment.method}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                                {formatTransferContent(payment.transferContent, payment.imageUrl)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                                {new Date(payment.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <window.Badge variant={getStatusVariant(payment.status)}>
                                                    {payment.status}
                                                </window.Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <window.Badge variant={getStatusVariant(user?.status || 'unknown')}>
                                                    {user?.status || 'N/A'}
                                                </window.Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                                {payment.status === 'pending' && (
                                                    <>
                                                        <window.Button
                                                            size="small"
                                                            variant="success"
                                                            onClick={() => handleApprovePayment(payment.id)}
                                                        >
                                                             Approve
                                                        </window.Button>
                                                        <window.Button
                                                            size="small"
                                                            variant="danger"
                                                            onClick={() => handleRejectPayment(payment.id)}
                                                        >
                                                             Reject
                                                        </window.Button>
                                                    </>
                                                )}
                                                
                                                {payment.status === 'completed' && (
                                                    <span className="text-[#10B981] text-sm"> Processed</span>
                                                )}
                                                
                                                {payment.status === 'failed' && (
                                                    <span className="text-[#FE5938] text-sm"> Failed</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        
                        {currentPayments.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-[#7B7B7B]">No payments found</p>
                            </div>
                        )}
                    </div>
                </window.Card>
            </div>
        );
    });

    // ===== EXPORT TO GLOBAL SCOPE =====
    window.PaymentManagement = PaymentManagement;

})(); 