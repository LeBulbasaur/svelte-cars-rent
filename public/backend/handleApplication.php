<?php
include("./db.php");
$userId = $_POST['userId'];
$carId = $_POST['carId'];
$sql = "UPDATE reservations SET status=b'1' WHERE userId='$userId' AND carId='$carId'";
if ($conn->query($sql)) {
    echo "added";
} else {
    echo "error";
}
$conn->close();
