// State Management
let cart = [];
let products = [];
let customers = [];
let selectedCategory = 'all';
let selectedPayment = '';
let searchTerm = '';
let currentView = 'billing'; // billing, admin, customers, reports

// DOM Elements
const menuGrid = document.getElementById('menuGrid');
const cartItems = document.getElementById('cartItems');
const subtotalEl = document.getElementById('subtotal');
const taxEl = document.getElementById('tax');
const totalEl = document.getElementById('total');
const searchInput = document.getElementById('searchInput');
const toast = document.getElementById('toast');

// Initialize App
async function init() {
    await loadProducts();
    setupEventListeners();
    renderMenu();
}

// Setup Event Listeners
function setupEventListeners() {
    // Navigation
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const view = e.currentTarget.dataset.view;
            switchView(view);
        });
    });

    // Category filter
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedCategory = btn.dataset.category;
            renderMenu();
        });
    });

    // Search
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchTerm = e.target.value.toLowerCase();
            renderMenu();
        });
    }

    // Payment method
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.payment-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedPayment = btn.dataset.method;
        });
    });

    // Clear cart
    document.getElementById('clearBtn')?.addEventListener('click', clearCart);

    // Checkout
    document.getElementById('checkoutBtn')?.addEventListener('click', checkout);

    // History modal
    document.getElementById('historyBtn')?.addEventListener('click', openHistory);
    document.getElementById('closeModal')?.addEventListener('click', closeHistory);
    document.getElementById('historyModal')?.addEventListener('click', (e) => {
        if (e.target.id === 'historyModal') closeHistory();
    });

    // Admin modals
    document.getElementById('closeAddProduct')?.addEventListener('click', closeAddProduct);
    document.getElementById('closeEditProduct')?.addEventListener('click', closeEditProduct);
}

