<?php
/**
 * api/import_recipes.php
 * ─────────────────────────────────────────────────────────────────────────────
 * Imports scraped Arabic recipes from arabic_recipes.json into cooks_db.
 *
 * Handles the full normalized schema:
 *   - recipes
 *   - recipe_ingredients
 *   - recipe_steps
 *
 * Run via CLI:
 *   php api/import_recipes.php [--file ../arabic_recipes.json] [--dry-run]
 *
 * Or call via browser (GET request):
 *   http://localhost/try_cooks/api/import_recipes.php
 *
 * Deduplication: recipes with the same title (case-insensitive) are skipped.
 * ─────────────────────────────────────────────────────────────────────────────
 */

require_once __DIR__ . '/config.php';

// ── Output helpers ───────────────────────────────────────────────────────────

$isCLI = php_sapi_name() === 'cli';

function log_msg(string $msg, string $level = 'INFO'): void {
    global $isCLI;
    $prefix = "[{$level}] " . date('H:i:s') . " — ";
    if ($isCLI) {
        echo $prefix . $msg . PHP_EOL;
    } else {
        echo "<p><strong>[{$level}]</strong> " . htmlspecialchars($msg) . "</p>" . PHP_EOL;
        ob_flush(); flush();
    }
}

// ── CLI argument parsing ─────────────────────────────────────────────────────

$jsonFile = dirname(__DIR__) . '/arabic_recipes.json';
$dryRun   = false;

if ($isCLI) {
    $opts = getopt('', ['file:', 'dry-run']);
    if (isset($opts['file']))    $jsonFile = $opts['file'];
    if (isset($opts['dry-run'])) $dryRun   = true;
} else {
    header('Content-Type: text/html; charset=utf-8');
    echo '<!DOCTYPE html><html lang="ar" dir="rtl"><head><meta charset="utf-8">';
    echo '<title>استيراد الوصفات</title>';
    echo '<style>body{font-family:sans-serif;max-width:800px;margin:2rem auto;direction:rtl} p{margin:.3em 0}</style>';
    echo '</head><body><h1>🍲 استيراد الوصفات العربية</h1>';
    if (isset($_GET['file']))    $jsonFile = $_GET['file'];
    if (isset($_GET['dry_run'])) $dryRun   = true;
}

// ── Load JSON ────────────────────────────────────────────────────────────────

if (!file_exists($jsonFile)) {
    log_msg("File not found: {$jsonFile}", 'ERROR');
    exit(1);
}

$raw = file_get_contents($jsonFile);
$recipes = json_decode($raw, true);

if (!is_array($recipes)) {
    log_msg("Invalid JSON in {$jsonFile}: " . json_last_error_msg(), 'ERROR');
    exit(1);
}

log_msg("Loaded " . count($recipes) . " recipes from {$jsonFile}");
if ($dryRun) log_msg("DRY-RUN mode — no database writes will occur.", 'WARN');

// ── Fetch existing recipe titles for deduplication ───────────────────────────

$existingTitles = [];
$rows = $pdo->query("SELECT LOWER(title) AS t FROM recipes")->fetchAll(PDO::FETCH_COLUMN);
foreach ($rows as $t) $existingTitles[$t] = true;

log_msg("Found " . count($existingTitles) . " existing recipes in DB.");

// ── Prepared statements ───────────────────────────────────────────────────────

