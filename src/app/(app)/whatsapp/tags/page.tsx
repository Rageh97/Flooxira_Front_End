"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listTags, createTag, updateTag, deleteTag, addContactToTag, removeContactFromTag, listContactsByTag, getAllContacts } from '@/lib/tagsApi';
import { Trash2Icon, Edit2Icon, XIcon, CheckIcon } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

type Tag = { id: number; name: string; color?: string };
type ContactTag = { id: number; contactNumber: string; contactName?: string };

export default function TagsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  const [tags, setTags] = useState<Tag[]>([]);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('');
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  const [contacts, setContacts] = useState<ContactTag[]>([]);
  const [contactNumber, setContactNumber] = useState('');
  const [contactName, setContactName] = useState('');
  const [loading, setLoading] = useState(false);
  const [allContacts, setAllContacts] = useState<string[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState('');
  const [deleteTagDialogOpen, setDeleteTagDialogOpen] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<number | null>(null);
  const [deleteContactDialogOpen, setDeleteContactDialogOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      window.location.href = '/sign-in';
      return;
    }
    load();
  }, [user, authLoading]);

  async function load() {
    setLoading(true);
    try {
      const [tagsRes, contactsRes] = await Promise.all([
        listTags(),
        getAllContacts()
      ]);
      if (tagsRes.success) setTags(tagsRes.data);
      if (contactsRes.success) setAllContacts(contactsRes.data);
    } finally { setLoading(false); }
  }

  async function onCreate() {
    if (!newName.trim()) {
      showError('خطأ', 'اسم التصنيف مطلوب');
      return;
    }
    const res = await createTag({ name: newName.trim(), color: newColor || undefined });
    if (res.success) {
      showSuccess('نجح', 'تم إنشاء التصنيف بنجاح');
      setNewName(''); setNewColor('');
      await load();
    } else {
      showError('خطأ', res.message || 'فشل في إنشاء التصنيف');
    }
  }

  function handleDeleteClick(id: number) {
    setTagToDelete(id);
    setDeleteTagDialogOpen(true);
  }

  async function onDelete() {
    if (!tagToDelete) return;
    const res = await deleteTag(tagToDelete);
    if (res.success) {
      showSuccess('نجح', 'تم حذف التصنيف بنجاح');
      if (selectedTag === tagToDelete) setSelectedTag(null);
      setDeleteTagDialogOpen(false);
      setTagToDelete(null);
      await load();
    } else {
      showError('خطأ', res.message || 'فشل في حذف التصنيف');
    }
  }

  async function onStartEdit(tag: Tag) {
    setEditingTagId(tag.id);
    setEditingTagName(tag.name);
  }

  async function onCancelEdit() {
    setEditingTagId(null);
    setEditingTagName('');
  }

  async function onSaveEdit(id: number) {
    if (!editingTagName.trim()) {
      showError('خطأ', 'اسم التصنيف مطلوب');
      return;
    }
    const res = await updateTag(id, { name: editingTagName.trim() });
    if (res.success) {
      showSuccess('نجح', 'تم تحديث التصنيف بنجاح');
      setEditingTagId(null);
      setEditingTagName('');
      await load();
      // If this was the selected tag, refresh contacts
      if (selectedTag === id) {
        await onSelectTag(id);
      }
    } else {
      showError('خطأ', res.message || 'فشل في تحديث التصنيف');
    }
  }

  function handleRemoveContactClick(contactNumber: string) {
    if (!selectedTag) return;
    setContactToDelete(contactNumber);
    setDeleteContactDialogOpen(true);
  }

  async function onRemoveContact() {
    if (!selectedTag || !contactToDelete) return;
    const res = await removeContactFromTag(selectedTag, { contactNumber: contactToDelete });
    if (res.success) {
      showSuccess('نجح', 'تم حذف جهة الاتصال من التصنيف بنجاح');
      setDeleteContactDialogOpen(false);
      setContactToDelete(null);
      await onSelectTag(selectedTag);
    } else {
      showError('خطأ', res.message || 'فشل في حذف جهة الاتصال');
    }
  }

  async function onSelectTag(id: number) {
    setSelectedTag(id);
    const res = await listContactsByTag(id);
    if (res.success) setContacts(res.data);
  }

  async function onAddContact() {
    if (!selectedTag || !contactNumber.trim()) return;
    const res = await addContactToTag(selectedTag, { contactNumber: contactNumber.trim(), contactName: contactName || undefined });
    if (res.success) {
      showSuccess('نجح', 'تم إضافة جهة الاتصال إلى التصنيف بنجاح');
      setContactNumber(''); setContactName('');
      await onSelectTag(selectedTag);
    } else {
      showError('خطأ', res.message || 'فشل في إضافة جهة الاتصال');
    }
  }

  async function refreshContacts() {
    setLoadingContacts(true);
    try {
      const res = await getAllContacts();
      if (res.success) setAllContacts(res.data);
    } finally {
      setLoadingContacts(false);
    }
  }

  return (
    <div className="w-full mx-auto">
      {/* <h1 className="text-2xl font-semibold mb-4 text-white">Tags</h1> */}

      <div className="gradient-border rounded-lg p-4 mb-6">
        <div className="flex gap-2">
          <input className="w-3/4 bg-[#01191040] border-1 border-blue-300 rounded-lg px-3 py-4 text-white placeholder-white outline-none" placeholder="ادخل اسم التصنيف" value={newName} onChange={e => setNewName(e.target.value)} />
          {/* <input className="w-40 bg-[#01191040] border-1 border-blue-300 rounded-lg-lg px-3 py-4 text-white placeholder-white outline-none" placeholder="#اللون" value={newColor} onChange={e => setNewColor(e.target.value)} /> */}
          <button onClick={onCreate} className="primary-button text-white rounded-lg-lg px-4 w-1/4">إنشاء</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="gradient-border rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-3">تصنيفاتك</h2>
          {loading ? (
            <div className="text-gray-300">جاري التحميل...</div>
          ) : (
            <ul className="space-y-2 cursor-pointer grid grid-cols-2 lg:grid-cols-3  gap-2">
              {tags.map(t => (
                <li key={t.id} className="flex items-center justify-between bg-secondry rounded-lg px-3 py-2">
                  {editingTagId === t.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input
                        className="flex-1 bg-dark-custom border border-gray-600 rounded-lg px-2 py-1 text-white text-sm"
                        value={editingTagName}
                        onChange={e => setEditingTagName(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        onKeyDown={e => {
                          if (e.key === 'Enter') onSaveEdit(t.id);
                          if (e.key === 'Escape') onCancelEdit();
                        }}
                        autoFocus
                      />
                      <button 
                        className="text-green-400 hover:text-green-300" 
                        onClick={e => { e.stopPropagation(); onSaveEdit(t.id); }}
                        title="حفظ"
                      >
                        <CheckIcon className="w-4 h-4" />
                      </button>
                      <button 
                        className="text-gray-400 hover:text-gray-300" 
                        onClick={e => { e.stopPropagation(); onCancelEdit(); }}
                        title="إلغاء"
                      >
                        <XIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <button 
                        className="text-white flex-1 text-left" 
                        onClick={() => onSelectTag(t.id)}
                      >
                        {t.name}
                      </button>
                      <div className="flex items-center gap-2">
                        {t.color && <span className="inline-block w-4 h-4 rounded-lg" style={{ background: t.color }} />}
                        <button 
                          className="text-blue-400 hover:text-blue-300" 
                          onClick={e => { e.stopPropagation(); onStartEdit(t); }}
                          title="تعديل"
                        >
                          <Edit2Icon className="w-4 h-4" />
                        </button>
                        <button 
                          className="text-red-400 hover:text-red-300" 
                          onClick={e => { e.stopPropagation(); handleDeleteClick(t.id); }}
                          title="حذف"
                        >
                          <Trash2Icon className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="gradient-border rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-3">جهات الاتصال في التصنيف المحدد</h2>
          {selectedTag ? (
            <>
              <div className="space-y-3 mb-3">
                <div className="flex gap-2">
                  <select 
                    className="flex-1 bg-dark-custom border border-gray-600 rounded-lg px-3 py-2 text-white appearance-none" 
                    value={contactNumber} 
                    onChange={e => setContactNumber(e.target.value)}
                  >
                    <option value="">اختر رقم جهة اتصال</option>
                    {allContacts.map(contact => (
                      <option key={contact} value={contact}>{contact}</option>
                    ))}
                  </select>
                
                </div>
                <div className="flex gap-2">
                  <input 
                    className="flex-1 bg-dark-custom border border-gray-600 rounded-lg px-3 py-2 text-white" 
                    placeholder="الاسم (اختياري)" 
                    value={contactName} 
                    onChange={e => setContactName(e.target.value)} 
                  />
                  <button 
                    onClick={onAddContact} 
                    className="bg-[#08c47d] text-white rounded-lg px-4"
                    disabled={!contactNumber.trim()}
                  >
                    إضافة
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {contacts.map(c => (
                  <li key={c.id} className="bg-dark-custom rounded-lg px-3 py-2 text-white flex items-center justify-between">
                    <span className="flex-1">
                      {c.contactNumber}
                      {c.contactName && <span className="text-gray-400 ml-2">{c.contactName}</span>}
                    </span>
                    <button 
                      className="text-red-400 hover:text-red-300 ml-2" 
                      onClick={() => handleRemoveContactClick(c.contactNumber)}
                      title="حذف من التصنيف"
                    >
                      <Trash2Icon className="w-4 h-4" />
                    </button>
                  </li>
                ))}
                {contacts.length === 0 && <div className="text-gray-300">لا توجد جهات اتصال بعد</div>}
              </ul>
            </>
          ) : (
            <div className="text-gray-300">اختر تصنيفاً لإدارة جهات الاتصال الخاصة به</div>
          )}
        </div>
      </div>

      {/* Delete Tag Confirmation Dialog */}
      <Dialog open={deleteTagDialogOpen} onOpenChange={setDeleteTagDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-white">
              هل أنت متأكد من حذف هذا التصنيف؟ هذا الإجراء لا يمكن التراجع عنه.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="secondary"
              onClick={() => setDeleteTagDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={onDelete}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Contact Confirmation Dialog */}
      <Dialog open={deleteContactDialogOpen} onOpenChange={setDeleteContactDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تأكيد الحذف</DialogTitle>
            <DialogDescription className="text-white">
              هل أنت متأكد من حذف جهة الاتصال "{contactToDelete}" من هذا التصنيف؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-2">
            <Button 
              variant="secondary"
              onClick={() => setDeleteContactDialogOpen(false)}
            >
              إلغاء
            </Button>
            <Button 
              variant="destructive"
              onClick={onRemoveContact}
            >
              حذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

