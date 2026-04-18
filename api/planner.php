<?php
// api/planner.php
require_once 'config.php';

$userId = checkAuth();
$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'list') {
        $stmt = $pdo->prepare("SELECT * FROM meal_plans WHERE user_id = ?");
        $stmt->execute([$userId]);
        $rows = $stmt->fetchAll();
        
        $plan = [];
        foreach ($rows as $row) {
            $plan[$row['plan_date']] = $row['recipe_id'];
        }
        jsonResponse($plan);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'save') {
        $date = $data['date'] ?? '';
        $recipeId = $data['recipe_id'] ?? 0;
        
        if (empty($date)) jsonResponse(['error' => 'Date required'], 400);
        
        try {
            // Upsert
            $stmt = $pdo->prepare("INSERT INTO meal_plans (user_id, recipe_id, plan_date) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE recipe_id = VALUES(recipe_id)");
            $stmt->execute([$userId, $recipeId, $date]);
            jsonResponse(['message' => 'Plan saved']);
        } catch (PDOException $e) {
            jsonResponse(['error' => 'Failed to save plan'], 500);
        }
    }

    if ($action === 'remove') {
        $date = $data['date'] ?? '';
        $stmt = $pdo->prepare("DELETE FROM meal_plans WHERE user_id = ? AND plan_date = ?");
        $stmt->execute([$userId, $date]);
        jsonResponse(['message' => 'Plan removed']);
    }
}
?>
