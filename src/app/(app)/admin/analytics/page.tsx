"use client";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function AnalyticsAdminPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">System Analytics</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <h3 className="text-sm font-medium">Total Users</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">-</div>
            <p className="text-xs text-gray-300">All registered users</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <h3 className="text-sm font-medium">Active Users</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">-</div>
            <p className="text-xs text-gray-300">Users with active subscriptions</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <h3 className="text-sm font-medium">Total Posts</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">-</div>
            <p className="text-xs text-gray-300">Posts created across all platforms</p>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="pb-2 border-text-primary/50 text-primary">
            <h3 className="text-sm font-medium">Revenue</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">-</div>
            <p className="text-xs text-gray-300">Total subscription revenue</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">
            <h3 className="text-lg font-semibold">User Growth</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-300">
              <p>Chart placeholder - User growth over time</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card border-none">
          <CardHeader className="border-text-primary/50 text-primary">
            <h3 className="text-lg font-semibold">Platform Usage</h3>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-300">
              <p>Chart placeholder - Platform usage distribution</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50 text-primary">
          <h3 className="text-lg font-semibold">Recent Activity</h3>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-gray-600">
              <div>
                <p className="text-sm font-medium text-white">New user registration</p>
                <p className="text-xs text-gray-300">2 minutes ago</p>
              </div>
              <span className="text-sm text-gray-300">+1</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-600">
              <div>
                <p className="text-sm font-medium text-white">Post published to Facebook</p>
                <p className="text-xs text-gray-300">5 minutes ago</p>
              </div>
              <span className="text-sm text-gray-300">Facebook</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-gray-600">
              <div>
                <p className="text-sm font-medium text-white">WhatsApp message sent</p>
                <p className="text-xs text-gray-300">10 minutes ago</p>
              </div>
              <span className="text-sm text-gray-300">WhatsApp</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
