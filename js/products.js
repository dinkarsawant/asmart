// Sample products data
const products = [
    {
        id: 1,
        name: "Fresh Milk",
        category: "groceries",
        price: 2.99,
        image: "https://images.unsplash.com/photo-1563636619-e9143da7973b?w=400",
        rating: 4.5,
        deliveryTime: "10-15 min"
    },
    {
        id: 2,
        name: "Whole Wheat Bread",
        category: "groceries",
        price: 3.49,
        image: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400",
        rating: 4.2,
        deliveryTime: "10-15 min"
    },
    {
        id: 3,
        name: "Fresh Apples",
        category: "groceries",
        price: 4.99,
        image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w-400",
        rating: 4.7,
        deliveryTime: "10-15 min"
    },
    {
        id: 4,
        name: "Pizza Margherita",
        category: "food",
        price: 12.99,
        image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
        rating: 4.8,
        deliveryTime: "15-20 min"
    },
    {
        id: 5,
        name: "Paracetamol 500mg",
        category: "pharmacy",
        price: 5.99,
        image: "https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400",
        rating: 4.3,
        deliveryTime: "10-15 min"
    },
    {
        id: 6,
        name: "Wireless Earbuds",
        category: "electronics",
        price: 49.99,
        image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400",
        rating: 4.6,
        deliveryTime: "15-20 min"
    },
    {
        id: 7,
        name: "Coffee Maker",
        category: "home",
        price: 29.99,
        image: "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400",
        rating: 4.4,
        deliveryTime: "15-20 min"
    },
    {
        id: 8,
        name: "Chicken Biryani",
        category: "food",
        price: 14.99,
        image: "https://images.unsplash.com/photo-1563379091339-03246963e9ca?w=400",
        rating: 4.9,
        deliveryTime: "15-20 min"
    }
];

// Load featured products
function loadFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;
    
    container.innerHTML = '';
    products.slice(0, 8).forEach(product => {
        const productHTML = `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-rating">
                        ${getStarRating(product.rating)}
                        <span style="color: #666; font-size: 0.9rem;"> (${product.rating})</span>
                    </div>
                    <div style="color: var(--accent); font-size: 0.9rem; margin-bottom: 1rem;">
                        <i class="fas fa-bolt"></i> ${product.deliveryTime}
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

// Load all products with optional category filter
function loadAllProducts(category = '') {
    const container = document.getElementById('productsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    let filteredProducts = products;
    if (category) {
        filteredProducts = products.filter(p => p.category === category);
    }
    
    filteredProducts.forEach(product => {
        const productHTML = `
            <div class="product-card">
                <img src="${product.image}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <div class="product-price">$${product.price.toFixed(2)}</div>
                    <div class="product-rating">
                        ${getStarRating(product.rating)}
                        <span style="color: #666; font-size: 0.9rem;"> (${product.rating})</span>
                    </div>
                    <div style="color: var(--accent); font-size: 0.9rem; margin-bottom: 1rem;">
                        <i class="fas fa-bolt"></i> ${product.deliveryTime}
                    </div>
                    <button class="add-to-cart" onclick="addToCart(${product.id})">
                        <i class="fas fa-cart-plus"></i> Add to Cart
                    </button>
                </div>
            </div>
        `;
        container.innerHTML += productHTML;
    });
}

function getStarRating(rating) {
    let stars = '';
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    
    for (let i = 0; i < fullStars; i++) {
        stars += '<i class="fas fa-star"></i>';
    }
    
    if (hasHalfStar) {
        stars += '<i class="fas fa-star-half-alt"></i>';
    }
    
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    for (let i = 0; i < emptyStars; i++) {
        stars += '<i class="far fa-star"></i>';
    }
    
    return stars;
}