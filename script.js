// Shared JavaScript functions for all pages

// Cart functionality
let cart = JSON.parse(localStorage.getItem('asmartCart')) || [];

// Make function available globally
window.addToCartShared = function(product) {
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === product.id);
    
    if (existingItem) {
        existingItem.quantity = (existingItem.quantity || 1) + 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1
        });
    }
    
    localStorage.setItem('asmartCart', JSON.stringify(cart));
    updateCartCount();
    showNotification(`Added ${product.name} to cart!`, 'success');
};

function updateCartCount() {
    const cartCount = document.getElementById('cartCount');
    if (cartCount) {
        const totalItems = cart.reduce((total, item) => total + (item.quantity || 1), 0);
        cartCount.textContent = totalItems;
    }
}

function goToCart() {
    if (cart.length === 0) {
        showNotification('Your cart is empty!', 'info');
        return;
    }
    window.location.href = 'cart.html';
}

// Notification function
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div style="display: flex; align-items: center; gap: 10px;">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button onclick="this.parentElement.remove()" style="background: none; border: none; cursor: pointer; color: #666;">
            <i class="fas fa-times"></i>
        </button>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 3000);
}

function getNotificationIcon(type) {
    switch(type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        default: return 'info-circle';
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateCartCount();
});