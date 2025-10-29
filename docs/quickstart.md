# Quickstart

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure environment variables by copying `.env.example` to `.env` and filling in secrets.
3. Start local infrastructure (Postgres, Redis, MinIO) via your preferred tooling (e.g. `docker compose`). Ensure PostGIS is enabled.
4. Run database migrations:
   ```bash
   npx prisma migrate deploy
   ```
5. Seed demo data:
   ```bash
   npm run db:seed
   ```
6. Launch the app:
   ```bash
   npm run dev
   ```
7. Visit `http://localhost:3000/(marketing)/pricing` to explore plans, then `/app/projects` for the dashboard and `/app/projects/{id}` for the editor.

## Rollback migrations
To rollback the initial migration, execute:
```bash
npx prisma migrate resolve --rolled-back "0001_init"
```
Then drop the generated tables manually if necessary.
