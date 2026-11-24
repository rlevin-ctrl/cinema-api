import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Showing } from "../../showings/entities/showing.entity";
import { BookingSeat } from "./booking-seat.entity";

@Entity("bookings")
export class Booking {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "showing_id", type: "uuid" })
  showingId!: string;

  @Column({ name: "total_price", type: "int" })
  totalPrice!: number;

  @ManyToOne(() => Showing, (showing) => showing.bookings, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "showing_id" })
  showing!: Showing;

  @OneToMany(() => BookingSeat, (seat) => seat.booking, {
    cascade: ["insert"],
  })
  seats!: BookingSeat[];

  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;
}
