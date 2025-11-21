# 🔄 Data Persistence Guide - Giải quyết vấn đề mất dữ liệu khi F5

## 🚨 **Vấn đề: Dữ liệu biến mất khi F5**

### **Nguyên nhân:**
1. **JavaScript Memory Reset** - Khi refresh, toàn bộ JavaScript memory bị clear
2. **GlobalStateManager Reset** - State management bị mất
3. **Test Data chưa auto-load** - Cần load lại test data thủ công

### **Giải pháp đã áp dụng:**

## ✅ **1. Auto-Load Test Data**
```javascript
// Tự động load test data khi component mount
const autoLoadTestData = () => {
    const existingTestData = localStorage.getItem('admin_testData_loaded');
    if (!existingTestData) {
        window.loadAdminTestData();
        localStorage.setItem('admin_testData_loaded', 'true');
    }
};
```

## ✅ **2. Reset & Reload Function**
```javascript
// Function để reset và reload toàn bộ test data
window.resetAndReloadTestData = () => {
    // Clear existing data
    localStorage.removeItem('admin_testData_loaded');
    localStorage.removeItem('user_testData_loaded');
    
    // Reload test data
    window.loadAdminTestData();
    window.loadUserTestData();
};
```

## ✅ **3. Button Reset & Reload**
- Thêm button "Reset & Reload Data" trong deploy.html
- Click để reset và load lại toàn bộ dữ liệu

## 🚀 **Cách sử dụng:**

### **Tự động (Mặc định):**
- Khi refresh trang, test data sẽ tự động load lại
- Không cần làm gì thêm

### **Thủ công (Khi cần):**
1. Vào `http://localhost:8000/deploy.html`
2. Click "Reset & Reload Data"
3. Hoặc click "Load Real Data"

### **Debug (Khi có vấn đề):**
1. Mở Developer Tools (F12)
2. Vào Console
3. Gõ: `resetAndReloadTestData()`
4. Enter để chạy

## 📊 **Kiểm tra dữ liệu:**

### **Trong Console:**
```javascript
// Kiểm tra Admin data
localStorage.getItem('admin_users')
localStorage.getItem('admin_packages')

// Kiểm tra User data  
localStorage.getItem('users')
localStorage.getItem('packages')

// Kiểm tra Payment config
localStorage.getItem('paymentConfig')
```

### **Trong Application:**
- Admin Panel: Vào User Management, Package Management
- User System: Vào Pricing Page, Login với test accounts

## 🔧 **Troubleshooting:**

### **Nếu dữ liệu vẫn mất:**
1. Clear browser cache (Ctrl + Shift + Delete)
2. Hard refresh (Ctrl + F5)
3. Click "Reset & Reload Data"
4. Restart server nếu cần

### **Nếu auto-load không hoạt động:**
1. Kiểm tra Console có lỗi không
2. Kiểm tra `test-data.js` đã load chưa
3. Thử load thủ công qua deploy.html

---
**Status:** ✅ Đã giải quyết | **Version:** 1.1.0
