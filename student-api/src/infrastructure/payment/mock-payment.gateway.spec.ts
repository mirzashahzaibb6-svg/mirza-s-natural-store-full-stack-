import { ConfigService } from '@nestjs/config';
import { MockPaymentGateway } from './mock-payment.gateway';

const config = { getOrThrow: () => 'unit-test-webhook-secret', get: () => false } as unknown as ConfigService;

describe('MockPaymentGateway signatures', () => {
  const gateway = new MockPaymentGateway(config);
  const body = JSON.stringify({ eventId: 'e1', type: 'payment.succeeded', gatewayRef: 'mock_pi_1' });

  it('accepts a valid signature', () => {
    expect(gateway.verifyEvent(body, gateway.signEvent(body))).toBe(true);
  });
  it('rejects tampered bodies, wrong signatures, missing and wrong-length signatures', () => {
    expect(gateway.verifyEvent(body + ' ', gateway.signEvent(body))).toBe(false);
    expect(gateway.verifyEvent(body, 'deadbeef')).toBe(false);
    expect(gateway.verifyEvent(body, undefined)).toBe(false);
    expect(gateway.verifyEvent(Buffer.from(body), gateway.signEvent(body))).toBe(true);
  });
});
