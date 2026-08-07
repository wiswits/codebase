# Database Migrations

This directory contains database migrations using node-pg-migrate.

## Running Migrations

```bash
# Run all pending migrations
pnpm db:migrate

# Create a new migration
pnpm db:migrate:create migration-name

# Rollback last migration
pnpm db:migrate:down