export interface Film {
  id: number;
  title: string;
  durationMinutes: number;
  releaseYear: number;
}

export interface Hall {
  id: number;
  name: string;
  rows: number;
  seatsPerRow: number;
}

export interface Seat {
  row: number;
  seat: number;
}

export interface Showing {
  id: number;
  filmId: number;
  hallId: number;
  startsAt: string;
  price: number;
}

export interface Booking {
  id: number;
  showingId: number;
  seats: Seat[];
  totalPrice: number;
}
