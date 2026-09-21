// src/license/license.service.ts

import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from 'src/database/prisma.service';
import * as jwt from 'jsonwebtoken';
import axios from 'axios';
import {
  LicenseStatus,
  LicenseTokenPayload,
} from './entities/license-system.entity';
import { version } from '../../package.json';

@Injectable()
export class LicenseSystemService {
  private readonly logger = new Logger(LicenseSystemService.name);
  private readonly licensingServer = process.env.LICENSING_SERVER || '';
  private readonly publicKey =
    process.env.LICENSE_PUBLIC_KEY?.replace(/\\n/g, '\n') || '';

  private readonly usageReportTimeoutMs = 5000;
  private lastUsageReportDay: string | null = null;

  constructor(private readonly prisma: PrismaService) {}

  private async fetchToken(
    cnpj: string,
    licenseKey: string,
  ): Promise<{
    success: boolean;
    token?: string;
    serverRejected: boolean;
  }> {
    try {
      const response = await axios.get(
        `${this.licensingServer}/api/license/${cnpj}`,
        {
          params: { licenseKey },
          timeout: 10000,
        },
      );

      if (response.data.licenseToken) {
        return {
          success: true,
          token: response.data.licenseToken,
          serverRejected: false,
        };
      }

      return { success: false, serverRejected: true };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        // Servidor respondeu (400, 401, 404, 500...) = rejeição explícita
        return { success: false, serverRejected: true };
      }
      // Sem resposta (timeout, DNS, rede fora) = falha de rede, não rejeição
      console.log(error, 'erro');
      return { success: false, serverRejected: false };
    }
  }

  private verifyToken(token: string): LicenseTokenPayload | null {
    try {
      const decoded = jwt.verify(token, this.publicKey, {
        algorithms: ['RS256'],
        issuer: 'blue-pdv-licensing',
        ignoreExpiration: true, // adicione isso
      }) as jwt.JwtPayload;

      return {
        companyId: Number(decoded.companyId),
        cnpj: String(decoded.cnpj),
        plan: decoded.plan as 'basic' | 'pro',
        licenseValidUntil: Number(decoded.licenseValidUntil),
        maxOfflineDays: Number(decoded.maxOfflineDays),
        iat: Number(decoded.iat),
        exp: Number(decoded.exp),
      };
    } catch {
      return null;
    }
  }

  private checkToken(token: string): LicenseStatus {
    const payload = this.verifyToken(token);

    if (!payload) {
      return { isValid: false, plan: 'none', mode: 'expired' };
    }

    const now = Date.now();
    const nowSeconds = Math.floor(now / 1000);

    const licenseExpired = now > payload.licenseValidUntil;
    const tokenExpired = nowSeconds > payload.exp;

    // Licença expirada — verifica grace period offline a partir do exp do token
    if (licenseExpired) {
      const tokenExpDate = new Date(payload.exp * 1000);
      const diffMs = now - tokenExpDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const daysRemaining = payload.maxOfflineDays - diffDays;

      if (daysRemaining > 0) {
        return {
          isValid: true,
          plan: payload.plan,
          mode: 'offline',
          daysRemaining,
          message: `Licença expirada. Sistema em modo offline. ${daysRemaining} dia(s) restante(s) para regularizar.`,
        };
      }

      return { isValid: false, plan: 'none', mode: 'expired' };
    }

    // Token expirado mas licença ainda válida — modo offline normal
    if (tokenExpired) {
      const tokenExpDate = new Date(payload.exp * 1000);
      const diffMs = now - tokenExpDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const daysRemaining = payload.maxOfflineDays - diffDays;

      if (daysRemaining > 0) {
        return {
          isValid: true,
          plan: payload.plan,
          mode: 'offline',
          daysRemaining,
          message: `Sistema em modo offline. ${daysRemaining} dia(s) restante(s) para reconectar.`,
        };
      }

      return { isValid: false, plan: 'none', mode: 'expired' };
    }

    // Online válida — verifica se está próxima de vencer (3 dias)
    const msUntilExpiry = payload.licenseValidUntil - now;
    const daysUntilExpiry = Math.ceil(msUntilExpiry / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 3) {
      return {
        isValid: true,
        plan: payload.plan,
        mode: 'online',
        daysRemaining: daysUntilExpiry,
        message: `Sua licença vence em ${daysUntilExpiry} dia(s). Renove para evitar interrupções.`,
      };
    }

    return { isValid: true, plan: payload.plan, mode: 'online' };
  }

  async validate(): Promise<LicenseStatus> {
    const company = await this.prisma.client.company.findFirst();

    if (!company) {
      throw new HttpException('Empresa não encontrada', HttpStatus.NOT_FOUND);
    }

    const { cnpj, licenseKey, licenseToken } = company;

    if (!licenseKey) {
      return { isValid: false, plan: 'none', mode: 'expired' };
    }

    const result = await this.fetchToken(cnpj, licenseKey);

    // Sucesso online - atualiza token e retorna
    if (result.success && result.token) {
      await this.prisma.client.company.update({
        where: { id: company.id },
        data: { licenseToken: result.token },
      });
      return this.checkToken(result.token);
    }

    // Servidor rejeitou explicitamente - limpa token e invalida
    if (result.serverRejected) {
      await this.prisma.client.company.update({
        where: { id: company.id },
        data: { licenseToken: '' },
      });
      return { isValid: false, plan: 'none', mode: 'expired' };
    }

    // Falha de rede - mantém token atual e cai no cache (respeita maxOfflineDays)
    if (!licenseToken) {
      return { isValid: false, plan: 'none', mode: 'expired' };
    }

    return this.checkToken(licenseToken);
  }

  async getStatus(): Promise<LicenseStatus> {
    return this.validate();
  }

  async getTokenInfo(): Promise<LicenseTokenPayload> {
    const company = await this.prisma.client.company.findFirst();

    if (!company || !company.licenseToken) {
      throw new HttpException('Token não encontrado', HttpStatus.NOT_FOUND);
    }

    const payload = this.verifyToken(company.licenseToken);

    if (!payload) {
      throw new HttpException('Token inválido', HttpStatus.BAD_REQUEST);
    }

    return payload;
  }

  // Data local (do processo) no formato YYYY-MM-DD
  private getLocalDay(): string {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${now.getFullYear()}-${month}-${day}`;
  }

  private async collectUsage(): Promise<Record<string, number>> {
    const rows = await this.prisma.client.$queryRaw<
      { tabela: string; linhas: bigint | number | null }[]
    >`
      SELECT CAST(TABLE_NAME AS CHAR) AS tabela, TABLE_ROWS AS linhas
      FROM information_schema.TABLES
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_TYPE = 'BASE TABLE'
        AND TABLE_NAME <> '_prisma_migrations'
      ORDER BY TABLE_NAME
    `;

    return Object.fromEntries(
      rows.map((row) => [row.tabela, Number(row.linhas ?? 0)]),
    );
  }

  // Nunca lança erro: pode ser chamado sem await
  async sendUsageReport(force = false): Promise<void> {
    const today = this.getLocalDay();

    if (!force && this.lastUsageReportDay === today) {
      return;
    }

    // Marca antes de executar para evitar disparos simultâneos
    this.lastUsageReportDay = today;

    try {
      const company = await this.prisma.client.company.findFirst();

      if (!company || !company.licenseKey) {
        this.logger.warn(
          'Resumo de uso não enviado: empresa ou licenseKey ausente',
        );
        return;
      }

      const usage = await this.collectUsage();

      await axios.post(
        `${this.licensingServer}/api/usage-report`,
        {
          cnpj: company.cnpj,
          licenseKey: company.licenseKey,
          loginAt: new Date().toISOString(),
          version,
          usage,
        },
        { timeout: this.usageReportTimeoutMs },
      );

      this.logger.log(
        `Resumo de uso enviado (${Object.keys(usage).length} tabelas)`,
      );
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`Falha ao enviar resumo de uso: ${reason}`);
    }
  }
}
