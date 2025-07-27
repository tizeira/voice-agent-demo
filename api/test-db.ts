// Endpoint de prueba para diagnosticar conexión Neon
import { neon } from '@neondatabase/serverless';

export default async function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  
  try {
    // 1. Verificar que DATABASE_URL existe
    if (!process.env.DATABASE_URL) {
      return res.status(500).json({ 
        error: 'DATABASE_URL not found',
        env_keys: Object.keys(process.env).filter(k => k.includes('DATA'))
      });
    }

    // 2. Verificar formato de URL
    const dbUrl = process.env.DATABASE_URL;
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