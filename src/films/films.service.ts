import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Showing } from "../showings/entities/showing.entity";
import { CreateFilmDto } from "./dto/create-film.dto";
import { UpdateFilmDto } from "./dto/update-film.dto";
import { Film } from "./entities/film.entity";

@Injectable()
export class FilmsService {
  constructor(
    @InjectRepository(Film)
    private readonly films: Repository<Film>,
    @InjectRepository(Showing)
    private readonly showings: Repository<Showing>,
  ) {}

  create(dto: CreateFilmDto): Promise<Film> {
    return this.films.save(this.films.create(dto));
  }

  findAll(): Promise<Film[]> {
    return this.films.find({ order: { title: "ASC" } });
  }

  async findOne(id: string): Promise<Film> {
    const film = await this.films.findOne({ where: { id } });
    if (!film) {
      throw new NotFoundException(`Фільм з id ${id} не знайдено`);
    }
    return film;
  }

  async update(id: string, dto: UpdateFilmDto): Promise<Film> {
    const film = await this.findOne(id);
    Object.assign(film, dto);
    return this.films.save(film);
  }

  async remove(id: string): Promise<void> {
    const film = await this.findOne(id);

    const showingsCount = await this.showings.count({ where: { filmId: id } });
    if (showingsCount > 0) {
      throw new ConflictException(
        `Фільм з id ${id} використовується у ${showingsCount} сеансах і не може бути видалений`,
      );
    }

    await this.films.remove(film);
  }
}
