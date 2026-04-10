---
name: is-setup
description: >
  Set up a knowledge space — connect, set purpose and focus, install automatic
  session check-in. Use when: user says "set up my space", "connect to IdeaSpaces",
  asks about persistent memory or cross-session context, or is_auth shows no
  connection. One-time flow, ~5 minutes.
allowed-tools: "mcp__plugin_ideaspaces_ideaspaces__is_explore mcp__plugin_ideaspaces_ideaspaces__is_find mcp__plugin_ideaspaces_ideaspaces__is_read mcp__plugin_ideaspaces_ideaspaces__is_write mcp__plugin_ideaspaces_ideaspaces__is_auth Edit Read Bash"
---

# IdeaSpaces Setup

**Goal:** Connect → Purpose → Now → SessionStart hook. The hook is the key deliverable — without it, the space is passive.

Do not offer unprompted. Wait for a signal.

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

### 3. Elicit Purpose

If Purpose is blank or the user wants to set it, ask:

> "What's this space for? Not a mission statement — what would make it valuable to you six months from now?"

Listen for concrete signals. Probe with:
- "What kind of things would you want to find here later?"
- "When you start a new session, what context would save you time?"

Write the answer to `_agent/purpose.md` using `is_write`. Keep it short — 3-5 sentences. Concrete over aspirational.

### 4. Set Current Focus

Ask:

> "What are you working on right now? What would progress look like this week?"

Write to `_agent/now.md` using `is_write`. Structure:
- What you're working on (1-2 sentences)
- What progress looks like (concrete, evaluable)
- What to focus on (3-5 bullets)

### 5. Scaffold Structure (Optional)

If the user has a clear use case, offer to create initial directories:

> "Want me to set up some structure? Based on what you described, I'd suggest: [directories]. Or we can let it grow organically."

Only scaffold if the user agrees. Create directories with README.md files that explain what belongs there.

### 6. Install SessionStart Hook

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
            "type": "prompt",
            "prompt": "You have IdeaSpaces connected. Run is_explore to read Purpose, Now, and recent changes. If there are new changes since last session, mention them briefly. Then proceed with the user's request. Keep orientation to 2-3 lines unless the user asks for more."
          }
        ]
      }
    ]
  }
}
```

Read the file first — if it exists, merge the hooks key rather than overwriting.

### 7. Confirm

Summarize what was set up:
- Space connected (which one)
- Purpose set (one line)
- Current focus set (one line)
- Structure created (if any)
- SessionStart hook installed (if yes)

> "You're set. Next session will start with context from your space. As you work, I'll suggest capturing decisions and insights — just say no if it's noise."

## Rules

- **Don't write Purpose for the user.** Elicit, reflect back, refine.
- **Don't over-scaffold.** Purpose + Now + hook is enough. Structure grows from use.
- **Merge, don't overwrite settings.** Read `.claude/settings.local.json` first, merge the hooks key.

## What Comes Next

Setup creates the foundation. From here:
- **is-space** — tool reference for navigating and working in the space
- **is-capture** — during work, notices when something is worth saving
- **is-reflect** — after work, checks if Purpose and Now still match reality
