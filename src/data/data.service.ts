import { Injectable } from '@nestjs/common';
import { Booking, Film, Hall, Showing } from '../common/types';

/**
 * Єдине сховище даних у пам'яті.
 * Модулі працюють зі своїми колекціями, а зв'язки перевіряють через сервіси.
 */
@Injectable()
export class DataService {
  readonly films: Film[] = [];
  readonly halls: Hall[] = [];
  readonly showings: Showing[] = [];
  readonly bookings: Booking[] = [];

  private filmSeq = 0;
  private hallSeq = 0;
  private showingSeq = 0;
  private bookingSeq = 0;

  nextFilmId(): number {
    return ++this.filmSeq;
  }

  nextHallId(): number {
    return ++this.hallSeq;
  }

  nextShowingId(): number {
    return ++this.showingSeq;
  }

  nextBookingId(): number {
    return ++this.bookingSeq;
  }
}
