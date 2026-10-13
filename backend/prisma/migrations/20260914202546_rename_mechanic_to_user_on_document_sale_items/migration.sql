/*
Warnings:

- You are about to drop the column `user_id` on the `document_items` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `document_items`
DROP FOREIGN KEY `document_items_user_id_fkey`;

-- DropForeignKey
ALTER TABLE `sale_items`
DROP FOREIGN KEY `sale_items_product_id_fkey`;

-- DropIndex
DROP INDEX `document_items_user_id_idx` ON `document_items`;

-- AlterTable
ALTER TABLE `document_items`
DROP COLUMN `user_id`,
ADD COLUMN `user_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `sale_items`
ADD COLUMN `service_id` INTEGER NULL,
ADD COLUMN `user_id` INTEGER NULL,
MODIFY `product_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `document_items_user_id_idx` ON `document_items` (`user_id`);

-- CreateIndex
CREATE INDEX `sale_items_service_id_idx` ON `sale_items` (`service_id`);

-- CreateIndex
CREATE INDEX `sale_items_user_id_idx` ON `sale_items` (`user_id`);

-- AddForeignKey
ALTER TABLE `sale_items`
ADD CONSTRAINT `sale_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items`
ADD CONSTRAINT `sale_items_service_id_fkey` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items`
ADD CONSTRAINT `sale_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `document_items`
ADD CONSTRAINT `document_items_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE;