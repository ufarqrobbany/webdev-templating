import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhotoToPost1761542216579 implements MigrationInterface {
  name = 'AddPhotoToPost1761542216579';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Perintah-perintah ini sudah benar dari generator Anda
    await queryRunner.query(`ALTER TABLE "post" ADD "photoId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "post" ADD CONSTRAINT "UQ_0ffc0ea3d32ff8bd3bec8c1c8b1" UNIQUE ("photoId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "post" ALTER COLUMN "content" DROP NOT NULL`,
    );

    // INI YANG DIPERBAIKI: Mengganti 'NO ACTION' dengan 'SET NULL'
    await queryRunner.query(
      `ALTER TABLE "post" ADD CONSTRAINT "FK_0ffc0ea3d32ff8bd3bec8c1c8b1" FOREIGN KEY ("photoId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Urutan 'down' Anda sudah benar
    await queryRunner.query(
      `ALTER TABLE "post" DROP CONSTRAINT "FK_0ffc0ea3d32ff8bd3bec8c1c8b1"`,
    );
    await queryRunner.query(
      `ALTER TABLE "post" ALTER COLUMN "content" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "post" DROP CONSTRAINT "UQ_0ffc0ea3d32ff8bd3bec8c1c8b1"`,
    );
    await queryRunner.query(`ALTER TABLE "post" DROP COLUMN "photoId"`);
  }
}