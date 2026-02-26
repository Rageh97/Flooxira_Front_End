"use client";
import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startWhatsAppCampaign, listWhatsAppSchedules, cancelWhatsAppSchedule } from "@/lib/api";
import { listTags, sendCampaignToTag } from "@/lib/tagsApi";
import { useToast } from "@/components/ui/toast-provider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calendar } from "lucide-react";

export default function WhatsAppCampaignsPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const { showSuccess, showError } = useToast();
  
  // Loading states for operations
  const [isStartingCampaign, setIsStartingCampaign] = useState(false);
  const [isSendingToTag, setIsSendingToTag] = useState(false);
  
  // Campaigns state
  const [campaignFile, setCampaignFile] = useState<File | null>(null);
  const [campaignTemplate, setCampaignTemplate] = useState<string>("");
  const [campaignThrottle, setCampaignThrottle] = useState<number>(5); // minutes
  const [campaignMedia, setCampaignMedia] = useState<File | null>(null);
  const [campaignScheduleAt, setCampaignScheduleAt] = useState<string>("");
  const campaignScheduleInputRef = useRef<HTMLInputElement>(null);
  const [campaignDailyCap, setCampaignDailyCap] = useState<number | ''>('');
  const [campaignPerNumberDelay, setCampaignPerNumberDelay] = useState<number | ''>('');
  
  // Recurring campaign settings
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringInterval, setRecurringInterval] = useState<number>(8); // hours

  // Tag-based campaign
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedTagId, setSelectedTagId] = useState<number | ''>('');
  const [tagCampaignTemplate, setTagCampaignTemplate] = useState<string>("");
  const [tagCampaignMedia, setTagCampaignMedia] = useState<File | null>(null);

  // Scheduled campaigns (Excel + tag-based WhatsApp campaigns)
  const [campaignSchedules, setCampaignSchedules] = useState<Array<{
    id: number;
    type: 'groups' | 'campaign';
    payload: any;
    scheduledAt: string;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  }>>([]);
  const [isLoadingSchedules, setIsLoadingSchedules] = useState(false);
  const [cancellingScheduleId, setCancellingScheduleId] = useState<number | null>(null);
  const [campaignSchedulePage, setCampaignSchedulePage] = useState(1);
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
    // Load tags and schedules on mount
    (async () => {
      try {
        const res = await listTags();
        if (res.success) setTags(res.data || []);
      } catch {}
    })();

    if (token) {
      handleLoadCampaignSchedules();
    }
  }, [token]);

  async function handleLoadCampaignSchedules() {
    try {
      // Only show loader on initial load (when campaignSchedules is empty)
      if (campaignSchedules.length === 0) setIsLoadingSchedules(true);
      
      const res = await listWhatsAppSchedules(token);
      if (res.success && Array.isArray(res.schedules)) {
        const filtered = res.schedules
          .filter(s => s.type === 'campaign')
          .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
        setCampaignSchedules(filtered);
        // Only reset page on first load if needed, avoiding resetting on every poll
        // setCampaignSchedulePage(1); 
      }
    } catch (e: any) {
      console.error('[Campaigns] Failed to load schedules:', e.message);
    } finally {
      setIsLoadingSchedules(false);
    }
  }

  // Poll for updates and track status changes
  const prevSchedulesRef = useRef<Record<number, string>>({});

  useEffect(() => {
    if (!token) return;

    // Initial load
    handleLoadCampaignSchedules();

    const interval = setInterval(async () => {
      // Don't trigger loading state for background polling to avoid UI flickering
      try {
        const res = await listWhatsAppSchedules(token);
        if (res.success && Array.isArray(res.schedules)) {
          const filtered = res.schedules
            .filter((s: any) => s.type === 'campaign')
            .sort((a: any, b: any) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());
          
          setCampaignSchedules(prev => {
            // Check for status changes inside the update to have access to latest data if needed
            // But better to use the effect on campaignSchedules change
            return filtered;
          });
        }
      } catch (e) {
        // Silent error for polling
      }
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [token]);

  // Monitor status changes for toasts
  useEffect(() => {
    campaignSchedules.forEach(s => {
      const prevStatus = prevSchedulesRef.current[s.id];
      
      // If status changed from 'running' or 'pending' to 'completed'
      if ((prevStatus === 'running' || prevStatus === 'pending') && s.status === 'completed') {
        showSuccess("اكتملت الحملة", `تم إرسال الحملة #${s.id} بنجاح لجميع الأرقام`);
        
        // Play notification sound if desired
        try {
          const audio = new Audio('/notification.mp3');
          audio.play().catch(() => {});
        } catch {}
      }
      
      // Update ref
      prevSchedulesRef.current[s.id] = s.status;
    });
  }, [campaignSchedules]);


  // التحقق من وجود حملة نشطة اليوم (pending أو running)
  function hasActiveCampaignToday(): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return campaignSchedules.some(s => {
      if (s.status !== 'pending' && s.status !== 'running') return false;
      const scheduledDate = new Date(s.scheduledAt);
      return scheduledDate >= today && scheduledDate < tomorrow;
    });
  }

  async function handleCancelCampaignSchedule(id: number) {
    try {
      setCancellingScheduleId(id);
      const res = await cancelWhatsAppSchedule(token, id);
      if (res.success) {
        showSuccess("تم إيقاف الحملة المجدولة بنجاح");
        await handleLoadCampaignSchedules();
      } else {
        showError("تعذر إيقاف الحملة", res.message || "يمكن إيقاف الحملات قيد الانتظار فقط");
      }
    } catch (e: any) {
      showError("تعذر إيقاف الحملة", e.message);
    } finally {
      setCancellingScheduleId(null);
    }
  }

  function handleStartCampaign() {
    // التحقق من حد الحملة اليومية
    if (hasActiveCampaignToday()) {
      showError("تنبيه - حد الحملات اليومي", "يُسمح بتفعيل حملة واحدة فقط في اليوم حفاظاً على سياسة الاستخدام وتجنب تقييد الرقم.");
      return;
    }

    if (!campaignFile || !campaignTemplate) {
      setError("يرجى رفع ملف Excel وتوفير نص المحتوى التسويقي");
      showError("خطأ", "يرجى رفع ملف Excel وتوفير نص المحتوى التسويقي");
      return;
    }

    // التحقق من القيود
    if (campaignThrottle < 5) {
      setError("الحد الأدنى للدقائق بين الرسائل هو 5 دقائق");
      showError("خطأ", "الحد الأدنى للدقائق بين الرسائل هو 5 دقائق");
      return;
    }

    if (campaignDailyCap && campaignDailyCap > 500) {
      setError("الحد الأقصى للأرقام في اليوم هو 500 رقم");
      showError("خطأ", "الحد الأقصى للأرقام في اليوم هو 500 رقم");
      return;
    }

    // ✅ Run in background - don't block UI
    setIsStartingCampaign(true);
    setError("");
    
    // Run async operation in background
    (async () => {
      try {
      
      const formData = new FormData();
      formData.append('file', campaignFile);
      formData.append('messageTemplate', campaignTemplate);
      formData.append('throttleMs', (campaignThrottle * 60 * 1000).toString()); // convert minutes to milliseconds
      if (campaignMedia) formData.append('media', campaignMedia);
      if (campaignScheduleAt) {
        formData.append('scheduleAt', campaignScheduleAt);
        formData.append('timezoneOffset', new Date().getTimezoneOffset().toString());
      }
      if (isRecurring) {
        formData.append('isRecurring', 'true');
        formData.append('recurringInterval', recurringInterval.toString());
      }
      if (campaignDailyCap) formData.append('dailyCap', campaignDailyCap.toString());
      if (campaignPerNumberDelay) {
        // تحويل من دقائق إلى milliseconds
        const perNumberDelayMs = Number(campaignPerNumberDelay) * 60 * 1000;
        formData.append('perNumberDelayMs', perNumberDelayMs.toString());
      }

      const result = await startWhatsAppCampaign(token, formData);
      
      if (result.success) {
        const isScheduled = !!campaignScheduleAt && new Date(campaignScheduleAt) > new Date();
        const warningMsg = (result as any).warning;
        if (isScheduled) {
          showSuccess("تم الجدولة بنجاح!", warningMsg || "سيتم بدء الحملة في الوقت المحدد.");
        } else {
          showSuccess("تم بدء الحملة بنجاح!", warningMsg || "جاري إرسال الرسائل...");
        }
        
        // Refresh the list immediately
        await handleLoadCampaignSchedules();

        setCampaignFile(null);
        setCampaignTemplate("مرحبا {{name}} …");
        setCampaignThrottle(5);
        setCampaignMedia(null);
        setCampaignScheduleAt("");
        setCampaignDailyCap('');
        setCampaignPerNumberDelay('');
        setIsRecurring(false);
        setRecurringInterval(8);
      } else {
        setError(result.message || "فشل في بدء الحملة");
        showError("فشل في بدء الحملة", result.message);
      }
      } catch (e: any) {
        setError(e.message);
        showError("خطأ", e.message);
      } finally {
        setIsStartingCampaign(false);
      }
    })();
  }

  function handleSendToTag() {
    // التحقق من حد الحملة اليومية
    if (hasActiveCampaignToday()) {
      showError("تنبيه - حد الحملات اليومي", "يُسمح بتفعيل حملة واحدة فقط في اليوم حفاظاً على سياسة الاستخدام وتجنب تقييد الرقم.");
      return;
    }

    if (!selectedTagId || !tagCampaignTemplate.trim()) {
      setError("يرجى اختيار تصنيف وإدخال نص المحتوى التسويقي");
      showError("خطأ", "يرجى اختيار تصنيف وإدخال نص المحتوى التسويقي");
      return;
    }

    // التحقق من القيود
    if (campaignThrottle < 5) {
      setError("الحد الأدنى للدقائق بين الرسائل هو 5 دقائق");
      showError("خطأ", "الحد الأدنى للدقائق بين الرسائل هو 5 دقائق");
      return;
    }
    
    // ✅ Run in background - don't block UI
    setIsSendingToTag(true);
    setError("");
    
    // Run async operation in background
    (async () => {
      try {
        const res = await sendCampaignToTag({ 
          tagId: Number(selectedTagId), 
          messageTemplate: tagCampaignTemplate, 
          throttleMs: campaignThrottle * 60 * 1000,
          media: tagCampaignMedia 
        });
        if (res.success) {
          const warningMsg = (res as any).warning;
          showSuccess("تم بدء الحملة للتصنيف بنجاح!", warningMsg || "جاري إرسال الرسائل...");
          // Reset form
          setSelectedTagId('');
          setTagCampaignTemplate('');
          setTagCampaignMedia(null);
        } else {
          setError(res.message || "فشل في بدء حملة التصنيف");
          showError("فشل في بدء حملة التصنيف", res.message);
        }
      } catch (e: any) {
        setError(e.message);
        showError("خطأ", e.message);
      } finally {
        setIsSendingToTag(false);
      }
    })();
  }

  // ✅ Removed fullscreen loader - operations run in background
  // Users can continue using the interface while operations are in progress

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {error && (
        <div className="rounded-md p-4 bg-red-50 text-red-700">
          {error}
        </div>
      )}


      <Card className="gradient-border border-none">
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl"> أدخل معلومات الحملة الاعلانية</CardHeader>
        <CardContent className="space-y-4">


       <div className="flex flex-col lg:flex-row gap-5 w-full">
       <div className="flex flex-col gap-4 w-full lg:w-1/4">

<div>
  <label className="block text-sm font-medium mb-2 text-white">رفع ملف Excel للأرقام</label>
  <label htmlFor="excelUpload" className="container cursor-pointer block">
    <div className="header"> 
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> 
        <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> 
      <p className="text-white text-sm font-medium">اختر ملف Excel</p>
    </div> 
    <div className="footer"> 
      <svg fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z" fill="white"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z" fill="white"></path></g></svg> 
      <p className="text-white text-sm font-medium">{campaignFile ? campaignFile.name : "لا يوجد ملف محدد"}</p> 
      {campaignFile && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCampaignFile(null);
            const fileInput = document.getElementById('excelUpload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
          }}
          className="cursor-pointer hover:opacity-80 flex items-center justify-center"
          style={{ background: 'none', border: 'none', padding: 0 }}
        >
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white', height: '130%', fill: 'royalblue', backgroundColor: 'rgba(70, 66, 66, 0.103)', borderRadius: '50%', padding: '2px', cursor: 'pointer', boxShadow: '0 2px 30px rgba(0, 0, 0, 0.205)' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="white" strokeWidth="2"></path> <path d="M19.5 5H4.5" stroke="white" strokeWidth="2" strokeLinecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="white" strokeWidth="2"></path> </g></svg>
        </button>
      )}
      {/* {!campaignFile && (
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="white" strokeWidth="2"></path> <path d="M19.5 5H4.5" stroke="white" strokeWidth="2" strokeLinecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="white" strokeWidth="2"></path> </g></svg>
      )} */}
    </div> 
    <input 
      id="excelUpload"
      type="file"
      accept=".xlsx,.xls"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0] || null;
        setCampaignFile(file);
        if (file) {
          console.log('[Campaign] Excel file selected:', file.name, file.size, 'bytes');
        }
      }}
    />
  </label>
