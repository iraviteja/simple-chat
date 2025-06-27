import { format } from 'date-fns'
import { Check, CheckCheck, Download } from 'lucide-react'
import type { Message } from '../types'

interface MessageBubbleProps {
  message: Message
  isOwn: boolean
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
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
        return <p className="text-sm">{message.content}</p>
    }
  }

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-2`}>
      <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
        isOwn ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-900'
      }`}>
        {!isOwn && message.group && (
          <p className="text-xs font-semibold mb-1 opacity-70">
            {message.sender.username}
          </p>
        )}
        {renderContent()}
        <div className={`flex items-center justify-end space-x-1 mt-1 ${
          isOwn ? 'text-green-100' : 'text-gray-500'
        }`}>
          <span className="text-xs">
            {format(new Date(message.createdAt), 'HH:mm')}
          </span>
          {isOwn && (
            message.read ? (
              <CheckCheck className="w-4 h-4" />
            ) : message.delivered ? (
              <Check className="w-4 h-4" />
            ) : null
          )}
        </div>
      </div>
    </div>
  )
}

export default MessageBubble