import { BadRequestException, ConflictException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Option, Prisma } from 'generated/prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { PaginatedResponseDto } from 'src/common/utils/paginated-response';
import { CreateOptionGroupDto } from './dto/create-option-group.dto';
import { FilterOptionGroupDto, OPTION_GROUP_SORT_KEYS, SORT_ORDERS } from './dto/filter-option-group.dto';
import { OptionGroupResponseDto } from './dto/option-group-response.dto';
import { UpdateOptionDto, UpdateOptionGroupDto } from './dto/update-option-group.dto';
import { OPTION_GROUP_INCLUDE, OptionGroupDetail } from './option-group.constants';

interface OptionsPlan {
  create: { item: UpdateOptionDto; index: number }[];
  update: { id: number; data: Prisma.OptionUncheckedUpdateInput }[];
  remove: number[];
}

@Injectable()
export class OptionGroupService {
  private readonly logger = new Logger(OptionGroupService.name);

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

  private badRequest(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new BadRequestException(message);
  }

  private conflict(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new ConflictException(message);
  }

  private notFound(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new NotFoundException(message);
  }

  private async findGroup(id: number, actor: string): Promise<OptionGroupDetail> {
    const group = await this.prisma.client.optionGroup.findUnique({ where: { id }, include: OPTION_GROUP_INCLUDE });

    if (!group) {
      this.notFound(`Grupo de opções com ID ${id} não encontrado`, actor);
    }

    return group;
  }

  private async assertNameAvailable(name: string, actor: string, ignoreId?: number): Promise<void> {
    const existing = await this.prisma.client.optionGroup.findFirst({
      where: { name: { equals: name }, ...(ignoreId !== undefined && { id: { not: ignoreId } }) },
      select: { id: true },
    });

    if (existing) {
      this.conflict(`Grupo de opções com nome "${name}" já existe`, actor);
    }
  }

  private async assertMaterialsExist(materialIds: (number | null | undefined)[], actor: string): Promise<void> {
    const ids = [...new Set(materialIds.filter((id): id is number => id != null))];

    if (ids.length === 0) return;

    const found = await this.prisma.client.primaryMaterial.findMany({ where: { id: { in: ids } }, select: { id: true } });

    if (found.length !== ids.length) {
      const foundIds = found.map((material) => material.id);
      const missing = ids.filter((id) => !foundIds.includes(id));
      this.notFound(`Matéria(s)-prima(s) com ID(s) ${missing.join(', ')} não encontrada(s)`, actor);
    }
  }

  private validateRules(min: number, max: number | null, maxPerOption: number | null, actor: string): void {
    if (max !== null && max < min) {
      this.badRequest('O máximo do grupo não pode ser menor que o mínimo', actor);
    }

    if (max !== null && maxPerOption !== null && maxPerOption > max) {
      this.badRequest('O máximo por opção não pode ser maior que o máximo do grupo', actor);
    }
  }

  // Só os campos do grupo enviados que realmente mudaram
  private diffGroup(current: OptionGroupDetail, dto: UpdateOptionGroupDto): Prisma.OptionGroupUpdateInput {
    const changes: Prisma.OptionGroupUpdateInput = {};

    if (dto.name !== undefined && dto.name !== current.name) {
      changes.name = dto.name;
    }
    if (dto.type !== undefined && dto.type !== current.type) {
      changes.type = dto.type;
    }
    if (dto.min !== undefined && dto.min !== current.min) {
      changes.min = dto.min;
    }
    if (dto.max !== undefined && dto.max !== current.max) {
      changes.max = dto.max;
    }
    if (dto.maxPerOption !== undefined && dto.maxPerOption !== current.maxPerOption) {
      changes.maxPerOption = dto.maxPerOption;
    }

    return changes;
  }

