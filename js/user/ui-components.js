// 🎨 UI COMPONENTS MODULE - REUSABLE COMPONENTS
// Version: 1.0.0 | Created: 2024 | Follows ADMIN SYSTEM DEVELOPMENT GUIDELINES
(function() {
    'use strict';
    
    const { useState, useCallback, memo } = React;
    
    // ===== LOADING COMPONENT =====
    const LoadingSpinner = memo(({ size = 'medium', message = 'Loading...' }) => {
        const sizeClasses = {
            small: 'w-4 h-4',
            medium: 'w-8 h-8', 
            large: 'w-12 h-12'
        };
        
        return (
            <div className="flex flex-col items-center justify-center p-4">
                <div className={`${sizeClasses[size]} border-4 border-gray-200 border-t-blue-600 rounded-full animate-spin`}></div>
                {message && <p className="mt-2 text-sm text-gray-600">{message}</p>}
            </div>
        );
    });
    
    // ===== BUTTON COMPONENT =====
    const Button = memo(({ 
        children, 
        onClick = () => {}, 
        variant = 'primary', 
        size = 'medium',
        disabled = false,
        loading = false,
        className = ''
    }) => {
        const baseClasses = 'font-medium rounded focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
        
        const variantClasses = {
            primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
            secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
            success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
            danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
            warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
        };
        
        const sizeClasses = {
            small: 'px-3 py-1 text-sm',
            medium: 'px-4 py-2 text-sm',
            large: 'px-6 py-3 text-base'
        };
        
        const disabledClasses = 'opacity-50 cursor-not-allowed';
        
        const finalClasses = `
            ${baseClasses}
            ${variantClasses[variant]}
            ${sizeClasses[size]}
            ${disabled ? disabledClasses : ''}
            ${className}
        `.trim();
        
        const handleClick = useCallback((e) => {
            if (!disabled && !loading) {
                onClick(e);
            }
        }, [onClick, disabled, loading]);
        
        return (
            <button
                className={finalClasses}
                onClick={handleClick}
                disabled={disabled || loading}
            >
                {loading ? (
                    <div className="flex items-center justify-center">
                        <LoadingSpinner size="small" />
                        <span className="ml-2">Loading...</span>
                    </div>
                ) : children}
            </button>
        );
    });
    
    // ===== MODAL COMPONENT =====
    const Modal = memo(({ 
        isOpen = false, 
        onClose = () => {}, 
        title = '', 
        children,
        size = 'medium',
        closable = true
    }) => {
        const sizeClasses = {
            small: 'max-w-md',
            medium: 'max-w-2xl',
            large: 'max-w-4xl',
            full: 'max-w-7xl'
        };
        
        const handleBackdropClick = useCallback((e) => {
            if (e.target === e.currentTarget && closable) {
                onClose();
            }
        }, [onClose, closable]);
        
        const handleEscapeKey = useCallback((e) => {
            if (e.key === 'Escape' && closable) {
                onClose();
            }
        }, [onClose, closable]);
        
        React.useEffect(() => {
            if (isOpen) {
                document.addEventListener('keydown', handleEscapeKey);
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = 'unset';
            }
            
            return () => {
                document.removeEventListener('keydown', handleEscapeKey);
                document.body.style.overflow = 'unset';
            };
        }, [isOpen, handleEscapeKey]);
        
        if (!isOpen) return null;
        
        return (
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                onClick={handleBackdropClick}
            >
                <div className={`bg-white rounded-lg shadow-lg w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden`}>
                    {title && (
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            {closable && (
                                <button
                                    onClick={onClose}
                                    className="text-gray-400 hover:text-gray-600 p-1"
                                >
                                    <span className="sr-only">Close</span>
                                    ✕
                                </button>
                            )}
                        </div>
                    )}
                    <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
                        {children}
                    </div>
                </div>
            </div>
        );
    });
    
    // ===== INPUT FIELD COMPONENT =====
    const Input = memo(({ 
        type = 'text',
        placeholder = '',
        value = '',
        onChange = () => {},
        error = '',
        label = '',
        required = false,
        disabled = false,
        className = ''
    }) => {
        const inputClasses = `
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
        `.trim();
        
        const handleChange = useCallback((e) => {
            onChange(e.target.value);
        }, [onChange]);
        
        return (
            <div className="mb-4">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <input
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    className={inputClasses}
                />
                {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
            </div>
        );
    });
    
    // ===== SELECT COMPONENT =====
    const Select = memo(({ 
        value = '',
        onChange = () => {},
        options = [],
        placeholder = 'Select an option',
        error = '',
        label = '',
        required = false,
        disabled = false,
        className = ''
    }) => {
        const selectClasses = `
            w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500
            ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            ${className}
        `.trim();
        
        const handleChange = useCallback((e) => {
            onChange(e.target.value);
        }, [onChange]);
        
        return (
            <div className="mb-4">
                {label && (
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        {label}
                        {required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                )}
                <select
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    className={selectClasses}
                >
                    {placeholder && (
                        <option value="">{placeholder}</option>
                    )}
                    {options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
                {error && (
                    <p className="text-red-500 text-sm mt-1">{error}</p>
                )}
            </div>
        );
    });
    
    // ===== BADGE COMPONENT =====
    const Badge = memo(({ 
        children, 
        variant = 'default',
        size = 'medium'
    }) => {
        const variantClasses = {
            default: 'bg-gray-100 text-gray-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-yellow-100 text-yellow-800',
            error: 'bg-red-100 text-red-800',
            info: 'bg-blue-100 text-blue-800'
        };
        
        const sizeClasses = {
            small: 'px-2 py-1 text-xs',
            medium: 'px-3 py-1 text-sm',
            large: 'px-4 py-2 text-base'
        };
        
        const classes = `
            inline-flex items-center font-medium rounded-full
            ${variantClasses[variant]}
            ${sizeClasses[size]}
        `.trim();
        
        return (
            <span className={classes}>
                {children}
            </span>
        );
    });
    
    // ===== CARD COMPONENT =====
    const Card = memo(({ 
        children, 
        title = '',
        className = '',
        padding = 'medium'
    }) => {
        const paddingClasses = {
            none: '',
            small: 'p-4',
            medium: 'p-6',
            large: 'p-8'
        };
        
        return (
            <div className={`bg-white rounded-lg shadow ${className}`}>
                {title && (
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                    </div>
                )}
                <div className={paddingClasses[padding]}>
                    {children}
                </div>
            </div>
        );
    });
    
    // ===== TESTING FUNCTIONS =====
    const TestUIComponents = {
        testComponentsExist: () => {
            const components = ['LoadingSpinner', 'Button', 'Modal', 'Input', 'Select', 'Badge', 'Card'];
            components.forEach(componentName => {
                console.assert(window[componentName], `❌ ${componentName} not exported`);
            });
            console.log('✅ [TEST] All UI components exist');
        }
    };
    
    // ===== EXPORT TO GLOBAL SCOPE =====
    window.LoadingSpinner = LoadingSpinner;
    window.Button = Button;
    window.Modal = Modal;
    window.Input = Input;
    window.Select = Select;
    window.Badge = Badge;
    window.Card = Card;
    window.TestUIComponents = TestUIComponents;
    
    // Auto-run tests
    setTimeout(() => {
        TestUIComponents.testComponentsExist();
    }, 50);
    
})(); 