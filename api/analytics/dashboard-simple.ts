// Simplified dashboard for Neon template literals
import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
    
    if (!dbUrl) {
      return res.status(500).json({ error: 'Database URL not configured' });
    }
    
    const sql = neon(dbUrl);

    // Simple summary query
    const summary = await sql`
      SELECT 
        COUNT(*) as total_conversations,
        AVG(duration_seconds) as avg_duration,
        COUNT(DISTINCT shop_domain) as unique_shops
      FROM conversation_analytics
    `;

    // Recent conversations
    const recent = await sql`
      SELECT 
        session_id,
        shop_domain,
        start_time,
        duration_seconds,
        message_count,
        user_satisfaction
      FROM conversation_analytics 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const dashboardData = {
      summary: {
        totalConversations: parseInt(summary[0].total_conversations) || 0,
        avgDuration: Math.round(parseFloat(summary[0].avg_duration) || 0),
        uniqueShops: parseInt(summary[0].unique_shops) || 0,
      },
      recentConversations: recent.map(row => ({
        sessionId: row.session_id,
        shopDomain: row.shop_domain,
        startTime: row.start_time,
        duration: parseInt(row.duration_seconds) || 0,
        messageCount: parseInt(row.message_count) || 0,
        satisfaction: row.user_satisfaction ? parseInt(row.user_satisfaction) : null,
      })),
      timestamp: new Date().toISOString()
    };

    res.status(200).json(dashboardData);

  } catch (error: any) {
    console.error('Dashboard error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}