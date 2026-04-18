<?php
// api/get_users.php
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // SQL query to fetch users
    $sql = "SELECT id, username, email, created_at FROM users";
    $result = $conn->query($sql);

    if ($result) {
        $users = [];
        while ($row = $result->fetch_assoc()) {
            $users[] = $row;
        }
        echo json_encode($users);
    } else {
        echo json_encode(["error" => "Query failed: " . $conn->error]);
    }
} else {
    echo json_encode(["error" => "Only GET requests are allowed"]);
}

$conn->close();
?>
