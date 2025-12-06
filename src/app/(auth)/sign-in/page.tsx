"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signInRequest, employeeLogin } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import Image from "next/image";

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
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
      setIsLoading(false);
      
      // Show success message
      setShowSuccess(true);
      
      // Redirect after 3 seconds
      setTimeout(() => {
        // كلاهما يذهب لنفس الصفحة - النظام سيخفي العناصر حسب الصلاحيات
        router.push("/dashboard");
      }, 3000);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // تأخير 3 ثواني قبل البدء في تسجيل الدخول
    setTimeout(() => {
      mutation.mutate();
    }, 3000);
  };

  const isSubmitting = isLoading || mutation.isPending;

  return (
    <>
    
    <div className="space-y-5 ">
      <div className="flex items-center justify-center flex-col gap-2">
        <h1 className="text-xl font-semibold text-white">تسجيل الدخول</h1>
        <p className="text-sm text-white">مرحباً بعودتك. يرجى إدخال بياناتك.</p>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">البريد الإلكتروني</label>
          <Input className="placeholder-white/60 text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">كلمة المرور</label>
          <Input className="placeholder-white/60 text-white" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
        <div className="flex items-center justify-between text-sm">
          <Link href="/forgot-password" className="text-gray-300 hover:underline">نسيت كلمة المرور؟</Link>
        </div>
        <Button className="w-full primary-button" disabled={isSubmitting || showSuccess}>
          {isSubmitting ? (
            <Loader 
              size="sm" 
              variant="warning" 
              
              fullScreen={false} 
             
            />
          ) : (
            "تسجيل الدخول"
          )}
        </Button>
        {mutation.isError && <p className="text-sm text-red-600">{(mutation.error as Error).message}</p>}
        {showSuccess && (
          <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-sm text-green-500 text-center font-medium">تم تسجيل الدخول بنجاح! </p>
          </div>
        )}
        <Link href="/sign-up" className="w-full primary-button after:bg-[#131240]">إنشاء حساب</Link>

      </form>
    </div>
    </>  );
}


