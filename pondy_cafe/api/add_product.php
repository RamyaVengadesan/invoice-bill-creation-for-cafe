<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!validateInput($data, ['name', 'category', 'price', 'stock'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

$conn = getConnection();

try {
    $stmt = $conn->prepare(
        "INSERT INTO products (product_name, category, price, stock_quantity, min_stock_level, icon) 
         VALUES (?, ?, ?, ?, ?, ?)"
    );
    
    $minStock = isset($data['minStock']) ? $data['minStock'] : 10;
    $icon = isset($data['icon']) ? $data['icon'] : getCategoryIcon($data['category']);
    
    $stmt->bind_param(
        'ssdiss',
        $data['name'],
        $data['category'],
        $data['price'],
        $data['stock'],
        $minStock,
        $icon
    );
    
    if ($stmt->execute()) {
        $productId = $conn->insert_id;
        
        // Log stock history
        $stmtHistory = $conn->prepare(
            "INSERT INTO stock_history (product_id, quantity_change, change_type, notes) 
             VALUES (?, ?, 'INITIAL', 'Initial stock')"
        );
        $stmtHistory->bind_param('ii', $productId, $data['stock']);
        $stmtHistory->execute();
        $stmtHistory->close();
        
        echo json_encode([
            'success' => true,
            'message' => 'Product added successfully',
            'product_id' => $productId
        ]);
    } else {
        throw new Exception('Failed to add product');
    }
    
    $stmt->close();
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>