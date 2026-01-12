const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

// Bot configuration
const BOT_TOKEN = process.env.BOT_TOKEN || '8360848520:AAGSaChAjESWGw1gCtrjdZTXFZzWKgN1eEU';
const ADMIN_IDS = []; // Will be populated when admin first interacts with bot
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'symwn_rana'; // Admin username without @
const PORT = process.env.PORT || 3000;

// Initialize bot
const bot = new TelegramBot(BOT_TOKEN, { polling: true });

// In-memory storage for user sessions
const userSessions = new Map();

// User session states
const STATES = {
    WAITING_TX_HASH: 'waiting_tx_hash',
    WAITING_SCREENSHOT: 'waiting_screenshot',
    COMPLETED: 'completed'
};

// Admin setup command (only for @symwn_rana)
bot.onText(/\/admin_setup/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username;
    
    if (username === ADMIN_USERNAME) {
        if (!ADMIN_IDS.includes(userId)) {
            ADMIN_IDS.push(userId);
            bot.sendMessage(chatId, `✅ Admin configured successfully!\n\nYour User ID: ${userId}\nBot is now ready for payment verification.`);
            console.log(`Admin configured: @${username} (ID: ${userId})`);
        } else {
            bot.sendMessage(chatId, `✅ You are already configured as admin.\n\nYour User ID: ${userId}`);
        }
    } else {
        bot.sendMessage(chatId, '❌ Unauthorized access.');
    }
});

// Get user ID command (for debugging)
bot.onText(/\/myid/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const username = msg.from.username || 'N/A';
    
    bot.sendMessage(chatId, `Your Details:
User ID: ${userId}
Username: @${username}
Chat ID: ${chatId}`);
});

// Start command
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    
    // Initialize user session
    userSessions.set(userId, {
        chatId: chatId,
        username: msg.from.username || 'N/A',
        state: STATES.WAITING_TX_HASH,
        txHash: null,
        screenshot: null,
        timestamp: new Date().toISOString()
    });
    
    const welcomeMessage = `Delta25 Access Verification

To continue, please submit:
1️⃣ Solana Transaction Hash
2️⃣ Payment Screenshot

Payment: $35 USDT equivalent via Solana`;
    
    bot.sendMessage(chatId, welcomeMessage);
    
    // Prompt for transaction hash
    setTimeout(() => {
        bot.sendMessage(chatId, 'Please send your Solana transaction hash.');
    }, 1000);
});

// Handle text messages (transaction hash)
bot.on('message', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = userSessions.get(userId);
    
    // Skip if no session or if message is a command
    if (!session || msg.text?.startsWith('/')) return;
    
    // Handle transaction hash
    if (session.state === STATES.WAITING_TX_HASH && msg.text) {
        const txHash = msg.text.trim();
        
        // Basic validation for Solana transaction hash (should be base58, ~88 characters)
        if (txHash.length < 80 || txHash.length > 95) {
            bot.sendMessage(chatId, 'Please provide a valid Solana transaction hash (should be ~88 characters long).');
            return;
        }
        
        session.txHash = txHash;
        session.state = STATES.WAITING_SCREENSHOT;
        
        bot.sendMessage(chatId, `Solana transaction hash received: ${txHash.substring(0, 20)}...

Now upload a screenshot of the payment.
Screenshot is mandatory.`);
        return;
    }
    
    // Handle other text when waiting for screenshot
    if (session.state === STATES.WAITING_SCREENSHOT && msg.text) {
        bot.sendMessage(chatId, 'Please upload a screenshot of your payment.');
        return;
    }
});

// Handle photo uploads (screenshot)
bot.on('photo', (msg) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;
    const session = userSessions.get(userId);
    
    if (!session) {
        bot.sendMessage(chatId, 'Please start with /start command first.');
        return;
    }
    
    if (session.state !== STATES.WAITING_SCREENSHOT) {
        bot.sendMessage(chatId, 'Please send your transaction hash first.');
        return;
    }
    
    // Store screenshot info
    const photo = msg.photo[msg.photo.length - 1]; // Get highest resolution
    session.screenshot = photo.file_id;
    session.state = STATES.COMPLETED;
    
    // Confirm receipt
    bot.sendMessage(chatId, 'Payment proof received. Your submission is being reviewed.');
    
    // Forward to admins
    forwardToAdmins(session);
});

