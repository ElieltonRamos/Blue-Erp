import { Module } from '@nestjs/common';
import { SalesService } from './sales.service';
import { SalesController } from './sales.controller';
import { SaleConverterNFCeService } from './sale-converte-nfce.service';
import { CompanyModule } from 'src/features/company/company.module';
import { DocumentSaleService } from './document-sale.service';
import { SaleConverterNFeService } from './sale-converte-nfe.service';

@Module({
  imports: [CompanyModule],
  controllers: [SalesController],
  providers: [
    SalesService,
    SaleConverterNFCeService,
    DocumentSaleService,
    SaleConverterNFeService,
  ],
  exports: [
    SaleConverterNFCeService,
    DocumentSaleService,
    SaleConverterNFeService,
  ],
})
export class SalesModule {}
