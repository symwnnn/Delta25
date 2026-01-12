class Auth {
    static init() {
        // Only initialize landing page elements if they exist
        const keyInput = document.getElementById('accessKey');
        const unlockBtn = document.getElementById('unlockBtn');
        const errorMessage = document.getElementById('errorMessage');
        
        if (!keyInput || !unlockBtn || !errorMessage) {
            // We're not on the landing page, skip initialization
            console.log('Auth.init() skipped - not on landing page');
            return;
        }
        
        // Auto-format key input
        keyInput.addEventListener('input', (e) => {
            const formatted = AccessVerifier.formatKey(e.target.value.toUpperCase());
            e.target.value = formatted;
        });
        
        // Handle unlock
        unlockBtn.addEventListener('click', () => {
            this.handleUnlock(keyInput.value, errorMessage);
        });
        
        // Handle enter key
        keyInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleUnlock(keyInput.value, errorMessage);
            }
        });
        
        // Check if already authenticated
        if (this.isAuthenticated()) {
            window.location.href = 'dashboard.html';
        }
    }
    
    static handleUnlock(key, errorElement) {
        this.showError('', errorElement);
        
        const verification = AccessVerifier.verify(key);
        
        if (!verification.valid) {
            this.showError(verification.error, errorElement);
            return;
        }
        
        const deviceCheck = AccessVerifier.checkDeviceBinding(verification.keyHash);
        
        if (!deviceCheck.allowed) {
            this.showError(deviceCheck.error, errorElement);
            return;
        }
        
        // Store auth state
        localStorage.setItem('ck_auth', JSON.stringify({
            keyHash: verification.keyHash,
            timestamp: Date.now()
        }));
        
        window.location.href = 'dashboard.html';
    }
    
    static showError(message, element) {
        element.textContent = message;
        element.classList.toggle('show', !!message);
    }
    
    static isAuthenticated() {
        const auth = localStorage.getItem('ck_auth');
        if (!auth) return false;
        
        try {
            const data = JSON.parse(auth);
            const deviceCheck = AccessVerifier.checkDeviceBinding(data.keyHash);
            return deviceCheck.allowed;
        } catch {
            return false;
        }
    }
    
    static requireAuth() {
        if (!this.isAuthenticated()) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    Auth.init();
});