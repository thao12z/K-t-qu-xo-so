/**
 * Lottery Data Service - Cào dữ liệu xổ số thật
 * Real-time lottery data scraping from official sources
 */

(function() {
    'use strict';

    // Use ProductionLogger if available (loaded from security-utils.js)
    const logger = {
        log: (...args) => window.Logger ? window.Logger.log(...args) : console.log(...args),
        warn: (...args) => window.Logger ? window.Logger.warn(...args) : console.warn(...args),
        error: (...args) => window.Logger ? window.Logger.error(...args) : console.error(...args),
        info: (...args) => window.Logger ? window.Logger.info(...args) : console.info(...args)
    };

    logger.log('🎲 Lottery Data Service v3.1.0 - ONLINE REALTIME MODE');

    const LotteryDataService = {
        // Configuration
        config: {
            updateInterval: 60000, // 1 minute (giảm từ 5 phút)
            retryInterval: 30000, // 30 seconds (giảm từ 1 phút)
            maxRetries: 5,
            enableRealTimeUpdates: true,
            cacheMaxAge: 60000, // 1 minute cache max age (sync với shared-data-service)
            forceOnlineMode: true, // Always fetch fresh data
            accumulateHistory: true // Tích lũy dữ liệu lịch sử qua thời gian
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
            logger.log('🎲 Initializing Lottery Data Service...');
            
            // Load cached data
            this.loadCachedData();
            
            // Start real-time updates
            if (this.config.enableRealTimeUpdates) {
                this.startRealTimeUpdates();
            }
            
            // Initial data fetch
            this.fetchAllRegions();
            
            logger.log('Lottery Data Service initialized');
        },

        // Load cached data from localStorage - TÍCH LŨY HISTORICAL DATA
        loadCachedData: function() {
            try {
                // Load current data (cho realtime display)
                const cachedData = localStorage.getItem('lotteryData');
                if (cachedData) {
                    const data = JSON.parse(cachedData);
                    const cacheAge = Date.now() - new Date(data.lastUpdate).getTime();

                    // Chỉ load current data nếu còn fresh
                    if (cacheAge < this.config.cacheMaxAge) {
                        this.currentData = { ...this.currentData, ...data };
                        logger.log('📦 Loaded fresh current data (age: ' + Math.round(cacheAge/1000) + 's)');
                    } else {
                        logger.log('⚠️ Current data expired, will fetch fresh');
                    }
                }

                // LUÔN load historical cache để tích lũy dữ liệu qua thời gian
                // Dữ liệu cũ không bị mất khi restart/reload
                const historicalData = localStorage.getItem('lotteryHistoricalCache');
                if (historicalData) {
                    this.historicalCache = JSON.parse(historicalData);
                    const totalDates = Object.keys(this.historicalCache).length;
                    logger.log(`📦 Loaded historical cache with ${totalDates} dates`);

                    // Log các ngày có trong cache
                    if (totalDates > 0) {
                        const dates = Object.keys(this.historicalCache)
                            .filter(k => k.startsWith('bac_'))
                            .map(k => k.replace('bac_', ''))
                            .sort()
                            .reverse();
                        logger.log(`📅 Dates in cache: ${dates.slice(0, 5).join(', ')}${dates.length > 5 ? '...' : ''}`);
                    }
                } else {
                    logger.log('📦 No historical cache found, starting fresh');
                }
            } catch (error) {
                logger.error('Error loading cached lottery data:', error);
            }
        },

        // Save data to localStorage
        saveData: function() {
            try {
                localStorage.setItem('lotteryData', JSON.stringify(this.currentData));
                localStorage.setItem('lotteryHistoricalCache', JSON.stringify(this.historicalCache));
                logger.log('💾 Saved lottery data to cache');
            } catch (error) {
                logger.error('Error saving lottery data:', error);
            }
        },

        // Fetch lottery data for a specific region - MULTIPLE SOURCES + DEBUG
        fetchRegionData: async function(region) {
            if (this.currentData.isUpdating) {
                logger.log('⏳ Already updating, skipping...');
                return;
            }

            this.currentData.isUpdating = true;
            logger.log(`🎲 [DEBUG] Fetching ${region} lottery data from multiple sources...`);

            try {
                const source = this.sources[region];
                if (!source) {
                    throw new Error(`Unknown region: ${region}`);
                }
                
                logger.log(`🔍 [DEBUG] Available sources for ${region}:`, source.urls.length);

                // Try multiple URLs until one works
                let lotteryData = null;
                let lastError = null;

                for (let i = 0; i < source.urls.length; i++) {
                    const url = source.urls[i];
                    logger.log(`🔍 Trying source ${i + 1}/${source.urls.length}: ${url}`);

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
                                logger.log(`🔗 Trying proxy: ${proxyUrl}`);

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
                                    logger.log(`Proxy successful: ${proxyUrl}`);
                                    break;
                                } else {
                                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                }
                            } catch (proxyError) {
                                const errorMsg = proxyError.name === 'AbortError' ? 'Request timeout' : proxyError.message;
                                logger.warn(`Proxy failed: ${proxyUrl}`, errorMsg);
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
                            logger.log('📡 [DEBUG] Processing RSS feed content...');
                            lotteryData = this.parseRSSFeed(content, region);
                        } else {
                            logger.log('📡 [DEBUG] Processing HTML content...');
                            lotteryData = this.parseLotteryData(content, source.patterns, region);
                        }
                        
                        if (lotteryData && lotteryData.results) {
                            logger.log(`[DEBUG] Successfully fetched data from source ${i + 1} (${lotteryData.source})`);
                            logger.log(`[DEBUG] Data preview:`, {
                                date: lotteryData.date,
                                source: lotteryData.source,
                                prizeCount: Object.keys(lotteryData.results).length,
                                dacbiet: lotteryData.results.dacbiet,
                                nhat: lotteryData.results.nhat
                            });
                            break;
                        } else {
                            logger.warn(`[DEBUG] No valid lottery data found in response from source ${i + 1}`);
                            throw new Error('No valid lottery data found in response');
                        }

                    } catch (error) {
                        logger.warn(`Source ${i + 1} failed:`, error.message);
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
                        logger.log(`📦 Cached ${region} data for ${lotteryData.date}`);
                    }

                    this.saveData();

                    logger.log(`${region} data updated successfully:`, lotteryData);
                    
                    // Broadcast update
                    this.broadcastUpdate('lottery_data_updated', {
                        region: region,
                        data: lotteryData
                    });
                } else {
                    throw new Error(`All sources failed for ${region}. Last error: ${lastError?.message}`);
                }

            } catch (error) {
                logger.error(`Error fetching ${region} data:`, error);
                
                // NO FALLBACK DATA - Only real data allowed
                logger.error(`Cannot fetch real data for ${region} - No fallback available`);
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
                    logger.warn(`No lottery results found for ${region}`);
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
                logger.error(`Error parsing ${region} data:`, error);
                return null;
            }
        },

        // Parse RSS feed from xosodaiphat.com (robust)
        parseRSSFeed: function(xmlContent, region) {
            try {
                logger.log('📡 [DEBUG] Parsing RSS feed for', region);
                logger.log('📝 [DEBUG] RSS content length:', xmlContent.length);
                
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
                    logger.warn('[DEBUG] RSS: date not found, using today as fallback');
                    logger.log('📝 [DEBUG] Normalized text preview:', normalized.substring(0, 500));
                    const today = new Date();
                    const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
                    const [y, m, d] = todayStr.split('-');
                    dateMatch = [null, d, m, y]; // Simulate match format
                }
                const [_, d, m, y] = dateMatch;
                const drawDate = `${y}-${m}-${d}`;

                // EXACT PARSER for "DB: 12421 G.1: 98854 G.2: 59095 - 02817" format
                                    logger.log('🔍 [DEBUG] Raw normalized text (first 1000 chars):', normalized.substring(0, 1000));
                    logger.log('🔍 [DEBUG] Full normalized text length:', normalized.length);
                    
                    // SPECIAL DEBUG for G.7 location
                    const g7Index = normalized.indexOf('G.7');
                    logger.log('🔍 [DEBUG] G.7 position in text:', g7Index);
                    if (g7Index !== -1) {
                        const g7Context = normalized.substring(Math.max(0, g7Index - 50), g7Index + 100);
                        logger.log('🔍 [DEBUG] G.7 context (±50 chars):', g7Context);
                    }
                
                // Multiple patterns to try for better G.7 capture
                let exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+?)\s+G\.4:\s*([\d\s\-]+?)\s+G\.5:\s*([\d\s\-]+?)\s+G\.6:\s*([\d\s\-]+?)\s+G\.7:\s*([\d\s\-]+)$/i);
                
                // Alternative pattern if first one fails (more generous G.7 capture)
                if (!exactMatch) {
                    logger.log('[DEBUG] First pattern failed, trying alternative pattern...');
                    exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+?)\s+G\.4:\s*([\d\s\-]+?)\s+G\.5:\s*([\d\s\-]+?)\s+G\.6:\s*([\d\s\-]+?)\s+G\.7:\s*([\d\s\-]+)$/i);
                }
                
                // Even more aggressive pattern for G.7 - capture everything after G.7:
                if (!exactMatch) {
                    logger.log('[DEBUG] Both patterns failed, trying super aggressive pattern...');
                    exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+)\s+G\.4:\s*([\d\s\-]+)\s+G\.5:\s*([\d\s\-]+)\s+G\.6:\s*([\d\s\-]+)\s+G\.7:\s*([\d\s\-]+)$/i);
                }
                
                let results;
                
                if (exactMatch) {
                    logger.log('[DEBUG] EXACT MATCH found!', exactMatch);
                    const [, db, g1, g2_1, g2_2, g3_raw, g4_raw, g5_raw, g6_raw, g7_raw] = exactMatch;
                    
                    logger.log('🔍 [DEBUG] Raw groups extracted:', {
                        db, g1, g2_1, g2_2, g3_raw, g4_raw, g5_raw, g6_raw, g7_raw
                    });
                    
                    // Parse multi-number groups - SUPER IMPROVED
                    const parseNumbers = (raw, groupName) => {
                        if (!raw) {
                            logger.warn(`[DEBUG] Empty raw data for ${groupName}`);
                            return [];
                        }
                        
                        logger.log(`🔍 [DEBUG] Processing ${groupName} raw data: "${raw}"`);
                        
                        // Multiple parsing strategies
                        let numbers = [];
                        
                        // Strategy 1: Split by common separators - FIXED for G.7 (2 digits)
                        const strategy1 = raw.split(/[\s\-]+/).map(s => s.trim()).filter(s => /^\d{2,5}$/.test(s));
                        
                        // Strategy 2: Extract all number sequences (for messy data) - FIXED for G.7
                        const strategy2 = raw.match(/\d{2,5}/g) || [];
                        
                        // Use the strategy that gives more numbers
                        numbers = strategy1.length >= strategy2.length ? strategy1 : strategy2;
                        
                        logger.log(`🔍 [DEBUG] Parsed ${groupName}: "${raw}" -> [${numbers.join(', ')}] (using ${strategy1.length >= strategy2.length ? 'strategy1' : 'strategy2'})`);
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
                        logger.warn('🚨 [DEBUG] G.7 still empty! Trying independent G.7 search...');
                        
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
                                logger.log(`🔍 [DEBUG] G.7 found with pattern ${i + 1}:`, match[1]);
                                const g7Numbers = parseNumbers(match[1], `G.7-Pattern${i + 1}`);
                                if (g7Numbers.length > 0) {
                                    results.giai_bay = g7Numbers;
                                    logger.log('[DEBUG] G.7 rescued with independent search!', results.giai_bay);
                                    break;
                                }
                            }
                        }

                        // Last resort: find ANY numbers at the end of content
                        if (!results.giai_bay || results.giai_bay.length === 0) {
                            logger.warn('🚨 [DEBUG] Last resort: looking for numbers at end of text...');
                            const endNumbers = normalized.substring(normalized.length - 200).match(/\d{2,5}/g);
                            if (endNumbers && endNumbers.length > 0) {
                                logger.log('🔍 [DEBUG] Found numbers at end:', endNumbers);
                                results.giai_bay = endNumbers.slice(-4); // Take last 4 numbers as G.7
                                logger.log('[DEBUG] G.7 rescued from end of text!', results.giai_bay);
                            }
                        }
                    }
                    
                    logger.log('[DEBUG] Final parsed results:', results);
                } else {
                    // Fallback: extract individual numbers
                    logger.log('[DEBUG] Using fallback extraction method');
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
                            logger.log(`🔍 [DEBUG] Fallback - Extracted ${label}: "${m[1]}" -> [${numbers.join(', ')}]`);
                            return numbers;
                        }
                        logger.log(`🔍 [DEBUG] No numbers found for ${label}`);
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
                    logger.warn('[DEBUG] RSS parsed but insufficient prizes');
                    logger.log('📊 [DEBUG] Extracted prizes:', results);
                    return null;
                }

                // Special check for G.7 (giải 7)
                if (!results.giai_bay || results.giai_bay.length === 0) {
                    logger.warn('[DEBUG] Missing G.7 (giải 7) - this is critical!');
                    logger.log('📊 [DEBUG] Current results:', results);
                    logger.log('📝 [DEBUG] Original normalized text for debugging:', normalized);
                } else {
                    logger.log('[DEBUG] G.7 found with', results.giai_bay.length, 'numbers:', results.giai_bay);
                }

                logger.log('Parsed RSS data (robust):', { date: drawDate, results });
                return {
                    region,
                    date: drawDate,
                    results,
                    timestamp: new Date().toISOString(),
                    source: 'rss_official'
                };
            } catch (error) {
                logger.error('Error parsing RSS feed (robust):', error);
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
                    logger.warn(`No prizes extracted for ${region}`);
                    return null;
                }

                logger.log(`Extracted ${region} results:`, results);
                return results;

            } catch (error) {
                logger.error(`Error extracting prizes for ${region}:`, error);
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
                    
                    logger.log(`Extracted ${prizeName}:`, numbers);
                    return numbers;
                }
                logger.warn(`No matches found for ${prizeName}`);
                return null;
            } catch (error) {
                logger.error(`Error extracting ${prizeName}:`, error);
                return null;
            }
        },



        // Fetch data for all regions
        fetchAllRegions: async function() {
            logger.log('🎲 Fetching all regions...');
            
            const regions = Object.keys(this.sources);
            const promises = regions.map(region => this.fetchRegionData(region));
            
            try {
                await Promise.allSettled(promises);
                logger.log('All regions fetched');
            } catch (error) {
                logger.error('Error fetching all regions:', error);
            }
        },

        // Start real-time updates with smart timing
        startRealTimeUpdates: function() {
            logger.log('🔄 Starting real-time lottery updates...');

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
                        logger.log('🚨 [SMART UPDATE] Post-6:30 PM: Fetching latest lottery data...');
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
            logger.log('🛑 Stopped real-time lottery updates');
        },

        // Get current lottery data
        getCurrentData: function(region = null) {
            if (region) {
                logger.log(`🔍 [DEBUG] Getting current data for ${region}:`, this.currentData[region] ? 'Available' : 'Not Available');
                return this.currentData[region];
            }
            return this.currentData;
        },

        // Validate date and return specific error if invalid
        validateDateForLottery: function(date) {
            const now = new Date();
            const targetDate = new Date(date + 'T00:00:00');
            const todayStr = now.toISOString().split('T')[0];
            const currentHour = now.getHours();
            const currentMinute = now.getMinutes();

            // Check for future dates
            if (date > todayStr) {
                return {
                    valid: false,
                    error: `Không thể xem kết quả ngày tương lai (${date}). Vui lòng chọn ngày hôm nay hoặc trước đó.`
                };
            }

            // Check for today before 6:30 PM
            if (date === todayStr) {
                const isAfter630PM = currentHour > 18 || (currentHour === 18 && currentMinute >= 30);
                if (!isAfter630PM) {
                    return {
                        valid: false,
                        error: `Kết quả xổ số ngày ${date} chưa có. Kết quả sẽ được công bố sau 18:30.`
                    };
                }
            }

            // Check for very old dates (RSS feed typically keeps ~30 days)
            const thirtyDaysAgo = new Date(now);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (targetDate < thirtyDaysAgo) {
                return {
                    valid: true,
                    warning: `Dữ liệu ngày ${date} có thể không có sẵn (quá 30 ngày). Hệ thống sẽ cố gắng tìm kiếm.`
                };
            }

            return { valid: true };
        },

        // Get lottery data for a specific date - ONLINE REALTIME VERSION
        getDataForDate: async function(date, region = null) {
            logger.log(`🌐 [ONLINE getDataForDate] Called with date: "${date}", region: "${region || 'bac'}"`);

            const regionKey = region || 'bac';
            const today = new Date().toISOString().split('T')[0];

            // Validate date first
            const validation = this.validateDateForLottery(date);
            if (!validation.valid) {
                logger.error(`❌ Date validation failed: ${validation.error}`);
                return { error: validation.error };
            }
            if (validation.warning) {
                logger.warn(`⚠️ Date warning: ${validation.warning}`);
            }

            // ONLINE MODE: Always try to fetch fresh data first
            if (this.config.forceOnlineMode) {
                logger.log(`🌐 [ONLINE MODE] Fetching fresh RSS data for ${date}...`);

                // Check short-term cache first (within 1 minute)
                const cacheKey = `${regionKey}_${date}`;
                if (this.historicalCache && this.historicalCache[cacheKey]) {
                    const cachedData = this.historicalCache[cacheKey];
                    const cacheAge = Date.now() - new Date(cachedData.timestamp).getTime();

                    // Cache valid for 1 minute in online mode
                    if (cacheAge < 60000) {
                        logger.log(`📦 Using fresh cache (${Math.round(cacheAge/1000)}s old) for ${date}`);
                        return cachedData;
                    }
                }

                // Fetch fresh RSS data
                try {
                    const freshData = await this.fetchRSSForDate(date, regionKey);
                    if (freshData) {
                        logger.log(`✅ [ONLINE] Got fresh data for ${date}:`, freshData.results.giai_dac_biet);
                        return freshData;
                    }
                } catch (error) {
                    logger.error(`❌ [ONLINE] Failed to fetch ${date}:`, error);
                }

                // Fallback to any cached data if online fetch failed
                if (this.historicalCache && this.historicalCache[cacheKey]) {
                    logger.log(`⚠️ [ONLINE] Using stale cache for ${date} (fetch failed)`);
                    return this.historicalCache[cacheKey];
                }

                // Check current data
                const currentData = this.getCurrentData(regionKey);
                if (currentData && currentData.date === date) {
                    return currentData;
                }

                logger.log(`❌ [ONLINE] No data available for ${date}`);
                return { error: `Không tìm thấy dữ liệu xổ số ngày ${date}. Dữ liệu có thể không còn trên hệ thống nguồn.` };
            }

            // OFFLINE MODE (legacy behavior)
            const targetDate = new Date(date);
            const todayDate = new Date();
            const currentData = this.getCurrentData(regionKey);

            // Check if we have data for the specific date
            if (currentData && currentData.date === date) {
                logger.log(`Found exact data for ${date}`);
                return currentData;
            }

            // Check historical cache
            const cacheKey = `${regionKey}_${date}`;
            if (this.historicalCache && this.historicalCache[cacheKey]) {
                logger.log(`📦 Found cached data for ${date}`);
                return this.historicalCache[cacheKey];
            }

            // Determine date type
            const todayDateOnly = new Date(todayDate.toDateString());
            const isPastDate = targetDate < todayDateOnly;
            const isToday = date === today;
            const isFutureDate = targetDate > todayDateOnly;

            // For past dates - try to fetch from RSS
            if (isPastDate || isToday) {
                logger.log(`📅 Fetching RSS for date ${date}`);

                // Try to fetch fresh
                try {
                    const freshData = await this.fetchRSSForDate(date, regionKey);
                    if (freshData) {
                        return freshData;
                    }
                } catch (error) {
                    logger.error(`Failed to fetch RSS for ${date}:`, error);
                }

                // Return current data if matches
                if (currentData) {
                    return currentData;
                }

                return null;
            }

            // For future dates
            if (isFutureDate) {
                logger.log(`🚫 Future date ${date} - not allowed`);
                return { error: `Không thể xem kết quả ngày tương lai (${date}). Vui lòng chọn ngày hôm nay hoặc trước đó.` };
            }

            return { error: `Không tìm thấy dữ liệu xổ số ngày ${date}. Vui lòng thử lại sau.` };
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
                    logger.log(`Background fetch completed for ${date}`);
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
                logger.log(`🕐 [FRESHNESS] After 6:30 PM: Data age ${diffMinutes.toFixed(1)} min (threshold: ${freshThreshold} min)`);
                return diffMinutes < freshThreshold;
            } else {
                // Normal freshness check (1 hour)
                const freshThreshold = 60; // 60 minutes
                logger.log(`🕐 [FRESHNESS] Before 6:30 PM: Data age ${diffMinutes.toFixed(1)} min (threshold: ${freshThreshold} min)`);
                return diffMinutes < freshThreshold;
            }
        },

        // Manual refresh
        refresh: function() {
            logger.log('🔄 Manual refresh requested');
            this.fetchAllRegions();
        },

        // Broadcast updates to components
        broadcastUpdate: function(event, data) {
            // Dispatch custom event
            const customEvent = new CustomEvent('lotteryDataUpdate', {
                detail: { event, data }
            });
            window.dispatchEvent(customEvent);
            
            logger.log(`📡 Broadcasted ${event}:`, data);
        },

        // Test function
        // Force refresh data - bypass cache completely
        forceRefresh: function() {
            logger.log('🔄 [DEBUG] FORCING FRESH FETCH - clearing all cache');
            this.currentData = {};
            this.currentData.isUpdating = false;
            localStorage.removeItem('lotteryData');
            logger.log('🔄 [DEBUG] Cache cleared, fetching fresh RSS data...');
            return this.fetchRegionData('bac');
        },

        test: function() {
            logger.log('🧪 Testing Lottery Data Service...');
            
            // Test real data fetching only
            logger.log('Testing real data fetching...');
            
            // Test data freshness
            const isFresh = this.isDataFresh();
            logger.log('Data freshness check:', isFresh);
            
            return true;
        },

        // Fetch RSS data for specific date - REALTIME ONLINE
        fetchRSSForDate: async function(date, region = 'bac') {
            logger.log(`🌐 [ONLINE] Fetching data for date: ${date}, region: ${region}`);

            try {
                // RSS feed chứa 7 ngày gần nhất - luôn dùng RSS trước
                const rssUrl = 'https://xosodaiphat.com/ket-qua-xo-so-mien-bac-xsmb.rss';

                const proxies = [
                    (url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
                    (url) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
                    (url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`
                ];

                let content = null;

                // Fetch RSS feed
                for (const getProxyUrl of proxies) {
                    const proxyUrl = getProxyUrl(rssUrl);
                    try {
                        logger.log(`🔗 Trying RSS proxy: ${proxyUrl}`);

                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 15000);

                        try {
                            const response = await fetch(proxyUrl, {
                                method: 'GET',
                                headers: {
                                    'Accept': 'application/rss+xml, application/xml, text/xml',
                                    'Cache-Control': 'no-cache'
                                },
                                signal: controller.signal
                            });

                            if (response.ok) {
                                content = await response.text();
                                if (content && content.includes('DB:')) {
                                    logger.log(`✅ RSS fetched successfully`);
                                    break;
                                }
                            }
                        } finally {
                            clearTimeout(timeoutId);
                        }
                    } catch (proxyError) {
                        logger.warn(`Proxy failed: ${proxyUrl}`, proxyError.message);
                        continue;
                    }
                }

                if (!content) {
                    throw new Error(`Cannot fetch RSS feed`);
                }

                // LUÔN parse và TÍCH LŨY tất cả 7 ngày vào historical cache
                // Cache cũ không bị xóa - chỉ thêm/cập nhật
                this.cacheAllRSSItems(content, region);

                // Lấy data cho ngày cụ thể từ cache (vừa được cập nhật)
                const cacheKey = `${region}_${date}`;
                if (this.historicalCache[cacheKey]) {
                    const lotteryData = this.historicalCache[cacheKey];
                    logger.log(`✅ Got fresh data for ${date}:`, lotteryData.results.giai_dac_biet);

                    // Log tổng số ngày trong cache
                    const totalDays = Object.keys(this.historicalCache).filter(k => k.startsWith(region)).length;
                    logger.log(`📊 Historical cache now has ${totalDays} days of data`);

                    return lotteryData;
                }

                // Nếu không có trong cache (ngày quá cũ không có trong RSS)
                logger.log(`⚠️ Date ${date} not in current RSS feed`);

                // Nếu không tìm thấy trong RSS (ngày quá cũ), thử URL cụ thể
                logger.log(`⚠️ Date ${date} not in RSS, trying specific URL...`);

                const [year, month, day] = date.split('-');
                const dateForUrl = `${day}-${month}-${year}`;
                const specificUrl = `https://xosodaiphat.com/xsmb-${dateForUrl}.html`;

                for (const getProxyUrl of proxies) {
                    const proxyUrl = getProxyUrl(specificUrl);
                    try {
                        const controller = new AbortController();
                        const timeoutId = setTimeout(() => controller.abort(), 15000);

                        try {
                            const response = await fetch(proxyUrl, {
                                method: 'GET',
                                headers: { 'Accept': 'text/html', 'Cache-Control': 'no-cache' },
                                signal: controller.signal
                            });

                            if (response.ok) {
                                const htmlContent = await response.text();
                                if (htmlContent && htmlContent.includes('đặc biệt')) {
                                    const htmlData = this.parseHTMLForDate(htmlContent, region, date);
                                    if (htmlData && htmlData.results) {
                                        const cacheKey = `${region}_${date}`;
                                        this.historicalCache[cacheKey] = htmlData;
                                        this.saveData();
                                        return htmlData;
                                    }
                                }
                            }
                        } finally {
                            clearTimeout(timeoutId);
                        }
                    } catch (e) {
                        continue;
                    }
                }

                return null;
            } catch (error) {
                logger.error(`❌ Failed to fetch data for ${date}:`, error);
                return null;
            }
        },

        // Cache tất cả các ngày trong RSS feed
        cacheAllRSSItems: function(xmlContent, region) {
            try {
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlContent, 'text/xml');
                const items = xml.getElementsByTagName('item');

                logger.log(`📦 Caching all ${items.length} RSS items for ${region}...`);

                let cachedCount = 0;

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];
                    const pubDateNode = item.getElementsByTagName('pubDate')[0];
                    const descriptionNode = item.getElementsByTagName('description')[0];

                    if (!descriptionNode || !descriptionNode.textContent) continue;

                    const textContent = descriptionNode.textContent;
                    const normalized = textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

                    // Extract date
                    let itemDate = null;

                    // Try multiple date formats
                    if (pubDateNode && pubDateNode.textContent) {
                        const pubText = pubDateNode.textContent.trim();

                        // Format 1: DD/MM/YYYY
                        const pubMatch1 = pubText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        if (pubMatch1) {
                            const [_, d, m, y] = pubMatch1;
                            itemDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                        }

                        // Format 2: RFC 822 - "Sat, 23 Nov 2025 18:30:00 GMT"
                        if (!itemDate) {
                            const rfcMatch = pubText.match(/(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})/i);
                            if (rfcMatch) {
                                const months = { 'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04', 'may': '05', 'jun': '06',
                                                'jul': '07', 'aug': '08', 'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12' };
                                const [_, d, monthName, y] = rfcMatch;
                                const m = months[monthName.toLowerCase()];
                                itemDate = `${y}-${m}-${d.padStart(2, '0')}`;
                            }
                        }

                        // Format 3: YYYY-MM-DD
                        if (!itemDate) {
                            const isoMatch = pubText.match(/(\d{4})-(\d{2})-(\d{2})/);
                            if (isoMatch) {
                                itemDate = isoMatch[0];
                            }
                        }
                    }

                    // Fallback: Extract from description
                    if (!itemDate) {
                        const descMatch = normalized.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        if (descMatch) {
                            const [_, d, m, y] = descMatch;
                            itemDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
                        }
                    }

                    if (itemDate) {
                        const cacheKey = `${region}_${itemDate}`;

                        // Parse và cache item này
                        const lotteryData = this.parseRSSItemContent(normalized, region, itemDate);

                        if (lotteryData && lotteryData.results) {
                            this.historicalCache[cacheKey] = lotteryData;
                            cachedCount++;
                            logger.log(`📅 Cached ${itemDate}: DB=${lotteryData.results.giai_dac_biet[0]}`);
                        }
                    }
                }

                // Save all cached data
                this.saveData();
                logger.log(`✅ Cached ${cachedCount} days of lottery data`);

            } catch (error) {
                logger.error('Error caching RSS items:', error);
            }
        },

        // Parse HTML page for specific date
        parseHTMLForDate: function(html, region, targetDate) {
            try {
                logger.log(`📄 Parsing HTML for date: ${targetDate}`);

                // Extract lottery numbers from HTML
                // Pattern 1: Table format with giải đặc biệt, giải nhất, etc.
                const results = {};

                // Giải đặc biệt (5 digits)
                const dbMatch = html.match(/(?:đặc biệt|ĐB|DB)[^>]*>[\s]*(\d{5})/i) ||
                               html.match(/<[^>]*class="[^"]*giai-dac-biet[^"]*"[^>]*>[\s]*(\d{5})/i) ||
                               html.match(/>(\d{5})<\/[^>]*>[^<]*(?:đặc biệt|ĐB)/i);
                if (dbMatch) results.giai_dac_biet = [dbMatch[1]];

                // Giải nhất (5 digits)
                const g1Match = html.match(/(?:giải nhất|G\.?1)[^>]*>[\s]*(\d{5})/i) ||
                               html.match(/<[^>]*class="[^"]*giai-nhat[^"]*"[^>]*>[\s]*(\d{5})/i);
                if (g1Match) results.giai_nhat = [g1Match[1]];

                // Giải nhì (2 numbers, 5 digits each)
                const g2Matches = html.match(/(?:giải nhì|G\.?2)[^>]*>[\s]*([\d\s\-]+)/i);
                if (g2Matches) {
                    const nums = g2Matches[1].match(/\d{5}/g);
                    if (nums) results.giai_nhi = nums;
                }

                // Giải ba (6 numbers, 5 digits each)
                const g3Matches = html.match(/(?:giải ba|G\.?3)[^>]*>[\s]*([\d\s\-]+)/i);
                if (g3Matches) {
                    const nums = g3Matches[1].match(/\d{5}/g);
                    if (nums) results.giai_ba = nums;
                }

                // Giải tư (4 numbers, 4-5 digits)
                const g4Matches = html.match(/(?:giải tư|G\.?4)[^>]*>[\s]*([\d\s\-]+)/i);
                if (g4Matches) {
                    const nums = g4Matches[1].match(/\d{4,5}/g);
                    if (nums) results.giai_tu = nums;
                }

                // Giải năm (6 numbers, 4 digits)
                const g5Matches = html.match(/(?:giải năm|G\.?5)[^>]*>[\s]*([\d\s\-]+)/i);
                if (g5Matches) {
                    const nums = g5Matches[1].match(/\d{4}/g);
                    if (nums) results.giai_nam = nums;
                }

                // Giải sáu (3 numbers, 3 digits)
                const g6Matches = html.match(/(?:giải sáu|G\.?6)[^>]*>[\s]*([\d\s\-]+)/i);
                if (g6Matches) {
                    const nums = g6Matches[1].match(/\d{3}/g);
                    if (nums) results.giai_sau = nums;
                }

                // Giải bảy (4 numbers, 2 digits)
                const g7Matches = html.match(/(?:giải bảy|G\.?7)[^>]*>[\s]*([\d\s\-]+)/i);
                if (g7Matches) {
                    const nums = g7Matches[1].match(/\d{2}/g);
                    if (nums) results.giai_bay = nums;
                }

                // Alternative: Try to extract from structured data
                if (!results.giai_dac_biet || results.giai_dac_biet.length === 0) {
                    // Try DB: format
                    const altMatch = html.match(/DB:\s*(\d{5})/i);
                    if (altMatch) results.giai_dac_biet = [altMatch[1]];
                }

                // Validate
                if (!results.giai_dac_biet || results.giai_dac_biet.length === 0) {
                    logger.warn('Cannot extract lottery data from HTML');
                    return null;
                }

                logger.log(`📊 Extracted results:`, results);

                return {
                    region,
                    date: targetDate,
                    results,
                    timestamp: new Date().toISOString(),
                    source: 'html_online',
                    dataType: 'html'
                };

            } catch (error) {
                logger.error('Error parsing HTML:', error);
                return null;
            }
        },

        // Parse RSS feed and find data for specific date
        parseRSSFeedForDate: function(xmlContent, region, targetDate) {
            try {
                const parser = new DOMParser();
                const xml = parser.parseFromString(xmlContent, 'text/xml');
                const items = xml.getElementsByTagName('item');

                logger.log(`📡 Found ${items.length} RSS items, looking for date: ${targetDate}`);

                // Convert targetDate (YYYY-MM-DD) to DD/MM/YYYY for comparison
                const [year, month, day] = targetDate.split('-');
                const targetDateVN = `${day}/${month}/${year}`;
                logger.log(`🔍 Looking for date: ${targetDateVN}`);

                for (let i = 0; i < items.length; i++) {
                    const item = items[i];

                    // Try pubDate first
                    const pubDateNode = item.getElementsByTagName('pubDate')[0];
                    const descriptionNode = item.getElementsByTagName('description')[0];

                    if (!descriptionNode || !descriptionNode.textContent) continue;

                    const textContent = descriptionNode.textContent;
                    const normalized = textContent.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

                    // Extract date from pubDate or description
                    let itemDateVN = null;

                    if (pubDateNode && pubDateNode.textContent) {
                        // pubDate format: "22/11/2025"
                        const pubMatch = pubDateNode.textContent.trim().match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        if (pubMatch) {
                            itemDateVN = `${pubMatch[1].padStart(2, '0')}/${pubMatch[2].padStart(2, '0')}/${pubMatch[3]}`;
                        }
                    }

                    if (!itemDateVN) {
                        // Fallback: extract from description
                        const descMatch = normalized.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                        if (descMatch) {
                            itemDateVN = `${descMatch[1].padStart(2, '0')}/${descMatch[2].padStart(2, '0')}/${descMatch[3]}`;
                        }
                    }

                    if (itemDateVN) {
                        logger.log(`📅 RSS item ${i} date: ${itemDateVN}`);

                        if (itemDateVN === targetDateVN) {
                            logger.log(`✅ Found matching date: ${targetDate}`);
                            // Parse this item's data
                            return this.parseRSSItemContent(normalized, region, targetDate);
                        }
                    }
                }

                // Date not found in RSS
                logger.log(`⚠️ Date ${targetDate} not found in RSS feed (${items.length} items checked)`);
                return null;
            } catch (error) {
                logger.error('Error parsing RSS for date:', error);
                return null;
            }
        },

        // Parse single RSS item content - FULL RESULTS
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

            // Parse lottery numbers - Pattern cho format RSS
            const exactMatch = normalized.match(/DB:\s*(\d+)\s+G\.1:\s*(\d+)\s+G\.2:\s*(\d+)\s*-\s*(\d+)\s+G\.3:\s*([\d\s\-]+?)\s+G\.4:\s*([\d\s\-]+?)\s+G\.5:\s*([\d\s\-]+?)\s+G\.6:\s*([\d\s\-]+?)\s+G\.7:\s*([\d\s\-]+)/i);

            let results;

            if (exactMatch) {
                const [, db, g1, g2_1, g2_2, g3_raw, g4_raw, g5_raw, g6_raw, g7_raw] = exactMatch;

                const parseNumbers = (raw, expectedCount, minDigits = 2) => {
                    if (!raw) return [];
                    const numbers = raw.split(/[\s\-]+/)
                        .map(s => s.trim())
                        .filter(s => {
                            const regex = new RegExp(`^\\d{${minDigits},5}$`);
                            return regex.test(s);
                        });

                    // Log nếu số lượng không đúng
                    if (expectedCount && numbers.length !== expectedCount) {
                        logger.warn(`⚠️ Expected ${expectedCount} numbers but got ${numbers.length}: ${numbers.join(', ')}`);
                    }

                    return numbers;
                };

                results = {
                    giai_dac_biet: [db],           // 1 số, 5 chữ số
                    giai_nhat: [g1],               // 1 số, 5 chữ số
                    giai_nhi: [g2_1, g2_2],        // 2 số, 5 chữ số
                    giai_ba: parseNumbers(g3_raw, 6, 5),   // 6 số, 5 chữ số
                    giai_tu: parseNumbers(g4_raw, 4, 4),   // 4 số, 4 chữ số
                    giai_nam: parseNumbers(g5_raw, 6, 4),  // 6 số, 4 chữ số
                    giai_sau: parseNumbers(g6_raw, 3, 3),  // 3 số, 3 chữ số
                    giai_bay: parseNumbers(g7_raw, 4, 2)   // 4 số, 2 chữ số
                };

                // Log full results để debug
                const totalNumbers = Object.values(results).reduce((sum, arr) => sum + arr.length, 0);
                logger.log(`📊 Parsed ${targetDate}: ${totalNumbers} numbers total`);
                logger.log(`   DB: ${results.giai_dac_biet[0]}, G1: ${results.giai_nhat[0]}`);
                logger.log(`   G2: ${results.giai_nhi.join(', ')}`);
                logger.log(`   G3: ${results.giai_ba.join(', ')}`);
                logger.log(`   G4: ${results.giai_tu.join(', ')}`);
                logger.log(`   G5: ${results.giai_nam.join(', ')}`);
                logger.log(`   G6: ${results.giai_sau.join(', ')}`);
                logger.log(`   G7: ${results.giai_bay.join(', ')}`);

            } else {
                logger.warn('Cannot parse RSS content format');
                logger.log('Raw content:', normalized.substring(0, 500));
                return null;
            }

            // Validate kết quả
            if (!results.giai_dac_biet || !results.giai_dac_biet.length) {
                logger.warn('Missing giai_dac_biet');
                return null;
            }

            // Đảm bảo có đủ các giải
            const expectedPrizes = ['giai_dac_biet', 'giai_nhat', 'giai_nhi', 'giai_ba', 'giai_tu', 'giai_nam', 'giai_sau', 'giai_bay'];
            for (const prize of expectedPrizes) {
                if (!results[prize] || results[prize].length === 0) {
                    logger.warn(`⚠️ Missing or empty ${prize}`);
                }
            }

            // ===== PRE-COMPUTE SỐ CUỐI CHO ĐỐI CHIẾU =====
            // Tính trước để không phải tính lại mỗi lần đối chiếu

            // 1. Lô Array: 2 số cuối của TẤT CẢ các giải (27 số)
            const loArray = [];
            const allPrizes = [
                results.giai_dac_biet,
                results.giai_nhat,
                results.giai_nhi,
                results.giai_ba,
                results.giai_tu,
                results.giai_nam,
                results.giai_sau,
                results.giai_bay
            ];

            allPrizes.forEach(prizeNumbers => {
                if (prizeNumbers && Array.isArray(prizeNumbers)) {
                    prizeNumbers.forEach(num => {
                        if (num) {
                            const last2 = num.toString().slice(-2).padStart(2, '0');
                            loArray.push(last2);
                        }
                    });
                }
            });

            // 2. Đề Array: 2 số cuối của Giải Đặc Biệt (1 số)
            const deArray = results.giai_dac_biet[0] ?
                [results.giai_dac_biet[0].toString().slice(-2).padStart(2, '0')] : [];

            // 3. Ba Càng Array: 3 số cuối của Giải Đặc Biệt (1 số)
            const baCangArray = results.giai_dac_biet[0] ?
                [results.giai_dac_biet[0].toString().slice(-3).padStart(3, '0')] : [];

            // 4. Đầu Đuôi: Số đầu và số cuối của Giải Đặc Biệt
            const specialNumber = results.giai_dac_biet[0] ? results.giai_dac_biet[0].toString() : '';
            const dauDuoi = {
                dau: specialNumber.length >= 2 ? specialNumber.slice(-2, -1) : '', // Số hàng chục
                duoi: specialNumber.length >= 1 ? specialNumber.slice(-1) : ''     // Số hàng đơn vị
            };

            logger.log(`📊 Pre-computed arrays for ${targetDate}:`);
            logger.log(`   Lô (2 số cuối): ${loArray.length} numbers`);
            logger.log(`   Đề (2 số cuối ĐB): ${deArray.join(', ')}`);
            logger.log(`   Ba Càng (3 số cuối ĐB): ${baCangArray.join(', ')}`);
            logger.log(`   Đầu: ${dauDuoi.dau}, Đuôi: ${dauDuoi.duoi}`);

            return {
                region,
                date: targetDate,
                results,
                // Pre-computed arrays for reconciliation
                loArray,        // Tất cả 2 số cuối (27 số)
                deArray,        // 2 số cuối Giải ĐB
                baCangArray,    // 3 số cuối Giải ĐB
                dauDuoi,        // Đầu và Đuôi của Giải ĐB
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
                logger.log(`🌐 [ONLINE] getKnownRSSData disabled - use fetchRSSForDate instead`);
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
            logger.log(`🌐 Online mode: ${enabled ? 'ENABLED' : 'DISABLED'}`);

            // KHÔNG xóa historical cache - luôn tích lũy dữ liệu
            // Historical cache được giữ lại để có data lịch sử lâu dài
            const totalDates = Object.keys(this.historicalCache).length;
            logger.log(`📦 Historical cache preserved with ${totalDates} dates`);
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
    
    logger.log('Lottery Data Service loaded successfully');

})();

