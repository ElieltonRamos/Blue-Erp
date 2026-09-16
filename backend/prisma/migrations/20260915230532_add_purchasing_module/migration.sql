/*
  Warnings:

  - You are about to drop the column `ordered_at` on the `purchases` table. All the data in the column will be lost.
  - You are about to alter the column `status` on the `purchases` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(4))` to `Enum(EnumId(13))`.
  - Made the column `received_at` on table `purchases` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `expenses` ADD COLUMN `installment_number` INTEGER NULL,
    ADD COLUMN `partner_id` INTEGER NULL,
    ADD COLUMN `purchase_id` INTEGER NULL;

-- AlterTable
ALTER TABLE `purchases` DROP COLUMN `ordered_at`,
    MODIFY `status` ENUM('RECEIVED', 'CANCELED') NOT NULL DEFAULT 'RECEIVED',
    MODIFY `received_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- CreateIndex
CREATE INDEX `expenses_purchase_id_idx` ON `expenses`(`purchase_id`);

-- CreateIndex
CREATE INDEX `expenses_partner_id_idx` ON `expenses`(`partner_id`);

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_purchase_id_fkey` FOREIGN KEY (`purchase_id`) REFERENCES `purchases`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_partner_id_fkey` FOREIGN KEY (`partner_id`) REFERENCES `business_partners`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
