<?php
include("./db.php");
$sql = 'UPDATE reservations SET rent_end="' . $_POST["newTime"] . '" WHERE id="' . $_POST["id"] . '"';
$result = $conn->query($sql);
if ($conn->query($sql)) {
    echo "changed";
} else {
    echo "failed";
}
$conn->close();
