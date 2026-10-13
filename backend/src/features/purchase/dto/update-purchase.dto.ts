import { PartialType } from '@nestjs/swagger';
import { CreatePurchaseFromXmlDto } from './create-purchase-from-xml.dto';

export class UpdatePurchaseDto extends PartialType(CreatePurchaseFromXmlDto) {}
