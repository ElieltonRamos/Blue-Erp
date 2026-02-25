import { IsInt, IsBoolean, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class EmitNfceDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  companyId: number;

  @IsInt()
  @Min(1)
  @Type(() => Number)
  saleId: number;

  @IsBoolean()
  @IsOptional()
  @Type(() => Boolean)
  generateDanfe?: boolean = true;
}
