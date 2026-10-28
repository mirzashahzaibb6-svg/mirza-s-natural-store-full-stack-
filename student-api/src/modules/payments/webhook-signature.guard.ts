import { BadRequestException, CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import type { RawBodyRequest } from '@nestjs/common';
import type { Request } from 'express';
import { PAYMENT_GATEWAY, type PaymentGateway } from '../../infrastructure/payment/payment-gateway';

/** Rejects unsigned/forged webhooks BEFORE any parsing or database work (400, zero mutations). */
@Injectable()
export class WebhookSignatureGuard implements CanActivate {
  constructor(@Inject(PAYMENT_GATEWAY) private readonly gateway: PaymentGateway) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RawBodyRequest<Request>>();
    const signature = request.headers['x-signature'];
    const raw = request.rawBody;
    if (!raw || typeof signature !== 'string' || !this.gateway.verifyEvent(raw, signature)) {
      throw new BadRequestException('Invalid signature');
    }
    return true;
  }
}
