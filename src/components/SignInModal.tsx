"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { signInRequest, employeeLogin, googleSignInRequest } from "@/lib/api";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import Image from "next/image";
import { Eye, EyeOff, X } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { BorderBeam } from "@/components/ui/border-beam";
import { Card } from "@/components/ui/card";
import Link from "next/link";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SignInModal({ isOpen, onClose }: SignInModalProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: async () => {
      try {
        const employeeData = await employeeLogin(email, password);
        if (employeeData.success) {
          return { ...employeeData, userType: 'employee' };
        }
      } catch (error) {}
      
      const ownerData = await signInRequest(email, password);
      return { ...ownerData, userType: 'owner' };
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const googleMutation = useMutation({
    mutationFn: async (credential: string) => {
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
      return googleSignInRequest(credential, clientId);
    },
    onSuccess: (data) => {
      localStorage.setItem("auth_token", data.token);
      setIsLoading(false);
      setShowSuccess(true);
      setTimeout(() => {
        onClose();
        window.location.reload();
      }, 1000);
    },
    onError: () => {
      setIsLoading(false);
    },
  });

  const handleGoogleSuccess = (credentialResponse: any) => {
    setIsLoading(true);
    if (credentialResponse.credential) {
      googleMutation.mutate(credentialResponse.credential);
    } else {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    setTimeout(() => {
      mutation.mutate();
    }, 1500);
  };

  const isSubmitting = isLoading || mutation.isPending || googleMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 border-0 bg-transparent shadow-none overflow-hidden sm:rounded-3xl">
        <Card className="relative overflow-hidden w-full p-6 bg-secondry border-0 z-30">
          <BorderBeam size={250} duration={12} delay={9} />
          
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-white/40 hover:text-white z-40 transition-colors"
          >
            <X size={20} />
          </button>

          <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID"}>
            <div className="space-y-4 relative z-10">
              <div>
                <Image src="/Logoo.png" alt="logo" width={400} height={100} priority />
              </div>
              
              <div className="flex items-center justify-center flex-col gap-1">
                <h1 className="text-xl font-semibold text-white">تسجيل الدخول</h1>
                <p className="text-sm text-white/80">مرحباً بعودتك. يرجى إدخال بياناتك.</p>
              </div>

              <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium mb-1 text-white">البريد الإلكتروني</label>
                  <Input 
                    className="placeholder-white/60 text-white bg-white/5 border-white/10" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="name@example.com" 
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-white">كلمة المرور</label>
                  <div className="relative">
                    <Input 
                      className="placeholder-white/60 text-white pl-10 bg-white/5 border-white/10" 
                      type={showPassword ? "text" : "password"} 
                      value={password} 
                      onChange={(e) => setPassword(e.target.value)} 
                      placeholder="••••••••" 
                      required
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

                <div className="flex items-center justify-between text-sm">
                  <Link href="/forgot-password" onClick={onClose} className="text-gray-300 hover:underline">نسيت كلمة المرور؟</Link>
                </div>

                <Button className="w-full primary-button h-11" disabled={isSubmitting || showSuccess}>
                  {isSubmitting ? <Loader size="sm" variant="warning" fullScreen={false} /> : "تسجيل الدخول"}
                </Button>

                <div className="flex items-center justify-center my-4">
                   <div className="w-full h-px bg-white/20"></div>
                   <span className="px-2 text-white/80 text-sm">أو</span>
                   <div className="w-full h-px bg-white/20"></div>
                </div>

                <div className="flex justify-center w-full">
                   <GoogleLogin
                     onSuccess={handleGoogleSuccess}
                     onError={() => console.error('Google Login Failed')}
                     theme="filled_black"
                     shape="pill"
                   />
                </div>

                {(mutation.isError || googleMutation.isError) && (
                  <p className="text-xs text-red-500 text-center mt-2 bg-red-500/10 py-2 rounded-lg">
                    {(mutation.error || googleMutation.error)?.message || "فشل تسجيل الدخول"}
                  </p>
                )}

                {showSuccess && (
                  <div className="p-3 bg-green-500/20 border border-green-500 rounded-xl">
                    <p className="text-sm text-green-500 text-center font-medium">تم تسجيل الدخول بنجاح!</p>
                  </div>
                )}

                <Link href="/sign-up" onClick={onClose} className="w-full primary-button block text-center after:bg-[#131240]">إنشاء حساب</Link>
              </form>
            </div>
          </GoogleOAuthProvider>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
