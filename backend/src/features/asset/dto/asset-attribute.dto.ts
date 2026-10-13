import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';
import { ValidationMessages } from 'src/common/validation-messages';

export class AssetAttributeDto {
  @ApiProperty({ example: 'marca' })
  @IsString({ message: ValidationMessages.IS_STRING('Chave') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Chave') })
  key: string;

  @ApiProperty({ example: 'Fiat' })
  @IsString({ message: ValidationMessages.IS_STRING('Valor') })
  @IsNotEmpty({ message: ValidationMessages.IS_NOT_EMPTY('Valor') })
  value: string;
}
