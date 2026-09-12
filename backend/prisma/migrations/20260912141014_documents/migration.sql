-- AlterTable
ALTER TABLE `document_items` ADD COLUMN `commission_amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `commission_closed_at` DATETIME(3) NULL,
    ADD COLUMN `commission_paid_at` DATETIME(3) NULL,
    ADD COLUMN `commission_rate` DECIMAL(5, 2) NULL;

-- AlterTable
ALTER TABLE `users` ADD COLUMN `commission_rate` DECIMAL(5, 2) NULL;

-- CreateIndex
CREATE INDEX `document_items_commission_closed_at_idx` ON `document_items`(`commission_closed_at`);

-- CreateIndex
CREATE INDEX `document_items_commission_paid_at_idx` ON `document_items`(`commission_paid_at`);
