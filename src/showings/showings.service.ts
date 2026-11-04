import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Booking, Hall, Seat, Showing } from '../common/types';
import { DataService } from '../data/data.service';
import { FilmsService } from '../films/films.service';
import { HallsService } from '../halls/halls.service';
import { CreateShowingDto, FindShowingsQueryDto } from './dto/showing.dto';

export interface ShowingView {
  id: number;
  filmTitle: string;
  hallTitle: string;
  startsAt: string;
  price: number;
}

export interface SeatView extends Seat {
  isBooked: boolean;
}

@Injectable()
export class ShowingsService {
  constructor(
    private readonly data: DataService,
    private readonly filmsService: FilmsService,
    private readonly hallsService: HallsService,
  ) {}

  create(dto: CreateShowingDto): ShowingView {
    const film = this.filmsService.findById(dto.filmId);
    if (!film) {
      throw new BadRequestException(
        `Фільм з id ${dto.filmId} не знайдено: сеанс не можна створити`,
      );
    }

    const hall = this.hallsService.findById(dto.hallId);
    if (!hall) {
      throw new BadRequestException(
        `Зал з id ${dto.hallId} не знайдено: сеанс не можна створити`,
      );
    }

    const startsAt = this.parseStartsAt(dto.startsAt);
    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'startsAt вказує на момент у минулому: сеанс не можна створити',
      );
    }

    const showing: Showing = {
      id: this.data.nextShowingId(),
      filmId: dto.filmId,
      hallId: dto.hallId,
      startsAt: startsAt.toISOString(),
      price: dto.price,
    };
    this.data.showings.push(showing);
    return this.toView(showing);
  }

  findAll(query: FindShowingsQueryDto): ShowingView[] {
    const filtered = this.data.showings.filter((showing) => {
      if (query.filmId !== undefined && showing.filmId !== query.filmId) {
        return false;
      }
      if (query.date && showing.startsAt.slice(0, 10) !== query.date) {
        return false;
      }
      return true;
    });

    return filtered
      .sort((a, b) => {
        const diff = Date.parse(a.startsAt) - Date.parse(b.startsAt);
        return diff !== 0 ? diff : a.id - b.id;
      })
      .map((showing) => this.toView(showing));
  }

  findEntity(id: number): Showing {
    const showing = this.data.showings.find((item) => item.id === id);
    if (!showing) {
      throw new NotFoundException(`Сеанс з id ${id} не знайдено`);
    }
    return showing;
  }

  findOne(id: number): ShowingView {
    return this.toView(this.findEntity(id));
  }

  seatMap(id: number): SeatView[] {
    const showing = this.findEntity(id);
    const hall = this.hallsService.findOne(showing.hallId);
    const booked = this.bookedSeats(id);

    return this.hallsService.buildSeats(hall).map((seat) => ({
      ...seat,
      isBooked: booked.has(this.seatKey(seat.row, seat.seat)),
    }));
  }

  bookedSeats(showingId: number): Set<string> {
    const keys = new Set<string>();
    for (const booking of this.data.bookings) {
      if (booking.showingId !== showingId) {
        continue;
      }
      for (const seat of booking.seats) {
        keys.add(this.seatKey(seat.row, seat.seat));
      }
    }
    return keys;
  }

  hallOf(showing: Showing): Hall {
    return this.hallsService.findOne(showing.hallId);
  }

  seatKey(row: number, seat: number): string {
    return `${row}:${seat}`;
  }

  bookingsOf(showingId: number): Booking[] {
    this.findEntity(showingId);
    return this.data.bookings.filter(
      (booking) => booking.showingId === showingId,
    );
  }

  private parseStartsAt(value: string): Date {
    const isoLike = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:\d{2})?$/.test(
      value,
    );
    const date = new Date(value);
    if (!isoLike || Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'startsAt має бути коректною датою ISO 8601',
      );
    }
    return date;
  }

  private toView(showing: Showing): ShowingView {
    const film = this.filmsService.findOne(showing.filmId);
    const hall = this.hallsService.findOne(showing.hallId);
    return {
      id: showing.id,
      filmTitle: film.title,
      hallTitle: hall.name,
      startsAt: showing.startsAt,
      price: showing.price,
    };
  }
}
