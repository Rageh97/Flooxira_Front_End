"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordRequest } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const mutation = useMutation({
    mutationFn: () => resetPasswordRequest(email, token, password),
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">إعادة تعيين كلمة المرور</h1>
        <p className="text-sm text-gray-600">يرجى إدخال كلمة المرور الجديدة.</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (password !== confirm) return; mutation.mutate(); }}>
        <div>
          <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">الرمز</label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="الصق الرمز من البريد الإلكتروني/التطوير" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">كلمة المرور الجديدة</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">تأكيد كلمة المرور</label>
          <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" />
        </div>
        <Button className="w-full" disabled={mutation.isPending || password !== confirm}>{mutation.isPending ? "جاري إعادة التعيين..." : "إعادة تعيين كلمة المرور"}</Button>
        {password !== confirm && <p className="text-sm text-red-600">كلمات المرور غير متطابقة</p>}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        <div className="text-sm text-center"><Link href="/sign-in" className="text-gray-700 hover:underline">العودة لتسجيل الدخول</Link></div>
      </form>
    </div>
  );
}