$stmtRecipe = $pdo->prepare("
    INSERT INTO recipes
        (title, story, country, level, prep_time, category, image_url, servings, is_heritage)
    VALUES
        (:title, :story, :country, :level, :prep_time, :category, :image_url, :servings, :is_heritage)
");

$stmtIngr = $pdo->prepare("
    INSERT INTO recipe_ingredients (recipe_id, name, amount, unit)
    VALUES (:recipe_id, :name, :amount, :unit)
");

$stmtStep = $pdo->prepare("
    INSERT INTO recipe_steps (recipe_id, step_num, instruction, timer_seconds)
    VALUES (:recipe_id, :step_num, :instruction, :timer_seconds)
");

// ── Import loop ───────────────────────────────────────────────────────────────

$inserted  = 0;
$skipped   = 0;
$errors    = 0;

foreach ($recipes as $index => $recipe) {
    $title = trim($recipe['title'] ?? '');

    if (!$title) {
        log_msg("Row {$index}: missing title — skipped.", 'WARN');
        $skipped++;
        continue;
    }

    if (isset($existingTitles[mb_strtolower($title)])) {
        log_msg("Duplicate skipped: {$title}", 'SKIP');
        $skipped++;
        continue;
    }

    // Merge prep + cook into a single prep_time field if needed
    $prepTime = trim($recipe['prep_time'] ?? '');
    $cookTime = trim($recipe['cook_time'] ?? '');
    if ($prepTime && $cookTime) {
        $prepTime = "تحضير: {$prepTime} | طهي: {$cookTime}";
    } elseif ($cookTime) {
        $prepTime = $cookTime;
    }

    if ($dryRun) {
        log_msg("DRY-RUN would insert: {$title}");
        $inserted++;
        continue;
    }

    try {
        $pdo->beginTransaction();

        // 1. Insert recipe
        $stmtRecipe->execute([
            ':title'      => $title,
            ':story'      => $recipe['story']       ?? $recipe['description'] ?? '',
            ':country'    => $recipe['country']     ?? '',
            ':level'      => $recipe['level']       ?? 'Beginner',
            ':prep_time'  => $prepTime,
            ':category'   => $recipe['category']    ?? 'arabic',
            ':image_url'  => $recipe['image_url']   ?? '',
            ':servings'   => (int)($recipe['servings'] ?? 4),
            ':is_heritage'=> (int)(!empty($recipe['is_heritage'])),
        ]);
        $recipeId = (int)$pdo->lastInsertId();

        // 2. Insert ingredients
        $ingredients = $recipe['ingredients'] ?? [];
        foreach ($ingredients as $ingr) {
            // Support both flat string and object formats
            if (is_string($ingr)) {
                $ingr = ['name' => $ingr, 'amount' => '', 'unit' => ''];
            }
            $name = trim($ingr['name'] ?? '');
            if (!$name) continue;

            $stmtIngr->execute([
                ':recipe_id' => $recipeId,
                ':name'      => $name,
                ':amount'    => trim($ingr['amount'] ?? ''),
                ':unit'      => trim($ingr['unit']   ?? ''),
            ]);
        }

        // 3. Insert steps
        $steps = $recipe['steps'] ?? [];
        foreach ($steps as $idx => $step) {
            // Support both flat string and object formats
            if (is_string($step)) {
                $step = ['step_num' => $idx + 1, 'instruction' => $step, 'timer_seconds' => 0];
            }
            $instruction = trim($step['instruction'] ?? $step);
            if (!$instruction) continue;

            $stmtStep->execute([
                ':recipe_id'     => $recipeId,
                ':step_num'      => (int)($step['step_num'] ?? $idx + 1),
                ':instruction'   => $instruction,
                ':timer_seconds' => (int)($step['timer_seconds'] ?? 0),
            ]);
        }

        $pdo->commit();

        $existingTitles[mb_strtolower($title)] = true; // prevent duplicates in same run
        $inserted++;
        log_msg("✓ Inserted [{$recipeId}]: {$title}");

    } catch (PDOException $e) {
        $pdo->rollBack();
        log_msg("✗ DB error for '{$title}': " . $e->getMessage(), 'ERROR');
        $errors++;
    }
}

// ── Summary ───────────────────────────────────────────────────────────────────

log_msg("────────────────────────────────────────");
log_msg("✅ Inserted : {$inserted}");
log_msg("⏭ Skipped  : {$skipped}");
log_msg("❌ Errors   : {$errors}");
log_msg("────────────────────────────────────────");

if (!$isCLI) {
    echo "</body></html>";
}
