// scripts/generate-ai-blog.js
// Fetches recent GitHub activity -> summarizes via LLM -> updates README.md markers
const https = require("https");
const fs = require("fs");
const path = require("path");

// -- Configuration ----------------------------------------------
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

// -- HTTP Helpers -----------------------------------------------

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

function authHeaders() {
  return {
    "User-Agent": "generate-ai-blog",
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: "application/vnd.github.v3+json",
  };
}

function isRecent(createdAt, days) {
  const then = new Date(createdAt).getTime();
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return then >= cutoff;
}

// -- Fetch real commit data via Compare API --
// /users/{user}/events PushEvent payload does NOT include commits[] or size.
// We must call the Compare API to get actual commit count + messages.
async function fetchCommitData(repoFullName, beforeSha, headSha) {
  const url = `https://api.github.com/repos/${repoFullName}/compare/${beforeSha}...${headSha}`;
  try {
    const { status, data } = await fetch(url, { headers: authHeaders() });
    if (status !== 200) return null;
    const parsed = JSON.parse(data);
    const total = parsed.total_commits || 0;
    const msgs = (parsed.commits || [])
      .slice(0, 3)
      .map((c) => c.commit?.message?.split("\n")[0] || "")
      .filter(Boolean);
    return { total, messages: msgs };
  } catch {
    return null;
  }
}

// -- Enrich all PushEvents with real commit data --
async function enrichPushEvents(events) {
  const results = [];
  for (const ev of events) {
    if (ev.type === "PushEvent") {
      const repo = ev.repo?.name;
      const before = ev.payload?.before;
      const head = ev.payload?.head;
      if (repo && before && head && before !== head) {
        const data = await fetchCommitData(repo, before, head);
        if (data) {
          results.push({ ...ev, _commitData: data });
          continue;
        }
      }
      // If Compare API fails, skip this PushEvent entirely (no data to show)
      continue;
    }
    results.push(ev);
  }
  return results;
}

// -- Format a single event into readable text --
function formatEvent(event) {
  const repo = event.repo?.name || "unknown";
  switch (event.type) {
    case "PushEvent": {
      const branch = (event.payload?.ref || "").replace("refs/heads/", "");
      const cd = event._commitData;
      if (!cd || cd.total === 0) return null; // no data to show
      const label = `${cd.total} commit${cd.total > 1 ? "s" : ""}`;
      if (cd.messages.length > 0) {
        return `• Push ${label} ke \`${repo}\` (${branch}): ${cd.messages.join("; ")}`;
      }
      return `• Push ${label} ke \`${repo}\` (${branch})`;
    }
    case "CreateEvent": {
      const refType = event.payload?.ref_type || "";
      const ref = event.payload?.ref || refType;
      if (refType === "branch") return null;
      return `• Membuat ${refType} baru: \`${ref}\` di \`${repo}\``;
    }
    case "PullRequestEvent": {
      const action = event.payload?.action || "";
      const merged = event.payload?.pull_request?.merged || false;
      const title = event.payload?.pull_request?.title || "";
      let label = action;
      if (action === "opened") label = "Open";
      else if (action === "closed" && merged) label = "Merge";
      else if (action === "closed") label = "Tutup";
      return `• ${label} PR: "${title}" di \`${repo}\``;
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

// -- Main -------------------------------------------------------

async function main() {
  const start = Date.now();
  console.log("[AI Blog] Starting...");

  if (!GITHUB_TOKEN) {
    console.log("[AI Blog] No GITHUB_TOKEN, skipping");
    writeFallback();
    return;
  }

  // 1. Fetch raw events
  const { status, data } = await fetch(
    `https://api.github.com/users/${GITHUB_USER}/events?per_page=${MAX_EVENTS}`,
    { headers: authHeaders() }
  );

  if (status !== 200) {
    console.log(`[AI Blog] GitHub API returned ${status}, keeping existing content`);
    return;
  }

  let events;
  try { events = JSON.parse(data); } catch { writeFallback(); return; }
  if (!Array.isArray(events) || events.length === 0) { writeFallback(); return; }

  // 2. Filter: recent + relevant types + exclude profile repo
  const profileRepo = `${GITHUB_USER}/${GITHUB_USER}`;
  const relevantTypes = ["PushEvent", "CreateEvent", "PullRequestEvent", "IssuesEvent", "WatchEvent", "ForkEvent"];
  const recent = events.filter(
    (e) => isRecent(e.created_at, EVENTS_DAYS_BACK) && relevantTypes.includes(e.type) && e.repo?.name !== profileRepo
  );
  if (recent.length === 0) { console.log("[AI Blog] No recent activity"); writeFallback(); return; }

  // 3. Deduplicate
  const deduped = deduplicate(recent);

  // 4. Enrich PushEvents with real commit data (calls Compare API)
  const enriched = await enrichPushEvents(deduped);

  // 5. Format
  const formatted = enriched.map(formatEvent).filter(Boolean).join("\n");
  if (!formatted) { console.log("[AI Blog] No meaningful activity"); writeFallback(); return; }

  console.log(`[AI Blog] ${enriched.length} events enriched in ${Date.now() - start}ms:\n${formatted}`);

  // 6. Build LLM prompt
  const prompt = `Buat summary aktivitas GitHub dalam bahasa Indonesia kasual, maksimal 3 kalimat, pakai emoji. Jangan pake format list. Langsung kontennya aja:\n\n${formatted}`;

  // 7. Call LLM
  if (!AI_API_KEY) { writeContent(formatted); return; }

  const payload = {
    model: AI_MODEL,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 300,
    temperature: 0.7,
  };

  console.log(`[AI Blog] Calling LLM at ${AI_BASE_URL}...`);
  let llmResult;
  try {
    const resp = await postJSON(`${AI_BASE_URL}/chat/completions`, payload, { Authorization: `Bearer ${AI_API_KEY}` });
    console.log(`[AI Blog] LLM response status: ${resp.status}`);
    if (resp.status === 200) {
      const parsed = JSON.parse(resp.data);
      llmResult = parsed.choices?.[0]?.message?.content?.trim();
    }
  } catch (err) {
    console.log(`[AI Blog] LLM call failed: ${err.message}`);
  }
  writeContent(llmResult || formatted.slice(0, 300));
}

function writeContent(summary) {
  if (!fs.existsSync(README_PATH)) { console.error(`[AI Blog] README.md not found`); process.exit(0); }
  let readme = fs.readFileSync(README_PATH, "utf-8");
  const startIdx = readme.indexOf(MARKER_START);
  const endIdx = readme.indexOf(MARKER_END);
  if (startIdx === -1 || endIdx === -1) { console.error("[AI Blog] Markers not found"); process.exit(0); }
  const before = readme.slice(0, startIdx + MARKER_START.length);
  const after = readme.slice(endIdx);
  const middle = `\n\n<p align="center">\n  <i>${escapeHtml(summary)}</i>\n</p>\n\n`;
  fs.writeFileSync(README_PATH, before + middle + after, "utf-8");
  console.log("[AI Blog] README.md updated successfully");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function writeFallback() {
  writeContent("▸ Belum ada aktivitas GitHub dalam 7 hari terakhir. Pantau terus! 🚀");
}

main().catch((err) => {
  console.error(`[AI Blog] Error: ${err.message}`);
  process.exit(0);
});
