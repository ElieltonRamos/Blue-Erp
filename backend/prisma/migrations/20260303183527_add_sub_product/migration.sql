/*
  Warnings:

  - A unique constraint covering the columns `[product_id,sub_product_id]` on the table `composition_items` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `composition_items` ADD COLUMN `sub_product_id` INTEGER NULL,
    MODIFY `material_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `products` MODIFY `product_type` ENUM('MANUFACTURED', 'RESALE', 'SEMI_MANUFACTURED') NOT NULL DEFAULT 'RESALE';

-- CreateIndex
CREATE INDEX `composition_items_sub_product_id_idx` ON `composition_items`(`sub_product_id`);

-- CreateIndex
CREATE UNIQUE INDEX `composition_items_product_id_sub_product_id_key` ON `composition_items`(`product_id`, `sub_product_id`);

-- AddForeignKey
ALTER TABLE `composition_items` ADD CONSTRAINT `composition_items_sub_product_id_fkey` FOREIGN KEY (`sub_product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
