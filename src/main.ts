import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import { AppModule } from "./app.module";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const swaggerConfig = new DocumentBuilder()
    .setTitle("Cinema API")
    .setDescription(
      "API кінотеатру на NestJS + PostgreSQL (TypeORM, міграції, транзакції)",
    )
    .setVersion("2.0")
    .addTag("films")
    .addTag("halls")
    .addTag("showings")
    .addTag("bookings")
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("docs", app, document);

  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>("APP_PORT") ?? 3000);
  await app.listen(port);
}

void bootstrap();
