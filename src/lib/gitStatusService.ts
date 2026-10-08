// ============================================================
// Nanda AI Job Assistant — Git Repository Diagnostic Service
// Safe read-only inspection of repository status, commits, and zones
// Strict rule: Zero emojis in log output, error messages, and responses
// ============================================================

import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface GitFileItem {
  path: string;
  status: string;
  staged: boolean;
}

export interface GitCommitItem {
  hash: string;
  shortHash: string;
  subject: string;
  author: string;
  relativeDate: string;
  date: string;
}

export interface GitRecommendation {
  action: string;
  command: string;
  description: string;
}

export interface GitRepoStatus {
  isGitRepo: boolean;
  branch: string;
  upstream: string | null;
  remoteUrl: string | null;
  ahead: number;
  behind: number;
  workingTreeClean: boolean;
  stagedFiles: GitFileItem[];
  modifiedFiles: GitFileItem[];
  untrackedFiles: GitFileItem[];
  stashList: string[];
  recentCommits: GitCommitItem[];
  localBranches: string[];
  diffStat: string;
  lastUpdated: string;
  health: {
    status: "clean" | "uncommitted_changes" | "staged_changes" | "ahead" | "behind" | "diverged";
    label: string;
    description: string;
    recommendations: GitRecommendation[];
  };
}

async function runGit(args: string[], cwd = process.cwd()): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd,
      timeout: 8000,
      maxBuffer: 2 * 1024 * 1024,
      windowsHide: true,
    });
    return stdout.trim();
  } catch (err: any) {
    if (err.stdout) return String(err.stdout).trim();
    return "";
  }
}

