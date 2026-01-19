
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, LogIn, LogOut, Loader2 } from "lucide-react";
import { checkIn, checkOut, getAttendanceRecords } from "@/lib/employeeManagementApi";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function AttendanceAction() {
  const { user, getToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (user?.role === 'employee') {
      loadTodayStatus();
    }
  }, [user]);

  const loadTodayStatus = async () => {
    try {
      const token = getToken();
      if (!token) return;

      // Use local date string (YYYY-MM-DD) instead of UTC to avoid timezone issues
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      
      console.log(`[AttendanceAction] Checking status for local date: ${today}`);
      
      const response = await getAttendanceRecords(token, {
        startDate: today,
        endDate: today,
        limit: 1
      });

      if (response.success && response.attendance && response.attendance.length > 0) {
        console.log('[AttendanceAction] Found today record:', response.attendance[0]);
        setTodayRecord(response.attendance[0]);
      } else {
        console.log('[AttendanceAction] No attendance record found for today yet.');
        setTodayRecord(null);
      }
    } catch (error) {
      console.error('Error loading attendance status:', error);
    }
  };

  const handleAction = async (type: 'in' | 'out') => {
    setLoading(true);
    try {
      const token = getToken();
      if (!token) return;

      console.log(`[AttendanceAction] Performing check-${type}...`);

      let location = null;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude
        };
      } catch (e) {
        console.warn('Geolocation failed or denied');
      }

      const res = type === 'in' 
        ? await checkIn(token, { location, method: 'manual' })
        : await checkOut(token, { location, method: 'manual' });

      if (res.success) {
        toast.success(res.message);
        loadTodayStatus();
      } else {
        toast.error(res.message);
      }
    } catch (error: any) {
      toast.error(error.message || 'حدث خطأ أثناء العملية');
    } finally {
      setLoading(false);
    }
  };

  if (user?.role !== 'employee') return null;

  return (
    <Card className="gradient-border overflow-hidden bg-secondry/50 backdrop-blur-md">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            إثبات حضور العمل (بصمة اليوم)
          </CardTitle>
          <div className="text-right">
            <p className="text-2xl font-bold text-white leading-none">
              {currentTime.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {currentTime.toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-4 mt-2">
          {todayRecord ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="text-xs text-gray-400">وقت الحضور</p>
                <p className="text-lg font-bold text-green-400">
                  {todayRecord.checkInTime ? new Date(todayRecord.checkInTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
              <div className="bg-white/5 p-3 rounded-lg border border-white/10">
                <p className="text-xs text-gray-400">وقت الانصراف</p>
                <p className="text-lg font-bold text-amber-400">
                  {todayRecord.checkOutTime ? new Date(todayRecord.checkOutTime).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) : '--:--'}
                </p>
              </div>
            </div>
          ) : (
             <div className="bg-amber-500/10 p-3 rounded-lg border border-amber-500/20 text-center">
                <p className="text-sm text-amber-400 font-medium">لم يتم تسجيل حضورك للعمل اليوم بعد</p>
                <p className="text-[10px] text-gray-400 mt-1">يرجى الضغط على "تسجيل دخول" أدناه لإثبات بدء العمل</p>
             </div>
          )}

          <div className="flex gap-3">
            <Button
              className="flex-1 primary-button h-12"
              disabled={loading || (todayRecord && todayRecord.checkInTime)}
              onClick={() => handleAction('in')}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogIn className="w-5 h-5 ml-2" />
                  تسجيل دخول
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              className="flex-1 gradient-border h-12 text-white border-white/20"
              disabled={loading || !todayRecord || (todayRecord && todayRecord.checkOutTime)}
              onClick={() => handleAction('out')}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <LogOut className="w-5 h-5 ml-2" />
                  تسجيل خروج
                </>
              )}
            </Button>
          </div>
          
          {todayRecord?.lateMinutes > 0 && (
            <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 p-2 rounded border border-amber-400/20">
              <MapPin className="w-4 h-4" />
              <span>تنبيه: تم تسجيل الحضور متأخراً بـ {todayRecord.lateMinutes} دقيقة</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
