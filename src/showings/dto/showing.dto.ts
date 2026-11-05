import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';

export class CreateShowingDto {
  @ApiProperty({
    example: '3f1f0c2e-2a3b-4c4d-8e5f-6a7b8c9d0e1f',
    description: 'UUID фільму',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'filmId має бути UUID' })
  filmId!: string;

  @ApiProperty({
    example: '7c2a1b3d-4e5f-4a6b-9c8d-1e2f3a4b5c6d',
    description: 'UUID залу',
    format: 'uuid',
  })
  @IsUUID('4', { message: 'hallId має бути UUID' })
  hallId!: string;

  @ApiProperty({
    example: '2027-01-15T18:30:00.000Z',
    description: 'Дата й час початку у форматі ISO 8601 (дата має існувати)',
  })
  @IsISO8601(
    { strict: true },
    { message: 'startsAt має бути коректною датою ISO 8601' },
  )
  startsAt!: string;

  @ApiProperty({ example: 12500, description: 'Ціна квитка в копійках' })
  @IsInt({ message: 'price має бути цілим числом' })
  @Min(1, { message: 'price має бути додатним цілим числом' })
  price!: number;
}

export class FindShowingsQueryDto {
  @ApiPropertyOptional({
    example: '3f1f0c2e-2a3b-4c4d-8e5f-6a7b8c9d0e1f',
    description: 'Фільтр за UUID фільму',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'filmId має бути UUID' })
  filmId?: string;

  @ApiPropertyOptional({
    example: '2027-01-15',
    description: 'Фільтр за датою початку у форматі YYYY-MM-DD',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'date має бути у форматі YYYY-MM-DD',
  })
  @IsISO8601({ strict: true }, { message: 'date має бути існуючою датою' })
  date?: string;
}
