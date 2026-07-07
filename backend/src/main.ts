import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
import { version } from '../package.json';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableShutdownHooks();

  app.enableCors();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const packageVersion = version;

  const appEnvKeys = [
    'PORT',
    'ENVIRONMENT',
    'DATABASE_URL',
    'DATABASE_USER',
    'DATABASE_PASSWORD',
    'DATABASE_NAME',
    'DATABASE_HOST',
    'DATABASE_PORT',
    'JWT_SECRET',
    'LICENSE_PUBLIC_KEY',
    'LICENSING_SERVER',
    'TELEGRAM_BOT_TOKEN',
    'TELEGRAM_CHAT_ID',
    'PRINTER_BAR',
    'PRINTER_COZINHA_DOM_JUAN',
  ];

  console.log('=== Environment Variables ===');
  appEnvKeys.forEach((key) => {
    const value = process.env[key];
    const isSensitive = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY'].some((s) =>
      key.includes(s),
    );
    console.log(
      `${key}:`,
      value ? (isSensitive ? '***' : value) : 'nao-identificado',
    );
  });
  console.log(
    'PM2 instance:',
    process.env.NODE_APP_INSTANCE ?? 'nao-identificado',
  );
  console.log(`VERSAO SERVIDOR = ${packageVersion}`);
  console.log('=============================');

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Blue-ERP API')
      .setDescription('API do sistema Blue-ERP para gestão')
      .setVersion('1.0')
      .addBearerAuth()
      .addSecurityRequirements('bearer')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api', app, document);
  }

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
