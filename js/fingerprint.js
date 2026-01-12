class DeviceFingerprint {
    static generate() {
        const components = [
            navigator.userAgent,
            screen.width + 'x' + screen.height,
            screen.colorDepth,
            Intl.DateTimeFormat().resolvedOptions().timeZone,
            navigator.language,
            navigator.platform,
            this.getCanvasFingerprint()
        ];
        
        return this.hash(components.join('|'));
    }
    
    static getCanvasFingerprint() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        ctx.textBaseline = 'top';
        ctx.font = '14px Arial';
        ctx.fillText('CryptoKernel fingerprint', 2, 2);
        
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.fillRect(100, 5, 80, 20);
        
        return canvas.toDataURL();
    }
    
    static hash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash).toString(16);
    }
}