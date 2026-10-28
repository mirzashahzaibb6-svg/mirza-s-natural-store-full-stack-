import type { Address } from '../../database/prisma';
import type { AddressResponse } from './types';

export const toAddressResponse = (a: Address): AddressResponse => ({
  id: a.id,
  addressLine: a.addressLine,
  city: a.city,
  county: a.county,
  postcode: a.postcode,
  isDefault: a.isDefault,
  createdAt: a.createdAt.toISOString(),
});
