// Vercel API Route for analytics dashboard data
import { neon } from '@neondatabase/serverless';

interface DashboardQuery {
  shopDomain?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}

export default async function handler(req: any, res: any) {
  // Set CORS headers
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
    const { 
      shopDomain, 
      startDate, 
      endDate, 
      limit = '50' 
    }: DashboardQuery = req.query as any;

    // Connect to Neon database
    const sql = neon(process.env.DATABASE_URL!);

    // Build WHERE conditions
    const conditions = [];
    
    if (shopDomain) {
      conditions.push(`shop_domain = '${shopDomain}'`);
    }
    
    if (startDate) {
      conditions.push(`created_at >= '${startDate}'`);
    }
    
    if (endDate) {
      conditions.push(`created_at <= '${endDate}'`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get summary metrics
    const summaryQuery = `
      SELECT 
        COUNT(*) as total_conversations,
        AVG(duration_seconds) as avg_duration,
        AVG(message_count) as avg_messages_per_conversation,
        AVG(user_satisfaction) as avg_satisfaction,
        COUNT(DISTINCT shopify_customer_id) as unique_customers,
        COUNT(DISTINCT shop_domain) as unique_shops
      FROM conversation_analytics 
      ${whereClause}
    `;

    const summaryResult = await sql(summaryQuery);
    const summary = summaryResult[0];

    // Get recent conversations
    const recentQuery = `
      SELECT 
        session_id,
        shop_domain,
        start_time,
        duration_seconds,
        message_count,
        user_messages,
        assistant_messages,
        user_satisfaction,
        metadata->>'deviceType' as device_type,
        metadata->>'browser' as browser
      FROM conversation_analytics 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ${parseInt(limit as string)}
    `;

    const recentResult = await sql(recentQuery);

    // Get daily metrics for chart
    const dailyQuery = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as conversations,
        AVG(duration_seconds) as avg_duration,
        SUM(message_count) as total_messages
      FROM conversation_analytics 
      ${whereClause}
      GROUP BY DATE(created_at)
      ORDER BY DATE(created_at) DESC 
      LIMIT 30
    `;

    const dailyResult = await sql(dailyQuery);

    // Get top shop domains
    const shopsQuery = `
      SELECT 
        shop_domain,
        COUNT(*) as conversation_count,
        AVG(duration_seconds) as avg_duration,
        AVG(user_satisfaction) as avg_satisfaction
      FROM conversation_analytics 
      ${whereClause}
      GROUP BY shop_domain
      ORDER BY conversation_count DESC 
      LIMIT 10
    `;

    const shopsResult = await sql(shopsQuery);

    // Get device type breakdown
    const deviceQuery = `
      SELECT 
        metadata->>'deviceType' as device_type,
        COUNT(*) as count,
        AVG(duration_seconds) as avg_duration
      FROM conversation_analytics 
      ${whereClause}
      GROUP BY metadata->>'deviceType'
      ORDER BY count DESC
    `;

    const deviceResult = await sql(deviceQuery);

    // Get satisfaction distribution
    const satisfactionQuery = `
      SELECT 
        user_satisfaction,
        COUNT(*) as count
      FROM conversation_analytics 
      ${whereClause}
      AND user_satisfaction IS NOT NULL
      GROUP BY user_satisfaction
      ORDER BY user_satisfaction
    `;

    const satisfactionResult = await sql(satisfactionQuery);

    const dashboardData = {
      summary: {
        totalConversations: parseInt(summary.total_conversations),
        avgDuration: Math.round(parseFloat(summary.avg_duration) || 0),
        avgMessagesPerConversation: Math.round(parseFloat(summary.avg_messages_per_conversation) || 0),
        avgSatisfaction: parseFloat(summary.avg_satisfaction) || null,
        uniqueCustomers: parseInt(summary.unique_customers),
        uniqueShops: parseInt(summary.unique_shops),
      },
      recentConversations: recentResult.map(row => ({
        sessionId: row.session_id,
        shopDomain: row.shop_domain,
        startTime: row.start_time,
        duration: parseInt(row.duration_seconds),
        messageCount: parseInt(row.message_count),
        userMessages: parseInt(row.user_messages),
        assistantMessages: parseInt(row.assistant_messages),
        satisfaction: row.user_satisfaction ? parseInt(row.user_satisfaction) : null,
        deviceType: row.device_type,
        browser: row.browser,
      })),
      dailyMetrics: dailyResult.map(row => ({
        date: row.date,
        conversations: parseInt(row.conversations),
        avgDuration: Math.round(parseFloat(row.avg_duration)),
        totalMessages: parseInt(row.total_messages),
      })),
      topShops: shopsResult.map(row => ({
        shopDomain: row.shop_domain,
        conversationCount: parseInt(row.conversation_count),
        avgDuration: Math.round(parseFloat(row.avg_duration)),
        avgSatisfaction: parseFloat(row.avg_satisfaction) || null,
      })),
      deviceBreakdown: deviceResult.map(row => ({
        deviceType: row.device_type,
        count: parseInt(row.count),
        avgDuration: Math.round(parseFloat(row.avg_duration)),
      })),
      satisfactionDistribution: satisfactionResult.map(row => ({
        rating: parseInt(row.user_satisfaction),
        count: parseInt(row.count),
      })),
      metadata: {
        generatedAt: new Date().toISOString(),
        filters: { shopDomain, startDate, endDate, limit },
      },
    };

    res.status(200).json(dashboardData);

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    res.status(500).json({ 
      error: 'Failed to fetch dashboard data',
      details: isDevelopment ? (error as Error).message : 'Internal server error',
      timestamp: new Date().toISOString()
    });
  }
}