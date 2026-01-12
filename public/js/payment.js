class Payment {
    static init() {
        this.createModal();
        this.bindEvents();
    }
    
    static createModal() {
        const modal = document.createElement('div');
        modal.id = 'paymentModal';
        modal.className = 'payment-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Purchase Access Key</h2>
                    <button class="close-btn" id="closeModal">&times;</button>
                </div>
                
                <div class="modal-body">
                    <div class="wallet-section">
                        <div class="wallet-label">Solana Wallet Address:</div>
                        <div class="wallet-address" id="walletAddress">9UwoZADSSf6xwGsqfEu1BmhjWhudE5Sfnt4viXBh7Krt</div>
                        <button class="copy-btn" id="copyWalletBtn">Copy Address</button>
                    </div>
                    
                    <div class="price-section">
                        <div class="price">$35 USDT / 90 Days</div>
                        <div class="payment-method">Pay via Solana Network</div>
                    </div>
                    
                    <div class="instructions">
                        <p>Copy the wallet address above</p>
                        <p>Send exactly $35 USDT equivalent in SOL</p>
                        <p>Click "Payment Done" after completing payment</p>
                    </div>
                    
                    <div class="payment-actions">
                        <button class="btn-primary" id="paymentDoneBtn">Payment Done</button>
                    </div>
                    
                    <div class="reference-section" id="referenceSection" style="display: none;">
                        <div class="reference-label">Payment Reference ID:</div>
                        <div class="reference-id" id="paymentRef">--</div>
                        <div class="reference-note">Include this ID in your Telegram message</div>
                    </div>
                    
                    <button class="btn-primary" id="continueToTelegram" style="display: none;">Continue to Telegram</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }
    
    static bindEvents() {
        const getAccessBtn = document.querySelector('.btn-secondary');
        const modal = document.getElementById('paymentModal');
        const closeBtn = document.getElementById('closeModal');
        const paymentDoneBtn = document.getElementById('paymentDoneBtn');
        const continueBtn = document.getElementById('continueToTelegram');
        const copyWalletBtn = document.getElementById('copyWalletBtn');
        
        // Override get access key button
        getAccessBtn.addEventListener('click', (e) => {
            e.preventDefault();
            this.openModal();
        });
        
        // Close modal
        closeBtn.addEventListener('click', () => this.closeModal());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) this.closeModal();
        });
        
        // Copy wallet address
        copyWalletBtn.addEventListener('click', () => this.copyWalletAddress());
        
        // Payment done button
        paymentDoneBtn.addEventListener('click', () => this.handlePaymentDone());
        
        // Continue to Telegram
        continueBtn.addEventListener('click', () => this.continueToTelegram());
        
        // ESC key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('show')) {
                this.closeModal();
            }
        });
    }
    
    static copyWalletAddress() {
        const walletAddress = document.getElementById('walletAddress').textContent;
        const copyBtn = document.getElementById('copyWalletBtn');
        
        navigator.clipboard.writeText(walletAddress).then(() => {
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            copyBtn.style.background = '#4caf50';
            
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.style.background = '';
            }, 2000);
        }).catch(() => {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = walletAddress;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            
            const originalText = copyBtn.textContent;
            copyBtn.textContent = 'Copied!';
            setTimeout(() => {
                copyBtn.textContent = originalText;
            }, 2000);
        });
    }
    
    static openModal() {
        const modal = document.getElementById('paymentModal');
        
        // Reset modal state
        document.getElementById('paymentRef').textContent = '--';
        document.getElementById('referenceSection').style.display = 'none';
        document.getElementById('continueToTelegram').style.display = 'none';
        document.getElementById('paymentDoneBtn').style.display = 'block';
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    static handlePaymentDone() {
        const refId = this.generatePaymentRef();
        
        // Show reference ID and continue button
        document.getElementById('paymentRef').textContent = refId;
        document.getElementById('referenceSection').style.display = 'block';
        document.getElementById('continueToTelegram').style.display = 'block';
        document.getElementById('paymentDoneBtn').style.display = 'none';
        
        // Store payment reference
        localStorage.setItem('pendingPaymentId', refId);
    }
    
    static closeModal() {
        const modal = document.getElementById('paymentModal');
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
    
    static generatePaymentRef() {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let result = 'PAY-';
        
        for (let i = 0; i < 6; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return result;
    }
    
    static continueToTelegram() {
        const deviceHash = DeviceFingerprint.generate();
        const paymentRef = localStorage.getItem('pendingPaymentId');
        
        // Store device hash for verification
        localStorage.setItem('deviceHash', deviceHash);
        
        window.open('https://t.me/delta25s_bot', '_blank');
        this.closeModal();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Payment.init();
});