/**
 * TypeScript types for Risk Chat feature
 */

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: number
  confirmId?: string
  sparkVizUrl?: string
}

export interface ChatRequest {
  user_id: string
  text: string
  session_id?: string
}

export interface ChatResponse {
  text: string
  confirm_id?: string
  spark_viz_url?: string
  session_id?: string
}

export interface ConfirmRequest {
  user_id: string
  confirm_id: string
  answer: 'yes' | 'no'
}

export interface ConfirmResponse {
  status: string
  ticket_id?: string
  message: string
}
