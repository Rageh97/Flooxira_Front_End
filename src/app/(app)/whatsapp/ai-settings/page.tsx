"use client";
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';
import { 
  getBotSettings, 
  updateBotSettings, 
  resetBotSettings, 
  testAIResponse,
  getAvailableModels,
  getPersonalityTemplates,
  type BotSettings,
  type PersonalityTemplate,
  type AvailableModels
} from '@/lib/botSettingsApi';

export default function AISettingsPage() {
  const { user, loading: authLoading } = useAuth();
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testResponse, setTestResponse] = useState('');
  const [availableModels, setAvailableModels] = useState<AvailableModels | null>(null);
  const [templates, setTemplates] = useState<Record<string, PersonalityTemplate> | null>(null);
  const [activeTab, setActiveTab] = useState('general');

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

  const handleTest = async () => {
    if (!testMessage.trim()) return;
    
    setTesting(true);
    setTestResponse('');
    setError('');
    
    try {
      const res = await testAIResponse(testMessage);
      if (res.success) {
        setTestResponse(res.data.response);
      } else {
        setError(res.message || 'فشل في اختبار استجابة الذكاء الاصطناعي');
      }
    } catch (error) {
      console.error('Error testing AI:', error);
      setError('فشل في اختبار استجابة الذكاء الاصطناعي');
    } finally {
      setTesting(false);
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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-white">إعدادات بوت الذكاء الاصطناعي</h1>
      
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
      <div className="mb-6">
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'general', label: 'عام' },
            { id: 'ai', label: 'نماذج الذكاء الاصطناعي' },
            { id: 'personality', label: 'الشخصية' },
            { id: 'business', label: 'الأعمال' },
            { id: 'prompts', label: 'الرسائل المخصصة' },
            { id: 'advanced', label: 'متقدم' },
            { id: 'test', label: 'اختبار' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* General Settings */}
      {activeTab === 'general' && (
        <Card className="mb-6">
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
                  className="w-full p-2 border rounded-md"
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
                  className="w-full p-2 border rounded-md"
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
                  className="mr-2"
                />
                تضمين الإيموجي
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeGreetings}
                  onChange={(e) => setSettings({...settings, includeGreetings: e.target.checked})}
                  className="mr-2"
                />
                تضمين التحيات
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.includeFarewells}
                  onChange={(e) => setSettings({...settings, includeFarewells: e.target.checked})}
                  className="mr-2"
                />
                تضمين الوداع
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Models Settings */}
      {activeTab === 'ai' && (
        <Card className="mb-6">
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
                  className="w-full p-2 border rounded-md"
                >
                  <option value="openai">OpenAI فقط</option>
                  <option value="gemini">Gemini فقط</option>
                  <option value="both">كلاهما (احتياطي)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">درجة الحرارة</label>
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
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">نموذج OpenAI</label>
                <select
                  value={settings.openaiModel}
                  onChange={(e) => setSettings({...settings, openaiModel: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  {availableModels?.openai.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">نموذج Gemini</label>
                <select
                  value={settings.geminiModel}
                  onChange={(e) => setSettings({...settings, geminiModel: e.target.value})}
                  className="w-full p-2 border rounded-md"
                >
                  {availableModels?.gemini.map(model => (
                    <option key={model} value={model}>{model}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الحد الأقصى للرموز</label>
              <input
                type="number"
                min="100"
                max="4000"
                value={settings.maxTokens}
                onChange={(e) => setSettings({...settings, maxTokens: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-md"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Personality Settings */}
      {activeTab === 'personality' && (
        <Card className="mb-6">
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
                  className="w-full p-2 border rounded-md"
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
                  className="w-full p-2 border rounded-md"
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
                className="w-full p-2 border rounded-md"
              >
                <option value="formal">رسمي</option>
                <option value="informal">غير رسمي</option>
                <option value="mixed">مختلط</option>
              </select>
            </div>

            {/* Personality Templates */}
            {templates && (
              <div>
                <label className="block text-sm font-medium mb-2">قوالب سريعة</label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {Object.entries(templates).map(([key, template]) => (
                    <button
                      key={key}
                      onClick={() => applyTemplate(key)}
                      className="p-3 border rounded-md text-left hover:bg-gray-50"
                    >
                      <div className="font-medium">{template.name}</div>
                      <div className="text-sm text-gray-600">{template.description}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Business Settings */}
      {activeTab === 'business' && (
        <Card className="mb-6">
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
                  className="w-full p-2 border rounded-md"
                  placeholder="اسم عملك"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">نوع العمل</label>
                <input
                  type="text"
                  value={settings.businessType || ''}
                  onChange={(e) => setSettings({...settings, businessType: e.target.value})}
                  className="w-full p-2 border rounded-md"
                  placeholder="مثال: التجارة الإلكترونية، مطعم، خدمات"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">وصف العمل</label>
              <textarea
                value={settings.businessDescription || ''}
                onChange={(e) => setSettings({...settings, businessDescription: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="اوصف عملك وما تقدمه"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">الجمهور المستهدف</label>
              <textarea
                value={settings.targetAudience || ''}
                onChange={(e) => setSettings({...settings, targetAudience: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="اوصف عملاءك المستهدفين"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Prompts */}
      {activeTab === 'prompts' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>الرسائل المخصصة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">رسالة النظام</label>
              <textarea
                value={settings.systemPrompt || ''}
                onChange={(e) => setSettings({...settings, systemPrompt: e.target.value})}
                className="w-full p-2 border rounded-md h-32"
                placeholder="رسالة النظام الرئيسية التي تحدد سلوك البوت"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">رسالة التحية</label>
                <textarea
                  value={settings.greetingPrompt || ''}
                  onChange={(e) => setSettings({...settings, greetingPrompt: e.target.value})}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="كيف يجب أن يحيا البوت العملاء"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">رسالة الوداع</label>
                <textarea
                  value={settings.farewellPrompt || ''}
                  onChange={(e) => setSettings({...settings, farewellPrompt: e.target.value})}
                  className="w-full p-2 border rounded-md h-24"
                  placeholder="كيف يجب أن يودع البوت العملاء"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رسالة المبيعات</label>
              <textarea
                value={settings.salesPrompt || ''}
                onChange={(e) => setSettings({...settings, salesPrompt: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="كيف يجب أن يتعامل البوت مع محادثات المبيعات"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رسالة التعامل مع الاعتراضات</label>
              <textarea
                value={settings.objectionHandlingPrompt || ''}
                onChange={(e) => setSettings({...settings, objectionHandlingPrompt: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="كيف يجب أن يتعامل البوت مع اعتراضات العملاء"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Advanced Settings */}
      {activeTab === 'advanced' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>الإعدادات المتقدمة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableContextMemory}
                  onChange={(e) => setSettings({...settings, enableContextMemory: e.target.checked})}
                  className="mr-2"
                />
                تفعيل ذاكرة السياق
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.enableFallback}
                  onChange={(e) => setSettings({...settings, enableFallback: e.target.checked})}
                  className="mr-2"
                />
                تفعيل الردود الاحتياطية
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">نافذة السياق (الرسائل)</label>
              <input
                type="number"
                min="5"
                max="50"
                value={settings.contextWindow}
                onChange={(e) => setSettings({...settings, contextWindow: parseInt(e.target.value)})}
                className="w-full p-2 border rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">رسالة احتياطية</label>
              <textarea
                value={settings.fallbackMessage || ''}
                onChange={(e) => setSettings({...settings, fallbackMessage: e.target.value})}
                className="w-full p-2 border rounded-md h-24"
                placeholder="رسالة ترسل عندما لا يستطيع الذكاء الاصطناعي الرد"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.trackConversations}
                  onChange={(e) => setSettings({...settings, trackConversations: e.target.checked})}
                  className="mr-2"
                />
                تتبع المحادثات
              </label>
              
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={settings.trackPerformance}
                  onChange={(e) => setSettings({...settings, trackPerformance: e.target.checked})}
                  className="mr-2"
                />
                تتبع الأداء
              </label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test AI */}
      {activeTab === 'test' && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اختبار استجابة الذكاء الاصطناعي</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">رسالة الاختبار</label>
              <input
                type="text"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                className="w-full p-2 border rounded-md"
                placeholder="اكتب رسالة اختبار لترى كيف يرد البوت"
              />
            </div>
            
            <Button
              onClick={handleTest}
              disabled={!testMessage.trim() || testing}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {testing ? 'جاري الاختبار...' : 'اختبار الاستجابة'}
            </Button>

            {testResponse && (
              <div className="mt-4 p-4 bg-gray-50 border rounded-md">
                <h4 className="font-medium mb-2">رد الذكاء الاصطناعي:</h4>
                <p className="text-gray-700">{testResponse}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button
          onClick={handleSave}
          disabled={saving}
          className="bg-green-500 hover:bg-green-600"
        >
          {saving ? 'جاري الحفظ...' : 'حفظ الإعدادات'}
        </Button>
        
        <Button
          onClick={handleReset}
          disabled={saving}
          variant="outline"
          className="border-red-300 text-red-600 hover:bg-red-50"
        >
          {saving ? 'جاري إعادة التعيين...' : 'إعادة تعيين إلى الافتراضي'}
        </Button>
      </div>
    </div>
  );
}




