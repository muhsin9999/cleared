"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function CopyButton({ value, label = "Copy", toastMessage = "Copied" }: { value: string; label?: string; toastMessage?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={async () => {
        const text = value.startsWith("/") ? `${window.location.origin}${value}` : value;
        await navigator.clipboard.writeText(text);
        setCopied(true);
        toast.success(toastMessage);
        setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <CheckIcon aria-hidden /> : <CopyIcon aria-hidden />} {label}
    </Button>
  );
}
