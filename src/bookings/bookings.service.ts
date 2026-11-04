import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Booking } from '../common/types';
import { DataService } from '../data/data.service';
import { HallsService } from '../halls/halls.service';
import { ShowingsService } from '../showings/showings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  constructor(
    private readonly data: DataService,
    private readonly showingsService: ShowingsService,
    private readonly hallsService: HallsService,
  ) {}

  findAll(): Booking[] {
    return this.data.bookings;
  }

  create(showingId: number, dto: CreateBookingDto): Booking {
    const showing = this.showingsService.findEntity(showingId);
    const hall = this.showingsService.hallOf(showing);

    const seen = new Set<string>();
    for (const seat of dto.seats) {
      const key = this.showingsService.seatKey(seat.row, seat.seat);
      if (seen.has(key)) {
        throw new BadRequestException(
          `Місце (ряд ${seat.row}, місце ${seat.seat}) повторюється у запиті`,
        );
      }
      seen.add(key);
    }

    for (const seat of dto.seats) {
      if (!this.hallsService.isSeatInHall(hall, seat.row, seat.seat)) {
        throw new BadRequestException(
          `Місця (ряд ${seat.row}, місце ${seat.seat}) немає в залі «${hall.name}»: ` +
            `доступні ряди 1–${hall.rows}, місця 1–${hall.seatsPerRow}`,
        );
      }
    }

    const booked = this.showingsService.bookedSeats(showingId);
    for (const seat of dto.seats) {
      if (booked.has(this.showingsService.seatKey(seat.row, seat.seat))) {
        throw new ConflictException(
          `Місце (ряд ${seat.row}, місце ${seat.seat}) вже заброньоване на цьому сеансі`,
        );
      }
    }

    const booking: Booking = {
      id: this.data.nextBookingId(),
      showingId,
      seats: dto.seats.map((seat) => ({ row: seat.row, seat: seat.seat })),
      totalPrice: showing.price * dto.seats.length,
    };
    this.data.bookings.push(booking);
    return booking;
  }

  findByShowing(showingId: number): Booking[] {
    return this.showingsService.bookingsOf(showingId);
  }

  remove(id: number): void {
    const booking = this.data.bookings.find((item) => item.id === id);
    if (!booking) {
      throw new NotFoundException(`Бронювання з id ${id} не знайдено`);
    }
    this.data.bookings.splice(this.data.bookings.indexOf(booking), 1);
  }
}
