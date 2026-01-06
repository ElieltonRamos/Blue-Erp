// src/company/company.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateCompanyDto } from './dto/create-company.dto.js';
import { UpdateCompanyDto } from './dto/update-company.dto.js';
import { CompanyResponseDto } from './dto/company-response.dto.js';

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

    const company = await this.prisma.client.company.create({
      data: createCompanyDto,
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

    const company = await this.prisma.client.company.update({
      where: { id: 1 },
      data: updateCompanyDto,
    });

    return new CompanyResponseDto(company);
  }

  async isCompanyConfigured(): Promise<boolean> {
    const company = await this.prisma.client.company.findUnique({
      where: { id: 1 },
    });
    return !!company;
  }
}
