import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateShowingDto, FindShowingsQueryDto } from './dto/showing.dto';
import { ShowingsService } from './showings.service';

@ApiTags('showings')
@Controller('showings')
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiOperation({ summary: 'Створити сеанс' })
  @ApiResponse({ status: 201, description: 'Сеанс створено' })
  @ApiResponse({
    status: 400,
    description: 'Невідомий фільм або зал, некоректна дата чи ціна',
  })
  create(@Body() dto: CreateShowingDto) {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати сеанси з фільтрацією та сортуванням' })
  @ApiResponse({ status: 200, description: 'Масив сеансів з назвами' })
  @ApiResponse({ status: 400, description: 'Некоректний формат date' })
  findAll(@Query() query: FindShowingsQueryDto) {
    return this.showingsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати сеанс за id' })
  @ApiResponse({ status: 200, description: 'Сеанс з назвами фільму й залу' })
  @ApiResponse({ status: 404, description: 'Сеанс не знайдено' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.showingsService.findOne(id);
  }

  @Get(':id/seats')
  @ApiOperation({ summary: 'Перелік місць залу з ознакою зайнятості' })
  @ApiResponse({ status: 200, description: 'Масив місць з isBooked' })
  @ApiResponse({ status: 404, description: 'Сеанс не знайдено' })
  seats(@Param('id', ParseIntPipe) id: number) {
    return this.showingsService.seatMap(id);
  }
}
