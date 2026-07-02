# GitHub Profile README — Ultimate Dynamic Design

## Overview

Create a highly dynamic and visually stunning GitHub profile README for `asepharyana/asepharyana`. The README will auto-update via GitHub Actions, featuring AI-generated activity summaries, contribution visualizations, and comprehensive GitHub metrics.

## Architecture

### Repository Structure

```
asepharyana/
├── .github/
│   └── workflows/
│       ├── ai-activity.yml          # LLM-powered activity log (cron: every 6h)
│       └── snake.yml                # Contribution snake SVG (cron: daily)
├── scripts/
│   └── generate-ai-blog.js          # Fetch activity → call LLM → update README
├── assets/
│   └── generated/                   # Auto-generated SVGs (checked into git — referenced by README; seed with .gitkeep)
├── README.md                        # The main profile README
└── docs/
    └── superpowers/specs/
        └── 2026-07-03-profile-readme-design.md
```

### Component Breakdown

| Component | File | Responsibility |
|---|---|---|
| README Shell | `README.md` | Static layout with marker comments for dynamic content injection |
| AI Activity | `scripts/generate-ai-blog.js` | Fetch 7-day GitHub activity → format → send to LLM → write result |
| Snake Gen | `.github/workflows/snake.yml` | Uses `Platane/snk` action to render contribution grid as snake |
| Stats Cards | Inline in README | SVG cards via `github-readme-stats` API (queried at view time) |

## User Configuration

- **GitHub username:** `asepharyana`
- **LinkedIn:** `https://www.linkedin.com/in/asep-haryana-saputra-2014a5294/`
- **Website:** `https://asepharyana.my.id/`
- **AI LLM API:** `sk-5dd268d88adb496b-818beb-6bc7498e` @ `https://omniroute.imrnes.team/v1` model `text`
- **Role:** Mahasiswa | AI Enthusiast

## README Layout & Section Design

### 1. Header — Hero Section
- Custom banner (generated SVG or GitHub banner)
- Animated typing effect via markdown-compatible approach (JavaScript/CSS not available — use GIF from readme-typing-svg or similar SVG service)
- Name, tagline, role badges
- Visitor counter badge

### 2. Tech Stack Badges
- Grouped by category: Languages, AI/ML, Tools
- Shields.io badges with flat design
- Dark mode compatible

### 3. GitHub Stats Dashboard
- **3-column layout** using HTML tables/grid in markdown:
  - GitHub Stats card (`github-readme-stats`)
  - GitHub Streak card (`github-readme-streak-stats`)
  - Top Languages card (`github-readme-stats`)
- GitHub Trophies row below stats (`github-profile-trophy`)

### 4. AI Activity Log (Dynamic via Actions)
- **Section markers:** `<!--AI_ACTIVITY_START-->` / `<!--AI_ACTIVITY_END-->`
- Replaced every 6 hours by `generate-ai-blog.js`
- Content: 2-3 sentences in casual Indonesian with emojis
- Describes: recent commits, new repos, merged PRs, opened issues
- **Fallback:** "Belum ada aktivitas GitHub dalam 7 hari terakhir. Pantau terus! 🚀"

### 5. Contribution Snake
- Animated SVG showing contribution grid as a snake eating squares
- Dark mode variant
- Generated daily via `snake.yml`

### 6. Connect & Footer
- Social links row: LinkedIn, Website, Email (if public)
- "Visitors" count badge
- Fun fact section

## AI Activity Generator — Detailed Spec

### Workflow: `.github/workflows/ai-activity.yml`

```yaml
name: AI Activity Log
on:
  schedule:
    - cron: "0 */6 * * *"   # every 6 hours at :00
  push:
    branches: [main]
  workflow_dispatch:         # manual trigger

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Generate AI activity log
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          AI_LLM_API_KEY: ${{ secrets.AI_LLM_API_KEY }}
          AI_LLM_BASE_URL: ${{ secrets.AI_LLM_BASE_URL }}
          AI_LLM_MODEL: ${{ secrets.AI_LLM_MODEL }}
        run: node scripts/generate-ai-blog.js

      - name: Commit README changes
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "41898282+github-actions[bot]@users.noreply.github.com"
          git add README.md
          git diff --staged --quiet || git commit -m "chore: update AI activity log [skip ci]"
          git push
```

