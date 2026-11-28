import { Module } from '@nestjs/common';
import { OptionGroupService } from './option-group.service';
import { ProductOptionGroupService } from './product-option-group.service';
import { OptionGroupsController } from './option-group.controller';

@Module({ controllers: [OptionGroupsController], providers: [OptionGroupService, ProductOptionGroupService] })
export class OptionGroupModule {}
