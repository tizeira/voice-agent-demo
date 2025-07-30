# Voice Agent Analytics Project - CLAUDE.md

## Project Overview
**Clara**: A 3D virtual dermatologist that uses voice conversations to analyze skin, recommend skincare products, and convert sales through intelligent CTAs. Built with OpenAI Realtime API + Ready Player Me avatar + Shopify integration.

**Timeline**: 8 weeks | **Budget**: $9,500 USD | **Goal**: Break-even month 2-3

## Bash Commands
- `npm run dev`: Start Vite development server
- `npm run build`: Build the project (TypeScript + Vite)
- `npm run preview`: Preview production build
- `npm run server`: Start Express server for session tokens
- `npm run server:dev`: Start server in watch mode
- `vercel --prod`: Deploy to production

## Code Style
- Use ES modules (import/export) syntax, not CommonJS (require)
- Destructure imports when possible (e.g., `import { foo } from 'bar'`)
- TypeScript strict mode enabled - always use proper types
- Use `neon()` for database connections, not `.query()` syntax
- Rate limiting implemented - test with health endpoints only
- React Three Fiber for 3D rendering (when implemented)

## Core Architecture

### Voice Agent (`src/main.ts`)
- **Clara**: Spanish-speaking virtual dermatologist (currently text-only, 3D avatar pending)
- Uses OpenAI Realtime API with WebRTC direct connection
- Model: gpt-4o-realtime-preview-2025-06-03 with "shimmer" voice (updated for Clara)
- Real-time bidirectional audio conversation (3-4 min max per session)
- **Status**: ✅ WORKING - Voice conversations functional
- **Pending**: 3D avatar integration, personality system prompt, skincare knowledge base

### 3D Avatar System (NOT YET IMPLEMENTED)
```
src/3d/
├── ClaraAvatar.tsx      # Ready Player Me halfbody model
├── visemes.ts           # Audio chunks → lip-sync mapping
├── animations.ts        # Idle, talking, gesture states
└── SceneSetup.tsx       # React Three Fiber scene
```
- **Target**: Ready Player Me integration with automatic visemes
- **Performance**: <3s load time, 30fps mobile

### Analytics System (`src/analytics.ts`)
- ConversationTracker class for voice interaction capture
- 5-minute session tracking for business intelligence
- Shopify integration ready (customer_id, shop_domain fields)
- Tracks: skin type discussed, products mentioned, conversion events
- **Status**: ✅ DESIGNED - Code complete but not integrated
- **Gap**: Needs WebRTC event integration + Shopify customer detection

### Shopify Integration (NOT YET IMPLEMENTED)
```
src/shopify/
├── customer.ts          # Customer identification via Shopify.customer
├── cart.ts              # Direct add-to-cart from Clara recommendations
├── embed.ts             # Theme.liquid widget injection
└── products.ts          # Skincare catalog integration
```
- **Target**: Embedded app with App Bridge
- **Features**: Auto customer ID, cart manipulation, purchase tracking

### Database (Neon PostgreSQL)
- `conversation_analytics`: Conversation data + skincare analysis results
- `message_analytics`: Individual messages + product mentions
- `session_events`: Connection events + conversion tracking
- `daily_metrics`: Business intelligence aggregation
- **Status**: ✅ CONNECTED - Schema deployed, API routes functional
- **Enhancement Needed**: Skincare-specific fields (skin_type, products_recommended, etc.)

## API Routes
- `/api/session` (GET): Generate ephemeral OpenAI tokens ✅ WORKING
- `/api/analytics/conversation` (POST): Store conversation data ✅ WORKING  
- `/api/analytics/dashboard-simple` (GET): Basic metrics ✅ WORKING
- `/api/analytics/dashboard` (GET): Full dashboard with business insights
- `/api/test-db` (GET): Database connection diagnostic ✅ WORKING
- `/api/shopify/*` (PLANNED): Customer/cart/product endpoints

