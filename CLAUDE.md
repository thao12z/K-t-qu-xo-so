# CLAUDE.md - AI Assistant Guide

## Project Overview

**Name:** he-thong-doi-soat-lo-de (Lottery Bet Reconciliation System)
**Purpose:** B2B system for lottery agents to reconcile betting data with Vietnamese Northern lottery results (XSMB)
**Language:** Vietnamese UI and documentation

## Tech Stack

- **Frontend Framework:** React 18 (loaded via CDN)
- **Styling:** Tailwind CSS (loaded via CDN)
- **Transpilation:** Babel Standalone (in-browser JSX)
- **Dev Server:** Python HTTP server (`python -m http.server 8000`)
- **Data Storage:** localStorage (client-side only, no backend)
- **Lottery Data:** RSS feeds from xosodaiphat.com

## Quick Start

```bash
# Start development server
npm start
# or
python -m http.server 8000

# Access points
# Admin: http://localhost:8000/admin-login/
# User:  http://localhost:8000/
# Deploy: http://localhost:8000/deploy.html
```

## Directory Structure

```
K-t-qu-xo-so/
├── index.html                 # User system entry point
├── deploy.html                # Production access control
├── admin-login/               # Admin system
│   └── index.html             # Admin interface
├── js/                        # JavaScript source
│   ├── core/                  # Shared core modules
│   │   ├── global-state-manager.js   # Central state management
│   │   ├── shared-data-service.js    # Admin-User data sync
│   │   ├── auth-system.js            # Authentication
│   │   ├── broadcast-sync.js         # Cross-tab sync
│   │   └── security-utils.js         # Security utilities
│   ├── services/              # External services
│   │   └── lottery-data-service.js   # RSS feed integration
│   ├── admin/                 # Admin modules
│   │   ├── main-admin.js             # Main admin orchestrator
│   │   ├── user-management.js
│   │   ├── payment-management.js
│   │   ├── package-management.js
│   │   ├── pending-requests.js
│   │   └── notification-system.js
│   └── user/                  # User modules
│       ├── main-agent.js             # User orchestrator
│       ├── bet-parser.js             # Bet parsing/calculation
│       ├── main-reconciliation-final.js  # Reconciliation logic
│       ├── landing-page.js
│       ├── formula-page.js
│       ├── pricing-page.js
│       └── ui-components.js
├── RULE!!!.mdc                # Business rules
├── Rule Detail.mdc            # Technical specifications
└── *.md                       # Documentation files
```

## Architecture

### Two-System Architecture

1. **Admin System** (`/admin-login/index.html`)
   - User CRUD operations
   - Package configuration
   - Payment approval/rejection
   - System notifications

2. **User System** (`/index.html`)
   - Bet reconciliation
   - Lottery results display
   - Package subscriptions

### State Management

```
Admin System → GlobalStateManager → localStorage → SharedDataService → User System
```

- **GlobalStateManager:** Central state with pub/sub pattern
- **SharedDataService:** Syncs data between systems
- **localStorage:** Persistent storage

### Key localStorage Keys

```javascript
// Admin System
'adminUsers', 'admin_users'
'adminPackages', 'admin_packages'
'adminPayments', 'admin_payments'
'adminNotifications'
'admin_paymentConfig'

// User System
'registeredUsers'
'syncedDemoAccounts'
'userPackages'
'lotteryData'
'lotteryHistoricalCache'
```

## Design System Colors

```javascript
const COLORS = {
    background: '#F8F7F7',
    primary: '#E36323',     // Orange accent
    primaryDark: '#DF5A18',
    text: '#121212',
    textGray: '#7B7B7B',
    error: '#FE5938',
    success: '#10B981',
    warning: '#F59E0B'
};
```

## Code Conventions

### Module Pattern
All modules use IIFE pattern and export to `window`:
```javascript
(function() {
    'use strict';

    const MyModule = {
        // implementation
    };

    window.MyModule = MyModule;
})();
```

### React Components
- Use functional components with hooks
- Apply `React.memo` for performance
- Use `useCallback`/`useMemo` for optimization

### Naming Conventions
- **Variables/Functions:** camelCase
- **Constants:** UPPER_SNAKE_CASE
- **Components:** PascalCase
- **Comments:** Vietnamese language

### Key Module Exports

```javascript
// Core
window.GlobalStateManager
window.SharedDataService
window.AuthService
window.LotteryDataService

// Admin
window.MainAdminSystem
window.UserManagement
window.PaymentManagement
window.PackageManagement

// User
window.MainAgentSystem
window.BetParser
window.MainReconciliation
window.LandingPage
window.FormulaPage
window.PricingPage

// UI Components
window.LoadingSpinner
window.Button
window.Modal
window.Input
window.Card
```

## Bet Types and Syntax

### Supported Bet Types

