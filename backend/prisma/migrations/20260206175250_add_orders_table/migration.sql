-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('DINE_IN', 'DELIVERY') NOT NULL,
    `locationId` ENUM('LOCAL_01', 'LOCAL_02', 'LOCAL_03', 'DELIVERY') NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `table` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `status` ENUM('OPEN', 'CLOSED', 'CANCELED') NOT NULL DEFAULT 'OPEN',
    `total` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `kitchen_sent_at` DATETIME(3) NULL,
    `kitchen_ready_at` DATETIME(3) NULL,
    `finished_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `table_occupied_until` DATETIME(3) NULL,
    `operator_id` INTEGER NULL,

    INDEX `orders_status_idx`(`status`),
    INDEX `orders_locationId_idx`(`locationId`),
    INDEX `orders_type_idx`(`type`),
    INDEX `orders_operator_id_idx`(`operator_id`),
    INDEX `orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `kitchen_ready_at` DATETIME(3) NULL,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
