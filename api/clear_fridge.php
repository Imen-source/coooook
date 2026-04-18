<?php
require_once 'config.php';
$pdo->exec('DELETE FROM fridge_items');
echo 'Fridge cleared.';
?>
