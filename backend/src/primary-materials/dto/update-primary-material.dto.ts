import { PartialType } from '@nestjs/swagger';
import { CreatePrimaryMaterialDto } from './create-primary-material.dto';

export class UpdatePrimaryMaterialDto extends PartialType(
  CreatePrimaryMaterialDto,
) {}
