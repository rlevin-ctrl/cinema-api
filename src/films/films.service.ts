import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Film } from '../common/types';
import { DataService } from '../data/data.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';

@Injectable()
export class FilmsService {
  constructor(private readonly data: DataService) {}

  create(dto: CreateFilmDto): Film {
    const film: Film = {
      id: this.data.nextFilmId(),
      title: dto.title,
      durationMinutes: dto.durationMinutes,
      releaseYear: dto.releaseYear,
    };
    this.data.films.push(film);
    return film;
  }

  findAll(): Film[] {
    return this.data.films;
  }

  findOne(id: number): Film {
    const film = this.data.films.find((item) => item.id === id);
    if (!film) {
      throw new NotFoundException(`Фільм з id ${id} не знайдено`);
    }
    return film;
  }

  findById(id: number): Film | undefined {
    return this.data.films.find((item) => item.id === id);
  }

  update(id: number, dto: UpdateFilmDto): Film {
    const film = this.findOne(id);
    Object.assign(film, dto);
    return film;
  }

  remove(id: number): void {
    const film = this.findOne(id);
    const usedInShowings = this.data.showings.some(
      (showing) => showing.filmId === id,
    );
    if (usedInShowings) {
      throw new ConflictException(
        `Фільм з id ${id} використовується в сеансах і не може бути видалений`,
      );
    }
    this.data.films.splice(this.data.films.indexOf(film), 1);
  }
}
