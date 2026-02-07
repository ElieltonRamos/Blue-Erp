-- CreateTable
CREATE TABLE `order_productions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order_item_id` INTEGER NOT NULL,
    `production_location` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED') NOT NULL DEFAULT 'PENDING',
    `quantity_requested` DECIMAL(10, 3) NOT NULL,
    `quantity_produced` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `pending_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `started_at` DATETIME(3) NULL,
    `completed_at` DATETIME(3) NULL,
    `delivered_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `order_productions_order_item_id_idx`(`order_item_id`),
    INDEX `order_productions_production_location_idx`(`production_location`),
    INDEX `order_productions_status_idx`(`status`),
    INDEX `order_productions_pending_at_idx`(`pending_at`),
    INDEX `order_productions_started_at_idx`(`started_at`),
    INDEX `order_productions_completed_at_idx`(`completed_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `order_productions` ADD CONSTRAINT `order_productions_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
