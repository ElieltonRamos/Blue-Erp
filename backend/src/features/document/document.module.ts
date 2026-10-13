import { Module } from '@nestjs/common';
import { DocumentService } from './document.service';
import { DocumentController } from './document.controller';
import { DocumentCommissionController } from './document-commission.controller';
import { DocumentCommissionService } from './document-commission.service';

@Module({
  controllers: [DocumentController, DocumentCommissionController],
  providers: [DocumentService, DocumentCommissionService],
})
export class DocumentModule {}