</div>
{/* <div>
  <label className="block text-sm font-medium mb-2 text-white">ارفع صورة او فيديو</label>
  <div className="relative">
  
  <input
    id="fileInput"
    type="file"
    accept="image/*,video/*"
    className="hidden"
    onChange={(e) => setCampaignMedia(e.target.files?.[0] || null)}
  />

  
  <label
    htmlFor="fileInput"
    className="bg-[#01191040] rounded-md p-2 pl-12 text-white border-1 border-blue-300 h-28 w-full flex items-center justify-center cursor-pointer relative"
  >
    <img
      className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-14 h-14 pointer-events-none"
      src="/img.gif"
      alt=""
    />
  </label>
</div>

</div> */}
<label htmlFor="fileInput" className="container cursor-pointer block">
<div className="header"> 
    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> 
      <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> <p className="text-white text-sm font-medium"> اختر صورة او فيديو</p>
  </div> 
  <div className="footer">  
    <svg fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z" fill="white"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z" fill="white"></path></g></svg> 
    <p className="text-white text-sm font-medium">{campaignMedia ? campaignMedia.name : "لا يوجد ملف محدد"}</p> 
    {campaignMedia && (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCampaignMedia(null);
          const fileInput = document.getElementById('fileInput') as HTMLInputElement;
          if (fileInput) fileInput.value = '';
        }}
        className="cursor-pointer hover:opacity-80 flex items-center justify-center"
        style={{ background: 'none', border: 'none', padding: 0 }}
      >
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white', height: '130%', fill: 'royalblue', backgroundColor: 'rgba(70, 66, 66, 0.103)', borderRadius: '50%', padding: '2px', cursor: 'pointer', boxShadow: '0 2px 30px rgba(0, 0, 0, 0.205)' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="white" strokeWidth="2"></path> <path d="M19.5 5H4.5" stroke="white" strokeWidth="2" strokeLinecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="white" strokeWidth="2"></path> </g></svg>
      </button>
    )}
    {/* {!campaignMedia && (
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="white" strokeWidth="2"></path> <path d="M19.5 5H4.5" stroke="white" strokeWidth="2" strokeLinecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="white" strokeWidth="2"></path> </g></svg>
    )} */}
  </div> 
  <input id="fileInput"
    type="file"
    accept="image/*,video/*"
    className="hidden"
    onChange={(e) => {
      const file = e.target.files?.[0] || null;
      if (file) {
        if (file.size > 2 * 1024 * 1024) {
          showError("حجم الملف كبير جداً", "أقصى حجم مسموح به هو 2 ميجابايت. يرجى ضغط الصورة أو استخدام صيغة WebP.");
          e.target.value = '';
          setCampaignMedia(null);
          return;
        }
      }
      setCampaignMedia(file);
    }}/> 

      </label>
      </div>

