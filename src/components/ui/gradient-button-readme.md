# GradientButton Component

كومبوننت زر متدرج مع تأثيرات بصرية متقدمة للاستخدام في أزرار التوليد والمعالجة.

## الميزات

- **تدرج متحرك**: حدود وخلفية متدرجة مع تأثير حركي
- **حالات متعددة**: دعم حالات التحميل والتعطيل
- **أحجام مختلفة**: sm, md, lg
- **أيقونات مخصصة**: دعم أيقونات التحميل والحالة العادية
- **نص عربي**: دعم كامل للنصوص العربية
- **تأثيرات hover**: سهم متحرك عند التمرير

## الاستخدام

```tsx
import { GradientButton } from "@/components/ui/gradient-button";
import { Sparkles, Loader2 } from "lucide-react";

<GradientButton
  onClick={handleGenerate}
  disabled={!prompt.trim()}
  loading={isGenerating}
  loadingText="جاري المعالجة..."
  loadingIcon={<Loader2 className="animate-spin" />}
  icon={<Sparkles />}
  size="lg"
>
  ابدأ التوليد
</GradientButton>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `onClick` | `() => void` | - | دالة النقر |
| `disabled` | `boolean` | `false` | حالة التعطيل |
| `loading` | `boolean` | `false` | حالة التحميل |
| `children` | `ReactNode` | - | نص الزر |
| `loadingText` | `string` | `"جاري المعالجة..."` | نص التحميل |
| `loadingIcon` | `ReactNode` | - | أيقونة التحميل |
| `icon` | `ReactNode` | - | أيقونة الحالة العادية |
| `className` | `string` | `""` | كلاسات إضافية |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | حجم الزر |
| `showArrow` | `boolean` | `true` | إظهار السهم |

## الألوان

- **التدرج الأساسي**: من البرتقالي (#ffaa40) إلى البنفسجي (#9c40ff)
- **الخلفية**: رمادي داكن (#212121)
- **التأثيرات**: ظلال داخلية وخارجية

## الصفحات المحدثة

تم تطبيق هذا الكومبوننت على جميع صفحات الـ AI:
- upscale, image, video, nano, avatar, bg-remove, colorize, edit, effects, image-to-text, lipsync, logo, motion, product, resize, restore, sketch, ugc, vupscale