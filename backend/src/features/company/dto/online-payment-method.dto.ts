import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export enum OnlinePaymentType {
  PIX = 'pix',
  CARD = 'card',
  CASH = 'cash',
}

export class OnlinePaymentMethodDto {
  @ApiProperty({ enum: OnlinePaymentType, example: OnlinePaymentType.PIX })
  @IsEnum(OnlinePaymentType, {
    message: 'Tipo de pagamento inválido. Use pix, card ou cash',
  })
  type: OnlinePaymentType;

  @ApiProperty({ example: 'Pix' })
  @IsString({ message: 'O nome da forma de pagamento deve ser um texto' })
  @IsNotEmpty({ message: 'O nome da forma de pagamento é obrigatório' })
  @MaxLength(50, {
    message: 'O nome da forma de pagamento deve ter no máximo 50 caracteres',
  })
  label: string;
}
