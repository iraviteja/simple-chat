import { Users } from "lucide-react";
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

  return (
    <div className="w-64 bg-white border-l border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Online Users</h3>
        </div>
      </div>

      {/* Users List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-2">
          {sortedUsers.map((user) => (
            <button
              key={user._id}
              onClick={() => onSelectUser(user)}
              className="w-full flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="relative">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-700 font-semibold">
                  {user.name[0].toUpperCase()}
                </div>
                {onlineUsers.has(user._id) && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-gray-900 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500">
                  {onlineUsers.has(user._id) ? "Online" : "Offline"}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default OnlineUsersSidebar;
