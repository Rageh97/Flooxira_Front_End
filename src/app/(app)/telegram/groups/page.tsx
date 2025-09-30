"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tgWebGroups, exportTelegramMembers } from "@/lib/api";

interface TelegramGroup {
  id: string;
  name: string;
  description?: string;
  memberCount: number;
  isActive: boolean;
  lastActivity?: string;
  permissions: {
    canSendMessages: boolean;
    canSendMedia: boolean;
    canSendPolls: boolean;
    canInviteUsers: boolean;
  };
  type: string;
}

export default function TelegramGroupsPage() {
  const [groups, setGroups] = useState<TelegramGroup[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedGroup, setSelectedGroup] = useState<TelegramGroup | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    loadGroups();
  }, []);

  async function loadGroups() {
    if (!token) return;
    
    try {
      setLoading(true);
      const res = await tgWebGroups(token);
      // Filter only groups from the groups data
      const groupData = (res.groups || []).filter((group: any) => 
        group.type === 'group' || group.type === 'supergroup'
      ).map((group: any) => ({
        id: group.id,
        name: group.name,
        description: group.description || "No description available",
        memberCount: group.member_count || 0,
        isActive: true,
        lastActivity: group.last_activity || "Unknown",
        permissions: {
          canSendMessages: true,
          canSendMedia: true,
          canSendPolls: true,
          canInviteUsers: true
        },
        type: group.type
      }));
      
      setGroups(groupData);
    } catch (e: any) {
      setError("Failed to load groups");
      console.error("Error loading groups:", e);
    } finally {
      setLoading(false);
    }
  }

  const filteredGroups = groups.filter(group =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading groups...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Telegram Groups</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            Refresh
          </Button>
          <Button size="sm">
            Create Group
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Groups List */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-none">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Groups</h3>
              <p className="text-sm text-gray-400">
                Manage your Telegram groups
              </p>
              <Input
                placeholder="Search groups..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-4"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredGroups.map((group) => (
                  <div
                    key={group.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedGroup?.id === group.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedGroup(group)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">👥</span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{group.name}</div>
                        <div className="text-sm text-gray-500">
                          {group.memberCount} members
                        </div>
                        {group.lastActivity && (
                          <div className="text-xs text-gray-400">
                            Last activity: {group.lastActivity}
                          </div>
                        )}
                      </div>
                      <div className={`w-2 h-2 rounded-full ${
                        group.isActive ? 'bg-green-500' : 'bg-gray-400'
                      }`} />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Group Details */}
        <div className="lg:col-span-2">
          {selectedGroup ? (
            <Card className="bg-card border-none">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>👥</span>
                  {selectedGroup.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedGroup.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Group ID</label>
                      <p className="text-white">{selectedGroup.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Members</label>
                      <p className="text-white">{selectedGroup.memberCount}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Status</label>
                      <p className={`${selectedGroup.isActive ? 'text-green-400' : 'text-red-400'}`}>
                        {selectedGroup.isActive ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Last Activity</label>
                      <p className="text-white">{selectedGroup.lastActivity || 'No recent activity'}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-white mb-3">Bot Permissions</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGroup.permissions.canSendMessages}
                          readOnly
                          className="rounded"
                        />
                        <label className="text-sm text-gray-300">Send Messages</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGroup.permissions.canSendMedia}
                          readOnly
                          className="rounded"
                        />
                        <label className="text-sm text-gray-300">Send Media</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGroup.permissions.canSendPolls}
                          readOnly
                          className="rounded"
                        />
                        <label className="text-sm text-gray-300">Send Polls</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={selectedGroup.permissions.canInviteUsers}
                          readOnly
                          className="rounded"
                        />
                        <label className="text-sm text-gray-300">Invite Users</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" size="sm">
                      Send Message
                    </Button>
                    <Button variant="outline" size="sm">
                      Manage Members
                    </Button>
                    <Button variant="outline" size="sm">
                      Settings
                    </Button>
                    <Button variant="outline" size="sm" onClick={async () => {
                      try {
                        const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : '';
                        if (!token) return;
                        const res = await exportTelegramMembers(token, selectedGroup.id);
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
                  <div className="text-4xl mb-4">👥</div>
                  <h3 className="text-lg font-medium text-white mb-2">Select a Group</h3>
                  <p className="text-gray-400">Choose a group from the list to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
