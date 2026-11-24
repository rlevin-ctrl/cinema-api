import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";

import { Booking } from "./booking.entity";

/**
 * Заброньоване місце. Окрема таблиця потрібна для гарантії на рівні БД:
 * унікальний індекс (showing_id, row, seat) не дає двом бронюванням
 * зайняти одне й те саме місце навіть при одночасних запитах.
 */
@Entity("booking_seats")
@Index("uq_booking_seats_showing_seat", ["showingId", "row", "seat"], {
  unique: true,
})
export class BookingSeat {
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @Column({ name: "booking_id", type: "uuid" })
  bookingId!: string;

  @Column({ name: "showing_id", type: "uuid" })
  showingId!: string;

  @Column({ type: "int" })
  row!: number;

  @Column({ type: "int" })
  seat!: number;

  @ManyToOne(() => Booking, (booking) => booking.seats, {
    onDelete: "CASCADE",
  })
  @JoinColumn({ name: "booking_id" })
  booking!: Booking;
}
