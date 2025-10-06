"use client";
import { useEffect, useMemo, useState } from "react";
import { listTags, createTag, deleteTag } from "@/lib/tagsApi";

export default function TelegramTagsPage() {
  const [tags, setTags] = useState<Array<{ id: number; name: string }>>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const token = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('auth_token') || '' : ''), []);

  async function load() {
    try {
      setLoading(true);
      setError("");
      const res = await listTags();
      if (res?.success) setTags(res.data || []);
      else setError(res?.message || 'Failed to load');
    } catch (e: any) {
      setError(e?.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      setLoading(true);
      const res = await createTag({ name: name.trim() });
      if (!res?.success) throw new Error(res?.message || 'Failed to create');
      setName("");
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to create');
    } finally { setLoading(false); }
  }

  async function handleDelete(id: number) {
    try {
      setLoading(true);
      const res = await deleteTag(id);
      if (!res?.success) throw new Error(res?.message || 'Failed to delete');
      await load();
    } catch (e: any) {
      setError(e?.message || 'Failed to delete');
    } finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <div className="bg-semidark-custom border border-gray-700 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-2">🏷️ Tags</h2>
        <p className="text-gray-300 text-sm">إنشاء وإدارة العلامات لاستخدامها في الحملات</p>
      </div>

      <div className="bg-semidark-custom border border-gray-700 rounded-lg p-6 space-y-4">
        <form onSubmit={handleCreate} className="flex gap-2">
          <input
            className="flex-1 px-3 py-2 rounded border border-gray-600 bg-gray-800 text-white"
            placeholder="اسم التاج"
            value={name}
            onChange={(e)=> setName(e.target.value)}
          />
          <button className="px-4 py-2 rounded bg-blue-600 text-white" disabled={loading || !name.trim()}>
            {loading ? 'Saving...' : 'Create'}
          </button>
        </form>
        {error && <div className="text-sm text-red-400">{error}</div>}
      </div>

      <div className="bg-semidark-custom border border-gray-700 rounded-lg p-6">
        {tags.length === 0 ? (
          <div className="text-gray-400 text-sm">لا توجد علامات بعد</div>
        ) : (
          <ul className="divide-y divide-gray-700">
            {tags.map(t => (
              <li key={t.id} className="py-3 flex items-center justify-between">
                <span className="text-white">{t.name}</span>
                <button onClick={()=> handleDelete(t.id)} className="px-3 py-1.5 rounded bg-red-600 text-white text-sm" disabled={loading}>حذف</button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}






