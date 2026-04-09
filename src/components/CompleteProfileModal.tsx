"use client";
import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { updateProfile } from "@/lib/api";
import { Button } from "@/components/ui/button";
import Loader from "@/components/Loader";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import { toast } from "sonner";
import { PhoneNumberUtil } from "google-libphonenumber";
import { AlertCircle } from "lucide-react";

const phoneUtil = PhoneNumberUtil.getInstance();

export default function CompleteProfileModal() {
  const { user, refreshUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [valid, setValid] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Check if we need to show the modal (delay slightly to let user load)
  useEffect(() => {
    if (user && (user.role === 'user' || user.role === 'admin')) {
      if (!user.phone || user.phone.trim() === '') {
        setIsOpen(true);
      } else {
        setIsOpen(false);
      }
    }
  }, [user]);

  if (!isOpen) return null;

  const validatePhone = (phoneNumber: string) => {
    try {
      const number = phoneUtil.parseAndKeepRawInput("+" + phoneNumber);
      return phoneUtil.isValidNumber(number);
    } catch (e) {
      return false;
    }
  };

  const handleChange = (value: string, data: any) => {
    let finalValue = value;
    // Remove leading zero if user types it after the country code
    if (data && data.dialCode && value.startsWith(data.dialCode + '0')) {
      finalValue = data.dialCode + value.substring(data.dialCode.length + 1);
    }
    setPhone(finalValue);
    setValid(validatePhone(finalValue));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) {
      toast.error("يرجى إدخال رقم الهاتف");
      return;
    }
    if (!validatePhone(phone)) {
      toast.error("يرجى إدخال رقم هاتف صحيح");
      return;
    }

    const token = localStorage.getItem("auth_token");
    if (!token) return;

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("phone", "+" + phone);
      
      const res = await updateProfile(token, formData);
      if (res.success) {
        toast.success("تم تحديث البيانات بنجاح");
        setIsOpen(false);
        // تحديث المستخدم في الكاش
        await refreshUser();
      } else {
        toast.error(res.message || "حدث خطأ أثناء التحديث");
      }
    } catch (err: any) {
      toast.error(err?.message || "حدث خطأ أثناء التحديث");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-secondry border border-gray-600/50 rounded-2xl p-6 w-full max-w-md shadow-2xl relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/10 rounded-full blur-2xl -ml-10 -mb-10" />
        
        <div className="relative z-10 mt-5">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-orange-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
              <AlertCircle className="w-8 h-8  text-orange-500" />
            </div>
          </div>
          
          <h2 className="text-xl font-bold text-white text-center mb-2">استكمال التسجيل</h2>
          <p className="text-sm text-gray-300 text-center mb-6">
            مرحباً {user?.name}، يرجى إدخال رقم الهاتف الخاص بك لاستكمال إنشاء الحساب والبدء في استخدام المنصة.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-white text-right">رقم الهاتف <span className="text-red-500">*</span></label>
              <div dir="ltr" className="phone-input-wrapper w-full">
                <PhoneInput
                  country={"sa"}
                  value={phone}
                  onChange={handleChange}
                  enableSearch={true}
                  searchPlaceholder="ابحث عن الدولة..."
                  placeholder="5x xxx xxxx"
                  countryCodeEditable={false}
                  inputClass="!w-full !bg-transparent !text-white !border-gray-600/50"
                  buttonClass="!bg-transparent !border-gray-600/50"
                  dropdownClass="!bg-secondry !text-white"
                  inputStyle={{ direction: 'ltr', width: '100%' }}
                  masks={{ sa: '.. ... ....', eg: '... ... ....' }}
                />
              </div>
              {!valid && phone.length > 3 && (
                <p className="text-xs text-red-500 mt-1 text-right">رقم الهاتف المدخل غير صحيح</p>
              )}
            </div>

            <Button 
              type="submit" 
              data-bypass="true"
              className="w-full primary-button text-white font-bold h-12" 
              disabled={isLoading || !phone || !valid}
            >
              {isLoading ? (
                <Loader size="sm" variant="warning" fullScreen={false} />
              ) : (
                "حفظ البيانات والمتابعة"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
