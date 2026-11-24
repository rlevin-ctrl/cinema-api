import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Matches,
  Max,
  Min,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateShowingDto {
  @ApiProperty({
    example: "3f1f0c2e-2a3b-4c4d-8e5f-6a7b8c9d0e1f",
    description: "UUID фільму",
    format: "uuid",
  })
  @IsUUID("4", { message: "filmId має бути UUID" })
  filmId!: string;

  @ApiProperty({
    example: "7c2a1b3d-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
    description: "UUID залу",
    format: "uuid",
  })
  @IsUUID("4", { message: "hallId має бути UUID" })
  hallId!: string;

  @ApiProperty({
    example: "2027-01-15T18:30:00.000Z",
    description: "Дата й час початку у форматі ISO 8601 (дата має існувати)",
  })
  @IsISO8601(
    { strict: true },
    { message: "startsAt має бути коректною датою ISO 8601" },
  )
  startsAt!: string;

  @ApiProperty({ example: 12500, description: "Ціна квитка в копійках" })
  @IsInt({ message: "price має бути цілим числом" })
  @Min(1, { message: "price має бути додатним цілим числом" })
  price!: number;
}

/**
 * Фільтри, сортування й пагінація передаються в SQL:
 * LIMIT/OFFSET і ORDER BY виконує PostgreSQL, а не застосунок.
 */
export class FindShowingsQueryDto {
  @ApiPropertyOptional({
    example: 1,
    description: "Номер сторінки (з 1)",
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "page має бути цілим числом" })
  @Min(1, { message: "page має бути не менше 1" })
  page: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: "Кількість записів на сторінці",
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "limit має бути цілим числом" })
  @Min(1, { message: "limit має бути не менше 1" })
  @Max(100, { message: "limit не може перевищувати 100" })
  limit: number = 20;

  @ApiPropertyOptional({
    example: "3f1f0c2e-2a3b-4c4d-8e5f-6a7b8c9d0e1f",
    description: "Фільтр за фільмом",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID("4", { message: "filmId має бути UUID" })
  filmId?: string;

  @ApiPropertyOptional({
    example: "7c2a1b3d-4e5f-4a6b-9c8d-1e2f3a4b5c6d",
    description: "Фільтр за залом",
    format: "uuid",
  })
  @IsOptional()
  @IsUUID("4", { message: "hallId має бути UUID" })
  hallId?: string;

  @ApiPropertyOptional({
    example: "2027-01-15",
    description: "Фільтр за датою початку (YYYY-MM-DD)",
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: "date має бути у форматі YYYY-MM-DD",
  })
  @IsISO8601({ strict: true }, { message: "date має бути існуючою датою" })
  date?: string;

  @ApiPropertyOptional({
    enum: ["asc", "desc"],
    default: "asc",
    description: "Порядок сортування за часом початку",
  })
  @IsOptional()
  @IsIn(["asc", "desc"], { message: "sort має бути asc або desc" })
  sort: "asc" | "desc" = "asc";
}
