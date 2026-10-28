import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { HealthDbService } from './health.db.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthDb: HealthDbService) {}

  @Public()
  @Get()
  async check(): Promise<{ status: string; database: string; time: string }> {
    try {
      await this.healthDb.ping();
    } catch {
      throw new ServiceUnavailableException('Database is not reachable');
    }
    return { status: 'ok', database: 'up', time: new Date().toISOString() };
  }
}
