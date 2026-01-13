// auth.js - Authentication System for AS Mart

// User roles
const USER_ROLES = {
    CUSTOMER: 'customer',
    HOST: 'host',
    ADMIN: 'admin'
};

// Sample users (in real app, this would be in a database)
const SAMPLE_USERS = {
    // Customers
    'user@example.com': {
        email: 'user@example.com',
        password: 'user123',
        name: 'John Doe',
        phone: '+1 234 567 8900',
        role: USER_ROLES.CUSTOMER,
        address: '123 Main St, New York',
        avatar: 'U'
    },
    'customer@asmart.com': {
        email: 'customer@asmart.com',
        password: 'customer123',
        name: 'Sarah Johnson',
        phone: '+1 345 678 9012',
        role: USER_ROLES.CUSTOMER,
        address: '456 Oak Ave, Chicago',
        avatar: 'S'
    },
    
    // Hosts (Shop/Market Owners)
    'shop@freshmart.com': {
        email: 'shop@freshmart.com',
        password: 'host123',
        name: 'FreshMart Supermarket',
        phone: '(555) 123-4567',
        role: USER_ROLES.HOST,
        address: '123 Main Street, Downtown, NY 10001',
        avatar: 'F',
        shopName: 'FreshMart Supermarket',
        shopAddress: '123 Main Street, Downtown, NY 10001',
        shopPhone: '(555) 123-4567',
        shopType: 'Supermarket',
        shopRating: 4.5
    },
    'market@quickstop.com': {
        email: 'market@quickstop.com',
        password: 'host123',
        name: 'QuickStop Grocers',
        phone: '(555) 234-5678',
        role: USER_ROLES.HOST,
        address: '456 Oak Avenue, Midtown, NY 10002',
        avatar: 'Q',
        shopName: 'QuickStop Grocers',
        shopAddress: '456 Oak Avenue, Midtown, NY 10002',
        shopPhone: '(555) 234-5678',
        shopType: 'Grocery Store',
        shopRating: 4.2
    },
    
    // Admin
    'admin@asmart.com': {
        email: 'admin@asmart.com',
        password: 'admin123',
        name: 'AS Mart Admin',
        phone: '+1 800 123 4567',
        role: USER_ROLES.ADMIN,
        address: 'AS Mart Headquarters',
        avatar: 'A'
    }
};

// Local Storage Keys
const STORAGE_KEYS = {
    CURRENT_USER: 'currentUser',
    USERS: 'asmart_users',
    ORDERS: 'orders'
};

// Initialize storage
function initializeStorage() {
    if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
        localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(SAMPLE_USERS));
    }
    
    if (!localStorage.getItem(STORAGE_KEYS.ORDERS)) {
        localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify([]));
    }
}

// Get all users from storage
function getUsers() {
    const users = localStorage.getItem(STORAGE_KEYS.USERS);
    return users ? JSON.parse(users) : {};
}

// Save users to storage
function saveUsers(users) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
}

// Get current user
function getCurrentUser() {
    const user = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    return user ? JSON.parse(user) : null;
}

// Set current user
function setCurrentUser(user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
}

// Clear current user (logout)
function clearCurrentUser() {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
}

// Register new user
function registerUser(userData) {
    const users = getUsers();
    
    // Check if user already exists
    if (users[userData.email]) {
        return { success: false, message: 'User with this email already exists' };
    }
    
    // Add new user
    users[userData.email] = {
        ...userData,
        avatar: userData.name.charAt(0).toUpperCase()
    };
    
    saveUsers(users);
    return { success: true, message: 'Registration successful' };
}

// Login user
function loginUser(email, password) {
    const users = getUsers();
    const user = users[email];
    
    if (!user) {
        return { success: false, message: 'User not found' };
    }
    
    if (user.password !== password) {
        return { success: false, message: 'Invalid password' };
    }
    
    // Remove password from user object before storing
    const { password: _, ...userWithoutPassword } = user;
    setCurrentUser(userWithoutPassword);
    
    return { 
        success: true, 
        message: 'Login successful',
        user: userWithoutPassword 
    };
}

