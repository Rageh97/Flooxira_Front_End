'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  testTemplateMatching,
  type TelegramTemplate 
} from '@/lib/telegramTemplateApi';

export default function TelegramTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<TelegramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TelegramTemplate | null>(null);
  const [filters, setFilters] = useState({
    isActive: undefined as boolean | undefined,
    templateType: '',
    search: ''
  });
  const [testMessage, setTestMessage] = useState('');
  const [testResult, setTestResult] = useState<any>(null);

  useEffect(() => {
    // Wait for auth to load
    if (authLoading) return;
    
    // Check if user is authenticated
    if (!user) {
      alert('يجب تسجيل الدخول أولاً');
      window.location.href = '/sign-in';
      return;
    }
    
    loadTemplates();
  }, [user, authLoading, filters]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const response = await getTemplates(filters);
      if (response.success) {
        setTemplates(response.data || []);
      }
    } catch (error: unknown) {
      const err = error as { message?: string };
      console.error('Failed to load templates:', err?.message || String(error));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<TelegramTemplate>) => {
    try {
      const response = await createTemplate(templateData);
      if (response.success) {
        await loadTemplates();
        setShowCreateModal(false);
        alert('تم إنشاء القالب بنجاح!');
      } else {
        alert('فشل في إنشاء القالب: ' + (response.message || 'خطأ غير معروف'));
      }
    } catch (error: any) {
      console.error('Failed to create template:', error?.message || error);
      alert('فشل في إنشاء القالب: ' + (error?.message || 'خطأ غير معروف'));
    }
  };

  const handleUpdateTemplate = async (id: number, templateData: Partial<TelegramTemplate>) => {
    try {
      const response = await updateTemplate(id, templateData);
      if (response.success) {
        await loadTemplates();
        setEditingTemplate(null);
      }
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (id: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا القالب؟')) return;
    
    try {
      const response = await deleteTemplate(id);
      if (response.success) {
        await loadTemplates();
      }
    } catch (error) {
      console.error('Failed to delete template:', error);
    }
  };

  const handleTestTemplate = async () => {
    if (!testMessage.trim()) {
      alert('يرجى إدخال رسالة للاختبار');
      return;
    }

    try {
      const response = await testTemplateMatching(testMessage);
      setTestResult(response.data);
    } catch (error: any) {
      console.error('Failed to test template:', error?.message || error);
      alert('فشل في اختبار القالب: ' + (error?.message || 'خطأ غير معروف'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-emerald-500 mx-auto"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-2xl">📝</span>
            </div>
          </div>
          <p className="mt-6 text-emerald-300 text-lg font-semibold">جاري تحميل القوالب...</p>
          <div className="mt-2 flex justify-center gap-1">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Page Header */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl mb-4 shadow-lg">
            <span className="text-3xl">📝</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-400 to-green-500 bg-clip-text text-transparent mb-2">
            Telegram Templates
          </h1>
          <p className="text-gray-400 text-lg">إدارة القوالب التفاعلية للتيليجرام بسهولة واحترافية</p>
        </div>

        {/* Action Header */}
        <div className="card-gradient-green-dark border-emerald-500/20 rounded-2xl shadow-xl p-6 mb-6 border">
          <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                إدارة القوالب
              </h2>
              <p className="text-emerald-200/80">إنشاء وتعديل القوالب التفاعلية بكل سهولة</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3.5 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 font-bold flex items-center gap-2 shadow-lg hover:shadow-emerald-500/50 hover:scale-105"
            >
              <span className="text-xl">➕</span>
              إضافة قالب جديد
            </button>
          </div>
        </div>

        {/* Auto Reply Controls */}
        <AutoReplyPanel templates={templates} />

        {/* Test Templates */}
        <div className="card-gradient-green-emerald border-emerald-500/20 rounded-2xl shadow-xl p-6 mb-6 border">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-2xl">🧪</span>
            اختبار القوالب
          </h3>
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-emerald-200 mb-2">رسالة الاختبار</label>
              <input
                type="text"
                placeholder="اكتب رسالة لاختبار القوالب..."
                className="w-full px-4 py-3 bg-gray-800/50 border border-emerald-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
            <button
              onClick={handleTestTemplate}
              className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-8 py-3 rounded-xl hover:from-green-600 hover:to-emerald-700 transition-all duration-300 font-bold shadow-lg hover:shadow-green-500/50 hover:scale-105 whitespace-nowrap"
            >
              ✨ اختبار الآن
            </button>
          </div>
          
          {testResult && (
            <div className="mt-4 p-4 bg-gray-800/50 rounded-xl border border-emerald-500/20">
              {testResult.found ? (
                <div>
                  <div className="text-emerald-400 font-bold mb-3 flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    تم العثور على قالب مطابق!
                  </div>
                  <div className="text-sm text-gray-300 space-y-1 bg-gray-900/50 p-3 rounded-lg">
                    <div><span className="text-emerald-400 font-semibold">اسم القالب:</span> {testResult.template.name}</div>
                    <div><span className="text-emerald-400 font-semibold">الكلمات المفتاحية:</span> {testResult.template.triggerKeywords?.join(', ')}</div>
                    <div><span className="text-emerald-400 font-semibold">النص:</span> {testResult.template.bodyText}</div>
                  </div>
                </div>
              ) : (
                <div className="text-orange-400 font-bold flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  لم يتم العثور على قالب مطابق
                </div>
              )}
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="card-gradient-green-dark border-emerald-500/20 rounded-2xl shadow-xl p-6 mb-6 border">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <span className="text-xl">🔍</span>
            تصفية وبحث
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-emerald-200 mb-2">البحث</label>
              <input
                type="text"
                placeholder="ابحث في القوالب..."
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-emerald-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white placeholder-gray-500"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-200 mb-2">الحالة</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-emerald-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                value={filters.isActive === undefined ? '' : filters.isActive.toString()}
                onChange={(e) => setFilters({ 
                  ...filters, 
                  isActive: e.target.value === '' ? undefined : e.target.value === 'true' 
                })}
              >
                <option value="">جميع الحالات</option>
                <option value="true">نشط</option>
                <option value="false">غير نشط</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-emerald-200 mb-2">نوع القالب</label>
              <select
                className="w-full px-4 py-2.5 bg-gray-800/50 border border-emerald-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white"
                value={filters.templateType}
                onChange={(e) => setFilters({ ...filters, templateType: e.target.value })}
              >
                <option value="">جميع الأنواع</option>
                <option value="text">📝 نص</option>
                <option value="media">🎬 وسائط</option>
                <option value="poll">📊 استطلاع</option>
                <option value="quiz">🧠 اختبار</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ isActive: undefined, templateType: '', search: '' })}
                className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white px-4 py-2.5 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-300 font-semibold shadow-lg hover:scale-105"
              >
                🔄 مسح الفلاتر
              </button>
            </div>
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={setEditingTemplate}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>

        {templates.length === 0 && !loading && (
          <div className="text-center py-16 card-gradient-green-dark border-emerald-500/20 rounded-2xl border">
            <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-full mb-6">
              <span className="text-6xl">📱</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">لا توجد قوالب بعد</h3>
            <p className="text-emerald-200 mb-6 text-lg">ابدأ بإنشاء قالب تفاعلي جديد للتيليجرام</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3.5 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 font-bold shadow-lg hover:shadow-emerald-500/50 hover:scale-105 inline-flex items-center gap-2"
            >
              <span className="text-xl">✨</span>
              إنشاء أول قالب
            </button>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingTemplate) && (
        <TemplateModal
          template={editingTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setEditingTemplate(null);
          }}
          onSave={editingTemplate ? 
            (data) => handleUpdateTemplate(editingTemplate.id, data) : 
            handleCreateTemplate
          }
        />
      )}
    </div>
  );
}

// Template Card Component
import Link from 'next/link';

function TemplateCard({ 
  template, 
  onEdit, 
  onDelete 
}: { 
  template: TelegramTemplate; 
  onEdit: (template: TelegramTemplate) => void;
  onDelete: (id: number) => void;
}) {
  const getTemplateTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return '📝';
      case 'media': return '🎬';
      case 'poll': return '📊';
      case 'quiz': return '🧠';
      default: return '📱';
    }
  };

  const getTemplateTypeLabel = (type: string) => {
    switch (type) {
      case 'text': return 'نص';
      case 'media': return 'وسائط';
      case 'poll': return 'استطلاع';
      case 'quiz': return 'اختبار';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="card-gradient-green-dark border-emerald-500/30 rounded-2xl overflow-hidden shadow-xl hover:shadow-emerald-500/20 transition-all duration-300 hover:scale-[1.02] border">
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500/20 to-green-600/20 rounded-xl flex items-center justify-center">
              <span className="text-2xl">{getTemplateTypeIcon(template.templateType)}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">{template.name}</h3>
              <p className="text-sm text-emerald-300">{getTemplateTypeLabel(template.templateType)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-3 py-1 text-xs font-bold rounded-full ${
              template.isActive 
                ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {template.isActive ? '✓ نشط' : '✕ غير نشط'}
            </span>
          </div>
        </div>

        {template.description && (
          <p className="text-gray-300 text-sm mb-4 bg-gray-800/50 p-3 rounded-lg border border-emerald-500/10">{template.description}</p>
        )}

        <div className="text-sm text-gray-400 mb-4 bg-gray-900/50 p-3 rounded-lg">
          <p className="truncate">{template.bodyText}</p>
        </div>

        {template.mediaUrl && (
          <div className="mb-4 bg-gray-800/50 p-3 rounded-lg border border-emerald-500/10">
            <div className="text-xs text-emerald-400 mb-1 font-semibold">📎 وسائط القالب</div>
            <a href={template.mediaUrl} target="_blank" rel="noreferrer" className="text-emerald-300 hover:text-emerald-200 underline truncate inline-block max-w-full text-sm">
              {template.mediaUrl}
            </a>
          </div>
        )}

        <div className="flex items-center justify-between text-sm mb-4">
          <div className="flex gap-4">
            <span className="text-emerald-300 font-semibold bg-emerald-500/10 px-3 py-1 rounded-lg">
              🔘 {template.buttons?.length || 0} أزرار
            </span>
            <span className="text-green-300 font-semibold bg-green-500/10 px-3 py-1 rounded-lg">
              📊 {template.variables?.length || 0} متغيرات
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/telegram-templates/${template.id}`}
            className="flex-1 bg-gradient-to-r from-purple-600 to-purple-700 text-white px-4 py-2.5 rounded-xl text-sm hover:from-purple-700 hover:to-purple-800 transition-all duration-300 font-bold text-center shadow-lg hover:scale-105"
          >
            🔘 إدارة الأزرار
          </Link>
          <button
            onClick={() => onEdit(template)}
            className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-2.5 rounded-xl text-sm hover:from-blue-700 hover:to-blue-800 transition-all duration-300 font-bold shadow-lg hover:scale-105"
          >
            ✏️ تعديل
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="flex-1 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 rounded-xl text-sm hover:from-red-700 hover:to-red-800 transition-all duration-300 font-bold shadow-lg hover:scale-105"
          >
            🗑️ حذف
          </button>
        </div>
      </div>
    </div>
  );
}

// Auto Reply Panel Component
function AutoReplyPanel({ templates }: { templates: TelegramTemplate[] }) {
  const [loading, setLoading] = useState(false);
  const [autoReplyEnabled, setAutoReplyEnabled] = useState(false);
  const [autoReplyTemplateId, setAutoReplyTemplateId] = useState<string>('');
  // Removed button color preference from UI

  useEffect(() => {
    (async () => {
      try {
        const { API_URL } = await import('@/lib/api');
        const res = await fetch(`${API_URL}/api/bot-settings`, { headers: { Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` } });
        const data = await res.json().catch(()=>({}));
        const s = data?.data || data;
        if (s) {
          setAutoReplyEnabled(!!s.autoReplyEnabled);
          setAutoReplyTemplateId(s.autoReplyTemplateId ? String(s.autoReplyTemplateId) : '');
        }
      } catch {}
    })();
  }, []);

  const save = async () => {
    try {
      setLoading(true);
      const { API_URL } = await import('@/lib/api');
      const resp = await fetch(`${API_URL}/api/bot-settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('auth_token') || ''}` },
        body: JSON.stringify({
          autoReplyEnabled,
          autoReplyTemplateId: autoReplyTemplateId ? Number(autoReplyTemplateId) : null
        })
      });
      if (!resp.ok) {
        const err = await resp.json().catch(()=>({ message: 'Failed to save' }));
        throw new Error(err?.message || 'Failed to save');
      }
      alert('تم حفظ إعدادات الرد التلقائي بنجاح');
    } catch (e:any) {
      alert(e?.message || 'فشل حفظ الإعدادات');
    } finally { setLoading(false); }
  };

  return (
    <div className="card-gradient-green-emerald border-emerald-500/20 rounded-2xl shadow-xl p-6 mb-6 border">
      <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
        <span className="text-2xl">⚙️</span>
        إعدادات الرد التلقائي
      </h3>
      <div className="space-y-6">
        <div className="flex items-center justify-between bg-gray-800/50 p-4 rounded-xl border border-emerald-500/20">
          <div>
            <div className="text-sm font-bold text-white mb-1">تفعيل الرد التلقائي بقالب محدد</div>
            <div className="text-xs text-emerald-200">سيتم إرسال هذا القالب تلقائياً عند وصول أي رسالة</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={autoReplyEnabled} onChange={(e)=>setAutoReplyEnabled(e.target.checked)} className="sr-only peer" />
            <div className="w-14 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-emerald-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-emerald-500 peer-checked:to-green-600"></div>
          </label>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-emerald-200 mb-2">القالب الافتراضي</label>
            <select className="w-full px-4 py-3 bg-gray-800/50 border border-emerald-500/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-white" value={autoReplyTemplateId} onChange={(e)=>setAutoReplyTemplateId(e.target.value)}>
              <option value="">بدون</option>
              {templates.filter(t=>t.isActive).map(t => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end">
          <button onClick={save} disabled={loading} className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-xl hover:from-emerald-600 hover:to-green-700 transition-all duration-300 font-bold shadow-lg hover:shadow-emerald-500/50 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? '⏳ جارِ الحفظ...' : '💾 حفظ الإعدادات'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Template Modal Component
function TemplateModal({ 
  template, 
  onClose, 
  onSave 
}: { 
  template?: TelegramTemplate | null; 
  onClose: () => void;
  onSave: (data: Partial<TelegramTemplate>) => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    headerText: template?.headerText || '',
    bodyText: template?.bodyText || '',
    footerText: template?.footerText || '',
    triggerKeywords: template?.triggerKeywords?.join(', ') || '',
    displayOrder: template?.displayOrder || 0,
    isActive: template?.isActive ?? true,
    templateType: template?.templateType || 'text',
    mediaType: template?.mediaType || '',
    mediaUrl: template?.mediaUrl || '',
    pollOptions: template?.pollOptions?.join(', ') || '',
    pollType: template?.pollType || 'regular',
    correctAnswer: template?.correctAnswer || 0,
    explanation: template?.explanation || ''
  });

  const [variables, setVariables] = useState(template?.variables || []);
  const [showVariableForm, setShowVariableForm] = useState(false);
  const [editingVariable, setEditingVariable] = useState<any>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data: Partial<TelegramTemplate> = {
      ...formData,
      triggerKeywords: formData.triggerKeywords.split(',').map(k => k.trim()).filter(k => k),
      mediaType: (formData.mediaType || undefined) as 'photo' | 'video' | 'document' | 'audio' | 'voice' | undefined,
      pollOptions: formData.pollOptions ? formData.pollOptions.split(',').map((o: string) => o.trim()).filter((o: string) => o) : undefined,
      variables: variables
    };
    onSave(data);
  };

  const addVariable = (variableData: any) => {
    if (editingVariable !== null) {
      setVariables(variables.map((v, i) => i === editingVariable ? { ...v, ...variableData } : v));
      setEditingVariable(null);
    } else {
      setVariables([...variables, { ...variableData, id: Date.now() }]);
    }
    setShowVariableForm(false);
  };

  const editVariable = (index: number) => {
    setEditingVariable(index);
    setShowVariableForm(true);
  };

  const deleteVariable = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {template ? 'تعديل القالب' : 'إنشاء قالب جديد'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">اسم القالب *</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">نوع القالب *</label>
                <select
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.templateType}
                  onChange={(e) => setFormData({ ...formData, templateType: e.target.value as any })}
                >
                  <option value="text">نص</option>
                  <option value="media">وسائط</option>
                  <option value="poll">استطلاع</option>
                  <option value="quiz">اختبار</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">الوصف</label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={2}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Template Content */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">النص الرئيسي *</label>
                <textarea
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={4}
                  value={formData.bodyText}
                  onChange={(e) => setFormData({ ...formData, bodyText: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النص العلوي</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    value={formData.headerText}
                    onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">النص السفلي</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                    value={formData.footerText}
                    onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Media Settings */}
            {formData.templateType === 'media' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">نوع الوسائط</label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.mediaType}
                    onChange={(e) => setFormData({ ...formData, mediaType: e.target.value as any })}
                  >
                    <option value="">اختر نوع الوسائط</option>
                    <option value="photo">صورة</option>
                    <option value="video">فيديو</option>
                    <option value="document">مستند</option>
                    <option value="audio">صوت</option>
                    <option value="voice">رسالة صوتية</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">رابط الوسائط</label>
                  <input
                    type="url"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={formData.mediaUrl}
                    onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
                  />
                  <div className="text-xs text-gray-500 mt-2">أو قم برفع ملف</div>
                  <input
                    type="file"
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      try {
                        const { API_URL } = await import('@/lib/api');
                        const token = localStorage.getItem('auth_token') || '';
                        const fd = new FormData();
                        fd.append('file', file);
                        const resp = await fetch(`${API_URL}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                        const data = await resp.json();
                        if (data?.url) setFormData({ ...formData, mediaUrl: data.url });
                      } catch {}
                    }}
                    className="mt-2"
                  />
                </div>
              </div>
            )}

            {/* Poll Settings */}
            {(formData.templateType === 'poll' || formData.templateType === 'quiz') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">خيارات الاستطلاع (مفصولة بفاصلة)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    value={formData.pollOptions}
                    onChange={(e) => setFormData({ ...formData, pollOptions: e.target.value })}
                    placeholder="الخيار الأول, الخيار الثاني, الخيار الثالث"
                  />
                </div>
                
                {formData.templateType === 'quiz' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">الإجابة الصحيحة (رقم الخيار)</label>
                      <input
                        type="number"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.correctAnswer}
                  onChange={(e) => setFormData({ ...formData, correctAnswer: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">التفسير</label>
                      <textarea
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        value={formData.explanation}
                        onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Variables */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">المتغيرات</h3>
                <button
                  type="button"
                  onClick={() => setShowVariableForm(true)}
                  className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
                >
                  إضافة متغير
                </button>
              </div>

              {variables.length > 0 && (
                <div className="space-y-2">
                  {variables.map((variable, index) => (
                    <div key={variable.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                      <div>
                        <span className="font-medium">{variable.variableName}</span>
                        <span className="text-sm text-gray-500 ml-2">({variable.variableType})</span>
                        {variable.isRequired && <span className="text-red-500 text-sm ml-2">*</span>}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => editVariable(index)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          تعديل
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteVariable(index)}
                          className="text-red-600 hover:text-red-800"
                        >
                          حذف
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">كلمات التشغيل (مفصولة بفاصلة)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.triggerKeywords}
                  onChange={(e) => setFormData({ ...formData, triggerKeywords: e.target.value })}
                  placeholder="مرحبا, أهلا, مرحب"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">ترتيب العرض</label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="flex items-center">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="mr-2"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  />
                  <span className="text-sm font-medium text-gray-700">نشط</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {template ? 'تحديث' : 'إنشاء'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Variable Form Modal */}
      {showVariableForm && (
        <VariableFormModal
          variable={editingVariable !== null ? variables[editingVariable] : null}
          onClose={() => {
            setShowVariableForm(false);
            setEditingVariable(null);
          }}
          onSave={addVariable}
        />
      )}
    </div>
  );
}

// Variable Form Modal Component
function VariableFormModal({ 
  variable, 
  onClose, 
  onSave 
}: { 
  variable?: any; 
  onClose: () => void;
  onSave: (data: any) => void;
}) {
  const [formData, setFormData] = useState({
    variableName: variable?.variableName || '',
    variableType: variable?.variableType || 'text',
    defaultValue: variable?.defaultValue || '',
    isRequired: variable?.isRequired || false,
    options: variable?.options?.join(', ') || '',
    placeholder: variable?.placeholder || '',
    displayOrder: variable?.displayOrder || 0
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      options: formData.options ? formData.options.split(',').map((o: string) => o.trim()).filter((o: string) => o) : undefined
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-60">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {variable ? 'تعديل المتغير' : 'إضافة متغير جديد'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">اسم المتغير *</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.variableName}
                onChange={(e) => setFormData({ ...formData, variableName: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع المتغير *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.variableType}
                onChange={(e) => setFormData({ ...formData, variableType: e.target.value as any })}
              >
                <option value="text">نص</option>
                <option value="number">رقم</option>
                <option value="date">تاريخ</option>
                <option value="boolean">نعم/لا</option>
                <option value="select">قائمة</option>
              </select>
            </div>

            {formData.variableType === 'select' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الخيارات (مفصولة بفاصلة)</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="الخيار الأول, الخيار الثاني, الخيار الثالث"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">القيمة الافتراضية</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.defaultValue}
                onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">النص التوضيحي</label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.placeholder}
                onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
              />
            </div>

            <div className="flex items-center">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-2"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                />
                <span className="text-sm font-medium text-gray-700">مطلوب</span>
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                {variable ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
