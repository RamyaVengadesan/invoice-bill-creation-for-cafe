<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$conn = getConnection();

try {
    $query = "SELECT * FROM products WHERE is_active = TRUE ORDER BY category, product_name";
    $result = $conn->query($query);
    
    $products = [];
    while ($row = $result->fetch_assoc()) {
        $products[] = [
            'id' => (int)$row['product_id'],
            'name' => $row['product_name'],
            'category' => $row['category'],
            'price' => (float)$row['price'],
            'stock' => (int)$row['stock_quantity'],
            'minStock' => (int)$row['min_stock_level'],
            'icon' => $row['icon'],
            'isActive' => (bool)$row['is_active']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $products
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>