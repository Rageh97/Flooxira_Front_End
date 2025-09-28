"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { 
  getMonthlySchedules, 
  updateWhatsAppSchedule, 
  deleteWhatsAppSchedule,
  updatePlatformPostSchedule,
  deletePlatformPostSchedule
} from "@/lib/api";

export default function SchedulePage() {
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1);
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [monthlySchedules, setMonthlySchedules] = useState<any>({ whatsapp: [], posts: [] });
  const [selectedDaySchedules, setSelectedDaySchedules] = useState<any[]>([]);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<any>(null);
  const [editScheduleDate, setEditScheduleDate] = useState("");
  const [editScheduleMessage, setEditScheduleMessage] = useState("");
  const [editScheduleMedia, setEditScheduleMedia] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const token = typeof window !== 'undefined' ? (localStorage.getItem('token') || localStorage.getItem('auth_token')) : null;
  
  // Debug localStorage
  if (typeof window !== 'undefined') {
    console.log('LocalStorage keys:', Object.keys(localStorage));
    console.log('Token found:', !!token);
    console.log('Token value:', token ? token.substring(0, 20) + '...' : 'null');
  }

  useEffect(() => {
    if (token) {
      handleLoadMonthlySchedules();
      // Also test direct API calls
      testDirectAPIs();
    }
  }, [currentMonth, currentYear, token]);

  const testDirectAPIs = async () => {
    try {
      console.log('Testing direct API calls...');
      
      // Test posts API
      const postsResponse = await fetch('/api/posts', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const postsData = await postsResponse.json();
      console.log('Direct posts API response:', postsData);
      
      // Test WhatsApp schedules API
      const schedulesResponse = await fetch('/api/whatsapp/schedules', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const schedulesData = await schedulesResponse.json();
      console.log('Direct WhatsApp schedules API response:', schedulesData);
      
    } catch (error) {
      console.error('Direct API test failed:', error);
    }
  };

  const handleLoadMonthlySchedules = async () => {
    if (!token) {
      console.log('No token found');
      return;
    }
    try {
      setLoading(true);
      console.log('Loading schedules for:', currentMonth, currentYear);
      console.log('Token:', token.substring(0, 20) + '...');
      
      const response = await getMonthlySchedules(token, currentMonth, currentYear);
      console.log('Full API response:', response);
      
      if (response && response.success) {
        console.log('Setting monthly schedules:', {
          whatsapp: response.whatsapp || [],
          posts: response.posts || []
        });
        setMonthlySchedules({
          whatsapp: response.whatsapp || [],
          posts: response.posts || []
        });
      } else {
        console.log('API response not successful:', response);
        // Try to fetch all posts to see if there are any
        try {
          const allPostsResponse = await fetch('/api/posts', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const allPosts = await allPostsResponse.json();
          console.log('All posts response:', allPosts);
        } catch (e) {
          console.log('Failed to fetch all posts:', e);
        }
      }
    } catch (error) {
      console.error('Failed to load monthly schedules:', error);
      console.error('Error details:', (error as Error).message, (error as Error).stack);
      
      // Show error to user
      setMonthlySchedules({ whatsapp: [], posts: [] });
      alert(`Failed to load schedules: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDayClick = (day: number) => {
    const daySchedules: any[] = [];
    
    // Add WhatsApp schedules for this day
    monthlySchedules.whatsapp.forEach((schedule: any) => {
      const scheduleDate = new Date(schedule.scheduledAt);
      if (scheduleDate.getDate() === day) {
        daySchedules.push({ type: 'whatsapp', item: schedule });
      }
    });
    
    // Add platform posts for this day
    monthlySchedules.posts.forEach((post: any) => {
      const postDate = new Date(post.scheduledAt);
      if (postDate.getDate() === day) {
        daySchedules.push({ type: 'post', item: post });
      }
    });
    
    setSelectedDaySchedules(daySchedules);
    setIsEditModalOpen(true);
  };

  const handleUpdateSchedule = async (id: number, newDate: string, newContent?: string, newMedia?: File | null) => {
    if (!token) return;
    try {
      await updateWhatsAppSchedule(token, id, newDate, newContent, newMedia);
      handleLoadMonthlySchedules();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update schedule:', error);
    }
  };

  const handleDeleteSchedule = async (id: number) => {
    if (!token) return;
    try {
      await deleteWhatsAppSchedule(token, id);
      handleLoadMonthlySchedules();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to delete schedule:', error);
    }
  };

  const handleUpdatePost = async (id: number, newDate: string, newContent?: string, newMedia?: File | null) => {
    if (!token) return;
    try {
      await updatePlatformPostSchedule(token, id, { 
        scheduledAt: newDate,
        ...(newContent && { content: newContent }),
        ...(newMedia && { media: newMedia })
      });
      handleLoadMonthlySchedules();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to update post:', error);
    }
  };

  const handleDeletePost = async (id: number) => {
    if (!token) return;
    try {
      await deletePlatformPostSchedule(token, id);
      handleLoadMonthlySchedules();
      setIsEditModalOpen(false);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const handleCancelSchedule = () => {
    setIsEditModalOpen(false);
    setSelectedDaySchedules([]);
  };

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    return new Date(year, month - 1, 1).getDay();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (currentMonth === 1) {
        setCurrentMonth(12);
        setCurrentYear(currentYear - 1);
      } else {
        setCurrentMonth(currentMonth - 1);
      }
    } else {
      if (currentMonth === 12) {
        setCurrentMonth(1);
        setCurrentYear(currentYear + 1);
      } else {
        setCurrentMonth(currentMonth + 1);
      }
    }
  };

  const getSchedulesForDay = (day: number) => {
    const daySchedules: any[] = [];
    
    console.log('Getting schedules for day:', day);
    console.log('WhatsApp schedules:', monthlySchedules.whatsapp);
    console.log('Posts:', monthlySchedules.posts);
    
    monthlySchedules.whatsapp.forEach((schedule: any) => {
      const scheduleDate = new Date(schedule.scheduledAt);
      // Compare just the date parts (year, month, day) ignoring time
      const scheduleYear = scheduleDate.getFullYear();
      const scheduleMonth = scheduleDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      const scheduleDay = scheduleDate.getDate();
      
      console.log('WhatsApp schedule:', {
        original: schedule.scheduledAt,
        parsed: scheduleDate.toISOString(),
        year: scheduleYear,
        month: scheduleMonth,
        day: scheduleDay,
        targetYear: currentYear,
        targetMonth: currentMonth,
        targetDay: day
      });
      
      if (scheduleYear === currentYear && scheduleMonth === currentMonth && scheduleDay === day) {
        daySchedules.push({ type: 'whatsapp', item: schedule });
      }
    });
    
    monthlySchedules.posts.forEach((post: any) => {
      const postDate = new Date(post.scheduledAt);
      // Compare just the date parts (year, month, day) ignoring time
      const postYear = postDate.getFullYear();
      const postMonth = postDate.getMonth() + 1; // getMonth() returns 0-11, we need 1-12
      const postDay = postDate.getDate();
      
      console.log('Post schedule:', {
        original: post.scheduledAt,
        parsed: postDate.toISOString(),
        year: postYear,
        month: postMonth,
        day: postDay,
        targetYear: currentYear,
        targetMonth: currentMonth,
        targetDay: day
      });
      
      if (postYear === currentYear && postMonth === currentMonth && postDay === day) {
        daySchedules.push({ type: 'post', item: post });
      }
    });
    
    console.log('Day schedules for day', day, ':', daySchedules);
    return daySchedules;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  console.log('Rendering calendar with:', { currentMonth, currentYear, daysInMonth, firstDay, monthlySchedules });
  
  // Debug: Check what day January 1st is
  const jan1 = new Date(currentYear, currentMonth - 1, 1);
  console.log(`January 1, ${currentYear}:`, jan1.toDateString(), 'Day of week:', jan1.getDay());

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-white">Schedules</h1>
        <p className="text-gray-600">Manage your scheduled WhatsApp messages and platform posts</p>
      </div>

      <Card className="bg-card border-none">
        <CardHeader className="border-text-primary/50">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">
              {monthNames[currentMonth - 1]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <Button className="text-primary" variant="secondary" onClick={() => navigateMonth('prev')}>
                ← Previous
              </Button>
              <Button className="text-primary" variant="secondary" onClick={() => navigateMonth('next')}>
                Next →
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="text-gray-500">Loading schedules...</div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Color Legend */}
              <div className="flex flex-wrap gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-200 border-2 border-green-400 rounded"></div>
                  <span className="text-white">Today</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-red-200 border-2 border-red-300 rounded"></div>
                  <span className="text-white">Past Days</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-yellow-200 border-2 border-yellow-300 rounded"></div>
                  <span className="text-white">Future Days</span>
                </div>
              </div>
              
              <div className="text-sm text-primary">
                Total WhatsApp schedules: {monthlySchedules.whatsapp.length} | 
                Total posts: {monthlySchedules.posts.length}
              </div>
              {monthlySchedules.whatsapp.length > 0 && (
                <div className="text-xs text-green-600">
                  WhatsApp schedules: {monthlySchedules.whatsapp.map((w: any) => new Date(w.scheduledAt).getDate()).join(', ')}
                </div>
              )}
              {monthlySchedules.posts.length > 0 && (
                <div className="text-xs text-blue-600">
                  Posts: {monthlySchedules.posts.map((p: any) => new Date(p.scheduledAt).getDate()).join(', ')}
                </div>
              )}
              <div className="text-xs text-white">
                Calendar: {daysInMonth} days, starts on day {firstDay}
                    </div>
              <div className="grid grid-cols-7 gap-2  rounded-lg p-4 bg-light-custom">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-primary bg-dark-custom rounded ">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="p-3 h-16 bg-semidark-custom  rounded"></div>
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const daySchedules = getSchedulesForDay(day);
                  const currentDate = new Date();
                  const cellDate = new Date(currentYear, currentMonth - 1, day);
                  
                  // Determine day status
                  const isToday = day === currentDate.getDate() && 
                                 currentMonth === currentDate.getMonth() + 1 && 
                                 currentYear === currentDate.getFullYear();
                  
                  const isPast = cellDate < new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                  const isFuture = cellDate > new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
                  
                  // Set colors based on day status
                  let cellColorClass = '';
                  let textColorClass = '';
                  
                  if (isToday) {
                    cellColorClass = 'bg-green-200 border-green-400';
                    textColorClass = 'text-green-800';
                  } else if (isPast) {
                    cellColorClass = 'bg-red-200 border-red-300';
                    textColorClass = 'text-red-800';
                  } else if (isFuture) {
                    cellColorClass = 'bg-yellow-200 border-yellow-300';
                    textColorClass = 'text-yellow-800';
                  }
                  
                  return (
                    <div
                      key={day}
                      className={`p-3 h-16 rounded cursor-pointer hover:opacity-80 relative flex flex-col border-2 ${cellColorClass}`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className={`font-semibold text-sm ${textColorClass}`}>
                        {day} {isToday ? '(Today)' : ''}
                      </div>
                      {daySchedules.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {daySchedules.slice(0, 2).map((schedule, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-1 py-0.5 rounded font-medium ${
                                schedule.type === 'whatsapp' 
                                  ? 'bg-green-600 text-white' 
                                  : 'bg-blue-600 text-white'
                              }`}
                            >
                              {schedule.type === 'whatsapp' ? 'WA' : 'Post'}
                            </div>
                          ))}
                          {daySchedules.length > 2 && (
                            <div className={`text-xs px-1 py-0.5 rounded bg-gray-600 text-white font-medium`}>
                              +{daySchedules.length - 2}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Scheduled Items</h3>
              <Button variant="secondary" onClick={handleCancelSchedule}>
                Close
              </Button>
            </div>
            
            {selectedDaySchedules.length === 0 ? (
              <p className="text-gray-500">No scheduled items for this day</p>
            ) : (
              <div className="space-y-4">
                {selectedDaySchedules.map(({ type, item }) => (
                  <div key={`${type}_${item.id}`} className="border rounded p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-sm font-medium">
                          {type === 'whatsapp' ? 'WhatsApp' : 'Post'} #{item.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.scheduledAt).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    
                    {/* Content editing */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Message Content</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                        rows={3}
                        defaultValue={type === 'whatsapp' ? (item.payload?.message || '') : (item.content || '')}
                        onChange={(e) => (item.__newContent = e.target.value)}
                        placeholder="Enter message content..."
                      />
                    </div>
                    
                    {/* Media editing */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Media File</label>
                      <div className="space-y-2">
                        {item.mediaPath && (
                          <div className="text-xs text-gray-500">
                            Current media: {item.mediaPath.split('/').pop()}
                          </div>
                        )}
                        <input
                          type="file"
                          accept="image/*,video/*"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                          onChange={(e) => (item.__newMedia = e.target.files?.[0] || null)}
                        />
                        <div className="text-xs text-gray-500">
                          Leave empty to keep current media, or select new file to replace
                        </div>
                      </div>
                    </div>
                    
                    {/* Time editing */}
                    <div>
                      <label className="block text-sm font-medium mb-1">Schedule Time</label>
                      <input 
                        type="datetime-local" 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm" 
                        defaultValue={(() => {
                          const date = new Date(item.scheduledAt);
                          // Get local time components (this handles timezone correctly)
                          const year = date.getFullYear();
                          const month = String(date.getMonth() + 1).padStart(2, '0');
                          const day = String(date.getDate()).padStart(2, '0');
                          const hours = String(date.getHours()).padStart(2, '0');
                          const minutes = String(date.getMinutes()).padStart(2, '0');
                          return `${year}-${month}-${day}T${hours}:${minutes}`;
                        })()}
                        onChange={(e) => (item.__newDate = e.target.value)} 
                      />
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => {
                          if (type === 'whatsapp') {
                            handleUpdateSchedule(item.id, item.__newDate || item.scheduledAt, item.__newContent, item.__newMedia);
                          } else {
                            handleUpdatePost(item.id, item.__newDate || item.scheduledAt, item.__newContent, item.__newMedia);
                          }
                        }}
                      >
                        Update
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => {
                          if (type === 'whatsapp') {
                            handleDeleteSchedule(item.id);
                          } else {
                            handleDeletePost(item.id);
                          }
                        }}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}



