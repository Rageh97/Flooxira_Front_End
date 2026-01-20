"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { getYouTubeChannels, selectYouTubeChannel } from "@/lib/api";
import { BookOpenCheck } from "lucide-react";
import { useToast } from "@/components/ui/toast-provider";

interface YouTubeChannel {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  subscriberCount: number;
  videoCount: number;
}

interface YouTubeChannelSelectionProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export default function YouTubeChannelSelection({ isOpen, onClose, onComplete }: YouTubeChannelSelectionProps) {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { showError } = useToast();

  const getFriendlyErrorMessage = (message: string) => {
    if (message.includes('invalid_client')) {
      return 'فشل الاتصال بخدمة YouTube. قد يكون هناك مشكلة في إعدادات التطبيق أو انتهت صلاحية الجلسة. يرجى محاولة إعادة ربط القناة من الإعدادات.';
    }
    if (message.includes('access_denied')) {
      return 'تم رفض الوصول. يرجى التأكد من منح كافة الصلاحيات المطلوبة عند ربط حساب YouTube.';
    }
    return message;
  };

  useEffect(() => {
    if (isOpen) {
      loadYouTubeChannels();
    }
  }, [isOpen]);

  const loadYouTubeChannels = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      console.log('Loading YouTube channels with token:', !!token);
      
      const response = await getYouTubeChannels(token);
      console.log('YouTube channels response:', response);
      
      if (response.channels) {
        console.log('Setting channels:', response.channels);
        setChannels(response.channels);
      } else {
        console.log('No channels found in response');
      }
    } catch (error) {
      console.error('Error loading YouTube channels:', error);
      const originalMessage = error instanceof Error ? error.message : 'Unknown error';
      showError("خطأ في تحميل القنوات", getFriendlyErrorMessage(originalMessage));
    } finally {
      setLoading(false);
    }
  };

  const handleChannelSelection = async (channelId: string) => {
    console.log('Channel selection clicked:', channelId);
    try {
      setLoading(true);
      const token = localStorage.getItem('auth_token') || '';
      console.log('Token found:', !!token);
      
      const channel = channels.find(c => c.id === channelId);
      console.log('Channel found:', channel);
      
      if (channel) {
        console.log('Calling selectYouTubeChannel...');
        const result = await selectYouTubeChannel(token, channelId, channel.title);
        console.log('selectYouTubeChannel result:', result);
        
        setSelectedChannel(channelId);
        
        // Complete the setup
        onComplete();
        onClose();
      }
    } catch (error) {
      console.error('Error selecting YouTube channel:', error);
      const originalMessage = error instanceof Error ? error.message : 'Unknown error';
      showError("خطأ في اختيار القناة", getFriendlyErrorMessage(originalMessage));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="gradient-border rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl text-primary font-semibold text-center flex-1">
              اختر قناة YouTube
            </h2>
            <button
              onClick={onClose}
              className="text-red-500 hover:text-red-700 text-4xl font-bold"
            >
              ×
            </button>
          </div>

          <div className="space-y-4">
            <p className="text-sm text-gray-300 text-center">
              اختر القناة التي تريد النشر عليها
            </p>
            
            {/* Debug info */}
            <div className="text-xs text-gray-300 text-center">
              قنوات متاحة: {channels.length} 
            </div>
            
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-sm text-gray-300 mt-2">جاري تحميل قنوات YouTube...</p>
              </div>
            ) : channels.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {channels.map((channel) => (
                  <div
                    key={channel.id} 
                    className={`cursor-pointer transition-all border rounded-lg p-4 ${
                      selectedChannel === channel.id 
                        ? 'bg-fixed-40 border-primary' 
                        : 'bg-fixed-40 border-primary'
                    }`}
                    onClick={() => {
                      console.log('Channel card clicked:', channel.id);
                      handleChannelSelection(channel.id);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {channel.thumbnail ? (
                        <img 
                          src={channel.thumbnail} 
                          alt={channel.title}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                          <span className="text-xl text-yellow-500"><BookOpenCheck /></span>
                        </div>
                      )}
                      <div className="flex-1">
                        <h3 className="font-semibold text-primary">{channel.title}</h3>
                        <p className="text-sm text-white">قناة YouTube</p>
                        {channel.description && (
                          <p className="text-xs text-gray-300 mt-1 line-clamp-2">
                            {channel.description}
                          </p>
                        )}
                        <div className="flex space-x-4 mt-2 text-xs text-gray-200">
                          <span>{channel.subscriberCount.toLocaleString()} مشترك</span>
                          <span>{channel.videoCount.toLocaleString()} فيديو</span>
                        </div>
                      </div>
                      {selectedChannel === channel.id && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-green-500 text-sm">✓</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">▶️</div>
                <p className="text-gray-200 mb-4">لا توجد قنوات YouTube متاحة</p>
                <p className="text-sm text-gray-300">تأكد من أن لديك قنوات YouTube مرتبطة بحسابك</p>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4">
            <div className="flex space-x-2">
              <Button className="primary-button after:bg-red-500" variant="outline" onClick={onClose}>
                إلغاء
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}