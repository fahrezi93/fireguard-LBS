-- MySQL dump 10.13  Distrib 8.4.3, for Win64 (x86_64)
--
-- Host: localhost    Database: fireguard
-- ------------------------------------------------------
-- Server version	8.4.3

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `broadcast_logs`
--

DROP TABLE IF EXISTS `broadcast_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `broadcast_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `operator_id` int NOT NULL,
  `title` varchar(255) NOT NULL,
  `message` text NOT NULL,
  `total_tokens` int NOT NULL DEFAULT '0',
  `success_count` int NOT NULL DEFAULT '0',
  `failure_count` int NOT NULL DEFAULT '0',
  `sent_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bl_operator_id` (`operator_id`),
  KEY `idx_bl_sent_at` (`sent_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `broadcast_logs`
--

LOCK TABLES `broadcast_logs` WRITE;
/*!40000 ALTER TABLE `broadcast_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `broadcast_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `device_tokens`
--

DROP TABLE IF EXISTS `device_tokens`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `device_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `device_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `platform` enum('android','ios') COLLATE utf8mb4_unicode_ci NOT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  `last_used_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `device_token` (`device_token`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_device_token` (`device_token`),
  KEY `idx_active` (`is_active`),
  CONSTRAINT `device_tokens_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=65 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `device_tokens`
--

LOCK TABLES `device_tokens` WRITE;
/*!40000 ALTER TABLE `device_tokens` DISABLE KEYS */;
INSERT INTO `device_tokens` VALUES (1,1,'cVNZ16JlSP6jJdaQbwD4dU:APA91bH4kuFBSY3NbVSaxwHul_6Q5XByPfys3BnYpjVFxGqinngkZjVHw5Q4Y4xVIiDgQgLNC3YZgLDfGIVvVXNVlKKQj_yoNgOw7vrWe09OZmqcKs8jedQ','android',0,'2026-04-26 12:22:05','2026-06-26 10:09:41','2026-04-26 12:22:05'),(2,1,'cQv7OtafR_qb56YXuFUfOR:APA91bHswtjF109OiuktVpmrXpwLZLSiNo-_-uH7kZG3sT1uh4Xn7oTwUCV_RZmROkCDaxl8fVmaU09mEwen1xqUflvekAw3FQ2IkVwiql7ln6fbFenQPPw','android',0,'2026-06-28 17:23:36','2026-06-28 18:13:49','2026-06-28 18:11:55'),(6,1,'ebNmIEvuS1mQS_4AvUlK9A:APA91bGj6W6Dq7jHCceNgiHXcbpb4jni9Luo2It9YJJUW_-NmAcQVsiZt5SBb2n6x8O7NKEf_cd8-fwaijt8Hm_tsgJHcVB99uliv8AYdL_p3eM1jXUD7I4','android',0,'2026-06-28 18:13:44','2026-06-28 19:28:55','2026-06-28 19:21:12'),(8,1,'edckns2yQZ2ZoN3_XEB3ho:APA91bHViVp2Pra-MFd0aOBzG8hzgSdCIafn1DlveZjXSNl7Z-FEymDskxhIz-s3O4K_mm6eFKLSOMQPV0NRlrPLdMXrwBny-ZdH1MJB7he1_ZYM7oPmHr4','android',0,'2026-06-28 19:28:41','2026-06-28 20:16:25','2026-06-28 19:28:41'),(9,1,'dl0VLSOuQbKdfaT4NldpQ5:APA91bFRZMSwjlSd-IEDLlcMBbmNMXwxAWsIosWQ2u0nFodUg9NXdXkA1VQFPdL_UmLmh7c9wiCinpPHt3LwEhyf2I-LVqepbx1Zap75rU4LPl576N3AEZA','android',0,'2026-06-28 20:16:18','2026-06-29 07:22:59','2026-06-29 01:59:08'),(18,3,'ft3qMVuFTLGPYu2GonzmCY:APA91bHlcd3kr0GwmRsMYZ_5UriF46SKlIltaYSy9Q2za794kH6dDu503Rew0fWCdZLnPgrZY6m5ScT-ArHLaJ8ooTIfQ9XtCQkVFvW0mndfc7FZ4xskxxg','android',0,'2026-07-03 00:53:48','2026-07-03 01:27:20','2026-07-03 01:27:20'),(37,3,'fJllbd0sRxSCwH2LH5wuvm:APA91bHS0bY3PS5bWhIABVGnyvpaCtwbROrCnTtd88AKNCTEg9pa7EdVkwQdvDYBb16lnL1fClmqXmhcI1p6F9eFyiP2fbh81lEf0OZjUb7Bk5-xZJN_e_g','android',0,'2026-07-03 01:29:31','2026-07-07 15:16:27','2026-07-07 15:16:27'),(49,4,'eosJtVg7SP67vRyc5P5l2O:APA91bEpe3ByxwgEMNlBiMtBswMrVF29uFgcmr8-fJ-eYGM93pv6aCVhN8yWY-aAh0LYW-cB_Mpzs_6fDYfSvCUFCUEE7ZeJRGIkluTTRyoI7QWjxjq9Stw','android',1,'2026-07-11 20:07:35','2026-07-11 21:12:48','2026-07-11 21:12:48'),(62,3,'eh9V6D-FTS-ttAgQDFqeoc:APA91bEvPqBXl1xA-bFhxViugc8pv_Lw5MUMur6CA8WwSprCL9LIOYHbofwKjSMDE4mCj68DfnRVVM-MlP9YV9Qkee6oRd75Gwsayvodvxtbd4Smrybp05I','android',1,'2026-07-13 01:03:35','2026-07-13 01:17:17','2026-07-13 01:17:17');
/*!40000 ALTER TABLE `device_tokens` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disaster_categories`
--

DROP TABLE IF EXISTS `disaster_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `disaster_categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `icon` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `color` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disaster_categories`
--

LOCK TABLES `disaster_categories` WRITE;
/*!40000 ALTER TABLE `disaster_categories` DISABLE KEYS */;
INSERT INTO `disaster_categories` VALUES (1,'Kebakaran lingkungan & lahan kecil','🔥','#EF4444','Kebakaran di lingkungan perumahan atau lahan kecil',1,'2026-04-10 02:28:13','2026-04-10 02:28:13'),(2,'Banjir & genangan wilayah rawa','🌊','#3B82F6','Banjir dan genangan air di wilayah rawa',1,'2026-04-10 02:28:13','2026-04-10 02:28:13'),(3,'Angin kencang & cuaca ekstrem','🌪️','#6B7280','Angin kencang, hujan lebat, dan cuaca ekstrem lainnya',1,'2026-04-10 02:28:13','2026-04-10 02:28:13'),(4,'Kerusakan infrastruktur lingkungan','🏚️','#78350F','Kerusakan jalan, jembatan, dan infrastruktur lingkungan',1,'2026-04-10 02:28:13','2026-04-10 02:28:13'),(5,'Pencemaran & sampah berisiko','☣️','#10B981','Pencemaran lingkungan dan penumpukan sampah berbahaya',1,'2026-04-10 02:28:13','2026-04-10 02:28:13');
/*!40000 ALTER TABLE `disaster_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `kelurahan`
--

DROP TABLE IF EXISTS `kelurahan`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kelurahan` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kode_pos` varchar(10) COLLATE utf8mb4_unicode_ci NOT NULL,
  `kecamatan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Plaju',
  `kota` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Plaju, Palembang',
  `description` text COLLATE utf8mb4_unicode_ci,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `kelurahan`
--

LOCK TABLES `kelurahan` WRITE;
/*!40000 ALTER TABLE `kelurahan` DISABLE KEYS */;
INSERT INTO `kelurahan` VALUES (1,'Plaju Ulu','30266','Plaju','Plaju, Palembang','Bagian \"hulu\" (atas) kecamatan, biasanya mencakup area pasar dan pemukiman padat di jalan utama.',1,'2026-04-10 02:28:13'),(2,'Plaju Darat','30267','Plaju','Plaju, Palembang','Lebih ke arah dalam/darat, menjauh dari sungai Musi.',1,'2026-04-10 02:28:13'),(3,'Plaju Ilir','30268','Plaju','Plaju, Palembang','Bagian \"hilir\" (bawah), dekat dengan area kilang pertamina.',1,'2026-04-10 02:28:13'),(4,'Bagus Kuning','30268','Plaju','Plaju, Palembang','Area bersejarah (Makam Bagus Kuning), dekat tepian Sungai Musi.',1,'2026-04-10 02:28:13'),(5,'Komperta','30268','Plaju','Plaju, Palembang','Singkatan dari \"Komplek Pertamina\". Ini adalah area khusus perumahan dan fasilitas Pertamina.',1,'2026-04-10 02:28:13'),(6,'Talang Bubuk','30268','Plaju','Plaju, Palembang','Area pemukiman yang cukup luas di bagian dalam Plaju.',1,'2026-04-10 02:28:13'),(7,'Talang Putri','30268','Plaju','Plaju, Palembang','Berbatasan dengan wilayah Banyuasin di sisi timur.',1,'2026-04-10 02:28:13');
/*!40000 ALTER TABLE `kelurahan` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_logs`
--

DROP TABLE IF EXISTS `notification_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_logs` (
  `id` int NOT NULL AUTO_INCREMENT,
  `report_id` int NOT NULL,
  `user_id` int NOT NULL,
  `device_token` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status_change` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `body` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `delivery_status` enum('sent','failed','retry') COLLATE utf8mb4_unicode_ci NOT NULL,
  `error_message` text COLLATE utf8mb4_unicode_ci,
  `retry_count` int DEFAULT '0',
  `sent_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_report_id` (`report_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_sent_at` (`sent_at`),
  KEY `idx_delivery_status` (`delivery_status`),
  CONSTRAINT `notification_logs_ibfk_1` FOREIGN KEY (`report_id`) REFERENCES `reports` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notification_logs_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_logs`
--

LOCK TABLES `notification_logs` WRITE;
/*!40000 ALTER TABLE `notification_logs` DISABLE KEYS */;
INSERT INTO `notification_logs` VALUES (1,8,1,'cVNZ16JlSP6jJdaQbwD4dU:APA91bH4kuFBSY3NbVSaxwHul_6Q5XByPfys3BnYpjVFxGqinngkZjVHw5Q4Y4xVIiDgQgLNC3YZgLDfGIVvVXNVlKKQj_yoNgOw7vrWe09OZmqcKs8jedQ','verified','Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','failed','All retry attempts failed',3,'2026-06-26 10:09:35'),(2,7,1,'dl0VLSOuQbKdfaT4NldpQ5:APA91bFRZMSwjlSd-IEDLlcMBbmNMXwxAWsIosWQ2u0nFodUg9NXdXkA1VQFPdL_UmLmh7c9wiCinpPHt3LwEhyf2I-LVqepbx1Zap75rU4LPl576N3AEZA','verified','Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','sent',NULL,0,'2026-06-28 20:21:48'),(3,7,1,'dl0VLSOuQbKdfaT4NldpQ5:APA91bFRZMSwjlSd-IEDLlcMBbmNMXwxAWsIosWQ2u0nFodUg9NXdXkA1VQFPdL_UmLmh7c9wiCinpPHt3LwEhyf2I-LVqepbx1Zap75rU4LPl576N3AEZA','in_progress','Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','failed','All retry attempts failed',3,'2026-06-29 07:22:54');
/*!40000 ALTER TABLE `notification_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notification_preferences` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `approved` tinyint(1) DEFAULT '1',
  `in_progress` tinyint(1) DEFAULT '1',
  `completed` tinyint(1) DEFAULT '1',
  `verified` tinyint(1) DEFAULT '1',
  `false_report` tinyint(1) DEFAULT '1',
  `created_at` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `notification_preferences_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
INSERT INTO `notification_preferences` VALUES (1,1,1,1,1,1,1,'2026-04-26 12:07:09','2026-04-26 12:07:18');
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `message` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'info',
  `report_id` int DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=70 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (1,2,'Status Laporan #1 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Terverifikasi','status_update',1,0,'2026-04-10 02:44:54'),(2,2,'Status Laporan #1 Diperbarui','Status laporan Anda telah diperbarui menjadi: 🚒 Unit Dikirim','status_update',1,0,'2026-04-10 02:45:02'),(3,2,'Status Laporan #1 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Selesai','status_update',1,0,'2026-04-10 02:45:28'),(4,1,'Status Laporan #2 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Terverifikasi','status_update',2,1,'2026-04-10 07:09:48'),(5,1,'Status Laporan #2 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Selesai','status_update',2,1,'2026-04-10 07:14:06'),(6,1,'Status Laporan #2 Diperbarui','Status laporan Anda telah diperbarui menjadi: 🚒 Unit Dikirim','status_update',2,1,'2026-04-10 07:14:17'),(7,1,'Status Laporan #2 Diperbarui','Status laporan Anda telah diperbarui menjadi: ⚠️ Laporan Palsu','status_update',2,1,'2026-04-10 07:14:27'),(8,1,'Status Laporan #2 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Selesai','status_update',2,1,'2026-04-10 07:14:36'),(9,1,'Status Laporan #4 Diperbarui','Status laporan Anda telah diperbarui menjadi: 🚒 Unit Dikirim','status_update',4,0,'2026-04-17 10:48:12'),(10,1,'Status Laporan #5 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Terverifikasi','status_update',5,0,'2026-04-20 10:36:20'),(11,1,'Status Laporan #5 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Selesai','status_update',5,0,'2026-04-20 10:39:06'),(12,1,'Status Laporan #4 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Selesai','status_update',4,0,'2026-04-20 10:39:09'),(13,1,'Status Laporan #3 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Selesai','status_update',3,0,'2026-04-20 10:39:13'),(14,1,'Status Laporan #6 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Terverifikasi','status_update',6,0,'2026-04-26 05:09:58'),(15,1,'Status Laporan #6 Diperbarui','Status laporan Anda telah diperbarui menjadi: 🔄 Sedang Ditangani','status_update',6,0,'2026-04-26 05:10:09'),(16,1,'Status Laporan #6 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Terverifikasi','status_update',6,0,'2026-04-26 05:23:11'),(17,1,'Status Laporan #6 Diperbarui','Status laporan Anda telah diperbarui menjadi: ✅ Selesai','status_update',6,0,'2026-04-26 05:23:42'),(18,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',8,1,'2026-06-26 03:09:35'),(19,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',8,0,'2026-06-26 03:09:58'),(20,1,'Laporan Ditolak','Laporan Anda ditandai sebagai laporan palsu','status_update',8,0,'2026-06-26 03:12:09'),(21,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',7,0,'2026-06-28 13:21:48'),(22,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',7,0,'2026-06-29 00:22:54'),(23,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',8,0,'2026-06-29 08:39:41'),(24,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',8,0,'2026-06-29 08:45:32'),(25,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',9,0,'2026-07-02 16:35:30'),(26,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',9,0,'2026-07-02 16:36:07'),(27,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',10,0,'2026-07-02 16:56:02'),(28,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',10,0,'2026-07-02 16:56:10'),(29,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',11,0,'2026-07-02 17:06:55'),(30,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',11,0,'2026-07-02 17:07:02'),(31,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',12,0,'2026-07-02 18:34:53'),(32,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',12,0,'2026-07-02 18:34:56'),(33,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',13,0,'2026-07-07 07:50:15'),(34,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',13,0,'2026-07-07 07:50:33'),(35,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',14,0,'2026-07-07 08:17:25'),(36,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',14,0,'2026-07-07 08:17:38'),(37,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',15,0,'2026-07-11 13:07:49'),(38,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',16,0,'2026-07-12 15:59:09'),(39,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:26'),(40,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:32'),(41,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:34'),(42,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:34'),(43,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:35'),(44,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:35'),(45,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:35'),(46,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:36'),(47,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:36'),(48,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:36'),(49,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:36'),(50,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:37'),(51,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:37'),(52,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:37'),(53,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:37'),(54,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:37'),(55,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:38'),(56,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',16,0,'2026-07-12 15:59:53'),(57,1,'Laporan Selesai','Laporan Anda telah diselesaikan','status_update',16,0,'2026-07-12 16:06:38'),(58,1,'Laporan Terverifikasi','Laporan Anda telah diverifikasi oleh petugas','status_update',17,0,'2026-07-12 16:13:49'),(59,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',17,0,'2026-07-12 16:13:57'),(60,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',17,0,'2026-07-12 17:56:45'),(61,1,'Laporan Selesai','Laporan Anda telah diselesaikan','status_update',15,0,'2026-07-12 18:06:32'),(62,1,'Laporan Selesai','Laporan Anda telah diselesaikan','status_update',15,0,'2026-07-12 18:06:32'),(63,1,'Laporan Selesai','Laporan Anda telah diselesaikan','status_update',15,0,'2026-07-12 18:06:32'),(64,1,'Laporan Selesai','Laporan Anda telah diselesaikan','status_update',15,0,'2026-07-12 18:06:32'),(65,1,'Laporan Selesai','Laporan Anda telah diselesaikan','status_update',15,0,'2026-07-12 18:06:32'),(66,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',17,0,'2026-07-12 18:06:58'),(67,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',17,0,'2026-07-12 18:10:13'),(68,1,'Laporan Sedang Ditangani','Petugas sedang menangani laporan Anda','status_update',17,0,'2026-07-12 18:11:45'),(69,1,'Laporan Selesai','Laporan Anda telah diselesaikan\n\nCatatan petugas: sudah aman','status_update',17,0,'2026-07-12 18:13:05');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `operators`
--

DROP TABLE IF EXISTS `operators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `operators` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `operators`
--

LOCK TABLES `operators` WRITE;
/*!40000 ALTER TABLE `operators` DISABLE KEYS */;
INSERT INTO `operators` VALUES (1,'operator','$2b$10$MKqxM6wNuL/e2IlnY4jqoOMxdOfgwHezkZGhbGv7.TIoejv6IHo3q','2026-04-10 02:28:13');
/*!40000 ALTER TABLE `operators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_attempts`
--

DROP TABLE IF EXISTS `otp_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `otp_attempts` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `otp_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `type` enum('register','login') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'login',
  `expires_at` timestamp NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_attempts`
--

LOCK TABLES `otp_attempts` WRITE;
/*!40000 ALTER TABLE `otp_attempts` DISABLE KEYS */;
INSERT INTO `otp_attempts` VALUES (10,'mohfahrezi93@gmail.com','595d7fc1801a8cb110f3c406bf26f24c0a0c2b97b82f10c2fc2352b23ad5be58','login','2026-04-21 05:49:03','2026-04-21 12:39:03'),(12,'budi@example.com','b2570302e70042f9a3e9df80b80c0f5ca9e30940ad0338693c6cdc4e0522ea42','register','2026-07-11 08:25:17','2026-07-11 08:20:17'),(13,'6285872381791','91fb63533b2b6b82cba764a1d3b828099defebc711f3c6128baeb5f1e32b1bc4','login','2026-07-12 18:03:09','2026-07-12 17:53:09');
/*!40000 ALTER TABLE `otp_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reports`
--

DROP TABLE IF EXISTS `reports`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reports` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int DEFAULT NULL,
  `guest_name` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fire_latitude` decimal(10,8) NOT NULL,
  `fire_longitude` decimal(11,8) NOT NULL,
  `reporter_latitude` decimal(10,8) DEFAULT NULL,
  `reporter_longitude` decimal(11,8) DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `address` text COLLATE utf8mb4_unicode_ci,
  `media_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'pending',
  `admin_notes` text COLLATE utf8mb4_unicode_ci,
  `notes` text COLLATE utf8mb4_unicode_ci,
  `contact` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `category_id` int DEFAULT '1',
  `kelurahan_id` int DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `assigned_petugas_id` int DEFAULT NULL,
  `status_petugas` enum('pending','accepted','arrived','completed','false_report','escalated_to_damkar') COLLATE utf8mb4_unicode_ci DEFAULT 'pending',
  `dispatched_at` datetime DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `arrived_at` datetime DEFAULT NULL,
  `completed_at` datetime DEFAULT NULL,
  `completion_photo_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `response_time_seconds` int DEFAULT NULL,
  `needs_backup` tinyint(1) DEFAULT '0',
  `petugas_notes` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `category_id` (`category_id`),
  KEY `kelurahan_id` (`kelurahan_id`),
  CONSTRAINT `reports_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reports_ibfk_2` FOREIGN KEY (`category_id`) REFERENCES `disaster_categories` (`id`) ON DELETE SET NULL,
  CONSTRAINT `reports_ibfk_3` FOREIGN KEY (`kelurahan_id`) REFERENCES `kelurahan` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reports`
--

LOCK TABLES `reports` WRITE;
/*!40000 ALTER TABLE `reports` DISABLE KEYS */;
INSERT INTO `reports` VALUES (1,2,NULL,-2.97417250,104.73461233,-2.97436143,104.73483603,'Kebakaran rumah','',NULL,'completed',NULL,'','',1,2,'2026-04-10 02:43:59','2026-04-10 02:45:28',NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(2,1,NULL,-2.98450000,104.77940000,NULL,NULL,'kebakaran rumah','jalan plaju','/uploads/1775830057118-img.jpg','completed',NULL,'ada korban','08123456789',1,2,'2026-04-10 07:07:37','2026-04-10 14:14:36',NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(3,1,NULL,-2.97355061,104.73461434,-2.97426220,104.73472510,'rawa kebakaran',NULL,NULL,'completed',NULL,NULL,NULL,1,5,'2026-04-12 07:39:04','2026-04-20 17:39:13',NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(4,1,NULL,-2.97440235,104.73475280,-2.97449878,104.73574503,'AssAs','Jalan Raya Palembang Prabumulih, Jl. Sarjana Lingkar Sumatera, Timbangan, Kec. Indralaya, Kabupaten Ogan Ilir, Sumatera Selatan 30862','/uploads/1776445561422-img.jpg','completed',NULL,'','',4,2,'2026-04-17 10:06:01','2026-04-20 17:39:09',NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(5,1,NULL,-2.97409382,104.73455699,NULL,NULL,'sdsdgfsdgsdf','gdsfgdfg','/uploads/1776706525771-img.jpg','completed',NULL,'','',1,2,'2026-04-20 10:35:25','2026-04-20 17:39:06',NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(6,1,NULL,-2.97429020,104.73469930,-2.97429020,104.73469930,'ADA BUAYA','JL MERDEKA','/uploads/1776775891655-img.jpg','completed',NULL,NULL,'085872381791',2,2,'2026-04-21 05:51:31','2026-04-26 12:23:42',NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(7,1,NULL,-2.98517875,104.73233591,-2.98598454,104.73232269,'Kebakaran rumah warga','Jl. Merdeka no 1','https://res.cloudinary.com/dsbdjzrin/image/upload/v1782441630/siagabencana/reports/tqaqej3mektqvjdhqaq1.jpg','completed',NULL,'','',1,5,'2026-06-26 02:40:31','2026-06-29 08:36:48',3,'completed','2026-06-29 07:22:51','2026-06-29 07:28:13','2026-06-29 07:28:30','2026-06-29 07:28:43','https://res.cloudinary.com/dsbdjzrin/image/upload/v1700000000/placeholder_fire_extinguished.jpg',352,0,NULL),(8,1,NULL,-2.98516837,104.73226410,-2.98516837,104.73226410,'Kebakaran rumah warga','Jl Merdeka','https://res.cloudinary.com/dsbdjzrin/image/upload/v1782443322/siagabencana/reports/wliogphpa58mfngntkf9.jpg','completed',NULL,'','',1,2,'2026-06-26 03:08:42','2026-07-02 16:28:40',3,'completed','2026-06-29 15:45:30','2026-06-29 15:46:48','2026-07-02 23:26:36','2026-07-02 23:28:40','https://res.cloudinary.com/dsbdjzrin/image/upload/v1700000000/placeholder_fire_extinguished.jpg',286990,0,NULL),(9,1,NULL,-6.70631624,108.56568100,NULL,NULL,'ADSSADASDASDD','Jalan Raya Palembang Prabumulih, Jl. Sarjana Lingkar Sumatera, Timbangan, Kec. Indralaya, Kabupaten Ogan Ilir, Sumatera Selatan 30862','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783010017/siagabencana/reports/bkucg9cnlh0i2xwt5t9i.jpg','completed',NULL,'','',4,5,'2026-07-02 16:33:38','2026-07-02 16:46:00',3,'completed','2026-07-02 23:36:07','2026-07-02 23:45:41','2026-07-02 23:45:57','2026-07-02 23:46:00','https://res.cloudinary.com/dsbdjzrin/image/upload/v1700000000/placeholder_fire_extinguished.jpg',593,0,NULL),(10,1,NULL,-6.70631448,108.56568100,NULL,NULL,'gsdgsdgsdfgfds','Jalan Raya Palembang Prabumulih, Jl. Sarjana Lingkar Sumatera, Timbangan, Kec. Indralaya, Kabupaten Ogan Ilir, Sumatera Selatan 30862','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783011345/siagabencana/reports/uqkymg3btntepnynnka3.jpg','completed',NULL,'','',3,4,'2026-07-02 16:55:46','2026-07-02 17:03:09',3,'completed','2026-07-02 23:56:10','2026-07-03 00:01:47','2026-07-03 00:02:51','2026-07-03 00:03:09','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783011788/siagabencana/completion_photos/wv91vfvujkoetrtwodoj.jpg',419,0,NULL),(11,1,NULL,-3.00645322,104.79181010,NULL,NULL,'Sfsadfsad','Jl Merdeka Lorong Melati','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783011995/siagabencana/reports/vykuqij3dwxtynaewar1.jpg','completed',NULL,'','',1,5,'2026-07-02 17:06:35','2026-07-02 18:15:43',3,'completed','2026-07-03 00:07:02','2026-07-03 00:11:01','2026-07-03 01:15:23','2026-07-03 01:15:43','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783016142/siagabencana/completion_photos/cwdwim2jryqwvpqrytq4.jpg',4121,0,NULL),(12,1,NULL,-6.70676754,108.56575731,NULL,NULL,'dftfhgfgjh','dfigidsjisdfgdfgdfsdgd','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783017274/siagabencana/reports/naiurrxssvvxdsihlywm.jpg','completed',NULL,'','',5,6,'2026-07-02 18:34:35','2026-07-02 18:36:12',3,'completed','2026-07-03 01:34:56','2026-07-03 01:35:44','2026-07-03 01:35:54','2026-07-03 01:36:12','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783017371/siagabencana/completion_photos/y9szkhog8er2jsmdqosd.jpg',76,0,NULL),(13,1,NULL,-6.70631448,108.56568100,-6.70631448,108.56568100,'AALSLDALDL','Jalan Raya Palembang Prabumulih, Jl. Sarjana Lingkar Sumatera, Timbangan, Kec. Indralaya, Kabupaten Ogan Ilir, Sumatera Selatan 30862','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783410575/siagabencana/reports/oqgib7fxx1kanaemapz3.jpg','completed',NULL,'','',3,4,'2026-07-07 07:49:35','2026-07-07 08:06:03',3,'completed','2026-07-07 14:50:33','2026-07-07 15:05:33','2026-07-07 15:05:43','2026-07-07 15:06:03','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783411563/siagabencana/completion_photos/hoafuxh0ashge3siguff.jpg',930,0,NULL),(14,1,NULL,-6.70631624,108.56568100,NULL,NULL,'sgsdgsdfgsdfgsd','dfigidsjisdfgdfgdfsdgd','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783412235/siagabencana/reports/u1btwemjzxlw1snc10kt.jpg','false_report',NULL,'','',2,4,'2026-07-07 08:17:15','2026-07-07 08:18:53',3,'false_report','2026-07-07 15:17:37','2026-07-07 15:18:18','2026-07-07 15:18:26','2026-07-07 15:18:53',NULL,76,0,NULL),(15,1,NULL,-6.71041025,108.53686179,NULL,NULL,'kjsdkjgnsjknfjlkdgjsllds','Jalan Raya Palembang Prabumulih, Jl. Sarjana Lingkar Sumatera, Timbangan, Kec. Indralaya, Kabupaten Ogan Ilir, Sumatera Selatan 30862','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783775154/siagabencana/reports/iyp3t4mzt3st58epsqlb.jpg','completed','\n[URGENT] Petugas meminta bantuan armada tambahan (SOS)!','','',2,5,'2026-07-11 13:05:54','2026-07-12 18:06:31',3,'completed','2026-07-11 20:07:46','2026-07-11 20:10:26','2026-07-11 20:10:31','2026-07-11 20:35:08','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783776907/siagabencana/completion_photos/goqsud2p4ubxqyuzgtzv.jpg',1642,0,'test'),(16,1,NULL,-2.98140739,104.75015351,NULL,NULL,'sdfhdfhfghdhdhfg','Jl Merdeka Lorong Melati','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783871913/siagabencana/reports/ymvnb2wgk96nlkv156es.jpg','completed',NULL,'','',2,5,'2026-07-12 15:58:34','2026-07-12 16:06:38',NULL,'pending','2026-07-12 22:59:38',NULL,NULL,NULL,NULL,NULL,0,NULL),(17,1,NULL,-2.96567867,104.73047401,NULL,NULL,'srdgsdrfgdfhfd','Jl Merdeka','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783872683/siagabencana/reports/odufkq4ngsk4tz4ya4in.jpg','completed','\n[URGENT] Petugas meminta bantuan armada tambahan (SOS)!\n[URGENT] Petugas meminta bantuan armada tambahan (SOS)!\n[URGENT] Petugas meminta bantuan armada tambahan (SOS)!','','',4,6,'2026-07-12 16:11:24','2026-07-12 18:13:05',3,'completed','2026-07-13 00:56:42','2026-07-13 01:03:56','2026-07-13 01:04:20','2026-07-13 01:13:05','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783879984/siagabencana/completion_photos/uqoaxwnxmstf7wxlhkwc.jpg',983,0,'sudah aman'),(18,NULL,NULL,-6.70631448,108.56568100,-6.70631448,108.56568100,'Pelapor (Tanpa Login): sdrgsdrgsrsgdr\n\ndfghfdghdfhdfhdfghfgd','Alamat tidak spesifik (Lapor Cepat)','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783875981/siagabencana/reports/rrss3qnaljygo9hnwzz5.png','verified',NULL,NULL,'6285872381791',3,NULL,'2026-07-12 17:06:22','2026-07-12 17:07:36',NULL,'pending',NULL,NULL,NULL,NULL,NULL,NULL,0,NULL),(19,NULL,NULL,-6.70631500,108.56568100,-6.70631500,108.56568100,'Pelapor (Tanpa Login): pak budi\n\napi mulai membara','Alamat tidak spesifik (Lapor Cepat)','https://res.cloudinary.com/dsbdjzrin/image/upload/v1783878303/siagabencana/reports/bnj6elt7osyurrdhcat8.png','dispatched',NULL,NULL,'6285872381791',1,4,'2026-07-12 17:45:06','2026-07-12 17:48:59',NULL,'pending','2026-07-13 00:48:58',NULL,NULL,NULL,NULL,NULL,0,NULL);
/*!40000 ALTER TABLE `reports` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone_number` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_verified` tinyint(1) DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `role` enum('user','operator','petugas') COLLATE utf8mb4_unicode_ci DEFAULT 'user',
  `kelurahan_id` int DEFAULT NULL,
  `is_on_duty` tinyint(1) DEFAULT '0',
  `last_latitude` decimal(10,8) DEFAULT NULL,
  `last_longitude` decimal(11,8) DEFAULT NULL,
  `last_location_update` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Fahrezi','mohfahrezi93@gmail.com','085872381791','$2b$10$ZL6c//wHQPw09sOC1vBaVOZodLqb/PTwDLTvnSAE/APvvX9T7Of6.',1,'2026-04-10 02:29:52','2026-04-12 14:31:34','user',NULL,0,NULL,NULL,NULL),(2,'Ahmad','ahmadfatih048@gmail.com',NULL,NULL,1,'2026-04-10 02:38:43','2026-04-10 02:38:43','user',NULL,0,NULL,NULL,NULL),(3,'Petugas Satu','petugas1@fireguard.com','08123456789','$2b$10$Kw.l1TXmiRAMcg8DVZn1XOFpGcA22g.n922C13a/ceLzHLhAZJdia',1,'2026-06-29 00:10:12','2026-07-02 18:16:09','petugas',2,1,NULL,NULL,NULL),(4,'Ahmad Budi','budi@siagabencana.cloud','081234567890','$2b$10$CCY.4s1f1L1/tkfEytOgZOWfViDoxxgnjTG2/4efKI0wgzTy.YwD6',1,'2026-07-11 13:59:49','2026-07-11 14:00:50','petugas',NULL,0,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-07-13 15:02:52
