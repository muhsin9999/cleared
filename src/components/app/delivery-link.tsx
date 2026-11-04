"use client";

import { useSyncExternalStore } from "react";
import { CheckIcon, CopyIcon, ExternalLinkIcon } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { deviceName } from "./exhibit-viewer";

const origin = () => window.location.origin;
const noOrigin = () => "";

/** The client's private delivery link, in full, ready to paste into email or chat. */
export function DeliveryLink({ path, client }: { path: string; client: string }) {
  const base = useSyncExternalStore(() => () => {}, origin, noOrigin);
  const url = `${base}${path}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied. Paste it in your message to the client.");
    } catch {
      toast.error("Couldn’t copy. Select the link and copy it.");
    }
  };
  return (
    <div className="space-y-2.5">
      <p className="text-sm text-muted-foreground text-pretty">
        Send {client} this link with the files. They see what you delivered and confirm with one click. That’s your proof.
      </p>
      <p className="truncate rounded-md border bg-paper px-3 py-2 font-mono text-xs select-all" title={url}>{url}</p>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" onClick={copy}><CopyIcon aria-hidden /> Copy link</Button>
        <a href={path} target="_blank" rel="noreferrer" className={buttonVariants({ variant: "ghost", size: "sm" })}>Open as the client <ExternalLinkIcon aria-hidden /></a>
      </div>
    </div>
  );
}

export function Confirmed({ name, when, device }: { name: string; when: string; device?: string }) {
  return (
    <p className="flex items-start gap-2 text-sm">
      <CheckIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-cleared-strong" />
      <span><span className="font-medium text-cleared-strong">{name} confirmed they received it</span><span className="block text-xs text-muted-foreground">{when}{device ? ` · ${deviceName(device)}` : ""}</span></span>
    </p>
  );
}
