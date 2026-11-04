import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsNotEmpty, IsString, Min } from 'class-validator';

export class CreateHallDto {
  @ApiProperty({ example: 'Червона зала', description: 'Унікальна назва залу' })
  @IsString({ message: 'name має бути рядком' })
  @IsNotEmpty({ message: 'name є обовʼязковим полем' })
  name!: string;

  @ApiProperty({ example: 3, description: 'Кількість рядів' })
  @IsInt({ message: 'rows має бути цілим числом' })
  @Min(1, { message: 'rows має бути додатним цілим числом' })
  rows!: number;

  @ApiProperty({ example: 5, description: 'Кількість місць у ряду' })
  @IsInt({ message: 'seatsPerRow має бути цілим числом' })
  @Min(1, { message: 'seatsPerRow має бути додатним цілим числом' })
  seatsPerRow!: number;
}