// View Switching
function switchView(view) {
    currentView = view;
    
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-view="${view}"]`)?.classList.add('active');
    
    document.querySelectorAll('.view-content').forEach(content => {
        content.style.display = 'none';
    });
    
    const viewContent = document.getElementById(`${view}View`);
    if (viewContent) {
        viewContent.style.display = 'block';
    }
    
    switch(view) {
        case 'admin':
            renderAdminView();
            break;
        case 'customers':
            loadCustomers();
            break;
        case 'reports':
            loadDashboard();
            break;
    }
}

// Load Products
async function loadProducts() {
    try {
        const response = await fetch('api/get_products.php');
        const result = await response.json();
        
        if (result.success) {
            products = result.data;
            renderMenu();
        } else {
            showToast('Failed to load products: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error loading products:', error);
        showToast('Failed to load products', 'error');
    }
}

// Render Menu
function renderMenu() {
    if (!menuGrid) return;
    
    let filteredMenu = products;

    if (selectedCategory !== 'all') {
        filteredMenu = filteredMenu.filter(item => item.category === selectedCategory);
    }

    if (searchTerm) {
        filteredMenu = filteredMenu.filter(item => 
            item.name.toLowerCase().includes(searchTerm)
        );
    }

    menuGrid.innerHTML = '';

    if (filteredMenu.length === 0) {
        menuGrid.innerHTML = '<div class="empty-state"><p>No items found</p></div>';
        return;
    }

    filteredMenu.forEach(item => {
        const menuItem = document.createElement('div');
        menuItem.className = 'menu-item';
        if (item.stock === 0) {
            menuItem.classList.add('out-of-stock');
        }
        
        menuItem.innerHTML = `
            <span class="icon">${item.icon}</span>
            <h3>${item.name}</h3>
            <p class="price">₹${item.price.toFixed(2)}</p>
            <p class="stock-info ${item.stock < 10 ? 'low-stock' : ''}">${item.stock === 0 ? 'Out of Stock' : `Stock: ${item.stock}`}</p>
            <button class="add-btn" onclick="addToCart(${item.id})" ${item.stock === 0 ? 'disabled' : ''}>
                ${item.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </button>
        `;
        menuGrid.appendChild(menuItem);
    });
}

// Add to Cart
function addToCart(id) {
    const item = products.find(i => i.id === id);
    
    if (!item) {
        showToast('Product not found', 'error');
        return;
    }
    
    if (item.stock === 0) {
        showToast('Product is out of stock!', 'error');
        return;
    }
    
    const existingItem = cart.find(i => i.id === id);

    if (existingItem) {
        if (existingItem.quantity >= item.stock) {
            showToast('Cannot add more than available stock!', 'error');
            return;
        }
        existingItem.quantity++;
    } else {
        cart.push({ ...item, quantity: 1 });
    }

    renderCart();
    showToast(`${item.name} added to cart`, 'success');
}

// Render Cart
function renderCart() {
    if (!cartItems) return;
    
    if (cart.length === 0) {
        cartItems.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🛒</div>
                <p>Your cart is empty</p>
                <small>Add items from the menu</small>
            </div>
        `;
        updateTotals();
        return;
    }

    cartItems.innerHTML = '';
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <div class="cart-item-header">
                <div class="item-info">
                    <h4>${item.icon} ${item.name}</h4>
                    <p class="item-price">₹${item.price.toFixed(2)} each</p>
                </div>
                <button class="remove-btn" onclick="removeFromCart(${index})">🗑️</button>
            </div>
            <div class="cart-item-footer">
                <div class="quantity-controls">
                    <button class="qty-btn" onclick="updateQuantity(${index}, -1)">−</button>
                    <span class="qty-display">${item.quantity}</span>
                    <button class="qty-btn" onclick="updateQuantity(${index}, 1)" ${item.quantity >= item.stock ? 'disabled' : ''}>+</button>
                </div>
                <span class="item-total">₹${(item.price * item.quantity).toFixed(2)}</span>
            </div>
        `;
        cartItems.appendChild(cartItem);
    });

    updateTotals();
}

// Update Quantity
function updateQuantity(index, change) {
    const item = cart[index];
    const product = products.find(p => p.id === item.id);
    
    if (change > 0 && item.quantity >= product.stock) {
        showToast('Cannot exceed available stock!', 'error');
        return;
    }
    
    cart[index].quantity += change;
    
    if (cart[index].quantity <= 0) {
        cart.splice(index, 1);
    }
    
    renderCart();
}

// Remove from Cart
function removeFromCart(index) {
    const itemName = cart[index].name;
    cart.splice(index, 1);
    renderCart();
    showToast(`${itemName} removed from cart`, 'success');
}

// Clear Cart
function clearCart() {
    if (cart.length === 0) return;
    if (confirm('Clear all items from cart?')) {
        cart = [];
        renderCart();
        showToast('Cart cleared', 'success');
    }
}

// Update Totals
function updateTotals() {
    const subtotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const total = subtotal + tax;

    if (subtotalEl) subtotalEl.textContent = `₹${subtotal.toFixed(2)}`;
    if (taxEl) taxEl.textContent = `₹${tax.toFixed(2)}`;
    if (totalEl) totalEl.textContent = `₹${total.toFixed(2)}`;
}

// Checkout
async function checkout() {
    const customerName = document.getElementById('customerName').value.trim();
    const customerPhone = document.getElementById('customerPhone').value.trim();
    const customerEmail = document.getElementById('customerEmail')?.value.trim();

    if (!customerName) {
        showToast('Please enter customer name', 'error');
        return;
    }
    if (!customerPhone) {
        showToast('Please enter phone number', 'error');
        return;
    }
    if (cart.length === 0) {
        showToast('Cart is empty', 'error');
        return;
    }
    if (!selectedPayment) {
        showToast('Please select payment method', 'error');
        return;
    }

    const subtotal = parseFloat(subtotalEl.textContent.replace('₹', ''));
    const tax = parseFloat(taxEl.textContent.replace('₹', ''));
    const total = parseFloat(totalEl.textContent.replace('₹', ''));

    const invoiceData = {
        customer_name: customerName,
        customer_phone: customerPhone,
        email: customerEmail || null,
        payment_method: selectedPayment,
        items: cart,
        subtotal: subtotal,
        tax: tax,
        total: total
    };

    try {
        const response = await fetch('api/save_invoice.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(invoiceData)
        });

        const result = await response.json();

        if (result.success) {
            showToast('Invoice generated successfully!', 'success');
            printInvoice({ ...invoiceData, invoice_number: result.invoice_number });
            resetForm();
            await loadProducts(); // Refresh products to update stock
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to save invoice', 'error');
    }
}

// Print Invoice
function printInvoice(data) {
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Invoice - ${data.invoice_number}</title>
            <style>
                body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { margin: 0; color: #d4a574; }
                .info { margin: 20px 0; }
                table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
                th { background: #f5f5f5; }
                .totals { text-align: right; margin-top: 20px; }
                .totals div { margin: 5px 0; }
                .grand-total { font-size: 1.3em; font-weight: bold; margin-top: 10px; }
                .footer { text-align: center; margin-top: 40px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>☕ Pondy Café</h1>
                <p>Fresh Brews • Cozy Vibes • Pondicherry Style</p>
            </div>
            <hr>
            <div class="info">
                <p><strong>Invoice Number:</strong> ${data.invoice_number}</p>
                <p><strong>Customer:</strong> ${data.customer_name}</p>
                <p><strong>Phone:</strong> ${data.customer_phone}</p>
                <p><strong>Payment:</strong> ${data.payment_method}</p>
                <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th>Category</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.items.map(item => `
                        <tr>
                            <td>${item.icon} ${item.name}</td>
                            <td>${item.category}</td>
                            <td>${item.quantity}</td>
                            <td>₹${item.price.toFixed(2)}</td>
                            <td>₹${(item.price * item.quantity).toFixed(2)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            <div class="totals">
                <div>Subtotal: ₹${data.subtotal.toFixed(2)}</div>
                <div>Tax (8%): ₹${data.tax.toFixed(2)}</div>
                <div class="grand-total">Total: ₹${data.total.toFixed(2)}</div>
            </div>
            <div class="footer">
                <p>Thank you for visiting Pondy Café!</p>
                <p>Have a great day! </p>
            </div>
            <script>window.onload = function() { window.print(); }</script>
        </body>
        </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
}

