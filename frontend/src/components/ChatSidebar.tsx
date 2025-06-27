import { useState } from "react";
import { Search, Users, LogOut, Plus } from "lucide-react";
import type { Conversation, Group, User } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../contexts/SocketContext";
import UserSearch from "./UserSearch";
import CreateGroup from "./CreateGroup";
import { format } from "date-fns";

interface ChatSidebarProps {
  conversations: Conversation[];
  groups: Group[];
  onSelectChat: (type: "user" | "group", data: User | Group) => void;
  selectedChatId?: string;
  onGroupCreated: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  conversations,
  groups,
  onSelectChat,
  selectedChatId,
  onGroupCreated,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [activeTab, setActiveTab] = useState<"chats" | "groups">("chats");
  const { user, logout } = useAuth();
  const { onlineUsers } = useSocket();

  const filteredConversations = conversations.filter((conv) =>
    conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGroups = groups.filter((group) =>
    group.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
              {user?.name[0].toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold">{user?.name}</h3>
              <p className="text-xs text-gray-500">Online</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-gray-500 hover:text-gray-700"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex mt-4 border-b border-gray-200">
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "chats"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            Chats
          </button>
          <button
            className={`flex-1 py-2 text-sm font-medium ${
              activeTab === "groups"
                ? "text-green-600 border-b-2 border-green-600"
                : "text-gray-500 hover:text-gray-700"
            }`}
            onClick={() => setActiveTab("groups")}
          >
            Groups
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" ? (
          <>
            <div className="p-2">
              <button
                onClick={() => setShowUserSearch(true)}
                className="w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>New Chat</span>
              </button>
            </div>
            {filteredConversations.map((conv) => (
              <div
                key={conv.user._id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                  selectedChatId === conv.user._id ? "bg-gray-100" : ""
                }`}
                onClick={() => onSelectChat("user", conv.user)}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                      {conv.user.name[0].toUpperCase()}
                    </div>
                    {onlineUsers.has(conv.user._id) && (
                      <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-gray-900">
                        {conv.user.name}
                      </h4>
                      <span className="text-xs text-gray-500">
                        {format(new Date(conv.lastMessage.createdAt), "HH:mm")}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {conv.lastMessage.type === "text"
                        ? conv.lastMessage.content
                        : `📎 ${conv.lastMessage.type}`}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        ) : (
          <>
            <div className="p-2">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full px-4 py-2 text-sm text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Create Group</span>
              </button>
            </div>
            {filteredGroups.map((group) => (
              <div
                key={group._id}
                className={`px-4 py-3 hover:bg-gray-50 cursor-pointer ${
                  selectedChatId === group._id ? "bg-gray-100" : ""
                }`}
                onClick={() => onSelectChat("group", group)}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">
                      {group.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      {group.members.length} members
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Modals */}
      {showUserSearch && (
        <UserSearch
          onClose={() => setShowUserSearch(false)}
          onSelectUser={(user) => {
            onSelectChat("user", user);
            setShowUserSearch(false);
          }}
        />
      )}

      {showCreateGroup && (
        <CreateGroup
          onClose={() => setShowCreateGroup(false)}
          onGroupCreated={() => {
            setShowCreateGroup(false);
            onGroupCreated();
          }}
        />
      )}
    </div>
  );
};

export default ChatSidebar;
