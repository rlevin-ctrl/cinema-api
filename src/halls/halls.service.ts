import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";

import { Showing } from "../showings/entities/showing.entity";
import { CreateHallDto } from "./dto/create-hall.dto";
import { Hall } from "./entities/hall.entity";

export interface Seat {
  row: number;
  seat: number;
}

@Injectable()
export class HallsService {
  constructor(
    @InjectRepository(Hall)
    private readonly halls: Repository<Hall>,
    @InjectRepository(Showing)
    private readonly showings: Repository<Showing>,
  ) {}

  async create(dto: CreateHallDto): Promise<Hall> {
    const existing = await this.halls
      .createQueryBuilder("hall")
      .where("lower(hall.name) = lower(:name)", { name: dto.name })
      .getOne();

    if (existing) {
      throw new ConflictException(`Зал з назвою «${dto.name}» вже існує`);
    }

    return this.halls.save(this.halls.create(dto));
  }

  findAll(): Promise<Hall[]> {
    return this.halls.find({ order: { name: "ASC" } });
  }

  async findOne(id: string): Promise<Hall> {
    const hall = await this.halls.findOne({ where: { id } });
    if (!hall) {
      throw new NotFoundException(`Зал з id ${id} не знайдено`);
    }
    return hall;
  }

  async withSeats(id: string): Promise<Hall & { seats: Seat[] }> {
    const hall = await this.findOne(id);
    return { ...hall, seats: this.buildSeats(hall) };
  }

  buildSeats(hall: Hall): Seat[] {
    const seats: Seat[] = [];
    for (let row = 1; row <= hall.rows; row += 1) {
      for (let seat = 1; seat <= hall.seatsPerRow; seat += 1) {
        seats.push({ row, seat });
      }
    }
    return seats;
  }

  isSeatInHall(hall: Hall, row: number, seat: number): boolean {
    return (
      row >= 1 && row <= hall.rows && seat >= 1 && seat <= hall.seatsPerRow
    );
  }

  async remove(id: string): Promise<void> {
    const hall = await this.findOne(id);

    const showingsCount = await this.showings.count({ where: { hallId: id } });
    if (showingsCount > 0) {
      throw new ConflictException(
        `Зал з id ${id} використовується у ${showingsCount} сеансах і не може бути видалений`,
      );
    }

    await this.halls.remove(hall);
  }
}
