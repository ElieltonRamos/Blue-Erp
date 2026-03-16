import { Module } from '@nestjs/common';
import { SalesReportService } from './sale-reports.service';
import { ReportsController } from './reports.controller';
import { ProductReportService } from './product-reports.service';
import { ExpenseReportService } from './expense-reports.service';
import { OrderReportService } from './orders-report.service';
import { LocationReportService } from './location-reports.service';

@Module({
  controllers: [ReportsController],
  providers: [
    SalesReportService,
    ProductReportService,
    ExpenseReportService,
    OrderReportService,
    LocationReportService,
  ],
})
export class ReportsModule {}
