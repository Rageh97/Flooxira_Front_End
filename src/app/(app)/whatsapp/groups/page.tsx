"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  listWhatsAppGroups,
  sendToWhatsAppGroup,
  sendToWhatsAppGroupsBulk,
  exportGroupMembers,
  postWhatsAppStatus,
} from "@/lib/api";
import { useToast } from "@/components/ui/toast-provider";
import Loader from "@/components/Loader";

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
  const [statusImage, setStatusImage] = useState<File | null>(null);
  const [statusCaption, setStatusCaption] = useState<string>("");

  const token = typeof window !== 'undefined' ? localStorage.getItem("auth_token") || "" : "";

  useEffect(() => {
    if (token) {
      handleListGroups();
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
              scheduleAt: groupScheduleAtString
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



          <div className="flex gap-4">


           <div className="w-full flex flex-col gap-4">
           <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-white">اختر المجموعات</label>
                <button
                  type="button"
                  onClick={() => {
                    if (selectedGroupNames.length === groups.length && groups.length > 0) {
                      setSelectedGroupNames([]);
                    } else {
                      setSelectedGroupNames(groups.map(g => g.name));
                    }
                  }}
                  className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded transition-colors"
                >
                  {selectedGroupNames.length === groups.length && groups.length > 0 ? 'إلغاء اختيار الكل' : 'اختيار الكل'}
                </button>
              </div>
              <div 
                className="w-full flex items-start max-h-55 overflow-y-auto bg-[#01191040] rounded-md border-1 border-blue-300 p-3 space-y-2"
                style={{ minHeight: '200px' }}
              >
                {groups.length === 0 ? (
                  <p className="text-white/50 text-sm text-center py-4">لا توجد مجموعات متاحة</p>
                ) : (
                  groups.map(g => (
                    <label
                      key={g.id}
                      className="flex items-center gap-2 p-2 hover:bg-[#01191060] rounded cursor-pointer transition-colors"
                    >
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
                        className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 cursor-pointer"
                      />
                      <span className="text-white text-sm flex-1">
                        {g.name} <span className="text-primary">({g.participantsCount})</span>
                      </span>
                    </label>
                  ))
                )}
              </div>
              {selectedGroupNames.length > 0 && (
                <p className="text-xs text-white/60 mt-2">
                  تم اختيار {selectedGroupNames.length} من {groups.length} مجموعة
                </p>
              )}
              <p className="text-xs text-white/40 mt-1">
                💡 انقر على المجموعات لاختيارها أو إلغاء اختيارها
              </p>
            </div>

            
            <div className="flex flex-col mt-2.5">
  <label className="block text-sm font-medium mb-2 text-white">
                ارفع (صورة / فيديو) <span className="text-white/50 text-xs">(اختياري)</span>
  </label>

              <div className="relative">
    <input
      id="file-upload"
      type="file"
      accept="image/*,video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    setGroupMedia(file);
                    if (file) {
                      console.log('[Groups] File selected:', file.name, file.type, file.size);
                    }
                  }}
      className="hidden"
    />

    <label
      htmlFor="file-upload"
                  className="cursor-pointer flex items-center justify-center bg-[#01191040] rounded-md border-1 border-blue-300 px-4 py-2 text-sm font-medium hover:text-white transition"
                >
                  {groupMedia ? (
                    <span className="text-white text-sm">
                      {groupMedia.name} ({Math.round(groupMedia.size / 1024)} KB)
                    </span>
                  ) : (
                    <img className="w-10 h-10" src="/img.gif" alt="رفع ملف" />
                  )}
    </label>
                
                {groupMedia && (
                  <button
                    type="button"
                    onClick={() => {
                      setGroupMedia(null);
                      // Reset file input
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                      if (fileInput) fileInput.value = '';
                    }}
                    className="absolute top-0 right-0 text-red-400 hover:text-red-600 text-xs px-2 py-1"
                  >
                    ✕
                  </button>
                )}
              </div>
              </div>
           </div>



            <div className="w-full flex flex-col gap-4">

              <div>
                <label className="block text-sm font-medium mb-2 text-white">الرسالة</label>
                <textarea className="w-full h-15 px-3 py-2 bg-[#01191040] rounded-md text-white border-1 border-blue-300 outline-none" rows={3} placeholder="اكتب رسالتك التسويقية" value={groupMessage} onChange={(e) => setGroupMessage(e.target.value)} />
              </div>


              <div>
                <label className="block text-sm font-medium mb-2 text-white">الجدولة (اختياري)</label>
                <input 
                  type="datetime-local" 
                  className="w-full px-3 py-4 bg-[#01191040] rounded-md text-white border-1 border-blue-300 outline-none" 
                  value={groupScheduleAt} 
                  onChange={(e) => {
                    const value = e.target.value;
                    // Get user's timezone offset
                    const timezoneOffset = new Date().getTimezoneOffset();
                    console.log('User timezone offset:', timezoneOffset, 'minutes');
                    console.log('Selected time:', value);
                    setGroupScheduleAt(value);
                  }} 
                />
              </div>

            </div>
          </div>




          <div className="flex gap-2">
            <button 
              className="w-50 h-18 primary-button text-white text-2xl font-bold flex items-center justify-center gap-2 disabled:opacity-70" 
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
            <button 
              className="w-50 primary-button text-white text-xl font-bold after:bg-red-800 before:bg-[#01191080] flex items-center justify-center gap-2 disabled:opacity-70" 
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


        </CardContent>
      </Card>

    </div>
  );
}