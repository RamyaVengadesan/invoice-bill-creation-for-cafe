Pondy Café Billing System

A web-based billing system for Pondy Café that allows managing products, customers, invoices, and stock. The system supports online/offline operations and provides a clean, easy-to-use interface.

Features

Billing & Cart: Add products to the cart, calculate subtotal, tax, and total.

Products Management: Add, edit, and manage products with stock levels.

Customer Management: Track customer details, total purchases, and last visit.

Invoice History: View and search past invoices.

Reports: Generate sales reports by date, customer, or product.

Payment Methods: Cash, Card, UPI.

Stock History: Track stock changes due to sales or adjustments.

Technologies Used

Frontend: HTML, CSS, JavaScript

Backend: PHP (MySQLi)

Database: MySQL

JSON API: For communication between frontend and backend

Database Structure

customers: Stores customer info (name, phone, email, total purchases, last visit).

products: Stores product info (name, category, price, stock, min stock).

invoices: Stores invoice details (customer, total, payment method).

invoice_items: Stores individual product items for each invoice.

stock_history: Logs stock changes for auditing purposes.

Installation

Clone the repository or download the project.

Create the database in MySQL using the provided SQL script (pondy_cafe.sql).

Update config.php with your database credentials.

Place the project in your web server root (e.g., htdocs for XAMPP).

Open the project in a browser: http://localhost/pondy_cafe/.

Usage

Navigate to Billing to add items to the cart and generate invoices.

Use Products to manage the café menu.

Use Customers to view and manage customer information.

View Reports and Invoice History for analytics and records.

Notes

Ensure the PHP server has mysqli extension enabled.

All data is stored in MySQL; backups are recommended regularly.

Icons/emojis have been removed for a clean interface.

License

This project is free to use and modify.

If you want, I can also make a more visually appealing Markdown README with badges, screenshots, and usage instructions that you can directly put on GitHub.
