import { useState, useEffect, useRef } from "react";
import { Send, Paperclip, Image, FileText, Film, MoreVertical, Phone, Video, Info } from "lucide-react";
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

    const handleReactionUpdate = (message: Message) => {
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
    socket.on("message-reaction-updated", handleReactionUpdate);

    return () => {
      socket.off("receive-message", handleNewMessage);
      socket.off("message-sent", handleNewMessage);
      socket.off("user-typing", handleTyping);
      socket.off("user-stop-typing", handleStopTyping);
      socket.off("message-edited", handleMessageEdit);
      socket.off("message-deleted", handleMessageDelete);
      socket.off("message-reaction-updated", handleReactionUpdate);
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
      if (messageData.receiver) {
        formData.append("receiver", messageData.receiver);
      } else if (messageData.group) {
        formData.append("group", messageData.group);
      }

      const fileType = selectedFile.type.startsWith("image/")
        ? "image"
        : selectedFile.type === "application/pdf"
        ? "pdf"
        : selectedFile.type.startsWith("video/")
        ? "video"
        : "text";

      formData.append("type", fileType);

      try {
        await api.post("/messages", formData, {
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
    <div className="flex-1 flex flex-col bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="relative">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold shadow-md ${
                chatType === "user" 
                  ? "bg-gradient-to-br from-blue-500 to-purple-500"
                  : "bg-gradient-to-br from-green-500 to-teal-500"
              }`}>
                {chatType === "user" ? (
                  (chatData as User).name[0].toUpperCase()
                ) : (
                  <Send />
                )}
              </div>
              {chatType === "user" && onlineUsers.has(chatData._id) && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-white"></div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-lg">
                {chatType === "user"
                  ? (chatData as User).name
                  : (chatData as Group).name}
              </h3>
              <p className="text-sm text-gray-500">
                {chatType === "user"
                  ? onlineUsers.has(chatData._id)
                    ? "Active now"
                    : "Offline"
                  : `${(chatData as Group).members.length} members`}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Phone className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Video className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
              <Info className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 bg-gradient-to-b from-slate-50 to-white">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent"></div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Send className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-gray-500 text-lg">No messages yet</p>
              <p className="text-gray-400 text-sm mt-1">Start a conversation!</p>
            </div>
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
            <div className="bg-gray-200 px-4 py-2 rounded-2xl">
              <div className="flex space-x-1">
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "150ms" }}
                ></div>
                <div
                  className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                  style={{ animationDelay: "300ms" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="px-6 py-3 bg-gray-100 border-t border-gray-200">
          <div className="flex items-center justify-between bg-white rounded-lg p-3">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                {getFileIcon(selectedFile)}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            </div>
            <button
              onClick={() => setSelectedFile(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-6 py-4 bg-white border-t border-gray-200">
        <div className="flex items-end space-x-3">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
          >
            <Paperclip className="w-6 h-6" />
          </button>
          <div className="flex-1">
            <input
              type="text"
              placeholder="Type a message..."
              className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                handleTyping();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!newMessage.trim() && !selectedFile}
            className={`p-3 rounded-lg transition-all transform ${
              newMessage.trim() || selectedFile
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 hover:scale-105 shadow-lg"
                : "bg-gray-100 text-gray-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/*,application/pdf,video/*"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

export default ChatWindow;