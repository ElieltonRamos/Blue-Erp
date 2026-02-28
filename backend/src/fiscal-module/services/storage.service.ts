import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StoragePaths } from '../entities/fiscal-module.entity';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly xmlBaseDir = path.join(
    process.cwd(),
    'output',
    'nfce',
    'xml',
  );
  private readonly pdfBaseDir = path.join(
    process.cwd(),
    'output',
    'nfce',
    'pdf',
  );

  constructor() {
    this.ensureDirectoriesExist([this.xmlBaseDir, this.pdfBaseDir]);
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
    if (!accessKey || accessKey.length !== 44) {
      throw new Error(`Invalid access key: ${accessKey}`);
    }

    const yearMonth = this.getYearMonthFolder(emissionDate);

    const xmlDir = path.join(this.xmlBaseDir, yearMonth);
    const pdfDir = path.join(this.pdfBaseDir, yearMonth);

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
    } catch (error) {
      this.logger.error(`Error saving XML: ${error.message}`, error.stack);
      throw new Error(`Failed to save XML at ${xmlPath}: ${error.message}`);
    }
  }

  getPdfPath(accessKey: string, emissionDate: Date): string {
    const yearMonth = this.getYearMonthFolder(emissionDate);
    return path.join(this.pdfBaseDir, yearMonth, `${accessKey}.pdf`);
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
