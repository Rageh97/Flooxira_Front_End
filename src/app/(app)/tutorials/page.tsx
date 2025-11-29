"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Play, 
  Eye, 
  Clock, 
  Search,
  Filter,
  ExternalLink,
  BookOpen
} from "lucide-react";

type Tutorial = {
  id: number;
  title: string;
  description?: string;
  youtubeUrl: string;
  youtubeVideoId?: string;
  thumbnailUrl?: string;
  duration?: number;
  category: string;
  order: number;
  views: number;
  createdAt: string;
  updatedAt: string;
};

export default function TutorialsPage() {
  const [tutorials, setTutorials] = useState<Tutorial[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);
  const [showFullDescription, setShowFullDescription] = useState<boolean>(false);

  useEffect(() => {
    loadTutorials();
  }, []);

  const loadTutorials = async () => {
    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/tutorials`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.success) {
        setTutorials(data.tutorials);
      } else {
        setError(data.message || 'Failed to load tutorials');
      }
    } catch (e: any) {
      console.error('Error loading tutorials:', e);
      setError(e.message || 'Failed to load tutorials');
    } finally {
      setLoading(false);
    }
  };

  const incrementViews = async (tutorialId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      await fetch(`${apiUrl}/api/tutorials/${tutorialId}/view`, {
        method: 'POST'
      });
    } catch (e) {
      console.error('Error incrementing views:', e);
    }
  };

  const handleTutorialClick = (tutorial: Tutorial) => {
    setSelectedTutorial(tutorial);
    setShowFullDescription(false);
    incrementViews(tutorial.id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getYouTubeEmbedUrl = (url: string) => {
    const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : url;
  };

  const filteredTutorials = tutorials.filter(tutorial => {
    const matchesSearch = tutorial.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tutorial.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || tutorial.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['all', ...Array.from(new Set(tutorials.map(t => t.category)))];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4 animate-pulse" />
          <p className="text-gray-300">جاري تحميل الشروحات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card className="bg-card border-none">
          <CardContent className="p-8 text-center">
            <p className="text-red-400">خطأ: {error}</p>
            <Button onClick={loadTutorials} className="mt-4">
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">الشروحات التعليمية</h1>
        <p className="text-gray-300">تعلم كيفية استخدام المنصة بسهولة</p>
      </div>

      {/* Search and Filter */}
      <Card className="gradient-border border-none">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="البحث في الشروحات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10 h-12 text-white"
              />
            </div>
            <div className="flex gap-2">
              {/* <Filter className="w-4 h-4 text-gray-400 mt-2" /> */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-fixed-40 text-white appearance-none px-3 py-2 rounded-md border border-gray-600 focus:border-primary focus:outline-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'جميع التصنيفات' : category}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tutorials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTutorials.map((tutorial) => (
          <div 
            key={tutorial.id} 
            className="bg-card border-none overflow-hidden hover:shadow-lg transition-shadow cursor-pointer rounded-lg"
            onClick={() => handleTutorialClick(tutorial)}
          >
            <div className="relative group">
              <img
                src={tutorial.thumbnailUrl || `https://img.youtube.com/vi/${tutorial.youtubeVideoId}/maxresdefault.jpg`}
                alt={tutorial.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <div className=" transition-opacity duration-300">
                  <div className="bg-red-600 text-white rounded-full p-3">
                    <Play className="w-6 h-6" />
                  </div>
                </div>
              </div>
              <div className="absolute top-2 right-2">
                <Badge variant="outline" className="bg-black/50 text-white border-white/20">
                  {tutorial.category}
                </Badge>
              </div>
              <div className="absolute bottom-2 left-2 flex items-center gap-2 text-white bg-black/50 px-2 py-1 rounded">
                <Clock className="w-4 h-4" />
                <span className="text-sm">
                  {tutorial.duration ? formatDuration(tutorial.duration) : '--:--'}
                </span>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-white mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                {tutorial.title}
              </h3>
              <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                {tutorial.description}
              </p>
              <div className="flex items-center justify-between text-sm text-gray-400">
                {/* <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {tutorial.views} مشاهدة
                </span> */}
                {/* <Button
                  size="sm"
                  variant="secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    window.open(tutorial.youtubeUrl, '_blank');
                  }}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  مشاهدة
                </Button> */}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredTutorials.length === 0 && (
        <Card className="bg-card border-none">
          <CardContent className="p-8 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">لا توجد شروحات</h3>
            <p className="text-gray-300">
              {searchTerm || selectedCategory !== 'all' 
                ? 'لم يتم العثور على شروحات تطابق البحث' 
                : 'لا توجد شروحات متاحة حالياً'
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Video Modal */}
      {selectedTutorial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="gradient-border rounded-lg w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-6 border-b border-gray-600 flex items-center justify-between bg-gradient-to-r from-primary/10 to-secondary/10">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-white mb-2">{selectedTutorial.title}</h3>
                <div className="flex items-center gap-4 text-sm text-gray-300">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedTutorial?.duration ? formatDuration(selectedTutorial.duration) : '--:--'}
                  </span>
                  {/* <span className="flex items-center gap-1">
                    <Eye className="w-4 h-4" />
                    {selectedTutorial?.views || 0} مشاهدة
                  </span> */}
                  <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30">
                    {selectedTutorial?.category}
                  </Badge>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setSelectedTutorial(null);
                  setShowFullDescription(false);
                }}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                ✕ إغلاق
              </Button>
            </div>
            
            {/* Content */}
            <div className="flex flex-col lg:flex-row h-[calc(95vh-120px)]">
              {/* Video Section */}
              <div className="lg:w-2/3 p-6">
                <div className="aspect-video rounded-lg overflow-hidden shadow-lg">
                  <iframe
                    src={getYouTubeEmbedUrl(selectedTutorial?.youtubeUrl || '')}
                    title={selectedTutorial?.title || ''}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
              
              {/* Description Section */}
              <div className="lg:w-1/3 p-6 ">
                <div className="h-full flex flex-col">
                  <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    وصف الشرح
                  </h4>
                  
                  {selectedTutorial?.description && (
                    <div className="flex-1 overflow-hidden">
                      <div className={`text-gray-300 leading-relaxed ${!showFullDescription ? 'line-clamp-6' : ''}`}>
                        {selectedTutorial.description}
                      </div>
                      
                      {selectedTutorial.description.length > 200 && (
                        <div className="mt-4">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowFullDescription(!showFullDescription)}
                            className="w-full bg-primary/20 hover:bg-primary/30 text-primary border-primary/30"
                          >
                            {showFullDescription ? 'عرض أقل' : 'عرض المزيد'}
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  {/* <div className="mt-6 space-y-3">
                    <Button
                      onClick={() => window.open(selectedTutorial?.youtubeUrl, '_blank')}
                      className="w-full bg-red-600 hover:bg-red-700 text-white"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      مشاهدة على يوتيوب
                    </Button>
                    
                    <Button
                      variant="secondary"
                      onClick={() => {
                        if (selectedTutorial?.youtubeUrl) {
                          navigator.clipboard.writeText(selectedTutorial.youtubeUrl);
                          // يمكن إضافة toast notification هنا
                        }
                      }}
                      className="w-full bg-gray-600 hover:bg-gray-700 text-white"
                    >
                      📋 نسخ الرابط
                    </Button>
                  </div> */}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}













