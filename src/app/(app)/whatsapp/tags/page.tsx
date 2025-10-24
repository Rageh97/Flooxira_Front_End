"use client";
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { listTags, createTag, deleteTag, addContactToTag, listContactsByTag, getAllContacts } from '@/lib/tagsApi';

type Tag = { id: number; name: string; color?: string };
type ContactTag = { id: number; contactNumber: string; contactName?: string };

export default function TagsPage() {
  const { user, loading: authLoading } = useAuth();
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
    if (!newName.trim()) return;
    const res = await createTag({ name: newName.trim(), color: newColor || undefined });
    if (res.success) {
      setNewName(''); setNewColor('');
      await load();
    }
  }

  async function onDelete(id: number) {
    const res = await deleteTag(id);
    if (res.success) {
      if (selectedTag === id) setSelectedTag(null);
      await load();
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
      setContactNumber(''); setContactName('');
      await onSelectTag(selectedTag);
    } else {
      alert(res.message || 'فشل في إضافة جهة الاتصال');
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
          <input className="w-3/4 bg-[#011910] inner-shadow rounded-lg-lg px-3 py-4 text-white placeholder-white outline-none" placeholder="ادخل اسم التصنيف" value={newName} onChange={e => setNewName(e.target.value)} />
          {/* <input className="w-40 bg-[#011910] inner-shadow rounded-lg-lg px-3 py-4 text-white placeholder-white outline-none" placeholder="#اللون" value={newColor} onChange={e => setNewColor(e.target.value)} /> */}
          <button onClick={onCreate} className="primary-button text-white rounded-lg-lg px-4 w-1/4">إنشاء</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="gradient-border rounded-lg p-4">
          <h2 className="text-lg font-medium text-white mb-3">تصنيفاتك</h2>
          {loading ? (
            <div className="text-gray-300">جاري التحميل...</div>
          ) : (
            <ul className="space-y-2">
              {tags.map(t => (
                <li key={t.id} className="flex items-center justify-between bg-dark-custom rounded-lg px-3 py-2">
                  <button className="text-white " onClick={() => onSelectTag(t.id)}>
                    {t.name}
                  </button>
                  <div className="flex items-center gap-2">
                    {t.color && <span className="inline-block w-4 h-4 rounded-lg" style={{ background: t.color }} />}
                    <button className="text-red-400 hover:text-red-300" onClick={() => onDelete(t.id)}>حذف</button>
                  </div>
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
                    {c.contactNumber}<span>{c.contactName ? `${c.contactName}  ` : ''}</span>
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
    </div>
  );
}

