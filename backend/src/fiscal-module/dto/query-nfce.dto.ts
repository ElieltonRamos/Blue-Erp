import { IsString, Length, Matches } from 'class-validator';

export class QueryNfceDto {
  @IsString()
  @Length(44, 44)
  @Matches(/^\d{44}$/, { message: 'Access key must contain exactly 44 digits' })
  accessKey: string;
}
