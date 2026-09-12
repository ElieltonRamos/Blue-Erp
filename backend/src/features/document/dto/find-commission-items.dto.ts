import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';

export class FindCommissionItemsDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  mechanicId?: number;

  @ApiProperty({
    enum: ['open', 'closed', 'paid'],
    required: false,
    default: 'open',
  })
  @IsOptional()
  @IsIn(['open', 'closed', 'paid'])
  status?: 'open' | 'closed' | 'paid' = 'open';
}
