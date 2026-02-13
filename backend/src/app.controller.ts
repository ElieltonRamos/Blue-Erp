import { Controller, Get, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

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
  async executeBackup() {
    await this.appService.execBackup();
    return { message: 'Backup executado com sucesso' };
  }
}
