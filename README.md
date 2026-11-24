# Cinema API (NestJS + PostgreSQL)

REST API кінотеатру: фільми, зали, сеанси та бронювання місць.
Домашнє завдання №2 курсу «Back-end розробка з Node.js (NestJS)» — перехід
з памʼяті на реальну базу даних.

## Технології

- **NestJS 12** (TypeScript)
- **PostgreSQL 16** + **TypeORM** (репозиторії, QueryBuilder, міграції)
- **class-validator / class-transformer** — валідація DTO
- **Swagger** — документація на `/docs`
- **Docker Compose** — підняття бази однією командою

## Що змінилось порівняно з ДЗ №1

| Було (ДЗ №1)            | Стало (ДЗ №2)                                            |
| ----------------------- | -------------------------------------------------------- |
| масиви в памʼяті        | таблиці PostgreSQL, доступ через `Repository`            |
| схема з коду            | схема будується **міграціями**, `synchronize: false`     |
| фільтрація в JS         | `WHERE`, `ORDER BY`, `LIMIT/OFFSET` виконує PostgreSQL   |
| «ручна» перевірка зайнятості місця | унікальний індекс + транзакція                  |
| `forwardRef()` між модулями | залежності через `TypeOrmModule.forFeature()`        |
| різнорідні помилки      | єдиний глобальний фільтр винятків                        |

## Структура проєкту

```
src/
├── films/                  # фільми: entity, DTO, контролер, сервіс
├── halls/                  # зали
├── showings/               # сеанси (+ пагінація, фільтри, сортування)
├── bookings/               # бронювання (+ транзакція)
├── database/
│   ├── data-source.ts      # DataSource для TypeORM CLI
│   ├── typeorm.config.ts   # конфігурація для NestJS
│   ├── migrations/         # SQL-міграції
│   ├── seed.service.ts     # ідемпотентне наповнення
│   └── seed.ts             # CLI-точка входу для npm run seed
├── common/filters/         # глобальний фільтр винятків
├── app.module.ts
└── main.ts
```

## Запуск

### 1. База даних

```bash
docker compose up -d
```

Піднімається PostgreSQL 16 на `localhost:5432` з базою `cinema`, користувачем
`cinema` і паролем `cinema` (значення беруться з `.env`, див. нижче).
Дані зберігаються у volume `cinema-pgdata`, тому переживають перезапуск контейнера.

### 2. Змінні оточення

```bash
cp .env.example .env
```

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=cinema
DB_PASSWORD=cinema
DB_NAME=cinema
DB_LOGGING=false
APP_PORT=3000
```

### 3. Залежності, міграції, тестові дані

```bash
npm install
npm run migration:run   # створює всі таблиці, індекси та обмеження
npm run seed            # додає 3 фільми, 2 зали, 3 сеанси (ідемпотентно)
```

### 4. Старт

```bash
npm run start:dev       # http://localhost:3000
```

Swagger: `http://localhost:3000/docs`

## Схема бази даних

```
films (id uuid PK, title, duration_minutes, release_year, created_at, updated_at)
   │
   └─1:N─ showings (id, film_id → films RESTRICT, hall_id → halls RESTRICT,
                    starts_at, price, ...)
             │
             ├─1:N─ bookings (id, showing_id → showings CASCADE, total_price)
             │        │
             │        └─1:N─ booking_seats (id, booking_id → bookings CASCADE,
             │                              showing_id, row, seat)
             │
             └──── halls (id, name UNIQUE, rows, seats_per_row)
```

Ключові обмеження на рівні БД:

- `uq_booking_seats_showing_seat` — **унікальний індекс** `(showing_id, row, seat)`:
  одне місце на сеансі можна забронювати лише один раз;
- `fk_showings_film` / `fk_showings_hall` з `ON DELETE RESTRICT` — не дає видалити
  фільм або зал, поки на нього є сеанси (сервіс додатково повертає зрозумілий `409`);
- `CHECK`-обмеження на додатні `duration_minutes`, `price`, `rows`, `seats_per_row`,
  `row`, `seat`, коректний `release_year`.

## Міграції

```bash
npm run migration:run      # застосувати
npm run migration:revert   # відкотити останню
npm run typeorm -- migration:show
```

Міграції написані вручну (`src/database/migrations/`), `synchronize` вимкнено —
схема однакова на будь-якому середовищі й відтворюється з порожньої бази.

## Пагінація, фільтри, сортування

`GET /showings` приймає:

| Параметр | Тип               | За замовчуванням | Опис                       |
| -------- | ----------------- | ---------------- | -------------------------- |
| `page`   | int ≥ 1           | 1                | номер сторінки             |
| `limit`  | int 1…100         | 20               | записів на сторінку        |
| `filmId` | uuid              | —                | фільтр за фільмом          |
| `hallId` | uuid              | —                | фільтр за залом            |
| `date`   | `YYYY-MM-DD`      | —                | сеанси за конкретну добу   |
| `sort`   | `asc` \| `desc`   | `asc`            | порядок за часом початку   |

Відповідь містить `items`, `total`, `page`, `limit`:

```json
{
  "items": [ { "id": "...", "filmTitle": "...", "hallTitle": "...", "startsAt": "...", "price": 15000 } ],
  "total": 3,
  "page": 1,
  "limit": 20
}
```

Усе це виконується в SQL (`WHERE` + `ORDER BY` + `LIMIT/OFFSET`, окремо `COUNT`
для `total`), а не фільтрацією масиву в памʼяті.

## Транзакційне бронювання

`POST /showings/:id/bookings`

```json
{ "seats": [ { "row": 1, "seat": 1 }, { "row": 1, "seat": 2 } ] }
```

Усередині однієї транзакції:

1. перевіряється існування сеансу (`404`) і межі залу (`400`);
2. вставляється `bookings`;
3. вставляються `booking_seats` — тут спрацьовує унікальний індекс;
4. якщо індекс повернув `23505`, транзакція **відкочується повністю** і клієнт
   отримує `409`.

Перевірка «чи вільне місце» окремим `SELECT` не використовується: між перевіркою
й вставкою завжди є вікно гонки. Гарантію дає саме індекс, тому навіть 10
одночасних запитів на те саме місце дають рівно один `201` і девʼять `409`.
Часткового бронювання (коли частина місць записалась) не буває — транзакція.

## Єдиний формат помилок

`AllExceptionsFilter` перехоплює все й віддає однакову структуру:

```json
{
  "statusCode": 409,
  "message": "Одне або кілька вибраних місць уже заброньовані на цьому сеансі",
  "error": "CONFLICT",
  "path": "/showings/<uuid>/bookings",
  "timestamp": "2026-11-24T18:32:12.515Z"
}
```

Коди PostgreSQL перекладаються в HTTP: `23505` → `409`, `23503` → `409`,
`23514` → `400`, решта — `400`/`500`. Стек і деталі запиту в лог пишуться лише
для `5xx`.

## Маршрути

**Фільми**

- `POST /films` — створити фільм
- `GET /films` — усі фільми
- `GET /films/:id` — один фільм
- `PATCH /films/:id` — оновити фільм
- `DELETE /films/:id` — видалити фільм (`409`, якщо є сеанси)

**Зали**

- `POST /halls` — створити зал (`409`, якщо назва вже зайнята)
- `GET /halls` — усі зали
- `GET /halls/:id` — зал разом з масивом `seats`
- `DELETE /halls/:id` — видалити зал (`409`, якщо є сеанси)

**Сеанси**

- `POST /showings` — створити сеанс
- `GET /showings?page=&limit=&filmId=&hallId=&date=&sort=` — сторінка сеансів
- `GET /showings/:id` — один сеанс
- `GET /showings/:id/seats` — місця залу з ознакою `isBooked`

**Бронювання**

- `GET /bookings` — усі бронювання
- `POST /showings/:id/bookings` — забронювати місця (`409`, якщо місце зайняте)
- `GET /showings/:id/bookings` — бронювання сеансу
- `DELETE /bookings/:id` — скасувати бронювання (місця звільняються)

## Перевірка маршрутів

`requests.http` у корені — виконується згори вниз у REST Client (VS Code /
WebStorm). Ідентифікатори підставляються зі змінних
(`{{createFilm.response.body.id}}`), вручну нічого вписувати не потрібно.
