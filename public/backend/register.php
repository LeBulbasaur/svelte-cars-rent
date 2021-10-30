<?php
include("./db.php");
$username = $conn->real_escape_string($_POST['username']);
$password = password_hash($conn->real_escape_string($_POST['password']), PASSWORD_DEFAULT);
$sql = "INSERT INTO `users`(`username`, `password`, `rank`) VALUES ('$username', '$password', 'client')";
if ($conn->query($sql)) {
    echo "added";
}
$conn->close();
