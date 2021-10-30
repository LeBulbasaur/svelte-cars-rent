<?php
include("./db.php");
$users = array();
$sql = "SELECT id, username, rank FROM users";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_object()) {
        if ($row === null) break;
        array_push($users, $row);
    }
}
echo json_encode($users);
$conn->close();
