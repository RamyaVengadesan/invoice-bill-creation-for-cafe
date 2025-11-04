<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$json = file_get_contents('php://input');
$data = json_decode($json, true);

if (!isset($data['id'])) {
    echo json_encode(['success' => false, 'message' => 'Product ID required']);
    exit();
}

$conn = getConnection();

try {
    // Get current product data
    $stmt = $conn->prepare("SELECT stock_quantity FROM products WHERE product_id = ?");
    $stmt->bind_param('i', $data['id']);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Product not found']);
        exit();
    }
    
    $currentProduct = $result->fetch_assoc();
    $oldStock = (int)$currentProduct['stock_quantity'];
    $stmt->close();
    
    // Build update query dynamically
    $updateFields = [];
    $types = '';
    $values = [];
    
    if (isset($data['name'])) {
        $updateFields[] = "product_name = ?";
        $types .= 's';
        $values[] = $data['name'];
    }
    
    if (isset($data['category'])) {
        $updateFields[] = "category = ?";
        $types .= 's';
        $values[] = $data['category'];
    }
    
    if (isset($data['price'])) {
        $updateFields[] = "price = ?";
        $types .= 'd';
        $values[] = $data['price'];
    }
    
    if (isset($data['stock'])) {
        $updateFields[] = "stock_quantity = ?";
        $types .= 'i';
        $values[] = $data['stock'];
    }
    
    if (isset($data['minStock'])) {
        $updateFields[] = "min_stock_level = ?";
        $types .= 'i';
        $values[] = $data['minStock'];
    }
    
    if (isset($data['icon'])) {
        $updateFields[] = "icon = ?";
        $types .= 's';
        $values[] = $data['icon'];
    }
    
    if (empty($updateFields)) {
        echo json_encode(['success' => false, 'message' => 'No fields to update']);
        exit();
    }
    
    $types .= 'i';
    $values[] = $data['id'];
    
    $query = "UPDATE products SET " . implode(', ', $updateFields) . " WHERE product_id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param($types, ...$values);
    
    if ($stmt->execute()) {
        // Log stock change if stock was updated
        if (isset($data['stock']) && $data['stock'] != $oldStock) {
            $stockChange = $data['stock'] - $oldStock;
            $stmtHistory = $conn->prepare(
                "INSERT INTO stock_history (product_id, quantity_change, change_type, notes) 
                 VALUES (?, ?, 'ADJUSTMENT', ?)"
            );
            $notes = $stockChange > 0 ? 'Stock added' : 'Stock removed';
            $stmtHistory->bind_param('iis', $data['id'], $stockChange, $notes);
            $stmtHistory->execute();
            $stmtHistory->close();
        }
        
        echo json_encode([
            'success' => true,
            'message' => 'Product updated successfully'
        ]);
    } else {
        throw new Exception('Failed to update product');
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