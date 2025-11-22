# 🧪 Testing Guide - Hệ Thống Đối Soát Lô Đề

## 📋 Tổng Quan

Hướng dẫn test toàn diện cho hệ thống đối soát lô đề với dữ liệu thực tế và scenarios đầy đủ.

## 🚀 Bắt Đầu Nhanh

### 1. Truy cập hệ thống
```bash
# Mở file deploy.html trong trình duyệt
# Hoặc chạy local server
npm start
```

### 2. Load dữ liệu test
```javascript
// Trong console browser
window.loadRealTestData()
```

### 3. Kiểm tra trạng thái hệ thống
```javascript
window.checkSystemStatus()
```

## 👥 Test Accounts

### Admin System
| Username | Password | Role | Status |
|----------|----------|------|--------|
| admin | admin123 | Admin | Active |

### User System
| Username | Password | Package | Status |
|----------|----------|---------|--------|
| agent_nguyen | agent123 | 30 Days Premium | Active |
| agent_tran | agent456 | 90 Days VIP | Active |
| agent_pham | agent789 | Pending | Pending |
| demo_user | demo123 | 7 Days Basic | Active |

## 🧪 Test Scenarios

### A. Admin System Testing

#### 1. User Management
```javascript
// Test tạo user mới
window.TEST_HELPERS.createTestUser('new_agent', 'pass123', 'package_30_days')

// Test login
window.TEST_HELPERS.testLogin('admin', 'admin123')
```

**Test Cases:**
- ✅ Tạo user mới với package
- ✅ Chỉnh sửa thông tin user
- ✅ Kích hoạt/deactivate user
- ✅ Xem danh sách users
- ✅ Filter và search users

#### 2. Package Management
```javascript
// Kiểm tra packages
const packages = window.GlobalStateManager.getData('packages')
console.table(packages)
```

**Test Cases:**
- ✅ Tạo package mới
- ✅ Chỉnh sửa package
- ✅ Set popular badge
- ✅ Activate/deactivate package
- ✅ Xem danh sách packages

#### 3. Payment Processing
```javascript
// Kiểm tra payments
const payments = window.GlobalStateManager.getData('payments')
console.table(payments)
```

**Test Cases:**
- ✅ Xem danh sách payments
- ✅ Approve payment
- ✅ Reject payment
- ✅ Filter payments theo status
- ✅ Xem chi tiết payment

#### 4. System Monitoring
```javascript
// Kiểm tra notifications
const notifications = window.GlobalStateManager.getData('notifications')
console.table(notifications)
```

**Test Cases:**
- ✅ Xem notifications
- ✅ Mark as read
- ✅ Filter notifications
- ✅ Clear old notifications

### B. User System Testing

#### 1. Authentication
```javascript
// Test login với các account khác nhau
window.TEST_HELPERS.testLogin('agent_nguyen', 'agent123')
window.TEST_HELPERS.testLogin('agent_pham', 'agent789') // Pending user
```

**Test Cases:**
- ✅ Login với active user
- ✅ Login với pending user (should fail)
- ✅ Login với expired package
- ✅ Logout functionality

#### 2. Bet Reconciliation
```javascript
// Lấy sample bet data
const sampleBets = window.TEST_HELPERS.getSampleBetText()
console.log(sampleBets)

// Simulate bet processing
window.TEST_HELPERS.simulateBetProcessing('L 23 50k\nD 88 100k')
```

**Test Cases:**
- ✅ Parse Lô bets
- ✅ Parse Đề bets  
- ✅ Parse Xiên bets
- ✅ Parse Ba Càng bets
- ✅ Mixed format bets
- ✅ Invalid bet format handling

#### 3. Lottery Results Integration
```javascript
// Generate lottery results
const results = window.TEST_HELPERS.generateLotteryResults()
console.log(results)

// Load real lottery data
localStorage.setItem('lotteryResults', JSON.stringify(window.TEST_DATA.sampleLotteryResults))
```

**Test Cases:**
- ✅ Fetch RSS data
- ✅ Parse lottery results
- ✅ Match bets với results
- ✅ Calculate win/lose amounts
- ✅ Handle missing results

#### 4. Mobile Optimization
```javascript
// Test mobile features
// Mở DevTools > Toggle device toolbar
// Test trên các kích thước màn hình khác nhau
```

**Test Cases:**
- ✅ Responsive design
- ✅ Touch-friendly buttons
- ✅ Swipe gestures
- ✅ Mobile navigation
- ✅ Keyboard input handling

### C. Integration Testing

#### 1. Data Synchronization
```javascript
// Test data sync giữa Admin và User
window.TEST_HELPERS.loadAdminTestData()
window.TEST_HELPERS.loadUserTestData()

// Kiểm tra sync
const adminUsers = window.GlobalStateManager.getData('users')
const userUsers = JSON.parse(localStorage.getItem('registeredUsers'))
console.log('Admin users:', adminUsers.length)
console.log('User users:', userUsers.length)
```

**Test Cases:**
- ✅ User data sync
- ✅ Package data sync
- ✅ Payment data sync
- ✅ Real-time updates

#### 2. Package Access Control
```javascript
// Test package restrictions
const user = window.TEST_DATA.users.find(u => u.username === 'agent_nguyen')
console.log('User package:', user.subscriptionPackage)
console.log('Expiry:', user.subscriptionExpiry)
```

**Test Cases:**
- ✅ Active package access
- ✅ Expired package restrictions
- ✅ No package restrictions
- ✅ Package upgrade/downgrade

