import { AppDataSource } from './data-source';
import { TokenSeeder } from './token.seeder';
import { Token } from '../models/token/token.entity';

async function seed() {
  try {
    // Initialize the data source
    await AppDataSource.initialize();
    console.log('Data source has been initialized');

    // Create token seeder
    const tokenRepository = AppDataSource.getRepository(Token);
    const tokenSeeder = new TokenSeeder(tokenRepository);

    // Seed data
    await tokenSeeder.seed();
    console.log('Database seeded successfully');

    // Close the connection
    await AppDataSource.destroy();
    console.log('Data source has been closed');
  } catch (error) {
    console.error('Error during seeding process:', error);
    process.exit(1);
  }
}

// Run the seeder
seed()
  .then(() => {
    console.log('Seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
