"use client";
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { listTags, createTag, updateTag, deleteTag, addContactToTag, removeContactFromTag, listContactsByTag } from '@/lib/tagsApi';
import { getChatContacts } from '@/lib/api';
import { Trash2, Edit2, X, Check, Search, Plus, UserPlus, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/toast-provider';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type Tag = { id: number; name: string; color?: string };
type ContactTag = { id: number; contactNumber: string; contactName?: string };
type ContactOption = { contactNumber: string; contactName?: string | null; profilePicture?: string | null };

export default function TagsPage() {
  const { user, loading: authLoading } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [tags, setTags] = useState<Tag[]>([]);
  const [contactsInTag, setContactsInTag] = useState<ContactTag[]>([]);
  const [allContacts, setAllContacts] = useState<ContactOption[]>([]);
  
  const [selectedTag, setSelectedTag] = useState<number | null>(null);
  
  // Create Tag State
  const [newName, setNewName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Edit Tag State
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [editingTagName, setEditingTagName] = useState('');

  // Add Contact State
  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactToAdd, setSelectedContactToAdd] = useState<string>('');
  const [isAddingContact, setIsAddingContact] = useState(false);

  // Loading States
  const [loading, setLoading] = useState(true);
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Dialogs
  const [deleteTagId, setDeleteTagId] = useState<number | null>(null);
  const [deleteContactId, setDeleteContactId] = useState<string | null>(null); // contactNumber to delete

  useEffect(() => {
    if (authLoading) return;
    loadInitialData();
  }, [user, authLoading]);

  async function loadInitialData() {
    setLoading(true);
    try {
      const [tagsRes, contactsRes] = await Promise.all([
        listTags(),
        getChatContacts(localStorage.getItem('auth_token') || '', 500)
      ]);
      
      if (tagsRes.success) setTags(tagsRes.data || []);
      if (contactsRes.success) setAllContacts(contactsRes.contacts || []);
    } catch (e) {
      console.error(e);
      showError('خطأ', 'فشل في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateTag() {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await createTag({ name: newName.trim() });
      if (res.success) {
        setNewName('');
        const list = await listTags();
        if (list.success) setTags(list.data || []);
        showSuccess('نجح', 'تم إنشاء التصنيف');
      } else {
        showError('خطأ', res.message);
      }
    } catch (e: any) {
      showError('خطأ', e.message);
    } finally {
      setIsCreating(false);
    }
  }

  async function handleUpdateTag(id: number) {
    if (!editingTagName.trim()) return;
    try {
      const res = await updateTag(id, { name: editingTagName.trim() });
      if (res.success) {
        setTags(prev => prev.map(t => t.id === id ? { ...t, name: editingTagName.trim() } : t));
        setEditingTagId(null);
        showSuccess('نجح', 'تم تحديث التصنيف');
      } else {
        showError('خطأ', res.message);
      }
    } catch (e: any) {
      showError('خطأ', e.message);
    }
  }

  async function handleDeleteTag() {
    if (!deleteTagId) return;
    try {
      const res = await deleteTag(deleteTagId);
      if (res.success) {
        setTags(prev => prev.filter(t => t.id !== deleteTagId));
        if (selectedTag === deleteTagId) {
          setSelectedTag(null);
          setContactsInTag([]);
        }
        setDeleteTagId(null);
        showSuccess('نجح', 'تم حذف التصنيف');
      }
    } catch (e: any) {
      showError('خطأ', e.message);
    }
  }

  async function handleSelectTag(tagId: number) {
    setSelectedTag(tagId);
    setLoadingContacts(true);
    try {
      const res = await listContactsByTag(tagId);
      if (res.success) {
        setContactsInTag(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingContacts(false);
    }
  }

  async function handleAddContactToTag() {
    if (!selectedTag || !selectedContactToAdd) return;
    setIsAddingContact(true);
    try {
      const contactObj = allContacts.find(c => c.contactNumber === selectedContactToAdd);
      const res = await addContactToTag(selectedTag, { 
        contactNumber: selectedContactToAdd,
        contactName: contactObj?.contactName || undefined 
      });
      
      if (res.success) {
        showSuccess('نجح', 'تم إضافة جهة الاتصال');
        setContactSearch('');
        setSelectedContactToAdd('');
        handleSelectTag(selectedTag); // Refresh list
      } else {
        showError('خطأ', res.message);
      }
    } catch (e: any) {
      showError('خطأ', e.message);
    } finally {
      setIsAddingContact(false);
    }
  }

  async function handleRemoveContact() {
    if (!selectedTag || !deleteContactId) return;
    try {
      const res = await removeContactFromTag(selectedTag, { contactNumber: deleteContactId });
      if (res.success) {
        setContactsInTag(prev => prev.filter(c => c.contactNumber !== deleteContactId));
        setDeleteContactId(null);
        showSuccess('نجح', 'تم حذف جهة الاتصال من التصنيف');
      }
    } catch (e: any) {
      showError('خطأ', e.message);
    }
  }

  // Filter contacts for dropdown
  const filteredContactsForAdd = useMemo(() => {
    if (!contactSearch) return allContacts.slice(0, 50); // Show first 50 if no search
    const lower = contactSearch.toLowerCase();
    return allContacts.filter(c => 
      (c.contactName || '').toLowerCase().includes(lower) || 
      c.contactNumber.includes(lower)
    ).slice(0, 50);
  }, [allContacts, contactSearch]);

  const selectedTagName = tags.find(t => t.id === selectedTag)?.name;

  return (
    <div className="w-full mx-auto p-4 md:p-6 space-y-4">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-blue-400" />
            تصنيفات الواتساب
          </h1>
          <p className="text-sm text-gray-400">نظم جهات اتصالك باستخدام التصنيفات لتسهيل الوصول إليهم</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[380px_1fr] gap-6 items-start h-[calc(100vh-200px)] min-h-[600px]">
        
        {/* Left Sidebar: Tags List & Creation */}
        <Card className="gradient-border border-none shadow-xl h-full flex flex-col overflow-hidden bg-[#0a0a0a]/60">
          <CardHeader className="pb-4 space-y-4 border-b border-white/5">
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-400" />
              إنشاء تصنيف جديد
            </CardTitle>
            <div className="flex gap-2">
              <Input 
                className="bg-black/40 border-white/10 text-white placeholder-gray-500 h-10 text-sm"
                placeholder="اسم التصنيف..."
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
              />
              <Button 
                onClick={handleCreateTag} 
                disabled={!newName.trim() || isCreating}
                size="sm"
                className="primary-button h-10 px-4"
              >
                {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة'}
              </Button>
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-2 mt-2">
            <div className="px-2 mb-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-2">جميع التصنيفات</p>
            </div>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                <Loader2 className="w-8 h-8 animate-spin mb-2 text-blue-500" />
                <p className="text-sm">جاري التحميل...</p>
              </div>
            ) : tags.length === 0 ? (
              <div className="text-center py-20 px-6">
                <Users className="w-12 h-12 text-gray-700 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">لا توجد تصنيفات حالياً</p>
              </div>
            ) : (
              <div className="space-y-1">
                {tags.map(tag => (
                  <div 
                    key={tag.id} 
                    onClick={() => handleSelectTag(tag.id)}
                    className={`
                      group relative p-3 rounded-xl flex items-center justify-between cursor-pointer transition-all border
                      ${selectedTag === tag.id 
                        ? 'bg-blue-600/15 border-blue-500/50 shadow-lg shadow-blue-500/5' 
                        : 'bg-transparent border-transparent hover:bg-white/5'}
                    `}
                  >
                    {editingTagId === tag.id ? (
                      <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                        <Input
                          value={editingTagName}
                          onChange={e => setEditingTagName(e.target.value)}
                          className="h-8 bg-black/60 text-white border-blue-500 text-sm"
                          autoFocus
                        />
                        <button className="p-1.5 text-green-400 hover:bg-green-400/10 rounded-md" onClick={() => handleUpdateTag(tag.id)}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-red-400 hover:bg-red-400/10 rounded-md" onClick={() => setEditingTagId(null)}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`w-2 h-2 rounded-full ${selectedTag === tag.id ? 'bg-blue-400 animate-pulse' : 'bg-gray-600'}`}></div>
                          <span className={`font-medium text-sm truncate ${selectedTag === tag.id ? 'text-blue-400' : 'text-gray-300'}`}>
                            {tag.name}
                          </span>
                        </div>
                        <div className={`flex items-center gap-1 transition-opacity ${selectedTag === tag.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                          <button 
                            className="p-1.5 text-gray-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-md transition-colors" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEditingTagId(tag.id); 
                              setEditingTagName(tag.name); 
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-md transition-colors" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setDeleteTagId(tag.id); 
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Right Pane: Tag Content & Contacts Management */}
        <Card className="gradient-border border-none shadow-xl h-full flex flex-col relative overflow-hidden bg-[#0a0a0a]/60">
          {!selectedTag ? (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
              <div className="w-20 h-20 rounded-full bg-blue-500/10 flex items-center justify-center mb-6">
                <Users className="w-10 h-10 text-blue-400/50" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">ابدأ بإدارة تصنيفاتك</h3>
              <p className="text-gray-400 max-w-sm">اختر تصنيفاً من القائمة الجانبية لعرض جهات الاتصال المرتبطة به أو إضافة جهات اتصال جديدة.</p>
            </div>
          ) : (
             <div className="flex flex-col h-full">
                <CardHeader className="border-b border-white/5 bg-white/5 pb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"></span>
                        <h2 className="text-xl font-bold text-white">{selectedTagName}</h2>
                      </div>
                      <p className="text-xs text-gray-500">تم تحديد {contactsInTag.length} جهة اتصال في هذا التصنيف</p>
                    </div>
                    
                   
                  </div>
                </CardHeader>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] divide-x-reverse xl:divide-x divide-white/5 h-full overflow-hidden">
                  
                  {/* Contacts List Area */}
                  <div className="flex flex-col h-full overflow-hidden">
                    <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
                      {loadingContacts ? (
                        <div className="flex flex-col items-center justify-center py-32">
                          <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
                          <p className="text-gray-400">جاري عرض جهات الاتصال...</p>
                        </div>
                      ) : contactsInTag.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 text-center">
                          <div className="w-16 h-16 rounded-full bg-gray-800 flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-gray-600" />
                          </div>
                          <p className="text-gray-400 font-medium">لا توجد جهات اتصال في هذا التصنيف</p>
                          <p className="text-xs text-gray-600 mt-1">استخدم النموذج الجانبي لإضافة جهات اتصال جديدة</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {contactsInTag.map(contact => {
                            const fullContact = allContacts.find(c => c.contactNumber === contact.contactNumber);
                            const displayName = fullContact?.contactName || contact.contactName || 'بدون اسم';
                            const profilePic = fullContact?.profilePicture;
                            
                            return (
                              <div 
                                key={contact.id} 
                                className="group flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-blue-500/20 transition-all"
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-lg overflow-hidden shrink-0">
                                    {profilePic ? (
                                      <img src={profilePic} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                      displayName[0]?.toUpperCase() || '#'
                                    )}
                                  </div>
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-sm font-bold text-white truncate">{displayName}</span>
                                    <span className="text-[10px] text-gray-500 font-mono" dir="ltr">{contact.contactNumber}</span>
                                  </div>
                                </div>
                                <button
                                  className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                                  onClick={() => setDeleteContactId(contact.contactNumber)}
                                  title="إزالة من التصنيف"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Add Contact Sidebar Area */}
                  <div className="hidden xl:flex flex-col h-full bg-white/[0.02] p-4 space-y-4">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                        <UserPlus className="w-4 h-4 text-green-400" />
                        إضافة جهة اتصال
                      </div>
                      
                      <div className="space-y-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-500 uppercase font-bold pr-1">ابحث عن الاسم أو الرقم</label>
                          <div className="relative">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
                            <Input 
                              className="bg-white/5 border-white/10 text-white pr-9 h-9 text-xs"
                              placeholder="فلترة القائمة..."
                              value={contactSearch}
                              onChange={e => setContactSearch(e.target.value)}
                            />
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <label className="text-[10px] text-gray-500 uppercase font-bold pr-1">اختر من القائمة</label>
                          <div className="relative">
                            <select
                              className="w-full h-9 px-3 bg-white/5 border border-white/10 rounded-lg text-white text-xs focus:ring-1 focus:ring-blue-500 appearance-none outline-none"
                              value={selectedContactToAdd}
                              onChange={(e) => setSelectedContactToAdd(e.target.value)}
                            >
                              <option value="" className="bg-[#1a1a1a]">-- اختر جهة اتصال --</option>
                              {filteredContactsForAdd.map((c) => (
                                <option key={c.contactNumber} value={c.contactNumber} className="bg-[#1a1a1a]">
                                  {c.contactName || c.contactNumber}
                                </option>
                              ))}
                            </select>
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
                               <Users className="w-3.5 h-3.5 text-gray-600" />
                            </div>
                          </div>
                        </div>

                        <Button 
                          onClick={handleAddContactToTag} 
                          disabled={!selectedContactToAdd || isAddingContact}
                          className="w-full primary-button h-10 text-xs"
                        >
                           {isAddingContact ? <Loader2 className="w-4 h-4 animate-spin" /> : 'إضافة للتصنيف'}
                        </Button>
                      </div>

                      <div className="bg-blue-500/5 rounded-2xl p-4 border border-blue-500/10">
                        <div className="flex gap-2 text-blue-400 mb-2">
                          <Users className="w-4 h-4 shrink-0" />
                          <span className="text-xs font-bold">تلميح ذكي</span>
                        </div>
                        <p className="text-[10px] text-gray-400 leading-relaxed">
                          يمكنك إضافة نفس جهة الاتصال لعدة تصنيفات مختلفة لتسهيل تتبع حملاتك التسويقية أو اهتمامات العملاء.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
             </div>
          )}
        </Card>
      </div>

       {/* Dialogs remain similar but with better styling classes */}
       <Dialog open={!!deleteTagId} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <DialogContent className="bg-zinc-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">حذف التصنيف</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل أنت متأكد من حذف هذا التصنيف؟ لن يتم حذف جهات الاتصال، فقط إزالتها من هذا التصنيف.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setDeleteTagId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteTag}>حذف التصنيف</Button>
          </DialogFooter>
        </DialogContent>
       </Dialog>

       <Dialog open={!!deleteContactId} onOpenChange={(open) => !open && setDeleteContactId(null)}>
        <DialogContent className="bg-zinc-900 border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white">إزالة جهة الاتصال</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل أنت متأكد من إزالة هذا الرقم من التصنيف؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 pt-4">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setDeleteContactId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleRemoveContact}>إزالة الآن</Button>
          </DialogFooter>
        </DialogContent>
       </Dialog>
    </div>
  );
}

