import { useState } from 'react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, onClose }) => {
  const commonEmojis = [
    '👍', '❤️', '😂', '😮', '😢', '😡',
    '🎉', '🔥', '👏', '💯', '🤔', '👀',
    '🙏', '😍', '🤗', '😅', '😊', '🥳'
  ];

  return (
    <div className="absolute bottom-full mb-2 left-0 bg-white rounded-xl shadow-xl border border-gray-100 p-2 z-50">
      <div className="grid grid-cols-6 gap-1">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-xl"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;