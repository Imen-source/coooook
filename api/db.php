<?php
// api/db.php
$host = "localhost";
$username = "root";
$password = "";
$dbname = "cooks_db";

// Create connection
$conn = new mysqli($host, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    header('Content-Type: application/json');
    die(json_encode(["error" => "Connection failed: " . $conn->connect_error]));
}

// Set charset to utf8mb4 for Arabic support
$conn->set_charset("utf8mb4");
?>
