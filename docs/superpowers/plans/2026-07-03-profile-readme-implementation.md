# Ultimate Profile README Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the GitHub profile README into a dynamic, visually stunning page with AI-generated activity log, contribution snake animation, and comprehensive GitHub metrics.

**Architecture:** Static HTML-in-markdown layout with dynamic `github-readme-stats` SVG cards loaded at view time, plus two GitHub Actions workflows: one for contribution snake (daily cron), one for AI activity log (every 6h cron via Node.js script).

**Tech Stack:** Markdown + HTML (README), YAML (GitHub Actions), Node.js 20 (AI script), OpenAI-compatible LLM API

## Global Constraints

- GitHub username: `asepharyana`
- All auto-commits MUST use `[skip ci]` in commit message to prevent infinite action loops
- Auto-commit author MUST be `github-actions[bot]`
- AI API key, base URL, and model name stored as GitHub Actions secrets (not in code)
- Snake SVGs committed to git and referenced from README via relative path
- Section markers `<!--AI_ACTIVITY_START-->` / `<!--AI_ACTIVITY_END-->` delimit AI-generated content in README

---

### Task 1: Static README layout + .gitignore + assets scaffolding

**Files:**
- Create: `README.md`
- Create: `.gitignore`
- Create: `assets/generated/.gitkeep`

**Interfaces:**
- Consumes: nothing
- Produces: The full README visual surface; Section markers at `<!--AI_ACTIVITY_START-->..<!--AI_ACTIVITY_END-->` for Task 3; `<img>` snake path `assets/generated/snake.svg` for Task 2

- [ ] **Step 1: Create .gitignore**

```gitignore
# Node.js
node_modules/
npm-debug.log*
package-lock.json

# OS files
.DS_Store
Thumbs.db

# Environment (secrets template — actual secrets go to GitHub Actions)
.env
```

- [ ] **Step 2: Create assets/generated/.gitkeep**

```bash
mkdir -p assets/generated && touch assets/generated/.gitkeep
```

- [ ] **Step 3: Generate README header (banner, animated typing, visitor badge)**

Write to `README.md`:

```markdown
<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=200&section=header&text=Asep%20Haryana%20Saputra&fontSize=50&fontColor=fff&animation=fadeIn&fontAlignY=38&desc=AI%20Enthusiast%20|%20Mahasiswa%20|%20Developer&descAlignY=55&descAlign=50">
    <img src="https://capsule-render.vercel.app/api?type=waving&color=0:667eea,100:764ba2&height=200&section=header&text=Asep%20Haryana%20Saputra&fontSize=50&fontColor=333&animation=fadeIn&fontAlignY=38&desc=AI%20Enthusiast%20|%20Mahasiswa%20|%20Developer&descAlignY=55&descAlign=50" width="100%">
  </picture>
</div>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=500&size=22&pause=1000&color=667EEA&center=true&vCenter=true&random=false&width=435&lines=Building+the+future+with+AI+%F0%9F%9A%80;Always+learning%2C+always+building;Open+source+enthusiast" alt="Typing SVG" />
</p>

<p align="center">
  <img src="https://komarev.com/ghpvc/?username=asepharyana&color=667eea&style=flat-square&label=Profile+Visitors" alt="Visitor count" />
</p>
```

- [ ] **Step 4: Add Tech Stack badges section**

Append to `README.md`:

```markdown
## 🛠️ Tech Stack

<p align="center">
  <img src="https://img.shields.io/badge/Go-00ADD8?style=for-the-badge&logo=go&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" />
  <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=nextdotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/LangChain-1C3C3C?style=for-the-badge&logo=langchain&logoColor=white" />
  <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
  <img src="https://img.shields.io/badge/PyTorch-EE4C2C?style=for-the-badge&logo=pytorch&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Git-F05032?style=for-the-badge&logo=git&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
</p>
```

- [ ] **Step 5: Add GitHub Stats dashboard (3-column layout + trophies)**

Append to `README.md`:

```markdown
## 📊 GitHub Analytics

<p align="center">
  <a href="https://github.com/asepharyana">
    <img height="180em" src="https://github-readme-stats.vercel.app/api?username=asepharyana&show_icons=true&theme=tokyonight&hide_border=true&include_all_commits=true&count_private=true" />
    <img height="180em" src="https://github-readme-streak-stats.herokuapp.com/?user=asepharyana&theme=tokyonight&hide_border=true" />
    <img height="180em" src="https://github-readme-stats.vercel.app/api/top-langs/?username=asepharyana&layout=compact&theme=tokyonight&hide_border=true&langs_count=8" />
  </a>
</p>

<p align="center">
  <a href="https://github.com/asepharyana">
    <img src="https://github-profile-trophy.vercel.app/?username=asepharyana&theme=tokyonight&no-frame=true&row=1&column=7&margin-w=15" />
  </a>
</p>
```

