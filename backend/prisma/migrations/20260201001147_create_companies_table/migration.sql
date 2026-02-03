-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cnpj` VARCHAR(18) NOT NULL, -- 14 dígitos + margem
    `corporate_name` VARCHAR(255) NOT NULL, -- Razão social
    `trade_name` VARCHAR(255) NOT NULL, -- Nome fantasia
    `state_registration` VARCHAR(20) NOT NULL, -- Inscrição estadual
    `tax_regime` VARCHAR(1) NOT NULL, -- '1'|'2'|'3'
    `street` VARCHAR(255) NOT NULL,
    `number` VARCHAR(20) NOT NULL,
    `complement` VARCHAR(100) NULL,
    `neighborhood` VARCHAR(100) NOT NULL,
    `city` VARCHAR(100) NOT NULL,
    `city_code` VARCHAR(7) NOT NULL, -- IBGE 7 dígitos
    `state` CHAR(2) NOT NULL, -- UF
    `zip_code` VARCHAR(10) NOT NULL, -- 30130-000
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NULL,
    `nfce_series` VARCHAR(10) NOT NULL, -- Série NFC-e
    `nfce_current_number` INTEGER NOT NULL DEFAULT 1,
    `nfce_environment` ENUM('production', 'staging') NOT NULL DEFAULT 'staging',
    `nfce_csc` VARCHAR(255) NOT NULL,
    `nfce_csc_id` VARCHAR(20) NOT NULL,
    `certificate_path` VARCHAR(500) NOT NULL,
    `certificate_password` VARCHAR(100) NOT NULL,
    `certificate_expiration_date` DATETIME(3) NULL,
    `ibpt_version` VARCHAR(10) NOT NULL DEFAULT '4.0',
    `license_key` VARCHAR(255) NOT NULL,
    `license_token` TEXT NOT NULL, -- JWT pode ser longo
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    UNIQUE INDEX `companies_cnpj_key` (`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;