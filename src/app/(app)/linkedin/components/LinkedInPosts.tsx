"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { createLinkedInPost, getLinkedInPosts } from "@/lib/api";

interface LinkedInPostsProps {
  onMessage: (message: string) => void;
}

export default function LinkedInPosts({ onMessage }: LinkedInPostsProps) {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [postVisibility, setPostVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>('PUBLIC');

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    try {
      const res = await getLinkedInPosts(token, 10);
      if (res.ok) setPosts(res.posts || []);
    } catch {}
  };

  const handleCreatePost = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    if (!newPostText.trim()) {
      onMessage('Please enter post text');
      return;
    }
    
    setLoading(true);
    try {
      const res = await createLinkedInPost(token, newPostText, postVisibility);
      onMessage(res.ok ? 'Post created successfully' : (res.message || 'Failed to create post'));
      if (res.ok) {
        setNewPostText("");
        await loadPosts();
      }
    } catch (e) {
      onMessage('Failed to create post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold">Create New Post</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Post Content</label>
            <textarea
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              placeholder="What's on your mind? Share your professional insights..."
              className="w-full border rounded px-3 py-2 min-h-[120px]"
              maxLength={3000}
            />
            <p className="text-xs text-gray-500 mt-1">{newPostText.length}/3000 characters</p>
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-2">Visibility</label>
            <select
              value={postVisibility}
              onChange={(e) => setPostVisibility(e.target.value as 'PUBLIC' | 'CONNECTIONS')}
              className="border rounded px-3 py-2"
            >
              <option value="PUBLIC">Public - Anyone on or off LinkedIn</option>
              <option value="CONNECTIONS">Connections only</option>
            </select>
          </div>
          
          <Button 
            onClick={handleCreatePost} 
            disabled={loading || !newPostText.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {loading ? 'Posting...' : 'Post to LinkedIn'}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Recent Posts ({posts.length})</h2>
            <Button size="sm" variant="outline" onClick={loadPosts} disabled={loading}>
              {loading ? 'Loading...' : 'Refresh'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {posts.length === 0 ? (
            <p className="text-sm text-gray-600">No posts found. Create your first post above!</p>
          ) : (
            <div className="space-y-4">
              {posts.map((post, index) => (
                <div key={post.id || index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div className="text-sm text-gray-500">
                      {post.created ? new Date(post.created.time).toLocaleDateString() : 'Unknown date'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {post.visibility?.com?.linkedin?.ugc?.MemberNetworkVisibility || 'Unknown visibility'}
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    {post.specificContent?.['com.linkedin.ugc.ShareContent']?.shareCommentary?.text || 
                     post.text || 
                     'No content available'}
                  </div>
                  
                  <div className="flex gap-2 text-sm text-gray-500">
                    <span>ID: {post.id || 'N/A'}</span>
                    <span>•</span>
                    <span>Status: {post.lifecycleState || 'Unknown'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}








