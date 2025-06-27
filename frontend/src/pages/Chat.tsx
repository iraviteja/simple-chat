import { useState, useEffect } from "react";
import ChatSidebar from "../components/ChatSidebar";
import ChatWindow from "../components/ChatWindow";
import OnlineUsersSidebar from "../components/OnlineUsersSidebar";
import type { User, Group, Conversation } from "../types";
import api from "../services/api";
import { useSocket } from "../contexts/SocketContext";

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

    return () => {
      socket.off("receive-message");
      socket.off("message-sent");
      socket.off("user-joined");
      socket.off("user-left");
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
    <div className="flex h-screen bg-gray-100">
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
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="text-center">
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">
              Welcome to SimpleChat
            </h3>
            <p className="text-gray-500">
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
