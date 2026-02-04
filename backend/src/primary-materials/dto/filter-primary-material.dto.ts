import { IsOptional, IsString, IsBoolean, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { Unit } from 'generated/prisma/client';

export class FilterPrimaryMaterialDto {
  @IsOptional()
  @IsString()
  search?: string; // Busca por nome ou código

  @IsOptional()
  @IsEnum(Unit)
  unit?: Unit;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  lowStock?: boolean; // Para listar apenas com estoque baixo (se implementar)
}
