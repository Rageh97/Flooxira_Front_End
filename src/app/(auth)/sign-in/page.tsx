"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signInRequest, employeeLogin } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: async () => {
      // يحاول تسجيل الدخول كموظف أولاً
      try {
        const employeeData = await employeeLogin(email, password);
        if (employeeData.success) {
          return { ...employeeData, userType: 'employee' };
        }
      } catch (error) {
        // ليس موظف، يحاول كمالك عادي
      }
      
      // يحاول تسجيل الدخول كمالك عادي
      const ownerData = await signInRequest(email, password);
      return { ...ownerData, userType: 'owner' };
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      
      // كلاهما يذهب لنفس الصفحة - النظام سيخفي العناصر حسب الصلاحيات
      router.push("/dashboard");
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">تسجيل الدخول</h1>
        <p className="text-sm text-white">مرحباً بعودتك. يرجى إدخال بياناتك.</p>
      </div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">البريد الإلكتروني</label>
          <Input className="placeholder-white/60 text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">كلمة المرور</label>
          <Input className="placeholder-white/60 text-white" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link href="/sign-up" className="text-gray-300 hover:underline">إنشاء حساب</Link>
          <Link href="/forgot-password" className="text-gray-300 hover:underline">نسيت كلمة المرور؟</Link>
        </div>
        <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "جاري تسجيل الدخول..." : "تسجيل الدخول"}</Button>
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
      </form>
    </div>
  );
}


