<?php
// save score
header('Content-Type: application/json');

$file = 'neon_shooter_save.json';

// load data
if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    if (file_exists($file)) {
        echo file_get_contents($file);
    } else {
        echo json_encode(["highScore" => 0, "credits" => 0, "upgrades" => []]);
    }
    exit;
}

// save data
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $input = file_get_contents("php://input");
    $data = json_decode($input, true);

    if ($data) {
        // inputs
        file_put_contents($file, json_encode($data));
        echo json_encode(["status" => "success"]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid JSON"]);
    }
    exit;
}
?>