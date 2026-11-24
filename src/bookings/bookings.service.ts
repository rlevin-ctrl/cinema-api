import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource, QueryFailedError } from "typeorm";

import { CreateBookingDto } from "./dto/create-booking.dto";
import { BookingSeat } from "./entities/booking-seat.entity";
import { Booking } from "./entities/booking.entity";
import { Showing } from "../showings/entities/showing.entity";

export interface BookingView {
  id: string;
  showingId: string;
  seats: { row: number; seat: number }[];
  totalPrice: number;
}

@Injectable()
export class BookingsService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async findAll(): Promise<BookingView[]> {
    const bookings = await this.dataSource.getRepository(Booking).find({
      relations: { seats: true },
      order: { createdAt: "DESC" },
    });
    return bookings.map((booking) => this.toView(booking));
  }

  /**
   * Бронювання виконується в одній транзакції:
   *  1) перевіряємо сеанс і межі залу (400 / 404);
   *  2) вставляємо booking;
   *  3) вставляємо місця — унікальний індекс (showing_id, row, seat) не дає
   *     двом запитам зайняти одне місце одночасно;
   *  4) якщо індекс спрацював (23505) — відкат усієї транзакції та 409.
   * Завдяки цьому часткового бронювання не існує навіть під навантаженням.
   */
  async create(showingId: string, dto: CreateBookingDto): Promise<BookingView> {
    return this.dataSource.transaction(async (manager) => {
      const showing = await manager.findOne(Showing, {
        where: { id: showingId },
        relations: { hall: true },
      });

      if (!showing) {
        throw new NotFoundException(`Сеанс з id ${showingId} не знайдено`);
      }

      const hall = showing.hall;
      for (const seat of dto.seats) {
        const inHall =
          seat.row >= 1 &&
          seat.row <= hall.rows &&
          seat.seat >= 1 &&
          seat.seat <= hall.seatsPerRow;

        if (!inHall) {
          throw new BadRequestException(
            `Місця (ряд ${seat.row}, місце ${seat.seat}) немає в залі «${hall.name}»: ` +
              `доступні ряди 1–${hall.rows}, місця 1–${hall.seatsPerRow}`,
          );
        }
      }

      const booking = manager.create(Booking, {
        showingId,
        totalPrice: showing.price * dto.seats.length,
      });
      await manager.save(booking);

      const seatRows = dto.seats.map((seat) =>
        manager.create(BookingSeat, {
          bookingId: booking.id,
          showingId,
          row: seat.row,
          seat: seat.seat,
        }),
      );

      try {
        await manager.save(seatRows);
      } catch (error) {
        const code = (error as QueryFailedError & { code?: string }).code;
        if (code === "23505") {
          throw new ConflictException(
            "Одне або кілька вибраних місць уже заброньовані на цьому сеансі",
          );
        }
        throw error;
      }

      return {
        id: booking.id,
        showingId,
        seats: seatRows.map((seat) => ({ row: seat.row, seat: seat.seat })),
        totalPrice: booking.totalPrice,
      };
    });
  }

  async findByShowing(showingId: string): Promise<BookingView[]> {
    const showing = await this.dataSource
      .getRepository(Showing)
      .findOne({ where: { id: showingId } });
    if (!showing) {
      throw new NotFoundException(`Сеанс з id ${showingId} не знайдено`);
    }

    const bookings = await this.dataSource.getRepository(Booking).find({
      where: { showingId },
      relations: { seats: true },
      order: { createdAt: "ASC" },
    });

    return bookings.map((booking) => this.toView(booking));
  }

  async remove(id: string): Promise<void> {
    const result = await this.dataSource
      .getRepository(Booking)
      .delete({ id });

    if (!result.affected) {
      throw new NotFoundException(`Бронювання з id ${id} не знайдено`);
    }
  }

  private toView(booking: Booking): BookingView {
    return {
      id: booking.id,
      showingId: booking.showingId,
      seats: (booking.seats ?? []).map((seat) => ({
        row: seat.row,
        seat: seat.seat,
      })),
      totalPrice: booking.totalPrice,
    };
  }
}
