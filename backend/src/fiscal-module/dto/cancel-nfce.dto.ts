// src/fiscal-module/dto/cancel-nfce.dto.ts
import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelNfceDto {
  @ApiProperty({
    description: '44-digit NFC-e access key',
    example: '31240101234567000195650010000000011000000010',
  })
  @IsString()
  @Length(44, 44)
  @Matches(/^\d{44}$/)
  accessKey: string;

  @ApiProperty({
    description: 'Cancellation justification (min 15 chars)',
    example: 'Erro na emissão da nota fiscal',
  })
  @IsString()
  @Length(15, 255)
  justification: string;
}
