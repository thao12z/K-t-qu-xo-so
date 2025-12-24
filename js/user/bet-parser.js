(function() {
    'use strict';
    
    const { useState, useEffect, useCallback, useMemo, useRef, memo } = React;
    
    console.log('Hệ Thống Đối Soát Lô Đề v8.1.0 - RULES COMPLIANT');
    
    // ===== STRICT BET TERMS - THEO RULES + ENHANCED FORMATS =====
    const BET_TERMS = {
        lô: ['L', 'l', 'lo', 'Lo', 'LO', 'Lô', 'LÔ'],
        đề: ['D', 'Đ', 'Đe', 'Đê', 'Đề', 'd', 'đ', 'đe', 'đê', 'đề', 'de', 'De', 'DE'],
        xiên: ['Lx', 'LX', 'lx', 'lX', 'xien', 'xien2', 'xien3', 'xien4', 'x2', 'x3', 'x4', 'xiên', 'xiên2', 'xiên3', 'xiên4'],
        'ba càng': ['BC', 'Bc', 'bC', 'bc', 'ba_cang', 'bacang', 'ba_càng', 'ba càng']
    };

    // ===== 16 THAM SỐ CHÍNH XÁC THEO RULES =====
    const DEFAULT_CONFIG = {
        // Cơ bản (2 fields)
        mien: 'bac',
        ngay: new Date().toISOString().split('T')[0],
        
        // Lô (3 fields) - Tính theo điểm
        tien1DiemLo: 23000,          // VD: 23k cho 1 điểm
        tienTra1DiemLo: 80000,       // VD: trả 80k cho 1 điểm thắng
        tyLeLoThu: 100,              // VD: thu 100% khi thua
        
        // Đề (2 fields) - Hệ số nhân
        heSoDeTra: 70,               // VD: 70 (1 ăn 70)
        tyLeDeThu: 100,              // VD: thu 100% khi thua
        
        // Xiên 2 (2 fields) - Hệ số nhân
        heSoXien2Tra: 10,            // VD: 10 (nhân 10 lần)
        tyLeXien2Thu: 100,           // VD: thu 100% khi thua
        
        // Xiên 3 (2 fields) - Hệ số nhân
        heSoXien3Tra: 40,            // VD: 40 (nhân 40 lần)
        tyLeXien3Thu: 100,           // VD: thu 100% khi thua
        
        // Xiên 4 (2 fields) - Hệ số nhân
        heSoXien4Tra: 100,           // VD: 100 (nhân 100 lần)
        tyLeXien4Thu: 100,           // VD: thu 100% khi thua
        
        // Ba càng (2 fields) - Hệ số nhân
        heSoBaCangTra: 400,          // VD: 400 (nhân 400 lần)
        tyLeBaCangThu: 100,          // VD: thu 100% khi thua
        
        // Tùy chọn (1 field)
        lamTronTien: false,          // Làm tròn hàng nghìn
        
        // VALIDATION OPTIONS
        strictLoValidation: false    // true = bắt buộc lô chia hết cho 1 điểm, false = flexible
    };

    // ===== CORE FUNCTIONS =====
    
    // 1. Parse và Validate - STRICT
    const parseAndValidateBets = (inputText, config) => {
        // Handle both newline-separated AND comma-separated bets
        let lines;
        if (inputText.includes(',') && !inputText.includes('\n')) {
            // Single line with comma-separated bets
            lines = inputText.trim().split(',').filter(line => line.trim());
            console.log('[BET PARSER] Detected comma-separated format, split into', lines.length, 'bets');
        } else {
            // Traditional newline-separated format
            lines = inputText.trim().split('\n').filter(line => line.trim());
            console.log('[BET PARSER] Detected newline-separated format, split into', lines.length, 'bets');
        }
        const results = [];
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const lineNumber = i + 1;
            
            try {
                const bet = parseSingleLine(line);
                if (bet.error) {
                    results.push({
                        lineNumber,
                        originalText: line,
                        status: 'error',
                        error: bet.error,
                        betType: null,
                        numbers: [],
                        money: 0
                    });
                } else {
                    results.push({
                        lineNumber,
                        originalText: line,
                        status: 'valid',
                        error: null,
                        betType: bet.type,
                        numbers: bet.numbers,
                        money: bet.money
                    });
                }
            } catch (error) {
                results.push({
                    lineNumber,
                    originalText: line,
                    status: 'error',
                    error: 'Cú pháp sai: ' + error.message,
                    betType: null,
                    numbers: [],
                    money: 0
                });
            }
        }
        
        return results;
    };

    const parseSingleLine = (line) => {
        const tokens = line.split(/\s+/).filter(t => t.trim());
        if (tokens.length < 3) {
            return { error: 'Cú pháp sai - thiếu thông tin (cần: loại số tiền)' };
        }

        // Detect bet type - STRICT theo rules
        const betTypeToken = tokens[0];
        let betType = null;
        
        for (const [type, aliases] of Object.entries(BET_TERMS)) {
            if (aliases.includes(betTypeToken)) {
                betType = type;
                break;
            }
        }
        
        if (!betType) {
            return { error: `Loại cược không được hỗ trợ: "${betTypeToken}". Chỉ hỗ trợ: L/D/Lx/BC` };
        }

        // Find money token (last token)
        const lastToken = tokens[tokens.length - 1];
        const money = parseMoney(lastToken);
        if (money <= 0) {
            return { error: `Tiền cược không hợp lệ: "${lastToken}"` };
        }

        // Extract numbers
        const numberTokens = tokens.slice(1, -1);
        if (numberTokens.length === 0) {
            return { error: 'Thiếu số cược' };
        }
        
        // Check for invalid characters in number tokens
        for (const token of numberTokens) {
            if (!/^[\d,\s]+$/.test(token)) {
                return { error: `Số cược chứa ký tự không hợp lệ: "${token}"` };
            }
        }
        
        const numbers = [];
        
        for (const token of numberTokens) {
            // Handle comma-separated numbers
            const nums = token.split(',').filter(n => n.trim());
            for (const numStr of nums) {
                if (!/^\d{1,3}$/.test(numStr.trim())) {
                    return { error: `Số không hợp lệ: "${numStr}"` };
                }
                
                const num = parseInt(numStr.trim());
                if (betType === 'ba càng') {
                    if (num > 999) return { error: 'Ba càng chỉ từ 0-999' };
                    numbers.push(numStr.trim().padStart(3, '0'));
                } else {
                    if (num > 99) return { error: 'Số lô/đề/xiên chỉ từ 0-99' }; 
                    numbers.push(numStr.trim().padStart(2, '0'));
                }
            }
        }

        // Validate specific bet rules theo RULES - ENHANCED VALIDATION
        if (betType === 'lô') {
            if (numbers.length !== 1) return { error: 'Lô chỉ được đánh 1 số duy nhất' };
            // Additional lô validation
            const loNum = parseInt(numbers[0]);
            if (loNum < 0 || loNum > 99) return { error: 'Số lô phải từ 00-99' };
            
            // LÔ VALIDATION: Kiểm tra tiền cược theo điểm (tùy chỉnh được)
            // Sử dụng config từ params hoặc default, có thể enable/disable strict validation
            const currentConfig = { ...DEFAULT_CONFIG, ...config };
            if (currentConfig.strictLoValidation) {
                const tien1DiemLo = currentConfig.tien1DiemLo;
                if (money % tien1DiemLo !== 0) {
                    const soDiem = Math.floor(money / tien1DiemLo);
                    const giaTriDung = soDiem * tien1DiemLo;
                    const giaTriDung2 = (soDiem + 1) * tien1DiemLo;
                    return { 
                        error: `Lô phải đánh theo điểm. 1 điểm = ${tien1DiemLo.toLocaleString()}đ. Gợi ý: ${giaTriDung.toLocaleString()}đ hoặc ${giaTriDung2.toLocaleString()}đ` 
                    };
                }
            }
        } else if (betType === 'đề') {
            if (numbers.length !== 1) return { error: 'Đề chỉ được 1 số duy nhất' };
            // Additional đề validation  
            const deNum = parseInt(numbers[0]);
            if (deNum < 0 || deNum > 99) return { error: 'Số đề phải từ 00-99' };
        } else if (betType === 'xiên') {
            if (numbers.length < 2 || numbers.length > 4) return { error: 'Xiên từ 2-4 số' };
            if (new Set(numbers).size !== numbers.length) return { error: 'Xiên không được trùng số' };
            // Additional xiên validation
            for (const num of numbers) {
                const xienNum = parseInt(num);
                if (xienNum < 0 || xienNum > 99) return { error: 'Số xiên phải từ 00-99' };
            }
        } else if (betType === 'ba càng') {
            if (numbers.length !== 1) return { error: 'Ba càng chỉ được 1 số' };
            // Additional ba càng validation
            const baCangNum = parseInt(numbers[0]);
            if (baCangNum < 0 || baCangNum > 999) return { error: 'Số ba càng phải từ 000-999' };
        }

        return {
            type: betType,
            numbers: numbers,
            money: money
        };
    };

    const parseMoney = (token) => {
        // Enhanced money parsing - handle more formats
        const cleanToken = token.replace(/[,\s]/g, ''); // Remove commas and spaces
        
        // Match various money formats with stricter validation
        const match = cleanToken.match(/^(\d+(?:\.\d+)?)([km]|đ|d|vnd|nghìn|triệu|tr)?$/i);
        if (!match) return 0;
        
        let amount = parseFloat(match[1]);
        const unit = match[2]?.toLowerCase();
        
        // Convert based on unit
        switch (unit) {
            case 'k':
            case 'nghìn':
                amount *= 1000;
                break;
            case 'm':
            case 'tr':
            case 'triệu':
                amount *= 1000000;
                break;
            case 'đ':
            case 'd':
            case 'vnd':
                // Already in đồng, no conversion needed
                break;
        }
        
        // Validate reasonable money amounts (stricter validation)
        if (amount < 1000) {
            return 0; // Too small, likely invalid (minimum 1k)
        }
        if (amount > 50000000) { // 50 million limit
            return 0; // Too large, likely invalid
        }
        
        return Math.round(amount);
    };

    // 2. Check Bet Results - LOGIC CHÍNH XÁC THEO RULES
    const checkBetResults = (bets, lotteryData, config) => {
        if (!lotteryData) {
            return bets.map(bet => ({
                ...bet,
                result: 'pending',
                winAmount: 0,
                loseAmount: 0,
                note: 'Chờ kết quả xổ số'
            }));
        }

        return bets.map(bet => {
            if (bet.status === 'error') {
                return {
                    ...bet,
                    result: 'error',
                    winAmount: 0,
                    loseAmount: 0,
                    note: bet.error
                };
            }

            const matchResult = checkSingleBet(bet, lotteryData);
            const isWin = matchResult.isWin;
            
            return {
                ...bet,
                result: isWin ? 'win' : 'lose',
                winAmount: isWin ? calculateWinAmount(bet, config) : 0,
                loseAmount: isWin ? 0 : calculateLoseAmount(bet, config),
                note: matchResult.note
            };
        });
    };

    const checkSingleBet = (bet, lotteryData) => {
        const { betType, numbers, type } = bet;
        const actualType = betType || type; // Support both field names
        
        console.log(`[checkSingleBet] Checking: ${actualType} ${numbers?.join(',')} vs lottery data`);
        console.log(`[checkSingleBet] Available numbers:`, lotteryData.allNumbers?.slice(0, 10));
        
        if (actualType === 'lô') {
            // Lô: Check 2 số cuối vs mảng lô đã tách sẵn
            for (const num of numbers) {
                if (lotteryData.loNumbersArray && lotteryData.loNumbersArray.includes(num)) {
                    console.log(`[checkSingleBet] Lô ${num} found in parsed lô numbers`);
                    return { 
                        isWin: true, 
                        note: `Lô ${num} trúng` 
                    };
                }
            }
            console.log(`[checkSingleBet] Lô ${numbers.join(',')} not found in parsed lô numbers:`, lotteryData.loNumbersArray?.slice(0, 10));
            return { isWin: false, note: `Lô ${numbers.join(',')} - không xuất hiện` };
            
        } else if (actualType === 'đề') {
            // Đề: Check vs specialLast2 đã tách sẵn
            const betNumber = numbers[0];
            const specialLast2 = lotteryData.specialLast2;
            
            console.log(`[checkSingleBet] ĐỀ DEBUG:
                - Bet number: "${betNumber}" (type: ${typeof betNumber})
                - Special prize: "${lotteryData.specialPrize}"
                - Special last 2 parsed: "${specialLast2}" (type: ${typeof specialLast2})
                - Direct comparison ready`);
                
            // FIXED: Ensure both are strings for comparison
            const isWin = String(specialLast2) === String(betNumber);
            console.log(`[checkSingleBet] Đề Comparison: "${specialLast2}" === "${betNumber}" -> ${isWin ? 'THẮNG' : 'THUA'}`);
            
            return { 
                isWin, 
                note: isWin ? 
                    `Đề ${betNumber} trúng (ĐB: ${lotteryData.specialPrize})` : 
                    `Đề ${betNumber} - ĐB về ${specialLast2 || 'N/A'}`
            };
            
        } else if (actualType === 'xiên') {
            // Xiên: TẤT CẢ số xiên phải có trong mảng xiên đã tách sẵn
            const missingNumbers = [];
            for (const num of numbers) {
                if (!lotteryData.xienNumbersArray || !lotteryData.xienNumbersArray.includes(num)) {
                    missingNumbers.push(num);
                }
            }
            
            const isWin = missingNumbers.length === 0;
            console.log(`[checkSingleBet] Xiên ${numbers.join(',')} -> ${isWin ? 'THẮNG' : 'THUA'} (missing: ${missingNumbers.join(',')})`);
            console.log(`[checkSingleBet] Available xiên numbers:`, lotteryData.xienNumbersArray?.slice(0, 15));
            return {
                isWin,
                note: isWin ? 
                    `Xiên ${numbers.length} [${numbers.join(',')}] - tất cả đều có` :
                    `Xiên ${numbers.length} [${numbers.join(',')}] - thiếu: ${missingNumbers.join(',')}`
            };
            
        } else if (actualType === 'ba càng') {
            // Ba càng: Check vs mảng ba càng đã tách sẵn (chỉ từ giải ĐB-6, không bao gồm giải 7)
            const betNumber = numbers[0];
            
            if (lotteryData.baCangNumbersArray && lotteryData.baCangNumbersArray.includes(betNumber)) {
                console.log(`[checkSingleBet] Ba càng ${betNumber} found in parsed ba càng numbers (G ĐB-6)`);
                return { 
                    isWin: true, 
                    note: `Ba càng ${betNumber} trúng (giải ĐB-6)` 
                };
            }
            
            console.log(`[checkSingleBet] Ba càng ${betNumber} not found in parsed ba càng numbers:`, lotteryData.baCangNumbersArray?.slice(0, 10));
            console.log(`[checkSingleBet] Note: Ba càng chỉ check giải ĐB-6, không bao gồm giải 7`);
            return { isWin: false, note: `Ba càng ${betNumber} - không có (chỉ check G ĐB-6)` };
        }
        
        console.log(`[checkSingleBet] Unknown bet type: ${actualType}`);
        return { isWin: false, note: `Unknown bet type: ${actualType}` };
    };

    const findPrizeFor = (number, lotteryData) => {
        if (lotteryData.prizes.special === number) return 'Giải ĐB';
        if (lotteryData.prizes.first.includes(number)) return 'Giải Nhất';
        if (lotteryData.prizes.second.includes(number)) return 'Giải Nhì';
        if (lotteryData.prizes.third.includes(number)) return 'Giải Ba';
        if (lotteryData.prizes.fourth.includes(number)) return 'Giải Tư';
        if (lotteryData.prizes.fifth.includes(number)) return 'Giải Năm';
        if (lotteryData.prizes.sixth.includes(number)) return 'Giải Sáu';
        if (lotteryData.prizes.seventh.includes(number)) return 'Giải Bảy';
        return 'Không xác định';
    };

    // 3. Calculate Money - THEO CÔNG THỨC RULES
    const calculateWinAmount = (bet, config) => {
        const { betType, money, numbers } = bet;
        let amount = 0;
        
        if (betType === 'lô') {
            // Lô - Theo điểm: (bet_amount / tien1DiemLo) × tienTra1DiemLo
            const diem = money / config.tien1DiemLo;
            amount = diem * config.tienTra1DiemLo;
        } else if (betType === 'đề') {
            // Đề - Hệ số nhân: bet_amount × heSoTra
            amount = money * config.heSoDeTra;
        } else if (betType === 'xiên') {
            const count = numbers.length;
            if (count === 2) amount = money * config.heSoXien2Tra;
            else if (count === 3) amount = money * config.heSoXien3Tra;
            else if (count === 4) amount = money * config.heSoXien4Tra;
        } else if (betType === 'ba càng') {
            amount = money * config.heSoBaCangTra;
        }
        
        return config.lamTronTien ? Math.round(amount / 1000) * 1000 : amount;
    };

    const calculateLoseAmount = (bet, config) => {
        const { betType, money, numbers } = bet;
        let rate = 0;
        
        if (betType === 'lô') rate = config.tyLeLoThu;
        else if (betType === 'đề') rate = config.tyLeDeThu;
        else if (betType === 'xiên') {
            const count = numbers.length;
            if (count === 2) rate = config.tyLeXien2Thu;
            else if (count === 3) rate = config.tyLeXien3Thu;
            else if (count === 4) rate = config.tyLeXien4Thu;
        } else if (betType === 'ba càng') rate = config.tyLeBaCangThu;
        
        const amount = money * (rate / 100);
        return config.lamTronTien ? Math.round(amount / 1000) * 1000 : amount;
    };

    // ===== RSS INTEGRATION =====
    const RSS_CONFIG = {
        url: 'https://xosodaiphat.com/ket-qua-xo-so-mien-bac-xsmb.rss',
        updateTime: '18:15',
        corsProxies: [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://thingproxy.freeboard.io/fetch/'
        ]
    };

    const isResultAvailable = (date, mien) => {
        if (mien !== 'bac') return false; // Chỉ hỗ trợ miền Bắc
        
        const now = new Date();
        const targetDate = new Date(date);
        
        // Case 1: Ngày quá khứ - luôn có kết quả
        if (targetDate < new Date(now.toDateString())) {
            console.log(`Ngày quá khứ ${date}: Có kết quả`);
            return true;
        }
        
        // Case 2: Ngày hiện tại - phải sau 18:15
        if (targetDate.toDateString() === now.toDateString()) {
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const isAfter6_15PM = currentHour > 18 || (currentHour === 18 && currentMinute >= 15);
            
            console.log(`Ngày hiện tại ${date}: ${isAfter6_15PM ? 'Có kết quả' : 'Chưa có kết quả'} (${currentHour}:${currentMinute.toString().padStart(2, '0')})`);
            return isAfter6_15PM;
        }
        
        // Case 3: Ngày tương lai - không có kết quả
        console.log(`Ngày tương lai ${date}: Không có kết quả`);
        return false;
    };

    const fetchLotteryResults = async (region, date) => {
        if (!isResultAvailable(date, region)) {
            throw new Error('Kết quả chưa có. XSMB cập nhật lúc 18h15 hàng ngày');
        }
        
        try {
            const url = RSS_CONFIG.url;
            const response = await fetch(`${RSS_CONFIG.corsProxies[0]}${encodeURIComponent(url)}`);
            const xmlText = await response.text();
            
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
            
            const items = xmlDoc.querySelectorAll('item');
            for (const item of items) {
                const title = item.querySelector('title')?.textContent || '';
                const description = item.querySelector('description')?.textContent || '';
                
                if (title.includes(date)) {
                    return parseLotteryNumbers(description, region, date);
                }
            }
            
            throw new Error('Không tìm thấy kết quả cho ngày ' + date);
        } catch (error) {
            console.error('RSS fetch failed:', error);
            throw new Error(`Không thể lấy dữ liệu xổ số thật cho ${region} ngày ${date}`);
        }
    };

    const parseLotteryNumbers = (description, region, date) => {
        // Simplified parser - extract numbers from RSS
        const numbers = [];
        let specialPrize = null;
        
        const numberMatches = description.match(/\d{2,5}/g) || [];
        
        if (numberMatches.length > 0) {
            specialPrize = numberMatches[0];
            numbers.push(...numberMatches);
        }
        
        return {
            date: date,
            region: region,
            specialPrize: specialPrize,
            allNumbers: numbers,
            prizes: {
                special: specialPrize,
                first: numberMatches.slice(1, 2),
                second: numberMatches.slice(2, 4), 
                third: numberMatches.slice(4, 10),
                fourth: numberMatches.slice(10, 14),
                fifth: numberMatches.slice(14, 20),
                sixth: numberMatches.slice(20, 23),
                seventh: numberMatches.slice(23, 27)
            }
        };
    };

    // NO MOCK DATA - Only real data allowed
    // createMockLotteryData function removed - Only real data allowed

    // ===== UI COMPONENTS =====

    // 16 Parameters Section - CHÍNH XÁC THEO RULES
    const ParametersSection = memo(({ config, onChange }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        
        const handleChange = (field, value) => {
            onChange({
                ...config,
                [field]: value
            });
        };

        const parameterGroups = [
            {
                title: 'Cấu hình cơ bản',
                fields: [
                    { name: 'mien', label: 'Miền', type: 'select', options: [
                        { value: 'bac', label: 'Miền Bắc' },
                        { value: 'trung', label: 'Miền Trung (Sắp có)', disabled: true },
                        { value: 'nam', label: 'Miền Nam (Sắp có)', disabled: true }
                    ]},
                    { name: 'ngay', label: 'Ngày đối soát', type: 'date' }
                ]
            },
            {
                title: 'Lô (Tính theo điểm)',
                description: 'VD: 1 điểm 23k, thắng được 80k',
                fields: [
                    { name: 'tien1DiemLo', label: 'Tiền 1 điểm (đ)', type: 'number', min: 1000, step: 1000 },
                    { name: 'tienTra1DiemLo', label: 'Tiền trả 1 điểm (đ)', type: 'number', min: 1000, step: 1000 },
                    { name: 'tyLeLoThu', label: 'Tỷ lệ thu (%)', type: 'number', min: 0, max: 100 }
                ]
            },
            {
                title: 'Đề (Hệ số nhân)',
                description: 'VD: Cược 10k × 70 = 700k',
                fields: [
                    { name: 'heSoDeTra', label: 'Hệ số trả (lần)', type: 'number', min: 1 },
                    { name: 'tyLeDeThu', label: 'Tỷ lệ thu (%)', type: 'number', min: 0, max: 100 }
                ]
            },
            {
                title: 'Lô Xiên 2 (Hệ số nhân)',
                description: 'VD: Cược 50k × 10 = 500k',
                fields: [
                    { name: 'heSoXien2Tra', label: 'Hệ số trả (lần)', type: 'number', min: 1 },
                    { name: 'tyLeXien2Thu', label: 'Tỷ lệ thu (%)', type: 'number', min: 0, max: 100 }
                ]
            },
            {
                title: 'Lô Xiên 3 (Hệ số nhân)',
                description: 'VD: Cược 25k × 40 = 1,000k',
                fields: [
                    { name: 'heSoXien3Tra', label: 'Hệ số trả (lần)', type: 'number', min: 1 },
                    { name: 'tyLeXien3Thu', label: 'Tỷ lệ thu (%)', type: 'number', min: 0, max: 100 }
                ]
            },
            {
                title: 'Lô Xiên 4 (Hệ số nhân)',
                description: 'VD: Cược 10k × 100 = 1,000k',
                fields: [
                    { name: 'heSoXien4Tra', label: 'Hệ số trả (lần)', type: 'number', min: 1 },
                    { name: 'tyLeXien4Thu', label: 'Tỷ lệ thu (%)', type: 'number', min: 0, max: 100 }
                ]
            },
            {
                title: 'Ba Càng (Hệ số nhân)',
                description: 'VD: Cược 5k × 400 = 2,000k',
                fields: [
                    { name: 'heSoBaCangTra', label: 'Hệ số trả (lần)', type: 'number', min: 1 },
                    { name: 'tyLeBaCangThu', label: 'Tỷ lệ thu (%)', type: 'number', min: 0, max: 100 }
                ]
            },
            {
                title: 'Tùy chọn',
                fields: [
                    { name: 'lamTronTien', label: 'Làm tròn tiền (hàng nghìn)', type: 'checkbox' },
                    { name: 'strictLoValidation', label: 'Bắt buộc lô chia hết cho 1 điểm', type: 'checkbox' }
                ]
            }
        ];

        return React.createElement('div', { className: 'border rounded-lg mb-4' },
            React.createElement('button', {
                className: 'w-full p-3 text-left flex items-center justify-between bg-[#F8F7F7] hover:bg-[#ECECEC]',
                onClick: () => setIsExpanded(!isExpanded)
            },
                React.createElement('span', { className: 'font-medium' }, ' Tham Số Hệ Thống (16 fields)'),
                React.createElement('span', {}, isExpanded ? '▼' : '▶')
            ),
            
            isExpanded && React.createElement('div', { className: 'p-4 space-y-6' },
                parameterGroups.map((group, groupIndex) =>
                    React.createElement('div', { key: groupIndex },
                        React.createElement('h4', { className: 'font-medium mb-2' }, group.title),
                        group.description && React.createElement('p', { className: 'text-sm text-[#7B7B7B] mb-3' }, group.description),
                        React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-3 gap-4' },
                            group.fields.map((field) =>
                                React.createElement('div', { key: field.name },
                                    React.createElement('label', { className: 'block text-sm font-medium mb-1' }, field.label),
                                    field.type === 'select' ?
                                        React.createElement('select', {
                                            className: 'w-full p-2 border rounded',
                                            value: config[field.name],
                                            onChange: (e) => handleChange(field.name, e.target.value)
                                        },
                                            field.options.map(opt =>
                                                React.createElement('option', { 
                                                    key: opt.value, 
                                                    value: opt.value,
                                                    disabled: opt.disabled 
                                                }, opt.label)
                                            )
                                        ) :
                                    field.type === 'checkbox' ?
                                        React.createElement('input', {
                                            type: 'checkbox',
                                            className: 'mt-2',
                                            checked: config[field.name],
                                            onChange: (e) => handleChange(field.name, e.target.checked)
                                        }) :
                                        React.createElement('input', {
                                            type: field.type,
                                            className: 'w-full p-2 border rounded',
                                            value: config[field.name],
                                            min: field.min,
                                            max: field.max,
                                            step: field.step,
                                            onChange: (e) => handleChange(field.name, 
                                                field.type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value
                                            )
                                        })
                                )
                            )
                        )
                    )
                )
            )
        );
    });

    // Input Section
    const InputSection = memo(({ value, onChange, onCheck, onClear, isLoading }) => {
        return React.createElement('div', { className: 'space-y-4' },
            React.createElement('div', {},
                React.createElement('label', { className: 'block text-sm font-medium mb-2' }, 
                    'Nhập dữ liệu tin nhắn'
                ),
                React.createElement('textarea', {
                    className: 'w-full h-40 p-3 border-2 border-[#E2E2E2] rounded-lg font-mono text-sm resize-none focus:border-[#E36323] focus:outline-none',
                    placeholder: `Nhập hoặc paste dữ liệu cược từ tin nhắn khách...

Ví dụ:
L 23 50k (lô 1 số)
D 88 100k (đề 1 số)
Lx 12 34 200k (xiên 2 số)
Lx 01 02 03 150k (xiên 3 số)
BC 123 75k (ba càng 1 số)
L 01,02,03 150k`,
                    value: value,
                    onChange: (e) => onChange(e.target.value),
                    spellCheck: false
                })
            ),
            React.createElement('div', { className: 'flex gap-2 justify-center' },
                React.createElement('button', {
                    className: `px-8 py-3 rounded-lg font-semibold text-lg ${
                        isLoading || !value.trim() ? 
                        'bg-[#E2E2E2] text-[#7B7B7B] cursor-not-allowed' :
                        'bg-[#E36323] hover:bg-[#DF5A18] text-white'
                    }`,
                    onClick: onCheck,
                    disabled: isLoading || !value.trim()
                }, isLoading ? 'Đang xử lý...' : 'Check Kết Quả XSMB'),
                React.createElement('button', {
                    className: 'px-4 py-2 bg-[#7B7B7B] text-white rounded hover:bg-[#121212]',
                    onClick: onClear
                }, ' Xóa')
            )
        );
    });

    // XSMB Results Display - ĐẦY ĐỦ 8 GIẢI THEO RULES
    const XSMBResultsDisplay = memo(({ lotteryData }) => {
        if (!lotteryData) return null;

        const prizeInfo = [
            { name: 'Đặc Biệt', numbers: [lotteryData.prizes.special], color: 'bg-red-500 text-white', note: 'Dùng cho đối chiếu ĐỀ' },
            { name: 'Nhất', numbers: lotteryData.prizes.first, color: 'bg-yellow-500 text-white' },
            { name: 'Nhì', numbers: lotteryData.prizes.second, color: 'bg-[#E36323] text-white' },
            { name: 'Ba', numbers: lotteryData.prizes.third, color: 'bg-green-500 text-white' },
            { name: 'Tư', numbers: lotteryData.prizes.fourth, color: 'bg-purple-500 text-white' },
            { name: 'Năm', numbers: lotteryData.prizes.fifth, color: 'bg-indigo-500 text-white' },
            { name: 'Sáu', numbers: lotteryData.prizes.sixth, color: 'bg-pink-500 text-white' },
            { name: 'Bảy', numbers: lotteryData.prizes.seventh, color: 'bg-[#7B7B7B] text-white' }
        ];

        return React.createElement('div', { className: 'border rounded-lg p-4 bg-[#FFF7ED] mb-6' },
            React.createElement('h3', { className: 'font-bold mb-3' }, 
                ` Kết Quả XSMB - ${lotteryData.date}`
            ),
            React.createElement('p', { className: 'text-sm text-[#7B7B7B] mb-4' },
                'Nguồn: RSS xosodaiphat.com - Cập nhật lúc 18h15'
            ),
            React.createElement('div', { className: 'overflow-x-auto' },
                React.createElement('table', { className: 'w-full border-collapse border' },
                    React.createElement('thead', {},
                        React.createElement('tr', {},
                            React.createElement('th', { className: 'border p-2 w-24 text-center' }, 'Giải'),
                            React.createElement('th', { className: 'border p-2 text-left' }, 'Số trúng thưởng'),
                            React.createElement('th', { className: 'border p-2 w-32 text-center bg-yellow-100' }, '2 số cuối')
                        )
                    ),
                    React.createElement('tbody', {},
                        prizeInfo.map((prize, index) =>
                            React.createElement('tr', { key: index },
                                React.createElement('td', { 
                                    className: `border p-2 text-center font-bold ${prize.color}` 
                                }, prize.name),
                                React.createElement('td', { className: 'border p-2' }, 
                                    prize.numbers.join(', ')
                                ),
                                React.createElement('td', { 
                                    className: 'border p-2 text-center font-bold bg-yellow-50' 
                                }, 
                                    prize.numbers.map(num => num.slice(-2)).join(', ')
                                )
                            )
                        )
                    )
                )
            ),
            React.createElement('div', { className: 'mt-4 text-sm text-[#7B7B7B]' },
                React.createElement('p', {}, `Tổng: ${lotteryData.allNumbers.length} số`),
                React.createElement('p', {}, `2 số cuối để đối chiếu LÔ và XIÊN: ${lotteryData.allNumbers.map(n => n.slice(-2)).join(', ')}`),
                React.createElement('p', {}, `Giải ĐB (${lotteryData.prizes.special?.slice(-2)}) để đối chiếu ĐỀ`)
            )
        );
    });

    // Results Table
    const ResultsTable = memo(({ results, filter, lotteryData }) => {
        const filteredResults = useMemo(() => {
            if (filter === 'all') return results;
            if (filter === 'win') return results.filter(r => r.result === 'win');
            if (filter === 'lose') return results.filter(r => r.result === 'lose');
            if (filter === 'error') return results.filter(r => r.status === 'error');
            return results;
        }, [results, filter]);

        const getRowClass = (result) => {
            if (result.status === 'error') return 'bg-yellow-50 border-l-4 border-yellow-500';
            if (result.result === 'win') return 'bg-green-50 border-l-4 border-green-500';
            if (result.result === 'lose') return 'bg-red-50 border-l-4 border-red-500';
            return '';
        };

        const getBetTypeBadge = (betType) => {
            const badges = {
                lô: { text: 'LÔ', color: 'bg-[#FFEDD5] text-[#E36323]' },
                đề: { text: 'ĐỀ', color: 'bg-purple-100 text-purple-800' },
                xiên: { text: 'XIÊN', color: 'bg-indigo-100 text-indigo-800' },
                'ba càng': { text: 'BA CÀNG', color: 'bg-teal-100 text-teal-800' }
            };
            const badge = badges[betType] || { text: '?', color: 'bg-[#F8F7F7] text-[#121212]' };
            return React.createElement('span', { 
                className: `px-2 py-1 rounded-full text-xs font-semibold ${badge.color}` 
            }, badge.text);
        };

        const getStatusBadge = (result) => {
            if (result.status === 'error') {
                return React.createElement('span', { 
                    className: 'px-2 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800' 
                }, 'LỖI');
            }
            if (result.result === 'win') {
                return React.createElement('span', { 
                    className: 'px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800' 
                }, 'THẮNG');
            }
            if (result.result === 'lose') {
                return React.createElement('span', { 
                    className: 'px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800' 
                }, 'THUA');
            }
            return React.createElement('span', { 
                className: 'px-2 py-1 rounded-full text-xs font-semibold bg-[#F8F7F7] text-[#121212]' 
            }, 'CHỜ');
        };

        return React.createElement('div', { className: 'overflow-x-auto' },
            React.createElement('table', { className: 'w-full border-collapse border' },
                React.createElement('thead', {},
                    React.createElement('tr', { className: 'bg-[#F8F7F7]' },
                        React.createElement('th', { className: 'border p-2 w-12 text-center' }, 'STT'),
                        React.createElement('th', { className: 'border p-2 w-48 text-left' }, 'Nội dung gốc'),
                        React.createElement('th', { className: 'border p-2 w-24 text-center' }, 'Loại cược'),
                        React.createElement('th', { className: 'border p-2 w-32 text-center' }, 'Số cược'),
                        React.createElement('th', { className: 'border p-2 w-32 text-right' }, 'Tiền cược'),
                        React.createElement('th', { className: 'border p-2 w-24 text-center' }, 'Trạng thái'),
                        React.createElement('th', { className: 'border p-2 w-36 text-right' }, 'Tiền thắng/thua'),
                        React.createElement('th', { className: 'border p-2 text-left' }, 'Ghi chú')
                    )
                ),
                React.createElement('tbody', {},
                    filteredResults.map((result, index) =>
                        React.createElement('tr', { 
                            key: index, 
                            className: getRowClass(result)
                        },
                            React.createElement('td', { className: 'border p-2 text-center' }, result.lineNumber),
                            React.createElement('td', { className: 'border p-2 font-mono text-sm' }, result.originalText),
                            React.createElement('td', { className: 'border p-2 text-center' }, 
                                result.status === 'error' ? 'X' : getBetTypeBadge(result.betType)
                            ),
                            React.createElement('td', { className: 'border p-2 text-center' }, 
                                result.status === 'error' ? '-' : result.numbers.join(', ')
                            ),
                            React.createElement('td', { className: 'border p-2 text-right' }, 
                                result.status === 'error' ? '-' : (result.money?.toLocaleString() + 'đ')
                            ),
                            React.createElement('td', { className: 'border p-2 text-center' }, 
                                getStatusBadge(result)
                            ),
                            React.createElement('td', { className: 'border p-2 text-right font-medium' }, 
                                result.status === 'error' ? '-' :
                                result.result === 'win' ? 
                                    React.createElement('span', { className: 'text-green-600' }, '+' + result.winAmount.toLocaleString() + 'đ') :
                                result.result === 'lose' ?
                                    React.createElement('span', { className: 'text-red-600' }, '-' + result.loseAmount.toLocaleString() + 'đ') : '-'
                            ),
                            React.createElement('td', { className: 'border p-2 text-sm' }, result.note || '')
                        )
                    )
                )
            )
        );
    });

    // Summary Cards - THEO RULES
    const SummarySection = memo(({ results }) => {
        const summary = useMemo(() => {
            const validBets = results.filter(r => r.status === 'valid');
            const winBets = results.filter(r => r.result === 'win');
            const loseBets = results.filter(r => r.result === 'lose');
            const errorBets = results.filter(r => r.status === 'error');
            
            const totalWinAmount = winBets.reduce((sum, bet) => sum + bet.winAmount, 0);
            const totalLoseAmount = loseBets.reduce((sum, bet) => sum + bet.loseAmount, 0);
            const netResult = totalWinAmount - totalLoseAmount;
            
            return {
                totalBets: validBets.length,
                winCount: winBets.length,
                loseCount: loseBets.length,
                errorCount: errorBets.length,
                totalWinAmount,
                totalLoseAmount,
                netResult
            };
        }, [results]);

        return React.createElement('div', { className: 'space-y-6' },
            // Summary Cards
            React.createElement('div', { className: 'grid grid-cols-2 md:grid-cols-4 gap-4' },
                React.createElement('div', { className: 'p-4 bg-[#FFEDD5] text-[#E36323] rounded-lg text-center' },
                    React.createElement('div', { className: 'text-2xl mb-1' }, ''),
                    React.createElement('div', { className: 'text-lg font-bold' }, summary.totalBets),
                    React.createElement('div', { className: 'text-sm' }, 'Tổng số cược')
                ),
                React.createElement('div', { className: 'p-4 bg-green-100 text-green-800 rounded-lg text-center' },
                    React.createElement('div', { className: 'text-2xl mb-1' }, 'OK'),
                    React.createElement('div', { className: 'text-lg font-bold' }, summary.winCount),
                    React.createElement('div', { className: 'text-sm' }, 'Số cược thắng')
                ),
                React.createElement('div', { className: 'p-4 bg-red-100 text-red-800 rounded-lg text-center' },
                    React.createElement('div', { className: 'text-2xl mb-1' }, 'X'),
                    React.createElement('div', { className: 'text-lg font-bold' }, summary.loseCount),
                    React.createElement('div', { className: 'text-sm' }, 'Số cược thua')
                ),
                React.createElement('div', { className: 'p-4 bg-yellow-100 text-yellow-800 rounded-lg text-center' },
                    React.createElement('div', { className: 'text-2xl mb-1' }, 'WARNING'),
                    React.createElement('div', { className: 'text-lg font-bold' }, summary.errorCount),
                    React.createElement('div', { className: 'text-sm' }, 'Số lỗi')
                )
            ),

            // Money Summary
            React.createElement('div', { className: 'grid grid-cols-1 md:grid-cols-2 gap-4' },
                React.createElement('div', { className: 'p-6 bg-green-50 border-2 border-green-200 rounded-lg' },
                    React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                        React.createElement('div', { className: 'text-3xl' }, '$'),
                        React.createElement('div', {},
                            React.createElement('div', { className: 'text-lg font-bold text-green-700' }, 'Tổng tiền thắng'),
                            React.createElement('div', { className: 'text-2xl font-bold text-green-600' }, 
                                summary.totalWinAmount.toLocaleString() + 'đ'
                            ),
                            React.createElement('div', { className: 'text-sm text-green-600' }, 
                                `Chi tiết: ${summary.winCount} cược thắng`
                            )
                        )
                    )
                ),
                React.createElement('div', { className: 'p-6 bg-red-50 border-2 border-red-200 rounded-lg' },
                    React.createElement('div', { className: 'flex items-center gap-3 mb-2' },
                        React.createElement('div', { className: 'text-3xl' }, ''),
                        React.createElement('div', {},
                            React.createElement('div', { className: 'text-lg font-bold text-red-700' }, 'Tổng tiền thua'),
                            React.createElement('div', { className: 'text-2xl font-bold text-red-600' }, 
                                summary.totalLoseAmount.toLocaleString() + 'đ'
                            ),
                            React.createElement('div', { className: 'text-sm text-red-600' }, 
                                `Chi tiết: ${summary.loseCount} cược thua`
                            )
                        )
                    )
                )
            ),

            // Net Result
            React.createElement('div', { 
                className: `p-6 rounded-lg text-center text-2xl font-bold ${
                    summary.netResult > 0 ? 'bg-[#10B981] text-white' :
                    summary.netResult < 0 ? 'bg-[#FE5938] text-white' :
                    'bg-[#7B7B7B] text-white'
                }`
            },
                React.createElement('div', { className: 'text-4xl mb-2' }, 
                    summary.netResult > 0 ? '' : summary.netResult < 0 ? '' : ''
                ),
                React.createElement('div', {}, 
                    `Kết quả cuối cùng: ${summary.netResult > 0 ? 'THẮNG' : summary.netResult < 0 ? 'THUA' : 'HÒA'}`
                ),
                React.createElement('div', { className: 'text-3xl mt-2' }, 
                    Math.abs(summary.netResult).toLocaleString() + 'đ'
                )
            )
        );
    });

    // Filter Section
    const FilterSection = memo(({ filter, onChange, results }) => {
        const counts = useMemo(() => {
            return {
                all: results.length,
                win: results.filter(r => r.result === 'win').length,
                lose: results.filter(r => r.result === 'lose').length,
                error: results.filter(r => r.status === 'error').length
            };
        }, [results]);

        return React.createElement('div', { className: 'flex items-center justify-between mb-4' },
            React.createElement('h3', { className: 'text-lg font-bold' }, 'Chi Tiết Từng Cược'),
            React.createElement('select', {
                className: 'p-2 border rounded',
                value: filter,
                onChange: (e) => onChange(e.target.value)
            },
                React.createElement('option', { value: 'all' }, `Tất cả (${counts.all})`),
                React.createElement('option', { value: 'win' }, `Chỉ thắng (${counts.win})`),
                React.createElement('option', { value: 'lose' }, `Chỉ thua (${counts.lose})`),
                React.createElement('option', { value: 'error' }, `Chỉ lỗi (${counts.error})`)
            )
        );
    });

    // Main Component - RULES COMPLIANT
    const LotteryBettingSystem = memo(() => {
        const [config, setConfig] = useState(DEFAULT_CONFIG);
        const [betText, setBetText] = useState('');
        const [results, setResults] = useState([]);
        const [lotteryData, setLotteryData] = useState(null);
        const [isLoading, setIsLoading] = useState(false);
        const [filter, setFilter] = useState('all');
        const [error, setError] = useState(null);

        const handleBetTextChange = useCallback((value) => {
            setBetText(value);
            setError(null); // Clear error when user types
        }, []);

        const handleCheckResults = useCallback(async () => {
            if (!betText.trim()) return;
            
            setIsLoading(true);
            setError(null);
            
            try {
                // Validation trước khi xử lý
                if (config.mien !== 'bac') {
                    throw new Error('Hiện tại chỉ hỗ trợ miền Bắc');
                }
                
                if (new Date(config.ngay) > new Date()) {
                    throw new Error('Không thể chọn ngày tương lai');
                }
                
                // 1. Parse and validate bets
                const parsedBets = parseAndValidateBets(betText, config);
                
                // 2. Fetch lottery results
                const lottery = await fetchLotteryResults(config.mien, config.ngay);
                setLotteryData(lottery);
                
                // 3. Check results and calculate money
                const finalResults = checkBetResults(parsedBets, lottery, config);
                setResults(finalResults);
                
            } catch (error) {
                console.error('Error processing bets:', error);
                setError(error.message);
            } finally {
                setIsLoading(false);
            }
        }, [betText, config]);

        const handleClear = useCallback(() => {
            setBetText('');
            setResults([]);
            setLotteryData(null);
            setError(null);
        }, []);

        return React.createElement('div', { className: 'max-w-7xl mx-auto p-4 space-y-6' },
            React.createElement('h1', { className: 'text-3xl font-bold text-center mb-8' }, 
                'Hệ Thống Đối Soát Lô Đề B2B'
            ),
            
            // Section A: Parameters (16 fields)
            React.createElement(ParametersSection, {
                config: config,
                onChange: setConfig
            }),
            
            // Section B: Input
            React.createElement(InputSection, {
                value: betText,
                onChange: handleBetTextChange,
                onCheck: handleCheckResults,
                onClear: handleClear,
                isLoading: isLoading
            }),

            // Error Display
            error && React.createElement('div', { 
                className: 'p-4 bg-red-50 border border-red-200 rounded-lg text-red-700' 
            },
                React.createElement('div', { className: 'font-medium' }, 'Lỗi:'),
                React.createElement('div', {}, error)
            ),

            // Section C & D: Results
            results.length > 0 && React.createElement('div', { className: 'space-y-6' },
                // XSMB Results Display
                React.createElement(XSMBResultsDisplay, {
                    lotteryData: lotteryData
                }),

                // Summary Section
                React.createElement(SummarySection, {
                    results: results
                }),

                // Detailed Results
                React.createElement(FilterSection, {
                    filter: filter,
                    onChange: setFilter,
                    results: results
                }),
                React.createElement(ResultsTable, {
                    results: results,
                    filter: filter,
                    lotteryData: lotteryData
                })
            )
        );
    });

    // Export to window
    window.LotteryBettingSystem = LotteryBettingSystem;
    window.BetParser = {
        parseAndValidateBets: parseAndValidateBets,
        parseSingleLine: parseSingleLine,
        checkBetResults: checkBetResults,
        calculateWinAmount: calculateWinAmount,
        calculateLoseAmount: calculateLoseAmount,
        isResultAvailable: isResultAvailable,
        fetchLotteryResults: fetchLotteryResults,
        parseLotteryNumbers: parseLotteryNumbers,
        checkSingleBet: checkSingleBet
    };
    window.parseAndValidateBets = parseAndValidateBets;
    window.checkBetResults = checkBetResults;
    window.calculateWinAmount = calculateWinAmount;
    window.calculateLoseAmount = calculateLoseAmount;
    window.isResultAvailable = isResultAvailable;

    console.log('Lottery Betting System v8.1.0 - RULES COMPLIANT loaded successfully');

})(); 