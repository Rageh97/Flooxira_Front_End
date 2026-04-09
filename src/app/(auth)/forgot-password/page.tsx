"use client";
import Link from "next/link";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { forgotPasswordRequest } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => forgotPasswordRequest(email),
    onSuccess: (data) => {
      let url = `/reset-password?email=${encodeURIComponent(email)}`;
      if (data?.token) url += `&token=${data.token}`;
      else url += `&sent=true`;
      router.push(url);
    }
  });
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl text-white font-semibold">نسيت كلمة المرور</h1>
        <p className="text-sm text-gray-200">سنرسل لك رمز إعادة تعيين عبر البريد الإلكتروني إذا كان هناك حساب متاح.</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <div>
          <label className="block text-white text-sm font-medium mb-1">البريد الإلكتروني</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "جاري الإرسال..." : "إرسال رمز إعادة التعيين"}</Button>
        {mutation.isSuccess && mutation.data?.token && (
          <p className="text-xs text-gray-600">رمز التطوير: <span className="font-mono">{mutation.data.token}</span></p>
        )}
        {mutation.isSuccess && !mutation.data?.token && (
          <div className="p-3 bg-green-50 text-green-700 rounded-md text-sm text-center border border-green-200 space-y-2">
            <p>تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني بنجاح.</p>
            <Link href="/reset-password" className="inline-block mt-2 font-bold underline">
              الذهاب لصفحة إعادة التعيين لإدخال الرمز
            </Link>
          </div>
        )}
        <div className="text-sm text-center"><Link href="/sign-in" className="text-gray-700 hover:underline">العودة لتسجيل الدخول</Link></div>
      </form>
    </div>
  );
}


