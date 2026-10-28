import { ConfigService } from '@nestjs/config';
import { MoneyService } from './money.service';

const make = (shipping = '0') => new MoneyService({ get: () => shipping } as unknown as ConfigService);

describe('MoneyService', () => {
  it('has no floating point drift (0.1 + 0.2)', () => {
    const money = make();
    expect(money.format(money.sum(['0.10', '0.20']))).toBe('0.30');
  });
  it('line total uses decimals', () => {
    const money = make();
    expect(money.format(money.lineTotal('19.99', 3))).toBe('59.97');
  });
  it('always formats two decimals', () => {
    expect(make().format('5')).toBe('5.00');
  });
  it('adds the central shipping cost to the total', () => {
    const money = make('4.50');
    expect(money.format(money.orderTotal('10.00'))).toBe('14.50');
  });
});
