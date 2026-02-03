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
import { plainToInstance } from 'class-transformer';

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
    // Verifica se já existe uma empresa cadastrada
    const existingCompany = await this.prisma.client.company.findFirst();
    if (existingCompany) {
      throw new ConflictException(
        'Já existe uma empresa cadastrada no sistema',
      );
    }

    // Verifica se CNPJ já existe
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
    // Sempre busca a empresa com ID 1
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
    // Verifica se a empresa existe
    const existingCompany = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!existingCompany) {
      throw new NotFoundException(
        'Empresa não encontrada. Configure os dados da empresa primeiro.',
      );
    }

    // Verifica se CNPJ já existe em outra empresa (improvável, mas por segurança)
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

    // Limpa dados vazios (similar ao cleanUpdateData do arquivo 2)
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

    // Remove certificado se existir
    if (company.certificatePath) {
      try {
        await fs.unlink(company.certificatePath);
      } catch {
        // Ignora erro se arquivo não existir
        console.warn('Certificado não encontrado para remoção');
      }
    }

    // Deleta empresa (reset config)
    await this.prisma.client.company.delete({
      where: { id: 1 },
    });

    return { message: 'Configuração da empresa resetada com sucesso' };
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

  async getCertificadoConfig(): Promise<{
    existe: boolean;
    certificadoInfo?: { temSenha: boolean; expirationDate?: Date | null };
  }> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });

    if (!company || !company.certificatePath) {
      return { existe: false };
    }

    const existe = await this.certificadoExiste(company.certificatePath);

    // Verifica se tem senha de forma segura
    let temSenha = false;
    if (company.certificatePassword) {
      const senha = String(company.certificatePassword);
      temSenha = senha.trim().length > 0;
    }

    return {
      existe,
      certificadoInfo: existe
        ? {
            temSenha,
            expirationDate: company.certificateExpirationDate,
          }
        : undefined,
    };
  }

  async getCertificadoBuffer(): Promise<{
    pfxBuffer: Buffer;
    senha: string;
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

    const existe = await this.certificadoExiste(company.certificatePath);
    if (!existe) {
      throw new NotFoundException('Arquivo de certificado não encontrado');
    }

    const pfxBuffer = await fs.readFile(company.certificatePath);

    return {
      pfxBuffer,
      senha: company.certificatePassword || '',
    };
  }

  async uploadCompanyCertificate(
    file: UploadedFile,
    certificadoSenha: string,
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

    // Valida extensão do arquivo
    const allowedExtensions = ['.pfx', '.p12'];
    const fileExtension = path.extname(file.originalname).toLowerCase();
    if (!allowedExtensions.includes(fileExtension)) {
      throw new BadRequestException(
        'Formato de certificado inválido. Use .pfx ou .p12',
      );
    }

    const certsDir = path.join(process.cwd(), 'certs');

    // Remove certificado antigo se existir
    if (company.certificatePath) {
      try {
        await fs.unlink(company.certificatePath);
      } catch {
        console.warn('Certificado antigo não encontrado');
      }
    }

    // Salva novo certificado
    const fileName = `cert_${Date.now()}_${company.cnpj}${fileExtension}`;
    const filePath = path.join(certsDir, fileName);

    // Cria pasta se não existir
    await fs.mkdir(certsDir, { recursive: true });
    await fs.writeFile(filePath, file.buffer);

    // Atualiza no banco
    const updatedCompany = await this.prisma.client.company.update({
      where: { id: 1 },
      data: {
        certificatePath: filePath,
        certificatePassword: certificadoSenha,
        certificateExpirationDate: expirationDate || null,
      },
    });

    return plainToInstance(CompanyResponseDto, {
      ...updatedCompany,
      cnpj: this.formatCnpj(updatedCompany.cnpj),
    });
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

    // Remove arquivo físico
    try {
      await fs.unlink(company.certificatePath);
    } catch {
      console.warn('Erro ao remover certificado');
    }

    // Remove do banco - usando undefined ao invés de null
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

  // Métodos auxiliares privados
  private async certificadoExiste(filePath: string | null): Promise<boolean> {
    if (!filePath) return false;

    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private formatCnpj(cnpj: string): string {
    // Remove formatação existente
    const cleanCnpj = cnpj.replace(/\D/g, '');

    // Aplica formatação XX.XXX.XXX/XXXX-XX
    return cleanCnpj.replace(
      /(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/,
      '$1.$2.$3/$4-$5',
    );
  }

  private cleanUpdateData(data: UpdateCompanyDto): UpdateCompanyDto {
    const cleanedData = { ...data };

    // Remove senha de certificado se for string vazia
    if (cleanedData.certificatePassword === '') {
      delete cleanedData.certificatePassword;
    }

    // Remove outros campos vazios se necessário
    Object.keys(cleanedData).forEach((key) => {
      const value = cleanedData[key as keyof UpdateCompanyDto];
      if (value === '') {
        delete cleanedData[key as keyof UpdateCompanyDto];
      }
    });

    return cleanedData;
  }
}
