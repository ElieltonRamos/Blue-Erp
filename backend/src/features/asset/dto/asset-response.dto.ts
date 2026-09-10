import { ApiProperty } from '@nestjs/swagger';

class AssetAttributeResponseDto {
  @ApiProperty({ example: 'marca' })
  key: string;

  @ApiProperty({ example: 'Fiat' })
  value: string;
}

export class AssetResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'VEHICLE' })
  type: string;

  @ApiProperty({ example: 'ABC-1234' })
  label: string;

  @ApiProperty({ example: 1 })
  clientId: number;

  @ApiProperty({ example: 'João Silva' })
  clientName: string;

  @ApiProperty({ type: [AssetAttributeResponseDto] })
  attributes: AssetAttributeResponseDto[];

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-09-10T12:00:00.000Z' })
  updatedAt: Date;

  constructor(
    partial: Partial<AssetResponseDto> & { client?: { name: string } },
  ) {
    const { client, ...rest } = partial as any;
    Object.assign(this, rest);
    if (client?.name) {
      this.clientName = client.name;
    }
  }
}
