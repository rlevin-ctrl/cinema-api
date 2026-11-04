import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Hall, Seat } from '../common/types';
import { DataService } from '../data/data.service';
import { CreateHallDto } from './dto/create-hall.dto';

@Injectable()
export class HallsService {
  constructor(private readonly data: DataService) {}

  create(dto: CreateHallDto): Hall {
    const duplicated = this.data.halls.some(
      (hall) => hall.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (duplicated) {
      throw new ConflictException(`Зал з назвою «${dto.name}» вже існує`);
    }

    const hall: Hall = {
      id: this.data.nextHallId(),
      name: dto.name,
      rows: dto.rows,
      seatsPerRow: dto.seatsPerRow,
    };
    this.data.halls.push(hall);
    return hall;
  }

  findAll(): Hall[] {
    return this.data.halls;
  }

  findOne(id: number): Hall {
    const hall = this.data.halls.find((item) => item.id === id);
    if (!hall) {
      throw new NotFoundException(`Зал з id ${id} не знайдено`);
    }
    return hall;
  }

  findById(id: number): Hall | undefined {
    return this.data.halls.find((item) => item.id === id);
  }

  withSeats(id: number): Hall & { seats: Seat[] } {
    const hall = this.findOne(id);
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
    return row >= 1 && row <= hall.rows && seat >= 1 && seat <= hall.seatsPerRow;
  }

  remove(id: number): void {
    const hall = this.findOne(id);
    const usedInShowings = this.data.showings.some(
      (showing) => showing.hallId === id,
    );
    if (usedInShowings) {
      throw new ConflictException(
        `Зал з id ${id} використовується в сеансах і не може бути видалений`,
      );
    }
    this.data.halls.splice(this.data.halls.indexOf(hall), 1);
  }
}
