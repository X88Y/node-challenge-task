import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity('tokens')
export class Token {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'bytea' })
  address: Buffer;

  @Column({ nullable: true })
  symbol: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'smallint', default: 0 })
  decimals: number;

  @Column({ default: false })
  isNative: boolean;

  @Column({ type: 'uuid' })
  chainId: string;

  @Column({ default: false })
  isProtected: boolean;

  @Column({ nullable: true })
  lastUpdateAuthor: string;

  @Column({ default: 0 })
  priority: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  timestamp: Date;

  // Denormalized chain data (intentional anti-pattern)
  @Column({ name: 'chain_id', type: 'uuid' })
  chain_Id: string;

  @Column({ name: 'chain_deid', type: 'decimal' })
  chain_DeId: number;

  @Column({ name: 'chain_name' })
  chain_Name: string;

  @Column({ name: 'chain_isenabled', default: true })
  chain_IsEnabled: boolean;

  // Denormalized logo data (intentional anti-pattern)
  @Column({ name: 'logo_id', type: 'uuid' })
  logo_Id: string;

  @Column({ name: 'logo_tokenid', type: 'uuid', nullable: true })
  logo_TokenId: string;

  @Column({ name: 'logo_bigrelativepath' })
  logo_BigRelativePath: string;

  @Column({ name: 'logo_smallrelativepath' })
  logo_SmallRelativePath: string;

  @Column({ name: 'logo_thumbrelativepath' })
  logo_ThumbRelativePath: string;

  @Column({ type: 'decimal', precision: 28, scale: 18, default: 0 })
  price: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  lastPriceUpdate: Date;
}
