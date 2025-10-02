import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  // Application
  PORT: Joi.number().default(3000),
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test')
    .default('development'),

  // Database
  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USERNAME: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_DATABASE: Joi.string().required(),
  DB_LOGGING: Joi.boolean().default(false),

  // Kafka
  KAFKA_BROKERS: Joi.string().required(),
  KAFKA_CLIENT_ID: Joi.string().default('token-price-service'),
  KAFKA_TOPIC: Joi.string().default('token-price-updates'),

  // Mock Price
  MOCK_PRICE_MIN_DELAY_MS: Joi.number().default(50),
  MOCK_PRICE_MAX_DELAY_MS: Joi.number().default(200),
});

