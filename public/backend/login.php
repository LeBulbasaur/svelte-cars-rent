<?php
include("./db.php");
$sql = "SELECT username, password FROM users";
$result = $conn->query($sql);
if ($result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        if ($_POST['username'] == $row["username"] && password_verify($_POST['password'], $row["password"])) {
            echo $row["username"];
            break;
        }
    }
}
$conn->close();
