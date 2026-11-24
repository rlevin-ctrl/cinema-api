import "reflect-metadata";

import { config } from "dotenv";
import { DataSource } from "typeorm";

import { BookingSeat } from "../bookings/entities/booking-seat.entity";
import { Booking } from "../bookings/entities/booking.entity";
import { Film } from "../films/entities/film.entity";
import { Hall } from "../halls/entities/hall.entity";
import { Showing } from "../showings/entities/showing.entity";

config();

/**
 * Окремий DataSource для TypeORM CLI (міграції та seed).
 * Застосунок створює свій DataSource через TypeOrmModule, але обидва
 * мають бачити одну й ту саму конфігурацію.
 */
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST ?? "localhost",
  port: Number(process.env.DB_PORT ?? 5432),
  username: process.env.DB_USER ?? "cinema",
  password: process.env.DB_PASSWORD ?? "cinema",
  database: process.env.DB_NAME ?? "cinema",
  entities: [Film, Hall, Showing, Booking, BookingSeat],
  migrations: ["src/database/migrations/*.ts"],
  synchronize: false,
});
