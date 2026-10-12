-- phpMyAdmin SQL Dump
-- version 6.0.0-dev+20260707.3e756d69dd
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Sep 22, 2026 at 08:22 PM
-- Server version: 8.4.3
-- PHP Version: 8.3.30

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `taskmanager`
--

-- --------------------------------------------------------

--
-- Table structure for table `calendar_event`
--

CREATE TABLE `calendar_event` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `created_by_id` int DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `date` datetime NOT NULL,
  `type` varchar(30) NOT NULL,
  `description` longtext,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `calendar_event`
--

INSERT INTO `calendar_event` (`id`, `project_id`, `created_by_id`, `title`, `date`, `type`, `description`, `created_at`) VALUES
(1, 1, 1, 'Rendez-vous client — rapport de cadrage', '2026-09-23 19:29:00', 'rendez_vous', '', '2026-09-22 19:29:25'),
(2, 2, NULL, 'Début du cadrage', '2026-06-01 00:00:00', 'cadrage', NULL, '2026-06-01 00:00:00'),
(3, 2, NULL, 'Rendez-vous client — rapport de cadrage', '2026-06-10 00:00:00', 'rendez_vous', 'Présentation du cadrage et du périmètre au client.', '2026-06-10 00:00:00'),
(4, 2, NULL, 'Fin du développement', '2026-07-15 00:00:00', 'developpement', NULL, '2026-07-15 00:00:00'),
(5, 2, NULL, 'Livraison finale', '2026-07-31 00:00:00', 'livraison', NULL, '2026-07-31 00:00:00'),
(6, 3, NULL, 'Début du cadrage', '2026-07-01 00:00:00', 'cadrage', NULL, '2026-07-01 00:00:00'),
(7, 3, NULL, 'Rendez-vous client — rapport de cadrage', '2026-07-08 00:00:00', 'rendez_vous', NULL, '2026-07-08 00:00:00'),
(8, 3, NULL, 'Livraison finale', '2026-08-15 00:00:00', 'livraison', NULL, '2026-08-15 00:00:00'),
(9, 4, NULL, 'Début du cadrage', '2026-09-01 00:00:00', 'cadrage', NULL, '2026-09-01 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `doctrine_migration_versions`
--

CREATE TABLE `doctrine_migration_versions` (
  `version` varchar(191) NOT NULL,
  `executed_at` datetime DEFAULT NULL,
  `execution_time` int DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `doctrine_migration_versions`
--

INSERT INTO `doctrine_migration_versions` (`version`, `executed_at`, `execution_time`) VALUES
('DoctrineMigrations\\Version20260916185600', '2026-09-22 18:08:33', 220),
('DoctrineMigrations\\Version20260916185648', NULL, NULL),
('DoctrineMigrations\\Version20260918060000', '2026-09-22 18:23:58', 54),
('DoctrineMigrations\\Version20260922090000', '2026-09-22 18:23:58', 1656),
('DoctrineMigrations\\Version20260922100000', '2026-09-22 18:23:59', 91),
('DoctrineMigrations\\Version20260922110000', '2026-09-22 19:31:37', 15),
('DoctrineMigrations\\Version20260922120000', '2026-09-22 19:37:19', 14),
('DoctrineMigrations\\Version20260922130000', '2026-09-22 19:42:31', 156);

-- --------------------------------------------------------

--
-- Table structure for table `project`
--

CREATE TABLE `project` (
  `id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` longtext NOT NULL,
  `status` varchar(20) NOT NULL,
  `priority` varchar(20) NOT NULL,
  `budget` int NOT NULL,
  `progress` int NOT NULL,
  `category` varchar(100) NOT NULL,
  `created_at` datetime NOT NULL,
  `client_id` int NOT NULL,
  `manager_id` int DEFAULT NULL,
  `members` longtext,
  `start_date` datetime DEFAULT NULL,
  `end_date` datetime DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project`
--

INSERT INTO `project` (`id`, `title`, `description`, `status`, `priority`, `budget`, `progress`, `category`, `created_at`, `client_id`, `manager_id`, `members`, `start_date`, `end_date`) VALUES
(1, 'Test', 'Test', 'validated', 'urgent', -10, 0, 'test', '2026-09-22 19:28:14', 1, NULL, '[{\"userId\":\"1\",\"role\":\"client\",\"joinedAt\":\"2026-09-22T19:28:14+00:00\"}]', '2026-08-31 21:00:00', '2026-09-26 21:00:00'),
(2, 'Plateforme E-commerce TechStart', 'Création d\'une plateforme e-commerce complète avec gestion de catalogue, panier, paiement Stripe et espace client. La plateforme doit être responsive et optimisée SEO.', 'in_progress', 'high', 45000, 55, 'E-commerce', '2026-05-20 08:00:00', 11, 4, '[{\"role\": \"client\", \"userId\": \"11\", \"joinedAt\": \"2026-05-20 00:00:00\"}, {\"role\": \"chef_de_projet\", \"userId\": \"4\", \"joinedAt\": \"2026-05-22 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"6\", \"joinedAt\": \"2026-06-01 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"7\", \"joinedAt\": \"2026-06-01 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"8\", \"joinedAt\": \"2026-06-01 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"9\", \"joinedAt\": \"2026-06-01 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"10\", \"joinedAt\": \"2026-06-15 00:00:00\"}]', '2026-06-01 00:00:00', '2026-07-31 00:00:00'),
(3, 'Refonte Site Vitrine EcoShop', 'Refonte complète du site vitrine d\'EcoShop avec nouveau design system, amélioration des performances et accessibilité. Migration vers Next.js.', 'in_progress', 'medium', 22000, 35, 'Site vitrine', '2026-06-25 08:00:00', 12, 5, '[{\"role\": \"client\", \"userId\": \"12\", \"joinedAt\": \"2026-06-25 00:00:00\"}, {\"role\": \"chef_de_projet\", \"userId\": \"5\", \"joinedAt\": \"2026-06-26 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"7\", \"joinedAt\": \"2026-07-01 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"6\", \"joinedAt\": \"2026-07-01 00:00:00\"}]', '2026-07-01 00:00:00', '2026-08-15 00:00:00'),
(4, 'Application Mobile UrbanVibes Fitness', 'Application mobile de coaching fitness personnalisé avec suivi des entraînements, plans nutritionnels et communauté. iOS + Android (React Native).', 'pending', 'urgent', 75000, 0, 'Application mobile', '2026-08-20 08:00:00', 13, NULL, '[{\"role\": \"client\", \"userId\": \"13\", \"joinedAt\": \"2026-08-20 00:00:00\"}]', '2026-09-01 00:00:00', '2026-12-15 00:00:00'),
(5, 'Dashboard Analytics B2B', 'Tableau de bord analytics B2B avec visualisation de données en temps réel, exports PDF/Excel et gestion multi-tenant.', 'validated', 'high', 38000, 0, 'Dashboard', '2026-08-25 08:00:00', 11, NULL, '[{\"role\": \"client\", \"userId\": \"11\", \"joinedAt\": \"2026-08-25 00:00:00\"}]', '2026-09-10 00:00:00', '2026-11-30 00:00:00'),
(6, 'Refonte Logo & Identité — UrbanVibes', 'Création d\'une nouvelle identité visuelle : logo, charte graphique, déclinaisons print et digital.', 'rejected', 'low', 8000, 0, 'Design', '2026-08-10 08:00:00', 13, NULL, '[{\"role\": \"client\", \"userId\": \"13\", \"joinedAt\": \"2026-08-10 00:00:00\"}]', '2026-08-15 00:00:00', '2026-09-15 00:00:00'),
(7, 'Application de réservation de restaurant', 'Application web de réservation de tables avec gestion des disponibilités et notifications.', 'completed', 'medium', 28000, 100, 'Application web', '2026-02-15 08:00:00', 12, 4, '[{\"role\": \"client\", \"userId\": \"12\", \"joinedAt\": \"2026-02-15 00:00:00\"}, {\"role\": \"chef_de_projet\", \"userId\": \"4\", \"joinedAt\": \"2026-02-20 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"6\", \"joinedAt\": \"2026-03-01 00:00:00\"}, {\"role\": \"membre\", \"userId\": \"7\", \"joinedAt\": \"2026-03-01 00:00:00\"}]', '2026-03-01 00:00:00', '2026-05-31 00:00:00'),
(8, 'Audit de sécurité applicative', 'Audit complet de la sécurité de l\'application existante avec rapport détaillé.', 'rejected', 'low', 5000, 0, 'Audit', '2026-05-28 08:00:00', 11, NULL, '[{\"role\": \"client\", \"userId\": \"11\", \"joinedAt\": \"2026-05-28 00:00:00\"}]', '2026-06-01 00:00:00', '2026-06-30 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `project_member`
--

CREATE TABLE `project_member` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `user_id` int NOT NULL,
  `role` varchar(20) NOT NULL,
  `joined_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_member`
--

INSERT INTO `project_member` (`id`, `project_id`, `user_id`, `role`, `joined_at`) VALUES
(1, 1, 1, 'client', '2026-09-22 19:28:14'),
(2, 2, 11, 'client', '2026-05-20 00:00:00'),
(3, 2, 4, 'chef_de_projet', '2026-05-22 00:00:00'),
(4, 2, 6, 'membre', '2026-06-01 00:00:00'),
(5, 2, 7, 'membre', '2026-06-01 00:00:00'),
(6, 2, 8, 'membre', '2026-06-01 00:00:00'),
(7, 2, 9, 'membre', '2026-06-01 00:00:00'),
(8, 2, 10, 'membre', '2026-06-15 00:00:00'),
(9, 3, 12, 'client', '2026-06-25 00:00:00'),
(10, 3, 5, 'chef_de_projet', '2026-06-26 00:00:00'),
(11, 3, 7, 'membre', '2026-07-01 00:00:00'),
(12, 3, 6, 'membre', '2026-07-01 00:00:00'),
(13, 4, 13, 'client', '2026-08-20 00:00:00'),
(14, 5, 11, 'client', '2026-08-25 00:00:00'),
(15, 6, 13, 'client', '2026-08-10 00:00:00'),
(16, 7, 12, 'client', '2026-02-15 00:00:00'),
(17, 7, 4, 'chef_de_projet', '2026-02-20 00:00:00'),
(18, 7, 6, 'membre', '2026-03-01 00:00:00'),
(19, 7, 7, 'membre', '2026-03-01 00:00:00'),
(20, 8, 11, 'client', '2026-05-28 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `project_status_log`
--

CREATE TABLE `project_status_log` (
  `id` int NOT NULL,
  `project_id` int NOT NULL,
  `actor_id` int DEFAULT NULL,
  `from_status` varchar(20) DEFAULT NULL,
  `to_status` varchar(20) NOT NULL,
  `reason` longtext,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `project_status_log`
--

INSERT INTO `project_status_log` (`id`, `project_id`, `actor_id`, `from_status`, `to_status`, `reason`, `created_at`) VALUES
(1, 1, 1, NULL, 'pending', NULL, '2026-09-22 19:28:14'),
(2, 1, 1, 'pending', 'validated', NULL, '2026-09-22 19:28:44'),
(3, 2, NULL, NULL, 'pending', NULL, '2026-05-20 08:00:00'),
(4, 2, NULL, 'pending', 'in_progress', NULL, '2026-05-20 08:00:00'),
(5, 3, NULL, NULL, 'pending', NULL, '2026-06-25 08:00:00'),
(6, 3, NULL, 'pending', 'in_progress', NULL, '2026-06-25 08:00:00'),
(7, 4, NULL, NULL, 'pending', NULL, '2026-08-20 08:00:00'),
(8, 5, NULL, NULL, 'pending', NULL, '2026-08-25 08:00:00'),
(9, 5, NULL, 'pending', 'validated', NULL, '2026-08-25 08:00:00'),
(10, 6, NULL, NULL, 'pending', NULL, '2026-08-10 08:00:00'),
(11, 6, NULL, 'pending', 'rejected', 'Le budget alloué est insuffisant par rapport au périmètre demandé. Nous vous invitons à revoir le budget ou réduire le périmètre (par ex. ne garder que le logo dans un premier temps).', '2026-08-10 08:00:00'),
(12, 7, NULL, NULL, 'pending', NULL, '2026-02-15 08:00:00'),
(13, 7, NULL, 'pending', 'completed', NULL, '2026-02-15 08:00:00'),
(14, 8, NULL, NULL, 'pending', NULL, '2026-05-28 08:00:00'),
(15, 8, NULL, 'pending', 'rejected', 'Périmètre trop vague. Merci de détailler les applicatifs concernés et la méthodologie d\'audit.', '2026-05-28 08:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `refresh_tokens`
--

CREATE TABLE `refresh_tokens` (
  `id` int NOT NULL,
  `refresh_token` varchar(255) NOT NULL,
  `username` varchar(255) NOT NULL,
  `valid` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `refresh_tokens`
--

INSERT INTO `refresh_tokens` (`id`, `refresh_token`, `username`, `valid`) VALUES
(1, '9ea6ccab9fbfe9c305bec11419a4c0774e25838431e5c34b616f3496cdc1f2e074618dc3bcf4869adda3a731b80f3b882925d653685257b4513c00af1e8d9c96', 'admin@example.com', '2026-10-22 18:26:01'),
(2, '62f19f9f6c911f88bf636551ab5df6b50395879d5a370c74b5a4e22f3abd3f9762ae17676b23e72db45942905dfa09daeaa05533fd0a68a664208fb17ccb001d', 'admin@example.com', '2026-10-22 18:26:52'),
(3, '97ba0a52b294950ffd289a68fdbfd3066b7c34225272c9d318b913fda49619491c061ebcd2862fc3c1aa40797a72dc349035475986ac3e819b229e29b5980212', 'admin@example.com', '2026-10-22 19:09:45'),
(4, '37969807bfe03a2b76479dd76fc20b54993ef5f4edc60ea2b7744c28f4cd8cd07f1bc26913f366af27232cf833c365bd64c1b05a27fec653b1c11ca7521c3289', 'admin@example.com', '2026-10-22 19:18:59'),
(5, 'cbb5f745190a5c44c879ef8957c108827ab2c2e7313af036e2fe1348c31a2df359ea1a918060378c718410af7b9bedffa8aa8764a6ca6727b26baf42eae1ed7e', 'admin@example.com', '2026-10-22 19:19:21'),
(6, '87daf8bf755f8623a7dc2bb93352f28277baa778166c9d744c565d95ab9d47206695547ee076497b557d93022a7a13b870324f97c25077c8695e75ac9cef69e2', 'admin@example.com', '2026-10-22 19:19:42'),
(7, 'f55d310de376a0d6a46ae4a16a60d5f8f547b18e6fef7300bca75229b6bb94305f9b2da3443892a1e80a00bf451371ce9446f965be570bae5522d167be1a6120', 'admin@example.com', '2026-10-22 19:20:02'),
(8, 'fa7e3354faf1729b6791fb1a400388355b4c0f3ca47a97b66e132f753e4b01d6c2e66a969c0a175c429de46b0d8e37c5044e334d69d2fd244a036f7ec80574e7', 'admin@example.com', '2026-10-22 19:20:24'),
(9, 'f4bb338032b6f9a6faf6681a905c490a8c47eb45ed5af8cb454980df611e5ac712b2e349337a6720293bca02ec187ba8a2414c90bf537c648343f4b7bae71e61', 'admin@example.com', '2026-10-22 19:21:31'),
(10, '2db330a2f1046df230b32bd778cd590635e928e061710de14070b9306a7355500eac5be04a3a8e7e81578deb571ef7a33c026cae1915eba7ca4b60663fe8f89a', 'admin@example.com', '2026-10-22 19:22:41'),
(11, 'bfdfed8d6478d6a1ca141ace5eaf86dff9917de20f59877d0d52acaf816f60a81615eaeb8d274927e408bd310abff130cfa6b7429e4d3253f213df48e2579d49', 'admin@example.com', '2026-10-22 19:22:52'),
(12, '4be2e072dd0b7299fe290697795c49016cd71b2c4a708e7e35e6386f67104ca10b71ad4ef876411b3dd4c15c454292469482c191e363af0f9f18a764b4be688b', 'admin@example.com', '2026-10-22 19:23:03'),
(13, 'cd8ea14a65588104cecb6fde8605c9621667a87b1a056adb4553649cf85d04adc9367a2d61273136fba5ee8c9308e975857cc4d9d3f2a281dc0267eee40d20be', 'admin@example.com', '2026-10-22 19:23:28'),
(14, 'de6beb66cbf9f6232c2db7c7867f9ae349204700ebad21630ede00230ebc393bae9b8418bd9184cad67e39e7789370b90f6aa972aba0c31ea3ea6ac421301876', 'admin@example.com', '2026-10-22 19:26:33'),
(15, '1a3b8e693ed5e35556a106640d569c53c6e2b3bbf252c539dc7010c299e986ac21d00cb35108fc65380f160bbd2b5b455d50d32e90b6d4a727a2da0d9c4bff09', 'admin@taskmanager.local', '2026-10-22 19:31:52'),
(16, '8b1c45a7fc7d3b70fc7bf847fea32ab34f8e1c4e6ab364f49b55c983b0b95321edc6f198032850300d5a0e21c76d7001a07b902b283588963802294551a805fe', 'admin@example.com', '2026-10-22 19:34:53'),
(17, '0160d94b2ec2e8099dc15917bf223c1f0224491590b634e79a100a4ff608858afaa14a2d744277e0d530e056dea857fac19f739197710cfb06c7462a7225a287', 'sophie.laurent@proflow.io', '2026-10-22 19:37:36'),
(18, '72f49eb69c8fe04e1834047df4b0ed6fcbfa63a4a4d239588af2f86b07528bd019d4658836b8e8885f6d8040d6834c481c779b3eb0c756e3402f3014337e461a', 'thomas.dubois@proflow.io', '2026-10-22 19:37:39'),
(19, '676c1b248cb6c5476cd93abb187692429753d47c459109c9f4837f470702a33ba2bec37125b78f8e6708a11584dffbf34bebcc5d7a218b166f2e706d3cc292a8', 'camille@techstart.fr', '2026-10-22 19:37:42'),
(20, 'f195fd05a9d8976095abdcdf81991c86c953282144dce51e5843e854a38ece434593bc8639192f01c665a0da1c7cf5ee1fb3286583f59e33930770c70dc734ea', 'admin@taskmanager.local', '2026-10-22 19:43:00'),
(21, '5270a0438d58d240694096602695e281b8ed3341cccd2f57ce88933c490f8ab5e98383ed6bbcf500a292da86a04210b1f0f804ef6d31c0faf4c82785e0f9ce68', 'admin@example.com', '2026-10-22 19:48:34'),
(22, '03754aa6ae5eedf9323d3cca8103dabdc56b12c7e144c95ffada072bf1ee5406fca05687a89f18d3ff06d3268511dd6c7aebf1d3c16c7ed81ff7c3e048e51389', 'admin@example.com', '2026-10-22 19:53:12'),
(23, 'f3958bbd0f0bda33d6a758e3d91bb7fedd5e37f78cd2e77b39a6a7a263f1bd4ccaab77702a8419a41b5adcd2ead096b7e0422a7e2e94fd60dfaa85c57ba2401c', 'admin@example.com', '2026-10-22 20:08:11'),
(24, 'c25a003f05f0cc6e6b90ebcdbf1423fc89a78a6ba8ec1996bf98b9e98a66e732c89fe3b44f78c91b20f82813c3aff31536b2903b034ad64bae77c2aa1a47780b', 'admin@taskmanager.local', '2026-10-22 20:10:37'),
(25, '991ca67a9636e4a6d78474fef5ef7f697a08cb95d4a15c24ba9b6627b7b99c7e319058a665b7479586bc2f1c6dee320ae8b53faa26b10a53b717f32c0686cf6f', 'admin@taskmanager.local', '2026-10-22 20:13:58'),
(26, 'd2ff79bbbfd8c18da7257584e6c5a65480c184d60bce7bb9ff59b25d525f04b5f153e03830ab149f1094679c84c1a09890a6877bd7b1add270c0993236e86a76', 'admin@taskmanager.local', '2026-10-22 20:14:13'),
(27, '9a4593f59623ae01fa2b2eb41f2981da4e99d2f4f5284cb5e697f85352cefde52e4099a7b62abec106511e8b2ceca55b8aec4efdec60ffa35b866b385135ef7e', 'admin@taskmanager.local', '2026-10-22 20:14:40'),
(28, '32cc6e7dc6bf7355694b8f11ab1c5cb970b42213881c077d449d70e2ba31e8a22d946a1650434155edfeff611250f4abcf1f234dd00b75dab3e689e22ac8a4c8', 'admin@taskmanager.local', '2026-10-22 20:15:49'),
(29, 'c987dbe41da6f9bd9cfb4b2aa1af006e59d8d927d435fcd3fc86fd5b3173654cfc8bdf0ca6ca4bee50c2a856b647d65feafb0b0bd03416ce1fad631cd2f8be8b', 'admin@taskmanager.local', '2026-10-22 20:17:30');

-- --------------------------------------------------------

--
-- Table structure for table `user`
--

CREATE TABLE `user` (
  `id` int NOT NULL,
  `email` varchar(180) NOT NULL,
  `roles` json NOT NULL,
  `password` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `avatar_url` varchar(255) NOT NULL,
  `phone` varchar(30) DEFAULT NULL,
  `company` varchar(255) DEFAULT NULL,
  `address` varchar(255) DEFAULT NULL,
  `bio` longtext,
  `member_specialty` varchar(40) DEFAULT NULL,
  `created_at` datetime NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

--
-- Dumping data for table `user`
--

INSERT INTO `user` (`id`, `email`, `roles`, `password`, `name`, `avatar_url`, `phone`, `company`, `address`, `bio`, `member_specialty`, `created_at`) VALUES
(1, 'admin@example.com', '[\"ROLE_ADMIN\"]', '$2y$13$omqLqp0Ieq9O/MIZfK.uI.5OhphCHgJP5LPw/0oUUJLYEISbTNu9S', 'Admin Test', 'https://ui-avatars.com/api/?name=Admin+Test', NULL, NULL, NULL, NULL, NULL, '2026-09-22 18:24:59'),
(2, 'admin@taskmanager.local', '[\"ROLE_ADMIN\"]', '$2y$13$xcL4IOLJDyzChV6UdGkKneGI6rZnDM3w7AN.IEK6obAyZtI9FAmeO', 'Administrateur', 'https://ui-avatars.com/api/?name=Admin', NULL, NULL, NULL, NULL, NULL, '2026-09-22 22:31:37'),
(3, 'sophie.laurent@proflow.io', '[\"ROLE_ADMIN\"]', '$2y$13$/vzHt3H36Xl0e98Bvybx1.RhXE5DBOaUOf.hsDJSGn5RAG8xeM67K', 'Sophie Laurent', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sophie&backgroundColor=b6e3f4', '+33 6 12 34 56 78', NULL, '12 Rue de la Paix, 75002 Paris', 'Directrice générale de ProFlow. Passionnée par la gestion de projet et l\'innovation digitale.', NULL, '2026-01-15 08:00:00'),
(4, 'karim.benali@proflow.io', '[\"ROLE_CHEF_DE_PROJET\"]', '$2y$10$I9nv31TkX11kRQG.oiII6ON6II0gtZjmeF7/GTKMQVL18b1d64qUi', 'Karim Benali', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Karim&backgroundColor=c0aede', '+33 6 23 45 67 89', NULL, '45 Avenue Victor Hugo, 69006 Lyon', 'Chef de projet senior avec 8 ans d\'expérience en gestion de projets web et mobile.', NULL, '2026-02-01 08:00:00'),
(5, 'elodie.martin@proflow.io', '[\"ROLE_CHEF_DE_PROJET\"]', '$2y$10$bXVQ2m9hMKUJa7MtjdJlWOOiMGyuxV2khJ7hVw1jMttIMlxk1X7YK', 'Élodie Martin', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Elodie&backgroundColor=d1f4e0', '+33 6 34 56 78 90', NULL, '8 Rue des Lilas, 33000 Bordeaux', 'Chef de projet spécialisée en refonte UI/UX et design system.', NULL, '2026-02-10 08:00:00'),
(6, 'thomas.dubois@proflow.io', '[]', '$2y$13$//d0ef1MSBxT3/gsIJ48uuAaQVyF2tyeLIF.cHX6geneULRucCXk6', 'Thomas Dubois', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Thomas&backgroundColor=ffd5dc', '+33 6 45 67 89 01', NULL, '23 Rue du Commerce, 75015 Paris', 'Développeur React/Next.js avec une passion pour les interfaces performantes et accessibles.', 'Frontend', '2026-03-01 08:00:00'),
(7, 'lina.chen@proflow.io', '[]', '$2y$10$bXVQ2m9hMKUJa7MtjdJlWOOiMGyuxV2khJ7hVw1jMttIMlxk1X7YK', 'Lina Chen', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Lina&backgroundColor=c4f0d0', '+33 6 56 78 90 12', NULL, '15 Rue du Faubourg, 31000 Toulouse', 'Designer UI/UX créative, spécialisée dans la création de design systems et maquettes haute fidélité.', 'Designer', '2026-03-05 08:00:00'),
(8, 'marco.rossi@proflow.io', '[]', '$2y$10$bXVQ2m9hMKUJa7MtjdJlWOOiMGyuxV2khJ7hVw1jMttIMlxk1X7YK', 'Marco Rossi', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marco&backgroundColor=ffdfbf', '+33 6 67 89 01 23', NULL, '7 Boulevard Gambetta, 13001 Marseille', 'Développeur backend expert Laravel/PHP et architecte de bases de données MySQL.', 'Backend', '2026-03-10 08:00:00'),
(9, 'aicha.diallo@proflow.io', '[]', '$2y$10$bXVQ2m9hMKUJa7MtjdJlWOOiMGyuxV2khJ7hVw1jMttIMlxk1X7YK', 'Aïcha Diallo', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aicha&backgroundColor=b6e3f4', '+33 6 78 90 12 34', NULL, '31 Rue de Strasbourg, 44000 Nantes', 'Chef de projet junior motivée, spécialisée dans l\'analyse des besoins et la coordination d\'équipe.', 'Chef de projet junior', '2026-03-15 08:00:00'),
(10, 'jakub.nowak@proflow.io', '[]', '$2y$10$bXVQ2m9hMKUJa7MtjdJlWOOiMGyuxV2khJ7hVw1jMttIMlxk1X7YK', 'Jakub Nowak', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Jakub&backgroundColor=c0aede', '+33 6 89 01 23 45', NULL, '42 Rue de la République, 67000 Strasbourg', 'Ingénieur DevOps spécialisé dans les pipelines CI/CD et le déploiement cloud.', 'DevOps', '2026-03-20 08:00:00'),
(11, 'camille@techstart.fr', '[]', '$2y$13$tuTezy0iqEaoCNrqL2RNku6AzO7JftJhezVBJpeHpOsunRBL4O7w2', 'Camille Rousseau', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Camille&backgroundColor=ffd5dc', '+33 7 11 22 33 44', 'TechStart SAS', '56 Avenue des Champs-Élysées, 75008 Paris', 'Fondatrice de TechStart, startup spécialisée dans la vente en ligne de technologies innovantes.', NULL, '2026-04-01 08:00:00'),
(12, 'olivier@ecoshop.com', '[]', '$2y$10$bXVQ2m9hMKUJa7MtjdJlWOOiMGyuxV2khJ7hVw1jMttIMlxk1X7YK', 'Olivier Lefèvre', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Olivier&backgroundColor=d1f4e0', '+33 7 22 33 44 55', 'EcoShop SARL', '18 Rue du Marché, 69002 Lyon', 'Directeur d\'EcoShop, magasin en ligne de produits écologiques et durables.', NULL, '2026-04-05 08:00:00'),
(13, 'nadia@urbanvibes.io', '[]', '$2y$10$bXVQ2m9hMKUJa7MtjdJlWOOiMGyuxV2khJ7hVw1jMttIMlxk1X7YK', 'Nadia Benali', 'https://api.dicebear.com/7.x/avataaars/svg?seed=Nadia&backgroundColor=b6e3f4', '+33 7 33 44 55 66', 'UrbanVibes', '29 Rue de la République, 13001 Marseille', 'Gérante d\'UrbanVibes, marque de sport et bien-être urbain.', NULL, '2026-04-10 08:00:00'),
(16, 'kantofitiavan@gmail.com', '[\"ROLE_CHEF_DE_PROJET\"]', '$2y$13$PpuLtntmDYv8/IOZjK1COO/S0czfm5.RAOMp6HHvIZonul/DDxMPG', 'Dato', 'blob:http://localhost:3000/926a6dc3-f23f-4eea-9549-5e0121918358', '', NULL, NULL, NULL, NULL, '2026-09-22 20:21:55');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `calendar_event`
--
ALTER TABLE `calendar_event`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_9EDA0BB5166D1F9C` (`project_id`),
  ADD KEY `IDX_9EDA0BB5B03A8386` (`created_by_id`);

--
-- Indexes for table `doctrine_migration_versions`
--
ALTER TABLE `doctrine_migration_versions`
  ADD PRIMARY KEY (`version`);

--
-- Indexes for table `project`
--
ALTER TABLE `project`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_2FB3D0EE19EB6921` (`client_id`),
  ADD KEY `IDX_2FB3D0EE783E3463` (`manager_id`);

--
-- Indexes for table `project_member`
--
ALTER TABLE `project_member`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_PROJECT_USER` (`project_id`,`user_id`),
  ADD KEY `IDX_D80A6D0E166D1F9C` (`project_id`),
  ADD KEY `IDX_D80A6D0EA76ED395` (`user_id`);

--
-- Indexes for table `project_status_log`
--
ALTER TABLE `project_status_log`
  ADD PRIMARY KEY (`id`),
  ADD KEY `IDX_C1CE7EA4166D1F9C` (`project_id`),
  ADD KEY `IDX_C1CE7EA410DAF24A` (`actor_id`);

--
-- Indexes for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_9BACE7E1C74F2195` (`refresh_token`);

--
-- Indexes for table `user`
--
ALTER TABLE `user`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `UNIQ_IDENTIFIER_EMAIL` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `calendar_event`
--
ALTER TABLE `calendar_event`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

--
-- AUTO_INCREMENT for table `project`
--
ALTER TABLE `project`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

--
-- AUTO_INCREMENT for table `project_member`
--
ALTER TABLE `project_member`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=21;

--
-- AUTO_INCREMENT for table `project_status_log`
--
ALTER TABLE `project_status_log`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=16;

--
-- AUTO_INCREMENT for table `refresh_tokens`
--
ALTER TABLE `refresh_tokens`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=30;

--
-- AUTO_INCREMENT for table `user`
--
ALTER TABLE `user`
  MODIFY `id` int NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=17;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `calendar_event`
--
ALTER TABLE `calendar_event`
  ADD CONSTRAINT `FK_9EDA0BB5166D1F9C` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_9EDA0BB5B03A8386` FOREIGN KEY (`created_by_id`) REFERENCES `user` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `project`
--
ALTER TABLE `project`
  ADD CONSTRAINT `FK_2FB3D0EE19EB6921` FOREIGN KEY (`client_id`) REFERENCES `user` (`id`),
  ADD CONSTRAINT `FK_2FB3D0EE783E3463` FOREIGN KEY (`manager_id`) REFERENCES `user` (`id`);

--
-- Constraints for table `project_member`
--
ALTER TABLE `project_member`
  ADD CONSTRAINT `FK_D80A6D0E166D1F9C` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `FK_D80A6D0EA76ED395` FOREIGN KEY (`user_id`) REFERENCES `user` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `project_status_log`
--
ALTER TABLE `project_status_log`
  ADD CONSTRAINT `FK_C1CE7EA410DAF24A` FOREIGN KEY (`actor_id`) REFERENCES `user` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `FK_C1CE7EA4166D1F9C` FOREIGN KEY (`project_id`) REFERENCES `project` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
