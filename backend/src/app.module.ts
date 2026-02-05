import { Module } from '@nestjs/common';
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

@Module({
  imports: [UsersModule, PrismaModule, CompanyModule, ClientsModule, IbptModule, ExpensesModule, PrimaryMaterialsModule, ProductsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
