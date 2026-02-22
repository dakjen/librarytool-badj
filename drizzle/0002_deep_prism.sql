ALTER TABLE "items" ADD COLUMN "is_favorite" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "items" ADD COLUMN "order_index" integer DEFAULT 0;