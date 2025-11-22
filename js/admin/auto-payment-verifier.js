// 🤖 AUTO PAYMENT VERIFIER MODULE
// Version: 1.0.0 | Created: 2024
// Tự động khớp giao dịch ngân hàng với pending payments
(function() {
    'use strict';

    const logger = {
        log: (...args) => window.Logger ? window.Logger.log(...args) : console.log(...args),
        warn: (...args) => window.Logger ? window.Logger.warn(...args) : console.warn(...args),
        error: (...args) => window.Logger ? window.Logger.error(...args) : console.error(...args),
        info: (...args) => window.Logger ? window.Logger.info(...args) : console.info(...args)
    };

    logger.log('🤖 [AutoPaymentVerifier] Loading version 1.0.0');

    const { useState, useCallback, memo } = React;

    // ===== AUTO PAYMENT VERIFIER SERVICE =====
    const AutoPaymentVerifierService = {
        /**
         * Parse bank transaction text
         * Supports multiple formats:
         * - SMS format: "+500,000 VND từ ... Nội dung: ORDER123456..."
         * - Bank statement: "15/11/2024 | +500,000 | ORDER123456 | ..."
         * - Simple format: "ORDER123456 500000"
         */
        parseTransactions(rawText) {
            const transactions = [];
            const lines = rawText.split('\n').filter(line => line.trim());

            for (const line of lines) {
                const transaction = this.parseSingleTransaction(line);
                if (transaction) {
                    transactions.push(transaction);
                }
            }

            logger.log('🤖 [AutoPaymentVerifier] Parsed transactions:', transactions.length);
            return transactions;
        },

        parseSingleTransaction(line) {
            // Extract Order ID (format: ORDER + timestamp + random)
            const orderIdMatch = line.match(/ORDER\d{13,}/i);
            if (!orderIdMatch) return null;

            const orderId = orderIdMatch[0].toUpperCase();

            // Extract amount (supports: 500000, 500,000, 500.000)
            const amountMatch = line.match(/(\d{1,3}(?:[.,]\d{3})*|\d+)/g);
            let amount = 0;

            if (amountMatch) {
                // Find the number that looks like a payment amount (usually larger)
                for (const match of amountMatch) {
                    const cleanAmount = parseInt(match.replace(/[.,]/g, ''));
                    if (cleanAmount >= 10000 && cleanAmount > amount) {
                        amount = cleanAmount;
                    }
                }
            }

            // Extract date if present
            const dateMatch = line.match(/(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/);
            const date = dateMatch ? dateMatch[1] : new Date().toLocaleDateString('vi-VN');

            return {
                orderId,
                amount,
                date,
                rawLine: line
            };
        },

        /**
         * Match transactions with pending payments
         */
        matchWithPendingPayments(transactions) {
            if (!window.GlobalStateManager) {
                logger.error('❌ [AutoPaymentVerifier] GlobalStateManager not available');
                return { matched: [], unmatched: transactions };
            }

            const payments = window.GlobalStateManager.getData('payments');
            const pendingPayments = payments.filter(p => p.status === 'pending');

            const matched = [];
            const unmatched = [];

            for (const transaction of transactions) {
                // Find matching pending payment by Order ID
                const matchingPayment = pendingPayments.find(payment => {
                    // Check orderId field
                    if (payment.orderId && payment.orderId.toUpperCase() === transaction.orderId) {
                        return true;
                    }
                    // Check transferContent field
                    if (payment.transferContent &&
                        payment.transferContent.toUpperCase().includes(transaction.orderId)) {
                        return true;
                    }
                    return false;
                });

                if (matchingPayment) {
                    // Validate amount if both have values
                    const amountMatch = transaction.amount === 0 ||
                                       matchingPayment.amount === transaction.amount ||
                                       Math.abs(matchingPayment.amount - transaction.amount) <= 1000; // Allow small variance

                    matched.push({
                        transaction,
                        payment: matchingPayment,
                        amountMatch,
                        confidence: amountMatch ? 'high' : 'medium'
                    });
                } else {
                    unmatched.push(transaction);
                }
            }

            logger.log('🤖 [AutoPaymentVerifier] Match results:', {
                matched: matched.length,
                unmatched: unmatched.length
            });

            return { matched, unmatched };
        },

        /**
         * Auto-approve matched payments
         */
        approveMatchedPayments(matchedItems, approveAll = false) {
            if (!window.GlobalStateManager) {
                return { success: 0, failed: 0 };
            }

            let success = 0;
            let failed = 0;

            const itemsToApprove = approveAll
                ? matchedItems
                : matchedItems.filter(item => item.confidence === 'high');

            for (const item of itemsToApprove) {
                try {
                    const payment = item.payment;
                    const packageInfo = window.GlobalStateManager.findPackage(payment.packageId);
                    const user = window.GlobalStateManager.findUser(payment.userId);

                    if (!packageInfo || !user) {
                        failed++;
                        continue;
                    }

                    // Calculate activation data
                    let expiryDate = null;
                    if (packageInfo.duration) {
                        const expiry = new Date();
                        expiry.setDate(expiry.getDate() + packageInfo.duration);
                        expiryDate = expiry.toISOString().split('T')[0];
                    }

                    const activationData = {
                        packageId: payment.packageId,
                        packageName: packageInfo.name,
                        expiryDate: expiryDate,
                        userName: user.fullName
                    };

                    // Perform approval
                    const result = window.GlobalStateManager.updatePaymentAndUser(
                        payment.id,
                        payment.userId,
                        activationData
                    );

                    if (result) {
                        success++;
                        logger.log('✅ [AutoPaymentVerifier] Auto-approved:', {
                            orderId: payment.orderId,
                            user: user.fullName
                        });
                    } else {
                        failed++;
                    }
                } catch (error) {
                    logger.error('❌ [AutoPaymentVerifier] Error approving payment:', error);
                    failed++;
                }
            }

            return { success, failed };
        }
    };

    // ===== AUTO PAYMENT VERIFIER COMPONENT =====
    const AutoPaymentVerifier = memo(() => {
        const [rawText, setRawText] = useState('');
        const [results, setResults] = useState(null);
        const [processing, setProcessing] = useState(false);

        // Parse and match transactions
        const handleVerify = useCallback(() => {
            if (!rawText.trim()) {
                alert('Vui lòng nhập dữ liệu giao dịch ngân hàng');
                return;
            }

            setProcessing(true);

            try {
                const transactions = AutoPaymentVerifierService.parseTransactions(rawText);

                if (transactions.length === 0) {
                    alert('Không tìm thấy giao dịch hợp lệ. Vui lòng kiểm tra định dạng dữ liệu.');
                    setProcessing(false);
                    return;
                }

                const matchResults = AutoPaymentVerifierService.matchWithPendingPayments(transactions);
                setResults(matchResults);

            } catch (error) {
                logger.error('❌ [AutoPaymentVerifier] Error:', error);
                alert('Lỗi xử lý dữ liệu: ' + error.message);
            }

            setProcessing(false);
        }, [rawText]);

        // Auto-approve all high confidence matches
        const handleAutoApprove = useCallback(() => {
            if (!results || results.matched.length === 0) return;

            const highConfidence = results.matched.filter(m => m.confidence === 'high');

            if (highConfidence.length === 0) {
                alert('Không có giao dịch nào đủ độ tin cậy để tự động duyệt');
                return;
            }

            if (!confirm(`Tự động duyệt ${highConfidence.length} giao dịch?`)) {
                return;
            }

            const { success, failed } = AutoPaymentVerifierService.approveMatchedPayments(
                results.matched,
                false // Only high confidence
            );

            window.GlobalStateManager.addNotification(
                `✅ Đã tự động duyệt ${success} giao dịch${failed > 0 ? `, ${failed} lỗi` : ''}`,
                success > 0 ? 'success' : 'warning',
                'AutoPaymentVerifier'
            );

            // Clear results
            setResults(null);
            setRawText('');

        }, [results]);

        // Approve single match
        const handleApproveSingle = useCallback((matchItem) => {
            const { success, failed } = AutoPaymentVerifierService.approveMatchedPayments([matchItem], true);

            if (success > 0) {
                // Remove from results
                setResults(prev => ({
                    ...prev,
                    matched: prev.matched.filter(m => m.payment.id !== matchItem.payment.id)
                }));

                window.GlobalStateManager.addNotification(
                    `✅ Đã duyệt giao dịch ${matchItem.payment.orderId}`,
                    'success',
                    'AutoPaymentVerifier'
                );
            } else {
                alert('Lỗi khi duyệt giao dịch');
            }
        }, []);

        // Format currency
        const formatCurrency = useCallback((amount) => {
            return new Intl.NumberFormat('vi-VN', {
                style: 'currency',
                currency: 'VND'
            }).format(amount);
        }, []);

        return React.createElement('div', { className: 'space-y-6' },
            // Header
            React.createElement('div', { className: 'flex justify-between items-center' },
                React.createElement('h2', { className: 'text-xl font-bold' }, '🤖 Auto Payment Verifier'),
                results && results.matched.length > 0 && React.createElement(window.Button, {
                    variant: 'success',
                    onClick: handleAutoApprove
                }, `✅ Tự động duyệt (${results.matched.filter(m => m.confidence === 'high').length})`)
            ),

            // Input section
            React.createElement(window.Card, { title: '📋 Nhập dữ liệu giao dịch ngân hàng' },
                React.createElement('div', { className: 'space-y-4' },
                    // Instructions
                    React.createElement('div', { className: 'bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm' },
                        React.createElement('p', { className: 'font-medium text-blue-800 mb-2' },
                            '📌 Hướng dẫn sử dụng:'
                        ),
                        React.createElement('ul', { className: 'list-disc list-inside text-blue-700 space-y-1' },
                            React.createElement('li', {}, 'Copy lịch sử giao dịch từ app ngân hàng hoặc SMS'),
                            React.createElement('li', {}, 'Paste vào ô bên dưới'),
                            React.createElement('li', {}, 'Hệ thống sẽ tự động tìm Order ID và khớp với pending payments'),
                            React.createElement('li', {}, 'Xác nhận để tự động duyệt')
                        )
                    ),

                    // Text input
                    React.createElement('textarea', {
                        value: rawText,
                        onChange: (e) => setRawText(e.target.value),
                        placeholder: `Ví dụ:\n+500,000 VND từ NGUYEN VAN A. Nội dung: ORDER1700000000000123\n15/11/2024 | 300,000 | ORDER1700000000000456 thanh toan goi Pro\nORDER1700000000000789 100000`,
                        className: 'w-full h-40 p-3 border rounded-lg font-mono text-sm resize-none focus:border-[#E36323] focus:ring-1 focus:ring-[#E36323] outline-none',
                        disabled: processing
                    }),

                    // Verify button
                    React.createElement('div', { className: 'flex justify-end' },
                        React.createElement(window.Button, {
                            onClick: handleVerify,
                            disabled: processing || !rawText.trim(),
                            variant: 'primary'
                        }, processing ? '⏳ Đang xử lý...' : '🔍 Kiểm tra & Khớp')
                    )
                )
            ),

            // Results section
            results && React.createElement('div', { className: 'space-y-4' },
                // Matched transactions
                results.matched.length > 0 && React.createElement(window.Card, {
                    title: `✅ Giao dịch khớp (${results.matched.length})`
                },
                    React.createElement('div', { className: 'space-y-3' },
                        results.matched.map((match, index) =>
                            React.createElement('div', {
                                key: index,
                                className: `border rounded-lg p-4 ${
                                    match.confidence === 'high'
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-yellow-50 border-yellow-200'
                                }`
                            },
                                React.createElement('div', { className: 'flex justify-between items-start' },
                                    React.createElement('div', { className: 'flex-1' },
                                        React.createElement('div', { className: 'flex items-center gap-2 mb-2' },
                                            React.createElement('span', {
                                                className: 'font-mono font-bold text-[#E36323]'
                                            }, match.transaction.orderId),
                                            React.createElement(window.Badge, {
                                                variant: match.confidence === 'high' ? 'success' : 'warning'
                                            }, match.confidence === 'high' ? 'Độ tin cậy cao' : 'Cần kiểm tra')
                                        ),
                                        React.createElement('div', { className: 'grid grid-cols-2 gap-2 text-sm' },
                                            React.createElement('div', {},
                                                React.createElement('span', { className: 'text-[#7B7B7B]' }, 'Số tiền GD: '),
                                                React.createElement('span', { className: 'font-medium' },
                                                    match.transaction.amount > 0
                                                        ? formatCurrency(match.transaction.amount)
                                                        : 'N/A'
                                                )
                                            ),
                                            React.createElement('div', {},
                                                React.createElement('span', { className: 'text-[#7B7B7B]' }, 'Số tiền cần: '),
                                                React.createElement('span', { className: 'font-medium' },
                                                    formatCurrency(match.payment.amount)
                                                )
                                            ),
                                            React.createElement('div', {},
                                                React.createElement('span', { className: 'text-[#7B7B7B]' }, 'User: '),
                                                React.createElement('span', { className: 'font-medium' },
                                                    match.payment.userId
                                                )
                                            ),
                                            React.createElement('div', {},
                                                React.createElement('span', { className: 'text-[#7B7B7B]' }, 'Ngày GD: '),
                                                React.createElement('span', { className: 'font-medium' },
                                                    match.transaction.date
                                                )
                                            )
                                        ),
                                        !match.amountMatch && React.createElement('p', {
                                            className: 'text-sm text-yellow-700 mt-2'
                                        }, '⚠️ Số tiền không khớp chính xác')
                                    ),
                                    React.createElement(window.Button, {
                                        size: 'small',
                                        variant: 'success',
                                        onClick: () => handleApproveSingle(match)
                                    }, '✅ Duyệt')
                                )
                            )
                        )
                    )
                ),

                // Unmatched transactions
                results.unmatched.length > 0 && React.createElement(window.Card, {
                    title: `❓ Không tìm thấy (${results.unmatched.length})`
                },
                    React.createElement('div', { className: 'space-y-2' },
                        results.unmatched.map((transaction, index) =>
                            React.createElement('div', {
                                key: index,
                                className: 'bg-gray-50 border rounded-lg p-3 text-sm'
                            },
                                React.createElement('div', { className: 'flex justify-between' },
                                    React.createElement('span', { className: 'font-mono text-[#E36323]' },
                                        transaction.orderId
                                    ),
                                    React.createElement('span', { className: 'text-[#7B7B7B]' },
                                        transaction.amount > 0
                                            ? formatCurrency(transaction.amount)
                                            : 'N/A'
                                    )
                                ),
                                React.createElement('p', { className: 'text-[#7B7B7B] mt-1 text-xs truncate' },
                                    transaction.rawLine
                                )
                            )
                        ),
                        React.createElement('p', { className: 'text-sm text-[#7B7B7B] mt-2' },
                            'Các giao dịch này không khớp với pending payments nào. Có thể đã được duyệt hoặc Order ID không đúng.'
                        )
                    )
                ),

                // No matches at all
                results.matched.length === 0 && results.unmatched.length > 0 &&
                React.createElement('div', { className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center' },
                    React.createElement('p', { className: 'text-yellow-800' },
                        '⚠️ Không tìm thấy giao dịch nào khớp với pending payments'
                    )
                )
            )
        );
    });

    // ===== EXPORT TO GLOBAL SCOPE =====
    window.AutoPaymentVerifier = AutoPaymentVerifier;
    window.AutoPaymentVerifierService = AutoPaymentVerifierService;

    logger.log('✅ [AutoPaymentVerifier] Module loaded successfully');

})();
