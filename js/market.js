class MarketData {
    constructor() {
        this.isRunning = false;
        this.currentMarket = 'binance';
        this.currentSymbol = '';
        this.dataWindow = [];
        this.hourlyDataWindow = []; // Store 1 hour of data for better predictions
        this.maxWindowSize = 30; // For real-time calculations
        this.maxHourlyWindowSize = 1200; // 1 hour of data (3600 seconds / 3 seconds per point)
        this.pollInterval = null;
        this.callbacks = [];
    }
    
    addCallback(callback) {
        this.callbacks.push(callback);
    }
    
    notifyCallbacks(data) {
        this.callbacks.forEach(cb => {
            try {
                cb(data);
            } catch (error) {
                console.error('Callback error:', error);
            }
        });
    }
    
    async start(market, symbol) {
        console.log(`Starting ${market} for ${symbol}`);
        this.stop();
        
        this.currentMarket = market;
        this.currentSymbol = symbol.toUpperCase();
        this.dataWindow = [];
        this.hourlyDataWindow = [];
        this.isRunning = true;
        
        // Fetch historical data first
        await this.fetchHistoricalData();
        
        // Start immediate polling
        await this.startPolling();
    }
    
    stop() {
        console.log('Stopping market data');
        this.isRunning = false;
        
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
    }
    
    async fetchHistoricalData() {
        console.log('Fetching historical data for better predictions...');
        
        if (this.currentMarket === 'binance') {
            await this.fetchBinanceHistorical();
        } else {
            // DexScreener doesn't have historical API, so we'll build history over time
            console.log('DexScreener: Will build historical data over time');
        }
    }
    
    async fetchBinanceHistorical() {
        try {
            // Fetch 1 hour of 1-minute klines
            const url = `https://api.binance.com/api/v3/klines?symbol=${this.currentSymbol}&interval=1m&limit=60`;
            
            const response = await fetch(url);
            if (response.ok) {
                const klines = await response.json();
                console.log(`Fetched ${klines.length} historical data points`);
                
                // Convert klines to our data format
                klines.forEach(kline => {
                    const closePrice = parseFloat(kline[4]); // Close price
                    const timestamp = kline[6]; // Close time
                    
                    this.hourlyDataWindow.push({
                        price: closePrice,
                        timestamp: timestamp,
                        volume: parseFloat(kline[5]) // Volume
                    });
                });
                
                console.log('Historical data loaded:', this.hourlyDataWindow.length, 'points');
            }
        } catch (error) {
            console.warn('Failed to fetch historical data:', error);
        }
    }
    async startPolling() {
        // Immediate first fetch
        try {
            await this.fetchData();
            console.log('First data fetch successful');
        } catch (error) {
            console.error('First fetch failed:', error);
            throw error;
        }
        
        // Start regular polling
        this.pollInterval = setInterval(async () => {
            if (this.isRunning) {
                try {
                    await this.fetchData();
                } catch (error) {
                    console.error('Polling error:', error);
                }
            }
        }, 2000);
    }
    
    async fetchData() {
        let data;
        
        if (this.currentMarket === 'binance') {
            data = await this.fetchBinanceData();
        } else {
            data = await this.fetchDexScreenerData();
        }
        
        if (data) {
            console.log('Received data:', data);
            this.addDataPoint(data);
        } else {
            throw new Error('No data received');
        }
    }
    
    async fetchBinanceData() {
        console.log(`Fetching Binance data for ${this.currentSymbol}`);
        
        // Simple direct API call
        const url = `https://api.binance.com/api/v3/ticker/price?symbol=${this.currentSymbol}`;
        
        try {
            const response = await fetch(url);
            console.log('Binance response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Binance data:', data);
            
            if (data.price) {
                return {
                    price: parseFloat(data.price),
                    timestamp: Date.now(),
                    volume: null
                };
            } else if (data.msg) {
                throw new Error(data.msg);
            }
        } catch (error) {
            console.error('Binance fetch error:', error);
            
            // Try alternative approach with JSONP-like method
            return await this.fetchBinanceAlternative();
        }
        
        return null;
    }
    
    async fetchBinanceAlternative() {
        // Try using a CORS proxy
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const targetUrl = `https://api.binance.com/api/v3/ticker/price?symbol=${this.currentSymbol}`;
        
        try {
            const response = await fetch(proxyUrl + encodeURIComponent(targetUrl));
            const result = await response.json();
            
            if (result.contents) {
                const data = JSON.parse(result.contents);
                if (data.price) {
                    return {
                        price: parseFloat(data.price),
                        timestamp: Date.now(),
                        volume: null
                    };
                }
            }
        } catch (error) {
            console.error('Alternative Binance fetch failed:', error);
        }
        
        return null;
    }
    
    async fetchDexScreenerData() {
        console.log(`Fetching DexScreener data for ${this.currentSymbol}`);
        
        const url = `https://api.dexscreener.com/latest/dex/search/?q=${this.currentSymbol}`;
        
        try {
            const response = await fetch(url);
            console.log('DexScreener response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('DexScreener data:', data);
            
            if (data.pairs && data.pairs.length > 0) {
                const pair = data.pairs[0];
                const price = parseFloat(pair.priceUsd || pair.priceNative);
                
                if (price > 0) {
                    return {
                        price: price,
                        timestamp: Date.now(),
                        volume: parseFloat(pair.volume?.h24 || 0)
                    };
                }
            }
        } catch (error) {
            console.error('DexScreener fetch error:', error);
        }
        
        return null;
    }
    
    addDataPoint(data) {
        console.log('Adding data point:', data);
        
        // Add to real-time window
        this.dataWindow.push(data);
        if (this.dataWindow.length > this.maxWindowSize) {
            this.dataWindow.shift();
        }
        
        // Add to hourly window
        this.hourlyDataWindow.push(data);
        if (this.hourlyDataWindow.length > this.maxHourlyWindowSize) {
            this.hourlyDataWindow.shift();
        }
        
        const callbackData = {
            current: data,
            window: [...this.dataWindow],
            hourlyWindow: [...this.hourlyDataWindow],
            isReady: this.dataWindow.length >= 5,
            hasHourlyData: this.hourlyDataWindow.length >= 10
        };
        
        console.log('Notifying callbacks with:', callbackData);
        this.notifyCallbacks(callbackData);
    }
    
    getHourlyDataWindow() {
        return [...this.hourlyDataWindow];
    }
    
    getDataWindow() {
        return [...this.dataWindow];
    }
    
    isReady() {
        return this.dataWindow.length >= 5;
    }
}