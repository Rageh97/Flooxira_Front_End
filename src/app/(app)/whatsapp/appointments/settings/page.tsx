"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, X } from "lucide-react";

interface AppointmentSettings {
  enabled: boolean;
  defaultDuration: number;
  bufferTime: number;
  maxAppointmentsPerDay: number | null;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  workingDays: number[];
  workingHoursStart: string;
  workingHoursEnd: string;
  timeSlots: { [key: string]: string[] } | null;
  timeSlotInterval: number;
  breakTimes: Array<{ start: string; end: string; days: number[] }> | null;
  blockedDates: string[] | null;
  blockedDays: number[] | null;
  blockedTimeSlots: { [key: string]: string[] } | null;
  serviceSettings: { [key: string]: { duration: number; price?: number; timeSlots?: string[] } } | null;
  allowSameDayBooking: boolean;
  allowOnlineBooking: boolean;
  requireConfirmation: boolean;
  autoConfirm: boolean;
  sendReminders: boolean;
  reminderHoursBefore: number;
  sendConfirmation: boolean;
  timezone: string;
  dateFormat: string;
  timeFormat: '12h' | '24h';
  bookingSuccessMessage: string | null;
  bookingFailureMessage: string | null;
  noAvailableSlotsMessage: string | null;
  reminderMessage: string | null;
  confirmationMessage: string | null;
  orderMissingFieldsTemplate?: string | null;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' }
];

const TIMEZONES = [
  { value: 'Asia/Makkah', label: 'مكة المكرمة (GMT+3)' },
  { value: 'Asia/Dubai', label: 'دبي (GMT+4)' },
  { value: 'Asia/Kuwait', label: 'الكويت (GMT+3)' },
  { value: 'Asia/Bahrain', label: 'البحرين (GMT+3)' },
  { value: 'Asia/Qatar', label: 'قطر (GMT+3)' },
  { value: 'Asia/Muscat', label: 'مسقط (GMT+4)' },
  { value: 'Africa/Cairo', label: 'القاهرة (GMT+2)' },
  { value: 'Asia/Beirut', label: 'بيروت (GMT+2)' },
  { value: 'Asia/Amman', label: 'عمان (GMT+2)' }
];

