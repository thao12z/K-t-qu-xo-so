  (function() {
    'use strict';
    
    console.log('🧮 FINAL VERSION: Starting with working foundation...');
    
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
        
        // Tùy chọn (2 fields)
        lamTronTien: false,              // Làm tròn hàng nghìn
        strictLoValidation: false        // Bắt buộc lô chia hết cho 1 điểm
    };
    
    // Lottery functions - ASYNC REALTIME DATA RETRIEVAL
    window.getLotteryData = async (region = 'bac', selectedDate = null) => {
        if (window.LotteryDataService) {
            let data;

            if (selectedDate) {
                // ASYNC: Fetch data for specific date (now async in online mode)
                console.log(`[getLotteryData] 🌐 Fetching data for ${selectedDate}...`);
                data = await window.LotteryDataService.getDataForDate(selectedDate, region);
                console.log(`[getLotteryData] Requested ${selectedDate}: ${data ? 'Found' : 'Not found'}`);
            } else {
                data = window.LotteryDataService.getCurrentData(region);
                console.log(`[getLotteryData] Current data: ${data ? 'Found' : 'Not found'}`);
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
        console.log(`🔍 [extractAllLotteryNumbers] Raw special prize:`, rawResults.giai_dac_biet);
        
        if (rawResults.giai_dac_biet && rawResults.giai_dac_biet.length > 0) {
            const specialNumber = rawResults.giai_dac_biet[0];
            console.log(`🔍 [extractAllLotteryNumbers] Special number found: "${specialNumber}" (type: ${typeof specialNumber})`);
            
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

        console.log('🚀 LotteryDataService enhanced with auto array extraction!');
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
            line = line.trim().replace(/,/g, ' ').replace(/\s+/g, ' ');
            
            // Check for empty line
            if (!line) {
                return { success: false, error: 'Dòng trống' };
            }
            
            // Check for basic structure
            const parts = line.split(' ').filter(p => p.trim());
            if (parts.length < 3) {
                return { success: false, error: 'Thiếu thông tin - Cần: [loại] [số] [tiền]' };
            }
            
            // Enhanced pattern for real formats: Lx, D, L + numbers + money (k, m, .2m etc)
            const match = line.toLowerCase().match(/^(lx|l|d|lo|lô|de|đề|xien|xiên|ba\s*cang|ba\s*càng)\s+([\d\s]+?)\s+([\d.]+[km]?)$/);
            if (!match) {
                // More specific error messages
                if (!/^(lx|l|d|lo|lô|de|đề|xien|xiên|ba\s*cang|ba\s*càng)/i.test(line)) {
                    return { success: false, error: 'Loại cược không hợp lệ - Cần: L/D/Lx (Lô/Đề/Xiên)' };
                }
                if (!/[\d.]+[km]?$/i.test(line)) {
                    return { success: false, error: 'Số tiền không hợp lệ - Cần: 100k, 1m, 1.5m' };
                }
                return { success: false, error: 'Cú pháp không đúng - Ví dụ: "D 34 100k"' };
            }
            
            const [, type, numbersStr, moneyStr] = match;
            const numbers = numbersStr.split(/\s+/).filter(n => n && n.length > 0);
            
            // Validate numbers
            for (const num of numbers) {
                if (!/^\d{1,2}$/.test(num)) {
                    return { success: false, error: `Số "${num}" không hợp lệ - Cần 1-2 chữ số (00-99)` };
                }
                const numValue = parseInt(num);
                if (numValue < 0 || numValue > 99) {
                    return { success: false, error: `Số "${num}" ngoài phạm vi - Cần từ 00 đến 99` };
                }
            }
            
            // Parse money: 100k, 4m, 1.2m, 660k, etc.
            let money = 0;
            if (moneyStr.includes('m')) {
                const value = parseFloat(moneyStr.replace('m', ''));
                if (isNaN(value) || value <= 0) {
                    return { success: false, error: `Số tiền "${moneyStr}" không hợp lệ` };
                }
                money = value * 1000000;
            } else if (moneyStr.includes('k')) {
                const value = parseInt(moneyStr.replace('k', ''));
                if (isNaN(value) || value <= 0) {
                    return { success: false, error: `Số tiền "${moneyStr}" không hợp lệ` };
                }
                money = value * 1000;
            } else {
                return { success: false, error: `Số tiền phải có đơn vị k hoặc m - Ví dụ: 100k, 1.5m` };
            }
            
            // Map type shortcuts to full names
            const mappedType = {
                'lx': 'xiên', 'l': 'lô', 'd': 'đề',
                'lo': 'lô', 'lô': 'lô',
                'de': 'đề', 'đề': 'đề', 
                'xien': 'xiên', 'xiên': 'xiên',
                'ba cang': 'ba càng', 'ba càng': 'ba càng'
            }[type.toLowerCase()] || type;
            
            // Validate number count for each bet type
            if (mappedType === 'đề' && numbers.length !== 1) {
                return { success: false, error: `Đề chỉ cần 1 số - Bạn nhập ${numbers.length} số` };
            }
            if (mappedType === 'lô' && numbers.length < 1) {
                return { success: false, error: 'Lô cần ít nhất 1 số' };
            }
            if (mappedType === 'xiên') {
                if (numbers.length < 2 || numbers.length > 4) {
                    return { success: false, error: `Xiên cần 2-4 số - Bạn nhập ${numbers.length} số` };
                }
            }
            if (mappedType === 'ba càng' && numbers.length !== 1) {
                return { success: false, error: `Ba càng chỉ cần 1 số 3 chữ số - Bạn nhập ${numbers.length} số` };
            }
            
            // RELAXED validation - warn but don't block (for real-world data)
            let warning = '';
            if (mappedType === 'lô' && money % 23000 !== 0) {
                warning = ` (Khuyến nghị: Lô nên là bội số của 23k)`;
            } else if (mappedType === 'đề' && money % 100000 !== 0) {
                warning = ` (Khuyến nghị: Đề nên là bội số của 100k)`;
            }
            
            return {
                success: true,
                bet: {
                    type: mappedType,
                    betType: mappedType,
                    numbers: numbers,
                    money: money,
                    warning: warning
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
                heSoDeTra: getUIParameter('heSoDeTra', 80),
                heSoXien2Tra: getUIParameter('heSoXien2Tra', 10),        // From UI: 10
                heSoXien3Tra: getUIParameter('heSoXien3Tra', 40),        // From UI: 40  
                heSoXien4Tra: getUIParameter('heSoXien4Tra', 100),       // From UI: 100
                heSoBaCangTra: getUIParameter('heSoBaCangTra', 500),
                lamTronTien: true,
                tyLeLoThu: getUIParameter('tyLeLoThu', 100) / 100,       // Convert % to decimal
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
        
        console.log(`🔍 [OPTIMIZED DEBUG] Checking:`, {
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
        console.log(`[CRITICAL] STANDARDIZED convertToLotteryData called with:`, rawResults);
        console.log(`[CRITICAL] rawResults keys:`, Object.keys(rawResults || {}));
        console.log(`[CRITICAL] rawResults.results:`, rawResults?.results);
        console.log(`[CRITICAL] rawResults.giai_dac_biet:`, rawResults?.giai_dac_biet);
        if (!rawResults) {
            console.log(`[CRITICAL] convertToLotteryData: rawResults is null/undefined`);
            return null;
        }
        
        // DETECT FORMAT: RSS vs Hardcoded vs Other
        let format = 'unknown';
        let standardizedData = {};
        
        if (rawResults.results && rawResults.results.dacbiet) {
            format = 'rss_nested';
            console.log(`[DEBUG] Detected RSS nested format`);
            // RSS format: rawResults.results.dacbiet, .nhat, .nhi, etc.
            standardizedData = {
                giai_dac_biet: rawResults.results.dacbiet || [],
                giai_nhat: rawResults.results.nhat || [],
                giai_nhi: [].concat(rawResults.results.nhi || [], rawResults.results.nhi2 || []).filter(Boolean),
                giai_ba: rawResults.results.ba || [],
                giai_tu: rawResults.results.tu || [],
                giai_nam: rawResults.results.nam || [],
                giai_sau: rawResults.results.sau || [],
                giai_bay: rawResults.results.bay || [],
                date: rawResults.date || 'unknown',
                dataType: 'rss'
            };
        } else if (rawResults.dacbiet) {
            format = 'rss_direct';
            console.log(`[DEBUG] Detected RSS direct format`);
            // Direct RSS format: rawResults.dacbiet, .nhat, .nhi, etc.
            standardizedData = {
                giai_dac_biet: rawResults.dacbiet || [],
                giai_nhat: rawResults.nhat || [],
                giai_nhi: rawResults.nhi || [],
                giai_ba: rawResults.ba || [],
                giai_tu: rawResults.tu || [],
                giai_nam: rawResults.nam || [],
                giai_sau: rawResults.sau || [],
                giai_bay: rawResults.bay || [],
                date: rawResults.actualDate || rawResults.date || 'unknown',
                dataType: 'rss_direct'
            };
        } else if (rawResults.giai_dac_biet) {
            format = 'hardcoded';
            console.log(`[DEBUG] Detected hardcoded format`);
            // Hardcoded format: already correct
            standardizedData = {
                giai_dac_biet: rawResults.giai_dac_biet || [],
                giai_nhat: rawResults.giai_nhat || [],
                giai_nhi: rawResults.giai_nhi || [],
                giai_ba: rawResults.giai_ba || [],
                giai_tu: rawResults.giai_tu || [],
                giai_nam: rawResults.giai_nam || [],
                giai_sau: rawResults.giai_sau || [],
                giai_bay: rawResults.giai_bay || [],
                date: rawResults.date || 'unknown',
                dataType: rawResults.dataType || 'hardcoded'
            };
            } else {
            console.log(`[ERROR] Unknown data format:`, Object.keys(rawResults));
            return null;
        }
        
        console.log(`[DEBUG] Format: ${format}, Standardized data:`, standardizedData);
        
        // AUTOMATED ARRAY EXTRACTION - Tự động chia array cho từng loại bet
        const extractArrays = (data) => {
            const allNumbers = [];
            const deArray = [];
            const loArray = [];
            const xienArray = [];
            const baCangArray = [];
            
            console.log(`[EXTRACTION] Starting extraction from:`, data);
            
            // Extract từ giải đặc biệt (5 digits)
            if (data.giai_dac_biet && data.giai_dac_biet.length > 0) {
                const specialFull = data.giai_dac_biet[0];
                console.log(`[CRITICAL] ĐB: ${specialFull} -> Đề: ${specialFull.slice(-2)}, Lô: ${specialFull.slice(-2)}, Ba càng: ${specialFull.slice(-3)}`);
                
                // Đề: 2 số cuối
                const specialLast2 = specialFull.slice(-2);
                deArray.push(specialLast2);
                
                // Lô: 2 số cuối  
                loArray.push(specialLast2);
                
                // Ba càng: 3 số cuối
                const specialLast3 = specialFull.slice(-3);
                baCangArray.push(specialLast3);
                
                // Xiên: thêm vào pool
                xienArray.push(specialLast2);
                allNumbers.push(specialFull);
            }
            
            // Extract từ các giải khác
            const prizeNames = ['G1', 'G2', 'G3', 'G4', 'G5', 'G6', 'G7'];
            const allPrizes = [
                data.giai_nhat, data.giai_nhi, data.giai_ba, 
                data.giai_tu, data.giai_nam, data.giai_sau, data.giai_bay
            ];
            
            allPrizes.forEach((prizeArray, index) => {
                const prizeName = prizeNames[index];
                console.log(`[EXTRACTION] Processing ${prizeName}:`, prizeArray);
                
                if (prizeArray && Array.isArray(prizeArray)) {
                    prizeArray.forEach(number => {
                        if (number) {
                            allNumbers.push(number);
                            
                            // Lô: 2 số cuối của tất cả giải
                            const last2 = number.slice(-2);
                            if (!loArray.includes(last2)) {
                                loArray.push(last2);
                                console.log(`[EXTRACTION] ${prizeName} ${number} -> Lô: ${last2}`);
                            }
                            
                            // Xiên: 2 số cuối
                            if (!xienArray.includes(last2)) {
                                xienArray.push(last2);
                                console.log(`[EXTRACTION] ${prizeName} ${number} -> Xiên: ${last2}`);
                            }
                            
                            // Ba càng: chỉ từ giải ĐB đến giải 6 (không có giải 7 vì chỉ 2 digits)
                            if (index < 6 && number.length >= 3) {
                                const last3 = number.slice(-3);
                                if (!baCangArray.includes(last3)) {
                                    baCangArray.push(last3);
                                    console.log(`[EXTRACTION] ${prizeName} ${number} -> Ba càng: ${last3}`);
                                }
                            }
                        }
                    });
                } else {
                    console.log(`[EXTRACTION] ${prizeName} is empty or not array`);
                }
            });
            
            console.log(`[EXTRACTION] FINAL ARRAYS:`, {
                deArray: deArray,
                loArray: loArray.slice(0, 20), // Show first 20 for Lô
                xienArray: xienArray.slice(0, 20), // Show first 20 for Xiên  
                baCangArray: baCangArray.slice(0, 20), // Show first 20 for Ba càng
                totalNumbers: allNumbers.length
            });
            
            return {
                deArray,
                loArray, 
                xienArray,
                baCangArray,
                allNumbers
            };
        };
        
        const extractedArrays = extractArrays(standardizedData);
        console.log(`[CRITICAL] Extracted arrays:`, extractedArrays);
        
        // BUILD RESULT for bet checking
        const result = {
            // Dữ liệu cho ĐỀ: 2 số cuối giải đặc biệt
            specialLast2: standardizedData.giai_dac_biet?.[0]?.slice(-2) || null,
            
            // Dữ liệu cho LÔ: tất cả 2 số cuối từ tất cả giải  
            loNumbers: extractedArrays.loArray,
            
            // Dữ liệu cho XIÊN: 2 số cuối từ tất cả giải
            xienNumbers: extractedArrays.xienArray,
            
            // Dữ liệu cho BA CÀNG: 3 số cuối từ giải ĐB đến giải 6
            baCangNumbers: extractedArrays.baCangArray,
            
            // Raw data for UI display
            rawData: standardizedData,
            
            // For compatibility
            allNumbers: extractedArrays.allNumbers
        };
        
        console.log(`[CRITICAL] FINAL RESULT for bet checking:`, result);
        return result;
    };

    // Calculate win amount using BetParser rules
    const calculateWinAmount = (bet, config) => {
        const { type, money, numbers } = bet;
        let amount = 0;
        
        if (type === 'lô') {
            // Lô - Theo điểm: (bet_amount / tien1DiemLo) × tienTra1DiemLo
            const diem = money / config.tien1DiemLo;
            amount = diem * config.tienTra1DiemLo;
        } else if (type === 'đề') {
            // Đề - Hệ số nhân: bet_amount × heSoTra
            amount = money * config.heSoDeTra;
        } else if (type === 'xiên') {
            const count = numbers.length;
            if (count === 2) amount = money * config.heSoXien2Tra;
            else if (count === 3) amount = money * config.heSoXien3Tra;
            else if (count === 4) amount = money * config.heSoXien4Tra;
        } else if (type === 'ba càng') {
            amount = money * config.heSoBaCangTra;
        }
        
        return config.lamTronTien ? Math.round(amount / 1000) * 1000 : amount;
    };

    // Calculate lose amount using BetParser rules  
    const calculateLoseAmount = (bet, config) => {
        const { type, money, numbers } = bet;
        let rate = 0;
        
        if (type === 'lô') rate = config.tyLeLoThu;
        else if (type === 'đề') rate = config.tyLeDeThu;
        else if (type === 'xiên') {
            const count = numbers.length;
            if (count === 2) rate = config.tyLeXien2Thu;
            else if (count === 3) rate = config.tyLeXien3Thu;
            else if (count === 4) rate = config.tyLeXien4Thu;
        } else if (type === 'ba càng') rate = config.tyLeBaCangThu;
        
        const amount = money * (rate / 100);
        return config.lamTronTien ? Math.round(amount / 1000) * 1000 : amount;
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
        console.log('📄 FINAL: Rendering MainReconciliation...');
        
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
                    console.log('💾 Loaded saved parameters from localStorage');
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
        
        // Handlers
        const handleBetTextChange = React.useCallback((e) => {
            const newValue = e.target.value;
            
            // Only update if value actually changed
            if (newValue !== betText) {
                setBetText(newValue);
                
                // If text is empty, clear everything
                if (!newValue.trim()) {
                    setValidationResults(null);
                    setShowValidation(false);
                }
                // If text changed significantly, clear validation (user needs to re-validate)
                else if (betText && newValue.trim() !== betText.trim()) {
                    console.log(`[DEBUG] Text changed, clearing validation. Old: "${betText.trim()}", New: "${newValue.trim()}"`);
                    setValidationResults(null);
                }
            }
        }, [betText]);

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

            console.log('🔍 [VALIDATION] Validating bets...');
            console.log('🔧 [DEBUG] BetParser available:', !!window.BetParser);
            console.log('🔧 [DEBUG] parseSingleLine available:', !!window.BetParser?.parseSingleLine);
            
            // Use advanced parsing to handle multiple formats
            const lines = parseInputText(betText);
            console.log('🔧 [DEBUG] Parsed lines:', lines);
            
            const validation = lines.map((line, index) => {
                const lineNumber = index + 1;
                const trimmedLine = line.trim();
                
                if (!trimmedLine) {
                    return { lineNumber, line: trimmedLine, isValid: true, error: null };
                }

                // Use BetParser if available  
                // FORCE FALLBACK VALIDATION  
                console.log(`🔧 [DEBUG] Validating line ${lineNumber}: "${trimmedLine}"`);
                const fallbackResult = simpleBetParse(trimmedLine);
                
                if (fallbackResult.success) {
                    console.log(`[DEBUG] Line ${lineNumber} VALID:`, fallbackResult.bet);
                    return { 
                        lineNumber, 
                        line: trimmedLine, 
                        isValid: true, 
                        error: null,
                        parsed: fallbackResult.bet,
                        warning: fallbackResult.bet.warning || null
                    };
                } else {
                    console.log(`[DEBUG] Line ${lineNumber} INVALID:`, fallbackResult.error);
                    return { 
                        lineNumber, 
                        line: trimmedLine, 
                        isValid: false, 
                        error: fallbackResult.error,
                        parsed: null
                    };
                }
            });

            setValidationResults(validation);
            setShowValidation(true);
            
            // PERSIST validation to localStorage to survive re-renders
            try {
                localStorage.setItem('lastValidationResults', JSON.stringify({
                    validation: validation,
                    betText: betText.trim(),
                    timestamp: Date.now()
                }));
                console.log(`[VALIDATION] Persisted to localStorage`);
            } catch (e) {
                console.warn(`[VALIDATION] Failed to persist:`, e);
            }
            
            const errorCount = validation.filter(item => !item.isValid).length;
            const totalLines = validation.filter(item => item.line.trim()).length;
            
            console.log(`[VALIDATION] Completed: ${totalLines} lines, ${errorCount} errors`);
            console.log(`[VALIDATION] Setting validationResults:`, validation);
            console.log(`[VALIDATION] State should be set now`);
            
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
                alert('⚠️ Bạn phải kiểm tra cú pháp trước khi đối chiếu!\n\nHãy nhấn nút "Kiểm Tra Cú Pháp" để xác nhận dữ liệu đầu vào hợp lệ.');
                return;
            }
            
            const invalidLines = activeValidationResults.filter(item => item.line.trim() && !item.isValid);
            console.log(`[DEBUG] Invalid lines count:`, invalidLines.length);
            if (invalidLines.length > 0) {
                alert(`❌ Có ${invalidLines.length} dòng lỗi cú pháp!\n\nVui lòng sửa các lỗi sau trước khi đối chiếu:\n\n${invalidLines.slice(0, 5).map(item => `Dòng ${item.lineNumber}: ${item.error}`).join('\n')}${invalidLines.length > 5 ? `\n... và ${invalidLines.length - 5} lỗi khác` : ''}`);
                return;
            }
            
            console.log(`✅ [VALIDATION] Passed: ${activeValidationResults.filter(r => r.isValid && r.line.trim()).length} valid lines`);
        
            
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
                
                console.log(`🔍 Tìm dữ liệu cho ngày: ${parameters.ngay}`);
                
                // Strategy 1: Use requested date with proper info extraction - ASYNC ONLINE
                if (parameters.ngay) {
                    console.log(`[DEBUG] 🌐 Requesting lottery data ONLINE for date: "${parameters.ngay}"`);

                    // ASYNC: Await the fetch
                    lotteryData = await window.getLotteryData(parameters.mien, parameters.ngay);

                    console.log(`[DEBUG] getLotteryData result:`, {
                        hasData: !!lotteryData,
                        dataType: typeof lotteryData,
                        dataKeys: lotteryData ? Object.keys(lotteryData) : null
                    });
                    if (lotteryData) {
                        // Get the actual date info from the data
                        const lotteryInfo = window.getLotteryInfo(parameters.mien, parameters.ngay);
                        actualDataDate = lotteryInfo?.date || parameters.ngay;
                        console.log(`[DEBUG] getLotteryInfo result:`, lotteryInfo);

                        console.log(`✅ Tìm thấy dữ liệu ONLINE - Requested: ${parameters.ngay}, Actual: ${actualDataDate}`);
                        console.log(`Data type: ${lotteryInfo?.dataType || 'rss_online'}`);
                    }
                }
                
                // Strategy 2: REMOVED - No fallback to other dates
                // getDataForDate now handles past dates with simulation data automatically
                
                // Final check with enhanced debugging
                if (!lotteryData) {
                    console.error(`❌ CRITICAL: No lottery data for ${parameters.ngay}`);
                    console.error(`Debug info:`, {
                        requestedDate: parameters.ngay,
                        actualDataDate: actualDataDate,
                        lotteryData: lotteryData,
                        dataServiceAvailable: !!window.LotteryDataService,
                        serviceStatus: window.LotteryDataService?.getStatus?.()
                    });

                    // ONLINE MODE: Show network error message
                    alert(`❌ Không thể lấy dữ liệu xổ số online cho ngày ${parameters.ngay}.\n\nVui lòng kiểm tra:\n- Kết nối mạng\n- Ngày phải là ngày trong quá khứ hoặc hôm nay sau 18:30\n\nThử lại sau vài giây.`);
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
            console.log(`🔧 Parameter changed: ${key} = ${value}`);
            
            setParameters(prev => {
                const newParams = {
                    ...prev,
                    [key]: value
                };
                
                // Auto-save to localStorage for persistence
                try {
                    localStorage.setItem('lottery_parameters', JSON.stringify(newParams));
                    console.log('💾 Parameters saved to localStorage');
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
                        console.log('♻️ Re-processing existing results with updated parameters');
                        // The existing results will be recalculated on next render
                    }
                }, 100);
            }
        }, [results, lotteryResults]);

        // ADVANCED STRING PARSING - Handle multiple formats
        const parseInputText = React.useCallback((inputText) => {
            console.log('Parsing input text, length:', inputText.length);
            
            if (!inputText.trim()) return [];

            let lines = [];
            
            // Strategy 1: Check for comma-separated format in single line
            if (inputText.includes(',') && inputText.split('\n').length === 1) {
                console.log('📝 Detected comma-separated format');
                lines = inputText.split(',').map(item => item.trim()).filter(item => item);
            }
            // Strategy 2: Check for WhatsApp/SMS mixed format (comma + newline)
            else if (inputText.includes(',') && inputText.includes('\n')) {
                console.log('📝 Detected mixed format (comma + newline)');
                // First split by newlines, then by commas
                const rawLines = inputText.split('\n');
                lines = [];
                rawLines.forEach(line => {
                    if (line.includes(',')) {
                        lines.push(...line.split(',').map(item => item.trim()).filter(item => item));
                    } else {
                        lines.push(line.trim());
                    }
                });
                lines = lines.filter(line => line);
            }
            // Strategy 3: Traditional newline format or single line with multiple bets
            else {
                console.log('📝 Detected newline format');
                lines = inputText.split('\n').map(line => line.trim()).filter(line => line);
                
                // If only one line but contains multiple bet patterns, split them
                if (lines.length === 1) {
                    const singleLine = lines[0];
                    // Pattern: "de 54 100k de 34 166k" -> split on bet type keywords
                    const betKeywords = ['lo', 'de', 'đề', 'lô', 'xien', 'xiên', 'ba cang', 'ba càng'];
                    let hasMultipleBets = false;
                    
                    // Count bet keywords
                    let keywordCount = 0;
                    betKeywords.forEach(keyword => {
                        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
                        const matches = singleLine.match(regex);
                        if (matches) keywordCount += matches.length;
                    });
                    
                    if (keywordCount > 1) {
                        console.log(`🔍 Single line contains ${keywordCount} bet keywords, attempting to split`);
                        
                        // Split on bet keywords while preserving the keyword
                        let splitLines = [];
                        let currentBet = '';
                        const words = singleLine.split(/\s+/);
                        
                        for (let i = 0; i < words.length; i++) {
                            const word = words[i].toLowerCase();
                            
                            // If this is a bet keyword and we have content, save previous bet
                            if (betKeywords.includes(word) && currentBet.trim()) {
                                splitLines.push(currentBet.trim());
                                currentBet = words[i]; // Start new bet with keyword
                            } else {
                                currentBet += ' ' + words[i];
                            }
                        }
                        
                        // Add the last bet
                        if (currentBet.trim()) {
                            splitLines.push(currentBet.trim());
                        }
                        
                        if (splitLines.length > 1) {
                            lines = splitLines;
                            console.log(`✅ Successfully split into ${lines.length} bets:`, lines);
                        }
                    }
                }
            }

            console.log('Parsed into', lines.length, 'bet lines');
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
                
                console.log(`⚡ Processing batch ${batchIndex + 1}/${batches} (lines ${start + 1}-${end})`);
                
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
                    React.createElement('div', {className: 'text-red-500 text-6xl mb-6'}, '🚫'),
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
                            }, '💰 Xem Gói Dịch Vụ'),
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
                        }, '🔑 Đăng Nhập')
                    )
                )
            );
        }
        
        return React.createElement('div', {className: 'max-w-7xl mx-auto p-4'}, 
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
                        }, showConfig ? 'Cấu Hình' : '⚙️ Cấu Hình'),

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
                        }, '📋 Xem Arrays')
                    )
                )
            ),
            
            // ============ SECTION A: THAM SỐ HỆ THỐNG (16 FIELDS) ============
            // Configuration Panel
            showConfig && React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-4 mb-6'},
                React.createElement('h2', {className: 'text-lg font-semibold text-[#121212] mb-4'}, '⚙️ Cấu Hình Tham Số'),
                
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
                                const statusIcon = timingCheck.isValid ? '✅' : 
                                                  timingCheck.canProceed ? '⚠️' : '❌';
                                
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
                React.createElement('h3', {className: 'text-md font-medium text-[#7B7B7B] mb-3'}, '💰 16 Tham Số Tính Toán'),
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
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tiền trả 1 điểm lô'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tienTra1DiemLo,
                                onChange: (e) => handleParameterChange('tienTra1DiemLo', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        ),
                        React.createElement('div', {},
                            React.createElement('label', {className: 'block text-sm font-medium text-[#7B7B7B]'}, 'Tỷ lệ lô thu (%)'),
                            React.createElement('input', {
                                type: 'number',
                                value: parameters.tyLeLoThu,
                                onChange: (e) => handleParameterChange('tyLeLoThu', parseInt(e.target.value) || 0),
                                className: 'mt-1 block w-full border rounded-md px-3 py-2 text-sm'
                            })
                        )
                    ),
                    
                    // Đề parameters
                    React.createElement('div', {className: 'space-y-3'},
                        React.createElement('h3', {className: 'font-semibold text-green-600'}, 'Đề (2 tham số)'),
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
                    React.createElement('div', {className: 'text-amber-600 mr-2'}, '⚠️'),
                    React.createElement('div', {},
                        React.createElement('div', {className: 'font-medium text-amber-800'}, 'Cảnh báo thời gian'),
                        React.createElement('div', {className: 'text-amber-700 text-sm'}, rssTimingWarning),
                        React.createElement('div', {className: 'text-amber-600 text-xs mt-1'}, 'Hệ thống sẽ sử dụng simulation để demo. Kết quả thật sẽ có sau 18:15.')
                    )
                )
            ),
            
            // Main layout with two panels
            // ============ SECTION B: NHẬP DỮ LIỆU TIN NHẮN ============
            React.createElement('div', {className: 'grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6'},
                // Left panel - Input
                React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-4'},
                    React.createElement('div', {className: 'flex items-center justify-between mb-4'},
                        React.createElement('h2', {className: 'text-lg font-semibold text-[#121212]'}, 'Nhập Dữ Liệu Cược'),
                        React.createElement('button', {
                            onClick: handleValidateBets,
                            disabled: !betText.trim(),
                            className: 'px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 text-sm'
                        }, 'Kiểm Tra Cú Pháp')
                    ),
                    
                    // Textarea with line numbers
                    React.createElement('div', {className: 'relative'},
                        React.createElement('div', {className: 'flex'},
                            // Line numbers
                            React.createElement('div', {
                                className: 'bg-[#F8F7F7] border-r border-[#ECECEC] p-3 text-[#7B7B7B] text-sm font-mono min-w-[3rem] text-right select-none',
                                style: { lineHeight: '1.5' }
                            }, 
                                betText.split('\n').map((_, index) => {
                                    const validation = validationResults?.find(v => v.lineNumber === index + 1);
                                    const hasError = validation && !validation.isValid;
                                    return React.createElement('div', { 
                                        key: index, 
                                        className: hasError ? 'text-red-500 font-bold' : '',
                                        title: hasError ? validation.error : ''
                                    }, index + 1);
                                }).concat([React.createElement('div', { key: 'end' }, betText.split('\n').length + 1)])
                            ),
                            // Textarea with simplified error styling 
                            React.createElement('div', {className: 'flex-1 relative'},
                                React.createElement('textarea', {
                                    value: betText,
                                    onChange: handleBetTextChange,
                                    placeholder: 'Nhập theo format:\nD 16 500k\nL 23 100k\nX2 12 34 200k',
                                    className: getTextareaClassName(validationResults, betText),
                                    style: { 
                                        lineHeight: '1.5', 
                                        minHeight: '300px',
                                        fontFamily: 'monospace',
                                        fontSize: '14px'
                                    },
                                    spellCheck: false
                                }),
                                
                                // Line-by-line error highlighting overlay
                                validationResults && React.createElement('div', {
                                    className: 'absolute inset-0 pointer-events-none',
                                    style: { 
                                        padding: '12px',
                                        lineHeight: '1.5',
                                        fontFamily: 'monospace',
                                        fontSize: '14px',
                                        zIndex: 5
                                    }
                                },
                                    betText.split('\n').map((line, index) => {
                                        const validation = validationResults.find(v => v.lineNumber === index + 1);
                                        const hasError = validation && !validation.isValid && line.trim();
                                        
                                        return React.createElement('div', {
                                            key: index,
                                            className: hasError ? 'relative' : '',
                                            style: { 
                                                height: '1.5em',
                                                lineHeight: '1.5',
                                                backgroundColor: hasError ? 'rgba(239, 68, 68, 0.15)' : 'transparent',
                                                borderLeft: hasError ? '4px solid #ef4444' : 'none',
                                                paddingLeft: hasError ? '8px' : '0px',
                                                marginLeft: hasError ? '-8px' : '0px',
                                                borderRadius: hasError ? '4px' : 'none',
                                                border: hasError ? '1px solid rgba(239, 68, 68, 0.3)' : 'none'
                                            }
                                        }, hasError ? [
                                            // Invisible spacer text
                                            React.createElement('span', {
                                                key: 'spacer',
                                                style: { color: 'transparent', userSelect: 'none' }
                                            }, line || ' '),
                                            // Red wavy underline at bottom
                                            React.createElement('div', {
                                                key: 'underline',
                                                style: {
                                                    position: 'absolute',
                                                    bottom: '1px',
                                                    left: '8px',
                                                    right: '8px',
                                                    height: '2px',
                                                    backgroundColor: '#ef4444',
                                                    borderRadius: '1px',
                                                    opacity: '0.7'
                                                }
                                            })
                                        ] : React.createElement('span', {
                                            style: { color: 'transparent', userSelect: 'none' }
                                        }, line || ' '));
                                    })
                                ),
                                
                                // Error indicators on the right side
                                validationResults && React.createElement('div', {
                                    className: 'absolute right-2 top-3 pointer-events-none',
                                    style: { lineHeight: '1.5', zIndex: 10 }
                                },
                                    betText.split('\n').map((line, index) => {
                                        const validation = validationResults.find(v => v.lineNumber === index + 1);
                                        const hasError = validation && !validation.isValid && line.trim();
                                        return React.createElement('div', {
                                            key: index,
                                            style: { 
                                                height: '1.5em',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'flex-end'
                                            }
                                        }, hasError && React.createElement('div', {
                                            title: `Dòng ${index + 1}: ${validation.error}`,
                                            style: {
                                                color: '#ef4444',
                                                fontSize: '12px',
                                                fontWeight: 'bold',
                                                backgroundColor: 'white',
                                                borderRadius: '50%',
                                                width: '16px',
                                                height: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                border: '1px solid #ef4444',
                                                cursor: 'help'
                                            }
                                        }, '!'));
                                    })
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
                                    '⚠️ Cần kiểm tra cú pháp trước' :
                                    validationResults.filter(item => item.line.trim() && !item.isValid).length > 0 ?
                                        '❌ Có lỗi cú pháp' :
                                        '✅ Đối Chiếu Kết Quả'
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
                ),
                
                // Right panel - Validation Preview
                React.createElement('div', {className: 'bg-white rounded-lg shadow-md p-4'},
                    React.createElement('h2', {className: 'text-lg font-semibold text-[#121212] mb-4'}, 'Kiểm Tra Cú Pháp'),
                    
                    !showValidation || !validationResults ? 
                        React.createElement('div', {className: 'flex items-center justify-center h-64 text-[#7B7B7B]'},
                            React.createElement('div', {className: 'text-center'},
                                React.createElement('div', {className: 'text-4xl mb-2'}, '📋'),
                                React.createElement('p', {}, 'Nhấn "Kiểm Tra Cú Pháp" để xem kết quả validation')
                            )
                        ) :
                        React.createElement('div', {className: 'space-y-2', style: { maxHeight: '300px', overflowY: 'auto' }},
                            validationResults.map((item, index) => 
                                React.createElement('div', {
                                    key: index,
                                    className: `p-3 rounded border text-sm ${
                                        !item.line ? 'bg-[#F8F7F7] border-[#ECECEC]' :
                                        item.isValid ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-400'
                                    }`
                                },
                                    React.createElement('div', {className: 'flex items-start'},
                                        React.createElement('span', {
                                            className: `min-w-[2.5rem] text-right mr-3 font-bold ${
                                                item.isValid ? 'text-green-600' : 'text-red-600'
                                            }`
                                        }, item.lineNumber),
                                        React.createElement('div', {className: 'flex-1'},
                                            React.createElement('div', {
                                                className: `font-mono p-2 rounded ${
                                                    item.isValid ? 'bg-green-100' : 'bg-red-100'
                                                }`
                                            }, item.line || '(trống)'),
                                            
                                            // Error details
                                            item.error && React.createElement('div', {
                                                className: 'text-red-700 text-sm mt-2 p-2 bg-red-50 rounded border-l-4 border-red-400'
                                            },
                                                React.createElement('strong', {}, 'Lỗi: '),
                                                item.error
                                            ),
                                            
                                            // Success details  
                                            item.isValid && item.line && item.parsed && React.createElement('div', {
                                                className: 'text-green-700 text-sm mt-2 p-2 bg-green-50 rounded border-l-4 border-green-400'
                                            },
                                                React.createElement('div', {},
                                                    React.createElement('strong', {}, 'Hợp lệ: '),
                                                    `${item.parsed.type} - ${item.parsed.numbers?.join(', ')} - ${(item.parsed.money / 1000).toLocaleString()}k`
                                                ),
                                                item.warning && React.createElement('div', {
                                                    className: 'text-orange-600 text-xs mt-1'
                                                }, item.warning)
                                            )
                                        )
                                    )
                                )
                            ),
                            validationResults.length > 0 && React.createElement('div', {className: 'mt-4 pt-3 border-t'},
                                React.createElement('div', {className: 'grid grid-cols-3 gap-4 text-sm'},
                                    React.createElement('div', {className: 'text-center p-2 bg-green-100 rounded'},
                                        React.createElement('div', {className: 'text-2xl font-bold text-green-600'}, 
                                            validationResults.filter(r => r.isValid && r.line.trim()).length
                                        ),
                                        React.createElement('div', {className: 'text-green-700'}, 'Hợp lệ')
                                    ),
                                    React.createElement('div', {className: 'text-center p-2 bg-red-100 rounded'},
                                        React.createElement('div', {className: 'text-2xl font-bold text-red-600'}, 
                                            validationResults.filter(r => !r.isValid && r.line.trim()).length
                                        ),
                                        React.createElement('div', {className: 'text-red-700'}, 'Có lỗi')
                                    ),
                                    React.createElement('div', {className: 'text-center p-2 bg-[#FFEDD5] rounded'},
                                        React.createElement('div', {className: 'text-2xl font-bold text-[#E36323]'}, 
                                            validationResults.filter(r => r.line.trim()).length
                                        ),
                                        React.createElement('div', {className: 'text-[#E36323]'}, 'Tổng dòng')
                                    )
                                )
                            )
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
                                '🎲 Simulation Data' : 
                                '📡 RSS xosodaiphat.com'
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
                                        console.log('🔍 [Table Debug] First item full structure:', JSON.stringify(item, null, 2));
                                        if (item.result) console.log('🔍 [Table Debug] Result object:', item.result);
                                        if (item.bet) console.log('🔍 [Table Debug] Bet object:', item.bet);
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
    console.log('🎉 FINAL VERSION: Complete and functional!');
})();
