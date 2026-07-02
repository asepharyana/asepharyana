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

// -- Helpers ----------------------------------------------------

/** Minimal HTTPS fetch returning body string */
function fetch(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: options.headers || {} }, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, data }));
    });
    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
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
    req.setTimeout(30000, () => {
      req.destroy();
      reject(new Error("LLM request timeout"));
    });
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
      const size = event.payload?.size || commits.length;
      const msgs = commits
        .slice(0, 3)
        .map((c) => c.message?.split("\n")[0] || "no message")
        .filter(Boolean);
      const countLabel = `${size} commit${size > 1 ? "s" : ""}`;
      if (msgs.length > 0) {
        return `• Push ${countLabel} ke \`${repo}\` (${branch}): ${msgs.join("; ")}`;
      }
      return `• Push ${countLabel} ke \`${repo}\` (${branch})`;
    }
    case "CreateEvent": {
      const refType = event.payload?.ref_type || "";
      const ref = event.payload?.ref || refType;
      // Skip branch creations (usually noisy — CI/initial setup)
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

// -- Main -------------------------------------------------------

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

  // 2. Filter: recent + relevant event types, and exclude profile repo itself
  const profileRepo = `${GITHUB_USER}/${GITHUB_USER}`;
  const relevantTypes = ["PushEvent", "CreateEvent", "PullRequestEvent", "IssuesEvent", "WatchEvent", "ForkEvent"];
  const recent = events.filter(
    (e) =>
      isRecent(e.created_at, EVENTS_DAYS_BACK) &&
      relevantTypes.includes(e.type) &&
      e.repo?.name !== profileRepo
  );

  if (recent.length === 0) {
    console.log("[AI Blog] No recent activity found");
    writeFallback();
    return;
  }

  // 3. Format and deduplicate
  const deduped = deduplicate(recent);
  const formatted = deduped
    .map(formatEvent)
    .filter(Boolean)
    .join("\n");

  if (!formatted) {
    console.log("[AI Blog] No meaningful activity after filtering");
    writeFallback();
    return;
  }
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

/** Write content between README markers */
function writeContent(summary) {
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
  console.log("[AI Blog] README.md updated successfully");
}

/** Write fallback text when no activity is found */
function writeFallback() {
  const fallback = "▸ Belum ada aktivitas GitHub dalam 7 hari terakhir. Pantau terus! 🚀";
  writeContent(fallback);
}

main().catch((err) => {
  console.error(`[AI Blog] Error: ${err.message}`);
  process.exit(0);
});
