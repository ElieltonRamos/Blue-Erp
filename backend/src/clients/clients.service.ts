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

@Injectable()
export class ClientsService {
  constructor(private prisma: PrismaService) {}

  private cleanCpf(cpf: string): string {
    return cpf.replace(/\D/g, '');
  }

  private validateCpf(cpf: string): void {
    const cleanedCpf = this.cleanCpf(cpf);
    if (cleanedCpf.length !== 11) {
      throw new BadRequestException('CPF deve conter 11 dígitos numéricos');
    }
  }

  async create(createClientDto: CreateClientDto): Promise<ClientResponseDto> {
    const { name, cpf } = createClientDto;

    // Valida e limpa CPF se foi enviado
    let cleanedCpf: string | undefined;
    if (cpf) {
      this.validateCpf(cpf);
      cleanedCpf = this.cleanCpf(cpf);

      // Verifica se CPF já existe
      const existingByCpf = await this.prisma.client.client.findUnique({
        where: { cpf: cleanedCpf },
      });
      if (existingByCpf) {
        throw new ConflictException('Já existe um cliente com este CPF');
      }
    }

    // Verifica se nome já existe
    const existingByName = await this.prisma.client.client.findFirst({
      where: { name },
    });
    if (existingByName) {
      throw new ConflictException('Já existe um cliente com este nome');
    }

    const client = await this.prisma.client.client.create({
      data: {
        ...createClientDto,
        cpf: cleanedCpf,
      },
    });

    return new ClientResponseDto(client);
  }

  async findAll(
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<ClientResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      throw new BadRequestException(
        'A página ou a quantidade de itens por página está incorreta',
      );
    }

    const offset = (page - 1) * limit;

    // ✅ Tipagem explícita para evitar erro do ESLint
    const clients = await this.prisma.client.client.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
      skip: offset,
      take: limit,
    });

    const total = await this.prisma.client.client.count({
      where: { active: true },
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

    // Valida e limpa CPF se foi enviado
    let cleanedCpf: string | undefined;
    if (updateClientDto.cpf) {
      this.validateCpf(updateClientDto.cpf);
      cleanedCpf = this.cleanCpf(updateClientDto.cpf);

      // Verifica se CPF já existe em OUTRO cliente
      if (cleanedCpf !== existingClient.cpf) {
        const cpfExists = await this.prisma.client.client.findFirst({
          where: {
            cpf: cleanedCpf,
            id: { not: id },
          },
        });
        if (cpfExists) {
          throw new ConflictException('Já existe um cliente com este CPF');
        }
      }
    }

    // Verifica se nome já existe em OUTRO cliente
    if (updateClientDto.name && updateClientDto.name !== existingClient.name) {
      const nameExists = await this.prisma.client.client.findFirst({
        where: {
          name: updateClientDto.name,
          id: { not: id },
        },
      });
      if (nameExists) {
        throw new ConflictException('Já existe um cliente com este nome');
      }
    }

    const client = await this.prisma.client.client.update({
      where: { id },
      data: {
        ...updateClientDto,
        cpf: cleanedCpf,
      },
    });

    return new ClientResponseDto(client);
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
