CREATE TYPE "public"."dispute_status" AS ENUM('open', 'waiting_for_seller', 'under_review', 'resolved_seller', 'resolved_buyer', 'closed');--> statement-breakpoint
CREATE TYPE "public"."notice_verdict" AS ENUM('pending', 'likely_phishing', 'genuine', 'unsure');--> statement-breakpoint
CREATE TYPE "public"."packet_status" AS ENUM('gathering', 'drafting', 'checking', 'awaiting_approval', 'submitting', 'submitted', 'failed');--> statement-breakpoint
CREATE TYPE "public"."proof_kind" AS ENUM('file', 'acceptance', 'message', 'tracking');--> statement-breakpoint
CREATE TYPE "public"."sale_kind" AS ENUM('service', 'digital', 'physical');--> statement-breakpoint
CREATE TYPE "public"."sale_status" AS ENUM('draft', 'sent', 'paid', 'delivered', 'accepted', 'released', 'disputed', 'refunded');--> statement-breakpoint
CREATE TABLE "approvals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"subject_type" text NOT NULL,
	"subject_id" uuid NOT NULL,
	"summary" jsonb NOT NULL,
	"approved_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid,
	"kind" text NOT NULL,
	"subject_type" text,
	"subject_id" uuid,
	"model" text,
	"effort" text,
	"input_hash" text,
	"output" jsonb,
	"checker" jsonb,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disputes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid,
	"seller_id" uuid NOT NULL,
	"paypal_dispute_id" text NOT NULL,
	"reason" text NOT NULL,
	"stage" text,
	"status" "dispute_status" DEFAULT 'open' NOT NULL,
	"paypal_status" text,
	"amount_cents" integer NOT NULL,
	"buyer_note" text,
	"response_due_at" timestamp with time zone,
	"allowed_actions" jsonb,
	"raw" jsonb,
	"opened_at" timestamp with time zone DEFAULT now() NOT NULL,
	"resolved_at" timestamp with time zone,
	CONSTRAINT "disputes_paypal_dispute_id_unique" UNIQUE("paypal_dispute_id")
);
--> statement-breakpoint
CREATE TABLE "events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid,
	"sale_id" uuid,
	"source" text DEFAULT 'paypal' NOT NULL,
	"paypal_event_id" text,
	"type" text NOT NULL,
	"summary" text NOT NULL,
	"verified" boolean DEFAULT false NOT NULL,
	"simulated" boolean DEFAULT false NOT NULL,
	"payload" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"paypal_invoice_id" text,
	"invoice_number" text,
	"status" text DEFAULT 'DRAFT' NOT NULL,
	"draft" jsonb NOT NULL,
	"payer_view_url" text,
	"paypal_payment_id" text,
	"sent_at" timestamp with time zone,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "invoices_paypal_invoice_id_unique" UNIQUE("paypal_invoice_id")
);
--> statement-breakpoint
CREATE TABLE "notices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"source_text" text,
	"file_key" text,
	"in_resolution_center" text,
	"verdict" "notice_verdict" DEFAULT 'pending' NOT NULL,
	"result" jsonb,
	"done_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "packets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"dispute_id" uuid NOT NULL,
	"status" "packet_status" DEFAULT 'gathering' NOT NULL,
	"recommendation" text,
	"rationale" text,
	"claims" jsonb,
	"removed_claims" jsonb,
	"missing_evidence" jsonb,
	"cover_letter" text,
	"workflow_run_id" text,
	"error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"submitted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "proofs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sale_id" uuid NOT NULL,
	"kind" "proof_kind" NOT NULL,
	"label" text NOT NULL,
	"file_key" text,
	"file_name" text,
	"mime_type" text,
	"size_bytes" integer,
	"text" text,
	"meta" jsonb,
	"occurred_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sales" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"seller_id" uuid NOT NULL,
	"client_name" text NOT NULL,
	"client_email" text NOT NULL,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"kind" "sale_kind" NOT NULL,
	"amount_cents" integer NOT NULL,
	"currency" text DEFAULT 'USD' NOT NULL,
	"deposit_percent" integer,
	"delivery_due_at" timestamp with time zone,
	"status" "sale_status" DEFAULT 'draft' NOT NULL,
	"readiness_score" integer,
	"preflight" jsonb,
	"paypal_order_id" text,
	"paypal_capture_id" text,
	"paid_at" timestamp with time zone,
	"delivered_at" timestamp with time zone,
	"completed_marked_at" timestamp with time zone,
	"expected_release_at" timestamp with time zone,
	"released_at" timestamp with time zone,
	"acceptance_token" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sales_acceptance_token_unique" UNIQUE("acceptance_token")
);
--> statement-breakpoint
CREATE TABLE "sellers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tag" text NOT NULL,
	"name" text NOT NULL,
	"business_name" text,
	"email" text NOT NULL,
	"sells" "sale_kind" DEFAULT 'service' NOT NULL,
	"typical_price_cents" integer,
	"typical_delivery_days" integer,
	"takes_deposits" boolean DEFAULT false NOT NULL,
	"account_opened_at" timestamp with time zone,
	"is_demo" boolean DEFAULT true NOT NULL,
	"onboarded_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sellers_tag_unique" UNIQUE("tag")
);
--> statement-breakpoint
ALTER TABLE "approvals" ADD CONSTRAINT "approvals_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit" ADD CONSTRAINT "audit_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disputes" ADD CONSTRAINT "disputes_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "events" ADD CONSTRAINT "events_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notices" ADD CONSTRAINT "notices_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "packets" ADD CONSTRAINT "packets_dispute_id_disputes_id_fk" FOREIGN KEY ("dispute_id") REFERENCES "public"."disputes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proofs" ADD CONSTRAINT "proofs_sale_id_sales_id_fk" FOREIGN KEY ("sale_id") REFERENCES "public"."sales"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sales" ADD CONSTRAINT "sales_seller_id_sellers_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."sellers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_seller_idx" ON "audit" USING btree ("seller_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "events_paypal_event_idx" ON "events" USING btree ("paypal_event_id");--> statement-breakpoint
CREATE INDEX "events_seller_idx" ON "events" USING btree ("seller_id","occurred_at");--> statement-breakpoint
CREATE INDEX "proofs_sale_idx" ON "proofs" USING btree ("sale_id");--> statement-breakpoint
CREATE INDEX "sales_seller_idx" ON "sales" USING btree ("seller_id","created_at");