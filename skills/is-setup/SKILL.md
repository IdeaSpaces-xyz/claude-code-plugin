---
name: is-setup
description: >
  Set up a knowledge space — connect, set purpose and focus, install automatic
  session check-in. Use when: user says "set up my space", "connect to IdeaSpaces",
  asks about persistent memory or cross-session context, is_auth shows no
  connection, OR the connected space is effectively empty (blank Purpose/Now
  and little or no structure). One-time flow, ~5 minutes.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write mcp__plugin_ideaspaces_ideaspaces__is_auth Edit Read Bash"
---

# IdeaSpaces Setup

**Goal:** Connect → Purpose → Now → SessionStart hook. The hook is the key deliverable — without it, the space is passive.

Do not offer unprompted. Wait for a signal.

## Trigger Note

Treat an effectively empty space as a setup signal:
- `_agent/purpose.md` blank template
- `_agent/now.md` blank template
- little or no meaningful directory structure yet

When those are true, recommend this setup flow explicitly.

## Flow

### 1. Check Connection

Run `is_auth action="status"`. If not connected:
- Run `is_auth` to open browser login
- Then `is_auth action="repos"` to list available spaces
- If multiple spaces, ask which one. If one, select it.

If already connected, skip to step 2.

### 2. Read Current State

Run `is_explore` to see what exists. Check if `_agent/purpose.md` and `_agent/now.md` have content or are blank templates.

If the space already has Purpose and Now filled in, confirm with the user: "Your space already has a direction set. Want to review it, update it, or skip to hook setup?"

### 3. Offer a space for the current folder

Run a quick check with Bash to understand the current state:

- `git rev-parse --is-inside-work-tree` — is this already a git repo?
- `git remote get-url origin` (if inside a repo) — does it already have a remote?

Decide which path to offer based on what you see:

**A. No external origin (folder is empty, or a local-only git repo).**
The common case. Offer:

> "Want me to create an IdeaSpaces space for this work? I'll create the space, clone it here so git push works, and wire up your identity."

If yes:

- `ideaspaces init "<name>"`

This creates the space on the server, `git clone`s it into `./<slug>` (or `--dir <path>`), and sets `git config --local user.email` / `user.name` from your OAuth account — so every commit you push attributes to you correctly. No trailer workarounds.

**B. Already has an external origin (GitHub, GitLab, etc.).**
Offer to adopt the external repo:

> "I see an origin pointing at <url>. Want to adopt this repo as an IdeaSpaces space? IdeaSpaces will clone from there and keep the canonical copy on your existing remote."

If yes:

- `ideaspaces power connect <origin_url> --name "<name>"`

Always show the command result and ask for confirmation before proceeding.

If command fails because CLI is missing/outdated, tell the user exactly what failed and continue setup normally.

### 4. Elicit Purpose

If Purpose is blank or the user wants to set it, ask:

> "What's this space for? Not a mission statement — what would make it valuable to you six months from now?"

Listen for concrete signals. Probe with:
- "What kind of things would you want to find here later?"
- "When you start a new session, what context would save you time?"

Write the answer to `_agent/purpose.md` using `is_write`. Keep it short — 3-5 sentences. Concrete over aspirational.

### 5. Set Current Focus

Ask:

> "What are you working on right now? What would progress look like this week?"

Write to `_agent/now.md` using `is_write`. Structure:
- What you're working on (1-2 sentences)
- What progress looks like (concrete, evaluable)
- What to focus on (3-5 bullets)

### 6. Scaffold Structure (Optional)

If the user has a clear use case, offer to create initial directories:

> "Want me to set up some structure? Based on what you described, I'd suggest: [directories]. Or we can let it grow organically."

Only scaffold if the user agrees. Create directories with README.md files that explain what belongs there.

### 7. Install SessionStart Hook

Ask:

> "Want me to set up automatic check-in? Every new session, I'll read your Purpose, current focus, and any recent changes — so you never have to re-explain context."

If yes, write to `.claude/settings.local.json`:

```json
{
  "hooks": {
    "SessionStart": [
      {
        "matcher": "startup",
        "hooks": [
          {
            "type": "command",
            "command": "echo 'IdeaSpaces connected. Orient: run is_explore to read Purpose, Now, and recent changes. Keep orientation to 2-3 lines.'"
          }
        ]
      }
    ]
  }
}
```

Read the file first — if it exists, merge the hooks key rather than overwriting.

### 8. Confirm

Summarize what was set up:
- Space connected (which one)
- Existing git repo connected (if done)
- Purpose set (one line)
- Current focus set (one line)
- Structure created (if any)
- SessionStart hook installed (if yes)

> "You're set. Next session will start with context from your space."

After confirming, offer a workspace package if the use case matches:

- **Founder / startup:** "I can also set up tracking for decisions, customers, progress, and docs — `/is-founder`. Want to try it?"
- **VC / investor:** "I can set up deal flow tracking, industry research, and portfolio notes — `/is-vc`. Want to try it?"

Don't push. One sentence. If they say no or it doesn't match, move on.

## Rules

- **Don't write Purpose for the user.** Elicit, reflect back, refine.
- **Don't auto-connect repos without consent.** Detect, explain, ask, then run.
- **Don't over-scaffold.** Purpose + Now + hook is enough. Structure grows from use.
- **Merge, don't overwrite settings.** Read `.claude/settings.local.json` first, merge the hooks key.

## What Comes Next

Setup creates the foundation. From here:
- **is-space** — tool reference for navigating and working in the space
- **is-capture** — during work, notices when something is worth saving
- **is-reflect** — after work, checks if Purpose and Now still match reality
