import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddBioToUser1762727698505 implements MigrationInterface {
  name = 'AddBioToUser1762727698505';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('user');
    const bioColumn = table?.findColumnByName('bio');
    
    if (!bioColumn) {
      await queryRunner.query(`ALTER TABLE "user" ADD "bio" character varying`);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bio"`);
  }
}
