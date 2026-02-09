import { Module } from '@nestjs/common';
import { ProductionLocationsService } from './production-locations.service';
import { ProductionLocationsController } from './production-locations.controller';

@Module({
  controllers: [ProductionLocationsController],
  providers: [ProductionLocationsService],
})
export class ProductionLocationsModule {}
