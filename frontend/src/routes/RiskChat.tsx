/**
 * Risk Chat Page - Full-screen AI Assistant
 */
import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, Bot, User, Sparkles, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/lib/hooks/use-toast'
import ReactMarkdown from 'react-markdown'
import type { ChatMessage, ChatResponse, ConfirmResponse } from '@/components/RiskChat/types'

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const USER_ID = 'demo' // In production, get from auth context

export default function RiskChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [pendingConfirm, setPendingConfirm] = useState<{
    confirmId: string
    message: string
  } | null>(null)
  const [isConfirming, setIsConfirming] = useState(false)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const { toast } = useToast()

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    // Add welcome message
    if (messages.length === 0) {
      const welcomeMessage: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: `👋 Hi! I'm your AI Risk Operations Assistant powered by Gemini.

I can help you with:
• **VaR Analysis** - Query Value-at-Risk trends and metrics
• **Alert Explanations** - Understand why risk breaches occurred
• **Stress Testing** - Run portfolio stress tests
• **Operational Playbooks** - Get step-by-step runbooks for risk events
• **Emergency Actions** - Halt trading (with confirmation)

Try asking:
"What's PM_BOOK1 VaR trend last 30 min?"
"Why did we trip VAR_BREACH at 10:32?"
"Playbook for order-flow anomaly"`,
        timestamp: Date.now(),
      }
      setMessages([welcomeMessage])
    }
  }, [])

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
          throw new Error('Risk chat feature is not enabled on the backend')
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

      // If confirmation required, set pending
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

      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ Sorry, I encountered an error: ${
          error instanceof Error ? error.message : 'Unknown error'
        }

Make sure:
1. Backend is running on http://localhost:8000
2. FEATURE_RISK_CHAT=1 in .env
3. GEMINI_API_KEY is set correctly`,
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
    <div className="container mx-auto px-4 py-6 h-[calc(100vh-4rem)]">
      <div className="flex flex-col h-full max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Risk Operations Assistant</h1>
            <p className="text-sm text-muted-foreground">AI-powered risk analysis with Gemini 2.0</p>
          </div>
        </div>

        {/* Messages Container */}
        <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
            >
              {/* Avatar */}
              <div
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center shadow-lg ${
                  message.role === 'user'
                    ? 'bg-gradient-to-br from-blue-500 to-purple-600'
                    : 'bg-gradient-to-br from-emerald-500 to-teal-600'
                }`}
              >
                {message.role === 'user' ? (
                  <User className="w-5 h-5 text-white" />
                ) : (
                  <Bot className="w-5 h-5 text-white" />
                )}
              </div>

              {/* Message */}
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div
                  className={`inline-block rounded-2xl px-5 py-3 shadow-md ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
                      : 'bg-card border border-border/40 text-card-foreground'
                  }`}
                >
                  <div className="text-sm leading-relaxed prose prose-sm prose-invert max-w-none">
                    {message.role === 'assistant' ? (
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          ul: ({ children }) => <ul className="list-disc pl-4 mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="mb-0">{children}</li>,
                          strong: ({ children }) => <strong className="font-bold text-emerald-400">{children}</strong>,
                          code: ({ children }) => (
                            <code className="bg-black/20 px-1.5 py-0.5 rounded text-xs font-mono">
                              {children}
                            </code>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    ) : (
                      <span className="whitespace-pre-wrap">{message.content}</span>
                    )}
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
                  className={`text-xs text-muted-foreground mt-1 ${
                    message.role === 'user' ? 'text-right' : 'text-left'
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Confirmation Prompt */}
        {pendingConfirm && (
          <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-semibold text-amber-500 mb-2">Confirmation Required</h3>
                <p className="text-sm text-foreground/80 mb-3 whitespace-pre-wrap">
                  {pendingConfirm.message}
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handleConfirm('no')}
                    variant="outline"
                    disabled={isConfirming}
                    className="border-border/40"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => handleConfirm('yes')}
                    disabled={isConfirming}
                    className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700"
                  >
                    {isConfirming ? 'Processing...' : 'Confirm'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-border/40 pt-4">
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about risk metrics, alerts, stress tests, or playbooks..."
              disabled={isLoading}
              rows={2}
              className="flex-1 px-4 py-3 bg-card border border-border/40 rounded-xl text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50 resize-none"
            />
            <Button
              onClick={sendMessage}
              disabled={!inputText.trim() || isLoading}
              className="bg-gradient-to-br from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 rounded-xl px-6 h-auto"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  )
}
