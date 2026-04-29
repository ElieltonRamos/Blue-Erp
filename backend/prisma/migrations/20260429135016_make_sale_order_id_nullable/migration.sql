/*
  Warnings:

  - A unique constraint covering the columns `[order_id]` on the table `sales` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `sales` ADD COLUMN `order_id` INTEGER NULL;

-- CreateIndex
CREATE UNIQUE INDEX `sales_order_id_key` ON `sales`(`order_id`);

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
