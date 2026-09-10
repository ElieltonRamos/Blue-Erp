/*
  Warnings:

  - A unique constraint covering the columns `[document_id]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `companies` ADD COLUMN `business_type` ENUM('RESTAURANTE', 'OFICINA', 'VAREJO', 'PDV') NOT NULL DEFAULT 'PDV',
    ADD COLUMN `enabled_menus` JSON NULL;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `document_id` INTEGER NULL;

-- CreateTable
CREATE TABLE `business_partners` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('SUPPLIER', 'EMPLOYEE', 'CARRIER', 'ACCOUNTANT', 'BANK') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `document` VARCHAR(191) NULL,
    `phone` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `business_partners_document_key`(`document`),
    INDEX `business_partners_type_idx`(`type`),
    INDEX `business_partners_document_idx`(`document`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `client_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `assets_client_id_idx`(`client_id`),
    INDEX `assets_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_attributes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asset_id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `asset_attributes_key_idx`(`key`),
    UNIQUE INDEX `asset_attributes_asset_id_key_key`(`asset_id`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `services` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `estimated_time` INTEGER NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `services_code_key`(`code`),
    INDEX `services_code_idx`(`code`),
    INDEX `services_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('QUOTE', 'SERVICE_ORDER', 'SALE', 'PURCHASE_ORDER', 'TIMESHEET') NOT NULL,
    `status` ENUM('DRAFT', 'APPROVED', 'IN_PROGRESS', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
    `client_id` INTEGER NOT NULL,
    `asset_id` INTEGER NULL,
    `responsible_id` INTEGER NULL,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `approved_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `documents_type_idx`(`type`),
    INDEX `documents_status_idx`(`status`),
    INDEX `documents_client_id_idx`(`client_id`),
    INDEX `documents_asset_id_idx`(`asset_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `document_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('PRODUCT', 'SERVICE') NOT NULL,
    `document_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `service_id` INTEGER NULL,
    `mechanic_id` INTEGER NULL,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `document_items_document_id_idx`(`document_id`),
    INDEX `document_items_product_id_idx`(`product_id`),
    INDEX `document_items_service_id_idx`(`service_id`),
    INDEX `document_items_mechanic_id_idx`(`mechanic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchases` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `status` ENUM('DRAFT', 'ORDERED', 'RECEIVED', 'CANCELED') NOT NULL DEFAULT 'DRAFT',
    `supplier_id` INTEGER NOT NULL,
    `responsible_id` INTEGER NULL,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `invoice_number` VARCHAR(191) NULL,
    `fiscal_key` VARCHAR(191) NULL,
    `fiscal_xml` LONGTEXT NULL,
    `supplier_cnpj` VARCHAR(191) NULL,
    `ordered_at` DATETIME(3) NULL,
    `received_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `purchases_fiscal_key_key`(`fiscal_key`),
    INDEX `purchases_status_idx`(`status`),
    INDEX `purchases_supplier_id_idx`(`supplier_id`),
    INDEX `purchases_fiscal_key_idx`(`fiscal_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `purchase_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `purchase_id` INTEGER NOT NULL,
    `product_id` INTEGER NULL,
    `material_id` INTEGER NULL,
    `supplier_product_code` VARCHAR(191) NULL,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `unit_cost` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `purchase_items_purchase_id_idx`(`purchase_id`),
    INDEX `purchase_items_product_id_idx`(`product_id`),
    INDEX `purchase_items_material_id_idx`(`material_id`),
    INDEX `purchase_items_supplier_product_code_idx`(`supplier_product_code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `sales_document_id_key` ON `sales`(`document_id`);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets` ADD CONSTRAINT `assets_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_attributes` ADD CONSTRAINT `asset_attributes_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents` ADD CONSTRAINT `documents_responsible_id_fkey` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items` ADD CONSTRAINT `document_items_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items` ADD CONSTRAINT `document_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items` ADD CONSTRAINT `document_items_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items` ADD CONSTRAINT `document_items_mechanic_id_fkey` FOREIGN KEY (`mechanic_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_supplier_id_fkey` FOREIGN KEY (`supplier_id`) REFERENCES `business_partners`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchases` ADD CONSTRAINT `purchases_responsible_id_fkey` FOREIGN KEY (`responsible_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `purchase_items` ADD CONSTRAINT `purchase_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `primary_materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
