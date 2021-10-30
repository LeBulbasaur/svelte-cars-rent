<?php
include("./db.php");
$userId = $_POST['userId'];
$carId = $_POST['carId'];
$sql = "UPDATE reservations SET status=b'0' WHERE userId='$userId' AND carId='$carId'";
if ($conn->query($sql)) {
    echo "removed";
} else {
    echo "error";
}
$conn->close();
