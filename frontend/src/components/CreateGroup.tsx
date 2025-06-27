import { useState } from 'react'
import { X, Users } from 'lucide-react'
import type { User } from '../types'
import api from '../services/api'

interface CreateGroupProps {
  onClose: () => void
  onGroupCreated: () => void
}

const CreateGroup: React.FC<CreateGroupProps> = ({ onClose, onGroupCreated }) => {
  const [groupName, setGroupName] = useState('')
  const [description, setDescription] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [users, setUsers] = useState<User[]>([])
  const [selectedUsers, setSelectedUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const searchUsers = async () => {
    if (!searchTerm) {
      setUsers([])
      return
    }

    setLoading(true)
    try {
      const response = await api.get(`/users?search=${searchTerm}`)
      setUsers(response.data.filter((u: User) => 
        !selectedUsers.find(s => s._id === u._id)
      ))
    } catch (error) {
      console.error('Failed to search users:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedUsers.length === 0) return

    setCreating(true)
    try {
      await api.post('/groups', {
        name: groupName,
        description,
        members: selectedUsers.map(u => u._id)
      })
      onGroupCreated()
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setCreating(false)
    }
  }

  const toggleUserSelection = (user: User) => {
    if (selectedUsers.find(u => u._id === user._id)) {
      setSelectedUsers(selectedUsers.filter(u => u._id !== user._id))
    } else {
      setSelectedUsers([...selectedUsers, user])
    }
    setUsers(users.filter(u => u._id !== user._id))
    setSearchTerm('')
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Create New Group</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Group Name
            </label>
            <input
              type="text"
              placeholder="Enter group name"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (optional)
            </label>
            <textarea
              placeholder="Enter group description"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Add Members
            </label>
            <input
              type="text"
              placeholder="Search users to add"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value)
                searchUsers()
              }}
            />
          </div>

          {selectedUsers.length > 0 && (
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">
                Selected Members ({selectedUsers.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {selectedUsers.map((user) => (
                  <div
                    key={user._id}
                    className="flex items-center space-x-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm"
                  >
                    <span>{user.username}</span>
                    <button
                      onClick={() => toggleUserSelection(user)}
                      className="hover:text-green-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {searchTerm && (
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
              {loading ? (
                <div className="text-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500 mx-auto"></div>
                </div>
              ) : users.length === 0 ? (
                <p className="text-center text-gray-500 py-4 text-sm">
                  No users found
                </p>
              ) : (
                <div>
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center space-x-3 p-2 hover:bg-gray-50 cursor-pointer"
                      onClick={() => toggleUserSelection(user)}
                    >
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-700 text-sm font-semibold">
                        {user.username[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{user.username}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleCreateGroup}
            disabled={!groupName.trim() || selectedUsers.length === 0 || creating}
            className="w-full py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <Users className="w-5 h-5" />
            <span>{creating ? 'Creating...' : 'Create Group'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default CreateGroup