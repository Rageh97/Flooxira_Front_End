"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signInRequest } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => signInRequest(email, password),
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      router.push("/dashboard");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">تسجيل الدخول</h1>
        <p className="text-sm text-gray-600">مرحباً بعودتك. يرجى إدخال بياناتك.</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <div>
          <label className="block text-sm font-medium mb-1">البريد الإلكتروني</label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">كلمة المرور</label>
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link href="/sign-up" className="text-gray-700 hover:underline">إنشاء حساب</Link>
          <Link href="/forgot-password" className="text-gray-700 hover:underline">نسيت كلمة المرور؟</Link>
        </div>
        <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</Button>
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
      </form>
    </div>
  );
}


