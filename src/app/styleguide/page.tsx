import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BadgeCheck, CircleCheck, Inbox, OctagonAlert, Send, TriangleAlert, Upload } from "lucide-react";
import { EventRow } from "@/components/brand/event-row";
import { FindingRow } from "@/components/brand/finding-row";
import { Logo, StampMark } from "@/components/brand/logo";
import { SaleStatusBadge, type SaleStatus } from "@/components/brand/status-badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty";
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { RingDemo } from "./ring-demo";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false } };

const COLORS = [
  { name: "paper", hex: "#F7F6F2", use: "App background", className: "bg-paper" },
  { name: "surface", hex: "#FFFFFF", use: "Cards, documents", className: "bg-surface" },
  { name: "ink", hex: "#0B1215", use: "Text", className: "bg-ink" },
  { name: "ink-muted", hex: "#5B6470", use: "Secondary text (5.6:1 on paper)", className: "bg-muted-foreground" },
  { name: "line", hex: "#E4E2DC", use: "Borders, dividers", className: "bg-line" },
  { name: "cleared", hex: "#0F7B5F", use: "Primary: safe, done, approve", className: "bg-cleared" },
  { name: "cleared-strong", hex: "#0B5E48", use: "Text on tint, hover", className: "bg-cleared-strong" },
  { name: "cleared-tint", hex: "#E3F2EC", use: "Success backgrounds", className: "bg-cleared-tint" },
  { name: "caution", hex: "#B45309", use: "Warnings, pending holds", className: "bg-caution" },
  { name: "caution-tint", hex: "#FDF1E3", use: "Warning backgrounds", className: "bg-caution-tint" },
  { name: "risk", hex: "#B42318", use: "Risk findings, phishing", className: "bg-risk" },
  { name: "risk-tint", hex: "#FBEAE8", use: "Risk backgrounds", className: "bg-risk-tint" },
  { name: "focus", hex: "#2F6FED", use: "Focus ring only", className: "bg-[var(--focus)]" },
];

const TYPE = [
  { name: "Display", spec: "Geist 600 · 64/1.02 · −0.04em", className: "text-6xl leading-[1.02] font-semibold tracking-[-0.04em]", sample: "Get paid, and stay paid." },
  { name: "H1", spec: "Geist 600 · 36/1.15 · −0.03em", className: "text-4xl font-semibold tracking-[-0.03em]", sample: "Account health" },
  { name: "H2", spec: "Geist 600 · 24/1.25 · −0.02em", className: "text-2xl font-semibold tracking-[-0.02em]", sample: "Proof locker" },
  { name: "H3", spec: "Geist 600 · 17/1.35 · −0.015em", className: "text-[1.05rem] font-semibold tracking-[-0.015em]", sample: "Album cover: “Harmattan Tapes”" },
  { name: "Body", spec: "Geist 400 · 16/1.6", className: "text-base leading-relaxed", sample: "Your $400 is on hold for 7 more days. Adding tracking usually speeds this up." },
  { name: "Small", spec: "Geist 400 · 14/1.5 · muted", className: "text-sm text-muted-foreground", sample: "Drafted by Cleared AI · check before sending" },
  { name: "Mono", spec: "Geist Mono 500 · 12 · event names, ids", className: "font-mono text-xs font-medium", sample: "CUSTOMER.DISPUTE.RESOLVED · INV2-SEED-COVR-0007" },
  { name: "Figure", spec: "Geist 600 · tabular-nums", className: "text-3xl font-semibold tracking-[-0.03em] tabular-nums", sample: "$1,250.00" },
];

const STATUSES: SaleStatus[] = ["draft", "sent", "paid", "delivered", "accepted", "released", "disputed"];
const VARIANTS = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;
const SIZES = ["xs", "sm", "default", "lg"] as const;
const KINDS = [
  { value: "service", label: "A service (design, writing, lessons)" },
  { value: "digital", label: "Digital files (artwork, templates)" },
  { value: "physical", label: "Physical goods (shipped)" },
];

const NAV = [
  ["colour", "Colour"],
  ["type", "Type"],
  ["buttons", "Buttons"],
  ["status", "Status"],
  ["forms", "Forms"],
  ["surfaces", "Surfaces"],
  ["data", "Data & overlays"],
  ["brand", "Brand pieces"],
] as const;

