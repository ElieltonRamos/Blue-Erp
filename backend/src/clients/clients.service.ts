// src/clients/clients.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../database/prisma.service.js';
import { CreateClientDto } from './dto/create-client.dto.js';
import { ClientResponseDto } from './dto/client-response.dto.js';
import { PaginatedResponse } from 'src/common/paginated-response.js';
import { UpdateClientDto } from './dto/update-client.dto.js';
import { Prisma } from 'generated/prisma/client.js';

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  private cleanDigits(value: string): string {
    return value.replace(/\D/g, '');
  }

  private cleanCpf(cpf: string): string {
    return this.cleanDigits(cpf);
  }

  private validateCpf(cpf: string): void {
    if (this.cleanCpf(cpf).length !== 11) {
      throw new BadRequestException('CPF deve conter 11 dígitos numéricos');
    }
  }

  private cleanCnpj(cnpj: string): string {
    return this.cleanDigits(cnpj);
  }

  private validateCnpj(cnpj: string): void {
    if (this.cleanCnpj(cnpj).length !== 14) {
      throw new BadRequestException('CNPJ deve conter 14 dígitos numéricos');
    }
  }

  private normalizeZipCode(zipCode: string): string {
    const cleaned = this.cleanDigits(zipCode);
    if (cleaned.length !== 8) {
      throw new BadRequestException('CEP deve conter 8 dígitos numéricos');
    }
    return cleaned;
  }

  private async assertDocumentAvailable(
    field: 'cpf' | 'cnpj',
    value: string,
    excludeId?: number,
  ): Promise<void> {
    const where: Prisma.ClientWhereInput =
      field === 'cpf' ? { cpf: value } : { cnpj: value };
    if (excludeId) where.id = { not: excludeId };

    const exists = await this.prisma.client.client.findFirst({
      where,
      select: { id: true },
    });
    if (exists) {
      throw new ConflictException(
        `Já existe um cliente com este ${field === 'cpf' ? 'CPF' : 'CNPJ'}`,
      );
    }
  }

  async create(createClientDto: CreateClientDto): Promise<ClientResponseDto> {
    const { name } = createClientDto;

    let cpf: string | undefined;
    if (createClientDto.cpf) {
      this.validateCpf(createClientDto.cpf);
      cpf = this.cleanCpf(createClientDto.cpf);
      await this.assertDocumentAvailable('cpf', cpf);
    }

    let cnpj: string | undefined;
    if (createClientDto.cnpj) {
      this.validateCnpj(createClientDto.cnpj);
      cnpj = this.cleanCnpj(createClientDto.cnpj);
      await this.assertDocumentAvailable('cnpj', cnpj);
    }

    const zipCode = createClientDto.zipCode
      ? this.normalizeZipCode(createClientDto.zipCode)
      : undefined;

    const existingByName = await this.prisma.client.client.findFirst({
      where: { name },
    });
    if (existingByName) {
      throw new ConflictException('Já existe um cliente com este nome');
    }

    const client = await this.prisma.client.client.create({
      data: { ...createClientDto, cpf, cnpj, zipCode },
    });

    return new ClientResponseDto(client);
  }

  async findByCnpj(cnpj: string): Promise<ClientResponseDto | null> {
    this.validateCnpj(cnpj);

    const client = await this.prisma.client.client.findUnique({
      where: { cnpj: this.cleanCnpj(cnpj) },
    });

    return client ? new ClientResponseDto(client) : null;
  }

  async update(
    id: number,
    updateClientDto: UpdateClientDto,
  ): Promise<ClientResponseDto> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const existingClient = await this.prisma.client.client.findUnique({
      where: { id },
    });
    if (!existingClient) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // null = limpar o campo no banco | undefined = não alterar
    let cpf: string | null | undefined;
    if (updateClientDto.cpf === null) {
      cpf = null;
    } else if (updateClientDto.cpf) {
      this.validateCpf(updateClientDto.cpf);
      cpf = this.cleanCpf(updateClientDto.cpf);
      if (cpf !== existingClient.cpf) {
        await this.assertDocumentAvailable('cpf', cpf, id);
      }
    }

    let cnpj: string | null | undefined;
    if (updateClientDto.cnpj === null) {
      cnpj = null;
    } else if (updateClientDto.cnpj) {
      this.validateCnpj(updateClientDto.cnpj);
      cnpj = this.cleanCnpj(updateClientDto.cnpj);
      if (cnpj !== existingClient.cnpj) {
        await this.assertDocumentAvailable('cnpj', cnpj, id);
      }
    }

    let zipCode: string | null | undefined;
    if (updateClientDto.zipCode === null) {
      zipCode = null;
    } else if (updateClientDto.zipCode) {
      zipCode = this.normalizeZipCode(updateClientDto.zipCode);
    }

    if (updateClientDto.name && updateClientDto.name !== existingClient.name) {
      const nameExists = await this.prisma.client.client.findFirst({
        where: { name: updateClientDto.name, id: { not: id } },
      });
      if (nameExists) {
        throw new ConflictException('Já existe um cliente com este nome');
      }
    }

    const client = await this.prisma.client.client.update({
      where: { id },
      data: { ...updateClientDto, cpf, cnpj, zipCode },
    });

    return new ClientResponseDto(client);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
    name?: string,
    active?: boolean,
  ): Promise<PaginatedResponse<ClientResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      throw new BadRequestException(
        'A página ou a quantidade de itens por página está incorreta',
      );
    }

    const offset = (page - 1) * limit;

    // Construir filtros dinamicamente
    const where: Prisma.ClientWhereInput = {};

    // Filtro de active: se não for fornecido, busca apenas ativos (comportamento padrão)
    if (active !== undefined) {
      where.active = active;
    } else {
      where.active = true;
    }

    // Filtro de nome: busca parcial case-insensitive
    if (name) {
      where.name = {
        contains: name,
      };
    }

    const clients = await this.prisma.client.client.findMany({
      where,
      orderBy: { id: 'asc' },
      skip: offset,
      take: limit,
    });

    const total = await this.prisma.client.client.count({
      where,
    });

    const data = clients.map((client) => new ClientResponseDto(client));
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }

  async search(searchName: string): Promise<ClientResponseDto[]> {
    if (!searchName || searchName.trim() === '') {
      throw new BadRequestException('Nome de busca não pode ser vazio');
    }

    const clients = await this.prisma.client.client.findMany({
      where: {
        name: { contains: searchName },
        active: true,
      },
      orderBy: { name: 'asc' },
    });

    return clients.map((client) => new ClientResponseDto(client));
  }

  async findOne(id: number): Promise<ClientResponseDto> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const client = await this.prisma.client.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    return new ClientResponseDto(client);
  }

  async findByCpf(cpf: string): Promise<ClientResponseDto | null> {
    const cleanedCpf = this.cleanCpf(cpf);
    this.validateCpf(cleanedCpf);

    const client = await this.prisma.client.client.findUnique({
      where: { cpf: cleanedCpf },
    });

    if (!client) {
      return null;
    }

    return new ClientResponseDto(client);
  }

  async findByPhone(phone: string): Promise<ClientResponseDto[]> {
    if (!phone || phone.trim() === '') {
      throw new BadRequestException('Telefone não pode ser vazio');
    }

    const clients = await this.prisma.client.client.findMany({
      where: {
        phone: { contains: phone },
        active: true,
      },
    });

    return clients.map((client) => new ClientResponseDto(client));
  }

  async remove(id: number): Promise<{ message: string }> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const client = await this.prisma.client.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    // Marca como inativo
    await this.prisma.client.client.update({
      where: { id },
      data: { active: false },
    });

    return { message: 'Cliente deletado com sucesso' };
  }

  async restore(id: number): Promise<ClientResponseDto> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const client = await this.prisma.client.client.findUnique({
      where: { id },
    });

    if (!client) {
      throw new NotFoundException('Cliente não encontrado');
    }

    const restoredClient = await this.prisma.client.client.update({
      where: { id },
      data: { active: true },
    });

    return new ClientResponseDto(restoredClient);
  }
}
