'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Pin {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  link: string;
  boardId: string;
  createdAt: string;
}

export default function PinterestPins() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [loading, setLoading] = useState(true);
  const [boardFilter, setBoardFilter] = useState('');

  useEffect(() => {
    fetchPins();
  }, [boardFilter]);

  const fetchPins = async () => {
    try {
      const url = boardFilter 
        ? `/api/pinterest/pins?boardId=${boardFilter}`
        : '/api/pinterest/pins';
      
      const response = await fetch(url);
      const data = await response.json();
      setPins(data.pins || []);
    } catch (error) {
      console.error('Failed to fetch pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="text-lg">Loading pins...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex space-x-4">
            <Input
              placeholder="Filter by board ID (optional)"
              value={boardFilter}
              onChange={(e) => setBoardFilter(e.target.value)}
              className="flex-1"
            />
            <Button onClick={fetchPins}>
              Filter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pins.map((pin) => (
          <Card key={pin.id} className="hover:shadow-lg transition-shadow">
            <div className="aspect-square overflow-hidden rounded-t-lg">
              <img
                src={pin.imageUrl}
                alt={pin.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = '/placeholder-image.png';
                }}
              />
            </div>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium line-clamp-2 mb-2">{pin.title}</h3>
              <p className="text-xs text-muted-foreground line-clamp-3 mb-3">{pin.description || 'No description'}</p>
              <div className="space-y-2">
                {pin.link && (
                  <a
                    href={pin.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-600 hover:underline block truncate"
                  >
                    {pin.link}
                  </a>
                )}
                <div className="text-xs text-muted-foreground">
                  Board: {pin.boardId}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatDate(pin.createdAt)}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {pins.length === 0 && (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-muted-foreground">No pins found</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
