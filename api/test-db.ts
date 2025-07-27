// Endpoint de prueba para diagnosticar conexión Neon
import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // 1. Verificar variables disponibles de Neon
    const dbUrl = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL || process.env.POSTGRES_URL_NON_POOLING;
    
    if (!dbUrl) {
      return res.status(500).json({ 
        error: 'No database URL found',
        available_vars: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('POSTGRES'))
      });
    }

    // 2. Verificar formato de URL
    const urlInfo = {
      starts_with_postgresql: dbUrl.startsWith('postgresql://'),
      has_pooler: dbUrl.includes('-pooler'),
      length: dbUrl.length,
      hostname: dbUrl.match(/@([^/]+)/)?.[1] || 'not_found'
    };

    // 3. Intentar conexión básica
    const sql = neon(dbUrl);
    
    // 4. Query simple para probar conexión
    const testResult = await sql`SELECT NOW() as current_time, version() as pg_version`;
    
    return res.status(200).json({
      success: true,
      database_url_info: urlInfo,
      connection_test: testResult[0],
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    return res.status(500).json({
      success: false,
      error: error.message,
      error_code: error.code,
      error_stack: error.stack?.split('\n').slice(0, 3),
      timestamp: new Date().toISOString()
    });
  }
}