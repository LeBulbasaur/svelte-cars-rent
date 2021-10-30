<?php
session_start();
if ($_POST['action'] === "setUser") {
    $_SESSION['loggedUser'] = $_POST['username'];
    echo "user logged in" . $_SESSION['loggedUser'];
} else if ($_POST['action'] === "logoutUser") {
    $_SESSION['loggedUser'] = null;
    echo "user logged out";
} else if ($_POST['action'] === "getUser") {
    if (isset($_SESSION['loggedUser'])) {
        echo $_SESSION['loggedUser'];
    } else {
        echo "";
    }
} else {
    echo "sessionStarted";
}
