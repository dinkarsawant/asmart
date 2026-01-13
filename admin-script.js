// AS Mart Admin Panel Script - Enhanced with User Sync
// ====================================================

// Check admin authentication
(function checkAuth() {
    if (sessionStorage.getItem('asmartAdminLoggedIn') !== 'true') {
        window.location.href = 'admin-login.html';
        return;
    }
    
    // Check session timeout (8 hours)
    const loginTime = parseInt(sessionStorage.getItem('asmartAdminLoginTime') || '0');
    const eightHours = 8 * 60 * 60 * 1000;
    
    if (Date.now() - loginTime > eightHours) {
        sessionStorage.removeItem('asmartAdminLoggedIn');
        sessionStorage.removeItem('asmartAdminLoginTime');
        window.location.href = 'admin-login.html';
    }
})();

// Global variables
let allOrders = [];
let filteredOrders = [];
let selectedOrder = null;
let notifications = [];
let refreshInterval = null;

// DOM Elements
const ordersList = document.getElementById('ordersList');
const noOrdersMessage = document.getElementById('noOrdersMessage');
const orderDetailsContent = document.getElementById('orderDetailsContent');
const orderDetailsContainer = document.getElementById('orderDetailsContainer');
const orderActions = document.getElementById('orderActions');
const notificationsPanel = document.getElementById('notificationsPanel');
const notificationsList = document.getElementById('notificationsList');
const notificationCount = document.getElementById('notificationCount');

// Stats elements
const totalOrdersEl = document.getElementById('totalOrders');
const pendingOrdersEl = document.getElementById('pendingOrders');
const totalRevenueEl = document.getElementById('totalRevenue');
const totalCustomersEl = document.getElementById('totalCustomers');
const ordersTodayEl = document.getElementById('ordersToday');

// Filter elements
const statusFilter = document.getElementById('statusFilter');
const timeFilter = document.getElementById('timeFilter');
const searchOrders = document.getElementById('searchOrders');

// Button elements
const refreshBtn = document.getElementById('refreshBtn');
const logoutBtn = document.getElementById('logoutBtn');
const notificationsBtn = document.getElementById('notificationsBtn');
const closeNotificationsBtn = document.getElementById('closeNotificationsBtn');

// Action buttons
const acceptOrderBtn = document.getElementById('acceptOrderBtn');
const rejectOrderBtn = document.getElementById('rejectOrderBtn');
const processOrderBtn = document.getElementById('processOrderBtn');
const markDeliveredBtn = document.getElementById('markDeliveredBtn');
const callCustomerBtn = document.getElementById('callCustomerBtn');
const printInvoiceBtn = document.getElementById('printInvoiceBtn');
const viewOnMapBtn = document.getElementById('viewOnMapBtn');

// Bulk action buttons
const acceptAllPendingBtn = document.getElementById('acceptAllPendingBtn');
const markAllProcessingBtn = document.getElementById('markAllProcessingBtn');
const exportOrdersBtn = document.getElementById('exportOrdersBtn');
const clearOldOrdersBtn = document.getElementById('clearOldOrdersBtn');

// Modal elements
const settingsModal = document.getElementById('settingsModal');
const confirmationModal = document.getElementById('confirmationModal');
const confirmationTitle = document.getElementById('confirmationTitle');
const confirmationMessage = document.getElementById('confirmationMessage');
const confirmActionBtn = document.getElementById('confirmActionBtn');
const cancelActionBtn = document.getElementById('cancelActionBtn');

// Settings elements
const refreshIntervalSelect = document.getElementById('refreshInterval');
const currentPasswordInput = document.getElementById('currentPassword');
const newPasswordInput = document.getElementById('newPassword');
const confirmPasswordInput = document.getElementById('confirmPassword');
const savePasswordBtn = document.getElementById('savePasswordBtn');
const storeNameInput = document.getElementById('storeNameInput');
const storePhoneInput = document.getElementById('storePhoneInput');
const storeAddressInput = document.getElementById('storeAddressInput');
const saveStoreInfoBtn = document.getElementById('saveStoreInfoBtn');

// Initialize dashboard
document.addEventListener('DOMContentLoaded', function() {
    initDashboard();
    setupEventListeners();
    startAutoRefresh();
    updateTimeDate();
    
    // Update time every minute
    setInterval(updateTimeDate, 60000);
});

function initDashboard() {
    loadStoreInfo();
    loadOrders();
    loadNotifications();
    updateStats();
    applyFilters();
}

// Load store information
function loadStoreInfo() {
    const storeName = localStorage.getItem('asmartStoreName') || 'AS Mart';
    const storePhone = localStorage.getItem('asmartStorePhone') || '';
    const storeAddress = localStorage.getItem('asmartStoreAddress') || '';
    
    // Update header
    document.getElementById('storeNameHeader').textContent = `${storeName} Admin`;
    
    // Update settings form
    storeNameInput.value = storeName;
    storePhoneInput.value = storePhone;
    storeAddressInput.value = storeAddress;
}

// Load orders from localStorage
function loadOrders() {
    try {
        // Load admin orders
        const ordersJson = localStorage.getItem('asmartOrders');
        allOrders = ordersJson ? JSON.parse(ordersJson) : [];
        
        // Load user orders and merge
        const userOrdersJson = localStorage.getItem('userOrders') || '[]';
        const userOrders = JSON.parse(userOrdersJson);
        
        // Merge user orders with admin orders
        userOrders.forEach(userOrder => {
            // Check if order already exists in admin orders
            const existingIndex = allOrders.findIndex(order => 
                order.orderNumber === userOrder.orderNumber ||
                order.id === userOrder.id
            );
            
            if (existingIndex === -1) {
                // Add missing order
                allOrders.push({
                    ...userOrder,
                    id: userOrder.id || Date.now(),
                    orderNumber: userOrder.orderNumber || `USER${Date.now().toString().slice(-6)}`
                });
            }
        });
        
        // Sort by date (newest first)
        allOrders.sort((a, b) => (b.timestamp || b.id) - (a.timestamp || a.id));
        
        // Save merged orders
        localStorage.setItem('asmartOrders', JSON.stringify(allOrders));
        
        // Check for new orders and add notifications
        checkForNewOrders();
        
        updateStats();
        renderOrdersList();
        
    } catch (error) {
        console.error('Error loading orders:', error);
        showAlert('Error loading orders. Please refresh the page.', 'error');
        allOrders = [];
    }
}

