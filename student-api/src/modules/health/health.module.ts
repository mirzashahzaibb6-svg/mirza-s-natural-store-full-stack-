import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { HealthDbService } from './health.db.service';

@Module({ controllers: [HealthController], providers: [HealthDbService] })
export class HealthModule {}