| Type | Aliases | Example |
|------|---------|---------|
| Lô | L, l, lo, Lo, LO, Lô | `L 23 50k` |
| Đề | D, Đ, đ, đề, de | `D 88 100k` |
| Xiên | Lx, lx, xien2/3/4 | `Lx 23,45 10k` |
| Ba Càng | BC, Bc, bc | `BC 123 20k` |

### Default Configuration

```javascript
DEFAULT_CONFIG = {
    mien: 'bac',              // Only Northern region
    tien1DiemLo: 23000,       // Point value for Lo
    tienTra1DiemLo: 80000,    // Win amount per point
    tyLeLoThu: 100,           // Loss percentage
    heSoDeTra: 70,            // De multiplier
    heSoXien2Tra: 10,         // Xien2 multiplier
    heSoXien3Tra: 40,         // Xien3 multiplier
    heSoXien4Tra: 100,        // Xien4 multiplier
    heSoBaCangTra: 400        // Ba Cang multiplier
}
```

## Test Accounts

### Admin System
| Username | Password |
|----------|----------|
| admin | admin123 |

### User System
| Username | Password | Status |
|----------|----------|--------|
| agent_nguyen | agent123 | Active |
| agent_tran | agent456 | Active |
| demo_user | demo123 | Active |

## Debugging

### Console Commands

```javascript
// Load test data
window.loadRealTestData()

// Check system status
window.checkSystemStatus()

// Admin debugging
window.DEBUG_ADMIN_SYSTEM.checkUsers()
window.DEBUG_ADMIN_SYSTEM.createTestUser('username', 'password')

// User debugging
window.SharedDataService.debugSyncStatus()

// Run test suite
window.TEST_HELPERS.runFullTestSuite()

// Test bet processing
window.TEST_HELPERS.simulateBetProcessing('L 23 50k\nD 88 100k')
```

## Common Tasks for AI Assistants

### Adding a New Bet Type
1. Update `BET_TERMS` in `js/user/bet-parser.js`
2. Add parsing logic in bet-parser.js
3. Update configuration defaults
4. Add multiplier calculation logic

### Modifying UI Components
1. Check `js/user/ui-components.js` for reusable components
2. Follow existing color scheme from design system
3. Use Tailwind CSS classes
4. Components use React functional pattern

### Adding Admin Features
1. Main entry point: `js/admin/main-admin.js`
2. State managed via `GlobalStateManager`
3. Add new state keys and subscribers as needed
4. Sync to user system via `SharedDataService`

### Working with Lottery Data
1. Service located at `js/services/lottery-data-service.js`
2. Uses CORS proxies for RSS feeds
3. Results cached in localStorage
4. Primary source: xosodaiphat.com

### Authentication Changes
1. Auth logic in `js/core/auth-system.js`
2. Session stored in sessionStorage
3. Package validation checks status and expiry
4. 30-second validation interval

## Important Patterns

### Event Broadcasting
```javascript
// Cross-module communication
document.dispatchEvent(new CustomEvent('adminDataChanged', { detail: data }));

// Cross-tab sync
window.addEventListener('storage', handleStorageChange);
```

### Data Synchronization
- Admin changes trigger `adminDataChanged` event
- SharedDataService polls every 30 seconds
- User system listens for `sharedDataUpdate` events

### Error Handling
- Use try-catch blocks for async operations
- Log errors to console with context
- Display user-friendly error messages via UI components

## Security Considerations

- **No backend validation:** All validation is client-side
- **localStorage data:** Can be modified by users
- **Test accounts:** Use plain text passwords (hash in production)
- **CORS proxies:** Required for RSS feed access

## Known Limitations

1. **Browser-only storage** - Data lost if localStorage cleared
2. **No real backend** - No server-side validation or database
3. **Single region** - Only supports Northern Vietnam lottery (XSMB)
4. **Polling sync** - 30-second intervals, not real-time
5. **CORS dependency** - Relies on proxy services

## File Modification Guidelines

### Before Editing
- Read the entire file to understand context
- Check for module dependencies (window exports)
- Identify event listeners and subscriptions

### When Adding Features
- Follow existing IIFE module pattern
- Export to window object
- Add Vietnamese comments for complex logic
- Use existing UI components where possible

### Testing Changes
1. Start dev server: `npm start`
2. Open browser console
3. Run `window.loadRealTestData()`
4. Test in both Admin and User systems
5. Check localStorage for data persistence

## Git Workflow

```bash
# Development branch pattern
git checkout -b feature/feature-name

# Commit message format (Vietnamese)
git commit -m "Add: Thêm tính năng mới"
git commit -m "Fix: Sửa lỗi ABC"
git commit -m "Update: Cập nhật XYZ"
```

## Dependencies (CDN-loaded)

All dependencies are loaded via CDN in HTML files:
- React 18.x
- ReactDOM 18.x
- Tailwind CSS 3.x
- Babel Standalone 7.x

No npm install required for dependencies.
