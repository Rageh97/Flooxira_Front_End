"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch } from "@/lib/api";

interface PostStats {
  published: number;
  scheduled: number;
  draft: number;
  failed: number;
  facebookPosts: number;
  instagramPosts: number;
  linkedinPosts: number;
  pinterestPosts: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<PostStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const token = localStorage.getItem("auth_token") || "";
      const response = await apiFetch<PostStats>("/api/posts/stats", {
        authToken: token,
      });
      setStats(response);
    } catch (error) {
      console.error("Failed to load stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-white">Dashboard</h1>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-text-primary/50">
            <h3 className="text-sm font-medium text-white">Published Posts</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats?.published || 0}</div>
            <p className="text-xs text-muted-foreground text-white">
              Successfully published content
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-text-primary/50">
            <h3 className="text-sm font-medium text-white">Scheduled Posts</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats?.scheduled || 0}</div>
            <p className="text-xs text-muted-foreground text-white">
              Posts waiting to be published
            </p>
          </CardContent>
        </Card>

      

        <Card className="bg-card border-none">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 border-text-primary/50">
            <h3 className="text-sm font-medium text-white">Failed Posts</h3>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{stats?.failed || 0}</div>
            <p className="text-xs text-muted-foreground text-white">
              Posts that failed to publish
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card border-none text-white">
          <CardHeader className="border-text-primary/50">
            <h3 className="text-lg font-semibold">Platform Breakdown</h3>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium">Facebook</span>
              </div>
              <span className="text-2xl font-bold">{stats?.facebookPosts || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
                <span className="text-sm font-medium">Instagram</span>
              </div>
              <span className="text-2xl font-bold">{stats?.instagramPosts || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-blue-600 rounded-full"></div>
                <span className="text-sm font-medium">LinkedIn</span>
              </div>
              <span className="text-2xl font-bold">{stats?.linkedinPosts || 0}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm font-medium">Pinterest</span>
              </div>
              <span className="text-2xl font-bold">{stats?.pinterestPosts || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-none text-white">
          <CardHeader className="border-text-primary/50">
            <h3 className="text-lg font-semibold">Quick Actions</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            <a
              href="/create-post"
              className="block w-full p-3 text-center button-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Create New Post
            </a>
            <a
              href="/schedule"
              className="block w-full p-3 text-center bg-orange-600/50 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              View Scheduled Posts
            </a>
            <a
              href="/settings"
              className="block w-full p-3 text-center bg-green-600/70 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Manage Integrations
            </a>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}







