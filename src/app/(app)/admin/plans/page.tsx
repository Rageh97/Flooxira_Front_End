"use client";
import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { createPlan, deletePlan, listPlans, updatePlan, type Plan } from "@/lib/api";

type EditablePlan = Plan & { _editing?: boolean };

export default function PlansAdminPage() {
  const [items, setItems] = useState<EditablePlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [token, setToken] = useState<string>("");

  // Read token from localStorage only on the client
  useEffect(() => {
    if (typeof window !== "undefined") {
      setToken(localStorage.getItem("auth_token") || "");
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    listPlans(token)
      .then((res) => setItems(res.plans as EditablePlan[]))
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const [newPlan, setNewPlan] = useState<{ name: string; priceCents: number; interval: "monthly" | "yearly"; features: string; isActive: boolean }>({
    name: "",
    priceCents: 0,
    interval: "monthly",
    features: "",
    isActive: true,
  });

  function parseFeatures(input: string) {
    try {
      if (!input.trim()) return [] as any[];
      return JSON.parse(input);
    } catch {
      return input
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);
    }
  }

  async function handleCreate() {
    try {
      setError("");
      const res = await createPlan(token, {
        name: newPlan.name,
        priceCents: Number(newPlan.priceCents) || 0,
        interval: newPlan.interval,
        features: parseFeatures(newPlan.features),
        isActive: newPlan.isActive,
      });
      setItems((cur) => [res.plan as EditablePlan, ...cur]);
      setNewPlan({ name: "", priceCents: 0, interval: "monthly", features: "", isActive: true });
    } catch (e: any) {
      setError(e.message);
    }
  }

  function setEditing(id: number, editing: boolean) {
    setItems((cur) => cur.map((p) => (p.id === id ? { ...p, _editing: editing } : p)));
  }

  async function handleSave(p: EditablePlan) {
    try {
      setError("");
      const res = await updatePlan(token, p.id, {
        name: p.name,
        priceCents: p.priceCents,
        interval: p.interval,
        features: p.features,
        isActive: p.isActive,
      });
      setItems((cur) => cur.map((x) => (x.id === p.id ? { ...(res.plan as EditablePlan), _editing: false } : x)));
    } catch (e: any) {
      setError(e.message);
    }
  }

  async function handleDelete(id: number) {
    try {
      setError("");
      await deletePlan(token, id);
      setItems((cur) => cur.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e.message);
    }
  }

  return (
    <div className="space-y-8">
      <h2 className="text-lg font-semibold">Plan Management</h2>
      
      <Card>
        <CardHeader>Create a new plan</CardHeader>
        <CardContent className="space-y-3">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input placeholder="Name" value={newPlan.name} onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })} />
            <Input type="number" placeholder="Price (cents)" value={newPlan.priceCents} onChange={(e) => setNewPlan({ ...newPlan, priceCents: Number(e.target.value || 0) })} />
            <select className="h-10 rounded-md border border-gray-300 px-3 text-sm" value={newPlan.interval} onChange={(e) => setNewPlan({ ...newPlan, interval: e.target.value as any })}>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <select className="h-10 rounded-md border border-gray-300 px-3 text-sm" value={String(newPlan.isActive)} onChange={(e) => setNewPlan({ ...newPlan, isActive: e.target.value === "true" })}>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
          <Textarea placeholder="Features: JSON array or newline list" value={newPlan.features} onChange={(e) => setNewPlan({ ...newPlan, features: e.target.value })} />
          <Button onClick={handleCreate} disabled={loading || !newPlan.name}>Create plan</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>Your plans</CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-600">Loading...</p>
          ) : items.length === 0 ? (
            <p className="text-sm text-gray-600">No plans yet.</p>
          ) : (
            <ul className="space-y-3">
              {items.map((p) => (
                <li key={p.id} className="rounded-md border border-gray-200 p-3">
                  {p._editing ? (
                    <div className="grid grid-cols-1 gap-2 md:grid-cols-6">
                      <Input value={p.name} onChange={(e) => setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, name: e.target.value } : x)))} />
                      <Input type="number" value={p.priceCents} onChange={(e) => setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, priceCents: Number(e.target.value || 0) } : x)))} />
                      <select className="h-10 rounded-md border border-gray-300 px-3 text-sm" value={p.interval} onChange={(e) => setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, interval: e.target.value as any } : x)))}>
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                      </select>
                      <select className="h-10 rounded-md border border-gray-300 px-3 text-sm" value={String(p.isActive)} onChange={(e) => setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, isActive: e.target.value === "true" } : x)))}>
                        <option value="true">Active</option>
                        <option value="false">Inactive</option>
                      </select>
                      <Textarea className="md:col-span-2" value={Array.isArray(p.features) ? p.features.join("\n") : String(p.features ?? "")} onChange={(e) => setItems((cur) => cur.map((x) => (x.id === p.id ? { ...x, features: parseFeatures(e.target.value) } : x)))} />
                      <div className="col-span-full flex gap-2 pt-1">
                        <Button onClick={() => handleSave(p)} size="sm">Save</Button>
                        <Button variant="secondary" size="sm" onClick={() => setEditing(p.id, false)}>Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="text-sm font-medium">{p.name} {p.isActive ? <span className="ml-2 rounded bg-green-100 px-2 py-0.5 text-xs text-green-800">Active</span> : <span className="ml-2 rounded bg-gray-100 px-2 py-0.5 text-xs text-gray-600">Inactive</span>}</div>
                        <div className="text-xs text-gray-600">{p.interval} • {(p.priceCents / 100).toLocaleString(undefined, { style: "currency", currency: "USD" })}</div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setEditing(p.id, true)}>Edit</Button>
                        <Button size="sm" variant="destructive" onClick={() => handleDelete(p.id)}>Delete</Button>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