export async function getGitRepositoryStatus(cwd = process.cwd()): Promise<GitRepoStatus> {
  const isInside = await runGit(["rev-parse", "--is-inside-work-tree"], cwd);
  const isGitRepo = isInside === "true";

  if (!isGitRepo) {
    return {
      isGitRepo: false,
      branch: "none",
      upstream: null,
      remoteUrl: null,
      ahead: 0,
      behind: 0,
      workingTreeClean: true,
      stagedFiles: [],
      modifiedFiles: [],
      untrackedFiles: [],
      stashList: [],
      recentCommits: [],
      localBranches: [],
      diffStat: "",
      lastUpdated: new Date().toISOString(),
      health: {
        status: "clean",
        label: "Not a Git Repository",
        description: "The current directory is not tracked by Git.",
        recommendations: [
          {
            action: "Initialize Git",
            command: "git init",
            description: "Initialize a new Git repository in this folder.",
          },
        ],
      },
    };
  }

  // Run safe read commands in parallel
  const [
    branchName,
    statusOutput,
    remoteUrlRaw,
    stashListRaw,
    logRaw,
    branchListRaw,
    diffStatRaw,
  ] = await Promise.all([
    runGit(["branch", "--show-current"], cwd),
    runGit(["status", "--porcelain=v1", "-b"], cwd),
    runGit(["remote", "get-url", "origin"], cwd),
    runGit(["stash", "list"], cwd),
    runGit(["log", "-n", "8", "--pretty=format:%H%x09%h%x09%s%x09%an%x09%ar%x09%ad"], cwd),
    runGit(["branch", "--list"], cwd),
    runGit(["diff", "--stat"], cwd),
  ]);

  const currentBranch = branchName || "HEAD";
  const remoteUrl = remoteUrlRaw || null;

  // Parse porcelain status lines
  const lines = statusOutput.split(/\r?\n/).filter(Boolean);
  let upstream: string | null = null;
  let ahead = 0;
  let behind = 0;

  const stagedFiles: GitFileItem[] = [];
  const modifiedFiles: GitFileItem[] = [];
  const untrackedFiles: GitFileItem[] = [];

  for (const line of lines) {
    if (line.startsWith("## ")) {
      // Header: ## main...origin/main [ahead 1, behind 2]
      const branchInfo = line.slice(3).trim();
      const parts = branchInfo.split("...");
      if (parts[1]) {
        const upstreamFull = parts[1];
        const bracketIndex = upstreamFull.indexOf("[");
        if (bracketIndex !== -1) {
          upstream = upstreamFull.slice(0, bracketIndex).trim();
          const tracker = upstreamFull.slice(bracketIndex);
          const aheadMatch = tracker.match(/ahead (\d+)/);
          const behindMatch = tracker.match(/behind (\d+)/);
          if (aheadMatch) ahead = parseInt(aheadMatch[1], 10);
          if (behindMatch) behind = parseInt(behindMatch[1], 10);
        } else {
          upstream = upstreamFull.trim();
        }
      }
      continue;
    }

    if (line.length >= 3) {
      const x = line[0]; // Staging state
      const y = line[1]; // Workspace state
      const filePath = line.slice(3).trim();

      if (x === "?" && y === "?") {
        untrackedFiles.push({ path: filePath, status: "??", staged: false });
      } else {
        if (x !== " " && x !== "?") {
          stagedFiles.push({ path: filePath, status: x, staged: true });
        }
        if (y !== " " && y !== "?") {
          modifiedFiles.push({ path: filePath, status: y, staged: false });
        }
      }
    }
  }

  // Parse stashes
  const stashList = stashListRaw ? stashListRaw.split(/\r?\n/).filter(Boolean) : [];

  // Parse commits
  const recentCommits: GitCommitItem[] = [];
  if (logRaw) {
    const commitLines = logRaw.split(/\r?\n/).filter(Boolean);
    for (const commitLine of commitLines) {
      const [hash, shortHash, subject, author, relativeDate, date] = commitLine.split("\t");
      if (hash && shortHash) {
        recentCommits.push({
          hash: hash.trim(),
          shortHash: shortHash.trim(),
          subject: (subject || "No commit message").trim(),
          author: (author || "Unknown").trim(),
          relativeDate: (relativeDate || "").trim(),
          date: (date || "").trim(),
        });
      }
    }
  }

  // Parse local branches
  const localBranches = branchListRaw
    ? branchListRaw
        .split(/\r?\n/)
        .map((b) => b.replace(/^\*\s*/, "").trim())
        .filter(Boolean)
    : [currentBranch];

  const workingTreeClean =
    stagedFiles.length === 0 && modifiedFiles.length === 0 && untrackedFiles.length === 0;

  // Determine health status & recommendations
  let healthStatus: GitRepoStatus["health"]["status"] = "clean";
  let healthLabel = "Working Tree Clean";
  let healthDesc = "Your local workspace is clean and synchronized.";
  const recommendations: GitRecommendation[] = [];

  if (behind > 0 && ahead > 0) {
    healthStatus = "diverged";
    healthLabel = `Diverged from Upstream (+${ahead} / -${behind})`;
    healthDesc = `Your branch has ${ahead} local commit(s) and is missing ${behind} remote commit(s). Rebase or merge is advised.`;
    recommendations.push(
      {
        action: "Pull with Rebase",
        command: "git pull --rebase origin " + currentBranch,
        description: "Re-apply your local commits on top of incoming remote changes.",
      },
      {
        action: "Inspect Differences",
        command: `git log --left-right --graph --oneline ${currentBranch}...${upstream || "origin/" + currentBranch}`,
        description: "Review diverging commits side-by-side.",
      }
    );
  } else if (behind > 0) {
    healthStatus = "behind";
    healthLabel = `Behind Remote (-${behind} commits)`;
    healthDesc = `Remote repository has ${behind} new commit(s) not yet pulled to this branch.`;
    recommendations.push({
      action: "Pull Remote Changes",
      command: "git pull origin " + currentBranch,
      description: "Fast-forward your local branch with upstream changes.",
    });
  } else if (ahead > 0) {
    healthStatus = "ahead";
    healthLabel = `Ahead of Remote (+${ahead} commits)`;
    healthDesc = `You have ${ahead} committed snapshot(s) ready to push to ${upstream || "remote"}.`;
    recommendations.push({
      action: "Push Commits",
      command: "git push origin " + currentBranch,
      description: "Publish your committed work to the remote repository.",
    });
  } else if (stagedFiles.length > 0) {
    healthStatus = "staged_changes";
    healthLabel = `${stagedFiles.length} File(s) Staged for Commit`;
    healthDesc = "Changes have been indexed in the staging area and are ready for a commit.";
    recommendations.push(
      {
        action: "Commit Staged Changes",
        command: 'git commit -m "feat: description of change"',
        description: "Snapshot staged changes into the local repository history.",
      },
      {
        action: "Unstage Files",
        command: "git restore --staged <file>",
        description: "Move changes back from Staging to Workspace.",
      }
    );
  } else if (modifiedFiles.length > 0 || untrackedFiles.length > 0) {
    healthStatus = "uncommitted_changes";
    const totalPending = modifiedFiles.length + untrackedFiles.length;
    healthLabel = `${totalPending} Uncommitted Change(s) in Workspace`;
    healthDesc = "Files in your working directory have been modified or created but are not yet staged.";
    recommendations.push(
      {
        action: "Review Diffs",
        command: "git diff",
        description: "Inspect line-by-line modifications in your workspace.",
      },
      {
        action: "Stage Modified Files",
        command: "git add .",
        description: "Promote all current workspace edits to the staging area.",
      },
      {
        action: "Temporarily Shelve Work",
        command: "git stash",
        description: "Save changes onto the stash stack to restore a clean workspace.",
      }
    );
  } else {
    recommendations.push(
      {
        action: "Fetch Remote Refs",
        command: "git fetch --prune",
        description: "Refresh remote tracking branches without touching workspace.",
      },
      {
        action: "View History",
        command: "git log --oneline -n 10",
        description: "Display recent commit timeline.",
      }
    );
  }

  return {
    isGitRepo: true,
    branch: currentBranch,
    upstream,
    remoteUrl,
    ahead,
    behind,
    workingTreeClean,
    stagedFiles,
    modifiedFiles,
    untrackedFiles,
    stashList,
    recentCommits,
    localBranches,
    diffStat: diffStatRaw || "",
    lastUpdated: new Date().toISOString(),
    health: {
      status: healthStatus,
      label: healthLabel,
      description: healthDesc,
      recommendations,
    },
  };
}
