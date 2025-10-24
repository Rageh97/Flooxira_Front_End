'use client';

import React, { useState } from 'react';

interface TelegramStickersProps {
  isOpen: boolean;
  onClose: () => void;
  onStickerSelect: (stickerId: string) => void;
}

// مكتبة الملصقات الشائعة للتليجرام
const TELEGRAM_STICKERS = {
  // ملصقات تعبيرية
  emotions: [
    { id: "CAACAgIAAxkBAAIBY2Y...", emoji: "😊", name: "سعيد" },
    { id: "CAACAgIAAxkBAAIBZGY...", emoji: "😂", name: "ضحك" },
    { id: "CAACAgIAAxkBAAIBZWY...", emoji: "😍", name: "حب" },
    { id: "CAACAgIAAxkBAAIBZmY...", emoji: "😢", name: "حزين" },
    { id: "CAACAgIAAxkBAAIBZ2Y...", emoji: "😮", name: "متفاجئ" },
    { id: "CAACAgIAAxkBAAIBaGY...", emoji: "😴", name: "نعسان" },
    { id: "CAACAgIAAxkBAAIBaWY...", emoji: "🤔", name: "تفكير" },
    { id: "CAACAgIAAxkBAAIBamY...", emoji: "😎", name: "رائع" },
  ],
  
  // ملصقات إيموجي
  emojis: [
    { id: "CAACAgIAAxkBAAIBa2Y...", emoji: "👍", name: "موافق" },
    { id: "CAACAgIAAxkBAAIBbGY...", emoji: "👎", name: "غير موافق" },
    { id: "CAACAgIAAxkBAAIBbWY...", emoji: "❤️", name: "قلب أحمر" },
    { id: "CAACAgIAAxkBAAIBbmY...", emoji: "🔥", name: "نار" },
    { id: "CAACAgIAAxkBAAIBb2Y...", emoji: "⭐", name: "نجمة" },
    { id: "CAACAgIAAxkBAAIBcGY...", emoji: "🎉", name: "احتفال" },
    { id: "CAACAgIAAxkBAAIBcWY...", emoji: "💯", name: "مئة" },
    { id: "CAACAgIAAxkBAAIBcmY...", emoji: "🚀", name: "صاروخ" },
  ],
  
  // ملصقات حيوانات
  animals: [
    { id: "CAACAgIAAxkBAAIBc2Y...", emoji: "🐱", name: "قطة" },
    { id: "CAACAgIAAxkBAAIBdGY...", emoji: "🐶", name: "كلب" },
    { id: "CAACAgIAAxkBAAIBdWY...", emoji: "🐰", name: "أرنب" },
    { id: "CAACAgIAAxkBAAIBdmY...", emoji: "🐻", name: "دب" },
    { id: "CAACAgIAAxkBAAIBd2Y...", emoji: "🦊", name: "ثعلب" },
    { id: "CAACAgIAAxkBAAIBeGY...", emoji: "🐸", name: "ضفدع" },
    { id: "CAACAgIAAxkBAAIBeWY...", emoji: "🐧", name: "بطريق" },
    { id: "CAACAgIAAxkBAAIBemY...", emoji: "🦄", name: "حصان وحيد القرن" },
  ],
  
  // ملصقات طعام
  food: [
    { id: "CAACAgIAAxkBAAIBe2Y...", emoji: "🍕", name: "بيتزا" },
    { id: "CAACAgIAAxkBAAIBfGY...", emoji: "🍔", name: "برجر" },
    { id: "CAACAgIAAxkBAAIBfWY...", emoji: "🍰", name: "كيك" },
    { id: "CAACAgIAAxkBAAIBfmY...", emoji: "☕", name: "قهوة" },
    { id: "CAACAgIAAxkBAAIBf2Y...", emoji: "🍎", name: "تفاح" },
    { id: "CAACAgIAAxkBAAIBgGY...", emoji: "🍌", name: "موز" },
    { id: "CAACAgIAAxkBAAIBgWY...", emoji: "🍇", name: "عنب" },
    { id: "CAACAgIAAxkBAAIBgmY...", emoji: "🥑", name: "أفوكادو" },
  ],
  
  // ملصقات أنشطة
  activities: [
    { id: "CAACAgIAAxkBAAIBg2Y...", emoji: "⚽", name: "كرة قدم" },
    { id: "CAACAgIAAxkBAAIBhGY...", emoji: "🏀", name: "كرة سلة" },
    { id: "CAACAgIAAxkBAAIBhWY...", emoji: "🎮", name: "ألعاب" },
    { id: "CAACAgIAAxkBAAIBhmY...", emoji: "📚", name: "كتب" },
    { id: "CAACAgIAAxkBAAIBh2Y...", emoji: "🎵", name: "موسيقى" },
    { id: "CAACAgIAAxkBAAIBiGY...", emoji: "🎨", name: "فن" },
    { id: "CAACAgIAAxkBAAIBiWY...", emoji: "✈️", name: "سفر" },
    { id: "CAACAgIAAxkBAAIBimY...", emoji: "🏠", name: "منزل" },
  ]
};

export const TelegramStickers: React.FC<TelegramStickersProps> = ({
  isOpen,
  onClose,
  onStickerSelect
}) => {
  const [activeCategory, setActiveCategory] = useState<keyof typeof TELEGRAM_STICKERS>('emotions');

  if (!isOpen) return null;

  const categories = [
    { key: 'emotions' as const, name: 'تعبيرات', emoji: '😊' },
    { key: 'emojis' as const, name: 'إيموجي', emoji: '👍' },
    { key: 'animals' as const, name: 'حيوانات', emoji: '🐱' },
    { key: 'food' as const, name: 'طعام', emoji: '🍕' },
    { key: 'activities' as const, name: 'أنشطة', emoji: '⚽' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-4 max-w-2xl w-full mx-4 max-h-[80vh] overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">اختر ملصق</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        
        {/* تصنيفات الملصقات */}
        <div className="flex flex-wrap gap-2 mb-4">
          {categories.map((category) => (
            <button
              key={category.key}
              onClick={() => setActiveCategory(category.key)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-2 ${
                activeCategory === category.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{category.emoji}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
        
        {/* عرض الملصقات */}
        <div className="grid grid-cols-8 gap-2 max-h-96 overflow-y-auto">
          {TELEGRAM_STICKERS[activeCategory].map((sticker) => (
            <button
              key={sticker.id}
              onClick={() => {
                onStickerSelect(sticker.id);
                onClose();
              }}
              className="p-3 border border-gray-600 rounded-lg hover:bg-gray-700 hover:border-blue-500 transition-all duration-200 flex flex-col items-center gap-1 group"
              title={sticker.name}
            >
              <div className="text-2xl group-hover:scale-110 transition-transform duration-200">
                {sticker.emoji}
              </div>
              <div className="text-xs text-gray-400 text-center">
                {sticker.name}
              </div>
            </button>
          ))}
        </div>
        
        {/* ملاحظة */}
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/20 rounded-lg">
          <p className="text-blue-400 text-sm">
            💡 <strong>ملاحظة:</strong> هذه ملصقات تجريبية. يمكنك استبدال معرفات الملصقات بملصقات حقيقية من مجموعات التليجرام.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TelegramStickers;













