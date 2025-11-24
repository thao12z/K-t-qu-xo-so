(function() {
    'use strict';
    
    const { useState, useCallback, memo } = React;
    
    console.log(' Formula Page v1.0.0 loaded');
    
    // ===== FORMULA PAGE CONTENT THEO RULES =====
    const FORMULA_PAGE_CONTENT = {
        // 4 loại cược được hỗ trợ
        supported_bets: {
            lo: {
                keywords: ["L", "l", "lo", "Lo", "LO", "Lô", "LÔ"],
                syntax: "keywords [1 số] [tiền]",
                examples: ["L 23 46k (2 điểm)", "lo 45 23k (1 điểm)", "LO 01 69k (3 điểm)"],
                calculation: "1 điểm = 23k (có thể điều chỉnh), thắng = số điểm × 80k. CHỈ ĐƯỢC ĐÁNH 1 SỐ DUY NHẤT!",
                note: "Có thể bật validation strict để bắt buộc chia hết cho 1 điểm"
            },
            
            de: {
                keywords: ["D", "Đ", "Đe", "Đê", "Đề", "d", "đ", "đe", "đê", "đề", "de", "De", "DE"],
                syntax: "keywords [số] [tiền]", 
                examples: ["D 88 200k", "đề 99 150k", "DE 12 100k"],
                calculation: "Thắng = tiền cược × hệ số (mặc định 70)"
            },
            
            xien: {
                keywords: ["Lx", "LX", "lx", "lX", "xien", "xiên", "x2", "x3", "x4"],
                syntax: "keywords [số1] [số2] [số3] [số4] [tiền] HOẶC keywords [số1,số2,số3] [tiền]",
                examples: [
                    "Lx 12 34 100k (format cũ)", 
                    "xien 12,34,56 50k (format mới)", 
                    "xiên 12,34 25k (format Việt)",
                    "x3 01,23,45 100k (shorthand)"
                ],
                calculation: "Thắng = tiền cược × hệ số (2 số: ×10, 3 số: ×40, 4 số: ×100)"
            },
            
            bacang: {
                keywords: ["BC", "Bc", "bC", "bc", "ba_cang", "bacang", "ba_càng", "ba càng"],
                syntax: "keywords [1 số 3 chữ số] [tiền]",
                examples: ["BC 123 75k", "bc 456 100k", "ba_cang 789 50k", "ba càng 012 25k"], 
                calculation: "Thắng = tiền cược × hệ số (mặc định 400). SỐ PHẢI CÓ 3 CHỮ SỐ!"
            }
        },
        
        // Đơn vị tiền
        money_units: {
            "k|K": "× 1,000 (50k = 50,000đ)",
            "m|M": "× 1,000,000 (2m = 2,000,000đ)",
            "số": "Giá trị gốc (50000 = 50,000đ)"
        },
        
        // Logic đối chiếu
        matching_logic: {
            lo: "2 số cuối cược so với 2 số cuối TẤT CẢ giải XSMB",
            de: "2 số cuối cược so với 2 số cuối GIẢI ĐẶC BIỆT",
            xien: "TẤT CẢ số xiên phải xuất hiện trong kết quả XSMB",
            bacang: "3 số cuối cược so với 3 số cuối BẤT KỲ giải nào"
        },
        
        // Hệ số mặc định (có thể thay đổi)
        default_rates: {
            lo: "1 điểm 23k thắng 80k, thua mất 100%",
            de: "1 ăn 70, thua mất 100%", 
            xien2: "1 ăn 10, thua mất 100%",
            xien3: "1 ăn 40, thua mất 100%",
            xien4: "1 ăn 100, thua mất 100%",
            bacang: "1 ăn 400, thua mất 100%"
        }
    };

    // Formula Page Component
    const FormulaPage = memo(({ onNavigate }) => {
        const [activeTab, setActiveTab] = useState('lo');

        // Kiểm tra package status
        const currentUser = window.AuthService?.getCurrentUser();
        const isPackageActive = currentUser?.package_status === 'active';

        const handleBackToMain = useCallback(() => {
            onNavigate('main');
        }, [onNavigate]);

        const handleGoToPricing = useCallback(() => {
            onNavigate('pricing');
        }, [onNavigate]);

        // Hiển thị thông báo yêu cầu mua dịch vụ nếu package hết hạn
        if (!isPackageActive) {
            return React.createElement('div', { className: 'min-h-screen bg-[#F8F7F7] flex items-center justify-center p-8' },
                React.createElement('div', { className: 'bg-white rounded-lg shadow-lg p-8 max-w-2xl text-center' },
                    React.createElement('div', { className: 'text-6xl mb-4' }, ''),
                    React.createElement('h2', { className: 'text-2xl font-bold text-[#121212] mb-4' }, 'Tính Năng Bị Khóa'),
                    React.createElement('p', { className: 'text-[#7B7B7B] mb-6' }, 
                        'Trang Công Thức chỉ dành cho tài khoản có gói dịch vụ đang hoạt động. Vui lòng gia hạn để sử dụng tính năng này.'
                    ),
                    React.createElement('div', { className: 'space-y-3' },
                        React.createElement('button', {
                            onClick: handleGoToPricing,
                            className: 'w-full py-3 px-6 bg-[#E36323] text-white rounded-lg hover:bg-[#DF5A18] font-medium'
                        }, ' Gia Hạn Ngay'),
                        React.createElement('button', {
                            onClick: () => onNavigate('main'),
                            className: 'w-full py-2 px-6 text-[#7B7B7B] hover:text-[#121212] font-medium'
                        }, '← Quay Lại')
                    )
                )
            );
        }

        const renderBetTypeSection = (betType, data) => {
            return React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6' },
                // Header
                React.createElement('div', { className: 'flex items-center gap-3 mb-6' },
                    React.createElement('div', { className: 'text-3xl' }, 
                        betType === 'lo' ? '' : betType === 'de' ? '' : betType === 'xien' ? '' : ''
                    ),
                    React.createElement('h3', { className: 'text-2xl font-bold text-[#121212]' },
                        betType === 'lo' ? 'LÔ' : betType === 'de' ? 'ĐỀ' : betType === 'xien' ? 'XIÊN' : 'BA CÀNG'
                    )
                ),

                // Keywords
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('h4', { className: 'font-semibold text-[#7B7B7B] mb-2' }, 'Từ khóa hỗ trợ:'),
                    React.createElement('div', { className: 'flex flex-wrap gap-2' },
                        data.keywords.map((keyword, index) =>
                            React.createElement('span', {
                                key: index,
                                className: 'px-3 py-1 bg-[#FFEDD5] text-[#E36323] rounded-full text-sm font-mono'
                            }, keyword)
                        )
                    )
                ),

                // Syntax
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('h4', { className: 'font-semibold text-[#7B7B7B] mb-2' }, 'Cú pháp:'),
                    React.createElement('div', { className: 'bg-[#F8F7F7] p-3 rounded font-mono text-sm' },
                        data.syntax
                    )
                ),

                // Examples
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('h4', { className: 'font-semibold text-[#7B7B7B] mb-2' }, 'Ví dụ:'),
                    React.createElement('div', { className: 'space-y-2' },
                        data.examples.map((example, index) =>
                            React.createElement('div', {
                                key: index,
                                className: 'bg-green-50 border border-green-200 p-3 rounded font-mono text-sm'
                            }, example)
                        )
                    )
                ),

                // Calculation
                React.createElement('div', { className: 'mb-6' },
                    React.createElement('h4', { className: 'font-semibold text-[#7B7B7B] mb-2' }, 'Cách tính:'),
                    React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 p-3 rounded text-sm' },
                        data.calculation
                    )
                ),

                // Matching Logic
                React.createElement('div', {},
                    React.createElement('h4', { className: 'font-semibold text-[#7B7B7B] mb-2' }, 'Logic đối chiếu:'),
                    React.createElement('div', { className: 'bg-[#FFF7ED] border border-[#FFEDD5] p-3 rounded text-sm' },
                        FORMULA_PAGE_CONTENT.matching_logic[betType]
                    )
                )
            );
        };

        return React.createElement('div', { className: 'min-h-screen bg-[#F8F7F7]' },
            // Header
            React.createElement('header', { className: 'bg-white shadow-sm' },
                React.createElement('div', { className: 'max-w-7xl mx-auto px-4 py-4' },
                    React.createElement('div', { className: 'flex items-center justify-between' },
                        React.createElement('div', { className: 'flex items-center gap-3' },
                            React.createElement('button', {
                                className: 'text-[#E36323] hover:text-[#E36323]',
                                onClick: handleBackToMain
                            }, '← Quay lại'),
                            React.createElement('div', { className: 'flex items-center gap-2' },
                                React.createElement('div', { className: 'text-2xl' }, ''),
                                React.createElement('h1', { className: 'text-xl font-bold text-[#121212]' }, 'Hướng Dẫn Sử Dụng')
                            )
                        ),
                        React.createElement('button', {
                            className: 'px-4 py-2 bg-[#E36323] text-white rounded-lg hover:bg-[#DF5A18] font-medium',
                            onClick: handleGoToPricing
                        }, 'Xem Gói Dịch Vụ')
                    )
                )
            ),

            // Main Content
            React.createElement('main', { className: 'max-w-7xl mx-auto px-4 py-8' },
                // Introduction
                React.createElement('div', { className: 'text-center mb-12' },
                    React.createElement('h1', { className: 'text-4xl font-bold text-[#121212] mb-4' },
                        'Hướng Dẫn Công Thức Cược'
                    ),
                    React.createElement('p', { className: 'text-xl text-[#7B7B7B] max-w-3xl mx-auto' },
                        'Hệ thống hỗ trợ 4 loại cược chính: Lô, Đề, Xiên, Ba Càng. Mỗi loại có cú pháp và cách tính riêng.'
                    )
                ),

                // Tab Navigation
                React.createElement('div', { className: 'flex justify-center mb-8' },
                    React.createElement('div', { className: 'bg-white rounded-lg shadow-sm p-1 flex' },
                        ['lo', 'de', 'xien', 'bacang'].map(type => {
                            const labels = { lo: 'LÔ', de: 'ĐỀ', xien: 'XIÊN', bacang: 'BA CÀNG' };
                            return React.createElement('button', {
                                key: type,
                                className: `px-6 py-3 rounded-md font-semibold transition-all ${
                                    activeTab === type 
                                        ? 'bg-[#E36323] text-white shadow-md' 
                                        : 'text-[#7B7B7B] hover:text-[#E36323]'
                                }`,
                                onClick: () => setActiveTab(type)
                            }, labels[type]);
                        })
                    )
                ),

                // Active Tab Content
                React.createElement('div', { className: 'mb-12' },
                    renderBetTypeSection(activeTab, FORMULA_PAGE_CONTENT.supported_bets[activeTab])
                ),

                // Money Units Section
                React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-8' },
                    React.createElement('h3', { className: 'text-2xl font-bold text-[#121212] mb-6 flex items-center gap-3' },
                        React.createElement('span', { className: 'text-3xl' }, ''),
                        'Đơn Vị Tiền'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                        Object.entries(FORMULA_PAGE_CONTENT.money_units).map(([unit, desc], index) =>
                            React.createElement('div', {
                                key: index,
                                className: 'bg-green-50 border border-green-200 p-4 rounded-lg'
                            },
                                React.createElement('div', { className: 'font-mono font-bold text-green-800 mb-2' }, unit),
                                React.createElement('div', { className: 'text-sm text-green-700' }, desc)
                            )
                        )
                    )
                ),

                // Default Rates Section
                React.createElement('div', { className: 'bg-white rounded-lg shadow-md p-6 mb-8' },
                    React.createElement('h3', { className: 'text-2xl font-bold text-[#121212] mb-6 flex items-center gap-3' },
                        React.createElement('span', { className: 'text-3xl' }, ''),
                        'Hệ Số Mặc Định'
                    ),
                    React.createElement('div', { className: 'text-sm text-[#7B7B7B] mb-4' },
                        'Các hệ số này có thể được điều chỉnh trong phần Tham Số Hệ Thống khi sử dụng.'
                    ),
                    React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' },
                        Object.entries(FORMULA_PAGE_CONTENT.default_rates).map(([type, rate], index) =>
                            React.createElement('div', {
                                key: index,
                                className: 'bg-yellow-50 border border-yellow-200 p-4 rounded-lg'
                            },
                                React.createElement('div', { className: 'font-semibold text-yellow-800 mb-2' }, 
                                    type.toUpperCase()
                                ),
                                React.createElement('div', { className: 'text-sm text-yellow-700' }, rate)
                            )
                        )
                    )
                ),

                // Important Notes
                React.createElement('div', { className: 'bg-red-50 border border-red-200 rounded-lg p-6' },
                    React.createElement('h3', { className: 'text-xl font-bold text-red-800 mb-4 flex items-center gap-2' },
                        React.createElement('span', { className: 'text-2xl' }, ''),
                        'Lưu Ý Quan Trọng'
                    ),
                    React.createElement('ul', { className: 'space-y-2 text-red-700' },
                        React.createElement('li', {}, '• Hệ thống chỉ hỗ trợ 4 loại cược trên, không hỗ trợ tài/xỉu, chẵn/lẻ'),
                        React.createElement('li', {}, '• Kết quả XSMB cập nhật lúc 18h15 hàng ngày'),
                        React.createElement('li', {}, '• Hiện tại chỉ hỗ trợ miền Bắc, miền Trung/Nam sắp có'),
                        React.createElement('li', {}, '• Tất cả tham số có thể điều chỉnh theo nhu cầu kinh doanh'),
                        React.createElement('li', {}, '• Liên hệ Admin để được hỗ trợ kỹ thuật')
                    )
                )
            )
        );
    });

    // Export to window
    window.FormulaPage = FormulaPage;
    
    console.log(' Formula Page component loaded successfully');

})(); 