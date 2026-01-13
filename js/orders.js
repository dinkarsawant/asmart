// Orders functionality
function loadUserOrders() {
    const user = firebase.auth().currentUser;
    if (!user) {
        document.getElementById('ordersContainer').innerHTML = `
            <div style="text-align: center; padding: 3rem;">
                <h3>Please login to view your orders</h3>
                <button class="btn btn-primary" onclick="location.href='login.html'">
                    <i class="fas fa-sign-in-alt"></i> Login
                </button>
            </div>
        `;
        return;
    }
    
    db.collection('orders')
        .where('userId', '==', user.uid)
        .orderBy('timestamp', 'desc')
        .get()
        .then((querySnapshot) => {
            const container = document.getElementById('ordersContainer');
            container.innerHTML = '';
            
            if (querySnapshot.empty) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 3rem; background: white; border-radius: 15px;">
                        <i class="fas fa-clipboard-list" style="font-size: 3rem; color: #ddd; margin-bottom: 1rem;"></i>
                        <h3>No orders yet</h3>
                        <p style="margin-bottom: 2rem;">Make your first order and enjoy 20-minute delivery!</p>
                        <button class="btn btn-primary" onclick="location.href='shop.html'">
                            <i class="fas fa-store"></i> Start Shopping
                        </button>
                    </div>
                `;
                return;
            }
            
            querySnapshot.forEach((doc) => {
                const order = doc.data();
                const orderDate = order.timestamp ? order.timestamp.toDate() : new Date();
                
                const orderHTML = `
                    <div class="cart-item">
                        <div style="flex: 1;">
                            <h3>Order #${order.orderId}</h3>
                            <p style="color: #666; margin-bottom: 0.5rem;">
                                ${orderDate.toLocaleDateString()} ${orderDate.toLocaleTimeString()}
                            </p>
                            <p>Items: ${order.items.length} | Total: $${order.total?.toFixed(2) || '0.00'}</p>
                            <div style="display: flex; gap: 1rem; margin-top: 1rem;">
                                <span class="status-badge ${getStatusClass(order.status)}">
                                    ${order.status}
                                </span>
                                ${order.status === 'delivered' ? 
                                    `<button class="btn btn-secondary" onclick="rateOrder('${order.orderId}')">
                                        <i class="fas fa-star"></i> Rate Order
                                    </button>` : ''}
                                <button class="btn btn-primary" onclick="location.href='tracking.html?order=${order.orderId}'">
                                    <i class="fas fa-map-marker-alt"></i> Track
                                </button>
                            </div>
                        </div>
                    </div>
                `;
                container.innerHTML += orderHTML;
            });
        })
        .catch((error) => {
            console.error('Error loading orders:', error);
        });
}

function getStatusClass(status) {
    switch(status) {
        case 'pending': return 'status-pending';
        case 'confirmed': return 'status-confirmed';
        case 'preparing': return 'status-preparing';
        case 'on_the_way': return 'status-ontheway';
        case 'delivered': return 'status-delivered';
        default: return '';
    }
}

function rateOrder(orderId) {
    const rating = prompt('Rate this order (1-5 stars):');
    if (rating && rating >= 1 && rating <= 5) {
        const review = prompt('Leave a review (optional):');
        
        db.collection('reviews').add({
            orderId: orderId,
            userId: firebase.auth().currentUser.uid,
            rating: parseInt(rating),
            review: review || '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            alert('Thank you for your review!');
        });
    }
}