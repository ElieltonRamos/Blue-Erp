import { Module } from '@nestjs/common';
import { LicenseSystemService } from './license-system.service';
import { LicenseSystemController } from './license-system.controller';

@Module({
  controllers: [LicenseSystemController],
  providers: [LicenseSystemService],
  exports: [LicenseSystemService],
})
export class LicenseSystemModule {}
