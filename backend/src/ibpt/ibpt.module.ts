import { Module } from '@nestjs/common';
import { IbptController } from './ibpt.controller';
import { IbptService } from './ibpt.service';

@Module({
  controllers: [IbptController],
  providers: [IbptService],
  exports: [IbptService],
})
export class IbptModule {}
