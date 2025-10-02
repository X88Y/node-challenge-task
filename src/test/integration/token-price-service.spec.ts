import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { Kafka, Consumer, KafkaMessage } from 'kafkajs';
import { Token } from '../../models/token/token.entity';
import { TokenPriceUpdateService } from '../../services/token-price-update.service';
import { MockPriceService } from '../../services/mock-price.service';
import { KafkaProducerService } from '../../kafka/kafka-producer.service';
import { TokenPriceUpdateMessage } from '../../models/token/token-price-update-message';
import { Repository } from 'typeorm';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('TokenPriceService Integration Tests', () => {
  let postgresContainer: StartedTestContainer;
  let kafkaContainer: StartedTestContainer;
  let moduleRef: TestingModule;
  let tokenRepository: Repository<Token>;
  let tokenPriceUpdateService: TokenPriceUpdateService;
  let kafkaConsumer: Consumer;
  let mockKafkaProducer: { sendPriceUpdateMessage: jest.Mock };

  const kafkaTopic = 'token-price-updates';

  beforeAll(async () => {
    jest.setTimeout(120000); // 2 minutes timeout for container startup

    try {
      // Start PostgreSQL container
      postgresContainer = await new GenericContainer('postgres:15-alpine')
        .withEnvironment({
          POSTGRES_USER: 'testuser',
          POSTGRES_PASSWORD: 'testpassword',
          POSTGRES_DB: 'testdb',
        })
        .withExposedPorts(5432)
        .start();

      const postgresHost = postgresContainer.getHost();
      const mappedPostgresPort = postgresContainer.getMappedPort(5432);

      // Start Redpanda container (Kafka-compatible, works better with testcontainers)
      // Redpanda doesn't need Zookeeper, which simplifies our setup
      kafkaContainer = await new GenericContainer('redpandadata/redpanda:v23.2.3')
        .withCommand([
          'redpanda',
          'start',
          '--kafka-addr', '0.0.0.0:9092',
          '--advertise-kafka-addr', 'localhost:9092',
          '--pandaproxy-addr', '0.0.0.0:8082',
          '--advertise-pandaproxy-addr', 'localhost:8082',
          '--schema-registry-addr', '0.0.0.0:8081',
          '--smp', '1',
          '--memory', '1G',
          '--mode', 'dev-container',
          '--default-log-level=info'
        ])
        .withExposedPorts(9092)
        .start();

      const kafkaHost = kafkaContainer.getHost();
      const mappedKafkaPort = kafkaContainer.getMappedPort(9092);

      // Wait for Redpanda to be fully ready
      await new Promise(resolve => setTimeout(resolve, 8000));

      // Setup Kafka consumer
      const kafka = new Kafka({
        clientId: 'test-client',
        brokers: [`${kafkaHost}:${mappedKafkaPort}`],
      });

      kafkaConsumer = kafka.consumer({ groupId: 'test-consumer-group' });
      await kafkaConsumer.connect();
      await kafkaConsumer.subscribe({ topic: kafkaTopic, fromBeginning: true });

      // Create mock Kafka producer
      mockKafkaProducer = {
        sendPriceUpdateMessage: jest.fn().mockResolvedValue(undefined),
      };

      // Create NestJS test module (without ScheduleModule to prevent auto cron execution)
      moduleRef = await Test.createTestingModule({
        imports: [
          ConfigModule.forRoot({
            isGlobal: true,
            envFilePath: '.env.test',
            ignoreEnvFile: false,
          }),
          TypeOrmModule.forRoot({
            type: 'postgres',
            host: postgresHost,
            port: mappedPostgresPort,
            username: 'testuser',
            password: 'testpassword',
            database: 'testdb',
            entities: [Token],
            synchronize: true,
          }),
          TypeOrmModule.forFeature([Token]),
        ],
        providers: [
          TokenPriceUpdateService,
          MockPriceService,
          {
            provide: KafkaProducerService,
            useValue: mockKafkaProducer,
          },
        ],
      }).compile();

      tokenRepository = moduleRef.get<Repository<Token>>(getRepositoryToken(Token));
      tokenPriceUpdateService = moduleRef.get<TokenPriceUpdateService>(TokenPriceUpdateService);

    } catch (error) {
      console.error('Error during test setup:', error);
      throw error;
    }
  }, 120000);

  afterAll(async () => {
    if (kafkaConsumer) {
      await kafkaConsumer.disconnect();
    }

    if (moduleRef) {
      await moduleRef.close();
    }

    if (kafkaContainer) {
      await kafkaContainer.stop();
    }

    if (postgresContainer) {
      await postgresContainer.stop();
    }
  }, 60000);

  beforeEach(() => {
    // Clear mock calls before each test
    mockKafkaProducer.sendPriceUpdateMessage.mockClear();
  });

  it('should update token price and send Kafka message', async () => {
    // Create test token
    const token = new Token();
    token.id = '11111111-1111-1111-1111-111111111111';
    token.address = Buffer.from([0x01, 0x02, 0x03]);
    token.symbol = 'TEST';
    token.name = 'Test Token';
    token.decimals = 18;
    token.isNative = false;
    token.chainId = '11111111-1111-1111-1111-111111111111';
    token.isProtected = false;
    token.priority = 1;
    token.timestamp = new Date();
    token.chain_Id = '11111111-1111-1111-1111-111111111111';
    token.chain_DeId = 1;
    token.chain_Name = 'Test Chain';
    token.chain_IsEnabled = true;
    token.logo_Id = '22222222-2222-2222-2222-222222222222';
    token.logo_TokenId = '33333333-3333-3333-3333-333333333333';
    token.logo_BigRelativePath = '/test.png';
    token.logo_SmallRelativePath = '/test_small.png';
    token.logo_ThumbRelativePath = '/test_thumb.png';
    token.price = '-1';
    token.lastPriceUpdate = new Date();

    const savedToken = await tokenRepository.save(token);

    // Manually trigger the price update (cron is disabled in tests)
    await tokenPriceUpdateService['updatePrices']();

    // Verify the token price was updated in the database
    const updatedToken = await tokenRepository.findOne({ where: { id: savedToken.id } });
    expect(updatedToken).toBeDefined();
    expect(parseFloat(updatedToken!.price)).toBeGreaterThan(-1);
    expect(updatedToken!.lastPriceUpdate.getTime()).toBeGreaterThan(savedToken.lastPriceUpdate.getTime());

    // Verify Kafka message was sent
    expect(mockKafkaProducer.sendPriceUpdateMessage).toHaveBeenCalledTimes(1);

    const kafkaMessage = mockKafkaProducer.sendPriceUpdateMessage.mock.calls[0][0];
    expect(kafkaMessage.tokenId).toBe(savedToken.id);
    expect(kafkaMessage.symbol).toBe('TEST');
    // Database stores with decimal precision, so compare as floats
    expect(parseFloat(kafkaMessage.oldPrice)).toBeCloseTo(-1, 1);
    expect(parseFloat(kafkaMessage.newPrice)).toBe(parseFloat(updatedToken!.price));
    expect(kafkaMessage.timestamp).toBeInstanceOf(Date);
  }, 15000);
});
