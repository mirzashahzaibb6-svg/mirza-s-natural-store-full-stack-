import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import type { PaymentGateway, PaymentIntent } from './payment-gateway';

@Injectable()
export class MockPaymentGateway implements PaymentGateway {
  private readonly logger = new Logger(MockPaymentGateway.name);

  constructor(private readonly config: ConfigService) {}

  createIntent(input: { orderId: string; amount: string }): Promise<PaymentIntent> {
    this.logger.log(`createIntent order=${input.orderId}`);
    return Promise.resolve({ gatewayRef: `mock_pi_${randomUUID().replace(/-/g, '')}` });
  }

  cancel(gatewayRef: string): Promise<void> {
    this.logger.log(`cancel ${gatewayRef}`);
    return Promise.resolve();
  }

  refund(gatewayRef: string, _amount: string): Promise<void> {
    if (this.config.get<boolean>('MOCK_REFUND_FAIL') === true) {
      return Promise.reject(new Error('Mock gateway refund failure (MOCK_REFUND_FAIL=true)'));
    }
    this.logger.log(`refund ${gatewayRef}`);
    return Promise.resolve();
  }

  signEvent(rawBody: string): string {
    return createHmac('sha256', this.config.getOrThrow<string>('PAYMENT_WEBHOOK_SECRET')).update(rawBody).digest('hex');
  }

  verifyEvent(rawBody: string | Buffer, signature: string | undefined): boolean {
    if (!signature) return false;
    const expected = Buffer.from(this.signEvent(typeof rawBody === 'string' ? rawBody : rawBody.toString('utf8')), 'utf8');
    const given = Buffer.from(signature, 'utf8');
    return expected.length === given.length && timingSafeEqual(expected, given);
  }
}
