// src/fiscal-module/dto/query-nfce.dto.ts
import { IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class QueryFiscalDto {
  @ApiProperty({
    description: '44-digit NF-e access key',
    example: '31240101234567000195650010000000011000000010',
  })
  @IsString()
  @Length(44, 44)
  @Matches(/^\d{44}$/, { message: 'Access key must contain exactly 44 digits' })
  accessKey: string;
}
