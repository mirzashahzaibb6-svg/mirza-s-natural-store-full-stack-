import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../database/database.service';

@Injectable()
export class HealthDbService {
  constructor(private readonly db: DatabaseService) {}

  async ping(): Promise<boolean> {
    await this.db.$queryRaw`SELECT 1`;
    return true;
  }
}
