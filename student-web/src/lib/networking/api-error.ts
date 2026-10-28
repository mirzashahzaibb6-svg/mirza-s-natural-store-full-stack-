export class ApiError extends Error {
  readonly status: number;
  readonly messages: string[];

  constructor(status: number, message: string, messages: string[] = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.messages = messages.length ? messages : [message];
  }

  get isNetwork(): boolean {
    return this.status === 0;
  }
}
