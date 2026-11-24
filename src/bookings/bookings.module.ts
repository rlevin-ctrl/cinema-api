import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Showing } from "../showings/entities/showing.entity";
import { BookingsController } from "./bookings.controller";
import { BookingsService } from "./bookings.service";
import { BookingSeat } from "./entities/booking-seat.entity";
import { Booking } from "./entities/booking.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingSeat, Showing])],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
