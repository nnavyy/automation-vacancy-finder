// ============================================================
// Nanda AI Job Assistant — Git Command Knowledge Database
// Data definitions for 5-zone interactive lifecycle visualization
// Strict rule: Zero emojis in descriptions, flags, and examples
// ============================================================

export type GitZone = "stash" | "workspace" | "staging" | "local" | "remote";

export type GitCategory =
  | "progression"
  | "sync"
  | "undo"
  | "stash"
  | "inspect";

export type GitRiskLevel = "safe" | "warning" | "destructive";

export interface GitFlagInfo {
  flag: string;
  description: string;
}

export interface GitCommandDefinition {
  id: string;
  name: string;
  command: string;
  category: GitCategory;
  fromZone: GitZone | null;
  toZone: GitZone | null;
  secondaryZone?: GitZone | null;
  risk: GitRiskLevel;
  summary: string;
  explanation: string;
  whenToUse: string;
  flags: GitFlagInfo[];
  example: string;
}

export const GIT_ZONES_INFO: Record<
  GitZone,
  {
    name: string;
    subtitle: string;
    description: string;
    color: string;
    borderColor: string;
    bgColor: string;
    accentColor: string;
  }
> = {
  stash: {
    name: "Stash",
    subtitle: "Temporary Shelving Stack",
    description: "Temporarily shelves uncommitted changes without creating a commit snapshot.",
    color: "text-purple-400",
    borderColor: "border-purple-500/30",
    bgColor: "bg-purple-500/10",
    accentColor: "purple",
  },
  workspace: {
    name: "Workspace",
    subtitle: "Working Directory / Disk",
    description: "Your local filesystem and editor where files are created, edited, and tested.",
    color: "text-sky-400",
    borderColor: "border-sky-500/30",
    bgColor: "bg-sky-500/10",
    accentColor: "sky",
  },
  staging: {
    name: "Staging Area",
    subtitle: "Index / Cache",
    description: "The preparation area where changes are organized before committing.",
    color: "text-amber-400",
    borderColor: "border-amber-500/30",
    bgColor: "bg-amber-500/10",
    accentColor: "amber",
  },
  local: {
    name: "Local Repository",
    subtitle: "HEAD / Local Commits",
    description: "Committed snapshots preserved in your machine's .git database.",
    color: "text-emerald-400",
    borderColor: "border-emerald-500/30",
    bgColor: "bg-emerald-500/10",
    accentColor: "emerald",
  },
  remote: {
    name: "Remote Repository",
    subtitle: "Origin / GitHub",
    description: "Shared upstream server hosting remote branches for team collaboration.",
    color: "text-blue-400",
    borderColor: "border-blue-500/30",
    bgColor: "bg-blue-500/10",
    accentColor: "blue",
  },
};

