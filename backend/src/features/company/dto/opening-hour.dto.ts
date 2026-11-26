import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class OpeningHourDto {
  @ApiProperty({
    description: '0 = domingo ... 6 = sábado',
    minimum: 0,
    maximum: 6,
    example: 1,
  })
  @IsInt({ message: 'O dia da semana deve ser um número inteiro' })
  @Min(0, {
    message: 'O dia da semana deve ser entre 0 (domingo) e 6 (sábado)',
  })
  @Max(6, {
    message: 'O dia da semana deve ser entre 0 (domingo) e 6 (sábado)',
  })
  weekday: number;

  @ApiProperty({ example: '18:00', description: 'Formato HH:mm' })
  @Matches(TIME_REGEX, {
    message: 'Horário de abertura inválido. Use o formato HH:mm',
  })
  opensAt: string;

  @ApiProperty({
    example: '23:00',
    description:
      'Formato HH:mm. Menor que a abertura = termina no dia seguinte',
  })
  @Matches(TIME_REGEX, {
    message: 'Horário de fechamento inválido. Use o formato HH:mm',
  })
  closesAt: string;
}

export class ReplaceOpeningHoursDto {
  @ApiProperty({ type: [OpeningHourDto] })
  @IsArray({ message: 'Os horários devem ser uma lista' })
  @ArrayMaxSize(35, { message: 'Informe no máximo 35 intervalos de horário' })
  @ValidateNested({ each: true })
  @Type(() => OpeningHourDto)
  hours: OpeningHourDto[];
}
