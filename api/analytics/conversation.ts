// Vercel Serverless Function for conversation analytics
import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data: AnalyticsSubmission = req.body;
    
    // Validate required fields
    if (!data.sessionId || !data.shopDomain || !data.startTime) {
      return res.status(400).json({ 
        error: 'Missing required fields: sessionId, shopDomain, startTime' 
      });
    }

    // Connect to Neon database
    if (!process.env.DATABASE_URL) {
    return res.status(500).json({ error: 'DATABASE_URL not configured' });
  }
  
  const sql = neon(process.env.DATABASE_URL);

    // Insert conversation analytics
    const conversationResult = await sql`
      INSERT INTO conversation_analytics (
        session_id, shopify_customer_id, shop_domain, user_id,
        start_time, end_time, duration_seconds, message_count,
        user_messages, assistant_messages, conversation_data,
        user_satisfaction, metadata
      ) VALUES (
        ${data.sessionId},
        ${data.shopifyCustomerId || null},
        ${data.shopDomain},
        ${data.userId || null},
        ${data.startTime},
        ${data.endTime},
        ${data.durationSeconds},
        ${data.messageCount},
        ${data.userMessages},
        ${data.assistantMessages},
        ${JSON.stringify(data.conversationData)},
        ${data.userSatisfaction || null},
        ${JSON.stringify(data.metadata)}
      )
      ON CONFLICT (session_id) 
      DO UPDATE SET
        end_time = EXCLUDED.end_time,
        duration_seconds = EXCLUDED.duration_seconds,
        message_count = EXCLUDED.message_count,
        user_messages = EXCLUDED.user_messages,
        assistant_messages = EXCLUDED.assistant_messages,
        conversation_data = EXCLUDED.conversation_data,
        user_satisfaction = EXCLUDED.user_satisfaction,
        updated_at = NOW()
      RETURNING id;
    `;

    const conversationId = conversationResult[0].id;

    // Insert message analytics
    if (data.conversationData && data.conversationData.length > 0) {
      for (let i = 0; i < data.conversationData.length; i++) {
        const message = data.conversationData[i];
        await sql`
          INSERT INTO message_analytics (
            conversation_id, message_index, role,
            content_length, timestamp, metadata
          ) VALUES (
            ${conversationId},
            ${i},
            ${message.role},
            ${message.content.length},
            to_timestamp(${message.timestamp / 1000}),
            ${JSON.stringify({ message_id: message.id })}
          )
          ON CONFLICT DO NOTHING;
        `;
      }
    }

    // Insert session events
    if (data.events && data.events.length > 0) {
      for (const event of data.events) {
        await sql`
          INSERT INTO session_events (
            conversation_id, event_type, event_data, timestamp
          ) VALUES (
            ${conversationId},
            ${event.type},
            ${JSON.stringify(event.data || {})},
            ${event.timestamp}
          );
        `;
      }
    }

    console.log(`Analytics saved for session: ${data.sessionId}`);
    
    res.status(200).json({ 
      success: true, 
      conversationId,
      message: 'Analytics saved successfully' 
    });

  } catch (error) {
    console.error('Error saving analytics:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
      error: 'Failed to save analytics',
      details: isDevelopment ? (error as Error).message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}