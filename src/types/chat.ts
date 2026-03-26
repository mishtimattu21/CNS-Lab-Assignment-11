export interface ChatMessage {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  type: 'message' | 'system';
}

export interface OnlineUser {
  username: string;
  online_at: string;
}
