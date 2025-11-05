/**
 * Main Risk Chat widget component
 */
import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, X, Loader2 } from 'lucide-react'
import { Button } from '../ui/button'
import { ChatBubble } from './ChatBubble'
import { ConfirmDialog } from './ConfirmDialog'
import { useToast } from '@/lib/hooks/use-toast'
import type { ChatMessage, ChatResponse, ConfirmResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

// Demo user ID (in production, get from auth context)
const USER_ID = 'demo'

export function RiskChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<{
    confirmId: string
    message: string
  } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputText.trim() || isLoading) return

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: Date.now(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInputText('')
    setIsLoading(true)

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          text: inputText,
        }),
      })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Risk chat feature is not enabled')
        }
        throw new Error(`HTTP ${response.status}`)
      }

      const data: ChatResponse = await response.json()

      const assistantMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.text,
        timestamp: Date.now(),
        confirmId: data.confirm_id,
        sparkVizUrl: data.spark_viz_url,
      }

      setMessages((prev) => [...prev, assistantMessage])

      // If confirmation required, show dialog
      if (data.confirm_id) {
        setPendingConfirm({
          confirmId: data.confirm_id,
          message: data.text,
        })
      }
    } catch (error) {
      console.error('Chat error:', error)
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to send message',
        variant: 'destructive',
      })

      // Add error message
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Sorry, I encountered an error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        timestamp: Date.now(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleConfirm = async (answer: 'yes' | 'no') => {
    if (!pendingConfirm) return

    setIsConfirming(true)

    try {
      const response = await fetch(`${API_BASE}/api/chat/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: USER_ID,
          confirm_id: pendingConfirm.confirmId,
          answer,
        }),
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const data: ConfirmResponse = await response.json()

      // Add result message
      const resultMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: Date.now(),
      }

      setMessages((prev) => [...prev, resultMessage])

      toast({
        title: answer === 'yes' ? 'Action Executed' : 'Action Cancelled',
        description: data.message,
      })
    } catch (error) {
      console.error('Confirmation error:', error)
      toast({
        title: 'Error',
        description: 'Failed to process confirmation',
        variant: 'destructive',
      })
    } finally {
      setIsConfirming(false)
      setPendingConfirm(null)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Floating button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group z-50"
          aria-label="Open Risk Chat"
        >
          <MessageSquare className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
        </button>
      )}

      {/* Chat panel */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-[420px] h-[600px] bg-zinc-900/95 backdrop-blur-xl border border-zinc-800 rounded-2xl shadow-2xl flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-white" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">
                  Risk Operations Assistant
                </h3>
                <p className="text-xs text-zinc-400">AI-powered risk analysis</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-zinc-400 hover:text-white transition-colors"
              aria-label="Close chat"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-zinc-500 mt-8">
                <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm">
                  Ask me about VaR trends, alerts, stress tests, or operational
                  playbooks.
                </p>
              </div>
            ) : (
              messages.map((message) => (
                <ChatBubble key={message.id} message={message} />
              ))
            )}

            {isLoading && (
              <div className="flex items-center gap-2 text-zinc-400 text-sm">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="px-5 py-4 border-t border-zinc-800">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about risk metrics..."
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 bg-zinc-800/50 border border-zinc-700 rounded-xl text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputText.trim() || isLoading}
                className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl px-4"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation dialog */}
      <ConfirmDialog
        open={!!pendingConfirm}
        onOpenChange={(open) => !open && setPendingConfirm(null)}
        message={pendingConfirm?.message || ''}
        onConfirm={() => handleConfirm('yes')}
        onCancel={() => handleConfirm('no')}
        isLoading={isConfirming}
      />
    </>
  )
}
