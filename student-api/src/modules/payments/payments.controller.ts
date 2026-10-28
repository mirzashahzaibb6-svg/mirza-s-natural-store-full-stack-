import { Body, Controller, HttpCode, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { LIMIT_PAYMENT } from '../../common/constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import type { AuthUser } from '../../common/types';
import { Role } from '../../database/prisma';
import { UuidParamDto } from '../users/dto/customer-id-param.dto';
import { InitiatePaymentDto, MockCompleteDto, WebhookEventDto } from './dto/payment.dto';
import { PaymentEventsService } from './payment-events.service';
import { PaymentsService } from './payments.service';
import type { MockCompleteResponse, PaymentResponse } from './types';
import { WebhookSignatureGuard } from './webhook-signature.guard';

@ApiTags('payments')
@ApiBearerAuth()
@Roles(Role.CUSTOMER)
@Throttle(LIMIT_PAYMENT)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  @Post('initiate')
  initiate(@CurrentUser() user: AuthUser, @Body() dto: InitiatePaymentDto): Promise<PaymentResponse> {
    return this.payments.initiate(user.id, dto);
  }

  @HttpCode(200)
  @Post(':id/mock-complete')
  mockComplete(@CurrentUser() user: AuthUser, @Param() p: UuidParamDto, @Body() dto: MockCompleteDto): Promise<MockCompleteResponse> {
    return this.payments.mockComplete(user.id, p.id, dto);
  }
}

@ApiTags('webhooks')
@Controller('webhooks/payments')
export class PaymentWebhookController {
  constructor(private readonly events: PaymentEventsService) {}

  @Public()
  @SkipThrottle()
  @UseGuards(WebhookSignatureGuard)
  @HttpCode(200)
  @Post('mock')
  async receive(@Body() dto: WebhookEventDto): Promise<{ received: true; result: string }> {
    const { result } = await this.events.handle(dto);
    return { received: true, result };
  }
}