- [ ] **Step 6: Add AI Activity Log section (with dynamic markers)**

Append to `README.md`:

```markdown
## 🤖 AI Activity Log

> *Aktivitas GitHub terbaru, dirangkum oleh AI*

<!--AI_ACTIVITY_START-->
<p align="center">
  <i>▸ Menunggu aktivitas pertama... 🚀</i>
</p>
<!--AI_ACTIVITY_END-->
```

- [ ] **Step 7: Add Contribution Snake section**

Append to `README.md`:

```markdown
## 🐍 Contribution Graph

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/generated/snake-dark.svg" />
  <source media="(prefers-color-scheme: light)" srcset="assets/generated/snake-light.svg" />
  <img alt="Contribution snake animation" src="assets/generated/snake-dark.svg" />
</picture>
```

- [ ] **Step 8: Add Connect / Footer section**

Append to `README.md`:

```markdown
## 📫 Let's Connect

<p align="center">
  <a href="https://asepharyana.my.id/">
    <img src="https://img.shields.io/badge/Website-asepharyana.my.id-667eea?style=for-the-badge&logo=google-chrome&logoColor=white" />
  </a>
  <a href="https://www.linkedin.com/in/asep-haryana-saputra-2014a5294/">
    <img src="https://img.shields.io/badge/LinkedIn-asep%20haryana%20saputra-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white" />
  </a>
  <a href="mailto:asepharyanasaputra@gmail.com">
    <img src="https://img.shields.io/badge/Email-asepharyanasaputra@gmail.com-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
  </a>
</p>

---

<p align="center">
  <img src="https://quotes-github-readme.vercel.app/api?type=horizontal&theme=tokyonight" />
</p>

<p align="center">
  <i>Made with ❤️ and lots of ☕</i>
</p>
```

- [ ] **Step 9: Commit all static files**

```bash
git add .gitignore assets/generated/.gitkeep README.md
git commit -m "feat: initial profile README with static layout"
```

---

### Task 2: Contribution snake GitHub Action

**Files:**
- Create: `.github/workflows/snake.yml`

**Interfaces:**
- Consumes: `assets/generated/snake-dark.svg`, `assets/generated/snake-light.svg` (creates them)
- Produces: Snake SVGs committed to `assets/generated/`

- [ ] **Step 1: Create workflows directory**

```bash
mkdir -p .github/workflows
```

- [ ] **Step 2: Create snake.yml workflow**

Write to `.github/workflows/snake.yml`:

```yaml
name: Generate Snake

on:
  schedule:
    - cron: "0 0 * * *"
  workflow_dispatch:

permissions:
  contents: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Generate Snake (Dark)
        uses: Platane/snk/svg-only@v3
        with:
          github_user_name: asepharyana
          outputs: |
            assets/generated/snake-dark.svg?palette=github-dark

      - name: Generate Snake (Light)
        uses: Platane/snk/svg-only@v3
        with:
          github_user_name: asepharyana
          outputs: |
            assets/generated/snake-light.svg?palette=github-light

      - name: Push to repo
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update contribution snake [skip ci]"
          file_pattern: assets/generated/snake-*.svg
```

- [ ] **Step 3: Commit snake workflow**

```bash
git add .github/workflows/snake.yml
git commit -m "feat: add contribution snake GitHub Action"
```

---

### Task 3: AI Activity log script + workflow

**Files:**
- Create: `scripts/generate-ai-blog.js`
- Create: `.github/workflows/ai-activity.yml`

**Interfaces:**
- Consumes: README markers `<!--AI_ACTIVITY_START-->` / `<!--AI_ACTIVITY_END-->` from Task 1
- Produces: Updated AI content between markers in README.md
- Uses GH Actions secrets: `AI_LLM_API_KEY`, `AI_LLM_BASE_URL`, `AI_LLM_MODEL`
- Uses implicit `GITHUB_TOKEN` for GitHub API access

- [ ] **Step 1: Create scripts directory**

```bash
mkdir -p scripts
```

- [ ] **Step 2: Write generate-ai-blog.js**

Write to `scripts/generate-ai-blog.js`:

