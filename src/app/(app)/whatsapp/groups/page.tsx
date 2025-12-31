"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  listWhatsAppGroups,
  sendToWhatsAppGroup,
  sendToWhatsAppGroupsBulk,
  exportGroupMembers,
  postWhatsAppStatus,
  listWhatsAppSchedules,
  cancelWhatsAppSchedule,
} from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import Loader from "@/components/Loader";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";

export default function WhatsAppGroupsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { showSuccess, showError } = useToast();
  
  // Loading states for operations
  const [isSendingToGroup, setIsSendingToGroup] = useState(false);
  const [isExportingMembers, setIsExportingMembers] = useState(false);
  const [isPostingStatus, setIsPostingStatus] = useState(false);
  
  // Groups/Status state
  const [groups, setGroups] = useState<Array<{ id: string; name: string; participantsCount: number }>>([]);
  const [selectedGroupNames, setSelectedGroupNames] = useState<string[]>([]);
  const [groupMessage, setGroupMessage] = useState<string>("");
  const [groupMedia, setGroupMedia] = useState<File | null>(null);
  const [groupScheduleAt, setGroupScheduleAt] = useState<string>("");
  const groupScheduleInputRef = useRef<HTMLInputElement>(null);
  const [statusImage, setStatusImage] = useState<File | null>(null);
  const [statusCaption, setStatusCaption] = useState<string>("");
  
  // Recurring schedule settings
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringInterval, setRecurringInterval] = useState<number>(8); // hours

  // Schedules state (groups campaigns)
  const [groupSchedules, setGroupSchedules] = useState<Array<{
    id: number;
    type: 'groups' | 'campaign';
    payload: any;
    scheduledAt: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  }>>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [cancellingScheduleId, setCancellingScheduleId] = useState<number | null>(null);
  const [schedulePage, setSchedulePage] = useState(1);
  const schedulesPerPage = 5;

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  // Add style for datetime-local calendar icon to be white
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      input[type="datetime-local"]::-webkit-calendar-picker-indicator {
        filter: invert(1);
        cursor: pointer;
        opacity: 0;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  useEffect(() => {
    if (token) {
      handleListGroups();
      handleLoadSchedules();
    }
  }, [token]);

  async function handleListGroups() {
    try {
      const res = await listWhatsAppGroups(token);
      if (res.success) setGroups(res.groups);
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleLoadSchedules() {
    try {
      setIsLoadingSchedules(true);
      const res = await listWhatsAppSchedules(token);
      if (res.success && Array.isArray(res.schedules)) {
        const filtered = res.schedules
          .filter(s => s.type === 'groups')
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setGroupSchedules(filtered);
        setSchedulePage(1);
      }
    } catch (e: any) {
      console.error('[Groups] Failed to load schedules:', e.message);
    } finally {
      setIsLoadingSchedules(false);
    }
  }

  async function handleCancelSchedule(id: number) {
    try {
      setCancellingScheduleId(id);
      const res = await cancelWhatsAppSchedule(token, id);
      if (res.success) {
        showSuccess("تم إيقاف الحملة المجدولة بنجاح");
        await handleLoadSchedules();
      } else {
        showError("تعذر إيقاف الحملة", res.message || "يمكن إيقاف الحملات قيد الانتظار فقط");
      }
    } catch (e: any) {
      showError("تعذر إيقاف الحملة", e.message);
    } finally {
      setCancellingScheduleId(null);
    }
  }

  function handleSendToGroup() {
    if (selectedGroupNames.length === 0) {
      setError("يرجى اختيار مجموعة واحدة على الأقل");
      return;
    }
    // ✅ Removed requirement - allow sending without message or media
    if (!groupMessage && !groupMedia) {
      setError("يرجى تقديم رسالة أو وسائط");
      return;
    }

    const isScheduled = !!groupScheduleAt;
    const scheduleDate = groupScheduleAt ? new Date(groupScheduleAt) : null;
    const now = new Date();
    const isValidSchedule = scheduleDate && scheduleDate > now;

    // ✅ Run in background - don't block UI
      setIsSendingToGroup(true);
      setError("");
      
    // Run async operation in background
    (async () => {
      try {
        // ✅ If scheduled: create separate schedule for each group with 2-minute delay
        // ✅ If immediate AND multiple groups: send sequentially with 2-minute delay
        // Note: Recurring scheduling only works with scheduled sends (not immediate)
        if (isScheduled && isValidSchedule) {
        // Scheduled - create separate schedule for each group with 2-minute delay between them
        const baseScheduleDate = new Date(groupScheduleAt);
        const delayMs = 2 * 60 * 1000; // 2 minutes in milliseconds
        let successful = 0;
        let failed = 0;
        
        for (let i = 0; i < selectedGroupNames.length; i++) {
          const groupName = selectedGroupNames[i];
          try {
            // Calculate schedule time for this group (base time + delay for each previous group)
            const groupScheduleDate = new Date(baseScheduleDate.getTime() + (i * delayMs));
            
            // Format datetime-local string (YYYY-MM-DDTHH:mm)
            const year = groupScheduleDate.getFullYear();
            const month = String(groupScheduleDate.getMonth() + 1).padStart(2, '0');
            const day = String(groupScheduleDate.getDate()).padStart(2, '0');
            const hours = String(groupScheduleDate.getHours()).padStart(2, '0');
            const minutes = String(groupScheduleDate.getMinutes()).padStart(2, '0');
            const groupScheduleAtString = `${year}-${month}-${day}T${hours}:${minutes}`;
            
            const result = await sendToWhatsAppGroupsBulk(token, {
              groupNames: [groupName], // One group at a time
              message: groupMessage || undefined,
              mediaFile: groupMedia || null,
              scheduleAt: groupScheduleAtString,
              isRecurring: isRecurring,
              recurringInterval: isRecurring ? recurringInterval : undefined
            });
            
            if (result.success) {
              successful++;
            } else {
              failed++;
            }
          } catch (e: any) {
            console.error(`[Groups] Failed to schedule ${groupName}:`, e.message);
            failed++;
          }
        }
        
        if (successful > 0) {
          const totalDelayMinutes = (selectedGroupNames.length - 1) * 2;
          showSuccess(
            `تم الجدولة بنجاح! سيتم إرسال الرسالة إلى ${successful} مجموعة مع تأخير دقيقتين بين كل مجموعة والأخرى.`,
            failed > 0 ? `فشل جدولة ${failed} مجموعة` : undefined
          );
          setGroupMessage("");
          setGroupMedia(null);
          setGroupScheduleAt("");
          setSelectedGroupNames([]);
          setIsRecurring(false);
          setRecurringInterval(8);
        } else {
          setError("فشل في جدولة جميع المجموعات");
          showError("فشل في الجدولة", "فشل في جدولة جميع المجموعات المحددة");
        }
      } else {
        // Immediate send - send sequentially with delay if multiple groups
        let successful = 0;
        let failed = 0;
        
        for (let i = 0; i < selectedGroupNames.length; i++) {
          const groupName = selectedGroupNames[i];
          try {
            const result = await sendToWhatsAppGroupsBulk(token, {
              groupNames: [groupName], // Send one group at a time
              message: groupMessage || undefined,
              mediaFile: groupMedia || null,
              scheduleAt: null // No schedule for immediate
            });
      
      if (result.success) {
              successful++;
            } else {
              failed++;
            }
            
            // ✅ 2-minute delay between groups (except for the last one)
            if (i < selectedGroupNames.length - 1) {
              const delayMs = 2 * 60 * 1000; // 2 minutes
              showSuccess(`تم إرسال الرسالة إلى ${groupName} بنجاح. جاري الانتظار دقيقتين قبل المجموعة التالية...`);
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          } catch (e: any) {
            console.error(`[Groups] Failed to send to ${groupName}:`, e.message);
            failed++;
            // Still wait 2 minutes before next group even if failed
            if (i < selectedGroupNames.length - 1) {
              const delayMs = 2 * 60 * 1000;
              await new Promise(resolve => setTimeout(resolve, delayMs));
            }
          }
        }
        
        if (successful > 0) {
          showSuccess(
            `تم إرسال الرسالة إلى ${successful} مجموعة بنجاح!`,
            failed > 0 ? `فشل إرسال ${failed} مجموعة` : undefined
          );
        setGroupMessage("");
        setGroupMedia(null);
        setGroupScheduleAt("");
        setSelectedGroupNames([]);
      } else {
          setError("فشل في إرسال الرسالة إلى جميع المجموعات");
          showError("فشل في الإرسال", "فشل في إرسال الرسالة إلى جميع المجموعات المحددة");
        }
      }
    } catch (e: any) {
      setError(e.message);
        showError("خطأ", e.message);
    } finally {
      setIsSendingToGroup(false);
    }
    })();
  }

  function handleExportGroupMembers() {
    if (selectedGroupNames.length === 0) {
      setError("يرجى اختيار مجموعة واحدة على الأقل");
      showError("خطأ", "يرجى اختيار مجموعة واحدة على الأقل");
      return;
    }

    // ✅ Run in background - don't block UI
      setIsExportingMembers(true);
      setError("");
    
    // Run async operation in background
    (async () => {
      try {
        // ✅ Export members for each selected group sequentially to avoid conflicts
        // Each export will trigger a file download
        let successful = 0;
        let failed = 0;
        
        for (const groupName of selectedGroupNames) {
          try {
            const result = await exportGroupMembers(token, groupName);
      if (result.success) {
              successful++;
            } else {
              failed++;
            }
            // Small delay between exports to avoid overwhelming the server
            if (selectedGroupNames.indexOf(groupName) < selectedGroupNames.length - 1) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          } catch (e: any) {
            console.error(`[Groups] Failed to export ${groupName}:`, e.message);
            failed++;
          }
        }
        
        if (successful > 0) {
          showSuccess(
            `تم تصدير أعضاء ${successful} مجموعة بنجاح!`,
            failed > 0 ? `فشل تصدير ${failed} مجموعة` : undefined
          );
      } else {
          setError("فشل في تصدير أعضاء المجموعات");
          showError("فشل في التصدير", "فشل في تصدير أعضاء جميع المجموعات المحددة");
      }
    } catch (e: any) {
      setError(e.message);
        showError("خطأ في التصدير", e.message);
    } finally {
      setIsExportingMembers(false);
    }
    })();
  }

  function handlePostStatus() {
    if (!statusImage) {
      setError("يرجى اختيار صورة");
      return;
    }

    // ✅ Run in background - don't block UI
      setIsPostingStatus(true);
      setError("");
      
    // Run async operation in background
    (async () => {
      try {
        // ✅ Use correct API format - pass File and caption separately
        const result = await postWhatsAppStatus(token, statusImage, statusCaption);
      
      if (result.success) {
          showSuccess("تم نشر الحالة بنجاح!");
        setStatusImage(null);
        setStatusCaption("");
      } else {
        setError(result.message || "فشل في نشر الحالة");
          showError("فشل في نشر الحالة", result.message);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsPostingStatus(false);
    }
    })();
  }

  // ✅ Removed fullscreen loader - operations run in background
  // Users can continue using the interface while operations are in progress

  return (
    <div className="space-y-6">
      {/* Error Messages - Keep for errors */}
      {error && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}

      <Card className="gradient-border border-none">
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl">حملة اعلانية للمجموعات </CardHeader>
        <CardContent className="space-y-4">
          {/* <div className="flex items-center gap-2">
          <span className="text-sm text-white">{groups.length} </span>
          </div> */}



          <div className="flex flex-col lg:flex-row gap-4">


           <div className="lg:w-1/3 w-full flex flex-col gap-4 border-l border-white/10 pl-0 lg:pl-4">
           <div className="h-full flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <div className="flex flex-col">
                  <label className="block text-sm font-bold text-white uppercase tracking-wider">قائمة المجموعات</label>
                  <span className="text-[10px] text-white/60">اختر المجموعات المستهدفة</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedGroupNames.length === groups.length && groups.length > 0) {
                      setSelectedGroupNames([]);
                    } else {
                      setSelectedGroupNames(groups.map(g => g.name));
                    }
                  }}
                  className="text-[10px] px-2 py-1 bg-blue-500/20 hover:bg-blue-500/40 text-blue-300 border border-blue-500/30 rounded transition-all"
                >
                  {selectedGroupNames.length === groups.length && groups.length > 0 ? 'إلغاء الكل' : 'اختيار الكل'}
                </button>
              </div>
              
              <div 
                className="flex-1 flex flex-col gap-1 overflow-y-auto bg-[#01191040] rounded-xl border border-white/10 p-2 custom-scrollbar"
                style={{ maxHeight: '450px', minHeight: '300px' }}
              >
                {groups.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-10 opacity-50">
                    <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <p className="text-white text-sm">لا توجد مجموعات</p>
                  </div>
                ) : (
                  groups.map(g => (
                    <label
                      key={g.id}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border ${
                        selectedGroupNames.includes(g.name) 
                          ? 'bg-blue-500/10 border-blue-500/30' 
                          : 'hover:bg-white/5 border-transparent'
                      }`}
                    >
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedGroupNames.includes(g.name)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedGroupNames([...selectedGroupNames, g.name]);
                            } else {
                              setSelectedGroupNames(selectedGroupNames.filter(name => name !== g.name));
                            }
                          }}
                          className="w-5 h-5 rounded border-white/20 bg-black/20 checked:bg-blue-500 transition-all cursor-pointer"
                        />
                      </div>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className={`text-sm truncate transition-colors ${
                          selectedGroupNames.includes(g.name) ? 'text-blue-300 font-bold' : 'text-white/80'
                        }`}>
                          {g.name}
                        </span>
                        <span className="text-[10px] text-primary">
                          {g.participantsCount} مشارك
                        </span>
                      </div>
                    </label>
                  ))
                )}
              </div>

              <div className="mt-3 p-3 bg-fixed-40 rounded-lg border border-blue-500/10">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-primary ">ملخص التحديد:</span>
                  <span className="text-xs font-bold text-blue-400">{selectedGroupNames.length} / {groups.length}</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden">
                  <div 
                    className="bg-blue-500 h-full transition-all duration-500" 
                    style={{ width: `${(selectedGroupNames.length / Math.max(groups.length, 1)) * 100}%` }}
                  />
                </div>
              </div>
            </div>
           </div>



            <div className="lg:w-2/3 w-full flex flex-col gap-4">

              <div>
                <label className="block text-sm font-medium mb-2 text-white">الرسالة</label>
                <textarea className="w-full h-15 px-3 py-2 bg-[#01191040] rounded-md text-white border-1 border-blue-300 outline-none" rows={3} placeholder="اكتب رسالتك التسويقية" value={groupMessage} onChange={(e) => setGroupMessage(e.target.value)} />
              </div>


              <div>
                <label className="block text-sm font-medium mb-2 text-white">الجدولة (اختياري)</label>
                <div className="relative">
                  <input 
                    ref={groupScheduleInputRef}
                    type="datetime-local" 
                    className="w-full px-3 py-4 pr-10 bg-[#01191040] rounded-md text-white border-1 border-blue-300 outline-none cursor-pointer" 
                    value={groupScheduleAt} 
                    onChange={(e) => {
                      const value = e.target.value;
                      // Get user's timezone offset
                      const timezoneOffset = new Date().getTimezoneOffset();
                      console.log('User timezone offset:', timezoneOffset, 'minutes');
                      console.log('Selected time:', value);
                      setGroupScheduleAt(value);
                    }}
                    onClick={() => groupScheduleInputRef.current?.showPicker()}
                  />
                  <Calendar 
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none z-10"
                  />
                </div>
              </div>

              {/* ................. */}
           <div className="flex flex-col mt-2.5">
              <label className="block text-sm font-medium mb-2 text-white">
                ارفع (صورة / فيديو) <span className="text-white/50 text-xs">(اختياري)</span>
              </label>

              <label htmlFor="groupMediaUpload" className="container cursor-pointer block">
                <div  className="header"> 
                  <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                    <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> 
                  <p className="text-white text-sm font-medium">اختر صورة أو فيديو</p>
                </div> 
                <div className="footer"> 
                  <svg fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z" fill="white"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z" fill="white"></path></g></svg> 
                  <p className="text-white text-sm font-medium">{groupMedia ? groupMedia.name : "لا يوجد ملف محدد"}</p> 
                  {groupMedia && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setGroupMedia(null);
                        const fileInput = document.getElementById('groupMediaUpload') as HTMLInputElement;
                        if (fileInput) fileInput.value = '';
                      }}
                      className="cursor-pointer hover:opacity-80 flex items-center justify-center"
                      style={{ background: 'none', border: 'none', padding: 0 }}
                    >
                      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white', height: '130%', fill: 'royalblue', backgroundColor: 'rgba(70, 66, 66, 0.103)', borderRadius: '50%', padding: '2px', cursor: 'pointer', boxShadow: '0 2px 30px rgba(0, 0, 0, 0.205)' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="white" strokeWidth="2"></path> <path d="M19.5 5H4.5" stroke="white" strokeWidth="2" strokeLinecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="white" strokeWidth="2"></path> </g></svg>
                    </button>
                  )}
                </div> 
                <input 
                  id="groupMediaUpload"
                  type="file"
                  accept="image/*,video/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setGroupMedia(file);
                    if (file) {
                      console.log('[Groups] File selected:', file.name, file.type, file.size);
                    }
                  }}
                />
              </label>
            </div>

            </div>
          </div>

          <div className="flex items-center flex-col lg:flex-row gap-4 w-full">
          <div className="w-full flex gap-2 items-center justify-between">
                <label className="flex items-center gap-2 text-white">
                  <input
                    type="checkbox" 
                    checked={isRecurring} 
                    onChange={(e) => setIsRecurring(e.target.checked)}
                    className="
                      appearance-none
                      w-5 h-5
                      border-2 border-gray-200
                      rounded
                      cursor-pointer
                      checked:bg-green-500
                      checked:border-green-500
                      transition-colors duration-200
                    "
                  />
                  <span className="text-sm font-medium">جدولة متكررة</span>
                </label>
                <div className="w-3/4">
                  {isRecurring && (
                    <div>
                      <label className="text-sm font-medium mb-2 text-white">تكرار كل (ساعات)</label>
                      <input 
                        type="number" 
                        min="1" 
                        max="168" 
                        className="bg-[#01191040] rounded-md text-white border-1 border-blue-300 w-full px-3 py-2 outline-none" 
                        value={recurringInterval} 
                        onChange={(e) => setRecurringInterval(parseInt(e.target.value || '1'))}
                      />
                    </div>
                  )}
                </div>
              </div>
            <div className="flex items-center gap-2">
              <div className="w-50">
              <button 
                className="w-full lg:h-18 h-12 primary-button text-white text-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-70" 
                onClick={handleSendToGroup} 
                disabled={isSendingToGroup || selectedGroupNames.length === 0}
              >
              {isSendingToGroup ? (
                <>
                  <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>
                    {groupScheduleAt && new Date(groupScheduleAt) > new Date() ? ' ' : ''}
                  </span>
                </>
              ) : (
                <>
                  {groupScheduleAt && new Date(groupScheduleAt) > new Date() ? 'جدولة' : 'إرسال'}
                </>
              )}
              </button>
            </div>
            
            
             
          
          <div className="flex gap-2">
            <button 
              className="w-50 lg:h-18 h-12 primary-button text-white text-xl font-bold after:bg-red-800 before:bg-[#01191080] flex items-center justify-center gap-2 disabled:opacity-70" 
              onClick={handleExportGroupMembers} 
              disabled={isExportingMembers || selectedGroupNames.length === 0}
            >
              {isExportingMembers ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                  </svg>
                  <span>جارٍ التصدير...</span>
                </>
              ) : (
                'تصدير الأعضاء'
              )}
            </button>
          </div>
          
            </div>
          </div>



        </CardContent>
      </Card>

      {/* Scheduled group campaigns */}
      <Card className="gradient-border border-none">
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl">
          الحملات المجدولة للمجموعات
          <p className="text-yellow-400 text-sm">بامكانك تعديل معلومات الحملة من صفحة المحتوى المجدول</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSchedules ? (
            <div className="text-white text-sm">جاري تحميل الحملات المجدولة...</div>
          ) : groupSchedules.length === 0 ? (
            <div className="text-white/60 text-sm">
              لا توجد حملات مجدولة حالياً للمجموعات.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">#</TableHead>
                      <TableHead className="text-white">وقت الإرسال</TableHead>
                      <TableHead className="text-white">عدد المجموعات</TableHead>
                      <TableHead className="text-white">الحالة</TableHead>
                      <TableHead className="text-white">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {groupSchedules
                      .slice((schedulePage - 1) * schedulesPerPage, schedulePage * schedulesPerPage)
                      .map((s) => {
                        const date = new Date(s.scheduledAt);
                        const isPending = s.status === 'pending';
                        const groupsCount = Array.isArray(s.payload?.groupNames) ? s.payload.groupNames.length : 0;
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="text-white">{s.id}</TableCell>
                            <TableCell className="text-white">{date.toLocaleString()}</TableCell>
                            <TableCell className="text-white">{groupsCount}</TableCell>
                            <TableCell className="text-white">
                              {s.status === 'pending'
                                ? <span className="text-yellow-400">قيد الانتظار</span>
                                : s.status === 'running'
                                ? <span className="text-primary">قيد التنفيذ</span>
                                : s.status === 'completed'
                                ? <span className="text-green-400">مكتملة</span>
                                : s.status === 'cancelled'
                                ? <span className="text-red-500">ملغاة</span>
                                : <span className="text-red-500">فشل</span>}
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                disabled={!isPending || cancellingScheduleId === s.id}
                                onClick={() => handleCancelSchedule(s.id)}
                                className="primary-button after:bg-red-700 before:bg-[#01191080] text-white px-4 py-2 rounded disabled:opacity-60"
                              >
                                {cancellingScheduleId === s.id ? 'جاري الإيقاف...' : 'إيقاف الحملة'}
                              </button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </div>
              {Math.ceil(groupSchedules.length / schedulesPerPage) > 1 && (
                <div className="flex items-center justify-between text-white text-sm">
                  <button
                    onClick={() => setSchedulePage((prev) => Math.max(prev - 1, 1))}
                    disabled={schedulePage === 1}
                    className="primary-button px-3 py-1 text-xs disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span>
                    صفحة {schedulePage} من {Math.ceil(groupSchedules.length / schedulesPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setSchedulePage((prev) => Math.min(prev + 1, Math.ceil(groupSchedules.length / schedulesPerPage)))
                    }
                    disabled={schedulePage === Math.ceil(groupSchedules.length / schedulesPerPage)}
                    className="primary-button px-3 py-1 text-xs disabled:opacity-50"
                  >
                    التالي
                  </button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

    </div>
  );
}