// Cleared data model. Money is stored as integer cents; PayPal ids are kept as text.
import { relations } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

const id = () => uuid("id").primaryKey().defaultRandom();
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();

export const saleKind = pgEnum("sale_kind", ["service", "digital", "physical"]);
export const saleStatus = pgEnum("sale_status", ["draft", "sent", "paid", "delivered", "accepted", "released", "disputed", "refunded"]);
export const proofKind = pgEnum("proof_kind", ["file", "acceptance", "message", "tracking"]);
export const disputeStatus = pgEnum("dispute_status", ["open", "waiting_for_seller", "under_review", "resolved_seller", "resolved_buyer", "closed"]);
export const packetStatus = pgEnum("packet_status", ["gathering", "drafting", "checking", "awaiting_approval", "submitting", "submitted", "failed"]);
export const noticeVerdict = pgEnum("notice_verdict", ["pending", "likely_phishing", "genuine", "unsure"]);

// A workspace is one seller. Demo workspaces share one sandbox business account and are told apart by `tag`.
export const sellers = pgTable("sellers", {
  id: id(),
  tag: text("tag").notNull().unique(),
  name: text("name").notNull(),
  businessName: text("business_name"),
  email: text("email").notNull(),
  sells: saleKind("sells").notNull().default("service"),
  typicalPriceCents: integer("typical_price_cents"),
  typicalDeliveryDays: integer("typical_delivery_days"),
  takesDeposits: boolean("takes_deposits").notNull().default(false),
  accountOpenedAt: timestamp("account_opened_at", { withTimezone: true }),
  isDemo: boolean("is_demo").notNull().default(true),
  onboardedAt: timestamp("onboarded_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const sales = pgTable(
  "sales",
  {
    id: id(),
    sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
    clientName: text("client_name").notNull(),
    clientEmail: text("client_email").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    kind: saleKind("kind").notNull(),
    amountCents: integer("amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    depositPercent: integer("deposit_percent"),
    deliveryDueAt: timestamp("delivery_due_at", { withTimezone: true }),
    status: saleStatus("status").notNull().default("draft"),
    readinessScore: integer("readiness_score"),
    preflight: jsonb("preflight"),
    paypalOrderId: text("paypal_order_id"),
    paypalCaptureId: text("paypal_capture_id"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    completedMarkedAt: timestamp("completed_marked_at", { withTimezone: true }),
    expectedReleaseAt: timestamp("expected_release_at", { withTimezone: true }),
    releasedAt: timestamp("released_at", { withTimezone: true }),
    acceptanceToken: text("acceptance_token").unique(),
    createdAt: createdAt(),
  },
  (t) => [index("sales_seller_idx").on(t.sellerId, t.createdAt)],
);

export const invoices = pgTable("invoices", {
  id: id(),
  saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
  paypalInvoiceId: text("paypal_invoice_id").unique(),
  invoiceNumber: text("invoice_number"),
  status: text("status").notNull().default("DRAFT"),
  draft: jsonb("draft").notNull(),
  payerViewUrl: text("payer_view_url"),
  paypalPaymentId: text("paypal_payment_id"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// Everything in a sale's proof locker: delivered files, the client's acceptance, agreed-scope messages, tracking.
export const proofs = pgTable(
  "proofs",
  {
    id: id(),
    saleId: uuid("sale_id").notNull().references(() => sales.id, { onDelete: "cascade" }),
    kind: proofKind("kind").notNull(),
    label: text("label").notNull(),
    fileKey: text("file_key"),
    fileName: text("file_name"),
    mimeType: text("mime_type"),
    sizeBytes: integer("size_bytes"),
    text: text("text"),
    meta: jsonb("meta"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    createdAt: createdAt(),
  },
  (t) => [index("proofs_sale_idx").on(t.saleId)],
);

// Verified PayPal webhooks plus Cleared's own events, shown on the live timeline.
export const events = pgTable(
  "events",
  {
    id: id(),
    sellerId: uuid("seller_id").references(() => sellers.id, { onDelete: "cascade" }),
    saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
    source: text("source").notNull().default("paypal"),
    paypalEventId: text("paypal_event_id"),
    type: text("type").notNull(),
    summary: text("summary").notNull(),
    verified: boolean("verified").notNull().default(false),
    simulated: boolean("simulated").notNull().default(false),
    payload: jsonb("payload"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("events_paypal_event_idx").on(t.paypalEventId), index("events_seller_idx").on(t.sellerId, t.occurredAt)],
);

// Every webhook delivery, accepted or not, for the Settings > Webhook health panel.
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    id: id(),
    paypalEventId: text("paypal_event_id"),
    type: text("type"),
    verification: text("verification").notNull(),
    outcome: text("outcome").notNull(),
    error: text("error"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("webhook_deliveries_received_idx").on(t.receivedAt)],
);

// Real sandbox disputes opened by the sandbox buyer ahead of time. "Simulate a buyer dispute" claims one per
// demo workspace, because PayPal's dispute-create API needs a scope only PayPal can grant (docs/PAYPAL.md §7b).
export const disputePool = pgTable("dispute_pool", {
  id: id(),
  paypalDisputeId: text("paypal_dispute_id").notNull().unique(),
  transactionId: text("transaction_id").notNull(),
  amountCents: integer("amount_cents").notNull(),
  status: text("status").notNull().default("available"),
  claimedBySeller: uuid("claimed_by_seller"),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const disputes = pgTable("disputes", {
  id: id(),
  saleId: uuid("sale_id").references(() => sales.id, { onDelete: "set null" }),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  paypalDisputeId: text("paypal_dispute_id").notNull().unique(),
  reason: text("reason").notNull(),
  stage: text("stage"),
  status: disputeStatus("status").notNull().default("open"),
  paypalStatus: text("paypal_status"),
  amountCents: integer("amount_cents").notNull(),
  buyerNote: text("buyer_note"),
  responseDueAt: timestamp("response_due_at", { withTimezone: true }),
  allowedActions: jsonb("allowed_actions").$type<string[]>(),
  raw: jsonb("raw"),
  openedAt: timestamp("opened_at", { withTimezone: true }).notNull().defaultNow(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});

export const packets = pgTable("packets", {
  id: id(),
  disputeId: uuid("dispute_id").notNull().references(() => disputes.id, { onDelete: "cascade" }),
  status: packetStatus("status").notNull().default("gathering"),
  recommendation: text("recommendation"),
  rationale: text("rationale"),
  claims: jsonb("claims"),
  removedClaims: jsonb("removed_claims"),
  missingEvidence: jsonb("missing_evidence"),
  // Instructions the agent found in the buyer's message or an exhibit and refused to follow.
  ignoredInstructions: jsonb("ignored_instructions").$type<string[]>(),
  coverLetter: text("cover_letter"),
  workflowRunId: text("workflow_run_id"),
  // "ai" (the investigator agent) or "template" (built from the locker when the AI is unavailable).
  source: text("source").notNull().default("template"),
  model: text("model"),
  // The agent's steps, shown live in the case room: [{ tool, label, at }].
  trace: jsonb("trace").$type<{ tool: string; label: string; at: string; turn?: number; detail?: string; ref?: string }[]>(),
  error: text("error"),
  createdAt: createdAt(),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
});

// Nothing is sent to PayPal without a row here, signed by the seller's session.
export const approvals = pgTable("approvals", {
  id: id(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  subjectType: text("subject_type").notNull(),
  subjectId: uuid("subject_id").notNull(),
  summary: jsonb("summary").notNull(),
  approvedAt: timestamp("approved_at", { withTimezone: true }).notNull().defaultNow(),
});

// Limitation / hold emails pasted or uploaded by the seller (no PayPal API exists for these).
export const notices = pgTable("notices", {
  id: id(),
  sellerId: uuid("seller_id").notNull().references(() => sellers.id, { onDelete: "cascade" }),
  sourceText: text("source_text"),
  fileKey: text("file_key"),
  inResolutionCenter: text("in_resolution_center"),
  verdict: noticeVerdict("verdict").notNull().default("pending"),
  result: jsonb("result"),
  doneAt: timestamp("done_at", { withTimezone: true }),
  createdAt: createdAt(),
});

// Every AI call and every outbound PayPal write, for the "why did Cleared say this?" view.
export const audit = pgTable(
  "audit",
  {
    id: id(),
    sellerId: uuid("seller_id").references(() => sellers.id, { onDelete: "cascade" }),
    kind: text("kind").notNull(),
    subjectType: text("subject_type"),
    subjectId: uuid("subject_id"),
    model: text("model"),
    effort: text("effort"),
    inputHash: text("input_hash"),
    output: jsonb("output"),
    checker: jsonb("checker"),
    approvedBy: uuid("approved_by"),
    createdAt: createdAt(),
  },
  (t) => [index("audit_seller_idx").on(t.sellerId, t.createdAt)],
);

export const sellersRelations = relations(sellers, ({ many }) => ({ sales: many(sales), disputes: many(disputes), notices: many(notices) }));
export const salesRelations = relations(sales, ({ one, many }) => ({
  seller: one(sellers, { fields: [sales.sellerId], references: [sellers.id] }),
  invoices: many(invoices),
  proofs: many(proofs),
  events: many(events),
  disputes: many(disputes),
}));
export const invoicesRelations = relations(invoices, ({ one }) => ({ sale: one(sales, { fields: [invoices.saleId], references: [sales.id] }) }));
export const proofsRelations = relations(proofs, ({ one }) => ({ sale: one(sales, { fields: [proofs.saleId], references: [sales.id] }) }));
export const eventsRelations = relations(events, ({ one }) => ({ sale: one(sales, { fields: [events.saleId], references: [sales.id] }) }));
export const disputesRelations = relations(disputes, ({ one, many }) => ({
  sale: one(sales, { fields: [disputes.saleId], references: [sales.id] }),
  seller: one(sellers, { fields: [disputes.sellerId], references: [sellers.id] }),
  packets: many(packets),
}));
export const packetsRelations = relations(packets, ({ one }) => ({ dispute: one(disputes, { fields: [packets.disputeId], references: [disputes.id] }) }));
export const noticesRelations = relations(notices, ({ one }) => ({ seller: one(sellers, { fields: [notices.sellerId], references: [sellers.id] }) }));
