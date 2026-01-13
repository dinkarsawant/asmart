// global-qr.js - Global QR Code Access System

class GlobalQRSystem {
    constructor() {
        this.currentURL = window.location.origin;
        this.qrCode = null;
        this.init();
    }
    
    init() {
        // Load QR code library dynamically
        this.loadQRCodeLibrary();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Generate initial QR code
        setTimeout(() => this.generateGlobalQR(), 1000);
    }
    
    loadQRCodeLibrary() {
        // Load QRCode.js if not already loaded
        if (!document.querySelector('script[src*="qrcode.min.js"]')) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
            script.onload = () => {
                console.log('QRCode library loaded');
                this.generateGlobalQR();
            };
            document.head.appendChild(script);
        }
    }
    
    setupEventListeners() {
        // Floating button click
        const floatingBtn = document.getElementById('floatingQRBtn');
        if (floatingBtn) {
            floatingBtn.addEventListener('click', () => this.showQRModal());
        }
        
        // Close modal when clicking outside
        const modal = document.getElementById('qrModal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.closeQRModal();
                }
            });
        }
    }
    
    generateGlobalQR() {
        // Get current website URL
        const url = this.getGlobalURL();
        
        // Display URL
        const urlElement = document.getElementById('globalUrl');
        if (urlElement) {
            urlElement.textContent = url;
        }
        
        // Generate QR Code
        const qrContainer = document.getElementById('globalQrCode');
        if (qrContainer && typeof QRCode !== 'undefined') {
            // Clear previous QR code
            qrContainer.innerHTML = '';
            
            // Create new QR code
            this.qrCode = new QRCode(qrContainer, {
                text: url,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            
            console.log('Global QR Code generated for:', url);
        }
    }
    
    getGlobalURL() {
        // Try to get the deployed URL
        let url = this.currentURL;
        
        // If localhost, provide instructions
        if (url.includes('localhost') || url.includes('192.168') || url.includes('127.0.0.1')) {
            url = 'https://asmart.vercel.app'; // Default deployed URL
        }
        
        return url;
    }
    
    showQRModal() {
        const modal = document.getElementById('qrModal');
        if (modal) {
            modal.style.display = 'flex';
            // Regenerate QR code to ensure it's current
            this.generateGlobalQR();
        }
    }
    
    closeQRModal() {
        const modal = document.getElementById('qrModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }
    
    downloadGlobalQR() {
        const canvas = document.querySelector('#globalQrCode canvas');
        if (canvas) {
            const link = document.createElement('a');
            link.download = `AsMart-Global-QR-${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Show success message
            this.showMessage('QR Code downloaded successfully!', 'success');
        } else {
            this.showMessage('Please wait for QR code to generate', 'error');
        }
    }
    
    showMessage(text, type = 'info') {
        // Create notification
        const notification = document.createElement('div');
        notification.textContent = text;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Share functionality
    shareQRCode() {
        if (navigator.share) {
            const url = this.getGlobalURL();
            navigator.share({
                title: 'AsMart - Online Food Delivery',
                text: 'Scan QR code to access AsMart',
                url: url
            });
        } else {
            // Fallback - copy to clipboard
            const url = this.getGlobalURL();
            navigator.clipboard.writeText(url).then(() => {
                this.showMessage('URL copied to clipboard!', 'success');
            });
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.GlobalQR = new GlobalQRSystem();
});

// Global functions for HTML onclick
function showQRModal() {
    if (window.GlobalQR) {
        window.GlobalQR.showQRModal();
    }
}

function closeQRModal() {
    if (window.GlobalQR) {
        window.GlobalQR.closeQRModal();
    }
}

function downloadGlobalQR() {
    if (window.GlobalQR) {
        window.GlobalQR.downloadGlobalQR();
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
    
    #floatingQRBtn:hover {
        transform: scale(1.1);
    }
    
    .modal-content {
        animation: modalFadeIn 0.3s;
    }
    
    @keyframes modalFadeIn {
        from {
            opacity: 0;
            transform: scale(0.9);
        }
        to {
            opacity: 1;
            transform: scale(1);
        }
    }
`;
document.head.appendChild(style);