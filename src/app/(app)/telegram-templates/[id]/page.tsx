'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  getTemplate, 
  createButton, 
  updateButton, 
  deleteButton,
  type TelegramTemplate,
  type TelegramTemplateButton 
} from '@/lib/telegramTemplateApi';

export default function TemplateButtonsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [template, setTemplate] = useState<TelegramTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingButton, setEditingButton] = useState<TelegramTemplateButton | null>(null);
  const [parentButton, setParentButton] = useState<TelegramTemplateButton | null>(null);

  useEffect(() => {
    if (id) {
      loadTemplate();
    }
  }, [id]);

  const loadTemplate = async () => {
    try {
      setLoading(true);
      const response = await getTemplate(Number(id));
      if (response.success) {
        setTemplate(response.data);
      }
    } catch (error) {
      console.error('Failed to load template:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateButton = async (buttonData: Partial<TelegramTemplateButton>) => {
    try {
      const response = await createButton({
        ...buttonData,
        templateId: Number(id),
        parentButtonId: parentButton?.id
      });
      if (response.success) {
        await loadTemplate();
        setShowCreateModal(false);
        setParentButton(null);
      }
    } catch (error) {
      console.error('Failed to create button:', error);
    }
  };

  const handleUpdateButton = async (buttonId: number, buttonData: Partial<TelegramTemplateButton>) => {
    try {
      const response = await updateButton(buttonId, buttonData);
      if (response.success) {
        await loadTemplate();
        setEditingButton(null);
      }
    } catch (error) {
      console.error('Failed to update button:', error);
    }
  };

  const handleDeleteButton = async (buttonId: number) => {
    if (!confirm('هل أنت متأكد من حذف هذا الزر؟')) return;
    
    try {
      const response = await deleteButton(buttonId);
      if (response.success) {
        await loadTemplate();
      }
    } catch (error) {
      console.error('Failed to delete button:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">جاري تحميل القالب...</p>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">القالب غير موجود</h2>
          <button
            onClick={() => router.push('/telegram-templates')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة للقوالب
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{template.name}</h1>
              <p className="text-gray-600 mt-2">إدارة أزرار القالب التفاعلية</p>
            </div>
            <div className="flex space-x-4">
              <button
                onClick={() => router.push('/telegram-templates')}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                العودة للقوالب
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة زر جديد
              </button>
            </div>
          </div>
        </div>

        {/* Template Preview */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">معاينة القالب</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {template.headerText && (
              <div className="text-sm text-gray-600 mb-2">{template.headerText}</div>
            )}
            <div className="text-gray-900 mb-2">{template.bodyText}</div>
            {template.footerText && (
              <div className="text-sm text-gray-600">{template.footerText}</div>
            )}
          </div>
        </div>

        {/* Buttons Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">أزرار القالب</h3>
          
          {template.buttons && template.buttons.length > 0 ? (
            <div className="space-y-4">
              {template.buttons.map((button) => (
                <ButtonCard
                  key={button.id}
                  button={button}
                  onEdit={setEditingButton}
                  onDelete={handleDeleteButton}
                  onAddChild={(parent) => {
                    setParentButton(parent);
                    setShowCreateModal(true);
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🔘</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أزرار</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة أزرار تفاعلية للقالب</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                إضافة أول زر
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Button Modal */}
      {(showCreateModal || editingButton) && (
        <ButtonModal
          button={editingButton}
          parentButton={parentButton}
          onClose={() => {
            setShowCreateModal(false);
            setEditingButton(null);
            setParentButton(null);
          }}
          onSave={editingButton ? 
            (data) => handleUpdateButton(editingButton.id, data) : 
            handleCreateButton
          }
        />
      )}
    </div>
  );
}

// Button Card Component
function ButtonCard({ 
  button, 
  onEdit, 
  onDelete, 
  onAddChild 
}: { 
  button: TelegramTemplateButton; 
  onEdit: (button: TelegramTemplateButton) => void;
  onDelete: (id: number) => void;
  onAddChild: (button: TelegramTemplateButton) => void;
}) {
  const getButtonTypeIcon = (type: string) => {
    switch (type) {
      case 'url': return '🔗';
      case 'callback': return '⚡';
      case 'switch_inline': return '🔄';
      case 'switch_inline_current': return '🔄';
      case 'web_app': return '🌐';
      default: return '🔘';
    }
  };

  const getButtonTypeLabel = (type: string) => {
    switch (type) {
      case 'url': return 'رابط';
      case 'callback': return 'استجابة';
      case 'switch_inline': return 'تبديل داخلي';
      case 'switch_inline_current': return 'تبديل داخلي حالي';
      case 'web_app': return 'تطبيق ويب';
      default: return 'غير محدد';
    }
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">{getButtonTypeIcon(button.buttonType)}</span>
          <div>
            <h4 className="text-lg font-medium text-gray-900">{button.text}</h4>
            <p className="text-sm text-gray-500">{getButtonTypeLabel(button.buttonType)}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`px-2 py-1 text-xs rounded-full ${
            button.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {button.isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>

      {/* Button Details */}
      <div className="text-sm text-gray-600 mb-4">
        {button.buttonType === 'url' && button.url && (
          <p><strong>الرابط:</strong> {button.url}</p>
        )}
        {button.buttonType === 'callback' && button.callbackData && (
          <p><strong>بيانات الاستجابة:</strong> {button.callbackData}</p>
        )}
        {button.buttonType === 'web_app' && button.webAppUrl && (
          <p><strong>رابط التطبيق:</strong> {button.webAppUrl}</p>
        )}
        {button.buttonType === 'switch_inline' && button.switchInlineQuery && (
          <p><strong>استعلام التبديل:</strong> {button.switchInlineQuery}</p>
        )}
      </div>

      {/* Child Buttons */}
      {button.ChildButtons && button.ChildButtons.length > 0 && (
        <div className="ml-6 mb-4">
          <h5 className="text-sm font-medium text-gray-700 mb-2">الأزرار الفرعية:</h5>
          <div className="space-y-2">
            {button.ChildButtons.map((childButton) => (
              <div key={childButton.id} className="bg-gray-50 rounded p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="text-lg">{getButtonTypeIcon(childButton.buttonType)}</span>
                    <span className="font-medium">{childButton.text}</span>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => onEdit(childButton)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      تعديل
                    </button>
                    <button
                      onClick={() => onDelete(childButton.id)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      حذف
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-2">
          <button
            onClick={() => onEdit(button)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm hover:bg-blue-700 transition-colors"
          >
            تعديل
          </button>
          <button
            onClick={() => onDelete(button.id)}
            className="bg-red-600 text-white px-3 py-2 rounded-md text-sm hover:bg-red-700 transition-colors"
          >
            حذف
          </button>
        </div>
        <button
          onClick={() => onAddChild(button)}
          className="bg-green-600 text-white px-3 py-2 rounded-md text-sm hover:bg-green-700 transition-colors"
        >
          إضافة زر فرعي
        </button>
      </div>
    </div>
  );
}

// Button Modal Component
function ButtonModal({ 
  button, 
  parentButton,
  onClose, 
  onSave 
}: { 
  button?: TelegramTemplateButton | null; 
  parentButton?: TelegramTemplateButton | null;
  onClose: () => void;
  onSave: (data: Partial<TelegramTemplateButton>) => void;
}) {
  const [formData, setFormData] = useState({
    text: button?.text || '',
    buttonType: button?.buttonType || 'callback',
    url: button?.url || '',
    callbackData: button?.callbackData || '',
    webAppUrl: button?.webAppUrl || '',
    switchInlineQuery: button?.switchInlineQuery || '',
    displayOrder: button?.displayOrder || 0,
    isActive: button?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {button ? 'تعديل الزر' : parentButton ? 'إضافة زر فرعي' : 'إضافة زر جديد'}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">نص الزر *</label>
              <input
                type="text"
                required
                maxLength={64}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.text}
                onChange={(e) => setFormData({ ...formData, text: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">نوع الزر *</label>
              <select
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.buttonType}
                onChange={(e) => setFormData({ ...formData, buttonType: e.target.value as any })}
              >
                <option value="callback">استجابة</option>
                <option value="url">رابط</option>
                <option value="web_app">تطبيق ويب</option>
                <option value="switch_inline">تبديل داخلي</option>
                <option value="switch_inline_current">تبديل داخلي حالي</option>
              </select>
            </div>

            {formData.buttonType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">الرابط *</label>
                <input
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
            )}

            {formData.buttonType === 'callback' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">بيانات الاستجابة *</label>
                <input
                  type="text"
                  required
                  maxLength={64}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.callbackData}
                  onChange={(e) => setFormData({ ...formData, callbackData: e.target.value })}
                />
              </div>
            )}

            {formData.buttonType === 'web_app' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">رابط التطبيق *</label>
                <input
                  type="url"
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.webAppUrl}
                  onChange={(e) => setFormData({ ...formData, webAppUrl: e.target.value })}
                />
              </div>
            )}

            {(formData.buttonType === 'switch_inline' || formData.buttonType === 'switch_inline_current') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">استعلام التبديل</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.switchInlineQuery}
                  onChange={(e) => setFormData({ ...formData, switchInlineQuery: e.target.value })}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
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
                {button ? 'تحديث' : 'إضافة'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
