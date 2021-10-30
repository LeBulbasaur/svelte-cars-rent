<?php
include("./db.php");
$sql = "SELECT username FROM users";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        if ($_POST['username'] == $row["username"]) {
            echo "exists";
            break;
        }
    }
}
$conn->close();
