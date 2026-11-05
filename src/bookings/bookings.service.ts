import {
  BadRequestException,
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Booking, seatKey } from '../common/types';
import { HallsService } from '../halls/halls.service';
import { ShowingsService } from '../showings/showings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@Injectable()
export class BookingsService {
  private readonly bookings: Booking[] = [];

  constructor(
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
    private readonly hallsService: HallsService,
  ) {}

  findAll(): Booking[] {
    return this.bookings;
  }

  create(showingId: string, dto: CreateBookingDto): Booking {
    const showing = this.showingsService.findEntity(showingId);
    const hall = this.hallsService.findOne(showing.hallId);

    for (const seat of dto.seats) {
      if (!this.hallsService.isSeatInHall(hall, seat.row, seat.seat)) {
        throw new BadRequestException(
          `Місця (ряд ${seat.row}, місце ${seat.seat}) немає в залі «${hall.name}»: ` +
            `доступні ряди 1–${hall.rows}, місця 1–${hall.seatsPerRow}`,
        );
      }
    }

    const booked = this.bookedSeats(showingId);
    for (const seat of dto.seats) {
      if (booked.has(seatKey(seat.row, seat.seat))) {
        throw new ConflictException(
          `Місце (ряд ${seat.row}, місце ${seat.seat}) вже заброньоване на цьому сеансі`,
        );
      }
    }

    const booking: Booking = {
      id: randomUUID(),
      showingId,
      seats: dto.seats.map((seat) => ({ row: seat.row, seat: seat.seat })),
      totalPrice: showing.price * dto.seats.length,
    };
    this.bookings.push(booking);
    return booking;
  }

  findByShowing(showingId: string): Booking[] {
    this.showingsService.findEntity(showingId);
    return this.bookings.filter(
      (booking) => booking.showingId === showingId,
    );
  }

  bookedSeats(showingId: string): Set<string> {
    const keys = new Set<string>();
    for (const booking of this.bookings) {
      if (booking.showingId !== showingId) {
        continue;
      }
      for (const seat of booking.seats) {
        keys.add(seatKey(seat.row, seat.seat));
      }
    }
    return keys;
  }

  remove(id: string): void {
    const booking = this.bookings.find((item) => item.id === id);
    if (!booking) {
      throw new NotFoundException(`Бронювання з id ${id} не знайдено`);
    }
    this.bookings.splice(this.bookings.indexOf(booking), 1);
  }
}
