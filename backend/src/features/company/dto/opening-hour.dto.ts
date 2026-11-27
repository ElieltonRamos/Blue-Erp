import { ApiProperty } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, Max, Min, ValidateNested } from 'class-validator';
import { IsTimeOnly, ValidationMessages, trim } from '../../../common/utils/validation';

export class OpeningHourDto {
  @ApiProperty({ description: '0 = domingo ... 6 = sábado', minimum: 0, maximum: 6, example: 1 })
  @IsInt({ message: ValidationMessages.IS_INT('O dia da semana') })
  @Min(0, { message: ValidationMessages.MIN('O dia da semana', 0) })
  @Max(6, { message: ValidationMessages.MAX('O dia da semana', 6) })
  weekday: number;

  @ApiProperty({ example: '18:00', description: 'Formato HH:mm' })
  @Transform(trim)
  @IsTimeOnly('O horário de abertura')
  opensAt: string;

  @ApiProperty({ example: '23:00', description: 'Formato HH:mm. Menor que a abertura = termina no dia seguinte' })
  @Transform(trim)
  @IsTimeOnly('O horário de fechamento')
  closesAt: string;
}

export class ReplaceOpeningHoursDto {
  @ApiProperty({ type: [OpeningHourDto] })
  @IsArray({ message: ValidationMessages.IS_ARRAY('Os horários') })
  @ArrayMaxSize(35, { message: ValidationMessages.ARRAY_MAX_SIZE('Os horários', 35) })
  @ValidateNested({ each: true })
  @Type(() => OpeningHourDto)
  hours: OpeningHourDto[];
}
