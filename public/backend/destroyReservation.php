<?php
include("./db.php");
$userId = $_POST['userId'];
$carId = $_POST['carId'];
$sql = "DELETE FROM `reservations` WHERE userId='$userId' AND carId='$carId'";
if ($conn->query($sql)) {
    echo "deleted";
} else {
    echo "error";
}
$conn->close();
