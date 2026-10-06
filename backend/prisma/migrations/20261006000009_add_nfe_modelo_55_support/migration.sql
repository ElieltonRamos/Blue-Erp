/*
  Warnings:

  - A unique constraint covering the columns `[cnpj]` on the table `clients` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `clients` ADD COLUMN `city` VARCHAR(191) NULL,
    ADD COLUMN `city_code` VARCHAR(191) NULL,
    ADD COLUMN `cnpj` VARCHAR(191) NULL,
    ADD COLUMN `complement` VARCHAR(191) NULL,
    ADD COLUMN `ie_indicator` VARCHAR(191) NULL,
    ADD COLUMN `neighborhood` VARCHAR(191) NULL,
    ADD COLUMN `number` VARCHAR(191) NULL,
    ADD COLUMN `state` VARCHAR(191) NULL,
    ADD COLUMN `state_registration` VARCHAR(191) NULL,
    ADD COLUMN `street` VARCHAR(191) NULL,
    ADD COLUMN `zip_code` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `companies` ADD COLUMN `nfe_current_number` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `nfe_environment` VARCHAR(191) NOT NULL DEFAULT 'staging',
    ADD COLUMN `nfe_series` VARCHAR(191) NOT NULL DEFAULT '1',
    ADD COLUMN `simples_credit_rate` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `ipi_cst` VARCHAR(191) NULL,
    ADD COLUMN `ipi_enq_code` VARCHAR(191) NULL,
    ADD COLUMN `ipi_rate` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `sales` ADD COLUMN `fiscal_model` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `clients_cnpj_key` ON `clients`(`cnpj`);

-- CreateIndex
CREATE INDEX `sales_fiscal_model_idx` ON `sales`(`fiscal_model`);

UPDATE `sales` SET `fiscal_model` = '65' WHERE `fiscal_key` IS NOT NULL;
