const cache = new Map();

function ruleToRegExp(rule) {
  const escaped = rule
    .replace(/[.+?^${}()|[\]\\]/g, "\\$&")
    .replace(/\*/g, ".*");
  return new RegExp(`^${escaped}`);
}

function parseRobots(text) {
  const groups = [];
  let current = null;
  let lastWasAgent = false;

  for (const rawLine of String(text || "").split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const separator = line.indexOf(":");
    if (separator === -1) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();

    if (field === "user-agent") {
      if (!lastWasAgent || !current) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      lastWasAgent = true;
      continue;
    }

    lastWasAgent = false;
    if (!current) continue;
    if (field === "allow" || field === "disallow") {
      if (field === "disallow" && value === "") continue;
      current.rules.push({ allow: field === "allow", path: value, length: value.length, pattern: ruleToRegExp(value) });
    }
  }

  return groups;
}

function groupFor(groups, userAgent) {
  const agent = String(userAgent || "").toLowerCase();
  let wildcard = null;
  for (const group of groups) {
    for (const token of group.agents) {
      if (token === "*") {
        if (!wildcard) wildcard = group;
      } else if (token && agent.includes(token)) {
        return group;
      }
    }
  }
  return wildcard;
}

async function robotsFor(origin, userAgent, timeoutMs) {
  if (cache.has(origin)) return cache.get(origin);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  let groups = [];
  try {
    const response = await fetch(`${origin}/robots.txt`, {
      redirect: "follow",
      signal: controller.signal,
      headers: { "user-agent": userAgent, accept: "text/plain,*/*;q=0.8" }
    });
    if (response.ok) groups = parseRobots(await response.text());
  } catch {
    // Unreachable robots.txt is treated as allow-all; the point of this module
    // is honoring rules a site actually publishes.
  } finally {
    clearTimeout(timer);
  }
  cache.set(origin, groups);
  return groups;
}

export async function isAllowedByRobots(url, userAgent, timeoutMs = 8000) {
  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return true;
  }
  if (!/^https?:$/.test(parsed.protocol)) return true;

  const groups = await robotsFor(parsed.origin, userAgent, timeoutMs);
  const group = groupFor(groups, userAgent);
  if (!group) return true;

  const target = `${parsed.pathname}${parsed.search}`;
  let winner = null;
  for (const rule of group.rules) {
    if (!rule.pattern.test(target)) continue;
    if (!winner || rule.length > winner.length || (rule.length === winner.length && rule.allow && !winner.allow)) {
      winner = rule;
    }
  }
  return !winner || winner.allow;
}
