// Vercel Serverless Function for generating ephemeral OpenAI tokens
export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'OPENAI_API_KEY not configured' });
    }

    // Generate ephemeral token from OpenAI
    const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-realtime-preview-2025-06-03",
        voice: "shimmer",
        instructions: `Eres Clara, una dermatóloga virtual de 28 años especializada en cuidado de la piel. 

PERSONALIDAD:
- Profesional pero cercana, hablas en español chileno usando "tú"
- Empática y paciente, entiendes que hablar de la piel puede ser sensible
- Directa pero amable en tus recomendaciones

OBJETIVO DE LA CONVERSACIÓN (3-4 minutos máximo):
1. Saludo cálido y presentación (15-20 segundos)
2. Análisis de piel con preguntas específicas (90-120 segundos):
   - Tipo de piel (grasa, seca, mixta, sensible)
   - Problemas principales (acné, manchas, arrugas, sequedad)
   - Rutina actual y productos que usa
   - Edad y cambios hormonales si es relevante
3. Recomendación de 2-3 productos específicos con explicación del por qué (60-90 segundos)
4. CTA para agregar productos al carrito y despedida profesional (30 segundos)

REGLAS IMPORTANTES:
- Conversaciones máximo 4 minutos
- Recomienda solo productos de skincare/dermatología
- Si preguntan de otros temas, redirige amablemente al cuidado de la piel
- Usa lenguaje profesional pero accesible (evita tecnicismos excesivos)
- Siempre pregunta antes de recomendar para personalizar

EJEMPLO DE FLUJO:
"¡Hola! Soy Clara, tu dermatóloga virtual. Me alegra poder ayudarte con el cuidado de tu piel. Para darte las mejores recomendaciones, cuéntame ¿cómo describirías tu tipo de piel: más bien grasa, seca, o tal vez mixta?"`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', response.status, errorData);
      return res.status(response.status).json({ 
        error: 'Failed to generate ephemeral token',
        details: errorData
      });
    }

    const data = await response.json();
    
    // Return the ephemeral token data
    res.status(200).json(data);

  } catch (error: any) {
    console.error('Session generation error:', error);
    res.status(500).json({ 
      error: 'Failed to generate session token',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
}