# Deploy Delta25 Telegram Bot to Railway

## 🚀 Quick Deploy

1. **Go to Railway**: https://railway.app
2. **Sign up/Login** with GitHub
3. **New Project** → **Deploy from GitHub repo**
4. **Select Repository**: `symwnnn/Delta25`
5. **Select Service**: Choose `telegram-bot` folder
6. **Configure Environment Variables**

## 🔧 Environment Variables

Set these in Railway dashboard:

```
BOT_TOKEN=8360848520:AAGSaChAjESWGw1gCtrjdZTXFZzWKgN1eEU
ADMIN_USERNAME=symwn_rana
NODE_ENV=production
```

## 📋 Deployment Steps

### Step 1: Create Railway Project
1. Visit https://railway.app
2. Click "Start a New Project"
3. Select "Deploy from GitHub repo"
4. Choose `symwnnn/Delta25`

### Step 2: Configure Service
1. Railway will detect the Node.js app
2. Set root directory to `telegram-bot`
3. Railway will use `package.json` automatically

### Step 3: Set Environment Variables
In Railway dashboard → Variables tab:
- `BOT_TOKEN`: `8360848520:AAGSaChAjESWGw1gCtrjdZTXFZzWKgN1eEU`
- `ADMIN_USERNAME`: `symwn_rana`
- `NODE_ENV`: `production`

### Step 4: Deploy
1. Click "Deploy"
2. Railway will build and start the bot
3. Check logs for successful startup

## ✅ Verification

### Check Deployment
1. **Logs**: Should show "Delta25 Telegram Bot Starting..."
2. **Health Check**: Visit the Railway URL to see bot status
3. **Telegram**: Message the bot `/admin_setup`

### Expected Log Output
```
🤖 Delta25 Telegram Bot Starting...
📋 Configuration:
   Bot Token: 8360848520:AAGSaChA...
   Admin Username: @symwn_rana
   Configured Admins: None (use /admin_setup)
   Port: 3000
   Environment: production
✅ Bot is running and ready for payments!
🌐 Health check server running on port 3000
```

## 🔍 Troubleshooting

### Common Issues
1. **Build Fails**: Check Node.js version (requires >=18.0.0)
2. **Bot Not Responding**: Verify BOT_TOKEN is correct
3. **Admin Setup Fails**: Check ADMIN_USERNAME matches exactly

### Debug Commands
- Check logs in Railway dashboard
- Visit health check URL: `https://your-app.railway.app`
- Test bot with `/myid` command

## 🎯 Post-Deployment

1. **Test Admin Setup**: Send `/admin_setup` to bot
2. **Test Payment Flow**: Send `/start` to test user experience
3. **Monitor Logs**: Check Railway dashboard for any errors
4. **Update Frontend**: Ensure payment modal points to correct bot

## 🔗 Links

- **Railway Dashboard**: https://railway.app/dashboard
- **Bot Health Check**: Will be provided after deployment
- **Telegram Bot**: Search for your bot token on Telegram

---

The bot will be live 24/7 on Railway and ready to handle payment verifications!