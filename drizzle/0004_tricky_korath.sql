ALTER TABLE "habits" DROP COLUMN "type";--> statement-breakpoint
ALTER TABLE "habits" DROP COLUMN "target_value";--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "val_numeric";--> statement-breakpoint
DROP TYPE "public"."habit_type";