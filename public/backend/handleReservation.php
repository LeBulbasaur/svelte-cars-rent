<?php
include("./db.php");
$carId = $_POST['carId'];
$userId = $_POST['userId'];
$startTime = $_POST['startTime'];
$endTime = $_POST['endTime'];
$sql = "INSERT INTO `reservations`(`userId`, `carId`, `rent_start`, `rent_end`, `status`) 
VALUES ('$userId', '$carId', '$startTime', '$endTime', b'0')";
if ($conn->query($sql)) {
    echo "added";
} else {
    echo "error";
}
$conn->close();
