-- MySQL dump 10.13  Distrib 8.0.45, for Linux (x86_64)
--
-- Host: 127.0.0.1    Database: db_blue_erp
-- ------------------------------------------------------
-- Server version	8.0.32

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
-- Table structure for table `_prisma_migrations`
--

DROP TABLE IF EXISTS `_prisma_migrations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `_prisma_migrations` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `checksum` varchar(64) COLLATE utf8mb4_unicode_ci NOT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `migration_name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `logs` text COLLATE utf8mb4_unicode_ci,
  `rolled_back_at` datetime(3) DEFAULT NULL,
  `started_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `applied_steps_count` int unsigned NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_prisma_migrations`
--

LOCK TABLES `_prisma_migrations` WRITE;
/*!40000 ALTER TABLE `_prisma_migrations` DISABLE KEYS */;
INSERT INTO `_prisma_migrations` VALUES ('081fd7a3-97b7-4e74-bc2c-40f2e329fbf9','5bbbee00ec7c03a085781f72610011a35bee7b1a94b023b97d30c18d4199f654','2026-02-12 22:46:56.622','20260204022327_create_expense_model',NULL,NULL,'2026-02-12 22:46:56.478',1),('109ec95b-6e9c-4aff-a053-7a0dd9be0ede','6a77ec1dc6ffe27cb0d78cb098d86e49fa64fff7ff81e9ec85026b5e1dcb01b0','2026-02-12 22:46:56.424','20260201001400_create_users_table',NULL,NULL,'2026-02-12 22:46:56.361',1),('13bbb741-4234-4b78-ab5c-a12a7ed53557','10c889e6f11f0fdedbd77056d2225c195325e00effdb55b4514259b9be4edc55','2026-02-12 22:46:56.473','20260204001055_create_ibpt_table',NULL,NULL,'2026-02-12 22:46:56.429',1),('152ef1d6-9002-4a22-b454-de97b2b60bcb','7fa5abf4a35a4b995d26cfe0fdd506dfead2fc1e1bf5ea0803f260158c66f34d','2026-02-12 22:46:57.533','20260204225415_create_products_primary_material_sales',NULL,NULL,'2026-02-12 22:46:56.625',1),('17f8493b-99b7-458c-bca2-2e8c41222cdc','7a99618628565e43a6e1dd0f63b9743a83d02552be53def557636ce8ef87a6a8','2026-02-12 22:46:57.953','20260206175250_add_orders_table',NULL,NULL,'2026-02-12 22:46:57.666',1),('1cc47019-d4ca-4c45-a888-92bdfc03af83','189f1c9187c9db84fb57fe7ed3d8d96a9193b36a0b04b03389ab9346da9bff11','2026-02-12 22:46:56.310','20260106192728_create_clients_table',NULL,NULL,'2026-02-12 22:46:56.260',1),('27470e10-6b46-4556-82c2-cf7c743bc3bc','0fa425a5aeaed159b3d780b3e239361806865ae3830880c87f941c160f47405f','2026-02-12 22:46:57.568','20260204231101_add_min_stock_and_expiry_date_to_primary_material',NULL,NULL,'2026-02-12 22:46:57.536',1),('3ccd8d54-1b18-42b7-ba12-f6db3e449a7f','ea67c1313ea56040d95b08e1018bcbd5fa3571315bc405012e4f37b5f79614fd','2026-02-12 22:46:58.023','20260207132134_add_x_prod_to_sale_items',NULL,NULL,'2026-02-12 22:46:57.989',1),('7aa8743a-8cf0-42be-9cf1-c9b53f6a7a63','febb41e1c6064db5a59ee5cf1263d47e9d5f36484740543da943e38695922898','2026-02-12 22:46:57.662','20260206025921_add_extra_costs_products',NULL,NULL,'2026-02-12 22:46:57.620',1),('8d413101-525b-4ca5-81d9-5f854c5956d3','6f200764279d3f3e3ef5e1f7f96d0c424388f85fedbd02bec8cfaa92bdd1da42','2026-02-12 22:46:58.172','20260207143534_add_production',NULL,NULL,'2026-02-12 22:46:58.026',1),('98a11ad5-f9fc-471f-87ee-2ae7769009d6','aae84fecd97992311473974f7cc5668581a47f92190117ac62e6344353463de0','2026-02-12 22:46:56.356','20260201001147_create_companies_table',NULL,NULL,'2026-02-12 22:46:56.313',1),('a08c38c9-413a-4ae4-89f2-eb598bf24cbf','41a5aaa96c41eb5d0816299f23c812cfe5ad23b408717f8319fa12df89471236','2026-02-12 22:46:58.486','20260212120022_add_tables',NULL,NULL,'2026-02-12 22:46:58.298',1),('b7619be1-b06c-40da-982d-6348503bb565','ee2145361ed89a5175ab94202860fcccf9d01f54ebfa07b97e9d7f165328f37a','2026-02-12 22:46:57.985','20260207000250_add_paid_status_to_order',NULL,NULL,'2026-02-12 22:46:57.957',1),('b8fa2dc1-832a-40d8-a5bb-29ab063964ac','799d903d90089a843f2800f999ceb9f8776d4411995653bf9dac8e7f7b91f799','2026-02-12 22:46:58.293','20260209122557_add_production_locations_table',NULL,NULL,'2026-02-12 22:46:58.175',1),('f79a1cfd-64bf-426d-a818-2d041dbc29c2','781c56909f6100da5998b5a9750f7f3016e1552103427b67ed7f0832d22433a0','2026-02-12 22:46:57.614','20260205115746_add',NULL,NULL,'2026-02-12 22:46:57.572',1);
/*!40000 ALTER TABLE `_prisma_migrations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (1,'Bebidas',1,'2026-02-12 22:51:49.479','2026-02-12 22:51:49.479'),(2,'Lanches',1,'2026-02-12 22:51:49.488','2026-02-12 22:51:49.488'),(3,'Sobremesas',1,'2026-02-12 22:51:49.498','2026-02-12 22:51:49.498'),(4,'Pratos Principais',1,'2026-02-12 22:51:49.507','2026-02-12 22:51:49.507');
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clients`
--

DROP TABLE IF EXISTS `clients`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clients` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cpf` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `clients_cpf_key` (`cpf`),
  KEY `clients_cpf_idx` (`cpf`),
  KEY `clients_phone_idx` (`phone`),
  KEY `clients_active_idx` (`active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clients`
--

LOCK TABLES `clients` WRITE;
/*!40000 ALTER TABLE `clients` DISABLE KEYS */;
INSERT INTO `clients` VALUES (1,'Clientes Avista','00000000000','Sem Endereco','00000000000',1,'2026-02-12 22:51:49.701','2026-02-12 22:51:49.701'),(2,'Maria Santos','11912345678','Av. Paulista, 1000 - Bela Vista - São Paulo/SP','98765432109',1,'2026-02-12 22:51:49.710','2026-02-12 22:51:49.710');
/*!40000 ALTER TABLE `clients` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `companies`
--

DROP TABLE IF EXISTS `companies`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `companies` (
  `id` int NOT NULL AUTO_INCREMENT,
  `cnpj` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `corporate_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `trade_name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state_registration` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tax_regime` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `street` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `number` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `complement` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `neighborhood` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `city_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `state` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `zip_code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `phone` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `nfce_series` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nfce_current_number` int NOT NULL DEFAULT '1',
  `nfce_environment` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'staging',
  `nfce_csc` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nfce_csc_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_path` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `certificate_expiration_date` datetime(3) DEFAULT NULL,
  `ibpt_version` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '4.0',
  `license_key` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `license_token` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `companies_cnpj_key` (`cnpj`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `companies`
--

LOCK TABLES `companies` WRITE;
/*!40000 ALTER TABLE `companies` DISABLE KEYS */;
INSERT INTO `companies` VALUES (1,'12345678000190','Restaurante Bom Sabor LTDA','Bom Sabor','123456789','1','Rua das Flores','456','Loja 1','Centro','São Paulo','3550308','SP','01310100','11987654321','contato@bomsabor.com.br','1',1,'staging','HOMOLOGACAO-CSC-EXEMPLO','1','/certificates/bomsabor.pfx','certificado123','2026-12-31 00:00:00.000','4.0','LIC-2024-BOMSABOR','TOKEN-XYZ-123','2026-02-12 22:51:49.188','2026-02-12 22:51:49.188');
/*!40000 ALTER TABLE `companies` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `composition_items`
--

DROP TABLE IF EXISTS `composition_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `composition_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `quantity` decimal(10,3) NOT NULL,
  `product_id` int NOT NULL,
  `material_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `composition_items_product_id_material_id_key` (`product_id`,`material_id`),
  KEY `composition_items_product_id_idx` (`product_id`),
  KEY `composition_items_material_id_idx` (`material_id`),
  CONSTRAINT `composition_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `primary_materials` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `composition_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `composition_items`
--

LOCK TABLES `composition_items` WRITE;
/*!40000 ALTER TABLE `composition_items` DISABLE KEYS */;
INSERT INTO `composition_items` VALUES (1,0.300,3,3,'2026-02-12 22:51:49.680','2026-02-12 22:51:49.680'),(2,0.400,4,3,'2026-02-12 22:51:49.680','2026-02-12 22:51:49.680'),(3,0.150,5,1,'2026-02-12 22:51:49.680','2026-02-12 22:51:49.680'),(4,0.100,6,1,'2026-02-12 22:51:49.680','2026-02-12 22:51:49.680');
/*!40000 ALTER TABLE `composition_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `expenses`
--

DROP TABLE IF EXISTS `expenses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `expenses` (
  `id` int NOT NULL AUTO_INCREMENT,
  `supplier` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `value` decimal(10,2) NOT NULL,
  `date_payment` datetime(3) NOT NULL,
  `status` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `expenses_supplier_idx` (`supplier`),
  KEY `expenses_status_idx` (`status`),
  KEY `expenses_date_payment_idx` (`date_payment`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `expenses`
--

LOCK TABLES `expenses` WRITE;
/*!40000 ALTER TABLE `expenses` DISABLE KEYS */;
INSERT INTO `expenses` VALUES (1,'Distribuidora Alimentos ABC','Compra de insumos - farinha, açúcar e leite',450.00,'2026-02-01 00:00:00.000','PAGO','2026-02-12 22:51:49.725','2026-02-12 22:51:49.725',NULL),(2,'Energia Elétrica - SP','Conta de energia - Janeiro/2026',380.50,'2026-02-05 00:00:00.000','PAGO','2026-02-12 22:51:49.725','2026-02-12 22:51:49.725',NULL),(3,'Fornecedor Carnes Premium','Compra de frango e queijo',620.00,'2026-02-15 00:00:00.000','PENDENTE','2026-02-12 22:51:49.725','2026-02-12 22:51:49.725',NULL);
/*!40000 ALTER TABLE `expenses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ibpt`
--

DROP TABLE IF EXISTS `ibpt`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ibpt` (
  `id` int NOT NULL AUTO_INCREMENT,
  `ncm` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `version` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '4.0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `federal_tax_rate` double NOT NULL,
  `municipal_tax_rate` double NOT NULL,
  `state_tax_rate` double NOT NULL,
  PRIMARY KEY (`id`),
  KEY `ibpt_ncm_idx` (`ncm`),
  KEY `ibpt_version_idx` (`version`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ibpt`
--

LOCK TABLES `ibpt` WRITE;
/*!40000 ALTER TABLE `ibpt` DISABLE KEYS */;
INSERT INTO `ibpt` VALUES (1,'21069090','4.0','2026-02-12 22:51:49.424','2026-02-12 22:51:49.424',13.45,0,18),(2,'19059090','4.0','2026-02-12 22:51:49.439','2026-02-12 22:51:49.439',10.73,0,18),(3,'22021000','4.0','2026-02-12 22:51:49.452','2026-02-12 22:51:49.452',33.89,0,25),(4,'02071400','4.0','2026-02-12 22:51:49.462','2026-02-12 22:51:49.462',4.68,0,12),(5,'04012010','4.0','2026-02-12 22:51:49.470','2026-02-12 22:51:49.470',18.45,0,12);
/*!40000 ALTER TABLE `ibpt` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `kitchen_ready_at` datetime(3) DEFAULT NULL,
  `order_id` int NOT NULL,
  `product_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_items_order_id_idx` (`order_id`),
  KEY `order_items_product_id_idx` (`product_id`),
  CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (1,'PROD005','Sushi de Salmão (8 unidades)',1.000,32.00,32.00,'2026-02-12 23:37:38.037',1,5,'2026-02-12 23:37:19.791','2026-02-12 23:37:38.039'),(2,'PROD003','Picanha na Brasa',1.000,45.00,45.00,'2026-02-13 00:54:24.563',2,3,'2026-02-13 00:54:15.414','2026-02-13 00:54:24.564');
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_productions`
--

DROP TABLE IF EXISTS `order_productions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_productions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_item_id` int NOT NULL,
  `production_location` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `status` enum('PENDING','IN_PROGRESS','COMPLETED','CANCELED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDING',
  `quantity_requested` decimal(10,3) NOT NULL,
  `quantity_produced` decimal(10,3) NOT NULL DEFAULT '0.000',
  `pending_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `started_at` datetime(3) DEFAULT NULL,
  `completed_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `order_productions_order_item_id_idx` (`order_item_id`),
  KEY `order_productions_production_location_idx` (`production_location`),
  KEY `order_productions_status_idx` (`status`),
  KEY `order_productions_pending_at_idx` (`pending_at`),
  KEY `order_productions_started_at_idx` (`started_at`),
  KEY `order_productions_completed_at_idx` (`completed_at`),
  CONSTRAINT `order_productions_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_productions`
--

LOCK TABLES `order_productions` WRITE;
/*!40000 ALTER TABLE `order_productions` DISABLE KEYS */;
INSERT INTO `order_productions` VALUES (1,1,'JAPONESA','COMPLETED',1.000,1.000,'2026-02-12 23:37:19.793','2026-02-12 23:37:30.543','2026-02-12 23:37:38.032',NULL,'2026-02-12 23:37:19.795','2026-02-12 23:37:38.034'),(2,2,'CHURRASCARIA','COMPLETED',1.000,1.000,'2026-02-13 00:54:15.470','2026-02-13 00:54:23.833','2026-02-13 00:54:24.555',NULL,'2026-02-13 00:54:15.471','2026-02-13 00:54:24.557');
/*!40000 ALTER TABLE `order_productions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('DINE_IN','DELIVERY') COLLATE utf8mb4_unicode_ci NOT NULL,
  `customerName` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `table` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `address` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `status` enum('OPEN','CLOSED','CANCELED','PAID') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'OPEN',
  `total` decimal(10,2) NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `kitchen_sent_at` datetime(3) DEFAULT NULL,
  `kitchen_ready_at` datetime(3) DEFAULT NULL,
  `finished_at` datetime(3) DEFAULT NULL,
  `delivered_at` datetime(3) DEFAULT NULL,
  `table_occupied_until` datetime(3) DEFAULT NULL,
  `operator_id` int DEFAULT NULL,
  `location_id` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  PRIMARY KEY (`id`),
  KEY `orders_status_idx` (`status`),
  KEY `orders_type_idx` (`type`),
  KEY `orders_operator_id_idx` (`operator_id`),
  KEY `orders_created_at_idx` (`created_at`),
  KEY `orders_location_id_idx` (`location_id`),
  CONSTRAINT `orders_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'DINE_IN','Joao do Teste','Mesa 1',NULL,'PAID',32.00,'2026-02-12 23:37:13.391','2026-02-12 23:37:58.274',NULL,NULL,NULL,NULL,NULL,1,'JAPONESA'),(2,'DELIVERY','caca',NULL,'Rua teste, 123, cigano, espinosa','PAID',45.00,'2026-02-13 00:54:15.414','2026-02-13 00:55:55.068','2026-02-13 00:54:15.458',NULL,NULL,NULL,NULL,NULL,'DELIVERY');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `preparation_steps`
--

DROP TABLE IF EXISTS `preparation_steps`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `preparation_steps` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order` int NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `product_id` int NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `preparation_steps_product_id_order_key` (`product_id`,`order`),
  KEY `preparation_steps_product_id_idx` (`product_id`),
  CONSTRAINT `preparation_steps_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `preparation_steps`
--

LOCK TABLES `preparation_steps` WRITE;
/*!40000 ALTER TABLE `preparation_steps` DISABLE KEYS */;
INSERT INTO `preparation_steps` VALUES (1,1,'Temperar a picanha com sal grosso',3,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(2,2,'Grelhar na brasa por 15 minutos cada lado',3,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(3,3,'Deixar descansar por 5 minutos',3,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(4,4,'Fatiar e servir',3,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(5,1,'Temperar com sal e especiarias',4,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(6,2,'Assar lentamente por 2 horas',4,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(7,3,'Grelhar para finalizar',4,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(8,1,'Preparar arroz japonês temperado',5,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(9,2,'Fatiar salmão fresco',5,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(10,3,'Montar os sushis',5,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(11,4,'Servir com shoyu e wasabi',5,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(12,1,'Preparar nori e arroz',6,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(13,2,'Adicionar atum e ingredientes',6,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690'),(14,3,'Enrolar em formato de cone',6,'2026-02-12 22:51:49.690','2026-02-12 22:51:49.690');
/*!40000 ALTER TABLE `preparation_steps` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `primary_materials`
--

DROP TABLE IF EXISTS `primary_materials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `primary_materials` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit` enum('UN','KG','LT','MT','CX','ML','GR','DZ') COLLATE utf8mb4_unicode_ci NOT NULL,
  `unit_cost` decimal(10,2) NOT NULL,
  `current_stock` decimal(10,3) NOT NULL DEFAULT '0.000',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `ncm` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cfop` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT '5102',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `expiry_date` datetime(3) DEFAULT NULL,
  `min_stock` decimal(10,3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `primary_materials_code_key` (`code`),
  KEY `primary_materials_code_idx` (`code`),
  KEY `primary_materials_active_idx` (`active`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `primary_materials`
--

LOCK TABLES `primary_materials` WRITE;
/*!40000 ALTER TABLE `primary_materials` DISABLE KEYS */;
INSERT INTO `primary_materials` VALUES (1,'Farinha de Trigo','MAT001','KG',4.50,24.850,1,'11010010','5102','2026-02-12 22:51:49.540','2026-02-12 23:37:38.045',NULL,10.000),(2,'Queijo Muçarela','MAT002','KG',35.00,8.500,1,'04061000','5102','2026-02-12 22:51:49.552','2026-02-12 22:51:49.552','2026-03-15 00:00:00.000',5.000),(3,'Peito de Frango','MAT003','KG',18.00,11.700,1,'02071400','5102','2026-02-12 22:51:49.562','2026-02-13 00:54:24.572','2026-02-20 00:00:00.000',8.000),(4,'Leite Integral','MAT004','LT',5.20,15.000,1,'04012010','5102','2026-02-12 22:51:49.570','2026-02-12 22:51:49.570','2026-02-15 00:00:00.000',10.000),(5,'Açúcar Cristal','MAT005','KG',3.80,20.000,1,'17011100','5102','2026-02-12 22:51:49.581','2026-02-12 22:51:49.581',NULL,8.000);
/*!40000 ALTER TABLE `primary_materials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `production_locations`
--

DROP TABLE IF EXISTS `production_locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `production_locations` (
  `id` int NOT NULL AUTO_INCREMENT,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `description` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `order` int NOT NULL DEFAULT '0',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `production_locations_code_key` (`code`),
  KEY `production_locations_active_idx` (`active`),
  KEY `production_locations_order_idx` (`order`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `production_locations`
--

LOCK TABLES `production_locations` WRITE;
/*!40000 ALTER TABLE `production_locations` DISABLE KEYS */;
INSERT INTO `production_locations` VALUES (1,'JAPONESA','Cozinha Japonesa','Preparo de sushis, sashimis e pratos orientais',1,1,'2026-02-12 22:51:49.518','2026-02-12 22:51:49.518'),(2,'CHURRASCARIA','Churrascaria','Preparo de carnes grelhadas e churrasco',1,2,'2026-02-12 22:51:49.529','2026-02-12 22:51:49.529');
/*!40000 ALTER TABLE `production_locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `code` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `cost_price` decimal(10,2) NOT NULL,
  `ncm` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `cest` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `origin` int NOT NULL,
  `csosn` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cst` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `icms_rate` decimal(5,2) DEFAULT NULL,
  `cst_pis` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `pis_rate` decimal(5,2) DEFAULT NULL,
  `cst_cofins` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `cofins_rate` decimal(5,2) DEFAULT NULL,
  `federal_tax_rate` decimal(5,2) DEFAULT NULL,
  `state_tax_rate` decimal(5,2) DEFAULT NULL,
  `municipal_tax_rate` decimal(5,2) DEFAULT NULL,
  `unit` enum('UN','KG','LT','MT','CX','ML','GR','DZ') COLLATE utf8mb4_unicode_ci NOT NULL,
  `quantity` decimal(10,3) NOT NULL DEFAULT '0.000',
  `min_stock` decimal(10,3) DEFAULT NULL,
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `product_type` enum('MANUFACTURED','RESALE') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'RESALE',
  `category_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `production_location` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `extra_costs` decimal(10,2) NOT NULL DEFAULT '0.00',
  PRIMARY KEY (`id`),
  UNIQUE KEY `products_code_key` (`code`),
  KEY `products_code_idx` (`code`),
  KEY `products_ncm_idx` (`ncm`),
  KEY `products_active_idx` (`active`),
  KEY `products_category_id_idx` (`category_id`),
  CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Coca-Cola 350ml','PROD001',6.00,3.50,'22021000',NULL,0,'102',NULL,NULL,NULL,NULL,NULL,NULL,33.89,25.00,0.00,'UN',48.000,24.000,1,'RESALE',1,'2026-02-12 22:51:49.597','2026-02-12 22:51:49.597',NULL,0.00),(2,'Água Mineral 500ml','PROD002',3.50,1.80,'22011000',NULL,0,'102',NULL,NULL,NULL,NULL,NULL,NULL,18.45,18.00,0.00,'UN',60.000,36.000,1,'RESALE',1,'2026-02-12 22:51:49.619','2026-02-12 22:51:49.619',NULL,0.00),(3,'Picanha na Brasa','PROD003',45.00,22.00,'02071400',NULL,0,'102',NULL,NULL,NULL,NULL,NULL,NULL,4.68,12.00,0.00,'UN',39.000,NULL,1,'MANUFACTURED',4,'2026-02-12 22:51:49.635','2026-02-13 22:36:06.029','CHURRASCARIA',3.00),(4,'Costela Assada','PROD004',38.00,18.50,'02071400',NULL,0,'102',NULL,NULL,NULL,NULL,NULL,NULL,4.68,12.00,0.00,'UN',29.000,NULL,1,'MANUFACTURED',4,'2026-02-12 22:51:49.645','2026-02-13 22:36:06.026','CHURRASCARIA',2.50),(5,'Sushi de Salmão (8 unidades)','PROD005',32.00,14.00,'16041900',NULL,0,'102',NULL,NULL,NULL,NULL,NULL,NULL,10.73,18.00,0.00,'UN',165.000,NULL,1,'MANUFACTURED',4,'2026-02-12 22:51:49.659','2026-02-12 23:40:05.272','JAPONESA',2.00),(6,'Temaki de Atum','PROD006',18.00,8.50,'16041900',NULL,0,'102',NULL,NULL,NULL,NULL,NULL,NULL,10.73,18.00,0.00,'UN',248.000,NULL,1,'MANUFACTURED',4,'2026-02-12 22:51:49.670','2026-02-12 23:40:05.275','JAPONESA',1.50);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sale_items`
--

DROP TABLE IF EXISTS `sale_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sale_items` (
  `id` int NOT NULL AUTO_INCREMENT,
  `item_number` int NOT NULL,
  `sale_id` int NOT NULL,
  `product_id` int NOT NULL,
  `quantity` decimal(10,3) NOT NULL,
  `unit_price` decimal(10,2) NOT NULL,
  `total_price` decimal(10,2) NOT NULL,
  `tax_unit` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tax_quantity` decimal(10,3) DEFAULT NULL,
  `tax_unit_price` decimal(10,2) DEFAULT NULL,
  `composes_total` int NOT NULL DEFAULT '1',
  `cfop` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `total_tax_value` decimal(10,2) DEFAULT NULL,
  `import_tax_value` decimal(10,2) DEFAULT '0.00',
  `iof_value` decimal(10,2) DEFAULT '0.00',
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `x_prod` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `sale_items_sale_id_item_number_key` (`sale_id`,`item_number`),
  KEY `sale_items_sale_id_idx` (`sale_id`),
  KEY `sale_items_product_id_idx` (`product_id`),
  CONSTRAINT `sale_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `sale_items_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sale_items`
--

LOCK TABLES `sale_items` WRITE;
/*!40000 ALTER TABLE `sale_items` DISABLE KEYS */;
INSERT INTO `sale_items` VALUES (1,1,1,1,2.500,45.00,112.50,'UN',2.500,45.00,1,'5102',NULL,0.00,0.00,'2026-02-12 23:24:19.464','2026-02-12 23:24:19.464','Coca-Cola 350ml'),(2,1,2,5,1.000,32.00,32.00,'UN',1.000,32.00,1,'5102',NULL,0.00,0.00,'2026-02-12 23:37:58.266','2026-02-12 23:37:58.266','Sushi de Salmão (8 unidades)'),(3,1,3,1,2.500,45.00,112.50,'UN',2.500,45.00,1,'5102',NULL,0.00,0.00,'2026-02-13 00:27:17.263','2026-02-13 00:27:17.263','Coca-Cola 350ml'),(4,1,4,1,2.500,45.00,112.50,'UN',2.500,45.00,1,'5102',NULL,0.00,0.00,'2026-02-13 00:41:39.851','2026-02-13 00:41:39.851','Coca-Cola 350ml'),(5,1,5,1,2.500,45.00,112.50,'UN',2.500,45.00,1,'5102',NULL,0.00,0.00,'2026-02-13 00:46:15.147','2026-02-13 00:46:15.147','Coca-Cola 350ml'),(6,1,6,3,1.000,45.00,45.00,'UN',1.000,45.00,1,'5102',NULL,0.00,0.00,'2026-02-13 00:55:55.017','2026-02-13 00:55:55.017','Picanha na Brasa');
/*!40000 ALTER TABLE `sale_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sales`
--

DROP TABLE IF EXISTS `sales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `client_id` int NOT NULL,
  `user_operator` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `operator_id` int DEFAULT NULL,
  `date` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `payment_method` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `total_products_without_discount` decimal(10,2) NOT NULL,
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total` decimal(10,2) NOT NULL,
  `profit_sale` decimal(10,2) NOT NULL,
  `is_paid` tinyint(1) NOT NULL DEFAULT '0',
  `cfop` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT '5102',
  `fiscal_status` enum('PENDENTE','EMITIDA','CANCELADA','ERRO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PENDENTE',
  `fiscal_key` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fiscal_protocol` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fiscal_emit_date` datetime(3) DEFAULT NULL,
  `fiscal_xml` longtext COLLATE utf8mb4_unicode_ci,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `sales_client_id_idx` (`client_id`),
  KEY `sales_operator_id_idx` (`operator_id`),
  KEY `sales_date_idx` (`date`),
  KEY `sales_fiscal_status_idx` (`fiscal_status`),
  KEY `sales_fiscal_key_idx` (`fiscal_key`),
  CONSTRAINT `sales_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `sales_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sales`
--

LOCK TABLES `sales` WRITE;
/*!40000 ALTER TABLE `sales` DISABLE KEYS */;
INSERT INTO `sales` VALUES (1,1,'admin',1,'2026-02-12 23:24:19.422','DINHEIRO',112.50,10.50,102.00,93.25,1,'5102','PENDENTE',NULL,NULL,NULL,NULL,'2026-02-12 23:24:19.464','2026-02-12 23:24:19.464'),(2,1,'admin',1,'2026-02-12 23:37:58.258','CARTAO',32.00,0.00,32.00,18.00,1,'5102','PENDENTE',NULL,NULL,NULL,NULL,'2026-02-12 23:37:58.266','2026-02-12 23:37:58.266'),(3,1,'admin',1,'2026-02-13 00:27:17.240','DINHEIRO',112.50,10.50,102.00,93.25,1,'5102','PENDENTE',NULL,NULL,NULL,NULL,'2026-02-13 00:27:17.263','2026-02-13 00:27:17.263'),(4,2,'admin',1,'2026-02-13 00:41:39.836','NOTINHA',112.50,10.50,102.00,93.25,0,'5102','PENDENTE',NULL,NULL,NULL,NULL,'2026-02-13 00:41:39.851','2026-02-13 00:41:39.851'),(5,1,'admin',1,'2026-02-13 00:46:15.142','DINHEIRO',112.50,10.50,102.00,93.25,1,'5102','PENDENTE',NULL,NULL,NULL,NULL,'2026-02-13 00:46:15.147','2026-02-13 00:46:15.147'),(6,2,'admin',1,'2026-02-13 00:55:55.014','NOTINHA',45.00,0.00,45.00,23.00,0,'5102','PENDENTE',NULL,NULL,NULL,NULL,'2026-02-13 00:55:55.017','2026-02-13 00:55:55.017');
/*!40000 ALTER TABLE `sales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tables`
--

DROP TABLE IF EXISTS `tables`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tables` (
  `id` int NOT NULL AUTO_INCREMENT,
  `number` int NOT NULL,
  `capacity` int NOT NULL,
  `status` enum('AVAILABLE','OCCUPIED','RESERVED') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'AVAILABLE',
  `customer` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `time` varchar(191) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `location_id` int NOT NULL,
  `order_id` int DEFAULT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tables_number_location_id_key` (`number`,`location_id`),
  UNIQUE KEY `tables_order_id_key` (`order_id`),
  KEY `tables_location_id_idx` (`location_id`),
  KEY `tables_status_idx` (`status`),
  CONSTRAINT `tables_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `production_locations` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `tables_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tables`
--

LOCK TABLES `tables` WRITE;
/*!40000 ALTER TABLE `tables` DISABLE KEYS */;
INSERT INTO `tables` VALUES (1,1,4,'AVAILABLE',NULL,NULL,1,NULL,'2026-02-12 23:37:04.044','2026-02-12 23:37:54.933');
/*!40000 ALTER TABLE `tables` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `password` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'USER',
  `active` tinyint(1) NOT NULL DEFAULT '1',
  `workplace` varchar(191) COLLATE utf8mb4_unicode_ci NOT NULL,
  `created_at` datetime(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at` datetime(3) NOT NULL,
  `deleted_at` datetime(3) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_username_key` (`username`),
  KEY `users_role_idx` (`role`),
  KEY `users_active_idx` (`active`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'admin','$2b$10$GqmA4Gutrs8WkqL3aWzE0u/GglneHVtxzndG9unBKU6MsmMLbyELW','admin',1,'CHURRASCARIA','2026-02-12 22:51:49.387','2026-02-12 22:51:49.387',NULL),(2,'caixa01','$2b$10$Egv6ICcjPCqGtoEs/CJj5u5TlpQjED138P6fQvZjJbUjMoyEEtggS','caixa',1,'JAPONESA','2026-02-12 22:51:49.413','2026-02-12 22:51:49.413',NULL);
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

-- Dump completed on 2026-02-13 20:20:39
