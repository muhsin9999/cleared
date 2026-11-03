ALTER TABLE "assistant_messages" ADD COLUMN "thread" uuid;--> statement-breakpoint
CREATE INDEX "assistant_messages_thread_idx" ON "assistant_messages" USING btree ("seller_id","thread","created_at");