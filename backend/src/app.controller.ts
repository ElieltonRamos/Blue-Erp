import { Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  async getHello(@Res() res: Response) {
    const data = await this.appService.getDashboardData();
    const html = this.appService.renderDashboard(data);
    res.send(html);
  }

  @Post('backup')
  @UseGuards(JwtAuthGuard, RolesGuard)
  async executeBackup() {
    await this.appService.execBackup();
    return { message: 'Backup executado com sucesso' };
  }
}