{/* ................................................... */}
<div className="w-full ">
  <label className="block text-sm font-medium mb-2 text-white">نص المحتوى التسويقي</label>
  <textarea placeholder="اكتب نص المحتوى التسويقي" className="h-[410px] bg-[#01191040] rounded-md p-2 text-white border-1 border-blue-300 w-full px-3 py-4  outline-none  text-white rounded-md" rows={4} value={campaignTemplate} onChange={(e) => setCampaignTemplate(e.target.value)} />
  {/* <p className="text-xs text-gray-300 mt-1">استخدم placeholder {'{{name}}'}.</p> */}
</div>
       </div>

    <div className="flex flex-col lg:flex-row w-full gap-4">
          <div className=" w-full">
            <label className="block text-sm font-medium mb-2 text-white">التحكم في السرعة (دقائق بين الرسائل)</label>
            <input min="5" max="100" type="number" className="bg-[#01191040] rounded-md p-2 text-white border-1 border-blue-300 w-full px-3 py-4  outline-none text-white rounded-md" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '5'))} />
            <p className="text-xs text-gray-300 mt-1">الحد الأدنى: 5 دقائق {campaignPerNumberDelay ? '(سيتم استخدام "تأخير لكل رقم" بدلاً منها)' : ''}</p>
          </div>


          <div className=" w-full">
           
            <div>
              <label className="block text-sm font-medium mb-2 text-white">الجدولة (اختياري)</label>
              <div className="relative">
                <input 
                  ref={campaignScheduleInputRef}
                  type="datetime-local" 
                  className="bg-[#01191040] rounded-md p-2 text-white border-1 border-blue-300 w-full px-3 py-4 pr-10 outline-none cursor-pointer" 
                  value={campaignScheduleAt} 
                  onChange={(e) => setCampaignScheduleAt(e.target.value)}
                  onClick={() => campaignScheduleInputRef.current?.showPicker()}
                />
                <Calendar 
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white pointer-events-none z-10"
                />
              </div>
            </div>
          </div>

          
            <div className=" w-full">
              <label className="block text-sm font-medium mb-2 text-white">الحد اليومي (أرقام/يوم، اختياري)</label>
              <input placeholder="أقصى عدد 500" min="1" max="500" type="number" className=" bg-[#01191040] rounded-md  text-white border-1 border-blue-300 w-full px-3 py-4  outline-none text-white rounded-md" value={campaignDailyCap} onChange={(e) => setCampaignDailyCap(e.target.value ? Number(e.target.value) : 1)} />
              <p className="text-xs text-gray-300 mt-1">الحد الأقصى: 500 رقم</p>
            </div>
            
            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-white">تأخير لكل رقم (بالدقيقة - القيمة الفعلية المستخدمة)</label>
              <input placeholder="اتركه فارغاً لاستخدام القيمة الافتراضية" min="1" max="100" type="number" className=" bg-[#01191040] rounded-md  text-white border-1 border-blue-300 w-full px-3 py-4  outline-none text-white rounded-md" value={campaignPerNumberDelay} onChange={(e) => setCampaignPerNumberDelay(e.target.value ? Number(e.target.value) : '')} />
              <p className="text-xs text-gray-300 mt-1">{campaignPerNumberDelay ? `سيتم استخدام ${campaignPerNumberDelay} دقيقة بين كل رسالة` : 'سيتم استخدام قيمة "التحكم في السرعة" كقيمة افتراضية'}</p>
            </div>
         


          </div> 


          <div className="flex flex-col lg:flex-row items-center gap-4 w-full">
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
              <div >
                <label className="  text-sm font-medium mb-2 text-white">تكرار كل (ساعات)</label>
                <input 
                  type="number" 
                  min="1" 
                  max="168" 
                  className="bg-[#01191040] rounded-md  text-white border-1 border-blue-300 w-full px-3 py-2  outline-none text-white rounded-md" 
                  value={recurringInterval} 
                   onChange={(e) => setRecurringInterval(parseInt(e.target.value || '1'))}
                />
              </div>
            )}
          </div>
            </div>
          <div className="w-full lg:w-50 ">
            <button 
              className=" w-full lg:h-18 h-12 primary-button text-white text-2xl font-bold" 
              onClick={handleStartCampaign} 
              disabled={isStartingCampaign || !campaignFile || !campaignTemplate}
            >
              {campaignScheduleAt && new Date(campaignScheduleAt) > new Date() 
                ? "بدء جدولة الحملة" 
                : "بدء الحملة"}
            </button>

            </div>
         
          
             
          </div>
         
        </CardContent>
      </Card>

      {/* Scheduled WhatsApp campaigns */}
      <Card className="gradient-border border-none">
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl">
          الحملات المجدولة في واتساب
          <p className="text-yellow-400 text-sm">بامكانك تعديل معلومات الحملة من صفحة المحتوى المجدول</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoadingSchedules ? (
            <div className="text-white text-sm">جاري تحميل الحملات المجدولة...</div>
          ) : campaignSchedules.length === 0 ? (
            <div className="text-white/60 text-sm">
              لا توجد حملات مجدولة حالياً.
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-white/10">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-white">#</TableHead>
                      <TableHead className="text-white">وقت البدء</TableHead>
                      <TableHead className="text-white">عدد الأرقام</TableHead>
                      {/* <TableHead className="text-white">نوع</TableHead> */}
                      <TableHead className="text-white">الحالة</TableHead>
                      <TableHead className="text-white">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaignSchedules
                      .slice((campaignSchedulePage - 1) * schedulesPerPage, campaignSchedulePage * schedulesPerPage)
                      .map((s) => {
                        const date = new Date(s.scheduledAt);
                        const isPending = s.status === 'pending';
                        const rowsCount = Array.isArray(s.payload?.rows) ? s.payload.rows.length : 0;
                        const isRecurringSchedule = !!s.payload?.isRecurring;
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="text-white">{s.id}</TableCell>
                            <TableCell className="text-white">{date.toLocaleString()}</TableCell>
                            <TableCell className="text-white">{rowsCount}</TableCell>
                            {/* <TableCell className="text-white">
                              {isRecurringSchedule ? (
                                <span className="text-primary">متكررة</span>
                              ) : (
                                'عادية'
                              )}
                            </TableCell> */}
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
                                onClick={() => handleCancelCampaignSchedule(s.id)}
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
              {Math.ceil(campaignSchedules.length / schedulesPerPage) > 1 && (
                <div className="flex items-center justify-between text-white text-sm">
                  <button
                    onClick={() => setCampaignSchedulePage((prev) => Math.max(prev - 1, 1))}
                    disabled={campaignSchedulePage === 1}
                    className="primary-button px-3 py-1 text-xs disabled:opacity-50"
                  >
                    السابق
                  </button>
                  <span>
                    صفحة {campaignSchedulePage} من {Math.ceil(campaignSchedules.length / schedulesPerPage)}
                  </span>
                  <button
                    onClick={() =>
                      setCampaignSchedulePage((prev) =>
                        Math.min(prev + 1, Math.ceil(campaignSchedules.length / schedulesPerPage))
                      )
                    }
                    disabled={campaignSchedulePage === Math.ceil(campaignSchedules.length / schedulesPerPage)}
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



      <Card className="gradient-border border-none">
        <CardHeader className="border-text-primary/50 text-white font-bold text-xl"> حملة اعلانية لتصنيف محدد </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4">


            <div className="w-full flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white">اختر التصنيف</label>
              <select
                  className="w-full appearance-none px-3 py-4 bg-[#01191040] rounded-md text-white border-1 border-blue-300 outline-none"
                value={selectedTagId}
                onChange={(e) => setSelectedTagId(e.target.value ? Number(e.target.value) : '')}
              >
                <option  value="">-- اختر تصنيف --</option>
                {tags.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
           
            <div>
            <label className="block text-sm font-medium mb-2 text-white">التحكم في السرعة (دقائق بين الرسائل)</label>
             <input placeholder="5" min="5" max="100" type="number" className="w-full px-3 py-4 bg-[#01191040] rounded-md text-white border-1 border-blue-300 outline-none" value={campaignThrottle} onChange={(e) => setCampaignThrottle(parseInt(e.target.value || '5'))} />
             <p className="text-xs text-gray-300 mt-1">الحد الأدنى: 5 دقائق</p>
          </div>

          <div>
              <label className="block text-sm font-medium mb-2 text-white">ارفع صورة او فيديو (اختياري)</label>
              <label htmlFor="tagFileInput" className="container cursor-pointer block">
                <div className="header"> 
                    <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> 
                      <path d="M7 10V9C7 6.23858 9.23858 4 12 4C14.7614 4 17 6.23858 17 9V10C19.2091 10 21 11.7909 21 14C21 15.4806 20.1956 16.8084 19 17.5M7 10C4.79086 10 3 11.7909 3 14C3 15.4806 3.8044 16.8084 5 17.5M7 10C7.43285 10 7.84965 10.0688 8.24006 10.1959M12 12V21M12 12L15 15M12 12L9 15" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"></path> </g></svg> <p className="text-white text-sm font-medium"> اختر صورة او فيديو</p>
                  </div> 
                  <div className="footer"> 
                    <svg fill="#ffffff" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M15.331 6H8.5v20h15V14.154h-8.169z" fill="white"></path><path d="M18.153 6h-.009v5.342H23.5v-.002z" fill="white"></path></g></svg> 
                    <p className="text-white text-sm font-medium">{tagCampaignMedia ? tagCampaignMedia.name : "لا يوجد ملف محدد"}</p> 
                    {tagCampaignMedia && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTagCampaignMedia(null);
                          const fileInput = document.getElementById('tagFileInput') as HTMLInputElement;
                          if (fileInput) fileInput.value = '';
                        }}
                        className="cursor-pointer hover:opacity-80 flex items-center justify-center"
                        style={{ background: 'none', border: 'none', padding: 0 }}
                      >
                        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ color: 'white', height: '130%', fill: 'royalblue', backgroundColor: 'rgba(70, 66, 66, 0.103)', borderRadius: '50%', padding: '2px', cursor: 'pointer', boxShadow: '0 2px 30px rgba(0, 0, 0, 0.205)' }}><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M5.16565 10.1534C5.07629 8.99181 5.99473 8 7.15975 8H16.8402C18.0053 8 18.9237 8.9918 18.8344 10.1534L18.142 19.1534C18.0619 20.1954 17.193 21 16.1479 21H7.85206C6.80699 21 5.93811 20.1954 5.85795 19.1534L5.16565 10.1534Z" stroke="white" strokeWidth="2"></path> <path d="M19.5 5H4.5" stroke="white" strokeWidth="2" strokeLinecap="round"></path> <path d="M10 3C10 2.44772 10.4477 2 11 2H13C13.5523 2 14 2.44772 14 3V5H10V3Z" stroke="white" strokeWidth="2"></path> </g></svg>
                      </button>
                    )}
                  </div> 
                  <input id="tagFileInput"
                    type="file"
                    accept="image/*,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0] || null;
                      if (file) {
                        if (file.size > 2 * 1024 * 1024) {
                          showError("حجم الملف كبير جداً", "أقصى حجم مسموح به هو 2 ميجابايت. يرجى ضغط الصورة أو استخدام صيغة WebP.");
                          e.target.value = '';
                          setTagCampaignMedia(null);
                          return;
                        }
                      }
                      setTagCampaignMedia(file);
                    }}/> 
              </label>
          </div>


            </div>

            <div className="w-full">
              <label className="block text-sm font-medium mb-2 text-white">نص المحتوى التسويقي</label>
               <textarea placeholder="اكتب نص المحتوى التسويقي" className="w-full px-3 py-4 bg-[#01191040] rounded-md text-white border-1 border-blue-300 outline-none" rows={4} value={tagCampaignTemplate} onChange={(e) => setTagCampaignTemplate(e.target.value)} />
            </div>


          </div>


        


          <button className="w-50 h-18 primary-button text-white text-2xl font-bold" onClick={handleSendToTag} disabled={isSendingToTag || !selectedTagId || !tagCampaignTemplate.trim()}>بدء الحملة </button>
        </CardContent>
      </Card>
    </div>
  );
}