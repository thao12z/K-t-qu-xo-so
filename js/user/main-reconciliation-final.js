  (function() {
    'use strict';
    
    console.log(' FINAL VERSION: Starting with working foundation...');
    
    // Helper function - DEFAULT TO TODAY for current data
    const getLatestAvailableDate = () => {
        const today = new Date();
        return today.toISOString().split('T')[0];
    };
    
    // DEFAULT_PARAMETERS - 16 THAM SỐ CHÍNH XÁC THEO RULES
    window.DEFAULT_PARAMETERS = {
        // Cơ bản (2 fields)
        mien: 'bac',
        ngay: getLatestAvailableDate(),
        
        // Lô (2 fields) - Tính theo điểm
        tien1DiemLo: 23000,          // User nhập - dùng cho cả tính điểm và thua
        tienTra1DiemLo: 80000,       // Cố định - trả 80k cho 1 điểm thắng

        // Đề (3 fields) - Tính theo điểm + hệ số
        tien1DiemDe: 1000,           // VD: 1k cho 1 điểm đề
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
        
        // Tùy chọn (2 fields)
        lamTronTien: false,              // Làm tròn hàng nghìn
        strictLoValidation: false        // Bắt buộc lô chia hết cho 1 điểm
    };
    
    // ==========================================
    // ADVANCED INPUT PREPROCESSOR
    // Chuyển đổi input phức tạp thành dạng chuẩn
    // ==========================================
    window.advancedPreprocessInput = (rawInput) => {
        console.log(' [PREPROCESS] Starting advanced input preprocessing...');
        const results = [];

        // Normalize input - xử lý unicode và whitespace
        let input = rawInput
            .replace(/[\u200B-\u200D\uFEFF]/g, '') // Remove zero-width chars
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n');

        // Split by newlines first
        const lines = input.split('\n');

        for (let lineText of lines) {
            lineText = lineText.trim();
            if (!lineText) continue;

            // Process each line with multiple handlers
            // "Tin X:" prefix is handled inside processComplexLine
            const processed = processComplexLine(lineText);
            results.push(...processed);
        }

        console.log(` [PREPROCESS] Converted to ${results.length} simple bet lines`);
        return results;
    };

    // Process a single complex line into multiple simple bets
    function processComplexLine(line) {
        const results = [];
        const originalLine = line;

        // Normalize: remove extra spaces, lowercase
        line = line.trim();

        // === SPECIAL: Remove "Tin X:" prefix if present ===
        // "Tin 1: De 00 x 1070n" → "De 00 x 1070n"
        const tinPrefixMatch = line.match(/^tin\s*\d+\s*:\s*/i);
        if (tinPrefixMatch) {
            line = line.substring(tinPrefixMatch[0].length).trim();
            console.log(`[PREPROCESS] Removed tin prefix: "${originalLine}" -> "${line}"`);
            // If line is now empty (was just "Tin X:"), skip it
            if (!line) {
                console.log(`[PREPROCESS] Skipping empty tin marker: ${originalLine}`);
                return results; // Return empty array to skip this line
            }
        }

        // === HANDLER 1: Xiên quay / XQ format ===
        // "xien quay 00,07,68,54 x 2000" or "xq 00,07,54,66 x 1000"
        const xienQuayMatch = line.match(/^(xien\s*quay|xiên\s*quây|xq)\s+([\d,\s]+)\s*x\s*([\d.]+)(n{1,2}|k|m)?$/i);
        if (xienQuayMatch) {
            const numbersStr = xienQuayMatch[2];
            const moneyValue = parseFloat(xienQuayMatch[3]);
            const unit = (xienQuayMatch[4] || '').toLowerCase();

            const numbers = numbersStr.split(/[,\s]+/).filter(n => n && /^\d{1,2}$/.test(n));
            const money = convertToMoney(moneyValue, unit);

            if (numbers.length >= 2 && numbers.length <= 4) {
                results.push(`xien quay ${numbers.join(' ')}-${money}`);
                console.log(`[PREPROCESS] Xiên quay: ${originalLine} -> xien quay ${numbers.join(' ')}-${money}`);
            }
            return results;
        }

        // === HANDLER 2: Đầu X Đít Y format ===
        // "Đề đầu 5 đít 5 x1000nn" -> Tất cả số bắt đầu 5 và kết thúc 5
        const dauDitMatch = line.match(/^(de|đề|d)\s+đầu\s+(\d)\s+đít\s+(\d)\s*x\s*([\d.]+)(n{1,2}|k|m)?$/i);
        if (dauDitMatch) {
            const firstDigit = dauDitMatch[2];
            const lastDigit = dauDitMatch[3];
            const moneyValue = parseFloat(dauDitMatch[4]);
            const unit = (dauDitMatch[5] || '').toLowerCase();
            const money = convertToMoney(moneyValue, unit);

            // Generate all numbers from 00-99 that start with firstDigit and end with lastDigit
            for (let i = 0; i <= 99; i++) {
                const numStr = i.toString().padStart(2, '0');
                if (numStr[0] === firstDigit && numStr[1] === lastDigit) {
                    results.push(`de ${numStr}-${money}`);
                }
            }

            console.log(`[PREPROCESS] Đầu ${firstDigit} Đít ${lastDigit}: ${originalLine} -> ${results.length} đề`);
            return results;
        }

        // === HANDLER 3: Số 3 chữ số format ===
        // "de 525 535 565 575 595 x1000nn" -> tách thành 52+25, 53+35, etc.
        const de3DigitMatch = line.match(/^(de|đề|d)\s+((?:\d{3}\s*)+)\s*x\s*([\d.]+)(n{1,2}|k|m)?$/i);
        if (de3DigitMatch) {
            const numbersStr = de3DigitMatch[2];
            const moneyValue = parseFloat(de3DigitMatch[3]);
            const unit = (de3DigitMatch[4] || '').toLowerCase();
            const money = convertToMoney(moneyValue, unit);

            const numbers3 = numbersStr.match(/\d{3}/g) || [];
            for (const num3 of numbers3) {
                // Tách số 3 chữ số thành 2 số: ABC -> AB và BC
                const first2 = num3.substring(0, 2);
                const last2 = num3.substring(1, 3);
                results.push(`de ${first2}-${money}`);
                results.push(`de ${last2}-${money}`);
            }
            console.log(`[PREPROCESS] Đề 3 số: ${originalLine} -> ${results.length} đề`);
            return results;
        }

        // === HANDLER 4: Multi-bet với dấu chấm ===
        // "De 00 x 1070n. 90 x 735n. 11 x 330n."
        if (/\d+\s*x\s*[\d.]+n{0,2}\s*\./i.test(line)) {
            // Detect bet type from start
            const typeMatch = line.match(/^(de|đề|d|lo|lô|l)\s+/i);
            const betType = typeMatch ? typeMatch[1].toLowerCase() : 'de';
            const normalizedType = betType.match(/^(de|đề|d)$/i) ? 'de' : 'lo';

            // Split by "." and process each segment
            const segments = line.split(/\.\s*/);

            for (const segment of segments) {
                if (!segment.trim()) continue;

                // Match: "00 x 1070n" or "17,56 x 94n" (multi-number)
                // Also handle optional bet type prefix: "De 00 x 1070n"
                const segMatch = segment.match(/(?:de|đề|d|lo|lô|l)?\s*([\d,\s]+)\s*x\s*([\d.]+)(n{1,2}|k|m)?/i);
                if (segMatch) {
                    const numbersStr = segMatch[1];
                    const moneyValue = parseFloat(segMatch[2]);
                    const unit = (segMatch[3] || '').toLowerCase();
                    const money = convertToMoney(moneyValue, unit);

                    // Split numbers by comma or space
                    const numbers = numbersStr.split(/[,\s]+/).filter(n => n && /^\d{1,2}$/.test(n));

                    for (const num of numbers) {
                        if (normalizedType === 'de') {
                            results.push(`de ${num.padStart(2, '0')}-${money}`);
                        } else {
                            results.push(`lo ${num.padStart(2, '0')}-${money}`);
                        }
                    }
                }
            }

            if (results.length > 0) {
                console.log(`[PREPROCESS] Multi-bet dấu chấm: ${originalLine} -> ${results.length} bets`);
                return results;
            }
        }

        // === HANDLER 5: Single multi-number format ===
        // "17,56 x 94n" without type prefix (assume đề in context)
        const multiNumMatch = line.match(/^([\d,]+)\s*x\s*([\d.]+)(n{1,2}|k|m)?$/i);
        if (multiNumMatch) {
            const numbersStr = multiNumMatch[1];
            const moneyValue = parseFloat(multiNumMatch[2]);
            const unit = (multiNumMatch[3] || '').toLowerCase();
            const money = convertToMoney(moneyValue, unit);

            const numbers = numbersStr.split(',').filter(n => n && /^\d{1,2}$/.test(n));
            for (const num of numbers) {
                results.push(`de ${num.padStart(2, '0')}-${money}`);
            }

            if (results.length > 0) {
                console.log(`[PREPROCESS] Multi-number: ${originalLine} -> ${results.length} đề`);
                return results;
            }
        }

        // === HANDLER 6: Standard format with "x" separator ===
        // "de 00 x 1070n" -> "de 00 1070k"
        const standardXMatch = line.match(/^(de|đề|d|lo|lô|l)\s+([\d,\s]+)\s*x\s*([\d.]+)(n{1,2}|k|m)?$/i);
        if (standardXMatch) {
            const betType = standardXMatch[1].toLowerCase();
            const normalizedType = betType.match(/^(de|đề|d)$/i) ? 'de' : 'lo';
            const numbersStr = standardXMatch[2];
            const moneyValue = parseFloat(standardXMatch[3]);
            const unit = (standardXMatch[4] || '').toLowerCase();
            const money = convertToMoney(moneyValue, unit);

            const numbers = numbersStr.split(/[,\s]+/).filter(n => n && /^\d{1,2}$/.test(n));

            for (const num of numbers) {
                if (normalizedType === 'de') {
                    results.push(`de ${num.padStart(2, '0')}-${money}`);
                } else {
                    results.push(`lo ${num.padStart(2, '0')}-${money}`);
                }
            }

            if (results.length > 0) {
                console.log(`[PREPROCESS] Standard X format: ${originalLine} -> ${results.length} bets`);
                return results;
            }
        }

        // === HANDLER 7: Lo format (point-based) ===
        // "lo 32 23k" or "lo 32 23" -> format as "lo 32-23"
        const loMatch = line.match(/^(lo|lô|l)\s+([\d\s]+)\s+([\d.]+)[km]?$/i);
        if (loMatch) {
            const numbers = loMatch[2].trim();
            const points = loMatch[3];
            results.push(`lo ${numbers}-${points}`);
            console.log(`[PREPROCESS] Lo format: ${originalLine} -> lo ${numbers}-${points}`);
            return results;
        }

        // === FALLBACK: Return original line if no pattern matched ===
        // Let simpleBetParse handle it
        console.log(`[PREPROCESS] Fallback: ${originalLine}`);
        results.push(originalLine);
        return results;
    }

    // Convert money value to thousands (k)
    function convertToMoney(value, unit) {
        if (!unit || unit === '') {
            return value; // Assume already in k
        }
        switch (unit.toLowerCase()) {
            case 'n':
                return value; // n = nghìn = k
            case 'nn':
                return value; // nn cũng là nghìn (không phải 10k)
            case 'k':
                return value;
            case 'm':
                return value * 1000;
            default:
                return value;
        }
    }

    // ==========================================
    // END ADVANCED INPUT PREPROCESSOR
    // ==========================================

    // Lottery functions - ASYNC REALTIME DATA RETRIEVAL
    window.getLotteryData = async (region = 'bac', selectedDate = null) => {
        if (window.LotteryDataService) {
            let data;

            if (selectedDate) {
                // ASYNC: Fetch data for specific date (now async in online mode)
                console.log(`[getLotteryData]  Fetching data for ${selectedDate}...`);
                data = await window.LotteryDataService.getDataForDate(selectedDate, region);
                console.log(`[getLotteryData] Requested ${selectedDate}: ${data ? 'Found' : 'Not found'}`);
            } else {
                data = window.LotteryDataService.getCurrentData(region);
                console.log(`[getLotteryData] Current data: ${data ? 'Found' : 'Not found'}`);
            }

            // Check for error response from date validation
            if (data && data.error) {
                console.error(`[getLotteryData]  Error: ${data.error}`);
                return { error: data.error };
            }

            if (data && data.results) {
                console.log(`[getLotteryData] Returning lottery data for ${data.date || 'unknown'}`);
                return data.results;
            }

            // Legacy support: check for numbers property
            if (data && data.numbers) {
                console.log(`[getLotteryData] Returning legacy lottery data`);
                return data.numbers;
            }

            // Support for historical/simulation/rss data
            if (data && (data.dataType === 'historical' || data.dataType === 'simulation' || data.dataType === 'rss')) {
                console.log(`[getLotteryData] Returning ${data.dataType} data for ${data.date}`);
                return data;
            }

            // If data exists but no specific format, return it directly
            if (data) {
                console.log(`[getLotteryData] Returning raw data for ${data.date || 'unknown'}`);
                return data;
            }

            // No valid data found
            console.log(`[getLotteryData] No valid data format found for ${selectedDate || 'current'}`);
        }

        console.log(`[getLotteryData] No data available for ${selectedDate || 'current'}`);
        return null;
    };

    // Synchronous version for backwards compatibility
    window.getLotteryDataSync = (region = 'bac', selectedDate = null) => {
        if (window.LotteryDataService) {
            let data;

            if (selectedDate) {
                // Use sync version
                data = window.LotteryDataService.getDataForDateSync(selectedDate, region);
            } else {
                data = window.LotteryDataService.getCurrentData(region);
            }

            if (data && data.results) return data.results;
            if (data && data.numbers) return data.numbers;
            if (data) return data;
        }

        return null;
    };
    
    window.getLotteryInfo = (region = 'bac', selectedDate = null) => {
        if (window.LotteryDataService) {
            let data;
            
            if (selectedDate) {
                // Use getDataForDate for specific dates
                data = window.LotteryDataService.getDataForDate(selectedDate, region);
            } else {
                // Use current data for no date specified
                data = window.LotteryDataService.getCurrentData(region);
            }
            
            if (data) {
                let sourceText = 'Dữ liệu thực từ RSS';
                if (data.dataType === 'simulation') {
                    sourceText = 'Dữ liệu mô phỏng';
                } else if (data.dataType === 'historical') {
                    sourceText = 'Dữ liệu lịch sử (mô phỏng RSS ngày cũ)';
                } else if (data.dataType === 'rss') {
                    sourceText = 'Dữ liệu thật từ RSS xosodaiphat.com';
                }
                
                return {
                    source: sourceText,
                    date: data.date || selectedDate || 'unknown',
                    lastUpdated: data.lastUpdated || data.timestamp,
                    dataAvailable: true,
                    region: data.region || region,
                    requestedDate: selectedDate,
                    isRequestedDate: selectedDate ? (data.date === selectedDate) : true,
                    dataType: data.dataType || 'real'
                };
            }
        }
        
        return {
            source: 'Không có dữ liệu',
            date: selectedDate || 'unknown',
            dataAvailable: false,
            requestedDate: selectedDate,
            isRequestedDate: false
        };
    };
    
    // Enhanced lottery data extraction with arrays - CORE FUNCTION THEO YÊU CẦU
    window.extractAllLotteryNumbers = (rawResults) => {
        console.log('Extracting lottery arrays from raw data...');
        
        if (!rawResults || typeof rawResults !== 'object') {
            console.warn('No valid lottery data to extract arrays from');
            return { deArray: [], loArray: [], xienArray: [], baCangArray: [] };
        }

        const deArray = [];
        const loArray = [];
        const baCangArray = [];

        // Extract from special prize (Giải Đặc Biệt) - ĐỀ CHỈ TỪ ĐẶC BIỆT
        console.log(` [extractAllLotteryNumbers] Raw special prize:`, rawResults.giai_dac_biet);
        
        if (rawResults.giai_dac_biet && rawResults.giai_dac_biet.length > 0) {
            const specialNumber = rawResults.giai_dac_biet[0];
            console.log(` [extractAllLotteryNumbers] Special number found: "${specialNumber}" (type: ${typeof specialNumber})`);
            
            if (specialNumber && specialNumber.length >= 2) {
                const lastTwo = specialNumber.slice(-2);
                deArray.push(lastTwo);
                loArray.push(lastTwo);
                
                if (specialNumber.length >= 3) {
                    const lastThree = specialNumber.slice(-3);
                    baCangArray.push(lastThree);
                }
                console.log(`Đặc biệt: ${specialNumber} → Đề: ${lastTwo}, Lô: ${lastTwo}, Ba càng: ${specialNumber.slice(-3)}`);
            } else {
                console.warn(`Special number invalid: "${specialNumber}"`);
            }
        } else {
            console.warn(`No special prize found in:`, rawResults);
        }

        // Extract from all other prizes (Giải 1-7) - LÔ VÀ BA CÀNG
        const prizes = ['giai_nhat', 'giai_nhi', 'giai_ba', 'giai_tu', 'giai_nam', 'giai_sau', 'giai_bay'];
        
        prizes.forEach((prize, index) => {
            if (rawResults[prize] && Array.isArray(rawResults[prize])) {
                rawResults[prize].forEach(number => {
                    if (number && number.length >= 2) {
                        const lastTwo = number.slice(-2);
                        loArray.push(lastTwo);
                        
                        // Ba cang excludes giai_bay (7th prize) - THEO RULES
                        if (index < 6 && number.length >= 3) {
                            const lastThree = number.slice(-3);
                            baCangArray.push(lastThree);
                        }
                    }
                });
                console.log(`${prize}: ${rawResults[prize].join(', ')} → added to arrays`);
            }
        });

        // Remove duplicates and create final arrays
        const uniqueDeArray = [...new Set(deArray)];
        const uniqueLoArray = [...new Set(loArray)];
        const uniqueXienArray = [...new Set(loArray)]; // Xiên uses same as lô
        const uniqueBaCangArray = [...new Set(baCangArray)];

        const result = {
            deArray: uniqueDeArray,
            loArray: uniqueLoArray,
            xienArray: uniqueXienArray,
            baCangArray: uniqueBaCangArray
        };

        console.log('Final extracted arrays:', {
            'Đề (từ ĐB)': result.deArray.length + ' số',
            'Lô (tất cả giải)': result.loArray.length + ' số', 
            'Xiên (như lô)': result.xienArray.length + ' số',
            'Ba càng (ĐB→G6)': result.baCangArray.length + ' số'
        });
        
        return result;
    };

    // AUTO-INTEGRATION: Patch LotteryDataService để tự động extract arrays
    window.enhanceLotteryDataService = () => {
        if (!window.LotteryDataService) {
            console.warn('LotteryDataService not found, cannot enhance');
            return;
        }

        // Store original methods
        const originalStoreData = window.LotteryDataService.storeData;
        const originalGetCurrentData = window.LotteryDataService.getCurrentData;

        // Enhance storeData to auto-extract arrays
        window.LotteryDataService.storeData = function(region, data) {
            // Call original method first
            const result = originalStoreData.call(this, region, data);
            
            // Auto-extract arrays and cache them
            if (data && data.numbers) {
                console.log('Auto-extracting lottery arrays for', region);
                const arrays = window.extractAllLotteryNumbers(data.numbers);
                
                // Store arrays in the data object
                data.extractedArrays = arrays;
                data.lastExtracted = new Date().toISOString();
                
                console.log('Arrays cached in lottery data for', region);
            }
            
            return result;
        };

        // Enhance getCurrentData to include extracted arrays
        window.LotteryDataService.getCurrentData = function(region) {
            const data = originalGetCurrentData.call(this, region);
            
            // If no cached arrays, extract them now
            if (data && data.numbers && !data.extractedArrays) {
                console.log('Extracting arrays on-demand for', region);
                data.extractedArrays = window.extractAllLotteryNumbers(data.numbers);
                data.lastExtracted = new Date().toISOString();
            }
            
            return data;
        };

        console.log(' LotteryDataService enhanced with auto array extraction!');
    };

    // Auto-enhance when available
    if (window.LotteryDataService) {
        window.enhanceLotteryDataService();
    } else {
        // Wait for LotteryDataService to load
        const checkService = setInterval(() => {
            if (window.LotteryDataService) {
                window.enhanceLotteryDataService();
                clearInterval(checkService);
            }
        }, 100);
    }

    // Helper function to get parameter from component state (passed as closure)
    const createGetUIParameter = (parametersState) => {
        return (paramName, defaultValue) => {
            try {
                const value = parametersState[paramName];
                if (value !== undefined && value !== null && !isNaN(value)) {
                    console.log(`[PARAMS] ${paramName} = ${value} (from state)`);
                    return value;
                }
                
                console.log(`[PARAMS] ${paramName} = ${defaultValue} (default, not found in state)`);
                return defaultValue;
            } catch (error) {
                console.log(`[PARAMS] Error getting ${paramName}:`, error, 'using default:', defaultValue);
                return defaultValue;
            }
        };
    };

    // Enhanced parser for real-world formats: "Lx 24 42 100k", "D 20 10 4m", etc.
    const simpleBetParse = (line) => {
        try {
            // Clean and normalize input
            const originalLine = line;
            line = line.trim();

            // Check for empty line
            if (!line) {
                return { success: false, error: 'Dòng trống' };
            }

            // === HANDLE DASH FORMAT ===
            // Convert "de 00-1043" or "lo 32-23" to "de 00 1043k" or "lo 32 23"
            // Also handle "xien quay 00 07 68 54-2000" format
            const dashFormatMatch = line.match(/^(xien\s+quay|xiên\s+quây|xq|de|đề|d|lo|lô|l)\s+([\d\s]+)-(\d+)$/i);
            if (dashFormatMatch) {
                const betType = dashFormatMatch[1].trim().toLowerCase();
                const numbersStr = dashFormatMatch[2].trim();
                const moneyValue = dashFormatMatch[3];

                // Check if this is xiên quay format
                if (betType.match(/^(xien\s*quay|xiên\s*quây|xq)$/i)) {
                    // Xiên quay: convert to standard xiên format
                    line = `xien ${numbersStr} ${moneyValue}k`;
                } else if (betType.match(/^(l|lo|lô)$/i)) {
                    // Lô: points-based, no k needed
                    line = `lo ${numbersStr} ${moneyValue}`;
                } else {
                    // Đề: add k suffix
                    line = `de ${numbersStr} ${moneyValue}k`;
                }
                console.log(`[PARSE] Converted dash format: "${originalLine}" -> "${line}"`);
            }

            // Normalize commas and spaces
            line = line.replace(/,/g, ' ').replace(/\s+/g, ' ');

            // Check for basic structure
            const parts = line.split(' ').filter(p => p.trim());
            if (parts.length < 3) {
                return { success: false, error: 'Thiếu thông tin - Cần: [loại] [số] [tiền/điểm]' };
            }

            // Check if this is Lô type (uses points instead of money)
            const isLoType = /^(l|lo|lô)\s+/i.test(line);

            // Enhanced pattern - Lô can use points (number without k/m or with k/m ignored)
            // Other types require k/m suffix for money
            let match;
            if (isLoType) {
                // Lô: last part is POINTS (can be "20" or "20k" - k is ignored)
                match = line.toLowerCase().match(/^(l|lo|lô)\s+([\d\s]+)\s+([\d.]+)[km]?$/i);
            } else {
                // Other types: last part is MONEY (requires k/m)
                match = line.toLowerCase().match(/^(lx\d?|x\d|d|đ|de|đề|dê|xien\d?|xiên\d?|bc|ba\s*cang|ba\s*càng)\s+([\d\s]+)\s+([\d.]+[km])$/i);
            }

            if (!match) {
                // More specific error messages
                if (!/^(lx\d?|x\d|l|d|đ|lo|lô|de|đề|dê|xien\d?|xiên\d?|bc|ba\s*cang|ba\s*càng)/i.test(line)) {
                    return { success: false, error: 'Loại cược không hợp lệ - Cần: L/D/Lx/BC (Lô/Đề/Xiên/Ba càng)' };
                }
                if (!isLoType && !/[\d.]+[km]$/i.test(line)) {
                    return { success: false, error: 'Số tiền phải có đơn vị k hoặc m - Ví dụ: 100k, 1.5m' };
                }
                return { success: false, error: isLoType ? 'Cú pháp không đúng - Ví dụ: "L 12 20" (20 điểm)' : 'Cú pháp không đúng - Ví dụ: "D 34 100k"' };
            }

            const [, type, numbersStr, amountStr] = match;
            const numbers = numbersStr.split(/\s+/).filter(n => n && n.length > 0);

            // Get type key for validation
            const typeKey = type.toLowerCase().replace(/\s+/g, '');
            const isBaCang = ['bc', 'bacang', 'bacàng'].includes(typeKey);

            // Validate numbers
            for (const num of numbers) {
                if (isBaCang) {
                    // Ba càng allows 3-digit numbers (000-999)
                    if (!/^\d{1,3}$/.test(num)) {
                        return { success: false, error: `Số "${num}" không hợp lệ - Ba càng cần 1-3 chữ số` };
                    }
                } else {
                    // Other types need 1-2 digit numbers (00-99)
                    if (!/^\d{1,2}$/.test(num)) {
                        return { success: false, error: `Số "${num}" không hợp lệ - Cần 1-2 chữ số (00-99)` };
                    }
                    const numValue = parseInt(num);
                    if (numValue < 0 || numValue > 99) {
                        return { success: false, error: `Số "${num}" ngoài phạm vi - Cần từ 00 đến 99` };
                    }
                }
            }

            // Parse amount: money for most types, points for Lô
            let money = 0;
            let points = 0;

            if (isLoType) {
                // Lô: amountStr is POINTS (e.g., "20" or "20k" → 20 points)
                // Remove k/m suffix if present
                const pointValue = parseFloat(amountStr.replace(/[km]/gi, ''));
                if (isNaN(pointValue) || pointValue <= 0) {
                    return { success: false, error: `Số điểm "${amountStr}" không hợp lệ` };
                }
                points = Math.floor(pointValue);
                // Money will be calculated later using tien1DiemLo
                // For now, store points as money (will be recalculated)
                money = points; // Placeholder - actual calculation in processResult
            } else {
                // Other types: amountStr is MONEY with k/m suffix
                if (amountStr.includes('m')) {
                    const value = parseFloat(amountStr.replace('m', ''));
                    if (isNaN(value) || value <= 0) {
                        return { success: false, error: `Số tiền "${amountStr}" không hợp lệ` };
                    }
                    money = value * 1000000;
                } else if (amountStr.includes('k')) {
                    const value = parseInt(amountStr.replace('k', ''));
                    if (isNaN(value) || value <= 0) {
                        return { success: false, error: `Số tiền "${amountStr}" không hợp lệ` };
                    }
                    money = value * 1000;
                } else {
                    return { success: false, error: `Số tiền phải có đơn vị k hoặc m - Ví dụ: 100k, 1.5m` };
                }
            }

            // Map type shortcuts to full names
            let mappedType = {
                'l': 'lô', 'lo': 'lô', 'lô': 'lô',
                'd': 'đề', 'đ': 'đề', 'de': 'đề', 'đề': 'đề', 'dê': 'đề',
                'lx': 'xiên', 'lx2': 'xiên 2', 'lx3': 'xiên 3', 'lx4': 'xiên 4',
                'x2': 'xiên 2', 'x3': 'xiên 3', 'x4': 'xiên 4',
                'xien': 'xiên', 'xiên': 'xiên',
                'xien2': 'xiên 2', 'xien3': 'xiên 3', 'xien4': 'xiên 4',
                'xiên2': 'xiên 2', 'xiên3': 'xiên 3', 'xiên4': 'xiên 4',
                'bc': 'ba càng', 'bacang': 'ba càng', 'bacàng': 'ba càng'
            }[typeKey] || type;

            // Auto-detect xiên type based on number count
            // Lô xiên MUST have 2, 3, or 4 numbers - auto-detect type
            if (mappedType === 'xiên') {
                if (numbers.length === 2) {
                    mappedType = 'xiên 2';
                } else if (numbers.length === 3) {
                    mappedType = 'xiên 3';
                } else if (numbers.length === 4) {
                    mappedType = 'xiên 4';
                } else {
                    return { success: false, error: `Lô xiên cần 2, 3 hoặc 4 số - Bạn nhập ${numbers.length} số` };
                }
            }

            // Validate number count for each bet type
            if (mappedType === 'đề' && numbers.length !== 1) {
                return { success: false, error: `Đề chỉ cần 1 số - Bạn nhập ${numbers.length} số` };
            }
            if (mappedType === 'lô' && numbers.length < 1) {
                return { success: false, error: 'Lô cần ít nhất 1 số' };
            }
            // Validate xiên types - if user specified explicit type (lx2, x3, etc.), check exact count
            if (mappedType === 'xiên 2' && numbers.length !== 2) {
                return { success: false, error: `Xiên 2 cần đúng 2 số - Bạn nhập ${numbers.length} số` };
            }
            if (mappedType === 'xiên 3' && numbers.length !== 3) {
                return { success: false, error: `Xiên 3 cần đúng 3 số - Bạn nhập ${numbers.length} số` };
            }
            if (mappedType === 'xiên 4' && numbers.length !== 4) {
                return { success: false, error: `Xiên 4 cần đúng 4 số - Bạn nhập ${numbers.length} số` };
            }
            if (mappedType === 'ba càng') {
                if (numbers.length !== 1) {
                    return { success: false, error: `Ba càng chỉ cần 1 số - Bạn nhập ${numbers.length} số` };
                }
                // Ba càng needs 3-digit number
                if (numbers[0].length !== 3) {
                    return { success: false, error: `Ba càng cần số 3 chữ số (000-999) - Bạn nhập "${numbers[0]}"` };
                }
            }

            // Return bet object with points for Lô
            return {
                success: true,
                bet: {
                    type: mappedType,
                    betType: mappedType,
                    numbers: numbers,
                    money: money,
                    points: isLoType ? points : 0, // Lô uses points directly
                    isPointBased: isLoType // Flag to indicate point-based calculation
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Global parameters holder for current session
    window.CURRENT_PARAMETERS = null;
    
    // Generate CSS background for textarea with error line highlighting
    const getTextareaBackground = (betText, validationResults) => {
        const lines = betText.split('\n');
        const lineHeight = 24; // 1.5em in pixels (assuming 16px base font)
        
        let gradientStops = [];
        
        lines.forEach((line, index) => {
            const validation = validationResults.find(v => v.lineNumber === index + 1);
            const hasError = validation && !validation.isValid && line.trim();
            
            if (hasError) {
                const startY = index * lineHeight;
                const endY = (index + 1) * lineHeight;
                
                // Add background color for the line
                gradientStops.push(
                    `transparent ${startY}px`,
                    `rgba(239, 68, 68, 0.1) ${startY}px`,
                    `rgba(239, 68, 68, 0.1) ${endY - 3}px`,
                    `transparent ${endY - 3}px`
                );
                
                // Add underline at bottom of line
                gradientStops.push(
                    `transparent ${endY - 3}px`,
                    `#ef4444 ${endY - 3}px`,
                    `#ef4444 ${endY - 1}px`,
                    `transparent ${endY - 1}px`
                );
            }
        });
        
        if (gradientStops.length === 0) {
            return 'white';
        }
        
        return `linear-gradient(to bottom, ${gradientStops.join(', ')})`;
    };
    
    // Create CSS background image for error line highlighting
    const createErrorLineCSS = (betText, validationResults) => {
        const lines = betText.split('\n');
        const lineHeight = 24; // 1.5em * 16px = 24px
        
        let gradientStops = [];
        
        lines.forEach((line, index) => {
            const validation = validationResults.find(v => v.lineNumber === index + 1);
            const hasError = validation && !validation.isValid && line.trim();
            
            if (hasError) {
                const startY = index * lineHeight + 3; // padding top
                const endY = (index + 1) * lineHeight + 3;
                
                // Background highlight
                gradientStops.push(
                    `transparent ${startY}px`,
                    `rgba(239, 68, 68, 0.1) ${startY}px`,
                    `rgba(239, 68, 68, 0.1) ${endY - 2}px`,
                    `transparent ${endY - 2}px`
                );
                
                // Red underline
                gradientStops.push(
                    `transparent ${endY - 2}px`,
                    `#ef4444 ${endY - 2}px`,
                    `#ef4444 ${endY}px`,
                    `transparent ${endY}px`
                );
            }
        });
        
        if (gradientStops.length === 0) {
            return 'none';
        }
        
        return `linear-gradient(to bottom, ${gradientStops.join(', ')})`;
    };
    
    // Get textarea CSS class names based on validation
    const getTextareaClassName = (validationResults, betText) => {
        const baseClasses = 'w-full p-3 border font-mono text-sm resize-none outline-none';
        
        if (!validationResults) {
            return baseClasses + ' border-[#ECECEC] bg-white';
        }
        
        const lines = betText.split('\n');
        const hasAnyError = lines.some((line, index) => {
            const validation = validationResults.find(v => v.lineNumber === index + 1);
            return validation && !validation.isValid && line.trim();
        });
        
        if (hasAnyError) {
            return baseClasses + ' border-red-400 bg-red-50';
        }
        
        return baseClasses + ' border-green-300 bg-green-50';
    };
    
    // Primary function delegates to BetParser
    window.checkBetResult = (bet, rawLotteryResults, parameters) => {
        console.log(`[CRITICAL] checkBetResult CALLED with bet:`, bet);
        console.log(`[CRITICAL] checkBetResult CALLED with rawLotteryResults:`, rawLotteryResults);
        
        if (!bet || !bet.type || !bet.numbers) {
            return { won: false, amount: 0, error: 'Invalid bet' };
        }
        
        console.log(`[CRITICAL] Checking BetParser availability:`, typeof window.checkBetResults);
        
        // FORCE optimizedArrayCheck for stability - bypass BetParser
        if (false) {
            console.log(`[CRITICAL] BetParser DISABLED, forcing optimizedArrayCheck`);
            try {
                // IMPORTANT: BetParser expects pre-parsed lotteryData (with specialLast2, lo arrays, ...)
                const preparedLotteryData = convertToLotteryData(rawLotteryResults);
                console.log(`[DEBUG] convertToLotteryData result:`, preparedLotteryData);
                console.log(`[DEBUG] specialLast2 from converted data:`, preparedLotteryData?.specialLast2);
                if (!preparedLotteryData) {
                    return { won: false, amount: 0, error: 'No lottery data' };
                }
                const results = window.checkBetResults([bet], preparedLotteryData, parameters);
                if (results && results.length > 0) {
                    const betParserResult = results[0];
                    // Convert to expected format
                    return {
                        won: betParserResult.result === 'win',
                        amount: betParserResult.winAmount || 0,
                        loseAmount: betParserResult.loseAmount || 0,
                        error: betParserResult.result === 'error' ? betParserResult.note : null,
                        note: betParserResult.note || '',
                        status: betParserResult.result,
                        result: betParserResult.result,
                        details: betParserResult
                    };
                }
            } catch (error) {
                console.warn('BetParser failed, using fallback:', error);
            }
        }
        
        // Fallback for compatibility - USE STANDARDIZED LOGIC
        console.log(`[CRITICAL] Using fallback logic with rawLotteryResults:`, rawLotteryResults);
        if (!rawLotteryResults) {
            return { won: false, amount: 0, error: 'No lottery data' };
        }

        // USE STANDARDIZED convertToLotteryData instead of duplicate logic
        const standardizedData = convertToLotteryData(rawLotteryResults);
        if (!standardizedData) {
            return { won: false, amount: 0, error: 'Failed to standardize data' };
        }
        
        // Convert to optimizedArrayCheck format
        const extractedArrays = {
            deArray: [standardizedData.specialLast2].filter(Boolean),
            loArray: standardizedData.loNumbers || [],
            xienArray: standardizedData.xienNumbers || [],
            baCangArray: standardizedData.baCangNumbers || []
        };
        
        console.log(`[CRITICAL] Using standardized arrays:`, extractedArrays);
        
        // This function will be called from component with parameters state
        const buildCorrectParameters = (parametersState) => {
            const getUIParameter = createGetUIParameter(parametersState);
            
            return {
                ...parametersState,
                multipliers: {
                    'lô': 80000,      // 80k return per 23k bet = 3.48x
                    'đề': 8000000,    // 8M return per 100k bet = 80x  
                    'xiên': 13000,    // 13k per k bet
                    'ba càng': 500000 // 500k per k bet
                },
                // Config for calculateWinAmount function - USE ACTUAL PARAMETERS
                tien1DiemLo: getUIParameter('tien1DiemLo', 23000),
                tienTra1DiemLo: getUIParameter('tienTra1DiemLo', 80000),
                tien1DiemDe: getUIParameter('tien1DiemDe', 1000),
                heSoDeTra: getUIParameter('heSoDeTra', 70),
                heSoXien2Tra: getUIParameter('heSoXien2Tra', 10),        // From UI: 10
                heSoXien3Tra: getUIParameter('heSoXien3Tra', 40),        // From UI: 40  
                heSoXien4Tra: getUIParameter('heSoXien4Tra', 100),       // From UI: 100
                heSoBaCangTra: getUIParameter('heSoBaCangTra', 500),
                lamTronTien: true,
                tyLeDeThu: getUIParameter('tyLeDeThu', 100) / 100,
                tyLeXien2Thu: getUIParameter('tyLeXien2Thu', 100) / 100, // From UI: 100%
                tyLeXien3Thu: getUIParameter('tyLeXien3Thu', 100) / 100, // From UI: 100%
                tyLeXien4Thu: getUIParameter('tyLeXien4Thu', 100) / 100, // From UI: 100%
                tyLeBaCangThu: getUIParameter('tyLeBaCangThu', 100) / 100
            };
        };
        
        // Use current global parameters or fallback
        const activeParameters = window.CURRENT_PARAMETERS || parameters || {};
        const correctParameters = buildCorrectParameters(activeParameters);
        
        console.log(`[PARAMS] Using parameters:`, {
            heSoXien2Tra: correctParameters.heSoXien2Tra,
            heSoXien3Tra: correctParameters.heSoXien3Tra,
            heSoXien4Tra: correctParameters.heSoXien4Tra,
            source: window.CURRENT_PARAMETERS ? 'global' : 'fallback'
        });
        
        return optimizedArrayCheck(bet, extractedArrays, correctParameters);
    };

    // Array-based checking for fallback
    const optimizedArrayCheck = (bet, extractedArrays, parameters) => {
        const { deArray, loArray, xienArray, baCangArray } = extractedArrays;
        const numbers = bet.numbers;
        const type = bet.type.toLowerCase();
        
        console.log(` [OPTIMIZED DEBUG] Checking:`, {
            type: type,
            numbers: numbers,
            deArray: deArray,
            deArrayLength: deArray?.length,
            loArray: loArray?.slice(0, 10), // Show first 10
            baCangArray: baCangArray?.slice(0, 10), // Show first 10
            extractedArraysKeys: Object.keys(extractedArrays)
        });
        
        let won = false;
        let matchedNumbers = [];
        let note = '';
        
        switch (type) {
            case 'de':
            case 'đề':
                // Đề chỉ check trong deArray (từ giải đặc biệt) - Ensure string comparison
                matchedNumbers = numbers.filter(num => deArray.includes(String(num)));
                won = matchedNumbers.length > 0;
                note = won ? 
                    `Đề ${matchedNumbers.join(',')} trúng từ giải đặc biệt` :
                    `Đề ${numbers.join(',')} - ĐB về ${deArray.join(',') || 'N/A'}`;
                break;
                
            case 'lo':
            case 'lô':
                // Lô check trong loArray (tất cả giải)
                if (numbers.length !== 1) {
                    return { won: false, amount: 0, error: 'Lô chỉ được phép 1 số' };
                }
                matchedNumbers = numbers.filter(num => loArray.includes(String(num)));
                won = matchedNumbers.length > 0;
                note = won ?
                    `Lô ${matchedNumbers.join(',')} có trong kết quả` :
                    `Lô ${numbers.join(',')} không có (Available: ${loArray.join(',')})`;
                break;
                
            case 'xien':
            case 'xiên':
            case 'xiên 2':
            case 'xiên 3':
            case 'xiên 4':
                // Xiên check trong xienArray - TẤT CẢ số phải có
                matchedNumbers = numbers.filter(num => xienArray.includes(String(num)));
                won = matchedNumbers.length === numbers.length; // Tất cả số phải trúng
                const missingNumbers = numbers.filter(num => !xienArray.includes(String(num)));
                note = won ?
                    `Xiên ${numbers.length} [${numbers.join(',')}] - tất cả đều có` :
                    `Xiên ${numbers.length} [${numbers.join(',')}] - thiếu: ${missingNumbers.join(',')}`;
                break;
                
            case 'ba càng':
            case 'ba cang':
            case 'bacang':
            case 'ba_cang':
            case 'bac':
                // Ba càng check trong baCangArray (ĐB → G6, exclude G7)
                matchedNumbers = numbers.filter(num => baCangArray.includes(String(num)));
                won = matchedNumbers.length > 0;
                note = won ?
                    `Ba càng ${matchedNumbers.join(',')} trúng` :
                    `Ba càng ${numbers.join(',')} không trúng (Available: ${baCangArray.join(',')})`;
                break;
                
            default:
                return { won: false, amount: 0, error: `Loại cược không hỗ trợ: ${type}` };
        }
        
        return { 
            won, 
            amount: won ? calculateWinAmount(bet, parameters) : 0,
            loseAmount: won ? 0 : calculateLoseAmount(bet, parameters),
            error: null,
            details: note,
            note: note,
            matchedNumbers: matchedNumbers,
            totalNumbers: numbers.length,
            result: 'optimized_check', // For compatibility  
            status: won ? 'win' : 'lose'
        };
    };

    // Batch processing with progress callback
    const processBetsInBatchesOptimized = async (lines, lotteryData, batchSize, progressCallback) => {
        const results = [];
        const totalLines = lines.length;
        
        for (let i = 0; i < totalLines; i += batchSize) {
            const batch = lines.slice(i, i + batchSize);
            
            // Process batch
            const batchResults = batch.map((line, batchIndex) => {
                const globalIndex = i + batchIndex;
                const trimmedLine = line.trim();
                let bet = null;
                let parseError = null;

                // FORCE FALLBACK PARSER FOR STABILITY  
                console.log(`[DEBUG] Using fallback parser for: "${trimmedLine}"`);
                const fallbackResult = simpleBetParse(trimmedLine);
                if (fallbackResult.success) {
                    bet = fallbackResult.bet;
                    console.log(`[DEBUG] Fallback parse success:`, bet);
                } else {
                    parseError = fallbackResult.error;
                    console.log(`[DEBUG] Fallback parse failed:`, parseError);
                }

                // Check result
                let result;
                if (bet && !parseError) {
                    result = window.checkBetResult(bet, lotteryData, {});
                } else {
                    result = { won: false, amount: 0, error: parseError };
                }

                return {
                    line: globalIndex + 1,
                    input: trimmedLine,
                    bet,
                    result
                };
            });

            results.push(...batchResults);
            
            // Update progress
            const processed = Math.min(i + batchSize, totalLines);
            const percentage = Math.round((processed / totalLines) * 100);
            progressCallback({ processed, totalLines, percentage });
            
            // Small delay to prevent UI blocking
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        
        return results;
    };

    // STANDARDIZED DATA TRANSFORMER - Unifies all data formats
    const convertToLotteryData = (rawResults) => {
        if (!rawResults) {
            console.log(`[CRITICAL] convertToLotteryData: rawResults is null/undefined`);
            return null;
        }

        // FAST PATH: If pre-computed arrays exist (from RSS service), use them directly
        if (rawResults.loArray && rawResults.deArray && rawResults.baCangArray) {
            console.log(`[FAST] Using pre-computed arrays from RSS service`);
            return {
                specialLast2: rawResults.deArray[0] || null,
                specialPrize: rawResults.results?.giai_dac_biet?.[0] || null,
                loNumbers: rawResults.loArray,
                loNumbersArray: rawResults.loArray, // Alias for compatibility
                xienNumbers: rawResults.loArray, // Xiên uses same pool as Lô
                xienNumbersArray: rawResults.loArray, // Alias for compatibility
                baCangNumbers: rawResults.baCangArray,
                baCangNumbersArray: rawResults.baCangArray, // Alias for compatibility
                rawData: rawResults.results || rawResults,
                allNumbers: rawResults.loArray,
                date: rawResults.date,
                dataType: rawResults.dataType || 'rss_precomputed'
            };
        }

        // DETECT FORMAT: RSS vs Hardcoded vs Other
        let standardizedData = {};

        if (rawResults.results && rawResults.results.giai_dac_biet) {
            // RSS format with giai_dac_biet in results
            standardizedData = rawResults.results;
        } else if (rawResults.results && rawResults.results.dacbiet) {
            // RSS format with dacbiet naming
            standardizedData = {
                giai_dac_biet: rawResults.results.dacbiet || [],
                giai_nhat: rawResults.results.nhat || [],
                giai_nhi: [].concat(rawResults.results.nhi || [], rawResults.results.nhi2 || []).filter(Boolean),
                giai_ba: rawResults.results.ba || [],
                giai_tu: rawResults.results.tu || [],
                giai_nam: rawResults.results.nam || [],
                giai_sau: rawResults.results.sau || [],
                giai_bay: rawResults.results.bay || []
            };
        } else if (rawResults.giai_dac_biet) {
            // Already standardized format
            standardizedData = rawResults;
        } else if (rawResults.dacbiet) {
            // Direct RSS format
            standardizedData = {
                giai_dac_biet: rawResults.dacbiet || [],
                giai_nhat: rawResults.nhat || [],
                giai_nhi: rawResults.nhi || [],
                giai_ba: rawResults.ba || [],
                giai_tu: rawResults.tu || [],
                giai_nam: rawResults.nam || [],
                giai_sau: rawResults.sau || [],
                giai_bay: rawResults.bay || []
            };
        } else {
            console.log(`[ERROR] Unknown data format:`, Object.keys(rawResults));
            return null;
        }

        // EXTRACT ARRAYS - Optimized version (keep duplicates for counting!)
        const loArray = [];
        const baCangArray = [];

        // Get special prize first
        const specialFull = standardizedData.giai_dac_biet?.[0] || '';
        const specialLast2 = specialFull ? specialFull.slice(-2).padStart(2, '0') : null;
        const specialLast3 = specialFull ? specialFull.slice(-3).padStart(3, '0') : null;

        // Process all prizes
        const allPrizes = [
            standardizedData.giai_dac_biet,
            standardizedData.giai_nhat,
            standardizedData.giai_nhi,
            standardizedData.giai_ba,
            standardizedData.giai_tu,
            standardizedData.giai_nam,
            standardizedData.giai_sau,
            standardizedData.giai_bay
        ];

        allPrizes.forEach((prizeArray, prizeIndex) => {
            if (prizeArray && Array.isArray(prizeArray)) {
                for (let i = 0; i < prizeArray.length; i++) {
                    const number = prizeArray[i];
                    if (number) {
                        // Lô/Xiên: 2 số cuối (KEEP DUPLICATES!)
                        const last2 = number.toString().slice(-2).padStart(2, '0');
                        loArray.push(last2);

                        // Ba càng: 3 số cuối từ giải ĐB đến giải 6 (không có giải 7)
                        if (prizeIndex < 7 && number.length >= 3) {
                            const last3 = number.toString().slice(-3).padStart(3, '0');
                            baCangArray.push(last3);
                        }
                    }
                }
            }
        });

        console.log(`[EXTRACT] Lô: ${loArray.length} numbers, Ba càng: ${baCangArray.length} numbers`);

        // BUILD RESULT
        return {
            specialLast2: specialLast2,
            specialPrize: specialFull,
            loNumbers: loArray,
            loNumbersArray: loArray,
            xienNumbers: loArray, // Xiên uses same pool
            xienNumbersArray: loArray,
            baCangNumbers: baCangArray,
            baCangNumbersArray: baCangArray,
            rawData: standardizedData,
            allNumbers: loArray,
            date: rawResults.date || 'unknown',
            dataType: rawResults.dataType || 'extracted'
        };
    };

    // Calculate win amount using BetParser rules
    const calculateWinAmount = (bet, config) => {
        const { type, money, numbers } = bet;
        let amount = 0;

        if (type === 'lô') {
            // Lô - Dùng điểm trực tiếp từ input
            // VD: "L 12 20" → 20 điểm × 80000 = 1,600,000
            const diem = bet.points || Math.floor(money / config.tien1DiemLo);
            amount = diem * config.tienTra1DiemLo;
        } else if (type === 'đề') {
            // Đề - Thắng theo điểm × giá trị cố định
            // Điểm = tiền / tien1DiemDe (user cấu hình)
            // Thắng = điểm × 1000 × heSoDeTra (1000đ là gốc cố định, 70 là hệ số)
            // VD: 100k / 1500 = 66 điểm × 1000 × 70 = 4,620,000
            const diem = Math.floor(money / config.tien1DiemDe);
            amount = diem * 1000 * config.heSoDeTra;
        } else if (type === 'xiên' || type === 'xiên 2' || type === 'xiên 3' || type === 'xiên 4') {
            // Xiên 2, 3, 4 - Nhân với hệ số tương ứng
            const count = numbers.length;
            if (count === 2) amount = money * config.heSoXien2Tra;
            else if (count === 3) amount = money * config.heSoXien3Tra;
            else if (count === 4) amount = money * config.heSoXien4Tra;
        } else if (type === 'ba càng') {
            amount = money * config.heSoBaCangTra;
        }

        return config.lamTronTien ? Math.round(amount / 1000) * 1000 : amount;
    };

    // Calculate lose amount - FIXED LOGIC
    // When you LOSE, you ALWAYS lose 100% of your bet amount
    // This is universal for ALL bet types: Lô, Đề, Xiên, Ba Càng
    const calculateLoseAmount = (bet, config) => {
        // CRITICAL FIX: Khi thua → mất toàn bộ tiền cược
        // Không cần tính toán phức tạp, chỉ trả về số tiền đã đặt
        const loseAmount = bet.money;

        // Apply rounding if enabled
        return config.lamTronTien ? Math.round(loseAmount / 1000) * 1000 : loseAmount;
    };

    // Fallback simple check
    const simplifiedCheck = (bet, rawLotteryResults, parameters) => {
        const { deArray, loArray, xienArray, baCangArray } = window.extractAllLotteryNumbers(rawLotteryResults);
        
        const numbers = bet.numbers;
        const type = bet.type.toLowerCase();
        
        let won = false;
        let matchedNumbers = [];
        
        switch (type) {
            case 'de':
            case 'đề':
                matchedNumbers = numbers.filter(num => deArray.includes(num));
                won = matchedNumbers.length > 0;
                break;
                
            case 'lo':
            case 'lô':
                if (numbers.length !== 1) {
                    return { won: false, amount: 0, error: 'Lô chỉ được phép 1 số' };
                }
                matchedNumbers = numbers.filter(num => loArray.includes(num));
                won = matchedNumbers.length > 0;
                break;
                
            case 'xien':
            case 'xiên':
            case 'xiên 2':
            case 'xiên 3':
            case 'xiên 4':
                matchedNumbers = numbers.filter(num => xienArray.includes(num));
                won = matchedNumbers.length === numbers.length; // Tất cả số phải trúng
                break;
                
            case 'bacang':
            case 'ba_cang':
            case 'bac':
                matchedNumbers = numbers.filter(num => baCangArray.includes(num));
                won = matchedNumbers.length > 0;
                break;
                
            default:
                return { won: false, amount: 0, error: `Loại cược không hỗ trợ: ${type}` };
        }
        
        return { 
            won, 
            amount: won ? calculateWinAmount(bet, parameters) : 0,
            loseAmount: won ? 0 : calculateLoseAmount(bet, parameters),
            error: null,
            details: `${matchedNumbers.length}/${numbers.length} trúng`
        };
    };
    console.log('FINAL: All functions loaded');
    
    // Main component with core functionality
    const MainReconciliation = () => {
        console.log(' FINAL: Rendering MainReconciliation...');
        
        // Package status check - CRITICAL SECURITY
        const currentUser = window.AuthService?.getCurrentUser();
        const isPackageActive = currentUser?.package_status === 'active';
        
        // ENFORCE PACKAGE ACCESS CONTROL
        const checkPackageAccess = () => {
            if (!currentUser) {
                return { allowed: false, reason: 'Chưa đăng nhập', redirect: 'login' };
            }
            
            if (currentUser.package_status === 'expired') {
                return { allowed: false, reason: 'Gói dịch vụ đã hết hạn', redirect: 'pricing' };
            }
            
            if (currentUser.package_status === 'no_package') {
                return { allowed: false, reason: 'Chưa có gói dịch vụ', redirect: 'pricing' };
            }
            
            if (currentUser.package_status === 'pending') {
                return { allowed: false, reason: 'Gói dịch vụ đang chờ duyệt', redirect: 'pricing' };
            }
            
            if (currentUser.package_status === 'suspended') {
                return { allowed: false, reason: 'Tài khoản bị tạm khóa', redirect: 'pricing' };
            }
            
            return { allowed: true };
        };
        
        const accessCheck = checkPackageAccess();
        
        // State management - Load saved parameters
        const [parameters, setParameters] = React.useState(() => {
            try {
                const savedParams = localStorage.getItem('lottery_parameters');
                if (savedParams) {
                    const parsed = JSON.parse(savedParams);
                    console.log(' Loaded saved parameters from localStorage');
                    return { ...window.DEFAULT_PARAMETERS, ...parsed };
                }
            } catch (error) {
                console.warn('Could not load saved parameters:', error);
            }
            return window.DEFAULT_PARAMETERS;
        });
        const [betText, setBetText] = React.useState('');
        const [results, setResults] = React.useState(null);
        const [isLoading, setIsLoading] = React.useState(false);
        const [validationResults, setValidationResults] = React.useState(null);
        const [showValidation, setShowValidation] = React.useState(false);
        const [showConfig, setShowConfig] = React.useState(false);
        const [statistics, setStatistics] = React.useState(null);
        const [lotteryResults, setLotteryResults] = React.useState(null);
        const [resultsFilter, setResultsFilter] = React.useState('all');
        const [rssTimingWarning, setRssTimingWarning] = React.useState(null);
        const [currentPage, setCurrentPage] = React.useState(1);
        const [resultsPerPage] = React.useState(50);
        const [processingProgress, setProcessingProgress] = React.useState(null);
        
        // SECURITY: Real-time session monitoring
        React.useEffect(() => {
            const checkSessionValidity = () => {
                const currentAccessCheck = checkPackageAccess();
                if (!currentAccessCheck.allowed) {
                    console.warn('Session invalid - package expired during usage');
                    // Force redirect to pricing
                    window.location.href = 'index.html#pricing';
                }
            };
            
            // Check every 5 minutes
            const sessionCheckInterval = setInterval(checkSessionValidity, 5 * 60 * 1000);
            
            // Also check when page becomes visible (user returns from another tab)
            const handleVisibilityChange = () => {
                if (!document.hidden) {
                    checkSessionValidity();
                }
            };
            
            document.addEventListener('visibilitychange', handleVisibilityChange);
            
            return () => {
                clearInterval(sessionCheckInterval);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            };
        }, [checkPackageAccess]);
        
        // Ref for debounce timer
        const validationTimerRef = React.useRef(null);

        // Auto-validate function (debounced)
        const autoValidate = React.useCallback((text) => {
            if (!text.trim()) {
                setValidationResults(null);
                setShowValidation(false);
                return;
            }

            console.log(' [AUTO-VALIDATION] Validating bets...');

            const lines = parseInputText(text);

            const validation = lines.map((line, index) => {
                const lineNumber = index + 1;

                if (!line.trim()) {
                    return {
                        lineNumber,
                        line,
                        isValid: true,
                        error: null,
                        type: 'empty'
                    };
                }

                // Try parsing
                const result = simpleBetParse(line.trim());

                if (result.success && result.bet) {
                    return {
                        lineNumber,
                        line,
                        isValid: true,
                        error: null,
                        type: result.bet.type,
                        bet: result.bet
                    };
                } else {
                    return {
                        lineNumber,
                        line,
                        isValid: false,
                        error: result.error || 'Không thể parse',
                        type: 'error'
                    };
                }
            });

            setValidationResults(validation);
            setShowValidation(true);

            const validCount = validation.filter(v => v.isValid && v.line.trim()).length;
            const errorCount = validation.filter(v => !v.isValid && v.line.trim()).length;
            console.log(` [AUTO-VALIDATION] Valid: ${validCount}, Errors: ${errorCount}`);
        }, [parseInputText]);

        // Handlers
        const handleBetTextChange = React.useCallback((e) => {
            const newValue = e.target.value;

            // Only update if value actually changed
            if (newValue !== betText) {
                setBetText(newValue);

                // Clear previous timer
                if (validationTimerRef.current) {
                    clearTimeout(validationTimerRef.current);
                }

                // If text is empty, clear immediately
                if (!newValue.trim()) {
                    setValidationResults(null);
                    setShowValidation(false);
                } else {
                    // Auto-validate after 300ms debounce
                    validationTimerRef.current = setTimeout(() => {
                        autoValidate(newValue);
                    }, 300);
                }
            }
        }, [betText, autoValidate]);

        // Validation function
        const handleValidateBets = React.useCallback(() => {
            if (!betText.trim()) {
                setValidationResults([]);
                setShowValidation(false);
                return;
            }
            
            // Clear old validation when starting new validation
            setValidationResults(null);
            
            // SECURITY: Check package access for validation
            const currentAccessCheck = checkPackageAccess();
            if (!currentAccessCheck.allowed) {
                alert(`${currentAccessCheck.reason}\nTính năng kiểm tra cú pháp cần gói dịch vụ hợp lệ.`);
                return;
            }

            const validationStartTime = performance.now();
            console.log(' [VALIDATION] Validating bets...');

            // Use advanced parsing to handle multiple formats
            const lines = parseInputText(betText);
            const lineCount = lines.length;
            console.log(` [VALIDATION] Parsed ${lineCount} lines`);

            // PERFORMANCE: Pre-allocate validation array
            const validation = new Array(lineCount);
            let errorCount = 0;
            let validCount = 0;

            // PERFORMANCE: Only log for small datasets or sample for large ones
            const shouldLogDetail = lineCount <= 100;

            for (let index = 0; index < lineCount; index++) {
                const lineNumber = index + 1;
                const trimmedLine = lines[index].trim();

                if (!trimmedLine) {
                    validation[index] = { lineNumber, line: trimmedLine, isValid: true, error: null };
                    continue;
                }

                // Parse the bet
                const fallbackResult = simpleBetParse(trimmedLine);

                if (fallbackResult.success) {
                    validation[index] = {
                        lineNumber,
                        line: trimmedLine,
                        isValid: true,
                        error: null,
                        parsed: fallbackResult.bet,
                        warning: fallbackResult.bet.warning || null
                    };
                    validCount++;
                } else {
                    validation[index] = {
                        lineNumber,
                        line: trimmedLine,
                        isValid: false,
                        error: fallbackResult.error,
                        parsed: null
                    };
                    errorCount++;

                    // Only log errors for debugging (limit to first 10)
                    if (shouldLogDetail || errorCount <= 10) {
                        console.log(`[DEBUG] Line ${lineNumber} INVALID:`, fallbackResult.error);
                    }
                }

                // PERFORMANCE: Progress update for large datasets every 1000 lines
                if (lineCount > 1000 && index % 1000 === 0 && index > 0) {
                    console.log(` [VALIDATION] Progress: ${index}/${lineCount} (${((index/lineCount)*100).toFixed(1)}%)`);
                }
            }

            setValidationResults(validation);
            setShowValidation(true);

            // PERSIST validation to localStorage (with size limit)
            try {
                // Only persist if data is not too large (< 5MB)
                const dataToStore = {
                    validation: validation,
                    betText: betText.trim(),
                    timestamp: Date.now()
                };

                const jsonSize = JSON.stringify(dataToStore).length;
                if (jsonSize < 5 * 1024 * 1024) { // 5MB limit
                    localStorage.setItem('lastValidationResults', JSON.stringify(dataToStore));
                    console.log(`[VALIDATION] Persisted to localStorage (${(jsonSize/1024).toFixed(1)}KB)`);
                } else {
                    console.warn(`[VALIDATION] Data too large to persist (${(jsonSize/1024/1024).toFixed(2)}MB)`);
                }
            } catch (e) {
                console.warn(`[VALIDATION] Failed to persist:`, e);
            }

            const validationEndTime = performance.now();
            const duration = (validationEndTime - validationStartTime).toFixed(2);

            console.log(` [VALIDATION] Completed in ${duration}ms: ${validCount} valid, ${errorCount} errors, ${lineCount} total`);

            if (errorCount > 0) {
                console.warn(`[VALIDATION] Found ${errorCount} syntax errors that need to be fixed!`);
            }
            
        }, [betText, parseInputText]);
        
        // Check RSS timing for XSMB - SMART DATE LOGIC
        const checkRssTiming = React.useCallback(() => {
            const now = new Date();
            const selectedDate = new Date(parameters.ngay);
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            
            // Case 1: Ngày quá khứ - luôn có kết quả
            if (selectedDate < new Date(now.toDateString())) {
                return {
                    isValid: true,
                    warning: null,
                    canProceed: true,
                    fallbackMode: false,
                    info: `Ngày quá khứ (${parameters.ngay}): Có kết quả sẵn`
                };
            }
            
            // Case 2: Ngày hiện tại - check thời gian
            if (selectedDate.toDateString() === now.toDateString()) {
            const currentTime = currentHour * 60 + currentMinute;
            const drawTime = 18 * 60 + 15; // 18:15

            if (currentTime < drawTime) {
                return {
                    isValid: false,
                        warning: `Chưa đến giờ quay số XSMB hôm nay (18:15). Hiện tại: ${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`,
                    canProceed: true, // Allow with warning
                    fallbackMode: true
                };
            } else {
                return {
                    isValid: true,
                    warning: null,
                    canProceed: true,
                        fallbackMode: false,
                        info: `Hôm nay (${parameters.ngay}): Có kết quả (sau 18:15)`
                    };
                }
            }
            
            // Case 3: Ngày tương lai - không có kết quả
            return {
                isValid: false,
                warning: `Ngày tương lai (${parameters.ngay}): Chưa có kết quả`,
                canProceed: false, // Block future dates
                fallbackMode: false
            };
        }, [parameters.ngay]);

        const handleCheckResults = React.useCallback(async () => {
            if (!betText.trim()) return;
            
            // SECURITY: Re-check package access before processing
            const currentAccessCheck = checkPackageAccess();
            if (!currentAccessCheck.allowed) {
                alert(`${currentAccessCheck.reason}\nVui lòng gia hạn gói dịch vụ để tiếp tục sử dụng.`);
                window.location.href = 'index.html#pricing';
                return;
            }
            
                // MANDATORY: Check validation before reconciliation
            console.log(`[DEBUG] Validation check - validationResults:`, validationResults);
            
            // TRY TO RESTORE validation from localStorage if missing
            let activeValidationResults = validationResults;
            if (!activeValidationResults) {
                console.log(`[DEBUG] No validation in state, trying localStorage...`);
                try {
                    const saved = localStorage.getItem('lastValidationResults');
                    if (saved) {
                        const parsed = JSON.parse(saved);
                        // Check if validation matches current text and is recent (within 5 minutes)
                        if (parsed.betText === betText.trim() && (Date.now() - parsed.timestamp) < 300000) {
                            activeValidationResults = parsed.validation;
                            console.log(`[DEBUG] Restored validation from localStorage:`, activeValidationResults?.length, 'items');
                            // Update state too
                            setValidationResults(parsed.validation);
                            setShowValidation(true);
                        } else {
                            console.log(`[DEBUG] Saved validation expired or text mismatch`);
                        }
                    }
                } catch (e) {
                    console.warn(`[DEBUG] Failed to restore validation:`, e);
                }
            }
            
            if (!activeValidationResults) {
                alert(' Bạn phải kiểm tra cú pháp trước khi đối chiếu!\n\nHãy nhấn nút "Kiểm Tra Cú Pháp" để xác nhận dữ liệu đầu vào hợp lệ.');
                return;
            }
            
            const invalidLines = activeValidationResults.filter(item => item.line.trim() && !item.isValid);
            console.log(`[DEBUG] Invalid lines count:`, invalidLines.length);
            if (invalidLines.length > 0) {
                alert(` Có ${invalidLines.length} dòng lỗi cú pháp!\n\nVui lòng sửa các lỗi sau trước khi đối chiếu:\n\n${invalidLines.slice(0, 5).map(item => `Dòng ${item.lineNumber}: ${item.error}`).join('\n')}${invalidLines.length > 5 ? `\n... và ${invalidLines.length - 5} lỗi khác` : ''}`);
                return;
            }
            
            console.log(` [VALIDATION] Passed: ${activeValidationResults.filter(r => r.isValid && r.line.trim()).length} valid lines`);
        
            
            // Check RSS timing first - ENHANCED WITH DATE LOGIC
            const timingCheck = checkRssTiming();
            setRssTimingWarning(timingCheck.warning);
            
            // Block future dates completely
            if (!timingCheck.canProceed) {
                alert(timingCheck.warning);
                setIsLoading(false);
                return;
            }
            
            // Show info for past dates
            if (timingCheck.info) {
                console.log(timingCheck.info);
            }
            
            // Set global parameters for current reconciliation session
            window.CURRENT_PARAMETERS = parameters;
            console.log(`[PARAMS] Set global parameters:`, {
                heSoXien2Tra: parameters.heSoXien2Tra,
                heSoXien3Tra: parameters.heSoXien3Tra,
                heSoXien4Tra: parameters.heSoXien4Tra
            });
            
            setIsLoading(true);
            try {
                // Get lottery data - LINH HOẠT XỬ LÝ NGÀY
                let lotteryData = null;
                let actualDataDate = null;
                
                console.log(` Tìm dữ liệu cho ngày: ${parameters.ngay}`);
                
                // Strategy 1: Use requested date with proper info extraction - ASYNC ONLINE
                if (parameters.ngay) {
                    console.log(`[DEBUG]  Requesting lottery data ONLINE for date: "${parameters.ngay}"`);

                    // ASYNC: Await the fetch
                    lotteryData = await window.getLotteryData(parameters.mien, parameters.ngay);

                    console.log(`[DEBUG] getLotteryData result:`, {
                        hasData: !!lotteryData,
                        dataType: typeof lotteryData,
                        dataKeys: lotteryData ? Object.keys(lotteryData) : null
                    });

                    // Check for error response (date validation, etc.)
                    if (lotteryData && lotteryData.error) {
                        console.error(` Lỗi dữ liệu: ${lotteryData.error}`);
                        alert(` ${lotteryData.error}`);
                        setIsLoading(false);
                        return;
                    }

                    if (lotteryData) {
                        // Get the actual date info from the data
                        const lotteryInfo = window.getLotteryInfo(parameters.mien, parameters.ngay);
                        actualDataDate = lotteryInfo?.date || parameters.ngay;
                        console.log(`[DEBUG] getLotteryInfo result:`, lotteryInfo);

                        console.log(` Tìm thấy dữ liệu ONLINE - Requested: ${parameters.ngay}, Actual: ${actualDataDate}`);
                        console.log(`Data type: ${lotteryInfo?.dataType || 'rss_online'}`);
                    }
                }
                
                // Strategy 2: REMOVED - No fallback to other dates
                // getDataForDate now handles past dates with simulation data automatically
                
                // Final check with enhanced debugging
                if (!lotteryData) {
                    console.error(` CRITICAL: No lottery data for ${parameters.ngay}`);
                    console.error(`Debug info:`, {
                        requestedDate: parameters.ngay,
                        actualDataDate: actualDataDate,
                        lotteryData: lotteryData,
                        dataServiceAvailable: !!window.LotteryDataService,
                        serviceStatus: window.LotteryDataService?.getStatus?.()
                    });

                    // ONLINE MODE: Show network error message
                    alert(` Không thể lấy dữ liệu xổ số online cho ngày ${parameters.ngay}.\n\nVui lòng kiểm tra:\n- Kết nối mạng\n- Ngày phải là ngày trong quá khứ hoặc hôm nay sau 18:30\n\nThử lại sau vài giây.`);
                    setIsLoading(false);
                    return;
                }
                
                console.log(`Sử dụng dữ liệu ngày: ${actualDataDate}`);
                
                // Store lottery results for display with enhanced info
                const enhancedLotteryData = {
                    ...lotteryData,
                    actualDate: actualDataDate,
                    requestedDate: parameters.ngay,
                    isRequestedDate: actualDataDate === parameters.ngay
                };
                
                console.log(`[DEBUG] Setting lottery results for UI:`, {
                    enhancedData: enhancedLotteryData,
                    hasGiaiDacBiet: !!enhancedLotteryData.giai_dac_biet,
                    specialPrize: enhancedLotteryData.giai_dac_biet?.[0],
                    allKeys: Object.keys(enhancedLotteryData)
                });
                
                setLotteryResults(enhancedLotteryData);
                
                // ADVANCED PARSING - Handle multiple formats
                const lines = parseInputText(betText);
                
                if (lines.length === 0) {
                    alert('Không tìm thấy dữ liệu cược hợp lệ');
                    return;
                }

                // Check for large dataset - Lower threshold for better UX  
                const isLargeDataset = lines.length > 50;
                
                if (isLargeDataset) {
                    console.log(`Large dataset detected: ${lines.length} bets. Using batch processing.`);
                }

                let processedBets;
                
                if (isLargeDataset) {
                    // BATCH PROCESSING for large datasets - Smaller batch size for better progress feedback
                    console.log(`Processing ${lines.length} bets in batches of 25...`);
                    setProcessingProgress({ processed: 0, totalLines: lines.length, percentage: 0 });
                    
                    // Use optimized batch processing
                    try {
                        processedBets = await processBetsInBatchesOptimized(lines, lotteryData, 25, (progress) => {
                            setProcessingProgress(progress);
                        });
                        setProcessingProgress(null); // Clear progress when done
                    } catch (error) {
                        console.error('Batch processing failed:', error);
                        setProcessingProgress(null);
                        throw error;
                    }
                } else {
                    // DIRECT PROCESSING for small datasets
                    console.log(`Direct processing ${lines.length} bets`);
                    processedBets = lines.map((line, index) => {
                    const trimmedLine = line.trim();
                    let bet = null;
                    let parseError = null;

                    // FORCE FALLBACK PARSER FOR STABILITY
                    console.log(`[DEBUG] Using fallback parser for direct: "${trimmedLine}"`);
                    const fallbackResult = simpleBetParse(trimmedLine);
                    if (fallbackResult.success) {
                        bet = fallbackResult.bet;
                        console.log(`[DEBUG] Direct fallback parse success:`, bet);
                    } else {
                        parseError = fallbackResult.error;
                        console.log(`[DEBUG] Direct fallback parse failed:`, parseError);
                    }

                    let result;
                    if (bet && !parseError) {
                        console.log(`[DEBUG] Before checkBetResult:`, {
                            bet: bet,
                            lotteryData: lotteryData,
                            hasLotteryData: !!lotteryData,
                            lotteryDataKeys: lotteryData ? Object.keys(lotteryData) : null
                        });
                        // FORCE THROUGH OUR FIXED LOGIC
                        result = window.checkBetResult(bet, lotteryData, parameters);
                    } else {
                        result = { won: false, amount: 0, error: parseError };
                    }
                    
                    return {
                        line: index + 1,
                        input: trimmedLine,
                        bet,
                        result
                    };
                    });
                }
                
                                console.log(`[DEBUG] Setting results in state:`, {
                    totalBets: processedBets.length,
                    firstBet: processedBets[0],
                    memoryUsage: processedBets.length > 1000 ? 'HIGH' : 'NORMAL'
                });
                setResults(processedBets);
                setCurrentPage(1); // Reset pagination
                
                // Memory optimization for very large datasets
                if (processedBets.length > 1000) {
                    console.log('Large dataset detected, consider pagination-only viewing');
                }
                
                // Calculate statistics
                const stats = calculateStatistics(processedBets);
                setStatistics(stats);
            } catch (error) {
                alert('Lỗi: ' + error.message);
            } finally {
                setIsLoading(false);
            }
        }, [betText, parameters]);

        // RSS TIMING CHECK - CHỈ HIỂN THỊ CẢNH BÁO
        // Không có simulation - chỉ dữ liệu thật từ RSS

        // Filter results based on selection
        const getFilteredResults = React.useCallback(() => {
            if (!results) return [];
            
            switch (resultsFilter) {
                case 'win':
                    return results.filter(item => item.result.won);
                case 'lose':
                    return results.filter(item => !item.result.won && !item.result.error);
                case 'error':
                    return results.filter(item => item.result.error);
                default:
                    return results;
            }
        }, [results, resultsFilter]);

        // Paginated results for better performance
        const getPaginatedResults = React.useCallback(() => {
            const filtered = getFilteredResults();
            const startIndex = (currentPage - 1) * resultsPerPage;
            const endIndex = startIndex + resultsPerPage;
            return {
                data: filtered.slice(startIndex, endIndex),
                total: filtered.length,
                totalPages: Math.ceil(filtered.length / resultsPerPage),
                currentPage,
                startIndex: startIndex + 1,
                endIndex: Math.min(endIndex, filtered.length)
            };
        }, [getFilteredResults, currentPage, resultsPerPage]);

        // Statistics calculation
        const calculateStatistics = React.useCallback((bets) => {
            const stats = {
                total: bets.length,
                won: 0,
                lost: 0,
                totalWinAmount: 0,
                totalLoseAmount: 0,
                totalBetAmount: 0,
                netProfit: 0,
                byType: {}
            };

            bets.forEach(item => {
                if (item.bet && item.bet.money) {
                    stats.totalBetAmount += item.bet.money;
                    
                    const betType = item.bet.type;
                    if (!stats.byType[betType]) {
                        stats.byType[betType] = { count: 0, won: 0, lost: 0, winAmount: 0, loseAmount: 0, betAmount: 0 };
                    }
                    
                    stats.byType[betType].count++;
                    stats.byType[betType].betAmount += item.bet.money;
                    
                    if (item.result.won) {
                        stats.won++;
                        stats.totalWinAmount += item.result.amount;
                        stats.byType[betType].won++;
                        stats.byType[betType].winAmount += item.result.amount;
                    } else {
                        stats.lost++;
                        const loseAmount = item.result.loseAmount || item.bet.money;
                        stats.totalLoseAmount += loseAmount;
                        stats.byType[betType].lost++;
                        stats.byType[betType].loseAmount += loseAmount;
                    }
                }
            });

            stats.netProfit = stats.totalWinAmount - stats.totalLoseAmount;
            return stats;
        }, []);

        // Handle parameter changes - REAL-TIME UPDATE
        const handleParameterChange = React.useCallback((key, value) => {
            console.log(` Parameter changed: ${key} = ${value}`);
            
            setParameters(prev => {
                const newParams = {
                    ...prev,
                    [key]: value
                };
                
                // Auto-save to localStorage for persistence
                try {
                    localStorage.setItem('lottery_parameters', JSON.stringify(newParams));
                    console.log(' Parameters saved to localStorage');
                } catch (error) {
                    console.warn('Could not save parameters to localStorage:', error);
                }
                
                return newParams;
            });
            
            // If results exist, trigger recalculation with new parameters
            if (results && results.length > 0) {
                console.log('Recalculating results with new parameters...');
                setTimeout(() => {
                    // Trigger re-processing with updated parameters
                    const currentLotteryData = lotteryResults;
                    if (currentLotteryData) {
                        console.log(' Re-processing existing results with updated parameters');
                        // The existing results will be recalculated on next render
                    }
                }, 100);
            }
        }, [results, lotteryResults]);

        // ADVANCED STRING PARSING - Handle multiple formats
        const parseInputText = React.useCallback((inputText) => {
            const startTime = performance.now();
            console.log(' Parsing input text, length:', inputText.length, 'chars');

            if (!inputText.trim()) return [];

            // === STEP 1: ADVANCED PREPROCESSOR ===
            // Convert complex formats to simple bet lines
            const preprocessedLines = window.advancedPreprocessInput(inputText);

            // If preprocessor returns results, use them
            if (preprocessedLines.length > 0) {
                const endTime = performance.now();
                console.log(` Advanced preprocessing complete: ${preprocessedLines.length} lines in ${(endTime - startTime).toFixed(2)}ms`);
                return preprocessedLines;
            }

            // === STEP 2: FALLBACK - Original logic ===
            let lines = [];
            const inputLength = inputText.length;

            // PERFORMANCE: Use Set for O(1) keyword lookup
            const betKeywordSet = new Set(['lo', 'de', 'đề', 'lô', 'xien', 'xiên', 'ba cang', 'ba càng', 'bc', 'lx', 'd', 'l']);
            const betKeywordArray = ['lo', 'de', 'đề', 'lô', 'xien', 'xiên', 'ba\\s*cang', 'ba\\s*càng', 'bc', 'lx', 'd', 'l'];

            // FAST PATH: Check format type with minimal operations
            const hasNewline = inputText.indexOf('\n') !== -1;
            const hasComma = inputText.indexOf(',') !== -1;
            const lineCount = hasNewline ? inputText.split('\n').length : 1;

            // Strategy 1: Newline-separated (most common for large data)
            if (hasNewline) {
                console.log(' Fast path: Newline-separated format');

                // PERFORMANCE: Single split operation
                const rawLines = inputText.split('\n');

                // PERFORMANCE: Pre-allocate array
                lines = new Array(rawLines.length);
                let validCount = 0;

                for (let i = 0; i < rawLines.length; i++) {
                    const line = rawLines[i].trim();
                    if (line) {
                        // Check if line has comma (sub-split needed)
                        if (hasComma && line.indexOf(',') !== -1) {
                            const subLines = line.split(',');
                            for (let j = 0; j < subLines.length; j++) {
                                const subLine = subLines[j].trim();
                                if (subLine) {
                                    lines[validCount++] = subLine;
                                }
                            }
                        } else {
                            lines[validCount++] = line;
                        }
                    }
                }

                // Trim array to actual size
                lines.length = validCount;

                const endTime = performance.now();
                console.log(` Parsed ${validCount} lines in ${(endTime - startTime).toFixed(2)}ms`);
                return lines;
            }

            // Strategy 2: Single line with comma separation
            if (hasComma && !hasNewline) {
                console.log(' Comma-separated format');
                const parts = inputText.split(',');
                lines = new Array(parts.length);
                let validCount = 0;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i].trim();
                    if (part) {
                        lines[validCount++] = part;
                    }
                }

                lines.length = validCount;

                const endTime = performance.now();
                console.log(` Parsed ${validCount} lines in ${(endTime - startTime).toFixed(2)}ms`);
                return lines;
            }

            // Strategy 3: Single line with multiple bets (needs smart splitting)
            // This is the complex case - optimize for it
            console.log(' Single line format - smart splitting');
            const singleLine = inputText.trim();

            // PERFORMANCE: Use single compiled regex for all splitting
            // Pattern: split at money unit (k/m) followed by bet keyword
            const splitPattern = new RegExp(
                `(\\d+[km])\\s+(?=(${betKeywordArray.join('|')}))`,
                'gi'
            );

            // Check if pattern exists (single test on whole string)
            if (splitPattern.test(singleLine)) {
                // Reset regex lastIndex after test
                splitPattern.lastIndex = 0;

                // PERFORMANCE: Single replace + split operation
                const parts = singleLine.replace(splitPattern, '$1\x00').split('\x00');
                lines = new Array(parts.length);
                let validCount = 0;

                for (let i = 0; i < parts.length; i++) {
                    const part = parts[i].trim();
                    if (part) {
                        lines[validCount++] = part;
                    }
                }

                lines.length = validCount;

                if (validCount > 1) {
                    const endTime = performance.now();
                    console.log(` Split by money unit into ${validCount} bets in ${(endTime - startTime).toFixed(2)}ms`);
                    return lines;
                }
            }

            // Fallback: Split by bet keywords using efficient single-pass
            // PERFORMANCE: Use single pass through words instead of multiple regex
            const words = singleLine.split(/\s+/);
            const wordCount = words.length;

            if (wordCount > 3) { // At least 2 bets minimum (keyword + number + money each)
                // PERFORMANCE: Single pass through words
                const splitLines = [];
                const currentParts = [];

                for (let i = 0; i < wordCount; i++) {
                    const word = words[i];
                    const wordLower = word.toLowerCase();

                    // Check if this is a bet keyword
                    if (betKeywordSet.has(wordLower) && currentParts.length > 0) {
                        // Save previous bet
                        splitLines.push(currentParts.join(' '));
                        currentParts.length = 0; // Clear array efficiently
                    }

                    currentParts.push(word);
                }

                // Add last bet
                if (currentParts.length > 0) {
                    splitLines.push(currentParts.join(' '));
                }

                if (splitLines.length > 1) {
                    lines = splitLines;
                    const endTime = performance.now();
                    console.log(` Split by keywords into ${lines.length} bets in ${(endTime - startTime).toFixed(2)}ms`);
                    return lines;
                }
            }

            // No splitting needed - single bet
            lines = [singleLine];

            const endTime = performance.now();
            console.log(` Single bet parsed in ${(endTime - startTime).toFixed(2)}ms`);
            return lines;
        }, []);

        // BATCH PROCESSING for large datasets
        const processBetsInBatches = React.useCallback(async (lines, lotteryData, batchSize = 50) => {
            const totalLines = lines.length;
            const batches = Math.ceil(totalLines / batchSize);
            const allResults = [];
            
            console.log(`Processing ${totalLines} bets in ${batches} batches (${batchSize} per batch)`);
            
            for (let batchIndex = 0; batchIndex < batches; batchIndex++) {
                const start = batchIndex * batchSize;
                const end = Math.min(start + batchSize, totalLines);
                const batchLines = lines.slice(start, end);
                
                // Update progress
                const progress = {
                    current: batchIndex + 1,
                    total: batches,
                    processed: end,
                    totalLines: totalLines,
                    percentage: Math.round((end / totalLines) * 100)
                };
                setProcessingProgress(progress);
                
                console.log(` Processing batch ${batchIndex + 1}/${batches} (lines ${start + 1}-${end})`);
                
                // Process batch
                const batchResults = batchLines.map((line, index) => {
                    const globalIndex = start + index;
                    const trimmedLine = line.trim();
                    let bet = null;
                    let parseError = null;

                    // FORCE FALLBACK PARSER FOR STABILITY
                    console.log(`[DEBUG] Using fallback parser for direct: "${trimmedLine}"`);
                    const fallbackResult = simpleBetParse(trimmedLine);
                    if (fallbackResult.success) {
                        bet = fallbackResult.bet;
                        console.log(`[DEBUG] Direct fallback parse success:`, bet);
                    } else {
                        parseError = fallbackResult.error;
                        console.log(`[DEBUG] Direct fallback parse failed:`, parseError);
                    }

                    let result;
                    if (bet && !parseError) {
                        result = window.checkBetResult(bet, lotteryData, parameters);
                    } else {
                        result = { won: false, amount: 0, error: parseError };
                    }
                    
                    return {
                        line: globalIndex + 1,
                        input: trimmedLine,
                        bet,
                        result
                    };
                });
                
                allResults.push(...batchResults);
                
                // Small delay to prevent UI blocking
                if (batchIndex < batches - 1) {
                    await new Promise(resolve => setTimeout(resolve, 10));
                }
            }
            
            setProcessingProgress(null);
            console.log('Finished processing all batches');
            return allResults;
        }, [parameters]);

        // Get current lottery arrays info
        const getCurrentArraysInfo = React.useCallback(() => {
            if (!window.LotteryDataService) return null;
            
            const currentData = window.LotteryDataService.getCurrentData(parameters.mien || 'bac');
            if (currentData && currentData.extractedArrays) {
                return {
                    ...currentData.extractedArrays,
                    lastExtracted: currentData.lastExtracted,
                    dataDate: currentData.date,
                    source: 'Cached from RSS'
                };
            }
            return null;
        }, [parameters.mien]);
        
        // SECURITY: Block access if package not active
        if (!accessCheck.allowed) {
            return React.createElement('div', {className: 'min-h-screen bg-[#F8F7F7] flex items-center justify-center p-8'},
                React.createElement('div', {className: 'bg-white rounded-lg shadow-lg p-8 max-w-2xl text-center'},
                    React.createElement('div', {className: 'text-red-500 text-6xl mb-6'}, ''),
                    React.createElement('h2', {className: 'text-2xl font-bold text-[#121212] mb-4'}, 'Truy Cập Bị Hạn Chế'),
                    React.createElement('p', {className: 'text-[#7B7B7B] mb-6'}, accessCheck.reason),
                    React.createElement('div', {className: 'space-y-4'},
                        React.createElement('p', {className: 'text-sm text-[#7B7B7B] bg-[#F8F7F7] rounded-lg p-3'}, 
                            `Trạng thái tài khoản: ${currentUser?.package_status || 'Không xác định'}`
                        ),
                        accessCheck.redirect === 'pricing' && React.createElement('div', {className: 'space-y-3'},
                            React.createElement('button', {
                                onClick: () => {
                                    if (window.parent && window.parent.postMessage) {
                                        // Navigate within app if in iframe
                                        window.parent.postMessage({ type: 'navigate', page: 'pricing' }, '*');
                                    } else {
                                        // Direct redirect
                                        window.location.href = 'index.html';
                                        setTimeout(() => {
                                            if (window.history && window.history.pushState) {
                                                window.history.pushState(null, '', '#pricing');
                                            }
                                        }, 100);
                                    }
                                },
                                className: 'w-full px-6 py-3 bg-[#E36323] text-white rounded-lg hover:bg-[#DF5A18] font-semibold transition-colors'
                            }, ' Xem Gói Dịch Vụ'),
                            React.createElement('button', {
                                onClick: () => {
                                    if (window.AuthService) {
                                        window.AuthService.logout();
                                        window.location.reload();
                                    }
                                },
                                className: 'w-full px-6 py-3 bg-[#ECECEC] text-[#7B7B7B] rounded-lg hover:bg-[#E2E2E2] transition-colors'
                            }, 'Đăng Xuất')
                        ),
                        accessCheck.redirect === 'login' && React.createElement('button', {
                            onClick: () => {
                                window.location.href = 'index.html';
                            },
                            className: 'w-full px-6 py-3 bg-[#E36323] text-white rounded-lg hover:bg-[#DF5A18] font-semibold transition-colors'
                        }, ' Đăng Nhập')
                    )
                )
            );
        }
        
        return React.createElement('div', {className: 'max-w-7xl mx-auto p-2 md:p-4 overflow-x-hidden'}, 
            // Header with controls
            React.createElement('div', {className: 'mb-6'},
                React.createElement('div', {className: 'flex items-center justify-between'},
                    React.createElement('div', {},
                        React.createElement('h1', {className: 'text-2xl font-bold text-[#121212]'}, 'Hệ Thống Đối Soát Lô Đề'),
                        React.createElement('p', {className: 'text-[#7B7B7B] mt-2'}, 'Kiểm tra kết quả dựa trên dữ liệu XSMB chính thức')
                    ),
                    React.createElement('div', {className: 'flex gap-3'},
                        React.createElement('button', {
                            onClick: () => setShowConfig(!showConfig),
                            className: `px-4 py-2 rounded-lg text-sm font-medium ${showConfig ? 'bg-[#E36323] text-white' : 'bg-[#ECECEC] text-[#7B7B7B] hover:bg-[#ECECEC]'}`
                        }, showConfig ? 'Cấu Hình' : ' Cấu Hình'),

                        React.createElement('button', {
                            onClick: () => {
                                const arraysInfo = getCurrentArraysInfo();
                                if (arraysInfo) {
                                    alert(`Dữ liệu Arrays Hiện Tại:\n\nĐề: ${arraysInfo.deArray?.length || 0} số - [${arraysInfo.deArray?.join(', ') || 'Chưa có'}]\nLô: ${arraysInfo.loArray?.length || 0} số - [${arraysInfo.loArray?.slice(0,10).join(', ') || 'Chưa có'}${arraysInfo.loArray?.length > 10 ? '...' : ''}]\nXiên: ${arraysInfo.xienArray?.length || 0} số\nBa Càng: ${arraysInfo.baCangArray?.length || 0} số - [${arraysInfo.baCangArray?.slice(0,5).join(', ') || 'Chưa có'}${arraysInfo.baCangArray?.length > 5 ? '...' : ''}]\n\nNgày: ${arraysInfo.dataDate || 'N/A'}\nCập nhật: ${arraysInfo.lastExtracted ? new Date(arraysInfo.lastExtracted).toLocaleString() : 'N/A'}`);
                                } else {
                                    alert('Chưa có dữ liệu arrays được cache. Hãy đảm bảo LotteryDataService đã tải dữ liệu.');
                                }
                            },
                            className: 'px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm'
                        }, ' Xem Arrays')
                    )
                )
            ),
            
            // ============ SECTION A: THAM SỐ HỆ THỐNG (16 FIELDS) ============
            // Configuration Panel
            showConfig && React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-4 mb-6'},
                React.createElement('h2', {className: 'text-lg font-semibold text-[#121212] mb-4'}, ' Cấu Hình Tham Số'),
                
                // Date and Region Selection - SECTION A
                React.createElement('div', {className: 'mb-6'},
                    React.createElement('h3', {className: 'text-md font-medium text-[#7B7B7B] mb-3'}, 'Cài Đặt Cơ Bản'),
                    React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-[#FFF7ED] rounded-lg'},
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B] mb-1'}, 'Ngày đối chiếu:'),
                            React.createElement('input', {
                                type: 'date',
                                value: parameters.ngay,
                                onChange: (e) => handleParameterChange('ngay', e.target.value),
                                className: 'w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:ring-2 focus:ring-[#E36323]',
                                max: new Date().toISOString().split('T')[0]
                            }),
                            React.createElement('p', {className: 'text-xs text-[#7B7B7B] mt-1'}, 
                                `Hiện tại: ${parameters.ngay} ${parameters.ngay === new Date().toISOString().split('T')[0] ? '(Hôm nay)' : ''}`
                            ),
                            // DATE STATUS INDICATOR
                            (() => {
                                const timingCheck = checkRssTiming();
                                const statusColor = timingCheck.isValid ? 'text-green-600' : 
                                                   timingCheck.canProceed ? 'text-orange-600' : 'text-red-600';
                                const statusIcon = timingCheck.isValid ? '' : 
                                                  timingCheck.canProceed ? '' : '';
                                
                                return React.createElement('div', {className: `text-xs mt-2 p-2 rounded ${
                                    timingCheck.isValid ? 'bg-green-50' : 
                                    timingCheck.canProceed ? 'bg-orange-50' : 'bg-red-50'
                                }`},
                                    React.createElement('span', {className: statusColor}, 
                                        `${statusIcon} ${timingCheck.info || timingCheck.warning || 'Trạng thái không xác định'}`
                                    )
                                );
                            })(),
                            React.createElement('button', {
                                onClick: () => {
                                    const today = new Date().toISOString().split('T')[0];
                                    handleParameterChange('ngay', today);
                                },
                                className: 'mt-2 px-2 py-1 text-xs bg-[#FFEDD5] text-[#E36323] rounded hover:bg-[#FFEDD5]'
                            }, 'Hôm nay')
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B] mb-1'}, 'Miền:'),
                            React.createElement('select', {
                                value: parameters.mien,
                                onChange: (e) => handleParameterChange('mien', e.target.value),
                                className: 'w-full px-3 py-2 border border-[#ECECEC] rounded-lg focus:ring-2 focus:ring-[#E36323]'
                            },
                                React.createElement('option', {value: 'bac'}, 'Miền Bắc'),
                                React.createElement('option', {value: 'trung'}, 'Miền Trung (Coming soon)'),
                                React.createElement('option', {value: 'nam'}, 'Miền Nam (Coming soon)')
                            )
                        )
                    )
                ),
                
                // 16 Parameters Section - SECTION B
                React.createElement('h3', {className: 'text-md font-medium text-[#7B7B7B] mb-3'}, ' 16 Tham Số Tính Toán'),
                React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'},
                    // Lô parameters
                    React.createElement('div', {className: 'space-y-3'},
                        React.createElement('h3', {className: 'font-semibold text-[#E36323]'}, 'Lô (3 tham số)'),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tiền 1 điểm lô'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tien1DiemLo,
                                onChange: (e) => handleParameterChange('tien1DiemLo', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tiền thắng 1 điểm lô (cố định)'),
                            React.createElement('input', {
                                type: 'number',
                                value: 80000,
                                disabled: true,
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm bg-gray-100'
                            })
                        )
                    ),
                    
                    // Đề parameters
                    React.createElement('div', {className: 'space-y-3'},
                        React.createElement('h3', {className: 'font-semibold text-green-600'}, 'Đề (3 tham số)'),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tiền 1 điểm đề'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tien1DiemDe,
                                onChange: (e) => handleParameterChange('tien1DiemDe', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Hệ số đề trả'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.heSoDeTra,
                                onChange: (e) => handleParameterChange('heSoDeTra', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tỷ lệ đề thu (%)'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tyLeDeThu,
                                onChange: (e) => handleParameterChange('tyLeDeThu', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        )
                    ),

                    // Xiên parameters  
                    React.createElement('div', {className: 'space-y-3'},
                        React.createElement('h3', {className: 'font-semibold text-purple-600'}, 'Xiên (6 tham số)'),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Hệ số xiên 2'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.heSoXien2Tra,
                                onChange: (e) => handleParameterChange('heSoXien2Tra', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tỷ lệ xiên 2 thu (%)'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tyLeXien2Thu,
                                onChange: (e) => handleParameterChange('tyLeXien2Thu', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Hệ số xiên 3'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.heSoXien3Tra,
                                onChange: (e) => handleParameterChange('heSoXien3Tra', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tỷ lệ xiên 3 thu (%)'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tyLeXien3Thu,
                                onChange: (e) => handleParameterChange('tyLeXien3Thu', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Hệ số xiên 4'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.heSoXien4Tra,
                                onChange: (e) => handleParameterChange('heSoXien4Tra', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tỷ lệ xiên 4 thu (%)'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tyLeXien4Thu,
                                onChange: (e) => handleParameterChange('tyLeXien4Thu', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        )
                    ),

                    // Ba càng & other parameters
                    React.createElement('div', {className: 'space-y-3'},
                        React.createElement('h3', {className: 'font-semibold text-red-600'}, 'Ba Càng & Khác (3 tham số)'),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Hệ số ba càng'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.heSoBaCangTra,
                                onChange: (e) => handleParameterChange('heSoBaCangTra', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tỷ lệ ba càng thu (%)'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tyLeBaCangThu,
                                onChange: (e) => handleParameterChange('tyLeBaCangThu', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Làm tròn tiền'),
                            React.createElement('input', {
                                type: 'checkbox',
                                checked: parameters.lamTronTien,
                                onChange: (e) => handleParameterChange('lamTronTien', e.target.checked),
                                className: 'mt-2'
                            })
                        )
                    )
                )
            ),
            
            // RSS Timing Warning
            rssTimingWarning && React.createElement('div', {className: 'bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6'},
                React.createElement('div', {className: 'flex items-center'},
                    React.createElement('div', {className: 'text-amber-600 mr-2'}, ''),
                    React.createElement('div', {},
                        React.createElement('div', {className: 'font-medium text-amber-800'}, 'Cảnh báo thời gian'),
                        React.createElement('div', {className: 'text-amber-700 text-sm'}, rssTimingWarning),
                        React.createElement('div', {className: 'text-amber-600 text-xs mt-1'}, 'Hệ thống sẽ sử dụng simulation để demo. Kết quả thật sẽ có sau 18:15.')
                    )
                )
            ),
            
            // Main layout with two panels
            // ============ SECTION B: NHẬP DỮ LIỆU TIN NHẮN ============
            React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-6'},
                // Left panel - Input
                React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-3 md:p-4 min-w-0'},
                    React.createElement('div', {className: 'flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4'},
                        React.createElement('h2', {className: 'text-base md:text-lg font-semibold text-[#121212]'}, 'Nhập Dữ Liệu Cược'),
                        React.createElement('button', {
                            onClick: handleValidateBets,
                            disabled: !betText.trim(),
                            className: 'px-3 md:px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm whitespace-nowrap'
                        }, 'Kiểm Tra Cú Pháp')
                    ),

                    // Side-by-side: Input và Preview (stack on mobile)
                    React.createElement('div', {className: 'grid grid-cols-1 lg:grid-cols-2 gap-4'},
                        // LEFT: Input textarea
                        React.createElement('div', {},
                            React.createElement('div', {className: 'text-sm font-medium text-[#7B7B7B] mb-2'}, 'Nhập cược:'),
                            React.createElement('div', {className: 'flex border rounded-lg overflow-hidden w-full'},
                                // Line numbers
                                React.createElement('div', {
                                    className: 'bg-[#F8F7F7] border-r border-[#ECECEC] p-3 text-[#7B7B7B] text-sm font-mono min-w-[3rem] text-right select-none',
                                    style: { lineHeight: '1.5' }
                                },
                                    betText.split('\n').map((_, index) =>
                                        React.createElement('div', { key: index }, index + 1)
                                    ).concat([React.createElement('div', { key: 'end', className: 'text-[#ECECEC]' }, betText.split('\n').length + 1)])
                                ),
                                // Textarea
                                React.createElement('textarea', {
                                    value: betText,
                                    onChange: handleBetTextChange,
                                    placeholder: 'Nhập theo format:\nD 16 500k\nL 23 100k\nX2 12 34 200k\nBC 123 50k',
                                    className: 'flex-1 p-2 md:p-3 border-0 outline-none resize-none w-full',
                                    style: {
                                        lineHeight: '1.5',
                                        minHeight: '300px', // Tăng từ 200px
                                        maxHeight: '600px', // Giới hạn max height
                                        fontFamily: 'monospace',
                                        fontSize: 'clamp(12px, 2.5vw, 14px)' // Responsive font
                                    },
                                    spellCheck: false
                                })
                            )
                        ),

                        // RIGHT: Preview panel with error highlighting
                        React.createElement('div', {},
                            React.createElement('div', {className: 'flex items-center justify-between mb-2'},
                                React.createElement('span', {className: 'text-sm font-medium text-[#7B7B7B]'}, 'Kiểm tra cú pháp:'),
                                validationResults && React.createElement('span', {
                                    className: `text-xs px-2 py-1 rounded ${
                                        validationResults.filter(v => !v.isValid && v.line.trim()).length > 0
                                            ? 'bg-red-100 text-red-600'
                                            : 'bg-green-100 text-green-600'
                                    }`
                                },
                                    validationResults.filter(v => !v.isValid && v.line.trim()).length > 0
                                        ? `${validationResults.filter(v => !v.isValid && v.line.trim()).length} lỗi`
                                        : ' Hợp lệ'
                                )
                            ),
                            React.createElement('div', {
                                className: 'border rounded-lg overflow-hidden bg-white',
                                style: { minHeight: '300px', maxHeight: '600px' }
                            },
                                React.createElement('div', {className: 'flex'},
                                    // Line numbers with error highlighting
                                    React.createElement('div', {
                                        className: 'bg-[#F8F7F7] border-r border-[#ECECEC] p-3 text-sm font-mono min-w-[3rem] text-right select-none',
                                        style: { lineHeight: '1.5' }
                                    },
                                        betText.split('\n').map((line, index) => {
                                            const validation = validationResults?.find(v => v.lineNumber === index + 1);
                                            const hasError = validation && !validation.isValid && line.trim();
                                            return React.createElement('div', {
                                                key: index,
                                                className: hasError ? 'text-red-500 font-bold' : 'text-[#7B7B7B]',
                                                title: hasError ? validation.error : ''
                                            }, index + 1);
                                        }).concat([React.createElement('div', { key: 'end', className: 'text-[#ECECEC]' }, betText.split('\n').length + 1)])
                                    ),
                                    // Preview content with error underlines
                                    React.createElement('div', {
                                        className: 'flex-1 p-3 overflow-x-auto overflow-y-auto',
                                        style: {
                                            lineHeight: '1.5',
                                            fontFamily: 'monospace',
                                            fontSize: 'clamp(12px, 2.5vw, 14px)',
                                            maxHeight: '550px',
                                            wordBreak: 'break-word'
                                        }
                                    },
                                        betText.split('\n').map((line, index) => {
                                            const validation = validationResults?.find(v => v.lineNumber === index + 1);
                                            const hasError = validation && !validation.isValid && line.trim();
                                            const isValid = validation && validation.isValid && line.trim();

                                            return React.createElement('div', {
                                                key: index,
                                                className: 'relative group',
                                                style: { minHeight: '1.5em' }
                                            },
                                                // Line content with styling
                                                React.createElement('span', {
                                                    className: hasError
                                                        ? 'text-red-600 border-b-2 border-red-500 border-dashed'
                                                        : isValid
                                                            ? 'text-green-700'
                                                            : 'text-[#7B7B7B]',
                                                    style: {
                                                        display: 'inline-block',
                                                        minWidth: '100%',
                                                        paddingBottom: hasError ? '2px' : '0'
                                                    }
                                                }, line || '\u00A0'),
                                                // Error tooltip on hover
                                                hasError && React.createElement('div', {
                                                    className: 'absolute left-0 top-full mt-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow-lg z-20 hidden group-hover:block whitespace-nowrap'
                                                }, validation.error)
                                            );
                                        })
                                    )
                                )
                            ),
                            // Error summary
                            validationResults && validationResults.filter(v => !v.isValid && v.line.trim()).length > 0 &&
                            React.createElement('div', {className: 'mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm'},
                                React.createElement('div', {className: 'font-medium text-red-700 mb-1'}, 'Dòng lỗi:'),
                                React.createElement('ul', {className: 'text-red-600 text-xs space-y-1'},
                                    validationResults.filter(v => !v.isValid && v.line.trim()).map(v =>
                                        React.createElement('li', {key: v.lineNumber},
                                            React.createElement('span', {className: 'font-bold'}, `Dòng ${v.lineNumber}: `),
                                            v.error
                                        )
                                    )
                                )
                            )
                        )
                    ),
                    
                    // ============ SECTION C: XỬ LÝ ĐỐI SOÁT ============
                    React.createElement('div', {className: 'mt-4 flex gap-3'},
                        // Debug validation state
                        console.log(`[RENDER] Button state check:`, {
                            validationResults: !!validationResults,
                            validationLength: validationResults?.length,
                            invalidCount: validationResults?.filter(item => item.line.trim() && !item.isValid).length
                        }),
                        React.createElement('button', {
                            onClick: handleCheckResults,
                            disabled: isLoading || !betText.trim() || !validationResults || validationResults.filter(item => item.line.trim() && !item.isValid).length > 0,
                            className: `px-6 py-2 rounded-lg flex-1 transition-colors ${
                                !validationResults ? 
                                    'bg-gray-400 text-white cursor-not-allowed' : 
                                    validationResults.filter(item => item.line.trim() && !item.isValid).length > 0 ?
                                        'bg-red-500 text-white cursor-not-allowed' :
                                        'bg-[#E36323] text-white hover:bg-[#DF5A18]'
                            } disabled:opacity-50`
                        }, 
                            isLoading ? 
                                (processingProgress ? 
                                    `Xử lý ${processingProgress.percentage}% (${processingProgress.processed}/${processingProgress.totalLines})` :
                                    'Đang xử lý...'
                                ) : 
                                !validationResults ? 
                                    ' Cần kiểm tra cú pháp trước' :
                                    validationResults.filter(item => item.line.trim() && !item.isValid).length > 0 ?
                                        ' Có lỗi cú pháp' :
                                        ' Đối Chiếu Kết Quả'
                        ),
                        React.createElement('button', {
                            onClick: () => {
                                setBetText('');
                                setResults(null);
                                setValidationResults(null);
                                setShowValidation(false);
                            },
                            className: 'px-4 py-2 bg-[#7B7B7B] text-white rounded-lg hover:bg-[#121212]'
                        }, 'Xóa'),
                        React.createElement('button', {
                            onClick: () => {
                                console.log('[DEBUG] Force refresh triggered');
                                setResults(null);
                                setTimeout(() => {
                                    handleCheckResults();
                                }, 100);
                            },
                            className: 'px-4 py-2 bg-[#E36323] text-white rounded-lg hover:bg-[#DF5A18] ml-2'
                        }, 'Refresh')
                    )
                )
            ),
            
            // ============ SECTION D: HIỂN THỊ KẾT QUẢ ============
            // Section D - Results Display (THEO ĐÚNG RULES)
            (results || lotteryResults) && React.createElement('div', {className: 'space-y-6'},
                // Lottery Table - 8 giải, 27 số
                lotteryResults && React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-4'},
                    (() => {
                        console.log('[UI DEBUG] LotteryResults for rendering:', lotteryResults);
                        console.log('[UI DEBUG] Keys available:', Object.keys(lotteryResults || {}));
                        console.log('[UI DEBUG] Date:', lotteryResults?.date);
                        console.log('[UI DEBUG] giai_nhi data:', lotteryResults?.giai_nhi);
                        console.log('[UI DEBUG] giai_ba data:', lotteryResults?.giai_ba);
                        console.log('[UI DEBUG] All giai data:', {
                            giai_dac_biet: lotteryResults?.giai_dac_biet,
                            giai_nhat: lotteryResults?.giai_nhat,
                            giai_nhi: lotteryResults?.giai_nhi,
                            giai_ba: lotteryResults?.giai_ba,
                            giai_tu: lotteryResults?.giai_tu,
                            giai_nam: lotteryResults?.giai_nam,
                            giai_sau: lotteryResults?.giai_sau,
                            giai_bay: lotteryResults?.giai_bay
                        });
                        return null;
                    })(),
                    React.createElement('div', {className: 'flex items-center justify-between mb-4'},
                        React.createElement('div', {},
                            React.createElement('h2', {className: 'text-lg font-semibold text-[#121212]'}, 
                                `Kết Quả XSMB ${lotteryResults.actualDate || lotteryResults.date || 'Hôm nay'}`
                            ),
                            !lotteryResults.isRequestedDate && lotteryResults.requestedDate && 
                            React.createElement('p', {className: 'text-sm text-amber-600 mt-1'}, 
                                `Đã yêu cầu ${lotteryResults.requestedDate} nhưng đang hiển thị ${lotteryResults.actualDate}`
                            )
                        ),
                        React.createElement('div', {className: 'text-sm text-[#7B7B7B]'},
                            lotteryResults.isSimulation ? 
                                ' Simulation Data' : 
                                ' RSS xosodaiphat.com'
                        )
                    ),
                    React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 gap-4'},
                        // Left column - Major prizes
                        React.createElement('div', {},
                            React.createElement('div', {className: 'border rounded-lg p-3 mb-3 bg-red-50'},
                                React.createElement('div', {className: 'text-sm font-medium text-red-800 mb-2'}, 'Giải Đặc Biệt'),
                                React.createElement('div', {className: 'text-2xl font-bold text-red-600 font-mono'},
                                    lotteryResults?.giai_dac_biet?.[0] ||
                                    lotteryResults?.dacbiet?.[0] ||
                                    lotteryResults?.special?.[0] ||
                                    'Đang tải...'
                                )
                            ),
                            React.createElement('div', {className: 'border rounded-lg p-3 mb-3 bg-[#FFF7ED]'},
                                React.createElement('div', {className: 'text-sm font-medium text-[#E36323] mb-2'}, 'Giải Nhất'),
                                React.createElement('div', {className: 'text-lg font-bold text-[#E36323] font-mono'},
                                    lotteryResults?.giai_nhat?.[0] ||
                                    lotteryResults?.nhat?.[0] ||
                                    'Đang tải...'
                                )
                            ),
                            React.createElement('div', {className: 'border rounded-lg p-3 bg-green-50'},
                                React.createElement('div', {className: 'text-sm font-medium text-green-800 mb-2'}, 'Giải Nhì'),
                                React.createElement('div', {className: 'text-lg font-bold text-green-600 font-mono'},
                                    (lotteryResults?.giai_nhi || lotteryResults?.nhi)?.join(' - ') || 'Đang tải...'
                                )
                            )
                        ),
                        
                        // Right column - Other prizes
                        React.createElement('div', {},
                            React.createElement('div', {className: 'space-y-2'},
                                ['giai_ba', 'giai_tu', 'giai_nam', 'giai_sau', 'giai_bay'].map(prize => {
                                    const prizeNames = {
                                        giai_ba: 'Giải Ba',
                                        giai_tu: 'Giải Tư',
                                        giai_nam: 'Giải Năm',
                                        giai_sau: 'Giải Sáu',
                                        giai_bay: 'Giải Bảy'
                                    };
                                    const numbers = lotteryResults[prize] || [];

                                    return React.createElement('div', {key: prize, className: 'border rounded-lg p-2'},
                                        React.createElement('div', {className: 'text-xs font-medium text-[#7B7B7B] mb-1'}, prizeNames[prize]),
                                        React.createElement('div', {className: 'text-sm font-mono text-[#7B7B7B]'},
                                            numbers?.length > 0 ? numbers.join(' - ') : 'Đang tải...'
                                        )
                                    );
                                })
                            )
                        )
                    )
                ),

                // Bet Details Table - 6 cột theo RULES
                results && React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-4'},
                    React.createElement('div', {className: 'flex items-center justify-between mb-4'},
                        React.createElement('h2', {className: 'text-lg font-semibold text-[#121212]'}, 'Chi Tiết Đối Chiếu'),
                        React.createElement('select', {
                            value: resultsFilter,
                            onChange: (e) => setResultsFilter(e.target.value),
                            className: 'border rounded-lg px-3 py-2 text-sm'
                        },
                            React.createElement('option', {value: 'all'}, 'Tất cả'),
                            React.createElement('option', {value: 'win'}, 'Chỉ thắng'),
                            React.createElement('option', {value: 'lose'}, 'Chỉ thua'),
                            React.createElement('option', {value: 'error'}, 'Chỉ lỗi')
                        )
                    ),
                    
                    // Table with 6 columns
                    React.createElement('div', {className: 'overflow-x-auto'},
                        React.createElement('table', {className: 'w-full text-sm'},
                            React.createElement('thead', {},
                                React.createElement('tr', {className: 'bg-[#F8F7F7]'},
                                    React.createElement('th', {className: 'text-left p-3 border'}, 'Nội dung gốc'),
                                    React.createElement('th', {className: 'text-left p-3 border'}, 'Loại cược'),
                                    React.createElement('th', {className: 'text-left p-3 border'}, 'Số cược'),
                                    React.createElement('th', {className: 'text-left p-3 border'}, 'Tiền cược'),
                                    React.createElement('th', {className: 'text-left p-3 border'}, 'Trạng thái'),
                                    React.createElement('th', {className: 'text-left p-3 border'}, 'Tiền thắng/thua')
                                )
                            ),
                            React.createElement('tbody', {},
                                getPaginatedResults().data.map((item, index) => {
                                    // DEBUG: Log every item to trace issue
                                    if (index === 0) {
                                        console.log(' [Table Debug] First item full structure:', JSON.stringify(item, null, 2));
                                        if (item.result) console.log(' [Table Debug] Result object:', item.result);
                                        if (item.bet) console.log(' [Table Debug] Bet object:', item.bet);
                                    }
                                    
                                    // Handle different data structures
                                    const result = item.result || item; // Fallback if no nested result
                                    const isError = result.error || result.status === 'error';
                                    const isWin = result.won || result.status === 'win';
                                    
                                    const rowClass = isError ? 
                                        'bg-red-50 border-red-200' :
                                        isWin ? 
                                            'bg-green-50 border-green-200' : 
                                            'bg-[#F8F7F7] border-[#ECECEC]';
                                    
                                    const statusClass = isError ?
                                        'text-red-600 font-semibold' :
                                        isWin ?
                                            'text-green-600 font-semibold' :
                                            'text-red-600 font-semibold';
                                    
                                    return React.createElement('tr', {key: index, className: rowClass},
                                        // Nội dung gốc với error highlighting
                                        React.createElement('td', {className: 'p-3 border font-mono text-xs'}, 
                                            isError ? 
                                                React.createElement('span', {className: 'underline decoration-red-500 decoration-2'}, item.input || item.originalText || 'N/A') :
                                                item.input || item.originalText || 'N/A'
                                        ),
                                        // Loại cược
                                        React.createElement('td', {className: 'p-3 border'}, 
                                            item.bet?.type || item.bet?.betType || item.type || 'N/A'
                                        ),
                                        // Số cược
                                        React.createElement('td', {className: 'p-3 border font-mono'}, 
                                            item.bet?.numbers?.join(', ') || item.numbers?.join(', ') || 'N/A'
                                        ),
                                        // Tiền cược
                                        React.createElement('td', {className: 'p-3 border'}, 
                                            (item.bet?.money || item.money || 0).toLocaleString() + 'đ'
                                        ),
                                        // Trạng thái với màu
                                        React.createElement('td', {className: `p-3 border ${statusClass}`}, 
                                            isError ? 'LỖI' :
                                            isWin ? 'THẮNG' : 'THUA'
                                        ),
                                        // Tiền thắng/thua
                                        React.createElement('td', {className: 'p-3 border font-semibold'}, 
                                            isError ? 
                                                React.createElement('span', {className: 'text-red-600 text-xs'}, result.error || 'Lỗi không xác định') :
                                                isWin ? 
                                                    React.createElement('div', {},
                                                        React.createElement('span', {className: 'text-green-600 font-bold'}, `+${(result.amount || result.winAmount || 0).toLocaleString()}đ`),
                                                        result.note && React.createElement('div', {className: 'text-xs text-green-700 mt-1'}, result.note)
                                                    ) :
                                                    React.createElement('div', {},
                                                        React.createElement('span', {className: 'text-red-600 font-bold'}, `-${(result.loseAmount || item.bet?.money || item.money || 0).toLocaleString()}đ`),
                                                        result.note && React.createElement('div', {className: 'text-xs text-red-700 mt-1'}, result.note)
                                                    )
                                        )
                                    );
                                })
                            )
                        )
                    ),
                    
                    // Pagination controls
                    getPaginatedResults().totalPages > 1 && React.createElement('div', {className: 'mt-4 flex items-center justify-between'},
                        React.createElement('div', {className: 'text-sm text-[#7B7B7B]'},
                            `Hiển thị ${getPaginatedResults().startIndex}-${getPaginatedResults().endIndex} trong ${getPaginatedResults().total} kết quả`
                        ),
                        React.createElement('div', {className: 'flex gap-2'},
                            React.createElement('button', {
                                onClick: () => setCurrentPage(Math.max(1, currentPage - 1)),
                                disabled: currentPage === 1,
                                className: 'px-3 py-1 bg-[#ECECEC] text-[#7B7B7B] rounded disabled:opacity-50'
                            }, '‹ Trước'),
                            React.createElement('span', {className: 'px-3 py-1 bg-[#FFEDD5] text-[#E36323] rounded'}, 
                                `${currentPage}/${getPaginatedResults().totalPages}`
                            ),
                            React.createElement('button', {
                                onClick: () => setCurrentPage(Math.min(getPaginatedResults().totalPages, currentPage + 1)),
                                disabled: currentPage === getPaginatedResults().totalPages,
                                className: 'px-3 py-1 bg-[#ECECEC] text-[#7B7B7B] rounded disabled:opacity-50'
                            }, 'Sau ›')
                        )
                    ),
                    
                    // Summary section
                    React.createElement('div', {className: 'mt-4 pt-4 border-t bg-[#F8F7F7] rounded-lg p-3'},
                        React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-4 gap-4 text-sm'},
                            React.createElement('div', {},
                                React.createElement('span', {className: 'text-[#7B7B7B]'}, 'Tổng bet: '),
                                React.createElement('span', {className: 'font-semibold'}, getFilteredResults().length)
                            ),
                            React.createElement('div', {},
                                React.createElement('span', {className: 'text-[#7B7B7B]'}, 'Hiển thị: '),
                                React.createElement('span', {className: 'font-semibold'}, getPaginatedResults().data.length)
                            ),
                            React.createElement('div', {},
                                React.createElement('span', {className: 'text-[#7B7B7B]'}, 'Thắng/Thua: '),
                                React.createElement('span', {className: 'text-green-600 font-semibold'}, getFilteredResults().filter(r => (r.result?.won || r.result?.status === 'win')).length),
                                React.createElement('span', {className: 'text-[#7B7B7B]'}, ' / '),
                                React.createElement('span', {className: 'text-red-600 font-semibold'}, getFilteredResults().filter(r => !(r.result?.won || r.result?.status === 'win') && !r.result?.error).length)
                            ),
                            React.createElement('div', {},
                                React.createElement('span', {className: 'text-[#7B7B7B]'}, 'Lãi/Lỗ: '),
                                React.createElement('span', {
                                    className: `font-bold ${getFilteredResults().reduce((sum, r) => sum + ((r.result?.won || r.result?.status === 'win') ? (r.result?.amount || 0) : -((r.result?.loseAmount || r.bet?.money || 0))), 0) >= 0 ? 'text-green-600' : 'text-red-600'}`
                                }, 
                                    (getFilteredResults().reduce((sum, r) => sum + ((r.result?.won || r.result?.status === 'win') ? (r.result?.amount || 0) : -((r.result?.loseAmount || r.bet?.money || 0))), 0) >= 0 ? '+' : '') +
                                    getFilteredResults().reduce((sum, r) => sum + ((r.result?.won || r.result?.status === 'win') ? (r.result?.amount || 0) : -((r.result?.loseAmount || r.bet?.money || 0))), 0).toLocaleString() + 'đ'
                                )
                            )
                        )
                    )
                )
            ),
            
            // Statistics Dashboard
            statistics && React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-4 mt-6'},
                React.createElement('h2', {className: 'text-lg font-semibold text-[#121212] mb-4'}, 'Thống Kê Chi Tiết'),
                React.createElement('div', {className: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'},
                    // Overall stats
                    React.createElement('div', {className: 'bg-[#FFF7ED] rounded-lg p-4'},
                        React.createElement('h3', {className: 'font-semibold text-[#E36323] mb-2'}, 'Tổng Quan'),
                        React.createElement('div', {className: 'space-y-1 text-sm'},
                            React.createElement('div', {}, `Tổng bet: ${statistics.total}`),
                            React.createElement('div', {className: 'text-green-600'}, `Thắng: ${statistics.won}`),
                            React.createElement('div', {className: 'text-red-600'}, `Thua: ${statistics.lost}`),
                            React.createElement('div', {className: 'font-bold'}, 
                                `Tỷ lệ thắng: ${statistics.total > 0 ? Math.round((statistics.won / statistics.total) * 100) : 0}%`
                            )
                        )
                    ),
                    
                    // Money stats
                    React.createElement('div', {className: 'bg-green-50 rounded-lg p-4'},
                        React.createElement('h3', {className: 'font-semibold text-green-800 mb-2'}, 'Tiền Cược'),
                        React.createElement('div', {className: 'space-y-1 text-sm'},
                            React.createElement('div', {}, `Tổng cược: ${statistics.totalBetAmount.toLocaleString()}đ`),
                            React.createElement('div', {className: 'text-green-600'}, `Thắng: +${statistics.totalWinAmount.toLocaleString()}đ`),
                            React.createElement('div', {className: 'text-red-600'}, `Thua: -${statistics.totalLoseAmount.toLocaleString()}đ`),
                            React.createElement('div', {className: `font-bold ${statistics.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}, 
                                `Lãi/Lỗ: ${statistics.netProfit >= 0 ? '+' : ''}${statistics.netProfit.toLocaleString()}đ`
                            )
                        )
                    ),
                    
                    // By bet type stats
                    React.createElement('div', {className: 'bg-purple-50 rounded-lg p-4 md:col-span-2'},
                        React.createElement('h3', {className: 'font-semibold text-purple-800 mb-2'}, 'Theo Loại Cược'),
                        React.createElement('div', {className: 'grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm'},
                            Object.entries(statistics.byType).map(([type, data]) => 
                                React.createElement('div', {key: type, className: 'bg-white rounded p-2 border'},
                                    React.createElement('div', {className: 'font-semibold capitalize'},
                                        type === 'lô' ? 'Lô' :
                                        type === 'đề' ? 'Đề' :
                                        type === 'xiên' ? 'Xiên' :
                                        type === 'xiên 2' ? 'Xiên 2' :
                                        type === 'xiên 3' ? 'Xiên 3' :
                                        type === 'xiên 4' ? 'Xiên 4' :
                                        type === 'ba càng' ? 'Ba Càng' : type
                                    ),
                                    React.createElement('div', {}, `${data.count} bet (${data.won}T/${data.lost}H)`),
                                    React.createElement('div', {className: data.winAmount - data.loseAmount >= 0 ? 'text-green-600' : 'text-red-600'}, 
                                        `${data.winAmount - data.loseAmount >= 0 ? '+' : ''}${(data.winAmount - data.loseAmount).toLocaleString()}đ`
                                    )
                                )
                            )
                        )
                    )
                )
            )
        );
    };
    console.log('FINAL: Component created successfully');
    
    window.MainReconciliation = MainReconciliation;
    console.log(' FINAL VERSION: Complete and functional!');
})();
