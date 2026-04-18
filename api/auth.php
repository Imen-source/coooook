<?php
// api/auth.php
require_once 'config.php';

$action = $_GET['action'] ?? '';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    if ($action === 'register') {
        $username = trim($data['username'] ?? '');
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        if (empty($username) || empty($email) || empty($password)) {
            jsonResponse(['error' => 'All fields are required'], 400);
        }

        $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

        try {
            $stmt = $pdo->prepare("INSERT INTO users (username, email, password) VALUES (?, ?, ?)");
            $stmt->execute([$username, $email, $hashedPassword]);
            $userId = $pdo->lastInsertId();
            
            $_SESSION['user_id'] = $userId;
            $_SESSION['username'] = $username;

            jsonResponse(['message' => 'User registered successfully', 'user' => ['id' => $userId, 'username' => $username]]);
        } catch (PDOException $e) {
            if ($e->getCode() == 23000) {
                jsonResponse(['error' => 'Username or Email already exists'], 409);
            }
            jsonResponse(['error' => 'Registration failed'], 500);
        }
    }

    if ($action === 'login') {
        $email = trim($data['email'] ?? '');
        $password = $data['password'] ?? '';

        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();

        if ($user && password_verify($password, $user['password'])) {
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['username'] = $user['username'];
            jsonResponse(['message' => 'Logged in successfully', 'user' => [
                'id' => $user['id'],
                'username' => $user['username'],
                'avatar' => $user['avatar']
            ]]);
        } else {
            jsonResponse(['error' => 'Invalid email or password'], 401);
        }
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if ($action === 'status') {
        if (isset($_SESSION['user_id'])) {
            jsonResponse(['loggedIn' => true, 'user' => [
                'id' => $_SESSION['user_id'],
                'username' => $_SESSION['username']
            ]]);
        } else {
            jsonResponse(['loggedIn' => false]);
        }
    }

    if ($action === 'logout') {
        session_destroy();
        jsonResponse(['message' => 'Logged out successfully']);
    }
}
?>
