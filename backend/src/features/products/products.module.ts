import { Module } from '@nestjs/common';
import { UploadsModule } from 'src/common/uploads/uploads.module';
import { ProductController } from './products.controller';
import { ProductService } from './products.service';
import { ProductCompositionService } from './product-composition.service';
import { ProductStockService } from './product-stock.service';

@Module({
  imports: [UploadsModule],
  controllers: [ProductController],
  providers: [ProductService, ProductCompositionService, ProductStockService],
  exports: [ProductStockService],
})
export class ProductsModule {}
