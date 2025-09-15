"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getLinkedInAnalytics } from "@/lib/api";

interface LinkedInAnalyticsProps {
  onMessage: (message: string) => void;
}

export default function LinkedInAnalytics({ onMessage }: LinkedInAnalyticsProps) {
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    loadAnalytics();
  }, [timeRange]);

  const loadAnalytics = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    setLoading(true);
    try {
      const res = await getLinkedInAnalytics(token, timeRange);
      if (res.ok) {
        setAnalytics(res.analytics);
      } else {
        onMessage(res.message || 'Failed to load analytics');
      }
    } catch (e) {
      onMessage('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Analytics</h2>
            <div className="flex gap-2">
              <select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value as '7d' | '30d' | '90d')}
                className="border rounded px-3 py-1 text-sm"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="90d">Last 90 days</option>
              </select>
              <Button size="sm" variant="outline" onClick={loadAnalytics} disabled={loading}>
                {loading ? 'Loading...' : 'Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {analytics ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 border rounded-lg bg-blue-50">
                <h3 className="font-medium text-blue-800">Profile Views</h3>
                <p className="text-2xl font-bold text-blue-900">
                  {analytics.profileViews || 0}
                </p>
                <p className="text-sm text-blue-700">Total views</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-green-50">
                <h3 className="font-medium text-green-800">Connections</h3>
                <p className="text-2xl font-bold text-green-900">
                  {analytics.connections || 0}
                </p>
                <p className="text-sm text-green-700">Network size</p>
              </div>
              
              <div className="p-4 border rounded-lg bg-purple-50">
                <h3 className="font-medium text-purple-800">Time Range</h3>
                <p className="text-lg font-bold text-purple-900">
                  {timeRange}
                </p>
                <p className="text-sm text-purple-700">Analysis period</p>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No analytics data available</p>
              <p className="text-sm text-gray-400 mt-2">
                LinkedIn analytics require special API permissions. This shows basic network data.
              </p>
            </div>
          )}
          
          {analytics?.note && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> {analytics.note}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Analytics Information</h2>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-gray-600">
            <p>
              <strong>LinkedIn Analytics API:</strong> Full analytics data requires special permissions from LinkedIn. 
              The data shown here represents basic network information available through standard API access.
            </p>
            <p>
              <strong>Available Metrics:</strong> Profile views, connection count, and basic network statistics.
            </p>
            <p>
              <strong>Advanced Analytics:</strong> For detailed post performance, engagement metrics, and audience insights, 
              you would need to apply for LinkedIn's Marketing Developer Platform access.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








