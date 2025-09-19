'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface AnalyticsData {
  totalPins: number;
  totalBoards: number;
  totalFollowers: number;
  recentPins: Array<{
    id: string;
    title: string;
    createdAt: string;
    boardName: string;
  }>;
}

export default function PinterestAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch boards and pins data
      const [boardsResponse, pinsResponse] = await Promise.all([
        fetch('/api/pinterest/boards'),
        fetch('/api/pinterest/pins')
      ]);

      const boardsData = await boardsResponse.json();
      const pinsData = await pinsResponse.json();

      // Calculate analytics
      const totalPins = pinsData.pins?.length || 0;
      const totalBoards = boardsData.boards?.length || 0;
      const totalFollowers = boardsData.boards?.reduce((sum: number, board: any) => sum + (board.followerCount || 0), 0) || 0;
      
      const recentPins = pinsData.pins?.slice(0, 5).map((pin: any) => ({
        id: pin.id,
        title: pin.title,
        createdAt: pin.createdAt,
        boardName: boardsData.boards?.find((board: any) => board.id === pin.boardId)?.name || 'Unknown Board'
      })) || [];

      setAnalytics({
        totalPins,
        totalBoards,
        totalFollowers,
        recentPins
      });
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading analytics...</div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <p className="text-muted-foreground">Failed to load analytics</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Pins</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalPins}</div>
            <p className="text-xs text-muted-foreground">All pins created</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Boards</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalBoards}</div>
            <p className="text-xs text-muted-foreground">Boards you manage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium">Total Followers</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalFollowers}</div>
            <p className="text-xs text-muted-foreground">Across all boards</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Pins */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Recent Pins</h3>
          <p className="text-sm text-muted-foreground">Your latest pins across all boards</p>
        </CardHeader>
        <CardContent>
          {analytics.recentPins.length > 0 ? (
            <div className="space-y-4">
              {analytics.recentPins.map((pin) => (
                <div key={pin.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{pin.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      Board: {pin.boardName}
                    </p>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(pin.createdAt)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">
              No pins found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Note about Pinterest API limitations */}
      <Card>
        <CardHeader>
          <h3 className="text-sm font-medium">Note</h3>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground">Pinterest API has limited analytics capabilities. For detailed insights, consider using Pinterest's native analytics dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}
