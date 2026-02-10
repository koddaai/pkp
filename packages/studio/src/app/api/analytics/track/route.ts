import { NextRequest, NextResponse } from "next/server";
import { readFile, writeFile, mkdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";

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
  "claude": "Claude (Anthropic)",
  "chatgpt": "ChatGPT (OpenAI)",
  "gpt-4": "GPT-4 (OpenAI)",
  "openai": "OpenAI",
  "perplexity": "Perplexity AI",
  "perplexitybot": "Perplexity Bot",
  "bingbot": "Bing AI",
  "googlebot": "Google Bot",
  "google-extended": "Google AI (Bard/Gemini)",
  "cohere": "Cohere AI",
  "anthropic": "Anthropic",
  "meta-externalagent": "Meta AI",
  "bytespider": "ByteDance AI",
  "ccbot": "Common Crawl",
  "gptbot": "GPTBot (OpenAI)",
  "amazonbot": "Amazon Bot",
  "applebot": "Apple Bot",
  "diffbot": "Diffbot",
  "youbot": "You.com AI",
};

function detectAIAgent(userAgent: string): string | undefined {
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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const userAgent = request.headers.get("user-agent") || "unknown";
    const referer = request.headers.get("referer") || undefined;
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ||
               request.headers.get("x-real-ip") ||
               "unknown";

    const aiAgent = detectAIAgent(userAgent);

    const event: TrackEvent = {
      timestamp: new Date().toISOString(),
      event: body.event || "product_view",
      product_sku: body.sku,
      product_name: body.name,
      user_agent: userAgent,
      ai_agent: aiAgent,
      ip: ip,
      referer: referer,
      query: body.query,
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
      data.summary.by_product[event.product_sku] = (data.summary.by_product[event.product_sku] || 0) + 1;
    }

    const day = event.timestamp.split("T")[0];
    data.summary.by_day[day] = (data.summary.by_day[day] || 0) + 1;

    // Save
    await saveAnalytics(data);

    return NextResponse.json({
      success: true,
      ai_detected: !!aiAgent,
      agent: aiAgent,
    });
  } catch (error) {
    console.error("Error tracking event:", error);
    return NextResponse.json(
      { error: "Failed to track event" },
      { status: 500 }
    );
  }
}

// Also support GET for simple tracking pixels
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const sku = searchParams.get("sku");
  const event = searchParams.get("event") || "product_view";

  const userAgent = request.headers.get("user-agent") || "unknown";
  const aiAgent = detectAIAgent(userAgent);

  // Load existing data
  const data = await loadAnalytics();

  // Add event
  const trackEvent: TrackEvent = {
    timestamp: new Date().toISOString(),
    event: event as TrackEvent["event"],
    product_sku: sku || undefined,
    user_agent: userAgent,
    ai_agent: aiAgent,
  };

  data.events.push(trackEvent);
  data.summary.total_requests++;

  const agentKey = aiAgent || "Human/Browser";
  data.summary.by_agent[agentKey] = (data.summary.by_agent[agentKey] || 0) + 1;

  if (sku) {
    data.summary.by_product[sku] = (data.summary.by_product[sku] || 0) + 1;
  }

  const day = trackEvent.timestamp.split("T")[0];
  data.summary.by_day[day] = (data.summary.by_day[day] || 0) + 1;

  await saveAnalytics(data);

  // Return 1x1 transparent GIF for pixel tracking
  const gif = Buffer.from(
    "R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
    "base64"
  );

  return new NextResponse(gif, {
    headers: {
      "Content-Type": "image/gif",
      "Cache-Control": "no-store, no-cache, must-revalidate",
    },
  });
}
