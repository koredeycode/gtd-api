ALTER TABLE "categories" DROP CONSTRAINT "categories_user_id_users_id_fk";
--> statement-breakpoint
DROP INDEX "categories_user_id_idx";--> statement-breakpoint
ALTER TABLE "categories" DROP COLUMN "user_id";--> statement-breakpoint
ALTER TABLE "categories" ADD CONSTRAINT "categories_name_unique" UNIQUE("name");