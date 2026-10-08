# Standalone Git Lifecycle Visualizer & Sandbox

A standalone, single-file interactive educational tool and simulator for visualising Git's 5 storage zones and command data flows.

## How to Run

Double-click `index.html` in fileini  explorer or open it in any web browser:

```bash
# On Windows PowerShell
Start-Process "tools/git-visualizer/index.html"

# Or serve locally if desired
npx serve tools/git-visualizer
```

## Features

- **5-Zone Storage Architecture:** Stash, Workspace, Staging Area, Local Repository, and Remote Repository.
- **Interactive Command Connections:** Hover or click any command to highlight source/target zones with directional flow indicators.
- **Interactive Sandbox Simulator:** Step through `git add`, `git commit`, `git push`, `git stash`, `git stash pop`, `git reset`, and `git restore` with live file state tracking and terminal logs.
- **Deep Technical Inspector:** Explains internal object models (blobs, trees, commits, packfiles), flag references, and copyable examples.
- **Self-Contained:** Zero dependencies or build steps required.
