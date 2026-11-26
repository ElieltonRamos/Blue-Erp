import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateServiceDto } from './create-service.dto';
import { ValidationMessages } from 'src/common/utils/validation';

export class UpdateServiceDto extends PartialType(CreateServiceDto) {
  @ApiProperty({ required: false, example: false })
  @IsBoolean({ message: ValidationMessages.IS_BOOLEAN('Ativo') })
  @IsOptional()
  active?: boolean;
}
