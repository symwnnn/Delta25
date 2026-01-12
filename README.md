# Delta25

Mathematical cryptocurrency price projection platform with real-time predictions and Telegram payment verification.

## 🚀 Features

- **Real-Time Price Predictions**: 25-second and 1-minute mathematical projections
- **Multi-Market Support**: Binance and DexScreener integration
- **Physics-Based Algorithm**: No AI/ML - pure mathematical calculations
- **Telegram Payment Bot**: Automated payment verification system
- **Device-Bound Licensing**: 90-day access keys tied to specific devices
- **Solana Payments**: $35 USDT equivalent via Solana network

## 📊 Dashboard

### Live Metrics
- **Current Price**: Real-time price updates
- **Velocity**: Rate of price change ($/second)
- **Acceleration**: Rate of velocity change ($/second²)
- **Volatility Compression**: Market volatility state indicator

### Predictions
- **25s Projection**: Short-term price change prediction
- **1min Prediction**: Exact price prediction using 1-hour historical data
- **Confidence Scoring**: Algorithm certainty percentage
- **Direction Indicators**: Up/Down/Flat trend signals

## 🔧 Technical Stack

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Styling**: Bebas Neue font, monochromatic kernel-inspired UI
- **APIs**: Binance REST/WebSocket, DexScreener REST
- **Deployment**: Vercel (Static hosting)
- **Bot**: Node.js Telegram Bot API

## 🏗️ Architecture

### Mathematical Engine
- **Physics-Based**: Uses kinematic equations for price projection
- **Multi-Timeframe Analysis**: 15min, 30min, 1-hour trend analysis
- **Support/Resistance Detection**: Key price level identification
- **Volume-Weighted Calculations**: Trading volume impact analysis
- **Volatility Clamping**: Prevents unrealistic projections

### Data Collection
- **Real-Time Window**: Last 30 data points (60 seconds)
- **Historical Window**: Up to 1200 points (1 hour)
- **Update Frequency**: 1.5-3 seconds depending on market
- **Fallback Systems**: Multiple API endpoints with error handling

## 🔐 Security & Licensing

### Access Control
- **Device Fingerprinting**: Browser-based device identification
- **Key Verification**: Hardcoded hash validation with salt
- **90-Day Expiration**: Automatic license expiry system
- **One Device Per Key**: Prevents key sharing

### Payment System
- **Solana Wallet**: `9UwoZADSSf6xwGsqfEu1BmhjWhudE5Sfnt4viXBh7Krt`
- **Manual Verification**: Admin approval via Telegram bot
- **Reference IDs**: Unique payment tracking
- **No Auto-Processing**: Human verification required

## 🤖 Telegram Bot

### Features
- Transaction hash collection and validation
- Payment screenshot verification
- Admin approval/rejection system
- Automatic user notifications
- Manual access key distribution

### Setup
```bash
cd telegram-bot
npm install
npm start
```

### Admin Commands
- `/admin_setup` - Configure admin access
- `/myid` - Get user ID and details

## 🚀 Deployment

### Live Application
- **URL**: https://delta25.vercel.app
- **Status**: Production ready
- **Hosting**: Vercel static deployment

### Local Development
```bash
# Serve locally
python -m http.server 3000
# or
npx serve .
```

## 📝 Usage

1. **Purchase Access**: Pay $35 USDT via Solana
2. **Telegram Verification**: Submit payment proof to bot
3. **Receive Key**: Admin manually sends access key
4. **Login**: Enter key on landing page
5. **Trade**: Use real-time predictions for trading decisions

## ⚠️ Disclaimer

Delta25 provides mathematical projections based on historical price data. These are not financial advice and should not be used as the sole basis for trading decisions. Cryptocurrency markets are highly volatile and unpredictable. Always do your own research and never invest more than you can afford to lose.

## 📄 License

MIT License - See LICENSE file for details

## 🔗 Links

- **Live App**: https://delta25.vercel.app
- **User Guide**: https://delta25.vercel.app/guide.html
- **Repository**: https://github.com/symwnnn/Delta25

---

Built with ⚡ by the Delta25 team