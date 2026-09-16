import { Module } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { PurchaseController } from './purchase.controller';
import { NfeXmlParserService } from './nfe-xml-parser.service';
import { ExpensesModule } from '../../expenses/expenses.module';
import { BusinessPartnerService } from './business-partner.service';

@Module({
  imports: [ExpensesModule],
  controllers: [PurchaseController],
  providers: [PurchaseService, NfeXmlParserService, BusinessPartnerService],
})
export class PurchaseModule {}
