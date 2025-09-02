import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { CORS_CONFIG, APP_CONFIG } from '@service-ticket/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // CORS configuration
  app.enableCors({
    origin: '*', // just for the demo
    credentials: CORS_CONFIG.credentials,
  });

  // API prefix
  app.setGlobalPrefix(APP_CONFIG.apiPrefix);

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('Service Ticket Management API')
    .setDescription('API for managing service tickets and support requests')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(APP_CONFIG.port);
  console.log(`🚀 API Server running on http://localhost:${APP_CONFIG.port}`);
  console.log(`📚 API Documentation available at http://localhost:${APP_CONFIG.port}/api/docs`);
}
bootstrap();
