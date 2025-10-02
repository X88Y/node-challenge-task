import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Main');
  logger.log('Starting Token Price Service...');
  
  try {
    const app = await NestFactory.create(AppModule);
    
    const configService = app.get(ConfigService);
    const port = configService.get<number>('PORT', 3000);
    
    // Enable graceful shutdown
    app.enableShutdownHooks();
    
    await app.listen(port);
    logger.log(`Service is running on port ${port}`);
  } catch (error) {
    logger.error(`Failed to start application: ${error.message}`, error.stack);
    process.exit(1);
  }
}

bootstrap()
