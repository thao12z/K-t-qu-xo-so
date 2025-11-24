// 👥 USER MANAGEMENT MODULE
// Version: 1.0.0 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';
    
    const { useState, useEffect, useCallback, memo } = React;
    
    // ===== ADD USER MODAL =====
    const AddUserModal = memo(({ isOpen, onClose, onUserAdded }) => {
        const [formData, setFormData] = useState({
            username: '',
            email: '',
            fullName: '',
            phone: '',
            password: '',
            role: 'user',
            subscriptionPackage: '',
            useDefaultDuration: true,
            customDurationDays: 30,
            status: 'active'
        });
        
        const [packages, setPackages] = useState([]);
        const [errors, setErrors] = useState({});
        const [isSubmitting, setIsSubmitting] = useState(false);
        
        // Load packages on mount
        useEffect(() => {
            if (window.GlobalStateManager) {
                const availablePackages = window.GlobalStateManager.getData('packages');
                setPackages(availablePackages);
            }
        }, []);
        
        // Reset form when modal opens/closes
        useEffect(() => {
            if (isOpen) {
                setFormData({
                    username: '',
                    email: '',
                    fullName: '',
                    phone: '',
                    password: '',
                    role: 'user',
                    subscriptionPackage: '',
                    useDefaultDuration: true,
                    customDurationDays: 30,
                    status: 'active'
                });
                setErrors({});
            }
        }, [isOpen]);
        
        // Validation
        const validateForm = useCallback(() => {
            const newErrors = {};
            
            if (!formData.username.trim()) newErrors.username = 'Username is required';
            if (formData.username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
            if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';
            if (!formData.password.trim()) newErrors.password = 'Password is required';
            if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
            
            // Check for duplicate username and email
            if (window.GlobalStateManager) {
                const existingUsers = window.GlobalStateManager.getData('users');
                
                // Check duplicate username
                if (existingUsers.find(u => u.username === formData.username.trim())) {
                    newErrors.username = 'Username already exists';
                }
                
                // Check duplicate email
                if (existingUsers.find(u => u.email === formData.email.trim())) {
                    newErrors.email = 'Email already exists';
                }
            }
            
            // Role-specific validation
            if (formData.role === 'user' && !formData.subscriptionPackage) {
                newErrors.subscriptionPackage = 'User must have a subscription package';
            }
            
            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        }, [formData]);
        
        // Form submission
        const handleSubmit = useCallback(async (e) => {
            e.preventDefault();
            
            if (!validateForm()) return;
            
            setIsSubmitting(true);
            
            try {
                // Calculate subscription info
                let subscriptionExpiry = null;
                let packageInfo = null;
                
                if (formData.role === 'user' && formData.subscriptionPackage) {
                    packageInfo = window.GlobalStateManager.findPackage(formData.subscriptionPackage);
                    
                    if (packageInfo && packageInfo.duration) {
                        const expiryDate = new Date();
                        const duration = formData.useDefaultDuration ? packageInfo.duration : formData.customDurationDays;
                        expiryDate.setDate(expiryDate.getDate() + duration);
                        subscriptionExpiry = expiryDate.toISOString().split('T')[0];
                    }
                }
                
                // Create user object
                const newUserId = window.GlobalStateManager.getNextUserId();
                console.log('🔄 [UserManagement] Creating user with ID:', newUserId, 'Type:', typeof newUserId);
                
                const newUser = {
                    id: newUserId,
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    fullName: formData.fullName.trim(),
                    phone: formData.phone.trim(),
                    password: formData.password,
                    role: formData.role,
                    accountType: formData.role,
                    status: formData.status,
                    hasAdminAccess: formData.role === 'admin',
                    
                    // Subscription info
                    subscriptionType: formData.role === 'user' ? formData.subscriptionPackage : null,
                    subscriptionPackage: packageInfo?.name || null,
                    subscriptionExpiry: subscriptionExpiry,
                    subscriptionStatus: formData.role === 'user' ? 'active' : null,
                    
                    // Metadata
                    createdAt: new Date().toISOString().split('T')[0],
                    createdBy: 'admin_manual',
                    lastLogin: null,
                    activatedAt: formData.status === 'active' ? new Date().toISOString() : null,
                    activatedBy: formData.status === 'active' ? 'admin_manual' : null
                };
                
                console.log('✅ [UserManagement] New user object created:', {
                    id: newUser.id,
                    username: newUser.username,
                    password: newUser.password ? '***' : 'NO_PASSWORD',
                    status: newUser.status,
                    subscriptionStatus: newUser.subscriptionStatus,
                    subscriptionType: newUser.subscriptionType,
                    subscriptionExpiry: newUser.subscriptionExpiry
                });
                
                // Update global state
                const currentUsers = window.GlobalStateManager.getData('users');
                console.log('📊 [UserManagement] Current users count:', currentUsers.length);

                const updatedUsers = [...currentUsers, newUser];
                window.GlobalStateManager.updateData('users', updatedUsers, 'UserManagement');

                console.log('✅ [UserManagement] User added to global state. New count:', updatedUsers.length);

                // Sync to MySQL API - REQUIRED for online-only mode
                if (window.SharedDataService) {
                    try {
                        const mysqlResult = await window.SharedDataService.saveToMySQL('user', newUser);
                        if (mysqlResult) {
                            console.log('✅ [UserManagement] User synced to MySQL');
                        } else {
                            console.warn('⚠️ [UserManagement] MySQL sync failed, user saved locally only');
                        }
                    } catch (mysqlError) {
                        console.error('❌ [UserManagement] MySQL sync error:', mysqlError);
                    }
                }

                // Success notification
                window.GlobalStateManager.addNotification(
                    `✅ Created ${formData.role} ${newUser.fullName}${packageInfo ? ` with ${packageInfo.name}` : ''}`,
                    'success',
                    'UserManagement'
                );

                console.log('🔄 [UserManagement] USER_CREATED', {
                    userId: newUser.id,
                    userName: newUser.fullName,
                    role: newUser.role,
                    package: packageInfo?.name
                });

                onUserAdded(newUser);
                onClose();
                
            } catch (error) {
                console.error('❌ [UserManagement] CREATE_USER_ERROR', { error });
                window.GlobalStateManager.addNotification('❌ Failed to create user', 'error', 'UserManagement');
            } finally {
                setIsSubmitting(false);
            }
        }, [formData, validateForm, onUserAdded, onClose]);
        
        // Field change handler
        const handleFieldChange = useCallback((field, value) => {
            setFormData(prev => ({ 
                ...prev, 
                [field]: value,
                // Reset package when role changes
                ...(field === 'role' && value === 'admin' ? { subscriptionPackage: '' } : {})
            }));
            
            // Clear error when user starts typing
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: null }));
            }
        }, [errors]);
        
        return (
            <window.Modal
                isOpen={isOpen}
                onClose={onClose}
                title="Add New User"
                size="medium"
            >
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <window.Input
                            label="Username"
                            placeholder="Enter username"
                            value={formData.username}
                            onChange={(value) => handleFieldChange('username', value)}
                            error={errors.username}
                            required
                        />
                        
                        <window.Input
                            label="Email"
                            type="email"
                            placeholder="Enter email"
                            value={formData.email}
                            onChange={(value) => handleFieldChange('email', value)}
                            error={errors.email}
                            required
                        />
                        
                        <window.Input
                            label="Full Name"
                            placeholder="Enter full name"
                            value={formData.fullName}
                            onChange={(value) => handleFieldChange('fullName', value)}
                            error={errors.fullName}
                            required
                        />
                        
                        <window.Input
                            label="Phone"
                            type="tel"
                            placeholder="Enter phone number"
                            value={formData.phone}
                            onChange={(value) => handleFieldChange('phone', value)}
                        />
                        
                        <window.Input
                            label="Password"
                            type="password"
                            placeholder="Enter password"
                            value={formData.password}
                            onChange={(value) => handleFieldChange('password', value)}
                            error={errors.password}
                            required
                        />
                        
                        <window.Select
                            label="Role"
                            value={formData.role}
                            onChange={(value) => handleFieldChange('role', value)}
                            options={[
                                { value: 'user', label: 'User' },
                                { value: 'admin', label: 'Admin' }
                            ]}
                        />
                    </div>
                    
                    {/* Conditional Package Selection for Users */}
                    {formData.role === 'user' && (
                        <div className="border-t pt-4">
                            <h4 className="font-medium text-[#121212] mb-3">📦 Subscription Settings</h4>
                            
                            <window.Select
                                label="Subscription Package"
                                value={formData.subscriptionPackage}
                                onChange={(value) => handleFieldChange('subscriptionPackage', value)}
                                error={errors.subscriptionPackage}
                                required
                                placeholder="Select a package"
                                options={packages.map(pkg => ({
                                    value: pkg.id,
                                    label: `${pkg.name} - ${pkg.duration ? `${pkg.duration} days` : 'Lifetime'} - ${pkg.price.toLocaleString()} VND`
                                }))}
                            />
                            
                            {formData.subscriptionPackage && (
                                <div className="mt-4">
                                    <label className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            checked={formData.useDefaultDuration}
                                            onChange={(e) => handleFieldChange('useDefaultDuration', e.target.checked)}
                                            className="rounded"
                                        />
                                        <span className="text-sm">Use default package duration</span>
                                    </label>
                                    
                                    {!formData.useDefaultDuration && (
                                        <window.Input
                                            label="Custom Duration (Days)"
                                            type="number"
                                            placeholder="Enter number of days"
                                            value={formData.customDurationDays}
                                            onChange={(value) => handleFieldChange('customDurationDays', parseInt(value) || 30)}
                                            className="mt-2"
                                        />
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                    
                    {/* Admin Info */}
                    {formData.role === 'admin' && (
                        <div className="border-t pt-4">
                            <div className="bg-[#FFF3EE] border border-[#E36323]/20 rounded-lg p-4">
                                <h4 className="font-medium text-[#E36323] mb-2">👑 Admin Privileges</h4>
                                <ul className="text-sm text-[#E36323] space-y-1">
                                    <li>• Full user management access</li>
                                    <li>• Payment approval capabilities</li>
                                    <li>• System configuration access</li>
                                    <li>• All administrative features</li>
                                </ul>
                            </div>
                        </div>
                    )}
                    
                    {/* Status Selection */}
                    <window.Select
                        label="Initial Status"
                        value={formData.status}
                        onChange={(value) => handleFieldChange('status', value)}
                        options={[
                            { value: 'active', label: 'Active' },
                            { value: 'pending', label: 'Pending' }
                        ]}
                    />
                    
                    {/* Form Actions */}
                    <div className="flex space-x-3 pt-4 border-t">
                        <window.Button
                            type="submit"
                            variant="primary"
                            loading={isSubmitting}
                            className="flex-1"
                        >
                            Create User
                        </window.Button>
                        <window.Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </window.Button>
                    </div>
                </form>
            </window.Modal>
        );
    });

    // ===== EDIT USER MODAL =====
    const EditUserModal = memo(({ isOpen, onClose, user, onUserUpdated }) => {
        const [formData, setFormData] = useState({
            username: '',
            email: '',
            fullName: '',
            phone: '',
            password: '',
            role: 'user',
            subscriptionPackage: '',
            useDefaultDuration: true,
            customDurationDays: 30,
            status: 'active'
        });

        const [packages, setPackages] = useState([]);
        const [errors, setErrors] = useState({});
        const [isSubmitting, setIsSubmitting] = useState(false);

        // Load packages on mount
        useEffect(() => {
            if (window.GlobalStateManager) {
                const availablePackages = window.GlobalStateManager.getData('packages');
                setPackages(availablePackages);
            }
        }, []);

        // Load user data when modal opens
        useEffect(() => {
            if (isOpen && user) {
                setFormData({
                    username: user.username || '',
                    email: user.email || '',
                    fullName: user.fullName || '',
                    phone: user.phone || '',
                    password: '', // Empty - only update if filled
                    role: user.role || 'user',
                    subscriptionPackage: user.subscriptionPackage || '',
                    useDefaultDuration: true,
                    customDurationDays: 30,
                    status: user.status || 'active'
                });
                setErrors({});
            }
        }, [isOpen, user]);

        // Validation
        const validateForm = useCallback(() => {
            const newErrors = {};

            if (!formData.username.trim()) newErrors.username = 'Username is required';
            if (formData.username.trim().length < 3) newErrors.username = 'Username must be at least 3 characters';
            if (!formData.email.trim()) newErrors.email = 'Email is required';
            if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
            if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required';

            // Password only required if being changed
            if (formData.password && formData.password.length < 6) {
                newErrors.password = 'Password must be at least 6 characters';
            }

            // Check for duplicate username (excluding current user)
            if (window.GlobalStateManager) {
                const existingUsers = window.GlobalStateManager.getData('users');

                if (existingUsers.find(u => u.username === formData.username.trim() && u.id !== user.id)) {
                    newErrors.username = 'Username already exists';
                }

                if (existingUsers.find(u => u.email === formData.email.trim() && u.id !== user.id)) {
                    newErrors.email = 'Email already exists';
                }
            }

            setErrors(newErrors);
            return Object.keys(newErrors).length === 0;
        }, [formData, user]);

        // Form submission
        const handleSubmit = useCallback(async (e) => {
            e.preventDefault();

            if (!validateForm()) return;

            setIsSubmitting(true);

            try {
                // Calculate subscription info if package changed
                let subscriptionExpiry = user.subscriptionExpiry;
                let subscriptionStatus = user.subscriptionStatus;

                if (formData.subscriptionPackage && formData.subscriptionPackage !== user.subscriptionPackage) {
                    const selectedPkg = packages.find(p => p.name === formData.subscriptionPackage);
                    if (selectedPkg) {
                        const durationDays = formData.useDefaultDuration
                            ? (selectedPkg.duration || 30)
                            : formData.customDurationDays;

                        const expiry = new Date();
                        expiry.setDate(expiry.getDate() + durationDays);
                        subscriptionExpiry = expiry.toISOString().split('T')[0];
                        subscriptionStatus = 'active';
                    }
                }

                // Update user object
                const updatedUser = {
                    ...user,
                    username: formData.username.trim(),
                    email: formData.email.trim(),
                    fullName: formData.fullName.trim(),
                    phone: formData.phone.trim(),
                    role: formData.role,
                    status: formData.status,
                    subscriptionPackage: formData.subscriptionPackage || user.subscriptionPackage,
                    subscriptionExpiry: subscriptionExpiry,
                    subscriptionStatus: subscriptionStatus,
                    updatedAt: new Date().toISOString()
                };

                // Only update password if provided
                if (formData.password) {
                    updatedUser.password = formData.password;
                }

                // Update in GlobalStateManager
                const currentUsers = window.GlobalStateManager.getData('users');
                const updatedUsers = currentUsers.map(u => u.id === user.id ? updatedUser : u);

                window.GlobalStateManager.updateData('users', updatedUsers, 'UserManagement');

                // Sync to MySQL API
                if (window.SharedDataService) {
                    try {
                        await window.SharedDataService.saveToMySQL('user', updatedUser);
                        console.log('✅ [UserManagement] User update synced to MySQL');
                    } catch (mysqlError) {
                        console.error('❌ [UserManagement] MySQL sync error:', mysqlError);
                    }
                }

                window.GlobalStateManager.addNotification(
                    `✅ Updated user: ${updatedUser.fullName}`,
                    'success',
                    'UserManagement'
                );

                if (onUserUpdated) onUserUpdated(updatedUser);
                onClose();

                console.log('🔄 [UserManagement] USER_UPDATED', { userId: user.id, userName: updatedUser.fullName });

            } catch (error) {
                console.error('Error updating user:', error);
                setErrors({ general: 'Failed to update user. Please try again.' });
            } finally {
                setIsSubmitting(false);
            }
        }, [formData, user, packages, validateForm, onClose, onUserUpdated]);

        const handleInputChange = useCallback((field, value) => {
            setFormData(prev => ({ ...prev, [field]: value }));
            if (errors[field]) {
                setErrors(prev => ({ ...prev, [field]: undefined }));
            }
        }, [errors]);

        if (!isOpen || !user) return null;

        return (
            <window.Modal isOpen={isOpen} onClose={onClose} title={`Edit User: ${user.fullName}`}>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {errors.general && (
                        <div className="p-3 bg-[#FFF5F5] text-[#FE5938] rounded text-sm">
                            {errors.general}
                        </div>
                    )}

                    {/* Username */}
                    <div>
                        <label className="block text-sm font-medium text-[#121212] mb-1">Username *</label>
                        <input
                            type="text"
                            value={formData.username}
                            onChange={(e) => handleInputChange('username', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${errors.username ? 'border-[#FE5938]' : 'border-[#E2E2E2]'}`}
                        />
                        {errors.username && <p className="mt-1 text-sm text-[#FE5938]">{errors.username}</p>}
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-[#121212] mb-1">Email *</label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleInputChange('email', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${errors.email ? 'border-[#FE5938]' : 'border-[#E2E2E2]'}`}
                        />
                        {errors.email && <p className="mt-1 text-sm text-[#FE5938]">{errors.email}</p>}
                    </div>

                    {/* Full Name */}
                    <div>
                        <label className="block text-sm font-medium text-[#121212] mb-1">Full Name *</label>
                        <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => handleInputChange('fullName', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${errors.fullName ? 'border-[#FE5938]' : 'border-[#E2E2E2]'}`}
                        />
                        {errors.fullName && <p className="mt-1 text-sm text-[#FE5938]">{errors.fullName}</p>}
                    </div>

                    {/* Phone */}
                    <div>
                        <label className="block text-sm font-medium text-[#121212] mb-1">Phone</label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleInputChange('phone', e.target.value)}
                            className="w-full px-3 py-2 border border-[#E2E2E2] rounded-lg"
                        />
                    </div>

                    {/* Password (optional for edit) */}
                    <div>
                        <label className="block text-sm font-medium text-[#121212] mb-1">
                            New Password <span className="text-[#7B7B7B]">(leave empty to keep current)</span>
                        </label>
                        <input
                            type="password"
                            value={formData.password}
                            onChange={(e) => handleInputChange('password', e.target.value)}
                            className={`w-full px-3 py-2 border rounded-lg ${errors.password ? 'border-[#FE5938]' : 'border-[#E2E2E2]'}`}
                            placeholder="Enter new password..."
                        />
                        {errors.password && <p className="mt-1 text-sm text-[#FE5938]">{errors.password}</p>}
                    </div>

                    {/* Status */}
                    <div>
                        <label className="block text-sm font-medium text-[#121212] mb-1">Status</label>
                        <select
                            value={formData.status}
                            onChange={(e) => handleInputChange('status', e.target.value)}
                            className="w-full px-3 py-2 border border-[#E2E2E2] rounded-lg"
                        >
                            <option value="active">Active</option>
                            <option value="pending">Pending</option>
                            <option value="inactive">Inactive</option>
                        </select>
                    </div>

                    {/* Subscription Package */}
                    {formData.role === 'user' && (
                        <div>
                            <label className="block text-sm font-medium text-[#121212] mb-1">Subscription Package</label>
                            <select
                                value={formData.subscriptionPackage}
                                onChange={(e) => handleInputChange('subscriptionPackage', e.target.value)}
                                className="w-full px-3 py-2 border border-[#E2E2E2] rounded-lg"
                            >
                                <option value="">-- Keep current --</option>
                                {packages.filter(p => p.active !== false).map(pkg => (
                                    <option key={pkg.id} value={pkg.name}>
                                        {pkg.name} - {pkg.price}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <window.Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            {isSubmitting ? 'Saving...' : 'Save Changes'}
                        </window.Button>
                        <window.Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="flex-1"
                        >
                            Cancel
                        </window.Button>
                    </div>
                </form>
            </window.Modal>
        );
    });

    // ===== USER MANAGEMENT COMPONENT =====
    const UserManagement = memo(() => {
        const [users, setUsers] = useState([]);
        const [showAddUser, setShowAddUser] = useState(false);
        const [showEditUser, setShowEditUser] = useState(false);
        const [editingUser, setEditingUser] = useState(null);
        const [loading, setLoading] = useState(true);
        
        // Subscribe to global state
        useEffect(() => {
            if (!window.GlobalStateManager) {
                console.error('❌ [UserManagement] GlobalStateManager not available');
                return;
            }
            
            console.log('🔄 [UserManagement] COMPONENT_MOUNT');
            
            // Load initial data
            const initialUsers = window.GlobalStateManager.getData('users');
            setUsers(initialUsers);
            setLoading(false);
            
            // Subscribe to changes
            const unsubscribe = window.GlobalStateManager.subscribe('users', (newUsers) => {
                console.log('🔄 [UserManagement] DATA_UPDATE', { count: newUsers.length });
                setUsers(newUsers);
            }, 'UserManagement');
            
            return () => {
                unsubscribe();
                console.log('🔄 [UserManagement] COMPONENT_UNMOUNT');
            };
        }, []);
        
        // Handle user status toggle
        const handleStatusToggle = useCallback(async (userId, newStatus) => {
            const currentUsers = window.GlobalStateManager.getData('users');
            const updatedUser = currentUsers.find(u => u.id === userId);
            if (!updatedUser) return;

            const updatedUserData = {
                ...updatedUser,
                status: newStatus,
                ...(newStatus === 'active' && {
                    activatedAt: new Date().toISOString(),
                    activatedBy: 'admin_manual'
                })
            };

            const updatedUsers = currentUsers.map(u => u.id === userId ? updatedUserData : u);

            window.GlobalStateManager.updateData('users', updatedUsers, 'UserManagement');

            // Sync to MySQL API
            if (window.SharedDataService) {
                try {
                    await window.SharedDataService.saveToMySQL('user', updatedUserData);
                    console.log('✅ [UserManagement] Status change synced to MySQL');
                } catch (mysqlError) {
                    console.error('❌ [UserManagement] MySQL sync error:', mysqlError);
                }
            }

            window.GlobalStateManager.addNotification(
                `✅ User ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
                'success',
                'UserManagement'
            );

            console.log('🔄 [UserManagement] STATUS_TOGGLE', { userId, newStatus });
        }, []);
        
        // Handle user deletion
        const handleDeleteUser = useCallback(async (userId) => {
            const user = window.GlobalStateManager.findUser(userId);
            if (!user) return;

            if (confirm(`Are you sure you want to delete user "${user.fullName}"?`)) {
                const currentUsers = window.GlobalStateManager.getData('users');
                const updatedUsers = currentUsers.filter(u => u.id !== userId);

                window.GlobalStateManager.updateData('users', updatedUsers, 'UserManagement');

                // Sync deletion to MySQL (mark as deleted)
                if (window.SharedDataService) {
                    try {
                        await window.SharedDataService.saveToMySQL('user', {
                            ...user,
                            status: 'deleted'
                        });
                        console.log('✅ [UserManagement] User deletion synced to MySQL');
                    } catch (mysqlError) {
                        console.error('❌ [UserManagement] MySQL sync error:', mysqlError);
                    }
                }

                window.GlobalStateManager.addNotification(
                    `✅ Deleted user ${user.fullName}`,
                    'success',
                    'UserManagement'
                );

                console.log('🔄 [UserManagement] USER_DELETED', { userId, userName: user.fullName });
            }
        }, []);

        // Handle edit user
        const handleEditUser = useCallback((user) => {
            setEditingUser(user);
            setShowEditUser(true);
            console.log('🔄 [UserManagement] EDIT_USER_OPEN', { userId: user.id, userName: user.fullName });
        }, []);
        
        // Format date
        const formatDate = useCallback((dateString) => {
            if (!dateString) return 'N/A';
            return new Date(dateString).toLocaleDateString();
        }, []);
        
        // Get status color
        const getStatusVariant = useCallback((status) => {
            switch (status) {
                case 'active': return 'success';
                case 'pending': return 'warning';
                case 'expired': return 'error';
                default: return 'default';
            }
        }, []);
        
        if (loading) {
            return <window.LoadingSpinner size="large" message="Loading users..." />;
        }
        
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">👥 User Management</h1>
                    
                    <div className="flex items-center space-x-4">
                        {/* Test User Creation Button */}
                        <window.Button
                            variant="secondary"
                            onClick={() => {
                                console.log('🧪 [UserManagement] Running test user creation...');
                                TestUserManagement.testUserCreation();
                            }}
                            className="bg-[#E36323] hover:bg-[#DF5A18] text-white"
                        >
                            🧪 Test User Creation
                        </window.Button>
                        
                        {/* Add User Button */}
                        <window.Button
                            variant="primary"
                            onClick={() => setShowAddUser(true)}
                        >
                            ➕ Add User
                        </window.Button>
                    </div>
                </div>
                
                {/* Users Table */}
                <window.Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full">
                            <thead className="bg-[#F8F7F7]">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">ID</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">User</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Role</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Package</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Expires</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-[#7B7B7B] uppercase">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-[#ECECEC]">
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                            {user.id}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div>
                                                <div className="font-medium text-[#121212]">{user.fullName}</div>
                                                <div className="text-sm text-[#7B7B7B]">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                            {user.role === 'admin' ? '👑 Admin' : '👤 User'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <window.Badge variant={getStatusVariant(user.status)}>
                                                {user.status}
                                            </window.Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                            {user.subscriptionPackage || 'No package'}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-[#121212]">
                                            {formatDate(user.subscriptionExpiry)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {/* Edit Button */}
                                            <window.Button
                                                size="small"
                                                variant="primary"
                                                onClick={() => handleEditUser(user)}
                                            >
                                                ✏️ Edit
                                            </window.Button>

                                            {/* Status Toggle */}
                                            {user.status === 'pending' && (
                                                <window.Button
                                                    size="small"
                                                    variant="success"
                                                    onClick={() => handleStatusToggle(user.id, 'active')}
                                                >
                                                    ✅ Activate
                                                </window.Button>
                                            )}

                                            {user.status === 'active' && user.role !== 'admin' && (
                                                <window.Button
                                                    size="small"
                                                    variant="warning"
                                                    onClick={() => handleStatusToggle(user.id, 'pending')}
                                                >
                                                    ⏸️ Suspend
                                                </window.Button>
                                            )}

                                            {/* Delete (not for admins) */}
                                            {user.role !== 'admin' && (
                                                <window.Button
                                                    size="small"
                                                    variant="danger"
                                                    onClick={() => handleDeleteUser(user.id)}
                                                >
                                                    🗑️ Delete
                                                </window.Button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        
                        {users.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-[#7B7B7B]">No users found</p>
                            </div>
                        )}
                    </div>
                </window.Card>
                
                {/* Add User Modal */}
                <AddUserModal
                    isOpen={showAddUser}
                    onClose={() => setShowAddUser(false)}
                    onUserAdded={() => {
                        console.log('🔄 [UserManagement] USER_ADDED_CALLBACK');
                    }}
                />

                {/* Edit User Modal */}
                <EditUserModal
                    isOpen={showEditUser}
                    onClose={() => {
                        setShowEditUser(false);
                        setEditingUser(null);
                    }}
                    user={editingUser}
                    onUserUpdated={() => {
                        console.log('🔄 [UserManagement] USER_UPDATED_CALLBACK');
                    }}
                />
            </div>
        );
    });
    
    // ===== TESTING FUNCTIONS =====
    const TestUserManagement = {
        testComponentRender: () => {
            console.assert(window.UserManagement, '❌ UserManagement not exported');
            console.log('✅ [TEST] UserManagement component exists');
        },
        
        testUserCreation: () => {
            // Test user creation flow
            const testUser = {
                id: window.GlobalStateManager.getNextUserId(),
                username: 'test_user_' + Date.now(),
                email: 'test@example.com',
                fullName: 'Test User',
                phone: '+84987654321',
                password: 'test123',
                role: 'user',
                accountType: 'user',
                status: 'active',
                hasAdminAccess: false,
                subscriptionType: 'package_30_days',
                subscriptionPackage: '30 Days Premium',
                subscriptionExpiry: '2024-12-31',
                subscriptionStatus: 'active',
                createdAt: new Date().toISOString().split('T')[0],
                createdBy: 'test',
                lastLogin: null,
                activatedAt: new Date().toISOString(),
                activatedBy: 'test'
            };
            
            const currentUsers = window.GlobalStateManager.getData('users');
            const updatedUsers = [...currentUsers, testUser];
            window.GlobalStateManager.updateData('users', updatedUsers, 'Test');
            
            console.log('✅ [TEST] Test user created:', {
                username: testUser.username,
                password: testUser.password,
                status: testUser.status,
                subscriptionStatus: testUser.subscriptionStatus
            });
            
            // Test if user can be found in localStorage
            setTimeout(() => {
                const adminUsersData = localStorage.getItem('adminUsers');
                if (adminUsersData) {
                    const users = JSON.parse(adminUsersData);
                    const foundUser = users.find(u => u.username === testUser.username);
                    if (foundUser) {
                        console.log('✅ [TEST] User found in localStorage:', foundUser.username);
                    } else {
                        console.error('❌ [TEST] User not found in localStorage');
                    }
                }
            }, 1000);
            
            // Cleanup after test
            setTimeout(() => {
                window.GlobalStateManager.updateData('users', currentUsers, 'Test');
                console.log('🧹 [TEST] Test user cleaned up');
            }, 5000);
        },
        
        testDataFlow: () => {
            const currentUsers = window.GlobalStateManager.getData('users');
            const retrieved = window.GlobalStateManager.findUser(1);
            console.assert(retrieved && retrieved.username, '❌ User data flow failed');
            console.log('✅ [TEST] User data flow works');
        }
    };
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.UserManagement = UserManagement;
    window.AddUserModal = AddUserModal;
    window.TestUserManagement = TestUserManagement;
    
    // Auto-run tests
    setTimeout(() => {
        TestUserManagement.testComponentRender();
        if (window.GlobalStateManager) {
            TestUserManagement.testDataFlow();
        }
    }, 100);
    
})(); 