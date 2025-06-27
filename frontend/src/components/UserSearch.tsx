import { useState, useEffect } from 'react'
import { X, Search } from 'lucide-react'
import type { User } from '../types'
import api from '../services/api'

interface UserSearchProps {
  onClose: () => void
  onSelectUser: (user: User) => void
}

const UserSearch: React.FC<UserSearchProps> = ({ onClose, onSelectUser }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchTerm) {
        searchUsers()
      } else {
        setUsers([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm])

  const searchUsers = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/users?search=${searchTerm}`)
      setUsers(response.data)
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl w-full max-w-md mx-4 shadow-2xl transform transition-all">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900">Start New Chat</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search users by name..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-96 overflow-y-auto -mx-6 px-6">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-purple-500 border-t-transparent mx-auto"></div>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                  <Search className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  {searchTerm ? 'No users found' : 'Type to search users'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {users.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-3 p-4 hover:bg-purple-50 rounded-xl cursor-pointer transition-all hover:shadow-md transform hover:scale-[1.02]"
                    onClick={() => onSelectUser(user)}
                  >
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold shadow-md">
                      {user.name[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">{user.name}</p>
                      <p className="text-sm text-gray-500">Click to start chatting</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default UserSearch