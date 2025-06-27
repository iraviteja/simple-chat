import { useState } from "react";
import { Search, Users, LogOut, Plus, MessageSquare, Hash } from "lucide-react";
import type { Conversation, Group, User } from "../types";
import { useAuth } from "../hooks/useAuth";
import { useSocket } from "../hooks/useSocket";
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
    <div className="w-80 bg-slate-900 text-white flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                {user?.name[0].toUpperCase()}
              </div>
              <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900"></div>
            </div>
            <div>
              <h3 className="font-semibold text-white">{user?.name}</h3>
              <p className="text-xs text-green-400">Active now</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search conversations..."
            className="w-full pl-10 pr-4 py-3 bg-slate-800 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Tabs */}
        <div className="flex mt-6 bg-slate-800 rounded-xl p-1">
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === "chats"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("chats")}
          >
            <div className="flex items-center justify-center space-x-2">
              <MessageSquare className="w-4 h-4" />
              <span>Chats</span>
            </div>
          </button>
          <button
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              activeTab === "groups"
                ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg"
                : "text-slate-400 hover:text-white"
            }`}
            onClick={() => setActiveTab("groups")}
          >
            <div className="flex items-center justify-center space-x-2">
              <Hash className="w-4 h-4" />
              <span>Groups</span>
            </div>
          </button>
        </div>
      </div>

      {/* Chat List */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "chats" ? (
          <>
            <div className="p-4">
              <button
                onClick={() => setShowUserSearch(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl flex items-center justify-center space-x-2 font-medium shadow-lg transform hover:scale-[1.02] transition-all"
              >
                <Plus className="w-5 h-5" />
                <span>Start New Chat</span>
              </button>
            </div>
            
            <div className="px-4 pb-4 space-y-2">
              {filteredConversations.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No conversations yet</p>
                </div>
              ) : (
                filteredConversations.map((conv) => (
                  <div
                    key={conv.user._id}
                    className={`px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      selectedChatId === conv.user._id 
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30" 
                        : "hover:bg-slate-800"
                    }`}
                    onClick={() => onSelectChat("user", conv.user)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                          {conv.user.name[0].toUpperCase()}
                        </div>
                        {onlineUsers.has(conv.user._id) && (
                          <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-slate-900"></div>
                        )}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-white">
                            {conv.user.name}
                          </h4>
                          <span className="text-xs text-slate-400">
                            {format(new Date(conv.lastMessage.createdAt), "HH:mm")}
                          </span>
                        </div>
                        <p className="text-sm text-slate-400 truncate mt-1">
                          {conv.lastMessage.isDeleted ? (
                            <span className="italic">Message deleted</span>
                          ) : conv.lastMessage.type === "text" ? (
                            conv.lastMessage.content
                          ) : (
                            <span className="flex items-center space-x-1">
                              <span>📎</span>
                              <span>{conv.lastMessage.type}</span>
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <>
            <div className="p-4">
              <button
                onClick={() => setShowCreateGroup(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl flex items-center justify-center space-x-2 font-medium shadow-lg transform hover:scale-[1.02] transition-all"
              >
                <Users className="w-5 h-5" />
                <span>Create New Group</span>
              </button>
            </div>
            
            <div className="px-4 pb-4 space-y-2">
              {filteredGroups.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">No groups yet</p>
                </div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group._id}
                    className={`px-4 py-3 rounded-xl cursor-pointer transition-all ${
                      selectedChatId === group._id 
                        ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30" 
                        : "hover:bg-slate-800"
                    }`}
                    onClick={() => onSelectChat("group", group)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center shadow-md">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-white">
                          {group.name}
                        </h4>
                        <p className="text-sm text-slate-400">
                          {group.members.length} members
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
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