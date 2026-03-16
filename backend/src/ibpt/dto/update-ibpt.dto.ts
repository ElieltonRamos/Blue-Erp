import { PartialType } from '@nestjs/mapped-types';
import { CreateIbptDto } from './create-ibpt.dto';

export class UpdateIbptDto extends PartialType(CreateIbptDto) {}
