import { Injectable, Logger } from '@nestjs/common';
import * as net from 'net';
import { PrintJob } from './dto/print-job.dto';

@Injectable()
export class PrinterService {
  private readonly logger = new Logger(PrinterService.name);
  private readonly PRINTER_PORT = 9100;
  private readonly TIMEOUT_MS = 20000;

  async printOrder(jobs: PrintJob[]): Promise<void> {
    await Promise.allSettled(jobs.map((job) => this.sendJob(job)));
  }

  private getIp(locationCode: string): string | null {
    return process.env[`PRINTER_${locationCode.toUpperCase()}`] ?? null;
  }

  private formatTicket(job: PrintJob): Buffer {
    const ESC = '\x1B';
    const GS = '\x1D';
    const BOLD_ON = `${ESC}E\x01`;
    const BOLD_OFF = `${ESC}E\x00`;
    const CENTER = `${ESC}a\x01`;
    const LEFT = `${ESC}a\x00`;
    const CUT = `${GS}V\x41\x03`;
    const LF = '\n';
    const FONT_BIG = `${ESC}!\x30`;
    const FONT_NORMAL = `${ESC}!\x10`;

    const line = '-'.repeat(45);
    const now = new Date().toLocaleString('pt-BR', {
      timeZone: 'America/Sao_Paulo',
    });

    let text = '';
    if (job.isReprint) {
      text += CENTER + FONT_BIG + BOLD_ON + `#REIMPRESSAO#` + LF;
    }
    text +=
      CENTER + FONT_BIG + BOLD_ON + `PEDIDO #${job.orderId}` + BOLD_OFF + LF;
    text += FONT_BIG + CENTER + now + LF;
    if (job.table) text += CENTER + `Mesa: ${job.table}` + LF;
    if (job.customerName) text += CENTER + `Cliente: ${job.customerName}` + LF;
    if (job.operatorName) text += CENTER + `Garcom: ${job.operatorName}` + LF;
    text += FONT_NORMAL + LEFT + line + LF;

    for (const item of job.items) {
      text +=
        FONT_NORMAL +
        CENTER +
        BOLD_ON +
        `${item.quantity}x ${item.name}` +
        BOLD_OFF +
        LF;
      if (item.observation) text += CENTER + `   Obs: ${item.observation}` + LF;
    }

    text += line + LF;
    text += CUT;

    return Buffer.from(text, 'latin1');
  }

  private sendJob(job: PrintJob): Promise<void> {
    return new Promise((resolve) => {
      const ip = this.getIp(job.location);

      if (!ip) {
        this.logger.warn(
          `Impressora não configurada para location: ${job.location}`,
        );
        return resolve();
      }

      const data = this.formatTicket(job);
      let settled = false;

      const done = (success: boolean, message?: string) => {
        if (settled) return;
        settled = true;
        if (success) {
          this.logger.log(
            `Impresso pedido #${job.orderId} → ${job.location} (${ip})`,
          );
        } else {
          this.logger.error(
            `Erro ao imprimir pedido #${job.orderId} → ${job.location}: ${message}`,
          );
        }
        resolve();
      };

      const client = net.createConnection(
        { host: ip, port: this.PRINTER_PORT },
        () => {
          client.write(data);
          client.end();
        },
      );

      client.setTimeout(this.TIMEOUT_MS);

      client.on('timeout', () => {
        client.destroy();
        done(false, `timeout após ${this.TIMEOUT_MS}ms`);
      });

      client.on('close', () => {
        done(true);
      });

      client.on('error', (err) => {
        done(false, err.message);
      });
    });
  }
}
