# Delta25 Telegram Bot

Payment verification bot for Delta25 access key purchases.

## Setup

1. **Bot is Pre-configured:**
   - Bot token: `8360848520:AAGSaChAjESWGw1gCtrjdZTXFZzWKgN1eEU`
   - Bot URL: https://t.me/delta25s_bot
   - Admin: @symwn_rana

2. **Admin Setup (First Time Only):**
   - @symwn_rana should message the bot: `/admin_setup`
   - This will configure your user ID as admin

3. **Install Dependencies:**
   ```bash
   npm install
   ```

4. **Run Bot:**
   ```bash
   npm start
   ```

## Admin Commands

- `/admin_setup` - Configure admin access (only for @symwn_rana)
- `/myid` - Get your user ID and details

## Bot Commands (Users)

- `/start` - Begin payment verification process

## User Flow

1. User sends `/start`
2. Bot requests transaction hash
3. User sends transaction hash
4. Bot requests payment screenshot
5. User uploads screenshot
6. Bot forwards to @symwn_rana with approve/reject buttons
7. Admin clicks approve/reject
8. User gets notified of decision

## Admin Workflow

1. Receive payment request with:
   - User ID and username
   - Transaction hash
   - Payment screenshot
   - Approve/Reject buttons

2. Click ✅ Approve:
   - User gets approval notification
   - Admin reminded to send key manually

3. Click ❌ Reject:
   - User gets rejection notification
   - Rejection logged

## Features

- ✅ Automatic admin detection for @symwn_rana
- ✅ Transaction hash collection
- ✅ Screenshot upload
- ✅ Admin forwarding with inline buttons
- ✅ User notifications
- ✅ Manual key distribution
- ✅ Error handling and logging

## Security

- Only @symwn_rana can become admin
- No auto-key generation
- Manual trust model
- In-memory session storage