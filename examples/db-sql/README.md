[← Back to examples](../README.md)

# SQL database (Drizzle)

Reads users from a PostgreSQL database bound to the app as `main`, using
[Drizzle](https://orm.drizzle.team) over `fastedge::db/sql`. Same table, data and behaviour as the
Rust example
([`examples/http/wasi/db_sql`](https://github.com/G-Core/FastEdge-sdk-rust/tree/main/examples/http/wasi/db_sql)
in FastEdge-sdk-rust), so the two can be compared side by side.

| File                | Role                                                                                |
| ------------------- | ----------------------------------------------------------------------------------- |
| `src/schema.ts`     | The table: TypeScript types for queries, and the source of the migrations           |
| `drizzle/`          | SQL migrations: `0000_init` generated from `src/schema.ts`, `0001_seed` sample rows |
| `drizzle.config.ts` | `drizzle-kit` config, used on your machine / CI only                                |
| `src/db.ts`         | Drizzle `pg-proxy` driver over `SqlDatabase` (the whole glue)                       |
| `src/index.ts`      | The app                                                                             |

## Setup

1. Bind the database: add a secret `FASTEDGE_DB_SQL_main` with the Postgres connection string (e.g.
   a Neon pooled URL). The app never sees it; the host resolves `SqlDatabase.open('main')`.
2. Apply the migrations from your machine, with the same connection string:

```sh
npm install
DATABASE_URL='postgresql://…' npm run db:migrate
```

To change the schema: edit `src/schema.ts`, run `npm run db:generate` (writes a new file in
`drizzle/`), commit it, then `db:migrate` again. Migrations never run inside the app: every edge
node would race to apply them.

## Usage

```
GET /       → 200 [{"id":1,"email":"ann@example.com","nickname":null,"created":"…+00","meta":{"plan":"pro"}}, …]
GET /?id=2  → 200 {"id":2,"email":"bob@example.com","nickname":"bobby","created":"…+00","meta":{"plan":"free"}}
GET /?id=9  → 404 {"error":"not found"}
```

## Error responses

| Condition                   | Status | Body                                                                   |
| --------------------------- | ------ | ---------------------------------------------------------------------- |
| No database bound to `main` | 500    | `{"error":"no such database"}`                                         |
| Migrations not applied      | 500    | `{"error":"relation \"example_users\" does not exist","code":"42P01"}` |

## Notes

- Tested with `drizzle-orm` 0.44.7 and `drizzle-kit` 0.31.
- `db.transaction()` is not supported (each query is a separate request to the database). For atomic
  multi-statement work use `SqlDatabase.batch([{ sql, params }, …])`, which runs in one transaction.
- Database errors arrive as `SqlError` (Drizzle's `error.cause`) with `kind` and the PostgreSQL
  SQLSTATE in `code`.
- `@neondatabase/serverless` is a dev dependency for `drizzle-kit migrate` only; it is not bundled
  into the app.

## Build

```sh
npm run build
# Output: dist/db-sql.wasm
```
