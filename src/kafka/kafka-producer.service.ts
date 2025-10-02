import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer } from 'kafkajs';
import { TokenPriceUpdateMessage, tokenPriceUpdateMessageSchema } from '../models/token/token-price-update-message';

@Injectable()
export class KafkaProducerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaProducerService.name);
  private readonly producer: Producer;
  private readonly topic: string;
  private isConnected: boolean = false;
  
  constructor(private readonly configService: ConfigService) {
    const kafkaBrokers = this.configService.get<string>('KAFKA_BROKERS', 'localhost:9092');
    const clientId = this.configService.get<string>('KAFKA_CLIENT_ID', 'token-price-service');
    
    const kafka = new Kafka({
      clientId,
      brokers: kafkaBrokers.split(','),
    });
    
    this.producer = kafka.producer();
    this.topic = this.configService.get<string>('KAFKA_TOPIC', 'token-price-updates');
  }
  
  async onModuleInit(): Promise<void> {
    try {
      await this.producer.connect();
      this.isConnected = true;
      this.logger.log('Connected to Kafka');
    } catch (error) {
      this.logger.error(`Failed to connect to Kafka: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  async sendPriceUpdateMessage(message: TokenPriceUpdateMessage): Promise<void> {
    try {
      // Validate the message with Zod schema      
      tokenPriceUpdateMessageSchema.parse(message);
      
      const value = JSON.stringify(message);
      
      await this.producer.send({
        topic: this.topic,
        messages: [
          { 
            key: message.tokenId, 
            value 
          },
        ],
      });
      
      this.logger.log(`Sent message to Kafka: ${value}`);
    } catch (error) {
      this.logger.error(`Error sending message: ${error.message}`, error.stack);
      throw error;
    }
  }
  
  async onModuleDestroy(): Promise<void> {
    if (!this.isConnected) {
      return;
    }
    
    try {
      await this.producer.disconnect();
      this.isConnected = false;
      this.logger.log('Disconnected from Kafka');
    } catch (error) {
      this.logger.error('Error disconnecting from Kafka', error.stack);
    }
  }
}
