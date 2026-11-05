import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateHallDto } from './dto/create-hall.dto';
import { HallsService } from './halls.service';

@ApiTags('halls')
@Controller('halls')
export class HallsController {
  constructor(private readonly hallsService: HallsService) {}

  @Post()
  @ApiOperation({ summary: 'Створити зал' })
  @ApiResponse({ status: 201, description: 'Зал створено' })
  @ApiResponse({ status: 400, description: 'Некоректні дані залу' })
  @ApiResponse({ status: 409, description: 'Зал з такою назвою вже існує' })
  create(@Body() dto: CreateHallDto) {
    return this.hallsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати всі зали' })
  @ApiResponse({ status: 200, description: 'Масив залів' })
  findAll() {
    return this.hallsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати зал разом з переліком місць' })
  @ApiResponse({ status: 200, description: 'Зал з полем seats' })
  @ApiResponse({ status: 400, description: 'id не є коректним UUID' })
  @ApiResponse({ status: 404, description: 'Зал не знайдено' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.hallsService.withSeats(id);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Видалити зал' })
  @ApiResponse({ status: 204, description: 'Зал видалено' })
  @ApiResponse({ status: 400, description: 'id не є коректним UUID' })
  @ApiResponse({ status: 404, description: 'Зал не знайдено' })
  @ApiResponse({ status: 409, description: 'Зал використовується в сеансах' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.hallsService.remove(id);
  }
}
