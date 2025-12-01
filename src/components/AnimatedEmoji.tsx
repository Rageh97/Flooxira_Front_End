'use client';

import React from 'react';
import EmojiPicker from 'emoji-picker-react';

interface AnimatedEmojiProps {
  emoji: string;
  size?: number;
  className?: string;
  onClick?: () => void;
}

const AnimatedEmoji: React.FC<AnimatedEmojiProps> = ({ 
  emoji, 
  size = 24, 
  className = '', 
  onClick 
}) => {
  return (
    <div 
      className={`inline-block cursor-pointer transition-all duration-300 hover:scale-110 hover:rotate-12 ${className}`}
      onClick={onClick}
      style={{ fontSize: `${size}px` }}
    >
      {emoji}
    </div>
  );
};

interface EmojiPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
}

export const EmojiPickerModal: React.FC<EmojiPickerModalProps> = ({
  isOpen,
  onClose,
  onEmojiSelect
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg p-4 max-w-md w-full mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">اختر إيموجي</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji);
            onClose();
          }}
          width="100%"
          height={400}
          searchDisabled={false}
          skinTonesDisabled={false}
          previewConfig={{
            showPreview: true,
            defaultEmoji: '1f60a',
            defaultCaption: 'اختر إيموجي'
          }}
        />
      </div>
    </div>
  );
};

interface EmojiPickerInlineProps {
  isOpen: boolean;
  onClose: () => void;
  onEmojiSelect: (emoji: string) => void;
  position?: 'top' | 'bottom';
}

export const EmojiPickerInline: React.FC<EmojiPickerInlineProps> = ({
  isOpen,
  onClose,
  onEmojiSelect,
  position = 'bottom'
}) => {
  if (!isOpen) return null;

  return (
    <div className={`relative ${position === 'top' ? 'mb-2' : 'mt-2'}`}>
      <div className="bg-gray-900 rounded-lg p-4 border border-gray-700 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-white">اختر إيموجي</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl transition-colors"
            title="إغلاق"
          >
            ×
          </button>
        </div>
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            onEmojiSelect(emojiData.emoji);
            // لا نغلق تلقائياً - المستخدم يغلق يدوياً
          }}
          width="100%"
          height={400}
          searchDisabled={false}
          skinTonesDisabled={false}
          previewConfig={{
            showPreview: true,
            defaultEmoji: '1f60a',
            defaultCaption: 'اختر إيموجي'
          }}
        />
      </div>
    </div>
  );
};

export default AnimatedEmoji;