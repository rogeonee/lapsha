---
name: deslop
description: Remove AI-generated code slop from a branch. Use when asked to deslop, clean up AI-generated code, or strip machine-written noise (redundant comments, over-defensive checks, `any` casts, inconsistent style) introduced in the current branch's diff.
version: 1.0.0
license: MIT
---

# Remove AI code slop

Check the diff against the main/master (or base PR) branch, and remove all AI-generated slop introduced in this branch.

Determine the diff with `git diff` against the repository's main/default branch (e.g. `git diff master...HEAD` or `git diff main...HEAD`). Only touch code changed in this branch — do not reformat unrelated files.

This includes:

- Extra comments that a human wouldn't add or that are inconsistent with the rest of the file
- Extra defensive checks or try/catch blocks that are abnormal for that area of the codebase (especially if called by trusted / validated codepaths)
- Casts to `any` to get around type issues
- Any other style that is inconsistent with the file

Match the surrounding code's conventions: comment density, naming, and idiom.

Report at the end with only a 1-3 sentence summary of what you changed.
