import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

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
    origin: ['http://localhost:3000', 'http://localhost:5173'],
    credentials: true,
  });

  // API prefix
  app.setGlobalPrefix('/api/v1');

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('AI Service API')
    .setDescription('AI service for ticket analysis and automation')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3002;
  await app.listen(port);
  console.log(`🤖 AI Service running on http://localhost:${port}`);
  console.log(`📚 AI Service Documentation available at http://localhost:${port}/api/docs`);
}
bootstrap();
