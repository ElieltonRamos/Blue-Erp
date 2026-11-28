import { BadRequestException, HttpException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { PRODUCT_OPTION_GROUP_INCLUDE, getRulesError } from './option-group.constants';
import { ProductOptionGroupResponseDto } from './dto/product-option-group-response.dto';
import { UpdateProductOptionGroupsDto } from './dto/update-product-option-groups.dto';

interface DesiredLink {
  groupId: number;
  sortOrder: number;
  minOverride: number | null;
  maxOverride: number | null;
  maxPerOptionOverride: number | null;
}

@Injectable()
export class ProductOptionGroupService {
  private readonly logger = new Logger(ProductOptionGroupService.name);

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

  private notFound(message: string, actor: string): never {
    this.logger.warn(`${message} (actor=${actor})`);
    throw new NotFoundException(message);
  }

  private async assertProductExists(productId: number, actor: string): Promise<void> {
    const product = await this.prisma.client.product.findUnique({ where: { id: productId }, select: { id: true } });

    if (!product) {
      this.notFound(`Produto com ID ${productId} não encontrado`, actor);
    }
  }

  /**
   * Grupos de opções vinculados ao produto, na ordem de exibição
   */
  async findByProduct(productId: number, actor: string) {
    await this.assertProductExists(productId, actor);

    const links = await this.prisma.client.productOptionGroup.findMany({
      where: { productId },
      include: PRODUCT_OPTION_GROUP_INCLUDE,
      orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }],
    });

    return links.map((link) => new ProductOptionGroupResponseDto(link));
  }

  /**
   * Substituir os grupos vinculados ao produto. A lista enviada é a definição
   * completa: a ordem da lista é a ordem de exibição (a menos que sortOrder seja
   * enviado), e override não enviado volta a usar o valor do grupo.
   */
  async update(productId: number, dto: UpdateProductOptionGroupsDto, actor: string) {
    try {
      await this.assertProductExists(productId, actor);

      const desired: DesiredLink[] = dto.groups.map((item, index) => ({
        groupId: item.groupId,
        sortOrder: item.sortOrder ?? index,
        minOverride: item.minOverride ?? null,
        maxOverride: item.maxOverride ?? null,
        maxPerOptionOverride: item.maxPerOptionOverride ?? null,
      }));

      const groupIds = desired.map((link) => link.groupId);

      if (new Set(groupIds).size !== groupIds.length) {
        this.badRequest('A lista possui grupos de opções repetidos', actor);
      }

      const groups = await this.prisma.client.optionGroup.findMany({
        where: { id: { in: groupIds } },
        select: { id: true, name: true, min: true, max: true, maxPerOption: true },
      });

      if (groups.length !== groupIds.length) {
        const foundIds = groups.map((group) => group.id);
        const missing = groupIds.filter((id) => !foundIds.includes(id));
        this.notFound(`Grupo(s) de opções com ID(s) ${missing.join(', ')} não encontrado(s)`, actor);
      }

      // As regras valem para o resultado final: o override, ou o valor do grupo
      const groupsById = new Map(groups.map((group) => [group.id, group]));

      for (const link of desired) {
        const group = groupsById.get(link.groupId);
        if (!group) continue;

        const error = getRulesError(
          link.minOverride ?? group.min,
          link.maxOverride ?? group.max,
          link.maxPerOptionOverride ?? group.maxPerOption,
        );

        if (error) {
          this.badRequest(`${error} (grupo "${group.name}")`, actor);
        }
      }

      const current = await this.prisma.client.productOptionGroup.findMany({ where: { productId } });

      const currentByGroup = new Map(current.map((link) => [link.groupId, link]));
      const desiredIds = new Set(groupIds);

      const remove = current.filter((link) => !desiredIds.has(link.groupId)).map((link) => link.groupId);

      const create = desired.filter((link) => !currentByGroup.has(link.groupId));

      const update = desired.filter((link) => {
        const existing = currentByGroup.get(link.groupId);

        return (
          existing !== undefined &&
          (existing.sortOrder !== link.sortOrder ||
            existing.minOverride !== link.minOverride ||
            existing.maxOverride !== link.maxOverride ||
            existing.maxPerOptionOverride !== link.maxPerOptionOverride)
        );
      });

      if (remove.length + create.length + update.length === 0) {
        this.logger.warn(`Edição dos grupos de opções do produto sem alterações (actor=${actor}, id=${productId})`);
        return this.findByProduct(productId, actor);
      }

      await this.prisma.client.$transaction(async (tx) => {
        if (remove.length > 0) {
          await tx.productOptionGroup.deleteMany({ where: { productId, groupId: { in: remove } } });
        }

        for (const { groupId, ...data } of update) {
          await tx.productOptionGroup.update({ where: { productId_groupId: { productId, groupId } }, data });
        }

        if (create.length > 0) {
          await tx.productOptionGroup.createMany({ data: create.map((link) => ({ productId, ...link })) });
        }
      });

      this.logger.log(
        `Grupos de opções do produto atualizados (actor=${actor}, id=${productId}, grupos=${desired.length}, criados=${create.length}, atualizados=${update.length}, removidos=${remove.length})`,
      );

      return this.findByProduct(productId, actor);
    } catch (error) {
      this.rethrow(error, `Falha ao atualizar grupos de opções do produto (actor=${actor}, id=${productId})`);
    }
  }
}
