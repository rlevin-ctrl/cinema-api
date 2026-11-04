import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  Min,
  ValidateNested,
} from 'class-validator';

export class SeatDto {
  @ApiProperty({ example: 1, description: 'Номер ряду' })
  @IsInt({ message: 'row має бути цілим числом' })
  @Min(1, { message: 'row має бути додатним цілим числом' })
  row!: number;

  @ApiProperty({ example: 3, description: 'Номер місця в ряду' })
  @IsInt({ message: 'seat має бути цілим числом' })
  @Min(1, { message: 'seat має бути додатним цілим числом' })
  seat!: number;
}

export class CreateBookingDto {
  @ApiProperty({ type: [SeatDto], description: 'Непорожній масив місць' })
  @IsArray({ message: 'seats має бути масивом' })
  @ArrayNotEmpty({ message: 'seats не може бути порожнім масивом' })
  @ValidateNested({ each: true })
  @Type(() => SeatDto)
  seats!: SeatDto[];
}
