import { Module } from '@nestjs/common';
import { SalesReportService } from './sale-reports.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [SalesReportService],
})
export class ReportsModule {}
