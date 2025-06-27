import { useState, useEffect } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import OnlineUsersSidebar from "../components/OnlineUsersSidebar";
import type { User, Group, Conversation } from "../types";
import api from "../services/api";
import { useSocket } from "../hooks/useSocket";
import { MessageSquare } from "lucide-react";

const Chat = () => {
  const [selectedChat, setSelectedChat] = useState<{
    type: "user" | "group";
    data: User | Group;
  } | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const { socket, onlineUsers } = useSocket();

  useEffect(() => {
    fetchConversations();
    fetchGroups();
    fetchAllUsers();
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on("receive-message", () => {
      fetchConversations();
    });

    socket.on("message-sent", () => {
      fetchConversations();
    });

    socket.on("user-joined", () => {
      fetchAllUsers();
    });

    socket.on("user-left", () => {
      fetchAllUsers();
    });

    socket.on("message-edited", () => {
      fetchConversations();
    });

    socket.on("message-deleted", () => {
      fetchConversations();
    });

    return () => {
      socket.off("receive-message");
      socket.off("message-sent");
      socket.off("user-joined");
      socket.off("user-left");
      socket.off("message-edited");
      socket.off("message-deleted");
    };
  }, [socket]);

  const fetchConversations = async () => {
    try {
      const response = await api.get("/messages/conversations");
      setConversations(response.data);
    } catch (error) {
      console.error("Failed to fetch conversations:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await api.get("/groups/my-groups");
      setGroups(response.data);
    } catch (error) {
      console.error("Failed to fetch groups:", error);
    }
  };

  const fetchAllUsers = async () => {
    try {
      const response = await api.get("/users");
      setAllUsers(response.data);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const handleChatSelect = (type: "user" | "group", data: User | Group) => {
    setSelectedChat({ type, data });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <ChatSidebar
        conversations={conversations}
        groups={groups}
        onSelectChat={handleChatSelect}
        selectedChatId={selectedChat?.data._id}
        onGroupCreated={fetchGroups}
      />
      {selectedChat ? (
        <ChatWindow chatType={selectedChat.type} chatData={selectedChat.data} />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-purple-50 to-pink-50">
          <div className="text-center">
            <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <MessageSquare className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-3xl font-bold text-gray-900 mb-3">
              Welcome to SimpleChat
            </h3>
            <p className="text-gray-600 text-lg">
              Select a conversation or start a new one
            </p>
          </div>
        </div>
      )}
      <OnlineUsersSidebar
        onlineUsers={onlineUsers}
        allUsers={allUsers}
        onSelectUser={(user) => handleChatSelect("user", user)}
      />
    </div>
  );
};

export default Chat;
