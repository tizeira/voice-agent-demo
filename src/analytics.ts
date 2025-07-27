// Analytics types and utilities for voice agent
import type { Message } from './types';

export interface ConversationAnalytics {
  sessionId: string;
  shopifyCustomerId?: string;
  shopDomain: string;
  userId?: string;
  startTime: Date;
  endTime?: Date;
  messages: Message[];
  userSatisfaction?: number; // 1-5 rating
  metadata: ConversationMetadata;
}

export interface ConversationMetadata {
  userAgent: string;
  ipAddress?: string;
  language: string;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  referrer?: string;
  shopifyTheme?: string;
  pageUrl: string;
}

export interface SessionEvent {
  type: 'connection_started' | 'connection_ended' | 'error' | 'audio_interrupted' | 'user_rating';
  data?: any;
  timestamp: Date;
}

export interface AnalyticsSubmission {
  sessionId: string;
  shopifyCustomerId?: string;
  shopDomain: string;
  userId?: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  messageCount: number;
  userMessages: number;
  assistantMessages: number;
  conversationData: Message[];
  userSatisfaction?: number;
  metadata: ConversationMetadata;
  events: SessionEvent[];
}

export class ConversationTracker {
  private sessionId: string;
  private startTime: Date;
  private messages: Message[] = [];
  private events: SessionEvent[] = [];
  private metadata: ConversationMetadata;
  private shopifyCustomerId?: string;
  private userId?: string;
  private userSatisfaction?: number;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
    this.startTime = new Date();
    this.metadata = this.collectMetadata();
    this.logEvent('connection_started');
  }

  private collectMetadata(): ConversationMetadata {
    const userAgent = navigator.userAgent;
    
    // Detect device type
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isTablet = /iPad|Android(?=.*Tablet)|PlayBook|Silk/i.test(userAgent);
    
    let deviceType: 'mobile' | 'desktop' | 'tablet' = 'desktop';
    if (isTablet) deviceType = 'tablet';
    else if (isMobile) deviceType = 'mobile';

    // Detect browser
    let browser = 'unknown';
    if (userAgent.includes('Chrome')) browser = 'chrome';
    else if (userAgent.includes('Firefox')) browser = 'firefox';
    else if (userAgent.includes('Safari')) browser = 'safari';
    else if (userAgent.includes('Edge')) browser = 'edge';

    // Detect language
    const language = navigator.language || 'en';

    return {
      userAgent,
      language,
      deviceType,
      browser,
      referrer: document.referrer,
      pageUrl: window.location.href,
      shopifyTheme: this.detectShopifyTheme(),
    };
  }

  private detectShopifyTheme(): string | undefined {
    // Try to detect Shopify theme from meta tags or window objects
    const themeNameMeta = document.querySelector('meta[name="shopify-theme-name"]');
    if (themeNameMeta) {
      return themeNameMeta.getAttribute('content') || undefined;
    }
    
    // Check for Shopify window objects
    if ((window as any).Shopify?.theme?.name) {
      return (window as any).Shopify.theme.name;
    }
    
    return undefined;
  }

  addMessage(role: 'user' | 'assistant', content: string): void {
    const message: Message = {
      id: `${this.sessionId}-${this.messages.length}`,
      role,
      content,
      timestamp: Date.now(),
    };
    
    this.messages.push(message);
  }

  logEvent(type: SessionEvent['type'], data?: any): void {
    this.events.push({
      type,
      data,
      timestamp: new Date(),
    });
  }

  setShopifyCustomerId(customerId: string): void {
    this.shopifyCustomerId = customerId;
  }

  setUserId(userId: string): void {
    this.userId = userId;
  }

  setUserSatisfaction(rating: number): void {
    if (rating >= 1 && rating <= 5) {
      this.userSatisfaction = rating;
      this.logEvent('user_rating', { rating });
    }
  }

  getShopDomain(): string {
    // Extract shop domain from current URL or use hostname
    const hostname = window.location.hostname;
    
    // If it's a Shopify shop, extract the shop name
    if (hostname.includes('.myshopify.com')) {
      return hostname.split('.myshopify.com')[0];
    }
    
    // For custom domains, use the full hostname
    return hostname;
  }

  generateAnalyticsData(): AnalyticsSubmission {
    const endTime = new Date();
    const durationSeconds = Math.floor((endTime.getTime() - this.startTime.getTime()) / 1000);
    
    return {
      sessionId: this.sessionId,
      shopifyCustomerId: this.shopifyCustomerId,
      shopDomain: this.getShopDomain(),
      userId: this.userId,
      startTime: this.startTime.toISOString(),
      endTime: endTime.toISOString(),
      durationSeconds,
      messageCount: this.messages.length,
      userMessages: this.messages.filter(m => m.role === 'user').length,
      assistantMessages: this.messages.filter(m => m.role === 'assistant').length,
      conversationData: this.messages,
      userSatisfaction: this.userSatisfaction,
      metadata: this.metadata,
      events: this.events,
    };
  }

  async submitAnalytics(): Promise<void> {
    try {
      this.logEvent('connection_ended');
      const analyticsData = this.generateAnalyticsData();
      
      const response = await fetch('/api/analytics/conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(analyticsData),
      });

      if (!response.ok) {
        throw new Error(`Analytics submission failed: ${response.status}`);
      }

      console.log('Analytics submitted successfully');
    } catch (error) {
      console.error('Failed to submit analytics:', error);
      // Store in localStorage as fallback
      this.storeAnalyticsLocally();
    }
  }

  private storeAnalyticsLocally(): void {
    try {
      const analyticsData = this.generateAnalyticsData();
      const stored = localStorage.getItem('voice_agent_analytics') || '[]';
      const analytics = JSON.parse(stored);
      analytics.push(analyticsData);
      
      // Keep only last 50 sessions to avoid storage bloat
      if (analytics.length > 50) {
        analytics.splice(0, analytics.length - 50);
      }
      
      localStorage.setItem('voice_agent_analytics', JSON.stringify(analytics));
    } catch (error) {
      console.error('Failed to store analytics locally:', error);
    }
  }

  // Static method to retry failed analytics from localStorage
  static async retryFailedAnalytics(): Promise<void> {
    try {
      const stored = localStorage.getItem('voice_agent_analytics');
      if (!stored) return;

      const analytics = JSON.parse(stored);
      const successful: AnalyticsSubmission[] = [];

      for (const data of analytics) {
        try {
          const response = await fetch('/api/analytics/conversation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (response.ok) {
            successful.push(data);
          }
        } catch (error) {
          console.error('Failed to retry analytics:', error);
        }
      }

      // Remove successfully submitted analytics
      if (successful.length > 0) {
        const remaining = analytics.filter((a: AnalyticsSubmission) => 
          !successful.some(s => s.sessionId === a.sessionId)
        );
        localStorage.setItem('voice_agent_analytics', JSON.stringify(remaining));
      }
    } catch (error) {
      console.error('Failed to retry failed analytics:', error);
    }
  }
}