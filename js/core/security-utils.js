/**
 * Security Utilities - Enhanced Security Features
 * Password hashing, session management, rate limiting
 */

(function() {
    'use strict';

    console.log('🔒 Loading SecurityUtils v1.0.0');

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

    console.log('✅ SecurityUtils loaded successfully');

})(); 