import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Showing } from "../showings/entities/showing.entity";
import { Film } from "./entities/film.entity";
import { FilmsController } from "./films.controller";
import { FilmsService } from "./films.service";

@Module({
  imports: [TypeOrmModule.forFeature([Film, Showing])],
  controllers: [FilmsController],
  providers: [FilmsService],
  exports: [FilmsService],
})
export class FilmsModule {}
