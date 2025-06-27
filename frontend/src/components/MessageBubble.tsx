import { format } from 'date-fns'
import { Check, CheckCheck, Download, MoreVertical, Edit2, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { Message } from '../types'
import api from '../services/api'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
  onMessageUpdate: (message: Message) => void
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn, onMessageUpdate }) => {
  const [showMenu, setShowMenu] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(message.content)
  const baseURL = (import.meta.env.VITE_API_URL || 'http://localhost:5005').replace(/\/$/, '')
  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <div className="max-w-sm">
            <img
              src={`${baseURL}${message.fileUrl}`}
              alt={message.fileName}
              className="rounded-lg w-full cursor-pointer hover:opacity-90"
              onClick={() => window.open(`${baseURL}${message.fileUrl}`, '_blank')}
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )
      
      case 'pdf':
        return (
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
              <Download className="w-5 h-5 text-red-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium truncate">{message.fileName}</p>
              <p className="text-xs text-gray-500">
                {message.fileSize && `${(message.fileSize / 1024 / 1024).toFixed(2)} MB`}
              </p>
            </div>
            <a
              href={`${baseURL}${message.fileUrl}`}
              download
              className="text-blue-600 hover:text-blue-700"
            >
              <Download className="w-5 h-5" />
            </a>
          </div>
        )
      
      case 'video':
        return (
          <div className="max-w-sm">
            <video
              controls
              className="rounded-lg w-full"
              src={`${baseURL}${message.fileUrl}`}
            />
            {message.content && (
              <p className="mt-2 text-sm">{message.content}</p>
            )}
          </div>
        )
      
      default:
        if (message.isDeleted) {
          return <p className="text-sm italic opacity-60">This message was deleted</p>
        }
        if (isEditing && isOwn) {
          return (
            <div className="space-y-2">
              <input
                type="text"
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleEditSave()
                  if (e.key === 'Escape') {
                    setIsEditing(false)
                    setEditContent(message.content)
                  }
                }}
                className="w-full px-2 py-1 text-sm bg-white/10 rounded border border-white/20 focus:outline-none focus:border-white/40"
                autoFocus
              />
              <div className="flex space-x-2">
                <button
                  onClick={handleEditSave}
                  className="text-xs px-2 py-1 bg-white/20 rounded hover:bg-white/30"
                >
                  Save
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false)
                    setEditContent(message.content)
                  }}
                  className="text-xs px-2 py-1 bg-white/10 rounded hover:bg-white/20"
                >
                  Cancel
                </button>
              </div>
            </div>
          )
        }
        return <p className="text-sm">{message.content}</p>
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
    setShowMenu(false)
  }

  const handleEditSave = async () => {
    try {
      const response = await api.put(`/messages/${message._id}`, {
        content: editContent
      })
      onMessageUpdate(response.data)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to edit message:', error)
    }
  }

  const handleDelete = async () => {
    if (confirm('Delete this message?')) {
      try {
        const response = await api.delete(`/messages/${message._id}`)
        onMessageUpdate(response.data)
      } catch (error) {
        console.error('Failed to delete message:', error)
      }
    }
    setShowMenu(false)
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2 group`}>
      <div className="relative">
        <div className={`max-w-xs lg:max-w-md px-4 py-3 ${
          isOwn 
            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-l-2xl rounded-tr-2xl shadow-md' 
            : 'bg-white text-gray-900 rounded-r-2xl rounded-tl-2xl shadow-sm border border-gray-100'
        }`}>
          {!isOwn && message.group && (
            <p className="text-xs font-semibold mb-1 opacity-70">
              {message.sender.name}
            </p>
          )}
          {renderContent()}
          <div className={`flex items-center justify-between mt-1 ${
            isOwn ? 'text-purple-100' : 'text-gray-500'
          }`}>
            <div className="flex items-center space-x-1">
              <span className="text-xs">
                {format(new Date(message.createdAt), 'HH:mm')}
              </span>
              {message.isEdited && (
                <span className="text-xs italic">(edited)</span>
              )}
            </div>
            {isOwn && (
              <div className="flex items-center space-x-1">
                {message.read ? (
                  <CheckCheck className="w-4 h-4" />
                ) : message.delivered ? (
                  <Check className="w-4 h-4" />
                ) : null}
              </div>
            )}
          </div>
        </div>
        
        {isOwn && !message.isDeleted && message.type === 'text' && (
          <div className="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 bg-white shadow-md hover:bg-gray-50 rounded-full transition-colors"
            >
              <MoreVertical className="w-4 h-4 text-gray-600" />
            </button>
            
            {showMenu && (
              <div className="absolute right-0 mt-2 bg-white shadow-xl rounded-xl py-1 z-10 min-w-[120px] border border-gray-100">
                <button
                  onClick={handleEdit}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-purple-50 w-full text-left transition-colors"
                >
                  <Edit2 className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Edit</span>
                </button>
                <button
                  onClick={handleDelete}
                  className="flex items-center space-x-2 px-4 py-2 hover:bg-red-50 w-full text-left text-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Delete</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble