"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { 
  getTemplate, 
  updateTemplate,
  createButton, 
  updateButton, 
  deleteButton,
  type TelegramTemplate,
  type TelegramTemplateButton,
} from "@/lib/telegramTemplateApi";

export default function ManageTemplateButtonsPage() {
  const params = useParams();
  const router = useRouter();
  const templateId = Number(params?.id);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [template, setTemplate] = useState<TelegramTemplate | null>(null);
  const [error, setError] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalParent, setModalParent] = useState<TelegramTemplateButton | null>(null);
  const [modalEditButton, setModalEditButton] = useState<TelegramTemplateButton | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState<TelegramTemplateButton | null>(null);

  const token = useMemo(() => (typeof window !== "undefined" ? localStorage.getItem("auth_token") || "" : ""), []);

  useEffect(() => {
    if (!templateId) return;
      loadTemplate();
  }, [templateId]);

  async function loadTemplate() {
    try {
      setLoading(true);
      setError("");
      const res = await getTemplate(templateId);
      if (res?.success) {
        setTemplate(res.data as TelegramTemplate);
      } else {
        setError(res?.message || "Failed to load template");
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load template");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddButton(parentButtonId?: number) {
    if (!template) return;
    const parent = (parentButtonId && Array.isArray(template.buttons)) ? findButtonById(template.buttons, parentButtonId) : null;
    setModalParent(parent || null);
    setModalEditButton(null);
    setModalOpen(true);
  }

  async function handleEditButton(btn: TelegramTemplateButton) {
    setModalEditButton(btn);
    setModalParent(null);
    setModalOpen(true);
  }

  async function handleDeleteButton(btn: TelegramTemplateButton) {
    setConfirmTarget(btn);
    setConfirmOpen(true);
  }

  async function handleSetButtonType(btn: TelegramTemplateButton, type: TelegramTemplateButton["buttonType"]) {
    // open edit modal prefilled so user can confirm in modal
    setModalEditButton({ ...btn, buttonType: type } as TelegramTemplateButton);
    setModalParent(null);
    setModalOpen(true);
  }

  async function handleSetUrl(btn: TelegramTemplateButton) {
    setModalEditButton(btn);
    setModalParent(null);
    setModalOpen(true);
  }

  async function handleSetCallback(btn: TelegramTemplateButton) {
    setModalEditButton(btn);
    setModalParent(null);
    setModalOpen(true);
  }

  async function handleUploadMedia(btn: TelegramTemplateButton) {
    try {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx";
      input.onchange = async () => {
        const file = input.files?.[0];
        if (!file) return;
        const { API_URL } = await import("@/lib/api");
        const fd = new FormData();
        fd.append("file", file);
        const resp = await fetch(`${API_URL}/api/uploads`, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: fd });
        const data = await resp.json();
        if (!resp.ok || !data?.url) throw new Error(data?.message || "Upload failed");
        const lower = String(file.name).toLowerCase();
        let mediaType: any = "document";
        if (/\.(jpg|jpeg|png|gif|webp)$/.test(lower)) mediaType = "photo";
        else if (/\.(mp4|mov|m4v)$/.test(lower)) mediaType = "video";
        else if (/\.(mp3|wav|aac|ogg)$/.test(lower)) mediaType = "audio";
        await updateButton(btn.id, { mediaUrl: data.url, mediaType });
        await loadTemplate();
      };
      input.click();
    } catch (e: any) {
      setError(e?.message || "Failed to upload media");
    }
  }

  function ButtonTree({ nodes, parentId }: { nodes: TelegramTemplateButton[]; parentId?: number }) {
    const roots = useMemo(() => nodes.filter((b) => (parentId ? b.parentButtonId === parentId : !b.parentButtonId)).sort((a,b)=> (a.displayOrder||0)-(b.displayOrder||0)), [nodes, parentId]);
    return (
      <ul className="space-y-2">
        {roots.map((b) => (
          <li key={b.id} className="border rounded p-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 text-xs rounded bg-gray-100">#{b.id}</span>
              <span className="font-medium">{b.text}</span>
              <span className="text-xs text-gray-500">{b.buttonType}</span>
              {b.mediaUrl && (
                <a href={b.mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 underline truncate max-w-[200px]">media</a>
              )}
              <div className="ml-auto flex gap-2">
                <button onClick={() => handleEditButton(b)} className="text-blue-600 text-sm">تعديل</button>
                <button onClick={() => handleAddButton(b.id)} className="text-emerald-600 text-sm">إضافة زر فرعي</button>
                <button onClick={() => handleUploadMedia(b)} className="text-purple-600 text-sm">رفع وسائط</button>
                <button onClick={() => handleSetButtonType(b, "url")} className="text-gray-600 text-sm">نوع: URL</button>
                <button onClick={() => handleSetButtonType(b, "callback")} className="text-gray-600 text-sm">نوع: Callback</button>
                <button onClick={() => handleSetUrl(b)} className="text-gray-600 text-sm">تعيين رابط</button>
                <button onClick={() => handleSetCallback(b)} className="text-gray-600 text-sm">تعيين بيانات</button>
                <button onClick={() => handleDeleteButton(b)} className="text-red-600 text-sm">حذف</button>
              </div>
            </div>
            {Array.isArray(b.ChildButtons) && b.ChildButtons.length > 0 && (
              <div className="pl-4 mt-3 border-l">
                <ButtonTree nodes={b.ChildButtons} parentId={b.id} />
              </div>
            )}
          </li>
        ))}
      </ul>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">Loading...</div>
    );
  }

  if (error || !template) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-4"><Link href="/telegram-templates" className="text-blue-600">← الرجوع</Link></div>
          <div className="p-6 bg-white rounded border">{error || "Template not found"}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
            <div>
            <div className="text-sm"><Link href="/telegram-templates" className="text-blue-600">← الرجوع</Link></div>
            <h1 className="text-2xl font-bold mt-1">إدارة أزرار القالب: {template.name}</h1>
            </div>
          <div className="flex gap-2">
            <button onClick={() => handleAddButton(undefined)} className="px-3 py-2 rounded bg-blue-600 text-white disabled:opacity-50" disabled={saving}>إضافة زر رئيسي</button>
            <button onClick={() => router.refresh()} className="px-3 py-2 rounded border" disabled={saving}>تحديث</button>
          </div>
        </div>

        <div className="bg-white border rounded p-4">
          {Array.isArray(template.buttons) && template.buttons.length > 0 ? (
            <ButtonTree nodes={template.buttons} />
          ) : (
            <div className="text-sm text-gray-600">لا توجد أزرار بعد. ابدأ بإضافة زر رئيسي.</div>
          )}
        </div>

        {modalOpen && (
          <ButtonModal
            button={modalEditButton}
            parentButton={modalParent || undefined}
            onClose={() => { setModalOpen(false); setModalEditButton(null); setModalParent(null); }}
            onSave={async (data) => {
              try {
                setSaving(true);
                if (modalEditButton) {
                  await updateButton(modalEditButton.id, data);
                } else if (template) {
                  await createButton({ templateId: template.id, parentButtonId: modalParent?.id, text: data.text || '', buttonType: (data as any).buttonType || 'callback', url: (data as any).url, callbackData: (data as any).callbackData, webAppUrl: (data as any).webAppUrl, switchInlineQuery: (data as any).switchInlineQuery, isActive: (data as any).isActive ?? true, displayOrder: (data as any).displayOrder ?? 0 });
                }
                setModalOpen(false);
                setModalEditButton(null);
                setModalParent(null);
                await loadTemplate();
              } catch (e: any) {
                setError(e?.message || 'Failed to save');
              } finally {
                setSaving(false);
              }
            }}
          />
        )}

        {confirmOpen && (
          <ConfirmModal
            title="تأكيد الحذف"
            message="هل أنت متأكد من حذف هذا الزر؟"
            onCancel={() => { setConfirmOpen(false); setConfirmTarget(null); }}
            onConfirm={async () => {
              if (!confirmTarget) return;
              try {
                setSaving(true);
                await deleteButton(confirmTarget.id);
                await loadTemplate();
              } catch (e: any) {
                setError(e?.message || 'Failed to delete');
              } finally {
                setSaving(false);
                setConfirmOpen(false);
                setConfirmTarget(null);
              }
            }}
          />
        )}
      </div>
    </div>
  );

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
    isActive: button?.isActive ?? true,
    mediaUrl: (button as any)?.mediaUrl || '',
    mediaType: (button as any)?.mediaType || ''
  });
  const [uploading, setUploading] = useState(false);
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''), []);

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

            {/* Media URL or Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">وسائط (اختياري)</label>
              <input
                type="url"
                placeholder="رابط وسائط (صورة/فيديو/مستند/صوت)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={formData.mediaUrl}
                onChange={(e) => setFormData({ ...formData, mediaUrl: e.target.value })}
              />
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="file"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    try {
                      setUploading(true);
                      const fd = new FormData();
                      fd.append('file', file);
                      const base = process.env.NEXT_PUBLIC_API_URL || '';
                      const resp = await fetch(`${base}/api/uploads`, { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: fd });
                      const data = await resp.json();
                      if (!resp.ok || !data?.url) throw new Error(data?.message || 'Upload failed');
                      const lower = String(file.name).toLowerCase();
                      let mediaType: any = 'document';
                      if (/\.(jpg|jpeg|png|gif|webp)$/.test(lower)) mediaType = 'photo';
                      else if (/\.(mp4|mov|m4v)$/.test(lower)) mediaType = 'video';
                      else if (/\.(mp3|wav|aac|ogg)$/.test(lower)) mediaType = 'audio';
                      setFormData((prev) => ({ ...prev, mediaUrl: data.url, mediaType }));
                    } catch (err) {
                      // swallow; outer page shows errors elsewhere
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
                {uploading && <span className="text-xs text-gray-600">...جاري الرفع</span>}
              </div>
            </div>

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

function ConfirmModal({ title, message, onConfirm, onCancel }: { title: string; message: string; onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-sm w-full">
        <div className="p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
          <p className="text-sm text-gray-700 mb-4">{message}</p>
          <div className="flex justify-end gap-3">
            <button onClick={onCancel} className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300">إلغاء</button>
            <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">حذف</button>
          </div>
        </div>
      </div>
    </div>
  );
}
