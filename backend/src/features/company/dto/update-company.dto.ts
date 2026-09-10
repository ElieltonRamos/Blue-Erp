import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(
  OmitType(CreateCompanyDto, [
    'certificatePath',
    'certificatePassword',
    'ibptVersion',
    'licenseKey',
    'licenseToken',
  ] as const),
) {}
