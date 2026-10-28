import { Prisma } from "../../generated/prisma/client";

export const formatMoney = (value: Prisma.Decimal | number | string): string =>
  new Prisma.Decimal(value).toFixed(2);