// Check for new orders since last check
function checkForNewOrders() {
    const lastCheck = parseInt(localStorage.getItem('asmartLastOrderCheck') || '0');
    const newOrders = allOrders.filter(order => (order.timestamp || order.id) > lastCheck);
    
    if (newOrders.length > 0) {
        // Update last check time
        const latestOrderTime = Math.max(...newOrders.map(o => o.timestamp || o.id));
        localStorage.setItem('asmartLastOrderCheck', latestOrderTime.toString());
        
        // Add notifications for new orders
        newOrders.forEach(order => {
            addNotification('new_order', order);
        });
        
        // Play sound if enabled
        if (localStorage.getItem('asmartSoundNotifications') !== 'false') {
            playNotificationSound();
        }
        
        // Show desktop notification
        if (newOrders.length === 1) {
            showDesktopNotification(`New Order #${newOrders[0].orderNumber || newOrders[0].id}`);
        } else {
            showDesktopNotification(`${newOrders.length} New Orders`);
        }
    }
}

// Add notification
function addNotification(type, order) {
    const notification = {
        id: Date.now(),
        type: type,
        orderId: order.id,
        orderNumber: order.orderNumber || `#${order.id.toString().slice(-6)}`,
        message: getNotificationMessage(type, order),
        time: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        read: false
    };
    
    notifications.unshift(notification);
    saveNotifications();
    updateNotificationBadge();
    renderNotifications();
}

// Get notification message based on type
function getNotificationMessage(type, order) {
    switch(type) {
        case 'new_order':
            return `New order ${order.orderNumber || '#' + order.id} from ${order.customerName || 'Customer'}`;
        case 'status_changed':
            return `Order ${order.orderNumber || '#' + order.id} status changed to ${order.status}`;
        case 'order_synced':
            return `Order ${order.orderNumber || '#' + order.id} synced with user history`;
        default:
            return `Order ${order.orderNumber || '#' + order.id} updated`;
    }
}

// Save notifications to localStorage
function saveNotifications() {
    localStorage.setItem('asmartNotifications', JSON.stringify(notifications));
}

// Load notifications
function loadNotifications() {
    const notificationsJson = localStorage.getItem('asmartNotifications');
    notifications = notificationsJson ? JSON.parse(notificationsJson) : [];
    updateNotificationBadge();
    renderNotifications();
}

// Update notification badge
function updateNotificationBadge() {
    const unreadCount = notifications.filter(n => !n.read).length;
    notificationCount.textContent = unreadCount;
    notificationCount.style.display = unreadCount > 0 ? 'inline-block' : 'none';
}

// Render notifications list
function renderNotifications() {
    if (!notificationsList) return;
    
    if (notifications.length === 0) {
        notificationsList.innerHTML = `
            <div class="no-notifications">
                <i class="fas fa-bell-slash"></i>
                <p>No notifications yet</p>
            </div>
        `;
        return;
    }
    
    let notificationsHTML = '';
    
    notifications.forEach(notification => {
        const notificationClass = notification.read ? 'notification-item' : 'notification-item unread';
        const icon = getNotificationIcon(notification.type);
        
        notificationsHTML += `
            <div class="${notificationClass}" data-notification-id="${notification.id}">
                <div class="notification-icon">${icon}</div>
                <div class="notification-content">
                    <p class="notification-message">${notification.message}</p>
                    <div class="notification-time">${notification.time}</div>
                </div>
            </div>
        `;
    });
    
    notificationsList.innerHTML = notificationsHTML;
    
    // Add click events to mark as read
    notificationsList.querySelectorAll('.notification-item').forEach(item => {
        item.addEventListener('click', function() {
            const notificationId = parseInt(this.dataset.notificationId);
            markNotificationAsRead(notificationId);
        });
    });
}

function getNotificationIcon(type) {
    switch(type) {
        case 'new_order': return '<i class="fas fa-shopping-cart"></i>';
        case 'status_changed': return '<i class="fas fa-sync-alt"></i>';
        case 'order_synced': return '<i class="fas fa-check-circle"></i>';
        default: return '<i class="fas fa-bell"></i>';
    }
}

// Mark notification as read
function markNotificationAsRead(notificationId) {
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
        notification.read = true;
        saveNotifications();
        updateNotificationBadge();
        renderNotifications();
    }
}