// Forward payment proof to admins
function forwardToAdmins(session) {
    if (ADMIN_IDS.length === 0) {
        bot.sendMessage(session.chatId, 'System temporarily unavailable. Please try again later.');
        console.error('No admins configured! Admin must use /admin_setup command first.');
        return;
    }
    
    const adminMessage = `🧾 Delta25 Payment Request

User ID: ${session.chatId}
Username: @${session.username}
Solana TX Hash: ${session.txHash}
Amount: $35 USDT equivalent
Time: ${session.timestamp}`;
    
    const inlineKeyboard = {
        inline_keyboard: [[
            {
                text: '✅ Approve',
                callback_data: `approve_${session.chatId}`
            },
            {
                text: '❌ Reject',
                callback_data: `reject_${session.chatId}`
            }
        ]]
    };
    
    // Send to each admin
    ADMIN_IDS.forEach(adminId => {
        // Send text message with buttons
        bot.sendMessage(adminId, adminMessage, {
            reply_markup: inlineKeyboard
        }).catch(err => console.error(`Failed to send message to admin ${adminId}:`, err));
        
        // Send screenshot
        if (session.screenshot) {
            bot.sendPhoto(adminId, session.screenshot, {
                caption: `Payment screenshot for User ID: ${session.chatId}`
            }).catch(err => console.error(`Failed to send photo to admin ${adminId}:`, err));
        }
    });
}

// Handle admin callback queries (approve/reject buttons)
bot.on('callback_query', (callbackQuery) => {
    const adminId = callbackQuery.from.id;
    const messageId = callbackQuery.message.message_id;
    const data = callbackQuery.data;
    
    // Check if user is admin
    if (!ADMIN_IDS.includes(adminId)) {
        bot.answerCallbackQuery(callbackQuery.id, {
            text: 'Unauthorized access. Use /admin_setup if you are @symwn_rana',
            show_alert: true
        });
        return;
    }
    
    // Parse callback data
    const [action, userChatId] = data.split('_');
    const targetChatId = parseInt(userChatId);
    
    if (action === 'approve') {
        // Notify user of approval
        bot.sendMessage(targetChatId, '✅ Payment approved. Your Delta25 access key will be sent shortly.')
            .catch(err => console.error('Failed to notify user of approval:', err));
        
        // Notify admin
        bot.sendMessage(adminId, `✅ Access approved for User ID: ${targetChatId}. Please send the key manually.`);
        
        // Update admin message
        bot.editMessageText(`✅ APPROVED by @${callbackQuery.from.username}\nUser ID: ${targetChatId}\nAccess key to be sent manually`, {
            chat_id: adminId,
            message_id: messageId
        }).catch(err => console.error('Failed to edit message:', err));
        
    } else if (action === 'reject') {
        // Notify user of rejection
        bot.sendMessage(targetChatId, '❌ Payment could not be verified. Please contact support or resend proof.')
            .catch(err => console.error('Failed to notify user of rejection:', err));
        
        // Update admin message
        bot.editMessageText(`❌ REJECTED by @${callbackQuery.from.username}\nUser ID: ${targetChatId}\nUser notified`, {
            chat_id: adminId,
            message_id: messageId
        }).catch(err => console.error('Failed to edit message:', err));
        
        // Log rejection
        console.log(`Payment rejected for user ${targetChatId} by admin ${adminId} (@${callbackQuery.from.username}) at ${new Date().toISOString()}`);
    }
    
    // Answer callback query
    bot.answerCallbackQuery(callbackQuery.id, {
        text: `Payment ${action}d successfully.`
    });
});

// Handle document uploads (in case user sends file instead of photo)
bot.on('document', (msg) => {
    const chatId = msg.chat.id;
    
    if (msg.document.mime_type?.startsWith('image/')) {
        // Treat as photo
        const fakePhotoMsg = {
            ...msg,
            photo: [{ file_id: msg.document.file_id }]
        };
        bot.emit('photo', fakePhotoMsg);
    } else {
        bot.sendMessage(chatId, 'Please send a screenshot image, not a document.');
    }
});

// Error handling
bot.on('error', (error) => {
    console.error('Bot error:', error);
});

// Polling error handling
bot.on('polling_error', (error) => {
    console.error('Polling error:', error);
});

console.log('🤖 Delta25 Telegram Bot Starting...');
console.log('📋 Configuration:');
console.log(`   Bot Token: ${BOT_TOKEN.substring(0, 20)}...`);
console.log(`   Admin Username: @${ADMIN_USERNAME}`);
console.log(`   Configured Admins: ${ADMIN_IDS.length === 0 ? 'None (use /admin_setup)' : ADMIN_IDS.length}`);
console.log(`   Port: ${PORT}`);
console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
console.log('✅ Bot is running and ready for payments!');
console.log('');
console.log('📝 Next Steps:');
console.log('1. Admin (@symwn_rana) should message the bot: /admin_setup');
console.log('2. Test with /myid to verify setup');
console.log('3. Bot is ready for payment verification');
console.log('');

// Keep the process alive for Railway
if (process.env.RAILWAY_ENVIRONMENT || process.env.NODE_ENV === 'production') {
    const express = require('express');
    const app = express();
    
    app.get('/', (req, res) => {
        res.json({
            status: 'Delta25 Telegram Bot is running',
            uptime: process.uptime(),
            admins: ADMIN_IDS.length,
            timestamp: new Date().toISOString(),
            platform: 'Railway'
        });
    });
    
    app.get('/health', (req, res) => {
        res.json({ 
            status: 'healthy',
            bot_running: true,
            admins_configured: ADMIN_IDS.length > 0
        });
    });
    
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`🌐 Health check server running on port ${PORT}`);
    });
}