"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface TelegramStats {
  totalMessages: number;
  totalGroups: number;
  totalChannels: number;
  totalSubscribers: number;
  messagesToday: number;
  messagesThisWeek: number;
  messagesThisMonth: number;
  activeChats: number;
  responseTime: string;
  engagementRate: number;
}

export default function TelegramStatsPage() {
  const [stats, setStats] = useState<TelegramStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading stats
    const mockStats: TelegramStats = {
      totalMessages: 15420,
      totalGroups: 12,
      totalChannels: 5,
      totalSubscribers: 3250,
      messagesToday: 45,
      messagesThisWeek: 320,
      messagesThisMonth: 1280,
      activeChats: 8,
      responseTime: "2.3 min",
      engagementRate: 78.5
    };
    
    setTimeout(() => {
      setStats(mockStats);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading statistics...</div>
      </div>
    );
  }

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-white">Telegram Statistics</h2>
      
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-none">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-300">Total Messages</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalMessages.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">All time</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-300">Active Chats</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.activeChats}</div>
            <p className="text-xs text-gray-400 mt-1">Currently active</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-300">Total Subscribers</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.totalSubscribers.toLocaleString()}</div>
            <p className="text-xs text-gray-400 mt-1">Across all channels</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="pb-2">
            <h3 className="text-sm font-medium text-gray-300">Engagement Rate</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stats.engagementRate}%</div>
            <p className="text-xs text-gray-400 mt-1">Average response rate</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Message Activity</h3>
            <p className="text-sm text-gray-400">Message statistics over time</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Today</span>
                <span className="text-white font-semibold">{stats.messagesToday}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">This Week</span>
                <span className="text-white font-semibold">{stats.messagesThisWeek}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">This Month</span>
                <span className="text-white font-semibold">{stats.messagesThisMonth}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Bot Performance</h3>
            <p className="text-sm text-gray-400">Bot response and engagement metrics</p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Average Response Time</span>
                <span className="text-white font-semibold">{stats.responseTime}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Engagement Rate</span>
                <span className="text-white font-semibold">{stats.engagementRate}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Active Chats</span>
                <span className="text-white font-semibold">{stats.activeChats}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Platform Breakdown */}
        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Platform Breakdown</h3>
            <p className="text-sm text-gray-400">Distribution across different Telegram entities</p>
          </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.totalGroups}</div>
              <div className="text-sm text-gray-400">Groups</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.totalChannels}</div>
              <div className="text-sm text-gray-400">Channels</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-white">{stats.totalSubscribers}</div>
              <div className="text-sm text-gray-400">Total Subscribers</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