### Script: `scripts/generate-ai-blog.js`

**Input:**
1. GitHub Events API — `/users/{username}/events?per_page=100`
2. Filter: only events from last 7 days
3. Normalize to structured format:
   - `PushEvent` → {type: "commit", repo, branch, message_preview}
   - `CreateEvent` → {type: "create", repo, ref_type: "repo"|"branch"}
   - `PullRequestEvent` → {type: "pr", repo, action: "opened"|"merged"|"closed"}
   - `IssuesEvent` → {type: "issue", repo, action, title}
   - `WatchEvent` → {type: "star", repo}
   - `ForkEvent` → {type: "fork", repo}
4. Deduplicate: group same repo + same type

**LLM Call:**
```
POST {base_url}/chat/completions
Authorization: Bearer {api_key}

{
  "model": "{model}",
  "messages": [
    {
      "role": "user",
      "content": "Buat summary aktivitas GitHub dalam bahasa Indonesia kasual, maksimal 3 kalimat, pakai emoji. Jangan pake format list. Langsung kontennya aja:\n\n{formatted_activity}"
    }
  ],
  "max_tokens": 300,
  "temperature": 0.7
}
```

**Output:**
Replace content between `<!--AI_ACTIVITY_START-->` and `<!--AI_ACTIVITY_END-->` in README.md.

**Error Handling:**
- If GitHub API fails (no token, rate limit): skip block, keep previous content
- If LLM API fails (timeout, bad response, auth error): use fallback text
- If no activity in 7 days: fallback text
- If README markers not found: log error, exit 0 (don't fail action)

## GitHub Actions — All Workflows

### Snake Contribution
```yaml
name: Generate Snake
on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: Platane/snk@v3
        with:
          github_user_name: asepharyana
          outputs: |
            assets/generated/snake.svg?palette=github-dark
            assets/generated/snake-light.svg?palette=github-light
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update contribution snake [skip ci]"
```

> **Note:** GitHub stats cards (`github-readme-stats`, `github-readme-streak-stats`, `github-profile-trophy`) load dynamically at view time via `<img>` URLs — no Action needed. They're not committed files.

## Error Handling & Resilience

| Failure Mode | Detection | Recovery |
|---|---|---|
| LLM API down | HTTP error / timeout | Keep previous AI log content, log warning |
| GitHub API rate limited | 403/429 response | Wait & retry once, then skip |
| Snake generation fails | Action exit code | Previous snake SVG stays cached |
| README edit conflict | git push rejected | Retry on next cron trigger |
| No events in 7 days | Empty filtered data | Write fallback "No recent activity" message |
| Missing section markers | Script can't find delimiters | Append section, mark as degraded |
| API key missing from secrets | Empty env var | Graceful skip with Action annotation |

## Commit Strategy

- All auto-commits use `[skip ci]` suffix to prevent infinite Action loops
- Author: `github-actions[bot]`
- Human edits to README only via direct push — next Action run won't overwrite marker-delimited sections that have changed since last fetch (we always re-fetch and re-write between markers)
- The entire `<!--AI_ACTIVITY_START-->...</AI_ACTIVITY_END-->` block is owned by the script — any human edits inside it will be overwritten on next run

## Success Criteria

- [ ] README renders with all sections visible on profile
- [ ] AI Activity section updates autonomously every 6 hours
- [ ] Snake animation appears and animates on profile
- [ ] Stats cards show accurate GitHub data
- [ ] All social links point to correct URLs
- [ ] Dark mode renders correctly (no invisible text/images)
- [ ] All error states produce graceful fallbacks visible to viewers
- [ ] No actions fail silently — failures are logged and non-fatal
