"use client";
import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/lib/auth';
import { listTags, createTag, updateTag, deleteTag, addContactToTag, removeContactFromTag, listContactsByTag } from '@/lib/tagsApi';
import { getChatContacts } from '@/lib/api';
import { Trash2, Edit2, X, Check, Search, Plus, UserPlus, Users } from 'lucide-react';
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
    <div className="w-full mx-auto p-4 md:p-6 space-y-6">
      
      {/* Create Tag Section */}
      <Card className="gradient-border border-none shadow-lg">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plus className="w-5 h-5 text-blue-400" />
            إنشاء تصنيف جديد
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <Input 
              className="bg-[#01191040] border-text-primary/30 text-white placeholder-gray-400"
              placeholder="اسم التصنيف"
              value={newName}
              onChange={e => setNewName(e.target.value)}
            />
            <Button 
              onClick={handleCreateTag} 
              disabled={!newName.trim() || isCreating}
              className="primary-button whitespace-nowrap min-w-[120px]"
            >
              {isCreating ? 'جاري الإنشاء...' : 'إنشاء تصنيف'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
        
        {/* Tags List */}
        <Card className="gradient-border border-none shadow-lg h-full flex flex-col">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              التصنيفات المتاحة
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[500px] custom-scrollbar">
            {loading ? (
              <div className="text-center text-gray-400 py-10">جاري التحميل...</div>
            ) : tags.length === 0 ? (
              <div className="text-center text-gray-400 py-10">لا توجد تصنيفات بعد</div>
            ) : (
              <div className="space-y-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map(tag => (
                  <div 
                    key={tag.id} 
                    onClick={() => handleSelectTag(tag.id)}
                    className={`
                      p-1 rounded-lg flex items-center justify-between cursor-pointer transition-all border
                      ${selectedTag === tag.id 
                        ? 'bg-blue-600/20 border-blue-500 shadow-md transform scale-[1.02]' 
                        : 'bg-black/20 border-transparent hover:bg-black/40 hover:border-text-primary/30'}
                    `}
                  >
                    {editingTagId === tag.id ? (
                      <div className="flex items-center gap-2 flex-1 animate-in fade-in">
                        <Input
                          value={editingTagName}
                          onChange={e => setEditingTagName(e.target.value)}
                          className="h-8 bg-black/40 text-white border-blue-500"
                          autoFocus
                          onClick={e => e.stopPropagation()}
                        />
                        <button   className="h-8 w-8 p-0 text-green-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); handleUpdateTag(tag.id); }}>
                          <Check className="w-4 h-4" />
                        </button>
                        <button   className="h-8 w-8 p-0 text-red-400 cursor-pointer" onClick={(e) => { e.stopPropagation(); setEditingTagId(null); }}>
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <span className="w-2 h-2 rounded-full bg-blue-400 shadow-[0_0_10px_rgba(96,165,250,0.5)]"></span>
                          <span className="font-medium text-white">{tag.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button 
                             
                            className="h-8 w-8 p-0 text-gray-400  cursor-pointer" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setEditingTagId(tag.id); 
                              setEditingTagName(tag.name); 
                            }}
                          >
                            <Edit2 className="w-4 h-4 text-blue-400" />
                          </button>
                          <button 
                             
                            className="h-8 w-8 p-0 text-gray-400 cursor-pointer" 
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setDeleteTagId(tag.id); 
                            }}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
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

        {/* Contacts in Selected Tag */}
        <Card className="gradient-border border-none shadow-lg h-full flex flex-col relative overflow-hidden">
          {!selectedTag ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-gray-400 z-10 bg-black/20 backdrop-blur-sm">
              <Users className="w-16 h-16 mb-4 opacity-50" />
              <p>اختر تصنيفاً من القائمة لعرض وإدارة جهات الاتصال الخاصة به</p>
            </div>
          ) : (
             <>
                <CardHeader className="border-b border-white/10 pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center gap-2 text-base md:text-lg">
                      <UserPlus className="w-5 h-5 text-green-400" />
                      جهات الاتصال في: <span className="text-blue-400 font-bold">{selectedTagName}</span>
                    </CardTitle>
                    <span className="text-sm text-gray-400 bg-white/5 py-1 px-3 rounded-full">
                      {contactsInTag.length} جهة اتصال
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col h-full space-y-4 pt-4">
                  {/* Add Contact Section */}
                  <div className="bg-black/20 p-3 rounded-lg border border-white/10 space-y-3">
                    <label className="text-xs text-gray-400 font-medium">إضافة جهة اتصال لهذا التصنيف</label>
                    <div className="space-y-2">
                       <div className="relative">
                        <Search className="absolute right-3 top-3 w-4 h-4 text-gray-500" />
                        <Input 
                          className="bg-[#01191040] border-text-primary/30 text-white pr-10"
                          placeholder="ابحث لفلترة القائمة..."
                          value={contactSearch}
                          onChange={e => setContactSearch(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative">
                        <select
                          className="w-full h-10 px-3 bg-[#01191040] border border-text-primary/30 rounded-md text-white focus:outline-none focus:ring-1 focus:ring-blue-500 appearance-none"
                          value={selectedContactToAdd}
                          onChange={(e) => setSelectedContactToAdd(e.target.value)}
                        >
                          <option value="">-- اختر جهة اتصال --</option>
                          {filteredContactsForAdd.length === 0 ? (
                             <option disabled className="text-gray-500">لا توجد نتائج</option>
                          ) : (
                            filteredContactsForAdd.map((c) => (
                              <option key={c.contactNumber} value={c.contactNumber} className="text-black">
                                {c.contactName ? `${c.contactName} (${c.contactNumber})` : c.contactNumber}
                              </option>
                            ))
                          )}
                        </select>
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                           <Users className="w-4 h-4 text-gray-500" />
                        </div>
                      </div>
                    </div>
                    {selectedContactToAdd && (
                       <Button 
                        onClick={handleAddContactToTag} 
                        disabled={isAddingContact}
                        className="w-full primary-button"
                      >
                         {isAddingContact ? 'جاري الإضافة...' : 'تأكيد الإضافة'}
                      </Button>
                    )}
                  </div>
                  
                  {/* List of Contacts */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar pt-2 pr-1">
                    {loadingContacts ? (
                      <div className="text-center py-8 text-gray-400">جاري تحميل جهات الاتصال...</div>
                    ) : contactsInTag.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 flex flex-col items-center">
                        <Users className="w-10 h-10 mb-2 text-primary" />
                        <p>لا توجد جهات اتصال في هذا التصنيف</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {contactsInTag.map(contact => {
                          // Get full contact info from allContacts
                          const fullContact = allContacts.find(c => c.contactNumber === contact.contactNumber);
                          const displayName = fullContact?.contactName || contact.contactName || 'بدون اسم';
                          const profilePic = fullContact?.profilePicture;
                          
                          return (
                          <div 
                            key={contact.id} 
                            className="flex items-center justify-between p-3 rounded-lg bg-secondry/50 border border-white/5 hover:bg-secondry transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold overflow-hidden">
                                {profilePic ? (
                                  <img src={profilePic} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  displayName[0]?.toUpperCase() || '#'
                                )}
                              </div>
                              <div className="flex flex-col">
                                <span className="text-sm font-medium text-white">{displayName}</span>
                                <span className="text-xs text-gray-400 font-mono" dir="ltr">{contact.contactNumber}</span>
                              </div>
                            </div>
                            <button
                              className="w-8 h-8 text-gray-500 bg-black/20 rounded-full flex items-center justify-center"
                              onClick={() => setDeleteContactId(contact.contactNumber)}
                            >
                              <X className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </CardContent>
             </>
          )}
        </Card>
      </div>

       {/* Delete Tag Confirmation Dialog */}
       <Dialog open={!!deleteTagId} onOpenChange={(open) => !open && setDeleteTagId(null)}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle className="text-white">حذف التصنيف</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل أنت متأكد من حذف هذا التصنيف؟ لن يتم حذف جهات الاتصال، فقط إزالتها من هذا التصنيف.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setDeleteTagId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleDeleteTag}>حذف المهمة</Button>
          </DialogFooter>
        </DialogContent>
       </Dialog>

       {/* Remove Contact Confirmation Dialog */}
       <Dialog open={!!deleteContactId} onOpenChange={(open) => !open && setDeleteContactId(null)}>
        <DialogContent className="">
          <DialogHeader>
            <DialogTitle className="text-white">إزالة جهة الاتصال</DialogTitle>
            <DialogDescription className="text-gray-400">
              هل أنت متأكد من إزالة هذا الرقم من التصنيف؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" className="text-white hover:bg-white/10" onClick={() => setDeleteContactId(null)}>إلغاء</Button>
            <Button variant="destructive" onClick={handleRemoveContact}>إزالة</Button>
          </DialogFooter>
        </DialogContent>
       </Dialog>
    </div>
  );
}
