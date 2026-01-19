"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signUpRequest } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import Image from "next/image";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import "../../phone-input.css";
import { toast } from "sonner";
import { PhoneNumberUtil } from "google-libphonenumber";

const phoneUtil = PhoneNumberUtil.getInstance();

export default function SignUpPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [valid, setValid] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const validatePhone = (phoneNumber: string) => {
    try {
      // Add '+' if missing for libphonenumber parsing
      const number = phoneUtil.parseAndKeepRawInput("+" + phoneNumber);
      return phoneUtil.isValidNumber(number);
    } catch (e) {
      return false;
    }
  };

  const mutation = useMutation({
    mutationFn: () => {
      if (!validatePhone(phone)) {
        throw new Error("رقم الهاتف المدخل غير صحيح");
      }
      return signUpRequest(name, email, "+" + phone, password);
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      localStorage.removeItem("auth_token");
      setShowSuccess(true);
      setTimeout(() => {
        router.push("/sign-in");
      }, 3000);
    },
    onError: (error: any) => {
      toast.error(error.message || "حدث خطأ أثناء إنشاء الحساب");
    }
  });

  const [password, setPassword] = useState("");

  const handleChange = (value: string, data: any) => {
    setPhone(value);
    setValid(validatePhone(value));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !phone || !password) {
      toast.error("يرجى ملء جميع الحقول المطلوبة");
      return;
    }
    
    if (!validatePhone(phone)) {
      toast.error("يرجى إدخال رقم هاتف صحيح");
      return;
    }
    
    mutation.mutate();
  };

  return (
    <div className="space-y-6 ">
      <div>
        <Image src="/Logo.gif" alt="logo" width={400} height={100} />
      </div>
      <div>
        <h1 className="text-xl font-semibold text-white">إنشاء حساب</h1>
      </div>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">الاسم</label>
          <Input className="placeholder-white/60 text-white" value={name} onChange={(e) => setName(e.target.value)} placeholder="اسمك" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">البريد الإلكتروني</label>
          <Input className="placeholder-white/60 text-white" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@example.com" required />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">رقم الهاتف</label>
          <div dir="ltr" className="phone-input-wrapper">
            <PhoneInput
              country={"sa"}
              value={phone}
              onChange={handleChange}
              enableSearch={false}
              placeholder="05x xxx xxxx"
              inputStyle={{ direction: 'ltr' }}
              masks={{ sa: '.. ... ....', eg: '... ... ....' }}
            />
          </div>
          {!valid && phone.length > 3 && (
            <p className="text-xs text-red-500 mt-1">رقم الهاتف غير صحيح لهذه الدولة</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-medium mb-1 text-white">كلمة المرور</label>
          <Input className="placeholder-white/60 text-white" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required />
        </div>
        <div className="text-sm text-white">لديك حساب بالفعل؟ <Link href="/sign-in" className="text-gray-300 hover:underline">تسجيل الدخول</Link></div>
        <Button className="w-full primary-button" disabled={mutation.isPending || showSuccess}>
          {mutation.isPending ? <Loader size="lg" variant="warning" fullScreen={false} className="py-16" /> : "إنشاء حساب"}
        </Button>
        {mutation.isError && <p className="text-sm text-red-600 mt-2">{(mutation.error as Error).message}</p>}
        {showSuccess && (
          <div className="p-4 bg-green-500/20 border border-green-500 rounded-lg">
            <p className="text-sm text-green-500 text-center font-medium">تم إنشاء الحساب بنجاح!</p>
          </div>
        )}
      </form>
    </div>
  );
}
