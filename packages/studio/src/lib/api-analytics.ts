import { NextRequest } from "next/server";
import { config } from "./config";

/**
 * API Analytics for tracking AI agent access to PKP data
 *
 * In production (Vercel): Uses in-memory storage + console logging
 * In development: Also writes to file via the existing analytics system
 *
 * The in-memory stats are accessible via /api/analytics/stats
 */

interface ApiEvent {
  timestamp: string;
  event: "catalog_fetch" | "product_view" | "search";
  path: string;
  user_agent: string;
  ai_agent?: string;
  ip: string;
  referer?: string;
}

interface ApiStats {
  total_requests: number;
  by_agent: Record<string, number>;
  by_path: Record<string, number>;
  by_day: Record<string, number>;
  recent_events: ApiEvent[];
}

// Known AI User-Agents (comprehensive list)
const AI_AGENTS: Record<string, string> = {
  // OpenAI
  gptbot: "GPTBot (OpenAI)",
  chatgpt: "ChatGPT (OpenAI)",
  "oai-searchbot": "OpenAI SearchBot",
  // Anthropic
  claude: "Claude (Anthropic)",
  "claude-web": "Claude Web",
  anthropic: "Anthropic",
  // Google
  googlebot: "Googlebot",
  "google-extended": "Google AI (Gemini)",
  // Microsoft
  bingbot: "Bingbot",
  // Perplexity
  perplexitybot: "PerplexityBot",
  perplexity: "Perplexity AI",
  // Meta
  "meta-externalagent": "Meta AI",
  facebookbot: "FacebookBot",
  // Amazon
  amazonbot: "AmazonBot",
  // Apple
  applebot: "AppleBot",
  // Others
  cohere: "Cohere AI",
  "you.com": "You.com",
  youbot: "YouBot",
  diffbot: "Diffbot",
  bytespider: "ByteDance",
  ccbot: "Common Crawl",
};

// In-memory stats (resets on cold start, but that's OK for now)
const stats: ApiStats = {
  total_requests: 0,
  by_agent: {},
  by_path: {},
  by_day: {},
  recent_events: [],
};

const MAX_RECENT_EVENTS = 100;

/**
 * Detect AI agent from User-Agent string
 */
export function detectAIAgent(userAgent: string): string | undefined {
  const ua = userAgent.toLowerCase();

  for (const [key, name] of Object.entries(AI_AGENTS)) {
    if (ua.includes(key.toLowerCase())) {
      return name;
    }
  }

  // Generic bot detection
  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
    return "Unknown Bot";
  }

  return undefined;
}

/**
 * Track an API request
 * Non-blocking, errors are logged but don't affect the response
 */
export async function trackApiRequest(
  request: NextRequest,
  eventType: "catalog_fetch" | "product_view" | "search"
): Promise<void> {
  try {
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referer = request.headers.get("referer") || undefined;
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    const aiAgent = detectAIAgent(userAgent);
    const path = request.nextUrl.pathname;
    const timestamp = new Date().toISOString();
    const day = timestamp.split("T")[0];

    const event: ApiEvent = {
      timestamp,
      event: eventType,
      path,
      user_agent: userAgent,
      ai_agent: aiAgent,
      ip,
      referer,
    };

    // Update in-memory stats
    stats.total_requests++;

    const agentKey = aiAgent || "Human/Browser";
    stats.by_agent[agentKey] = (stats.by_agent[agentKey] || 0) + 1;
    stats.by_path[path] = (stats.by_path[path] || 0) + 1;
    stats.by_day[day] = (stats.by_day[day] || 0) + 1;

    // Keep recent events (circular buffer)
    stats.recent_events.push(event);
    if (stats.recent_events.length > MAX_RECENT_EVENTS) {
      stats.recent_events.shift();
    }

    // Log AI agent access (visible in Vercel logs)
    if (aiAgent) {
      console.log(
        `[PKP Analytics] AI Access: ${aiAgent} | Path: ${path} | IP: ${ip}`
      );
    }

    // In development, also use file-based tracking
    if (!config.isVercel) {
      const { trackEvent, getTrackingInfo } = await import("./analytics");
      const trackingInfo = getTrackingInfo(request);
      trackEvent({
        event: eventType,
        userAgent: trackingInfo.userAgent,
        ip: trackingInfo.ip,
        referer: trackingInfo.referer,
      });
    }
  } catch (error) {
    // Don't throw - tracking errors shouldn't break API responses
    console.error("[PKP Analytics] Tracking error:", error);
  }
}

/**
 * Get current stats (for the analytics dashboard)
 */
export function getApiStats(): ApiStats {
  return { ...stats };
}

/**
 * Get stats filtered by date range
 */
export function getApiStatsByDateRange(
  startDate: string,
  endDate: string
): ApiStats {
  const filtered: ApiStats = {
    total_requests: 0,
    by_agent: {},
    by_path: {},
    by_day: {},
    recent_events: [],
  };

  // Filter by_day
  for (const [day, count] of Object.entries(stats.by_day)) {
    if (day >= startDate && day <= endDate) {
      filtered.by_day[day] = count;
      filtered.total_requests += count;
    }
  }

  // Filter recent_events
  filtered.recent_events = stats.recent_events.filter((e) => {
    const day = e.timestamp.split("T")[0];
    return day >= startDate && day <= endDate;
  });

  // Recalculate by_agent and by_path from filtered events
  for (const event of filtered.recent_events) {
    const agentKey = event.ai_agent || "Human/Browser";
    filtered.by_agent[agentKey] = (filtered.by_agent[agentKey] || 0) + 1;
    filtered.by_path[event.path] = (filtered.by_path[event.path] || 0) + 1;
  }

  return filtered;
}
