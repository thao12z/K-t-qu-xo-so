//  UI COMPONENTS MODULE - MODERN DESIGN SYSTEM
// Version: 2.0.0 | Updated: 2024 | New UI Design System
(function() {
    'use strict';

    const { useState, useCallback, memo } = React;

    // ===== DESIGN SYSTEM COLORS =====
    const COLORS = {
        background: '#F8F7F7',
        backgroundLight: '#FCFCFC',
        border: '#E2E2E2',
        borderLight: '#ECECEC',
        text: '#000000',
        textGray: '#7B7B7B',
        textDark: '#121212',
        primary: '#E36323',
        primaryDark: '#DF5A18',
        primaryBorder: '#BF4A0F',
        dark: '#222222',
        darkLight: '#323232',
        error: '#FE5938',
        success: '#10B981',
        warning: '#F59E0B'
    };

    // ===== LOADING COMPONENT =====
    const LoadingSpinner = memo(({ size = 'medium', message = 'Loading...' }) => {
        const sizeClasses = {
            small: 'w-4 h-4',
            medium: 'w-8 h-8',
            large: 'w-12 h-12'
        };

        return (
            <div className="flex flex-col items-center justify-center p-4">
                <div className={`${sizeClasses[size]} border-4 border-[#E2E2E2] border-t-[#E36323] rounded-full animate-spin`}></div>
                {message && <p className="mt-2 text-sm text-[#7B7B7B]">{message}</p>}
            </div>
        );
    });

    // ===== BUTTON COMPONENT - NEW DESIGN =====
    const Button = memo(({
        children,
        onClick = () => {},
        variant = 'primary',
        size = 'medium',
        disabled = false,
        loading = false,
        className = '',
        type = 'button'
    }) => {
        const baseClasses = 'relative inline-flex justify-center items-center font-semibold cursor-pointer transition-all';

        const variantClasses = {
            primary: `bg-gradient-to-b from-[#E5E5E5] to-[#E2E2E2] text-[#121212]
                shadow-[0_3px_4px_-1px_rgba(0,0,0,0.15),0px_1px_0px_0px_rgba(255,255,255,0.33)_inset,0px_0px_0px_1px_#D4D4D4]
                hover:shadow-[0px_3px_8px_-2px_rgba(0,0,0,0.30),0px_1px_0px_0px_rgba(255,255,255,0.70)_inset,0px_0px_0px_1px_#E6E6E6]`,
            secondary: `bg-gradient-to-b from-[#323232] to-[#222222] text-[#FCFCFC]
                shadow-[0_0.5px_1px_0px_rgba(255,255,255,0.15)_inset,0px_2px_4px_-1px_rgba(13,13,13,0.50),0px_-1px_1.2px_0.35px_#121212_inset,0px_0px_0px_1px_#333]
                hover:opacity-90`,
            orange: `bg-gradient-to-b from-[#E36323] to-[#DF5A18] text-[#FCFCFC]
                shadow-[0px_1px_0px_0px_rgba(255,255,255,0.33)_inset,0px_0px_0px_1px_#BF4A0F,0px_3px_4px_-1px_rgba(252,96,16,0.95)]
                hover:brightness-110`,
            success: `bg-gradient-to-b from-[#10B981] to-[#059669] text-white
                shadow-[0px_1px_0px_0px_rgba(255,255,255,0.33)_inset,0px_0px_0px_1px_#047857,0px_3px_4px_-1px_rgba(16,185,129,0.5)]
                hover:brightness-110`,
            danger: `bg-gradient-to-b from-[#EF4444] to-[#DC2626] text-white
                shadow-[0px_1px_0px_0px_rgba(255,255,255,0.33)_inset,0px_0px_0px_1px_#B91C1C,0px_3px_4px_-1px_rgba(239,68,68,0.5)]
                hover:brightness-110`,
            warning: `bg-gradient-to-b from-[#F59E0B] to-[#D97706] text-white
                shadow-[0px_1px_0px_0px_rgba(255,255,255,0.33)_inset,0px_0px_0px_1px_#B45309,0px_3px_4px_-1px_rgba(245,158,11,0.5)]
                hover:brightness-110`,
            ghost: `bg-transparent text-[#7B7B7B] hover:bg-[#F1F1F1] hover:text-[#121212]`
        };

        const sizeClasses = {
            small: 'h-9 px-5 rounded-[0.625rem] text-[0.75rem]',
            medium: 'h-10 px-6 rounded-xl text-[0.875rem]',
            large: 'h-12 px-8 rounded-xl text-[1rem]'
        };

        const disabledClasses = 'opacity-30 pointer-events-none';

        const finalClasses = `
            ${baseClasses}
            ${variantClasses[variant] || variantClasses.primary}
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
                type={type}
                className={finalClasses}
                onClick={handleClick}
                disabled={disabled || loading}
            >
                <span className="relative z-2 flex items-center gap-2">
                    {loading ? (
                        <>
                            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                            <span>Loading...</span>
                        </>
                    ) : children}
                </span>
            </button>
        );
    });

    // ===== MODAL COMPONENT - NEW DESIGN =====
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
                className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={handleBackdropClick}
            >
                <div className={`bg-[#FCFCFC] rounded-2xl shadow-[0px_8px_32px_-4px_rgba(0,0,0,0.25)] w-full ${sizeClasses[size]} max-h-[90vh] overflow-hidden border border-[#ECECEC]`}>
                    {title && (
                        <div className="flex items-center justify-between p-6 border-b border-[#ECECEC]">
                            <h3 className="text-lg font-semibold text-[#121212]">{title}</h3>
                            {closable && (
                                <button
                                    onClick={onClose}
                                    className="text-[#7B7B7B] hover:text-[#121212] p-2 rounded-lg hover:bg-[#F1F1F1] transition-colors"
                                >
                                    <span className="sr-only">Close</span>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
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

    // ===== INPUT FIELD COMPONENT - NEW DESIGN =====
    const Input = memo(({
        type = 'text',
        placeholder = '',
        value = '',
        onChange = () => {},
        error = '',
        label = '',
        required = false,
        disabled = false,
        className = '',
        icon = null
    }) => {
        const inputClasses = `
            w-full h-12 px-5 border-[1.5px] rounded-xl text-[0.8125rem] leading-[1rem] text-[#000]
            placeholder:text-[#7B7B7B] transition-all
            focus:outline-none focus:shadow-[0px_1px_4px_-1px_rgba(0,0,0,0.15)]
            hover:shadow-[0px_1px_4px_-1px_rgba(0,0,0,0.15)]
            ${error ? 'border-[#FE5938] focus:border-[#FE5938]' : 'border-[#E2E2E2] focus:border-[#E36323]'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[#F8F7F7]' : 'bg-white'}
            ${icon ? 'pl-10' : ''}
            ${className}
        `.trim();

        const handleChange = useCallback((e) => {
            onChange(e.target.value);
        }, [onChange]);

        return (
            <div className="mb-4">
                {label && (
                    <label className="flex items-center mb-2 text-[0.75rem] leading-[1rem] font-medium text-[#121212]">
                        {label}
                        {required && <span className="text-[#FE5938] ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    {icon && (
                        <div className="absolute top-0 left-0 bottom-0 flex items-center justify-center w-10 pointer-events-none text-[#7B7B7B]">
                            {icon}
                        </div>
                    )}
                    <input
                        type={type}
                        placeholder={placeholder}
                        value={value}
                        onChange={handleChange}
                        disabled={disabled}
                        className={inputClasses}
                    />
                </div>
                {error && (
                    <p className="mt-2 text-[0.6875rem] leading-[1rem] font-medium text-[#FE5938]">{error}</p>
                )}
            </div>
        );
    });

    // ===== SELECT COMPONENT - NEW DESIGN =====
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
            w-full h-12 px-5 border-[1.5px] rounded-xl text-[0.8125rem] leading-[1rem] text-[#000]
            bg-white transition-all appearance-none cursor-pointer
            focus:outline-none focus:shadow-[0px_1px_4px_-1px_rgba(0,0,0,0.15)]
            hover:shadow-[0px_1px_4px_-1px_rgba(0,0,0,0.15)]
            ${error ? 'border-[#FE5938] focus:border-[#FE5938]' : 'border-[#E2E2E2] focus:border-[#E36323]'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[#F8F7F7]' : ''}
            ${className}
        `.trim();

        const handleChange = useCallback((e) => {
            onChange(e.target.value);
        }, [onChange]);

        return (
            <div className="mb-4">
                {label && (
                    <label className="flex items-center mb-2 text-[0.75rem] leading-[1rem] font-medium text-[#121212]">
                        {label}
                        {required && <span className="text-[#FE5938] ml-1">*</span>}
                    </label>
                )}
                <div className="relative">
                    <select
                        value={value}
                        onChange={handleChange}
                        disabled={disabled}
                        className={selectClasses}
                    >
                        {placeholder && (
                            <option value="" className="text-[#7B7B7B]">{placeholder}</option>
                        )}
                        {options.map((option) => (
                            <option key={option.value} value={option.value}>
                                {option.label}
                            </option>
                        ))}
                    </select>
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-[#7B7B7B]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
                {error && (
                    <p className="mt-2 text-[0.6875rem] leading-[1rem] font-medium text-[#FE5938]">{error}</p>
                )}
            </div>
        );
    });

    // ===== BADGE COMPONENT - NEW DESIGN =====
    const Badge = memo(({
        children,
        variant = 'default',
        size = 'medium'
    }) => {
        const variantClasses = {
            default: 'bg-[#F1F1F1] text-[#7B7B7B] border border-[#ECECEC]',
            success: 'bg-[#D1FAE5] text-[#065F46] border border-[#A7F3D0]',
            warning: 'bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A]',
            error: 'bg-[#FEE2E2] text-[#991B1B] border border-[#FECACA]',
            info: 'bg-[#DBEAFE] text-[#1E40AF] border border-[#BFDBFE]',
            orange: 'bg-[#FFEDD5] text-[#9A3412] border border-[#FED7AA]'
        };

        const sizeClasses = {
            small: 'px-2 py-0.5 text-[0.625rem]',
            medium: 'px-3 py-1 text-[0.6875rem]',
            large: 'px-4 py-1.5 text-[0.75rem]'
        };

        const classes = `
            inline-flex items-center font-medium rounded-xl leading-[1rem]
            ${variantClasses[variant]}
            ${sizeClasses[size]}
        `.trim();

        return (
            <span className={classes}>
                {children}
            </span>
        );
    });

    // ===== CARD COMPONENT - NEW DESIGN =====
    const Card = memo(({
        children,
        title = '',
        className = '',
        padding = 'medium',
        isGray = false
    }) => {
        const paddingClasses = {
            none: '',
            small: 'p-4',
            medium: 'p-6',
            large: 'p-8'
        };

        return (
            <div className={`rounded-2xl border border-[#ECECEC] ${isGray ? 'bg-[#F8F7F7]' : 'bg-[#FCFCFC]'} ${className}`}>
                {title && (
                    <div className="px-6 py-4 border-b border-[#ECECEC]">
                        <h3 className="text-lg font-semibold text-[#121212]">{title}</h3>
                    </div>
                )}
                <div className={paddingClasses[padding]}>
                    {children}
                </div>
            </div>
        );
    });

    // ===== TEXTAREA COMPONENT - NEW DESIGN =====
    const Textarea = memo(({
        placeholder = '',
        value = '',
        onChange = () => {},
        error = '',
        label = '',
        required = false,
        disabled = false,
        className = '',
        rows = 4
    }) => {
        const textareaClasses = `
            w-full px-5 py-4 border-[1.5px] rounded-xl text-[0.8125rem] leading-[1.5rem] text-[#000]
            placeholder:text-[#7B7B7B] transition-all resize-none
            focus:outline-none focus:shadow-[0px_1px_4px_-1px_rgba(0,0,0,0.15)]
            hover:shadow-[0px_1px_4px_-1px_rgba(0,0,0,0.15)]
            ${error ? 'border-[#FE5938] focus:border-[#FE5938]' : 'border-[#E2E2E2] focus:border-[#E36323]'}
            ${disabled ? 'opacity-50 cursor-not-allowed bg-[#F8F7F7]' : 'bg-white'}
            ${className}
        `.trim();

        const handleChange = useCallback((e) => {
            onChange(e.target.value);
        }, [onChange]);

        return (
            <div className="mb-4">
                {label && (
                    <label className="flex items-center mb-2 text-[0.75rem] leading-[1rem] font-medium text-[#121212]">
                        {label}
                        {required && <span className="text-[#FE5938] ml-1">*</span>}
                    </label>
                )}
                <textarea
                    placeholder={placeholder}
                    value={value}
                    onChange={handleChange}
                    disabled={disabled}
                    rows={rows}
                    className={textareaClasses}
                />
                {error && (
                    <p className="mt-2 text-[0.6875rem] leading-[1rem] font-medium text-[#FE5938]">{error}</p>
                )}
            </div>
        );
    });

    // ===== TESTING FUNCTIONS =====
    const TestUIComponents = {
        testComponentsExist: () => {
            const components = ['LoadingSpinner', 'Button', 'Modal', 'Input', 'Select', 'Badge', 'Card', 'Textarea'];
            components.forEach(componentName => {
                console.assert(window[componentName], ` ${componentName} not exported`);
            });
            console.log(' [TEST] All UI components exist - New Design System v2.0');
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
    window.Textarea = Textarea;
    window.TestUIComponents = TestUIComponents;
    window.DESIGN_COLORS = COLORS;

    // Auto-run tests
    setTimeout(() => {
        TestUIComponents.testComponentsExist();
    }, 50);

    console.log(' UI Components v2.0 loaded - Modern Design System');

})();
