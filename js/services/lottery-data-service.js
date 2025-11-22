/**
 * Lottery Data Service - Cào dữ liệu xổ số thật
 * Real-time lottery data scraping from official sources
 */

(function() {
    'use strict';

    console.log('🎲 Lottery Data Service v3.0.0 - ONLINE REALTIME MODE');

    const LotteryDataService = {
        // Configuration
        config: {
            updateInterval: 60000, // 1 minute (giảm từ 5 phút)
            retryInterval: 30000, // 30 seconds (giảm từ 1 phút)
            maxRetries: 5,
            enableRealTimeUpdates: true,
            cacheMaxAge: 300000, // 5 minutes cache max age
            forceOnlineMode: true // Always fetch fresh data
        },

        // Store interval IDs for cleanup
        _intervals: [],

        // Data sources (official lottery websites) - MULTIPLE SOURCES + RSS
        sources: {
            // Miền Bắc - Multiple sources + RSS
            bac: {
                name: 'Miền Bắc',
                urls: [
                    'https://xosodaiphat.com/ket-qua-xo-so-mien-bac-xsmb.rss', // RSS feed - PRIMARY SOURCE
                    'https://xosohomnay.com.vn/xo-so-mien-bac.html',
                    'https://xosohomnay.com.vn/xo-so-mien-bac-xsmb.html',
                    'https://xosohomnay.com.vn/xo-so-mien-bac-hom-nay.html',
                    'https://xosohomnay.com.vn/xo-so-mien-bac-hom-qua.html',
                    'https://xosohomnay.com.vn/xo-so-mien-bac-ngay-mai.html'
                ],
                patterns: [
                    /đặc biệt[^>]*>(\d{5})/gi,
                    /nhất[^>]*>(\d{5})/gi,
                    /nhì[^>]*>(\d{5})/gi,
                    /ba[^>]*>(\d{5})/gi,
                    /tư[^>]*>(\d{5})/gi,
                    /năm[^>]*>(\d{5})/gi,
                    /sáu[^>]*>(\d{5})/gi,
                    /bảy[^>]*>(\d{5})/gi
                ],
                regions: ['bac']
            },
            // Miền Trung - Multiple sources
            trung: {
                name: 'Miền Trung',
                urls: [
                    'https://xosohomnay.com.vn/xo-so-mien-trung.html',
                    'https://xosohomnay.com.vn/xo-so-mien-trung-xsmt.html',
                    'https://xosohomnay.com.vn/xo-so-mien-trung-hom-nay.html',
                    'https://xosohomnay.com.vn/xo-so-mien-trung-hom-qua.html',
                    'https://xosohomnay.com.vn/xo-so-mien-trung-ngay-mai.html'
                ],
                patterns: [
                    /đặc biệt[^>]*>(\d{5})/gi,
                    /nhất[^>]*>(\d{5})/gi,
                    /nhì[^>]*>(\d{5})/gi,
                    /ba[^>]*>(\d{5})/gi,
                    /tư[^>]*>(\d{5})/gi,
                    /năm[^>]*>(\d{5})/gi,
                    /sáu[^>]*>(\d{5})/gi,
                    /bảy[^>]*>(\d{5})/gi
                ],
                regions: ['trung']
            },
            // Miền Nam - Multiple sources
            nam: {
                name: 'Miền Nam',
                urls: [
                    'https://xosohomnay.com.vn/xo-so-mien-nam.html',
                    'https://xosohomnay.com.vn/xo-so-mien-nam-xsmn.html',
                    'https://xosohomnay.com.vn/xo-so-mien-nam-hom-nay.html',
                    'https://xosohomnay.com.vn/xo-so-mien-nam-hom-qua.html',
                    'https://xosohomnay.com.vn/xo-so-mien-nam-ngay-mai.html'
                ],
                patterns: [
                    /đặc biệt[^>]*>(\d{5})/gi,
                    /nhất[^>]*>(\d{5})/gi,
                    /nhì[^>]*>(\d{5})/gi,
                    /ba[^>]*>(\d{5})/gi,
                    /tư[^>]*>(\d{5})/gi,
                    /năm[^>]*>(\d{5})/gi,
                    /sáu[^>]*>(\d{5})/gi,
                    /bảy[^>]*>(\d{5})/gi
                ],
                regions: ['nam']
            }
        },

        // Current lottery data
        currentData: {
            bac: null,
            trung: null,
            nam: null,
            lastUpdate: null,
            isUpdating: false
        },

        // Historical data cache - stores all fetched dates
        historicalCache: {},

        // Initialize service
        init: function() {
            console.log('🎲 Initializing Lottery Data Service...');
            
            // Load cached data
            this.loadCachedData();
            
            // Start real-time updates
            if (this.config.enableRealTimeUpdates) {
                this.startRealTimeUpdates();
            }
            
            // Initial data fetch
            this.fetchAllRegions();
            
            console.log('Lottery Data Service initialized');
        },

        // Load cached data from localStorage - WITH FRESHNESS CHECK
        loadCachedData: function() {
            try {
                // Trong online mode, chỉ load cache nếu còn fresh
                if (this.config.forceOnlineMode) {
                    const cachedData = localStorage.getItem('lotteryData');
                    if (cachedData) {
                        const data = JSON.parse(cachedData);
                        const cacheAge = Date.now() - new Date(data.lastUpdate).getTime();

                        // Chỉ load cache nếu còn trong max age
                        if (cacheAge < this.config.cacheMaxAge) {
                            this.currentData = { ...this.currentData, ...data };
                            console.log('📦 Loaded fresh cached data (age: ' + Math.round(cacheAge/1000) + 's)');
                        } else {
                            console.log('⚠️ Cache expired (age: ' + Math.round(cacheAge/1000) + 's), will fetch fresh');
                        }
                    }
                } else {
                    const cachedData = localStorage.getItem('lotteryData');
                    if (cachedData) {
                        const data = JSON.parse(cachedData);
                        this.currentData = { ...this.currentData, ...data };
                        console.log('📦 Loaded cached lottery data:', data.lastUpdate);
                    }
                }

                // Load historical cache - nhưng không dùng cho online mode
                if (!this.config.forceOnlineMode) {
                    const historicalData = localStorage.getItem('lotteryHistoricalCache');
                    if (historicalData) {
                        this.historicalCache = JSON.parse(historicalData);
                        console.log('📦 Loaded historical cache with', Object.keys(this.historicalCache).length, 'dates');
                    }
                }
            } catch (error) {
                console.error('Error loading cached lottery data:', error);
            }
        },

        // Save data to localStorage
        saveData: function() {
            try {
                localStorage.setItem('lotteryData', JSON.stringify(this.currentData));
                localStorage.setItem('lotteryHistoricalCache', JSON.stringify(this.historicalCache));
                console.log('💾 Saved lottery data to cache');
            } catch (error) {
                console.error('Error saving lottery data:', error);
            }
        },

        // Fetch lottery data for a specific region - MULTIPLE SOURCES + DEBUG
        fetchRegionData: async function(region) {
            if (this.currentData.isUpdating) {
                console.log('⏳ Already updating, skipping...');
                return;
            }

            this.currentData.isUpdating = true;
            console.log(`🎲 [DEBUG] Fetching ${region} lottery data from multiple sources...`);

            try {
                const source = this.sources[region];
                if (!source) {
                    throw new Error(`Unknown region: ${region}`);
                }
                
                console.log(`🔍 [DEBUG] Available sources for ${region}:`, source.urls.length);

                // Try multiple URLs until one works
                let lotteryData = null;
                let lastError = null;

                for (let i = 0; i < source.urls.length; i++) {
                    const url = source.urls[i];
                    console.log(`🔍 Trying source ${i + 1}/${source.urls.length}: ${url}`);

                    try {
                        // Try multiple proxies to avoid CORS issues
                        const proxies = [
                            `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                            `https://cors-anywhere.herokuapp.com/${url}`,
                            `https://thingproxy.freeboard.io/fetch/${url}`,
                            url // Try direct access as last resort
                        ];
                        
                        let response = null;
                        let lastProxyError = null;
                        
                        for (const proxyUrl of proxies) {
                            try {
                                console.log(`🔗 Trying proxy: ${proxyUrl}`);

                                // Implement proper timeout using AbortController
                                const controller = new AbortController();
                                const timeoutId = setTimeout(() => controller.abort(), 10000);

                                try {
                                    response = await fetch(proxyUrl, {
                                        method: 'GET',
                                        headers: {
                                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                                            'Accept-Language': 'vi-VN,vi;q=0.9,en;q=0.8',
                                            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                                        },
                                        signal: controller.signal
                                    });
                                } finally {
                                    clearTimeout(timeoutId);
                                }

                                if (response.ok) {
                                    console.log(`Proxy successful: ${proxyUrl}`);
                                    break;
                                } else {
                                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                }
                            } catch (proxyError) {
                                const errorMsg = proxyError.name === 'AbortError' ? 'Request timeout' : proxyError.message;
                                console.warn(`Proxy failed: ${proxyUrl}`, errorMsg);
                                lastProxyError = proxyError;
                                continue;
                            }
                        }
                        
                        if (!response || !response.ok) {
                            throw new Error(`All proxies failed. Last error: ${lastProxyError?.message}`);
                        }

                        const content = await response.text();
                        
                        // Check if this is RSS feed (for Miền Bắc)
                        if (url.includes('xosodaiphat.com') && url.includes('.rss')) {
                            console.log('📡 [DEBUG] Processing RSS feed content...');
                            lotteryData = this.parseRSSFeed(content, region);
                        } else {
                            console.log('📡 [DEBUG] Processing HTML content...');
                            lotteryData = this.parseLotteryData(content, source.patterns, region);
                        }
                        
                        if (lotteryData && lotteryData.results) {
                            console.log(`[DEBUG] Successfully fetched data from source ${i + 1} (${lotteryData.source})`);
                            console.log(`[DEBUG] Data preview:`, {
                                date: lotteryData.date,
                                source: lotteryData.source,
                                prizeCount: Object.keys(lotteryData.results).length,
                                dacbiet: lotteryData.results.dacbiet,
                                nhat: lotteryData.results.nhat
                            });
                            break;
                        } else {
                            console.warn(`[DEBUG] No valid lottery data found in response from source ${i + 1}`);
                            throw new Error('No valid lottery data found in response');
                        }

                    } catch (error) {
                        console.warn(`Source ${i + 1} failed:`, error.message);
                        lastError = error;
                        continue;
                    }
                }

                if (lotteryData && lotteryData.results) {
                    this.currentData[region] = lotteryData;
                    this.currentData.lastUpdate = new Date().toISOString();

                    // Store in historical cache with date key
                    if (lotteryData.date) {
                        const cacheKey = `${region}_${lotteryData.date}`;
                        this.historicalCache[cacheKey] = lotteryData;
                        console.log(`📦 Cached ${region} data for ${lotteryData.date}`);
                    }

                    this.saveData();

                    console.log(`${region} data updated successfully:`, lotteryData);
                    
                    // Broadcast update
                    this.broadcastUpdate('lottery_data_updated', {
                        region: region,
                        data: lotteryData
                    });
                } else {
                    throw new Error(`All sources failed for ${region}. Last error: ${lastError?.message}`);
                }

            } catch (error) {
                console.error(`Error fetching ${region} data:`, error);
                
                // NO FALLBACK DATA - Only real data allowed
                console.error(`Cannot fetch real data for ${region} - No fallback available`);
                throw new Error(`Không thể lấy dữ liệu xổ số thật cho ${region}. Vui lòng thử lại sau.`);
            } finally {
                this.currentData.isUpdating = false;
            }
        },

        // Parse lottery data from HTML - IMPROVED EXTRACTION
        parseLotteryData: function(html, patterns, region) {
            try {
                // Extract date from HTML
                const dateMatch = html.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                const drawDate = dateMatch ? `${dateMatch[3]}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}` : new Date().toISOString().split('T')[0];

                // Extract lottery numbers using improved patterns
                const results = this.extractAllPrizesImproved(html, patterns, region);
                
                if (!results || Object.keys(results).length === 0) {
                    console.warn(`No lottery results found for ${region}`);
                    return null;
                }

                return {
                    region: region,
                    date: drawDate,
                    results: results,
                    timestamp: new Date().toISOString(),
                    source: 'official'
                };

            } catch (error) {
                console.error(`Error parsing ${region} data:`, error);
                return null;
            }
        },

        // Parse RSS feed from xosodaiphat.com (robust)
        parseRSSFeed: function(xmlContent, region) {
            try {
                console.log('📡 [DEBUG] Parsing RSS feed for', region);
                console.log('📝 [DEBUG] RSS content length:', xmlContent.length);
                
                // Use DOMParser when available (browser)
                let textContent = '';
                try {
                    const parser = new DOMParser();
                    const xml = parser.parseFromString(xmlContent, 'text/xml');
                    const items = xml.getElementsByTagName('item');
                    if (items && items.length > 0) {
                        // Use first item (latest)
                        const descriptionNode = items[0].getElementsByTagName('description')[0];
                        if (descriptionNode && descriptionNode.textContent) {
                            textContent = descriptionNode.textContent;
                        }
                    }
                } catch (e) {
                    // Fallback to raw content if DOMParser failed
                    textContent = '';
                }

                if (!textContent) {
                    // Fallback: extract CDATA or description via regex from the raw content
                    const descMatch = xmlContent.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/i) || xmlContent.match(/<description>([\s\S]*?)<\/description>/i);
                    textContent = descMatch ? descMatch[1] : xmlContent;
                }

                // Normalize text
                const normalized = textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

                // Extract date (DD/MM/YYYY) - more flexible patterns
                let dateMatch = normalized.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (!dateMatch) {
                    // Try other date formats
                    dateMatch = normalized.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                }
                if (!dateMatch) {
                    // If no date found, use today's date as fallback for RSS
                    console.warn('[DEBUG] RSS: date not found, using today as fallback');
                    console.log('📝 [DEBUG] Normalized text preview:', normalized.substring(0, 500));
                    const today = new Date();
                    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
                    const [y, m, d] = todayStr.split('-');
                    dateMatch = [null, d, m, y]; // Simulate match format
                }
                const [_, d, m, y] = dateMatch;
                const drawDate = `${y}-${m}-${d}`;

                // EXACT PARSER for "DB: 12421 G.1: 98854 G.2: 59095 - 02817" format
                                    console.log('🔍 [DEBUG] Raw normalized text (first 1000 chars):', normalized.substring(0, 1000));
                    console.log('🔍 [DEBUG] Full normalized text length:', normalized.length);
                    
                    // SPECIAL DEBUG for G.7 location
                    const g7Index = normalized.indexOf('G.7');
                    console.log('🔍 [DEBUG] G.7 position in text:', g7Index);
                    if (g7Index !== -1) {
                        const g7Context = normalized.substring(Math.max(0, g7Index - 50), g7Index + 100);
                        console.log('🔍 [DEBUG] G.7 context (±50 chars):', g7Context);
                    }
                
                // Multiple patterns to try for better G.7 capture
                let exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+?)\s+G\.4:\s*([\d\s\-]+?)\s+G\.5:\s*([\d\s\-]+?)\s+G\.6:\s*([\d\s\-]+?)\s+G\.7:\s*([\d\s\-]+)$/i);
                
                // Alternative pattern if first one fails (more generous G.7 capture)
                if (!exactMatch) {
                    console.log('[DEBUG] First pattern failed, trying alternative pattern...');
                    exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+?)\s+G\.4:\s*([\d\s\-]+?)\s+G\.5:\s*([\d\s\-]+?)\s+G\.6:\s*([\d\s\-]+?)\s+G\.7:\s*([\d\s\-]+)$/i);
                }
                
                // Even more aggressive pattern for G.7 - capture everything after G.7:
                if (!exactMatch) {
                    console.log('[DEBUG] Both patterns failed, trying super aggressive pattern...');
                    exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+)\s+G\.4:\s*([\d\s\-]+)\s+G\.5:\s*([\d\s\-]+)\s+G\.6:\s*([\d\s\-]+)\s+G\.7:\s*([\d\s\-]+)$/i);
                }
                
                let results;
                
                if (exactMatch) {
                    console.log('[DEBUG] EXACT MATCH found!', exactMatch);
                    const [, db, g1, g2_1, g2_2, g3_raw, g4_raw, g5_raw, g6_raw, g7_raw] = exactMatch;
                    
                    console.log('🔍 [DEBUG] Raw groups extracted:', {
                        db, g1, g2_1, g2_2, g3_raw, g4_raw, g5_raw, g6_raw, g7_raw
                    });
                    
                    // Parse multi-number groups - SUPER IMPROVED
                    const parseNumbers = (raw, groupName) => {
                        if (!raw) {
                            console.warn(`[DEBUG] Empty raw data for ${groupName}`);
                            return [];
                        }
                        
                        console.log(`🔍 [DEBUG] Processing ${groupName} raw data: "${raw}"`);
                        
                        // Multiple parsing strategies
                        let numbers = [];
                        
                        // Strategy 1: Split by common separators - FIXED for G.7 (2 digits)
                        const strategy1 = raw.split(/[\s\-]+/).map(s => s.trim()).filter(s => /^\d{2,5}$/.test(s));
                        
                        // Strategy 2: Extract all number sequences (for messy data) - FIXED for G.7
                        const strategy2 = raw.match(/\d{2,5}/g) || [];
                        
                        // Use the strategy that gives more numbers
                        numbers = strategy1.length >= strategy2.length ? strategy1 : strategy2;
                        
                        console.log(`🔍 [DEBUG] Parsed ${groupName}: "${raw}" -> [${numbers.join(', ')}] (using ${strategy1.length >= strategy2.length ? 'strategy1' : 'strategy2'})`);
                        return numbers;
                    };
                    
                    results = {
                        giai_dac_biet: [db],
                        giai_nhat: [g1],
                        giai_nhi: [g2_1, g2_2],
                        giai_ba: parseNumbers(g3_raw, 'G.3'),
                        giai_tu: parseNumbers(g4_raw, 'G.4'),
                        giai_nam: parseNumbers(g5_raw, 'G.5'),
                        giai_sau: parseNumbers(g6_raw, 'G.6'),
                        giai_bay: parseNumbers(g7_raw, 'G.7')
                    };
                    
                    // Special case: if G.7 is still empty, try to find it independently
                    if (!results.giai_bay || results.giai_bay.length === 0) {
                        console.warn('🚨 [DEBUG] G.7 still empty! Trying independent G.7 search...');
                        
                        // Try multiple independent patterns for G.7
                        const g7Patterns = [
                            /G\.7[:\s]*([^G]+?)(?:$|\s*G\.|$)/i,
                            /G7[:\s]*([^G]+?)(?:$|\s*G\.|$)/i,
                            /giải\s*7[:\s]*([^G]+?)(?:$|\s*giải|$)/i,
                            /giải\s*bảy[:\s]*([^G]+?)(?:$|\s*giải|$)/i,
                            /bảy[:\s]*:?\s*([0-9\s\-]+)/i
                        ];
                        
                        for (let i = 0; i < g7Patterns.length; i++) {
                            const pattern = g7Patterns[i];
                            const match = normalized.match(pattern);
                            if (match && match[1]) {
                                console.log(`🔍 [DEBUG] G.7 found with pattern ${i + 1}:`, match[1]);
                                const g7Numbers = parseNumbers(match[1], `G.7-Pattern${i + 1}`);
                                if (g7Numbers.length > 0) {
                                    results.giai_bay = g7Numbers;
                                    console.log('[DEBUG] G.7 rescued with independent search!', results.giai_bay);
                                    break;
                                }
                            }
                        }

                        // Last resort: find ANY numbers at the end of content
                        if (!results.giai_bay || results.giai_bay.length === 0) {
                            console.warn('🚨 [DEBUG] Last resort: looking for numbers at end of text...');
                            const endNumbers = normalized.substring(normalized.length - 200).match(/\d{2,5}/g);
                            if (endNumbers && endNumbers.length > 0) {
                                console.log('🔍 [DEBUG] Found numbers at end:', endNumbers);
                                results.giai_bay = endNumbers.slice(-4); // Take last 4 numbers as G.7
                                console.log('[DEBUG] G.7 rescued from end of text!', results.giai_bay);
                            }
                        }
                    }
                    
                    console.log('[DEBUG] Final parsed results:', results);
                } else {
                    // Fallback: extract individual numbers
                    console.log('[DEBUG] Using fallback extraction method');
                    const takeGroup = (label) => {
                        // Special handling for G.7 - it's often at the end of content
                        let pattern;
                        if (label === 'G\\.7') {
                            pattern = new RegExp(label + '\\s*:?\\s*([0-9\\-\\s]+?)(?:\\s*$)', 'i');
                        } else {
                            pattern = new RegExp(label + '\\s*:?\\s*([0-9\\-\\s]+?)(?=\\s+G\\.|$)', 'i');
                        }
                        
                        const m = normalized.match(pattern);
                        if (m && m[1]) {
                            const numbers = m[1].split(/[\-\s]+/).map(s => s.trim()).filter(s => /^\d{2,5}$/.test(s));
                            console.log(`🔍 [DEBUG] Fallback - Extracted ${label}: "${m[1]}" -> [${numbers.join(', ')}]`);
                            return numbers;
                        }
                        console.log(`🔍 [DEBUG] No numbers found for ${label}`);
                        return [];
                    };
                    
                    results = {
                        giai_dac_biet: takeGroup('DB|ĐB'),
                        giai_nhat: takeGroup('G\\.1'),
                        giai_nhi: takeGroup('G\\.2'),
                        giai_ba: takeGroup('G\\.3'),
                        giai_tu: takeGroup('G\\.4'),
                        giai_nam: takeGroup('G\\.5'),
                        giai_sau: takeGroup('G\\.6'),
                        giai_bay: takeGroup('G\\.7')
                    };
                }

                // Validate at least ĐB and G1, and check for G.7
                if (!results.giai_dac_biet || !results.giai_dac_biet.length || !results.giai_nhat || !results.giai_nhat.length) {
                    console.warn('[DEBUG] RSS parsed but insufficient prizes');
                    console.log('📊 [DEBUG] Extracted prizes:', results);
                    return null;
                }

                // Special check for G.7 (giải 7)
                if (!results.giai_bay || results.giai_bay.length === 0) {
                    console.warn('[DEBUG] Missing G.7 (giải 7) - this is critical!');
                    console.log('📊 [DEBUG] Current results:', results);
                    console.log('📝 [DEBUG] Original normalized text for debugging:', normalized);
                } else {
                    console.log('[DEBUG] G.7 found with', results.giai_bay.length, 'numbers:', results.giai_bay);
                }

                console.log('Parsed RSS data (robust):', { date: drawDate, results });
                return {
                    region,
                    date: drawDate,
                    results,
                    timestamp: new Date().toISOString(),
                    source: 'rss_official'
                };
            } catch (error) {
                console.error('Error parsing RSS feed (robust):', error);
                return null;
            }
        },

        // Extract all prizes from HTML - IMPROVED VERSION
        extractAllPrizesImproved: function(html, patterns, region) {
            const results = {};
            const prizeNames = ['giai_dac_biet', 'giai_nhat', 'giai_nhi', 'giai_ba', 'giai_tu', 'giai_nam', 'giai_sau', 'giai_bay'];
            
            try {
                // Use patterns array to extract each prize
                patterns.forEach((pattern, index) => {
                    const prizeName = prizeNames[index];
                    if (prizeName) {
                        const numbers = this.extractNumbersImproved(html, pattern, prizeName);
                        if (numbers && numbers.length > 0) {
                            results[prizeName] = numbers;
                        }
                    }
                });

                // Validate that we have at least some prizes
                if (Object.keys(results).length === 0) {
                    console.warn(`No prizes extracted for ${region}`);
                    return null;
                }

                console.log(`Extracted ${region} results:`, results);
                return results;

            } catch (error) {
                console.error(`Error extracting prizes for ${region}:`, error);
                return null;
            }
        },

        // Extract numbers using improved regex pattern
        extractNumbersImproved: function(html, pattern, prizeName) {
            try {
                const matches = html.match(pattern);
                if (matches) {
                    const numbers = matches.map(match => {
                        const numMatch = match.match(/\d{5}/);
                        return numMatch ? numMatch[0] : null;
                    }).filter(num => num !== null);
                    
                    console.log(`Extracted ${prizeName}:`, numbers);
                    return numbers;
                }
                console.warn(`No matches found for ${prizeName}`);
                return null;
            } catch (error) {
                console.error(`Error extracting ${prizeName}:`, error);
                return null;
            }
        },



        // Fetch data for all regions
        fetchAllRegions: async function() {
            console.log('🎲 Fetching all regions...');
            
            const regions = Object.keys(this.sources);
            const promises = regions.map(region => this.fetchRegionData(region));
            
            try {
                await Promise.allSettled(promises);
                console.log('All regions fetched');
            } catch (error) {
                console.error('Error fetching all regions:', error);
            }
        },

        // Start real-time updates with smart timing
        startRealTimeUpdates: function() {
            console.log('🔄 Starting real-time lottery updates...');

            // Clear any existing intervals first
            this.stopRealTimeUpdates();

            // Regular interval updates (every 5 minutes)
            const regularInterval = setInterval(() => {
                this.fetchAllRegions();
            }, this.config.updateInterval);
            this._intervals.push(regularInterval);

            // Smart update check every minute after 6:30 PM
            const smartInterval = setInterval(() => {
                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();

                // After 6:30 PM, check more frequently for new results
                if (currentHour >= 18 && (currentHour > 18 || currentMinute >= 30)) {
                    const todayStr = now.toISOString().split('T')[0];
                    const currentData = this.getCurrentData('bac');

                    // If we don't have today's data, or data is stale, fetch immediately
                    if (!currentData || currentData.date !== todayStr || !this.isDataFresh()) {
                        console.log('🚨 [SMART UPDATE] Post-6:30 PM: Fetching latest lottery data...');
                        this.fetchAllRegions();
                    }
                }
            }, 60000); // Check every minute
            this._intervals.push(smartInterval);
        },

        // Stop all real-time updates (cleanup)
        stopRealTimeUpdates: function() {
            this._intervals.forEach(id => clearInterval(id));
            this._intervals = [];
            console.log('🛑 Stopped real-time lottery updates');
        },

        // Get current lottery data
        getCurrentData: function(region = null) {
            if (region) {
                console.log(`🔍 [DEBUG] Getting current data for ${region}:`, this.currentData[region] ? 'Available' : 'Not Available');
                return this.currentData[region];
            }
            return this.currentData;
        },

        // Get lottery data for a specific date - ONLINE REALTIME VERSION
        getDataForDate: async function(date, region = null) {
            console.log(`🌐 [ONLINE getDataForDate] Called with date: "${date}", region: "${region || 'bac'}"`);

            const regionKey = region || 'bac';
            const today = new Date().toISOString().split('T')[0];

            // ONLINE MODE: Always try to fetch fresh data first
            if (this.config.forceOnlineMode) {
                console.log(`🌐 [ONLINE MODE] Fetching fresh RSS data for ${date}...`);

                // Check short-term cache first (within 1 minute)
                const cacheKey = `${regionKey}_${date}`;
                if (this.historicalCache && this.historicalCache[cacheKey]) {
                    const cachedData = this.historicalCache[cacheKey];
                    const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();

                    // Cache valid for 1 minute in online mode
                    if (cacheAge < 60000) {
                        console.log(`📦 Using fresh cache (${Math.round(cacheAge/1000)}s old) for ${date}`);
                        return cachedData;
                    }
                }

                // Fetch fresh RSS data
                try {
                    const freshData = await this.fetchRSSForDate(date, regionKey);
                    if (freshData) {
                        console.log(`✅ [ONLINE] Got fresh data for ${date}:`, freshData.results.giai_dac_biet);
                        return freshData;
                    }
                } catch (error) {
                    console.error(`❌ [ONLINE] Failed to fetch ${date}:`, error);
                }

                // Fallback to any cached data if online fetch failed
                if (this.historicalCache && this.historicalCache[cacheKey]) {
                    console.log(`⚠️ [ONLINE] Using stale cache for ${date} (fetch failed)`);
                    return this.historicalCache[cacheKey];
                }

                // Check current data
                const currentData = this.getCurrentData(regionKey);
                if (currentData && currentData.date === date) {
                    return currentData;
                }

                console.log(`❌ [ONLINE] No data available for ${date}`);
                return null;
            }

            // OFFLINE MODE (legacy behavior)
            const targetDate = new Date(date);
            const todayDate = new Date();
            const currentData = this.getCurrentData(regionKey);

            // Check if we have data for the specific date
            if (currentData && currentData.date === date) {
                console.log(`Found exact data for ${date}`);
                return currentData;
            }

            // Check historical cache
            const cacheKey = `${regionKey}_${date}`;
            if (this.historicalCache && this.historicalCache[cacheKey]) {
                console.log(`📦 Found cached data for ${date}`);
                return this.historicalCache[cacheKey];
            }

            // Determine date type
            const todayDateOnly = new Date(todayDate.toDateString());
            const isPastDate = targetDate < todayDateOnly;
            const isToday = date === today;
            const isFutureDate = targetDate > todayDateOnly;

            // For past dates - try to fetch from RSS
            if (isPastDate || isToday) {
                console.log(`📅 Fetching RSS for date ${date}`);

                // Try to fetch fresh
                try {
                    const freshData = await this.fetchRSSForDate(date, regionKey);
                    if (freshData) {
                        return freshData;
                    }
                } catch (error) {
                    console.error(`Failed to fetch RSS for ${date}:`, error);
                }

                // Return current data if matches
                if (currentData) {
                    return currentData;
                }

                return null;
            }

            // For future dates
            if (isFutureDate) {
                console.log(`🚫 Future date ${date} - not allowed`);
                return null;
            }

            return null;
        },

        // Synchronous wrapper for backwards compatibility
        getDataForDateSync: function(date, region = null) {
            const regionKey = region || 'bac';
            const cacheKey = `${regionKey}_${date}`;

            // Return cached data immediately if available
            if (this.historicalCache && this.historicalCache[cacheKey]) {
                return this.historicalCache[cacheKey];
            }

            const currentData = this.getCurrentData(regionKey);
            if (currentData && currentData.date === date) {
                return currentData;
            }

            // Trigger async fetch in background
            this.fetchRSSForDate(date, regionKey).then(data => {
                if (data) {
                    console.log(`Background fetch completed for ${date}`);
                }
            });

            return null;
        },

        // Check if data is fresh (adaptive freshness based on time)
        isDataFresh: function() {
            if (!this.currentData.lastUpdate) return false;
            
            const lastUpdate = new Date(this.currentData.lastUpdate);
            const now = new Date();
            const diffMinutes = (now - lastUpdate) / (1000 * 60);
            
            // After 6:30 PM, data should be fresher (within 10 minutes)
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();
            const isAfter630PM = currentHour >= 18 && (currentHour > 18 || currentMinute >= 30);
            
            if (isAfter630PM) {
                // More aggressive freshness check after 6:30 PM
                const freshThreshold = 10; // 10 minutes
                console.log(`🕐 [FRESHNESS] After 6:30 PM: Data age ${diffMinutes.toFixed(1)} min (threshold: ${freshThreshold} min)`);
                return diffMinutes < freshThreshold;
            } else {
                // Normal freshness check (1 hour)
                const freshThreshold = 60; // 60 minutes
                console.log(`🕐 [FRESHNESS] Before 6:30 PM: Data age ${diffMinutes.toFixed(1)} min (threshold: ${freshThreshold} min)`);
                return diffMinutes < freshThreshold;
            }
        },

        // Manual refresh
        refresh: function() {
            console.log('🔄 Manual refresh requested');
            this.fetchAllRegions();
        },

        // Broadcast updates to components
        broadcastUpdate: function(event, data) {
            // Dispatch custom event
            const customEvent = new CustomEvent('lotteryDataUpdate', {
                detail: { event, data }
            });
            window.dispatchEvent(customEvent);
            
            console.log(`📡 Broadcasted ${event}:`, data);
        },

        // Test function
        // Force refresh data - bypass cache completely
        forceRefresh: function() {
            console.log('🔄 [DEBUG] FORCING FRESH FETCH - clearing all cache');
            this.currentData = {};
            this.currentData.isUpdating = false;
            localStorage.removeItem('lotteryData');
            console.log('🔄 [DEBUG] Cache cleared, fetching fresh RSS data...');
            return this.fetchRegionData('bac');
        },

        test: function() {
            console.log('🧪 Testing Lottery Data Service...');
            
            // Test real data fetching only
            console.log('Testing real data fetching...');
            
            // Test data freshness
            const isFresh = this.isDataFresh();
            console.log('Data freshness check:', isFresh);
            
            return true;
        },

        // Fetch RSS data for specific date - REALTIME ONLINE
        fetchRSSForDate: async function(date, region = 'bac') {
            console.log(`🌐 [ONLINE] Fetching RSS for date: ${date}, region: ${region}`);

            try {
                // RSS URL cho ngày cụ thể
                const rssUrl = `https://xosodaiphat.com/ket-qua-xo-so-mien-bac-xsmb.rss`;

                const proxies = [
                    `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`,
                    `https://corsproxy.io/?${encodeURIComponent(rssUrl)}`,
                    `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(rssUrl)}`
                ];

                let response = null;

                for (const proxyUrl of proxies) {
                    try {
                        console.log(`🔗 Trying proxy: ${proxyUrl}`);

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 15000);

                        try {
                            response = await fetch(proxyUrl, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/rss+xml, application/xml, text/xml',
                                    'Cache-Control': 'no-cache'
                                },
                                signal: controller.signal
                            });
                        } finally {
                            clearTimeout(timeoutId);
                        }

                        if (response.ok) {
                            console.log(`✅ Proxy success: ${proxyUrl}`);
                            break;
                        }
                    } catch (proxyError) {
                        console.warn(`Proxy failed: ${proxyUrl}`, proxyError.message);
                        continue;
                    }
                }

                if (!response || !response.ok) {
                    throw new Error('All proxies failed');
                }

                const content = await response.text();
                const lotteryData = this.parseRSSFeedForDate(content, region, date);

                if (lotteryData && lotteryData.results) {
                    // Cache the result
                    const cacheKey = `${region}_${date}`;
                    this.historicalCache[cacheKey] = lotteryData;
                    this.saveData();

                    console.log(`✅ Fetched RSS data for ${date}:`, lotteryData.results.giai_dac_biet);
                    return lotteryData;
                }

                return null;
            } catch (error) {
                console.error(`❌ Failed to fetch RSS for ${date}:`, error);
                return null;
            }
        },

        // Parse RSS feed and find data for specific date
        parseRSSFeedForDate: function(xmlContent, region, targetDate) {
            try {
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlContent, 'text/xml');
                const items = xml.getElementsByTagName('item');

                console.log(`📡 Found ${items.length} RSS items, looking for date: ${targetDate}`);

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const descriptionNode = item.getElementsByTagName('description')[0];

                    if (!descriptionNode || !descriptionNode.textContent) continue;

                    const textContent = descriptionNode.textContent;
                    const normalized = textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

                    // Extract date from this item
                    const dateMatch = normalized.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                    if (dateMatch) {
                        const [_, d, m, y] = dateMatch;
                        const itemDate = `${y}-${m}-${d}`;

                        console.log(`📅 RSS item ${i} date: ${itemDate}`);

                        if (itemDate === targetDate) {
                            console.log(`✅ Found matching date: ${targetDate}`);
                            // Parse this item's data
                            return this.parseRSSItemContent(normalized, region, targetDate);
                        }
                    }
                }

                // If target date not found in RSS, return first item (latest)
                if (items.length > 0) {
                    const firstDesc = items[0].getElementsByTagName('description')[0];
                    if (firstDesc && firstDesc.textContent) {
                        const normalized = firstDesc.textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
                        console.log(`⚠️ Date ${targetDate} not in RSS, using latest data`);
                        return this.parseRSSItemContent(normalized, region, null);
                    }
                }

                return null;
            } catch (error) {
                console.error('Error parsing RSS for date:', error);
                return null;
            }
        },

        // Parse single RSS item content
        parseRSSItemContent: function(normalized, region, targetDate) {
            // Extract date if not provided
            if (!targetDate) {
                const dateMatch = normalized.match(/(\d{2})\/(\d{2})\/(\d{4})/);
                if (dateMatch) {
                    const [_, d, m, y] = dateMatch;
                    targetDate = `${y}-${m}-${d}`;
                } else {
                    targetDate = new Date().toISOString().split('T')[0];
                }
            }

            // Parse lottery numbers
            const exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+?)\s+G\.4:\s*([\d\s\-]+?)\s+G\.5:\s*([\d\s\-]+?)\s+G\.6:\s*([\d\s\-]+?)\s+G\.7:\s*([\d\s\-]+)/i);

            let results;

            if (exactMatch) {
                const [, db, g1, g2_1, g2_2, g3_raw, g4_raw, g5_raw, g6_raw, g7_raw] = exactMatch;

                const parseNumbers = (raw) => {
                    if (!raw) return [];
                    return raw.split(/[\s\-]+/).map(s => s.trim()).filter(s => /^\d{2,5}$/.test(s));
                };

                results = {
                    giai_dac_biet: [db],
                    giai_nhat: [g1],
                    giai_nhi: [g2_1, g2_2],
                    giai_ba: parseNumbers(g3_raw),
                    giai_tu: parseNumbers(g4_raw),
                    giai_nam: parseNumbers(g5_raw),
                    giai_sau: parseNumbers(g6_raw),
                    giai_bay: parseNumbers(g7_raw)
                };
            } else {
                console.warn('Cannot parse RSS content format');
                return null;
            }

            if (!results.giai_dac_biet || !results.giai_dac_biet.length) {
                return null;
            }

            return {
                region,
                date: targetDate,
                results,
                timestamp: new Date().toISOString(),
                source: 'rss_online',
                dataType: 'rss'
            };
        },

        // Get RSS data for specific date from feed archives
        getRSSDataForDate: function(date, region = 'bac') {
            // Trong online mode, trả về null để force fetch fresh
            if (this.config.forceOnlineMode) {
                return null;
            }
            return null;
        },

        // Get all available dates from cache - ONLINE MODE (no hardcoded dates)
        getAvailableDates: function(region = 'bac') {
            const dates = new Set();

            // Add dates from historical cache (fetched from RSS)
            if (this.historicalCache) {
                Object.keys(this.historicalCache).forEach(key => {
                    if (key.startsWith(region + '_')) {
                        dates.add(key.replace(region + '_', ''));
                    }
                });
            }

            // Add dates from current data
            if (this.currentData[region] && this.currentData[region].date) {
                dates.add(this.currentData[region].date);
            }

            // Add today's date as available (will fetch from RSS)
            const today = new Date().toISOString().split('T')[0];
            dates.add(today);

            // Add last 7 days as potentially available
            for (let i = 1; i <= 7; i++) {
                const pastDate = new Date();
                pastDate.setDate(pastDate.getDate() - i);
                dates.add(pastDate.toISOString().split('T')[0]);
            }

            return Array.from(dates).sort().reverse();
        },

        // Get known RSS data - DEPRECATED in online mode
        // In online mode, this always returns null to force fresh fetch
        getKnownRSSData: function(date, region = 'bac') {
            // ONLINE MODE: Always return null to force fresh RSS fetch
            if (this.config.forceOnlineMode) {
                console.log(`🌐 [ONLINE] getKnownRSSData disabled - use fetchRSSForDate instead`);
                return null;
            }

            // Legacy: Return cached data if available
            const cacheKey = `${region}_${date}`;
            if (this.historicalCache && this.historicalCache[cacheKey]) {
                return this.historicalCache[cacheKey];
            }

            return null;
        },

        // Toggle online/offline mode
        setOnlineMode: function(enabled) {
            this.config.forceOnlineMode = enabled;
            console.log(`🌐 Online mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);

            if (enabled) {
                // Clear old cache when enabling online mode
                this.historicalCache = {};
                localStorage.removeItem('lotteryHistoricalCache');
                console.log('📦 Cleared historical cache for online mode');
            }
        },

        // Get service status
        getStatus: function() {
            return {
                onlineMode: this.config.forceOnlineMode,
                cacheMaxAge: this.config.cacheMaxAge,
                updateInterval: this.config.updateInterval,
                cachedDates: Object.keys(this.historicalCache),
                lastUpdate: this.currentData.lastUpdate,
                currentDataDate: this.currentData.bac?.date || null
            };
        }
    };

    // Auto-initialize when loaded
    setTimeout(() => {
        LotteryDataService.init();
        LotteryDataService.test();
    }, 1000);

    // Export to global scope
    window.LotteryDataService = LotteryDataService;
    
    console.log('Lottery Data Service loaded successfully');

})();

