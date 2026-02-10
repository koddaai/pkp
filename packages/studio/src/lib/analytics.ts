import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { config } from "./config";

interface TrackEvent {
  timestamp: string;
  event: "product_view" | "catalog_fetch" | "search";
  product_sku?: string;
  product_name?: string;
  user_agent: string;
  ai_agent?: string;
  ip?: string;
  referer?: string;
  query?: string;
}

interface AnalyticsData {
  events: TrackEvent[];
  summary: {
    total_requests: number;
    by_agent: Record<string, number>;
    by_product: Record<string, number>;
    by_day: Record<string, number>;
  };
}

const ANALYTICS_DIR = join(process.cwd(), "..", "..", "data");
const ANALYTICS_FILE = join(ANALYTICS_DIR, "analytics.json");

// Known AI User-Agents
const AI_AGENTS: Record<string, string> = {
  claude: "Claude (Anthropic)",
  chatgpt: "ChatGPT (OpenAI)",
  "gpt-4": "GPT-4 (OpenAI)",
  openai: "OpenAI",
  perplexity: "Perplexity AI",
  perplexitybot: "Perplexity Bot",
  bingbot: "Bing AI",
  googlebot: "Google Bot",
  "google-extended": "Google AI (Bard/Gemini)",
  cohere: "Cohere AI",
  anthropic: "Anthropic",
  "meta-externalagent": "Meta AI",
  bytespider: "ByteDance AI",
  ccbot: "Common Crawl",
  gptbot: "GPTBot (OpenAI)",
  amazonbot: "Amazon Bot",
  applebot: "Apple Bot",
  diffbot: "Diffbot",
  youbot: "You.com AI",
};

export function detectAIAgent(userAgent: string): string | undefined {
  const ua = userAgent.toLowerCase();

  for (const [key, name] of Object.entries(AI_AGENTS)) {
    if (ua.includes(key.toLowerCase())) {
      return name;
    }
  }

  // Check for generic bot patterns
  if (ua.includes("bot") || ua.includes("crawler") || ua.includes("spider")) {
    return "Unknown Bot";
  }

  return undefined;
}

async function loadAnalytics(): Promise<AnalyticsData> {
  try {
    if (existsSync(ANALYTICS_FILE)) {
      const content = await readFile(ANALYTICS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error loading analytics:", error);
  }

  return {
    events: [],
    summary: {
      total_requests: 0,
      by_agent: {},
      by_product: {},
      by_day: {},
    },
  };
}

async function saveAnalytics(data: AnalyticsData): Promise<void> {
  try {
    if (!existsSync(ANALYTICS_DIR)) {
      await mkdir(ANALYTICS_DIR, { recursive: true });
    }

    // Keep only last 10000 events to prevent file from growing too large
    if (data.events.length > 10000) {
      data.events = data.events.slice(-10000);
    }

    await writeFile(ANALYTICS_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving analytics:", error);
  }
}

export interface TrackOptions {
  event: "product_view" | "catalog_fetch" | "search";
  userAgent: string;
  productSku?: string;
  productName?: string;
  ip?: string;
  referer?: string;
  query?: string;
}

/**
 * Track an analytics event
 * This function is async but doesn't block - errors are logged but not thrown
 * In production/Vercel, writes are disabled (read-only mode)
 */
export async function trackEvent(options: TrackOptions): Promise<void> {
  // Skip tracking in production if writes are disabled
  if (!config.analytics.writeEnabled) {
    return;
  }

  try {
    const aiAgent = detectAIAgent(options.userAgent);

    const event: TrackEvent = {
      timestamp: new Date().toISOString(),
      event: options.event,
      product_sku: options.productSku,
      product_name: options.productName,
      user_agent: options.userAgent,
      ai_agent: aiAgent,
      ip: options.ip,
      referer: options.referer,
      query: options.query,
    };

    // Load existing data
    const data = await loadAnalytics();

    // Add event
    data.events.push(event);

    // Update summary
    data.summary.total_requests++;

    const agentKey = aiAgent || "Human/Browser";
    data.summary.by_agent[agentKey] = (data.summary.by_agent[agentKey] || 0) + 1;

    if (event.product_sku) {
      data.summary.by_product[event.product_sku] =
        (data.summary.by_product[event.product_sku] || 0) + 1;
    }

    const day = event.timestamp.split("T")[0];
    data.summary.by_day[day] = (data.summary.by_day[day] || 0) + 1;

    // Save
    await saveAnalytics(data);
  } catch (error) {
    // Don't throw - tracking errors shouldn't break the main flow
    console.error("Analytics tracking error:", error);
  }
}

/**
 * Helper to extract tracking info from a Next.js request
 */
export function getTrackingInfo(request: Request): {
  userAgent: string;
  ip: string;
  referer?: string;
} {
  const userAgent = request.headers.get("user-agent") || "unknown";
  const referer = request.headers.get("referer") || undefined;
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "unknown";

  return { userAgent, ip, referer };
}
