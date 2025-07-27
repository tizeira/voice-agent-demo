import { RealtimeAgent, RealtimeSession } from '@openai/agents/realtime';
import { ConversationTracker } from './analytics';
import type { 
  VoiceAgentConfig, 
  VoiceAgentCallbacks, 
  RealtimeAgentConfig,
  ConnectionConfig,
  TransportEvent,
  RealtimeSessionResponse,
  AudioEvent
} from './types';

export class VoiceAgent {
  private agent: RealtimeAgent;
  private session: RealtimeSession | null = null;
  private callbacks: VoiceAgentCallbacks;
  private config: VoiceAgentConfig;
  private analytics: ConversationTracker;

  constructor(config: VoiceAgentConfig, callbacks: VoiceAgentCallbacks) {
    this.config = {
      model: 'gpt-4o-realtime-preview-2025-06-03',
      serverUrl: 'http://localhost:3000/session',
      ...config,
    };
    this.callbacks = callbacks;
    
    // Crear el agente con configuración
    const agentConfig: RealtimeAgentConfig = {
      name: config.name,
      instructions: config.instructions,
    };
    this.agent = new RealtimeAgent(agentConfig);
    
    // Inicializar analytics tracker
    this.analytics = new ConversationTracker(this.generateSessionId());
  }

  private generateSessionId(): string {
    return `va_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  async connect(): Promise<void> {
    try {
      this.callbacks.onStatusChange('Obteniendo token de sesión...');
      
      // Obtener token efímero del servidor
      const tokenResponse = await fetch(this.config.serverUrl!);
      if (!tokenResponse.ok) {
        throw new Error(`Error del servidor: ${tokenResponse.status}`);
      }
      
      const data: RealtimeSessionResponse = await tokenResponse.json();
      const ephemeralKey = data.client_secret.value;
      
      this.callbacks.onStatusChange('Conectando al agente de voz...');
      
      // Crear sesión con configuración optimizada
      this.session = new RealtimeSession(this.agent, {
        model: this.config.model!,
        config: {
          inputAudioTranscription: {
            model: 'whisper-1',
          },
          turnDetection: {
            type: 'server_vad',
            threshold: 0.5,
            prefixPaddingMs: 300,
            silenceDurationMs: 200,
          },
        },
      });
      
      // Configurar eventos de la sesión
      this.setupSessionEvents();
      
      // Conectar con el token efímero
      const connectionConfig: ConnectionConfig = {
        apiKey: ephemeralKey,
      };
      await this.session.connect(connectionConfig);
      
      console.log('Sesión conectada exitosamente');
      
    } catch (error) {
      console.error('Error al conectar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      this.callbacks.onError(error as Error);
      this.callbacks.onStatusChange(`Error: ${errorMessage}`, true);
    }
  }

  async disconnect(): Promise<void> {
    if (this.session) {
      // Submit analytics before disconnecting
      try {
        await this.analytics.submitAnalytics();
      } catch (error) {
        console.error('Failed to submit analytics on disconnect:', error);
      }
      
      this.session.close();
      this.session = null;
      this.callbacks.onDisconnected();
      this.callbacks.onStatusChange('Desconectado');
    }
  }

  sendTextMessage(message: string): void {
    if (this.session) {
      this.analytics.addMessage('user', message);
      this.session.sendMessage(message);
    }
  }

  setShopifyCustomerId(customerId: string): void {
    this.analytics.setShopifyCustomerId(customerId);
  }

  setUserId(userId: string): void {
    this.analytics.setUserId(userId);
  }

  setUserSatisfaction(rating: number): void {
    this.analytics.setUserSatisfaction(rating);
  }

  getSessionId(): string {
    return this.analytics.generateAnalyticsData().sessionId;
  }

  interrupt(): void {
    if (this.session) {
      this.analytics.logEvent('audio_interrupted');
      this.session.interrupt();
    }
  }

  isConnected(): boolean {
    return this.session !== null;
  }

  private setupSessionEvents(): void {
    if (!this.session) return;

    // Eventos de transporte
    this.session.on('transport_event', (event: TransportEvent) => {
      console.log('Transport event:', event);
      
      if (event.type === 'session.created') {
        this.callbacks.onStatusChange('✅ Conectado - Puedes hablar ahora');
        this.callbacks.onConnected();
        const welcomeMessage = 'Hola! Soy tu asistente de voz. ¿En qué puedo ayudarte?';
        this.analytics.addMessage('assistant', welcomeMessage);
        this.callbacks.onMessage('assistant', welcomeMessage);
      }
    });

    // Note: Message events will be handled through transport_event for now

    // Eventos de audio
    this.session.on('audio', (event: AudioEvent) => {
      console.log('Audio event received:', event);
    });

    // Eventos de error
    this.session.on('error', (error: any) => {
      console.error('Error de sesión:', error);
      this.analytics.logEvent('error', { 
        error: error.error || error.message,
        stack: error.stack 
      });
      this.callbacks.onError(error);
      const errorMessage = error.error || error.message || 'Error desconocido';
      this.callbacks.onStatusChange(`Error: ${errorMessage}`, true);
    });
  }
}