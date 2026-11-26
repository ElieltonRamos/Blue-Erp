// src/company/company.service.ts
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { promises as fs } from 'fs';
import path from 'path';
import { BusinessType } from 'generated/prisma/enums.js';
import { PrismaService } from '../../common/database/prisma.service.js';
import { CompanyResponseDto } from './dto/company-response.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';

export const COMPANY_ID = 1;

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

const SYSTEM_ACTOR = 'sistema';
const COMPANY_NOT_CONFIGURED = 'Empresa não configurada';
const COMPANY_NOT_FOUND_SETUP =
  'Empresa não encontrada. Configure os dados da empresa primeiro.';

@Injectable()
export class CompanyService {
  private readonly logger = new Logger(CompanyService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Loga como error só o que não foi decisão do próprio service (falha de banco,
  // bug, etc). HttpException já foi logada como warn onde foi lançada.
  private rethrow(error: unknown, context: string): never {
    if (!(error instanceof HttpException)) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`${context}: ${reason}`);
    }
    throw error;
  }

  // Chamadas internas (fiscal, numeração) usam o actor padrão
  private async findCompanyOrFail(
    actor = SYSTEM_ACTOR,
    message = COMPANY_NOT_CONFIGURED,
  ) {
    const company = await this.prisma.client.company.findUnique({
      where: { id: COMPANY_ID },
    });

    if (!company) {
      this.logger.warn(`${message} (actor=${actor})`);
      throw new NotFoundException(message);
    }

    return company;
  }

