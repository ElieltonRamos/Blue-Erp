import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './fiscal.service';
import { EmissionNfceService } from './services/emission-nfce.service';
import { CancellationService } from './services/cancellation.service';
import { StorageService } from './services/storage.service';
import { SalesModule } from '../../sales/sales.module';
import { IbptModule } from '../../ibpt/ibpt.module';
import { FiscalReportsService } from './services/fiscal-report.service';
import { CompanyModule } from 'src/features/company/company.module';
import { EmissionNfeService } from './services/emission-nfe.service';

@Module({
  imports: [CompanyModule, SalesModule, IbptModule],
  controllers: [FiscalController],
  providers: [
    EmissionNfeService,
    FiscalService,
    EmissionNfceService,
    CancellationService,
    StorageService,
    FiscalReportsService,
  ],
  exports: [FiscalService],
})
export class FiscalModule {}
