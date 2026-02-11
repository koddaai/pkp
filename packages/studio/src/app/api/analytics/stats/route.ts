import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { getApiStats } from "@/lib/api-analytics";
import { config } from "@/lib/config";

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

const ANALYTICS_FILE = join(process.cwd(), "..", "..", "data", "analytics.json");

async function loadAnalytics(): Promise<AnalyticsData | null> {
  try {
    if (existsSync(ANALYTICS_FILE)) {
      const content = await readFile(ANALYTICS_FILE, "utf-8");
      return JSON.parse(content);
    }
  } catch (error) {
    console.error("Error loading analytics:", error);
  }
  return null;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const days = parseInt(searchParams.get("days") || "30");
  const includeEvents = searchParams.get("events") === "true";

  // In production (Vercel), use in-memory API stats
  if (config.isVercel) {
    const apiStats = getApiStats();

    // Convert API stats to response format
    const aiAgents = Object.entries(apiStats.by_agent)
      .filter(([name]) => name !== "Human/Browser")
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    const aiRequests = Object.entries(apiStats.by_agent)
      .filter(([name]) => name !== "Human/Browser")
      .reduce((sum, [, count]) => sum + count, 0);

    const humanRequests = apiStats.by_agent["Human/Browser"] || 0;

    const dailyStats = Object.entries(apiStats.by_day)
      .map(([date, total]) => ({ date, total, ai: 0, human: 0 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const recentAIVisits = apiStats.recent_events
      .filter((e) => e.ai_agent)
      .slice(-50)
      .reverse()
      .map((e) => ({
        timestamp: e.timestamp,
        agent: e.ai_agent,
        event: e.event,
        path: e.path,
      }));

    return NextResponse.json({
      total_requests: apiStats.total_requests,
      ai_requests: aiRequests,
      human_requests: humanRequests,
      ai_percentage: apiStats.total_requests > 0
        ? Math.round((aiRequests / apiStats.total_requests) * 100)
        : 0,
      ai_agents: aiAgents,
      top_products: [],
      daily_stats: dailyStats,
      recent_ai_visits: recentAIVisits,
      by_path: apiStats.by_path,
      source: "in-memory",
      note: "Stats reset on deployment. For persistent stats, use external analytics.",
    });
  }

  // In development, use file-based analytics
  const data = await loadAnalytics();

  if (!data) {
    return NextResponse.json({
      total_requests: 0,
      ai_requests: 0,
      human_requests: 0,
      ai_agents: [],
      top_products: [],
      daily_stats: [],
      recent_ai_visits: [],
    });
  }

  // Calculate date range
  const now = new Date();
  const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  // Filter events by date
  const recentEvents = data.events.filter(
    (e) => new Date(e.timestamp) >= startDate
  );

  // Calculate stats
  const aiRequests = recentEvents.filter((e) => e.ai_agent).length;
  const humanRequests = recentEvents.filter((e) => !e.ai_agent).length;

  // AI agents breakdown
  const aiAgentCounts: Record<string, number> = {};
  recentEvents
    .filter((e) => e.ai_agent)
    .forEach((e) => {
      aiAgentCounts[e.ai_agent!] = (aiAgentCounts[e.ai_agent!] || 0) + 1;
    });

  const aiAgents = Object.entries(aiAgentCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  // Top products
  const productCounts: Record<string, { sku: string; name?: string; count: number }> = {};
  recentEvents
    .filter((e) => e.product_sku)
    .forEach((e) => {
      if (!productCounts[e.product_sku!]) {
        productCounts[e.product_sku!] = {
          sku: e.product_sku!,
          name: e.product_name,
          count: 0,
        };
      }
      productCounts[e.product_sku!].count++;
      if (e.product_name) {
        productCounts[e.product_sku!].name = e.product_name;
      }
    });

  const topProducts = Object.values(productCounts)
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);

  // Daily stats
  const dailyCounts: Record<string, { total: number; ai: number; human: number }> = {};
  recentEvents.forEach((e) => {
    const day = e.timestamp.split("T")[0];
    if (!dailyCounts[day]) {
      dailyCounts[day] = { total: 0, ai: 0, human: 0 };
    }
    dailyCounts[day].total++;
    if (e.ai_agent) {
      dailyCounts[day].ai++;
    } else {
      dailyCounts[day].human++;
    }
  });

  const dailyStats = Object.entries(dailyCounts)
    .map(([date, counts]) => ({ date, ...counts }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Recent AI visits
  const recentAIVisits = recentEvents
    .filter((e) => e.ai_agent)
    .slice(-50)
    .reverse()
    .map((e) => ({
      timestamp: e.timestamp,
      agent: e.ai_agent,
      event: e.event,
      product_sku: e.product_sku,
      product_name: e.product_name,
    }));

  const response: Record<string, unknown> = {
    total_requests: recentEvents.length,
    ai_requests: aiRequests,
    human_requests: humanRequests,
    ai_percentage: recentEvents.length > 0
      ? Math.round((aiRequests / recentEvents.length) * 100)
      : 0,
    ai_agents: aiAgents,
    top_products: topProducts,
    daily_stats: dailyStats,
    recent_ai_visits: recentAIVisits,
    period: {
      start: startDate.toISOString(),
      end: now.toISOString(),
      days: days,
    },
  };

  if (includeEvents) {
    response.events = recentEvents;
  }

  return NextResponse.json(response);
}
