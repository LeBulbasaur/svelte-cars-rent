-- phpMyAdmin SQL Dump
-- version 5.0.4
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Czas generowania: 30 Paź 2021, 15:27
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
  `mileage` varchar(20) NOT NULL,
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
(1, 'Honda', 'Civic V', 2005, '264 300 km', 'petrol', 'blue', 237, b'0', 'civic_classic.png'),
(2, 'Opel', 'Astra IV', 2011, '130 000 km', 'petrol', 'red', 111, b'0', 'astra.png'),
(3, 'Škoda', 'Citigo 1.0', 2017, '67 400 km', 'gas', 'white', 120, b'1', 'citigo.png'),
(4, 'Renault', 'Twizy', 2012, '34 000 km', 'electric', 'yellow', 60, b'0', 'twizy.png'),
(5, 'Mercedes-Benz', 'AMG GT R', 2019, '28 800 km', 'petrol', 'blue', 420, b'0', 'amg.png'),
(6, 'Volkswagen', 'Passat 2.0', 2014, '165 000 km', 'diesel', 'black', 0, b'0', 'passat.png');

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `reservations`
--

CREATE TABLE `reservations` (
  `id` int(11) NOT NULL,
  `userId` int(11) NOT NULL,
  `carId` int(11) NOT NULL,
  `rent_start` date NOT NULL,
  `rent_end` date NOT NULL,
  `status` bit(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Zrzut danych tabeli `reservations`
--

INSERT INTO `reservations` (`id`, `userId`, `carId`, `rent_start`, `rent_end`, `status`) VALUES
(116, 7, 1, '2021-10-29', '2021-10-29', b'0'),
(117, 1, 3, '2021-10-29', '2021-11-03', b'1');

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
  `rank` text NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Zrzut danych tabeli `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `rank`) VALUES
(1, 'admin', '$2y$10$UCCr2pAPs75bHGVXsHPGKuRYwUaWHrTagCsODF4qwDhzxQS1ateLC', 'administrator'),
(6, 'judasz', '$2y$10$MCIi5Uz6z.GiaIW3ED7NbOh9AQfOBndngE2QIlwvUplLSvlQIqjm6', 'moderator'),
(7, 'sperek', '$2y$10$3NjnxSLnNfcCnosbysIeteRSs41IJJ5avDD8BXv4bDCwsjiK.ceH.', 'client'),
(9, 'gliwek', '$2y$10$zkAYrI2AiBxYHz/v16yM6.FeypQauddc.Eqr5haXW76/Mb..fOe92', 'client');

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
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=118;

--
-- AUTO_INCREMENT dla tabeli `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- Ograniczenia dla zrzutów tabel
--

--
-- Ograniczenia dla tabeli `reservations`
--
ALTER TABLE `reservations`
  ADD CONSTRAINT `reservations_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`),
  ADD CONSTRAINT `reservations_ibfk_2` FOREIGN KEY (`carId`) REFERENCES `cars` (`id`);
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
