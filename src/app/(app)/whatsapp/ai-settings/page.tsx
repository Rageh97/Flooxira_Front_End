"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { 
  getBotSettings, 
  updateBotSettings, 
  resetBotSettings, 
  getAvailableModels,
  getPersonalityTemplates,
  type BotSettings,
  type PersonalityTemplate,
  type AvailableModels,
  type ModelInfo
} from '@/lib/botSettingsApi';
import { 
  getAllPrompts, 
  type AIPrompt,
  type PromptCategory
} from '@/lib/aiPromptApi';
import { useRouter } from 'next/navigation';
import { Copy, Check, Filter } from 'lucide-react';

export default function AISettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [templates, setTemplates] = useState<Record<string, PersonalityTemplate> | null>(null);
  const [activeTab, setActiveTab] = useState('general');
  const [prompts, setPrompts] = useState<AIPrompt[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<PromptCategory | "">("");
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/sign-in';
      return;
    }
    loadData();
  }, [user, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [settingsRes, modelsRes, templatesRes] = await Promise.all([
        getBotSettings(),
        getAvailableModels(),
        getPersonalityTemplates()
      ]);
      
      if (settingsRes.success) setSettings(settingsRes.data);
      if (modelsRes.success) setAvailableModels(modelsRes.data);
      if (templatesRes.success) setTemplates(templatesRes.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setError('فشل في تحميل الإعدادات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await updateBotSettings(settings);
      if (res.success) {
        setSuccess('تم حفظ الإعدادات بنجاح!');
        setSettings(res.data);
      } else {
        setError(res.message || 'فشل في حفظ الإعدادات');
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('فشل في حفظ الإعدادات');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!confirm('هل أنت متأكد من إعادة تعيين جميع الإعدادات إلى الافتراضية؟')) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const res = await resetBotSettings();
      if (res.success) {
        setSuccess('تم إعادة تعيين الإعدادات إلى الافتراضية بنجاح!');
        setSettings(res.data);
      } else {
        setError(res.message || 'فشل في إعادة تعيين الإعدادات');
      }
    } catch (error) {
      console.error('Error resetting settings:', error);
      setError('فشل في إعادة تعيين الإعدادات');
    } finally {
      setSaving(false);
    }
  };

 
  const applyTemplate = (templateKey: string) => {
    if (!templates || !settings) return;
    
    const template = templates[templateKey];
    if (!template) return;
    
    setSettings({
      ...settings,
      personality: templateKey as any,
      systemPrompt: template.systemPrompt,
      greetingPrompt: template.greetingPrompt,
      farewellPrompt: template.farewellPrompt
    });
  };


  const loadPrompts = async () => {
    setPromptsLoading(true);
    try {
      const params: any = {
        isActive: true,
        limit: 100,
      };
      if (categoryFilter) {
        params.category = categoryFilter;
      }
      const res = await getAllPrompts(params);
      if (res.success) {
        setPrompts(res.data);
      }
    } catch (error) {
      console.error('Error loading prompts:', error);
    } finally {
      setPromptsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'ai-prompts') {
      loadPrompts();
    }
  }, [activeTab, categoryFilter]);

  const handleCopyPrompt = async (promptText: string, promptId: number) => {
    try {
      await navigator.clipboard.writeText(promptText);
      setCopiedPromptId(promptId);
      setTimeout(() => setCopiedPromptId(null), 2000);
      setSuccess('تم نسخ البرومبت بنجاح!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      setError('فشل في نسخ البرومبت');
      setTimeout(() => setError(''), 3000);
    }
  };

  const CATEGORY_LABELS: Record<PromptCategory, string> = {
    system: 'النظام',
    greeting: 'التحية',
    farewell: 'الوداع',
    sales: 'المبيعات',
    support: 'الدعم',
    objection_handling: 'التعامل مع الاعتراضات',
    appointment: 'المواعيد',
    general: 'عام',
    custom: 'مخصص',
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <div className="text-center text-red-500">فشل في تحميل الإعدادات</div>
      </div>
    );
  }

  return (
    <div className="w-full mx-auto ">
      {/* <h1 className="text-3xl font-bold gradient-border mb-6 text-white">إعدادات بوت الذكاء الاصطناعي</h1> */}
      
      {/* Status Messages */}
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md text-red-700">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md text-green-700">
          {success}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 gradient-border inner-shadow">
        <div className="relative">
          <div className="flex overflow-x-auto  pb-0 hide-scrollbar">
            <div className="flex space-x-1 px-1 sm:px-2">
              {[
                { id: 'general', label: 'عام' },
                // { id: 'ai', label: 'نماذج الذكاء الاصطناعي' },
                { id: 'personality', label: 'الشخصية' },
                { id: 'business', label: 'الأعمال' },
                { id: 'prompts', label: 'الرسائل المخصصة' },
                { id: 'ai-prompts', label: 'برومبتات الذكاء الاصطناعي' },
                { id: 'advanced', label: 'متقدم' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap px-3 py-2 rounded-md text-xs sm:text-sm font-medium transition-colors flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-secondry text-white shadow-md'
                      : 'text-white hover:bg-secondry/50'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
          {/* Scroll indicators */}
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-gray-900 to-transparent pointer-events-none"></div>
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-gray-900 to-transparent pointer-events-none"></div>
        </div>
        <style jsx>{`
          .hide-scrollbar {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }
          .hide-scrollbar::-webkit-scrollbar {
            display: none;
          }
        `}</style>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card className="gradient-border mb-6 text-white">
          <CardHeader>
            <CardTitle>الإعدادات العامة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">طول الرد</label>
                <select
                  value={settings.responseLength}
                  onChange={(e) => setSettings({...settings, responseLength: e.target.value as any})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                >
                  <option value="short">قصير</option>
                  <option value="medium">متوسط</option>
                  <option value="long">طويل</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">اللغة</label>
                <select
                  value={settings.language}
                  onChange={(e) => setSettings({...settings, language: e.target.value as any})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                >
                  <option value="arabic">عربي</option>
                  <option value="english">إنجليزي</option>
                  <option value="both">كلاهما</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeEmojis}
                  onChange={(e) => setSettings({...settings, includeEmojis: e.target.checked})}
                  className="mx-2"
                />
                تضمين الإيموجي
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeGreetings}
                  onChange={(e) => setSettings({...settings, includeGreetings: e.target.checked})}
                  className="mx-2"
                />
                تضمين التحيات
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeFarewells}
                  onChange={(e) => setSettings({...settings, includeFarewells: e.target.checked})}
                  className="mx-2"
                />
                تضمين الوداع
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Models Settings */}
      {activeTab === 'ai' && (
        <Card className="gradient-border mb-6 text-white">
          <CardHeader>
            <CardTitle>تكوين نماذج الذكاء الاصطناعي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">مزود الذكاء الاصطناعي</label>
                <select
                  value={settings.aiProvider}
                  onChange={(e) => setSettings({...settings, aiProvider: e.target.value as any})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                >
                  <option value="openai">OpenAI فقط</option>
                  <option value="gemini">Gemini فقط</option>
                  <option value="both">كلاهما (احتياطي)</option>
                </select>
              </div>
              <div>
              <label className="block text-sm font-medium mb-2">الحد الأقصى للرموز</label>
              <input
                type="number"
                min="100"
                max="4000"
                value={settings.maxTokens}
                onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
              />
            </div>
              {/* <div>
                <label className="block text-sm font-medium mb-2"> جودة الرد</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.temperature}
                  onChange={(e) => setSettings({...settings, temperature: parseFloat(e.target.value)})}
                  className="w-full"
                />
                <div className="text-sm text-gray-600 mt-1">{settings.temperature}</div>
              </div> */}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نموذج OpenAI</label>
                <select
                  value={settings.openaiModel}
                  onChange={(e) => setSettings({...settings, openaiModel: e.target.value})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                >
                  {availableModels?.openai.map((model, index) => (
                    <option key={model.id || index} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">نموذج Gemini</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({...settings, geminiModel: e.target.value})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                >
                  {availableModels?.gemini.map((model, index) => (
                    <option key={model.id || index} value={model.id}>{model.name}</option>
                  ))}
                </select>
              </div>
            </div>

          
          </CardContent>
        </Card>
      )}

      {/* Personality Settings */}
      {activeTab === 'personality' && (
        <Card className="gradient-border mb-6 text-white">
          <CardHeader>
            <CardTitle>الشخصية والنبرة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نوع الشخصية</label>
                <select
                  value={settings.personality}
                  onChange={(e) => setSettings({...settings, personality: e.target.value as any})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                >
                  <option value="professional">مهني</option>
                  <option value="friendly">ودود</option>
                  <option value="casual">عادي</option>
                  <option value="formal">رسمي</option>
                  <option value="marketing">تسويقي</option>
                  <option value="custom">مخصص</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">اللهجة</label>
                <select
                  value={settings.dialect}
                  onChange={(e) => setSettings({...settings, dialect: e.target.value as any})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                >
                  <option value="saudi">سعودي</option>
                  <option value="egyptian">مصري</option>
                  <option value="lebanese">لبناني</option>
                  <option value="emirati">إماراتي</option>
                  <option value="kuwaiti">كويتي</option>
                  <option value="qatari">قطري</option>
                  <option value="bahraini">بحريني</option>
                  <option value="omani">عماني</option>
                  <option value="jordanian">أردني</option>
                  <option value="palestinian">فلسطيني</option>
                  <option value="syrian">سوري</option>
                  <option value="iraqi">عراقي</option>
                  <option value="standard">العربية الفصحى</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">النبرة</label>
              <select
                value={settings.tone}
                onChange={(e) => setSettings({...settings, tone: e.target.value as any})}
                className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
              >
                <option value="formal">رسمي</option>
                <option value="informal">غير رسمي</option>
                <option value="mixed">مختلط</option>
              </select>
            </div>

            {/* Personality Templates */}
            {/* {templates && (
              <div>
                <label className="block text-sm font-medium mb-2">قوالب سريعة</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(templates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => applyTemplate(key)}
                      className="p-3 border-1 border-blue-300 rounded-md text-left hover:bg-gray-50"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )} */}
          </CardContent>
        </Card>
      )}

      {/* Business Settings */}
      {activeTab === 'business' && (
        <Card className="gradient-border mb-6 text-white">
          <CardHeader>
            <CardTitle>معلومات الأعمال</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اسم العمل</label>
                <input
                  type="text"
                  value={settings.businessName || ''}
                  onChange={(e) => setSettings({...settings, businessName: e.target.value})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                  placeholder="اسم عملك"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">نوع العمل</label>
                <input
                  type="text"
                  value={settings.businessType || ''}
                  onChange={(e) => setSettings({...settings, businessType: e.target.value})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
                  placeholder="مثال: التجارة الإلكترونية، مطعم، خدمات"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">وصف العمل</label>
              <textarea
                value={settings.businessDescription || ''}
                onChange={(e) => setSettings({...settings, businessDescription: e.target.value})}
                className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                placeholder="اوصف عملك وما تقدمه"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الجمهور المستهدف</label>
              <textarea
                value={settings.targetAudience || ''}
                onChange={(e) => setSettings({...settings, targetAudience: e.target.value})}
                className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                placeholder="اوصف عملاءك المستهدفين"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Prompts */}
      {activeTab === 'prompts' && (
        <Card className="gradient-border mb-6 text-white">
          <CardHeader>
            <CardTitle>الرسائل المخصصة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* WhatsApp Auto Welcome Message */}
            <div className="space-y-2">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!settings.welcomeAutoMessageEnabled}
                  onChange={(e) => setSettings({ ...settings, welcomeAutoMessageEnabled: e.target.checked })}
                  className="mx-2"
                />
                 تفعيل رسالة الترحيب التلقائية في واتساب لعملاء سلة
              </label>
              <div>
                <label className="block text-sm font-medium mb-2"> رسالة الترحيب</label>
                <textarea
                  value={settings.welcomeAutoMessageTemplate || ''}
                  onChange={(e) => setSettings({ ...settings, welcomeAutoMessageTemplate: e.target.value })}
                  className="w-full p-2 border-1 border-blue-300 rounded-md h-28 bg-[#01191040]"
                  placeholder={"مثال:مرحباً {name}! 👋سعدنا بانضمامك{store}.إذا احتجت أي مساعدة، راسلنا هنا في أي وقت."}
                />
                <div className="text-xs text-gray-400 mt-1">
                  المتغيرات المتاحة: {'{name}'} اسم العميل، {'{store}'} اسم المتجر مسبوقًا بمسافة إذا توفر
                </div>
              </div>
            </div>


            <div>
              <label className="block text-sm font-medium mb-2"> بروميت الذكاء الاصطناعي</label>
              <textarea
                value={settings.systemPrompt || ''}
                onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})}
                className="w-full p-2 border-1 border-blue-300 rounded-md h-32 bg-[#01191040]"
                placeholder="رسالة النظام الرئيسية التي تحدد سلوك البوت"
              />
            </div>

            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">رسالة التحية</label>
                <textarea
                  value={settings.greetingPrompt || ''}
                  onChange={(e) => setSettings({...settings, greetingPrompt: e.target.value})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                  placeholder="كيف يجب أن يحيا البوت العملاء"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">رسالة الوداع</label>
                <textarea
                  value={settings.farewellPrompt || ''}
                  onChange={(e) => setSettings({...settings, farewellPrompt: e.target.value})}
                  className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                  placeholder="كيف يجب أن يودع البوت العملاء"
                />
              </div>
            </div> */}

            {/* <div>
              <label className="block text-sm font-medium mb-2">رسالة المبيعات</label>
              <textarea
                value={settings.salesPrompt || ''}
                onChange={(e) => setSettings({...settings, salesPrompt: e.target.value})}
                className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                placeholder="كيف يجب أن يتعامل البوت مع محادثات المبيعات"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رسالة التعامل مع الاعتراضات</label>
              <textarea
                value={settings.objectionHandlingPrompt || ''}
                onChange={(e) => setSettings({...settings, objectionHandlingPrompt: e.target.value})}
                className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                placeholder="كيف يجب أن يتعامل البوت مع اعتراضات العملاء"
              />
            </div> */}
            
            {/* Order Auto Messages Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-3">رسائل الطلبات التلقائية</h3>
                
                {/* Platform Selection */}
                <div className="bg-[#01191080] p-4 rounded-lg border border-blue-300/20">
                  <label className="block text-sm font-medium mb-3 text-blue-300">اختر المنصات المفعلة:</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center p-3 rounded-md border border-blue-300/30 hover:bg-blue-500/10 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={!!settings.orderAutoMessageSallaEnabled}
                        onChange={(e) => setSettings({ ...settings, orderAutoMessageSallaEnabled: e.target.checked })}
                        className="mx-2"
                      />
                      <span className="font-medium">سلة</span>
                    </label>
                    
                    <label className="flex items-center p-3 rounded-md border border-blue-300/30 hover:bg-blue-500/10 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={!!settings.orderAutoMessageWordpressEnabled}
                        onChange={(e) => setSettings({ ...settings, orderAutoMessageWordpressEnabled: e.target.checked })}
                        className="mx-2"
                      />
                      <span className="font-medium">ووردبريس</span>
                    </label>
                    
                    <label className="flex items-center p-3 rounded-md border border-blue-300/30 hover:bg-blue-500/10 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={!!settings.orderAutoMessageIappCloudEnabled}
                        onChange={(e) => setSettings({ ...settings, orderAutoMessageIappCloudEnabled: e.target.checked })}
                        className="mx-2"
                      />
                      <span className="font-medium">iAppCloud</span>
                    </label>
                  </div>
                </div>
                
                {(settings.orderAutoMessageSallaEnabled || settings.orderAutoMessageWordpressEnabled || settings.orderAutoMessageIappCloudEnabled) && (
                  <div className="space-y-4 pr-6">
                    {/* Order Created Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.orderCreatedEnabled}
                            onChange={(e) => setSettings({ ...settings, orderCreatedEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة الطلب الجديد</span>
                        </label>
                      </div>
                      {settings.orderCreatedEnabled && (
                        <textarea
                          value={settings.orderCreatedTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, orderCreatedTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="مرحباً {name}! تم استلام طلبك رقم #{order_id} بنجاح.قيمة الطلب: {amount} {currency}"
                        />
                      )}
                    </div>

                    {/* Order Paid Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.orderPaidEnabled}
                            onChange={(e) => setSettings({ ...settings, orderPaidEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة تأكيد الدفع</span>
                        </label>
                      </div>
                      {settings.orderPaidEnabled && (
                        <textarea
                          value={settings.orderPaidTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, orderPaidTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="شكراً {name}! تم تأكيد الدفع لطلبك رقم #{order_id}.جاري تجهيز طلبك للشحن."
                        />
                      )}
                    </div>

                    {/* Order Shipped Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.orderShippedEnabled}
                            onChange={(e) => setSettings({ ...settings, orderShippedEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة الشحن</span>
                        </label>
                      </div>
                      {settings.orderShippedEnabled && (
                        <textarea
                          value={settings.orderShippedTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, orderShippedTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="مرحباً {name}! تم شحن طلبك رقم #{order_id}. تتبع الشحنة من خلال الرابط المرفق."
                        />
                      )}
                    </div>

                    {/* Order Delivered Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.orderDeliveredEnabled}
                            onChange={(e) => setSettings({ ...settings, orderDeliveredEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة التوصيل</span>
                        </label>
                      </div>
                      {settings.orderDeliveredEnabled && (
                        <textarea
                          value={settings.orderDeliveredTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, orderDeliveredTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="مرحباً {name}! تم توصيل طلبك رقم #{order_id} بنجاح.نتمنى أن تكون راضياً عن تجربتك معنا!"
                        />
                      )}
                    </div>

                    {/* Order Cancelled Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.orderCancelledEnabled}
                            onChange={(e) => setSettings({ ...settings, orderCancelledEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة الإلغاء</span>
                        </label>
                      </div>
                      {settings.orderCancelledEnabled && (
                        <textarea
                          value={settings.orderCancelledTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, orderCancelledTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="مرحباً {name}،تم إلغاء طلبك رقم #{order_id}.إذا كان لديك أي استفسار، لا تتردد في التواصل معنا."
                        />
                      )}
                    </div>

                    {/* Order Status Update Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.orderStatusEnabled}
                            onChange={(e) => setSettings({ ...settings, orderStatusEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة تحديث الحالة</span>
                        </label>
                      </div>
                      {settings.orderStatusEnabled && (
                        <textarea
                          value={settings.orderStatusTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, orderStatusTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="مرحباً {name}! تم تحديث حالة طلبك رقم #{order_id}.الحالة الجديدة: {status}"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Cart Auto Messages Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-3">رسائل السلة التلقائية</h3>
                
                {/* Platform Selection for Cart */}
                <div className="bg-[#01191080] p-4 rounded-lg border border-blue-300/20">
                  <label className="block text-sm font-medium mb-3 text-blue-300">اختر المنصات المفعلة:</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <label className="flex items-center p-3 rounded-md border border-blue-300/30 hover:bg-blue-500/10 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={!!settings.cartAutoMessageSallaEnabled}
                        onChange={(e) => setSettings({ ...settings, cartAutoMessageSallaEnabled: e.target.checked })}
                        className="mx-2"
                      />
                      <span className="font-medium">سلة</span>
                    </label>
                    
                    <label className="flex items-center p-3 rounded-md border border-blue-300/30 hover:bg-blue-500/10 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={!!settings.cartAutoMessageWordpressEnabled}
                        onChange={(e) => setSettings({ ...settings, cartAutoMessageWordpressEnabled: e.target.checked })}
                        className="mx-2"
                      />
                      <span className="font-medium">ووردبريس</span>
                    </label>
                    
                    <label className="flex items-center p-3 rounded-md border border-blue-300/30 hover:bg-blue-500/10 cursor-pointer transition-colors">
                      <input
                        type="checkbox"
                        checked={!!settings.cartAutoMessageIappCloudEnabled}
                        onChange={(e) => setSettings({ ...settings, cartAutoMessageIappCloudEnabled: e.target.checked })}
                        className="mx-2"
                      />
                      <span className="font-medium">iAppCloud</span>
                    </label>
                  </div>
                </div>
                
                {(settings.cartAutoMessageSallaEnabled || settings.cartAutoMessageWordpressEnabled || settings.cartAutoMessageIappCloudEnabled) && (
                  <div className="space-y-4 pr-6">
                    {/* Cart Created Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.cartCreatedEnabled}
                            onChange={(e) => setSettings({ ...settings, cartCreatedEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة إضافة للسلة</span>
                        </label>
                      </div>
                      {settings.cartCreatedEnabled && (
                        <textarea
                          value={settings.cartCreatedTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, cartCreatedTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="مرحباً {name}! 🛒 تم إضافة '{product}' إلى سلتك. هل تريد إتمام الطلب؟"
                        />
                      )}
                    </div>

                    {/* Cart Abandoned Template */}
                    <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                      <div className="flex items-center justify-between mb-3">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={!!settings.cartAbandonedEnabled}
                            onChange={(e) => setSettings({ ...settings, cartAbandonedEnabled: e.target.checked })}
                            className="mx-2"
                          />
                          <span className="font-medium">رسالة السلة المتروكة</span>
                        </label>
                      </div>
                      {settings.cartAbandonedEnabled && (
                        <textarea
                          value={settings.cartAbandonedTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, cartAbandonedTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                          placeholder="مرحباً {name}! 👋 لاحظنا أنك تركت '{product}' في سلتك. هل تحتاج مساعدة؟"
                        />
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Subscription Messages Section */}
            <div className="border-t border-gray-700 pt-4 mt-4">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-white mb-3">رسائل الاشتراكات التلقائية</h3>
                <p className="text-sm text-gray-400 mb-4">رسائل تلقائية لتذكير المستخدمين بانتهاء اشتراكاتهم</p>
                
                <div className="space-y-4">
                  {/* Subscription Expiring Soon Template */}
                  <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!settings.subscriptionExpiringEnabled}
                          onChange={(e) => setSettings({ ...settings, subscriptionExpiringEnabled: e.target.checked })}
                          className="mx-2"
                        />
                        <span className="font-medium">رسالة الاشتراك سينتهي قريباً (قبل 3 أيام)</span>
                      </label>
                    </div>
                    {settings.subscriptionExpiringEnabled && (
                      <>
                        <textarea
                          value={settings.subscriptionExpiringTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, subscriptionExpiringTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-32 bg-[#01191040]"
                          placeholder="مرحباً {name}! ⏰ نود تذكيرك بأن اشتراكك في {plan_name} سينتهي بعد 3 أيام."
                        />
                        <div className="text-xs text-gray-400 mt-2">
                          المتغيرات المتاحة: {'{name}'} اسم المستخدم، {'{plan_name}'} اسم الباقة، {'{expiry_date}'} تاريخ الانتهاء، {'{renewal_link}'} رابط التجديد
                        </div>
                      </>
                    )}
                  </div>

                  {/* Subscription Expired Template */}
                  <div className="bg-[#01191040] p-4 rounded-lg border border-blue-300/20">
                    <div className="flex items-center justify-between mb-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={!!settings.subscriptionExpiredEnabled}
                          onChange={(e) => setSettings({ ...settings, subscriptionExpiredEnabled: e.target.checked })}
                          className="mx-2"
                        />
                        <span className="font-medium">رسالة الاشتراك منتهي</span>
                      </label>
                    </div>
                    {settings.subscriptionExpiredEnabled && (
                      <>
                        <textarea
                          value={settings.subscriptionExpiredTemplate || ''}
                          onChange={(e) => setSettings({ ...settings, subscriptionExpiredTemplate: e.target.value })}
                          className="w-full p-2 border-1 border-blue-300 rounded-md h-32 bg-[#01191040]"
                          placeholder="مرحباً {name}! 📋 نأسف لإبلاغك بأن اشتراكك في {plan_name} قد انتهى."
                        />
                        <div className="text-xs text-gray-400 mt-2">
                          المتغيرات المتاحة: {'{name}'} اسم المستخدم، {'{plan_name}'} اسم الباقة، {'{expiry_date}'} تاريخ الانتهاء، {'{renewal_link}'} رابط التجديد
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Prompts Tab */}
      {activeTab === 'ai-prompts' && (
        <div className="space-y-4">
          {/* Header and Filters */}
          {/* <Card className="gradient-border mb-6 text-white">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl mb-1">برومبتات الذكاء الاصطناعي</CardTitle>
                  <p className="text-sm text-gray-400">تصفح واختر البرومبتات المناسبة لنشاطك</p>
                </div>
                {user?.role === 'admin' && (
                  <Button
                    onClick={() => router.push('/admin/ai-prompts')}
                    className="primary-button"
                  >
                    إدارة البرومبتات
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 relative">
                  <Filter className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value as PromptCategory | "")}
                    className="w-full p-2 pr-10 rounded-md border border-blue-300 bg-[#01191040] text-white"
                  >
                    <option value="">جميع الفئات</option>
                    <option value="system">النظام</option>
                    <option value="greeting">التحية</option>
                    <option value="farewell">الوداع</option>
                    <option value="sales">المبيعات</option>
                    <option value="support">الدعم</option>
                    <option value="objection_handling">التعامل مع الاعتراضات</option>
                    <option value="appointment">المواعيد</option>
                    <option value="general">عام</option>
                    <option value="custom">مخصص</option>
                  </select>
                </div>
                <div className="text-sm text-gray-400 flex items-center">
                  إجمالي البرومبتات: <span className="text-white font-semibold mr-1">{prompts.length}</span>
                </div>
              </div>
            </CardContent>
          </Card> */}

          {/* Prompts Grid */}
          {promptsLoading ? (
            <Card className="gradient-border text-white">
              <CardContent className="p-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="text-gray-400 mt-4">جاري تحميل البرومبتات...</p>
                </div>
              </CardContent>
            </Card>
          ) : prompts.length === 0 ? (
            <Card className="gradient-border text-white">
              <CardContent className="p-12">
                <div className="text-center">
                  <p className="text-gray-400 mb-4">لا توجد برومبتات متاحة</p>
                  {user?.role === 'admin' && (
                    <Button
                      onClick={() => router.push('/admin/ai-prompts')}
                      className="primary-button"
                    >
                      إضافة برومبت جديد
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {prompts.map((prompt) => (
                <Card
                  key={prompt.id}
                  className="gradient-border text-white hover:shadow-lg hover:shadow-blue-500/20 transition-all duration-300 mb-5"
                >
                  <CardContent className="p-5">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{prompt.title}</h3>
                        {prompt.description && (
                          <p className="text-sm text-gray-400 mb-3 line-clamp-2">{prompt.description}</p>
                        )}
                      </div>
                      <Button
                        onClick={() => handleCopyPrompt(prompt.prompt, prompt.id)}
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 hover:bg-blue-500/20 text-blue-300 hover:text-blue-200 transition-colors"
                        title="نسخ البرومبت"
                      >
                        {copiedPromptId === prompt.id ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>

                    {/* Tags */}
                    <div className="flex items-center gap-2 mb-4 flex-wrap">
                      <span className="px-3 py-1 text-xs rounded-full bg-blue-500/20 text-blue-300 font-medium">
                        {CATEGORY_LABELS[prompt.category] || prompt.category}
                      </span>
                      {prompt.isGlobal && (
                        <span className="px-3 py-1 text-xs rounded-full bg-green-500/20 text-green-300 font-medium">
                          عام
                        </span>
                      )}
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        {/* <span>استخدام:</span>
                        <span className="text-white font-semibold">{prompt.usageCount}</span> */}
                      </span>
                    </div>

                    {/* Prompt Text */}
                    <div className="relative mb-3">
                      <div className="mt-6 max-h-64 overflow-y-auto scrollbar-hide">
                        <pre className="text-sm text-gray-200 whitespace-pre-wrap break-words bg-[#01191080] p-4 rounded-lg border border-blue-300/20 font-mono leading-relaxed">
                          {prompt.prompt}
                        </pre>
                      </div>
                    </div>

                    {/* Variables */}
                    {prompt.variables && prompt.variables.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-blue-300/20">
                        <p className="text-xs text-gray-500 mb-2 font-medium">المتغيرات المتاحة:</p>
                        <div className="flex flex-wrap gap-2">
                          {prompt.variables.map((variable, idx) => (
                            <code
                              key={idx}
                              className="px-2 py-1 text-xs bg-blue-500/20 text-blue-300 rounded font-mono"
                            >
                              {'{'+variable+'}'}
                            </code>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Copy Button at Bottom */}
                    <div className="mt-4 pt-3 border-t border-blue-300/20">
                      <Button
                        onClick={() => handleCopyPrompt(prompt.prompt, prompt.id)}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                        size="sm"
                      >
                        {copiedPromptId === prompt.id ? (
                          <>
                            <Check className="w-4 h-4 ml-2" />
                            تم النسخ!
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 ml-2" />
                            نسخ البرومبت
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Advanced Settings */}
      {activeTab === 'advanced' && (
        <Card className="gradient-border mb-6 text-white">
          <CardHeader>
            <CardTitle>الإعدادات المتقدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            

            {/* <div>
              <label className="block text-sm font-medium mb-2">نافذة السياق (الرسائل)</label>
              <input
                type="number"
                min="5"
                max="50"
                value={settings.contextWindow}
                onChange={(e) => setSettings({...settings, contextWindow: parseInt(e.target.value)})}
                className="w-full p-2 border-1 border-blue-300 rounded-md bg-[#01191040]"
              />
            </div> */}

            <div>
              <label className="block text-sm font-medium mb-2">رسالة احتياطية</label>
              <textarea
                value={settings.fallbackMessage || ''}
                onChange={(e) => setSettings({...settings, fallbackMessage: e.target.value})}
                className="w-full p-2 border-1 border-blue-300 rounded-md h-24 bg-[#01191040]"
                placeholder="رسالة ترسل عندما لا يستطيع الذكاء الاصطناعي الرد"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.trackConversations}
                  onChange={(e) => setSettings({...settings, trackConversations: e.target.checked})}
                  className="mx-2"
                />
                تتبع المحادثات
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.trackPerformance}
                  onChange={(e) => setSettings({...settings, trackPerformance: e.target.checked})}
                  className="mx-2"
                />
                تتبع الأداء
              </label>
             
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableContextMemory}
                  onChange={(e) => setSettings({...settings, enableContextMemory: e.target.checked})}
                  className="mx-2"
                />
                تفعيل ذاكرة السياق
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableFallback}
                  onChange={(e) => setSettings({...settings, enableFallback: e.target.checked})}
                  className="mx-2"
                />
                تفعيل الردود الاحتياطية
              </label>
           
            </div>
          </CardContent>
        </Card>
      )}


      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="primary-button "
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
        
        <Button
          onClick={handleReset}
          disabled={saving}
          variant="secondary"
          className="primary-button after:bg-red-500"
        >
          {saving ? 'جاري إعادة التعيين...' : 'إعادة تعيين إلى الافتراضي'}
        </Button>
      </div>
    </div>
  );
}




