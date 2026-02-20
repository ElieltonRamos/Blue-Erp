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
  ],
  controllers: [AppController],
  providers: [AppService, LicenseSystemService],
})
export class AppModule {}
