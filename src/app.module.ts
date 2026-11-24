import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypeOrmModule } from "@nestjs/typeorm";

import { BookingsModule } from "./bookings/bookings.module";
import { validateEnv } from "./config/env.validation";
import { typeOrmOptions } from "./database/typeorm.config";
import { FilmsModule } from "./films/films.module";
import { HallsModule } from "./halls/halls.module";
import { ShowingsModule } from "./showings/showings.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validate: validateEnv }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: typeOrmOptions,
    }),
    FilmsModule,
    HallsModule,
    ShowingsModule,
    BookingsModule,
  ],
})
export class AppModule {}
