<?php
// api/get_recipes.php
require_once 'db.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // SQL query to fetch recipes
    $sql = "SELECT * FROM recipes";
    $result = $conn->query($sql);

    if ($result) {
        $recipes = [];
        while ($row = $result->fetch_assoc()) {
            $recipes[] = $row;
        }
        echo json_encode($recipes);
    } else {
        echo json_encode(["error" => "Query failed: " . $conn->error]);
    }
} else {
    echo json_encode(["error" => "Only GET requests are allowed"]);
}

$conn->close();
?>
