import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { OnlineMenuSettingsService } from './online-menu-settings.service';
import { CompanyController } from './company.controller';

@Module({ controllers: [CompanyController], providers: [CompanyService, OnlineMenuSettingsService], exports: [CompanyService] })
export class CompanyModule {}
