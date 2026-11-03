"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { ArrowUpRight, Brain, ChevronDown, FileText, Paperclip, SendHorizontal, X } from "lucide-react";
import { toast } from "sonner";
import { askClearedAction, forgetMemo } from "@/server/actions/assistant";
import { AgentAvatar } from "@/components/brand/agent-avatar";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useDictation, VoiceButton } from "./voice-input";

export type AskMessage = { id: string; kind: string; body: { text?: string; files?: string[]; steps?: string[]; seconds?: number; links?: { label: string; href: string }[]; actions?: string[] } };
export type Memo = { id: string; text: string; about: string | null };

const SUGGESTIONS = ["What did we do last?", "When does my held money release?", "Do I have any open cases?", "Remember: this client approves on WhatsApp"];

/** "Ask Cleared", from any page: a conversation grounded in the seller's records, with files and memory. */
export function AskCleared({ messages, memos, compact = false }: { messages: AskMessage[]; memos: Memo[]; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<{ text: string; file?: string } | null>(null);
  const [busy, start] = useTransition();
  const end = useRef<HTMLDivElement>(null);
  const voice = useDictation(text, setText);

  useEffect(() => {
    end.current?.scrollIntoView({ block: "nearest" });
  }, [messages.length, pending, open]);

  const send = (value: string) => {
    const v = value.trim();
    if ((!v && !file) || busy) return;
    if (voice.listening) voice.toggle();
    const fd = new FormData();
    fd.set("text", v);
    if (file) fd.set("file", file);
    setPending({ text: v || `I've attached ${file!.name}.`, file: file?.name });
    setText("");
    setFile(null);
    start(async () => {
      const r = await askClearedAction(fd);
      setPending(null);
      if (!r.ok) {
        toast.error(r.error);
        setText(v);
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        className={
          compact
            ? "inline-flex items-center gap-1.5 rounded-full border bg-surface px-2 py-1 text-sm"
            : "inline-flex shrink-0 items-center gap-2 rounded-full border bg-surface py-1 pr-3 pl-1 text-sm font-medium whitespace-nowrap shadow-soft transition-colors hover:border-cleared/40"
        }
      >
        <AgentAvatar mood={busy ? "thinking" : "idle"} label="" className={compact ? "size-6" : "size-7 sm:size-8"} />
        <span className={compact ? "sr-only sm:not-sr-only" : ""}>
          Ask<span className="hidden sm:inline"> Cleared</span>
        </span>
      </SheetTrigger>
      <SheetContent side="right" className="flex w-full flex-col gap-0 bg-surface p-0 sm:max-w-md">
        <header className="flex items-center gap-3 border-b border-border px-5 py-4 pr-12">
          <AgentAvatar mood={busy ? "working" : "idle"} label="Cleared AI" className="size-12" />
          <div>
            <SheetTitle className="text-lg font-semibold leading-none">Cleared AI</SheetTitle>
            <p className="mt-1 text-xs text-muted-foreground">Answers from your sales and cases · remembers what you tell it</p>
          </div>
        </header>

        <Memory memos={memos} />

        <ol className="flex-1 space-y-4 overflow-y-auto px-5 py-5" aria-live="polite">
          {messages.length === 0 && !pending && <li className="text-sm text-muted-foreground">Ask about any sale, hold or case, attach a screenshot or PDF, or tell me something to remember.</li>}
          {messages.map((m) => (
            <li key={m.id}>
              <Bubble m={m} onNavigate={() => setOpen(false)} />
            </li>
          ))}
          {pending && (
            <>
              <li>
                <Bubble m={{ id: "pending", kind: "user", body: { text: pending.text, files: pending.file ? [pending.file] : undefined } }} onNavigate={() => {}} />
              </li>
              <li className="shimmer-text text-sm">Cleared AI is looking…</li>
            </>
          )}
          <div ref={end} />
        </ol>

        {messages.length === 0 && !pending && (
          <div className="flex flex-wrap gap-2 px-5 pb-3">
            {SUGGESTIONS.map((sug) => (
              <button key={sug} type="button" onClick={() => send(sug)} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground hover:border-cleared hover:text-ink">
                {sug}
              </button>
            ))}
          </div>
        )}
        {file && (
          <div className="mx-3 mb-1 flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <button type="button" onClick={() => setFile(null)} aria-label="Remove the file" className="text-muted-foreground hover:text-ink">
              <X className="size-4" />
            </button>
          </div>
        )}
        <form
          className="flex items-center gap-2 border-t border-border p-3"
          onSubmit={(e) => {
            e.preventDefault();
            send(text);
          }}
        >
          <label className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-muted-foreground hover:bg-muted" aria-label="Attach a file">
            <Paperclip className="size-5" />
            <input type="file" className="sr-only" accept="application/pdf,image/png,image/jpeg,image/webp,text/csv,text/plain" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          {voice.supported ? <VoiceButton listening={voice.listening} onToggle={voice.toggle} /> : null}
          <input value={text} onChange={(e) => setText(e.target.value)} maxLength={1000} placeholder={voice.listening ? "Listening…" : "Ask Cleared…"} aria-label="Message Cleared AI" className="h-10 min-w-0 flex-1 rounded-lg border border-border bg-paper px-3 text-sm outline-none focus:border-cleared" />
          <button type="submit" disabled={busy || (!text.trim() && !file)} className="grid size-10 place-items-center rounded-lg bg-cleared text-white hover:bg-cleared-strong disabled:opacity-50" aria-label="Send">
            <SendHorizontal className="size-4" />
          </button>
        </form>
      </SheetContent>
    </Sheet>
  );
}

function Memory({ memos }: { memos: Memo[] }) {
  const [open, setOpen] = useState(false);
  const [busy, start] = useTransition();
  if (!memos.length) return null;
  return (
    <div className="border-b border-border px-5 py-2.5">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-ink" aria-expanded={open}>
        <Brain className="size-4 text-cleared" />
        What I remember ({memos.length})
        <ChevronDown className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ul className="mt-2 space-y-1.5">
          {memos.map((n) => (
            <li key={n.id} className="flex items-start gap-2 rounded-lg bg-paper-deep px-3 py-2 text-sm">
              <span className="min-w-0 flex-1">
                {n.text}
                {n.about && <span className="block text-xs text-muted-foreground">about {n.about}</span>}
              </span>
              <button
                type="button"
                disabled={busy}
                onClick={() => start(async () => void (await forgetMemo(n.id)))}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Forget: ${n.text}`}
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Bubble({ m, onNavigate }: { m: AskMessage; onNavigate: () => void }) {
  if (m.kind === "user")
    return (
      <div className="ml-10 flex flex-col items-end gap-1.5">
        <p className="rounded-2xl rounded-br-md bg-cleared-tint px-4 py-2.5 text-[0.95rem]">{m.body.text}</p>
        {m.body.files?.map((f) => (
          <span key={f} className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5 text-sm">
            <FileText className="size-4 text-muted-foreground" />
            {f}
          </span>
        ))}
      </div>
    );
  return (
    <div className="mr-6 space-y-2">
      {m.body.steps && m.body.steps.length > 0 && <Steps steps={m.body.steps} seconds={m.body.seconds ?? 0} />}
      <p className="rounded-2xl rounded-bl-md border border-border bg-paper px-4 py-2.5 text-[0.95rem] whitespace-pre-line">{m.body.text}</p>
      {m.body.actions?.map((a) => (
        <p key={a} className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="h-px w-4 bg-line" />
          {a}
        </p>
      ))}
      {m.body.links && m.body.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {m.body.links.map((l) => (
            <Link key={l.href} href={l.href} onClick={onNavigate} className="inline-flex items-center gap-1 rounded-full border border-cleared/30 px-3 py-1 text-sm text-cleared-strong hover:bg-cleared-tint">
              {l.label} <ArrowUpRight className="size-3.5" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function Steps({ steps, seconds }: { steps: string[]; seconds: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="text-xs text-muted-foreground">
      <button type="button" onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1 hover:text-ink" aria-expanded={open}>
        {steps.length} steps in {seconds} s <ChevronDown className={cn("size-3.5 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <ol className="mt-1 space-y-0.5 border-l border-border pl-3">
          {steps.map((st) => (
            <li key={st}>{st}</li>
          ))}
        </ol>
      )}
    </div>
  );
}
