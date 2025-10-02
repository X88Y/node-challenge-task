import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { Token } from './models/token/token.entity';
import { TokenPriceUpdateService } from './services/token-price-update.service';
import { MockPriceService } from './services/mock-price.service';
import { KafkaProducerService } from './kafka/kafka-producer.service';
import { envValidationSchema } from './config/env.validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false, // Show all validation errors at once
        allowUnknown: true, // Allow unknown keys for flexibility
      },
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD', 'postgres'),
        database: configService.get<string>('DB_DATABASE', 'tokens'),
        entities: [Token],
        synchronize: false, // Disabled when using migrations
       }),
    }),
    TypeOrmModule.forFeature([Token]),
  ],
  controllers: [],
  providers: [
    TokenPriceUpdateService,
    MockPriceService,
    KafkaProducerService,
  ],
})
export class AppModule {}
