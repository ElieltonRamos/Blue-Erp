import { Module } from '@nestjs/common';
import { ProductionService } from './order-production.service';
import { ProductionController } from './order-production.controller';

@Module({
  controllers: [ProductionController],
  providers: [ProductionService],
})
export class OrderProductionModule {}
