"use client";

// ============================================================
// Nanda AI Job Assistant — Interactive Git Visualizer & Report
// 5-Zone lifecycle architecture, command inspector & live repo telemetry
// Strict rule: Zero emojis in code, UI text, icons, tooltips, and logs
// ============================================================

import React, { useState, useEffect, useMemo, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  GitBranch,
  GitCommit,
  GitPullRequest,
  GitFork,
  Terminal,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Layers,
  HardDrive,
  Cloud,
  Archive,
  RefreshCw,
  Play,
  Copy,
  Check,
  Search,
  Filter,
  Code,
  FileCode,
  ExternalLink,
  ChevronRight,
  Plus,
  Trash2,
  Activity,
  FolderGit2
} from "lucide-react";
import {
  GIT_COMMANDS,
  GIT_ZONES_INFO,
  GitCommandDefinition,
  GitZone,
  GitCategory,
} from "@/lib/gitCommandsData";
import { GitRepoStatus } from "@/lib/gitStatusService";

interface SandboxFile {
  id: string;
  name: string;
  size: string;
  zone: GitZone;
  statusText?: string;
}

interface SandboxCommit {
  id: string;
  hash: string;
  message: string;
  author: string;
  timestamp: string;
  isRemoteSynced: boolean;
}

const INITIAL_SANDBOX_FILES: SandboxFile[] = [
  { id: "f-1", name: "src/app/page.tsx", size: "3.2 KB", zone: "workspace", statusText: "Modified" },
  { id: "f-2", name: "src/lib/analyzer.ts", size: "5.1 KB", zone: "staging", statusText: "Staged" },
];

const INITIAL_SANDBOX_COMMITS: SandboxCommit[] = [
  {
    id: "c-1",
    hash: "1a47404",
    message: "fix(hh-integration): resolve session & history sync",
    author: "wongkiiy",
    timestamp: "12 hours ago",
    isRemoteSynced: true,
  },
  {
    id: "c-2",
    hash: "ae4a34a",
    message: "docs: update technical guide and roadmap",
    author: "wongkiiy",
    timestamp: "12 hours ago",
    isRemoteSynced: true,
  },
];

