import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class CloseTabDto {
  @ApiPropertyOptional({ example: 18.5 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  serviceCharge?: number;
}
