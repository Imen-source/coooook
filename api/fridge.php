<?php
// api/fridge.php
require_once 'config.php';

$userId = checkAuth();
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT * FROM fridge_items WHERE user_id = ? ORDER BY added_at DESC");
        $stmt->execute([$userId]);
        jsonResponse($stmt->fetchAll());
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'add') {
        $name = trim($data['name'] ?? '');
        $category = $data['category'] ?? 'General';
        
        if (empty($name)) jsonResponse(['error' => 'Ingredient name required'], 400);

        try {
            $stmt = $pdo->prepare("INSERT INTO fridge_items (user_id, ingredient_name, category) VALUES (?, ?, ?)");
            $stmt->execute([$userId, $name, $category]);
            jsonResponse(['message' => 'Added to fridge', 'id' => $pdo->lastInsertId()]);
        } catch (PDOException $e) {
            jsonResponse(['error' => 'Failed to add item'], 500);
        }
    }

    if ($action === 'remove') {
        $id = $data['id'] ?? 0;
        $stmt = $pdo->prepare("DELETE FROM fridge_items WHERE id = ? AND user_id = ?");
        $stmt->execute([$id, $userId]);
        jsonResponse(['message' => 'Item removed']);
    }
}
?>
