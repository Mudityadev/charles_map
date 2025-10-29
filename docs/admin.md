# Admin operations

## Billing
- Stripe webhook handled at `/api/billing/webhook` updates `Subscription` records.
- Seat counts stored on `Org.seats`; adjust via `/api/org` PATCH.
- Usage metering tracked in `UsageMeter` table; export for invoicing monthly.

## Feature flags
- Use Unleash to toggle beta functionality. In absence of remote server, populate `Org.featureFlags` JSON with `{ "enabled": ["flag-key"] }`.
- Tier defaults live in `lib/flags/server.ts` and should not be edited per org.

## Compliance & audit
- `AuditLog` stores admin-sensitive actions. Enterprise plan requires retention; use database policies to prevent deletion.
- For legal hold, freeze Org by setting `featureFlags.locked = true` and blocking mutations in middleware (TBD).

## Backups
- Schedule nightly `pg_dump` and `aws s3 sync` for the S3 bucket.
- Review `/docs/quickstart.md` for rollback instructions before applying migrations.
