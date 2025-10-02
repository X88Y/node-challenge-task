import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Token } from '../models/token/token.entity';
import { MockPriceService } from './mock-price.service';
import { KafkaProducerService } from '../kafka/kafka-producer.service';
import { createTokenPriceUpdateMessage } from '../models/token/token-price-update-message';

@Injectable()
export class TokenPriceUpdateService {
  private readonly logger = new Logger(TokenPriceUpdateService.name);
  private isUpdating: boolean = false;

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
    private readonly priceService: MockPriceService,
    private readonly kafkaProducer: KafkaProducerService,
  ) { }

  @Cron(CronExpression.EVERY_5_SECONDS)
  private async updatePrices(): Promise<void> {
    this.logger.log('Updating prices...');
    if (this.isUpdating) {
      this.logger.warn('Price update already in progress, skipping...');
      return;
    }

    this.isUpdating = true;

    try {
      const tokens = await this.tokenRepository.find();
      this.logger.log(`Updating prices for ${tokens.length} tokens...`);

      // Process all tokens in parallel for better performance
      await Promise.allSettled(
        tokens.map(token => this.updateTokenPrice(token))
      );
    } catch (error) {
      this.logger.error(`Error updating prices: ${error.message}`, error.stack);
    } finally {
      this.isUpdating = false;
    }
  }

  private async updateTokenPrice(token: Token): Promise<void> {
    try {
      const oldPrice = token.price;
      const newPrice = await this.priceService.getRandomPriceForToken(token);

      if (oldPrice === newPrice) {
        return;
      }
      // Create message for Kafka using Zod helper function
      const message = createTokenPriceUpdateMessage({
        tokenId: token.id,
        symbol: token.symbol || 'UNKNOWN',
        oldPrice,
        newPrice,
        // timestamp will be set to current date by default if not provided
      });

      await Promise.all([
        this.kafkaProducer.sendPriceUpdateMessage(message),
        this.tokenRepository.update(token.id, { price: newPrice, lastPriceUpdate: new Date() }),
      ]);

      this.logger.log(`Updated price for ${token.symbol}: ${oldPrice} -> ${newPrice}`);

    } catch (error) {
      this.logger.error(`Error updating price for token ${token.id}: ${error.message}`);
    }
  }
}
