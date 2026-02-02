// src/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UsersService } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { UserFiltersDto } from './dto/user-filter.dto.js';

@ApiTags('users') // Agrupa endpoints
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @ApiOperation({ summary: 'Criar novo usuário' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Usuário criado com sucesso',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Dados inválidos',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Listar todos os usuários' })
  @ApiQuery({ name: 'username', required: false })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: ['caixa', 'garcom', 'admin'],
  })
  @ApiQuery({
    name: 'workplace',
    required: false,
    enum: ['local1', 'local2', 'local3'],
  })
  @ApiQuery({ name: 'active', required: false, enum: ['true', 'false'] })
  @ApiResponse({ status: HttpStatus.OK, description: 'Lista de usuários' })
  findAll(@Query() filters?: UserFiltersDto) {
    return this.usersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Atualizar usuário' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Remover usuário (soft delete)' })
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
