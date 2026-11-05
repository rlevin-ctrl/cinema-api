import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Film } from '../common/types';
import { ShowingsService } from '../showings/showings.service';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';

@Injectable()
export class FilmsService {
  private readonly films: Film[] = [];

  constructor(
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateFilmDto): Film {
    const film: Film = {
      id: randomUUID(),
      title: dto.title,
      durationMinutes: dto.durationMinutes,
      releaseYear: dto.releaseYear,
    };
    this.films.push(film);
    return film;
  }

  findAll(): Film[] {
    return this.films;
  }

  findOne(id: string): Film {
    const film = this.findById(id);
    if (!film) {
      throw new NotFoundException(`Фільм з id ${id} не знайдено`);
    }
    return film;
  }

  findById(id: string): Film | undefined {
    return this.films.find((film) => film.id === id);
  }

  update(id: string, dto: UpdateFilmDto): Film {
    const film = this.findOne(id);
    Object.assign(film, dto);
    return film;
  }

  remove(id: string): void {
    const film = this.findOne(id);

    if (this.showingsService.hasShowingsForFilm(id)) {
      throw new ConflictException(
        `Фільм з id ${id} використовується в сеансах і не може бути видалений`,
      );
    }

    this.films.splice(this.films.indexOf(film), 1);
  }
}
