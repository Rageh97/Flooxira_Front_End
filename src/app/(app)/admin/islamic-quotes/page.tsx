"use client";
import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { IslamicQuote, getAllIslamicQuotes, createIslamicQuote, updateIslamicQuote, deleteIslamicQuote } from "@/lib/islamicQuoteApi";
import { Trash2, Plus, Stars } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export default function IslamicQuotesSettings() {
  const [quotes, setQuotes] = useState<IslamicQuote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newQuote, setNewQuote] = useState({ content: '', type: 'ayah' as 'ayah' | 'hadith', isActive: true, displayInterval: 30 });

  const fetchQuotes = async () => {
    try {
      const data = await getAllIslamicQuotes();
      if (data.success) {
        setQuotes(data.quotes);
      }
    } catch (error) {
      toast.error("فشل في تحميل البيانات");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuotes();
  }, []);

  const handleCreate = async () => {
    if (!newQuote.content) {
      toast.error("يرجى إدخال النص");
      return;
    }
    try {
      const res = await createIslamicQuote(newQuote);
      if (res.success) {
        toast.success("تمت الإضافة بنجاح");
        setNewQuote({ content: '', type: 'ayah', isActive: true, displayInterval: 30 });
        fetchQuotes();
      }
    } catch (error) {
      toast.error("فشل في الإضافة");
    }
  };

  const handleToggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await updateIslamicQuote(id, { isActive: !currentStatus });
      if (res.success) {
        toast.success("تم تحديث الحالة");
        fetchQuotes();
      }
    } catch (error) {
      toast.error("فشل في تحديث الحالة");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("هل أنت متأكد من الحذف؟")) return;
    try {
      const res = await deleteIslamicQuote(id);
      if (res.success) {
        toast.success("تم الحذف بنجاح");
        fetchQuotes();
      }
    } catch (error) {
      toast.error("فشل في الحذف");
    }
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-2">
        <Stars className="text-primary" />
        إدارة الأذكار والأحاديث
      </h1>

      <Card className="bg-secondry border-none inner-shadow">
        <CardHeader>
          <CardTitle className="text-white text-lg">إضافة جديد</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-[2]">
              <Input 
                value={newQuote.content}
                onChange={(e) => setNewQuote({ ...newQuote, content: e.target.value })}
                placeholder="أدخل الآية أو الحديث هنا..."
                className="bg-fixed-40 border-none text-white h-12"
              />
            </div>
            <div className="w-full md:w-32">
              <Input 
                type="number"
                value={newQuote.displayInterval}
                onChange={(e) => setNewQuote({ ...newQuote, displayInterval: parseInt(e.target.value) || 30 })}
                placeholder="الثواني"
                className="bg-fixed-40 border-none text-white h-12"
                title="وقت العرض بالثواني"
              />
            </div>
            <div className="w-full md:w-48">
              <Select 
                value={newQuote.type} 
                onValueChange={(v) => setNewQuote({ ...newQuote, type: v as any })}
              >
                <SelectTrigger className="bg-fixed-40 border-none text-white h-12">
                  <SelectValue placeholder="النوع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ayah">آية قرآنية</SelectItem>
                  <SelectItem value="hadith">حديث شريف</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreate} className="primary-button h-12 px-8">
              <Plus className="ml-2 w-4 h-4" /> إضافة
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {quotes.map((quote) => (
          <Card key={quote.id} className="bg-secondry border-none inner-shadow hover:bg-light-custom/10 transition-colors">
            <CardContent className="p-4 flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${quote.type === 'ayah' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'}`}>
                    {quote.type === 'ayah' ? 'آية' : 'حديث'}
                  </span>
                  <span className="text-[10px] text-gray-500">{new Date(quote.createdAt).toLocaleDateString('ar-SA')}</span>
                  <span className="text-[10px] text-primary">كل {quote.displayInterval} ثانية</span>
                </div>
                <p className="text-white text-sm leading-relaxed">{quote.content}</p>
              </div>
              <div className="flex flex-col gap-2 items-center">
                <Switch 
                  checked={quote.isActive} 
                  onCheckedChange={() => handleToggleActive(quote.id, quote.isActive)}
                />
                <Button 
                  onClick={() => handleDelete(quote.id)}
                  size="sm" 
                  variant="ghost" 
                  className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      
      {quotes.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-400">
          لا يوجد أذكار مضافة حالياً.
        </div>
      )}
    </div>
  );
}
