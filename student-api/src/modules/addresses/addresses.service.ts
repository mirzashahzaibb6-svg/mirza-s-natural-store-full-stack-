import { Injectable, NotFoundException } from '@nestjs/common';
import { toAddressResponse } from './address.mapper';
import { AddressesDbService } from './addresses.db.service';
import { CreateAddressDto, UpdateAddressDto } from './dto/address.dto';
import type { AddressResponse } from './types';

@Injectable()
export class AddressesService {
  constructor(private readonly addressesDb: AddressesDbService) {}

  async list(userId: string): Promise<AddressResponse[]> {
    return (await this.addressesDb.list(userId)).map(toAddressResponse);
  }

  async create(userId: string, dto: CreateAddressDto): Promise<AddressResponse> {
    const { isDefault, ...fields } = dto;
    return toAddressResponse(await this.addressesDb.create(userId, fields, isDefault === true));
  }

  async update(userId: string, id: string, dto: UpdateAddressDto): Promise<AddressResponse> {
    const updated = await this.addressesDb.update(id, userId, dto);
    if (!updated) throw new NotFoundException('Address not found');
    return toAddressResponse(updated);
  }

  async remove(userId: string, id: string): Promise<void> {
    if (!(await this.addressesDb.remove(id, userId))) throw new NotFoundException('Address not found');
  }

  async setDefault(userId: string, id: string): Promise<AddressResponse> {
    const address = await this.addressesDb.setDefault(id, userId);
    if (!address) throw new NotFoundException('Address not found');
    return toAddressResponse(address);
  }
}
