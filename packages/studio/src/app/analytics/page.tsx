"use client";

import { useState, useEffect } from "react";

interface AIAgent {
  name: string;
  count: number;
}

interface TopProduct {
  sku: string;
  name?: string;
  count: number;
}

interface DailyStat {
  date: string;
  total: number;
  ai: number;
  human: number;
}

interface RecentVisit {
  timestamp: string;
  agent: string;
  event: string;
  product_sku?: string;
  product_name?: string;
}

interface AnalyticsData {
  total_requests: number;
  ai_requests: number;
  human_requests: number;
  ai_percentage: number;
  ai_agents: AIAgent[];
  top_products: TopProduct[];
  daily_stats: DailyStat[];
  recent_ai_visits: RecentVisit[];
  period: {
    start: string;
    end: string;
    days: number;
  };
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [days]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const response = await fetch(`/api/analytics/stats?days=${days}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            AI Analytics
          </h1>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
            AI Analytics
          </h1>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              No analytics data available yet.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const maxDailyTotal = Math.max(...data.daily_stats.map((d) => d.total), 1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              AI Analytics
            </h1>
            <p className="text-gray-500 dark:text-gray-400 mt-1">
              Track AI agents accessing your product catalog
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600 dark:text-gray-400">
              Period:
            </label>
            <select
              value={days}
              onChange={(e) => setDays(parseInt(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Total Requests
            </div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-2">
              {data.total_requests.toLocaleString()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              AI Requests
            </div>
            <div className="text-3xl font-bold text-blue-600 mt-2">
              {data.ai_requests.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {data.ai_percentage}% of total
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Human Requests
            </div>
            <div className="text-3xl font-bold text-green-600 mt-2">
              {data.human_requests.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {100 - data.ai_percentage}% of total
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Unique AI Agents
            </div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {data.ai_agents.length}
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* AI Agents Breakdown */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              AI Agents
            </h2>
            {data.ai_agents.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No AI agents detected yet
              </p>
            ) : (
              <div className="space-y-3">
                {data.ai_agents.slice(0, 10).map((agent) => {
                  const percentage = Math.round(
                    (agent.count / data.ai_requests) * 100
                  );
                  return (
                    <div key={agent.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-700 dark:text-gray-300">
                          {agent.name}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">
                          {agent.count.toLocaleString()} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top Products */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Top Accessed Products
            </h2>
            {data.top_products.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                No product accesses recorded yet
              </p>
            ) : (
              <div className="space-y-2">
                {data.top_products.slice(0, 10).map((product, index) => (
                  <div
                    key={product.sku}
                    className="flex items-center gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded"
                  >
                    <span className="text-sm font-medium text-gray-400 w-6">
                      {index + 1}.
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {product.name || product.sku}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        SKU: {product.sku}
                      </p>
                    </div>
                    <span className="text-sm font-semibold text-blue-600">
                      {product.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Daily Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Daily Requests
          </h2>
          {data.daily_stats.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No daily data available yet
            </p>
          ) : (
            <div className="h-64 flex items-end gap-1">
              {data.daily_stats.map((day) => {
                const aiHeight = (day.ai / maxDailyTotal) * 100;
                const humanHeight = (day.human / maxDailyTotal) * 100;
                return (
                  <div
                    key={day.date}
                    className="flex-1 flex flex-col justify-end h-full group relative"
                  >
                    <div
                      className="bg-blue-600 w-full rounded-t"
                      style={{ height: `${aiHeight}%` }}
                    />
                    <div
                      className="bg-green-500 w-full"
                      style={{ height: `${humanHeight}%` }}
                    />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10">
                      <div className="bg-gray-900 text-white text-xs rounded px-2 py-1 whitespace-nowrap">
                        {day.date}: {day.total} ({day.ai} AI, {day.human} human)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          <div className="flex items-center justify-center gap-6 mt-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-600 rounded" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                AI Requests
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Human Requests
              </span>
            </div>
          </div>
        </div>

        {/* Recent AI Visits */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Recent AI Visits
          </h2>
          {data.recent_ai_visits.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              No AI visits recorded yet
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">AI Agent</th>
                    <th className="pb-3 font-medium">Event</th>
                    <th className="pb-3 font-medium">Product</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.recent_ai_visits.slice(0, 20).map((visit, index) => (
                    <tr key={index} className="text-sm">
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {new Date(visit.timestamp).toLocaleString()}
                      </td>
                      <td className="py-3">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          {visit.agent}
                        </span>
                      </td>
                      <td className="py-3 text-gray-900 dark:text-white">
                        {visit.event}
                      </td>
                      <td className="py-3 text-gray-600 dark:text-gray-400">
                        {visit.product_name || visit.product_sku || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
