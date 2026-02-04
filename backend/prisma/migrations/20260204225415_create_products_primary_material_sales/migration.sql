/*
  Warnings:

  - You are about to alter the column `value` on the `expenses` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(10,2)`.
  - You are about to drop the column `aliq_estadual` on the `ibpt` table. All the data in the column will be lost.
  - You are about to drop the column `aliq_federal` on the `ibpt` table. All the data in the column will be lost.
  - You are about to drop the column `aliq_municipal` on the `ibpt` table. All the data in the column will be lost.
  - Added the required column `federal_tax_rate` to the `ibpt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `municipal_tax_rate` to the `ibpt` table without a default value. This is not possible if the table is not empty.
  - Added the required column `state_tax_rate` to the `ibpt` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `expenses` MODIFY `value` DECIMAL(10, 2) NOT NULL;

-- AlterTable
ALTER TABLE `ibpt` DROP COLUMN `aliq_estadual`,
    DROP COLUMN `aliq_federal`,
    DROP COLUMN `aliq_municipal`,
    ADD COLUMN `federal_tax_rate` DOUBLE NOT NULL,
    ADD COLUMN `municipal_tax_rate` DOUBLE NOT NULL,
    ADD COLUMN `state_tax_rate` DOUBLE NOT NULL;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `cost_price` DECIMAL(10, 2) NOT NULL,
    `ncm` VARCHAR(191) NOT NULL,
    `cest` VARCHAR(191) NULL,
    `origin` INTEGER NOT NULL,
    `csosn` VARCHAR(191) NULL,
    `cst` VARCHAR(191) NULL,
    `icms_rate` DECIMAL(5, 2) NULL,
    `cst_pis` VARCHAR(191) NULL,
    `pis_rate` DECIMAL(5, 2) NULL,
    `cst_cofins` VARCHAR(191) NULL,
    `cofins_rate` DECIMAL(5, 2) NULL,
    `federal_tax_rate` DECIMAL(5, 2) NULL,
    `state_tax_rate` DECIMAL(5, 2) NULL,
    `municipal_tax_rate` DECIMAL(5, 2) NULL,
    `unit` ENUM('UN', 'KG', 'LT', 'MT', 'CX', 'ML', 'GR', 'DZ') NOT NULL,
    `quantity` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `min_stock` DECIMAL(10, 3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `product_type` ENUM('MANUFACTURED', 'RESALE') NOT NULL DEFAULT 'RESALE',
    `category_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_code_key`(`code`),
    INDEX `products_code_idx`(`code`),
    INDEX `products_ncm_idx`(`ncm`),
    INDEX `products_active_idx`(`active`),
    INDEX `products_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `user_operator` VARCHAR(191) NOT NULL,
    `operator_id` INTEGER NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `payment_method` VARCHAR(191) NOT NULL,
    `total_products_without_discount` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `profit_sale` DECIMAL(10, 2) NOT NULL,
    `is_paid` BOOLEAN NOT NULL DEFAULT false,
    `cfop` VARCHAR(191) NOT NULL DEFAULT '5102',
    `fiscal_status` ENUM('PENDENTE', 'EMITIDA', 'CANCELADA', 'ERRO') NOT NULL DEFAULT 'PENDENTE',
    `fiscal_key` VARCHAR(191) NULL,
    `fiscal_protocol` VARCHAR(191) NULL,
    `fiscal_emit_date` DATETIME(3) NULL,
    `fiscal_xml` LONGTEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sales_client_id_idx`(`client_id`),
    INDEX `sales_operator_id_idx`(`operator_id`),
    INDEX `sales_date_idx`(`date`),
    INDEX `sales_fiscal_status_idx`(`fiscal_status`),
    INDEX `sales_fiscal_key_idx`(`fiscal_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_number` INTEGER NOT NULL,
    `sale_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `tax_unit` VARCHAR(191) NULL,
    `tax_quantity` DECIMAL(10, 3) NULL,
    `tax_unit_price` DECIMAL(10, 2) NULL,
    `composes_total` INTEGER NOT NULL DEFAULT 1,
    `cfop` VARCHAR(191) NULL,
    `total_tax_value` DECIMAL(10, 2) NULL,
    `import_tax_value` DECIMAL(10, 2) NULL DEFAULT 0,
    `iof_value` DECIMAL(10, 2) NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sale_items_sale_id_idx`(`sale_id`),
    INDEX `sale_items_product_id_idx`(`product_id`),
    UNIQUE INDEX `sale_items_sale_id_item_number_key`(`sale_id`, `item_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `primary_materials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `unit` ENUM('UN', 'KG', 'LT', 'MT', 'CX', 'ML', 'GR', 'DZ') NOT NULL,
    `unit_cost` DECIMAL(10, 2) NOT NULL,
    `current_stock` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `ncm` VARCHAR(191) NULL,
    `cfop` VARCHAR(191) NULL DEFAULT '5102',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `primary_materials_code_key`(`code`),
    INDEX `primary_materials_code_idx`(`code`),
    INDEX `primary_materials_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `composition_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `product_id` INTEGER NOT NULL,
    `material_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `composition_items_product_id_idx`(`product_id`),
    INDEX `composition_items_material_id_idx`(`material_id`),
    UNIQUE INDEX `composition_items_product_id_material_id_key`(`product_id`, `material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preparation_steps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `product_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `preparation_steps_product_id_idx`(`product_id`),
    UNIQUE INDEX `preparation_steps_product_id_order_key`(`product_id`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `composition_items` ADD CONSTRAINT `composition_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `composition_items` ADD CONSTRAINT `composition_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `primary_materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preparation_steps` ADD CONSTRAINT `preparation_steps_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
