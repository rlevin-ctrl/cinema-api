import { Module } from '@nestjs/common';
import { BookingsModule } from './bookings/bookings.module';
import { DataModule } from './data/data.module';
import { FilmsModule } from './films/films.module';
import { HallsModule } from './halls/halls.module';
import { ShowingsModule } from './showings/showings.module';

@Module({
  imports: [
    DataModule,
    FilmsModule,
    HallsModule,
    ShowingsModule,
    BookingsModule,
  ],
})
export class AppModule {}
