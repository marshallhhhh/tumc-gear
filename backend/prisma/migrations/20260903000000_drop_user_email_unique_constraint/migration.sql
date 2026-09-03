-- Replaced by the partial unique index `one_active_user_per_email` in
-- prisma/manual_indexes.sql, which scopes uniqueness to non-soft-deleted rows
-- so that deleting a user releases their email address for re-registration.
-- DropIndex
DROP INDEX IF EXISTS "User_email_key";
