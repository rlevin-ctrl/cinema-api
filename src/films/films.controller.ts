import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { FilmsService } from './films.service';

@ApiTags('films')
@Controller('films')
export class FilmsController {
  constructor(private readonly filmsService: FilmsService) {}

  @Post()
  @ApiOperation({ summary: 'Створити фільм' })
  @ApiResponse({ status: 201, description: 'Фільм створено' })
  @ApiResponse({
    status: 400,
    description: 'Відсутнє поле або неправильний тип',
  })
  create(@Body() dto: CreateFilmDto) {
    return this.filmsService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Отримати всі фільми' })
  @ApiResponse({ status: 200, description: 'Масив фільмів' })
  findAll() {
    return this.filmsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Отримати фільм за id' })
  @ApiResponse({ status: 200, description: 'Обʼєкт фільму' })
  @ApiResponse({ status: 400, description: 'id не є коректним UUID' })
  @ApiResponse({ status: 404, description: 'Фільм не знайдено' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.filmsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Оновити фільм' })
  @ApiResponse({ status: 200, description: 'Оновлений фільм' })
  @ApiResponse({
    status: 400,
    description: 'Неправильний тип поля або id не є UUID',
  })
  @ApiResponse({ status: 404, description: 'Фільм не знайдено' })
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateFilmDto) {
    return this.filmsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Видалити фільм' })
  @ApiResponse({ status: 204, description: 'Фільм видалено' })
  @ApiResponse({ status: 400, description: 'id не є коректним UUID' })
  @ApiResponse({ status: 404, description: 'Фільм не знайдено' })
  @ApiResponse({
    status: 409,
    description: 'Фільм використовується в сеансах',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    this.filmsService.remove(id);
  }
}
