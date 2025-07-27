// OpenAI Realtime API Types
export interface EphemeralToken {
  value: string;
  expires_at: number;
}

export interface RealtimeSessionResponse {
  id: string;
  object: string;
  expires_at: number;
  input_audio_noise_reduction: null | string;
  turn_detection: {
    type: string;
    threshold: number;
    prefix_padding_ms: number;
    silence_duration_ms: number;
    create_response: boolean;
    interrupt_response: boolean;
  };
  input_audio_format: string;
  input_audio_transcription: null | object;
  client_secret: EphemeralToken;
  include: null | string;
  model: string;
  modalities: string[];
  instructions: string;
  voice: string;
  output_audio_format: string;
  tools: any[];
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: string;
  speed: number;
  tracing: null | string;
  prompt: null | string;
}

// Transport Event Types
export interface TransportEvent {
  type: string;
  [key: string]: any;
}

export interface SessionCreatedEvent extends TransportEvent {
  type: 'session.created';
}

export interface OutputItemDoneEvent extends TransportEvent {
  type: 'response.output_item.done';
  item?: {
    type: string;
    role: string;
    content: Array<{
      type: string;
      text: string;
    }>;
  };
}

export interface TranscriptionCompletedEvent extends TransportEvent {
  type: 'conversation.item.input_audio_transcription.completed';
  transcript: string;
}

export interface AudioEvent extends TransportEvent {
  type: 'audio';
  data?: ArrayBuffer;
}

export interface RealtimeSessionError extends Error {
  error?: string;
  message: string;
}

// Voice Agent Configuration Types
export interface VoiceAgentConfig {
  name: string;
  instructions: string;
  model?: string;
  serverUrl?: string;
  voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
}

export interface VoiceAgentCallbacks {
  onStatusChange: (status: string, isError?: boolean) => void;
  onMessage: (role: 'user' | 'assistant', content: string) => void;
  onConnected: () => void;
  onDisconnected: () => void;
  onError: (error: Error) => void;
}

// Realtime Session Configuration Types
export interface RealtimeSessionConfig {
  model: string;
  config?: {
    inputAudioTranscription?: {
      model: string;
    };
    turnDetection?: {
      type: 'server_vad' | 'none';
      threshold?: number;
      prefixPaddingMs?: number;
      silenceDurationMs?: number;
    };
    inputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
    outputAudioFormat?: 'pcm16' | 'g711_ulaw' | 'g711_alaw';
  };
}

export interface RealtimeAgentConfig {
  name: string;
  instructions: string;
}

// Connection Configuration
export interface ConnectionConfig {
  apiKey: string;
}

// Message Types
export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  id: string;
}

export interface ConversationHistory {
  messages: Message[];
  sessionId: string;
  createdAt: number;
  lastActivity: number;
}

// Server Types
export interface ServerConfig {
  port: number;
  openaiApiKey: string;
  corsOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
}

export interface SessionEndpointResponse {
  success: boolean;
  data?: RealtimeSessionResponse;
  error?: string;
}

export interface HealthCheckResponse {
  status: 'OK' | 'ERROR';
  timestamp: string;
  uptime?: number;
  version?: string;
}

// Rate Limiting Types
export interface RateLimitOptions {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

export interface RateLimitInfo {
  totalHits: number;
  totalTime: number;
  resetTime: Date;
}

// UI State Types
export interface UIState {
  isConnected: boolean;
  isConnecting: boolean;
  status: string;
  isError: boolean;
  messages: Message[];
}

// Audio Types
export interface AudioMetrics {
  inputLevel: number;
  outputLevel: number;
  isRecording: boolean;
  isPlaying: boolean;
}

// Export utility types
export type MessageRole = 'user' | 'assistant' | 'system';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type VoiceType = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';