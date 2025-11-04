-- Create Database
CREATE DATABASE IF NOT EXISTS pondy_cafe;

USE pondy_cafe;

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    customer_id INT AUTO_INCREMENT PRIMARY KEY,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(100),
    total_purchases INT DEFAULT 0,
    total_spent DECIMAL(10, 2) DEFAULT 0.00,
    last_visit TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_phone (customer_phone),
    INDEX idx_name (customer_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    product_id INT AUTO_INCREMENT PRIMARY KEY,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    stock_quantity INT NOT NULL DEFAULT 0,
    min_stock_level INT DEFAULT 10,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_category (category),
    INDEX idx_active (is_active),
    INDEX idx_stock (stock_quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoices Table
CREATE TABLE IF NOT EXISTS invoices (
    invoice_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id INT NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    payment_method ENUM('Cash', 'Card', 'UPI') NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    tax_amount DECIMAL(10, 2) NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(customer_id) ON DELETE CASCADE,
    INDEX idx_invoice_number (invoice_number),
    INDEX idx_customer_id (customer_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Invoice Items Table
CREATE TABLE IF NOT EXISTS invoice_items (
    item_id INT AUTO_INCREMENT PRIMARY KEY,
    invoice_id INT NOT NULL,
    product_id INT NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,
    total_price DECIMAL(10, 2) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(invoice_id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_invoice_id (invoice_id),
    INDEX idx_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Stock History Table
CREATE TABLE IF NOT EXISTS stock_history (
    history_id INT AUTO_INCREMENT PRIMARY KEY,
    product_id INT NOT NULL,
    quantity_change INT NOT NULL,
    change_type ENUM('PURCHASE', 'SALE', 'ADJUSTMENT', 'INITIAL') NOT NULL,
    reference_id INT NULL,
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products(product_id) ON DELETE CASCADE,
    INDEX idx_product_id (product_id),
    INDEX idx_created_at (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Products
INSERT INTO products (product_name, category, price, stock_quantity) VALUES
-- Coffee
('Espresso', 'Coffee', 90.00, 50),
('Cappuccino', 'Coffee', 120.00, 45),
('Cafe Latte', 'Coffee', 130.00, 40),
('Mocha', 'Coffee', 140.00, 35),
('Americano', 'Coffee', 110.00, 50),
('Cold Brew', 'Coffee', 150.00, 30),
('Macchiato', 'Coffee', 135.00, 38),
('Caramel Latte', 'Coffee', 145.00, 32),
('Hazelnut Coffee', 'Coffee', 150.00, 28),
('Affogato', 'Coffee', 160.00, 25),

-- Tea
('Masala Chai', 'Tea', 60.00, 60),
('Ginger Tea', 'Tea', 65.00, 55),
('Green Tea', 'Tea', 70.00, 50),
('Lemon Tea', 'Tea', 75.00, 45),
('Black Tea', 'Tea', 65.00, 50),
('Herbal Tea', 'Tea', 80.00, 35),
('Tulsi Tea', 'Tea', 70.00, 40),
('Iced Tea', 'Tea', 90.00, 38),
('Peach Tea', 'Tea', 95.00, 30),
('Rose Tea', 'Tea', 100.00, 28),

-- Pastries
('Chocolate Croissant', 'Pastries', 110.00, 25),
('Blueberry Muffin', 'Pastries', 100.00, 30),
('Cheese Cake', 'Pastries', 160.00, 20),
('Brownie', 'Pastries', 90.00, 35),
('Red Velvet Cake', 'Pastries', 180.00, 18),
('Banana Bread', 'Pastries', 95.00, 28),
('Apple Pie', 'Pastries', 120.00, 22),
('Cup Cake', 'Pastries', 85.00, 40),
('Donut', 'Pastries', 90.00, 45),
('Tart', 'Pastries', 100.00, 25),

-- Beverages
('Cold Coffee', 'Beverages', 130.00, 40),
('Hot Chocolate', 'Beverages', 140.00, 35),
('Mango Smoothie', 'Beverages', 120.00, 30),
('Strawberry Shake', 'Beverages', 130.00, 28),
('Vanilla Milkshake', 'Beverages', 110.00, 35),
('Oreo Shake', 'Beverages', 140.00, 25),
('Lemon Soda', 'Beverages', 80.00, 50),
('Watermelon Juice', 'Beverages', 90.00, 40),
('Cold Chocolate', 'Beverages', 150.00, 28),
('Iced Mocha', 'Beverages', 150.00, 26),

-- Snacks
('French Fries', 'Snacks', 90.00, 50),
('Grilled Sandwich', 'Snacks', 120.00, 40),
('Veg Puff', 'Snacks', 60.00, 60),
('Paneer Roll', 'Snacks', 130.00, 35),
('Garlic Bread', 'Snacks', 100.00, 38),
('Cheese Balls', 'Snacks', 110.00, 32),
('Veg Cutlet', 'Snacks', 90.00, 40),
('Nachos with Dip', 'Snacks', 130.00, 28),
('Corn Chaat', 'Snacks', 85.00, 45),
('Paneer Pakoda', 'Snacks', 140.00, 30),

-- Sandwiches
('Club Sandwich', 'Sandwiches', 140.00, 30),
('Veg Cheese Sandwich', 'Sandwiches', 100.00, 35),
('Paneer Tikka Sandwich', 'Sandwiches', 130.00, 28),
('Bombay Sandwich', 'Sandwiches', 90.00, 40),
('Cheese Chilli Toast', 'Sandwiches', 110.00, 32),
('Corn & Cheese Sandwich', 'Sandwiches', 120.00, 30),
('Grilled Paneer Sandwich', 'Sandwiches', 125.00, 28),
('Veggie Delight Sandwich', 'Sandwiches', 115.00, 30),

-- Salads
('Caesar Salad', 'Salads', 150.00, 25),
('Greek Salad', 'Salads', 140.00, 28),
('Fresh Garden Salad', 'Salads', 120.00, 30),
('Quinoa Salad', 'Salads', 160.00, 22),
('Pasta Salad', 'Salads', 130.00, 25),
('Fruit Salad', 'Salads', 110.00, 35),

-- Breakfast
('Masala Dosa', 'Breakfast', 100.00, 40),
('Idli Sambar', 'Breakfast', 80.00, 50),
('Vada Sambar', 'Breakfast', 85.00, 45),
('Poha', 'Breakfast', 70.00, 50),
('Upma', 'Breakfast', 75.00, 48),
('Aloo Paratha', 'Breakfast', 90.00, 40),
('Bread Omelette', 'Breakfast', 95.00, 38),
('Uttapam', 'Breakfast', 110.00, 35);

-- Insert Sample Customers
INSERT INTO customers (customer_name, customer_phone, email) VALUES
('Rajesh Kumar', '9876543210', 'rajesh@example.com'),
('Priya Sharma', '9876543211', 'priya@example.com'),
('Amit Patel', '9876543212', 'amit@example.com');
