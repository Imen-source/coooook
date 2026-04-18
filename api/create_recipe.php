<?php
// api/create_recipe.php
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Collect data
    $title = $_POST['title'] ?? '';
    $country = $_POST['country'] ?? '';
    $level = $_POST['level'] ?? '';
    $prep_time = $_POST['prep_time'] ?? '';
    $category = $_POST['category'] ?? '';
    $story = $_POST['story'] ?? '';
    $image_url = $_POST['image_url'] ?? '';

    // Validation
    if (empty($title)) {
        echo json_encode(["error" => "Title is required"]);
        exit;
    }

    // Prepare statement
    $stmt = $conn->prepare("INSERT INTO recipes (title, country, level, prep_time, category, story, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param("sssssss", $title, $country, $level, $prep_time, $category, $story, $image_url);

    // Execute and respond
    if ($stmt->execute()) {
        echo json_encode([
            "success" => true,
            "message" => "Recipe created successfully",
            "recipe_id" => $conn->insert_id
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
