import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { StoragePaths } from '../entities/fiscal-module.entity';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly xmlBaseDir = './output/nfce/xml';
  private readonly pdfBaseDir = './output/nfce/pdf';

  private ensureDirectoriesExist(directories: string[]): void {
    directories.forEach((dir) => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        this.logger.log(`Directory created: ${dir}`);
      }
    });
  }

  getStoragePaths(accessKey: string, emissionDate: Date): StoragePaths {
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

  saveXml(xmlPath: string, xmlContent: string): void {
    try {
      fs.writeFileSync(xmlPath, xmlContent);
      this.logger.log(`XML saved: ${xmlPath}`);
    } catch (error) {
      this.logger.error(`Error saving XML: ${error.message}`, error.stack);
      throw error;
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
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${year}-${month}`;
  }

  extractAccessKey(xml: string): string | null {
    const match = xml.match(/\d{44}/);
    return match ? match[0] : null;
  }
}
