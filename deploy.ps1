# Hệ Thống Đối Soát Lô Đề - Deploy Script
# PowerShell Script để khởi động server

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Hệ Thống Đối Soát Lô Đề" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "🚀 Đang khởi động server..." -ForegroundColor Green
Write-Host ""

# Kiểm tra Python
try {
    $pythonVersion = python --version 2>&1
    Write-Host "✅ Python: $pythonVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Python không được cài đặt" -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Python từ https://python.org" -ForegroundColor Yellow
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

# Kiểm tra Node.js
try {
    $nodeVersion = node --version 2>&1
    Write-Host "✅ Node.js: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js không được cài đặt" -ForegroundColor Red
    Write-Host "Vui lòng cài đặt Node.js từ https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Nhấn Enter để thoát"
    exit 1
}

Write-Host ""
Write-Host "✅ Tất cả dependencies đã sẵn sàng" -ForegroundColor Green
Write-Host ""

# Cài đặt dependencies nếu cần
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Đang cài đặt dependencies..." -ForegroundColor Yellow
    npm install
}

Write-Host "🌐 Khởi động server trên port 8000..." -ForegroundColor Cyan
Write-Host ""
Write-Host "📱 Truy cập hệ thống tại:" -ForegroundColor White
Write-Host "   http://localhost:8000/deploy.html" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Hướng dẫn sử dụng:" -ForegroundColor White
Write-Host "   1. Mở trình duyệt và truy cập link trên" -ForegroundColor Gray
Write-Host "   2. Click 'Load Real Data' để load dữ liệu test" -ForegroundColor Gray
Write-Host "   3. Click 'Access Admin Panel' hoặc 'Access User System'" -ForegroundColor Gray
Write-Host "   4. Sử dụng test accounts để login" -ForegroundColor Gray
Write-Host ""
Write-Host "🔧 Test Accounts:" -ForegroundColor White
Write-Host "   Admin: admin / admin123" -ForegroundColor Gray
Write-Host "   User: agent_nguyen / agent123" -ForegroundColor Gray
Write-Host ""
Write-Host "⚠️  Nhấn Ctrl+C để dừng server" -ForegroundColor Yellow
Write-Host ""

# Khởi động server
try {
    python -m http.server 8000
} catch {
    Write-Host "❌ Không thể khởi động server" -ForegroundColor Red
    Write-Host "Lỗi: $_" -ForegroundColor Red
    Read-Host "Nhấn Enter để thoát"
}
