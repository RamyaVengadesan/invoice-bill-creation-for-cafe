<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

$conn = getConnection();

try {
    $query = "SELECT * FROM customers ORDER BY last_visit DESC LIMIT 100";
    $result = $conn->query($query);
    
    $customers = [];
    while ($row = $result->fetch_assoc()) {
        $customers[] = [
            'id' => (int)$row['customer_id'],
            'name' => $row['customer_name'],
            'phone' => $row['customer_phone'],
            'email' => $row['email'],
            'totalPurchases' => (int)$row['total_purchases'],
            'totalSpent' => (float)$row['total_spent'],
            'lastVisit' => $row['last_visit'],
            'createdAt' => $row['created_at']
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $customers
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>