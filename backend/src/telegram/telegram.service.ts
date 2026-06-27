// telegram.service.ts
import { Injectable, Logger } from '@nestjs/common';
import axios, { isAxiosError } from 'axios';

@Injectable()
export class TelegramService {
  private readonly logger = new Logger(TelegramService.name);
  private readonly token: string;
  private readonly chatId: string;
  private readonly maxRetries = 3;
  private readonly timeoutMs = 10_000;
  private readonly retryDelayMs = 2_000;

  constructor() {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_CHAT_ID;

    if (!token || !chatId) {
      throw new Error(
        'TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID precisam estar definidos no .env',
      );
    }

    this.token = token;
    this.chatId = chatId;
  }

  async sendMessage(text: string): Promise<void> {
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        await axios.post(
          `https://api.telegram.org/bot${this.token}/sendMessage`,
          { chat_id: this.chatId, text, parse_mode: 'HTML' },
          { timeout: this.timeoutMs },
        );
        this.logger.log(
          `Mensagem Telegram enviada (tentativa ${attempt}/${this.maxRetries}).`,
        );
        return;
      } catch (error) {
        const isLastAttempt = attempt === this.maxRetries;
        const description = this.describeError(error);

        if (isLastAttempt) {
          this.logger.error(
            `Falha definitiva ao enviar mensagem Telegram após ${this.maxRetries} tentativas: ${description}. Mensagem perdida.`,
          );
          return;
        }

        this.logger.warn(
          `Falha ao enviar mensagem Telegram (tentativa ${attempt}/${this.maxRetries}): ${description}. Retentando...`,
        );

        await this.delay(this.retryDelayMs * attempt);
      }
    }
  }

  private describeError(error: unknown): string {
    if (isAxiosError(error)) {
      if (error.response) {
        return `HTTP ${error.response.status} - ${JSON.stringify(error.response.data)}`;
      }
      if (error.code) {
        return `${error.code} - ${error.message}`;
      }
    }
    return error instanceof Error ? error.message : String(error);
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