// Reset Form
function resetForm() {
    cart = [];
    selectedPayment = '';
    document.getElementById('customerName').value = '';
    document.getElementById('customerPhone').value = '';
    if (document.getElementById('customerEmail')) {
        document.getElementById('customerEmail').value = '';
    }
    document.querySelectorAll('.payment-btn').forEach(btn => btn.classList.remove('active'));
    renderCart();
}

// Admin View
async function renderAdminView() {
    const adminContent = document.getElementById('adminContent');
    if (!adminContent) return;
    
    const lowStockProducts = products.filter(p => p.stock < p.minStock);
    const outOfStockProducts = products.filter(p => p.stock === 0);
    
    let html = '<div class="admin-section">';
    
    if (outOfStockProducts.length > 0 || lowStockProducts.length > 0) {
        html += '<div class="alert-section">';
        if (outOfStockProducts.length > 0) {
            html += `<div class="alert alert-danger">
                <h3>Out of Stock Alert</h3>
                <p>${outOfStockProducts.length} products are out of stock</p>
            </div>`;
        }
        if (lowStockProducts.length > 0) {
            html += `<div class="alert alert-warning">
                <h3>Low Stock Alert</h3>
                <p>${lowStockProducts.length} products have low stock</p>
            </div>`;
        }
        html += '</div>';
    }
    
    html += `
        <div class="admin-header">
            <h2>Product Management</h2>
            <button class="btn btn-primary" onclick="openAddProduct()">+ Add New Product</button>
        </div>
        <div class="table-responsive">
            <table class="admin-table">
                <thead>
                    <tr>
                        <th>Product</th>
                        <th>Category</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Min Stock</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    products.forEach(product => {
        const stockClass = product.stock === 0 ? 'out-of-stock' : (product.stock < product.minStock ? 'low-stock' : '');
        html += `
            <tr class="${stockClass}">
                <td>
                    <div class="product-cell">
                        <span class="product-icon">${product.icon}</span>
                        <span>${product.name}</span>
                    </div>
                </td>
                <td>${product.category}</td>
                <td>₹${product.price.toFixed(2)}</td>
                <td><span class="stock-badge ${stockClass}">${product.stock}</span></td>
                <td>${product.minStock}</td>
                <td><span class="status-badge ${product.isActive ? 'active' : 'inactive'}">${product.isActive ? 'Active' : 'Inactive'}</span></td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-icon" onclick="adjustStock(${product.id}, -1)" title="Decrease Stock">−</button>
                        <button class="btn-icon" onclick="adjustStock(${product.id}, 1)" title="Increase Stock">+</button>
                        <button class="btn-icon btn-edit" onclick="openEditProduct(${product.id})" title="Edit">✏️</button>
                        <button class="btn-icon btn-delete" onclick="deleteProduct(${product.id})" title="Delete">🗑️</button>
                    </div>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div></div>';
    adminContent.innerHTML = html;
}

