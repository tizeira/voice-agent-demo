-- Voice Agent Analytics Database Schema
-- Para ejecutar en Vercel Postgres

-- Tabla principal de analytics de conversaciones
CREATE TABLE IF NOT EXISTS conversation_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR(255) NOT NULL UNIQUE,
  shopify_customer_id VARCHAR(255),
  shop_domain VARCHAR(255) NOT NULL,
  user_id VARCHAR(255),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL
  end_time TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  user_messages INTEGER DEFAULT 0,
  assistant_messages INTEGER DEFAULT 0,
  conversation_data JSONB,
  user_satisfaction INTEGER CHECK (user_satisfaction >= 1 AND user_satisfaction <= 5),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas por mensaje individual
CREATE TABLE IF NOT EXISTS message_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversation_analytics(id) ON DELETE CASCADE,
  message_index INTEGER NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content_length INTEGER,
  response_time_ms INTEGER,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de eventos de sesión
CREATE TABLE IF NOT EXISTS session_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversation_analytics(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
  event_data JSONB,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de métricas agregadas por día (para dashboards rápidos)
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  shop_domain VARCHAR(255) NOT NULL,
  total_conversations INTEGER DEFAULT 0,
  total_messages INTEGER DEFAULT 0,
  avg_duration_seconds DECIMAL(10,2),
  avg_messages_per_conversation DECIMAL(10,2),
  unique_users INTEGER DEFAULT 0,
  satisfaction_avg DECIMAL(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(date, shop_domain)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_session_id ON conversation_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_shop_domain ON conversation_analytics(shop_domain);
CREATE INDEX IF NOT EXISTS idx_created_at ON conversation_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_shopify_customer ON conversation_analytics(shopify_customer_id);
CREATE INDEX IF NOT EXISTS idx_start_time ON conversation_analytics(start_time);

CREATE INDEX IF NOT EXISTS idx_message_conversation ON message_analytics(conversation_id);
CREATE INDEX IF NOT EXISTS idx_message_timestamp ON message_analytics(timestamp);

CREATE INDEX IF NOT EXISTS idx_events_conversation ON session_events(conversation_id);
CREATE INDEX IF NOT EXISTS idx_events_type ON session_events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON session_events(timestamp);

CREATE INDEX IF NOT EXISTS idx_daily_date ON daily_metrics(date);
CREATE INDEX IF NOT EXISTS idx_daily_shop ON daily_metrics(shop_domain);

-- Función para actualizar métricas diarias (trigger)
CREATE OR REPLACE FUNCTION update_daily_metrics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO daily_metrics (date, shop_domain, total_conversations, total_messages, avg_duration_seconds, avg_messages_per_conversation)
  SELECT 
    DATE(NEW.created_at),
    NEW.shop_domain,
    COUNT(*),
    SUM(message_count),
    AVG(duration_seconds),
    AVG(message_count)
  FROM conversation_analytics 
  WHERE DATE(created_at) = DATE(NEW.created_at) 
    AND shop_domain = NEW.shop_domain
  GROUP BY DATE(created_at), shop_domain
  ON CONFLICT (date, shop_domain) 
  DO UPDATE SET
    total_conversations = EXCLUDED.total_conversations,
    total_messages = EXCLUDED.total_messages,
    avg_duration_seconds = EXCLUDED.avg_duration_seconds,
    avg_messages_per_conversation = EXCLUDED.avg_messages_per_conversation;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualización automática de métricas
DROP TRIGGER IF EXISTS trigger_update_daily_metrics ON conversation_analytics;
CREATE TRIGGER trigger_update_daily_metrics
  AFTER INSERT OR UPDATE ON conversation_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_daily_metrics();

-- Comentarios para documentación
COMMENT ON TABLE conversation_analytics IS 'Almacena analytics completos de cada conversación de voz';
COMMENT ON TABLE message_analytics IS 'Métricas detalladas por mensaje individual';
COMMENT ON TABLE session_events IS 'Eventos importantes durante la sesión (conexión, desconexión, errores)';
COMMENT ON TABLE daily_metrics IS 'Métricas agregadas por día para dashboards rápidos';