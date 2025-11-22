@echo off
echo ========================================
echo    Hệ Thống Đối Soát Lô Đề
echo ========================================
echo.
echo 🚀 Đang khởi động server...
echo.

REM Kiểm tra Python
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Python không được cài đặt hoặc không có trong PATH
    echo Vui lòng cài đặt Python từ https://python.org
    pause
    exit /b 1
)

REM Kiểm tra Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js không được cài đặt
    echo Vui lòng cài đặt Node.js từ https://nodejs.org
    pause
    exit /b 1
)

echo ✅ Python và Node.js đã được cài đặt
echo.

REM Cài đặt dependencies nếu cần
if not exist "node_modules" (
    echo 📦 Đang cài đặt dependencies...
    npm install
)

echo 🌐 Khởi động server trên port 8000...
echo.
echo 📱 Truy cập hệ thống tại:
echo    http://localhost:8000/deploy.html
echo.
echo 💡 Hướng dẫn sử dụng:
echo    1. Mở trình duyệt và truy cập link trên
echo    2. Click "Load Real Data" để load dữ liệu test
echo    3. Click "Access Admin Panel" hoặc "Access User System"
echo    4. Sử dụng test accounts để login
echo.
echo 🔧 Test Accounts:
echo    Admin: admin / admin123
echo    User: agent_nguyen / agent123
echo.
echo ⚠️  Nhấn Ctrl+C để dừng server
echo.

REM Khởi động server
python -m http.server 8000

pause
