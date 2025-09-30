"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { listContentCategories, createContentCategory, deleteContentCategory, ContentCategory } from "@/lib/api";

export default function ContentHomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<ContentCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const token = typeof window !== 'undefined' ? (localStorage.getItem("auth_token") || "") : "";

  const load = async () => {
    try {
      const res = await listContentCategories(token);
      setCategories(res.categories);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const onCreate = async () => {
    if (!name.trim()) return;
    await createContentCategory(token, { name, description });
    setName("");
    setDescription("");
    await load();
  };

  const onDelete = async (id: number) => {
    if (!confirm("Delete this category?")) return;
    await deleteContentCategory(token, id);
    await load();
  };

  return (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-semibold">Content</h1>

      <Card className="bg-card border-none">
        <CardHeader>
          <h3 className="text-lg font-semibold">Create Category</h3>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          <Textarea placeholder="Description (optional)" value={description} onChange={(e) => setDescription(e.target.value)} />
          <Button onClick={onCreate} className="button-primary">Create</Button>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="p-6">Loading...</div>
        ) : categories.length === 0 ? (
          <div className="p-6">No categories yet</div>
        ) : (
          categories.map((c) => (
            <Card key={c.id} className="bg-card border-none">
              <div 
                role="button" 
                className="cursor-pointer hover:bg-gray-800/40 transition-colors rounded-lg"
                onClick={() => router.push(`/content/${c.id}`)}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="text-lg font-semibold">{c.name}</div>
                    <Button 
                      variant="secondary" 
                      className="bg-red-600 text-white"
                      onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
                    >
                      Delete
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-300">{c.description || 'No description'}</p>
                  <div className="mt-2 text-xs text-gray-500">Click anywhere on the card to open</div>
                </CardContent>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}


