<?php
require_once '../config.php';

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method']);
    exit();
}

// Parse JSON input
$json = file_get_contents('php://input');
$data = json_decode($json, true);

// Validate required fields
if (!validateInput($data, ['customer_name', 'customer_phone', 'payment_method', 'items', 'subtotal', 'tax', 'total'])) {
    echo json_encode(['success' => false, 'message' => 'Missing required fields']);
    exit();
}

// Check if cart is empty
if (empty($data['items'])) {
    echo json_encode(['success' => false, 'message' => 'Cart is empty']);
    exit();
}

$conn = getConnection();
$conn->begin_transaction();

try {
    // 🧾 Step 1: Check if customer exists
    $stmt = $conn->prepare("SELECT customer_id FROM customers WHERE customer_phone = ?");
    $stmt->bind_param('s', $data['customer_phone']);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Existing customer
        $customer = $result->fetch_assoc();
        $customerId = $customer['customer_id'];
        $stmt->close();

        // Update customer stats
        $stmt = $conn->prepare("
            UPDATE customers 
            SET customer_name = ?, 
                total_purchases = total_purchases + 1, 
                total_spent = total_spent + ?, 
                last_visit = NOW()
            WHERE customer_id = ?
        ");
        $stmt->bind_param('sdi', $data['customer_name'], $data['total'], $customerId);
        $stmt->execute();
    } else {
        // New customer
        $stmt->close();
        $email = $data['email'] ?? null;
        $stmt = $conn->prepare("
            INSERT INTO customers (customer_name, customer_phone, email, total_purchases, total_spent, last_visit)
            VALUES (?, ?, ?, 1, ?, NOW())
        ");
        $stmt->bind_param('sssd', $data['customer_name'], $data['customer_phone'], $email, $data['total']);
        if (!$stmt->execute()) {
            throw new Exception("Failed to create customer: " . $stmt->error);
        }
        $customerId = $conn->insert_id;
    }
    $stmt->close();

    // 🧾 Step 2: Generate new invoice number
    $year = date('Y');
    $query = "SELECT MAX(CAST(SUBSTRING(invoice_number, 10) AS UNSIGNED)) AS max_num 
              FROM invoices WHERE invoice_number LIKE 'INV-$year-%'";
    $result = $conn->query($query);
    $row = $result->fetch_assoc();
    $nextNum = ($row['max_num'] ?? 0) + 1;
    $invoiceNumber = sprintf("INV-%s-%04d", $year, $nextNum);

    // 🧾 Step 3: Insert invoice record
    $stmt = $conn->prepare("
        INSERT INTO invoices (
            invoice_number, customer_id, customer_name, customer_phone, 
            payment_method, subtotal, tax_amount, total_amount
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->bind_param(
        'sisssddd',
        $invoiceNumber,
        $customerId,
        $data['customer_name'],
        $data['customer_phone'],
        $data['payment_method'],
        $data['subtotal'],
        $data['tax'],
        $data['total']
    );
    if (!$stmt->execute()) {
        throw new Exception("Failed to save invoice: " . $stmt->error);
    }

    $invoiceId = $conn->insert_id;
    $stmt->close();

    // 🧾 Step 4: Prepare statements for items and stock
    $stmtItem = $conn->prepare("
        INSERT INTO invoice_items (invoice_id, product_id, product_name, category, quantity, unit_price, total_price)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmtStock = $conn->prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE product_id = ?");
    $stmtHistory = $conn->prepare("
        INSERT INTO stock_history (product_id, quantity_change, change_type, reference_id, notes)
        VALUES (?, ?, 'SALE', ?, ?)
    ");

    // 🧾 Step 5: Loop through items
    foreach ($data['items'] as $item) {
        // Check stock
        $check = $conn->prepare("SELECT stock_quantity FROM products WHERE product_id = ?");
        $check->bind_param('i', $item['id']);
        $check->execute();
        $res = $check->get_result();

        if ($res->num_rows === 0) {
            throw new Exception("Product not found: {$item['name']}");
        }

        $product = $res->fetch_assoc();
        if ($product['stock_quantity'] < $item['quantity']) {
            throw new Exception("Insufficient stock for {$item['name']}");
        }
        $check->close();

        // Insert invoice item
        $totalPrice = $item['price'] * $item['quantity'];
        $stmtItem->bind_param(
            'iissidd',
            $invoiceId,
            $item['id'],
            $item['name'],
            $item['category'],
            $item['quantity'],
            $item['price'],
            $totalPrice
        );
        if (!$stmtItem->execute()) {
            throw new Exception("Failed to save invoice item: " . $stmtItem->error);
        }

        // Update stock
        $stmtStock->bind_param('ii', $item['quantity'], $item['id']);
        $stmtStock->execute();

        // Insert stock history
        $quantityChange = -$item['quantity'];
        $notes = "Sold via invoice $invoiceNumber";
        $stmtHistory->bind_param('iiis', $item['id'], $quantityChange, $invoiceId, $notes);
        $stmtHistory->execute();
    }

    // Close statements
    $stmtItem->close();
    $stmtStock->close();
    $stmtHistory->close();

    // Commit transaction
    $conn->commit();

    echo json_encode([
        'success' => true,
        'message' => 'Invoice saved successfully',
        'invoice_number' => $invoiceNumber,
        'invoice_id' => $invoiceId,
        'customer_id' => $customerId
    ]);

} catch (Exception $e) {
    // Rollback on any failure
    $conn->rollback();
    echo json_encode([
        'success' => false,
        'message' => $e->getMessage()
    ]);
}

$conn->close();
?>
