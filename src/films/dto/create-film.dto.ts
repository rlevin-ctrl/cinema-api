import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Max, Min } from 'class-validator';

export class CreateFilmDto {
  @ApiProperty({ example: 'Дюна: Частина друга', description: 'Назва фільму' })
  @IsString({ message: 'title має бути рядком' })
  @IsNotEmpty({ message: 'title є обовʼязковим полем' })
  title!: string;

  @ApiProperty({ example: 166, description: 'Тривалість у хвилинах' })
  @IsInt({ message: 'durationMinutes має бути цілим числом' })
  @Min(1, { message: 'durationMinutes має бути додатним числом' })
  durationMinutes!: number;

  @ApiProperty({ example: 2024, description: 'Рік випуску' })
  @IsInt({ message: 'releaseYear має бути цілим числом' })
  @Min(1888, { message: 'releaseYear має бути не менше 1888' })
  @Max(2100, { message: 'releaseYear має бути не більше 2100' })
  releaseYear!: number;
}
