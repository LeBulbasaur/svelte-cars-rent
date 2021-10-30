<?php
include("./db.php");
$sql = 'UPDATE users SET rank="' . $_POST["rank"] . '" WHERE username="' . $_POST["username"] . '"';
$result = $conn->query($sql);
if ($conn->query($sql)) {
    echo "added";
} else {
    echo "failed";
}
$conn->close();
