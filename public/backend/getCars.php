<?php
include("./db.php");
$cars = array();
$sql = "SELECT * FROM cars WHERE 1";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_object()) {
        if ($row === null) break;
        array_push($cars, $row);
    }
}
echo json_encode($cars);
$conn->close();
