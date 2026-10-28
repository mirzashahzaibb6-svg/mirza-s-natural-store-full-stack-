import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { setupApp } from './app.setup';

async function bootstrap(): Promise<void> {
  // rawBody: true is needed to verify the HMAC signature of the payment webhook.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { rawBody: true });
  setupApp(app);
  app.enableShutdownHooks();

  const config = app.get(ConfigService);
  if (config.get<string>('NODE_ENV') !== 'production') {
    const doc = SwaggerModule.createDocument(
      app,
      new DocumentBuilder().setTitle('OnlineMart API').setVersion('1.0').addBearerAuth().build(),
    );
    SwaggerModule.setup('v1/docs', app, doc); // development only
  }

  const port = config.get<number>('PORT') ?? 4000;
  await app.listen(port);
  new Logger('Bootstrap').log(`API ready on http://localhost:${port}/v1`);
}

void bootstrap();
