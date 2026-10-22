import type { Metadata } from "next";
import { ArchitectureExplorer } from "@/components/architecture/explorer";

export const metadata: Metadata = {
  title: "Architecture",
  description: "How Cleared works: every part, the journeys a dispute and a sale take through it, the safety design, and the decisions behind it.",
};

export default function ArchitecturePage() {
  return <ArchitectureExplorer />;
}
