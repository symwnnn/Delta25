class DashboardUI {
    constructor() {
        console.log('DashboardUI constructor called');
        
        try {
            this.marketData = new MarketData();
            console.log('MarketData created successfully');
        } catch (error) {
            console.error('Error creating MarketData:', error);
            throw error;
        }
        
        this.countdownTimer = null;
        this.minuteCountdownTimer = null;
        this.projectionTimer = null;
        this.currentProjection = null;
        
        this.elements = {
            statusIndicator: document.getElementById('statusIndicator'),
            marketSelector: document.getElementById('marketSelector'),
            tokenInput: document.getElementById('tokenInput'),
            startBtn: document.getElementById('startBtn'),
            currentPrice: document.getElementById('currentPrice'),
            velocity: document.getElementById('velocity'),
            acceleration: document.getElementById('acceleration'),
            compression: document.getElementById('compression'),
            projectedPrice: document.getElementById('projectedPrice'),
            direction: document.getElementById('direction'),
            confidence: document.getElementById('confidence'),
            countdown: document.getElementById('countdown'),
            minuteProjectedPrice: document.getElementById('minuteProjectedPrice'),
            minuteDirection: document.getElementById('minuteDirection'),
            minuteConfidence: document.getElementById('minuteConfidence'),
            minuteCountdown: document.getElementById('minuteCountdown')
        };
        
        console.log('All elements found, calling init()');
        this.init();
    }
    
    init() {
        console.log('DashboardUI init() called');
        
        // Check authentication
        if (!Auth.requireAuth()) {
            console.log('Auth failed, redirecting');
            return;
        }
        
        console.log('Auth passed, setting up UI');
        
        // Log all elements
        Object.keys(this.elements).forEach(key => {
            console.log(`Element ${key}:`, this.elements[key]);
        });
        
        // Setup event listeners with single handler that checks button state
        this.elements.startBtn.addEventListener('click', (e) => {
            e.preventDefault();
            console.log('Button clicked, current text:', this.elements.startBtn.textContent);
            
            if (this.elements.startBtn.textContent === 'Start') {
                console.log('Calling handleStart');
                this.handleStart();
            } else if (this.elements.startBtn.textContent === 'Stop') {
                console.log('Calling handleStop');
                this.handleStop();
            }
        });
        
        this.elements.tokenInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && this.elements.startBtn.textContent === 'Start') {
                this.handleStart();
            }
        });
        
        // Market selector change handler
        this.elements.marketSelector.addEventListener('change', (e) => {
            this.updatePlaceholder(e.target.value);
        });
        
        // Setup market data callback
        this.marketData.addCallback((data) => this.handleMarketData(data));
        
        // Set default based on market
        this.updatePlaceholder('binance');
        
        console.log('DashboardUI initialization complete');
    }
    
    updatePlaceholder(market) {
        if (market === 'binance') {
            this.elements.tokenInput.placeholder = 'BTCUSDT';
            this.elements.tokenInput.value = this.elements.tokenInput.value || 'BTCUSDT';
        } else {
            this.elements.tokenInput.placeholder = 'Contract Address or Token Symbol';
            this.elements.tokenInput.value = '';
        }
    }
    
    async handleStart() {
        console.log('Start button clicked');
        
        const market = this.elements.marketSelector.value;
        const symbol = this.elements.tokenInput.value.trim();
        
        console.log('Market:', market, 'Symbol:', symbol);
        
        if (!symbol) {
            this.showError('Enter a symbol or contract address');
            return;
        }
        
        // Basic validation
        if (market === 'binance' && symbol.length < 3) {
            this.showError('Enter a valid trading pair (e.g., BTCUSDT)');
            return;
        }
        
        // Update UI immediately
        this.elements.startBtn.textContent = 'Connecting...';
        this.elements.startBtn.disabled = true;
        this.updateStatus('CONNECTING');
        
        try {
            console.log('Starting market data...');
            await this.marketData.start(market, symbol);
            
            console.log('Market data started, waiting for first data...');
            
            // Simple timeout-based wait for data
            let dataReceived = false;
            let attempts = 0;
            const maxAttempts = 15; // 15 seconds max wait
            
            while (!dataReceived && attempts < maxAttempts) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                attempts++;
                
                if (this.marketData.getDataWindow().length > 0) {
                    dataReceived = true;
                    console.log('Data received!');
                    break;
                }
                
                console.log(`Waiting for data... attempt ${attempts}/${maxAttempts}`);
            }
            
            if (dataReceived) {
                this.updateStatus(market.toUpperCase() + ' LIVE');
                this.elements.startBtn.textContent = 'Stop';
                this.elements.startBtn.disabled = false;
                console.log('Button text changed to Stop');
                console.log('Successfully connected and receiving data');
            } else {
                throw new Error('No data received within timeout period');
            }
            
        } catch (error) {
            console.error('Start error:', error);
            this.showError(`Connection failed: ${error.message}`);
            this.updateStatus('ERROR');
            this.elements.startBtn.textContent = 'Start';
            this.elements.startBtn.disabled = false;
            this.marketData.stop();
        }
    }
    
    handleStop() {
        console.log('Stop button clicked');
        this.marketData.stop();
        this.updateStatus('OFFLINE');
        this.elements.startBtn.textContent = 'Start';
        this.elements.startBtn.disabled = false;
        console.log('Button text changed to Start, status set to OFFLINE');
        
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        
        if (this.minuteCountdownTimer) {
            clearInterval(this.minuteCountdownTimer);
            this.minuteCountdownTimer = null;
        }
        
        if (this.projectionTimer) {
            clearTimeout(this.projectionTimer);
            this.projectionTimer = null;
        }
        
        this.resetUI();
        console.log('Stop completed, UI reset');
    }
    
    handleMarketData(data) {
        console.log('Received market data in UI:', data);
        
        if (!data.current) {
            console.warn('No current data in callback');
            return;
        }
        
        // Update current price immediately
        this.updatePrice(data.current.price);
        console.log('Updated price to:', data.current.price);
        
        if (data.isReady) {
            console.log('Data window ready, calculating projections...');
            
            // Calculate 25-second projection using real-time data
            const projection25s = MathEngine.projectPrice(data.window, 25);
            console.log('25s Projection calculated:', projection25s);
            
            // Calculate 1-minute projection using hourly data if available
            const projection1min = MathEngine.projectPrice(data.window, 60, data.hourlyWindow);
            console.log('1min Projection calculated using', data.hasHourlyData ? 'hourly' : 'real-time', 'data:', projection1min);
            
            this.updateMetrics(projection25s);
            this.updateProjection(projection25s);
            this.updateMinuteProjection(projection1min);
            
            // Start countdown timers if not already running
            if (!this.countdownTimer) {
                console.log('Starting 25s countdown timer');
                this.startCountdown();
            }
            
            if (!this.minuteCountdownTimer) {
                console.log('Starting 1min countdown timer');
                this.startMinuteCountdown();
            }
        } else {
            console.log(`Data window not ready yet: ${data.window.length}/5 points`);
            
            // Show hourly data status
            if (data.hourlyWindow && data.hourlyWindow.length > 0) {
                console.log(`Hourly data available: ${data.hourlyWindow.length} points`);
            }
        }
    }
    
    updateStatus(status) {
        this.elements.statusIndicator.textContent = status;
        this.elements.statusIndicator.classList.remove('online', 'demo', 'binance', 'dexscreener', 'error');
        
        if (status === 'BINANCE' || status === 'ONLINE') {
            this.elements.statusIndicator.classList.add('online');
        } else if (status === 'DEXSCREENER') {
            this.elements.statusIndicator.classList.add('dexscreener');
        } else if (status === 'ERROR') {
            this.elements.statusIndicator.classList.add('error');
        }
    }
    
    updatePrice(price) {
        console.log('Updating price display to:', price);
        this.elements.currentPrice.textContent = this.formatPrice(price);
    }
    
    updateMetrics(projection) {
        console.log('Updating metrics with projection:', projection);
        
        // Velocity
        const velocity = projection.velocity || 0;
        this.elements.velocity.textContent = this.formatNumber(velocity, 8);
        this.elements.velocity.className = 'metric-value ' + (velocity > 0 ? 'positive' : velocity < 0 ? 'negative' : '');
        
        // Acceleration
        const acceleration = projection.acceleration || 0;
        this.elements.acceleration.textContent = this.formatNumber(acceleration, 10);
        this.elements.acceleration.className = 'metric-value ' + (acceleration > 0 ? 'positive' : acceleration < 0 ? 'negative' : '');
        
        // Compression
        const compression = projection.compressionFactor || 1;
        this.elements.compression.textContent = compression.toFixed(3);
        this.elements.compression.className = 'metric-value ' + (compression < 1 ? 'positive' : compression > 1 ? 'negative' : '');
        
        console.log('Metrics updated - Velocity:', velocity, 'Acceleration:', acceleration, 'Compression:', compression);
    }
    
    updateProjection(projection) {
        this.currentProjection = projection;
        
        // Get current price for comparison
        const currentPrice = this.marketData.getDataWindow().slice(-1)[0]?.price || 0;
        const projectedPrice = projection.projectedPrice;
        const priceChange = projectedPrice - currentPrice;
        const percentChange = currentPrice > 0 ? ((priceChange / currentPrice) * 100) : 0;
        
        // Show price change instead of absolute price
        const changeSign = priceChange >= 0 ? '+' : '';
        const changeText = `${changeSign}${this.formatPrice(priceChange)} (${changeSign}${percentChange.toFixed(2)}%)`;
        
        this.elements.projectedPrice.textContent = changeText;
        this.elements.projectedPrice.className = 'projected-price ' + (priceChange >= 0 ? 'positive' : 'negative');
        
        // Direction
        const direction = projection.directionBias;
        this.elements.direction.textContent = direction > 0 ? '↑ UP' : direction < 0 ? '↓ DOWN' : '→ FLAT';
        this.elements.direction.className = 'direction ' + (direction > 0 ? 'up' : direction < 0 ? 'down' : '');
        
        // Confidence
        const confidence = (projection.confidenceScore * 100).toFixed(1);
        this.elements.confidence.textContent = `${confidence}% CONF`;
    }
    
    updateMinuteProjection(projection) {
        // Get current price for comparison
        const currentPrice = this.marketData.getDataWindow().slice(-1)[0]?.price || 0;
        const projectedPrice = projection.projectedPrice;
        
        // Show exact predicted price for 1-minute
        this.elements.minuteProjectedPrice.textContent = this.formatPrice(projectedPrice);
        this.elements.minuteProjectedPrice.className = 'projected-price ' + (projectedPrice >= currentPrice ? 'positive' : 'negative');
        
        // Direction
        const direction = projection.directionBias;
        this.elements.minuteDirection.textContent = direction > 0 ? '↑ UP' : direction < 0 ? '↓ DOWN' : '→ FLAT';
        this.elements.minuteDirection.className = 'direction ' + (direction > 0 ? 'up' : direction < 0 ? 'down' : '');
        
        // Confidence
        const confidence = (projection.confidenceScore * 100).toFixed(1);
        this.elements.minuteConfidence.textContent = `${confidence}% CONF`;
    }
    
    startCountdown() {
        let seconds = 25;
        this.elements.countdown.textContent = seconds;
        
        this.countdownTimer = setInterval(() => {
            seconds--;
            this.elements.countdown.textContent = seconds;
            
            if (seconds <= 0) {
                seconds = 25;
                // Trigger new 25s projection calculation
                if (this.marketData.isReady()) {
                    const dataWindow = this.marketData.getDataWindow();
                    const projection = MathEngine.projectPrice(dataWindow, 25);
                    this.updateProjection(projection);
                }
            }
        }, 1000);
    }
    
    startMinuteCountdown() {
        let seconds = 60;
        this.elements.minuteCountdown.textContent = seconds;
        
        this.minuteCountdownTimer = setInterval(() => {
            seconds--;
            this.elements.minuteCountdown.textContent = seconds;
            
            if (seconds <= 0) {
                seconds = 60;
                // Trigger new 1-minute projection calculation using hourly data
                if (this.marketData.isReady()) {
                    const dataWindow = this.marketData.getDataWindow();
                    const hourlyWindow = this.marketData.getHourlyDataWindow();
                    const projection = MathEngine.projectPrice(dataWindow, 60, hourlyWindow);
                    this.updateMinuteProjection(projection);
                }
            }
        }, 1000);
    }
    
    formatPrice(price) {
        if (price >= 1) {
            return price.toFixed(4);
        } else if (price >= 0.01) {
            return price.toFixed(6);
        } else {
            return price.toFixed(8);
        }
    }
    
    formatNumber(num, decimals = 6) {
        if (Math.abs(num) < 0.000001) return '0.000000';
        return num.toFixed(decimals);
    }
    
    resetUI() {
        this.elements.currentPrice.textContent = '--';
        this.elements.velocity.textContent = '--';
        this.elements.acceleration.textContent = '--';
        this.elements.compression.textContent = '--';
        this.elements.projectedPrice.textContent = '--';
        this.elements.direction.textContent = '--';
        this.elements.confidence.textContent = '--';
        this.elements.countdown.textContent = '25';
        this.elements.minuteProjectedPrice.textContent = '--';
        this.elements.minuteDirection.textContent = '--';
        this.elements.minuteConfidence.textContent = '--';
        this.elements.minuteCountdown.textContent = '60';
        
        // Reset classes
        this.elements.velocity.className = 'metric-value';
        this.elements.acceleration.className = 'metric-value';
        this.elements.compression.className = 'metric-value';
        this.elements.direction.className = 'direction';
        this.elements.projectedPrice.className = 'projected-price';
        this.elements.minuteDirection.className = 'direction';
        this.elements.minuteProjectedPrice.className = 'projected-price';
    }
    
    showError(message) {
        // Display error in console and show notification
        console.error('Dashboard Error:', message);
        
        // Create a temporary error notification
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #f44336;
            color: white;
            padding: 10px 20px;
            border-radius: 4px;
            z-index: 1000;
            font-family: 'Bebas Neue', monospace;
            font-size: 0.9rem;
            max-width: 300px;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        // Remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
    console.log('UI.js DOMContentLoaded fired');
    try {
        const dashboard = new DashboardUI();
        console.log('DashboardUI created successfully:', dashboard);
    } catch (error) {
        console.error('Error creating DashboardUI:', error);
    }
});