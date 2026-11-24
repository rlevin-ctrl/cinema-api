import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

import { Showing } from "../../showings/entities/showing.entity";

@Entity("halls")
export class Hall {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ type: "varchar", length: 120, unique: true })
  name!: string;

  @Column({ type: "int" })
  rows!: number;

  @Column({ name: "seats_per_row", type: "int" })
  seatsPerRow!: number;

  @OneToMany(() => Showing, (showing) => showing.hall)
  showings!: Showing[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
