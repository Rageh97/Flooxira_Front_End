"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tgWebGroups, exportTelegramMembers } from "@/lib/api";

interface TelegramChannel {
  id: string;
  name: string;
  description?: string;
  subscriberCount: number;
  isActive: boolean;
  lastPost?: string;
  lastPostTime?: string;
  isPublic: boolean;
  inviteLink?: string;
  type: string;
}

export default function TelegramChannelsPage() {
  const [channels, setChannels] = useState<TelegramChannel[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedChannel, setSelectedChannel] = useState<TelegramChannel | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    loadChannels();
  }, []);

  async function loadChannels() {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await tgWebGroups(token);
      // Filter only channels from the groups data
      const channelData = (res.groups || []).filter((group: any) => 
        group.type === 'channel' || group.type === 'supergroup'
      ).map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description || "No description available",
        subscriberCount: group.member_count || 0,
        isActive: true,
        lastPost: group.last_message || "No recent posts",
        lastPostTime: group.last_activity || "Unknown",
        isPublic: group.is_public || false,
        inviteLink: group.invite_link || "",
        type: group.type
      }));
      
      setChannels(channelData);
    } catch (e: any) {
      setError("Failed to load channels");
      console.error("Error loading channels:", e);
    } finally {
      setLoading(false);
    }
  }

  const filteredChannels = channels.filter(channel =>
    channel.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (channel.description && channel.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading channels...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Telegram Channels</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Refresh
          </Button>
          <Button size="sm">
            Create Channel
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Channels List */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-none">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Channels</h3>
              <p className="text-sm text-gray-400">
                Manage your Telegram channels
              </p>
              <Input
                placeholder="Search channels..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-4"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedChannel?.id === channel.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedChannel(channel)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📢</span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{channel.name}</div>
                        <div className="text-sm text-gray-500">
                          {channel.subscriberCount.toLocaleString()} subscribers
                        </div>
                        {channel.lastPostTime && (
                          <div className="text-xs text-gray-400">
                            Last post: {channel.lastPostTime}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className={`w-2 h-2 rounded-full ${
                          channel.isActive ? 'bg-green-500' : 'bg-gray-400'
                        }`} />
                        <span className={`text-xs px-2 py-1 rounded ${
                          channel.isPublic 
                            ? 'bg-blue-100 text-blue-600' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {channel.isPublic ? 'Public' : 'Private'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Channel Details */}
        <div className="lg:col-span-2">
          {selectedChannel ? (
            <Card className="bg-card border-none">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>📢</span>
                  {selectedChannel.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedChannel.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Channel ID</label>
                      <p className="text-white">{selectedChannel.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Subscribers</label>
                      <p className="text-white">{selectedChannel.subscriberCount.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Status</label>
                      <p className={`${selectedChannel.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedChannel.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Visibility</label>
                      <p className={`${selectedChannel.isPublic ? 'text-blue-400' : 'text-orange-400'}`}>
                        {selectedChannel.isPublic ? 'Public' : 'Private'}
                      </p>
                    </div>
                  </div>

                  {selectedChannel.inviteLink && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-white mb-3">Invite Link</h3>
                      <div className="flex gap-2">
                        <Input
                          value={selectedChannel.inviteLink}
                          readOnly
                          className="flex-1"
                        />
                        <Button variant="outline" size="sm">
                          Copy
                        </Button>
                        <Button variant="outline" size="sm">
                          Regenerate
                        </Button>
                      </div>
                    </div>
                  )}

                  {selectedChannel.lastPost && (
                    <div className="pt-4 border-t border-gray-200">
                      <h3 className="text-lg font-medium text-white mb-3">Latest Post</h3>
                      <div className="p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-800 mb-2">{selectedChannel.lastPost}</p>
                        <span className="text-xs text-gray-500">
                          Posted {selectedChannel.lastPostTime}
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm">
                      Create Post
                    </Button>
                    <Button variant="outline" size="sm">
                      Schedule Post
                    </Button>
                    <Button variant="outline" size="sm">
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
                        if (!token) return;
                        const res = await exportTelegramMembers(token, selectedChannel.id);
                        if (res.file) {
                          window.open(res.file, '_blank');
                        }
                      } catch {}
                    }}>
                      Export Numbers
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-card border-none">
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl mb-4">📢</div>
                  <h3 className="text-lg font-medium text-white mb-2">Select a Channel</h3>
                  <p className="text-gray-400">Choose a channel from the list to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