export default function GitVisualizer({
  initialLiveStatus,
}: {
  initialLiveStatus?: GitRepoStatus | null;
}) {
  // Tabs: "visualizer" | "live-report" | "split"
  const [activeTab, setActiveTab] = useState<"visualizer" | "live-report">("visualizer");

  // Filter & Search
  const [selectedCategory, setSelectedCategory] = useState<GitCategory | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCommand, setSelectedCommand] = useState<GitCommandDefinition>(
    GIT_COMMANDS[0]
  );
  const [hoveredCommand, setHoveredCommand] = useState<GitCommandDefinition | null>(null);

  // Copied state
  const [copiedText, setCopiedText] = useState<string | null>(null);

  // Live Repo Status
  const [liveStatus, setLiveStatus] = useState<GitRepoStatus | null>(
    initialLiveStatus || null
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showRawTerminal, setShowRawTerminal] = useState(false);

  // Sandbox State
  const [sandboxFiles, setSandboxFiles] = useState<SandboxFile[]>(INITIAL_SANDBOX_FILES);
  const [sandboxCommits, setSandboxCommits] = useState<SandboxCommit[]>(INITIAL_SANDBOX_COMMITS);
  const [simulationLog, setSimulationLog] = useState<string[]>([
    "Sandbox initialized with demo repository state.",
  ]);

  // Load live status if not passed
  const fetchLiveStatus = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/git-status");
      const json = await res.json();
      if (json.success && json.data) {
        setLiveStatus(json.data);
      }
    } catch (err) {
      console.error("Failed to refresh git status", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (!initialLiveStatus) {
      fetchLiveStatus();
    }
  }, [initialLiveStatus]);

  // Handle command copy
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    setTimeout(() => {
      setCopiedText(null);
    }, 2000);
  };

  // Filtered commands
  const filteredCommands = useMemo(() => {
    return GIT_COMMANDS.filter((cmd) => {
      const matchesCategory =
        selectedCategory === "all" || cmd.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery =
        !q ||
        cmd.name.toLowerCase().includes(q) ||
        cmd.command.toLowerCase().includes(q) ||
        cmd.summary.toLowerCase().includes(q) ||
        cmd.flags.some((f) => f.flag.toLowerCase().includes(q) || f.description.toLowerCase().includes(q));
      return matchesCategory && matchesQuery;
    });
  }, [selectedCategory, searchQuery]);

  // Determine active visual zones
  const activeCommandForDisplay = hoveredCommand || selectedCommand;
  const highlightedFromZone = activeCommandForDisplay?.fromZone;
  const highlightedToZone = activeCommandForDisplay?.toZone;

  // Sandbox simulation actions
  const addModifiedFileToWorkspace = () => {
    const fileNum = sandboxFiles.length + 1;
    const newFile: SandboxFile = {
      id: "f-" + Date.now(),
      name: `src/components/Feature${fileNum}.tsx`,
      size: "2.4 KB",
      zone: "workspace",
      statusText: "Untracked",
    };
    setSandboxFiles((prev) => [...prev, newFile]);
    setSimulationLog((prev) => [
      `Workspace: Created new file ${newFile.name}`,
      ...prev.slice(0, 7),
    ]);
  };

  const simulateGitAdd = () => {
    const inWorkspace = sandboxFiles.filter((f) => f.zone === "workspace");
    if (inWorkspace.length === 0) {
      setSimulationLog((prev) => [
        "git add: Nothing in workspace to stage.",
        ...prev.slice(0, 7),
      ]);
      return;
    }
    setSandboxFiles((prev) =>
      prev.map((f) =>
        f.zone === "workspace" ? { ...f, zone: "staging", statusText: "Staged" } : f
      )
    );
    setSimulationLog((prev) => [
      `git add .: Staged ${inWorkspace.length} file(s) into Staging Area.`,
      ...prev.slice(0, 7),
    ]);
  };

  const simulateGitCommit = () => {
    const staged = sandboxFiles.filter((f) => f.zone === "staging");
    if (staged.length === 0) {
      setSimulationLog((prev) => [
        "git commit: No changes in staging area to commit.",
        ...prev.slice(0, 7),
      ]);
      return;
    }
    const shortHash = Math.random().toString(16).substring(2, 9);
    const newCommit: SandboxCommit = {
      id: "c-" + Date.now(),
      hash: shortHash,
      message: `feat: implement updates (${staged.map((f) => f.name.split("/").pop()).join(", ")})`,
      author: "you (developer)",
      timestamp: "just now",
      isRemoteSynced: false,
    };
    setSandboxCommits((prev) => [newCommit, ...prev]);
    // remove staged files from sandbox file list (they are now committed)
    setSandboxFiles((prev) => prev.filter((f) => f.zone !== "staging"));
    setSimulationLog((prev) => [
      `git commit: Created snapshot [${shortHash}] in Local Repository.`,
      ...prev.slice(0, 7),
    ]);
  };

  const simulateGitPush = () => {
    const unsynced = sandboxCommits.filter((c) => !c.isRemoteSynced);
    if (unsynced.length === 0) {
      setSimulationLog((prev) => [
        "git push: Everything up-to-date with remote origin.",
        ...prev.slice(0, 7),
      ]);
      return;
    }
    setSandboxCommits((prev) => prev.map((c) => ({ ...c, isRemoteSynced: true })));
    setSimulationLog((prev) => [
      `git push: Synced ${unsynced.length} commit(s) to Remote Repository (origin/main).`,
      ...prev.slice(0, 7),
    ]);
  };

  const simulateGitStash = () => {
    const inWorkspace = sandboxFiles.filter((f) => f.zone === "workspace");
    if (inWorkspace.length === 0) {
      setSimulationLog((prev) => [
        "git stash: No changes in workspace to stash.",
        ...prev.slice(0, 7),
      ]);
      return;
    }
    setSandboxFiles((prev) =>
      prev.map((f) =>
        f.zone === "workspace" ? { ...f, zone: "stash", statusText: "Stashed" } : f
      )
    );
    setSimulationLog((prev) => [
      `git stash: Saved ${inWorkspace.length} uncommitted file(s) onto Stash shelf.`,
      ...prev.slice(0, 7),
    ]);
  };

  const simulateGitStashPop = () => {
    const inStash = sandboxFiles.filter((f) => f.zone === "stash");
    if (inStash.length === 0) {
      setSimulationLog((prev) => [
        "git stash pop: Stash stack is empty.",
        ...prev.slice(0, 7),
      ]);
      return;
    }
    setSandboxFiles((prev) =>
      prev.map((f) =>
        f.zone === "stash" ? { ...f, zone: "workspace", statusText: "Restored" } : f
      )
    );
    setSimulationLog((prev) => [
      `git stash pop: Restored ${inStash.length} file(s) back into Workspace.`,
      ...prev.slice(0, 7),
    ]);
  };

  const simulateGitResetSoft = () => {
    if (sandboxCommits.length === 0) return;
    const [latest, ...rest] = sandboxCommits;
    // uncommit latest into staging
    setSandboxCommits(rest);
    const mockFile: SandboxFile = {
      id: "f-" + Date.now(),
      name: "src/uncommitted-snapshot.ts",
      size: "3.0 KB",
      zone: "staging",
      statusText: "Staged (Uncommitted)",
    };
    setSandboxFiles((prev) => [...prev, mockFile]);
    setSimulationLog((prev) => [
      `git reset --soft HEAD~1: Unwound commit [${latest.hash}], files kept in Staging Area.`,
      ...prev.slice(0, 7),
    ]);
  };

  const resetSandbox = () => {
    setSandboxFiles(INITIAL_SANDBOX_FILES);
    setSandboxCommits(INITIAL_SANDBOX_COMMITS);
    setSimulationLog(["Sandbox reset to default initial state."]);
  };

  const executeCommandInSandbox = (cmdId: string) => {
    switch (cmdId) {
      case "git-add":
        simulateGitAdd();
        break;
      case "git-commit":
        simulateGitCommit();
        break;
      case "git-push":
        simulateGitPush();
        break;
      case "git-stash":
        simulateGitStash();
        break;
      case "git-stash-pop":
        simulateGitStashPop();
        break;
      case "git-reset-soft":
        simulateGitResetSoft();
        break;
      case "git-restore-workspace":
        setSandboxFiles((prev) => prev.filter((f) => f.zone !== "workspace"));
        setSimulationLog((prev) => [
          "git restore: Discarded modified files in workspace.",
          ...prev.slice(0, 7),
        ]);
        break;
      default:
        setSimulationLog((prev) => [
          `Command simulation: ${cmdId} executed in sandbox context.`,
          ...prev.slice(0, 7),
        ]);
    }
  };

  const ZONES_ORDER: GitZone[] = ["stash", "workspace", "staging", "local", "remote"];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Header & Telemetry Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 backdrop-blur-sm shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <GitFork size={18} strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-zinc-100 flex items-center gap-2">
                Git Visualizer & Diagnostic Report
              </h1>
              <p className="text-xs text-zinc-400">
                Interactive 5-zone lifecycle visualizer coupled with live repository telemetry.
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Repo Quick Stats */}
        <div className="flex flex-wrap items-center gap-2">
          {liveStatus && (
            <>
              {/* Branch Tag */}
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-300">
                <GitBranch size={13} className="text-emerald-400" />
                <span className="font-semibold text-zinc-200">{liveStatus.branch}</span>
                {liveStatus.upstream && (
                  <span className="text-zinc-500 text-[11px]">
                    ...{liveStatus.upstream}
                  </span>
                )}
              </div>

              {/* Status Indicator */}
              <div
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                  liveStatus.workingTreeClean
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/25"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/25"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    liveStatus.workingTreeClean ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                  }`}
                />
                <span>
                  {liveStatus.workingTreeClean
                    ? "Clean Working Tree"
                    : `${liveStatus.modifiedFiles.length + liveStatus.untrackedFiles.length} Pending Changes`}
                </span>
              </div>

              {/* Last Commit Hash */}
              {liveStatus.recentCommits[0] && (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800 text-xs font-mono text-zinc-400">
                  <GitCommit size={13} className="text-zinc-500" />
                  <span className="text-zinc-200 font-semibold">
                    {liveStatus.recentCommits[0].shortHash}
                  </span>
                </div>
              )}
            </>
          )}

          {/* Refresh Button */}
          <button
            type="button"
            onClick={fetchLiveStatus}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 border border-zinc-700/60 text-xs font-medium text-zinc-200 transition-colors disabled:opacity-50"
            title="Refresh repository telemetry"
          >
            <RefreshCw
              size={13}
              className={isRefreshing ? "animate-spin text-emerald-400" : "text-zinc-400"}
            />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      {/* Main Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab("visualizer")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "visualizer"
              ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Layers size={15} className={activeTab === "visualizer" ? "text-emerald-400" : "text-zinc-500"} />
          <span>Interactive Visualizer & Sandbox</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("live-report")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "live-report"
              ? "bg-zinc-800 text-zinc-100 shadow-sm border border-zinc-700/80"
              : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900"
          }`}
        >
          <Activity size={15} className={activeTab === "live-report" ? "text-emerald-400" : "text-zinc-500"} />
          <span>Live Repository Report & Diagnostics</span>
          {liveStatus && !liveStatus.workingTreeClean && (
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          )}
        </button>
      </div>

      {/* TAB 1: INTERACTIVE VISUALIZER & SANDBOX */}
      {activeTab === "visualizer" && (
        <div className="space-y-6">
          {/* Active Flow Indicator Banner */}
          {activeCommandForDisplay && (
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <span className="text-zinc-400 font-medium">Selected Transition:</span>
                <code className="px-2 py-0.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 font-mono text-xs font-semibold">
                  {activeCommandForDisplay.command}
                </code>
                {activeCommandForDisplay.fromZone && activeCommandForDisplay.toZone && (
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <span className="text-zinc-300 font-semibold uppercase">
                      {GIT_ZONES_INFO[activeCommandForDisplay.fromZone].name}
                    </span>
                    <ArrowRight size={13} className="text-emerald-400" />
                    <span className="text-zinc-300 font-semibold uppercase">
                      {GIT_ZONES_INFO[activeCommandForDisplay.toZone].name}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => executeCommandInSandbox(activeCommandForDisplay.id)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 text-xs font-medium transition-colors"
                >
                  <Play size={11} fill="currentColor" />
                  <span>Simulate in Sandbox</span>
                </button>
              </div>
            </div>
          )}

          {/* The 5 Storage Zones Board */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {ZONES_ORDER.map((zoneKey) => {
              const zoneMeta = GIT_ZONES_INFO[zoneKey];
              const isSource = highlightedFromZone === zoneKey;
              const isTarget = highlightedToZone === zoneKey;

              const filesInZone = sandboxFiles.filter((f) => f.zone === zoneKey);
              const commitsInZone =
                zoneKey === "local"
                  ? sandboxCommits
                  : zoneKey === "remote"
                  ? sandboxCommits.filter((c) => c.isRemoteSynced)
                  : [];

              // Choose zone icon
              const ZoneIcon =
                zoneKey === "stash"
                  ? Archive
                  : zoneKey === "workspace"
                  ? FolderGit2
                  : zoneKey === "staging"
                  ? Layers
                  : zoneKey === "local"
                  ? HardDrive
                  : Cloud;

              return (
                <div
                  key={zoneKey}
                  className={`flex flex-col rounded-xl p-3.5 transition-all duration-200 border ${
                    isTarget
                      ? "border-emerald-500/80 bg-emerald-950/20 shadow-lg shadow-emerald-500/10 ring-1 ring-emerald-500/40"
                      : isSource
                      ? "border-sky-500/80 bg-sky-950/20 shadow-lg shadow-sky-500/10 ring-1 ring-sky-500/40"
                      : "border-zinc-800/80 bg-zinc-900/50 hover:border-zinc-700/80"
                  }`}
                >
                  {/* Zone Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center ${zoneMeta.bgColor} border ${zoneMeta.borderColor}`}
                      >
                        <ZoneIcon size={13} className={zoneMeta.color} />
                      </div>
                      <div>
                        <h2 className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                          {zoneMeta.name}
                        </h2>
                      </div>
                    </div>

                    {/* Zone Badge Indicator */}
                    {isTarget && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold uppercase">
                        Target
                      </span>
                    )}
                    {isSource && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-sky-500/20 text-sky-300 border border-sky-500/40 font-semibold uppercase">
                        Source
                      </span>
                    )}
                  </div>

                  <p className="text-[11px] text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
                    {zoneMeta.description}
                  </p>

                  {/* Sandbox Items List in Zone */}
                  <div className="flex-1 space-y-1.5 min-h-[140px] bg-zinc-950/60 rounded-lg p-2 border border-zinc-900 overflow-y-auto max-h-[220px]">
                    {zoneKey === "local" || zoneKey === "remote" ? (
                      commitsInZone.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-[11px] text-zinc-600 font-mono py-8">
                          No commits
                        </div>
                      ) : (
                        commitsInZone.map((commit) => (
                          <div
                            key={commit.id}
                            className="p-2 rounded bg-zinc-900/90 border border-zinc-800 text-[11px] space-y-1 hover:border-zinc-700 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono text-emerald-400 font-semibold text-[10px]">
                                {commit.hash}
                              </span>
                              <span className="text-[10px] text-zinc-500">
                                {commit.timestamp}
                              </span>
                            </div>
                            <p className="text-zinc-300 truncate font-sans text-[11px]">
                              {commit.message}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-zinc-500">
                              <span>{commit.author}</span>
                              {zoneKey === "local" && (
                                <span
                                  className={`text-[9px] font-mono uppercase px-1 rounded ${
                                    commit.isRemoteSynced
                                      ? "text-zinc-500"
                                      : "text-amber-400 bg-amber-500/10"
                                  }`}
                                >
                                  {commit.isRemoteSynced ? "Synced" : "Unpushed"}
                                </span>
                              )}
                            </div>
                          </div>
                        ))
                      )
                    ) : filesInZone.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-[11px] text-zinc-600 font-mono py-8">
                        Empty zone
                      </div>
                    ) : (
                      filesInZone.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-2 rounded bg-zinc-900/90 border border-zinc-800 text-[11px] hover:border-zinc-700 transition-colors"
                        >
                          <div className="flex items-center gap-1.5 min-w-0">
                            <FileCode size={12} className={zoneMeta.color} />
                            <span className="font-mono text-zinc-200 truncate text-[10px]">
                              {file.name}
                            </span>
                          </div>
                          <span className="text-[9px] font-mono text-zinc-500 shrink-0 ml-1">
                            {file.statusText || file.size}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Quick Action Button for Zone */}
                  <div className="mt-2.5 pt-2 border-t border-zinc-800/80 flex items-center justify-between text-[11px]">
                    {zoneKey === "workspace" && (
                      <button
                        type="button"
                        onClick={addModifiedFileToWorkspace}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded bg-zinc-800/70 hover:bg-zinc-700/70 text-zinc-300 text-[11px] font-medium transition-colors"
                      >
                        <Plus size={11} />
                        <span>Edit File</span>
                      </button>
                    )}
                    {zoneKey === "staging" && (
                      <button
                        type="button"
                        onClick={simulateGitCommit}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 text-[11px] font-medium transition-colors border border-amber-500/30"
                      >
                        <GitCommit size={11} />
                        <span>Commit</span>
                      </button>
                    )}
                    {zoneKey === "local" && (
                      <button
                        type="button"
                        onClick={simulateGitPush}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-[11px] font-medium transition-colors border border-emerald-500/30"
                      >
                        <Cloud size={11} />
                        <span>Push</span>
                      </button>
                    )}
                    {zoneKey === "stash" && (
                      <button
                        type="button"
                        onClick={simulateGitStashPop}
                        className="w-full flex items-center justify-center gap-1 py-1 rounded bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 text-[11px] font-medium transition-colors border border-purple-500/30"
                      >
                        <RotateCcw size={11} />
                        <span>Pop Stash</span>
                      </button>
                    )}
                    {zoneKey === "remote" && (
                      <span className="text-zinc-500 text-[10px] font-mono text-center w-full">
                        origin/main
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sandbox Controls Bar & Terminal Simulation Log */}
          <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Terminal size={14} className="text-emerald-400" />
                <span className="text-xs font-semibold text-zinc-200">
                  Interactive Sandbox Controls
                </span>
                <span className="text-[11px] text-zinc-500 font-mono">
                  (Simulate command state changes)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={resetSandbox}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs transition-colors"
                >
                  <RotateCcw size={11} />
                  <span>Reset Sandbox</span>
                </button>
              </div>
            </div>

            {/* Quick Command Action Triggers */}
            <div className="flex flex-wrap gap-2 text-xs font-mono">
              <button
                type="button"
                onClick={simulateGitAdd}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                git add .
              </button>
              <button
                type="button"
                onClick={simulateGitCommit}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                git commit -m "..."
              </button>
              <button
                type="button"
                onClick={simulateGitPush}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                git push
              </button>
              <button
                type="button"
                onClick={simulateGitStash}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                git stash
              </button>
              <button
                type="button"
                onClick={simulateGitStashPop}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                git stash pop
              </button>
              <button
                type="button"
                onClick={simulateGitResetSoft}
                className="px-2.5 py-1 rounded bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 transition-colors"
              >
                git reset --soft HEAD~1
              </button>
            </div>

            {/* Simulation Log Stream */}
            <div className="bg-zinc-950 rounded-lg p-2.5 font-mono text-[11px] text-zinc-400 space-y-1 border border-zinc-900 max-h-24 overflow-y-auto">
              {simulationLog.map((log, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">$</span>
                  <span className="text-zinc-300">{log}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Command Directory & Command Inspector */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Command Search & List (5 cols) */}
            <div className="lg:col-span-5 space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search commands, flags, descriptions..."
                    className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60"
                  />
                </div>
              </div>

              {/* Category Pills */}
              <div className="flex flex-wrap gap-1 text-[11px]">
                {(
                  [
                    { id: "all", label: "All" },
                    { id: "progression", label: "Progression" },
                    { id: "sync", label: "Remote Sync" },
                    { id: "undo", label: "Undo & Reset" },
                    { id: "stash", label: "Stash & Branch" },
                    { id: "inspect", label: "Inspection" },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setSelectedCategory(id)}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                      selectedCategory === id
                        ? "bg-zinc-800 text-emerald-400 border border-zinc-700"
                        : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/80"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Filtered Command Chips */}
              <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                {filteredCommands.map((cmd) => {
                  const isSelected = selectedCommand.id === cmd.id;
                  return (
                    <div
                      key={cmd.id}
                      onClick={() => setSelectedCommand(cmd)}
                      onMouseEnter={() => setHoveredCommand(cmd)}
                      onMouseLeave={() => setHoveredCommand(null)}
                      className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-zinc-800/90 border-emerald-500/50 shadow-sm"
                          : "bg-zinc-900/40 border-zinc-800/70 hover:bg-zinc-900 hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono font-semibold text-zinc-100">
                            {cmd.command}
                          </code>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase font-semibold ${
                              cmd.risk === "destructive"
                                ? "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                                : cmd.risk === "warning"
                                ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                                : "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                            }`}
                          >
                            {cmd.risk}
                          </span>
                        </div>

                        {cmd.fromZone && cmd.toZone && (
                          <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-mono">
                            <span>{cmd.fromZone}</span>
                            <ArrowRight size={10} />
                            <span>{cmd.toZone}</span>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-1 line-clamp-1">
                        {cmd.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right: Command Inspector Detail Card (7 cols) */}
            <div className="lg:col-span-7">
              {selectedCommand ? (
                <div className="p-5 rounded-2xl bg-zinc-900/70 border border-zinc-800 space-y-4">
                  {/* Header & Copy Button */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-zinc-100 font-mono">
                          {selectedCommand.name}
                        </h2>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase font-semibold ${
                            selectedCommand.risk === "destructive"
                              ? "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                              : selectedCommand.risk === "warning"
                              ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          }`}
                        >
                          {selectedCommand.risk}
                        </span>
                      </div>
                      <p className="text-xs text-zinc-400">{selectedCommand.summary}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedCommand.example)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors"
                      >
                        {copiedText === selectedCommand.example ? (
                          <>
                            <Check size={13} className="text-emerald-400" />
                            <span className="text-emerald-400">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy size={13} className="text-zinc-400" />
                            <span>Copy Command</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Flow Direction Badge */}
                  {selectedCommand.fromZone && selectedCommand.toZone && (
                    <div className="flex items-center gap-2 text-xs p-2.5 rounded-lg bg-zinc-950 border border-zinc-850">
                      <span className="text-zinc-500">Zone Transition:</span>
                      <span className="font-mono font-semibold text-sky-400 uppercase">
                        {GIT_ZONES_INFO[selectedCommand.fromZone].name}
                      </span>
                      <ArrowRight size={13} className="text-emerald-400" />
                      <span className="font-mono font-semibold text-emerald-400 uppercase">
                        {GIT_ZONES_INFO[selectedCommand.toZone].name}
                      </span>
                    </div>
                  )}

                  {/* Deep Dive Explanation */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Internal Mechanism
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed bg-zinc-950/40 p-3 rounded-lg border border-zinc-800/80">
                      {selectedCommand.explanation}
                    </p>
                  </div>

                  {/* When to use */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Optimal Scenario
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {selectedCommand.whenToUse}
                    </p>
                  </div>

                  {/* Common Flags */}
                  {selectedCommand.flags.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                        Key Parameters & Flags
                      </h3>
                      <div className="divide-y divide-zinc-800/80 rounded-lg border border-zinc-800 bg-zinc-950/60 overflow-hidden">
                        {selectedCommand.flags.map((flag, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 flex items-start gap-3 text-xs"
                          >
                            <code className="font-mono text-emerald-400 font-bold shrink-0 bg-zinc-900 px-1.5 py-0.5 rounded border border-zinc-800">
                              {flag.flag}
                            </code>
                            <span className="text-zinc-400 leading-relaxed">
                              {flag.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Example Code Block */}
                  <div className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
                      Production Example
                    </h3>
                    <div className="relative group">
                      <pre className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 font-mono text-xs text-zinc-200 overflow-x-auto">
                        <code>{selectedCommand.example}</code>
                      </pre>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedCommand.example)}
                        className="absolute right-2 top-2 p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Copy example"
                      >
                        <Copy size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-xs text-zinc-500">
                  Select any command from the list to view architecture and parameters.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE REPOSITORY REPORT & DIAGNOSTICS */}
      {activeTab === "live-report" && (
        <div className="space-y-6">
          {liveStatus ? (
            <>
              {/* Health Diagnostics Banner */}
              <div
                className={`p-5 rounded-2xl border backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                  liveStatus.workingTreeClean
                    ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
                    : "bg-amber-950/20 border-amber-500/30 text-amber-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      liveStatus.workingTreeClean
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    }`}
                  >
                    {liveStatus.workingTreeClean ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <AlertTriangle size={20} />
                    )}
                  </div>
                  <div>
                    <h2 className="text-base font-bold text-zinc-100">
                      {liveStatus.health.label}
                    </h2>
                    <p className="text-xs text-zinc-300 mt-0.5 max-w-2xl leading-relaxed">
                      {liveStatus.health.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end md:self-center">
                  <span className="text-[11px] font-mono text-zinc-400">
                    Last inspected:{" "}
                    {new Date(liveStatus.lastUpdated).toLocaleTimeString()}
                  </span>
                </div>
              </div>

              {/* Grid: 4 Core Live Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Active Branch */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                    Active Branch
                  </span>
                  <div className="flex items-center gap-2 text-zinc-100 font-mono font-bold text-base">
                    <GitBranch size={16} className="text-emerald-400" />
                    <span>{liveStatus.branch}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    Tracking: {liveStatus.upstream || "None (local-only)"}
                  </p>
                </div>

                {/* Staged Changes */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                    Staging Area
                  </span>
                  <div className="flex items-center gap-2 text-zinc-100 font-mono font-bold text-base">
                    <Layers size={16} className="text-amber-400" />
                    <span>{liveStatus.stagedFiles.length} file(s)</span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {liveStatus.stagedFiles.length > 0
                      ? "Ready for git commit"
                      : "Index clean"}
                  </p>
                </div>

                {/* Workspace Changes */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                    Workspace Edits
                  </span>
                  <div className="flex items-center gap-2 text-zinc-100 font-mono font-bold text-base">
                    <FolderGit2 size={16} className="text-sky-400" />
                    <span>
                      {liveStatus.modifiedFiles.length +
                        liveStatus.untrackedFiles.length}{" "}
                      file(s)
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    {liveStatus.modifiedFiles.length} modified,{" "}
                    {liveStatus.untrackedFiles.length} untracked
                  </p>
                </div>

                {/* Remote Parity */}
                <div className="p-4 rounded-xl bg-zinc-900/70 border border-zinc-800 space-y-1">
                  <span className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
                    Remote Parity
                  </span>
                  <div className="flex items-center gap-2 text-zinc-100 font-mono font-bold text-base">
                    <Cloud size={16} className="text-blue-400" />
                    <span>
                      {liveStatus.ahead === 0 && liveStatus.behind === 0
                        ? "Synchronized"
                        : `+${liveStatus.ahead} / -${liveStatus.behind}`}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 truncate">
                    {liveStatus.remoteUrl || "No remote origin"}
                  </p>
                </div>
              </div>

              {/* Recommended Fix Actions */}
              {liveStatus.health.recommendations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={14} className="text-emerald-400" />
                    <span>Contextual CLI Recommendations</span>
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {liveStatus.health.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800 hover:border-zinc-700 transition-colors space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-zinc-200">
                            {rec.action}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(rec.command)}
                            className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
                            title="Copy command"
                          >
                            {copiedText === rec.command ? (
                              <Check size={13} className="text-emerald-400" />
                            ) : (
                              <Copy size={13} />
                            )}
                          </button>
                        </div>
                        <code className="block p-2 rounded bg-zinc-950 border border-zinc-850 font-mono text-xs text-emerald-400 break-all select-all">
                          {rec.command}
                        </code>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">
                          {rec.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Live Files In Workspace & Staging Area */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Workspace Modified Files */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FolderGit2 size={15} className="text-sky-400" />
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                        Workspace Changes ({liveStatus.modifiedFiles.length})
                      </h3>
                    </div>
                  </div>

                  {liveStatus.modifiedFiles.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                      No modified files in workspace.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/80 max-h-60 overflow-y-auto">
                      {liveStatus.modifiedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="py-2 flex items-center justify-between text-xs font-mono"
                        >
                          <span className="text-zinc-200 truncate">{file.path}</span>
                          <span className="px-1.5 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-bold">
                            [{file.status}] Modified
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Untracked files */}
                  {liveStatus.untrackedFiles.length > 0 && (
                    <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                      <span className="text-[11px] text-zinc-500 uppercase font-semibold">
                        Untracked ({liveStatus.untrackedFiles.length})
                      </span>
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {liveStatus.untrackedFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="text-xs font-mono text-zinc-400 flex items-center justify-between"
                          >
                            <span className="truncate">{file.path}</span>
                            <span className="text-[10px] text-zinc-500">untracked</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Staging Area Files */}
                <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Layers size={15} className="text-amber-400" />
                      <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                        Staging Area Index ({liveStatus.stagedFiles.length})
                      </h3>
                    </div>
                  </div>

                  {liveStatus.stagedFiles.length === 0 ? (
                    <div className="p-6 text-center text-xs text-zinc-500 font-mono">
                      No files currently staged. Run <code>git add</code> to index edits.
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-800/80 max-h-60 overflow-y-auto">
                      {liveStatus.stagedFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="py-2 flex items-center justify-between text-xs font-mono"
                        >
                          <span className="text-zinc-200 truncate">{file.path}</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold">
                            [{file.status}] Staged
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Stash entries */}
                  <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
                    <span className="text-[11px] text-zinc-500 uppercase font-semibold">
                      Stash Stack ({liveStatus.stashList.length})
                    </span>
                    {liveStatus.stashList.length === 0 ? (
                      <p className="text-[11px] text-zinc-600 font-mono">
                        Stash stack is empty.
                      </p>
                    ) : (
                      <div className="space-y-1 max-h-28 overflow-y-auto">
                        {liveStatus.stashList.map((st, idx) => (
                          <div key={idx} className="text-xs font-mono text-zinc-400">
                            {st}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Recent Commit History Log */}
              <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <GitCommit size={15} className="text-emerald-400" />
                    <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                      Recent Commit Timeline (Local HEAD)
                    </h3>
                  </div>
                </div>

                <div className="divide-y divide-zinc-800/80 overflow-hidden">
                  {liveStatus.recentCommits.map((commit) => (
                    <div
                      key={commit.hash}
                      className="py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs"
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        <code className="font-mono text-emerald-400 font-bold shrink-0 bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800">
                          {commit.shortHash}
                        </code>
                        <span className="text-zinc-200 font-medium truncate">
                          {commit.subject}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0 text-zinc-500 text-[11px] font-mono">
                        <span>{commit.author}</span>
                        <span>•</span>
                        <span>{commit.relativeDate}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Raw Terminal Output Accordion */}
              <div className="rounded-xl bg-zinc-900/60 border border-zinc-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRawTerminal(!showRawTerminal)}
                  className="w-full p-3.5 flex items-center justify-between text-xs text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Terminal size={14} className="text-zinc-500" />
                    <span className="font-semibold">Raw Git Terminal Inspection</span>
                  </div>
                  <ChevronRight
                    size={14}
                    className={`transition-transform ${
                      showRawTerminal ? "rotate-90" : ""
                    }`}
                  />
                </button>

                {showRawTerminal && (
                  <div className="p-4 bg-zinc-950 border-t border-zinc-800 space-y-3 font-mono text-xs text-zinc-300">
                    <div>
                      <span className="text-zinc-500 text-[11px]">
                        $ git diff --stat
                      </span>
                      <pre className="mt-1 p-2.5 rounded bg-zinc-900/70 border border-zinc-850 text-zinc-300 overflow-x-auto text-[11px]">
                        {liveStatus.diffStat || "No workspace diff detected."}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-zinc-500">
              <RefreshCw size={24} className="mx-auto mb-3 animate-spin text-emerald-500" />
              <p className="text-xs">Inspecting git repository diagnostics...</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
