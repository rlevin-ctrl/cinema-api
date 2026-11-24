import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";

import { Showing } from "../showings/entities/showing.entity";
import { Hall } from "./entities/hall.entity";
import { HallsController } from "./halls.controller";
import { HallsService } from "./halls.service";

@Module({
  imports: [TypeOrmModule.forFeature([Hall, Showing])],
  controllers: [HallsController],
  providers: [HallsService],
  exports: [HallsService],
})
export class HallsModule {}
