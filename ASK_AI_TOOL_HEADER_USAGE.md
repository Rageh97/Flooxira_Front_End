# دليل استخدام AskAIToolHeader Component

## نظرة عامة
كومبوننت موحد لجميع صفحات أدوات الذكاء الاصطناعي يوفر:
- زر الرجوع للصفحة الرئيسية
- عنوان الأداة مع badge اختياري للموديل
- قائمة التنقل (الرئيسية، شات GPT، الميديا)
- عرض رصيد الكريديت
- زر ترقية الباقة

## الاستيراد

```tsx
import AskAIToolHeader from "@/components/AskAIToolHeader";
```

## Props

```typescript
interface AskAIToolHeaderProps {
  title: string;              // عنوان الأداة (مطلوب)
  modelBadge?: string;         // اسم الموديل (اختياري)
  stats?: {                    // بيانات الكريديت (اختياري)
    isUnlimited: boolean;
    remainingCredits: number;
  } | null;
}
```

## أمثلة الاستخدام

### 1. نص إلى صورة (Image Generation)
```tsx
<AskAIToolHeader 
  title="نص إلى صورة"
  modelBadge="IMAGEN 4.0"
  stats={stats}
/>
```

### 2. نص إلى فيديو (Video Generation)
```tsx
<AskAIToolHeader 
  title="نص إلى فيديو"
  modelBadge="KLING 1.6"
  stats={stats}
/>
```

### 3. ترميم الصور (Image Restoration)
```tsx
<AskAIToolHeader 
  title="ترميم الصور"
  modelBadge="CLARITY AI"
  stats={stats}
/>
```

### 4. رفع جودة الصور (Image Upscale)
```tsx
<AskAIToolHeader 
  title="رفع جودة الصور"
  modelBadge="UPSCALE 4X"
  stats={stats}
/>
```

### 5. رفع جودة الفيديو (Video Upscale)
```tsx
<AskAIToolHeader 
  title="رفع جودة الفيديو"
  modelBadge="VIDEO ENHANCE"
  stats={stats}
/>
```

### 6. محاكاة الحركة (Motion Simulation)
```tsx
<AskAIToolHeader 
  title="محاكاة الحركة"
  modelBadge="MOTION AI"
  stats={stats}
/>
```

### 7. رسم الصور (Sketch to Image)
```tsx
<AskAIToolHeader 
  title="رسم الصور"
  modelBadge="SKETCH AI"
  stats={stats}
/>
```

### 8. إنشاء أفاتار (Avatar Creation)
```tsx
<AskAIToolHeader 
  title="إنشاء أفاتار"
  modelBadge="AVATAR AI"
  stats={stats}
/>
```

### 9. إنشاء لوجو (Logo Creation)
```tsx
<AskAIToolHeader 
  title="إنشاء لوجو"
  modelBadge="LOGO AI"
  stats={stats}
/>
```

### 10. بدون model badge
```tsx
<AskAIToolHeader 
  title="أداة مخصصة"
  stats={stats}
/>
```

## خطوات التطبيق على صفحة موجودة

### 1. إضافة الاستيراد
```tsx
import AskAIToolHeader from "@/components/AskAIToolHeader";
```

### 2. إزالة الاستيرادات غير المستخدمة
احذف هذه الاستيرادات إذا لم تعد مستخدمة في الصفحة:
```tsx
// احذف هذه
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, MessageSquare, Star, CreditCard } from "lucide-react";
```

### 3. استبدال الهيدر القديم
استبدل كل كود الهيدر القديم بـ:
```tsx
<AskAIToolHeader 
  title="عنوان الأداة"
  modelBadge="اسم الموديل"
  stats={stats}
/>
```

## الصفحات التي تحتاج التحديث

- ✅ `/ask-ai/image` - تم التحديث
- ⏳ `/ask-ai/video`
- ⏳ `/ask-ai/restore`
- ⏳ `/ask-ai/upscale`
- ⏳ `/ask-ai/vupscale`
- ⏳ `/ask-ai/motion`
- ⏳ `/ask-ai/sketch`
- ⏳ `/ask-ai/avatar`
- ⏳ `/ask-ai/logo`

## ملاحظات مهمة

1. **الكومبوننت يحتوي على**:
   - Sticky positioning (يبقى في الأعلى عند التمرير)
   - Backdrop blur effect
   - Responsive design (يخفي بعض العناصر على الشاشات الصغيرة)
   - Navigation links مع hover effects
   - Credit display مع animation

2. **لا تنسى**:
   - التأكد من وجود `stats` state في الصفحة
   - إزالة الاستيرادات غير المستخدمة بعد التحديث
   - اختبار الصفحة بعد التحديث

3. **التخصيص**:
   - يمكن تعديل الألوان والأنماط من ملف الكومبوننت مباشرة
   - يمكن إضافة props جديدة حسب الحاجة
