import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNumber, IsOptional, IsPositive } from 'class-validator';

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

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsInt()
  mechanicId?: number;
}

export class UpdateDocumentResponsibleDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  responsibleId: number;
}
