/*
Warnings:

- Renomeia a tabela `clients` para `business_partners`, preservando todos os dados.
- Adiciona a coluna `partner_id` em `sales` populada a partir de `client_id` (preserva os 1199 registros existentes).
- Adiciona `type` em `business_partners` com default `CLIENT` (compatível com os dados já existentes).

*/

-- DropForeignKey
ALTER TABLE `sales` DROP FOREIGN KEY `sales_client_id_fkey`;

-- DropIndex
DROP INDEX `sales_client_id_idx` ON `sales`;

-- AlterTable
ALTER TABLE `companies`
ADD COLUMN `business_type` ENUM(
    'RESTAURANTE',
    'OFICINA',
    'VAREJO',
    'PDV'
) NOT NULL DEFAULT 'PDV',
ADD COLUMN `enabled_menus` JSON NULL;

-- Renomear clients -> business_partners preservando os dados
RENAME TABLE `clients` TO `business_partners`;

-- Adicionar coluna type com default (dados existentes viram CLIENT)
ALTER TABLE `business_partners`
ADD COLUMN `type` ENUM(
    'CLIENT',
    'SUPPLIER',
    'EMPLOYEE'
) NOT NULL DEFAULT 'CLIENT',
ADD INDEX `business_partners_type_idx` (`type`);

-- Renomear índices herdados de clients (nomes antigos ainda referenciam "clients")
ALTER TABLE `business_partners`
RENAME INDEX `clients_cpf_key` TO `business_partners_cpf_key`;

ALTER TABLE `business_partners`
RENAME INDEX `clients_cpf_idx` TO `business_partners_cpf_idx`;

ALTER TABLE `business_partners`
RENAME INDEX `clients_phone_idx` TO `business_partners_phone_idx`;

ALTER TABLE `business_partners`
RENAME INDEX `clients_active_idx` TO `business_partners_active_idx`;

-- AlterTable sales: adicionar partner_id NULLABLE primeiro
ALTER TABLE `sales`
ADD COLUMN `document_id` INTEGER NULL,
ADD COLUMN `partner_id` INTEGER NULL;

-- Popular partner_id a partir do client_id antigo (1199 linhas)
UPDATE `sales` SET `partner_id` = `client_id`;

-- Só agora tornar NOT NULL e remover client_id
ALTER TABLE `sales`
MODIFY `partner_id` INTEGER NOT NULL,
DROP COLUMN `client_id`;

-- CreateTable
CREATE TABLE `assets` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `partner_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `assets_partner_id_idx` (`partner_id`),
    INDEX `assets_type_idx` (`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `asset_attributes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `asset_id` INTEGER NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `asset_attributes_key_idx` (`key`),
    UNIQUE INDEX `asset_attributes_asset_id_key_key` (`asset_id`, `key`),
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
    UNIQUE INDEX `services_code_key` (`code`),
    INDEX `services_code_idx` (`code`),
    INDEX `services_active_idx` (`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `documents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM(
        'QUOTE',
        'SERVICE_ORDER',
        'SALE',
        'PURCHASE_ORDER',
        'TIMESHEET'
    ) NOT NULL,
    `status` ENUM(
        'DRAFT',
        'APPROVED',
        'IN_PROGRESS',
        'COMPLETED',
        'CANCELED'
    ) NOT NULL DEFAULT 'DRAFT',
    `partner_id` INTEGER NOT NULL,
    `asset_id` INTEGER NULL,
    `responsible_id` INTEGER NULL,
    `total` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `approved_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    INDEX `documents_type_idx` (`type`),
    INDEX `documents_status_idx` (`status`),
    INDEX `documents_partner_id_idx` (`partner_id`),
    INDEX `documents_asset_id_idx` (`asset_id`),
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
    INDEX `document_items_document_id_idx` (`document_id`),
    INDEX `document_items_product_id_idx` (`product_id`),
    INDEX `document_items_service_id_idx` (`service_id`),
    INDEX `document_items_mechanic_id_idx` (`mechanic_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `sales_document_id_key` ON `sales` (`document_id`);

-- CreateIndex
CREATE INDEX `sales_partner_id_idx` ON `sales` (`partner_id`);

-- AddForeignKey
ALTER TABLE `sales`
ADD CONSTRAINT `sales_partner_id_fkey` FOREIGN KEY (`partner_id`) REFERENCES `business_partners` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales`
ADD CONSTRAINT `sales_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assets`
ADD CONSTRAINT `assets_partner_id_fkey` FOREIGN KEY (`partner_id`) REFERENCES `business_partners` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `asset_attributes`
ADD CONSTRAINT `asset_attributes_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents`
ADD CONSTRAINT `documents_partner_id_fkey` FOREIGN KEY (`partner_id`) REFERENCES `business_partners` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents`
ADD CONSTRAINT `documents_asset_id_fkey` FOREIGN KEY (`asset_id`) REFERENCES `assets` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `documents`
ADD CONSTRAINT `documents_responsible_id_fkey` FOREIGN KEY (`responsible_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items`
ADD CONSTRAINT `document_items_document_id_fkey` FOREIGN KEY (`document_id`) REFERENCES `documents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items`
ADD CONSTRAINT `document_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items`
ADD CONSTRAINT `document_items_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items`
ADD CONSTRAINT `document_items_mechanic_id_fkey` FOREIGN KEY (`mechanic_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;