import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';
import { TX_OPTIONS } from '../../database/database.types';
import type { Address } from '../../database/prisma';

type AddressFields = { addressLine: string; city: string; county: string; postcode: string };

@Injectable()
export class AddressesDbService {
  constructor(private readonly db: DatabaseService) {}

  list(userId: string): Promise<Address[]> {
    return this.db.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] });
  }

  /** Always scoped by { id, userId }: someone else's address looks like "not found". */
  findOwned(id: string, userId: string): Promise<Address | null> {
    return this.db.address.findFirst({ where: { id, userId } });
  }

  create(userId: string, data: AddressFields, wantsDefault: boolean): Promise<Address> {
    return this.db.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId } });
      const isDefault = wantsDefault || count === 0;
      if (isDefault) await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      return tx.address.create({ data: { ...data, userId, isDefault } });
    }, TX_OPTIONS);
  }

  async update(id: string, userId: string, data: Partial<AddressFields>): Promise<Address | null> {
    const result = await this.db.address.updateMany({ where: { id, userId }, data });
    return result.count === 0 ? null : this.findOwned(id, userId);
  }

  /** Deleting the default promotes the most recently created remaining address. */
  remove(id: string, userId: string): Promise<boolean> {
    return this.db.$transaction(async (tx) => {
      const target = await tx.address.findFirst({ where: { id, userId } });
      if (!target) return false;
      await tx.address.delete({ where: { id } });
      if (target.isDefault) {
        const next = await tx.address.findFirst({ where: { userId }, orderBy: { createdAt: 'desc' } });
        if (next) await tx.address.update({ where: { id: next.id }, data: { isDefault: true } });
      }
      return true;
    }, TX_OPTIONS);
  }

  setDefault(id: string, userId: string): Promise<Address | null> {
    return this.db.$transaction(async (tx) => {
      const target = await tx.address.findFirst({ where: { id, userId } });
      if (!target) return null;
      await tx.address.updateMany({ where: { userId, isDefault: true }, data: { isDefault: false } });
      return tx.address.update({ where: { id }, data: { isDefault: true } });
    }, TX_OPTIONS);
  }
}
