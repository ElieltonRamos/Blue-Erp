-- CreateTable
CREATE TABLE `ibpt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ncm` VARCHAR(191) NOT NULL,
    `aliq_federal` DOUBLE NOT NULL,
    `aliq_estadual` DOUBLE NOT NULL,
    `aliq_municipal` DOUBLE NOT NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT '4.0',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