// Adjust Stock
async function adjustStock(productId, change) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    const newStock = Math.max(0, product.stock + change);
    
    try {
        const response = await fetch('api/update_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productId, stock: newStock })
        });
        
        const result = await response.json();
        
        if (result.success) {
            await loadProducts();
            renderAdminView();
            showToast('Stock updated successfully', 'success');
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update stock', 'error');
    }
}

// Open Add Product Modal
function openAddProduct() {
    document.getElementById('addProductModal').classList.add('show');
}

// Close Add Product Modal
function closeAddProduct() {
    document.getElementById('addProductModal').classList.remove('show');
    document.getElementById('addProductForm').reset();
}

// Save New Product
async function saveNewProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        name: formData.get('productName'),
        category: formData.get('productCategory'),
        price: parseFloat(formData.get('productPrice')),
        stock: parseInt(formData.get('productStock')),
        minStock: parseInt(formData.get('productMinStock'))
    };
    
    try {
        const response = await fetch('api/add_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Product added successfully', 'success');
            closeAddProduct();
            await loadProducts();
            renderAdminView();
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to add product', 'error');
    }
}

// Open Edit Product Modal
function openEditProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    
    document.getElementById('editProductId').value = product.id;
    document.getElementById('editProductName').value = product.name;
    document.getElementById('editProductCategory').value = product.category;
    document.getElementById('editProductPrice').value = product.price;
    document.getElementById('editProductStock').value = product.stock;
    document.getElementById('editProductMinStock').value = product.minStock;
    
    document.getElementById('editProductModal').classList.add('show');
}

// Close Edit Product Modal
function closeEditProduct() {
    document.getElementById('editProductModal').classList.remove('show');
}

// Update Product
async function updateProduct(e) {
    e.preventDefault();
    
    const formData = new FormData(e.target);
    const data = {
        id: parseInt(formData.get('productId')),
        name: formData.get('productName'),
        category: formData.get('productCategory'),
        price: parseFloat(formData.get('productPrice')),
        stock: parseInt(formData.get('productStock')),
        minStock: parseInt(formData.get('productMinStock'))
    };
    
    try {
        const response = await fetch('api/update_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Product updated successfully', 'success');
            closeEditProduct();
            await loadProducts();
            renderAdminView();
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to update product', 'error');
    }
}

// Delete Product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
        const response = await fetch('api/delete_product.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: productId })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Product deleted successfully', 'success');
            await loadProducts();
            renderAdminView();
        } else {
            showToast('Error: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to delete product', 'error');
    }
}

