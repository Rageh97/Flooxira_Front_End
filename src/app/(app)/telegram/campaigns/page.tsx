"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { tgWebGroups, tgWebSend, sendToTelegramGroupsBulk, startTelegramCampaign } from "@/lib/api";

interface TelegramCampaign {
  id: string;
  name: string;
  description?: string;
  status: 'draft' | 'scheduled' | 'active' | 'completed' | 'paused';
  targetType: 'groups' | 'channels' | 'users' | 'all';
  targetCount: number;
  sentCount: number;
  scheduledDate?: string;
  createdAt: string;
  message: string;
  media?: File;
}

interface TelegramTarget {
  id: string;
  name: string;
  type: 'group' | 'channel' | 'user';
  memberCount?: number;
}

export default function TelegramCampaignsPage() {
  const [campaigns, setCampaigns] = useState<TelegramCampaign[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCampaign, setSelectedCampaign] = useState<TelegramCampaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  
  // Campaign creation states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newCampaign, setNewCampaign] = useState({
    name: "",
    description: "",
    message: "",
    targetType: "groups" as 'groups' | 'channels' | 'users' | 'all',
    scheduledDate: "",
    media: null as File | null
  });
  const [availableTargets, setAvailableTargets] = useState<TelegramTarget[]>([]);
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [selectAll, setSelectAll] = useState<boolean>(false);
  const [delayMs, setDelayMs] = useState<number>(1000);
  const [mode, setMode] = useState<'targets' | 'file'>('targets');
  const [numbersFile, setNumbersFile] = useState<File | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    loadCampaigns();
    loadTargets();
  }, []);

  async function loadCampaigns() {
    // Load existing campaigns from localStorage or API
    const savedCampaigns = localStorage.getItem('telegram_campaigns');
    if (savedCampaigns) {
      setCampaigns(JSON.parse(savedCampaigns));
    }
    setLoading(false);
  }

  async function loadTargets() {
    if (!token) return;
    
    try {
      const res = await tgWebGroups(token);
      const targets: TelegramTarget[] = (res.groups || []).map((group: any) => ({
        id: group.id,
        name: group.name,
        type: group.type === 'channel' || group.type === 'supergroup' ? 'channel' : 'group',
        memberCount: group.member_count || 0
      }));
      setAvailableTargets(targets);
    } catch (e: any) {
      setError("Failed to load targets");
    }
  }

  const filteredCampaigns = campaigns.filter(campaign =>
    campaign.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (campaign.description && campaign.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  function toggleSelectAll(checked: boolean) {
    setSelectAll(checked);
    if (checked) {
      const ids = availableTargets
        .filter(t => newCampaign.targetType === 'all' || t.type === newCampaign.targetType)
        .map(t => t.id);
      setSelectedTargets(ids);
    } else {
      setSelectedTargets([]);
    }
  }

  async function createCampaign() {
    if (!newCampaign.name || !newCampaign.message || selectedTargets.length === 0) {
      setError("Please fill in all required fields and select targets");
      return;
    }

    try {
      const campaign: TelegramCampaign = {
        id: Date.now().toString(),
        name: newCampaign.name,
        description: newCampaign.description,
        message: newCampaign.message,
        status: newCampaign.scheduledDate ? 'scheduled' : 'draft',
        targetType: newCampaign.targetType,
        targetCount: selectedTargets.length,
        sentCount: 0,
        scheduledDate: newCampaign.scheduledDate || undefined,
        createdAt: new Date().toISOString(),
        media: newCampaign.media || undefined
      };

      const updatedCampaigns = [...campaigns, campaign];
      setCampaigns(updatedCampaigns);
      localStorage.setItem('telegram_campaigns', JSON.stringify(updatedCampaigns));
      
      setSuccess("Campaign created successfully!");
      setShowCreateForm(false);
      setNewCampaign({
        name: "",
        description: "",
        message: "",
        targetType: "groups",
        scheduledDate: "",
        media: null
      });
      setSelectedTargets([]);
    } catch (e: any) {
      setError("Failed to create campaign");
    }
  }

  async function launchCampaign(campaign: TelegramCampaign) {
    try {
      setLoading(true);
      if (mode === 'file' && numbersFile) {
        await startTelegramCampaign(token, numbersFile, campaign.message, delayMs, campaign.media || null, campaign.scheduledDate || null);
      } else if (campaign.media || campaign.scheduledDate) {
        await sendToTelegramGroupsBulk(token, {
          groupIds: selectedTargets,
          message: campaign.message,
          mediaFile: campaign.media || null,
          scheduleAt: campaign.scheduledDate || undefined,
        });
      } else {
        for (const targetId of selectedTargets) {
          await tgWebSend(token, targetId, campaign.message);
          if (delayMs > 0) {
            await new Promise(r => setTimeout(r, delayMs));
          }
        }
      }
      
      // Update campaign status
      const updatedCampaigns = campaigns.map(c => 
        c.id === campaign.id 
          ? { ...c, status: 'active' as const, sentCount: c.targetCount }
          : c
      );
      setCampaigns(updatedCampaigns);
      localStorage.setItem('telegram_campaigns', JSON.stringify(updatedCampaigns));
      
      setSuccess("Campaign launched successfully!");
    } catch (e: any) {
      setError("Failed to launch campaign");
    } finally {
      setLoading(false);
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-600';
      case 'scheduled': return 'bg-blue-100 text-blue-600';
      case 'active': return 'bg-green-100 text-green-600';
      case 'completed': return 'bg-purple-100 text-purple-600';
      case 'paused': return 'bg-orange-100 text-orange-600';
      default: return 'bg-gray-100 text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'draft': return '📝';
      case 'scheduled': return '⏰';
      case 'active': return '🚀';
      case 'completed': return '✅';
      case 'paused': return '⏸️';
      default: return '📝';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">Loading campaigns...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white">Telegram Campaigns</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadTargets()}>
            Refresh
          </Button>
          <Button size="sm" onClick={() => setShowCreateForm(true)}>
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Status Messages */}
      {error && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md p-4 bg-green-50 text-green-700">
          {success}
        </div>
      )}

      {/* Create Campaign Form */}
      {showCreateForm && (
        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold text-white">Create New Campaign</h3>
            <p className="text-sm text-gray-400">Set up a new Telegram campaign</p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Campaign Name</label>
                <Input
                  placeholder="Enter campaign name"
                  value={newCampaign.name}
                  onChange={(e) => setNewCampaign({...newCampaign, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Target Type</label>
                <select
                  value={newCampaign.targetType}
                  onChange={(e) => setNewCampaign({...newCampaign, targetType: e.target.value as any})}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="groups">Groups</option>
                  <option value="channels">Channels</option>
                  <option value="users">Users</option>
                  <option value="all">All</option>
                </select>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Description</label>
              <Input
                placeholder="Campaign description"
                value={newCampaign.description}
                onChange={(e) => setNewCampaign({...newCampaign, description: e.target.value})}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white">Message</label>
              <textarea
                placeholder="Enter your message..."
                value={newCampaign.message}
                onChange={(e) => setNewCampaign({...newCampaign, message: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
              />
            </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="select-all" className="rounded" checked={selectAll} onChange={e => toggleSelectAll(e.target.checked)} />
              <label htmlFor="select-all" className="text-sm text-white">Select All Targets</label>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Delay between sends (ms)</label>
              <Input type="number" value={delayMs} onChange={e => setDelayMs(Number(e.target.value) || 0)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Mode</label>
              <select value={mode} onChange={e => setMode(e.target.value as any)} className="w-full p-2 border rounded-md">
                <option value="targets">Select groups/channels</option>
                <option value="file">Upload numbers file</option>
              </select>
            </div>
          </div>

          {mode === 'file' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Upload Numbers Excel/CSV</label>
              <Input type="file" accept=".xlsx,.csv" onChange={e => setNumbersFile(e.target.files?.[0] || null)} />
              <p className="text-xs text-gray-400 mt-1">File should contain a column of phone numbers or chat IDs. Message/media will be used for each row. You can also schedule.</p>
            </div>
          )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Schedule (Optional)</label>
                <Input
                  type="datetime-local"
                  value={newCampaign.scheduledDate}
                  onChange={(e) => setNewCampaign({...newCampaign, scheduledDate: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-white">Media (Optional)</label>
                <Input
                  type="file"
                  accept="image/*,video/*,audio/*"
                  onChange={(e) => setNewCampaign({...newCampaign, media: e.target.files?.[0] || null})}
                />
              </div>
            </div>

          {mode === 'targets' && (
            <div>
              <label className="block text-sm font-medium mb-2 text-white">Select Targets</label>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                {availableTargets
                  .filter(target => newCampaign.targetType === 'all' || target.type === newCampaign.targetType)
                  .map((target) => (
                    <div key={target.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={target.id}
                        checked={selectedTargets.includes(target.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTargets([...selectedTargets, target.id]);
                          } else {
                            setSelectedTargets(selectedTargets.filter(id => id !== target.id));
                          }
                        }}
                        className="rounded"
                      />
                      <label htmlFor={target.id} className="text-sm text-white cursor-pointer">
                        {target.name} ({target.memberCount} members)
                      </label>
                    </div>
                  ))}
              </div>
            </div>
          )}

            <div className="flex gap-2">
              <Button onClick={createCampaign} disabled={loading}>
                {loading ? 'Creating...' : 'Create Campaign'}
              </Button>
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Campaigns List */}
        <div className="lg:col-span-1">
          <Card className="bg-card border-none">
            <CardHeader>
              <h3 className="text-lg font-semibold text-white">Campaigns</h3>
              <p className="text-sm text-gray-400">
                Manage your Telegram campaigns
              </p>
              <Input
                placeholder="Search campaigns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-4"
              />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {filteredCampaigns.map((campaign) => (
                  <div
                    key={campaign.id}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedCampaign?.id === campaign.id
                        ? 'bg-blue-100 border-blue-300'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => setSelectedCampaign(campaign)}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{getStatusIcon(campaign.status)}</span>
                      <div className="flex-1">
                        <div className="font-medium text-white">{campaign.name}</div>
                        <div className="text-sm text-gray-500">
                          {campaign.sentCount}/{campaign.targetCount} sent
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`text-xs px-2 py-1 rounded ${getStatusColor(campaign.status)}`}>
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </span>
                          <span className="text-xs text-gray-400">
                            {campaign.targetType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Campaign Details */}
        <div className="lg:col-span-2">
          {selectedCampaign ? (
            <Card className="bg-card border-none">
              <CardHeader>
                <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                  <span>{getStatusIcon(selectedCampaign.status)}</span>
                  {selectedCampaign.name}
                </h3>
                <p className="text-sm text-gray-400">
                  {selectedCampaign.description}
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-300">Campaign ID</label>
                      <p className="text-white">{selectedCampaign.id}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Status</label>
                      <span className={`text-xs px-2 py-1 rounded ${getStatusColor(selectedCampaign.status)}`}>
                        {selectedCampaign.status.charAt(0).toUpperCase() + selectedCampaign.status.slice(1)}
                      </span>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Target Type</label>
                      <p className="text-white capitalize">{selectedCampaign.targetType}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Progress</label>
                      <p className="text-white">
                        {selectedCampaign.sentCount}/{selectedCampaign.targetCount} 
                        ({Math.round((selectedCampaign.sentCount / selectedCampaign.targetCount) * 100)}%)
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-300">Created</label>
                      <p className="text-white">
                        {new Date(selectedCampaign.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {selectedCampaign.scheduledDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-300">Scheduled</label>
                        <p className="text-white">
                          {new Date(selectedCampaign.scheduledDate).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-white mb-3">Message Content</h3>
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-800">{selectedCampaign.message}</p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-200">
                    <h3 className="text-lg font-medium text-white mb-3">Progress</h3>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${(selectedCampaign.sentCount / selectedCampaign.targetCount) * 100}%` 
                        }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                      {selectedCampaign.sentCount} of {selectedCampaign.targetCount} messages sent
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    {selectedCampaign.status === 'draft' && (
                      <>
                        <Button size="sm" onClick={() => launchCampaign(selectedCampaign)}>
                          Launch Campaign
                        </Button>
                        <Button variant="outline" size="sm">
                          Schedule
                        </Button>
                      </>
                    )}
                    {selectedCampaign.status === 'scheduled' && (
                      <>
                        <Button size="sm" onClick={() => launchCampaign(selectedCampaign)}>
                          Launch Now
                        </Button>
                        <Button variant="outline" size="sm">
                          Edit Schedule
                        </Button>
                      </>
                    )}
                    {selectedCampaign.status === 'active' && (
                      <>
                        <Button variant="outline" size="sm">
                          Pause
                        </Button>
                        <Button variant="outline" size="sm">
                          Stop
                        </Button>
                      </>
                    )}
                    <Button variant="outline" size="sm">
                      Edit
                    </Button>
                    <Button variant="outline" size="sm">
                      Analytics
                    </Button>
                    <Button variant="outline" size="sm">
                      Duplicate
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="text-4xl mb-4">📈</div>
                  <h3 className="text-lg font-medium text-white mb-2">Select a Campaign</h3>
                  <p className="text-gray-400">Choose a campaign from the list to view details</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
