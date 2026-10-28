import { IsIn, IsString, IsUUID, MaxLength } from 'class-validator';

export class InitiatePaymentDto {
  @IsUUID() orderId!: string;
}

export class MockCompleteDto {
  @IsIn(['SUCCESS', 'FAILURE']) outcome!: 'SUCCESS' | 'FAILURE';
}

export class WebhookEventDto {
  @IsString() @MaxLength(80) eventId!: string;
  @IsIn(['payment.succeeded', 'payment.failed']) type!: 'payment.succeeded' | 'payment.failed';
  @IsString() @MaxLength(80) gatewayRef!: string;
}