## 🔧 Debug Commands

### System Status
```javascript
// Kiểm tra trạng thái hệ thống
window.checkSystemStatus()

// Chạy full test suite
window.TEST_HELPERS.runFullTestSuite()
```

### Data Management
```javascript
// Load real test data
window.loadRealTestData()

// Create sample users
window.createSampleUsers()

// Clear all data
window.clearAllData()
```

### Bet Processing
```javascript
// Simulate bet processing
window.TEST_HELPERS.simulateBetProcessing('L 23 50k\nD 88 100k\nLx 12 34 200k\nBC 123 75k')

// Generate lottery results
window.TEST_HELPERS.generateLotteryResults('2024-12-18')
```

## 📊 Performance Testing

### Load Testing
```javascript
// Test với nhiều bets
const largeBetText = Array.from({length: 100}, (_, i) => 
    `L ${String(i).padStart(2, '0')} ${Math.floor(Math.random() * 100000) + 10000}k`
).join('\n')

// Process large bet data
window.TEST_HELPERS.simulateBetProcessing(largeBetText)
```

### Memory Testing
```javascript
// Monitor memory usage
const startMemory = performance.memory?.usedJSHeapSize || 0
// ... run operations ...
const endMemory = performance.memory?.usedJSHeapSize || 0
console.log('Memory used:', endMemory - startMemory, 'bytes')
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Admin System không load
```javascript
// Kiểm tra GlobalStateManager
console.log('GlobalStateManager:', !!window.GlobalStateManager)

// Reload test data
window.TEST_HELPERS.loadAdminTestData()
```

#### 2. User System không sync data
```javascript
// Kiểm tra localStorage
console.log('Registered users:', localStorage.getItem('registeredUsers'))

// Reload user data
window.TEST_HELPERS.loadUserTestData()
```

#### 3. Bet processing errors
```javascript
// Kiểm tra bet parser
const sampleBets = window.TEST_HELPERS.getSampleBetText()
console.log('Sample bets:', sampleBets)

// Test individual bet parsing
// (Check bet-parser.js for specific parsing logic)
```

#### 4. Mobile issues
```javascript
// Kiểm tra mobile optimization
console.log('Viewport:', window.innerWidth, 'x', window.innerHeight)

// Test touch events
document.addEventListener('touchstart', (e) => {
    console.log('Touch event:', e.touches.length)
})
```

### Debug Tools

#### 1. Console Commands
```javascript
// Admin debug
window.DEBUG_ADMIN_SYSTEM?.checkUsers()
window.DEBUG_ADMIN_SYSTEM?.createTestUser('debug_user', 'debug123')

// User debug
window.TEST_HELPERS.checkSystemStatus()
window.TEST_HELPERS.runFullTestSuite()
```

#### 2. Network Monitoring
```javascript
// Monitor API calls
const originalFetch = window.fetch
window.fetch = function(...args) {
    console.log('API Call:', args[0])
    return originalFetch.apply(this, args)
}
```

#### 3. Error Tracking
```javascript
// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error)
})

// Unhandled promise rejection
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason)
})
```

## 📈 Success Criteria

### Admin System
- ✅ Tạo và quản lý users thành công
- ✅ Cấu hình packages hoạt động
- ✅ Xử lý payments đúng quy trình
- ✅ Notifications hiển thị đúng
- ✅ Data sync với User system

### User System
- ✅ Login/logout hoạt động
- ✅ Bet parsing chính xác
- ✅ Lottery results integration
- ✅ Mobile responsive design
- ✅ Package access control

### Integration
- ✅ Data sync real-time
- ✅ Error handling robust
- ✅ Performance acceptable
- ✅ Security measures active

## 🎯 Test Checklist

### Pre-Test Setup
- [ ] Mở deploy.html
- [ ] Load real test data
- [ ] Kiểm tra system status
- [ ] Verify test accounts

### Admin Testing
- [ ] User management
- [ ] Package management  
- [ ] Payment processing
- [ ] System monitoring
- [ ] Data export/import

### User Testing
- [ ] Authentication
- [ ] Bet reconciliation
- [ ] Lottery integration
- [ ] Mobile optimization
- [ ] Package restrictions

### Integration Testing
- [ ] Data synchronization
- [ ] Real-time updates
- [ ] Error handling
- [ ] Performance testing
- [ ] Security validation

### Post-Test Cleanup
- [ ] Clear test data
- [ ] Reset system state
- [ ] Document findings
- [ ] Report issues

## 📝 Test Report Template

```markdown
# Test Report - [Date]

## Test Environment
- Browser: [Chrome/Firefox/Safari]
- Device: [Desktop/Mobile]
- Data: [Real/Simulated]

## Test Results

### Admin System
- User Management: ✅/❌
- Package Management: ✅/❌
- Payment Processing: ✅/❌
- System Monitoring: ✅/❌

### User System
- Authentication: ✅/❌
- Bet Reconciliation: ✅/❌
- Lottery Integration: ✅/❌
- Mobile Optimization: ✅/❌

### Integration
- Data Sync: ✅/❌
- Performance: ✅/❌
- Security: ✅/❌

## Issues Found
1. [Issue description]
2. [Issue description]

## Recommendations
1. [Recommendation]
2. [Recommendation]
```

---

**Lưu ý:** Đây là hướng dẫn test toàn diện. Hãy chạy từng test case một cách có hệ thống và ghi lại kết quả chi tiết.
