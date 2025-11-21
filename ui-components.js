/**
 * UI Components - Mobile Optimized & Touch-Friendly
 * Responsive breakpoints, touch gestures, and mobile-first design
 */

(function() {
    'use strict';

    console.log('📱 Loading Mobile-Optimized UI Components v2.0...');

    // Mobile breakpoints and utilities
    const MobileUtils = {
        breakpoints: {
            mobile: 640,   // max-width: 640px
            tablet: 768,   // max-width: 768px  
            desktop: 1024, // min-width: 1024px
            xl: 1280,      // min-width: 1280px
            xxl: 1536      // min-width: 1536px
        },

        // Detect device type
        getDeviceType: function() {
            const width = window.innerWidth;
            if (width < this.breakpoints.mobile) return 'mobile';
            if (width < this.breakpoints.tablet) return 'tablet';
            if (width < this.breakpoints.desktop) return 'desktop';
            return 'large';
        },

        // Check if touch device
        isTouchDevice: function() {
            return ('ontouchstart' in window) || 
                   (navigator.maxTouchPoints > 0) || 
                   (navigator.msMaxTouchPoints > 0);
        },

        // Check if mobile
        isMobile: function() {
            return this.getDeviceType() === 'mobile';
        },

        // Debounce function for performance
        debounce: function(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        // Touch/swipe gesture detection
        useSwipeGesture: function(element, onSwipeLeft, onSwipeRight, threshold = 50) {
            if (!element || !this.isTouchDevice()) return;

            let startX = 0;
            let startY = 0;
            let endX = 0;
            let endY = 0;

            element.addEventListener('touchstart', (e) => {
                startX = e.touches[0].clientX;
                startY = e.touches[0].clientY;
            }, { passive: true });

            element.addEventListener('touchend', (e) => {
                endX = e.changedTouches[0].clientX;
                endY = e.changedTouches[0].clientY;

                const deltaX = endX - startX;
                const deltaY = Math.abs(endY - startY);

                // Only trigger if horizontal swipe is dominant
                if (Math.abs(deltaX) > threshold && deltaY < threshold) {
                    if (deltaX > 0 && onSwipeRight) {
                        onSwipeRight();
                    } else if (deltaX < 0 && onSwipeLeft) {
                        onSwipeLeft();
                    }
                }
            }, { passive: true });
        },

        // Format currency for mobile display
        formatCurrency: function(amount, compact = false) {
            if (compact && amount >= 1000000) {
                return (amount / 1000000).toFixed(1) + 'M';
            } else if (compact && amount >= 1000) {
                return (amount / 1000).toFixed(0) + 'K';
            }
            return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
        }
    };

    // Mobile-optimized Button component
    const MobileButton = React.memo(function MobileButton({ 
        children, 
        variant = 'primary', 
        size = 'medium',
        disabled = false, 
        loading = false,
        fullWidth = false,
        touchOptimized = true,
        onClick,
        ...props 
    }) {
        const getButtonClasses = React.useMemo(() => {
            const baseClasses = touchOptimized 
                ? 'min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 transition-transform duration-100'
                : 'transition-colors duration-200';

            const sizeClasses = {
                small: 'px-3 py-2 text-sm',
                medium: 'px-4 py-2 text-base',
                large: 'px-6 py-3 text-lg'
            };

            const variantClasses = {
                primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300',
                secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 disabled:bg-gray-100',
                success: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300',
                danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-300',
                outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50 disabled:border-gray-300 disabled:text-gray-300'
            };

            const widthClass = fullWidth ? 'w-full' : '';

            return `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} 
                    font-medium rounded-lg disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500`;
        }, [variant, size, disabled, fullWidth, touchOptimized]);

        const handleClick = React.useCallback((e) => {
            if (disabled || loading) return;
            
            // Add haptic feedback on mobile
            if (MobileUtils.isTouchDevice() && navigator.vibrate) {
                navigator.vibrate(50);
            }
            
            onClick?.(e);
        }, [disabled, loading, onClick]);

        return React.createElement('button', {
            className: getButtonClasses,
            disabled: disabled || loading,
            onClick: handleClick,
            ...props
        }, 
            loading ? 
                React.createElement('span', { className: 'flex items-center justify-center gap-2' },
                    React.createElement('div', { 
                        className: 'w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin' 
                    }),
                    'Loading...'
                ) : children
        );
    });

    // Mobile-optimized Input component
    const MobileInput = React.memo(function MobileInput({
        label,
        error,
        helper,
        leftIcon,
        rightIcon,
        fullWidth = false,
        touchOptimized = true,
        ...props
    }) {
        const inputId = React.useMemo(() => `input-${Math.random().toString(36).substr(2, 9)}`, []);

        const inputClasses = React.useMemo(() => {
            const baseClasses = touchOptimized 
                ? 'min-h-[44px] text-base' // Prevent zoom on iOS
                : 'h-10 text-sm';
                
            const errorClasses = error 
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500';

            const widthClass = fullWidth ? 'w-full' : '';
            const paddingClass = leftIcon && rightIcon ? 'pl-10 pr-10' : 
                                leftIcon ? 'pl-10 pr-3' : 
                                rightIcon ? 'pl-3 pr-10' : 'px-3';

            return `${baseClasses} ${errorClasses} ${widthClass} ${paddingClass} 
                    border rounded-lg focus:outline-none focus:ring-2 transition-colors`;
        }, [error, fullWidth, leftIcon, rightIcon, touchOptimized]);

        return React.createElement('div', { className: fullWidth ? 'w-full' : '' },
            // Label
            label && React.createElement('label', { 
                htmlFor: inputId,
                className: 'block text-sm font-medium text-gray-700 mb-1'
            }, label),

            // Input container
            React.createElement('div', { className: 'relative' },
                // Left icon
                leftIcon && React.createElement('div', { 
                    className: 'absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                }, leftIcon),

                // Input
                React.createElement('input', {
                    id: inputId,
                    className: inputClasses,
                    ...props
                }),

                // Right icon
                rightIcon && React.createElement('div', { 
                    className: 'absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400'
                }, rightIcon)
            ),

            // Error message
            error && React.createElement('div', { 
                className: 'mt-1 text-sm text-red-600'
            }, error),

            // Helper text
            helper && !error && React.createElement('div', { 
                className: 'mt-1 text-sm text-gray-500'
            }, helper)
        );
    });

    // Mobile-optimized Modal component
    const MobileModal = React.memo(function MobileModal({
        isOpen,
        onClose,
        title,
        children,
        showCloseButton = true,
        fullScreen = false,
        slideFromBottom = true
    }) {
        const isMobile = MobileUtils.isMobile();
        
        // Auto full-screen on mobile
        const shouldFullScreen = fullScreen || isMobile;
        const shouldSlide = slideFromBottom && isMobile;

        React.useEffect(() => {
            if (isOpen) {
                document.body.style.overflow = 'hidden';
                return () => {
                    document.body.style.overflow = 'unset';
                };
            }
        }, [isOpen]);

        // Handle escape key
        React.useEffect(() => {
            const handleEscape = (e) => {
                if (e.key === 'Escape' && isOpen) {
                    onClose?.();
                }
            };
            
            if (isOpen) {
                document.addEventListener('keydown', handleEscape);
                return () => document.removeEventListener('keydown', handleEscape);
            }
        }, [isOpen, onClose]);

        if (!isOpen) return null;

        const modalClasses = shouldFullScreen 
            ? 'fixed inset-0 z-50 bg-white' 
            : 'fixed inset-0 z-50 flex items-center justify-center p-4';

        const contentClasses = shouldFullScreen 
            ? 'h-full w-full flex flex-col'
            : `bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col
               ${shouldSlide ? 'animate-slide-up' : 'animate-fade-in'}`;

        return React.createElement('div', { 
            className: modalClasses,
            onClick: shouldFullScreen ? undefined : onClose
        },
            // Backdrop for non-fullscreen
            !shouldFullScreen && React.createElement('div', { 
                className: 'absolute inset-0 bg-black bg-opacity-50 animate-fade-in'
            }),

            // Modal content
            React.createElement('div', {
                className: contentClasses,
                onClick: (e) => e.stopPropagation()
            },
                // Header
                React.createElement('div', { 
                    className: `flex items-center justify-between p-4 border-b ${shouldFullScreen ? 'bg-gray-50' : ''}` 
                },
                    React.createElement('h2', { 
                        className: 'text-lg font-semibold text-gray-900' 
                    }, title),
                    
                    showCloseButton && React.createElement('button', {
                        className: 'p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100',
                        onClick: onClose
                    }, '✕')
                ),

                // Body
                React.createElement('div', { 
                    className: 'flex-1 overflow-y-auto p-4' 
                }, children)
            )
        );
    });

    // Mobile-optimized Card component
    const MobileCard = React.memo(function MobileCard({
        children,
        padding = 'normal',
        shadow = true,
        border = true,
        rounded = true,
        touchOptimized = false,
        onClick,
        ...props
    }) {
        const cardClasses = React.useMemo(() => {
            const paddingClasses = {
                none: 'p-0',
                small: 'p-2',
                normal: 'p-4',
                large: 'p-6'
            };

            const baseClasses = 'bg-white';
            const shadowClass = shadow ? 'shadow-md' : '';
            const borderClass = border ? 'border border-gray-200' : '';
            const roundedClass = rounded ? 'rounded-lg' : '';
            const touchClass = touchOptimized && onClick ? 'active:scale-98 transition-transform touch-manipulation' : '';
            const cursorClass = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';

            return `${baseClasses} ${paddingClasses[padding]} ${shadowClass} ${borderClass} ${roundedClass} ${touchClass} ${cursorClass}`;
        }, [padding, shadow, border, rounded, touchOptimized, onClick]);

        const handleClick = React.useCallback((e) => {
            if (onClick) {
                // Add haptic feedback on mobile
                if (MobileUtils.isTouchDevice() && navigator.vibrate) {
                    navigator.vibrate(25);
                }
                onClick(e);
            }
        }, [onClick]);

        return React.createElement('div', {
            className: cardClasses,
            onClick: handleClick,
            ...props
        }, children);
    });

    // Mobile-optimized Stats display
    const MobileStatsGrid = React.memo(function MobileStatsGrid({ stats }) {
        const isMobile = MobileUtils.isMobile();
        
        const gridClasses = isMobile 
            ? 'grid grid-cols-1 gap-3' 
            : 'grid grid-cols-2 md:grid-cols-4 gap-4';

        return React.createElement('div', { className: gridClasses },
            stats.map((stat, index) => 
                React.createElement(MobileCard, {
                    key: index,
                    padding: 'small',
                    touchOptimized: true,
                    className: 'text-center'
                },
                    React.createElement('div', { 
                        className: `text-lg font-bold ${stat.color || 'text-blue-600'}` 
                    }, stat.value),
                    React.createElement('div', { 
                        className: 'text-xs text-gray-600 mt-1' 
                    }, stat.label)
                )
            )
        );
    });

    // Mobile-optimized Form wrapper
    const MobileForm = React.memo(function MobileForm({ 
        children, 
        onSubmit, 
        spacing = 'normal',
        ...props 
    }) {
        const spacingClasses = {
            tight: 'space-y-2',
            normal: 'space-y-4',
            loose: 'space-y-6'
        };

        return React.createElement('form', {
            className: spacingClasses[spacing],
            onSubmit: (e) => {
                e.preventDefault();
                onSubmit?.(e);
            },
            ...props
        }, children);
    });

    // Mobile navigation component
    const MobileNavigation = React.memo(function MobileNavigation({ 
        items, 
        currentPage, 
        onNavigate 
    }) {
        const isMobile = MobileUtils.isMobile();
        
        if (!isMobile) {
            // Desktop horizontal navigation
            return React.createElement('nav', { className: 'flex gap-1' },
                items.map(item => 
                    React.createElement(MobileButton, {
                        key: item.key,
                        variant: currentPage === item.key ? 'primary' : 'outline',
                        size: 'small',
                        onClick: () => onNavigate(item.key),
                        disabled: !item.enabled
                    }, item.label)
                )
            );
        }

        // Mobile bottom navigation
        return React.createElement('nav', { 
            className: 'fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40' 
        },
            React.createElement('div', { 
                className: 'flex justify-around items-center h-16 max-w-lg mx-auto px-4' 
            },
                items.slice(0, 4).map(item => // Limit to 4 items on mobile
                    React.createElement('button', {
                        key: item.key,
                        className: `flex flex-col items-center justify-center flex-1 py-1 text-xs ${
                            currentPage === item.key 
                                ? 'text-blue-600' 
                                : item.enabled 
                                    ? 'text-gray-600 hover:text-blue-600' 
                                    : 'text-gray-400'
                        }`,
                        onClick: () => item.enabled && onNavigate(item.key),
                        disabled: !item.enabled
                    },
                        React.createElement('div', { className: 'text-lg mb-1' }, item.icon),
                        React.createElement('span', { className: 'truncate max-w-full' }, item.label)
                    )
                )
            )
        );
    });

    // Toast notification system (mobile-optimized)
    const MobileToast = {
        container: null,
        
        init: function() {
            if (this.container) return;
            
            this.container = document.createElement('div');
            this.container.className = 'fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full pointer-events-none';
            document.body.appendChild(this.container);
        },

        show: function(message, type = 'info', duration = 4000) {
            this.init();
            
            const toast = document.createElement('div');
            const isMobile = MobileUtils.isMobile();
            
            const typeClasses = {
                success: 'bg-green-500 text-white',
                error: 'bg-red-500 text-white',  
                warning: 'bg-yellow-500 text-black',
                info: 'bg-blue-500 text-white'
            };

            toast.className = `${typeClasses[type]} p-3 rounded-lg shadow-lg pointer-events-auto
                              transform transition-all duration-300 ease-out translate-x-full opacity-0
                              ${isMobile ? 'mx-4 text-sm' : 'text-base'}`;
            
            toast.innerHTML = `
                <div class="flex items-center justify-between">
                    <span class="flex-1 pr-2">${message}</span>
                    <button onclick="this.parentElement.parentElement.remove()" 
                            class="text-current opacity-70 hover:opacity-100 ml-2 text-lg">×</button>
                </div>
            `;

            this.container.appendChild(toast);

            // Animate in
            setTimeout(() => {
                toast.classList.remove('translate-x-full', 'opacity-0');
            }, 10);

            // Auto remove
            setTimeout(() => {
                if (toast.parentElement) {
                    toast.classList.add('translate-x-full', 'opacity-0');
                    setTimeout(() => toast.remove(), 300);
                }
            }, duration);
        }
    };

    // Add mobile styles to document
    const addMobileStyles = () => {
        if (document.getElementById('mobile-styles')) return;

        const style = document.createElement('style');
        style.id = 'mobile-styles';
        style.textContent = `
            /* Mobile-first CSS animations and utilities */
            @keyframes slide-up {
                from {
                    transform: translateY(100%);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }

            @keyframes fade-in {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes scale-in {
                from {
                    transform: scale(0.95);
                    opacity: 0;
                }
                to {
                    transform: scale(1);
                    opacity: 1;
                }
            }

            .animate-slide-up { animation: slide-up 0.3s ease-out; }
            .animate-fade-in { animation: fade-in 0.2s ease-out; }
            .animate-scale-in { animation: scale-in 0.2s ease-out; }

            /* Touch-friendly styles */
            .touch-manipulation {
                touch-action: manipulation;
                -webkit-touch-callout: none;
                -webkit-user-select: none;
                -khtml-user-select: none;
                -moz-user-select: none;
                -ms-user-select: none;
                user-select: none;
            }

            .active\\:scale-95:active { transform: scale(0.95); }
            .active\\:scale-98:active { transform: scale(0.98); }

            /* Prevent zoom on iOS inputs */
            @media screen and (max-width: 640px) {
                input[type="text"],
                input[type="email"],
                input[type="password"],
                input[type="number"],
                input[type="tel"],
                textarea,
                select {
                    font-size: 16px !important;
                }
            }

            /* Safe area support for notched devices */
            @supports (padding: max(0px)) {
                .safe-top { padding-top: max(1rem, env(safe-area-inset-top)); }
                .safe-bottom { padding-bottom: max(1rem, env(safe-area-inset-bottom)); }
                .safe-left { padding-left: max(1rem, env(safe-area-inset-left)); }
                .safe-right { padding-right: max(1rem, env(safe-area-inset-right)); }
            }

            /* Mobile-optimized scrollbars */
            @media (max-width: 768px) {
                ::-webkit-scrollbar {
                    width: 4px;
                }
                ::-webkit-scrollbar-track {
                    background: transparent;
                }
                ::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.2);
                    border-radius: 2px;
                }
            }
        `;

        document.head.appendChild(style);
    };

    // Initialize mobile optimization
    const initMobileOptimization = () => {
        addMobileStyles();
        MobileToast.init();

        // Add resize listener for responsive updates
        const handleResize = MobileUtils.debounce(() => {
            window.dispatchEvent(new CustomEvent('mobileBreakpointChange', {
                detail: {
                    deviceType: MobileUtils.getDeviceType(),
                    isMobile: MobileUtils.isMobile(),
                    isTouchDevice: MobileUtils.isTouchDevice()
                }
            }));
        }, 250);

        window.addEventListener('resize', handleResize);

        console.log('📱 Mobile optimization initialized');
    };

    // Auto-initialize
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMobileOptimization);
    } else {
        initMobileOptimization();
    }

    // Export components and utilities
    window.MobileUtils = MobileUtils;
    window.MobileButton = MobileButton;
    window.MobileInput = MobileInput;
    window.MobileModal = MobileModal;
    window.MobileCard = MobileCard;
    window.MobileStatsGrid = MobileStatsGrid;
    window.MobileForm = MobileForm;
    window.MobileNavigation = MobileNavigation;
    window.MobileToast = MobileToast;
    window.showToast = MobileToast.show.bind(MobileToast);

    console.log('✅ Mobile-Optimized UI Components loaded successfully');

})(); 