// Load Customers
async function loadCustomers() {
    try {
        const response = await fetch('api/get_customers.php');
        const result = await response.json();
        
        if (result.success) {
            customers = result.data;
            renderCustomersView();
        } else {
            showToast('Failed to load customers: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load customers', 'error');
    }
}

// Render Customers View
function renderCustomersView() {
    const customersContent = document.getElementById('customersContent');
    if (!customersContent) return;
    
    let html = `
        <div class="customers-section">
            <h2>Customer Management</h2>
            <div class="table-responsive">
                <table class="admin-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Total Purchases</th>
                            <th>Total Spent</th>
                            <th>Last Visit</th>
                        </tr>
                    </thead>
                    <tbody>
    `;
    
    customers.forEach(customer => {
        html += `
            <tr>
                <td>${customer.name}</td>
                <td>${customer.phone}</td>
                <td>${customer.email || '-'}</td>
                <td>${customer.totalPurchases}</td>
                <td>₹${customer.totalSpent.toFixed(2)}</td>
                <td>${customer.lastVisit ? new Date(customer.lastVisit).toLocaleString() : '-'}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table></div></div>';
    customersContent.innerHTML = html;
}

// Load Dashboard
async function loadDashboard() {
    try {
        const response = await fetch('api/get_dashboard.php');
        const result = await response.json();
        
        if (result.success) {
            renderDashboard(result.data);
        } else {
            showToast('Failed to load dashboard: ' + result.message, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load dashboard', 'error');
    }
}

// Render Dashboard
function renderDashboard(data) {
    const reportsContent = document.getElementById('reportsContent');
    if (!reportsContent) return;
    
    let html = `
        <div class="dashboard">
            <h2>Dashboard & Reports</h2>
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Revenue</h3>
                    <p class="stat-value">₹${data.totalRevenue.toFixed(2)}</p>
                </div>
                <div class="stat-card">
                    <h3>Today's Revenue</h3>
                    <p class="stat-value">₹${data.todayRevenue.toFixed(2)}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Invoices</h3>
                    <p class="stat-value">${data.totalInvoices}</p>
                </div>
                <div class="stat-card">
                    <h3>Today's Invoices</h3>
                    <p class="stat-value">${data.todayInvoices}</p>
                </div>
                <div class="stat-card">
                    <h3>Total Customers</h3>
                    <p class="stat-value">${data.totalCustomers}</p>
                </div>
                <div class="stat-card ${data.lowStock > 0 ? 'alert-warning' : ''}">
                    <h3>Low Stock Items</h3>
                    <p class="stat-value">${data.lowStock}</p>
                </div>
                <div class="stat-card ${data.outOfStock > 0 ? 'alert-danger' : ''}">
                    <h3>Out of Stock</h3>
                    <p class="stat-value">${data.outOfStock}</p>
                </div>
            </div>
            
            <div class="dashboard-row">
                <div class="dashboard-col">
                    <h3>Top Selling Products</h3>
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Product</th>
                                    <th>Category</th>
                                    <th>Sold</th>
                                    <th>Revenue</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.topProducts.map(p => `
                                    <tr>
                                        <td>${p.icon} ${p.name}</td>
                                        <td>${p.category}</td>
                                        <td>${p.totalSold}</td>
                                        <td>₹${p.revenue.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
                
                <div class="dashboard-col">
                    <h3>Recent Customers</h3>
                    <div class="table-responsive">
                        <table class="admin-table">
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Phone</th>
                                    <th>Purchases</th>
                                    <th>Spent</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${data.recentCustomers.map(c => `
                                    <tr>
                                        <td>${c.name}</td>
                                        <td>${c.phone}</td>
                                        <td>${c.purchases}</td>
                                        <td>₹${c.spent.toFixed(2)}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    reportsContent.innerHTML = html;
}

// Open/Close History Modal
async function openHistory() {
    document.getElementById('historyModal').classList.add('show');
    await loadHistory();
}

function closeHistory() {
    document.getElementById('historyModal').classList.remove('show');
}

// Load History
async function loadHistory() {
    const historyList = document.getElementById('historyList');
    historyList.innerHTML = '<div class="loading">Loading invoices...</div>';

    try {
        const response = await fetch('api/get_invoices.php');
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            historyList.innerHTML = '';
            result.data.forEach(invoice => {
                const item = document.createElement('div');
                item.className = 'history-item';
                item.innerHTML = `
                    <div class="history-header">
                        <strong>${invoice.invoice_number}</strong>
                        <span>${new Date(invoice.created_at).toLocaleString()}</span>
                    </div>
                    <div class="history-details">
                        <p>${invoice.customer_name} | ${invoice.customer_phone}</p>
                        <p>${invoice.payment_method} | ₹${invoice.total_amount.toFixed(2)}</p>
                    </div>
                    <button class="view-btn" onclick="viewInvoice('${invoice.invoice_number}')">View Invoice</button>
                `;
                historyList.appendChild(item);
            });
        } else {
            historyList.innerHTML = '<div class="empty-state"><p>No invoices found</p></div>';
        }
    } catch (error) {
        console.error('Error:', error);
        historyList.innerHTML = '<div class="empty-state"><p>Failed to load invoices</p></div>';
    }
}

// View Invoice
async function viewInvoice(invoiceNumber) {
    try {
        const response = await fetch(`api/get_invoice.php?invoice_number=${invoiceNumber}`);
        const result = await response.json();

        if (result.success) {
            printInvoice(result.data);
        } else {
            showToast('Failed to load invoice', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Failed to load invoice', 'error');
    }
}

// Show Toast
function showToast(message, type = 'success') {
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast ${type} show`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', init);