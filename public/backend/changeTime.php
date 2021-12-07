<?php
include("./db.php");
if ($_POST["currentTime"] != "none") {

    $sql = 'UPDATE reservations SET `current_time` ="' . $_POST["currentTime"] . '", rent_start="' . $_POST["newTimeStart"] . '", rent_end="' . $_POST["newTimeEnd"] . '" WHERE id="' . $_POST["id"] . '"';
} else {
    $sql = 'UPDATE reservations SET `current_time` ="' . $_POST["currentTime"] . '" WHERE id="' . $_POST["id"] . '"';
}
$result = $conn->query($sql);
if ($conn->query($sql)) {
    echo "changed";
} else {
    echo "failed";
}
$conn->close();
