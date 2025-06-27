interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  onClose: () => void;
  isOwn?: boolean;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({
  onEmojiSelect,
  onClose,
  isOwn,
}) => {
  const commonEmojis = ["👍", "❤️", "😂", "😮", "🎉"];

  return (
    <div
      className={`absolute bottom-full mb-2 ${
        isOwn ? "right-0" : "left-0"
      } bg-white rounded-xl shadow-xl border border-gray-100 p-3 z-50`}
    >
      <div className="flex gap-2">
        {commonEmojis.map((emoji) => (
          <button
            key={emoji}
            onClick={() => {
              onEmojiSelect(emoji);
              onClose();
            }}
            className="w-11 h-11 flex items-center justify-center hover:bg-gray-100 rounded-lg transition-colors text-2xl"
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  );
};

export default EmojiPicker;
