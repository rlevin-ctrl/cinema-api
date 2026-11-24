/**
 * Наскрізний smoke-тест API. Потрібен запущений застосунок і застосовані міграції:
 *
 *   npm run migration:run && npm run seed
 *   npm run start:dev          # в іншому терміналі
 *   npm run test:smoke
 *
 * Скрипт не робить припущень про вміст бази: назви фільмів і залів
 * унікальні для кожного запуску, тому його можна ганяти повторно.
 */
const BASE = process.env.BASE || 'http://127.0.0.1:3000';
const NIL = '00000000-0000-4000-8000-000000000000';
const RUN = Math.random().toString(36).slice(2, 7);

let pass = 0;
const failed = [];
const ok = (name, cond, extra = '') => {
  if (cond) {
    pass += 1;
    console.log('PASS ', name);
  } else {
    failed.push(name);
    console.log('FAIL ', name, typeof extra === 'string' ? extra : JSON.stringify(extra));
  }
};

const call = async (method, path, body) => {
  const res = await fetch(BASE + path, {
    method,
    headers: body ? { 'content-type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = text;
  }
  return { status: res.status, body: json };
};

const iso = (h) => new Date(Date.now() + h * 3600e3).toISOString();
const isUuid = (v) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v ?? '');

(async () => {
  // ---------------------------------------------------------------- фільми
  const film = await call('POST', '/films', {
    title: `Дюна ${RUN}`,
    durationMinutes: 166,
    releaseYear: 2024,
  });
  ok('POST /films → 201, id = UUID', film.status === 201 && isUuid(film.body.id), film);
  const FID = film.body.id;

  ok(
    'POST /films без поля → 400',
    (await call('POST', '/films', { title: 'X', durationMinutes: 10 })).status === 400,
  );
  ok(
    'POST /films неправильний тип → 400',
    (await call('POST', '/films', { title: 'X', durationMinutes: 'багато', releaseYear: 2020 }))
      .status === 400,
  );
  ok(
    'POST /films durationMinutes=0 → 400',
    (await call('POST', '/films', { title: 'X', durationMinutes: 0, releaseYear: 2020 }))
      .status === 400,
  );
  ok(
    'POST /films рік 1700 → 400',
    (await call('POST', '/films', { title: 'X', durationMinutes: 90, releaseYear: 1700 }))
      .status === 400,
  );

  const films = await call('GET', '/films');
  ok('GET /films → 200 масив', films.status === 200 && Array.isArray(films.body));
  ok(
    'GET /films/:id → 200',
    (await call('GET', `/films/${FID}`)).body.title === `Дюна ${RUN}`,
  );
  ok('GET /films/:uuid неіснуючий → 404', (await call('GET', `/films/${NIL}`)).status === 404);
  ok('GET /films/42 → 400 (ParseUUIDPipe)', (await call('GET', '/films/42')).status === 400);

  const patch = await call('PATCH', `/films/${FID}`, { releaseYear: 2021 });
  ok('PATCH /films/:id → 200', patch.body.releaseYear === 2021, patch.body);
  ok(
    'PATCH /films/:id неправильний тип → 400',
    (await call('PATCH', `/films/${FID}`, { durationMinutes: 'довго' })).status === 400,
  );
  ok(
    'PATCH /films/:uuid неіснуючий → 404',
    (await call('PATCH', `/films/${NIL}`, { releaseYear: 2021 })).status === 404,
  );

  // ----------------------------------------------------------------- зали
  const hall = await call('POST', '/halls', {
    name: `Червона зала ${RUN}`,
    rows: 3,
    seatsPerRow: 5,
  });
  ok('POST /halls → 201, id = UUID', hall.status === 201 && isUuid(hall.body.id), hall);
  const HID = hall.body.id;

  ok(
    'POST /halls дубль назви → 409',
    (await call('POST', '/halls', { name: `Червона зала ${RUN}`, rows: 2, seatsPerRow: 2 }))
      .status === 409,
  );
  ok(
    'POST /halls без поля → 400',
    (await call('POST', '/halls', { name: 'Без розмірів' })).status === 400,
  );
  ok(
    'POST /halls rows="три" → 400',
    (await call('POST', '/halls', { name: `Рядки ${RUN}`, rows: 'три', seatsPerRow: 5 }))
      .status === 400,
  );
  ok(
    'POST /halls rows=0 → 400',
    (await call('POST', '/halls', { name: `Нуль ${RUN}`, rows: 0, seatsPerRow: 5 }))
      .status === 400,
  );

  const hallOne = await call('GET', `/halls/${HID}`);
  ok('GET /halls/:id → 15 місць', hallOne.body.seats?.length === 15, hallOne.body);
  ok('GET /halls/:uuid неіснуючий → 404', (await call('GET', `/halls/${NIL}`)).status === 404);

  // --------------------------------------------------------------- сеанси
  const startsAt = iso(48);
  const showing = await call('POST', '/showings', {
    filmId: FID,
    hallId: HID,
    startsAt,
    price: 12500,
  });
  ok('POST /showings → 201', showing.status === 201 && isUuid(showing.body.id), showing);
  const SID = showing.body.id;

  ok(
    'POST /showings без поля → 400',
    (await call('POST', '/showings', { filmId: FID, hallId: HID, startsAt })).status === 400,
  );
  ok(
    'POST /showings неіснуючий фільм → 400',
    (await call('POST', '/showings', { filmId: NIL, hallId: HID, startsAt: iso(50), price: 100 }))
      .status === 400,
  );
  ok(
    'POST /showings неіснуючий зал → 400',
    (await call('POST', '/showings', { filmId: FID, hallId: NIL, startsAt: iso(50), price: 100 }))
      .status === 400,
  );
  ok(
    'POST /showings дата в минулому → 400',
    (
      await call('POST', '/showings', {
        filmId: FID,
        hallId: HID,
        startsAt: '2020-01-15T10:00:00.000Z',
        price: 100,
      })
    ).status === 400,
  );
  ok(
    'POST /showings 2027-02-30 → 400',
    (
      await call('POST', '/showings', {
        filmId: FID,
        hallId: HID,
        startsAt: '2027-02-30T10:00:00.000Z',
        price: 100,
      })
    ).status === 400,
  );
  ok(
    'POST /showings не-ISO дата → 400',
    (
      await call('POST', '/showings', {
        filmId: FID,
        hallId: HID,
        startsAt: '15.01.2027 18:30',
        price: 100,
      })
    ).status === 400,
  );
  ok(
    'POST /showings price=0 → 400',
    (await call('POST', '/showings', { filmId: FID, hallId: HID, startsAt: iso(60), price: 0 }))
      .status === 400,
  );

  const hall2 = await call('POST', '/halls', {
    name: `Синя зала ${RUN}`,
    rows: 2,
    seatsPerRow: 3,
  });
  const later = await call('POST', '/showings', {
    filmId: FID,
    hallId: hall2.body.id,
    startsAt: iso(72),
    price: 15000,
  });
  ok('POST /showings другий сеанс → 201', later.status === 201, later);

  // --------------------------------------- пагінація, фільтри, сортування
  const list = await call('GET', `/showings?filmId=${FID}`);
  ok(
    'GET /showings → items/total/page/limit',
    list.status === 200 &&
      Array.isArray(list.body.items) &&
      list.body.total === 2 &&
      list.body.page === 1 &&
      list.body.limit === 20,
    list.body,
  );
  ok(
    'GET /showings сортування за зростанням',
    list.body.items[0].startsAt < list.body.items[1].startsAt &&
      list.body.items[0].filmTitle === `Дюна ${RUN}` &&
      !('filmId' in list.body.items[0]),
    list.body.items,
  );

  const page1 = await call('GET', `/showings?filmId=${FID}&page=1&limit=1`);
  const page2 = await call('GET', `/showings?filmId=${FID}&page=2&limit=1`);
  ok(
    'пагінація: limit=1 дає по одному запису, сторінки різні',
    page1.body.items.length === 1 &&
      page2.body.items.length === 1 &&
      page1.body.items[0].id !== page2.body.items[0].id &&
      page1.body.total === 2,
    { page1: page1.body, page2: page2.body },
  );

  const desc = await call('GET', `/showings?filmId=${FID}&sort=desc`);
  ok(
    'sort=desc змінює порядок',
    desc.body.items[0].startsAt > desc.body.items[1].startsAt,
    desc.body.items,
  );

  ok(
    'GET /showings?hallId → 1',
    (await call('GET', `/showings?hallId=${HID}`)).body.items.length === 1,
  );
  ok(
    'GET /showings?date → є результати',
    (await call('GET', `/showings?date=${startsAt.slice(0, 10)}`)).body.total >= 1,
  );
  ok(
    'GET /showings?date=2027/01/15 → 400',
    (await call('GET', '/showings?date=2027/01/15')).status === 400,
  );
  ok(
    'GET /showings?date=2027-13-45 → 400',
    (await call('GET', '/showings?date=2027-13-45')).status === 400,
  );
  ok('GET /showings?filmId=42 → 400', (await call('GET', '/showings?filmId=42')).status === 400);
  ok('GET /showings?page=abc → 400', (await call('GET', '/showings?page=abc')).status === 400);
  ok('GET /showings?page=0 → 400', (await call('GET', '/showings?page=0')).status === 400);
  ok('GET /showings?limit=500 → 400', (await call('GET', '/showings?limit=500')).status === 400);
  ok('GET /showings?sort=up → 400', (await call('GET', '/showings?sort=up')).status === 400);

  ok(
    'GET /showings/:id → 200',
    (await call('GET', `/showings/${SID}`)).body.hallTitle === `Червона зала ${RUN}`,
  );
  ok('GET /showings/:uuid неіснуючий → 404', (await call('GET', `/showings/${NIL}`)).status === 404);

  const seats = await call('GET', `/showings/${SID}/seats`);
  ok(
    'GET /showings/:id/seats → 15 вільних',
    seats.body.length === 15 && seats.body.every((s) => !s.isBooked),
    seats.body,
  );
  ok(
    'GET /showings/:uuid/seats → 404',
    (await call('GET', `/showings/${NIL}/seats`)).status === 404,
  );

  // ---------------------------------------------------------- бронювання
  const booking = await call('POST', `/showings/${SID}/bookings`, {
    seats: [
      { row: 1, seat: 1 },
      { row: 1, seat: 2 },
    ],
  });
  ok(
    'POST bookings → 201, ціна 25000',
    booking.status === 201 && booking.body.totalPrice === 25000,
    booking,
  );
  const BID = booking.body.id;

  ok(
    'POST bookings порожній масив → 400',
    (await call('POST', `/showings/${SID}/bookings`, { seats: [] })).status === 400,
  );
  ok(
    'POST bookings місце без seat → 400',
    (await call('POST', `/showings/${SID}/bookings`, { seats: [{ row: 2 }] })).status === 400,
  );
  ok(
    'POST bookings повтор місця → 400',
    (
      await call('POST', `/showings/${SID}/bookings`, {
        seats: [
          { row: 2, seat: 1 },
          { row: 2, seat: 1 },
        ],
      })
    ).status === 400,
  );
  ok(
    'POST bookings місце поза залом → 400',
    (await call('POST', `/showings/${SID}/bookings`, { seats: [{ row: 9, seat: 1 }] }))
      .status === 400,
  );
  ok(
    'POST bookings row="перший" → 400',
    (await call('POST', `/showings/${SID}/bookings`, { seats: [{ row: 'перший', seat: 1 }] }))
      .status === 400,
  );
  ok(
    'POST bookings зайняте місце → 409',
    (
      await call('POST', `/showings/${SID}/bookings`, {
        seats: [
          { row: 1, seat: 2 },
          { row: 3, seat: 3 },
        ],
      })
    ).status === 409,
  );

  const afterConflict = await call('GET', `/showings/${SID}/bookings`);
  ok(
    'після 409 бронювання не створене (атомарність)',
    afterConflict.body.length === 1,
    afterConflict.body,
  );
  ok(
    'GET /showings/:id/seats → 2 зайняті',
    (await call('GET', `/showings/${SID}/seats`)).body.filter((s) => s.isBooked).length === 2,
  );
  ok(
    'GET /showings/:id/bookings → 200',
    (await call('GET', `/showings/${SID}/bookings`)).status === 200,
  );
  ok(
    'GET /showings/:uuid/bookings → 404',
    (await call('GET', `/showings/${NIL}/bookings`)).status === 404,
  );
  ok(
    'POST bookings неіснуючий сеанс → 404',
    (await call('POST', `/showings/${NIL}/bookings`, { seats: [{ row: 1, seat: 1 }] }))
      .status === 404,
  );

  // ------------------------------------------- конкурентне бронювання
  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      call('POST', `/showings/${SID}/bookings`, { seats: [{ row: 2, seat: 5 }] }),
    ),
  );
  const created = results.filter((r) => r.status === 201).length;
  const conflicts = results.filter((r) => r.status === 409).length;
  ok(
    '10 паралельних запитів на одне місце → 1 успіх і 9 конфліктів',
    created === 1 && conflicts === 9,
    { created, conflicts, statuses: results.map((r) => r.status) },
  );

  // ------------------------------------------------------------- видалення
  ok(
    'DELETE /films/:id із сеансами → 409',
    (await call('DELETE', `/films/${FID}`)).status === 409,
  );
  ok(
    'DELETE /halls/:id із сеансами → 409',
    (await call('DELETE', `/halls/${HID}`)).status === 409,
  );

  ok('DELETE /bookings/:id → 204', (await call('DELETE', `/bookings/${BID}`)).status === 204);
  ok(
    'після скасування залишилось лише конкурентне місце',
    (await call('GET', `/showings/${SID}/seats`)).body.filter((s) => s.isBooked).length === 1,
  );
  ok('DELETE /bookings/:uuid → 404', (await call('DELETE', `/bookings/${NIL}`)).status === 404);

  const freeFilm = await call('POST', '/films', {
    title: `Тимчасовий ${RUN}`,
    durationMinutes: 90,
    releaseYear: 2020,
  });
  ok(
    'DELETE /films/:id без сеансів → 204',
    (await call('DELETE', `/films/${freeFilm.body.id}`)).status === 204,
  );
  ok(
    'повторний DELETE /films/:id → 404',
    (await call('DELETE', `/films/${freeFilm.body.id}`)).status === 404,
  );

  const freeHall = await call('POST', '/halls', {
    name: `Тимчасова зала ${RUN}`,
    rows: 1,
    seatsPerRow: 2,
  });
  ok(
    'DELETE /halls/:id без сеансів → 204',
    (await call('DELETE', `/halls/${freeHall.body.id}`)).status === 204,
  );
  ok(
    'повторний DELETE /halls/:id → 404',
    (await call('DELETE', `/halls/${freeHall.body.id}`)).status === 404,
  );

  ok('GET /docs → 200', (await fetch(`${BASE}/docs`)).status === 200);

  console.log(`\n===== ${pass} PASS / ${failed.length} FAIL =====`);
  if (failed.length) console.log('FAILED:', failed.join('; '));
  process.exit(failed.length ? 1 : 0);
})().catch((e) => {
  console.error('TEST ERROR', e);
  process.exit(1);
});
