"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

interface BotSettings {
  workingHoursEnabled: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  workingDays: number[];
  timezone: string;
  outsideWorkingHoursMessage: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'الاثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
  { value: 0, label: 'الأحد' }
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

export default function WhatsAppSettingsPage() {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [settings, setSettings] = useState<BotSettings>({
    workingHoursEnabled: false,
    workingHoursStart: '09:00',
    workingHoursEnd: '17:00',
    workingDays: [1, 2, 3, 4, 5],
    timezone: 'Asia/Riyadh',
    outsideWorkingHoursMessage: 'نعتذر، نحن خارج أوقات العمل. سنرد عليك في أقرب وقت ممكن.'
  });

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      loadSettings();
    }
  }, [token]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/bot-settings', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setSettings({
            workingHoursEnabled: data.data.workingHoursEnabled || false,
            workingHoursStart: data.data.workingHoursStart || '09:00',
            workingHoursEnd: data.data.workingHoursEnd || '17:00',
            workingDays: data.data.workingDays || [1, 2, 3, 4, 5],
            timezone: data.data.timezone || 'Asia/Riyadh',
            outsideWorkingHoursMessage: data.data.outsideWorkingHoursMessage || 'نعتذر، نحن خارج أوقات العمل. سنرد عليك في أقرب وقت ممكن.'
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

      const response = await fetch('/api/bot-settings', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setSuccess('تم حفظ الإعدادات بنجاح');
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
        {/* <h1 className="text-2xl font-bold text-white">إعدادات بوت الواتساب</h1> */}
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

      <Card className="gradient-border">
        <CardHeader>
          <CardTitle className="text-white">أوقات العمل</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center flex-col gap-2">
            {/* <Switch
              id="working-hours-enabled"
              checked={settings.workingHoursEnabled}
              onCheckedChange={(checked) => 
                setSettings(prev => ({ ...prev, workingHoursEnabled: checked }))
              }
            />
            <Label htmlFor="working-hours-enabled" className="text-white">
              تفعيل أوقات العمل
            </Label> */}
<h1 className="text-white">تفعيل أوقات العمل</h1>
<label className="relative inline-flex items-center cursor-pointer">
  <input  id="working-hours-enabled"
              checked={settings.workingHoursEnabled}
              onChange={(e) => 
                setSettings(prev => ({ ...prev, workingHoursEnabled: e.target.checked }))
              } type="checkbox" value="" className="sr-only peer"/>
  <div className="group peer ring-0 bg-rose-400  rounded-full outline-none duration-300 after:duration-300 w-24 h-12  shadow-md peer-checked:bg-emerald-500  peer-focus:outline-none  after:content-[''] after:rounded-full after:absolute after:bg-gray-50 after:outline-none after:h-10 after:w-10 after:top-1 after:left-1 after:flex after:justify-center after:items-center peer-checked:after:translate-x-12 peer-hover:after:scale-95">
    <svg className="absolute  top-1 left-12 stroke-gray-900 w-10 h-10" height="100" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100" width="100" x="0" xmlns="http://www.w3.org/2000/svg" y="0">
 <path className="svg-fill-primary" d="M50,18A19.9,19.9,0,0,0,30,38v8a8,8,0,0,0-8,8V74a8,8,0,0,0,8,8H70a8,8,0,0,0,8-8V54a8,8,0,0,0-8-8H38V38a12,12,0,0,1,23.6-3,4,4,0,1,0,7.8-2A20.1,20.1,0,0,0,50,18Z">
 </path>
</svg>
    <svg className="absolute top-1 left-1 stroke-gray-900  w-10 h-10" height="100" preserveAspectRatio="xMidYMid meet" viewBox="0 0 100 100" width="100" x="0" xmlns="http://www.w3.org/2000/svg" y="0">
 <path d="M30,46V38a20,20,0,0,1,40,0v8a8,8,0,0,1,8,8V74a8,8,0,0,1-8,8H30a8,8,0,0,1-8-8V54A8,8,0,0,1,30,46Zm32-8v8H38V38a12,12,0,0,1,24,0Z" fill-rule="evenodd">
 </path>
</svg>
  </div>
</label>
          </div>

          {settings.workingHoursEnabled && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="start-time" className="text-white">وقت البداية</Label>
                  <Input
                    id="start-time"
                    type="time"
                    value={settings.workingHoursStart}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, workingHoursStart: e.target.value }))
                    }
                    className="bg-[#011910] text-white border-gray-500"
                  />
                </div>
                <div>
                  <Label htmlFor="end-time" className="text-white">وقت النهاية</Label>
                  <Input
                    id="end-time"
                    type="time"
                    value={settings.workingHoursEnd}
                    onChange={(e) => 
                      setSettings(prev => ({ ...prev, workingHoursEnd: e.target.value }))
                    }
                    className="bg-[#011910] text-white border-gray-500"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white mb-3 block">أيام العمل</Label>
                <div className="grid grid-cols-2 gap-2">
                  {DAYS_OF_WEEK.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`day-${day.value}`}
                        checked={settings.workingDays.includes(day.value)}
                        onCheckedChange={(checked) => 
                          handleWorkingDayChange(day.value, checked as boolean)
                        }
                      />
                      <Label htmlFor={`day-${day.value}`} className="text-white">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="timezone" className="text-white">المنطقة الزمنية</Label>
                <Select
                  value={settings.timezone}
                  onValueChange={(value) => 
                    setSettings(prev => ({ ...prev, timezone: value }))
                  }
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
                <Label htmlFor="outside-message" className="text-white">رسالة خارج أوقات العمل</Label>
                <Textarea
                  id="outside-message"
                  value={settings.outsideWorkingHoursMessage}
                  onChange={(e) => 
                    setSettings(prev => ({ ...prev, outsideWorkingHoursMessage: e.target.value }))
                  }
                  className="bg-[#011910] text-white border-gray-500"
                  rows={3}
                  placeholder="أدخل الرسالة التي ستظهر خارج أوقات العمل..."
                />
              </div>
            </>
          )}

          <div className="flex justify-end">
            <Button 
              onClick={saveSettings}
              disabled={saving}
              className="primary-button"
            >
              {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}



































