import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Token } from '../models/token/token.entity';

@Injectable()
export class MockPriceService {
  private readonly minApiDelayMs: number;
  private readonly maxApiDelayMs: number;

  constructor(private readonly configService: ConfigService) {
    this.minApiDelayMs = this.configService.get<number>('MOCK_PRICE_MIN_DELAY_MS', 50);
    this.maxApiDelayMs = this.configService.get<number>('MOCK_PRICE_MAX_DELAY_MS', 200);
  }

  async getRandomPriceForToken(token: Token): Promise<string> {
    // Simulate API call delay  
    await this.simulateApiDelay();
    
    const basePrice = this.getRandomInt(1, 100000);
    const randomFactor = Math.random() * 10;

    return (basePrice * randomFactor).toString();
  }

  private async simulateApiDelay(): Promise<void> {
    const delay = this.getRandomInt(this.minApiDelayMs, this.maxApiDelayMs);
    await new Promise<void>((resolve) => setTimeout(resolve, delay));
  }


  private getRandomInt(min: number, max: number): number {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
