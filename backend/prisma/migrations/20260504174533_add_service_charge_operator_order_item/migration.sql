-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `operator_id` INTEGER NULL,
    ADD COLUMN `service_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `sale_items` ADD COLUMN `service_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `order_items_operator_id_idx` ON `order_items`(`operator_id`);

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
