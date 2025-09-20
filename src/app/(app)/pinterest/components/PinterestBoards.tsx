'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Board {
  id: string;
  name: string;
  description: string;
  privacy: string;
  pinCount: number;
  followerCount: number;
}

interface CreatePinData {
  boardId: string;
  title: string;
  description: string;
  imageUrl: string;
  linkUrl: string;
}

export default function PinterestBoards() {
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreatePin, setShowCreatePin] = useState(false);
  const [selectedBoard, setSelectedBoard] = useState<Board | null>(null);
  const [createPinData, setCreatePinData] = useState<CreatePinData>({
    boardId: '',
    title: '',
    description: '',
    imageUrl: '',
    linkUrl: ''
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBoards();
  }, []);

  const fetchBoards = async () => {
    try {
      const response = await fetch('/api/pinterest/boards');
      const data = await response.json();
      setBoards(data.boards || []);
    } catch (error) {
      console.error('Failed to fetch boards:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePin = (board: Board) => {
    setSelectedBoard(board);
    setCreatePinData(prev => ({ ...prev, boardId: board.id }));
    setShowCreatePin(true);
  };

  const handleSubmitPin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);

    try {
      const response = await fetch('/api/pinterest/pins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(createPinData),
      });

      const data = await response.json();

      if (response.ok) {
        alert('Pin created successfully!');
        setShowCreatePin(false);
        setCreatePinData({
          boardId: '',
          title: '',
          description: '',
          imageUrl: '',
          linkUrl: ''
        });
      } else {
        alert(`Failed to create pin: ${data.message}`);
      }
    } catch (error) {
      console.error('Failed to create pin:', error);
      alert('Failed to create pin');
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading boards...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Create Pin Modal */}
      {showCreatePin && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <h3 className="text-lg font-semibold">Create Pin</h3>
              <p className="text-sm text-muted-foreground">Create a new pin in "{selectedBoard?.name}"</p>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmitPin} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Title *</label>
                  <Input
                    value={createPinData.title}
                    onChange={(e) => setCreatePinData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter pin title"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <Textarea
                    value={createPinData.description}
                    onChange={(e) => setCreatePinData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter pin description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Image URL *</label>
                  <Input
                    value={createPinData.imageUrl}
                    onChange={(e) => setCreatePinData(prev => ({ ...prev, imageUrl: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    required
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium">Link URL</label>
                  <Input
                    value={createPinData.linkUrl}
                    onChange={(e) => setCreatePinData(prev => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://example.com"
                  />
                </div>
                
                <div className="flex space-x-2">
                  <Button type="submit" disabled={creating}>
                    {creating ? 'Creating...' : 'Create Pin'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setShowCreatePin(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Boards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {boards.map((board) => (
          <Card key={board.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <h3 className="text-lg font-semibold">{board.name}</h3>
              <p className="text-sm text-muted-foreground">{board.description || 'No description'}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Pins: {board.pinCount}</span>
                  <span>Followers: {board.followerCount}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className={`px-2 py-1 rounded ${
                    board.privacy === 'PUBLIC' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {board.privacy}
                  </span>
                </div>
                <Button 
                  onClick={() => handleCreatePin(board)}
                  className="w-full mt-4"
                >
                  Create Pin
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {boards.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No boards found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
