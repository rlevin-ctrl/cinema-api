import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Matches, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateShowingDto {
  @ApiProperty({ example: 1, description: 'id фільму' })
  @IsInt({ message: 'filmId має бути цілим числом' })
  filmId!: number;

  @ApiProperty({ example: 1, description: 'id залу' })
  @IsInt({ message: 'hallId має бути цілим числом' })
  hallId!: number;

  @ApiProperty({
    example: '2026-11-10T18:30:00.000Z',
    description: 'Дата й час початку у форматі ISO 8601',
  })
  @IsString({ message: 'startsAt має бути рядком у форматі ISO 8601' })
  startsAt!: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  @IsInt({ message: 'price має бути цілим числом' })
  @Min(1, { message: 'price має бути додатним цілим числом' })
  price!: number;
}

export class FindShowingsQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'Фільтр за id фільму' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'filmId має бути цілим числом' })
  filmId?: number;

  @ApiPropertyOptional({
    example: '2026-11-10',
    description: 'Фільтр за датою початку у форматі YYYY-MM-DD',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date має бути у форматі YYYY-MM-DD',
  })
  date?: string;
}
