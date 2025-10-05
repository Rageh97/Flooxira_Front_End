'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth';
import { 
  getTemplates, 
  createTemplate, 
  updateTemplate, 
  deleteTemplate,
  type WhatsappTemplate 
} from '@/lib/whatsappTemplateApi';

export default function WhatsappTemplatesPage() {
  const { user, loading: authLoading } = useAuth();
  const [templates, setTemplates] = useState<WhatsappTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<WhatsappTemplate | null>(null);

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
  }, [user, authLoading]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      console.log('Loading templates...');

      const response = await getTemplates();
      console.log('Templates response:', response);
      if (response.success) {
        setTemplates(response.data);
      } else {
        console.error('Failed to load templates:', response.message);
        if (response.message && response.message.includes('Unauthorized')) {
          console.log('Session expired, redirecting to login...');
          localStorage.removeItem('auth_token');
          window.location.href = '/sign-in';
        } else {
          console.error('Failed to load templates:', response.message || 'Unknown error');
        }
      }
    } catch (error) {
      console.error('Failed to load templates:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401') || errorMessage.includes('No authentication token')) {
        console.log('Session expired, redirecting to login...');
        localStorage.removeItem('auth_token');
        window.location.href = '/sign-in';
      } else {
        console.error('Failed to load templates:', errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async (templateData: Partial<WhatsappTemplate>) => {
    try {
      console.log('Creating template:', templateData);
      
      const response = await createTemplate(templateData);
      console.log('Template creation response:', response);
      
      if (response.success) {
        await loadTemplates();
        setShowCreateModal(false);
        console.log('Template created successfully!');
      } else {
        console.error('Failed to create template:', response.message || 'Unknown error');
      }
    } catch (error) {
      console.error('Failed to create template:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      if (errorMessage.includes('Unauthorized') || errorMessage.includes('401') || errorMessage.includes('No authentication token')) {
        console.log('Session expired, redirecting to login...');
        localStorage.removeItem('auth_token');
        window.location.href = '/sign-in';
      } else {
        console.error('Failed to create template:', errorMessage);
      }
    }
  };

  const handleUpdateTemplate = async (id: number, templateData: Partial<WhatsappTemplate>) => {
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
    if (confirm('هل أنت متأكد من حذف هذا القالب؟')) {
      try {
        const response = await deleteTemplate(id);
        if (response.success) {
          await loadTemplates();
          console.log('Template deleted successfully!');
        } else {
          console.error('Failed to delete template:', response.message || 'Unknown error');
        }
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">قوالب الواتساب التفاعلية</h1>
              <p className="text-gray-600 mt-2">إدارة القوالب والأزرار التفاعلية للواتساب</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              إضافة قالب جديد
            </button>
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

        {templates.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📱</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد قوالب</h3>
            <p className="text-gray-600 mb-4">ابدأ بإنشاء قالب تفاعلي جديد للواتساب</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
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
function TemplateCard({ 
  template, 
  onEdit, 
  onDelete 
}: { 
  template: WhatsappTemplate; 
  onEdit: (template: WhatsappTemplate) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{template.name}</h3>
          {template.description && (
            <p className="text-gray-600 text-sm mt-1">{template.description}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className={`px-2 py-1 rounded-full text-xs ${
            template.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {template.isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>

      {template.headerText && (
        <div className="mb-3">
          <p className="text-sm text-gray-500">النص العلوي:</p>
          <p className="text-gray-700 text-sm">{template.headerText}</p>
        </div>
      )}

      {template.footerText && (
        <div className="mb-3">
          <p className="text-sm text-gray-500">النص السفلي:</p>
          <p className="text-gray-700 text-sm">{template.footerText}</p>
        </div>
      )}

      {template.buttons && template.buttons.length > 0 && (
        <div className="mb-4">
          <p className="text-sm text-gray-500 mb-2">الأزرار ({template.buttons.length}):</p>
          <div className="flex flex-wrap gap-2">
            {template.buttons.slice(0, 3).map((button) => (
              <span
                key={button.id}
                className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded"
              >
                {button.buttonText}
              </span>
            ))}
            {template.buttons.length > 3 && (
              <span className="text-gray-500 text-xs">+{template.buttons.length - 3} أكثر</span>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => onEdit(template)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            تعديل
          </button>
          <button
            onClick={() => onDelete(template.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            حذف
          </button>
        </div>
        <button
          onClick={() => window.open(`/whatsapp-templates/${template.id}`, '_blank')}
          className="text-gray-600 hover:text-gray-800 text-sm"
        >
          إدارة الأزرار →
        </button>
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
  template?: WhatsappTemplate | null; 
  onClose: () => void;
  onSave: (data: Partial<WhatsappTemplate>) => void;
}) {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    description: template?.description || '',
    headerText: template?.headerText || '',
    footerText: template?.footerText || '',
    triggerKeywords: template?.triggerKeywords?.join(', ') || '',
    displayOrder: template?.displayOrder || 0,
    isActive: template?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      triggerKeywords: formData.triggerKeywords.split(',').map(k => k.trim()).filter(k => k)
    };
    onSave(data);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {template ? 'تعديل القالب' : 'إنشاء قالب جديد'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                اسم القالب *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="مثال: قائمة الخدمات الرئيسية"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                وصف القالب
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={2}
                placeholder="وصف مختصر للقالب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                النص العلوي
              </label>
              <textarea
                value={formData.headerText}
                onChange={(e) => setFormData({ ...formData, headerText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="النص الذي سيظهر في أعلى القالب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                النص السفلي
              </label>
              <textarea
                value={formData.footerText}
                onChange={(e) => setFormData({ ...formData, footerText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                placeholder="النص الذي سيظهر في أسفل القالب"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                كلمات التشغيل (مفصولة بفواصل)
              </label>
              <input
                type="text"
                value={formData.triggerKeywords}
                onChange={(e) => setFormData({ ...formData, triggerKeywords: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="قائمة، خدمات، منتجات"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ترتيب العرض
                </label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="mr-2 text-sm text-gray-700">
                  نشط
                </label>
              </div>
            </div>

            <div className="flex justify-end space-x-3 space-x-reverse pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                إلغاء
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {template ? 'حفظ التغييرات' : 'إنشاء القالب'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}