import { Module } from '@nestjs/common';
import { FiscalController } from './fiscal.controller';
import { FiscalService } from './services/fiscal.service';
import { EmissionService } from './services/emission.service';
import { CancellationService } from './services/cancellation.service';
import { StorageService } from './services/storage.service';
import { CompanyModule } from '../company/company.module';
import { SalesModule } from '../sales/sales.module';
import { IbptModule } from '../ibpt/ibpt.module';

@Module({
  imports: [CompanyModule, SalesModule, IbptModule],
  controllers: [FiscalController],
  providers: [
    FiscalService,
    EmissionService,
    CancellationService,
    StorageService,
  ],
  exports: [FiscalService],
})
export class FiscalModule {}
