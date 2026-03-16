import { Module } from '@nestjs/common';
import { CategoryService } from './category-product.service';
import { CategoryController } from './category-product.controller';

@Module({
  controllers: [CategoryController],
  providers: [CategoryService],
})
export class CategoryProductModule {}
