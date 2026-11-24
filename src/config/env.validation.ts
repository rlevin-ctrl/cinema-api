import { plainToInstance } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  validateSync,
} from "class-validator";

/**
 * Схема змінних оточення. Застосунок не стартує, якщо конфігурація
 * неповна або містить значення неприпустимого типу — краще впасти
 * на старті, ніж отримати незрозумілу помилку під час першого запиту.
 */
class EnvironmentVariables {
  @IsString({ message: "DB_HOST має бути рядком" })
  DB_HOST!: string;

  @IsInt({ message: "DB_PORT має бути цілим числом" })
  @Min(1, { message: "DB_PORT має бути не менше 1" })
  @Max(65535, { message: "DB_PORT не може перевищувати 65535" })
  DB_PORT!: number;

  @IsString({ message: "DB_USER має бути рядком" })
  DB_USER!: string;

  @IsString({ message: "DB_PASSWORD має бути рядком" })
  DB_PASSWORD!: string;

  @IsString({ message: "DB_NAME має бути рядком" })
  DB_NAME!: string;

  @IsOptional()
  @IsEnum(["true", "false"], { message: "DB_LOGGING має бути true або false" })
  DB_LOGGING?: string;

  @IsOptional()
  @IsInt({ message: "APP_PORT має бути цілим числом" })
  @Min(1, { message: "APP_PORT має бути не менше 1" })
  @Max(65535, { message: "APP_PORT не може перевищувати 65535" })
  APP_PORT?: number;
}

export function validateEnv(
  config: Record<string, unknown>,
): EnvironmentVariables {
  const validated = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validated, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const details = errors
      .map((error) => Object.values(error.constraints ?? {}).join(", "))
      .join("; ");
    throw new Error(`Некоректна конфігурація середовища: ${details}`);
  }

  return validated;
}
