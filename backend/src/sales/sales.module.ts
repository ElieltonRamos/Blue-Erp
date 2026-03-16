import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SaleToNfeConverterService } from './sale-to-nfe-converte.service';
import { CompanyModule } from '../company/company.module';

@Module({
  imports: [CompanyModule],
  controllers: [SalesController],
  providers: [SalesService, SaleToNfeConverterService],
  exports: [SaleToNfeConverterService],
})
export class SalesModule {}
