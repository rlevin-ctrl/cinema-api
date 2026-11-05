import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Hall, Seat } from '../common/types';
import { ShowingsService } from '../showings/showings.service';
import { CreateHallDto } from './dto/create-hall.dto';

@Injectable()
export class HallsService {
  private readonly halls: Hall[] = [];

  constructor(
    @Inject(forwardRef(() => ShowingsService))
    private readonly showingsService: ShowingsService,
  ) {}

  create(dto: CreateHallDto): Hall {
    const duplicated = this.halls.some(
      (hall) => hall.name.toLowerCase() === dto.name.toLowerCase(),
    );
    if (duplicated) {
      throw new ConflictException(`Зал з назвою «${dto.name}» вже існує`);
    }

    const hall: Hall = {
      id: randomUUID(),
      name: dto.name,
      rows: dto.rows,
      seatsPerRow: dto.seatsPerRow,
    };
    this.halls.push(hall);
    return hall;
  }

  findAll(): Hall[] {
    return this.halls;
  }

  findOne(id: string): Hall {
    const hall = this.findById(id);
    if (!hall) {
      throw new NotFoundException(`Зал з id ${id} не знайдено`);
    }
    return hall;
  }

  findById(id: string): Hall | undefined {
    return this.halls.find((hall) => hall.id === id);
  }

  withSeats(id: string): Hall & { seats: Seat[] } {
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
    return (
      row >= 1 && row <= hall.rows && seat >= 1 && seat <= hall.seatsPerRow
    );
  }

  remove(id: string): void {
    const hall = this.findOne(id);

    if (this.showingsService.hasShowingsForHall(id)) {
      throw new ConflictException(
        `Зал з id ${id} використовується в сеансах і не може бути видалений`,
      );
    }

    this.halls.splice(this.halls.indexOf(hall), 1);
  }
}
