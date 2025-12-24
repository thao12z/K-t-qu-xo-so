/**
 * Security Utilities - Enhanced Security Features
 * Password hashing, session management, rate limiting
 */

(function() {
    'use strict';

    // ===== PRODUCTION LOGGER =====
    // Silences verbose logs in production, only shows errors
    // Development mode: localhost, 127.0.0.1, or DEBUG_MODE enabled
    // Production mode: Any other hostname (hosting)

    // 🔓 DEBUG MODE BYPASS: Add ?debug=1 to URL to enable debugging on production
    const urlParams = new URLSearchParams(window.location.search);
    const debugParam = urlParams.get('debug') === '1';

    const isDevelopment = window.DEBUG_MODE ||
                         debugParam ||
                         window.location.hostname === 'localhost' ||
                         window.location.hostname === '127.0.0.1' ||
                         window.location.hostname === '' ||
                         window.location.protocol === 'file:';
    const isProduction = !isDevelopment;

    if (debugParam) {
        console.log('🔓 DEBUG MODE ENABLED via URL parameter');
    }

    const ProductionLogger = {
        log: (...args) => {
            if (!isProduction) console.log(...args);
        },
        warn: (...args) => {
            if (!isProduction) console.warn(...args);
        },
        error: (...args) => {
            console.error(...args); // Always show errors
        },
        info: (...args) => {
            if (!isProduction) console.info(...args);
        },
        debug: (...args) => {
            if (!isProduction) console.debug(...args);
        },
        table: (...args) => {
            if (!isProduction) console.table(...args);
        },
        // Check production mode
        isProduction: () => isProduction,
        // Force enable logging temporarily
        forceEnable: () => {
            window.DEBUG_MODE = true;
        }
    };

    // Export logger globally for other modules
    window.Logger = ProductionLogger;

    if (!isProduction) {
        console.log(' Loading SecurityUtils v1.1.0');
        console.log(` Logger mode: ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}`);
    }

    const SecurityUtils = {
        // Password hashing with salt using Web Crypto API
        async hashPassword(password) {
            try {
                const encoder = new TextEncoder();
                const data = encoder.encode(password);
                const salt = crypto.getRandomValues(new Uint8Array(16));
                
                const keyMaterial = await crypto.subtle.importKey(
                    'raw',
                    data,
                    { name: 'PBKDF2' },
                    false,
                    ['deriveBits', 'deriveKey']
                );
                
                const key = await crypto.subtle.deriveKey(
                    {
                        name: 'PBKDF2',
                        salt: salt,
                        iterations: 100000,
                        hash: 'SHA-256'
                    },
                    keyMaterial,
                    { name: 'HMAC', hash: 'SHA-256' },
                    true,
                    ['sign']
                );
                
                const signature = await crypto.subtle.sign('HMAC', key, salt);
                const hash = Array.from(new Uint8Array(signature))
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                
                const saltHex = Array.from(salt)
                    .map(b => b.toString(16).padStart(2, '0'))
                    .join('');
                
                return `${saltHex}:${hash}`;
            } catch (error) {
                console.error('Password hashing error:', error);
                // Fallback to simple hash for backward compatibility
                return btoa(password + '_salt');
            }
        },

        // Verify password with backward compatibility
        async verifyPassword(password, storedHash) {
            try {
                if (storedHash.includes(':')) {
                    // New format with salt
                    const [saltHex, hash] = storedHash.split(':');
                    const salt = new Uint8Array(saltHex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
                    
                    const encoder = new TextEncoder();
                    const data = encoder.encode(password);
                    
                    const keyMaterial = await crypto.subtle.importKey(
                        'raw',
                        data,
                        { name: 'PBKDF2' },
                        false,
                        ['deriveBits', 'deriveKey']
                    );
                    
                    const key = await crypto.subtle.deriveKey(
                        {
                            name: 'PBKDF2',
                            salt: salt,
                            iterations: 100000,
                            hash: 'SHA-256'
                        },
                        keyMaterial,
                        { name: 'HMAC', hash: 'SHA-256' },
                        true,
                        ['sign']
                    );
                    
                    const signature = await crypto.subtle.sign('HMAC', key, salt);
                    const computedHash = Array.from(new Uint8Array(signature))
                        .map(b => b.toString(16).padStart(2, '0'))
                        .join('');
                    
                    return computedHash === hash;
                } else {
                    // Old format - simple comparison
                    return btoa(password + '_salt') === storedHash;
                }
            } catch (error) {
                console.error('Password verification error:', error);
                return false;
            }
        },

        // Generate session token (JWT-like)
        generateSessionToken(userId, expiresIn = 24 * 60 * 60 * 1000) {
            try {
                const header = {
                    alg: 'HS256',
                    typ: 'JWT'
                };
                
                const payload = {
                    userId: userId,
                    exp: Date.now() + expiresIn,
                    iat: Date.now()
                };
                
                const headerB64 = btoa(JSON.stringify(header));
                const payloadB64 = btoa(JSON.stringify(payload));
                
                // Simple signature (in production would use proper HMAC)
                const signature = btoa(`${headerB64}.${payloadB64}.secret`);
                
                return `${headerB64}.${payloadB64}.${signature}`;
            } catch (error) {
                console.error('Session token generation error:', error);
                return btoa(JSON.stringify({ userId, exp: Date.now() + expiresIn }));
            }
        },

        // Validate session token
        validateSession(token) {
            try {
                if (!token) return null;
                
                if (token.includes('.')) {
                    // JWT-like format
                    const parts = token.split('.');
                    if (parts.length !== 3) return null;
                    
                    const payload = JSON.parse(atob(parts[1]));
                    
                    if (payload.exp < Date.now()) {
                        return null; // Expired
                    }
                    
                    return payload;
                } else {
                    // Simple format
                    const payload = JSON.parse(atob(token));
                    
                    if (payload.exp < Date.now()) {
                        return null; // Expired
                    }
                    
                    return payload;
                }
            } catch (error) {
                console.error('Session validation error:', error);
                return null;
            }
        },

        // Rate limiting
        rateLimit: {
            attempts: new Map(),
            
            checkLimit(key, maxAttempts = 5, windowMs = 15 * 60 * 1000) {
                const now = Date.now();
                const userAttempts = this.attempts.get(key) || [];
                
                // Remove old attempts
                const recentAttempts = userAttempts.filter(timestamp => now - timestamp < windowMs);
                
                if (recentAttempts.length >= maxAttempts) {
                    return false; // Rate limited
                }
                
                // Add current attempt
                recentAttempts.push(now);
                this.attempts.set(key, recentAttempts);
                
                return true; // Allowed
            },
            
            reset(key) {
                this.attempts.delete(key);
            }
        },

        // Input validation
        validateInput(input, type = 'string') {
            if (!input) return false;
            
            switch (type) {
                case 'username':
                    return /^[a-zA-Z0-9_]{3,20}$/.test(input);
                case 'email':
                    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
                case 'password':
                    return input.length >= 6;
                case 'phone':
                    return /^[0-9]{10,11}$/.test(input.replace(/\D/g, ''));
                default:
                    return typeof input === 'string' && input.trim().length > 0;
            }
        },

        // Input sanitization
        sanitizeInput(input) {
            if (typeof input !== 'string') return input;
            
            return input
                .replace(/[<>]/g, '') // Remove potential HTML tags
                .replace(/javascript:/gi, '') // Remove javascript: protocol
                .trim();
        }
    };

    // Export to window
    window.SecurityUtils = SecurityUtils;

    // ===== PRODUCTION PROTECTION =====
    // ⚠️ TEMPORARILY DISABLED FOR DEBUGGING
    // TODO: Re-enable after fixing blank screen issue

    /*
    // Enhanced console protection and DevTools detection

    if (isProduction) {
        // 1. OVERRIDE CONSOLE - Disable all console methods in production
        const noop = () => {};
        const originalConsole = {
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info,
            debug: console.debug,
            table: console.table,
            trace: console.trace,
            dir: console.dir,
            dirxml: console.dirxml,
            group: console.group,
            groupCollapsed: console.groupCollapsed,
            groupEnd: console.groupEnd,
            clear: console.clear
        };

        // Override all console methods (except clear)
        console.log = noop;
        console.warn = noop;
        console.info = noop;
        console.debug = noop;
        console.table = noop;
        console.trace = noop;
        console.dir = noop;
        console.dirxml = noop;
        console.group = noop;
        console.groupCollapsed = noop;
        console.groupEnd = noop;

        // Only show critical errors (but sanitized)
        console.error = (...args) => {
            // Sanitize error messages to not reveal code structure
            const sanitized = args.map(arg => {
                if (typeof arg === 'string') {
                    return arg.replace(/\/js\/.*\.js/g, '[hidden]')
                              .replace(/line \d+/gi, '')
                              .replace(/at .*\(/g, 'at [hidden](');
                }
                return '[Error]';
            });
            originalConsole.error(...sanitized);
        };

        // 2. DEVTOOLS DETECTION
        let devtoolsOpen = false;
        const threshold = 160; // Threshold for detecting devtools

        const detectDevTools = () => {
            const widthThreshold = window.outerWidth - window.innerWidth > threshold;
            const heightThreshold = window.outerHeight - window.innerHeight > threshold;
            const isOpen = widthThreshold || heightThreshold;

            if (isOpen && !devtoolsOpen) {
                devtoolsOpen = true;
                // Clear console when devtools is opened
                console.clear();
                // Redirect or show warning
                document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;"><h2> Unauthorized Access Detected</h2></div>';
                setTimeout(() => {
                    window.location.href = 'about:blank';
                }, 2000);
            }
        };

        // Check every 500ms
        setInterval(detectDevTools, 500);

        // Alternative: Detect by checking console object
        const checkElement = () => {
            const before = new Date();
            debugger; // This will pause if devtools is open
            const after = new Date();
            const diff = after - before;

            if (diff > 100) {
                console.clear();
                document.body.innerHTML = '<div style="display:flex;justify-content:center;align-items:center;height:100vh;font-family:Arial;"><h2> Developer Tools Detected</h2></div>';
                setTimeout(() => window.location.href = 'about:blank', 2000);
            }
        };

        // Check periodically
        setInterval(checkElement, 2000);

        // 3. AUTO-CLEAR CONSOLE
        setInterval(() => {
            console.clear();
        }, 1000);

        // 4. DISABLE RIGHT-CLICK
        document.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            return false;
        });

        // 5. DISABLE F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
        document.addEventListener('keydown', (e) => {
            // F12
            if (e.keyCode === 123) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+I (Inspect)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+J (Console)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
                e.preventDefault();
                return false;
            }
            // Ctrl+U (View Source)
            if (e.ctrlKey && e.keyCode === 85) {
                e.preventDefault();
                return false;
            }
            // Ctrl+Shift+C (Inspect Element)
            if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
                e.preventDefault();
                return false;
            }
        });

        // 6. DISABLE TEXT SELECTION (Optional - might affect UX)
        // document.addEventListener('selectstart', (e) => {
        //     e.preventDefault();
        //     return false;
        // });

        // 7. OBFUSCATE DOM STRUCTURE
        // Add random classes to make HTML harder to read
        const obfuscateDOM = () => {
            const elements = document.querySelectorAll('*');
            elements.forEach((el) => {
                if (!el.classList.contains('obf')) {
                    el.classList.add('obf-' + Math.random().toString(36).substr(2, 9));
                }
            });
        };

        // Run after page load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', obfuscateDOM);
        } else {
            obfuscateDOM();
        }

        // Store original console methods for admin debug mode
        window.__CONSOLE__ = originalConsole;

        // Secret key to re-enable console for debugging (only for admins)
        window.enableDebugMode = (key) => {
            if (key === 'admin2025debug') {
                Object.assign(console, originalConsole);
                console.log(' Debug mode enabled');
                return true;
            }
            return false;
        };
    }
    */

    // PRODUCTION PROTECTION DISABLED - Console and DevTools are now accessible
    console.log('⚠️ SECURITY: Production protection DISABLED for debugging');

    if (!isProduction) {
        console.log('✅ SecurityUtils loaded successfully');
        console.log('📊 Mode:', isProduction ? 'PRODUCTION (security disabled)' : 'DEVELOPMENT');
    }

})(); 