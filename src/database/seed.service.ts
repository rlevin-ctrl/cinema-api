import { Injectable, Logger } from "@nestjs/common";
import { InjectDataSource } from "@nestjs/typeorm";
import { DataSource } from "typeorm";

import { Film } from "../films/entities/film.entity";
import { Hall } from "../halls/entities/hall.entity";
import { Showing } from "../showings/entities/showing.entity";

@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  /**
   * Ідемпотентний seed: якщо дані вже є, нічого не дублюємо.
   * Використовується і як CLI-команда, і при старті в dev-режимі.
   */
  async run(): Promise<void> {
    const filmRepo = this.dataSource.getRepository(Film);
    const hallRepo = this.dataSource.getRepository(Hall);
    const showingRepo = this.dataSource.getRepository(Showing);

    const existingFilms = await filmRepo.count();
    if (existingFilms > 0) {
      this.logger.log(`Seed пропущено: у базі вже ${existingFilms} фільмів`);
      return;
    }

    const films = await filmRepo.save([
      filmRepo.create({
        title: "Дюна: Частина друга",
        durationMinutes: 166,
        releaseYear: 2024,
      }),
      filmRepo.create({
        title: "Інтерстеллар",
        durationMinutes: 169,
        releaseYear: 2014,
      }),
      filmRepo.create({
        title: "Parasite",
        durationMinutes: 132,
        releaseYear: 2019,
      }),
    ]);

    const halls = await hallRepo.save([
      hallRepo.create({ name: "Червона зала", rows: 5, seatsPerRow: 8 }),
      hallRepo.create({ name: "Синя зала", rows: 3, seatsPerRow: 6 }),
    ]);

    const tomorrow = new Date();
    tomorrow.setUTCHours(18, 0, 0, 0);
    tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

    const dayAfter = new Date(tomorrow);
    dayAfter.setUTCDate(dayAfter.getUTCDate() + 1);

    await showingRepo.save([
      showingRepo.create({
        filmId: films[0].id,
        hallId: halls[0].id,
        startsAt: tomorrow,
        price: 15000,
      }),
      showingRepo.create({
        filmId: films[0].id,
        hallId: halls[1].id,
        startsAt: dayAfter,
        price: 12000,
      }),
      showingRepo.create({
        filmId: films[1].id,
        hallId: halls[0].id,
        startsAt: dayAfter,
        price: 13000,
      }),
    ]);

    this.logger.log(
      `Створено ${films.length} фільмів, ${halls.length} залів, 3 сеанси`,
    );
  }
}
