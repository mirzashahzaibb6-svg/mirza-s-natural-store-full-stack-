import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '../../database/prisma';
import { formatMoney } from './format';

type DecimalInput = Prisma.Decimal | number | string;

/** Central, decimal-safe money helpers. No floating-point arithmetic anywhere. */
@Injectable()
export class MoneyService {
  constructor(private readonly config: ConfigService) {}

  lineTotal(unitPrice: DecimalInput, quantity: number): Prisma.Decimal {
    return new Prisma.Decimal(unitPrice).mul(quantity).toDecimalPlaces(2);
  }

  sum(values: DecimalInput[]): Prisma.Decimal {
    return values
      .reduce<Prisma.Decimal>(
        (acc, v) => acc.add(v),
        new Prisma.Decimal(0),
      )
      .toDecimalPlaces(2);
  }

  /** Shipping policy lives in one place (core scope: 0.00). */
  shippingCost(): Prisma.Decimal {
    return new Prisma.Decimal(
      this.config.get<string>('SHIPPING_COST') ?? '0',
    ).toDecimalPlaces(2);
  }

  orderTotal(subtotal: DecimalInput): Prisma.Decimal {
    return new Prisma.Decimal(subtotal)
      .add(this.shippingCost())
      .toDecimalPlaces(2);
  }

  format(value: DecimalInput): string {
    return formatMoney(value);
  }
}