export const GIT_COMMANDS: GitCommandDefinition[] = [
  // PROGRESSION
  {
    id: "git-add",
    name: "git add",
    command: "git add <file>",
    category: "progression",
    fromZone: "workspace",
    toZone: "staging",
    risk: "safe",
    summary: "Promotes modified or new files from Workspace into the Staging Area.",
    explanation:
      "Calculates file hashes, creates blob objects in Git object store, and indexes them ready for snapshot.",
    whenToUse: "Use after making code changes when you want to prepare them for the next commit.",
    flags: [
      { flag: ".", description: "Stage all modified and untracked files in the current folder" },
      { flag: "-p", description: "Interactive patch mode: choose individual hunks to stage" },
      { flag: "-u", description: "Stage modified and deleted files, excluding untracked files" },
    ],
    example: "git add src/app/dashboard/page.tsx",
  },
  {
    id: "git-commit",
    name: "git commit",
    command: 'git commit -m "<message>"',
    category: "progression",
    fromZone: "staging",
    toZone: "local",
    risk: "safe",
    summary: "Creates a permanent snapshot commit in the Local Repository from staged files.",
    explanation:
      "Generates a tree object representing the staging area, records author metadata, and advances the branch pointer.",
    whenToUse: "Use once a logical unit of work has been tested and staged.",
    flags: [
      { flag: '-m "msg"', description: "Specify commit message directly in terminal" },
      { flag: "-a", description: "Automatically stage all modified tracked files before committing" },
      { flag: "--amend", description: "Combine staged edits into the most recent commit without creating a new one" },
    ],
    example: 'git commit -m "feat(dashboard): add interactive git report visualizer"',
  },
  {
    id: "git-push",
    name: "git push",
    command: "git push <remote> <branch>",
    category: "progression",
    fromZone: "local",
    toZone: "remote",
    risk: "safe",
    summary: "Transfers committed branch history from Local Repository to Remote Repository.",
    explanation:
      "Negotiates missing commit objects with the remote server and fast-forwards the remote branch reference.",
    whenToUse: "Use when you want to publish committed work to GitHub or backup your local branch.",
    flags: [
      { flag: "-u origin <branch>", description: "Sets upstream tracking reference for future parameter-less pushes" },
      { flag: "--force-with-lease", description: "Safe forced push that aborts if someone else pushed to remote first" },
      { flag: "--tags", description: "Pushes all local release tags to the remote repository" },
    ],
    example: "git push origin main",
  },

  // REMOTE SYNC
  {
    id: "git-fetch",
    name: "git fetch",
    command: "git fetch <remote>",
    category: "sync",
    fromZone: "remote",
    toZone: "local",
    risk: "safe",
    summary: "Downloads commits and branch refs from Remote into Local without modifying Workspace.",
    explanation:
      "Updates remote-tracking branches like origin/main. Safe because it leaves your working files untouched.",
    whenToUse: "Use to check what teammates have pushed before deciding whether to merge or rebase.",
    flags: [
      { flag: "--prune", description: "Removes remote-tracking refs that no longer exist on the remote server" },
      { flag: "--all", description: "Fetches all remotes and branches configured in repository" },
    ],
    example: "git fetch --prune origin",
  },
  {
    id: "git-pull",
    name: "git pull",
    command: "git pull <remote> <branch>",
    category: "sync",
    fromZone: "remote",
    toZone: "workspace",
    secondaryZone: "local",
    risk: "safe",
    summary: "Fetches upstream commits and merges them directly into your current branch and Workspace.",
    explanation:
      "Runs git fetch under the hood followed by git merge FETCH_HEAD to update your working directory files.",
    whenToUse: "Use to synchronize your active local branch with latest remote team updates.",
    flags: [
      { flag: "--rebase", description: "Re-applies local commits on top of incoming remote commits instead of merge commit" },
      { flag: "--autostash", description: "Automatically stashes dirty workspace changes before rebase and pops after" },
    ],
    example: "git pull --rebase origin main",
  },
  {
    id: "git-clone",
    name: "git clone",
    command: "git clone <repository-url>",
    category: "sync",
    fromZone: "remote",
    toZone: "workspace",
    secondaryZone: "local",
    risk: "safe",
    summary: "Downloads a full remote repository, initialises .git, and checks out default branch.",
    explanation:
      "Creates working directory, downloads all commit packfiles, configures origin remote, and creates local main branch.",
    whenToUse: "Use when onboarding to a new codebase or checking out an open-source project.",
    flags: [
      { flag: "--depth 1", description: "Shallow clone containing only the latest commit, minimizing download size" },
      { flag: "--branch <name>", description: "Points HEAD to specific branch instead of default" },
    ],
    example: "git clone https://github.com/nnavyy/automation-vacancy-finder.git",
  },

  // UNDO & RECOVERY
  {
    id: "git-restore-workspace",
    name: "git restore",
    command: "git restore <file>",
    category: "undo",
    fromZone: "staging",
    toZone: "workspace",
    risk: "warning",
    summary: "Discards uncommitted changes in Workspace by copying the version from Staging or HEAD.",
    explanation:
      "Overwrites modified working directory files with the indexed version. Unsaved edits in the file will be lost.",
    whenToUse: "Use when an experiment in a file did not work out and you want to discard edits.",
    flags: [
      { flag: ".", description: "Restores all modified files in the current working directory" },
      { flag: "--source=HEAD~1", description: "Restores file content from an earlier commit snapshot" },
    ],
    example: "git restore README.md",
  },
  {
    id: "git-restore-staged",
    name: "git restore --staged",
    command: "git restore --staged <file>",
    category: "undo",
    fromZone: "staging",
    toZone: "workspace",
    risk: "safe",
    summary: "Unstages files from the Staging Area while preserving your edits in the Workspace.",
    explanation:
      "Replaces the index entry with the version from HEAD without touching your working directory files.",
    whenToUse: "Use when you ran git add accidentally and want to unstage files before committing.",
    flags: [
      { flag: ".", description: "Unstages all files in the current repository" },
    ],
    example: "git restore --staged src/lib/temporary.ts",
  },
  {
    id: "git-reset-soft",
    name: "git reset --soft",
    command: "git reset --soft HEAD~1",
    category: "undo",
    fromZone: "local",
    toZone: "staging",
    risk: "safe",
    summary: "Rewinds the latest commit but leaves all changes preserved in the Staging Area.",
    explanation:
      "Moves HEAD back by one commit. Does not touch index or working directory. Perfect for amending commits.",
    whenToUse: "Use when you made a commit prematurely and want to edit the message or add more files.",
    flags: [
      { flag: "HEAD~1", description: "Rewinds exactly one commit" },
      { flag: "<commit-hash>", description: "Rewinds HEAD to specific commit hash while keeping index" },
    ],
    example: "git reset --soft HEAD~1",
  },
  {
    id: "git-reset-mixed",
    name: "git reset --mixed",
    command: "git reset HEAD~1",
    category: "undo",
    fromZone: "local",
    toZone: "workspace",
    risk: "safe",
    summary: "Rewinds commit and unstages changes, keeping modifications preserved in Workspace.",
    explanation:
      "Moves HEAD back and resets the index to match, but leaves working directory files intact as uncommitted edits.",
    whenToUse: "Use when you want to uncommit and unstage work to reorganize multiple smaller commits.",
    flags: [
      { flag: "HEAD~1", description: "Default mode for git reset if no flag is provided" },
    ],
    example: "git reset HEAD~1",
  },
  {
    id: "git-reset-hard",
    name: "git reset --hard",
    command: "git reset --hard HEAD~1",
    category: "undo",
    fromZone: "local",
    toZone: "workspace",
    risk: "destructive",
    summary: "Completely obliterates uncommitted changes and rewinds HEAD, Index, and Workspace.",
    explanation:
      "Forces HEAD, staging area, and working directory to match the target commit. Discarded edits cannot be recovered.",
    whenToUse: "Use with caution when you want to completely throw away local commits and workspace state.",
    flags: [
      { flag: "HEAD", description: "Discards all local workspace and staged edits back to last commit" },
      { flag: "origin/main", description: "Forces local branch to match remote branch exactly" },
    ],
    example: "git reset --hard HEAD",
  },
  {
    id: "git-revert",
    name: "git revert",
    command: "git revert <commit-hash>",
    category: "undo",
    fromZone: "local",
    toZone: "local",
    risk: "safe",
    summary: "Creates a brand new commit that safely reverses the changes made by an older commit.",
    explanation:
      "Computes the inverse diff of the target commit and records a new commit without altering past history.",
    whenToUse: "Use when reverting a bug in shared remote branches where rewriting history is forbidden.",
    flags: [
      { flag: "--no-commit", description: "Applies the inverse diff into staging area without committing immediately" },
    ],
    example: "git revert 1a47404",
  },

  // STASH & BRANCHING
  {
    id: "git-stash",
    name: "git stash",
    command: "git stash push -m '<label>'",
    category: "stash",
    fromZone: "workspace",
    toZone: "stash",
    risk: "safe",
    summary: "Temporarily shelves uncommitted Workspace edits onto a stack, returning workspace to clean state.",
    explanation:
      "Stores dirty working directory and staged index into a special commit reflog and cleans workspace.",
    whenToUse: "Use when you need to switch branches urgently without losing in-progress uncommitted work.",
    flags: [
      { flag: "-u", description: "Include untracked files in the stash entry" },
      { flag: "-m 'label'", description: "Attach a descriptive name to the stash entry" },
    ],
    example: 'git stash push -m "wip: experimental parser"',
  },
  {
    id: "git-stash-pop",
    name: "git stash pop",
    command: "git stash pop",
    category: "stash",
    fromZone: "stash",
    toZone: "workspace",
    risk: "safe",
    summary: "Restores the most recently shelved changes from Stash stack into Workspace and drops the stash.",
    explanation:
      "Applies the top stash entry (stash@{0}) back onto working directory and deletes it from stash list.",
    whenToUse: "Use after returning to your original branch to resume in-progress work.",
    flags: [
      { flag: "stash@{1}", description: "Applies and drops a specific stash entry index" },
    ],
    example: "git stash pop",
  },
  {
    id: "git-switch",
    name: "git switch -c",
    command: "git switch -c <branch-name>",
    category: "stash",
    fromZone: "local",
    toZone: "local",
    risk: "safe",
    summary: "Creates a new local branch from the current HEAD and switches your active workspace to it.",
    explanation:
      "Creates a new ref in .git/refs/heads and updates HEAD symbolic pointer to the new branch.",
    whenToUse: "Use whenever starting a new feature, bugfix, or experiment.",
    flags: [
      { flag: "-c <name>", description: "Create and switch in one step (modern replacement for git checkout -b)" },
      { flag: "<existing>", description: "Switch to an existing local branch" },
    ],
    example: "git switch -c feat/analytics-v2",
  },

  // INSPECTION
  {
    id: "git-status",
    name: "git status",
    command: "git status -s",
    category: "inspect",
    fromZone: null,
    toZone: null,
    risk: "safe",
    summary: "Inspects status of Workspace, Staging Area, and relationship to upstream branch.",
    explanation:
      "Compares file modification timestamps with the index and HEAD tree to identify modified, staged, and untracked files.",
    whenToUse: "Use frequently during development to check what files are modified or staged.",
    flags: [
      { flag: "-s", description: "Short format display: two-letter status code per file" },
      { flag: "-b", description: "Show branch and tracking information in short format" },
    ],
    example: "git status -s -b",
  },
  {
    id: "git-diff",
    name: "git diff",
    command: "git diff",
    category: "inspect",
    fromZone: "workspace",
    toZone: "staging",
    risk: "safe",
    summary: "Displays line-by-line differences between Workspace and Staging Area.",
    explanation:
      "Generates unified diff comparing working tree files directly against the index cache.",
    whenToUse: "Use to review exact code edits before running git add.",
    flags: [
      { flag: "--staged", description: "Shows differences between Staging Area and the last commit (HEAD)" },
      { flag: "--stat", description: "Outputs condensed summary of changed files and line count deltas" },
    ],
    example: "git diff --staged",
  },
  {
    id: "git-log",
    name: "git log",
    command: "git log --oneline -n 5",
    category: "inspect",
    fromZone: "local",
    toZone: null,
    risk: "safe",
    summary: "Displays commit history graph and recent snapshots on current branch.",
    explanation:
      "Traverses commit objects backward from HEAD following parent pointers.",
    whenToUse: "Use to audit recent commits, read author messages, or find commit hashes.",
    flags: [
      { flag: "--oneline", description: "Condenses each commit to short hash and subject line" },
      { flag: "--graph", description: "Draws text-based branch branching and merge visualization" },
    ],
    example: "git log --oneline --graph -n 10",
  },
];
