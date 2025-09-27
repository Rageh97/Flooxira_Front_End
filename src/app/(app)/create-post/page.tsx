"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useMutation } from "@tanstack/react-query";
import { apiFetch, listPinterestBoards } from "@/lib/api";

export default function CreatePostPage() {
  const [text, setText] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [when, setWhen] = useState<string>("");
  const [type, setType] = useState<'text' | 'link' | 'photo' | 'video'>("text");
  const [format, setFormat] = useState<'feed' | 'reel' | 'story'>("feed");
  const [linkUrl, setLinkUrl] = useState<string>("");
  const [hashtags, setHashtags] = useState<string>("");
  const [message, setMessage] = useState<string>("");
  const [platforms, setPlatforms] = useState<string[]>(['facebook']);
  const [pinterestBoardId, setPinterestBoardId] = useState<string>("");
  const [pinterestBoards, setPinterestBoards] = useState<Array<{ id: string; name: string }>>([]);
  
  const mutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem("auth_token") || "";
      const scheduledAt = when ? new Date(when).toISOString() : undefined;
      let mediaUrl: string | undefined = undefined;
      
      // Validation: Reels require a video file
      if (format === 'reel') {
        if (!image || !image.type?.startsWith('video')) {
          throw new Error('Reels require a video file. Please upload a video.');
        }
        // Force type to video for reels
        setType('video');
      }
      
      // Validation: Stories require photo or video
      if (format === 'story') {
        if (!image) {
          throw new Error('Stories require a photo or video file.');
        }
        if (type === 'text' || type === 'link') {
          throw new Error('Stories must be photo or video type.');
        }
      }
      
      // Validation: photo/video types require a file
      if ((type === 'photo' || type === 'video') && !image) {
        throw new Error('Please upload a media file for photo/video posts.');
      }
      
      // Upload file if present
      if (image) {
        console.log('Starting file upload for:', image.name, 'Type:', image.type, 'Size:', image.size);
        
        const form = new FormData();
        form.append("file", image);
        const uploadRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/api/uploads`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: form,
        });
        
        console.log('Upload response status:', uploadRes.status);
        console.log('Upload response headers:', Object.fromEntries(uploadRes.headers.entries()));
        
        const uploadText = await uploadRes.text();
        console.log('Upload response text:', uploadText);
        
        let uploaded: any = null;
        try { 
          uploaded = uploadText ? JSON.parse(uploadText) : null; 
          console.log('Parsed upload response:', uploaded);
        } catch (e) {
          console.error('Failed to parse upload response:', e);
          throw new Error(`Upload failed (${uploadRes.status}): ${uploadText?.slice(0, 120)}`);
        }
        
        if (!uploadRes.ok) {
          const errorMsg = uploaded?.details || uploaded?.message || `Upload failed (${uploadRes.status})`;
          throw new Error(errorMsg);
        }
        
        mediaUrl = uploaded.url;
        console.log('Extracted mediaUrl:', mediaUrl);
        
        // Harmonize type with uploaded file if needed
        const isVideo = image.type?.startsWith('video');
        const isImage = image.type?.startsWith('image');
        
        if (format === 'reel' && !isVideo) {
          throw new Error('Reels require a video file.');
        }
        
        if (type === 'photo' && isVideo) {
          // Auto-correct to video if user selected photo but uploaded a video
          setType('video');
        }
        
        if (type === 'video' && isImage) {
          throw new Error('You selected video type but uploaded an image. Switch type to Photo or upload a video.');
        }
      }
      
      // Ensure type is video for reels
      const finalType = format === 'reel' ? 'video' : type;
      
      // Debug logging
      console.log('Creating post with payload:', {
        type: finalType,
        content: text,
        linkUrl: linkUrl || undefined,
        mediaUrl,
        hashtags,
        format,
        scheduledAt,
        platforms,
        pinterestBoardId: platforms.includes('pinterest') ? (pinterestBoardId || undefined) : undefined
      });
      
      const res = await apiFetch<{ post: any }>("/api/posts", {
        method: "POST",
        body: JSON.stringify({ 
          type: finalType, 
          content: text, 
          linkUrl: linkUrl || undefined, 
          mediaUrl, 
          hashtags, 
          format, 
          scheduledAt,
          timezoneOffset: scheduledAt ? new Date().getTimezoneOffset() : undefined,
          platforms,
          pinterestBoardId: platforms.includes('pinterest') ? (pinterestBoardId || undefined) : undefined
        }),
        authToken: token,
      });
      
      return res.post;
    },
    onSuccess: (post) => {
      setMessage(post.status === "published" ? "Post published!" : (post.status === "scheduled" ? "Post scheduled" : "Draft saved"));
      setText("");
      setWhen("");
      setImage(null);
      setLinkUrl("");
      setHashtags("");
      setPinterestBoardId("");
    },
  });

  const togglePlatform = (platform: string) => {
    if (platforms.includes(platform)) {
      setPlatforms(platforms.filter(p => p !== platform));
      if (platform === 'pinterest') {
        setPinterestBoardId("");
      }
    } else {
      setPlatforms([...platforms, platform]);
    }
  };

  // Load Pinterest boards when Pinterest is selected
  const loadPinterestBoards = async () => {
    try {
      const token = localStorage.getItem('auth_token') || '';
      if (!token) return;
      const res = await listPinterestBoards(token);
      setPinterestBoards(res.boards || []);
      // if no current selection, preselect first
      if (!pinterestBoardId && res.boards?.length) setPinterestBoardId(res.boards[0].id);
    } catch {}
  };

  // Auto-load boards when Pinterest is selected
  useEffect(() => {
    if (platforms.includes('pinterest')) {
      loadPinterestBoards();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [platforms.includes('pinterest')]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Create Post</h1>
      <Card>
        <CardHeader>Composer</CardHeader>
        <CardContent className="space-y-4">
          {/* Platform Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">Platforms</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={platforms.includes('facebook')}
                  onChange={() => togglePlatform('facebook')}
                  className="rounded"
                />
                <span>Facebook</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={platforms.includes('instagram')}
                  onChange={() => togglePlatform('instagram')}
                  className="rounded"
                />
                <span>Instagram</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={platforms.includes('tiktok')}
                  onChange={() => togglePlatform('tiktok')}
                  className="rounded"
                />
                <span>🎵 TikTok</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={platforms.includes('youtube')}
                  onChange={() => togglePlatform('youtube')}
                  className="rounded"
                />
                <span>▶️ YouTube</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={platforms.includes('linkedin')}
                  onChange={() => togglePlatform('linkedin')}
                  className="rounded"
                />
                <span>💼 LinkedIn</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={platforms.includes('pinterest')}
                  onChange={() => togglePlatform('pinterest')}
                  className="rounded"
                />
                <span>📌 Pinterest</span>
              </label>
            </div>
            {platforms.length === 0 && (
              <p className="text-sm text-red-600 mt-1">Please select at least one platform</p>
            )}
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select 
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm" 
                value={type} 
                onChange={e => setType(e.target.value as any)}
                disabled={format === 'reel'} // Disable type selection for reels
              >
                <option value="text">Text</option>
                <option value="link">Link</option>
                <option value="photo">Photo</option>
                <option value="video">Video</option>
              </select>
              {format === 'reel' && <p className="mt-1 text-xs text-gray-500">Reels are always video type</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Format</label>
              <select className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm" value={format} onChange={e => setFormat(e.target.value as any)}>
                <option value="feed">Feed Post</option>
                <option value="reel">Reel</option>
                <option value="story">Story</option>
              </select>
            </div>
          </div>
          
          <Textarea
            placeholder="#Write your post with hashtags and emojis"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          {platforms.includes('pinterest') && (
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium mb-1">Pinterest Board</label>
                <Button size="sm" variant="outline" onClick={loadPinterestBoards}>Refresh Boards</Button>
              </div>
              <select
                className="h-9 w-full rounded-md border border-gray-300 bg-white px-3 text-sm"
                value={pinterestBoardId}
                onChange={(e) => setPinterestBoardId(e.target.value)}
                onFocus={() => { if (pinterestBoards.length === 0) loadPinterestBoards(); }}
              >
                <option value="">{pinterestBoards.length ? 'Select a board...' : 'No boards found (create one in Pinterest)'}</option>
                {pinterestBoards.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">Required to publish to Pinterest.</p>
            </div>
          )}
          
          {type === 'link' && (
            <div>
              <label className="block text-sm font-medium mb-1">Link URL</label>
              <Input placeholder="https://example.com" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium mb-1">Hashtags (comma or space separated)</label>
            <Input placeholder="#social #marketing" value={hashtags} onChange={(e) => setHashtags(e.target.value)} />
          </div>
          
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium mb-1">
                {format === 'reel' ? 'Video (MP4 recommended)' : 
                 format === 'story' ? 'Media (Photo/Video)' :
                 type === 'video' ? 'Video' : 
                 type === 'photo' ? 'Image' : 'Media (Image/Video)'}
              </label>
              <Input
                type="file"
                accept={format === 'reel' ? 'video/*' : 
                        format === 'story' ? 'image/*,video/*' :
                        type === 'video' ? 'video/*' : 
                        type === 'photo' ? 'image/jpeg,image/png' : 'image/jpeg,image/png,video/*'}
                onChange={(e) => setImage(e.target.files?.[0] || null)}
              />
              {format === 'reel' && <p className="mt-1 text-xs text-gray-500">Reels require a video file. Images are not supported by Facebook for Reels.</p>}
              {format === 'story' && <p className="mt-1 text-xs text-gray-500">Stories support both photos and videos.</p>}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Schedule (ISO date time)</label>
              <Input
                type="datetime-local"
                value={when}
                onChange={(e) => setWhen(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || platforms.length === 0}>
              {mutation.isPending ? "Saving..." : "Save / Schedule"}
            </Button>
            <Button variant="ghost" onClick={() => { setWhen(""); mutation.mutate(); }} disabled={mutation.isPending || platforms.length === 0}>
              {mutation.isPending ? "Posting..." : "Post now"}
            </Button>
          </div>
          
          {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
          {message && <p className="text-sm text-green-700">{message}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
