<?php
include("./db.php");
$sql = "UPDATE users SET blocked=b'" . $_POST["block"] . "' WHERE id='" . $_POST["userId"] . "'";
$result = $conn->query($sql);
if ($conn->query($sql)) {
    echo "changed";
} else {
    echo "failed";
}
$conn->close();
