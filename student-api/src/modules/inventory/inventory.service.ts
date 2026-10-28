import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { paginated } from '../../common/pagination/pagination';
import type { Paginated } from '../../common/types';
import { movementTypeFor, validateAdjustmentDirection } from './adjustment-rules';
import { AdjustInventoryDto, CreateInventoryDto, ListInventoryQueryDto, TransactionsQueryDto } from './dto/inventory.dto';
import { InventoryDbService } from './inventory.db.service';
import { toInventoryResponse, toTransactionResponse } from './inventory.mapper';
import type { InventoryResponse, InventoryTransactionResponse } from './types';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private readonly inventoryDb: InventoryDbService) {}

  async list(q: ListInventoryQueryDto): Promise<Paginated<InventoryResponse>> {
    const { rows, total } = await this.inventoryDb.list(q);
    return paginated(rows.map(toInventoryResponse), total, q.page, q.limit);
  }

  async create(dto: CreateInventoryDto): Promise<InventoryResponse> {
    return toInventoryResponse(await this.inventoryDb.create(dto.productId, dto.qtyOnHand, dto.lowStockThreshold ?? 10));
  }

  async adjust(dto: AdjustInventoryDto): Promise<InventoryResponse> {
    const problem = validateAdjustmentDirection(dto.reason, dto.quantity);
    if (problem) throw new BadRequestException(problem);
    const { inv } = await this.inventoryDb.adjust(dto.inventoryId, dto.quantity, movementTypeFor(dto.reason, dto.quantity), dto.reason, dto.note);
    this.logger.log(`adjusted inventory=${dto.inventoryId} delta=${dto.quantity} reason=${dto.reason}`);
    return toInventoryResponse(inv);
  }

  async transactions(inventoryId: string, q: TransactionsQueryDto): Promise<Paginated<InventoryTransactionResponse>> {
    const result = await this.inventoryDb.transactions(inventoryId, q.page, q.limit);
    if (!result) throw new NotFoundException('Inventory record not found');
    return paginated(result.rows.map(toTransactionResponse), result.total, q.page, q.limit);
  }
}
