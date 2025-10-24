"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signUpRequest } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const mutation = useMutation({
    mutationFn: () => signUpRequest(name, email, phone, password),
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      // After successful sign up, require explicit sign in
      localStorage.removeItem("auth_token");
      router.push("/sign-in");
    },
  });

  return (
    <div className="space-y-6 ">
      <div>
        <h1 className="text-xl font-semibold text-white">إنشاء حساب</h1>
      </div>
      <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); mutation.mutate(); }}>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">الاسم</label>
          <Input className="placeholder-white/60 text-white"  value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">البريد الإلكتروني</label>
          <Input className="placeholder-white/60 text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">رقم الهاتف</label>
          <Input className="placeholder-white/60 text-white" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+1234567890" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">كلمة المرور</label>
          <Input className="placeholder-white/60 text-white" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="text-sm text-white">لديك حساب بالفعل؟ <Link href="/sign-in" className="text-gray-300 hover:underline">تسجيل الدخول</Link></div>
        <Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "جاري الإنشاء..." : "إنشاء حساب"}</Button>
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
      </form>
    </div>
    
  );
}


