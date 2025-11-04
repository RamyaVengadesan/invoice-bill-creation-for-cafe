<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$conn = getConnection();

try {
    // Total revenue
    $query = "SELECT SUM(total_amount) as total_revenue FROM invoices";
    $result = $conn->query($query);
    $totalRevenue = $result->fetch_assoc()['total_revenue'] ?? 0;
    
    // Today's revenue
    $query = "SELECT SUM(total_amount) as today_revenue FROM invoices WHERE DATE(created_at) = CURDATE()";
    $result = $conn->query($query);
    $todayRevenue = $result->fetch_assoc()['today_revenue'] ?? 0;
    
    // Total invoices
    $query = "SELECT COUNT(*) as total_invoices FROM invoices";
    $result = $conn->query($query);
    $totalInvoices = $result->fetch_assoc()['total_invoices'];
    
    // Today's invoices
    $query = "SELECT COUNT(*) as today_invoices FROM invoices WHERE DATE(created_at) = CURDATE()";
    $result = $conn->query($query);
    $todayInvoices = $result->fetch_assoc()['today_invoices'];
    
    // Total customers
    $query = "SELECT COUNT(*) as total_customers FROM customers";
    $result = $conn->query($query);
    $totalCustomers = $result->fetch_assoc()['total_customers'];
    
    // Low stock products
    $query = "SELECT COUNT(*) as low_stock FROM products WHERE stock_quantity < min_stock_level AND is_active = TRUE";
    $result = $conn->query($query);
    $lowStock = $result->fetch_assoc()['low_stock'];
    
    // Out of stock products
    $query = "SELECT COUNT(*) as out_of_stock FROM products WHERE stock_quantity = 0 AND is_active = TRUE";
    $result = $conn->query($query);
    $outOfStock = $result->fetch_assoc()['out_of_stock'];
    
    // Top selling products
    $query = "SELECT p.product_name, p.category, p.icon, SUM(ii.quantity) as total_sold, 
              SUM(ii.total_price) as total_revenue
              FROM invoice_items ii
              JOIN products p ON ii.product_id = p.product_id
              GROUP BY ii.product_id
              ORDER BY total_sold DESC
              LIMIT 5";
    $result = $conn->query($query);
    $topProducts = [];
    while ($row = $result->fetch_assoc()) {
        $topProducts[] = [
            'name' => $row['product_name'],
            'category' => $row['category'],
            'icon' => $row['icon'],
            'totalSold' => (int)$row['total_sold'],
            'revenue' => (float)$row['total_revenue']
        ];
    }
    
    // Recent customers
    $query = "SELECT customer_name, customer_phone, total_purchases, total_spent, last_visit
              FROM customers
              ORDER BY last_visit DESC
              LIMIT 5";
    $result = $conn->query($query);
    $recentCustomers = [];
    while ($row = $result->fetch_assoc()) {
        $recentCustomers[] = [
            'name' => $row['customer_name'],
            'phone' => $row['customer_phone'],
            'purchases' => (int)$row['total_purchases'],
            'spent' => (float)$row['total_spent'],
            'lastVisit' => $row['last_visit']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => [
            'totalRevenue' => (float)$totalRevenue,
            'todayRevenue' => (float)$todayRevenue,
            'totalInvoices' => (int)$totalInvoices,
            'todayInvoices' => (int)$todayInvoices,
            'totalCustomers' => (int)$totalCustomers,
            'lowStock' => (int)$lowStock,
            'outOfStock' => (int)$outOfStock,
            'topProducts' => $topProducts,
            'recentCustomers' => $recentCustomers
        ]
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>