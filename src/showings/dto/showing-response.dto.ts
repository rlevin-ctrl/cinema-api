import { ApiProperty } from "@nestjs/swagger";

export class ShowingViewDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ example: "Дюна: Частина друга" })
  filmTitle!: string;

  @ApiProperty({ example: "Червона зала" })
  hallTitle!: string;

  @ApiProperty({ example: "2027-01-15T18:30:00.000Z", format: "date-time" })
  startsAt!: string;

  @ApiProperty({ example: 15000, description: "Ціна квитка в копійках" })
  price!: number;
}

export class PaginatedShowingsDto {
  @ApiProperty({ type: [ShowingViewDto], description: "Сеанси на сторінці" })
  items!: ShowingViewDto[];

  @ApiProperty({ example: 37, description: "Усього записів за фільтром" })
  total!: number;

  @ApiProperty({ example: 1, description: "Поточна сторінка" })
  page!: number;

  @ApiProperty({ example: 20, description: "Розмір сторінки" })
  limit!: number;
}

export class SeatViewDto {
  @ApiProperty({ example: 1 })
  row!: number;

  @ApiProperty({ example: 3 })
  seat!: number;

  @ApiProperty({ example: false, description: "Місце вже заброньоване" })
  isBooked!: boolean;
}

export class BookingSeatViewDto {
  @ApiProperty({ example: 1 })
  row!: number;

  @ApiProperty({ example: 3 })
  seat!: number;
}

export class BookingViewDto {
  @ApiProperty({ format: "uuid" })
  id!: string;

  @ApiProperty({ format: "uuid" })
  showingId!: string;

  @ApiProperty({ type: [BookingSeatViewDto] })
  seats!: BookingSeatViewDto[];

  @ApiProperty({ example: 30000, description: "Сума в копійках" })
  totalPrice!: number;
}

export class ErrorResponseDto {
  @ApiProperty({ example: 409 })
  statusCode!: number;

  @ApiProperty({
    example: "Одне або кілька вибраних місць уже заброньовані на цьому сеансі",
  })
  message!: string;

  @ApiProperty({ example: "CONFLICT" })
  error!: string;

  @ApiProperty({ example: "/showings/3f1f0c2e-2a3b-4c4d-8e5f-6a7b8c9d0e1f/bookings" })
  path!: string;

  @ApiProperty({ example: "2026-11-24T18:32:12.515Z", format: "date-time" })
  timestamp!: string;
}
