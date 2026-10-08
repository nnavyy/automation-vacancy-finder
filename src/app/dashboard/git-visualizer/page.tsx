// ============================================================
// Nanda AI Job Assistant — Git Visualizer & Diagnostic Report
// Dashboard page for interactive Git command flow and live repository health
// Strict rule: Zero emojis in code, UI text, and metadata
// ============================================================

import { Metadata } from "next";
import { requireUser } from "@/lib/auth-helpers";
import { getGitRepositoryStatus } from "@/lib/gitStatusService";
import GitVisualizer from "@/components/GitVisualizer";

export const metadata: Metadata = {
  title: "Git Visualizer & Diagnostic Report — Nanda AI Assistant",
  description:
    "Interactive 5-zone lifecycle visualizer and real-time Git repository status reporting.",
};

export const dynamic = "force-dynamic";

export default async function GitVisualizerPage() {
  await requireUser();

  let initialLiveStatus = null;
  try {
    initialLiveStatus = await getGitRepositoryStatus();
  } catch (err) {
    console.error("[GitVisualizerPage] Failed to fetch server-side git status", err);
  }

  return (
    <div className="w-full">
      <GitVisualizer initialLiveStatus={initialLiveStatus} />
    </div>
  );
}
