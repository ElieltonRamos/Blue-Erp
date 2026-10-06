import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  Length,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class VehicleDto {
  // Placa antiga (ABC-1234) ou Mercosul (ABC1D23). O converter remove o hífen.
  @IsString()
  @Matches(/^[A-Za-z]{3}-?\d[A-Za-z0-9]\d{2}$/, {
    message: 'Placa inválida',
  })
  plate: string;

  @IsString()
  @Matches(/^[A-Za-z]{2}$/, { message: 'UF da placa inválida' })
  uf: string;
}

export class VolumesDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  qVol?: number;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  esp?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  marca?: string;

  @IsOptional()
  @IsString()
  @Length(1, 60)
  nVol?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  pesoL?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  pesoB?: number;
}

export class TranspDto {
  // 0 remetente, 1 destinatário, 2 terceiros, 3 próprio remetente,
  // 4 próprio destinatário, 9 sem ocorrência de transporte
  @IsIn(['0', '1', '2', '3', '4', '9'])
  modFrete: string;

  // BusinessPartner com type = CARRIER
  @IsOptional()
  @IsInt()
  @Min(1)
  carrierId?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => VehicleDto)
  vehicle?: VehicleDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => VolumesDto)
  volumes?: VolumesDto;
}

export class FatDto {
  @IsString()
  @Length(1, 60)
  nFat: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vOrig: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vDesc?: number;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  vLiq: number;
}

export class DupDto {
  @IsString()
  @Length(1, 60)
  nDup: string;

  // YYYY-MM-DD
  @Matches(/^\d{4}-\d{2}-\d{2}$/, { message: 'dVenc deve ser YYYY-MM-DD' })
  dVenc: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  vDup: number;
}

export class CobrDto {
  @IsOptional()
  @ValidateNested()
  @Type(() => FatDto)
  fat?: FatDto;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => DupDto)
  dup?: DupDto[];
}

export class EmitNfeDto {
  @IsInt()
  @Min(1)
  saleId: number;

  @IsOptional()
  @IsBoolean()
  generateDanfe?: boolean;

  // Natureza da operação (natOp tem no máximo 60 caracteres)
  @IsString()
  @Length(1, 60)
  natOp: string;

  // 0 entrada, 1 saída
  @IsOptional()
  @IsIn(['0', '1'])
  tpNF?: string;

  // 1 normal, 2 complementar, 3 ajuste, 4 devolução
  @IsOptional()
  @IsIn(['1', '2', '3', '4'])
  finNFe?: string;

  // Data/hora de saída (ISO 8601)
  @IsOptional()
  @IsISO8601()
  dhSaiEnt?: string;

  // Operação permite o crédito de ICMS ao comprador (CSOSN 101)
  @IsOptional()
  @IsBoolean()
  permiteCredito?: boolean;

  @ValidateNested()
  @Type(() => TranspDto)
  transp: TranspDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => CobrDto)
  cobr?: CobrDto;

  // Informações complementares digitadas pelo usuário
  @IsOptional()
  @IsString()
  infAdic?: string;
}
