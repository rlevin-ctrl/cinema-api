import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Film } from "../../films/entities/film.entity";
import { Hall } from "../../halls/entities/hall.entity";
import { Booking } from "../../bookings/entities/booking.entity";

@Entity("showings")
@Index("idx_showings_starts_at", ["startsAt"])
@Index("idx_showings_film_id", ["filmId"])
@Index("idx_showings_hall_id", ["hallId"])
export class Showing {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "film_id", type: "uuid" })
  filmId!: string;

  @Column({ name: "hall_id", type: "uuid" })
  hallId!: string;

  @Column({ name: "starts_at", type: "timestamptz" })
  startsAt!: Date;

  @Column({ type: "int" })
  price!: number;

  @ManyToOne(() => Film, (film) => film.showings, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "film_id" })
  film!: Film;

  @ManyToOne(() => Hall, (hall) => hall.showings, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "hall_id" })
  hall!: Hall;

  @OneToMany(() => Booking, (booking) => booking.showing)
  bookings!: Booking[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
