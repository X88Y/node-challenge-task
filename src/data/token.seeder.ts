import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { Token } from '../models/token/token.entity';
import { validateToken } from '../models/token/token.schema';

@Injectable()
export class TokenSeeder {
  private readonly logger = new Logger(TokenSeeder.name);

  constructor(
    @InjectRepository(Token)
    private readonly tokenRepository: Repository<Token>,
  ) {}

  async seed(): Promise<void> {
    // Check if there are already tokens in the database
    const count = await this.tokenRepository.count();
    if (count > 0) {
      this.logger.log('Database already seeded, skipping...');
      return;
    }

    this.logger.log('Seeding initial data...');

    // Define token data and validate with Zod schema
    const tokenData = [
      {
        address: Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08, 0x09]),
        symbol: 'ETH',
        name: 'Ethereum',
        decimals: 18,
        isNative: true,
        chainId: '11111111-1111-1111-1111-111111111111',
        isProtected: true,
        lastUpdateAuthor: 'Seeder',
        priority: 1,
        timestamp: new Date(),
        
        chain_Id: '11111111-1111-1111-1111-111111111111',
        chain_DeId: 1,
        chain_Name: 'Ethereum',
        chain_IsEnabled: true,
        
        logo_Id: randomUUID(),
        logo_TokenId: randomUUID(),
        logo_BigRelativePath: '/images/eth_big.png',
        logo_SmallRelativePath: '/images/eth_small.png',
        logo_ThumbRelativePath: '/images/eth_thumb.png',
        
        price: '300000',
        lastPriceUpdate: new Date(),
      },
      {
        address: Buffer.from([0x10, 0x11, 0x12, 0x13, 0x14, 0x15, 0x16, 0x17, 0x18, 0x19]),
        symbol: 'BTC',
        name: 'Bitcoin',
        decimals: 8,
        isNative: true,
        chainId: '22222222-2222-2222-2222-222222222222',
        isProtected: true,
        lastUpdateAuthor: 'Seeder',
        priority: 2,
        timestamp: new Date(),
        
        chain_Id: '22222222-2222-2222-2222-222222222222',
        chain_DeId: 2,
        chain_Name: 'Bitcoin',
        chain_IsEnabled: true,
        
        logo_Id: randomUUID(),
        logo_TokenId: randomUUID(),
        logo_BigRelativePath: '/images/btc_big.png',
        logo_SmallRelativePath: '/images/btc_small.png',
        logo_ThumbRelativePath: '/images/btc_thumb.png',
        
        price: '4500000',
        lastPriceUpdate: new Date(),
      },
      {
        address: Buffer.from([0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x28, 0x29]),
        symbol: 'SOL',
        name: 'Solana',
        decimals: 9,
        isNative: true,
        chainId: '33333333-3333-3333-3333-333333333333',
        isProtected: true,
        lastUpdateAuthor: 'Seeder',
        priority: 3,
        timestamp: new Date(),
        
        chain_Id: '33333333-3333-3333-3333-333333333333',
        chain_DeId: 3,
        chain_Name: 'Solana',
        chain_IsEnabled: true,
        
        logo_Id: randomUUID(),
        logo_TokenId: randomUUID(),
        logo_BigRelativePath: '/images/sol_big.png',
        logo_SmallRelativePath: '/images/sol_small.png',
        logo_ThumbRelativePath: '/images/sol_thumb.png',
        
        price: '15000',
        lastPriceUpdate: new Date(),
      },
    ];

    try {
      // Validate each token with Zod schema before saving
      const validatedTokens = tokenData.map(data => validateToken(data));
      
      await this.tokenRepository.save(validatedTokens);
      this.logger.log('Initial data seeded successfully');
    } catch (error) {
      this.logger.error('Failed to seed initial data', error.stack);
      throw error;
    }
  }
}
