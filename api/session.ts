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
        voice: "alloy",
        instructions: "You are Clara, a helpful Spanish-speaking voice assistant for an e-commerce store. Respond in Spanish, be friendly and concise. Help customers with their shopping questions and needs.",
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