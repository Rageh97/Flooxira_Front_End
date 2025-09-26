"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  getMonthlySchedules, 
  updateWhatsAppSchedule, 
  deleteWhatsAppSchedule,
  updatePlatformPostSchedule,
  deletePlatformPostSchedule
} from "@/lib/api";

export default function SchedulesPage() {
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

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    if (token) {
      handleLoadMonthlySchedules();
    }
  }, [currentMonth, currentYear, token]);

  const handleLoadMonthlySchedules = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const response = await getMonthlySchedules(token, currentMonth, currentYear);
      if (response.success) {
        setMonthlySchedules({
          whatsapp: response.whatsapp || [],
          posts: response.posts || []
        });
      }
    } catch (error) {
      console.error('Failed to load monthly schedules:', error);
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
    
    monthlySchedules.whatsapp.forEach((schedule: any) => {
      const scheduleDate = new Date(schedule.scheduledAt);
      if (scheduleDate.getDate() === day) {
        daySchedules.push(schedule);
      }
    });
    
    monthlySchedules.posts.forEach((post: any) => {
      const postDate = new Date(post.scheduledAt);
      if (postDate.getDate() === day) {
        daySchedules.push(post);
      }
    });
    
    return daySchedules;
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysInMonth = getDaysInMonth(currentMonth, currentYear);
  const firstDay = getFirstDayOfMonth(currentMonth, currentYear);

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Schedules</h1>
        <p className="text-gray-600">Manage your scheduled WhatsApp messages and platform posts</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>
              {monthNames[currentMonth - 1]} {currentYear}
            </CardTitle>
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
            <div className="grid grid-cols-7 gap-1">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="p-2 text-center font-semibold text-gray-600 border-b">
                  {day}
                </div>
              ))}
              
              {/* Empty cells for days before month starts */}
              {Array.from({ length: firstDay }).map((_, index) => (
                <div key={`empty-${index}`} className="p-2 h-20 border"></div>
              ))}
              
              {/* Days of the month */}
              {Array.from({ length: daysInMonth }, (_, index) => {
                const day = index + 1;
                const daySchedules = getSchedulesForDay(day);
                
                return (
                  <div
                    key={day}
                    className="p-2 h-20 border cursor-pointer hover:bg-gray-50 relative"
                    onClick={() => handleDayClick(day)}
                  >
                    <div className="font-semibold">{day}</div>
                    {daySchedules.length > 0 && (
                      <div className="absolute bottom-1 left-1 right-1">
                        <div className="flex flex-wrap gap-1">
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
                      </div>
                    )}
                  </div>
                );
              })}
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
