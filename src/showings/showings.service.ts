import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Seat, Showing } from '../common/types';
import { BookingsService } from '../bookings/bookings.service';
import { FilmsService } from '../films/films.service';
import { HallsService } from '../halls/halls.service';
import { CreateShowingDto, FindShowingsQueryDto } from './dto/showing.dto';

export interface ShowingView {
  id: string;
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
  private readonly showings: Showing[] = [];

  constructor(
    @Inject(forwardRef(() => FilmsService))
    private readonly filmsService: FilmsService,
    private readonly hallsService: HallsService,
    @Inject(forwardRef(() => BookingsService))
    private readonly bookingsService: BookingsService,
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

    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        'startsAt вказує на момент у минулому: сеанс не можна створити',
      );
    }

    const showing: Showing = {
      id: randomUUID(),
      filmId: dto.filmId,
      hallId: dto.hallId,
      startsAt: startsAt.toISOString(),
      price: dto.price,
    };
    this.showings.push(showing);
    return this.toView(showing);
  }

  findAll(query: FindShowingsQueryDto): ShowingView[] {
    return this.showings
      .filter((showing) => {
        const matchesFilm =
          query.filmId === undefined || showing.filmId === query.filmId;
        const matchesDate =
          query.date === undefined ||
          showing.startsAt.slice(0, 10) === query.date;
        return matchesFilm && matchesDate;
      })
      .sort((a, b) => {
        const diff = Date.parse(a.startsAt) - Date.parse(b.startsAt);
        return diff !== 0 ? diff : a.id.localeCompare(b.id);
      })
      .map((showing) => this.toView(showing));
  }

  findEntity(id: string): Showing {
    const showing = this.showings.find((item) => item.id === id);
    if (!showing) {
      throw new NotFoundException(`Сеанс з id ${id} не знайдено`);
    }
    return showing;
  }

  findOne(id: string): ShowingView {
    return this.toView(this.findEntity(id));
  }

  seatMap(id: string): SeatView[] {
    const showing = this.findEntity(id);
    const hall = this.hallsService.findOne(showing.hallId);
    const booked = this.bookingsService.bookedSeats(showing.id);

    return this.hallsService.buildSeats(hall).map((seat) => ({
      ...seat,
      isBooked: booked.has(`${seat.row}:${seat.seat}`),
    }));
  }

  hasShowingsForFilm(filmId: string): boolean {
    return this.showings.some((showing) => showing.filmId === filmId);
  }

  hasShowingsForHall(hallId: string): boolean {
    return this.showings.some((showing) => showing.hallId === hallId);
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
