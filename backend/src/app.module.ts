import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './database/prisma.module';
import { CompanyModule } from './company/company.module';
import { ClientsModule } from './clients/clients.module';
import { IbptModule } from './ibpt/ibpt.module';
import { ExpensesModule } from './expenses/expenses.module';
import { PrimaryMaterialsModule } from './primary-materials/primary-materials.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { OrderProductionModule } from './order-production/order-production.module';
import { ProductionLocationsModule } from './production-locations/production-locations.module';
import { TablesModule } from './tables/tables.module';
import { SalesModule } from './sales/sales.module';
import { ReportsModule } from './reports/reports.module';
import { LicenseSystemModule } from './license-system/license-system.module';
import { LicenseSystemService } from './license-system/license-system.service';
import { FiscalModule } from './fiscal-module/fiscal.module';
import { CategoryProductModule } from './category-product/category-product.module';
import { PrinterModule } from './printer/printer.module';
import { TelegramModule } from './telegram/telegram.module';

// ScheduleModule.forRoot(): registra o scheduler global do NestJS (@nestjs/schedule).
// Só pode existir 1x na aplicação — habilita o decorator @Cron nos providers
// de qualquer módulo importado aqui (não precisa repetir em cada módulo).
//
// Cron jobs agendados (ver @Cron nos respectivos services):
// 05:00 scheduled-backup (BackupService)
// 05:30 complete-forgotten-productions (timeZone: America/Sao_Paulo) — resolve produções órfãs antes do cleanup
// 05:45 order-cleanup (OrderCleanupService) — fecha comandas fantasmas, depende do job anterior já ter rodado
// 06:00 daily-report (DailyReportService/Telegram)
// @SingleInstance() nos métodos: evita execução duplicada quando PM2 roda em cluster mode (só instância 0 executa)

@Module({
  imports: [
    ScheduleModule.forRoot(),
    UsersModule,
    PrismaModule,
    CompanyModule,
    ClientsModule,
    IbptModule,
    ExpensesModule,
    PrimaryMaterialsModule,
    ProductsModule,
    OrdersModule,
    OrderProductionModule,
    ProductionLocationsModule,
    TablesModule,
    SalesModule,
    ReportsModule,
    LicenseSystemModule,
    FiscalModule,
    CategoryProductModule,
    PrinterModule,
    TelegramModule,
  ],
  controllers: [AppController],
  providers: [AppService, LicenseSystemService],
})
export class AppModule {}
