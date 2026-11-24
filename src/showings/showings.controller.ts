import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
} from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
} from "@nestjs/swagger";

import { CreateShowingDto, FindShowingsQueryDto } from "./dto/showing.dto";
import {
  ErrorResponseDto,
  PaginatedShowingsDto,
  SeatViewDto,
  ShowingViewDto,
} from "./dto/showing-response.dto";
import { ShowingsService } from "./showings.service";

@ApiTags("showings")
@Controller("showings")
export class ShowingsController {
  constructor(private readonly showingsService: ShowingsService) {}

  @Post()
  @ApiOperation({ summary: "Створити сеанс" })
  @ApiCreatedResponse({ type: ShowingViewDto, description: "Сеанс створено" })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: "Невідомий фільм або зал, некоректні дата, час чи ціна",
  })
  @ApiResponse({ status: 201, description: "Сеанс створено" })
  @ApiResponse({
    status: 400,
    description: "Невідомий фільм або зал, некоректна дата чи ціна",
  })
  create(@Body() dto: CreateShowingDto) {
    return this.showingsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: "Сеанси: фільтри, сортування та посторінкова видача",
    description:
      "Фільтрація, сортування й пагінація виконуються запитом до PostgreSQL. " +
      "Відповідь містить items, total, page, limit.",
  })
  @ApiOkResponse({ type: PaginatedShowingsDto })
  @ApiBadRequestResponse({
    type: ErrorResponseDto,
    description: "Некоректні параметри запиту (page, limit, дата, UUID)",
  })
  @ApiResponse({
    status: 200,
    description: "Сторінка сеансів: items, total, page, limit",
  })
  @ApiResponse({ status: 400, description: "Некоректні параметри запиту" })
  findAll(@Query() query: FindShowingsQueryDto) {
    return this.showingsService.findAll(query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Отримати сеанс за id" })
  @ApiOkResponse({ type: ShowingViewDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: "id не UUID" })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: "Сеанс не знайдено",
  })
  @ApiResponse({ status: 200, description: "Сеанс з назвами фільму й залу" })
  @ApiResponse({ status: 400, description: "id не є коректним UUID" })
  @ApiResponse({ status: 404, description: "Сеанс не знайдено" })
  findOne(@Param("id", ParseUUIDPipe) id: string) {
    return this.showingsService.findOne(id);
  }

  @Get(":id/seats")
  @ApiOperation({ summary: "Перелік місць залу з ознакою зайнятості" })
  @ApiOkResponse({ type: [SeatViewDto] })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: "id не UUID" })
  @ApiNotFoundResponse({
    type: ErrorResponseDto,
    description: "Сеанс не знайдено",
  })
  @ApiResponse({ status: 200, description: "Масив місць з isBooked" })
  @ApiResponse({ status: 400, description: "id не є коректним UUID" })
  @ApiResponse({ status: 404, description: "Сеанс не знайдено" })
  seats(@Param("id", ParseUUIDPipe) id: string) {
    return this.showingsService.seatMap(id);
  }
}
