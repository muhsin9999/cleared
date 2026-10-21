import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 bg-paper px-4 text-center">
      <Link href="/" aria-label="cleared home"><Logo size="md" /></Link>
      <div className="space-y-2">
        <p className="font-mono text-sm text-muted-foreground">404</p>
        <h1 className="text-2xl font-semibold tracking-[-0.02em]">There’s nothing on file here</h1>
        <p className="max-w-sm text-muted-foreground text-pretty">The link may be old, or the item belongs to another workspace. Demo workspaces are cleared after 48 hours.</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <Button render={<Link href="/home" />}>Go to your workspace</Button>
        <Button variant="outline" render={<Link href="/" />}>Back to the start</Button>
      </div>
    </main>
  );
}
