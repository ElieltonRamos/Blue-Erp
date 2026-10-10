import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StoragePaths } from '../entities/fiscal-module.entity';
import { modelFromAccessKey } from '../lib/nfe-utils';
import {
  FiscalException,
  InvalidAccessKeyException,
} from '../fiscal.exception';

type StorageModel = '55' | '65';
type StorageKind = 'xml' | 'pdf';

const MODEL_FOLDER: Record<StorageModel, string> = {
  '55': 'nfe',
  '65': 'nfce',
};

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);

  constructor() {
    const models = Object.keys(MODEL_FOLDER) as StorageModel[];
    this.ensureDirectoriesExist(
      models.flatMap((model) => [
        this.baseDir(model, 'xml'),
        this.baseDir(model, 'pdf'),
      ]),
    );
  }

  private baseDir(model: StorageModel, kind: StorageKind): string {
    return path.join(process.cwd(), 'output', MODEL_FOLDER[model], kind);
  }

  private resolveModel(accessKey: string): StorageModel {
    if (!/^\d{44}$/.test(accessKey ?? '')) {
      throw new InvalidAccessKeyException();
    }

    const model = modelFromAccessKey(accessKey);
    if (model !== '55' && model !== '65') {
      throw new FiscalException(`Unsupported model "${model}" in access key`);
    }

    return model;
  }

  private ensureDirectoriesExist(directories: string[]): void {
    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Directory created: ${dir}`);
      }
    });
  }

  getStoragePaths(accessKey: string, emissionDate: Date): StoragePaths {
    const model = this.resolveModel(accessKey);
    const yearMonth = this.getYearMonthFolder(emissionDate);

    const xmlDir = path.join(this.baseDir(model, 'xml'), yearMonth);
    const pdfDir = path.join(this.baseDir(model, 'pdf'), yearMonth);

    this.ensureDirectoriesExist([xmlDir, pdfDir]);

    return {
      xmlDir,
      pdfDir,
      xmlPath: path.join(xmlDir, `${accessKey}.xml`),
      pdfPath: path.join(pdfDir, `${accessKey}.pdf`),
    };
  }

  async saveXml(xmlPath: string, xmlContent: string): Promise<void> {
    try {
      await fs.promises.writeFile(xmlPath, xmlContent, 'utf8');
      this.logger.log(`XML saved: ${xmlPath}`);
    } catch (error: any) {
      this.logger.error(`Error saving XML: ${error.message}`, error.stack);
      throw new Error(`Failed to save XML at ${xmlPath}: ${error.message}`);
    }
  }

  getPdfPath(accessKey: string, emissionDate: Date): string {
    const model = this.resolveModel(accessKey);
    const yearMonth = this.getYearMonthFolder(emissionDate);
    return path.join(this.baseDir(model, 'pdf'), yearMonth, `${accessKey}.pdf`);
  }

  fileExists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  private getYearMonthFolder(date: Date): string {
    const offset = -3 * 60;
    const local = new Date(date.getTime() + offset * 60 * 1000);
    const year = local.getUTCFullYear();
    const month = String(local.getUTCMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  extractAccessKey(xml: string): string | null {
    const match = xml.match(/Id="NFe(\d{44})"/);
    return match ? match[1] : null;
  }
}
