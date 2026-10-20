CREATE TABLE "dispute_pool" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"paypal_dispute_id" text NOT NULL,
	"transaction_id" text NOT NULL,
	"amount_cents" integer NOT NULL,
	"status" text DEFAULT 'available' NOT NULL,
	"claimed_by_seller" uuid,
	"claimed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dispute_pool_paypal_dispute_id_unique" UNIQUE("paypal_dispute_id")
);
