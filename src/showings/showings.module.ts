import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BookingSeat } from "../bookings/entities/booking-seat.entity";
import { Film } from "../films/entities/film.entity";
import { Hall } from "../halls/entities/hall.entity";
import { HallsModule } from "../halls/halls.module";
import { Showing } from "./entities/showing.entity";
import { ShowingsController } from "./showings.controller";
import { ShowingsService } from "./showings.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([Showing, Film, Hall, BookingSeat]),
    HallsModule,
  ],
  controllers: [ShowingsController],
  providers: [ShowingsService],
  exports: [ShowingsService],
})
export class ShowingsModule {}
