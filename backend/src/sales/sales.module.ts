import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SaleToNfeConverterService } from './sale-to-nfe-converte.service';
import { CompanyModule } from 'src/features/company/company.module';
import { DocumentSaleService } from './document-sale.service';

@Module({
  imports: [CompanyModule],
  controllers: [SalesController],
  providers: [SalesService, SaleToNfeConverterService, DocumentSaleService],
  exports: [SaleToNfeConverterService, DocumentSaleService],
})
export class SalesModule {}