// Render orders list
function renderOrdersList() {
    if (filteredOrders.length === 0) {
        ordersList.innerHTML = '';
        noOrdersMessage.style.display = 'block';
        return;
    }
    
    noOrdersMessage.style.display = 'none';
    
    let ordersHTML = '';
    
    filteredOrders.forEach(order => {
        const statusClass = `status-${order.status.toLowerCase().replace(/ /g, '-')}`;
        const isSelected = selectedOrder && selectedOrder.id === order.id ? 'selected' : '';
        
        // Format items text
        let itemsText = '';
        if (Array.isArray(order.items)) {
            itemsText = order.items.map(item => 
                `${item.name || item.product} x${item.quantity || 1}`
            ).join(', ');
        } else if (typeof order.items === 'string') {
            itemsText = order.items;
        } else {
            itemsText = 'Items not specified';
        }
        
        // Truncate if too long
        if (itemsText.length > 40) {
            itemsText = itemsText.substring(0, 37) + '...';
        }
        
        // Check if order is synced with user history
        const isSynced = isOrderSynced(order);
        const syncIcon = isSynced ? '<i class="fas fa-sync-alt synced" title="Synced with user"></i>' : 
                                   '<i class="fas fa-exclamation-triangle not-synced" title="Not synced"></i>';
        
        ordersHTML += `
            <div class="order-item ${isSelected}" data-order-id="${order.id}">
                <div class="order-header">
                    <div class="order-id">
                        ${syncIcon}
                        ${order.orderNumber || `#${order.id.toString().slice(-6)}`}
                    </div>
                    <div class="order-time">${order.date || formatDate(order.timestamp || order.id)}</div>
                </div>
                <div class="order-customer">
                    <div class="customer-name">${order.customerName || 'Customer'}</div>
                    <div class="customer-contact">
                        <i class="fas fa-phone"></i> ${order.customerPhone || 'No phone'} 
                        | <i class="fas fa-map-marker-alt"></i> ${getAreaFromAddress(order.deliveryAddress)}
                    </div>
                </div>
                <div class="order-summary">
                    <div class="order-items">${itemsText}</div>
                    <div class="order-amount">₹${order.total || '0'}</div>
                </div>
                <div class="order-status ${statusClass}">${order.status}</div>
            </div>
        `;
    });
    
    ordersList.innerHTML = ordersHTML;
    
    // Add click events to order items
    ordersList.querySelectorAll('.order-item').forEach(item => {
        item.addEventListener('click', function() {
            const orderId = parseInt(this.dataset.orderId);
            selectOrder(orderId);
        });
    });
}

// Check if order is synced with user history
function isOrderSynced(order) {
    const userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    const userOrder = userOrders.find(o => 
        o.orderNumber === order.orderNumber || 
        (o.id && o.id === order.id)
    );
    
    if (!userOrder) return false;
    
    // Check if status matches
    return userOrder.status === order.status;
}

// Format timestamp to readable date
function formatDate(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Get area from address (simplified)
function getAreaFromAddress(address) {
    if (!address) return 'Unknown';
    
    // Try to extract area/locality from address
    const lines = address.split('\n');
    if (lines.length > 1) {
        return lines[lines.length - 2]; // Second last line often contains area
    }
    
    // If only one line, take first few words
    const words = address.split(' ');
    if (words.length > 3) {
        return words.slice(0, 3).join(' ') + '...';
    }
    
    return address.substring(0, 20) + (address.length > 20 ? '...' : '');
}

// Select an order
function selectOrder(orderId) {
    // Deselect all orders
    ordersList.querySelectorAll('.order-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // Find and select the clicked order
    const orderItem = ordersList.querySelector(`[data-order-id="${orderId}"]`);
    if (orderItem) {
        orderItem.classList.add('selected');
    }
    
    // Find the order data
    selectedOrder = allOrders.find(order => order.id === orderId);
    
    if (selectedOrder) {
        showOrderDetails(selectedOrder);
        updateActionButtons(selectedOrder.status);
    }
}

// Show order details
function showOrderDetails(order) {
    orderDetailsContent.style.display = 'block';
    orderActions.style.display = 'flex';
    document.querySelector('.select-order-message').style.display = 'none';
    
    // Format items list
    let itemsHTML = '';
    if (Array.isArray(order.items)) {
        order.items.forEach(item => {
            const price = parseFloat(item.price) || 0;
            const quantity = parseInt(item.quantity) || 1;
            const total = price * quantity;
            
            itemsHTML += `
                <div class="item-row">
                    <div class="item-name">${item.name || item.product || 'Item'}</div>
                    <div class="item-qty">x${quantity}</div>
                    <div class="item-price">₹${total.toFixed(2)}</div>
                </div>
            `;
        });
    } else {
        itemsHTML = `
            <div class="item-row">
                <div class="item-name">${order.items || 'Items not specified'}</div>
                <div class="item-qty">1</div>
                <div class="item-price">₹${order.total || '0'}</div>
            </div>
        `;
    }
    
    // Calculate subtotal
    const subtotal = parseFloat(order.total) || 0;
    const deliveryCharge = subtotal > 500 ? 0 : 40; // Free delivery above 500
    const total = subtotal + deliveryCharge;
    
    // Check sync status
    const isSynced = isOrderSynced(order);
    const syncStatus = isSynced ? 
        '<span class="sync-status synced"><i class="fas fa-check-circle"></i> Synced with user</span>' :
        '<span class="sync-status not-synced"><i class="fas fa-exclamation-triangle"></i> Not synced</span>';
    
    // Build order details HTML
    const detailsHTML = `
        <div class="detail-section">
            <h3><i class="fas fa-user"></i> Customer Information</h3>
            <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${order.customerName || 'Not provided'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value">${order.customerPhone || 'Not provided'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Email:</div>
                <div class="detail-value">${order.customerEmail || 'Not provided'}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="fas fa-map-marker-alt"></i> Delivery Address</h3>
            <div class="address-box">${order.deliveryAddress ? order.deliveryAddress.replace(/\n/g, '<br>') : 'No address provided'}</div>
            <div class="detail-row" style="margin-top: 10px;">
                <div class="detail-label">Delivery Notes:</div>
                <div class="detail-value">${order.deliveryNotes || 'No special instructions'}</div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="fas fa-shopping-basket"></i> Order Items</h3>
            <div class="items-list">
                ${itemsHTML}
                <div class="item-row" style="border-top: 2px solid #ddd; padding-top: 15px; font-weight: 600;">
                    <div class="item-name">Subtotal</div>
                    <div class="item-qty"></div>
                    <div class="item-price">₹${subtotal.toFixed(2)}</div>
                </div>
                <div class="item-row">
                    <div class="item-name">Delivery Charge</div>
                    <div class="item-qty"></div>
                    <div class="item-price">₹${deliveryCharge.toFixed(2)}</div>
                </div>
                <div class="item-row" style="border-top: 2px solid #ddd; padding-top: 15px; font-weight: 700; color: var(--primary-color);">
                    <div class="item-name">Total Amount</div>
                    <div class="item-qty"></div>
                    <div class="item-price">₹${total.toFixed(2)}</div>
                </div>
            </div>
        </div>
        
        <div class="detail-section">
            <h3><i class="fas fa-info-circle"></i> Order Information</h3>
            <div class="detail-row">
                <div class="detail-label">Order Number:</div>
                <div class="detail-value">${order.orderNumber || `#${order.id.toString().slice(-6)}`}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Order Date:</div>
                <div class="detail-value">${order.date || formatDate(order.timestamp || order.id)}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Payment Method:</div>
                <div class="detail-value">${order.paymentMethod || 'Cash on Delivery'}</div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Status:</div>
                <div class="detail-value">
                    <span class="order-status status-${order.status.toLowerCase().replace(/ /g, '-')}">
                        ${order.status}
                    </span>
                </div>
            </div>
            <div class="detail-row">
                <div class="detail-label">Sync Status:</div>
                <div class="detail-value">
                    ${syncStatus}
                </div>
            </div>
        </div>
    `;
    
    orderDetailsContent.innerHTML = detailsHTML;
    
    // Update quick action buttons
    updateQuickActions(order);
}

// Update action buttons based on order status
function updateActionButtons(status) {
    // Reset all buttons
    acceptOrderBtn.style.display = 'inline-flex';
    rejectOrderBtn.style.display = 'inline-flex';
    processOrderBtn.style.display = 'inline-flex';
    
    switch(status) {
        case 'Pending':
            acceptOrderBtn.innerHTML = '<i class="fas fa-check"></i> Accept Order';
            rejectOrderBtn.innerHTML = '<i class="fas fa-times"></i> Reject';
            processOrderBtn.innerHTML = '<i class="fas fa-cog"></i> Process';
            break;
            
        case 'Processing':
            acceptOrderBtn.style.display = 'none';
            rejectOrderBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
            processOrderBtn.innerHTML = '<i class="fas fa-truck"></i> Out for Delivery';
            break;
            
        case 'Out for Delivery':
            acceptOrderBtn.style.display = 'none';
            rejectOrderBtn.innerHTML = '<i class="fas fa-times"></i> Cancel';
            processOrderBtn.innerHTML = '<i class="fas fa-check-circle"></i> Mark Delivered';
            break;
            
        case 'Delivered':
            acceptOrderBtn.style.display = 'none';
            rejectOrderBtn.style.display = 'none';
            processOrderBtn.style.display = 'none';
            break;
            
        case 'Cancelled':
            acceptOrderBtn.style.display = 'none';
            rejectOrderBtn.style.display = 'none';
            processOrderBtn.style.display = 'none';
            break;
    }
}

// Update quick action buttons
function updateQuickActions(order) {
    // Enable/disable buttons based on status
    const isDeliveredOrCancelled = ['Delivered', 'Cancelled'].includes(order.status);
    
    markDeliveredBtn.disabled = isDeliveredOrCancelled;
    callCustomerBtn.disabled = false;
    printInvoiceBtn.disabled = false;
    viewOnMapBtn.disabled = !order.deliveryAddress;
    
    // Set phone number for call button
    if (order.customerPhone) {
        callCustomerBtn.dataset.phone = order.customerPhone;
    }
}

// Apply filters to orders
function applyFilters() {
    const status = statusFilter.value;
    const timeFilterValue = timeFilter.value;
    const searchText = searchOrders.value.toLowerCase();
    
    filteredOrders = allOrders.filter(order => {
        // Status filter
        if (status !== 'all' && order.status !== status) {
            return false;
        }
        
        // Time filter
        if (timeFilterValue !== 'all') {
            const orderDate = new Date(order.date || (order.timestamp || order.id));
            const now = new Date();
            
            switch(timeFilterValue) {
                case 'today':
                    if (orderDate.toDateString() !== now.toDateString()) return false;
                    break;
                case 'week':
                    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000);
                    if (orderDate < weekAgo) return false;
                    break;
                case 'month':
                    const monthAgo = new Date(now);
                    monthAgo.setMonth(monthAgo.getMonth() - 1);
                    if (orderDate < monthAgo) return false;
                    break;
            }
        }
        
        // Search filter
        if (searchText) {
            const searchableText = [
                order.customerName,
                order.customerPhone,
                order.customerEmail,
                order.deliveryAddress,
                order.orderNumber,
                order.id.toString()
            ].join(' ').toLowerCase();
            
            if (!searchableText.includes(searchText)) {
                return false;
            }
        }
        
        return true;
    });
    
    renderOrdersList();
}

// Update statistics
function updateStats() {
    // Total orders
    totalOrdersEl.textContent = allOrders.length;
    
    // Pending orders
    const pendingOrders = allOrders.filter(order => order.status === 'Pending');
    pendingOrdersEl.textContent = pendingOrders.length;
    
    // Total revenue
    const revenue = allOrders.reduce((sum, order) => sum + (parseFloat(order.total) || 0), 0);
    totalRevenueEl.textContent = '₹' + revenue.toFixed(2);
    
    // Unique customers (by phone number)
    const uniqueCustomers = new Set(allOrders.map(order => order.customerPhone).filter(Boolean));
    totalCustomersEl.textContent = uniqueCustomers.size;
    
    // Today's orders
    const today = new Date().toDateString();
    const todayOrders = allOrders.filter(order => {
        const orderDate = new Date(order.date || (order.timestamp || order.id));
        return orderDate.toDateString() === today;
    });
    ordersTodayEl.textContent = todayOrders.length;
}

// Function to update order status in both admin and user systems
function updateOrderStatusInBothSystems(orderId, newStatus) {
    const orderIndex = allOrders.findIndex(order => order.id === orderId);
    
    if (orderIndex === -1) {
        console.error('Order not found:', orderId);
        showAlert('Order not found', 'error');
        return false;
    }
    
    const order = allOrders[orderIndex];
    const oldStatus = order.status;
    const orderNumber = order.orderNumber || `#${order.id.toString().slice(-6)}`;
    
    // ================== UPDATE ADMIN ORDER ==================
    order.status = newStatus;
    order.updatedAt = Date.now();
    allOrders[orderIndex] = order;
    localStorage.setItem('asmartOrders', JSON.stringify(allOrders));
    
    // ================== UPDATE USER ORDER ==================
    // Find and update in userOrders
    let userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
    const userOrderIndex = userOrders.findIndex(o => 
        o.orderNumber === orderNumber || 
        (o.id && o.id === orderId)
    );
    
    if (userOrderIndex > -1) {
        userOrders[userOrderIndex].status = newStatus;
        userOrders[userOrderIndex].updatedAt = Date.now();
        localStorage.setItem('userOrders', JSON.stringify(userOrders));
    }
    
    // ================== UPDATE USER-SPECIFIC ORDERS ==================
    // Try to find user by phone number
    const userPhone = order.customerPhone;
    if (userPhone) {
        // Check all user keys
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith('user_') && key !== 'userOrders') {
                try {
                    let userData = JSON.parse(localStorage.getItem(key) || '[]');
                    if (Array.isArray(userData)) {
                        const userOrderIdx = userData.findIndex(o => 
                            o.orderNumber === orderNumber || 
                            (o.id && o.id === orderId) ||
                            o.customerPhone === userPhone
                        );
                        
                        if (userOrderIdx > -1) {
                            userData[userOrderIdx].status = newStatus;
                            userData[userOrderIdx].updatedAt = Date.now();
                            localStorage.setItem(key, JSON.stringify(userData));
                        }
                    }
                } catch (e) {
                    console.log('Error updating user data:', key, e);
                }
            }
        }
    }
    
    // ================== SYNC WITH USER HISTORY PAGE ==================
    syncWithUserHistory(order);
    
    // ================== NOTIFY USER (Simulated) ==================
    console.log(`Status updated for order ${orderNumber}: ${oldStatus} → ${newStatus}`);
    
    // Show success message
    showAlert(`Order ${orderNumber} status updated to ${newStatus} and synced with user`, 'success');
    
    // Add notification for admin
    addNotification('status_changed', order);
    addNotification('order_synced', order);
    
    // Update UI
    updateStats();
    applyFilters();
    
    if (selectedOrder && selectedOrder.id === orderId) {
        selectedOrder.status = newStatus;
        showOrderDetails(selectedOrder);
        updateActionButtons(newStatus);
    }
    
    return true;
}

// Sync order with user history
function syncWithUserHistory(order) {
    // This function ensures the order appears correctly in user's history
    const userKey = `history_${order.customerPhone || order.id}`;
    let userHistory = JSON.parse(localStorage.getItem(userKey) || '[]');
    
    // Check if order exists in user history
    const historyIndex = userHistory.findIndex(h => 
        h.orderNumber === order.orderNumber || h.id === order.id
    );
    
    const historyOrder = {
        id: order.id,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        customerEmail: order.customerEmail,
        deliveryAddress: order.deliveryAddress,
        deliveryNotes: order.deliveryNotes,
        items: order.items,
        total: order.total,
        paymentMethod: order.paymentMethod,
        status: order.status,
        date: order.date || formatDate(order.timestamp || order.id),
        updatedAt: order.updatedAt || Date.now(),
        market: localStorage.getItem('asmartStoreName') || 'AS Mart',
        marketAddress: localStorage.getItem('asmartStoreAddress') || '',
        marketPhone: localStorage.getItem('asmartStorePhone') || ''
    };
    
    if (historyIndex > -1) {
        // Update existing order
        userHistory[historyIndex] = historyOrder;
    } else {
        // Add new order
        userHistory.unshift(historyOrder);
    }
    
    // Keep only latest 50 orders
    if (userHistory.length > 50) {
        userHistory = userHistory.slice(0, 50);
    }
    
    localStorage.setItem(userKey, JSON.stringify(userHistory));
    
    // Also update the main user history
    updateMainUserHistory(historyOrder);
}

// Update main user history
function updateMainUserHistory(order) {
    let mainHistory = JSON.parse(localStorage.getItem('asmartUserHistory') || '[]');
    
    const existingIndex = mainHistory.findIndex(h => 
        h.orderNumber === order.orderNumber || h.id === order.id
    );
    
    if (existingIndex > -1) {
        mainHistory[existingIndex] = order;
    } else {
        mainHistory.unshift(order);
    }
    
    // Keep only latest 100 orders
    if (mainHistory.length > 100) {
        mainHistory = mainHistory.slice(0, 100);
    }
    
    localStorage.setItem('asmartUserHistory', JSON.stringify(mainHistory));
}

// Sync all orders with user history
function syncAllOrders() {
    const pendingSync = allOrders.filter(order => !isOrderSynced(order));
    
    if (pendingSync.length === 0) {
        showAlert('All orders are already synced', 'info');
        return;
    }
    
    showConfirmation('Sync All Orders', 
        `Sync ${pendingSync.length} orders with user history?`, 
        () => {
            let syncedCount = 0;
            pendingSync.forEach(order => {
                if (syncWithUserHistory(order)) {
                    syncedCount++;
                }
            });
            
            showAlert(`${syncedCount} orders synced with user history`, 'success');
            applyFilters();
        });
}

// Replace the old updateOrderStatus function
function updateOrderStatus(orderId, newStatus) {
    return updateOrderStatusInBothSystems(orderId, newStatus);
}

// Add this function to handle bulk status updates
function updateMultipleOrdersStatus(orderIds, newStatus) {
    orderIds.forEach(orderId => {
        updateOrderStatusInBothSystems(orderId, newStatus);
    });
    showAlert(`${orderIds.length} orders updated to ${newStatus}`, 'success');
}

// Show alert message
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlert = document.querySelector('.alert-message');
    if (existingAlert) {
        existingAlert.remove();
    }
    
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert-message alert-${type}`;
    alert.innerHTML = `
        <div class="alert-content">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        </div>
        <button class="alert-close">&times;</button>
    `;
    
    // Add styles
    alert.style.cssText = `
        position: fixed;
        top: 90px;
        right: 30px;
        background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : '#d1ecf1'};
        color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : '#0c5460'};
        padding: 15px 20px;
        border-radius: 10px;
        box-shadow: var(--shadow);
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 300px;
        max-width: 400px;
        z-index: 10000;
        animation: slideIn 0.3s ease;
        border-left: 4px solid ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
    `;
    
    // Add close button event
    alert.querySelector('.alert-close').addEventListener('click', () => {
        alert.remove();
    });
    
    // Add to body
    document.body.appendChild(alert);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => alert.remove(), 300);
        }
    }, 5000);
}

// Play notification sound
function playNotificationSound() {
    try {
        // Create a simple notification sound
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.frequency.value = 800;
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.log('Could not play notification sound:', error);
    }
}

// Show desktop notification
function showDesktopNotification(title) {
    if (!('Notification' in window)) return;
    
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: 'Click to view order details',
            icon: '/favicon.ico'
        });
    } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
    }
}

// Update time and date display
function updateTimeDate() {
    const now = new Date();
    
    // Update time
    const timeString = now.toLocaleTimeString('en-IN', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
    });
    
    document.getElementById('currentTime').textContent = timeString;
    
    // Update date
    const dateString = now.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    
    document.getElementById('currentDate').textContent = dateString;
}

// Start auto-refresh
function startAutoRefresh() {
    // Clear existing interval
    if (refreshInterval) {
        clearInterval(refreshInterval);
    }
    
    // Get interval from settings or default to 30 seconds
    const interval = parseInt(localStorage.getItem('asmartRefreshInterval') || '30000');
    
    if (interval > 0) {
        refreshInterval = setInterval(loadOrders, interval);
    }
}

// Export orders to CSV
function exportOrdersToCSV() {
    if (allOrders.length === 0) {
        showAlert('No orders to export', 'warning');
        return;
    }
    
    // Create CSV header
    let csv = 'Order ID,Order Number,Customer Name,Phone,Email,Address,Items,Total,Status,Date,Payment Method,Sync Status\n';
    
    // Add order data
    allOrders.forEach(order => {
        const itemsText = Array.isArray(order.items) 
            ? order.items.map(item => `${item.name} x${item.quantity}`).join('; ')
            : order.items;
        
        const address = (order.deliveryAddress || '').replace(/"/g, '""').replace(/\n/g, ', ');
        const syncStatus = isOrderSynced(order) ? 'Synced' : 'Not Synced';
        
        csv += `"${order.id}","${order.orderNumber || ''}","${order.customerName || ''}","${order.customerPhone || ''}","${order.customerEmail || ''}","${address}","${itemsText}","${order.total || '0'}","${order.status}","${order.date || ''}","${order.paymentMethod || ''}","${syncStatus}"\n`;
    });
    
    // Create download link
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = `asmart-orders-${new Date().toISOString().slice(0,10)}.csv`;
    link.click();
    
    // Cleanup
    URL.revokeObjectURL(url);
    
    showAlert('Orders exported successfully', 'success');
}

// Setup event listeners
function setupEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', loadOrders);
    
    // Logout button
    logoutBtn.addEventListener('click', function() {
        showConfirmation('Confirm Logout', 'Are you sure you want to logout?', () => {
            sessionStorage.removeItem('asmartAdminLoggedIn');
            sessionStorage.removeItem('asmartAdminLoginTime');
            window.location.href = 'admin-login.html';
        });
    });
    
    // Notifications button
    notificationsBtn.addEventListener('click', function() {
        notificationsPanel.classList.add('show');
        markAllNotificationsAsRead();
    });
    
    // Close notifications
    closeNotificationsBtn.addEventListener('click', function() {
        notificationsPanel.classList.remove('show');
    });
    
    // Filter changes
    statusFilter.addEventListener('change', applyFilters);
    timeFilter.addEventListener('change', applyFilters);
    searchOrders.addEventListener('input', applyFilters);
    
    // Order action buttons
    acceptOrderBtn.addEventListener('click', function() {
        if (!selectedOrder) return;
        
        if (selectedOrder.status === 'Pending') {
            showConfirmation('Accept Order', `Accept order ${selectedOrder.orderNumber}?`, () => {
                updateOrderStatus(selectedOrder.id, 'Processing');
            });
        }
    });
    
    rejectOrderBtn.addEventListener('click', function() {
        if (!selectedOrder) return;
        
        const action = selectedOrder.status === 'Pending' ? 'reject' : 'cancel';
        showConfirmation(`${action === 'reject' ? 'Reject' : 'Cancel'} Order`, 
            `${action === 'reject' ? 'Reject' : 'Cancel'} order ${selectedOrder.orderNumber}?`, () => {
                updateOrderStatus(selectedOrder.id, 'Cancelled');
            });
    });
    
    processOrderBtn.addEventListener('click', function() {
        if (!selectedOrder) return;
        
        let newStatus = '';
        let action = '';
        
        switch(selectedOrder.status) {
            case 'Pending':
                newStatus = 'Processing';
                action = 'Start processing';
                break;
            case 'Processing':
                newStatus = 'Out for Delivery';
                action = 'Mark as Out for Delivery';
                break;
            case 'Out for Delivery':
                newStatus = 'Delivered';
                action = 'Mark as Delivered';
                break;
        }
        
        if (newStatus) {
            showConfirmation(action, `${action} order ${selectedOrder.orderNumber}?`, () => {
                updateOrderStatus(selectedOrder.id, newStatus);
            });
        }
    });
    
    // Quick action buttons
    markDeliveredBtn.addEventListener('click', function() {
        if (!selectedOrder) return;
        
        showConfirmation('Mark as Delivered', `Mark order ${selectedOrder.orderNumber} as delivered?`, () => {
            updateOrderStatus(selectedOrder.id, 'Delivered');
        });
    });
    
    callCustomerBtn.addEventListener('click', function() {
        if (!selectedOrder || !selectedOrder.customerPhone) {
            showAlert('No phone number available', 'warning');
            return;
        }
        
        const phone = selectedOrder.customerPhone.replace(/\D/g, '');
        window.open(`tel:${phone}`, '_blank');
    });
    
    printInvoiceBtn.addEventListener('click', function() {
        if (!selectedOrder) return;
        
        // Open print window with invoice
        const printWindow = window.open('', '_blank');
        const invoiceHTML = generateInvoiceHTML(selectedOrder);
        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
    });
    
    viewOnMapBtn.addEventListener('click', function() {
        if (!selectedOrder || !selectedOrder.deliveryAddress) {
            showAlert('No address available', 'warning');
            return;
        }
        
        const address = encodeURIComponent(selectedOrder.deliveryAddress);
        window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    });
    
    // Bulk action buttons
    acceptAllPendingBtn.addEventListener('click', function() {
        const pendingOrders = allOrders.filter(order => order.status === 'Pending');
        
        if (pendingOrders.length === 0) {
            showAlert('No pending orders', 'info');
            return;
        }
        
        showConfirmation('Accept All Pending', `Accept all ${pendingOrders.length} pending orders?`, () => {
            const orderIds = pendingOrders.map(order => order.id);
            updateMultipleOrdersStatus(orderIds, 'Processing');
        });
    });
    
    markAllProcessingBtn.addEventListener('click', function() {
        const processingOrders = allOrders.filter(order => 
            ['Pending', 'Out for Delivery'].includes(order.status)
        );
        
        if (processingOrders.length === 0) {
            showAlert('No orders to process', 'info');
            return;
        }
        
        showConfirmation('Mark All as Processing', `Mark ${processingOrders.length} orders as processing?`, () => {
            const orderIds = processingOrders.map(order => order.id);
            updateMultipleOrdersStatus(orderIds, 'Processing');
        });
    });
    
    exportOrdersBtn.addEventListener('click', exportOrdersToCSV);
    
    clearOldOrdersBtn.addEventListener('click', function() {
        const oldOrders = allOrders.filter(order => {
            const orderDate = new Date(order.date || (order.timestamp || order.id));
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            return orderDate < thirtyDaysAgo;
        });
        
        if (oldOrders.length === 0) {
            showAlert('No orders older than 30 days', 'info');
            return;
        }
        
        showConfirmation('Clear Old Orders', 
            `Clear ${oldOrders.length} orders older than 30 days? This action cannot be undone.`, 
            () => {
                // Keep only recent orders
                allOrders = allOrders.filter(order => {
                    const orderDate = new Date(order.date || (order.timestamp || order.id));
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return orderDate >= thirtyDaysAgo;
                });
                
                localStorage.setItem('asmartOrders', JSON.stringify(allOrders));
                
                // Also clear from user orders
                let userOrders = JSON.parse(localStorage.getItem('userOrders') || '[]');
                userOrders = userOrders.filter(order => {
                    const orderDate = new Date(order.date || (order.timestamp || order.id));
                    const thirtyDaysAgo = new Date();
                    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                    return orderDate >= thirtyDaysAgo;
                });
                localStorage.setItem('userOrders', JSON.stringify(userOrders));
                
                // Reset selection
                selectedOrder = null;
                orderDetailsContent.style.display = 'none';
                orderActions.style.display = 'none';
                document.querySelector('.select-order-message').style.display = 'block';
                
                // Update UI
                updateStats();
                applyFilters();
                
                showAlert(`${oldOrders.length} old orders cleared from all systems`, 'success');
            });
    });
    
    // Add Sync button event listener (if you add a sync button)
    const syncBtn = document.getElementById('syncOrdersBtn');
    if (syncBtn) {
        syncBtn.addEventListener('click', syncAllOrders);
    }
    
    // Settings
    refreshIntervalSelect.addEventListener('change', function() {
        localStorage.setItem('asmartRefreshInterval', this.value);
        startAutoRefresh();
    });
    
    savePasswordBtn.addEventListener('click', function() {
        const currentPassword = currentPasswordInput.value;
        const newPassword = newPasswordInput.value;
        const confirmPassword = confirmPasswordInput.value;
        
        // Validate
        if (!currentPassword || !newPassword || !confirmPassword) {
            showAlert('Please fill in all password fields', 'error');
            return;
        }
        
        // Check current password
        const savedPassword = localStorage.getItem('asmartAdminPassword') || 'admin123';
        if (currentPassword !== savedPassword) {
            showAlert('Current password is incorrect', 'error');
            return;
        }
        
        // Check new password length
        if (newPassword.length < 4) {
            showAlert('New password must be at least 4 characters long', 'error');
            return;
        }
        
        // Check if passwords match
        if (newPassword !== confirmPassword) {
            showAlert('New passwords do not match', 'error');
            return;
        }
        
        // Save new password
        localStorage.setItem('asmartAdminPassword', newPassword);
        
        // Clear fields
        currentPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmPasswordInput.value = '';
        
        showAlert('Password changed successfully', 'success');
    });
    
    saveStoreInfoBtn.addEventListener('click', function() {
        const storeName = storeNameInput.value.trim();
        const storePhone = storePhoneInput.value.trim();
        const storeAddress = storeAddressInput.value.trim();
        
        if (!storeName) {
            showAlert('Store name is required', 'error');
            return;
        }
        
        localStorage.setItem('asmartStoreName', storeName);
        localStorage.setItem('asmartStorePhone', storePhone);
        localStorage.setItem('asmartStoreAddress', storeAddress);
        
        // Update header
        document.getElementById('storeNameHeader').textContent = `${storeName} Admin`;
        
        // Update all orders with new store info
        allOrders.forEach(order => {
            order.market = storeName;
            order.marketAddress = storeAddress;
            order.marketPhone = storePhone;
        });
        localStorage.setItem('asmartOrders', JSON.stringify(allOrders));
        
        showAlert('Store information saved and updated in all orders', 'success');
    });
    
    // Modal close buttons
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', function() {
            settingsModal.style.display = 'none';
            confirmationModal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === settingsModal) {
            settingsModal.style.display = 'none';
        }
        if (e.target === confirmationModal) {
            confirmationModal.style.display = 'none';
        }
    });
    
    // Cancel action button
    cancelActionBtn.addEventListener('click', function() {
        confirmationModal.style.display = 'none';
    });
    
    // Settings button (in nav)
    document.getElementById('settingsBtn')?.addEventListener('click', function() {
        settingsModal.style.display = 'flex';
        
        // Load current settings
        const refreshIntervalValue = localStorage.getItem('asmartRefreshInterval') || '30000';
        refreshIntervalSelect.value = refreshIntervalValue;
    });
}

// Show confirmation dialog
function showConfirmation(title, message, onConfirm) {
    confirmationTitle.textContent = title;
    confirmationMessage.textContent = message;
    confirmationModal.style.display = 'flex';
    
    // Set up confirm action
    confirmActionBtn.onclick = function() {
        confirmationModal.style.display = 'none';
        onConfirm();
    };
}

// Generate invoice HTML for printing
function generateInvoiceHTML(order) {
    const storeName = localStorage.getItem('asmartStoreName') || 'AS Mart';
    const storePhone = localStorage.getItem('asmartStorePhone') || '';
    const storeAddress = localStorage.getItem('asmartStoreAddress') || '';
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice ${order.orderNumber}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
                .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #000; padding-bottom: 20px; }
                .invoice-info { margin-bottom: 30px; }
                .section { margin-bottom: 25px; }
                table { width: 100%; border-collapse: collapse; margin-top: 10px; }
                th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
                th { background: #f5f5f5; font-weight: 600; }
                .total-row { font-weight: bold; background: #f8f9fa; }
                .footer { margin-top: 50px; text-align: center; font-size: 14px; color: #666; }
                @media print {
                    .no-print { display: none; }
                    body { padding: 0; }
                }
                .status-badge { 
                    padding: 5px 10px; 
                    border-radius: 4px; 
                    font-size: 12px; 
                    font-weight: 600; 
                    display: inline-block; 
                }
                .status-pending { background: #fff3cd; color: #856404; }
                .status-processing { background: #cce5ff; color: #004085; }
                .status-out-for-delivery { background: #d1ecf1; color: #0c5460; }
                .status-delivered { background: #d4edda; color: #155724; }
                .status-cancelled { background: #f8d7da; color: #721c24; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${storeName}</h1>
                <p>${storeAddress}</p>
                <p>Phone: ${storePhone}</p>
                <h2>INVOICE</h2>
            </div>
            
            <div class="invoice-info">
                <table>
                    <tr>
                        <td><strong>Invoice Number:</strong></td>
                        <td>${order.orderNumber || `#${order.id.toString().slice(-6)}`}</td>
                        <td><strong>Invoice Date:</strong></td>
                        <td>${order.date || formatDate(order.timestamp || order.id)}</td>
                    </tr>
                    <tr>
                        <td><strong>Status:</strong></td>
                        <td>
                            <span class="status-badge status-${order.status.toLowerCase().replace(/ /g, '-')}">
                                ${order.status}
                            </span>
                        </td>
                        <td><strong>Payment Method:</strong></td>
                        <td>${order.paymentMethod || 'Cash on Delivery'}</td>
                    </tr>
                </table>
            </div>
            
            <div class="section">
                <h3>Bill To:</h3>
                <p><strong>${order.customerName}</strong></p>
                <p>Phone: ${order.customerPhone || 'N/A'}</p>
                <p>Email: ${order.customerEmail || 'N/A'}</p>
                <p>Address: ${order.deliveryAddress ? order.deliveryAddress.replace(/\n/g, '<br>') : 'N/A'}</p>
            </div>
            
            <div class="section">
                <h3>Order Details</h3>
                <table>
                    <tr>
                        <th>Item</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                    </tr>
                    ${Array.isArray(order.items) ? order.items.map(item => `
                        <tr>
                            <td>${item.name || item.product}</td>
                            <td>${item.quantity || 1}</td>
                            <td>₹${parseFloat(item.price || 0).toFixed(2)}</td>
                            <td>₹${((item.quantity || 1) * parseFloat(item.price || 0)).toFixed(2)}</td>
                        </tr>
                    `).join('') : `
                        <tr>
                            <td>${order.items}</td>
                            <td>1</td>
                            <td>₹${parseFloat(order.total || 0).toFixed(2)}</td>
                            <td>₹${parseFloat(order.total || 0).toFixed(2)}</td>
                        </tr>
                    `}
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right;">Subtotal:</td>
                        <td>₹${parseFloat(order.total || 0).toFixed(2)}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right;">Delivery Charge:</td>
                        <td>₹${parseFloat(order.total || 0) > 500 ? '0.00' : '40.00'}</td>
                    </tr>
                    <tr class="total-row">
                        <td colspan="3" style="text-align: right;">Grand Total:</td>
                        <td>₹${(parseFloat(order.total || 0) + (parseFloat(order.total || 0) > 500 ? 0 : 40)).toFixed(2)}</td>
                    </tr>
                </table>
            </div>
            
            <div class="footer">
                <p>Thank you for your business!</p>
                <p>${storeName} - 20 Minute Delivery Guarantee</p>
                <p>For any queries, contact: ${storePhone}</p>
                <div class="no-print" style="margin-top: 30px;">
                    <button onclick="window.print()" style="padding: 10px 20px; background: #3498db; color: white; border: none; cursor: pointer;">Print Invoice</button>
                    <button onclick="window.close()" style="padding: 10px 20px; background: #666; color: white; border: none; cursor: pointer; margin-left: 10px;">Close</button>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Mark all notifications as read
function markAllNotificationsAsRead() {
    let hasUnread = false;
    
    notifications.forEach(notification => {
        if (!notification.read) {
            notification.read = true;
            hasUnread = true;
        }
    });
    
    if (hasUnread) {
        saveNotifications();
        updateNotificationBadge();
        renderNotifications();
    }
}

// Add CSS styles for sync status
const syncStyles = document.createElement('style');
syncStyles.textContent = `
    .synced { color: #28a745; }
    .not-synced { color: #ffc107; }
    .sync-status { display: inline-flex; align-items: center; gap: 5px; }
    .sync-status.synced { color: #28a745; }
    .sync-status.not-synced { color: #dc3545; }
    
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    .notification-item .notification-icon {
        margin-right: 10px;
        color: #3498db;
    }
    .notification-item.unread .notification-icon {
        color: #e74c3c;
    }
`;
document.head.appendChild(syncStyles);