// ==================== src/fiscal/dto/cancel-nfce.dto.ts ====================
import { IsString, Length, Matches, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CancelNfceDto {
  @IsInt()
  @Min(1)
  @Type(() => Number)
  companyId: number;

  @IsString()
  @Length(44, 44)
  @Matches(/^\d{44}$/)
  accessKey: string;

  @IsString()
  @Length(15, 255)
  justification: string;
}