// Logout user
function logoutUser() {
    clearCurrentUser();
    return { success: true, message: 'Logged out successfully' };
}

// Check if user is authenticated
function isAuthenticated() {
    return getCurrentUser() !== null;
}

// Check user role
function checkUserRole(requiredRole) {
    const user = getCurrentUser();
    if (!user) return false;
    
    if (requiredRole === USER_ROLES.ADMIN) {
        return user.role === USER_ROLES.ADMIN;
    } else if (requiredRole === USER_ROLES.HOST) {
        return user.role === USER_ROLES.HOST || user.role === USER_ROLES.ADMIN;
    } else if (requiredRole === USER_ROLES.CUSTOMER) {
        return user.role === USER_ROLES.CUSTOMER || user.role === USER_ROLES.HOST || user.role === USER_ROLES.ADMIN;
    }
    return false;
}

// Get user type
function getUserType() {
    const user = getCurrentUser();
    return user ? user.role : null;
}

// Update user profile
function updateUserProfile(userData) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'User not logged in' };
    
    const users = getUsers();
    if (!users[user.email]) return { success: false, message: 'User not found' };
    
    // Update user data
    users[user.email] = {
        ...users[user.email],
        ...userData,
        avatar: userData.name ? userData.name.charAt(0).toUpperCase() : users[user.email].avatar
    };
    
    saveUsers(users);
    
    // Update current user session
    const updatedUser = { ...user, ...userData };
    setCurrentUser(updatedUser);
    
    return { success: true, message: 'Profile updated successfully', user: updatedUser };
}

// Get all orders
function getAllOrders() {
    const orders = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return orders ? JSON.parse(orders) : [];
}

// Save orders
function saveOrders(orders) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
}

// Get orders for current user
function getUserOrders() {
    const user = getCurrentUser();
    if (!user) return [];
    
    const orders = getAllOrders();
    
    if (user.role === USER_ROLES.CUSTOMER) {
        return orders.filter(order => order.userEmail === user.email);
    } else if (user.role === USER_ROLES.HOST) {
        // Host sees orders from their shop
        return orders.filter(order => order.localMarket === user.shopName);
    } else if (user.role === USER_ROLES.ADMIN) {
        // Admin sees all orders
        return orders;
    }
    
    return [];
}

// Add new order
function addOrder(orderData) {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'User not logged in' };
    
    const orders = getAllOrders();
    
    // Add user info to order
    const orderWithUser = {
        ...orderData,
        userEmail: user.email,
        userId: user.email,
        userName: user.name,
        userPhone: user.phone,
        timestamp: new Date().toISOString()
    };
    
    orders.unshift(orderWithUser);
    saveOrders(orders);
    
    return { success: true, message: 'Order placed successfully', order: orderWithUser };
}

// Update order status (for hosts/admin)
function updateOrderStatus(orderId, status, notes = '') {
    const user = getCurrentUser();
    if (!user) return { success: false, message: 'User not logged in' };
    
    // Only hosts and admin can update order status
    if (user.role !== USER_ROLES.HOST && user.role !== USER_ROLES.ADMIN) {
        return { success: false, message: 'Unauthorized' };
    }
    
    const orders = getAllOrders();
    const orderIndex = orders.findIndex(order => order.orderId === orderId);
    
    if (orderIndex === -1) {
        return { success: false, message: 'Order not found' };
    }
    
    // If host, check if order belongs to their shop
    if (user.role === USER_ROLES.HOST && orders[orderIndex].localMarket !== user.shopName) {
        return { success: false, message: 'Unauthorized to update this order' };
    }
    
    // Update order
    orders[orderIndex].status = status;
    orders[orderIndex].currentStatus = status;
    orders[orderIndex].updatedAt = new Date().toISOString();
    orders[orderIndex].updatedBy = user.email;
    
    if (notes) {
        orders[orderIndex].notes = notes;
    }
    
    saveOrders(orders);
    return { success: true, message: 'Order status updated', order: orders[orderIndex] };
}

// Initialize on page load
if (typeof window !== 'undefined') {
    initializeStorage();
}