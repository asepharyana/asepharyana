// scripts/update-techstack.js
// Fetches repos and topics from GitHub API -> generates shields.io badges -> updates README markers
const https = require("https");
const fs = require("fs");
const path = require("path");

// -- Configuration ----------------------------------------------
const GITHUB_USER = "asepharyana";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN || "";
const README_PATH = path.join(__dirname, "..", "README.md");
const MARKER_START = "<!--TECH_STACK_START-->";
const MARKER_END = "<!--TECH_STACK_END-->";
const MAX_BADGES = 16;

// Map of known repo topics/languages -> shields.io badge config
const BADGE_MAP = {
  // Languages
  Go:                 { label: "Go",          color: "00ADD8",    logo: "go" },
  Python:             { label: "Python",      color: "3776AB",    logo: "python" },
  TypeScript:         { label: "TypeScript",  color: "3178C6",    logo: "typescript" },
  JavaScript:         { label: "JavaScript",  color: "F7DF1E",    logo: "javascript",    logoColor: "black" },
  Rust:               { label: "Rust",        color: "000000",    logo: "rust" },
  Java:               { label: "Java",        color: "ED8B00",    logo: "openjdk" },
  Kotlin:             { label: "Kotlin",      color: "7F52FF",    logo: "kotlin" },
  C:                  { label: "C",           color: "A8B9CC",    logo: "c" },
  "C++":              { label: "C++",         color: "00599C",    logo: "cplusplus" },
  "C#":               { label: "C#",          color: "239120",    logo: "csharp" },
  PHP:                { label: "PHP",         color: "777BB4",    logo: "php" },
  Ruby:               { label: "Ruby",        color: "CC342D",    logo: "ruby" },
  Swift:              { label: "Swift",       color: "F05138",    logo: "swift" },
  Dart:               { label: "Dart",        color: "0175C2",    logo: "dart" },
  Lua:                { label: "Lua",         color: "2C2D72",    logo: "lua" },
  Shell:              { label: "Shell",       color: "4EAA25",    logo: "gnubash" },
  HTML:               { label: "HTML",        color: "E34F26",    logo: "html5" },
  CSS:                { label: "CSS",         color: "1572B6",    logo: "css3" },
  SCSS:               { label: "SCSS",        color: "CC6699",    logo: "sass" },
  Jupyter:            { label: "Jupyter",     color: "F37626",    logo: "jupyter" },
  Dockerfile:         { label: "Docker",      color: "2496ED",    logo: "docker" },
  Solidity:           { label: "Solidity",    color: "363636",    logo: "solidity" },
  Zig:                { label: "Zig",         color: "F7A41D",    logo: "zig" },

  // Frameworks & Tools (detected from topics or repo context)
  react:              { label: "React",       color: "61DAFB",    logo: "react",          logoColor: "black" },
  nextjs:             { label: "Next.js",     color: "000000",    logo: "nextdotjs" },
  "next.js":          { label: "Next.js",     color: "000000",    logo: "nextdotjs" },
  vue:                { label: "Vue.js",      color: "4FC08D",    logo: "vuedotjs" },
  svelte:             { label: "Svelte",      color: "FF3E00",    logo: "svelte" },
  angular:            { label: "Angular",     color: "DD0031",    logo: "angular" },
  tailwindcss:        { label: "Tailwind",    color: "06B6D4",    logo: "tailwindcss" },
  "tailwind css":     { label: "Tailwind",    color: "06B6D4",    logo: "tailwindcss" },
  nodejs:             { label: "Node.js",     color: "5FA04E",    logo: "nodedotjs" },
  "node.js":          { label: "Node.js",     color: "5FA04E",    logo: "nodedotjs" },
  express:            { label: "Express",     color: "000000",    logo: "express" },
  django:             { label: "Django",      color: "092E20",    logo: "django" },
  flask:              { label: "Flask",       color: "000000",    logo: "flask" },
  fastapi:            { label: "FastAPI",     color: "009688",    logo: "fastapi" },
  spring:             { label: "Spring",      color: "6DB33F",    logo: "spring" },
  laravel:            { label: "Laravel",     color: "FF2D20",    logo: "laravel" },
  rails:              { label: "Rails",       color: "D30001",    logo: "rubyonrails" },
  "ruby on rails":    { label: "Rails",       color: "D30001",    logo: "rubyonrails" },
  dotnet:             { label: ".NET",        color: "512BD4",    logo: "dotnet" },
  flutter:            { label: "Flutter",     color: "02569B",    logo: "flutter" },
  tensorflow:         { label: "TensorFlow",  color: "FF6F00",    logo: "tensorflow" },
  pytorch:            { label: "PyTorch",     color: "EE4C2C",    logo: "pytorch" },
  "machine-learning": { label: "ML/AI",       color: "01BFFF",    logo: "tensorflow" }, // generic ML
  "deep-learning":    { label: "Deep Learning", color: "EE4C2C",  logo: "pytorch" },
  "natural-language-processing":
                      { label: "NLP",         color: "01BFFF",    logo: "googlenatural language" },
  "large-language-model":
                      { label: "LLM",         color: "412991",    logo: "googlegemini" },
  llm:                { label: "LLM",         color: "412991",    logo: "googlegemini" },
  langchain:          { label: "LangChain",   color: "1C3C3C",    logo: "langchain" },
  rag:                { label: "RAG",         color: "FF6B35",    logo: "googlegemini" },
  openai:             { label: "OpenAI",      color: "412991",    logo: "openai" },
  ai:                 { label: "AI",          color: "667eea",    logo: "googlegemini" },
  docker:             { label: "Docker",      color: "2496ED",    logo: "docker" },
  kubernetes:         { label: "Kubernetes",  color: "326CE5",    logo: "kubernetes" },
  k8s:                { label: "Kubernetes",  color: "326CE5",    logo: "kubernetes" },
  terraform:          { label: "Terraform",   color: "844FBA",    logo: "terraform" },
  postgresql:         { label: "PostgreSQL",  color: "4169E1",    logo: "postgresql" },
  postgres:           { label: "PostgreSQL",  color: "4169E1",    logo: "postgresql" },
  mysql:              { label: "MySQL",       color: "4479A1",    logo: "mysql" },
  mongodb:            { label: "MongoDB",     color: "47A248",    logo: "mongodb" },
  redis:              { label: "Redis",       color: "FF4438",    logo: "redis" },
  graphql:            { label: "GraphQL",     color: "E10098",    logo: "graphql" },
  grpc:               { label: "gRPC",        color: "244C5E",    logo: "grpc" },
  nginx:              { label: "Nginx",       color: "009639",    logo: "nginx" },
  githubactions:      { label: "GitHub Actions", color: "2088FF", logo: "githubactions" },
  "ci/cd":            { label: "CI/CD",       color: "2088FF",    logo: "githubactions" },
  linux:              { label: "Linux",       color: "FCC624",    logo: "linux",          logoColor: "black" },
  git:                { label: "Git",         color: "F05032",    logo: "git" },
};

