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
      console.error('Error details:', error.message, error.stack);
      
      // Show error to user
      setMonthlySchedules({ whatsapp: [], posts: [] });
      alert(`Failed to load schedules: ${error.message}`);
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

  const handleUpdateSchedule = async (id: number, newDate: string) => {
    if (!token) return;
    try {
      await updateWhatsAppSchedule(token, id, newDate);
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

  const handleUpdatePost = async (id: number, newDate: string) => {
    if (!token) return;
    try {
      await updatePlatformPostSchedule(token, id, { scheduledAt: newDate });
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
      // Get the date in local timezone
      const localDate = new Date(scheduleDate.getFullYear(), scheduleDate.getMonth(), scheduleDate.getDate());
      const targetDate = new Date(currentYear, currentMonth - 1, day);
      console.log('WhatsApp schedule date:', scheduleDate, 'Local date:', localDate.getDate(), 'Target day:', day);
      console.log('Date comparison:', localDate.getTime(), '===', targetDate.getTime(), '?', localDate.getTime() === targetDate.getTime());
      if (localDate.getTime() === targetDate.getTime()) {
        daySchedules.push({ type: 'whatsapp', item: schedule });
      }
    });
    
    monthlySchedules.posts.forEach((post: any) => {
      const postDate = new Date(post.scheduledAt);
      // Get the date in local timezone
      const localDate = new Date(postDate.getFullYear(), postDate.getMonth(), postDate.getDate());
      const targetDate = new Date(currentYear, currentMonth - 1, day);
      console.log('Post date:', postDate, 'Local date:', localDate.getDate(), 'Target day:', day);
      console.log('Date comparison:', localDate.getTime(), '===', targetDate.getTime(), '?', localDate.getTime() === targetDate.getTime());
      if (localDate.getTime() === targetDate.getTime()) {
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
        <h1 className="text-3xl font-bold">Schedules</h1>
        <p className="text-gray-600">Manage your scheduled WhatsApp messages and platform posts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">
              {monthNames[currentMonth - 1]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => navigateMonth('prev')}>
                ← Previous
              </Button>
              <Button variant="outline" onClick={() => navigateMonth('next')}>
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
              <div className="text-sm text-gray-600">
                Total WhatsApp schedules: {monthlySchedules.whatsapp.length} | 
                Total posts: {monthlySchedules.posts.length}
              </div>
              {monthlySchedules.whatsapp.length > 0 && (
                <div className="text-xs text-green-600">
                  WhatsApp schedules: {monthlySchedules.whatsapp.map(w => new Date(w.scheduledAt).getDate()).join(', ')}
                </div>
              )}
              {monthlySchedules.posts.length > 0 && (
                <div className="text-xs text-blue-600">
                  Posts: {monthlySchedules.posts.map(p => new Date(p.scheduledAt).getDate()).join(', ')}
                </div>
              )}
              <div className="text-xs text-gray-500">
                Calendar: {daysInMonth} days, starts on day {firstDay}
              </div>
              <div className="grid grid-cols-7 gap-2 border rounded-lg p-4 bg-gray-50">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="p-3 text-center font-semibold text-gray-700 bg-white rounded border">
                    {day}
                  </div>
                ))}
                
                {/* Empty cells for days before month starts */}
                {Array.from({ length: firstDay }).map((_, index) => (
                  <div key={`empty-${index}`} className="p-3 h-16 bg-white border rounded"></div>
                ))}
                
                {/* Days of the month */}
                {Array.from({ length: daysInMonth }, (_, index) => {
                  const day = index + 1;
                  const daySchedules = getSchedulesForDay(day);
                  const isToday = day === new Date().getDate() && 
                                 currentMonth === new Date().getMonth() + 1 && 
                                 currentYear === new Date().getFullYear();
                  
                  return (
                    <div
                      key={day}
                      className={`p-3 h-16 border rounded cursor-pointer hover:bg-blue-50 relative flex flex-col ${
                        isToday ? 'bg-blue-100 border-blue-300' : 'bg-white'
                      }`}
                      onClick={() => handleDayClick(day)}
                    >
                      <div className={`font-semibold text-sm ${isToday ? 'text-blue-800' : ''}`}>
                        {day} {isToday ? '(Today)' : ''}
                      </div>
                      {daySchedules.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {daySchedules.slice(0, 2).map((schedule, idx) => (
                            <div
                              key={idx}
                              className={`text-xs px-1 py-0.5 rounded ${
                                schedule.type === 'whatsapp' 
                                  ? 'bg-green-100 text-green-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {schedule.type === 'whatsapp' ? 'WA' : 'Post'}
                            </div>
                          ))}
                          {daySchedules.length > 2 && (
                            <div className="text-xs text-gray-500">+{daySchedules.length - 2}</div>
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
              <Button variant="outline" onClick={handleCancelSchedule}>
                Close
              </Button>
            </div>
            
            {selectedDaySchedules.length === 0 ? (
              <p className="text-gray-500">No scheduled items for this day</p>
            ) : (
              <div className="space-y-4">
                {selectedDaySchedules.map(({ type, item }) => (
                  <div key={`${type}_${item.id}`} className="border rounded p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm font-medium">
                          {type === 'whatsapp' ? 'WhatsApp' : 'Post'} #{item.id}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.scheduledAt).toLocaleString()}
                        </div>
                        {type === 'whatsapp' && item.payload?.message && (
                          <div className="text-xs text-gray-600 mt-1">
                            {item.payload.message.substring(0, 50)}...
                          </div>
                        )}
                        {type === 'post' && item.content && (
                          <div className="text-xs text-gray-600 mt-1">
                            {item.content.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="datetime-local" 
                          className="px-2 py-1 border rounded text-sm" 
                          defaultValue={new Date(item.scheduledAt).toISOString().slice(0, 16)}
                          onChange={(e) => (item.__newDate = e.target.value)} 
                        />
                        <Button 
                          size="sm" 
                          onClick={() => {
                            if (item.__newDate) {
                              if (type === 'whatsapp') {
                                handleUpdateSchedule(item.id, item.__newDate);
                              } else {
                                handleUpdatePost(item.id, item.__newDate);
                              }
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



