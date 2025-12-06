ALTER TABLE "logs" ADD COLUMN "text" text;--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN "value" boolean;--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "val_text";--> statement-breakpoint
ALTER TABLE "logs" DROP COLUMN "val_bool";