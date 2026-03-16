// src/company/company.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { CompanyResponseDto } from './dto/company-response.dto.js';
import { promises as fs } from 'fs';
import path from 'path';

interface UploadedFile {
  originalname: string;
  buffer: Buffer;
  mimetype: string;
  size: number;
}

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async create(
    createCompanyDto: CreateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const existingCompany = await this.prisma.client.company.findFirst();
    if (existingCompany) {
      throw new ConflictException(
        'Já existe uma empresa cadastrada no sistema',
      );
    }

    const existingCnpj = await this.prisma.client.company.findUnique({
      where: { cnpj: createCompanyDto.cnpj },
    });
    if (existingCnpj) {
      throw new ConflictException('CNPJ já está cadastrado');
    }

    const companyData = {
      ...createCompanyDto,
      certificateExpirationDate: createCompanyDto.certificateExpirationDate
        ? new Date(createCompanyDto.certificateExpirationDate)
        : null,
    };

    const company = await this.prisma.client.company.create({
      data: companyData,
    });

    return new CompanyResponseDto(company);
  }

  async getCompany(): Promise<CompanyResponseDto> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new NotFoundException(
        'Empresa não encontrada. Configure os dados da empresa primeiro.',
      );
    }

    return new CompanyResponseDto(company);
  }

  async update(
    updateCompanyDto: UpdateCompanyDto,
  ): Promise<CompanyResponseDto> {
    const existingCompany = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!existingCompany) {
      throw new NotFoundException(
        'Empresa não encontrada. Configure os dados da empresa primeiro.',
      );
    }

    if (
      updateCompanyDto.cnpj &&
      updateCompanyDto.cnpj !== existingCompany.cnpj
    ) {
      const cnpjExists = await this.prisma.client.company.findFirst({
        where: {
          cnpj: updateCompanyDto.cnpj,
          id: { not: 1 },
        },
      });
      if (cnpjExists) {
        throw new ConflictException('CNPJ já está cadastrado');
      }
    }

    const cleanedData = this.cleanUpdateData(updateCompanyDto);

    const company = await this.prisma.client.company.update({
      where: { id: 1 },
      data: cleanedData,
    });

    return new CompanyResponseDto(company);
  }

  async isCompanyConfigured(): Promise<boolean> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });
    return !!company;
  }

  async deleteCompany(): Promise<{ message: string }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new NotFoundException('Nenhuma empresa para deletar');
    }

    if (company.certificatePath) {
      try {
        await fs.unlink(company.certificatePath);
      } catch {
        console.warn('Certificado não encontrado para remoção');
      }
    }

    await this.prisma.client.company.delete({
      where: { id: 1 },
    });

    return { message: 'Configuração da empresa resetada com sucesso' };
  }

  async getNextNfceNumber(): Promise<{ data: number }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new NotFoundException('Empresa não configurada');
    }

    return { data: company.nfceCurrentNumber + 1 };
  }

  async incrementNfceNumber(): Promise<{ data: number }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new NotFoundException('Empresa não configurada');
    }

    const nextNumber = company.nfceCurrentNumber + 1;

    await this.prisma.client.company.update({
      where: { id: 1 },
      data: { nfceCurrentNumber: nextNumber },
    });

    return { data: nextNumber };
  }

  async getCertificateConfig(): Promise<{
    exists: boolean;
    certificateInfo?: { hasPassword: boolean; expirationDate?: Date | null };
  }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company || !company.certificatePath) {
      return { exists: false };
    }

    const fileExists = await this.certificateFileExists(
      company.certificatePath,
    );

    let hasPassword = false;
    if (company.certificatePassword) {
      const password = String(company.certificatePassword);
      hasPassword = password.trim().length > 0;
    }

    return {
      exists: fileExists,
      certificateInfo: fileExists
        ? {
            hasPassword,
            expirationDate: company.certificateExpirationDate,
          }
        : undefined,
    };
  }

  async getCertificateBuffer(): Promise<{
    pfxBuffer: Buffer;
    password: string;
  }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new NotFoundException('Empresa não configurada');
    }

    if (!company.certificatePath) {
      throw new NotFoundException('Certificado não cadastrado');
    }

    const fileExists = await this.certificateFileExists(
      company.certificatePath,
    );
    if (!fileExists) {
      throw new NotFoundException('Arquivo de certificado não encontrado');
    }

    const pfxBuffer = await fs.readFile(company.certificatePath);

    return {
      pfxBuffer,
      password: company.certificatePassword || '',
    };
  }

  async uploadCompanyCertificate(
    file: UploadedFile,
    certificatePassword: string,
    expirationDate?: Date,
  ): Promise<CompanyResponseDto> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new NotFoundException('Empresa não configurada');
    }

    if (!file || !file.buffer) {
      throw new BadRequestException('Arquivo de certificado inválido');
    }

    const allowedExtensions = ['.pfx', '.p12'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Formato de certificado inválido. Use .pfx ou .p12',
      );
    }

    const certsDir = path.join(process.cwd(), 'certs');

    if (company.certificatePath) {
      try {
        await fs.unlink(company.certificatePath);
      } catch {
        console.warn('Certificado antigo não encontrado');
      }
    }

    const fileName = `cert_${Date.now()}_${company.cnpj}${fileExtension}`;
    const filePath = path.join(certsDir, fileName);

    await fs.mkdir(certsDir, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    const updatedCompany = await this.prisma.client.company.update({
      where: { id: 1 },
      data: {
        certificatePath: filePath,
        certificatePassword: certificatePassword,
        certificateExpirationDate: expirationDate || null,
      },
    });

    return new CompanyResponseDto({
      ...updatedCompany,
      cnpj: this.formatCnpj(updatedCompany.cnpj),
    });
  }

  async getCscConfig(): Promise<{ nfceCsc: string; nfceCscId: string }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
      select: { nfceCsc: true, nfceCscId: true },
    });

    if (!company) {
      throw new NotFoundException('Empresa não configurada');
    }

    if (!company.nfceCsc || !company.nfceCscId) {
      throw new NotFoundException(
        'CSC e ID do CSC não configurados. Acesse as configurações da empresa e informe os dados do CSC.',
      );
    }

    return {
      nfceCsc: company.nfceCsc,
      nfceCscId: company.nfceCscId,
    };
  }

  async deleteCertificate(): Promise<{ message: string }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company) {
      throw new NotFoundException('Empresa não configurada');
    }

    if (!company.certificatePath) {
      throw new NotFoundException('Nenhum certificado cadastrado');
    }

    try {
      await fs.unlink(company.certificatePath);
    } catch {
      console.warn('Erro ao remover certificado');
    }

    await this.prisma.client.company.update({
      where: { id: 1 },
      data: {
        certificatePath: undefined,
        certificatePassword: undefined,
        certificateExpirationDate: undefined,
      },
    });

    return { message: 'Certificado removido com sucesso' };
  }

  // Private helper methods
  private async certificateFileExists(
    filePath: string | null,
  ): Promise<boolean> {
    if (!filePath) return false;

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private formatCnpj(cnpj: string): string {
    const cleanCnpj = cnpj.replace(/\D/g, '');

    return cleanCnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  private cleanUpdateData(data: UpdateCompanyDto): UpdateCompanyDto {
    const cleanedData = { ...data };

    Object.keys(cleanedData).forEach((key) => {
      const value = cleanedData[key as keyof UpdateCompanyDto];
      if (value === '') {
        delete cleanedData[key as keyof UpdateCompanyDto];
      }
    });

    return cleanedData;
  }
}
