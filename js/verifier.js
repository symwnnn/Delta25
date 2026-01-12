class AccessVerifier {
    static SALT = 'CK_2024_SALT_KERNEL';
    static VALID_HASHES = [
        'd24b622',           // TEST-KEY1-2024
        'd294aff',           // DEMO-ACCS-LIVE
        '215d4a78',          // BETA-USER-PASS
        '4fcaab27'           // SYMN-DEVE-2024
    ];
    
    static formatKey(input) {
        const cleaned = input.replace(/[^A-Z0-9]/g, '');
        const formatted = cleaned.match(/.{1,4}/g)?.join('-') || '';
        return formatted.substring(0, 14);
    }
    
    static validateFormat(key) {
        const pattern = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
        return pattern.test(key);
    }
    
    static hashKey(key) {
        const combined = key + this.SALT;
        let hash = 0;
        
        for (let i = 0; i < combined.length; i++) {
            const char = combined.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        
        return Math.abs(hash).toString(16).substring(0, 16);
    }
    
    static verify(key) {
        if (!this.validateFormat(key)) {
            return { valid: false, error: 'Invalid key format' };
        }
        
        const keyHash = this.hashKey(key);
        const isValid = this.VALID_HASHES.includes(keyHash);
        
        if (!isValid) {
            return { valid: false, error: 'Invalid access key' };
        }
        
        // Check license expiration
        const licenseCheck = this.checkLicenseExpiry(keyHash);
        if (!licenseCheck.valid) {
            return { valid: false, error: licenseCheck.error };
        }
        
        return {
            valid: true,
            keyHash: keyHash,
            error: null
        };
    }
    
    static checkLicenseExpiry(keyHash) {
        // Admin key bypass - no expiration
        if (keyHash === '4fcaab27') {
            return { valid: true, isAdmin: true };
        }
        
        const licenseData = localStorage.getItem('ck_license_' + keyHash);
        const currentTime = Date.now();
        
        if (!licenseData) {
            // First time activation - set 90 day expiry
            const expiryTime = currentTime + (90 * 24 * 60 * 60 * 1000); // 90 days
            localStorage.setItem('ck_license_' + keyHash, JSON.stringify({
                activatedAt: currentTime,
                expiresAt: expiryTime
            }));
            return { valid: true };
        }
        
        try {
            const license = JSON.parse(licenseData);
            
            if (currentTime > license.expiresAt) {
                return { 
                    valid: false, 
                    error: 'License expired. Purchase new 90-day license.' 
                };
            }
            
            return { valid: true };
        } catch {
            return { valid: false, error: 'License data corrupted' };
        }
    }
    
    static checkDeviceBinding(keyHash) {
        const stored = localStorage.getItem('ck_device_binding');
        const currentDevice = DeviceFingerprint.generate();
        
        if (!stored) {
            // First time binding
            const binding = { [keyHash]: currentDevice };
            localStorage.setItem('ck_device_binding', JSON.stringify(binding));
            return { allowed: true, firstTime: true };
        }
        
        const bindings = JSON.parse(stored);
        
        if (bindings[keyHash]) {
            if (bindings[keyHash] === currentDevice) {
                return { allowed: true, firstTime: false };
            } else {
                return { allowed: false, error: 'Key bound to different device' };
            }
        } else {
            // New key on existing device
            bindings[keyHash] = currentDevice;
            localStorage.setItem('ck_device_binding', JSON.stringify(bindings));
            return { allowed: true, firstTime: true };
        }
    }
}