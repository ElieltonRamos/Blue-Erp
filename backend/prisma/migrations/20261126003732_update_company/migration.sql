-- AlterTable
ALTER TABLE `companies` ADD COLUMN `delivery_fee` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `delivery_time_max` INTEGER NULL,
    ADD COLUMN `delivery_time_min` INTEGER NULL,
    ADD COLUMN `instagram` VARCHAR(191) NULL,
    ADD COLUMN `latitude` DECIMAL(10, 7) NULL,
    ADD COLUMN `logo_url` VARCHAR(191) NULL,
    ADD COLUMN `longitude` DECIMAL(10, 7) NULL,
    ADD COLUMN `min_order_value` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    ADD COLUMN `online_menu_enabled` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `online_orders_paused` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `online_payment_methods` JSON NULL,
    ADD COLUMN `takeout_time` INTEGER NULL,
    ADD COLUMN `timezone` VARCHAR(191) NOT NULL DEFAULT 'America/Sao_Paulo',
    ADD COLUMN `whatsapp` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `opening_hours` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `company_id` INTEGER NOT NULL,
    `weekday` INTEGER NOT NULL,
    `opens_at` VARCHAR(191) NOT NULL,
    `closes_at` VARCHAR(191) NOT NULL,

    INDEX `opening_hours_company_id_weekday_idx`(`company_id`, `weekday`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `opening_hours` ADD CONSTRAINT `opening_hours_company_id_fkey` FOREIGN KEY (`company_id`) REFERENCES `companies`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
