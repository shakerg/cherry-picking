// cherry-with-diffs.js
// Cherry-pick a commit by applying diffs to the target branch's latest commit.
// Requires a GitHub token with repo access in the GITHUB_TOKEN environment variable.
// 1.	Get the diff (changed files) from the source commit.
// 2.	Apply those changes onto the current state of the target branch.
// 3.	Create a new tree with those merged file blobs.
// 4.	Create a new commit pointing to that tree, with the target branch’s head as the parent.
// 5.	Update the branch ref.



import { Octokit } from "@octokit/rest";
import { applyPatch } from "diff";

// Basic CLI arg parsing (supports: --owner, --repo, --source, --target, --dry-run, --conflicts-dir)
const args = process.argv.slice(2);
function getArg(name, defaultValue = undefined) {
  const flagIndex = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (flagIndex === -1) return defaultValue;
  const exact = args[flagIndex];
  if (exact.includes("=")) return exact.split("=")[1];
  const value = args[flagIndex + 1];
  if (!value || value.startsWith("--")) return true;
  return value;
}

const dryRun = getArg("dry-run", false) !== false; // present => true; absent => false
const conflictsDir = getArg("conflicts-dir", ".cherry-conflicts");
const owner = getArg("owner", "your-username");
const repo = getArg("repo", "your-repo");
const sourceCommitSha = getArg("source", "abc123");
const targetBranch = getArg("target", "main");

if (!process.env.GITHUB_TOKEN) {
  console.error("Error: GITHUB_TOKEN environment variable is required.");
  process.exit(1);
}

if (!sourceCommitSha || sourceCommitSha === "abc123") {
  console.error("Warning: source commit SHA looks like a placeholder. Provide --source <sha>.");
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function cherryPickWithDiffs() {
  const { data: sourceCommit } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: sourceCommitSha,
  });

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${targetBranch}`,
  });
  const targetHeadSha = refData.object.sha;

  const { data: targetCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: targetHeadSha,
  });

  const filesChanged = sourceCommit.files || [];
  const newTreeItems = [];
  const previewReport = [];
  const conflicts = [];
  const fs = await import('node:fs');
  const path = await import('node:path');
  const ensureConflictsDir = () => {
    if (!fs.existsSync(conflictsDir)) fs.mkdirSync(conflictsDir, { recursive: true });
  };

  for (const file of filesChanged) {
    if (file.status === "removed") {
      continue;
    }

    let baseContent = "";
    try {
      const { data: blobData } = await octokit.rest.repos.getContent({
        owner,
        repo,
        path: file.filename,
        ref: targetBranch,
      });

      if ("content" in blobData) {
        baseContent = Buffer.from(blobData.content, "base64").toString("utf8");
      }
    } catch (err) {
    }

    const patchedContent = applyPatch(baseContent, file.patch);

    if (patchedContent === false) {
      conflicts.push({ file: file.filename, reason: 'patch rejected' });
      if (dryRun) {
        ensureConflictsDir();
        fs.writeFileSync(path.join(conflictsDir, file.filename.replace(/\//g, '__') + '.base'), baseContent, 'utf8');
        fs.writeFileSync(path.join(conflictsDir, file.filename.replace(/\//g, '__') + '.patch'), file.patch || '', 'utf8');
      }
      continue; // skip adding this file
    }

    previewReport.push({
      file: file.filename,
      additions: file.additions,
      deletions: file.deletions,
      status: file.status,
      patchLines: (file.patch || '').split('\n').length,
    });

    if (!dryRun) {
      const { data: newBlob } = await octokit.rest.git.createBlob({
        owner,
        repo,
        content: patchedContent,
        encoding: "utf-8",
      });

      newTreeItems.push({
        path: file.filename,
        mode: "100644",
        type: "blob",
        sha: newBlob.sha,
      });
    }
  }
  if (dryRun) {
    console.log("--- DRY RUN (no changes pushed) ---");
    console.log(`Target branch head: ${targetHeadSha}`);
    console.log(`Source commit: ${sourceCommitSha}`);
    console.table(previewReport);
    console.log(`Files to update: ${previewReport.length}`);
    if (conflicts.length) {
      console.log(`Conflicts (${conflicts.length}) encountered:`);
      console.table(conflicts);
      console.log(`Conflict artifacts directory: ${conflictsDir}`);
    }
    console.log("Re-run without --dry-run to apply.");
    return;
  }

  if (conflicts.length) {
    console.error(`Aborting apply due to ${conflicts.length} conflict(s). Re-run with --dry-run and resolve manually.`);
    return;
  }
  if (newTreeItems.length === 0) {
    console.log("No file changes to apply. Exiting.");
    return;
  }

  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: targetCommit.tree.sha,
    tree: newTreeItems,
  });

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: `Cherry-pick: ${sourceCommit.commit.message}`,
    tree: newTree.sha,
    parents: [targetHeadSha],
  });

  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${targetBranch}`,
    sha: newCommit.sha,
    force: false,
  });

  console.log(`Cherry-picked commit applied: ${newCommit.sha}`);
}

cherryPickWithDiffs().catch(console.error);