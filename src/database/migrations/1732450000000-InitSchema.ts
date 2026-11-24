import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Початкова схема кінотеатру: пʼять таблиць, зовнішні ключі та індекси.
 * Пишеться вручну (а не через synchronize), щоб схема була відтворюваною
 * і однаковою на будь-якому середовищі.
 */
export class InitSchema1732450000000 implements MigrationInterface {
  name = "InitSchema1732450000000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "pgcrypto"`);

    await queryRunner.query(`
      CREATE TABLE "films" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "title" varchar(255) NOT NULL,
        "duration_minutes" int NOT NULL,
        "release_year" int NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_films_duration" CHECK ("duration_minutes" > 0),
        CONSTRAINT "chk_films_release_year" CHECK ("release_year" BETWEEN 1888 AND 2100)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "halls" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" varchar(120) NOT NULL,
        "rows" int NOT NULL,
        "seats_per_row" int NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "uq_halls_name" UNIQUE ("name"),
        CONSTRAINT "chk_halls_rows" CHECK ("rows" > 0),
        CONSTRAINT "chk_halls_seats_per_row" CHECK ("seats_per_row" > 0)
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "showings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "film_id" uuid NOT NULL,
        "hall_id" uuid NOT NULL,
        "starts_at" timestamptz NOT NULL,
        "price" int NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_showings_price" CHECK ("price" > 0),
        CONSTRAINT "fk_showings_film" FOREIGN KEY ("film_id")
          REFERENCES "films"("id") ON DELETE RESTRICT,
        CONSTRAINT "fk_showings_hall" FOREIGN KEY ("hall_id")
          REFERENCES "halls"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "bookings" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "showing_id" uuid NOT NULL,
        "total_price" int NOT NULL,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "chk_bookings_total_price" CHECK ("total_price" > 0),
        CONSTRAINT "fk_bookings_showing" FOREIGN KEY ("showing_id")
          REFERENCES "showings"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "booking_seats" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "booking_id" uuid NOT NULL,
        "showing_id" uuid NOT NULL,
        "row" int NOT NULL,
        "seat" int NOT NULL,
        CONSTRAINT "fk_booking_seats_booking" FOREIGN KEY ("booking_id")
          REFERENCES "bookings"("id") ON DELETE CASCADE,
        CONSTRAINT "fk_booking_seats_showing" FOREIGN KEY ("showing_id")
          REFERENCES "showings"("id") ON DELETE CASCADE,
        CONSTRAINT "chk_booking_seats_position" CHECK ("row" > 0 AND "seat" > 0)
      )
    `);

    // Головне обмеження: місце може бути заброньоване лише один раз на сеанс
    await queryRunner.query(`
      CREATE UNIQUE INDEX "uq_booking_seats_showing_seat"
        ON "booking_seats" ("showing_id", "row", "seat")
    `);

    await queryRunner.query(
      `CREATE INDEX "idx_showings_starts_at" ON "showings" ("starts_at")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_showings_film_id" ON "showings" ("film_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_showings_hall_id" ON "showings" ("hall_id")`,
    );
    await queryRunner.query(
      `CREATE INDEX "idx_booking_seats_booking_id" ON "booking_seats" ("booking_id")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "booking_seats"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "bookings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "showings"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "halls"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "films"`);
  }
}
