"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listContentItems, createContentItem, getContentItem, updateContentItem, deleteContentItem, scheduleContentItem, ContentItem, checkPlatformConnections } from "@/lib/api";

type Platform = 'facebook' | 'instagram' | 'linkedin' | 'pinterest' | 'tiktok' | 'youtube';

export default function CategoryDetailPage() {
  const params = useParams();
  const router = useRouter();
  const categoryId = useMemo(() => Number(params?.categoryId), [params]);
  const token = typeof window !== 'undefined' ? (localStorage.getItem("auth_token") || "") : "";

  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [attachments, setAttachments] = useState<ContentItem['attachments']>([]);
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [scheduledAt, setScheduledAt] = useState<string>("");
  const [connections, setConnections] = useState<{[k in Platform]?: boolean}>({});

  const load = async () => {
    if (!categoryId) return;
    try {
      const res = await listContentItems(token, categoryId);
      setItems(res.items);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    load(); 
    (async () => {
      try {
        const tokenLocal = localStorage.getItem('auth_token') || '';
        const { connections } = await checkPlatformConnections(tokenLocal);
        setConnections(connections as any);
      } catch (e) {}
    })();
  }, [categoryId]);

  const onCreate = async () => {
    if (!title.trim()) return;
    await createContentItem(token, categoryId, { title, body, attachments });
    setTitle("");
    setBody("");
    setAttachments([]);
    await load();
  };

  const onSelectItem = async (id: number) => {
    const res = await getContentItem(token, id);
    const item = res.item as any;
    const normalizedAttachments = Array.isArray(item.attachments)
      ? item.attachments
      : (typeof item.attachments === 'string' ? (JSON.parse(item.attachments || '[]') || []) : []);
    setSelectedItem({ ...item, attachments: normalizedAttachments });
    setTitle(item.title || "");
    setBody(item.body || "");
    setAttachments(normalizedAttachments || []);
    setPlatforms((item.platforms as Platform[]) || []);
    setScheduledAt(item.scheduledAt ? item.scheduledAt.slice(0,16) : "");
  };

  const onSave = async () => {
    if (!selectedItem) return;
    await updateContentItem(token, selectedItem.id, {
      title, body, attachments, platforms,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    });
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this item?")) return;
    await deleteContentItem(token, id);
    if (selectedItem?.id === id) setSelectedItem(null);
    await load();
  };

  const uploadSingle = async (file: File) => {
    const form = new FormData();
    form.append('file', file);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'https://api.flooxira.com'}/api/uploads`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: form
    });
    if (!res.ok) throw new Error('Upload failed');
    const data = await res.json();
    const type: any = (file.type.startsWith('video') ? 'video' : (file.type.startsWith('image') ? 'image' : 'file'));
    return { url: data.url, type } as { url: string; type: 'image' | 'video' | 'file' };
  };

  const onUpload = async (files: FileList) => {
    const arr = Array.from(files);
    const uploaded = await Promise.all(arr.map(uploadSingle));
    const next = [...attachments, ...uploaded];
    setAttachments(next);
    if (selectedItem) {
      try {
        await updateContentItem(token, selectedItem.id, { attachments: next });
        const res = await getContentItem(token, selectedItem.id);
        setSelectedItem(res.item);
      } catch (e) {
        console.error('Auto-save attachments failed', e);
      }
    }
  };

  const removeAttachment = (idx: number) => {
    const next = attachments.filter((_, i) => i !== idx);
    setAttachments(next);
    if (selectedItem) {
      updateContentItem(token, selectedItem.id, { attachments: next })
        .then(async () => {
          const res = await getContentItem(token, selectedItem.id);
          setSelectedItem(res.item);
        })
        .catch(() => {});
    }
  }

  const onSchedule = async () => {
    if (!selectedItem) return;
    // ensure all chosen platforms connected
    const anyDisconnected = platforms.some((p) => connections[p] === false);
    if (anyDisconnected) {
      alert('Please connect selected platforms first');
      return;
    }
    await scheduleContentItem(token, selectedItem.id, {
      platforms: platforms as string[],
      format: 'feed',
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : null
    });
    alert('Scheduled! Check Schedules.');
    router.push('/schedule');
  };

  const togglePlatform = (p: Platform) => {
    setPlatforms((prev) => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-white">
      <div className="lg:col-span-1 space-y-4">
        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold">Items</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <div>Loading...</div>
            ) : items.length === 0 ? (
              <div>No items yet</div>
            ) : (
              items.map((it) => (
                <div key={it.id} className="flex items-center justify-between gap-2">
                  <div 
                    role="button" 
                    className="flex-1 hover:underline cursor-pointer"
                    onClick={() => onSelectItem(it.id)}
                  >
                    {it.title}
                  </div>
                  <Button variant="secondary" className="bg-red-600 text-white" onClick={() => onDelete(it.id)}>Delete</Button>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold">New Item</h3>
          </CardHeader>
          <CardContent className="space-y-2">
            <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
            <Textarea placeholder="Write anything..." value={body} onChange={(e) => setBody(e.target.value)} />
            <input type="file" onChange={(e) => e.target.files && onUpload(e.target.files[0])} />
            <div className="flex flex-wrap gap-2">
              {attachments.map((a, idx) => (
                <div key={idx} className="text-xs bg-gray-800 px-2 py-1 rounded">
                  {a.type}: {a.url?.slice(0, 30)}
                </div>
              ))}
            </div>
            <Button onClick={onCreate} className="button-primary">Add</Button>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card className="bg-card border-none">
          <CardHeader>
            <h3 className="text-lg font-semibold">Editor</h3>
          </CardHeader>
          <CardContent className="space-y-3">
            {!selectedItem ? (
              <div className="text-gray-300">Select an item to edit</div>
            ) : (
              <>
                <Input placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} />
                <Textarea placeholder="Write anything..." value={body} onChange={(e) => setBody(e.target.value)} />
                <div className="space-y-2">
                  <div className="text-sm">Attachments</div>
                  <input type="file" multiple accept="image/*,video/*" onChange={(e) => e.target.files && onUpload(e.target.files)} />
                  <input type="file" multiple accept="image/*,video/*" onChange={(e) => e.target.files && onUpload(e.target.files)} />
                  <div className="flex flex-wrap gap-3">
                    {attachments.map((a, idx) => (
                      <div key={idx} className="relative">
                        {a.type === 'image' ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={a.url} alt="attachment" className="w-24 h-24 object-cover rounded" />
                        ) : a.type === 'video' ? (
                          <video src={a.url} className="w-24 h-24 object-cover rounded" />
                        ) : (
                          <a href={a.url} target="_blank" className="text-xs underline">File</a>
                        )}
                        <button 
                          className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full"
                          onClick={() => removeAttachment(idx)}
                          aria-label="Remove attachment"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">Platforms</div>
                  <div className="flex flex-wrap gap-2">
                    {(['facebook','instagram','linkedin','pinterest','tiktok','youtube'] as Platform[]).map((p) => {
                      const selected = platforms.includes(p);
                      const connected = connections[p] === true;
                      return (
                        <button
                          key={p}
                          onClick={() => togglePlatform(p)}
                          className={`px-3 py-1 rounded flex items-center gap-2 ${selected ? 'bg-primary text-white' : 'bg-gray-700'}`}
                          title={connected ? 'Connected' : 'Not connected'}
                        >
                          <span className={`inline-block w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-gray-400'}`} />
                          {p}
                          {selected && (
                            <span
                              className="ml-1 text-xs bg-red-600 text-white rounded px-1"
                              onClick={(e) => { e.stopPropagation(); togglePlatform(p); }}
                            >x</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm">Schedule</div>
                  <input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                    className="bg-gray-900 p-2 rounded"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={onSave} className="button-primary">Save</Button>
                  <Button 
                    onClick={onSchedule} 
                    className="bg-green-600 text-white"
                    disabled={platforms.length === 0 || platforms.some((p) => connections[p] === false)}
                    title={platforms.length === 0 ? 'Select platforms' : (platforms.some(p => connections[p] === false) ? 'Connect selected platforms' : 'Schedule')}
                  >
                    Schedule
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


