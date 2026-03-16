import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../database/prisma.service.js';
import * as bcrypt from 'bcryptjs';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UserResponseDto } from './dto/user-response.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserFiltersDto } from './dto/user-filter.dto.js';
import { LoginDto } from './dto/login.dto.js';
import { Prisma } from 'generated/prisma/client.js';
import { LicenseSystemService } from '../license-system/license-system.service.js';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private licenseService: LicenseSystemService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<UserResponseDto> {
    // Verifica se username já existe
    const existingUsername = await this.prisma.client.user.findUnique({
      where: { username: createUserDto.username },
    });
    if (existingUsername) {
      throw new ConflictException('Nome de usuário já está em uso');
    }

    // Hash da senha
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = await this.prisma.client.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
    });

    const { password: _password, ...result } = user;
    return new UserResponseDto(result);
  }
  async findAll(filters?: UserFiltersDto): Promise<UserResponseDto[]> {
    const where: Prisma.UserWhereInput = {
      active: true,
    };

    // Aplica filtros do frontend
    if (filters?.username) {
      where.username = {
        contains: filters.username,
      };
    }
    if (filters?.role) {
      where.role = filters.role;
    }
    if (filters?.workplace) {
      where.workplace = filters.workplace;
    }
    if (filters?.active !== undefined) {
      where.active = filters.active; // sobrescreve o default se enviado
    }

    const users = await this.prisma.client.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return users.map((user) => {
      const { password: _password, ...result } = user;
      return new UserResponseDto(result);
    });
  }

  async findOne(id: number): Promise<UserResponseDto> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    const user = await this.prisma.client.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const { password: _password, ...result } = user;
    return new UserResponseDto(result);
  }

  async findByUsername(username: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        username,
      },
    });

    if (!user) {
      return null;
    }

    const { password: _password, ...result } = user;
    return new UserResponseDto(result);
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    if (id === 1) {
      throw new BadRequestException('Este usuário não pode ser editado');
    }

    // Verifica se usuário existe
    const existingUser = await this.prisma.client.user.findFirst({
      where: {
        id,
      },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verifica se username já existe em outro usuário
    if (
      updateUserDto.username &&
      updateUserDto.username !== existingUser.username
    ) {
      const usernameExists = await this.prisma.client.user.findFirst({
        where: {
          username: updateUserDto.username,
          id: { not: id },
        },
      });
      if (usernameExists) {
        throw new ConflictException('Nome de usuário já está em uso');
      }
    }

    // Prepara os dados
    const data: Partial<CreateUserDto> = { ...updateUserDto };

    // Hash da senha se foi enviada
    if (updateUserDto.password) {
      data.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    const user = await this.prisma.client.user.update({
      where: { id },
      data,
    });

    const { password: _password, ...result } = user;
    return new UserResponseDto(result);
  }

  async remove(id: number): Promise<{ message: string }> {
    if (isNaN(id) || id <= 0) {
      throw new BadRequestException('ID inválido');
    }

    if (id === 1) {
      throw new BadRequestException('Este usuário não pode ser removido');
    }

    // Verifica se usuário existe e não está deletado
    const user = await this.prisma.client.user.findFirst({
      where: {
        id,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Soft delete
    await this.prisma.client.user.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        active: false,
      },
    });

    return { message: 'Usuário removido com sucesso' };
  }

  async validateCredentials(
    username: string,
    password: string,
  ): Promise<UserResponseDto> {
    const user = await this.prisma.client.user.findFirst({
      where: {
        username,
        active: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new BadRequestException('Senha inválida');
    }

    const { password: _password, ...result } = user;
    return new UserResponseDto(result);
  }

  async login(
    loginDto: LoginDto,
  ): Promise<{ token: string; licenseWarning?: string }> {
    const { username, password } = loginDto;

    const user = await this.prisma.client.user.findUnique({
      where: { username },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    if (!user.active) {
      throw new UnauthorizedException('Usuário inativo');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    // Validação da licença
    const license = await this.licenseService.validate();

    if (!license.isValid) {
      throw new UnauthorizedException(
        'Licença inválida ou expirada. Entre em contato com o suporte via WhatsApp: (38) 98866-3580',
      );
    }

    const payload = {
      userId: user.id,
      username: user.username,
      role: user.role,
    };

    const token = await this.jwtService.signAsync(payload);

    // Retorna aviso se em modo offline
    if (license.message) {
      return { token, licenseWarning: license.message };
    }

    return { token };
  }
}
