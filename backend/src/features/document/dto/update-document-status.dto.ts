import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DocumentStatus } from '../../../../generated/prisma/enums.js';

export class UpdateDocumentStatusDto {
  @ApiProperty({ enum: DocumentStatus, example: DocumentStatus.APPROVED })
  @IsEnum(DocumentStatus)
  status: DocumentStatus;
}
