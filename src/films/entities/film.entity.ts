import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Showing } from "../../showings/entities/showing.entity";

@Entity("films")
export class Film {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 255 })
  title!: string;

  @Column({ name: "duration_minutes", type: "int" })
  durationMinutes!: number;

  @Column({ name: "release_year", type: "int" })
  releaseYear!: number;

  @OneToMany(() => Showing, (showing) => showing.film)
  showings!: Showing[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
