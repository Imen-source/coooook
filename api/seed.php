<?php
// api/seed.php
require_once 'config.php';

$recipes = [
    [
        'title' => 'Kabsa with Spiced Lamb',
        'country' => 'Saudi Arabia',
        'level' => 'Intermediate',
        'prep_time' => '1h 45m',
        'category' => 'arabic',
        'story' => 'The jewel of Arabian hospitality. Long-grain rice cooked with saffron, warm spices, and fall-off-the-bone tender lamb.',
        'image_url' => 'https://images.unsplash.com/photo-1547592180-85f173990554?w=800&q=80',
        'ingredients' => [['name' => 'Basmati Rice', 'amount' => '500g'], ['name' => 'Lamb Shoulder', 'amount' => '1000g'], ['name' => 'Saffron', 'amount' => '1 tsp']],
        'steps' => ['Brown lamb', 'Cook onions', 'Simmer']
    ],
    [
        'title' => 'Tunisian Ojja',
        'country' => 'Tunisia',
        'level' => 'Beginner',
        'prep_time' => '25m',
        'category' => 'maghreb',
        'story' => 'A fiery, fragrant shakshuka from Tunisia featuring spicy merguez sausage and harissa.',
        'image_url' => 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=800&q=80',
        'ingredients' => [['name' => 'Eggs', 'amount' => '4'], ['name' => 'Merguez', 'amount' => '4'], ['name' => 'Harissa', 'amount' => '2 tbsp']],
        'steps' => ['Fry merguez', 'Add tomatoes', 'Crack eggs']
    ]
];

$pdo->exec("SET FOREIGN_KEY_CHECKS = 0; TRUNCATE recipes; TRUNCATE recipe_ingredients; TRUNCATE recipe_steps; SET FOREIGN_KEY_CHECKS = 1;");

foreach ($recipes as $r) {
    $stmt = $pdo->prepare("INSERT INTO recipes (title, country, level, prep_time, category, story, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->execute([$r['title'], $r['country'], $r['level'], $r['prep_time'], $r['category'], $r['story'], $r['image_url']]);
    $id = $pdo->lastInsertId();

    foreach ($r['ingredients'] as $ing) {
        $pdo->prepare("INSERT INTO recipe_ingredients (recipe_id, name, amount) VALUES (?, ?, ?)")->execute([$id, $ing['name'], $ing['amount']]);
    }
}

// Add some challenges
$pdo->exec("TRUNCATE challenges;");
$pdo->prepare("INSERT INTO challenges (title, description, emoji, participants_count, end_date) VALUES (?, ?, ?, ?, ?)")->execute([
    'Perfect Hummus', 'Silkiest hummus wins! Submit a photo.', '🥙', 432, '2026-05-01'
]);

echo "Database seeded successfully!";
?>
