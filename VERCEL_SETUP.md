# 🚀 Vercel Postgres Analytics Setup

## Pasos para implementar en Vercel

### 1. Crear Vercel Postgres Database

1. Ve a tu proyecto en [Vercel Dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto `my-project`
3. Ve a la pestaña **"Storage"**
4. Click **"Create Database"** → **"PostgreSQL"**
5. Configuración:
   - **Database Name:** `voice-agent-analytics`
   - **Region:** `Washington D.C. (iad1)` (más cerca de tu ubicación)
   - **Plan:** Hobby ($20/mes)

### 2. Obtener Variables de Entorno

Después de crear la database, Vercel genera automáticamente estas variables:

```env
POSTGRES_URL="postgres://default:..."
POSTGRES_PRISMA_URL="postgres://default:..."
POSTGRES_URL_NON_POOLING="postgres://default:..."
POSTGRES_USER="default"
POSTGRES_HOST="..."
POSTGRES_PASSWORD="..."
POSTGRES_DATABASE="verceldb"
```

### 3. Ejecutar el Schema SQL

1. En Vercel Dashboard → Storage → tu database
2. Click en **"Data"** tab
3. Click **"Query"** button
4. Copia y pega el contenido completo de `database/schema.sql`
5. Click **"Run Query"**

### 4. Instalar Dependencies

```bash
npm install @vercel/postgres
```

### 5. Estructura de Archivos

Asegúrate de que estos archivos estén en las rutas correctas:

```
my-project/
├── api/
│   └── analytics/
│       ├── conversation.ts    # ✅ Creado
│       └── dashboard.ts       # ✅ Creado
├── src/
│   ├── analytics.ts          # ✅ Creado
│   ├── voiceAgent.ts         # ✅ Actualizado
│   └── types.ts              # ✅ Creado
└── database/
    └── schema.sql            # ✅ Creado
```

### 6. Deploy a Vercel

```bash
# Hacer commit de todos los cambios
git add .
git commit -m "Add analytics system with Vercel Postgres"
git push

# O usar Vercel CLI
vercel --prod
```

### 7. Variables de Entorno en Vercel

Las variables de PostgreSQL se configuran automáticamente, pero agrega tu OpenAI key:

1. Vercel Dashboard → Project → Settings → Environment Variables
2. Agregar:
   ```
   OPENAI_API_KEY=sk-proj-tu-key-aqui
   NODE_ENV=production
   ```

### 8. Verificar Funcionamiento

Después del deploy, prueba:

```bash
# Test analytics endpoint
curl -X GET https://tu-proyecto.vercel.app/api/analytics/dashboard

# Test conversation endpoint
curl -X POST https://tu-proyecto.vercel.app/api/analytics/conversation \
  -H "Content-Type: application/json" \
  -d '{"sessionId":"test","shopDomain":"test.com","startTime":"2024-01-01T00:00:00Z"}'
```

## 🎯 Dashboard de Analytics

Una vez funcionando, puedes conectar herramientas de BI:

### Opciones recomendadas:
1. **Retool** - Conecta directo a Postgres
2. **Grafana** - Dashboard opensource
3. **Vercel Analytics** - Nativo de Vercel

### URLs importantes:
- **Dashboard API:** `/api/analytics/dashboard`
- **Conversation API:** `/api/analytics/conversation`
- **Health Check:** `/api/health`

## 🔧 Troubleshooting

**Error: "Cannot find module '@vercel/postgres'"**
```bash
npm install @vercel/postgres
```

**Error: "relation does not exist"**
- Ejecuta el schema SQL en Vercel Database

**Error: "Environment variable not found"**
- Verifica que las variables de Postgres estén configuradas

## 📊 Métricas Capturadas

✅ **Conversaciones completas** (messages, duración, satisfacción)  
✅ **Métricas por mensaje** (tiempo de respuesta, length)  
✅ **Eventos de sesión** (conexión, errores, interrupciones)  
✅ **Metadata del usuario** (device, browser, location)  
✅ **Integración Shopify** (customer ID, shop domain)  
✅ **Métricas agregadas** (daily summary para dashboards)

¿Listo para empezar? 🚀