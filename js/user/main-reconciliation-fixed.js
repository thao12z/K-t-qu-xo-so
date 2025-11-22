(function() {
    'use strict';
    
    console.log('🧮 STEP 3: Adding checkBetResult function...');
    
    // Helper function
    const getLatestAvailableDate = () => {
        const today = new Date();
        const currentHour = today.getHours();
        const currentMinute = today.getMinutes();
        
        if (currentHour < 18 || (currentHour === 18 && currentMinute < 30)) {
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            return yesterday.toISOString().split('T')[0];
        } else {
            return today.toISOString().split('T')[0];
        }
    };
    
    // DEFAULT_PARAMETERS
    window.DEFAULT_PARAMETERS = {
        mien: 'bac',
        ngay: getLatestAvailableDate(),
        de_gia: 23000,
        de_an: 80,
        lo_gia: 23000,
        lo_an: 80,
        xien_2_gia: 18000,
        xien_2_an: 15,
        xien_3_gia: 17000,
        xien_3_an: 13,
        xien_4_gia: 16000,
        xien_4_an: 12,
        ba_cang_gia: 18000,
        ba_cang_an: 130,
        da_thang_gia: 18000,
        da_thang_an: 7,
        da_xien_gia: 18000,
        da_xien_an: 7,
        lamTronTien: false
    };
    
    // Lottery functions
    window.getLotteryData = (region = 'bac', selectedDate = null) => {
        if (window.LotteryDataService) {
            let data;
            
            if (selectedDate) {
                data = window.LotteryDataService.getDataByDate(selectedDate, region);
            } else {
                data = window.LotteryDataService.getCurrentData(region);
            }
            
            if (data && data.numbers) {
                console.log(`📊 Real lottery data found for ${region}${selectedDate ? ` on ${selectedDate}` : ''}`);
                return data.numbers;
            }
        }
        
        console.error(`❌ No real lottery data available for ${region}${selectedDate ? ` on ${selectedDate}` : ''}`);
        return null;
    };
    
    window.getLotteryInfo = (region = 'bac', selectedDate = null) => {
        if (window.LotteryDataService) {
            const data = window.LotteryDataService.getCurrentData(region);
            if (data) {
                if (selectedDate && data.date !== selectedDate) {
                    return {
                        source: 'Không có dữ liệu cho ngày được chọn',
                        date: selectedDate,
                        dataAvailable: false
                    };
                }
                return {
                    source: 'Dữ liệu thực từ RSS',
                    date: data.date,
                    lastUpdated: data.lastUpdated,
                    dataAvailable: true,
                    region: data.region
                };
            }
        }
        
        return {
            source: 'Không có dữ liệu',
            date: selectedDate || 'unknown',
            dataAvailable: false
        };
    };
    console.log('✅ STEP 3: Lottery functions added');
    
    // Add simple checkBetResult function
    window.checkBetResult = (bet, rawLotteryResults, parameters) => {
        console.log('🔍 STEP 3: checkBetResult called for bet type:', bet.type);
        
        // Simple logic for testing
        if (!bet || !bet.type || !bet.numbers) {
            return { won: false, amount: 0, error: 'Invalid bet' };
        }
        
        if (!rawLotteryResults) {
            return { won: false, amount: 0, error: 'No lottery data' };
        }
        
        // Simple mock result
        const won = Math.random() > 0.5; // 50% chance for testing
        const amount = won ? 1000 : 0;
        
        return { won, amount, error: null };
    };
    console.log('✅ STEP 3: checkBetResult function added');
    
    // Component with more React hooks
    const MainReconciliation = () => {
        console.log('🔍 STEP 3: Component rendering...');
        
        const [parameters, setParameters] = React.useState(window.DEFAULT_PARAMETERS);
        const [betText, setBetText] = React.useState('');
        const [results, setResults] = React.useState(null);
        const [isLoading, setIsLoading] = React.useState(false);
        
        // Test callback
        const handleBetTextChange = React.useCallback((e) => {
            setBetText(e.target.value);
        }, []);
        
        console.log('✅ STEP 3: All hooks defined successfully');
        
        return React.createElement('div', {className: 'max-w-6xl mx-auto p-4'}, 
            React.createElement('h1', {className: 'text-2xl font-bold'}, 'Step 3 MainReconciliation'),
            React.createElement('p', null, `Parameters: ${Object.keys(parameters).length} items`),
            React.createElement('p', null, `Functions available: checkBetResult=${!!window.checkBetResult}`),
            React.createElement('textarea', {
                value: betText,
                onChange: handleBetTextChange,
                placeholder: 'Test input...',
                className: 'w-full p-2 border rounded'
            }),
            React.createElement('p', null, `Loading: ${isLoading}, Results: ${!!results}`)
        );
    };
    console.log('✅ STEP 3: Component with hooks created');
    
    window.MainReconciliation = MainReconciliation;
    console.log('🎉 STEP 3: Complete - Complex functions and hooks work');
})();