  // Só os campos da opção enviados que realmente mudaram
  private diffOption(current: Option, dto: UpdateOptionDto): Prisma.OptionUncheckedUpdateInput {
    const changes: Prisma.OptionUncheckedUpdateInput = {};

    if (dto.name !== undefined && dto.name !== current.name) {
      changes.name = dto.name;
    }
    if (dto.price !== undefined && dto.price !== current.price.toNumber()) {
      changes.price = dto.price;
    }
    if (dto.available !== undefined && dto.available !== current.available) {
      changes.available = dto.available;
    }
    if (dto.sortOrder !== undefined && dto.sortOrder !== current.sortOrder) {
      changes.sortOrder = dto.sortOrder;
    }
    if (dto.materialId !== undefined && dto.materialId !== current.materialId) {
      changes.materialId = dto.materialId;
    }

    return changes;
  }

  // Compara a lista enviada com as opções atuais: o que criar, atualizar e remover
  private planOptions(current: OptionGroupDetail, items: UpdateOptionDto[], actor: string): OptionsPlan {
    const ids = items.map((item) => item.id).filter((id): id is number => id != null);

    if (new Set(ids).size !== ids.length) {
      this.badRequest('A lista de opções possui IDs repetidos', actor);
    }

    const currentById = new Map(current.options.map((option) => [option.id, option]));

    for (const id of ids) {
      if (!currentById.has(id)) {
        this.badRequest(`A opção com ID ${id} não pertence ao grupo`, actor);
      }
    }

    const plan: OptionsPlan = {
      create: [],
      update: [],
      remove: current.options.filter((option) => !ids.includes(option.id)).map((option) => option.id),
    };

    items.forEach((item, index) => {
      if (item.id == null) {
        plan.create.push({ item, index });
        return;
      }

      const option = currentById.get(item.id);
      if (!option) return;

      const data = this.diffOption(option, item);
      if (Object.keys(data).length > 0) {
        plan.update.push({ id: item.id, data });
      }
    });

    return plan;
  }

  /**
   * Criar grupo de opções (com ou sem opções)
   */
  async create(dto: CreateOptionGroupDto, actor: string) {
    try {
      const min = dto.min ?? 0;
      const max = dto.max ?? null;
      const maxPerOption = dto.maxPerOption ?? null;

      this.validateRules(min, max, maxPerOption, actor);
      await this.assertNameAvailable(dto.name, actor);
      await this.assertMaterialsExist(
        (dto.options ?? []).map((option) => option.materialId),
        actor,
      );

      const group = await this.prisma.client.optionGroup.create({
        data: {
          name: dto.name,
          type: dto.type,
          min,
          max,
          maxPerOption,
          options:
            dto.options && dto.options.length > 0
              ? {
                  create: dto.options.map((option, index) => ({
                    name: option.name,
                    price: option.price,
                    available: option.available,
                    sortOrder: option.sortOrder ?? index,
                    materialId: option.materialId ?? null,
                  })),
                }
              : undefined,
        },
        include: OPTION_GROUP_INCLUDE,
      });

      this.logger.log(`Grupo de opções criado (actor=${actor}, id=${group.id}, opcoes=${group.options.length})`);

      return new OptionGroupResponseDto(group);
    } catch (error) {
      this.rethrow(error, `Falha ao criar grupo de opções (actor=${actor})`);
    }
  }

