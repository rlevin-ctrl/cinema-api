export interface Film {
  id: string;
  title: string;
  durationMinutes: number;
  releaseYear: number;
}

export interface Hall {
  id: string;
  name: string;
  rows: number;
  seatsPerRow: number;
}

export interface Seat {
  row: number;
  seat: number;
}

export interface Showing {
  id: string;
  filmId: string;
  hallId: string;
  startsAt: string;
  price: number;
}

export interface Booking {
  id: string;
  showingId: string;
  seats: Seat[];
  totalPrice: number;
}

/** Ключ місця для порівняння в межах сеансу. */
export const seatKey = (row: number, seat: number): string => `${row}:${seat}`;
