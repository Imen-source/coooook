<?php
// api/community.php
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'feed') {
        $stmt = $pdo->query("SELECT p.*, u.username, u.avatar as user_avatar FROM community_posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC LIMIT 30");
        jsonResponse($stmt->fetchAll());
    }

    if ($action === 'challenges') {
        $stmt = $pdo->query("SELECT * FROM challenges ORDER BY end_date ASC");
        jsonResponse($stmt->fetchAll());
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $userId = checkAuth();
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'post') {
        $content = trim($data['content'] ?? '');
        if (empty($content)) jsonResponse(['error' => 'Content required'], 400);

        $stmt = $pdo->prepare("INSERT INTO community_posts (user_id, content, image_url) VALUES (?, ?, ?)");
        $stmt->execute([$userId, $content, $data['image_url'] ?? null]);
        
        jsonResponse(['message' => 'Post created', 'id' => $pdo->lastInsertId()]);
    }
}
?>