## Environment Variables
```
OPENAI_API_KEY=sk-proj-...
DATABASE_URL_UNPOOLED=postgresql://...@...neon.tech/...
NODE_ENV=production
SHOPIFY_STORE_DOMAIN=... (pending)
SHOPIFY_API_KEY=... (pending)
READY_PLAYER_ME_APP_ID=... (pending)
```

## Clara Personality & Prompts (TO BE IMPLEMENTED)
```typescript
const CLARA_SYSTEM_PROMPT = `
Eres Clara, una dermatóloga virtual de 28 años, graduada de la Universidad de Chile.
Tu objetivo es analizar el tipo de piel del cliente y recomendar productos específicos.
Mantienes conversaciones de máximo 3-4 minutos siguiendo este flujo:
1. Saludo cálido y profesional (15s)
2. Análisis de piel con preguntas específicas (60-90s)
3. Recomendación de 2-3 productos con explicación (60-90s)
4. CTA para agregar al carrito (30s)
Hablas en español chileno, usando "tú", siendo cercana pero profesional.
`;
```

## Testing Strategy
- **Voice Testing**: Use local development to avoid API costs
- **3D Testing**: Mock Ready Player Me responses during development
- **Analytics**: localStorage fallback for offline development
- **Shopify**: Use development store for integration testing

## Deployment Workflow
1. **Phase 1 - Demo (1 week)**: Basic voice agent + placeholder 3D
2. **Phase 2 - MVP (3 weeks)**: Full 3D avatar + Shopify integration
3. **Phase 3 - Production (4 weeks)**: Analytics dashboard + optimization
4. **Always**: Run `npm run build` before deploying

## Key Files Structure
```
Current:
├── src/main.ts          # Voice UI (needs 3D integration)
├── src/analytics.ts     # Tracker (needs activation)
├── src/types.ts         # TypeScript interfaces
└── api/analytics/*      # Serverless functions

To Add:
├── src/3d/*             # Avatar components
├── src/shopify/*        # E-commerce integration
├── src/clara/*          # Personality & knowledge
└── api/shopify/*        # Shopify endpoints
```

## Performance Targets
- **Voice latency**: <500ms response time
- **3D loading**: <3s initial load
- **Mobile FPS**: 30fps minimum
- **Conversation**: 3-4 minutes average
- **Conversion rate**: >15% (75% improvement)

## Business Intelligence Goals
- Track skin type distribution among customers
- Monitor product recommendation acceptance rate
- Measure conversation-to-purchase conversion
- Identify drop-off points in conversation flow
- A/B test different Clara personalities/approaches

## Current Status & Priority Tasks

### ✅ WORKING:
- Clara voice conversations in Spanish
- Database schema and connections
- Basic analytics API endpoints
- Ephemeral token generation

### 🚧 P0 - DEMO FOR BETINA (1 week):
1. **3D Avatar Placeholder**: Basic Three.js model that moves when talking
2. **Clara Personality**: Implement dermatologist system prompt
3. **Mock Flow**: Complete greeting → analysis → recommendation cycle
4. **Visual Polish**: Professional UI for demo presentation

### 📋 P1 - MVP FEATURES (3 weeks):
1. **Ready Player Me**: Full integration with lip-sync
2. **Shopify Embed**: Working customer identification
3. **Product Catalog**: 5 skincare products with descriptions
4. **Analytics Dashboard**: Real conversion metrics

### 🎯 P2 - SCALE & OPTIMIZE (4 weeks):
1. **Mobile Performance**: GPU optimization for phones
2. **A/B Testing**: Multiple Clara personalities
3. **Advanced Analytics**: ML-based insights
4. **Multi-language**: English support

## Critical Decisions Needed
1. **Shopify Theme**: Which theme to test embedding?
2. **Product Catalog**: Initial 5 products to feature?
3. **Clara's Appearance**: Specific Ready Player Me avatar URL?
4. **Conversation Limits**: Hard cut-off at 4 minutes?

## Recent Changes (Current Session)
- ✅ Voice agent working with Spanish
- ✅ Database fully connected with Neon
- ✅ Analytics endpoints tested
- ⏳ 3D avatar system architecture defined
- ⏳ Shopify integration strategy planned
- ⏳ Clara personality documentation added
