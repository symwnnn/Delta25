class MathEngine {
    static calculateVelocity(dataWindow) {
        if (dataWindow.length < 2) return 0;
        
        const velocities = [];
        
        for (let i = 1; i < dataWindow.length; i++) {
            const dt = (dataWindow[i].timestamp - dataWindow[i-1].timestamp) / 1000; // seconds
            const dp = dataWindow[i].price - dataWindow[i-1].price;
            
            if (dt > 0) {
                velocities.push(dp / dt);
            }
        }
        
        return velocities.length > 0 ? 
            velocities.reduce((sum, v) => sum + v, 0) / velocities.length : 0;
    }
    
    static calculateAcceleration(dataWindow) {
        if (dataWindow.length < 3) return 0;
        
        const accelerations = [];
        const velocities = [];
        
        // Calculate velocities first
        for (let i = 1; i < dataWindow.length; i++) {
            const dt = (dataWindow[i].timestamp - dataWindow[i-1].timestamp) / 1000;
            const dp = dataWindow[i].price - dataWindow[i-1].price;
            
            if (dt > 0) {
                velocities.push({ value: dp / dt, timestamp: dataWindow[i].timestamp });
            }
        }
        
        // Calculate accelerations from velocities
        for (let i = 1; i < velocities.length; i++) {
            const dt = (velocities[i].timestamp - velocities[i-1].timestamp) / 1000;
            const dv = velocities[i].value - velocities[i-1].value;
            
            if (dt > 0) {
                accelerations.push(dv / dt);
            }
        }
        
        return accelerations.length > 0 ?
            accelerations.reduce((sum, a) => sum + a, 0) / accelerations.length : 0;
    }
    
    static calculateLogReturns(dataWindow) {
        if (dataWindow.length < 2) return [];
        
        const returns = [];
        
        for (let i = 1; i < dataWindow.length; i++) {
            const logReturn = Math.log(dataWindow[i].price / dataWindow[i-1].price);
            returns.push(logReturn);
        }
        
        return returns;
    }
    
    static calculateVolatility(dataWindow) {
        const returns = this.calculateLogReturns(dataWindow);
        
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / (returns.length - 1);
        
        return Math.sqrt(variance);
    }
    
    static calculateCompressionFactor(dataWindow) {
        if (dataWindow.length < 10) return 1;
        
        const midPoint = Math.floor(dataWindow.length / 2);
        const shortWindow = dataWindow.slice(midPoint);
        const longWindow = dataWindow;
        
        const shortVol = this.calculateVolatility(shortWindow);
        const longVol = this.calculateVolatility(longWindow);
        
        return longVol > 0 ? shortVol / longVol : 1;
    }
    
    static calculateVolumeWeightedVelocity(dataWindow) {
        if (dataWindow.length < 2) return 0;
        
        // Check if volume data is available
        const hasVolume = dataWindow.some(d => d.volume !== null && d.volume !== undefined);
        
        if (!hasVolume) {
            return this.calculateVelocity(dataWindow);
        }
        
        const velocities = [];
        const weights = [];
        
        for (let i = 1; i < dataWindow.length; i++) {
            const dt = (dataWindow[i].timestamp - dataWindow[i-1].timestamp) / 1000;
            const dp = dataWindow[i].price - dataWindow[i-1].price;
            
            if (dt > 0 && dataWindow[i].volume > 0) {
                velocities.push(dp / dt);
                weights.push(dataWindow[i].volume);
            }
        }
        
        if (velocities.length === 0) return 0;
        
        const totalWeight = weights.reduce((sum, w) => sum + w, 0);
        const weightedSum = velocities.reduce((sum, v, i) => sum + v * weights[i], 0);
        
        return totalWeight > 0 ? weightedSum / totalWeight : 0;
    }
    
    static projectPrice(dataWindow, deltaT = 25, hourlyWindow = null) {
        if (dataWindow.length < 5) {
            return {
                projectedPrice: dataWindow[dataWindow.length - 1]?.price || 0,
                directionBias: 0,
                confidenceScore: 0,
                compressionFactor: 1,
                velocity: 0,
                acceleration: 0,
                volatility: 0
            };
        }
        
        // Use hourly data for longer predictions (1 minute), real-time data for short predictions (25s)
        const analysisWindow = (deltaT >= 60 && hourlyWindow && hourlyWindow.length >= 10) ? hourlyWindow : dataWindow;
        
        console.log(`Using ${analysisWindow === hourlyWindow ? 'hourly' : 'real-time'} data for ${deltaT}s prediction`);
        console.log(`Analysis window size: ${analysisWindow.length} points`);
        
        const currentPrice = dataWindow[dataWindow.length - 1].price;
        const velocity = this.calculateVolumeWeightedVelocity(analysisWindow);
        const acceleration = this.calculateAcceleration(analysisWindow);
        const volatility = this.calculateVolatility(analysisWindow);
        const compressionFactor = this.calculateCompressionFactor(analysisWindow);
        
        // Enhanced prediction for longer timeframes using hourly data
        let projectedPrice;
        
        if (deltaT >= 60 && hourlyWindow && hourlyWindow.length >= 30) {
            // Use advanced prediction for 1-minute+ forecasts with hourly data
            projectedPrice = this.calculateAdvancedProjection(analysisWindow, currentPrice, deltaT);
        } else {
            // Standard physics-based projection for short-term
            projectedPrice = currentPrice + velocity * deltaT + 0.5 * acceleration * deltaT * deltaT;
        }
        
        // Volatility clamping
        const k = deltaT >= 60 ? 3.0 : 2.0; // More conservative for longer predictions
        const maxPrice = currentPrice * Math.exp(k * volatility);
        const minPrice = currentPrice * Math.exp(-k * volatility);
        const clampedPrice = Math.min(maxPrice, Math.max(minPrice, projectedPrice));
        
        // Direction bias
        const directionBias = Math.sign(velocity + acceleration * deltaT);
        
        // Enhanced confidence score for longer predictions
        const velocityMagnitude = Math.abs(velocity);
        const accelerationMagnitude = Math.abs(acceleration);
        const dataQuality = analysisWindow.length / (deltaT >= 60 ? 60 : 30); // Data quality factor
        
        let confidenceScore = (velocityMagnitude / (velocityMagnitude + volatility)) * 
                             (1 / (1 + Math.exp(-accelerationMagnitude))) * 
                             Math.min(1, dataQuality);
        
        return {
            projectedPrice: clampedPrice,
            directionBias: directionBias,
            confidenceScore: Math.min(1, Math.max(0, confidenceScore)),
            compressionFactor: compressionFactor,
            velocity: velocity,
            acceleration: acceleration,
            volatility: volatility
        };
    }
    
    static calculateAdvancedProjection(hourlyWindow, currentPrice, deltaT) {
        // Advanced projection using multiple timeframe analysis
        
        // 1. Trend analysis over different periods
        const shortTrend = this.calculateTrend(hourlyWindow.slice(-15)); // Last 15 minutes
        const mediumTrend = this.calculateTrend(hourlyWindow.slice(-30)); // Last 30 minutes
        const longTrend = this.calculateTrend(hourlyWindow); // Full hour
        
        // 2. Weighted trend combination
        const trendWeight = (shortTrend * 0.5) + (mediumTrend * 0.3) + (longTrend * 0.2);
        
        // 3. Support/Resistance levels
        const levels = this.findSupportResistance(hourlyWindow);
        
        // 4. Volume-weighted price movement
        const volumeWeightedMovement = this.calculateVolumeWeightedMovement(hourlyWindow);
        
        // 5. Combine all factors
        const trendProjection = currentPrice * (1 + (trendWeight * deltaT / 3600)); // Scale to seconds
        const volumeAdjustment = volumeWeightedMovement * (deltaT / 60); // Scale to minutes
        
        let projection = trendProjection + volumeAdjustment;
        
        // 6. Adjust for support/resistance
        if (projection > currentPrice && levels.resistance && projection > levels.resistance) {
            projection = levels.resistance + (projection - levels.resistance) * 0.3; // Reduce momentum at resistance
        } else if (projection < currentPrice && levels.support && projection < levels.support) {
            projection = levels.support - (levels.support - projection) * 0.3; // Reduce momentum at support
        }
        
        return projection;
    }
    
    static calculateTrend(window) {
        if (window.length < 3) return 0;
        
        // Linear regression to find trend
        const n = window.length;
        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        
        window.forEach((point, i) => {
            sumX += i;
            sumY += point.price;
            sumXY += i * point.price;
            sumXX += i * i;
        });
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const avgPrice = sumY / n;
        
        return slope / avgPrice; // Normalized trend
    }
    
    static findSupportResistance(window) {
        if (window.length < 10) return { support: null, resistance: null };
        
        const prices = window.map(p => p.price);
        const sorted = [...prices].sort((a, b) => a - b);
        
        // Simple support/resistance using percentiles
        const support = sorted[Math.floor(sorted.length * 0.1)]; // 10th percentile
        const resistance = sorted[Math.floor(sorted.length * 0.9)]; // 90th percentile
        
        return { support, resistance };
    }
    
    static calculateVolumeWeightedMovement(window) {
        if (window.length < 2) return 0;
        
        let totalVolumeWeightedChange = 0;
        let totalVolume = 0;
        
        for (let i = 1; i < window.length; i++) {
            const priceChange = window[i].price - window[i-1].price;
            const volume = window[i].volume || 1; // Default volume if not available
            
            totalVolumeWeightedChange += priceChange * volume;
            totalVolume += volume;
        }
        
        return totalVolume > 0 ? totalVolumeWeightedChange / totalVolume : 0;
    }
}