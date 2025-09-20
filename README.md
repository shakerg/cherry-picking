# Cherry-picking helper scripts

This folder contains two small Node.js scripts that use Octokit to apply commits (or their diffs) onto another branch. They are intended for testing and demonstration only.

**Prerequisites**
- **Node**: Install Node.js.
- **Token**: Set `GITHUB_TOKEN` with repo write permissions.
- **Dependencies**: Install packages used by the scripts.

Installation

```
cd cherry-picking
npm init -y
npm install @octokit/rest diff
```

**Environment**
- **`GITHUB_TOKEN`**: required. Export it before running the scripts:

```
export GITHUB_TOKEN="ghp_xxx..."
```

Script overview
- `cherry-core.js`: creates a new commit on the target branch that reuses the tree of a source commit, effectively attaching the source commit's tree to the target branch head. This is a very simple approach and does not apply diffs or handle conflicts.
- `cherry-with-diffs.js`: fetches the files changed by the source commit, applies the patch hunks to the target branch's current file contents, creates new blobs for the patched files, creates a new tree and commit on the target branch. This attempts to apply diffs and will throw an error on conflicts. Supports `--dry-run`.

How to use

1) Edit the top of the script(s) and set these values to match your repository and commit:

- `owner` — the repository owner (user or org).
- `repo` — the repository name.
- `sourceCommitSha` — the commit SHA you want to cherry-pick.
- `targetBranch` — the branch to which you want to apply the commit.

Example: run the simple tree-attach script

```
# set token and run
export GITHUB_TOKEN="..."
node cherry-core.js

# On success you'll see the new commit SHA printed.
```

Example: run the diff-based cherry-pick (dry run first)

```
export GITHUB_TOKEN="..."
# Dry run preview (no ref update)
node cherry-with-diffs.js --owner your-org --repo your-repo --source <commit-sha> --target main --dry-run

# Apply for real
node cherry-with-diffs.js --owner your-org --repo your-repo --source <commit-sha> --target main
```

Notes & warnings
- **Permissions**: The token needs `repo` write permissions to create commits and update refs.
- **Conflicts**: `cherry-with-diffs.js` will throw an error if a patch cannot be applied cleanly. Use `--dry-run` first to inspect changes. The scripts do not perform interactive merges or conflict resolution.
- **Testing**: Test in a fork or an isolated test branch before running against important branches.
- **Safety**: These scripts update git refs on GitHub directly. Consider making a backup branch or creating a PR instead of updating protected branches.
- **Rate limits & errors**: GitHub API rate limits and transient errors can occur — retry if necessary and inspect error messages.

Troubleshooting
- If you get `Conflict while applying patch for <file>` from `cherry-with-diffs.js`, inspect the `sourceCommitSha` and the current head of the `targetBranch` to understand why the patch doesn't apply.
- If you get permission errors, confirm `GITHUB_TOKEN` has correct scopes and is not expired.
- For debugging, add `console.log` calls or run the script step-by-step.
