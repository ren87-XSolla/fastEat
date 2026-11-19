# FastEat

Демо-витрина для уценённых завтраков из кафе района Бастилия в Париже. В витрине три вымышленных кафе. Бронь в демо списывает одну порцию и не требует оплаты.

- `apps/web` — React, Vite и Apollo Client. В локальном режиме Vite проксирует `/graphql` на API.
- `apps/api` — NestJS, Apollo Server, Prisma ORM и PostgreSQL.
- Kafka получает событие `fasteat.reservations.created` с ID брони, ID предложения, ценой в евроцентах и временем создания.

## Локальный запуск

Нужны Node.js 22.12+ или 24 LTS и Docker Compose v2.

```sh
npm ci
cp apps/api/.env.example apps/api/.env
docker compose up -d --wait
npm run db:setup
npm run dev
```

Витрина доступна на [127.0.0.1:5173](http://127.0.0.1:5173). GraphQL API работает на [127.0.0.1:4000/graphql](http://127.0.0.1:4000/graphql). Команда `db:setup` применяет миграции и добавляет демоданные. Повторный запуск сохраняет брони и остатки.

```sh
curl -s http://127.0.0.1:4000/graphql -H 'Content-Type: application/json' \
  --data '{"query":"{ offersList { id title priceCents remaining } }"}'
docker compose exec kafka /opt/kafka/bin/kafka-console-consumer.sh \
  --bootstrap-server localhost:9092 --topic fasteat.reservations.created --from-beginning
```

Сборка обоих приложений — `npm run build`. Для остановки используйте Ctrl+C в процессе `npm run dev` и `docker compose down`.

## Бронирование и доставка

NestJS записывает бронь и списывает порцию в одной транзакции. Публикация в Kafka идёт после записи. Если брокер недоступен, API сохраняет бронь и пишет ошибку публикации в лог. Гарантированная доставка событий потребует transactional outbox.

Вызова Uber пока нет. Для заказа на витрине FastEat и вызова курьера подходит [Uber Direct](https://developer.uber.com/docs/deliveries/overview). Управление предложениями и заказами внутри приложения Uber Eats относится к [Uber Eats Marketplace API](https://developer.uber.com/docs/eats/introduction).
