# 🚀 Deploy Guide - Hệ Thống Đối Soát Lô Đề

## ✅ Hệ thống đã được deploy thành công!

### 🌐 Truy cập hệ thống:
**URL:** http://localhost:8000/deploy.html

### 📋 Hướng dẫn sử dụng:

#### Bước 1: Mở trình duyệt
- Mở Chrome, Firefox, hoặc Edge
- Truy cập: `http://localhost:8000/deploy.html`

#### Bước 2: Load dữ liệu test
- Click nút **"Load Real Data"** để load dữ liệu test thực tế
- Hoặc mở Console (F12) và chạy: `window.loadRealTestData()`

#### Bước 3: Truy cập hệ thống
- **Admin System**: Click **"Access Admin Panel"**
- **User System**: Click **"Access User System"**

#### Bước 4: Test với accounts
```
🔧 Test Accounts:

Admin System:
- Username: admin
- Password: admin123

User System:
- Username: agent_nguyen
- Password: agent123
- Package: 30 Days Premium

- Username: agent_tran  
- Password: agent456
- Package: 90 Days VIP

- Username: demo_user
- Password: demo123
- Package: 7 Days Basic
```

## 🧪 Test Scenarios

### Admin System Testing:
1. **Login** với admin/admin123
2. **User Management**: Tạo, chỉnh sửa, kích hoạt users
3. **Package Management**: Cấu hình packages
4. **Payment Processing**: Xử lý thanh toán
5. **System Monitoring**: Xem notifications

### User System Testing:
1. **Login** với các test accounts
2. **Bet Reconciliation**: Test 4 loại cược (Lô, Đề, Xiên, Ba Càng)
3. **Lottery Integration**: Kết nối RSS xổ số
4. **Mobile Optimization**: Test responsive design

## 🔧 Console Commands

Mở Console (F12) và chạy các lệnh sau:

```javascript
// Load dữ liệu test
window.loadRealTestData()

// Kiểm tra trạng thái hệ thống
window.checkSystemStatus()

// Tạo thêm test users
window.createSampleUsers()

// Chạy full test suite
window.TEST_HELPERS.runFullTestSuite()

// Clear tất cả data
window.clearAllData()
```

## 📊 Test Data Available

- **5 Test Users**: Với các trạng thái khác nhau
- **4 Package Types**: Từ basic đến lifetime
- **40+ Bet Samples**: Dữ liệu cược thực tế
- **Real Lottery Results**: Từ xosodaiphat.com
- **Payment History**: Lịch sử thanh toán đầy đủ

## 🎯 Quick Test Checklist

### Admin System:
- [ ] Login thành công
- [ ] Xem danh sách users
- [ ] Tạo user mới
- [ ] Cấu hình package
- [ ] Xử lý payment
- [ ] Xem notifications

### User System:
- [ ] Login với active user
- [ ] Login với pending user (should fail)
- [ ] Test bet reconciliation
- [ ] Test lottery integration
- [ ] Test mobile responsive

### Integration:
- [ ] Data sync giữa Admin và User
- [ ] Real-time updates
- [ ] Error handling
- [ ] Performance testing

## 🐛 Troubleshooting

### Nếu server không chạy:
```bash
# Khởi động lại server
python -m http.server 8000

# Hoặc sử dụng Node.js
npx http-server -p 8000
```

### Nếu không load được data:
```javascript
// Reload test data
window.loadRealTestData()

// Kiểm tra status
window.checkSystemStatus()
```

### Nếu có lỗi:
```javascript
// Clear cache và reload
window.clearAllData()
location.reload()
```

## 📱 Mobile Testing

1. Mở DevTools (F12)
2. Click "Toggle device toolbar"
3. Chọn device (iPhone, Android, etc.)
4. Test responsive design và touch interactions

## 🎉 Success!

Hệ thống đã được deploy thành công và sẵn sàng cho testing!

**URL:** http://localhost:8000/deploy.html

**Server Status:** ✅ Running on port 8000

**Test Data:** ✅ Loaded and ready

---

**Lưu ý:** Để dừng server, nhấn `Ctrl+C` trong terminal.
