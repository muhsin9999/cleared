ALTER TABLE "packets" ADD COLUMN "source" text DEFAULT 'template' NOT NULL;--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "model" text;--> statement-breakpoint
ALTER TABLE "packets" ADD COLUMN "trace" jsonb;