// -- Helpers ----------------------------------------------------

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

function fetchAllPages(url, token) {
  const results = [];
  const headers = {
    "User-Agent": "update-techstack",
    Accept: "application/vnd.github.v3+json",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return (function next(pageUrl) {
    return fetch(pageUrl, { headers }).then(({ status, data }) => {
      if (status !== 200) {
        console.log(`GitHub API returned ${status}, stopping pagination`);
        return results;
      }
      const page = JSON.parse(data);
      results.push(...page);
      // Check for Link header to find next page
      // We don't have direct header access in our simple fetch, so we use a different approach:
      // parse the response array length as signal
      if (page.length === 100) {
        const urlObj = new URL(pageUrl);
        const perPage = parseInt(urlObj.searchParams.get("per_page") || "100");
        const currentPage = parseInt(urlObj.searchParams.get("page") || "1");
        if (page.length >= perPage) {
          urlObj.searchParams.set("page", String(currentPage + 1));
          return next(urlObj.toString());
        }
      }
      return results;
    });
  })(url);
}

function toBadgeHtml(cfg) {
  const logoColor = cfg.logoColor ? `&logoColor=${cfg.logoColor}` : "";
  return `<img src="https://img.shields.io/badge/${encodeURIComponent(cfg.label)}-${cfg.color}?style=for-the-badge&logo=${cfg.logo}${logoColor}" />`;
}

// -- Main -------------------------------------------------------

async function main() {
  console.log("[TechStack] Starting...");

  if (!GITHUB_TOKEN) {
    console.log("[TechStack] No GITHUB_TOKEN, keeping existing content");
    return;
  }

  // 1. Fetch all repos (up to 100 per page, auto-paginate)
  const reposUrl = `https://api.github.com/users/${GITHUB_USER}/repos?per_page=100&sort=updated&type=all`;
  const repos = await fetchAllPages(reposUrl, GITHUB_TOKEN);

  if (!repos || repos.length === 0) {
    console.log("[TechStack] No repos found");
    return;
  }

  console.log(`[TechStack] Found ${repos.length} repos`);

  // 2. Aggregate languages with byte counts from each repo
  const langByteMap = {};
  const topicSet = new Set();

  for (const repo of repos) {
    // Collect topics
    const topics = repo.topics || [];
    for (const t of topics) topicSet.add(t.toLowerCase());

    // Collect primary language
    if (repo.language) {
      const lang = repo.language;
      langByteMap[lang] = (langByteMap[lang] || 0) + 1; // count repos using this language
    }
  }

  // 3. Build tech set: languages + topic-detected tools
  const techSet = new Map(); // key -> {cfg, priority}

  // Add languages first (sorted by repo count)
  const sortedLangs = Object.entries(langByteMap).sort((a, b) => b[1] - a[1]);
  for (const [lang] of sortedLangs) {
    if (BADGE_MAP[lang]) {
      techSet.set(lang, { cfg: BADGE_MAP[lang], priority: 1 });
    }
  }

  // Add topic-detected technologies
  for (const topic of topicSet) {
    if (BADGE_MAP[topic]) {
      const key = BADGE_MAP[topic].label;
      // Don't replace a language badge with a topic badge of same label
      if (!techSet.has(key) || techSet.get(key).priority > 0) {
        techSet.set(key, { cfg: BADGE_MAP[topic], priority: 0 });
      }
    }
  }

  // 4. Sort: first languages (priority 1), then topic-detected, limit to MAX_BADGES
  const sorted = [...techSet.entries()]
    .sort((a, b) => a[1].priority - b[1].priority)
    .slice(0, MAX_BADGES);

  // 5. Generate HTML
  const badges = sorted.map(([, v]) => toBadgeHtml(v.cfg)).join("\n  ");
  const techHtml = `<p align="center">\n  ${badges}\n</p>`;

  // 6. Update README
  if (!fs.existsSync(README_PATH)) {
    console.error(`[TechStack] README.md not found at ${README_PATH}`);
    return;
  }

  let readme = fs.readFileSync(README_PATH, "utf-8");
  const startIdx = readme.indexOf(MARKER_START);
  const endIdx = readme.indexOf(MARKER_END);

  if (startIdx === -1 || endIdx === -1) {
    console.error("[TechStack] Section markers not found in README.md");
    return;
  }

  const before = readme.slice(0, startIdx + MARKER_START.length);
  const after = readme.slice(endIdx);
  const middle = `\n\n${techHtml}\n\n`;
  const newReadme = before + middle + after;

  fs.writeFileSync(README_PATH, newReadme, "utf-8");
  console.log(`[TechStack] README.md updated with ${sorted.length} badges`);
}

main().catch((err) => {
  console.error(`[TechStack] Error: ${err.message}`);
  process.exit(0);
});
