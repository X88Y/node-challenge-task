import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdatePriceColumnScale1734567890000 implements MigrationInterface {
    name = 'UpdatePriceColumnScale1734567890000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Alter the price column to allow decimal places (scale 8 for precision)
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ALTER COLUMN "price" TYPE numeric(28,11)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to integer precision
        await queryRunner.query(`
            ALTER TABLE "tokens" 
            ALTER COLUMN "price" TYPE numeric(28,0)
        `);
    }
}
