import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsPositive } from 'class-validator';

export class UpdateDocumentItemDto {
  @ApiProperty({ example: 2, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  quantity?: number;

  @ApiProperty({ example: 180.0, required: false })
  @IsOptional()
  @IsNumber()
  @IsPositive()
  unitPrice?: number;
}
