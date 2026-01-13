// QR Code functionality for all pages

// Initialize QR code if elements exist
document.addEventListener('DOMContentLoaded', function() {
    const qrModal = document.getElementById('qrModal');
    if (qrModal) {
        setupQRCode();
    }
});

// Global QR functions
function setupQRCode() {
    const currentUrl = window.location.href;
    const qrContainer = document.getElementById('globalQrCode');
    const urlDisplay = document.getElementById('globalUrl');
    
    if (qrContainer && urlDisplay) {
        qrContainer.innerHTML = '';
        try {
            new QRCode(qrContainer, {
                text: currentUrl,
                width: 200,
                height: 200,
                colorDark: "#000000",
                colorLight: "#ffffff",
                correctLevel: QRCode.CorrectLevel.H
            });
            urlDisplay.textContent = currentUrl;
        } catch (error) {
            console.error('QR Code generation failed:', error);
            qrContainer.innerHTML = '<p style="color: red;">QR Code failed to load</p>';
        }
    }
}

// Make functions globally available
window.showQRModal = function() {
    const modal = document.getElementById('qrModal');
    if (modal) {
        modal.style.display = 'flex';
        setupQRCode();
    }
};

window.closeQRModal = function() {
    const modal = document.getElementById('qrModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

window.downloadGlobalQR = function() {
    const canvas = document.querySelector('#globalQrCode canvas');
    if (canvas) {
        const link = document.createElement('a');
        link.download = 'asmart-qr-code.png';
        link.href = canvas.toDataURL('image/png');
        link.click();
        if (typeof showNotification === 'function') {
            showNotification('QR Code downloaded!', 'success');
        }
    } else {
        if (typeof showNotification === 'function') {
            showNotification('QR Code not available for download', 'error');
        }
    }
};