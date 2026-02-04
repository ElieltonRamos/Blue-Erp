/*
  Warnings:

  - You are about to alter the column `corporate_name` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `trade_name` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `street` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `email` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `nfce_environment` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to alter the column `nfce_csc` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.
  - You are about to alter the column `certificate_path` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(191)`.
  - You are about to alter the column `license_key` on the `companies` table. The data in that column could be lost. The data in that column will be cast from `VarChar(255)` to `VarChar(191)`.

*/
-- AlterTable
ALTER TABLE `companies` MODIFY `cnpj` VARCHAR(191) NOT NULL,
    MODIFY `corporate_name` VARCHAR(191) NOT NULL,
    MODIFY `trade_name` VARCHAR(191) NOT NULL,
    MODIFY `state_registration` VARCHAR(191) NOT NULL,
    MODIFY `tax_regime` VARCHAR(191) NOT NULL,
    MODIFY `street` VARCHAR(191) NOT NULL,
    MODIFY `number` VARCHAR(191) NOT NULL,
    MODIFY `complement` VARCHAR(191) NULL,
    MODIFY `neighborhood` VARCHAR(191) NOT NULL,
    MODIFY `city` VARCHAR(191) NOT NULL,
    MODIFY `city_code` VARCHAR(191) NOT NULL,
    MODIFY `state` VARCHAR(191) NOT NULL,
    MODIFY `zip_code` VARCHAR(191) NOT NULL,
    MODIFY `phone` VARCHAR(191) NOT NULL,
    MODIFY `email` VARCHAR(191) NULL,
    MODIFY `nfce_series` VARCHAR(191) NOT NULL,
    MODIFY `nfce_environment` VARCHAR(191) NOT NULL DEFAULT 'staging',
    MODIFY `nfce_csc` VARCHAR(191) NOT NULL,
    MODIFY `nfce_csc_id` VARCHAR(191) NOT NULL,
    MODIFY `certificate_path` VARCHAR(191) NOT NULL,
    MODIFY `certificate_password` VARCHAR(191) NOT NULL,
    MODIFY `ibpt_version` VARCHAR(191) NOT NULL DEFAULT '4.0',
    MODIFY `license_key` VARCHAR(191) NOT NULL,
    MODIFY `license_token` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplier` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `value` DECIMAL(65, 30) NOT NULL,
    `date_payment` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `expenses_supplier_idx`(`supplier`),
    INDEX `expenses_status_idx`(`status`),
    INDEX `expenses_date_payment_idx`(`date_payment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `ibpt_ncm_idx` ON `ibpt`(`ncm`);

-- CreateIndex
CREATE INDEX `ibpt_version_idx` ON `ibpt`(`version`);