```javascript
// scripts/generate-ai-blog.js
// Fetches recent GitHub activity → summarizes via LLM → updates README.md markers
const https = require("https");
const fs = require("fs");
const path = require("path");

// ── Configuration ───────────────────────────────────────────────
const GITHUB_USER = "asepharyana";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const AI_API_KEY = process.env.AI_LLM_API_KEY || "";
const AI_BASE_URL = (process.env.AI_LLM_BASE_URL || "").replace(/\/+$/, "");
const AI_MODEL = process.env.AI_LLM_MODEL || "text";
const README_PATH = path.join(__dirname, "..", "README.md");
const MARKER_START = "<!--AI_ACTIVITY_START-->";
const MARKER_END = "<!--AI_ACTIVITY_END-->";
const EVENTS_DAYS_BACK = 7;
const MAX_EVENTS = 100;

// ── Helpers ─────────────────────────────────────────────────────

/** Minimal HTTPS fetch returning body string */
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: options.headers || {} }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error("Request timeout")); });
  });
}

/** Post JSON to URL and return parsed response */
function postJSON(url, body, headers = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const data = JSON.stringify(body);
    const opts = {
      hostname: urlObj.hostname,
      port: urlObj.port || 443,
      path: urlObj.pathname + urlObj.search,
      method: "POST",
      headers: { "Content-Type": "application/json", ...headers },
    };
    const req = https.request(opts, (res) => {
      let raw = "";
      res.on("data", (chunk) => (raw += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data: raw }));
    });
    req.on("error", reject);
    req.setTimeout(30000, () => { req.destroy(); reject(new Error("LLM request timeout")); });
    req.write(data);
    req.end();
  });
}

/** Check if event happened within the last N days */
function isRecent(createdAt, days) {
  const then = new Date(createdAt).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return then >= cutoff;
}

/** Format a single event into readable text */
function formatEvent(event) {
  const repo = event.repo?.name || "unknown";
  switch (event.type) {
    case "PushEvent": {
      const branch = (event.payload?.ref || "").replace("refs/heads/", "");
      const commits = event.payload?.commits || [];
      const msgs = commits.slice(0, 3).map((c) => c.message?.split("\n")[0] || "no message").filter(Boolean);
      return `• Push ${commits.length} commit${commits.length > 1 ? "s" : ""} ke \`${repo}\` (${branch}): ${msgs.join("; ")}`;
    }
    case "CreateEvent": {
      const refType = event.payload?.ref_type || "";
      const ref = event.payload?.ref || refType;
      return `• Membuat ${refType} baru: \`${ref}\` di \`${repo}\``;
    }
    case "PullRequestEvent": {
      const action = event.payload?.action || "";
      const title = event.payload?.pull_request?.title || "";
      return `• ${action === "opened" ? "Open" : action === "closed" && event.payload?.pull_request?.merged ? "Merge" : action} PR: "${title}" di \`${repo}\``;
    }
    case "IssuesEvent": {
      const action = event.payload?.action || "";
      const title = event.payload?.issue?.title || "";
      return `• ${action.charAt(0).toUpperCase() + action.slice(1)} issue: "${title}" di \`${repo}\``;
    }
    case "WatchEvent":
      return `• ⭐ Star \`${repo}\``;
    case "ForkEvent":
      return `• 🍴 Fork \`${repo}\``;
    default:
      return `• ${event.type} di \`${repo}\``;
  }
}