  /**
   * Listar grupos com filtros e paginação
   */
  async findAll(
    actor: string,
    page: number = 1,
    limit: number = 10,
    filters?: FilterOptionGroupDto,
    sortKey: string = 'name',
    sortOrder: string = 'asc',
  ): Promise<PaginatedResponseDto<OptionGroupResponseDto>> {
    if (page < 1 || limit < 1 || isNaN(page) || isNaN(limit)) {
      this.badRequest('A página ou a quantidade de itens por página está incorreta', actor);
    }

    if (!(OPTION_GROUP_SORT_KEYS as readonly string[]).includes(sortKey)) {
      this.badRequest('Campo de ordenação inválido', actor);
    }

    if (!(SORT_ORDERS as readonly string[]).includes(sortOrder)) {
      this.badRequest('Direção de ordenação inválida', actor);
    }

    const where: Prisma.OptionGroupWhereInput = {};

    if (filters?.type) {
      where.type = filters.type;
    }

    if (filters?.search) {
      where.name = { contains: filters.search };
    }

    const [groups, total] = await Promise.all([
      this.prisma.client.optionGroup.findMany({
        where,
        orderBy: { [sortKey]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
        include: OPTION_GROUP_INCLUDE,
      }),
      this.prisma.client.optionGroup.count({ where }),
    ]);

    return {
      data: groups.map((group) => new OptionGroupResponseDto(group)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Buscar grupo por ID (com as opções)
   */
  async findOne(id: number, actor: string) {
    return new OptionGroupResponseDto(await this.findGroup(id, actor));
  }

  /**
   * Atualizar grupo. Se "options" for enviado, a lista substitui as opções atuais:
   * com id atualiza, sem id cria, e as que faltarem na lista são removidas.
   */
  async update(id: number, dto: UpdateOptionGroupDto, actor: string) {
    try {
      const current = await this.findGroup(id, actor);

      const groupChanges = this.diffGroup(current, dto);
      const groupFields = Object.keys(groupChanges);

      const plan = dto.options !== undefined ? this.planOptions(current, dto.options, actor) : null;

      const optionsChanged = plan !== null && plan.create.length + plan.update.length + plan.remove.length > 0;

      if (groupFields.length === 0 && !optionsChanged) {
        this.logger.warn(`Edição do grupo de opções sem alterações (actor=${actor}, id=${id})`);
        return new OptionGroupResponseDto(current);
      }

      // As regras são validadas pelo estado final: o que foi enviado, ou o atual
      this.validateRules(
        dto.min ?? current.min,
        dto.max !== undefined ? dto.max : current.max,
        dto.maxPerOption !== undefined ? dto.maxPerOption : current.maxPerOption,
        actor,
      );

      if (typeof groupChanges.name === 'string') {
        await this.assertNameAvailable(groupChanges.name, actor, id);
      }

      if (plan) {
        await this.assertMaterialsExist(
          [
            ...plan.create.map(({ item }) => item.materialId),
            ...plan.update.map(({ data }) => (typeof data.materialId === 'number' ? data.materialId : null)),
          ],
          actor,
        );
      }

      await this.prisma.client.$transaction(async (tx) => {
        if (groupFields.length > 0) {
          await tx.optionGroup.update({ where: { id }, data: groupChanges });
        }

        if (plan) {
          if (plan.remove.length > 0) {
            await tx.option.deleteMany({ where: { id: { in: plan.remove }, groupId: id } });
          }

          for (const { id: optionId, data } of plan.update) {
            await tx.option.update({ where: { id: optionId }, data });
          }

          if (plan.create.length > 0) {
            await tx.option.createMany({
              data: plan.create.map(({ item, index }) => ({
                groupId: id,
                name: item.name,
                price: item.price,
                available: item.available,
                sortOrder: item.sortOrder ?? index,
                materialId: item.materialId ?? null,
              })),
            });
          }
        }
      });

      // Só nomes dos campos e contagens, nunca valores
      const optionsLog =
        plan && optionsChanged
          ? `, opcoes_criadas=${plan.create.length}, opcoes_atualizadas=${plan.update.length}, opcoes_removidas=${plan.remove.length}`
          : '';

      this.logger.log(`Grupo de opções editado (actor=${actor}, id=${id}, campos=${groupFields.join(',')}${optionsLog})`);

      return new OptionGroupResponseDto(await this.findGroup(id, actor));
    } catch (error) {
      this.rethrow(error, `Falha ao editar grupo de opções (actor=${actor}, id=${id})`);
    }
  }

  /**
   * Remover grupo: as opções e os vínculos com produtos saem em cascata
   */
  async remove(id: number, actor: string) {
    try {
      const group = await this.findGroup(id, actor);
      const products = group._count.products;

      await this.prisma.client.optionGroup.delete({ where: { id } });

      if (products > 0) {
        this.logger.warn(`Grupo de opções removido com vínculos (actor=${actor}, id=${id}, produtos=${products})`);
      } else {
        this.logger.log(`Grupo de opções removido (actor=${actor}, id=${id})`);
      }

      return { message: 'Grupo de opções deletado com sucesso' };
    } catch (error) {
      this.rethrow(error, `Falha ao remover grupo de opções (actor=${actor}, id=${id})`);
    }
  }
}
