import { ConfigService } from "@nestjs/config";
import { TypeOrmModuleOptions } from "@nestjs/typeorm";

import { BookingSeat } from "../bookings/entities/booking-seat.entity";
import { Booking } from "../bookings/entities/booking.entity";
import { Film } from "../films/entities/film.entity";
import { Hall } from "../halls/entities/hall.entity";
import { Showing } from "../showings/entities/showing.entity";

export const ENTITIES = [Film, Hall, Showing, Booking, BookingSeat];

export function typeOrmOptions(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: "postgres",
    host: config.getOrThrow<string>("DB_HOST"),
    port: config.getOrThrow<number>("DB_PORT"),
    username: config.getOrThrow<string>("DB_USER"),
    password: config.getOrThrow<string>("DB_PASSWORD"),
    database: config.getOrThrow<string>("DB_NAME"),
    entities: ENTITIES,
    // Схема будується виключно міграціями, тому синхронізацію вимкнено
    synchronize: false,
    migrationsRun: false,
    logging: config.get<string>("DB_LOGGING") === "true",
  };
}
