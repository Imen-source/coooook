<?php
// api/recipes.php
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Get all recipes (trending or by category)
    if ($action === 'list') {
        $cat = $_GET['category'] ?? 'all';
        $search = $_GET['search'] ?? '';
        
        $sql = "SELECT r.*, u.username as author_name FROM recipes r LEFT JOIN users u ON r.user_id = u.id";
        $params = [];
        
        $conditions = [];
        if ($cat !== 'all') {
            $conditions[] = "category = ?";
            $params[] = $cat;
        }
        if (!empty($search)) {
            $conditions[] = "(title LIKE ? OR country LIKE ?)";
            $params[] = "%$search%";
            $params[] = "%$search%";
        }
        
        if (count($conditions) > 0) {
            $sql .= " WHERE " . implode(" AND ", $conditions);
        }
        
        $sql .= " ORDER BY created_at DESC LIMIT 50";
        
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        $recipes = $stmt->fetchAll();
        
        jsonResponse($recipes);
    }

    // Get single recipe detail with ingredients and steps
    if ($action === 'detail') {
        $id = $_GET['id'] ?? 0;
        $stmt = $pdo->prepare("SELECT r.*, u.username as author_name FROM recipes r LEFT JOIN users u ON r.user_id = u.id WHERE r.id = ?");
        $stmt->execute([$id]);
        $recipe = $stmt->fetch();
        
        if (!$recipe) jsonResponse(['error' => 'Recipe not found'], 404);
        
        // Fetch ingredients
        $stmt = $pdo->prepare("SELECT * FROM recipe_ingredients WHERE recipe_id = ?");
        $stmt->execute([$id]);
        $recipe['ingredients'] = $stmt->fetchAll();
        
        // Fetch steps
        $stmt = $pdo->prepare("SELECT * FROM recipe_steps WHERE recipe_id = ? ORDER BY step_num ASC");
        $stmt->execute([$id]);
        $recipe['steps'] = $stmt->fetchAll();
        
        jsonResponse($recipe);
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = checkAuth();
    $data = json_decode(file_get_contents('php://input'), true);
    
    if ($action === 'create') {
        $pdo->beginTransaction();
        try {
            $stmt = $pdo->prepare("INSERT INTO recipes (user_id, title, story, country, level, prep_time, category, image_url, servings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $userId,
                $data['title'],
                $data['story'] ?? '',
                $data['country'] ?? '',
                $data['level'] ?? 'Beginner',
                $data['prep_time'] ?? '30m',
                $data['category'] ?? 'arabic',
                $data['image_url'] ?? 'assets/recipe_tagine.png',
                $data['servings'] ?? 4
            ]);
            $recipeId = $pdo->lastInsertId();
            
            // Insert ingredients
            if (isset($data['ingredients'])) {
                $stmt = $pdo->prepare("INSERT INTO recipe_ingredients (recipe_id, name, amount) VALUES (?, ?, ?)");
                foreach ($data['ingredients'] as $ing) {
                    $stmt->execute([$recipeId, $ing['name'], $ing['amount'] ?? '']);
                }
            }
            
            $pdo->commit();
            jsonResponse(['message' => 'Recipe created', 'id' => $recipeId]);
        } catch (Exception $e) {
            $pdo->rollBack();
            jsonResponse(['error' => 'Failed to create recipe: ' . $e->getMessage()], 500);
        }
    }

    if ($action === 'toggle_save') {
        $recipeId = $data['recipe_id'] ?? 0;
        
        // Check if already saved
        $stmt = $pdo->prepare("SELECT 1 FROM saved_recipes WHERE user_id = ? AND recipe_id = ?");
        $stmt->execute([$userId, $recipeId]);
        
        if ($stmt->fetch()) {
            // Remove
            $stmt = $pdo->prepare("DELETE FROM saved_recipes WHERE user_id = ? AND recipe_id = ?");
            $stmt->execute([$userId, $recipeId]);
            jsonResponse(['saved' => false]);
        } else {
            // Add
            $stmt = $pdo->prepare("INSERT INTO saved_recipes (user_id, recipe_id) VALUES (?, ?)");
            $stmt->execute([$userId, $recipeId]);
            jsonResponse(['saved' => true]);
        }
    }
}
?>
