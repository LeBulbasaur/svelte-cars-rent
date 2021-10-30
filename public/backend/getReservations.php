<?php
include("./db.php");
$reservations = array();
$sql = "SELECT * FROM reservations";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_object()) {
        if ($row === null) break;
        array_push($reservations, $row);
    }
}
echo json_encode($reservations);
$conn->close();
