-- AlterTable
ALTER TABLE `primary_materials` ADD COLUMN `expiry_date` DATETIME(3) NULL,
    ADD COLUMN `min_stock` DECIMAL(10, 3) NULL;
