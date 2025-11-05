/**
 * Individual chat message bubble component
 */
import { formatDistanceToNow } from 'date-fns'
import { Bot, User } from 'lucide-react'
import type { ChatMessage } from './types'

interface ChatBubbleProps {
  message: ChatMessage
}

export function ChatBubble({ message }: ChatBubbleProps) {
  const isUser = message.role === 'user'

  return (
    <div
      className={`flex gap-3 mb-4 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? 'bg-gradient-to-br from-blue-500 to-purple-600'
            : 'bg-gradient-to-br from-emerald-500 to-teal-600'
        }`}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4 text-white" />
        )}
      </div>

      {/* Message content */}
      <div className={`flex-1 max-w-[75%] ${isUser ? 'text-right' : 'text-left'}`}>
        <div
          className={`inline-block rounded-2xl px-4 py-2.5 shadow-sm ${
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              : 'bg-white/5 text-white border border-white/10'
          }`}
        >
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </div>

          {/* Spark viz link */}
          {message.sparkVizUrl && (
            <a
              href={message.sparkVizUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-2 text-xs underline opacity-75 hover:opacity-100"
            >
              View Chart →
            </a>
          )}
        </div>

        {/* Timestamp */}
        <div
          className={`text-xs text-white/40 mt-1 ${
            isUser ? 'text-right' : 'text-left'
          }`}
        >
          {formatDistanceToNow(message.timestamp, { addSuffix: true })}
        </div>
      </div>
    </div>
  )
}
