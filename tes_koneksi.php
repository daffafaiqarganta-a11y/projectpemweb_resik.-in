
<?php
require_once __DIR__ . '/config.php';

header('Content-Type: text/html; charset=utf-8');

try {
    $pdo->query("SELECT 1");
    echo "BERHASIL! Database BERSIHIN sudah terhubung.";
} catch (PDOException $e) {
    http_response_code(500);
    echo "GAGAL! Database belum terhubung.";
}
