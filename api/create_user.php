<?php
// api/create_user.php
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Collect data from POST request
    $username = $_POST['username'] ?? '';
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';

    // Validation
    if (empty($username) || empty($email) || empty($password)) {
        echo json_encode(["error" => "All fields (username, email, password) are required"]);
        exit;
    }

    // Hash password for security
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);

    // Prepare statement
    $stmt = $conn->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
    $stmt->bind_param("sss", $username, $email, $hashed_password);

    // Execute and respond
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "User created successfully",
            "user_id" => $conn->insert_id
        ]);
    } else {
        echo json_encode([
            "success" => false, 
            "error" => "Execution failed: " . $stmt->error
        ]);
    }

    $stmt->close();
} else {
    echo json_encode(["error" => "Only POST requests are allowed"]);
}

$conn->close();
?>
