import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { BookingSeat } from "../bookings/entities/booking-seat.entity";
import { Film } from "../films/entities/film.entity";
import { Hall } from "../halls/entities/hall.entity";
import { HallsService, Seat } from "../halls/halls.service";
import { CreateShowingDto, FindShowingsQueryDto } from "./dto/showing.dto";
import { Showing } from "./entities/showing.entity";

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

export interface PaginatedShowings {
  items: ShowingView[];
  total: number;
  page: number;
  limit: number;
}

@Injectable()
export class ShowingsService {
  constructor(
    @InjectRepository(Showing)
    private readonly showings: Repository<Showing>,
    @InjectRepository(Film)
    private readonly films: Repository<Film>,
    @InjectRepository(Hall)
    private readonly halls: Repository<Hall>,
    @InjectRepository(BookingSeat)
    private readonly bookingSeats: Repository<BookingSeat>,
    private readonly hallsService: HallsService,
  ) {}

  async create(dto: CreateShowingDto): Promise<ShowingView> {
    const film = await this.films.findOne({ where: { id: dto.filmId } });
    if (!film) {
      throw new BadRequestException(
        `Фільм з id ${dto.filmId} не знайдено: сеанс не можна створити`,
      );
    }

    const hall = await this.halls.findOne({ where: { id: dto.hallId } });
    if (!hall) {
      throw new BadRequestException(
        `Зал з id ${dto.hallId} не знайдено: сеанс не можна створити`,
      );
    }

    const startsAt = new Date(dto.startsAt);
    if (startsAt.getTime() < Date.now()) {
      throw new BadRequestException(
        "startsAt вказує на момент у минулому: сеанс не можна створити",
      );
    }

    const showing = await this.showings.save(
      this.showings.create({
        filmId: dto.filmId,
        hallId: dto.hallId,
        startsAt,
        price: dto.price,
      }),
    );

    return this.toView(showing, film, hall);
  }

  /**
   * Фільтрація, сортування та пагінація виконуються в SQL:
   * WHERE / ORDER BY / LIMIT / OFFSET, плюс окремий COUNT для meta.
   */
  async findAll(query: FindShowingsQueryDto): Promise<PaginatedShowings> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const qb = this.showings
      .createQueryBuilder("showing")
      .innerJoinAndSelect("showing.film", "film")
      .innerJoinAndSelect("showing.hall", "hall");

    if (query.filmId) {
      qb.andWhere("showing.filmId = :filmId", { filmId: query.filmId });
    }

    if (query.hallId) {
      qb.andWhere("showing.hallId = :hallId", { hallId: query.hallId });
    }

    if (query.date) {
      // Порівняння за добою: CAST явний, щоб TypeORM не намагався
      // підставити назву властивості замість назви колонки
      qb.andWhere("CAST(showing.starts_at AS date) = CAST(:date AS date)", {
        date: query.date,
      });
    }

    qb.orderBy("showing.startsAt", (query.sort ?? "asc").toUpperCase() as "ASC" | "DESC")
      .addOrderBy("showing.id", "ASC")
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();

    return {
      items: rows.map((showing) =>
        this.toView(showing, showing.film, showing.hall),
      ),
      total,
      page,
      limit,
    };
  }

  async findEntity(id: string): Promise<Showing> {
    const showing = await this.showings.findOne({
      where: { id },
      relations: { film: true, hall: true },
    });
    if (!showing) {
      throw new NotFoundException(`Сеанс з id ${id} не знайдено`);
    }
    return showing;
  }

  async findOne(id: string): Promise<ShowingView> {
    const showing = await this.findEntity(id);
    return this.toView(showing, showing.film, showing.hall);
  }

  async seatMap(id: string): Promise<SeatView[]> {
    const showing = await this.findEntity(id);
    const hall = showing.hall;

    const booked = await this.bookingSeats
      .createQueryBuilder("seat")
      .select(["seat.row", "seat.seat"])
      .where("seat.showingId = :id", { id })
      .getRawMany<{ seat_row: number; seat_seat: number }>();

    const bookedKeys = new Set(
      booked.map((row) => `${Number(row.seat_row)}:${Number(row.seat_seat)}`),
    );

    return this.hallsService
      .buildSeats(hall)
      .map((seat) => ({
        ...seat,
        isBooked: bookedKeys.has(`${seat.row}:${seat.seat}`),
      }));
  }

  async hasShowingsForFilm(filmId: string): Promise<number> {
    return this.showings.count({ where: { filmId } });
  }

  async hasShowingsForHall(hallId: string): Promise<number> {
    return this.showings.count({ where: { hallId } });
  }

  private toView(showing: Showing, film: Film, hall: Hall): ShowingView {
    return {
      id: showing.id,
      filmTitle: film.title,
      hallTitle: hall.name,
      startsAt: showing.startsAt.toISOString(),
      price: showing.price,
    };
  }
}
