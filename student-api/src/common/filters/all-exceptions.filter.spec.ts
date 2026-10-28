import { ArgumentsHost, BadRequestException } from '@nestjs/common';
import { AllExceptionsFilter } from './all-exceptions.filter';

function host() {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const h = {
    switchToHttp: () => ({ getResponse: () => ({ status }), getRequest: () => ({ url: '/v1/x' }) }),
  } as unknown as ArgumentsHost;
  return { h, status, json };
}

describe('AllExceptionsFilter', () => {
  it('keeps HttpException status and message', () => {
    const { h, status, json } = host();
    new AllExceptionsFilter().catch(new BadRequestException('nope'), h);
    expect(status).toHaveBeenCalledWith(400);
    expect(json.mock.calls[0][0]).toMatchObject({ statusCode: 400, message: 'nope' });
  });
  it('hides internal details for unexpected errors (500)', () => {
    const { h, status, json } = host();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    new AllExceptionsFilter().catch(new Error('SELECT * FROM users failed at line 42'), h);
    expect(status).toHaveBeenCalledWith(500);
    const body = json.mock.calls[0][0] as { message: string };
    expect(body.message).toBe('Internal server error');
    expect(JSON.stringify(body)).not.toContain('SELECT');
  });
});
