import { ApiProperty } from '@nestjs/swagger';
import { Option } from 'generated/prisma/client';
import { OptionGroupType } from 'generated/prisma/enums';
import { OptionGroupDetail } from '../option-group.constants';

export class OptionResponseDto {
  @ApiProperty({ example: 12 })
  id: number;

  @ApiProperty({ example: 'Bacon' })
  name: string;

  @ApiProperty({ description: 'Acréscimo no preço, por unidade', example: 4.5 })
  price: number;

  @ApiProperty({ description: 'Se a opção está marcada como disponível no cadastro', example: true })
  available: boolean;

  @ApiProperty({ description: 'Ordem de exibição dentro do grupo', example: 0 })
  sortOrder: number;

  @ApiProperty({ description: 'ID da matéria-prima ligada à opção', example: 3, type: Number, nullable: true })
  materialId: number | null;

  constructor(option: Option) {
    this.id = option.id;
    this.name = option.name;
    this.price = option.price.toNumber();
    this.available = option.available;
    this.sortOrder = option.sortOrder;
    this.materialId = option.materialId;
  }
}

export class OptionGroupResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Adicionais' })
  name: string;

  @ApiProperty({
    description: 'SINGLE escolhe uma opção, MULTIPLE escolhe várias com quantidade',
    enum: OptionGroupType,
    enumName: 'OptionGroupType',
    example: OptionGroupType.MULTIPLE,
  })
  type: OptionGroupType;

  @ApiProperty({ description: 'Mínimo de unidades somadas no grupo. 0 = opcional, maior que 0 = obrigatório', example: 0 })
  min: number;

  @ApiProperty({
    description: 'Máximo de unidades somadas no grupo. null = sem limite',
    example: 20,
    type: Number,
    nullable: true,
  })
  max: number | null;

  @ApiProperty({
    description: 'Máximo de unidades de uma mesma opção. null = sem limite',
    example: 10,
    type: Number,
    nullable: true,
  })
  maxPerOption: number | null;

  @ApiProperty({ description: 'Opções do grupo, na ordem de exibição', type: [OptionResponseDto] })
  options: OptionResponseDto[];

  @ApiProperty({ description: 'Quantidade de produtos que usam o grupo', example: 3 })
  productsCount: number;

  @ApiProperty({ example: '2026-11-28T10:30:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-11-28T14:45:00.000Z' })
  updatedAt: Date;

  constructor(group: OptionGroupDetail) {
    this.id = group.id;
    this.name = group.name;
    this.type = group.type;
    this.min = group.min;
    this.max = group.max;
    this.maxPerOption = group.maxPerOption;
    this.options = group.options.map((option) => new OptionResponseDto(option));
    this.productsCount = group._count.products;
    this.createdAt = group.createdAt;
    this.updatedAt = group.updatedAt;
  }
}
