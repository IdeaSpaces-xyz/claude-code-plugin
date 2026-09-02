---
name: is-share
description: >
  Let someone in — give a person or a team access to this space, or open it to
  everyone. Use when someone says let her see this, share this with my team,
  give them access, she needs to get up to speed on this, make it public, let
  people copy it — or asks who can see it, or to take someone's access away.
  Access levels: Explore (look around), Fork (take a copy home), Collaborate.
  Not for sending committed work to the remote; that is is-push.
allowed-tools: "mcp__plugin_ideaspaces_core__is_auth Read Bash"
---

# Share Access

Share manages recipients and public visibility. It is not Git push: **is-push** sends committed
state to an existing remote, while this skill changes who may use that remote Space.

This skill invokes the CLI bundled with the plugin:

```bash
node ${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js ...
```

No separate install is required. This release deliberately keeps Share CLI-backed; there is no
native `is_share` tool to discover or emulate with raw platform calls.

## Product choices

Use only these user-facing choices:

- **Explore** — view the shared Content. No independent copy or Git access.
- **Fork** — Explore plus an independent current-version copy. It does not expose source history.
- **Collaborate** — Explore plus clone/fetch/push on the same Space, including source history. Bytes
  already fetched cannot be revoked later.
- **Public** — anyone may View and materialize a local Fork without an account. Publishing that
  independent Space still requires sign-in. Source history, clone, and push remain private.
- **Private** — disable public view and public Fork/Copy without changing named people or team access.

Hosted history for a person is an optional, separately revocable trail; do not describe it as clone
or Collaborate.

## Choose the target

The current published folder is the default. If the user names another Space, pass its canonical URL
with `--space <url>`. Never ask for internal user, organization, Grant, userset, or repository
identifiers.

Before a mutation, state the exact target, recipient or visibility, grade, and history implication.
Ask for confirmation when any of those were inferred or omitted. A current request that already names
the complete operation counts as confirmation; do not ask twice. Listing is read-only and needs no
confirmation.

## Commands

Quote every user-provided recipient, hostname, and URL when invoking Bash.

```bash
CLI=(node "${CLAUDE_PLUGIN_ROOT}/cli/bundle/ideaspaces.js")

# Person: email or @handle
"${CLI[@]}" share person "someone@example.com" --grade explore
"${CLI[@]}" share person "@someone" --grade fork
"${CLI[@]}" share person "someone@example.com" --grade collaborate --history

# Registered team hostname
"${CLI[@]}" share team "acme.com" --grade collaborate

# Combined people, invitations, and teams
"${CLI[@]}" share list

# Aggregate removal by recipient
"${CLI[@]}" share remove "someone@example.com"
"${CLI[@]}" share remove "team:acme.com"

# Public/private choice. Going public is plan-first: without --yes the CLI
# states what opens up and applies nothing — show that to the user, and add
# --yes only on their agreement. Going private applies directly.
"${CLI[@]}" share visibility public          # plan only
"${CLI[@]}" share visibility public --yes    # apply, after the user's yes
"${CLI[@]}" share visibility private
```

**Non-interactive sessions never add `--yes` to `visibility public` on their own** — with nobody
to agree, the plan is the honest result.

Append `--space "<url>"` when targeting a Space other than the current folder. Use the normal human
output rather than `--json`: report recipients, grades, direct standing, and surviving effective
access, but do not surface backend coordinates.

If authentication is required, offer `is_auth action="login"`, then retry the same command. Do not
fall back to legacy compatibility subcommands unless the user explicitly asks to manage legacy
access.

## Report the result

- Say who or which team changed, at which grade, and whether hosted history was included.
- After removal, preserve the CLI's distinction between removed direct access and access surviving
  through another person, team, owner, or policy path.
- After visibility changes, repeat that named grants are unchanged. For Public, distinguish the
  account-free local `ideaspaces fork <space-url> [dir]` path from authenticated later publication.
- If the CLI refuses because the folder is unpublished or unmapped, offer **is-publish** or ask for a
  canonical Space URL. Surface other refusals without translating them into guessed authority.
