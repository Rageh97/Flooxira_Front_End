"use client";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { resetPasswordRequest } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const emailParam = params.get("email");
      const tokenParam = params.get("token");
      if (emailParam) setEmail(emailParam);
      if (tokenParam) setToken(tokenParam);
      if (params.get("sent") === "true") setSent(true);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: () => resetPasswordRequest(email, token, password),
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">إعادة تعيين كلمة المرور</h1>
        <p className="text-sm text-gray-200">يرجى إدخال كلمة المرور الجديدة.</p>
      </div>
      {sent && !mutation.isSuccess && (
        <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm text-center border border-green-200">
          تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني بنجاح. يرجى إدخاله في الحقل أدناه.
        </div>
      )}
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); if (password !== confirm) return; mutation.mutate(); }}>
        <div>
          <label className="block text-sm text-white font-medium mb-1">البريد الإلكتروني</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="block text-sm text-white font-medium mb-1">الرمز</label>
          <Input value={token} onChange={(e) => setToken(e.target.value)} placeholder="الصق الرمز من البريد الإلكتروني" />
        </div>
        <div>
          <label className="block text-sm text-white font-medium mb-1">كلمة المرور الجديدة</label>
          <div className="relative">
            <Input 
              className="placeholder-white/60 text-white pl-10" 
              type={showPassword ? "text" : "password"} 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="••••••••" 
            />
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <div>
          <label className="block text-sm text-white font-medium mb-1">تأكيد كلمة المرور</label>
          <div className="relative">
            <Input 
              className="placeholder-white/60 text-white pl-10" 
              type={showConfirm ? "text" : "password"} 
              value={confirm} 
              onChange={(e) => setConfirm(e.target.value)} 
              placeholder="••••••••" 
            />
            <button
              type="button"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors"
              onClick={() => setShowConfirm(!showConfirm)}
            >
              {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <Button className="w-full" disabled={mutation.isPending || password !== confirm}>{mutation.isPending ? "جاري إعادة التعيين..." : "إعادة تعيين كلمة المرور"}</Button>
        {password !== confirm && <p className="text-sm text-red-600">كلمات المرور غير متطابقة</p>}
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        {mutation.isSuccess && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm text-center border border-green-200">
            تمت إعادة تعيين كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول.
          </div>
        )}
        <div className="text-sm text-center"><Link href="/sign-in" className="text-gray-200 hover:underline">العودة لتسجيل الدخول</Link></div>
      </form>
    </div>
  );
}


