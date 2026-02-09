/*
  Warnings:

  - You are about to drop the column `locationId` on the `orders` table. All the data in the column will be lost.
  - Added the required column `location_id` to the `orders` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `orders_locationId_idx` ON `orders`;

-- AlterTable
ALTER TABLE `orders` DROP COLUMN `locationId`,
    ADD COLUMN `location_id` VARCHAR(191) NOT NULL;

-- CreateTable
CREATE TABLE `production_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `production_locations_code_key`(`code`),
    INDEX `production_locations_active_idx`(`active`),
    INDEX `production_locations_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `orders_location_id_idx` ON `orders`(`location_id`);