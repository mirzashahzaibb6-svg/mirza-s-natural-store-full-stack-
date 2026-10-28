import { Module } from '@nestjs/common';
import { PaymentEventsService } from './payment-events.service';
import { PaymentSettlementService } from './payment-settlement.service';
import { PaymentsController, PaymentWebhookController } from './payments.controller';
import { PaymentsDbService } from './payments.db.service';
import { PaymentsService } from './payments.service';
import { WebhookSignatureGuard } from './webhook-signature.guard';

@Module({
  controllers: [PaymentsController, PaymentWebhookController],
  providers: [PaymentsDbService, PaymentsService, PaymentEventsService, PaymentSettlementService, WebhookSignatureGuard],
  exports: [PaymentSettlementService],
})
export class PaymentsModule {}
