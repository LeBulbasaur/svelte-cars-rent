-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Czas generowania: 07 Gru 2021, 15:34
-- Wersja serwera: 10.4.17-MariaDB
-- Wersja PHP: 8.0.1

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `cars`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `cars`
--

CREATE TABLE `cars` (
  `id` int(11) NOT NULL,
  `mark` varchar(15) NOT NULL,
  `model` varchar(20) NOT NULL,
  `prod_year` int(11) NOT NULL,
  `mileage` int(20) NOT NULL,
  `fuel` varchar(10) NOT NULL,
  `color` varchar(10) NOT NULL,
  `price` int(11) NOT NULL,
  `in_use` bit(1) NOT NULL,
  `image` varchar(100) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Zrzut danych tabeli `cars`
--

INSERT INTO `cars` (`id`, `mark`, `model`, `prod_year`, `mileage`, `fuel`, `color`, `price`, `in_use`, `image`) VALUES
(1, 'Honda', 'Civic V', 2005, 264000, 'petrol', 'blue', 237, b'0', 'civic_classic.png'),
(2, 'Opel', 'Astra IV', 2011, 130000, 'petrol', 'red', 111, b'0', 'astra.png'),
(3, 'Škoda', 'Citigo 1.0', 2017, 67000, 'gas', 'white', 120, b'0', 'citigo.png'),
(4, 'Renault', 'Twizy', 2012, 34000, 'electric', 'yellow', 60, b'0', 'twizy.png'),
(5, 'Mercedes-Benz', 'AMG GT R', 2019, 28000, 'petrol', 'blue', 420, b'0', 'amg.png'),
(6, 'Volkswagen', 'Passat 2.0', 2014, 165000, 'diesel', 'black', 0, b'0', 'passat.png');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `carId` int(11) NOT NULL,
  `current_time` date NOT NULL DEFAULT current_timestamp(),
  `rent_start` date NOT NULL,
  `rent_end` date NOT NULL,
  `status` bit(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Wyzwalacze `reservations`
--
DELIMITER $$
CREATE TRIGGER `set_use` AFTER UPDATE ON `reservations` FOR EACH ROW UPDATE `cars` SET `in_use`=new.status WHERE cars.id=old.carId
$$
DELIMITER ;
DELIMITER $$
CREATE TRIGGER `set_use_remove` AFTER DELETE ON `reservations` FOR EACH ROW UPDATE `cars` SET `in_use`=b'0' WHERE cars.id=old.carId
$$
DELIMITER ;

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` text NOT NULL,
  `password` text NOT NULL,
  `rank` text NOT NULL,
  `blocked` bit(1) NOT NULL DEFAULT b'0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Zrzut danych tabeli `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `rank`, `blocked`) VALUES
(1, 'admin', '$2y$10$UCCr2pAPs75bHGVXsHPGKuRYwUaWHrTagCsODF4qwDhzxQS1ateLC', 'administrator', b'0'),
(6, 'judasz', '$2y$10$MCIi5Uz6z.GiaIW3ED7NbOh9AQfOBndngE2QIlwvUplLSvlQIqjm6', 'moderator', b'0'),
(7, 'sperek', '$2y$10$3NjnxSLnNfcCnosbysIeteRSs41IJJ5avDD8BXv4bDCwsjiK.ceH.', 'client', b'0'),
(9, 'gliwek', '$2y$10$zkAYrI2AiBxYHz/v16yM6.FeypQauddc.Eqr5haXW76/Mb..fOe92', 'client', b'0'),
(10, 'judo', '$2y$10$chb1SrNmQlPSwjcoXJQ3AODrTyhlmfgtftklHsnzavaf.R/Ha2pUS', 'client', b'0');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `cars`
--
ALTER TABLE `cars`
  ADD PRIMARY KEY (`id`);

--
-- Indeksy dla tabeli `reservations`
--
ALTER TABLE `reservations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `userId` (`userId`),
  ADD KEY `carId` (`carId`);

--
-- Indeksy dla tabeli `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT dla zrzuconych tabel
--

--
-- AUTO_INCREMENT dla tabeli `cars`
--
ALTER TABLE `cars`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=7;

--
-- AUTO_INCREMENT dla tabeli `reservations`
--
ALTER TABLE `reservations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=167;

--
-- AUTO_INCREMENT dla tabeli `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=12;

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`carId`) REFERENCES `cars` (`id`);

DELIMITER $$
--
-- Zdarzenia
--
CREATE DEFINER=`root`@`localhost` EVENT `update_time` ON SCHEDULE EVERY 1 DAY STARTS '2021-12-01 19:18:00' ENDS '2021-12-31 00:00:00' ON COMPLETION PRESERVE ENABLE DO UPDATE reservations SET reservations.current_time = CURDATE() WHERE 1$$

DELIMITER ;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
