import { Module } from '@nestjs/common';
import { PrimaryMaterialsService } from './primary-materials.service';
import { PrimaryMaterialsController } from './primary-materials.controller';

@Module({
  controllers: [PrimaryMaterialsController],
  providers: [PrimaryMaterialsService],
})
export class PrimaryMaterialsModule {}
