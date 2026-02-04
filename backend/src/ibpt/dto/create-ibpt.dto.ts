import { IsString, IsNumber, Min, Max } from 'class-validator';

export class CreateIbptDto {
  @IsString()
  ncm: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  aliqFederal: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  aliqEstadual: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  aliqMunicipal: number;

  @IsString()
  version: string;
}
