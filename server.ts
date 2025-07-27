import express from "express";
import dotenv from "dotenv";
import rateLimit from "express-rate-limit";

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar rate limiting
const sessionRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Máximo 100 requests por IP por ventana de tiempo
  message: {
    error: 'Too many session requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Solo aplicar rate limiting a la ruta de sesión
  skip: (req) => !req.path.includes('/session')
});

// Rate limiting más estricto para el endpoint de sesión
const strictSessionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 10, // Máximo 10 requests por IP por minuto para sesiones
  message: {
    error: 'Too many session creation attempts. Please wait before trying again.',
    retryAfter: '1 minute'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar rate limiting global
app.use(sessionRateLimit);

// Middleware para CORS (permitir requests desde el frontend)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset');
  next();
});

app.use(express.json());

// Endpoint para generar token efímero
app.get("/session", strictSessionRateLimit, async (req, res) => {
  try {
    // Validar que tenemos la API key
    if (!process.env.OPENAI_API_KEY) {
      console.error('OPENAI_API_KEY no está configurada');
      return res.status(500).json({ 
        error: 'Server configuration error',
        details: 'API key not configured'
      });
    }

    console.log('API Key present:', !!process.env.OPENAI_API_KEY);
    console.log('API Key length:', process.env.OPENAI_API_KEY?.length);
    console.log('Session request from IP:', req.ip);
    
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "shimmer", // Puedes cambiar la voz: alloy, echo, fable, onyx, nova, shimmer
      }),
    });

    console.log('OpenAI API response status:', response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('Ephemeral token generated successfully');
    
    // Enviar de vuelta el JSON que recibimos de la API de OpenAI
    res.json(data);
  } catch (error) {
    console.error('Error generating ephemeral token:', error);
    console.error('Request IP:', req.ip);
    console.error('Request headers:', req.headers);
    
    // No exponer detalles internos del error en producción
    const isDevelopment = process.env.NODE_ENV === 'development';
    res.status(500).json({ 
      error: 'Failed to generate ephemeral token',
      details: isDevelopment ? (error as Error).message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
});

// Endpoint de salud con más información
app.get("/health", (req, res) => {
  const healthCheck = {
    status: "OK",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.version,
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      openai_api_key_configured: !!process.env.OPENAI_API_KEY
    }
  };
  
  res.json(healthCheck);
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
  console.log(`📡 Endpoint de sesión: http://localhost:${PORT}/session`);
});