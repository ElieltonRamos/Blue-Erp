import { ApiProperty } from '@nestjs/swagger';
import { ProductOptionGroupDetail } from '../option-group.constants';
import { OptionGroupResponseDto } from './option-group-response.dto';

export class ProductOptionGroupResponseDto {
  @ApiProperty({ description: 'ID do grupo de opções', example: 1 })
  groupId: number;

  @ApiProperty({ description: 'Ordem de exibição do grupo no produto', example: 0 })
  sortOrder: number;

  @ApiProperty({
    description: 'Mínimo definido neste produto. null = usa o mínimo do grupo',
    example: 1,
    type: Number,
    nullable: true,
  })
  minOverride: number | null;

  @ApiProperty({
    description: 'Máximo definido neste produto. null = usa o máximo do grupo',
    example: 5,
    type: Number,
    nullable: true,
  })
  maxOverride: number | null;

  @ApiProperty({
    description: 'Máximo por opção definido neste produto. null = usa o do grupo',
    example: 2,
    type: Number,
    nullable: true,
  })
  maxPerOptionOverride: number | null;

  @ApiProperty({ description: 'Mínimo vigente no produto (override ou valor do grupo)', example: 1 })
  min: number;

  @ApiProperty({
    description: 'Máximo vigente no produto (override ou valor do grupo). null = sem limite',
    example: 5,
    type: Number,
    nullable: true,
  })
  max: number | null;

  @ApiProperty({
    description: 'Máximo por opção vigente no produto (override ou valor do grupo). null = sem limite',
    example: 2,
    type: Number,
    nullable: true,
  })
  maxPerOption: number | null;

  @ApiProperty({ description: 'Grupo de opções, com as opções', type: OptionGroupResponseDto })
  group: OptionGroupResponseDto;

  constructor(link: ProductOptionGroupDetail) {
    this.groupId = link.groupId;
    this.sortOrder = link.sortOrder;
    this.minOverride = link.minOverride;
    this.maxOverride = link.maxOverride;
    this.maxPerOptionOverride = link.maxPerOptionOverride;
    this.min = link.minOverride ?? link.group.min;
    this.max = link.maxOverride ?? link.group.max;
    this.maxPerOption = link.maxPerOptionOverride ?? link.group.maxPerOption;
    this.group = new OptionGroupResponseDto(link.group);
  }
}
