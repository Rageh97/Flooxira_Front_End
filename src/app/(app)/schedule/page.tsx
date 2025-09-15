"use client";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { apiFetch, deletePostRequest, updatePostRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SchedulePage() {
  const [items, setItems] = useState<Array<{ id: number; content: string; scheduledAt?: string | null }>>([]);
  const [error, setError] = useState<string>("");
  useEffect(() => {
    const token = localStorage.getItem("auth_token") || "";
    apiFetch<{ posts: any[] }>("/api/posts?status=scheduled", { authToken: token })
      .then((res) => setItems(res.posts))
      .catch((e) => setError(e.message));
  }, []);
  async function saveOne(id: number, scheduledAt: string) {
    try {
      const token = localStorage.getItem("auth_token") || "";
      await updatePostRequest(token, id, { scheduledAt, status: "scheduled" });
      setItems((cur) => cur.map((p) => (p.id === id ? { ...p, scheduledAt } : p)));
    } catch (e: any) {
      setError(e.message);
    }
  }
  async function deleteOne(id: number) {
    try {
      const token = localStorage.getItem("auth_token") || "";
      await deletePostRequest(token, id);
      setItems((cur) => cur.filter((p) => p.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Schedule</h1>
      <Card>
        <CardHeader>Upcoming posts</CardHeader>
        <CardContent>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {items.length === 0 ? (
            <p className="text-sm text-gray-600">No scheduled posts.</p>
          ) : (
            <ul className="space-y-2">
              {items.map((p) => (
                <li key={p.id} className="rounded-md border border-gray-200 bg-white p-3 text-sm">
                  <div className="font-medium line-clamp-2">{p.content}</div>
                  <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="text-gray-500">{p.scheduledAt ? new Date(p.scheduledAt).toLocaleString() : "—"}</div>
                    <div className="flex items-center gap-2">
                      <Input type="datetime-local" defaultValue={p.scheduledAt ? new Date(p.scheduledAt).toISOString().slice(0, 16) : ""} onChange={(e) => setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, scheduledAt: e.target.value ? new Date(e.target.value).toISOString() : null } : x)))} />
                      <Button size="sm" onClick={() => saveOne(p.id, p.scheduledAt || new Date().toISOString())}>Save</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteOne(p.id)}>Delete</Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}



