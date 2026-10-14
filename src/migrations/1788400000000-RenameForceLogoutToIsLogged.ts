import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameForceLogoutToIsLogged1788400000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" ADD "sessionExpiresAt" TIMESTAMPTZ`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "users" DROP COLUMN "sessionExpiresAt"`,
    );
    await queryRunner.query(`UPDATE "users" SET "isLogged" = NOT "isLogged"`);
    await queryRunner.query(
      `ALTER TABLE "users" RENAME COLUMN "isLogged" TO "forceLogout"`,
    );
    await queryRunner.query(
      `ALTER TABLE "users" ALTER COLUMN "forceLogout" SET DEFAULT false`,
    );
  }
}
