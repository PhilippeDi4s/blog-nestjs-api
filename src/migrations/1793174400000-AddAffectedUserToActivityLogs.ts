import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAffectedUserToActivityLogs1793174400000
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD "affectedUserId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_activity_logs_affectedUserId" ON "activity_logs" ("affectedUserId")`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" ADD CONSTRAINT "FK_activity_logs_affectedUserId_users_id" FOREIGN KEY ("affectedUserId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP CONSTRAINT "FK_activity_logs_affectedUserId_users_id"`,
    );
    await queryRunner.query(
      `DROP INDEX "IDX_activity_logs_affectedUserId"`,
    );
    await queryRunner.query(
      `ALTER TABLE "activity_logs" DROP COLUMN "affectedUserId"`,
    );
  }
}
