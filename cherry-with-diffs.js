// cherry-with-diffs.js
// Cherry-pick a commit by applying diffs to the target branch's latest commit.
// Requires a GitHub token with repo access in the GITHUB_TOKEN environment variable.
// 1.	Get the diff (changed files) from the source commit.
// 2.	Apply those changes onto the current state of the target branch.
// 3.	Create a new tree with those merged file blobs.
// 4.	Create a new commit pointing to that tree, with the target branch’s head as the parent.
// 5.	Update the branch ref.



import { Octokit } from "@octokit/rest";
import diff from "diff"; // npm install diff
const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN });

const owner = "your-username";
const repo = "your-repo";
const sourceCommitSha = "abc123";  // commit to cherry-pick
const targetBranch = "main";       // target branch

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

    const patchedContent = diff.applyPatch(baseContent, file.patch);

    if (patchedContent === false) {
      throw new Error(`Conflict while applying patch for ${file.filename}`);
    }

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