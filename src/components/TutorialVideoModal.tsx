"use client";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen } from "lucide-react";
import { Tutorial } from "@/types/tutorial";

interface TutorialVideoModalProps {
  tutorial: Tutorial | null;
  onClose: () => void;
  onViewIncrement?: (tutorialId: number) => void;
}

export function TutorialVideoModal({ 
  tutorial, 
  onClose,
  onViewIncrement 
}: TutorialVideoModalProps) {
  useEffect(() => {
    if (tutorial && onViewIncrement) {
      onViewIncrement(tutorial.id);
    }
  }, [tutorial, onViewIncrement]);

  if (!tutorial) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="gradient-border rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-600 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2">{tutorial.title}</h3>
            <div className="flex items-center gap-4 text-sm text-gray-300">
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {tutorial.duration ? formatDuration(tutorial.duration) : '--:--'}
              </span>
              <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                {tutorial.category}
              </Badge>
            </div>
          </div>
          <Button
            variant="secondary"
            size="sm"
            onClick={onClose}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            ✕ إغلاق
          </Button>
        </div>
        
        {/* Content */}
        <div className="flex flex-col h-[calc(95vh-120px)]">
          {/* Video Section */}
          {tutorial.youtubeUrl && (
            <div className="w-full flex-shrink-0 bg-black">
              <div className="w-full max-h-[60vh] aspect-video mx-auto">
                <iframe
                  src={getYouTubeEmbedUrl(tutorial.youtubeUrl)}
                  title={tutorial.title || ''}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}
          
          {/* Description Section */}
          <div className="w-full p-6 overflow-y-auto flex-grow [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2 sticky top-0 bg-fixed-40 backdrop-blur py-2 z-10">
              <BookOpen className="w-5 h-5 text-primary" />
              وصف الشرح
            </h4>
            
            {tutorial.description && (
              <div className="text-gray-300 leading-relaxed whitespace-pre-wrap">
                {tutorial.description}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}




















