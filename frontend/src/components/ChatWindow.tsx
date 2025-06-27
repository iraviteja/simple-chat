import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Image, FileText, Film } from "lucide-react";
import type { User, Group, Message } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
import api from "../services/api";
import MessageBubble from "./MessageBubble";

interface ChatWindowProps {
  chatType: "user" | "group";
  chatData: User | Group;
}

interface MessageData {
  content: string;
  type: "text" | "image" | "pdf" | "video";
  receiver?: string;
  group?: string;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chatType, chatData }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [typing, setTyping] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { user } = useAuth();
  const {
    socket,
    sendMessage,
    typing: emitTyping,
    stopTyping,
    onlineUsers,
  } = useSocket();

  useEffect(() => {
    fetchMessages();
  }, [chatData._id]);

  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (message: Message) => {
      if (
        (chatType === "user" &&
          (message.sender._id === chatData._id ||
            message.receiver?._id === chatData._id)) ||
        (chatType === "group" && message.group?._id === chatData._id)
      ) {
        setMessages((prev) => [...prev, message]);
      }
    };

    const handleTyping = ({ user: userId }: { user: string }) => {
      if (chatType === "user" && userId === chatData._id) {
        setOtherTyping(true);
      }
    };

    const handleStopTyping = ({ user: userId }: { user: string }) => {
      if (chatType === "user" && userId === chatData._id) {
        setOtherTyping(false);
      }
    };

    const handleMessageEdit = (message: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m))
      );
    };

    const handleMessageDelete = (message: Message) => {
      setMessages((prev) =>
        prev.map((m) => (m._id === message._id ? message : m))
      );
    };

    socket.on("receive-message", handleNewMessage);
    socket.on("message-sent", handleNewMessage);
    socket.on("user-typing", handleTyping);
    socket.on("user-stop-typing", handleStopTyping);
    socket.on("message-edited", handleMessageEdit);
    socket.on("message-deleted", handleMessageDelete);

    return () => {
      socket.off("receive-message", handleNewMessage);
      socket.off("message-sent", handleNewMessage);
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
      socket.off("message-edited", handleMessageEdit);
      socket.off("message-deleted", handleMessageDelete);
    };
  }, [socket, chatData._id, chatType]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    setLoading(true);
    try {
      const endpoint =
        chatType === "user"
          ? `/messages/chat/${chatData._id}`
          : `/messages/group/${chatData._id}`;

      const response = await api.get(endpoint);
      setMessages(response.data);
    } catch (error) {
      console.error("Failed to fetch messages:", error);
    } finally {
      setLoading(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleTyping = () => {
    if (!typing) {
      setTyping(true);
      emitTyping(
        chatType === "user"
          ? { receiver: chatData._id }
          : { group: chatData._id }
      );
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      stopTyping(
        chatType === "user"
          ? { receiver: chatData._id }
          : { group: chatData._id }
      );
    }, 1000);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedFile) return;

    const messageData: MessageData = {
      content: newMessage,
      type: "text",
    };

    if (chatType === "user") {
      messageData.receiver = chatData._id;
    } else {
      messageData.group = chatData._id;
    }

    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("content", newMessage);
      formData.append(chatType === "user" ? "receiver" : "group", chatData._id);

      const fileType = selectedFile.type.startsWith("image/")
        ? "image"
        : selectedFile.type === "application/pdf"
        ? "pdf"
        : "video";
      formData.append("type", fileType);

      try {
        const response = await api.post("/messages", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        setSelectedFile(null);
      } catch (error) {
        console.error("Failed to send file:", error);
      }
    } else {
      sendMessage(messageData);
    }

    setNewMessage("");
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    stopTyping(
      chatType === "user" ? { receiver: chatData._id } : { group: chatData._id }
    );
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      // 10MB limit
      setSelectedFile(file);
    } else {
      alert("File size must be less than 10MB");
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return <Image className="w-5 h-5" />;
    if (file.type === "application/pdf")
      return <FileText className="w-5 h-5" />;
    if (file.type.startsWith("video/")) return <Film className="w-5 h-5" />;
    return <FileText className="w-5 h-5" />;
  };

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
              {chatType === "user" ? (
                (chatData as User).name[0].toUpperCase()
              ) : (
                <Send />
              )}
            </div>
            {chatType === "user" && onlineUsers.has(chatData._id) && (
              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
            )}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {chatType === "user"
                ? (chatData as User).name
                : (chatData as Group).name}
            </h3>
            <p className="text-sm text-gray-500">
              {chatType === "user"
                ? onlineUsers.has(chatData._id)
                  ? "Online"
                  : "Offline"
                : `${(chatData as Group).members.length} members`}
            </p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">
              No messages yet. Start a conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <MessageBubble
              key={message._id}
              message={message}
              isOwn={message.sender._id === user?._id}
              onMessageUpdate={(updatedMessage) => {
                setMessages((prev) =>
                  prev.map((m) => (m._id === updatedMessage._id ? updatedMessage : m))
                );
              }}
            />
          ))
        )}
        {otherTyping && (
          <div className="flex items-center space-x-2 text-gray-500 text-sm">
            <div className="flex space-x-1">
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "0ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "150ms" }}
              ></div>
              <div
                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                style={{ animationDelay: "300ms" }}
              ></div>
            </div>
            <span>{(chatData as User).name} is typing...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="px-6 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {getFileIcon(selectedFile)}
              <span className="text-sm text-gray-600">{selectedFile.name}</span>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-red-500 hover:text-red-700 text-sm"
            >
              Remove
            </button>
          </div>
        </div>
      )}

      {/* Message Input */}
      <div className="px-6 py-4 border-t border-gray-200">
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,application/pdf,video/*"
            onChange={handleFileSelect}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 bg-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSendMessage();
              }
            }}
          />
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !selectedFile}
            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;
