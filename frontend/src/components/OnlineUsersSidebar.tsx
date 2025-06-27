import { Users, Circle } from "lucide-react";
import type { User } from "../types";

interface OnlineUsersSidebarProps {
  onlineUsers: Set<string>;
  allUsers: User[];
  onSelectUser: (user: User) => void;
}

const OnlineUsersSidebar: React.FC<OnlineUsersSidebarProps> = ({
  onlineUsers,
  allUsers,
  onSelectUser,
}) => {
  const sortedUsers = [...allUsers].sort((a, b) => {
    // Sort online users first, then alphabetically by name
    const aOnline = onlineUsers.has(a._id);
    const bOnline = onlineUsers.has(b._id);
    if (aOnline && !bOnline) return -1;
    if (!aOnline && bOnline) return 1;
    return a.name.localeCompare(b.name);
  });

  const onlineCount = sortedUsers.filter(u => onlineUsers.has(u._id)).length;

  return (
    <div className="w-72 bg-white border-l border-gray-200 flex flex-col shadow-lg">
      {/* Header */}
      <div className="p-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
              <Users className="w-5 h-5 text-white" />
            </div>
            <h3 className="font-semibold text-lg">Online Now</h3>
          </div>
          <span className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
            {onlineCount}
          </span>
        </div>
        <p className="text-purple-100 text-sm">
          {sortedUsers.length} total users
        </p>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto py-2">
        <div className="px-4 space-y-1">
          {sortedUsers.map((user) => {
            const isOnline = onlineUsers.has(user._id);
            return (
              <button
                key={user._id}
                onClick={() => onSelectUser(user)}
                className={`w-full flex items-center space-x-3 p-3 rounded-xl transition-all ${
                  isOnline 
                    ? 'hover:bg-purple-50 hover:shadow-md transform hover:scale-[1.02]' 
                    : 'hover:bg-gray-50 opacity-75'
                }`}
              >
                <div className="relative">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-semibold shadow-sm ${
                    isOnline 
                      ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {user.name[0].toUpperCase()}
                  </div>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center ${
                    isOnline ? 'bg-green-500' : 'bg-gray-400'
                  }`}>
                    <Circle className="w-2 h-2 text-white fill-current" />
                  </div>
                </div>
                <div className="flex-1 text-left">
                  <p className={`font-medium truncate ${
                    isOnline ? 'text-gray-900' : 'text-gray-600'
                  }`}>
                    {user.name}
                  </p>
                  <p className={`text-xs ${
                    isOnline ? 'text-green-600 font-medium' : 'text-gray-500'
                  }`}>
                    {isOnline ? 'Active now' : 'Offline'}
                  </p>
                </div>
                {isOnline && (
                  <div className="flex space-x-0.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersSidebar;