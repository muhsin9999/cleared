"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { LoaderCircleIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { checkEvidenceFile } from "@/lib/evidence-files";
import { cn } from "@/lib/utils";

/** Drag-and-drop or pick files for a sale's proof locker. Files go one at a time to /api/sales/[id]/proofs. */
export function ProofDropzone({ saleId }: { saleId: string }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upload(files: FileList | File[]) {
    setError(null);
    for (const file of Array.from(files)) {
      const problem = checkEvidenceFile(file);
      if (problem) {
        setError(`${file.name}: ${problem}`);
        continue;
      }
      setBusy(file.name);
      const body = new FormData();
      body.set("file", file);
      try {
        const res = await fetch(`/api/sales/${saleId}/proofs`, { method: "POST", body });
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        if (!res.ok) setError(`${file.name}: ${json.error ?? "Upload failed. Try again."}`);
        else toast.success(`${file.name} added to the proof locker`);
      } catch {
        setError(`${file.name}: You seem to be offline. Try again.`);
      }
    }
    setBusy(null);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setOver(true);
        }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setOver(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        disabled={!!busy}
        className={cn(
          "flex w-full flex-col items-center gap-2 rounded-lg border border-dashed bg-paper/60 px-4 py-8 text-center transition-colors hover:border-cleared/50 hover:bg-cleared-tint/30",
          over && "border-cleared bg-cleared-tint/50",
        )}
      >
        {busy ? <LoaderCircleIcon aria-hidden className="size-5 animate-spin text-cleared" /> : <UploadIcon aria-hidden className="size-5 text-muted-foreground" />}
        <span className="text-sm font-medium">{busy ? `Uploading ${busy}…` : "Drop delivered files here, or choose files"}</span>
        <span className="text-xs text-muted-foreground">JPG, PNG, GIF or PDF, up to 10 MB.</span>
      </button>
      <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/gif,application/pdf" className="sr-only" tabIndex={-1} onChange={(e) => e.target.files && upload(e.target.files)} />
      <p role="status" aria-live="polite" className={cn("mt-2 text-sm text-risk", !error && "sr-only")}>{error ?? ""}</p>
    </div>
  );
}
