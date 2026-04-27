"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Send, Phone, Video, MoreVertical, Battery, Wifi, Signal } from "lucide-react";
import Image from "next/image";

type Message = {
  id: number;
  text: string;
  sender: "user" | "bot";
  time: string;
};

export default function LandingWhatsAppDemo() {
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "مرحباً بك! 👋 أنا المساعد الذكي، جرب التحدث معي الآن لفهم كيف أعمل.", sender: "bot", time: "10:00 ص" },
    { id: 2, text: "يمكنك سؤالي عن (الأسعار)، (المميزات)، أو إرسال (تجربة) لنرى كيف تعمل الردود الآلية.", sender: "bot", time: "10:00 ص" }
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage = inputText;
    const now = new Date();
    const timeString = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }).replace('ص', 'ص').replace('م', 'م'); // simplified arabic time
    
    setMessages(prev => [...prev, { id: Date.now(), text: userMessage, sender: "user", time: timeString }]);
    setInputText("");
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      let botReply = "هذه رسالة تجريبية من المحاكي! 🤖 في الحقيقة، سأقوم بالرد بناءً على إعداداتك ومسارات الذكاء الاصطناعي التي تحددها لمعالجة هذه الرسالة.";
      
      const lowerInput = userMessage.toLowerCase();
      if (lowerInput.includes("سعر") || lowerInput.includes("اسعار") || lowerInput.includes("اشتراك") || lowerInput.includes("باق")) {
        botReply = "نظامنا مرن جداً! يمكنك تفصيل باقتك والدفع فقط مقابل المميزات التي تحتاجها عبر نظام الاشتراك الذكي. 💰";
      } else if (lowerInput.includes("ميز") || lowerInput.includes("خصائص")) {
        botReply = "لدينا ميزات مذهلة: الرد التلقائي المتفرع، اللايف شات المدمج، صلاحيات الموظفين، واستخدام الذكاء الاصطناعي لخدمة عملائك أثناء نومك! 🚀";
      } else if (lowerInput.includes("كيف") || lowerInput.includes("عمل") || lowerInput.includes("طريق")) {
         botReply = "الأمر بسيط جداً! تقوم بربط رقمك الأصلي بالمنصة بجهاز الهاتف، وتنشئ مسارات الرد، وسأقوم أنا بإدارة آلاف المحادثات دفعة واحدة 24/7 دون توقف ⏳.";
      } else if (lowerInput.includes("مرحبا") || lowerInput.includes("السلام") || lowerInput.includes("اهلا")) {
         botReply = "أهلاً بك يا صديقي! كيف يمكنني مساعدتك اليوم؟ أنا هنا للإجابة على استفساراتك حول المنصة.";
      }

      setMessages(prev => [...prev, { id: Date.now() + 1, text: botReply, sender: "bot", time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800); // realistic typing wait
  };

  return (
    <section id="demo" className="py-24 md:py-32 relative overflow-hidden bg-transparent">
       <div className="max-w-7xl mx-auto px-4 md:px-8 relative z-10 flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Text Content */}
          <div className="text-center lg:text-right flex-1 max-w-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 font-medium text-sm mb-6 shadow-[0_0_15px_rgba(34,197,94,0.1)]"
            >
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span>محاكي تفاعلي حيّ</span>
            </motion.div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl lg:text-6xl font-extrabold text-white mb-8 leading-tight"
            >
              جرب سرعة الرد <br className="hidden md:block" /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 via-emerald-400 to-green-500">بنفسك الآن!</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-white/70 text-lg md:text-xl font-medium leading-relaxed mb-10"
            >
              لا حاجة لتسجيل رقمك أو الدخول للواتساب! هذا محاكي افتراضي حيّ مبني مباشرة في الموقع. اكتب أي شيء وجرب بنفسك شعور عملائك عند محادثة المساعد الذكي الذي لا ينام.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="flex flex-wrap gap-4 justify-center lg:justify-start"
            >
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                  رد فوري
               </div>
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                  ذكاء منطقي
               </div>
               <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/40"></div>
                  دعم 24 ساعة
               </div>
            </motion.div>
          </div>

          {/* Realistic Phone Mockup */}
          <div className="flex-1 flex justify-center lg:justify-start w-full relative">
             {/* Background glow decoration */}
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-green-600/10 blur-[120px] rounded-full -z-10"></div>
             
             <motion.div 
               initial={{ opacity: 0, y: 40, scale: 0.95 }}
               whileInView={{ opacity: 1, y: 0, scale: 1 }}
               viewport={{ once: true }}
               className="w-full max-w-[340px] md:max-w-[380px] h-[680px] md:h-[760px] bg-[#0b141a] rounded-[3.5rem] p-3 border-[14px] border-[#0a4d68] shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_0_12px_rgba(8,131,149,0.2)] relative overflow-visible flex flex-col"
             >
                {/* Side Buttons (Hardware) - Sea Blue Theme */}
                <div className="absolute left-[-16px] top-32 w-1 h-12 bg-gradient-to-b from-[#0e7490] to-[#042f2e] rounded-l-md border-r border-white/10"></div>
                <div className="absolute left-[-16px] top-48 w-1 h-12 bg-gradient-to-b from-[#0e7490] to-[#042f2e] rounded-l-md border-r border-white/10"></div>
                <div className="absolute right-[-16px] top-40 w-1 h-20 bg-gradient-to-b from-[#0e7490] to-[#042f2e] rounded-r-md border-l border-white/10"></div>

                {/* Inner Screen Border (Rounded) */}
                <div className="w-full h-full rounded-[2.8rem] overflow-hidden flex flex-col relative bg-[#0b141a]">
                   
                   {/* Dynamic Island / Notch */}
                   <div className="absolute top-3 inset-x-0 flex justify-center z-40 pointer-events-none">
                      <div className="w-24 h-6 bg-black rounded-full flex items-center justify-end px-4 gap-1.5 border border-white/5 shadow-inner">
                         <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50 shadow-[0_0_5px_blue] blur-[1px]"></div>
                         <div className="w-1 h-1 rounded-full bg-white/10"></div>
                      </div>
                   </div>

                   {/* Phone Top Status Bar */}
                   <div className="h-12 w-full flex items-end justify-between px-8 text-white/90 text-[11px] font-bold z-20 pb-1">
                     <span>{new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }).replace('ص', '').replace('م', '')}</span>
                     <div className="flex items-center gap-1.5">
                        <Signal className="w-3 h-3" />
                        <Wifi className="w-3 h-3" />
                        <Battery className="w-3.5 h-3.5" />
                     </div>
                   </div>

                   {/* WhatsApp Header */}
                   <div className="bg-[#202c33] px-4 py-3 pt-4 flex items-center justify-between shadow-md z-10 border-b border-white/5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-lg shrink-0 relative">
                            <Image src="/favicon.ico" alt="Logo" width={100} height={100}  />
                            {/* <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-[#202c33] rounded-full"></div> */}
                         </div>
                         <div>
                           <h3 className="text-white font-bold text-sm">بوت فلوكسيرا</h3>
                           <p className="text-[#8696a0] text-[10px] flex items-center gap-1">
                             <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                             متصل الآن
                           </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4 text-[#aebac1]">
                         <Video className="w-5 h-5 opacity-70" />
                         <Phone className="w-5 h-5 opacity-70" />
                         <MoreVertical className="w-5 h-5 opacity-70" />
                      </div>
                   </div>

                   {/* WhatsApp Chat Area */}
                   <div 
                        ref={chatContainerRef}
                        className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 relative scrollbar-hide pt-6" 
                        style={{
                           backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.02' fill-rule='evenodd'%3E%3Ccircle cx='3' cy='3' r='3'/%3E%3Ccircle cx='13' cy='13' r='3'/%3E%3C/g%3E%3C/svg%3E")`,
                           backgroundSize: '30px'
                        }}>
                      
                      <div className="flex justify-center mb-6 text-[10px]">
                        <span className="bg-[#182229] text-[#8696a0] px-4 py-1 rounded-md uppercase tracking-wider font-bold">اليوم</span>
                      </div>

                      <div className="flex justify-center mb-6 text-[11px] text-[#fde484]/80 bg-[#222e35] px-4 py-2 rounded-xl text-center mx-4 leading-relaxed border border-[#fde484]/10 shadow-sm">
                        هذا مجرد محاكي واجهة لغرض التجربة، لا يتم حفظ أي بيانات حقيقية.
                      </div>

                      <AnimatePresence>
                        {messages.map((m) => (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 10, originX: m.sender === "user" ? 1 : 0 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            key={m.id} 
                            className={`max-w-[85%] p-3 relative shadow-md ${m.sender === "user" ? "bg-[#005c4b] self-end rounded-2xl rounded-tl-sm" : "bg-[#202c33] self-start rounded-2xl rounded-tr-sm"}`}
                          >
                            <p className="text-[#e9edef] text-[14px] leading-relaxed whitespace-pre-wrap">{m.text}</p>
                            <div className="text-[9px] mt-1 flex justify-end gap-1.5 items-center text-[#8696a0]">
                               {m.time}
                               {m.sender === 'user' && (
                                  <svg viewBox="0 0 16 15" width="16" height="15" className="text-[#53bdeb]"><path fill="currentColor" d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.879a.32.32 0 0 1-.484.033l-.358-.325a.319.319 0 0 0-.484.032l-.378.483a.418.418 0 0 0 .036.541l1.32 1.266c.143.14.361.125.484-.033l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.879a.32.32 0 0 1-.484.033L1.891 7.769a.366.366 0 0 0-.515.006l-.423.433a.364.364 0 0 0 .006.514l3.258 3.185c.143.14.361.125.484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z"></path></svg>
                               )}
                            </div>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                      
                      {isTyping && (
                        <motion.div 
                          initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                          className="bg-[#202c33] self-start rounded-2xl rounded-tr-sm px-4 py-3 flex items-center gap-1 order-last shadow-md"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "0ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "150ms" }} />
                          <div className="w-1.5 h-1.5 rounded-full bg-[#8696a0] animate-bounce" style={{ animationDelay: "300ms" }} />
                        </motion.div>
                      )}
                      {/* Space to prevent input overlap */}
                      <div className="min-h-[20px]" />
                   </div>

                   {/* Quick Suggestions (WhatsApp Style) */}
                   <div className="bg-[#0b141a]/80 backdrop-blur-md px-3 py-3 flex items-center gap-2 overflow-x-auto whitespace-nowrap scrollbar-hide border-t border-white/5">
                      {["كم الأسعار؟", "ما هي المميزات؟", "كيف يعمل البوت؟"].map((quickMsg, i) => (
                         <button 
                            key={i}
                            onClick={() => { setInputText(quickMsg); setTimeout(handleSend, 100); }}
                            className="bg-[#2a3942] hover:bg-[#344651] text-[#e9edef] px-4 py-1.5 rounded-full text-[12px] font-bold transition-all border border-white/5 active:scale-95 shadow-lg"
                         >
                            {quickMsg}
                         </button>
                      ))}
                   </div>

                   {/* WhatsApp Input */}
                   <div className="bg-[#202c33] px-3 py-4 flex items-end gap-2 border-t border-black/20 pb-8">
                      <div className="flex-1 bg-[#2a3942] rounded-3xl px-5 py-3 min-h-[48px] flex items-center border border-white/5 shadow-inner">
                        <input 
                          type="text" 
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                          placeholder="اكتب رسالة للتجربة..."
                          className="w-full bg-transparent border-none outline-none text-[#d1d7db] placeholder-[#8696a0] text-[15px] focus:ring-0" 
                        />
                      </div>
                      <button 
                        onClick={handleSend}
                        className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition-all shadow-xl active:scale-90 ${inputText.trim() ? "bg-[#00a884] text-white hover:bg-[#02b992]" : "bg-[#2a3942] text-[#8696a0]"}`}
                      >
                        <Send className="w-5 h-5 rtl:-scale-x-100" />
                      </button>
                   </div>
                </div>
                
                {/* Home Indicator */}
                <div className="absolute bottom-2 inset-x-0 h-1 flex justify-center z-50">
                   <div className="w-32 h-1.5 bg-white/20 rounded-full"></div>
                </div>
             </motion.div>
          </div>
       </div>
    </section>
  );
}

