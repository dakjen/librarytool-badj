CREATE TABLE "consumer_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"organization_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"status" text NOT NULL,
	"current_period_end" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "consumer_subscriptions_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id")
);
--> statement-breakpoint
CREATE TABLE "prices" (
	"id" text PRIMARY KEY NOT NULL,
	"product_id" text NOT NULL,
	"currency" text NOT NULL,
	"unit_amount" integer NOT NULL,
	"interval" text NOT NULL,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "products" (
	"id" text PRIMARY KEY NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_account_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "stripe_account_enabled" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "consumer_subscriptions" ADD CONSTRAINT "consumer_subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consumer_subscriptions" ADD CONSTRAINT "consumer_subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "prices" ADD CONSTRAINT "prices_product_id_products_id_fk" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "products" ADD CONSTRAINT "products_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;