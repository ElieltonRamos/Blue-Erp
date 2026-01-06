import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './database/prisma.module';
import { CompanyModule } from './company/company.module';
import { ClientsModule } from './clients/clients.module';

@Module({
  imports: [UsersModule, PrismaModule, CompanyModule, ClientsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
