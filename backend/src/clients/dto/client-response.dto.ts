// src/clients/dto/client-response.dto.ts
import { ApiProperty } from '@nestjs/swagger';

export class ClientResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'João Silva' })
  name: string;

  @ApiProperty({ type: String, nullable: true, example: '(31) 99999-9999' })
  phone: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    example: 'Rua das Flores, 123, Centro',
  })
  address: string | null;

  @ApiProperty({ type: String, nullable: true, example: '12345678900' })
  cpf: string | null;

  @ApiProperty({ type: String, nullable: true, example: '12345678000190' })
  cnpj: string | null;

  @ApiProperty({ type: String, nullable: true, example: '123456789' })
  stateRegistration: string | null;

  @ApiProperty({
    type: String,
    nullable: true,
    enum: ['1', '2', '9'],
    example: '9',
  })
  ieIndicator: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Rua das Flores' })
  street: string | null;

  @ApiProperty({ type: String, nullable: true, example: '123' })
  number: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Apto 101' })
  complement: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Centro' })
  neighborhood: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'Belo Horizonte' })
  city: string | null;

  @ApiProperty({ type: String, nullable: true, example: '3106200' })
  cityCode: string | null;

  @ApiProperty({ type: String, nullable: true, example: 'MG' })
  state: string | null;

  @ApiProperty({ type: String, nullable: true, example: '30110000' })
  zipCode: string | null;

  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  constructor(partial: Partial<ClientResponseDto>) {
    Object.assign(this, partial);
  }
}
