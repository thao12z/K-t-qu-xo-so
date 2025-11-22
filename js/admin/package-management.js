// 📦 PACKAGE MANAGEMENT MODULE
// Version: 1.0.0 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';
    
    const { useState, useEffect, useCallback, memo } = React;
    
    // ===== PACKAGE MANAGEMENT COMPONENT =====
    const PackageManagement = memo(() => {
        const [packages, setPackages] = useState([]);
        const [showAddPackage, setShowAddPackage] = useState(false);
        const [editPackage, setEditPackage] = useState(null);
        const [loading, setLoading] = useState(true);
        const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
        const [isSaving, setIsSaving] = useState(false);
        
        const [newPackage, setNewPackage] = useState({
            name: '',
            price: 0,
            duration: 30,
            durationType: 'days',
            features: [''],
            popular: false,
            active: true
        });
        
        // Subscribe to global state
        useEffect(() => {
            if (!window.GlobalStateManager) {
                console.error('❌ [PackageManagement] GlobalStateManager not available');
                return;
            }
            
            console.log('🔄 [PackageManagement] COMPONENT_MOUNT');
            
            // Load initial data
            const initialPackages = window.GlobalStateManager.getData('packages');
            setPackages(initialPackages);
            setLoading(false);
            
            // Subscribe to changes
            const unsubscribe = window.GlobalStateManager.subscribe('packages', (newPackages) => {
                console.log('🔄 [PackageManagement] PACKAGES_UPDATE', { count: newPackages.length });
                setPackages(newPackages);
            }, 'PackageManagement');
            
            return () => {
                unsubscribe();
                console.log('🔄 [PackageManagement] COMPONENT_UNMOUNT');
            };
        }, []);
        
        // Auto-save with debounce
        const autoSave = useCallback(() => {
            if (hasUnsavedChanges) {
                try {
                    window.GlobalStateManager.updateData('packages', packages, 'PackageManagement');
                    setHasUnsavedChanges(false);
                    console.log('🔄 [PackageManagement] AUTO_SAVED');
                    // Không hiển thị notification cho auto-save để tránh spam
                } catch (error) {
                    console.error('❌ [PackageManagement] AUTO_SAVE_ERROR', { error });
                }
            }
        }, [packages, hasUnsavedChanges]);

        // Manual save with feedback
        const savePackages = useCallback(() => {
            if (!hasUnsavedChanges) {
                window.GlobalStateManager.addNotification(
                    'ℹ️ Không có thay đổi nào để lưu',
                    'info',
                    'PackageManagement'
                );
                return;
            }

            setIsSaving(true);
            try {
                window.GlobalStateManager.updateData('packages', packages, 'PackageManagement');
                setHasUnsavedChanges(false);
                window.GlobalStateManager.addNotification(
                    '✅ Đã lưu gói thành công!',
                    'success',
                    'PackageManagement'
                );
                console.log('🔄 [PackageManagement] PACKAGES_SAVED', { count: packages.length });
            } catch (error) {
                console.error('❌ [PackageManagement] SAVE_ERROR', { error });
                window.GlobalStateManager.addNotification(
                    '❌ Lưu gói thất bại',
                    'error',
                    'PackageManagement'
                );
            } finally {
                setIsSaving(false);
            }
        }, [packages, hasUnsavedChanges]);

        // Auto-save effect
        useEffect(() => {
            if (hasUnsavedChanges) {
                const timeoutId = setTimeout(autoSave, 5000); // Auto-save after 5 seconds to give user time to manually save
                return () => clearTimeout(timeoutId);
            }
        }, [autoSave, hasUnsavedChanges]);
        
        // Add new package
        const handleAddPackage = useCallback((e) => {
            e.preventDefault();
            
            if (!newPackage.name || newPackage.price <= 0) {
                window.GlobalStateManager.addNotification(
                    '❌ Please fill all required fields',
                    'error',
                    'PackageManagement'
                );
                return;
            }
            
            const packageToAdd = {
                ...newPackage,
                id: `package_${Date.now()}`,
                features: newPackage.features.filter(f => f.trim() !== '')
            };
            
            const updatedPackages = [...packages, packageToAdd];
            setPackages(updatedPackages);
            setHasUnsavedChanges(true);
            
            setShowAddPackage(false);
            setNewPackage({
                name: '',
                price: 0,
                duration: 30,
                durationType: 'days',
                features: [''],
                popular: false,
                active: true
            });
            
            window.GlobalStateManager.addNotification(
                `✅ Package "${packageToAdd.name}" added successfully`,
                'success',
                'PackageManagement'
            );
            
            console.log('🔄 [PackageManagement] PACKAGE_ADDED', { packageId: packageToAdd.id });
        }, [newPackage, packages]);
        
        // Edit package
        const handleEditPackage = useCallback((pkg) => {
            setEditPackage(pkg);
            setNewPackage({
                name: pkg.name,
                price: pkg.price,
                duration: pkg.duration || 30,
                durationType: pkg.durationType || 'days',
                features: [...pkg.features],
                popular: pkg.popular,
                active: pkg.active
            });
            setShowAddPackage(true);
        }, []);
        
        // Update package
        const handleUpdatePackage = useCallback((e) => {
            e.preventDefault();
            
            if (!editPackage || !newPackage.name || newPackage.price <= 0) {
                window.GlobalStateManager.addNotification(
                    '❌ Please fill all required fields',
                    'error',
                    'PackageManagement'
                );
                return;
            }
            
            const updatedPackages = packages.map(pkg =>
                pkg.id === editPackage.id ? {
                    ...pkg,
                    ...newPackage,
                    features: newPackage.features.filter(f => f.trim() !== '')
                } : pkg
            );
            
            setPackages(updatedPackages);
            setHasUnsavedChanges(true);
            
            setShowAddPackage(false);
            setEditPackage(null);
            setNewPackage({
                name: '',
                price: 0,
                duration: 30,
                durationType: 'days',
                features: [''],
                popular: false,
                active: true
            });
            
            window.GlobalStateManager.addNotification(
                `✅ Package "${newPackage.name}" updated successfully`,
                'success',
                'PackageManagement'
            );
            
            console.log('🔄 [PackageManagement] PACKAGE_UPDATED', { packageId: editPackage.id });
        }, [editPackage, newPackage, packages]);
        
        // Delete package
        const handleDeletePackage = useCallback((packageId) => {
            const packageToDelete = packages.find(p => p.id === packageId);
            if (!packageToDelete) return;
            
            if (confirm(`Are you sure you want to delete package "${packageToDelete.name}"?`)) {
                const updatedPackages = packages.filter(p => p.id !== packageId);
                setPackages(updatedPackages);
                setHasUnsavedChanges(true);
                
                window.GlobalStateManager.addNotification(
                    `✅ Package "${packageToDelete.name}" deleted successfully`,
                    'success',
                    'PackageManagement'
                );
                
                console.log('🔄 [PackageManagement] PACKAGE_DELETED', { packageId });
            }
        }, [packages]);
        
        // Toggle package status
        const togglePackageStatus = useCallback((packageId) => {
            const updatedPackages = packages.map(pkg =>
                pkg.id === packageId ? { ...pkg, active: !pkg.active } : pkg
            );
            
            setPackages(updatedPackages);
            setHasUnsavedChanges(true);
            
            const packageName = packages.find(p => p.id === packageId)?.name;
            const newStatus = !packages.find(p => p.id === packageId)?.active;
            
            window.GlobalStateManager.addNotification(
                `✅ Package "${packageName}" ${newStatus ? 'activated' : 'deactivated'}`,
                'success',
                'PackageManagement'
            );
            
            console.log('🔄 [PackageManagement] PACKAGE_STATUS_TOGGLED', { packageId, newStatus });
        }, [packages]);
        
        // Toggle popular badge
        const togglePopularBadge = useCallback((packageId) => {
            const updatedPackages = packages.map(pkg =>
                pkg.id === packageId ? { ...pkg, popular: !pkg.popular } : pkg
            );
            
            setPackages(updatedPackages);
            setHasUnsavedChanges(true);
            
            const packageName = packages.find(p => p.id === packageId)?.name;
            const newPopular = !packages.find(p => p.id === packageId)?.popular;
            
            window.GlobalStateManager.addNotification(
                `✅ Package "${packageName}" ${newPopular ? 'marked as popular' : 'unmarked as popular'}`,
                'success',
                'PackageManagement'
            );
            
            console.log('🔄 [PackageManagement] PACKAGE_POPULAR_TOGGLED', { packageId, newPopular });
        }, [packages]);
        
        // Add feature field
        const addFeatureField = useCallback((packageId, isNew = false) => {
            if (isNew) {
                setNewPackage(prev => ({
                    ...prev,
                    features: [...prev.features, '']
                }));
            } else {
                const updatedPackages = packages.map(pkg =>
                    pkg.id === packageId ? {
                        ...pkg,
                        features: [...pkg.features, '']
                    } : pkg
                );
                window.GlobalStateManager.updateData('packages', updatedPackages, 'PackageManagement');
            }
        }, [packages]);
        
        // Remove feature field
        const removeFeatureField = useCallback((packageId, index, isNew = false) => {
            if (isNew) {
                setNewPackage(prev => ({
                    ...prev,
                    features: prev.features.filter((_, i) => i !== index)
                }));
            } else {
                const updatedPackages = packages.map(pkg =>
                    pkg.id === packageId ? {
                        ...pkg,
                        features: pkg.features.filter((_, i) => i !== index)
                    } : pkg
                );
                window.GlobalStateManager.updateData('packages', updatedPackages, 'PackageManagement');
            }
        }, [packages]);
        
        // Update feature
        const updateFeature = useCallback((index, value, isNew = false) => {
            if (isNew) {
                setNewPackage(prev => ({
                    ...prev,
                    features: prev.features.map((f, i) => i === index ? value : f)
                }));
            } else {
                // This would be handled in edit mode
            }
        }, []);
        
        // Format price
        const formatPrice = useCallback((price) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(price);
        }, []);
        
        // Format duration
        const formatDuration = useCallback((duration, durationType) => {
            if (durationType === 'lifetime') return 'Lifetime';
            return `${duration} ${durationType}`;
        }, []);
        
        if (loading) {
            return <window.LoadingSpinner size="large" message="Loading packages..." />;
        }
        
        return (
            <div className="space-y-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <h1 className="text-2xl font-bold">📦 Package Management</h1>
                    <div className="flex items-center space-x-3">
                        {hasUnsavedChanges && (
                            <span className="text-sm text-orange-600 bg-orange-100 px-2 py-1 rounded">
                                ⚠️ Có thay đổi chưa lưu
                            </span>
                        )}
                        <window.Button
                            onClick={savePackages}
                            variant={hasUnsavedChanges ? "primary" : "secondary"}
                            disabled={isSaving}
                        >
                            {isSaving ? '💾 Đang lưu...' : hasUnsavedChanges ? '💾 Lưu thay đổi' : '💾 Lưu tất cả'}
                        </window.Button>
                        <window.Button
                            onClick={() => setShowAddPackage(true)}
                            variant="primary"
                        >
                            ➕ Add Package
                        </window.Button>
                    </div>
                </div>
                
                {/* Packages Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packages.map((pkg) => (
                        <window.Card key={pkg.id} className="relative">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">{pkg.name}</h3>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatPrice(pkg.price)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                        {formatDuration(pkg.duration, pkg.durationType)}
                                    </p>
                                </div>
                                <div className="flex space-x-2">
                                    {pkg.popular && (
                                        <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                                            Popular
                                        </span>
                                    )}
                                    <window.Badge variant={pkg.active ? 'success' : 'error'}>
                                        {pkg.active ? 'Active' : 'Inactive'}
                                    </window.Badge>
                                </div>
                            </div>
                            
                            {/* Features */}
                            <div className="mb-4">
                                <h4 className="font-medium text-gray-700 mb-2">Features:</h4>
                                <ul className="space-y-1">
                                    {pkg.features.map((feature, index) => (
                                        <li key={index} className="text-sm text-gray-600 flex items-center">
                                            <span className="text-green-500 mr-2">✓</span>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            
                            {/* Actions */}
                            <div className="flex space-x-2 pt-4 border-t">
                                <window.Button
                                    size="small"
                                    variant="primary"
                                    onClick={() => handleEditPackage(pkg)}
                                >
                                    ✏️ Edit
                                </window.Button>
                                <window.Button
                                    size="small"
                                    variant={pkg.active ? "warning" : "success"}
                                    onClick={() => togglePackageStatus(pkg.id)}
                                >
                                    {pkg.active ? '⏸️ Deactivate' : '▶️ Activate'}
                                </window.Button>
                                <window.Button
                                    size="small"
                                    variant={pkg.popular ? "secondary" : "warning"}
                                    onClick={() => togglePopularBadge(pkg.id)}
                                >
                                    {pkg.popular ? '⭐ Unmark Popular' : '⭐ Mark Popular'}
                                </window.Button>
                                <window.Button
                                    size="small"
                                    variant="danger"
                                    onClick={() => handleDeletePackage(pkg.id)}
                                >
                                    🗑️ Delete
                                </window.Button>
                            </div>
                        </window.Card>
                    ))}
                </div>
                
                {/* Add/Edit Package Modal - Full Content Area Bottom */}
                {showAddPackage && (
                    <div className="fixed z-50 bg-black bg-opacity-50 flex items-end" style={{ left: '280px', right: '0', top: '0', bottom: '0' }}>
                        <div className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
                            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
                                <div className="flex justify-between items-center">
                                    <h2 className="text-xl font-bold text-gray-900">
                                        {editPackage ? "Edit Package" : "Add New Package"}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowAddPackage(false);
                                            setEditPackage(null);
                                            setNewPackage({
                                                name: '',
                                                price: 0,
                                                duration: 30,
                                                durationType: 'days',
                                                features: [''],
                                                popular: false,
                                                active: true
                                            });
                                        }}
                                        className="text-gray-400 hover:text-gray-600 text-2xl font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>
                    <form onSubmit={editPackage ? handleUpdatePackage : handleAddPackage} className="p-6 space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <window.Input
                                label="Package Name"
                                placeholder="Enter package name"
                                value={newPackage.name}
                                onChange={(value) => setNewPackage(prev => ({ ...prev, name: value }))}
                                required
                            />
                            
                            <window.Input
                                label="Price (VND)"
                                type="number"
                                placeholder="Enter price"
                                value={newPackage.price}
                                onChange={(value) => setNewPackage(prev => ({ ...prev, price: parseInt(value) || 0 }))}
                                required
                            />
                            
                            <window.Input
                                label="Duration"
                                type="number"
                                placeholder="Enter duration"
                                value={newPackage.duration}
                                onChange={(value) => setNewPackage(prev => ({ ...prev, duration: parseInt(value) || 30 }))}
                                disabled={newPackage.durationType === 'lifetime'}
                            />
                            
                            <window.Select
                                label="Duration Type"
                                value={newPackage.durationType}
                                onChange={(value) => setNewPackage(prev => ({ 
                                    ...prev, 
                                    durationType: value,
                                    duration: value === 'lifetime' ? null : prev.duration
                                }))}
                                options={[
                                    { value: 'days', label: 'Days' },
                                    { value: 'weeks', label: 'Weeks' },
                                    { value: 'months', label: 'Months' },
                                    { value: 'lifetime', label: 'Lifetime' }
                                ]}
                            />
                        </div>
                        
                        {/* Features */}
                        <div>
                            <h4 className="font-medium text-gray-700 mb-3">Features:</h4>
                            <div className="space-y-2">
                                {newPackage.features.map((feature, index) => (
                                    <div key={index} className="flex space-x-2">
                                        <window.Input
                                            placeholder="Enter feature"
                                            value={feature}
                                            onChange={(value) => updateFeature(index, value, true)}
                                            className="flex-1"
                                        />
                                        <window.Button
                                            type="button"
                                            size="small"
                                            variant="danger"
                                            onClick={() => removeFeatureField(null, index, true)}
                                        >
                                            🗑️
                                        </window.Button>
                                    </div>
                                ))}
                                <window.Button
                                    type="button"
                                    size="small"
                                    variant="secondary"
                                    onClick={() => addFeatureField(null, true)}
                                >
                                    ➕ Add Feature
                                </window.Button>
                            </div>
                        </div>
                        
                        {/* Options */}
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newPackage.active}
                                    onChange={(e) => setNewPackage(prev => ({ ...prev, active: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm">Active</span>
                            </label>
                            
                            <label className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    checked={newPackage.popular}
                                    onChange={(e) => setNewPackage(prev => ({ ...prev, popular: e.target.checked }))}
                                    className="rounded"
                                />
                                <span className="text-sm">Popular</span>
                            </label>
                        </div>
                        
                        {/* Form Actions */}
                        <div className="flex space-x-3 pt-4 border-t">
                            <window.Button
                                type="submit"
                                variant="primary"
                                className="flex-1"
                            >
                                {editPackage ? 'Update Package' : 'Create Package'}
                            </window.Button>
                            <window.Button
                                type="button"
                                variant="secondary"
                                onClick={() => {
                                    setShowAddPackage(false);
                                    setEditPackage(null);
                                    setNewPackage({
                                        name: '',
                                        price: 0,
                                        duration: 30,
                                        durationType: 'days',
                                        features: [''],
                                        popular: false,
                                        active: true
                                    });
                                }}
                                className="flex-1"
                            >
                                Cancel
                            </window.Button>
                        </div>
                    </form>
                        </div>
                    </div>
                )}
                
                {packages.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No packages found</p>
                    </div>
                )}
            </div>
        );
    });
    
    // ===== TESTING FUNCTIONS =====
    const TestPackageManagement = {
        testComponentRender: () => {
            console.assert(window.PackageManagement, '❌ PackageManagement not exported');
            console.log('✅ [TEST] PackageManagement component exists');
        },
        
        testDataFlow: () => {
            // Test package operations
            const testPackage = {
                id: 'test_package',
                name: 'Test Package',
                price: 100000,
                duration: 30,
                durationType: 'days',
                features: ['Test feature'],
                popular: false,
                active: true
            };
            
            const currentPackages = window.GlobalStateManager.getData('packages');
            const updatedPackages = [...currentPackages, testPackage];
            window.GlobalStateManager.updateData('packages', updatedPackages, 'Test');
            
            const retrieved = window.GlobalStateManager.findPackage('test_package');
            console.assert(retrieved && retrieved.name === 'Test Package', '❌ Package data flow failed');
            
            // Cleanup
            window.GlobalStateManager.updateData('packages', currentPackages, 'Test');
            console.log('✅ [TEST] Package data flow works');
        }
    };
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.PackageManagement = PackageManagement;
    window.TestPackageManagement = TestPackageManagement;
    
    // Auto-run tests
    setTimeout(() => {
        TestPackageManagement.testComponentRender();
        if (window.GlobalStateManager) {
            TestPackageManagement.testDataFlow();
        }
    }, 120);
    
})(); 