export default function AppointmentSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [settings, setSettings] = useState<AppointmentSettings>({
    enabled: true,
    defaultDuration: 60,
    bufferTime: 15,
    maxAppointmentsPerDay: null,
    advanceBookingDays: 90,
    minimumNoticeHours: 24,
    workingDays: [1, 2, 3, 4, 5],
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    timeSlots: null,
    timeSlotInterval: 30,
    breakTimes: null,
    blockedDates: null,
    blockedDays: null,
    blockedTimeSlots: null,
    serviceSettings: null,
    allowSameDayBooking: true,
    allowOnlineBooking: true,
    requireConfirmation: false,
    autoConfirm: true,
    sendReminders: true,
    reminderHoursBefore: 24,
    sendConfirmation: true,
    timezone: 'Asia/Riyadh',
    dateFormat: 'YYYY-MM-DD',
    timeFormat: '24h',
    bookingSuccessMessage: null,
    bookingFailureMessage: null,
    noAvailableSlotsMessage: null,
    reminderMessage: null,
    confirmationMessage: null,
    orderMissingFieldsTemplate: null
  });

  const [newBreakTime, setNewBreakTime] = useState({ start: '12:00', end: '13:00', days: [] as number[] });
  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newTimeSlot, setNewTimeSlot] = useState({ day: 'default', time: '' });
  const [newBlockedTimeSlot, setNewBlockedTimeSlot] = useState({ day: '0', time: '' });

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/appointment-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings({
            enabled: data.data.enabled ?? true,
            defaultDuration: data.data.defaultDuration ?? 60,
            bufferTime: data.data.bufferTime ?? 15,
            maxAppointmentsPerDay: data.data.maxAppointmentsPerDay ?? null,
            advanceBookingDays: data.data.advanceBookingDays ?? 90,
            minimumNoticeHours: data.data.minimumNoticeHours ?? 24,
            workingDays: data.data.workingDays || [1, 2, 3, 4, 5],
            workingHoursStart: data.data.workingHoursStart?.substring(0, 5) || '09:00',
            workingHoursEnd: data.data.workingHoursEnd?.substring(0, 5) || '17:00',
            timeSlots: data.data.timeSlots || null,
            timeSlotInterval: data.data.timeSlotInterval ?? 30,
            breakTimes: data.data.breakTimes || null,
            blockedDates: data.data.blockedDates || null,
            blockedDays: data.data.blockedDays || null,
            blockedTimeSlots: data.data.blockedTimeSlots || null,
            serviceSettings: data.data.serviceSettings || null,
            allowSameDayBooking: data.data.allowSameDayBooking ?? true,
            allowOnlineBooking: data.data.allowOnlineBooking ?? true,
            requireConfirmation: data.data.requireConfirmation ?? false,
            autoConfirm: data.data.autoConfirm ?? true,
            sendReminders: data.data.sendReminders ?? true,
            reminderHoursBefore: data.data.reminderHoursBefore ?? 24,
            sendConfirmation: data.data.sendConfirmation ?? true,
            timezone: data.data.timezone || 'Asia/Riyadh',
            dateFormat: data.data.dateFormat || 'YYYY-MM-DD',
            timeFormat: data.data.timeFormat || '24h',
            bookingSuccessMessage: data.data.bookingSuccessMessage || null,
            bookingFailureMessage: data.data.bookingFailureMessage || null,
            noAvailableSlotsMessage: data.data.noAvailableSlotsMessage || null,
            reminderMessage: data.data.reminderMessage || null,
            confirmationMessage: data.data.confirmationMessage || null,
            orderMissingFieldsTemplate: data.data.orderMissingFieldsTemplate || null
          });
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const response = await fetch('/api/appointment-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSuccess('تم حفظ الإعدادات بنجاح');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleWorkingDayChange = (dayValue: number, checked: boolean) => {
    if (checked) {
      setSettings(prev => ({
        ...prev,
        workingDays: [...prev.workingDays, dayValue]
      }));
    } else {
      setSettings(prev => ({
        ...prev,
        workingDays: prev.workingDays.filter(day => day !== dayValue)
      }));
    }
  };

  const addBreakTime = () => {
    if (!settings.breakTimes) {
      setSettings(prev => ({ ...prev, breakTimes: [] }));
    }
    setSettings(prev => ({
      ...prev,
      breakTimes: [...(prev.breakTimes || []), { ...newBreakTime }]
    }));
    setNewBreakTime({ start: '12:00', end: '13:00', days: [] });
  };

  const removeBreakTime = (index: number) => {
    setSettings(prev => ({
      ...prev,
      breakTimes: prev.breakTimes?.filter((_, i) => i !== index) || null
    }));
  };

  const addBlockedDate = () => {
    if (newBlockedDate) {
      setSettings(prev => ({
        ...prev,
        blockedDates: [...(prev.blockedDates || []), newBlockedDate]
      }));
      setNewBlockedDate('');
    }
  };

  const removeBlockedDate = (date: string) => {
    setSettings(prev => ({
      ...prev,
      blockedDates: prev.blockedDates?.filter(d => d !== date) || null
    }));
  };

  const addTimeSlot = () => {
    if (newTimeSlot.time) {
      const dayKey = newTimeSlot.day;
      setSettings(prev => ({
        ...prev,
        timeSlots: {
          ...(prev.timeSlots || {}),
          [dayKey]: [...(prev.timeSlots?.[dayKey] || []), newTimeSlot.time]
        }
      }));
      setNewTimeSlot({ day: 'default', time: '' });
    }
  };

  const removeTimeSlot = (day: string, time: string) => {
    setSettings(prev => ({
      ...prev,
      timeSlots: {
        ...(prev.timeSlots || {}),
        [day]: (prev.timeSlots?.[day] || []).filter(t => t !== time)
      }
    }));
  };

  const addBlockedTimeSlot = () => {
    if (newBlockedTimeSlot.time) {
      const dayKey = newBlockedTimeSlot.day;
      setSettings(prev => ({
        ...prev,
        blockedTimeSlots: {
          ...(prev.blockedTimeSlots || {}),
          [dayKey]: [...(prev.blockedTimeSlots?.[dayKey] || []), newBlockedTimeSlot.time]
        }
      }));
      setNewBlockedTimeSlot({ day: '0', time: '' });
    }
  };

  const removeBlockedTimeSlot = (day: string, time: string) => {
    setSettings(prev => ({
      ...prev,
      blockedTimeSlots: {
        ...(prev.blockedTimeSlots || {}),
        [day]: (prev.blockedTimeSlots?.[day] || []).filter(t => t !== time)
      }
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-white">جاري تحميل الإعدادات...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">إعدادات المواعيد</h1>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-800 px-4 py-3 rounded">
          {success}
        </div>
      )}

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-secondry inner-shadow ">
          <TabsTrigger value="general" className="text-white">عام</TabsTrigger>
          <TabsTrigger value="schedule" className="text-white">الجدولة</TabsTrigger>
          <TabsTrigger value="restrictions" className="text-white">القيود</TabsTrigger>
          <TabsTrigger value="notifications" className="text-white">الإشعارات</TabsTrigger>
          <TabsTrigger value="messages" className="text-white">الرسائل</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general" className="space-y-6">
          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="text-white">الإعدادات العامة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center flex-col gap-2">
                <h2 className="text-white">تفعيل نظام المواعيد</h2>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    id="enabled"
                    checked={settings.enabled}
                    onChange={(e) => setSettings(prev => ({ ...prev, enabled: e.target.checked }))}
                    type="checkbox"
                    className="sr-only peer"
                  />
                  <div className="group peer ring-0 bg-rose-400 rounded-full outline-none duration-300 after:duration-300 w-24 h-12 shadow-md peer-checked:bg-emerald-500 peer-focus:outline-none after:content-[''] after:rounded-full after:absolute after:bg-gray-50 after:outline-none after:h-10 after:w-10 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:translate-x-12 peer-hover:after:scale-95">
                    <svg className="absolute top-1 left-12 stroke-gray-900 w-10 h-10" height="100" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100" width="100" x="0" xmlns="http://www.w3.org/2000/svg" y="0">
                      <path className="svg-fill-primary" d="M50,18A19.9,19.9,0,0,0,30,38v8a8,8,0,0,0-8,8V74a8,8,0,0,0,8,8H70a8,8,0,0,0,8-8V54a8,8,0,0,0-8-8H38V38a12,12,0,0,1,23.6-3,4,4,0,1,0,7.8-2A20.1,20.1,0,0,0,50,18Z"></path>
                    </svg>
                    <svg className="absolute top-1 left-1 stroke-gray-900 w-10 h-10" height="100" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100" width="100" x="0" xmlns="http://www.w3.org/2000/svg" y="0">
                      <path d="M30,46V38a20,20,0,0,1,40,0v8a8,8,0,0,1,8,8V74a8,8,0,0,1-8,8H30a8,8,0,0,1-8-8V54A8,8,0,0,1,30,46Zm32-8v8H38V38a12,12,0,0,1,24,0Z" fillRule="evenodd"></path>
                    </svg>
                  </div>
                </label>
              </div>

              {settings.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="defaultDuration" className="text-white">مدة الموعد الافتراضية (دقيقة)</Label>
                      <Input
                        id="defaultDuration"
                        type="number"
                        min="15"
                        max="480"
                        value={settings.defaultDuration}
                        onChange={(e) => setSettings(prev => ({ ...prev, defaultDuration: parseInt(e.target.value) || 60 }))}
                        className="bg-[#011910] text-white border-gray-500"
                      />
                    </div>
                    <div>
                      <Label htmlFor="bufferTime" className="text-white">وقت الفاصل بين المواعيد (دقيقة)</Label>
                      <Input
                        id="bufferTime"
                        type="number"
                        min="0"
                        max="120"
                        value={settings.bufferTime}
                        onChange={(e) => setSettings(prev => ({ ...prev, bufferTime: parseInt(e.target.value) || 15 }))}
                        className="bg-[#011910] text-white border-gray-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="maxAppointmentsPerDay" className="text-white">الحد الأقصى للمواعيد في اليوم</Label>
                      <Input
                        id="maxAppointmentsPerDay"
                        type="number"
                        min="1"
                        value={settings.maxAppointmentsPerDay || ''}
                        onChange={(e) => setSettings(prev => ({ ...prev, maxAppointmentsPerDay: e.target.value ? parseInt(e.target.value) : null }))}
                        className="bg-[#011910] text-white border-gray-500"
                        placeholder="غير محدود"
                      />
                    </div>
                    <div>
                      <Label htmlFor="advanceBookingDays" className="text-white">عدد الأيام المتاحة للحجز مسبقاً</Label>
                      <Input
                        id="advanceBookingDays"
                        type="number"
                        min="1"
                        max="365"
                        value={settings.advanceBookingDays}
                        onChange={(e) => setSettings(prev => ({ ...prev, advanceBookingDays: parseInt(e.target.value) || 90 }))}
                        className="bg-[#011910] text-white border-gray-500"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="minimumNoticeHours" className="text-white">الحد الأدنى لساعات الإشعار قبل الموعد</Label>
                    <Input
                      id="minimumNoticeHours"
                      type="number"
                      min="1"
                      max="168"
                      value={settings.minimumNoticeHours}
                      onChange={(e) => setSettings(prev => ({ ...prev, minimumNoticeHours: parseInt(e.target.value) || 24 }))}
                      className="bg-[#011910] text-white border-gray-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="timezone" className="text-white">المنطقة الزمنية</Label>
                      <Select
                        value={settings.timezone}
                        onValueChange={(value) => setSettings(prev => ({ ...prev, timezone: value }))}
                      >
                        <SelectTrigger className="bg-[#011910] text-white border-gray-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIMEZONES.map((tz) => (
                            <SelectItem key={tz.value} value={tz.value}>
                              {tz.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="timeFormat" className="text-white">صيغة الوقت</Label>
                      <Select
                        value={settings.timeFormat}
                        onValueChange={(value: '12h' | '24h') => setSettings(prev => ({ ...prev, timeFormat: value }))}
                      >
                        <SelectTrigger className="bg-[#011910] text-white border-gray-500">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="24h">24 ساعة</SelectItem>
                          <SelectItem value="12h">12 ساعة</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-white">خيارات الحجز</Label>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowSameDayBooking"
                          checked={settings.allowSameDayBooking}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowSameDayBooking: checked as boolean }))}
                        />
                        <Label htmlFor="allowSameDayBooking" className="text-white">السماح بالحجز في نفس اليوم</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="allowOnlineBooking"
                          checked={settings.allowOnlineBooking}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowOnlineBooking: checked as boolean }))}
                        />
                        <Label htmlFor="allowOnlineBooking" className="text-white">السماح بالحجز عبر الإنترنت/البوت</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="requireConfirmation"
                          checked={settings.requireConfirmation}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireConfirmation: checked as boolean }))}
                        />
                        <Label htmlFor="requireConfirmation" className="text-white">يتطلب تأكيد الموعد قبل الحجز</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="autoConfirm"
                          checked={settings.autoConfirm}
                          onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoConfirm: checked as boolean }))}
                        />
                        <Label htmlFor="autoConfirm" className="text-white">تأكيد الموعد تلقائياً</Label>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Schedule Settings Tab */}
        <TabsContent value="schedule" className="space-y-6">
          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="text-white">إعدادات الجدولة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white mb-3 block">أيام العمل</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={settings.workingDays.includes(day.value)}
                        onCheckedChange={(checked) => handleWorkingDayChange(day.value, checked as boolean)}
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-white">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="workingHoursStart" className="text-white">وقت بداية العمل</Label>
                  <Input
                    id="workingHoursStart"
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={(e) => setSettings(prev => ({ ...prev, workingHoursStart: e.target.value }))}
                    className="bg-[#011910] text-white border-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="workingHoursEnd" className="text-white">وقت نهاية العمل</Label>
                  <Input
                    id="workingHoursEnd"
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={(e) => setSettings(prev => ({ ...prev, workingHoursEnd: e.target.value }))}
                    className="bg-[#011910] text-white border-gray-500"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="timeSlotInterval" className="text-white">الفترة الزمنية بين الأوقات المتاحة (دقيقة)</Label>
                <Input
                  id="timeSlotInterval"
                  type="number"
                  min="15"
                  max="120"
                  step="15"
                  value={settings.timeSlotInterval}
                  onChange={(e) => setSettings(prev => ({ ...prev, timeSlotInterval: parseInt(e.target.value) || 30 }))}
                  className="bg-[#011910] text-white border-gray-500"
                />
              </div>

              <div>
                <Label className="text-white mb-2 block">الأوقات المتاحة (اختياري - اتركه فارغاً لاستخدام الأوقات التلقائية)</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Select
                      value={newTimeSlot.day}
                      onValueChange={(value) => setNewTimeSlot(prev => ({ ...prev, day: value }))}
                    >
                      <SelectTrigger className="bg-[#011910] text-white border-gray-500 w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">افتراضي</SelectItem>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={String(day.value)}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      type="time"
                      value={newTimeSlot.time}
                      onChange={(e) => setNewTimeSlot(prev => ({ ...prev, time: e.target.value }))}
                      className="bg-[#011910] text-white border-gray-500 flex-1"
                      placeholder="اختر الوقت"
                    />
                    <Button onClick={addTimeSlot} className="primary-button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  {settings.timeSlots && Object.entries(settings.timeSlots).map(([day, times]) => (
                    times.length > 0 && (
                      <div key={day} className="bg-[#011910] p-3 rounded">
                        <div className="text-white font-semibold mb-2">
                          {day === 'default' ? 'افتراضي' : DAYS_OF_WEEK.find(d => String(d.value) === day)?.label}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {times.map((time, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded">
                              <span className="text-white">{time}</span>
                              <button
                                onClick={() => removeTimeSlot(day, time)}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">أوقات الراحة</Label>
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="time"
                      value={newBreakTime.start}
                      onChange={(e) => setNewBreakTime(prev => ({ ...prev, start: e.target.value }))}
                      className="bg-[#011910] text-white border-gray-500"
                      placeholder="بداية الراحة"
                    />
                    <Input
                      type="time"
                      value={newBreakTime.end}
                      onChange={(e) => setNewBreakTime(prev => ({ ...prev, end: e.target.value }))}
                      className="bg-[#011910] text-white border-gray-500"
                      placeholder="نهاية الراحة"
                    />
                    <Button onClick={addBreakTime} className="primary-button">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="text-white text-sm mb-2">أيام الراحة:</div>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {DAYS_OF_WEEK.map((day) => (
                      <div key={day.value} className="flex items-center space-x-2">
                        <Checkbox
                          checked={newBreakTime.days.includes(day.value)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setNewBreakTime(prev => ({ ...prev, days: [...prev.days, day.value] }));
                            } else {
                              setNewBreakTime(prev => ({ ...prev, days: prev.days.filter(d => d !== day.value) }));
                            }
                          }}
                        />
                        <Label className="text-white text-sm">{day.label}</Label>
                      </div>
                    ))}
                  </div>
                  {settings.breakTimes && settings.breakTimes.map((breakTime, index) => (
                    <div key={index} className="flex items-center gap-2 bg-[#011910] p-3 rounded">
                      <span className="text-white">
                        {breakTime.start} - {breakTime.end}
                        {breakTime.days.length > 0 && ` (${breakTime.days.map(d => DAYS_OF_WEEK.find(day => day.value === d)?.label).join(', ')})`}
                      </span>
                      <button
                        onClick={() => removeBreakTime(index)}
                        className="text-red-400 hover:text-red-300 ml-auto"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Restrictions Tab */}
        <TabsContent value="restrictions" className="space-y-6">
          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="text-white">القيود والقيود</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-white mb-2 block">الأيام المحظورة</Label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        checked={settings.blockedDays?.includes(day.value) || false}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSettings(prev => ({
                              ...prev,
                              blockedDays: [...(prev.blockedDays || []), day.value]
                            }));
                          } else {
                            setSettings(prev => ({
                              ...prev,
                              blockedDays: prev.blockedDays?.filter(d => d !== day.value) || null
                            }));
                          }
                        }}
                      />
                      <Label className="text-white">{day.label}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label className="text-white mb-2 block">التواريخ المحظورة</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    type="date"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="bg-[#011910] text-white border-gray-500"
                  />
                  <Button onClick={addBlockedDate} className="primary-button">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {settings.blockedDates && settings.blockedDates.map((date, index) => (
                  <div key={index} className="flex items-center justify-between bg-[#011910] p-2 rounded mb-2">
                    <span className="text-white">{date}</span>
                    <button
                      onClick={() => removeBlockedDate(date)}
                      className="text-red-400 hover:text-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div>
                <Label className="text-white mb-2 block">الأوقات المحظورة</Label>
                <div className="flex gap-2 mb-2">
                  <Select
                    value={newBlockedTimeSlot.day}
                    onValueChange={(value) => setNewBlockedTimeSlot(prev => ({ ...prev, day: value }))}
                  >
                    <SelectTrigger className="bg-[#011910] text-white border-gray-500 w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={String(day.value)}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="time"
                    value={newBlockedTimeSlot.time}
                    onChange={(e) => setNewBlockedTimeSlot(prev => ({ ...prev, time: e.target.value }))}
                    className="bg-[#011910] text-white border-gray-500 flex-1"
                  />
                  <Button onClick={addBlockedTimeSlot} className="primary-button">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                {settings.blockedTimeSlots && Object.entries(settings.blockedTimeSlots).map(([day, times]) => (
                  times.length > 0 && (
                    <div key={day} className="bg-[#011910] p-3 rounded mb-2">
                      <div className="text-white font-semibold mb-2">
                        {DAYS_OF_WEEK.find(d => String(d.value) === day)?.label}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {times.map((time, idx) => (
                          <div key={idx} className="flex items-center gap-1 bg-gray-700 px-2 py-1 rounded">
                            <span className="text-white">{time}</span>
                            <button
                              onClick={() => removeBlockedTimeSlot(day, time)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="text-white">إعدادات الإشعارات</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendReminders"
                  checked={settings.sendReminders}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendReminders: checked as boolean }))}
                />
                <Label htmlFor="sendReminders" className="text-white">إرسال تذكيرات المواعيد</Label>
              </div>

              {settings.sendReminders && (
                <div>
                  <Label htmlFor="reminderHoursBefore" className="text-white">عدد الساعات قبل الموعد لإرسال التذكير</Label>
                  <Input
                    id="reminderHoursBefore"
                    type="number"
                    min="1"
                    max="168"
                    value={settings.reminderHoursBefore}
                    onChange={(e) => setSettings(prev => ({ ...prev, reminderHoursBefore: parseInt(e.target.value) || 24 }))}
                    className="bg-[#011910] text-white border-gray-500"
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="sendConfirmation"
                  checked={settings.sendConfirmation}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, sendConfirmation: checked as boolean }))}
                />
                <Label htmlFor="sendConfirmation" className="text-white">إرسال رسالة تأكيد عند الحجز</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card className="gradient-border">
            <CardHeader>
              <CardTitle className="text-white">الرسائل المخصصة</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label htmlFor="bookingSuccessMessage" className="text-white">رسالة نجاح الحجز (عند أخذ المعلومات وإنشاء الموعد)</Label>
                <Textarea
                  id="bookingSuccessMessage"
                  value={settings.bookingSuccessMessage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, bookingSuccessMessage: e.target.value || null }))}
                  className="bg-[#011910] text-white border-gray-500"
                  rows={4}
                  placeholder="رسالة مخصصة عند نجاح الحجز (اتركه فارغاً للرسالة الافتراضية)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  هذه الرسالة تُرسل عند أخذ معلومات الحجز وإنشاء الموعد
                </p>
              </div>

              <div>
                <Label htmlFor="confirmationMessage" className="text-white">رسالة تأكيد الموعد (عند تغيير الحالة إلى مؤكد)</Label>
                <Textarea
                  id="confirmationMessage"
                  value={settings.confirmationMessage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, confirmationMessage: e.target.value || null }))}
                  className="bg-[#011910] text-white border-gray-500"
                  rows={4}
                  placeholder="رسالة مخصصة عند تأكيد الموعد (اتركه فارغاً للرسالة الافتراضية)"
                />
                <p className="text-xs text-gray-400 mt-1">
                  هذه الرسالة تُرسل تلقائياً عند تغيير حالة الموعد إلى "مؤكد" من لوحة الإدارة
                </p>
              </div>

              <div>
                <Label htmlFor="bookingFailureMessage" className="text-white">رسالة فشل الحجز</Label>
                <Textarea
                  id="bookingFailureMessage"
                  value={settings.bookingFailureMessage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, bookingFailureMessage: e.target.value || null }))}
                  className="bg-[#011910] text-white border-gray-500"
                  rows={3}
                  placeholder="رسالة مخصصة عند فشل الحجز (اتركه فارغاً للرسالة الافتراضية)"
                />
              </div>

              <div>
                <Label htmlFor="noAvailableSlotsMessage" className="text-white">رسالة عدم توفر مواعيد</Label>
                <Textarea
                  id="noAvailableSlotsMessage"
                  value={settings.noAvailableSlotsMessage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, noAvailableSlotsMessage: e.target.value || null }))}
                  className="bg-[#011910] text-white border-gray-500"
                  rows={3}
                  placeholder="رسالة مخصصة عند عدم توفر مواعيد (اتركه فارغاً للرسالة الافتراضية)"
                />
              </div>

              <div>
                <Label htmlFor="reminderMessage" className="text-white">رسالة التذكير</Label>
                <Textarea
                  id="reminderMessage"
                  value={settings.reminderMessage || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, reminderMessage: e.target.value || null }))}
                  className="bg-[#011910] text-white border-gray-500"
                  rows={3}
                  placeholder="رسالة مخصصة للتذكير (اتركه فارغاً للرسالة الافتراضية)"
                />
              </div>

              {/* <div>
                <Label htmlFor="orderMissingFieldsTemplate" className="text-white">قالب رسالة الطلب (حر بالكامل)</Label>
                <Textarea
                  id="orderMissingFieldsTemplate"
                  value={settings.orderMissingFieldsTemplate || ''}
                  onChange={(e) => setSettings(prev => ({ ...prev, orderMissingFieldsTemplate: e.target.value || null }))}
                  className="bg-[#011910] text-white border-gray-500"
                  rows={6}
                  placeholder={"اكتب القالب الذي تريد أن يرسله البوت عند طلب معلومات الطلب.\nيمكنك كتابته بحرية تامة، وبدون التقيد بحقوق ثابتة.\nمثال:\n— من فضلك أرسل تفاصيل طلبك بشكل يناسبك.\n— إن رغبت: الاسم، المنتج، الكمية، المدينة، العنوان، طريقة التسليم والدفع."}
                />
                <p className="text-xs text-gray-400 mt-1">
                  هذا القالب يُستخدم كما هو. لا حاجة لحقول محددة. في حال تركه فارغاً، سيستخدم البوت رسالة افتراضية ذكية.
                </p>
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button 
          onClick={saveSettings}
          disabled={saving}
          className="primary-button"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
      </div>
    </div>
  );
}



