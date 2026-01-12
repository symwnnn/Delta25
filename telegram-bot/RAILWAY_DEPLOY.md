# Deploy Delta25 Telegram Bot to Railway

## Prerequisites
- Railway account (https://railway.app)
- GitHub repository: https://github.com/symwnnn/Delta25.git

## Deployment Steps

### Method 1: Railway Dashboard (Recommended)

1. **Login to Railway**: https://railway.app
2. **Create New Project**: Click "New Project"
3. **Deploy from GitHub**: Select "Deploy from GitHub repo"
4. **Select Repository**: Choose `symwnnn/Delta25`
5. **Configure Service**:
   - Root Directory: `telegram-bot`
   - Build Method: Dockerfile (automatically detected)

6. **Set Environment Variables**:
   ```
   BOT_TOKEN=8360848520:AAGSaChAjESWGw1gCtrjdZTXFZzWKgN1eEU
   ADMIN_USERNAME=symwn_rana
   NODE_ENV=production
   ```

7. **Deploy**: Railway will automatically build using Dockerfile

### Method 2: Railway CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login to Railway
railway login

# Navigate to bot directory
cd telegram-bot

# Initialize Railway project
railway init

# Set environment variables
railway variables set BOT_TOKEN=8360848520:AAGSaChAjESWGw1gCtrjdZTXFZzWKgN1eEU
railway variables set ADMIN_USERNAME=symwn_rana
railway variables set NODE_ENV=production

# Deploy
railway up
```

## Configuration Files

- ✅ `Dockerfile` - Container configuration
- ✅ `railway.json` - Railway-specific settings
- ✅ `.dockerignore` - Files to exclude from Docker build
- ✅ `package.json` - Dependencies and scripts

## After Deployment

1. **Bot URL**: Railway will provide a public URL (e.g., `https://delta25-bot-production.up.railway.app`)
2. **Admin Setup**: Message the bot `/admin_setup` from @symwn_rana
3. **Health Check**: Visit `{BOT_URL}/health` to verify bot status

## Testing

1. Find your bot on Telegram
2. Send `/admin_setup` from @symwn_rana account
3. Test payment flow with `/start`
4. Verify admin approval system works

## Monitoring

- Railway dashboard shows logs and metrics
- Health endpoint: `{BOT_URL}/health`
- Bot automatically restarts on crashes
- Logs available in Railway console

## Troubleshooting

- Check Railway logs for errors
- Verify environment variables are set
- Ensure bot token is valid
- Confirm admin username is correct (@symwn_rana)