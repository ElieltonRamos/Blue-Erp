import { PartialType } from '@nestjs/swagger';
import { CreateClientDto } from './create-client.dto';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateClientDto extends PartialType(CreateClientDto) {
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'Ativo') return true;
    if (value === 'Inativo') return false;
    if (typeof value === 'boolean') return value;
    return true;
  })
  @IsBoolean()
  active?: boolean;
}
