// Cart functionality
let cart = JSON.parse(localStorage.getItem('cart')) || [];

function addToCart(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const existingItem = cart.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
    } else {
        cart.push({
            id: product.id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: 1
        });
    }
    
    saveCart();
    updateCartCount();
    alert(`${product.name} added to cart!`);
}

function removeFromCart(productId) {
    cart = cart.filter(item => item.id !== productId);
    saveCart();
    loadCart();
    updateCartCount();
}

function updateQuantity(productId, change) {
    const item = cart.find(item => item.id === productId);
    if (!item) return;
    
    item.quantity += change;
    
    if (item.quantity < 1) {
        removeFromCart(productId);
    } else {
        saveCart();
        loadCart();
        updateCartCount();
    }
}

function saveCart() {
    localStorage.setItem('cart', JSON.stringify(cart));
}

function loadCart() {
    const container = document.getElementById('cartItems');
    if (!container) return;
    
    cart = JSON.parse(localStorage.getItem('cart')) || [];
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div style="text-align: center; padding: 3rem; background: white; border-radius: 15px;">
                <i class="fas fa-shopping-cart" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                <h3>Your cart is empty</h3>
                <p style="margin-bottom: 2rem;">Add some items to get started!</p>
                <button class="btn btn-primary" onclick="location.href='shop.html'">
                    <i class="fas fa-store"></i> Start Shopping
                </button>
            </div>
        `;
        updateTotals(0, 0, 0);
        return;
    }
    
    container.innerHTML = '';
    let subtotal = 0;
    
    cart.forEach(item => {
        const itemTotal = item.price * item.quantity;
        subtotal += itemTotal;
        
        const itemHTML = `
            <div class="cart-item">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <h3>${item.name}</h3>
                    <div class="product-price">$${item.price.toFixed(2)}</div>
                    <div class="quantity-controls">
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, -1)">-</button>
                        <span style="font-weight: bold; min-width: 30px; text-align: center;">${item.quantity}</span>
                        <button class="quantity-btn" onclick="updateQuantity(${item.id}, 1)">+</button>
                        <button style="margin-left: 1rem; color: var(--danger); background: none; border: none; cursor: pointer;" 
                                onclick="removeFromCart(${item.id})">
                            <i class="fas fa-trash"></i> Remove
                        </button>
                    </div>
                </div>
                <div style="font-weight: bold; font-size: 1.2rem;">
                    $${itemTotal.toFixed(2)}
                </div>
            </div>
        `;
        container.innerHTML += itemHTML;
    });
    
    const deliveryFee = 2.99;
    const tax = subtotal * 0.10;
    const total = subtotal + deliveryFee + tax;
    
    updateTotals(subtotal, tax, total);
}

function updateTotals(subtotal, tax, total) {
    const subtotalEl = document.getElementById('subtotal');
    const taxEl = document.getElementById('tax');
    const totalEl = document.getElementById('total');
    
    if (subtotalEl) subtotalEl.textContent = `$${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `$${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
}

function updateCartCount() {
    const countElements = document.querySelectorAll('.cart-count');
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    
    countElements.forEach(el => {
        el.textContent = totalItems;
    });
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('cartItems')) {
        loadCart();
    }
    updateCartCount();
});