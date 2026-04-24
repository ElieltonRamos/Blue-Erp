-- CreateTable
CREATE TABLE `companies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cnpj` VARCHAR(191) NOT NULL,
    `corporate_name` VARCHAR(191) NOT NULL,
    `trade_name` VARCHAR(191) NOT NULL,
    `state_registration` VARCHAR(191) NOT NULL,
    `tax_regime` VARCHAR(191) NOT NULL,
    `street` VARCHAR(191) NOT NULL,
    `number` VARCHAR(191) NOT NULL,
    `complement` VARCHAR(191) NULL,
    `neighborhood` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `city_code` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NOT NULL,
    `zip_code` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NULL,
    `nfce_series` VARCHAR(191) NOT NULL,
    `nfce_current_number` INTEGER NOT NULL DEFAULT 1,
    `nfce_environment` VARCHAR(191) NOT NULL DEFAULT 'staging',
    `nfce_csc` VARCHAR(191) NOT NULL,
    `nfce_csc_id` VARCHAR(191) NOT NULL,
    `certificate_path` VARCHAR(191) NOT NULL,
    `certificate_password` VARCHAR(191) NOT NULL,
    `certificate_expiration_date` DATETIME(3) NULL,
    `ibpt_version` VARCHAR(191) NOT NULL DEFAULT '4.0',
    `license_key` VARCHAR(191) NOT NULL,
    `license_token` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `companies_cnpj_key`(`cnpj`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `clients` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `cpf` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `clients_cpf_key`(`cpf`),
    INDEX `clients_cpf_idx`(`cpf`),
    INDEX `clients_phone_idx`(`phone`),
    INDEX `clients_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'USER',
    `active` BOOLEAN NOT NULL DEFAULT true,
    `workplace` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    UNIQUE INDEX `users_username_key`(`username`),
    INDEX `users_role_idx`(`role`),
    INDEX `users_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ibpt` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ncm` VARCHAR(191) NOT NULL,
    `federal_tax_rate` DOUBLE NOT NULL,
    `state_tax_rate` DOUBLE NOT NULL,
    `municipal_tax_rate` DOUBLE NOT NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT '4.0',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `ibpt_ncm_idx`(`ncm`),
    INDEX `ibpt_version_idx`(`version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `expenses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `supplier` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `value` DECIMAL(10, 2) NOT NULL,
    `date_payment` DATETIME(3) NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `deleted_at` DATETIME(3) NULL,

    INDEX `expenses_supplier_idx`(`supplier`),
    INDEX `expenses_status_idx`(`status`),
    INDEX `expenses_date_payment_idx`(`date_payment`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `production_locations` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `order` INTEGER NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `production_locations_code_key`(`code`),
    INDEX `production_locations_active_idx`(`active`),
    INDEX `production_locations_order_idx`(`order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `production_location` VARCHAR(191) NULL,
    `price` DECIMAL(10, 2) NOT NULL,
    `cost_price` DECIMAL(10, 2) NOT NULL,
    `extra_costs` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `ncm` VARCHAR(191) NOT NULL,
    `cest` VARCHAR(191) NULL,
    `origin` INTEGER NOT NULL,
    `csosn` VARCHAR(191) NULL,
    `cst` VARCHAR(191) NULL,
    `icms_rate` DECIMAL(5, 2) NULL,
    `cst_pis` VARCHAR(191) NULL,
    `pis_rate` DECIMAL(5, 2) NULL,
    `cst_cofins` VARCHAR(191) NULL,
    `cofins_rate` DECIMAL(5, 2) NULL,
    `federal_tax_rate` DECIMAL(5, 2) NULL,
    `state_tax_rate` DECIMAL(5, 2) NULL,
    `municipal_tax_rate` DECIMAL(5, 2) NULL,
    `unit` ENUM('UN', 'KG', 'LT', 'MT', 'CX', 'ML', 'GR', 'DZ') NOT NULL,
    `quantity` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `min_stock` DECIMAL(10, 3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `product_type` ENUM('MANUFACTURED', 'RESALE', 'SEMI_MANUFACTURED') NOT NULL DEFAULT 'RESALE',
    `category_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_code_key`(`code`),
    INDEX `products_code_idx`(`code`),
    INDEX `products_ncm_idx`(`ncm`),
    INDEX `products_active_idx`(`active`),
    INDEX `products_category_id_idx`(`category_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('DINE_IN', 'DELIVERY') NOT NULL,
    `location_id` VARCHAR(191) NOT NULL,
    `customerName` VARCHAR(191) NULL,
    `table` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `status` ENUM('OPEN', 'CLOSED', 'CANCELED', 'PAID') NOT NULL DEFAULT 'OPEN',
    `total` DECIMAL(10, 2) NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,
    `finished_at` DATETIME(3) NULL,
    `table_occupied_until` DATETIME(3) NULL,
    `operator_id` INTEGER NULL,
    `closed_by_operator_id` INTEGER NULL,
    `service_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0,

    INDEX `orders_status_idx`(`status`),
    INDEX `orders_location_id_idx`(`location_id`),
    INDEX `orders_type_idx`(`type`),
    INDEX `orders_operator_id_idx`(`operator_id`),
    INDEX `orders_closed_by_operator_id_idx`(`closed_by_operator_id`),
    INDEX `orders_created_at_idx`(`created_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `order_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total` DECIMAL(10, 2) NOT NULL,
    `kitchen_ready_at` DATETIME(3) NULL,
    `order_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `observation` VARCHAR(191) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `order_items_order_id_idx`(`order_id`),
    INDEX `order_items_product_id_idx`(`product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

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
    `observation` VARCHAR(191) NULL,
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

-- CreateTable
CREATE TABLE `sale_payments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `sale_id` INTEGER NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `amount` DECIMAL(10, 2) NOT NULL,
    `change` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `sale_payments_sale_id_idx`(`sale_id`),
    INDEX `sale_payments_method_idx`(`method`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sales` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `client_id` INTEGER NOT NULL,
    `user_operator` VARCHAR(191) NOT NULL,
    `operator_id` INTEGER NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `total_products_without_discount` DECIMAL(10, 2) NOT NULL,
    `discount` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `total` DECIMAL(10, 2) NOT NULL,
    `profit_sale` DECIMAL(10, 2) NOT NULL,
    `is_paid` BOOLEAN NOT NULL DEFAULT false,
    `cfop` VARCHAR(191) NOT NULL DEFAULT '5102',
    `fiscal_status` ENUM('PENDENTE', 'EMITIDA', 'CANCELADA', 'ERRO') NOT NULL DEFAULT 'PENDENTE',
    `fiscal_key` VARCHAR(191) NULL,
    `fiscal_protocol` VARCHAR(191) NULL,
    `fiscal_emit_date` DATETIME(3) NULL,
    `fiscal_xml` LONGTEXT NULL,
    `service_charge` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sales_client_id_idx`(`client_id`),
    INDEX `sales_operator_id_idx`(`operator_id`),
    INDEX `sales_date_idx`(`date`),
    INDEX `sales_fiscal_status_idx`(`fiscal_status`),
    INDEX `sales_fiscal_key_idx`(`fiscal_key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `sale_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `item_number` INTEGER NOT NULL,
    `sale_id` INTEGER NOT NULL,
    `product_id` INTEGER NOT NULL,
    `x_prod` VARCHAR(191) NULL,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `unit_price` DECIMAL(10, 2) NOT NULL,
    `total_price` DECIMAL(10, 2) NOT NULL,
    `tax_unit` VARCHAR(191) NULL,
    `tax_quantity` DECIMAL(10, 3) NULL,
    `tax_unit_price` DECIMAL(10, 2) NULL,
    `composes_total` INTEGER NOT NULL DEFAULT 1,
    `cfop` VARCHAR(191) NULL,
    `total_tax_value` DECIMAL(10, 2) NULL,
    `import_tax_value` DECIMAL(10, 2) NULL DEFAULT 0,
    `iof_value` DECIMAL(10, 2) NULL DEFAULT 0,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `sale_items_sale_id_idx`(`sale_id`),
    INDEX `sale_items_product_id_idx`(`product_id`),
    UNIQUE INDEX `sale_items_sale_id_item_number_key`(`sale_id`, `item_number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `primary_materials` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `unit` ENUM('UN', 'KG', 'LT', 'MT', 'CX', 'ML', 'GR', 'DZ') NOT NULL,
    `unit_cost` DECIMAL(10, 2) NOT NULL,
    `current_stock` DECIMAL(10, 3) NOT NULL DEFAULT 0,
    `min_stock` DECIMAL(10, 3) NULL,
    `expiry_date` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `ncm` VARCHAR(191) NULL,
    `cfop` VARCHAR(191) NULL DEFAULT '5102',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `primary_materials_code_key`(`code`),
    INDEX `primary_materials_code_idx`(`code`),
    INDEX `primary_materials_active_idx`(`active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `composition_items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `quantity` DECIMAL(10, 3) NOT NULL,
    `product_id` INTEGER NOT NULL,
    `material_id` INTEGER NULL,
    `sub_product_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `composition_items_product_id_idx`(`product_id`),
    INDEX `composition_items_material_id_idx`(`material_id`),
    INDEX `composition_items_sub_product_id_idx`(`sub_product_id`),
    UNIQUE INDEX `composition_items_product_id_material_id_key`(`product_id`, `material_id`),
    UNIQUE INDEX `composition_items_product_id_sub_product_id_key`(`product_id`, `sub_product_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `preparation_steps` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `order` INTEGER NOT NULL,
    `description` TEXT NOT NULL,
    `product_id` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `preparation_steps_product_id_idx`(`product_id`),
    UNIQUE INDEX `preparation_steps_product_id_order_key`(`product_id`, `order`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tables` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` INTEGER NOT NULL,
    `capacity` INTEGER NOT NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'RESERVED') NOT NULL DEFAULT 'AVAILABLE',
    `customer` VARCHAR(191) NULL,
    `time` VARCHAR(191) NULL,
    `location_id` INTEGER NOT NULL,
    `order_id` INTEGER NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    UNIQUE INDEX `tables_order_id_key`(`order_id`),
    INDEX `tables_location_id_idx`(`location_id`),
    INDEX `tables_status_idx`(`status`),
    UNIQUE INDEX `tables_number_location_id_key`(`number`, `location_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `orders` ADD CONSTRAINT `orders_closed_by_operator_id_fkey` FOREIGN KEY (`closed_by_operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_items` ADD CONSTRAINT `order_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `order_productions` ADD CONSTRAINT `order_productions_order_item_id_fkey` FOREIGN KEY (`order_item_id`) REFERENCES `order_items`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_payments` ADD CONSTRAINT `sale_payments_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sales` ADD CONSTRAINT `sales_operator_id_fkey` FOREIGN KEY (`operator_id`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_fkey` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `composition_items` ADD CONSTRAINT `composition_items_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `composition_items` ADD CONSTRAINT `composition_items_material_id_fkey` FOREIGN KEY (`material_id`) REFERENCES `primary_materials`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `composition_items` ADD CONSTRAINT `composition_items_sub_product_id_fkey` FOREIGN KEY (`sub_product_id`) REFERENCES `products`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `preparation_steps` ADD CONSTRAINT `preparation_steps_product_id_fkey` FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tables` ADD CONSTRAINT `tables_location_id_fkey` FOREIGN KEY (`location_id`) REFERENCES `production_locations`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `tables` ADD CONSTRAINT `tables_order_id_fkey` FOREIGN KEY (`order_id`) REFERENCES `orders`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
