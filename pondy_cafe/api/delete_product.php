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
    // Soft delete - set is_active to FALSE
    $stmt = $conn->prepare("UPDATE products SET is_active = FALSE WHERE product_id = ?");
    $stmt->bind_param('i', $data['id']);
    
    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Product deleted successfully'
        ]);
    } else {
        throw new Exception('Failed to delete product');
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