  private async fileExists(filePath: string | null): Promise<boolean> {
    if (!filePath) return false;

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async removeFileSafely(
    filePath: string | null,
    warnMessage: string,
    actor: string,
  ): Promise<void> {
    if (!filePath) return;

    try {
      await fs.unlink(filePath);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.warn(`${warnMessage} (actor=${actor}): ${reason}`);
    }
  }

  private formatCnpj(cnpj: string): string {
    return cnpj
      .replace(/\D/g, '')
      .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
  }

  private cleanUpdateData(data: UpdateCompanyDto): UpdateCompanyDto {
    const cleanedData = { ...data };

    Object.keys(cleanedData).forEach((key) => {
      if (cleanedData[key as keyof UpdateCompanyDto] === '') {
        delete cleanedData[key as keyof UpdateCompanyDto];
      }
    });

    return cleanedData;
  }

  async getCompany(actor: string = 'system'): Promise<CompanyResponseDto> {
    const company = await this.findCompanyOrFail(
      actor,
      COMPANY_NOT_FOUND_SETUP,
    );
    return new CompanyResponseDto(company);
  }

  async update(
    updateCompanyDto: UpdateCompanyDto,
    actor: string,
  ): Promise<CompanyResponseDto> {
    try {
      const existing = await this.findCompanyOrFail(
        actor,
        COMPANY_NOT_FOUND_SETUP,
      );

      if (updateCompanyDto.cnpj && updateCompanyDto.cnpj !== existing.cnpj) {
        const cnpjExists = await this.prisma.client.company.findFirst({
          where: { cnpj: updateCompanyDto.cnpj, id: { not: COMPANY_ID } },
        });
        if (cnpjExists) {
          this.logger.warn(`CNPJ já cadastrado (actor=${actor})`);
          throw new ConflictException('CNPJ já está cadastrado');
        }
      }

      const data = this.cleanUpdateData(updateCompanyDto);
      const fields = Object.keys(data);

      if (fields.length === 0) {
        this.logger.warn(
          `Edição da empresa sem alterações (actor=${actor}, id=${existing.id})`,
        );
        return new CompanyResponseDto(existing);
      }

      const company = await this.prisma.client.company.update({
        where: { id: existing.id },
        data,
      });

      // Só nomes dos campos, nunca valores
      this.logger.log(
        `Empresa editada (actor=${actor}, id=${company.id}, campos=${fields.join(',')})`,
      );

      if (data.cnpj !== undefined && data.cnpj !== existing.cnpj) {
        this.logger.warn(
          `CNPJ da empresa alterado (actor=${actor}, de=${existing.cnpj}, para=${company.cnpj})`,
        );
      }

      return new CompanyResponseDto(company);
    } catch (error) {
      this.rethrow(error, `Falha ao editar empresa (actor=${actor})`);
    }
  }

  async isCompanyConfigured(): Promise<boolean> {
    const count = await this.prisma.client.company.count({
      where: { id: COMPANY_ID },
    });
    return count > 0;
  }

  async deleteCompany(actor: string): Promise<{ message: string }> {
    try {
      const company = await this.findCompanyOrFail(
        actor,
        'Nenhuma empresa para deletar',
      );

      await this.removeFileSafely(
        company.certificatePath,
        'Certificado não encontrado para remoção',
        actor,
      );

      await this.prisma.client.company.delete({ where: { id: company.id } });

      this.logger.log(`Empresa removida (actor=${actor}, id=${company.id})`);
      return { message: 'Configuração da empresa resetada com sucesso' };
    } catch (error) {
      this.rethrow(error, `Falha ao remover empresa (actor=${actor})`);
    }
  }

  async getNextNfceNumber(): Promise<{ data: number }> {
    const company = await this.findCompanyOrFail();
    return { data: company.nfceCurrentNumber + 1 };
  }

  async incrementNfceNumber(): Promise<{ data: number }> {
    await this.findCompanyOrFail();

    const updated = await this.prisma.client.company.update({
      where: { id: COMPANY_ID },
      data: { nfceCurrentNumber: { increment: 1 } },
      select: { nfceCurrentNumber: true },
    });

    return { data: updated.nfceCurrentNumber };
  }

  async getNextNfeNumber(): Promise<{ data: number }> {
    const company = await this.findCompanyOrFail();
    return { data: company.nfeCurrentNumber + 1 };
  }

  async incrementNfeNumber(): Promise<{ data: number }> {
    await this.findCompanyOrFail();

    const updated = await this.prisma.client.company.update({
      where: { id: COMPANY_ID },
      data: { nfeCurrentNumber: { increment: 1 } },
      select: { nfeCurrentNumber: true },
    });

    return { data: updated.nfeCurrentNumber };
  }

  async getCertificateConfig(): Promise<{
    exists: boolean;
    certificateInfo?: { hasPassword: boolean; expirationDate?: Date | null };
  }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: COMPANY_ID },
    });

    if (!company || !company.certificatePath) {
      return { exists: false };
    }

    if (!(await this.fileExists(company.certificatePath))) {
      return { exists: false };
    }

    return {
      exists: true,
      certificateInfo: {
        hasPassword:
          String(company.certificatePassword ?? '').trim().length > 0,
        expirationDate: company.certificateExpirationDate,
      },
    };
  }

  async getCertificateBuffer(): Promise<{
    pfxBuffer: Buffer;
    password: string;
  }> {
    const company = await this.findCompanyOrFail();

    if (!company.certificatePath) {
      throw new NotFoundException('Certificado não cadastrado');
    }

    if (!(await this.fileExists(company.certificatePath))) {
      throw new NotFoundException('Arquivo de certificado não encontrado');
    }

    return {
      pfxBuffer: await fs.readFile(company.certificatePath),
      password: company.certificatePassword || '',
    };
  }

  async uploadCompanyCertificate(
    file: UploadedFile,
    certificatePassword: string,
    actor: string,
    expirationDate?: Date,
  ): Promise<CompanyResponseDto> {
    try {
      const company = await this.findCompanyOrFail(actor);

      if (!file || !file.buffer) {
        this.logger.warn(`Arquivo de certificado inválido (actor=${actor})`);
        throw new BadRequestException('Arquivo de certificado inválido');
      }

      const fileExtension = path.extname(file.originalname).toLowerCase();
      if (!['.pfx', '.p12'].includes(fileExtension)) {
        this.logger.warn(
          `Formato de certificado inválido (actor=${actor}, ext=${fileExtension})`,
        );
        throw new BadRequestException(
          'Formato de certificado inválido. Use .pfx ou .p12',
        );
      }

      const certsDir = path.join(process.cwd(), 'certs');
      const filePath = path.join(
        certsDir,
        `cert_${Date.now()}_${company.cnpj}${fileExtension}`,
      );

      await fs.mkdir(certsDir, { recursive: true });
      await fs.writeFile(filePath, file.buffer);

      const updatedCompany = await this.prisma.client.company.update({
        where: { id: company.id },
        data: {
          certificatePath: filePath,
          certificatePassword,
          certificateExpirationDate: expirationDate || null,
        },
      });

      // Apaga o antigo só depois de gravar o novo no banco
      await this.removeFileSafely(
        company.certificatePath,
        'Certificado antigo não encontrado',
        actor,
      );

      // Nunca logar a senha nem o caminho do certificado
      this.logger.log(
        `Certificado da empresa atualizado (actor=${actor}, id=${company.id})`,
      );

      return new CompanyResponseDto({
        ...updatedCompany,
        cnpj: this.formatCnpj(updatedCompany.cnpj),
      });
    } catch (error) {
      this.rethrow(error, `Falha ao enviar certificado (actor=${actor})`);
    }
  }

  async getCscConfig(): Promise<{ nfceCsc: string; nfceCscId: string }> {
    const company = await this.findCompanyOrFail();

    if (!company.nfceCsc || !company.nfceCscId) {
      throw new NotFoundException(
        'CSC e ID do CSC não configurados. Acesse as configurações da empresa e informe os dados do CSC.',
      );
    }

    return { nfceCsc: company.nfceCsc, nfceCscId: company.nfceCscId };
  }

  async deleteCertificate(actor: string): Promise<{ message: string }> {
    try {
      const company = await this.findCompanyOrFail(actor);

      if (!company.certificatePath) {
        this.logger.warn(`Nenhum certificado cadastrado (actor=${actor})`);
        throw new NotFoundException('Nenhum certificado cadastrado');
      }

      await this.prisma.client.company.update({
        where: { id: company.id },
        data: {
          certificatePath: '',
          certificatePassword: '',
          certificateExpirationDate: null,
        },
      });

      await this.removeFileSafely(
        company.certificatePath,
        'Erro ao remover certificado',
        actor,
      );

      this.logger.log(
        `Certificado da empresa removido (actor=${actor}, id=${company.id})`,
      );
      return { message: 'Certificado removido com sucesso' };
    } catch (error) {
      this.rethrow(error, `Falha ao remover certificado (actor=${actor})`);
    }
  }

  async getBusinessType(): Promise<{ businessType: BusinessType | null }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: COMPANY_ID },
      select: { businessType: true },
    });
    return { businessType: company?.businessType ?? null };
  }
}
