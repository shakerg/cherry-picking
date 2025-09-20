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
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = "your-username";
const repo = "your-repo";
const sourceCommitSha = "abc123";   // commit you want to "cherry-pick"
const targetBranch = "main";        // branch you want to apply commit to

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

  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: `Cherry-pick: ${sourceCommit.message}`,
    tree: sourceCommit.tree.sha,
    parents: [targetHeadSha], // new parent!
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