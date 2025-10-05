'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { 
  getTemplate, 
  createButton, 
  updateButton, 
  deleteButton,
  type WhatsappTemplate,
  type WhatsappTemplateButton 
} from '@/lib/whatsappTemplateApi';

export default function TemplateButtonsPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [template, setTemplate] = useState<WhatsappTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingButton, setEditingButton] = useState<WhatsappTemplateButton | null>(null);
  const [parentButton, setParentButton] = useState<WhatsappTemplateButton | null>(null);

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

  const handleCreateButton = async (buttonData: Partial<WhatsappTemplateButton>) => {
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

  const handleUpdateButton = async (buttonId: number, buttonData: Partial<WhatsappTemplateButton>) => {
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
    if (confirm('هل أنت متأكد من حذف هذا الزر؟')) {
      try {
        const response = await deleteButton(buttonId);
        if (response.success) {
          await loadTemplate();
        }
      } catch (error) {
        console.error('Failed to delete button:', error);
      }
    }
  };

  const openCreateModal = (parent?: WhatsappTemplateButton) => {
    setParentButton(parent || null);
    setShowCreateModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">القالب غير موجود</h2>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            العودة
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
            <div className="flex space-x-3 space-x-reverse">
              <button
                onClick={() => router.back()}
                className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
              >
                العودة
              </button>
              <button
                onClick={() => openCreateModal()}
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
          <div className="bg-gray-50 rounded-lg p-4 border-2 border-dashed border-gray-300">
            {template.headerText && (
              <div className="mb-3">
                <p className="text-sm text-gray-600 mb-1">النص العلوي:</p>
                <p className="text-gray-800">{template.headerText}</p>
              </div>
            )}
            
            <div className="mb-3">
              <p className="text-sm text-gray-600 mb-2">الأزرار:</p>
              {template.buttons && template.buttons.length > 0 ? (
                <div className="space-y-2">
                  {template.buttons.map((button) => (
                    <ButtonPreview key={button.id} button={button} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">لا توجد أزرار</p>
              )}
            </div>

            {template.footerText && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-1">النص السفلي:</p>
                <p className="text-gray-800">{template.footerText}</p>
              </div>
            )}
          </div>
        </div>

        {/* Buttons Management */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">إدارة الأزرار</h3>
          {template.buttons && template.buttons.length > 0 ? (
            <div className="space-y-4">
              {template.buttons.map((button) => (
                <ButtonCard
                  key={button.id}
                  button={button}
                  onEdit={setEditingButton}
                  onDelete={handleDeleteButton}
                  onAddChild={(parent) => openCreateModal(parent)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-4">🔘</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">لا توجد أزرار</h3>
              <p className="text-gray-600 mb-4">ابدأ بإضافة أزرار تفاعلية للقالب</p>
              <button
                onClick={() => openCreateModal()}
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

// Button Preview Component
function ButtonPreview({ button }: { button: WhatsappTemplateButton }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-900">{button.buttonText}</span>
        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {button.buttonType}
        </span>
      </div>
      {button.ChildButtons && button.ChildButtons.length > 0 && (
        <div className="mt-2 pr-4">
          {button.ChildButtons.map((child) => (
            <div key={child.id} className="text-sm text-gray-600">
              • {child.buttonText}
            </div>
          ))}
        </div>
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
  button: WhatsappTemplateButton; 
  onEdit: (button: WhatsappTemplateButton) => void;
  onDelete: (id: number) => void;
  onAddChild: (parent: WhatsappTemplateButton) => void;
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-medium text-gray-900">{button.buttonText}</h4>
          <p className="text-sm text-gray-500">نوع: {button.buttonType}</p>
          {button.responseText && (
            <p className="text-sm text-gray-600 mt-1">{button.responseText}</p>
          )}
        </div>
        <div className="flex items-center space-x-2 space-x-reverse">
          <span className={`px-2 py-1 rounded-full text-xs ${
            button.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-gray-100 text-gray-800'
          }`}>
            {button.isActive ? 'نشط' : 'غير نشط'}
          </span>
        </div>
      </div>

      {button.ChildButtons && button.ChildButtons.length > 0 && (
        <div className="mb-3">
          <p className="text-sm text-gray-500 mb-2">الأزرار الفرعية ({button.ChildButtons.length}):</p>
          <div className="space-y-1">
            {button.ChildButtons.map((child) => (
              <div key={child.id} className="bg-gray-50 rounded p-2 text-sm">
                {child.buttonText}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-3 border-t border-gray-200">
        <div className="flex space-x-2 space-x-reverse">
          <button
            onClick={() => onEdit(button)}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            تعديل
          </button>
          <button
            onClick={() => onAddChild(button)}
            className="text-green-600 hover:text-green-800 text-sm font-medium"
          >
            إضافة زر فرعي
          </button>
          <button
            onClick={() => onDelete(button.id)}
            className="text-red-600 hover:text-red-800 text-sm font-medium"
          >
            حذف
          </button>
        </div>
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
  button?: WhatsappTemplateButton | null; 
  parentButton?: WhatsappTemplateButton | null;
  onClose: () => void;
  onSave: (data: Partial<WhatsappTemplateButton>) => void;
}) {
  const [formData, setFormData] = useState({
    buttonText: button?.buttonText || '',
    buttonType: button?.buttonType || 'reply',
    responseText: button?.responseText || '',
    url: button?.url || '',
    phoneNumber: button?.phoneNumber || '',
    displayOrder: button?.displayOrder || 0,
    isActive: button?.isActive ?? true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            {button ? 'تعديل الزر' : 'إنشاء زر جديد'}
            {parentButton && ` (فرعي لـ: ${parentButton.buttonText})`}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نص الزر *
              </label>
              <input
                type="text"
                required
                value={formData.buttonText}
                onChange={(e) => setFormData({ ...formData, buttonText: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="مثال: خدمات التطوير"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                نوع الزر *
              </label>
              <select
                value={formData.buttonType}
                onChange={(e) => setFormData({ ...formData, buttonType: e.target.value as any })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="reply">رد نصي</option>
                <option value="url">رابط</option>
                <option value="phone">رقم هاتف</option>
                <option value="nested">قائمة فرعية</option>
              </select>
            </div>

            {formData.buttonType === 'reply' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  النص المرسل
                </label>
                <textarea
                  value={formData.responseText}
                  onChange={(e) => setFormData({ ...formData, responseText: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="النص الذي سيتم إرساله عند الضغط على الزر"
                />
              </div>
            )}

            {formData.buttonType === 'url' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  الرابط
                </label>
                <input
                  type="url"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://example.com"
                />
              </div>
            )}

            {formData.buttonType === 'phone' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  رقم الهاتف
                </label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+966501234567"
                />
              </div>
            )}

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
                {button ? 'حفظ التغييرات' : 'إنشاء الزر'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}