/** Deduplicate events: group same repo + type, limit to 8 entries */
function deduplicate(events) {
  const seen = new Set();
  const result = [];
  for (const ev of events) {
    const key = `${ev.type}:${ev.repo?.name}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(ev);
      if (result.length >= 8) break;
    }
  }
  return result;
}

// ── Main ────────────────────────────────────────────────────────

async function main() {
  console.log("[AI Blog] Starting...");

  // 1. Fetch GitHub events
  if (!GITHUB_TOKEN) {
    console.log("[AI Blog] No GITHUB_TOKEN, skipping activity fetch");
    writeFallback();
    return;
  }

  const eventsUrl = `https://api.github.com/users/${GITHUB_USER}/events?per_page=${MAX_EVENTS}`;
  const { status, data } = await fetch(eventsUrl, {
    headers: {
      "User-Agent": "generate-ai-blog",
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github.v3+json",
    },
  });

  if (status !== 200) {
    console.log(`[AI Blog] GitHub API returned ${status}, keeping existing content`);
    return;
  }

  let events;
  try {
    events = JSON.parse(data);
  } catch {
    console.log("[AI Blog] Failed to parse GitHub API response");
    writeFallback();
    return;
  }

  if (!Array.isArray(events) || events.length === 0) {
    console.log("[AI Blog] No events found");
    writeFallback();
    return;
  }

  // 2. Filter to recent + relevant event types
  const recent = events.filter(
    (e) =>
      isRecent(e.created_at, EVENTS_DAYS_BACK) &&
      ["PushEvent", "CreateEvent", "PullRequestEvent", "IssuesEvent", "WatchEvent", "ForkEvent"].includes(e.type)
  );

  if (recent.length === 0) {
    console.log("[AI Blog] No recent activity found");
    writeFallback();
    return;
  }

  // 3. Format and deduplicate
  const deduped = deduplicate(recent);
  const formatted = deduped.map(formatEvent).join("\n");
  console.log(`[AI Blog] Found ${deduped.length} unique events:\n${formatted}`);

  // 4. Build LLM prompt
  const prompt = `Buat summary aktivitas GitHub dalam bahasa Indonesia kasual, maksimal 3 kalimat, pakai emoji. Jangan pake format list. Langsung kontennya aja, tanpa intro:\n\n${formatted}`;

  // 5. Call LLM
  if (!AI_API_KEY) {
    console.log("[AI Blog] No AI_API_KEY, using raw activity text");
    writeContent(formatted, formatted);
    return;
  }

  const chatUrl = `${AI_BASE_URL}/chat/completions`;
  const payload = {
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  };

  console.log(`[AI Blog] Calling LLM at ${AI_BASE_URL}...`);
  let llmResult;
  try {
    const llmResp = await postJSON(chatUrl, payload, {
      Authorization: `Bearer ${AI_API_KEY}`,
    });
    console.log(`[AI Blog] LLM response status: ${llmResp.status}`);

    if (llmResp.status === 200) {
      const parsed = JSON.parse(llmResp.data);
      llmResult = parsed.choices?.[0]?.message?.content?.trim();
    }
  } catch (err) {
    console.log(`[AI Blog] LLM call failed: ${err.message}`);
  }

  const summary = llmResult || formatted.slice(0, 300);
  writeContent(summary, formatted);
}

/** Write content between README markers. Falls back to raw events if LLM fails. */
function writeContent(summary, rawFallback) {
  if (!fs.existsSync(README_PATH)) {
    console.error(`[AI Blog] README.md not found at ${README_PATH}`);
    process.exit(0);
  }

  let readme = fs.readFileSync(README_PATH, "utf-8");
  const startIdx = readme.indexOf(MARKER_START);
  const endIdx = readme.indexOf(MARKER_END);

  if (startIdx === -1 || endIdx === -1) {
    console.error("[AI Blog] Section markers not found in README.md");
    process.exit(0);
  }

  const before = readme.slice(0, startIdx + MARKER_START.length);
  const after = readme.slice(endIdx);
  const middle = `\n\n<p align="center">\n  <i>${summary}</i>\n</p>\n\n`;
  const newReadme = before + middle + after;

  fs.writeFileSync(README_PATH, newReadme, "utf-8");
  console.log(`[AI Blog] README.md updated successfully`);
}

/** Write fallback text when no activity is found */
function writeFallback() {
  const fallback = "▸ Belum ada aktivitas GitHub dalam 7 hari terakhir. Pantau terus! 🚀";
  writeContent(fallback, fallback);
}

main().catch((err) => {
  console.error(`[AI Blog] Error: ${err.message}`);
  process.exit(0);
});
```

- [ ] **Step 3: Create ai-activity.yml workflow**

Write to `.github/workflows/ai-activity.yml`:

```yaml
name: AI Activity Log

on:
  schedule:
    - cron: "0 */6 * * *"
  push:
    branches: [main]
  workflow_dispatch:

permissions:
  contents: write

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install dependencies
        run: npm install --save-dev prettier

      - name: Generate AI activity log
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          AI_LLM_API_KEY: ${{ secrets.AI_LLM_API_KEY }}
          AI_LLM_BASE_URL: ${{ secrets.AI_LLM_BASE_URL }}
          AI_LLM_MODEL: ${{ secrets.AI_LLM_MODEL }}
        run: node scripts/generate-ai-blog.js

      - name: Format README
        run: npx prettier --write README.md || true

      - name: Commit changes
        uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: "chore: update AI activity log [skip ci]"
          file_pattern: README.md
```

- [ ] **Step 4: Create package.json (for prettier dependency)**

```json
{
  "name": "profile-readme",
  "private": true,
  "scripts": {
    "generate-ai": "node scripts/generate-ai-blog.js"
  }
}
```

- [ ] **Step 5: Commit all AI activity files**

```bash
git add scripts/generate-ai-blog.js .github/workflows/ai-activity.yml package.json
git commit -m "feat: add AI-powered activity log"
```

---

### Task 4: Final push & setup instructions

**Files:** None (documentation + user action)

- [ ] **Step 1: Push everything to GitHub**

```bash
git push origin main
```

- [ ] **Step 2: Add secrets to GitHub repository**

User needs to add these secrets via GitHub.com → Settings → Secrets and variables → Actions:

| Secret | Value |
|---|---|
| `AI_LLM_API_KEY` | `sk-5dd268d88adb496b-818beb-6bc7498e` |
| `AI_LLM_BASE_URL` | `https://omniroute.imrnes.team/v1` |
| `AI_LLM_MODEL` | `text` |

- [ ] **Step 3: Trigger initial runs**

After secrets are set, manually trigger both workflows from GitHub Actions tab:
1. `Generate Snake` → verify snake SVGs appear in `assets/generated/`
2. `AI Activity Log` → verify README updates with AI summary
