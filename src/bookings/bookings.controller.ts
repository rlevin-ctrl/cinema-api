import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';

@ApiTags('bookings')
@Controller()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Get('bookings')
  @ApiOperation({ summary: 'Отримати всі бронювання' })
  @ApiResponse({ status: 200, description: 'Масив бронювань' })
  findAll() {
    return this.bookingsService.findAll();
  }

  @Post('showings/:id/bookings')
  @ApiOperation({ summary: 'Забронювати місця на сеанс' })
  @ApiResponse({
    status: 201,
    description: 'Бронювання створено, повертається підсумкова ціна',
  })
  @ApiResponse({
    status: 400,
    description: 'Порожній масив, повтор місця або місця немає в залі',
  })
  @ApiResponse({ status: 404, description: 'Сеанс не знайдено' })
  @ApiResponse({ status: 409, description: 'Місце вже заброньоване' })
  create(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateBookingDto,
  ) {
    return this.bookingsService.create(id, dto);
  }

  @Get('showings/:id/bookings')
  @ApiOperation({ summary: 'Отримати бронювання сеансу' })
  @ApiResponse({ status: 200, description: 'Масив бронювань сеансу' })
  @ApiResponse({ status: 404, description: 'Сеанс не знайдено' })
  findByShowing(@Param('id', ParseIntPipe) id: number) {
    return this.bookingsService.findByShowing(id);
  }

  @Delete('bookings/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Скасувати бронювання' })
  @ApiResponse({ status: 204, description: 'Бронювання скасовано' })
  @ApiResponse({ status: 404, description: 'Бронювання не знайдено' })
  remove(@Param('id', ParseIntPipe) id: number) {
    this.bookingsService.remove(id);
  }
}
