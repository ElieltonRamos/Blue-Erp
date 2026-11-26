import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { ValidationMessages, trim } from '../../../common/utils/validation';

export enum OnlinePaymentType {
  PIX = 'pix',
  CARD = 'card',
  CASH = 'cash',
}

export class OnlinePaymentMethodDto {
  @ApiProperty({ enum: OnlinePaymentType, example: OnlinePaymentType.PIX })
  @IsEnum(OnlinePaymentType, {
    message: ValidationMessages.IS_ENUM('O tipo de pagamento'),
  })
  type: OnlinePaymentType;

  @ApiProperty({ example: 'Pix' })
  @Transform(trim)
  @IsString({
    message: ValidationMessages.IS_STRING('O nome da forma de pagamento'),
  })
  @IsNotEmpty({
    message: ValidationMessages.IS_NOT_BLANK('O nome da forma de pagamento'),
  })
  @MaxLength(50, {
    message: ValidationMessages.MAX_LENGTH('O nome da forma de pagamento', 50),
  })
  label: string;
}
