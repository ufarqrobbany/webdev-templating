import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDeletedAtToPost1762695737770 implements MigrationInterface {
  name = 'AddDeletedAtToPost1762695737770';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('post');
    const deletedAtColumn = table?.findColumnByName('deletedAt');
    
    if (!deletedAtColumn) {
      await queryRunner.query(`ALTER TABLE "post" ADD "deletedAt" TIMESTAMP`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "deletedAt"`);
  }
}
