-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Tempo de geração: 22-Dez-2025 às 13:48
-- Versão do servidor: 10.4.32-MariaDB
-- versão do PHP: 8.0.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Banco de dados: `chordpro_db`
--

-- --------------------------------------------------------

--
-- Estrutura da tabela `setlists`
--

CREATE TABLE `setlists` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `name` varchar(150) NOT NULL,
  `is_public` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `setlists`
--

INSERT INTO `setlists` (`id`, `user_id`, `name`, `is_public`, `created_at`) VALUES
(2, 1, 'Natal 2026', 1, '2025-12-18 10:22:53');

-- --------------------------------------------------------

--
-- Estrutura da tabela `setlist_songs`
--

CREATE TABLE `setlist_songs` (
  `id` int(11) NOT NULL,
  `setlist_id` int(11) NOT NULL,
  `cifra_id` int(11) NOT NULL,
  `position` int(11) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `setlist_songs`
--

INSERT INTO `setlist_songs` (`id`, `setlist_id`, `cifra_id`, `position`) VALUES
(8, 2, 6, 1);

-- --------------------------------------------------------

--
-- Estrutura da tabela `songs`
--

CREATE TABLE `songs` (
  `id` int(11) NOT NULL,
  `user_id` int(11) NOT NULL,
  `title` varchar(150) NOT NULL,
  `artist` varchar(150) DEFAULT NULL,
  `file_path` text NOT NULL,
  `is_public` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `songs`
--

INSERT INTO `songs` (`id`, `user_id`, `title`, `artist`, `file_path`, `is_public`, `created_at`) VALUES
(6, 1, 'test4444kkk', 'Teste', '/home/cris/Secretária/Projects/chordpro_app/uploads/songs/user_1/test4444kkk.chopro', 1, '2025-12-17 11:21:55'),
(9, 3, 'Em teus braÃ§os', NULL, '/home/cris/Secretária/Projects/chordpro_app/uploads/songs/user_3/Em teus braços.chordpro', 1, '2025-12-19 10:52:23');

-- --------------------------------------------------------

--
-- Estrutura da tabela `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Extraindo dados da tabela `users`
--

INSERT INTO `users` (`id`, `username`, `email`, `password_hash`, `created_at`) VALUES
(1, 'Cris', 'cristianonunesoliveira2006@gmail.com', '$2b$10$J35q85/nyN40d8ymDSj/GuFHUAdbA84oyNFIWmUTqhcuYyLSqsr1a', '2025-12-14 09:33:06'),
(3, 'teste', 'test@example.com', '$2b$10$yMT0sc9LYoEquA/fhV.D4eZQdffKDp0R51mSHU4BHL3wuFCa1fyf.', '2025-12-19 10:51:59');

--
-- Índices para tabelas despejadas
--

--
-- Índices para tabela `setlists`
--
ALTER TABLE `setlists`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices para tabela `setlist_songs`
--
ALTER TABLE `setlist_songs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `setlist_id` (`setlist_id`),
  ADD KEY `cifra_id` (`cifra_id`);

--
-- Índices para tabela `songs`
--
ALTER TABLE `songs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_id` (`user_id`);

--
-- Índices para tabela `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT de tabelas despejadas
--

--
-- AUTO_INCREMENT de tabela `setlists`
--
ALTER TABLE `setlists`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;

--
-- AUTO_INCREMENT de tabela `setlist_songs`
--
ALTER TABLE `setlist_songs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `songs`
--
ALTER TABLE `songs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT de tabela `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

--
-- Restrições para despejos de tabelas
--

--
-- Limitadores para a tabela `setlists`
--
ALTER TABLE `setlists`
  ADD CONSTRAINT `setlists_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `setlist_songs`
--
ALTER TABLE `setlist_songs`
  ADD CONSTRAINT `setlist_songs_ibfk_1` FOREIGN KEY (`setlist_id`) REFERENCES `setlists` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `setlist_songs_ibfk_2` FOREIGN KEY (`cifra_id`) REFERENCES `songs` (`id`) ON DELETE CASCADE;

--
-- Limitadores para a tabela `songs`
--
ALTER TABLE `songs`
  ADD CONSTRAINT `songs_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