function Section({ id, title, note, children }: { id: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-8 border-t border-line py-12 first:border-t-0 first:pt-0">
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h2 id={`${id}-title`} className="text-2xl font-semibold tracking-[-0.02em] text-ink">
          {title}
        </h2>
        {note ? <p className="text-sm text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 font-mono text-[0.68rem] font-medium tracking-[0.08em] text-muted-foreground uppercase">{children}</p>;
}

export default function StyleguidePage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" className="-m-1 rounded-md p-1" aria-label="cleared, home">
            <Logo />
          </Link>
          <span className="font-mono text-xs text-muted-foreground">Ledger · styleguide</span>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[11rem_1fr]">
        <nav aria-label="Styleguide sections" className="lg:sticky lg:top-8 lg:self-start">
          <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm lg:flex-col lg:border-l lg:border-line">
            {NAV.map(([id, label]) => (
              <li key={id}>
                <a href={`#${id}`} className="block rounded-sm py-1 text-muted-foreground hover:text-ink lg:-ml-px lg:border-l lg:border-transparent lg:pl-4 lg:hover:border-ink">
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <main className="min-w-0">
          <div className="mb-12 max-w-2xl">
            <h1 className="text-4xl font-semibold tracking-[-0.03em] text-ink">Ledger</h1>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">
              Every element Cleared ships, in its brand form. Calm like a bank statement, precise like a notary: warm paper, one green that
              means “safe”, and motion that settles rather than bounces.
            </p>
          </div>

          <Section id="colour" title="Colour" note="Tokens in globals.css. No PayPal blue or gold.">
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
              {COLORS.map((c) => (
                <li key={c.name} className="overflow-hidden rounded-[10px] border border-line bg-surface">
                  <div className={`h-16 border-b border-line ${c.className}`} />
                  <div className="space-y-0.5 p-3">
                    <p className="text-sm font-medium text-ink">--{c.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{c.hex}</p>
                    <p className="text-xs leading-snug text-muted-foreground">{c.use}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="type" title="Type" note="Geist + Geist Mono. Instrument Serif for one landing word only.">
            <div className="divide-y divide-line rounded-[10px] border border-line bg-surface">
              {TYPE.map((t) => (
                <div key={t.name} className="grid gap-2 p-5 md:grid-cols-[10rem_1fr] md:items-baseline md:gap-6">
                  <div>
                    <p className="text-sm font-medium text-ink">{t.name}</p>
                    <p className="font-mono text-[0.68rem] text-muted-foreground">{t.spec}</p>
                  </div>
                  <p className={`min-w-0 text-ink ${t.className}`}>{t.sample}</p>
                </div>
              ))}
            </div>
          </Section>

          <Section id="buttons" title="Buttons" note="Money and approval buttons say exactly what happens. Nothing moves on them.">
            <div className="space-y-8">
              <div>
                <Label>Variants</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {VARIANTS.map((v) => (
                    <Button key={v} variant={v}>
                      {v === "default" ? "Primary" : v[0].toUpperCase() + v.slice(1)}
                    </Button>
                  ))}
                  <Button disabled>Disabled</Button>
                </div>
              </div>
              <div>
                <Label>Sizes</Label>
                <div className="flex flex-wrap items-center gap-3">
                  {SIZES.map((s) => (
                    <Button key={s} size={s} variant="outline">
                      Size {s}
                    </Button>
                  ))}
                  <Button size="icon" variant="outline" aria-label="Upload a file">
                    <Upload />
                  </Button>
                </div>
              </div>
              <div>
                <Label>Money action</Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button className="h-11 gap-2 px-5 text-[0.95rem] hover:bg-cleared-strong">
                    <Send aria-hidden />
                    Send invoice to studio@northwind.example via PayPal
                  </Button>
                  <Button variant="outline" className="h-11 px-5 text-[0.95rem]">
                    Review the invoice first
                  </Button>
                </div>
              </div>
            </div>
          </Section>

          <Section id="status" title="Sale status" note="Icon plus word, never colour alone.">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((s) => (
                <SaleStatusBadge key={s} status={s} />
              ))}
            </div>
          </Section>

          <Section id="forms" title="Forms" note="6px inputs, labels above, help text below.">
            <div className="grid gap-8 rounded-[10px] border border-line bg-surface p-6 md:grid-cols-2">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="sg-client">Client email</FieldLabel>
                  <Input id="sg-client" type="email" placeholder="studio@northwind.example" />
                  <FieldDescription>PayPal sends the invoice here.</FieldDescription>
                </Field>
                <Field data-invalid>
                  <FieldLabel htmlFor="sg-amount">Amount (USD)</FieldLabel>
                  <Input id="sg-amount" inputMode="decimal" defaultValue="0" aria-invalid aria-describedby="sg-amount-error" />
                  <FieldError id="sg-amount-error">Enter an amount above $1.</FieldError>
                </Field>
              </FieldGroup>
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="sg-kind">What are you selling?</FieldLabel>
                  <Select items={KINDS} defaultValue="digital">
                    <SelectTrigger id="sg-kind" className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {KINDS.map((k) => (
                        <SelectItem key={k.value} value={k.value}>
                          {k.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field>
                  <FieldLabel htmlFor="sg-desc">What are you delivering?</FieldLabel>
                  <Textarea id="sg-desc" defaultValue="Six brand illustrations, delivered as PNG and layered source, two revision rounds." />
                </Field>
              </FieldGroup>
            </div>
          </Section>

          <Section id="surfaces" title="Surfaces & feedback">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Funds in flight</CardTitle>
                  <CardDescription>Paid, not yet released</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-semibold tracking-[-0.03em] text-ink tabular-nums">$650.00</p>
                  <p className="mt-1 text-sm text-muted-foreground">$250 releases in 6 days</p>
                </CardContent>
                <CardFooter className="border-t border-line bg-paper/60 py-3">
                  <Button variant="link" className="h-auto gap-1 px-0">
                    See the hold coach
                    <ArrowRight aria-hidden />
                  </Button>
                </CardFooter>
              </Card>

              <div className="space-y-3">
                <Alert variant="cleared">
                  <CircleCheck aria-hidden />
                  <AlertTitle>Proof complete</AlertTitle>
                  <AlertDescription>Files, acceptance and invoice are in the locker.</AlertDescription>
                </Alert>
                <Alert variant="caution">
                  <TriangleAlert aria-hidden />
                  <AlertTitle>$400 is on hold for 7 more days</AlertTitle>
                  <AlertDescription>Marking the service completed in PayPal usually starts the release.</AlertDescription>
                </Alert>
                <Alert variant="risk">
                  <OctagonAlert aria-hidden />
                  <AlertTitle>This email is likely phishing</AlertTitle>
                  <AlertDescription>The sender isn&apos;t paypal.com and the link points elsewhere. Don&apos;t log in from it.</AlertDescription>
                </Alert>
              </div>

              <div className="rounded-[10px] border border-dashed border-line bg-surface">
                <Empty>
                  <EmptyHeader>
                    <EmptyMedia variant="icon">
                      <Inbox />
                    </EmptyMedia>
                    <EmptyTitle>No open cases</EmptyTitle>
                    <EmptyDescription>Your proof coverage is 92%. If PayPal emails you, paste it here first.</EmptyDescription>
                  </EmptyHeader>
                  <EmptyContent>
                    <Button variant="outline">I got a PayPal email</Button>
                  </EmptyContent>
                </Empty>
              </div>

              <div className="space-y-4 rounded-[10px] border border-line bg-surface p-6" aria-label="Loading example">
                <Label>Skeleton</Label>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
                <Skeleton className="h-24 w-full" />
              </div>
            </div>
          </Section>

          <Section id="data" title="Data & overlays">
            <div className="space-y-8">
              <div className="overflow-hidden rounded-[10px] border border-line bg-surface">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="pl-4">Client</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="hidden pr-4 text-right sm:table-cell">Release</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[
                      { client: "Lagos Lo-Fi Records", status: "accepted" as const, amount: "$250.00", release: "in 6 days" },
                      { client: "Kestrel Press", status: "sent" as const, amount: "$150.00", release: "—" },
                      { client: "Northwind Studio", status: "disputed" as const, amount: "$400.00", release: "On hold" },
                    ].map((r) => (
                      <TableRow key={r.client}>
                        <TableCell className="pl-4 font-medium">{r.client}</TableCell>
                        <TableCell>
                          <SaleStatusBadge status={r.status} />
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{r.amount}</TableCell>
                        <TableCell className="hidden pr-4 text-right text-muted-foreground sm:table-cell">{r.release}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Tabs defaultValue="locker">
                  <TabsList>
                    <TabsTrigger value="locker">Proof locker</TabsTrigger>
                    <TabsTrigger value="hold">Hold coach</TabsTrigger>
                    <TabsTrigger value="activity">Activity</TabsTrigger>
                  </TabsList>
                  <TabsContent value="locker" className="mt-3 rounded-[10px] border border-line bg-surface p-4 text-sm text-muted-foreground">
                    4 items: final files, client acceptance, agreed scope, invoice.
                  </TabsContent>
                  <TabsContent value="hold" className="mt-3 rounded-[10px] border border-line bg-surface p-4 text-sm text-muted-foreground">
                    Expected release in 6 days. Next step: nothing, you&apos;re done.
                  </TabsContent>
                  <TabsContent value="activity" className="mt-3 rounded-[10px] border border-line bg-surface p-4 text-sm text-muted-foreground">
                    3 verified PayPal events this week.
                  </TabsContent>
                </Tabs>

                <div className="flex items-start">
                  <Dialog>
                    <DialogTrigger render={<Button className="hover:bg-cleared-strong" />}>Approve &amp; submit to PayPal…</DialogTrigger>
                    <DialogContent className="rounded-[10px] shadow-soft sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Send this packet to PayPal?</DialogTitle>
                        <DialogDescription>PayPal will receive exactly this. You can&apos;t edit it after sending.</DialogDescription>
                      </DialogHeader>
                      <ul className="space-y-2 text-sm">
                        {["3 files (final cover, sketch, layered source)", "Client acceptance record, Oct 18 18:02 UTC", "Cover note, 142 words"].map((x) => (
                          <li key={x} className="flex items-start gap-2">
                            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-cleared" aria-hidden />
                            {x}
                          </li>
                        ))}
                      </ul>
                      <DialogFooter className="rounded-b-[10px]">
                        <DialogClose render={<Button variant="outline" />}>Keep editing</DialogClose>
                        <DialogClose render={<Button className="hover:bg-cleared-strong" />}>Approve &amp; submit</DialogClose>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </div>
          </Section>

          <Section id="brand" title="Brand pieces">
            <div className="space-y-10">
              <div>
                <Label>Findings</Label>
                <div className="divide-y divide-line rounded-[10px] border border-line bg-surface">
                  <FindingRow
                    severity="risk"
                    title="First sale over 3× your average"
                    detail="PayPal names sudden jumps on young accounts as higher-risk activity."
                    action={<Button size="sm" variant="outline">Add a note</Button>}
                  />
                  <FindingRow severity="caution" title="Delivery date missing" detail="Add one so the hold can be released on time." action={<Button size="sm" variant="outline">Add date</Button>} />
                  <FindingRow severity="info" title="Deposits are allowed" detail="Say what the deposit covers in the invoice." />
                </div>
              </div>

              <div>
                <Label>Readiness ring</Label>
                <div className="rounded-[10px] border border-line bg-surface p-6">
                  <RingDemo />
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <Label>Stamp mark</Label>
                  <div className="flex items-end gap-6 rounded-[10px] border border-line bg-surface p-6 text-cleared">
                    <StampMark className="size-4" />
                    <StampMark className="size-6" />
                    <StampMark className="size-10" />
                    <StampMark className="size-16" />
                    <StampMark className="size-24 rotate-[-12deg]" title="Sealed by cleared" />
                    <StampMark className="size-10 text-ink" />
                  </div>
                </div>
                <div>
                  <Label>Logo set</Label>
                  <div className="grid gap-px overflow-hidden rounded-[10px] border border-line bg-line sm:grid-cols-2">
                    <div className="flex min-h-28 flex-col items-start justify-between gap-4 bg-surface p-5">
                      <span className="text-xs text-muted-foreground">Mark only (CLEARED on the ring from 40px)</span>
                      <StampMark className="size-16 text-cleared" />
                    </div>
                    <div className="flex min-h-28 flex-col items-start justify-between gap-4 bg-surface p-5">
                      <span className="text-xs text-muted-foreground">Wordmark (landing nav)</span>
                      <Logo size="lg" mark={false} />
                    </div>
                    <div className="flex min-h-28 flex-col items-start justify-between gap-4 bg-surface p-5">
                      <span className="text-xs text-muted-foreground">Horizontal lockup (sidebar, footer)</span>
                      <Logo />
                    </div>
                    <div className="flex min-h-28 flex-col items-start justify-between gap-4 bg-surface p-5">
                      <span className="text-xs text-muted-foreground">Favicon sizes: 16, 24, 32px</span>
                      <span className="flex items-end gap-4 text-cleared">
                        <StampMark className="size-4" />
                        <StampMark className="size-6" />
                        <StampMark className="size-8" />
                      </span>
                    </div>
                    <div className="flex min-h-28 flex-col items-start justify-between gap-4 bg-ink p-5 sm:col-span-2">
                      <span className="text-xs text-paper/60">Reversed on ink</span>
                      <span className="flex items-center gap-8">
                        <Logo size="lg" className="text-paper [&_.text-cleared]:text-chart-2" />
                        <StampMark className="size-14 text-chart-2" />
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <Label>Event row</Label>
                <div className="divide-y divide-line rounded-[10px] border border-line bg-surface">
                  <EventRow type="CUSTOMER.DISPUTE.RESOLVED" summary="Dispute closed in your favour. $400 stays in your balance." time="14:32" />
                  <EventRow type="INVOICING.INVOICE.PAID" summary="Northwind Studio paid $400" time="09:20" simulated />
                </div>
              </div>
            </div>
          </Section>
        </main>
      </div>
    </div>
  );
}
