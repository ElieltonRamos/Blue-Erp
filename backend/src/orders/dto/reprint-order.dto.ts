import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReprintItemDto {
  @ApiProperty({ example: 1 })
  @IsInt() // Adicione isso
  productId!: number;

  @ApiProperty({ example: 'X-Burguer' })
  @IsString() // Adicione isso
  name!: string;

  @ApiProperty({ example: 2 })
  @IsInt() // Adicione isso
  quantity!: number;

  @ApiProperty({ required: false, example: 'Sem cebola' })
  @IsOptional()
  @IsString() // Adicione isso
  observation?: string;
}

export class ReprintOrderDto {
  @ApiProperty({ type: [ReprintItemDto] })
  @IsArray() // Adicione isso
  @ValidateNested({ each: true }) // Necessário para validar itens dentro do array
  @Type(() => ReprintItemDto) // Necessário para o class-transformer identificar o tipo
  items!: ReprintItemDto[];
}
