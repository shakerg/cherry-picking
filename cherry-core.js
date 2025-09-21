// This script demonstrates a simplified "cherry-pick"-like operation using GitHub's REST API.
// It applies the diffs from a specific commit onto the current state of a target branch.
// Note: This does not handle merge conflicts, whomp whomp!
// Requires a GitHub token with repo access in the GITHUB_TOKEN environment variable.

// 1.	Fetches the commit you want to “cherry-pick.”
// 2.	Gets the target branch’s latest commit.
// 3.	Creates a new commit with:
//   •	The same tree as the source commit.
//   •	The target branch head as the parent.
//   •	A message referencing the cherry-pick.
// 4.	Updates the branch ref.


import { Octokit } from "@octokit/rest";

// Basic CLI arg parsing similar to cherry-with-diffs.js
const args = process.argv.slice(2);
function getArg(name, defaultValue = undefined) {
  const idx = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return defaultValue;
  const token = args[idx];
  if (token.includes('=')) return token.split('=')[1];
  const next = args[idx + 1];
  if (!next || next.startsWith('--')) return true;
  return next;
}

const dryRun = getArg('dry-run', false) !== false; // presence => true
const owner = getArg('owner', 'your-username');
const repo = getArg('repo', 'your-repo');
const sourceCommitSha = getArg('source', 'abc123'); // commit to cherry-pick
const targetBranch = getArg('target', 'main');      // branch to apply commit to

if (!process.env.GITHUB_TOKEN) {
  console.error('Error: GITHUB_TOKEN environment variable is required.');
  process.exit(1);
}
if (sourceCommitSha === 'abc123') {
  console.error('Warning: source commit SHA looks like a placeholder. Provide --source <sha>.');
}

const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

async function cherryPickLike() {
  const { data: sourceCommit } = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha: sourceCommitSha,
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

  if (dryRun) {
    console.log('--- DRY RUN (no commit created) ---');
    console.log(`Target branch head: ${targetHeadSha}`);
    console.log(`Source commit: ${sourceCommitSha}`);
    console.log('Commit that WOULD be created:');
    console.log({
      message: `Cherry-pick: ${sourceCommit.message}`,
      tree: sourceCommit.tree.sha,
      parents: [targetHeadSha]
    });
    console.log('Re-run without --dry-run to apply.');
    return;
  }

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: `Cherry-pick: ${sourceCommit.message}`,
    tree: sourceCommit.tree.sha,
    parents: [targetHeadSha],
  });

  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${targetBranch}`,
    sha: newCommit.sha,
    force: false,
  });

  console.log(`New commit created on ${targetBranch}: ${newCommit.sha}`);
}

cherryPickLike().catch(console.error);