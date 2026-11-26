-- AlterTable
ALTER TABLE `categories` ADD COLUMN `online_sort_order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `online_visible` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `companies` ADD COLUMN `online_menu_control_stock` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `products` ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `featured` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `image_url` VARCHAR(191) NULL,
    ADD COLUMN `online_sort_order` INTEGER NOT NULL DEFAULT 0,
    ADD COLUMN `online_visible` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `promo_ends_at` DATETIME(3) NULL,
    ADD COLUMN `promo_price` DECIMAL(10, 2) NULL,
    ADD COLUMN `promo_starts_at` DATETIME(3) NULL;

-- CreateTable
CREATE TABLE `option_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('SINGLE', 'MULTIPLE') NOT NULL,
    `min` INTEGER NOT NULL DEFAULT 0,
    `max` INTEGER NULL,
    `max_per_option` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `options` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `group_id` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `available` BOOLEAN NOT NULL DEFAULT true,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `material_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `options_group_id_idx`(`group_id`),
    INDEX `options_material_id_idx`(`material_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `product_option_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `product_id` INTEGER NOT NULL,
    `group_id` INTEGER NOT NULL,
    `sort_order` INTEGER NOT NULL DEFAULT 0,
    `min_override` INTEGER NULL,
    `max_override` INTEGER NULL,
    `max_per_option_override` INTEGER NULL,

    INDEX `product_option_groups_group_id_idx`(`group_id`),
    UNIQUE INDEX `product_option_groups_product_id_group_id_key`(`product_id`, `group_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `products_online_visible_category_id_idx` ON `products`(`online_visible`, `category_id`);

-- AddForeignKey
ALTER TABLE `options` ADD CONSTRAINT `options_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `option_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `options` ADD CONSTRAINT `options_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `primary_materials`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_option_groups` ADD CONSTRAINT `product_option_groups_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `product_option_groups` ADD CONSTRAINT `product_option_groups_group_id_fkey` FOREIGN KEY (`group_id`) REFERENCES `option_groups`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
