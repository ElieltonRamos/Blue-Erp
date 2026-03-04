/*
  Warnings:

  - You are about to drop the column `delivered_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `kitchen_ready_at` on the `orders` table. All the data in the column will be lost.
  - You are about to drop the column `kitchen_sent_at` on the `orders` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `orders` DROP COLUMN `delivered_at`,
    DROP COLUMN `kitchen_ready_at`,
    DROP COLUMN `kitchen_sent_at`,
    ADD COLUMN `closed_by_operator_id` INTEGER NULL;

-- CreateIndex
CREATE INDEX `orders_closed_by_operator_id_idx` ON `orders`(`closed_by_operator_id`);

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_closed_by_operator_id_fkey` FOREIGN KEY (`closed_by_operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
